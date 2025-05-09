import { eq } from "drizzle-orm";
import express, { type Express, NextFunction, Request, Response, Router } from "express";
import fs from "fs";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { hashPassword, setupAuth } from "./auth";
import config, { checkRequiredApiKey } from "./config";
import { checkDatabaseConnection, db } from "./db";
import { storage } from "./storage"; // Assuming export is correct despite linter error
// Import AI services
import aiService, { AIProvider } from "./services/ai-service"; // Removed AgentConfig, AIMessage, AgentResponse
import { AIMessage, AgentResponse } from "./services/openai-service"; // Import AIMessage, AgentResponse from openai-service
// Import the processAgentTask function
import {
  Agent, // Added Agent type
  AgentTool, // Added AgentTool type
  AiProvider as AiProviderSchema, // Added AiProvider type
  Credential, // Added Credential type
  Message, // Added Message type
  Task, // Added Task type
  User, // Added User type
  agentTools,
  insertAgentSchema,
  insertAgentToolSchema,
  insertAiModelSchema,
  insertCredentialSchema,
  insertFileSchema,
  insertMessageSchema,
  insertTaskSchema,
  insertConversationSchema,
} from "@shared/schema";
import { decrypt, encrypt } from "../shared/crypto";
import { processAgentTask } from "./agent-task-processor";
import {
  awardPoints,
  completeChallenge,
  generateResponse,
  getAvailableChallenges,
  getChatHistory,
  getOrCreateGameProgress,
  getOrCreateSessionId,
  storeChatMessage,
  updateStreak
} from "./services/chatbot-service";
import * as documentTemplateService from "./services/document-template-service"; // Import the new service
import { credentialService, SERVICE_TYPES } from "./services/credential-service";
import { gmailService } from "./services/gmail-service";
import { paymentService } from "./services/payment-service";

// Define AgentConfig locally as it's not exported from ai-service
interface AgentConfig {
  provider: AIProvider;
  model?: string;
  systemInstructions?: string;
  tools?: AgentTool[];
}


// Configure multer for file uploads
const storage_engine = multer.diskStorage({
  destination: (req: Request, file, cb) => { // Added type
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file, cb) => { // Added type
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage_engine,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req: Request, file, cb) => { // Added type
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, gif, svg) are allowed!"));
  }
});

// Helper function to handle errors consistently
const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error occurred";
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint - no auth required, useful for deployment monitoring
  app.get("/api/health", async (req: Request, res: Response) => { // Added types
    try {
      const dbStatus = await checkDatabaseConnection();
      if (!dbStatus) {
        return res.status(500).json({
          status: "error",
          database: "disconnected",
          message: "Database connection failed",
        });
      }

      return res.status(200).json({
        status: "ok",
        database: "connected",
        server: "running",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Health check error:", error);
      return res.status(500).json({
        status: "error",
        message: "Health check failed",
        details: handleError(error),
      });
    }
  });

  // Get site settings (public access)
  app.get("/api/site-settings", async (req: Request, res: Response) => { // Added types
    try {
      // Get settings or create default if none exist
      let settings = await storage.getSiteSettings();

      // If no settings found, create default settings
      if (!settings) {
        console.log("No site settings found, creating default settings");
        settings = await storage.createDefaultSiteSettings();
      }

      // Create a sanitized version without sensitive fields like updatedBy
      const { updatedBy, ...publicSettings } = settings;
      res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Set up authentication routes
  setupAuth(app);

  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  };

  // Admin middleware
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    next();
  };

  // Simple endpoint to check if user has admin access - for testing
  app.get("/api/admin/check", requireAdmin, (req: Request, res: Response) => {
    // We can safely assume user exists because requireAdmin middleware checks it
    const user = req.user!;
    res.json({
      success: true,
      message: "You have admin access",
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });

  // Upload logo endpoint - requires admin permissions
  app.post("/api/admin/upload-logo", requireAdmin, upload.single('logo'), async (req: Request, res: Response) => { // Added types
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Generate the public URL for the file
      const fileUrl = `/uploads/${req.file.filename}`;

      // Update site settings with the new logo URL
      const existingSettings = await storage.getSiteSettings();

      if (existingSettings) {
        // Only update the logo URL, keep other settings the same
        await storage.updateSiteSettings({
          logo: {
            ...((existingSettings.logo && typeof existingSettings.logo === 'object') ? existingSettings.logo : {}),
            url: fileUrl
          }
        });
      }

      // Return the file URL to the client
      res.status(200).json({
        success: true,
        url: fileUrl,
        message: "Logo uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({
        error: handleError(error), // Use handleError
      });
    }
  });

  // Dashboard preferences routes
  import("./services/dashboard-service").then((dashboardService) => {
    // Get user dashboard preferences
    app.get("/api/user/dashboard/preferences", requireAuth, async (req: Request, res: Response) => { // Added types
      try {
        // Middleware ensures req.user exists, but TS needs explicit check
        if (!req.user) {
          return res.status(401).send({ error: "Not authenticated" });
        }
        let preferences = await dashboardService.getDashboardPreferences(req.user.id);

        if (!preferences) {
          preferences = await dashboardService.createDefaultDashboardPreferences(req.user.id);
        }

        res.json(preferences);
      } catch (error) {
        console.error("Error fetching dashboard preferences:", error);
        res.status(500).send({ error: handleError(error) }); // Use handleError
      }
    });

    // Update user dashboard preferences
    app.patch("/api/user/dashboard/preferences", requireAuth, async (req: Request, res: Response) => { // Added types
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).send({ error: "Not authenticated" });
      }

      try {
        const updates = req.body;
        const updated = await dashboardService.updateDashboardPreferences(req.user.id, updates);
        res.json(updated);
      } catch (error) {
        console.error("Error updating dashboard preferences:", error);
        res.status(500).send({ error: handleError(error) }); // Use handleError
      }
    });
  });

  // API routes
  // Get user profile
  app.get("/api/profile", requireAuth, (req: Request, res: Response) => {
    // Middleware ensures req.user exists, but TS needs explicit check
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    // Explicitly copy properties instead of spreading potentially non-object type
    const userWithoutPassword = {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      fullName: req.user.fullName,
      planId: req.user.planId,
      planExpiresAt: req.user.planExpiresAt,
      role: req.user.role,
      isActive: req.user.isActive,
    };
    res.json(userWithoutPassword);
  });

  // Update user profile
  app.patch("/api/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const updates: Record<string, any> = {};

      // Allow updates to specific fields
      if (req.body.fullName) updates.fullName = req.body.fullName;
      if (req.body.email) updates.email = req.body.email;

      // If password is being updated, hash it
      if (req.body.password) {
        updates.password = await hashPassword(req.body.password);
      }

      const updatedUser = await storage.updateUser(req.user.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Agent routes
  app.get("/api/agents", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const agents = await storage.getAgentsByUserId(req.user.id);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Get agent templates for creating new agents
  app.get("/api/agent-templates", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const templates = await storage.getAgentTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({
        error: handleError(error) // Use handleError
      });
    }
  });

  // Agent status endpoint for dashboard - must come before the :id route
  app.get("/api/agents/status", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const agents = await storage.getAgentsByUserId(req.user.id);

      // Count agents by status
      const agentCounts = {
        total: agents.length,
        active: agents.filter((agent: Agent) => agent.isActive === true).length, // Added type
        inactive: agents.filter((agent: Agent) => agent.isActive === false || agent.isActive === undefined).length // Added type
      };

      res.json(agentCounts);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.get("/api/agents/:id", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const agent = await storage.getAgent(parseInt(req.params.id));

      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Check ownership
      if (agent.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.post("/api/agents", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      // Validate request body
      const validatedData = insertAgentSchema.safeParse({
        ...req.body,
        userId: req.user.id,
      });

      if (!validatedData.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validatedData.error.format(),
        });
      }

      const agent = await storage.createAgent(validatedData.data);
      res.status(201).json(agent);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.patch("/api/agents/:id", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const agentId = parseInt(req.params.id);
      const agent = await storage.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Check ownership
      if (agent.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Define allowed update fields to avoid spreading potentially unsafe req.body
      const allowedUpdates = ['name', 'description', 'systemPrompt', 'config', 'isActive', 'icon', 'isPublic'];
      const updates: Record<string, any> = {};
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      // Update agent
      const updatedAgent = await storage.updateAgent(agentId, updates); // Use the filtered 'updates' object
      res.json(updatedAgent);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.delete("/api/agents/:id", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const agentId = parseInt(req.params.id);
      const agent = await storage.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Check ownership
      if (agent.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Delete agent
      await storage.deleteAgent(agentId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Credential routes
  app.get("/api/credentials", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const credentials = await storage.getCredentialsByUserId(req.user.id);
      // Don't include sensitive data in the response
      const sanitizedCredentials = credentials.map((cred: Credential) => { // Added type
        const { data, ...rest } = cred;
        return rest;
      });
      res.json(sanitizedCredentials);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Get credentials by type (service)
  app.get("/api/credentials/service/:type", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const serviceType = req.params.type;

      // Ensure valid service type
      if (!Object.values(SERVICE_TYPES).includes(serviceType)) {
        return res.status(400).json({ error: "Invalid service type" });
      }

      const credentials = await credentialService.listCredentials(req.user.id, serviceType);
      res.json(credentials);
    } catch (error) {
      console.error(`Error fetching ${req.params.type} credentials:`, error);
      res.status(500).json({ error: `Failed to fetch ${req.params.type} credentials` });
    }
  });

  // Get expiring credentials
  app.get("/api/credentials/expiring", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const daysThreshold = req.query.days
        ? parseInt(req.query.days.toString())
        : 7;

      const expiringCredentials = await credentialService.getExpiringCredentials(
        req.user.id,
        daysThreshold
      );

      res.json(expiringCredentials);
    } catch (error) {
      console.error("Error fetching expiring credentials:", error);
      res.status(500).json({ error: "Failed to fetch expiring credentials" });
    }
  });

  app.get("/api/credentials/:id", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const credential = await storage.getCredential(parseInt(req.params.id));

      if (!credential) {
        return res.status(404).json({ error: "Credential not found" });
      }

      // Check ownership
      if (credential.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      try {
        // Decrypt the credential data with enhanced error handling
        const decryptedData = decrypt(credential.data);

        // Parse the JSON data, handle potential parsing errors
        let parsedData;
        try {
          parsedData = JSON.parse(decryptedData);
        } catch (parseError) {
          console.error("Error parsing credential data:", parseError);
          return res.status(500).json({
            error: "Credential data is corrupted or invalid"
          });
        }

        // Return credential with decrypted data
        res.json({
          ...credential,
          data: parsedData,
        });
      } catch (decryptError) {
        console.error("Error decrypting credential:", decryptError);
        return res.status(500).json({
          error: "Failed to decrypt credential data"
        });
      }
    } catch (error) {
      console.error("Error retrieving credential:", error);
      res.status(500).json({ error: "Failed to retrieve credential" });
    }
  });

  app.post("/api/credentials", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      // Validate request structure
      if (!req.body.data || !req.body.name || !req.body.type) {
        return res.status(400).json({
          error: "Validation failed",
          details: "Missing required fields (name, type, and data)",
        });
      }

      try {
        // Encrypt the credential data with enhanced security
        const encryptedData = encrypt(JSON.stringify(req.body.data));

        // Validate and create credential
        const validatedData = insertCredentialSchema.safeParse({
          userId: req.user.id,
          name: req.body.name,
          type: req.body.type,
          data: encryptedData,
        });

        if (!validatedData.success) {
          return res.status(400).json({
            error: "Validation failed",
            details: validatedData.error.format(),
          });
        }

        const credential = await storage.createCredential(validatedData.data);

        // Log the creation for audit
        await storage.createUserActivity({
          userId: req.user.id,
          activityType: "credential_created",
          resourceId: credential.id,
          resourceType: "credential",
          metadata: { name: credential.name, type: credential.type },
        });

        // Don't include sensitive data in the response
        const { data, ...credentialWithoutData } = credential;
        res.status(201).json(credentialWithoutData);
      } catch (encryptError) {
        console.error("Error encrypting credential data:", encryptError);
        return res.status(500).json({
          error: "Failed to secure credential data"
        });
      }
    } catch (error) {
      console.error("Error creating credential:", error);
      res.status(500).json({ error: "Failed to create credential" });
    }
  });

  app.patch("/api/credentials/:id", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const credentialId = parseInt(req.params.id);
      const credential = await storage.getCredential(credentialId);

      if (!credential) {
        return res.status(404).json({ error: "Credential not found" });
      }

      // Check ownership
      if (credential.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      try {
        // Update credential
        const updates: any = {};
        if (req.body.name) updates.name = req.body.name;
        if (req.body.type) updates.type = req.body.type;

        if (req.body.data) {
          // Encrypt the updated data
          updates.data = encrypt(JSON.stringify(req.body.data));
        }

        const updatedCredential = await storage.updateCredential(
          credentialId,
          updates,
        );

        // Check if update was successful before proceeding
        if (!updatedCredential) {
          // This case might indicate the credential was deleted concurrently
          return res.status(404).json({ error: "Credential not found after update attempt" });
        }

        // Log the update for audit
        await storage.createUserActivity({
          userId: req.user.id,
          activityType: "credential_updated",
          resourceId: credentialId,
          resourceType: "credential",
          metadata: { name: updatedCredential.name, type: updatedCredential.type },
        });

        // Don't include sensitive data in the response
        const { data, ...credentialWithoutData } = updatedCredential;
        res.json(credentialWithoutData);
      } catch (encryptError) {
        console.error("Error encrypting credential data:", encryptError);
        return res.status(500).json({
          error: "Failed to secure credential data"
        });
      }
    } catch (error) {
      console.error("Error updating credential:", error);
      res.status(500).json({ error: "Failed to update credential" });
    }
  });

  app.delete("/api/credentials/:id", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const credentialId = parseInt(req.params.id);
      const credential = await storage.getCredential(credentialId);

      if (!credential) {
        return res.status(404).json({ error: "Credential not found" });
      }

      // Check ownership
      if (credential.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Delete credential
      await storage.deleteCredential(credentialId);

      // Log the deletion for audit
      await storage.createUserActivity({
        userId: req.user.id,
        activityType: "credential_deleted",
        resourceId: credentialId,
        resourceType: "credential",
        metadata: { name: credential.name, type: credential.type },
      });

      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting credential:", error);
      res.status(500).json({ error: "Failed to delete credential" });
    }
  });

  // Gmail service-specific routes
  app.post("/api/services/gmail/credentials", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { name, email, app_password, access_token, refresh_token, expiresInDays } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Credential name is required" });
      }

      // Validate that we have at least one auth method
      if (!app_password && !(access_token && refresh_token)) {
        return res.status(400).json({
          error: "Either app_password or both access_token and refresh_token are required"
        });
      }

      const data = {
        email: email || "",
        app_password: app_password || undefined,
        access_token: access_token || undefined,
        refresh_token: refresh_token || undefined,
        expires_at: access_token ? Date.now() + 3600 * 1000 : undefined // Default to 1 hour for OAuth tokens
      };

      const credential = await gmailService.saveGmailCredentials(
        req.user.id,
        name,
        data,
        expiresInDays || 90
      );

      // Log the creation
      await storage.createUserActivity({
        userId: req.user.id,
        activityType: "gmail_credential_created",
        resourceId: credential.id,
        resourceType: "credential",
        metadata: {
          name: credential.name,
          email: email
        },
      });

      // Don't return sensitive data
      const { data: _, ...credentialWithoutData } = credential;
      res.status(201).json(credentialWithoutData);
    } catch (error) {
      console.error("Error creating Gmail credentials:", error);
      res.status(500).json({ error: "Failed to create Gmail credentials" });
    }
  });

  app.get("/api/services/gmail/credentials", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const credentials = await gmailService.listGmailCredentials(req.user.id);
      res.json(credentials);
    } catch (error) {
      console.error("Error listing Gmail credentials:", error);
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.post("/api/services/gmail/send-email", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { credentialId, to, subject, body, attachments } = req.body;

      if (!credentialId || !to || !subject || !body) {
        return res.status(400).json({
          error: "Missing required fields: credentialId, to, subject, body"
        });
      }

      // Convert credentialId to number if it's a string
      const credentialIdNum = typeof credentialId === 'string'
        ? parseInt(credentialId)
        : credentialId;

      // Validate ownership of credential
      const cred = await storage.getCredential(credentialIdNum);
      if (!cred || cred.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to use this credential" });
      }

      // Send email
      const result = await gmailService.sendEmail(
        req.user.id,
        credentialIdNum,
        {
          to,
          subject,
          body,
          attachments: attachments || []
        }
      );

      // Log the email sending
      await storage.createUserActivity({
        userId: req.user.id,
        activityType: "email_sent",
        resourceId: credentialIdNum,
        resourceType: "credential",
        metadata: {
          subject,
          to: typeof to === 'string' ? to : to.join(',')
        },
      });

      res.json(result);
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.get("/api/services/gmail/messages", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { credentialId, maxResults, includeAttachments, labelIds, query } = req.query;

      if (!credentialId) {
        return res.status(400).json({ error: "credentialId is required" });
      }

      // Convert credentialId to number
      const credentialIdNum = parseInt(credentialId as string);

      // Validate ownership of credential
      const cred = await storage.getCredential(credentialIdNum);
      if (!cred || cred.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to use this credential" });
      }

      // Parse options
      const options: any = {};

      if (maxResults) {
        options.maxResults = parseInt(maxResults as string);
      }

      if (includeAttachments) {
        options.includeAttachments = includeAttachments === 'true';
      }

      if (labelIds) {
        options.labelIds = typeof labelIds === 'string'
          ? [labelIds]
          : Array.isArray(labelIds) ? labelIds : undefined;
      }

      if (query) {
        options.query = query as string;
      }

      // Get messages
      const messages = await gmailService.getMessages(
        req.user.id,
        credentialIdNum,
        options
      );

      res.json(messages);
    } catch (error) {
      console.error("Error fetching Gmail messages:", error);
      res.status(500).json({ error: "Failed to fetch Gmail messages" });
    }
  });

  // Endpoint to refresh OAuth tokens
  app.post("/api/services/gmail/refresh-token", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { credentialId } = req.body;

      if (!credentialId) {
        return res.status(400).json({ error: "credentialId is required" });
      }

      // Convert credentialId to number if it's a string
      const credentialIdNum = typeof credentialId === 'string'
        ? parseInt(credentialId)
        : credentialId;

      // Validate ownership of credential
      const cred = await storage.getCredential(credentialIdNum);
      if (!cred || cred.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to use this credential" });
      }

      // Refresh token
      const success = await gmailService.refreshOAuthToken(req.user.id, credentialIdNum);

      if (success) {
        res.json({ success: true, message: "Token refreshed successfully" });
      } else {
        res.status(400).json({ success: false, error: "Failed to refresh token" });
      }
    } catch (error) {
      console.error("Error refreshing Gmail OAuth token:", error);
      res.status(500).json({ error: "Failed to refresh OAuth token" });
    }
  });

  // File/Template routes
  app.get("/api/files", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const files = await storage.getFilesByUserId(req.user.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Recent files endpoint for dashboard
  app.get("/api/files/recent", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 5;
      const files = await storage.getFilesByUserId(req.user.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.get("/api/templates", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const templates = await storage.getTemplatesByUserId(req.user.id);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.get("/api/files/:id", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const file = await storage.getFile(parseInt(req.params.id));

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Check ownership
      if (file.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      res.json(file);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Note: File upload would typically be handled with multipart/form-data and a library like multer
  // For simplicity in this prototype, we're just storing file metadata
  app.post("/api/files", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      // Validate and create file record
      const validatedData = insertFileSchema.safeParse({
        ...req.body,
        userId: req.user.id,
      });

      if (!validatedData.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validatedData.error.format(),
        });
      }

      const file = await storage.createFile(validatedData.data);
      res.status(201).json(file);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.delete("/api/files/:id", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Check ownership
      if (file.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Delete file
      await storage.deleteFile(fileId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Task routes
  app.get("/api/tasks", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const tasks = await storage.getTasksByUserId(req.user.id, limit);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // API endpoint to register AI agent tools
  app.post("/api/admin/register-tools", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const tools = [
        {
          name: "OpenAI Chat",
          description: "Connect with OpenAI's GPT models for natural language tasks",
          category: "ai",
          type: "ai", // Added type
          icon: "sparkles",
          isActive: true,
          isSystem: true,
          config: {
            provider: "openai",
            models: ["gpt-4o", "gpt-4-turbo", "gpt-4o-mini"],
            capabilities: ["text generation", "instruction following", "creative writing", "summarization", "code generation"]
          }
        },
        {
          name: "Anthropic Claude",
          description: "Use Anthropic's Claude models for nuanced and safe outputs",
          category: "ai",
          type: "ai", // Added type
          icon: "brain",
          isActive: true,
          isSystem: true,
          config: {
            provider: "anthropic",
            models: ["claude-3-7-sonnet-20250219", "claude-3-5-sonnet", "claude-3-haiku"],
            capabilities: ["text generation", "instruction following", "creative writing", "document analysis", "nuanced reasoning"]
          }
        },
        {
          name: "Perplexity AI",
          description: "Leverage Perplexity for real-time research and information gathering",
          category: "research",
          type: "research", // Added type
          icon: "search",
          isActive: true,
          isSystem: true,
          config: {
            provider: "perplexity",
            models: ["llama-3.1-sonar-small-128k-online", "llama-3.1-sonar-large-128k-online"],
            capabilities: ["online search", "fact verification", "current information", "research synthesis", "citation"]
          }
        },
        {
          name: "Grok by xAI",
          description: "Utilize Grok for analytical and technical tasks",
          category: "ai",
          type: "ai", // Added type
          icon: "zap",
          isActive: true,
          isSystem: true,
          config: {
            provider: "xai",
            models: ["grok-2-1212", "grok-2-vision-1212"],
            capabilities: ["analytical reasoning", "technical explanations", "real-time data analysis", "image understanding"]
          }
        },
        {
          name: "Code Generator",
          description: "Generate code in various programming languages",
          category: "code",
          type: "code", // Added type
          icon: "code",
          isActive: true,
          isSystem: true, // Added isSystem flag
          config: {
            provider: "openai",
            models: ["gpt-4o"],
            capabilities: ["code generation", "debugging", "optimization", "documentation"]
          }
        },
        {
          name: "Data Analyzer",
          description: "Analyze datasets and provide insights",
          category: "data",
          type: "data", // Added type
          icon: "barChart",
          isActive: true,
          isSystem: true,
          config: {
            provider: "openai",
            supportedProviders: ["openai", "xai", "perplexity"],
            models: ["gpt-4o", "grok-2-1212"],
            capabilities: ["data analysis", "visualization recommendations", "statistical inference", "trend identification"]
          }
        },
        {
          name: "Content Optimizer",
          description: "Improve and optimize existing content",
          category: "content",
          type: "content", // Added type
          icon: "fileText",
          isActive: true,
          isSystem: true,
          config: {
            provider: "openai",
            supportedProviders: ["openai", "anthropic"],
            models: ["gpt-4o", "claude-3-7-sonnet-20250219"],
            capabilities: ["content improvement", "tone adjustment", "SEO optimization", "readability enhancement"]
          }
        }
      ];

      const existingTools = await db.select().from(agentTools);
      const existingToolNames = existingTools.map(tool => tool.name);

      let added = 0;
      let updated = 0;

      // Add or update each tool
      for (const tool of tools) {
        // Ensure 'type' exists before processing
        if (!tool.type) {
          console.warn(`Tool '${tool.name}' is missing 'type'. Skipping or setting default.`);
          continue; // Skip this tool or assign a default type
        }

        if (!existingToolNames.includes(tool.name)) {
          // Add required fields for database schema
          const newTool = {
            ...tool,
            isSystem: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await db.insert(agentTools).values(newTool);
          added++;
        } else {
          const existingTool = existingTools.find(t => t.name === tool.name);
          if (existingTool) {
            // Ensure 'type' is included in the update set
            const updateSet: Partial<typeof agentTools.$inferSelect> = {
              description: tool.description,
              category: tool.category,
              icon: tool.icon,
              isActive: tool.isActive,
              isSystem: true,
              config: tool.config,
              updatedAt: new Date(),
              type: tool.type // Ensure type is present
            };
            await db
              .update(agentTools)
              .set(updateSet)
              .where(eq(agentTools.id, existingTool.id));
            updated++;
          }
        }
      }

      res.json({
        success: true,
        message: `Successfully registered tools: ${added} added, ${updated} updated`
      });
    } catch (error) {
      console.error("Error registering tools:", error);
      res.status(500).json({ error: "Failed to register tools" });
    }
  });

  app.get("/api/agents/:agentId/tasks", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const agentId = parseInt(req.params.agentId);
      const agent = await storage.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Check ownership
      if (agent.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const tasks = await storage.getTasksByAgentId(agentId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.get("/api/tasks/:id", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const task = await storage.getTask(parseInt(req.params.id));

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check ownership
      if (task.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.post("/api/tasks", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      // Validate agent ownership
      const agent = await storage.getAgent(req.body.agentId);
      if (!agent || agent.userId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Not authorized to use this agent" });
      }

      // Validate and create task
      const validatedData = insertTaskSchema.safeParse({
        ...req.body,
        userId: req.user.id,
      });

      if (!validatedData.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validatedData.error.format(),
        });
      }

      const task = await storage.createTask(validatedData.data);

      // Log task creation activity (Pass single object argument)
      await storage.createUserActivity({
        userId: req.user.id,
        activityType: "task_created",
        resourceId: task.id,
        resourceType: "task",
        metadata: { agentId: task.agentId, status: task.status },
      });

      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check ownership
      if (task.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Update task
      const updatedTask = await storage.updateTask(taskId, req.body);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Message routes
  app.get("/api/tasks/:taskId/messages", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check ownership
      if (task.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const messages = await storage.getMessagesByTaskId(taskId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.post("/api/tasks/:taskId/messages", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check ownership - req.user is guaranteed here by the initial check
      if (task.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Validate and create message
      const validatedData = insertMessageSchema.safeParse({
        ...req.body,
        taskId,
      });

      if (!validatedData.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validatedData.error.format(),
        });
      }

      const message = await storage.createMessage(validatedData.data);

      // If the message is from the user, process it with the AI agent
      if (validatedData.data.role === 'user') {
        // Update task status to pending if it was completed or failed
        if (task.status === 'completed' || task.status === 'failed') {
          await storage.updateTask(taskId, { status: "pending" });
        }

        // Process the task in the background
        setTimeout(async () => {
          try {
            await processAgentTask(taskId, storage);
          } catch (error) {
            console.error('Error processing agent task:', handleError(error)); // Use handleError
            // Update task status to failed if there was an error
            await storage.updateTask(taskId, {
              status: "failed",
              result: JSON.stringify({ error: handleError(error) }) // Use handleError
            });
          }
        }, 0);

        res.status(201).json({
          message,
          taskStatus: "pending",
          processing: true
        });
      } else {
        res.status(201).json(message);
      }
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Endpoint to explicitly execute a task with an agent
  app.post("/api/tasks/:taskId/execute", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check ownership - req.user is guaranteed here
      if (task.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Update task status to pending
      await storage.updateTask(taskId, { status: "pending" });

      // Process in the background
      setTimeout(async () => {
        try {
          await processAgentTask(taskId, storage);
        } catch (error) {
          console.error('Error executing agent task:', handleError(error)); // Use handleError
          await storage.updateTask(taskId, {
            status: "failed",
            result: JSON.stringify({ error: handleError(error) }) // Use handleError
          });
        }
      }, 0);

      res.json({
        message: "Task execution initiated",
        task: {
          id: task.id,
          status: "pending"
        }
      });
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Task-File relationship routes
  app.get("/api/tasks/:taskId/files", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check ownership
      if (task.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const files = await storage.getFilesByTaskId(taskId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Link a file to a task
  app.post(
    "/api/tasks/:taskId/files/:fileId",
    requireAuth,
    async (req: Request, res: Response) => { // Added types
      try {
        // Middleware ensures req.user exists, but TS needs explicit check
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const taskId = parseInt(req.params.taskId);
        const fileId = parseInt(req.params.fileId);

        // Verify task exists and user owns it
        const task = await storage.getTask(taskId);
        if (!task) {
          return res.status(404).json({ error: "Task not found" });
        }

        if (task.userId !== req.user.id) {
          return res
            .status(403)
            .json({ error: "Not authorized to access this task" });
        }

        // Verify file exists and user owns it
        const file = await storage.getFile(fileId);
        if (!file) {
          return res.status(404).json({ error: "File not found" });
        }

        if (file.userId !== req.user.id) {
          return res
            .status(403)
            .json({ error: "Not authorized to access this file" });
        }

        // Link file to task
        const taskFile = await storage.linkFileToTask(taskId, fileId);
        res.status(201).json({ success: true, taskFile });
      } catch (error) {
        res.status(500).json({ error: handleError(error) }); // Use handleError
      }
    },
  );

  // Unlink a file from a task
  app.delete(
    "/api/tasks/:taskId/files/:fileId",
    requireAuth,
    async (req: Request, res: Response) => { // Added types
      try {
        // Middleware ensures req.user exists, but TS needs explicit check
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const taskId = parseInt(req.params.taskId);
        const fileId = parseInt(req.params.fileId);

        // Verify task exists and user owns it
        const task = await storage.getTask(taskId);
        if (!task) {
          return res.status(404).json({ error: "Task not found" });
        }

        if (task.userId !== req.user.id) {
          return res
            .status(403)
            .json({ error: "Not authorized to access this task" });
        }

        // Unlink file from task
        const success = await storage.unlinkFileFromTask(taskId, fileId);

        if (!success) {
          return res.status(404).json({ error: "File not linked to task" });
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: handleError(error) }); // Use handleError
      }
    },
  );

// Conversation routes (for direct agent chat)
  app.get("/api/conversations", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
      const conversations = await storage.getConversationsByUserId(req.user.id, agentId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.post("/api/conversations", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const { agentId, title } = req.body;

      if (!agentId) {
        return res.status(400).json({ error: "Agent ID is required" });
      }

      // Verify agent exists and user can access it (optional, depends on requirements)
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      // Add ownership check if needed: if (agent.userId !== req.user.id && !agent.isPublic) ...

      const validatedData = insertConversationSchema.safeParse({
        userId: req.user.id,
        agentId: agentId,
        title: title || `Conversation with ${agent.name}`,
      });

      if (!validatedData.success) {
        return res.status(400).json({ error: "Validation failed", details: validatedData.error.format() });
      }

      const conversation = await storage.createConversation(validatedData.data);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.get("/api/conversations/:conversationId", requireAuth, async (req: Request, res: Response) => { // Added types
     try {
       if (!req.user) return res.status(401).json({ error: "Not authenticated" });
       const conversationId = parseInt(req.params.conversationId);
       const conversation = await storage.getConversation(conversationId);

       if (!conversation) {
         return res.status(404).json({ error: "Conversation not found" });
       }

       // Check ownership
       if (conversation.userId !== req.user.id) {
         return res.status(403).json({ error: "Not authorized" });
       }

       res.json(conversation);
     } catch (error) {
       console.error("Error fetching conversation:", error);
       res.status(500).json({ error: handleError(error) });
     }
   });

  app.get("/api/conversations/:conversationId/messages", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const conversationId = parseInt(req.params.conversationId);
      const conversation = await storage.getConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Check ownership
      if (conversation.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const messages = await storage.getMessagesByConversationId(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.post("/api/conversations/:conversationId/messages", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const conversationId = parseInt(req.params.conversationId);
      const conversation = await storage.getConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Check ownership
      if (conversation.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Validate message input
      const validatedData = insertMessageSchema.safeParse({
        ...req.body,
        conversationId: conversationId,
        role: 'user', // Ensure message is from user
      });

      if (!validatedData.success) {
        return res.status(400).json({ error: "Validation failed", details: validatedData.error.format() });
      }

      // Create user message
      const userMessage = await storage.createMessage(validatedData.data);

      // Update conversation's updatedAt timestamp
      await storage.updateConversation(conversationId, { updatedAt: new Date() });

// Asynchronously process agent response
      setTimeout(async () => {
        try {
          const agent = await storage.getAgent(conversation.agentId);
          if (!agent) {
            console.error(`Agent ${conversation.agentId} not found for conversation ${conversationId}`);
            return;
          }

          const conversationHistory = await storage.getMessagesByConversationId(conversationId);

          const messagesForAI: AIMessage[] = []; // Use AIMessage type
          if ((agent.config as any)?.systemPrompt) { // Access via config with type assertion
            messagesForAI.push({ role: "system", content: (agent.config as any).systemPrompt });
          }
          conversationHistory.forEach((msg: Message) => { // Added type
            if ((msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string') {
              messagesForAI.push({ role: msg.role, content: msg.content });
            }
          });

          // Construct a dummy Task object for processTask
          const dummyTask: Task = {
            id: 0, // Dummy ID
            title: `Conversation ${conversationId}`,
            description: userMessage.content, // Use user message content as description
            status: "in_progress",
            userId: req.user!.id, // User ID is guaranteed by requireAuth
            agentId: agent.id,
            createdAt: new Date(),
            completedAt: null,
            result: null
          };

          // Determine provider and model
          const provider = (agent.config as any)?.provider as AIProvider || 'openai'; // Default to openai
          const model = (agent.config as any)?.model || config.ai[provider as keyof typeof config.ai]?.defaultModel || 'gpt-4o'; // Get default for provider

          // Construct AgentConfig
          const agentConfig: AgentConfig = {
            provider: provider,
            model: model,
            systemInstructions: (agent.config as any)?.systemPrompt || undefined, // Access via config
            tools: (agent.tools as AgentTool[]) || [] // Assuming agent.tools is compatible or needs casting
          };

          // Call the correct AI service function
          const aiResponse: AgentResponse = await aiService.processTask(
            dummyTask,
            agentConfig,
            messagesForAI
          );

          if (aiResponse.content && typeof aiResponse.content === 'string') {
            await storage.createMessage({
              // TODO: Review if taskId should be nullable in schema for conversation messages
              // Using 0 as a placeholder for non-task-associated messages if schema requires a number.
              taskId: 0,
              conversationId: conversationId,
              role: 'assistant',
              content: aiResponse.content,
            });
            await storage.updateConversation(conversationId, { updatedAt: new Date() });
          } else {
            console.error(`AI service returned no content or invalid content for conversation ${conversationId}`);
            await storage.createMessage({
              // TODO: Review if taskId should be nullable in schema for conversation messages
              taskId: 0,
              conversationId: conversationId,
              role: 'assistant',
              content: "I encountered an issue and couldn't generate a response. Please try again later.",
              metadata: { error: "AI returned no content or invalid content" }
            });
          }

        } catch (processingError) {
          console.error(`Error processing agent response for conversation ${conversationId}:`, handleError(processingError));
          try {
            await storage.createMessage({
              // TODO: Review if taskId should be nullable in schema for conversation messages
              taskId: 0,
              conversationId: conversationId,
              role: 'assistant',
              content: "I encountered an error while processing your request. Please try again.",
              metadata: { error: handleError(processingError) }
            });
          } catch (storeErrorError) {
            console.error(`Failed to store error message for conversation ${conversationId}:`, storeErrorError);
          }
        }
      }, 0);

      // Return the user message immediately
      res.status(201).json({
        message: userMessage,
        processing: true // Indicate that agent response is pending
      });

    } catch (error) {
      console.error("Error posting conversation message:", error);
      res.status(500).json({ error: handleError(error) });
    }
  });
  // Admin routes

  // Site Settings Admin Route
  app.patch("/api/admin/site-settings", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      console.log("Updating site settings with payload:", req.body);
      const updates = req.body;

      // Add the user ID who made the update if available
      // req.user is guaranteed here by middleware and check above
      updates.updatedBy = req.user.id;

      // Check if settings exist, create default if not
      let settings = await storage.getSiteSettings();

      if (!settings) {
        console.log("No site settings found for admin update, creating default first");
        settings = await storage.createDefaultSiteSettings();
      }

      // Now update the settings
      const updatedSettings = await storage.updateSiteSettings(updates);

      if (!updatedSettings) {
        return res.status(500).json({ error: "Failed to update site settings" });
      }

      console.log("Site settings updated successfully");
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Agent Tools Routes
  app.get("/api/admin/agent-tools", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const tools = await storage.getAllAgentTools();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.get("/api/admin/agent-tools/:id", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const toolId = parseInt(req.params.id);
      const tool = await storage.getAgentTool(toolId);

      if (!tool) {
        return res.status(404).json({ error: "Agent Tool not found" });
      }

      res.json(tool);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.post("/api/admin/agent-tools", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      // Validate and create tool
      const validatedData = insertAgentToolSchema.safeParse(req.body);

      if (!validatedData.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validatedData.error.format(),
        });
      }

      const tool = await storage.createAgentTool(validatedData.data);
      res.status(201).json(tool);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.patch("/api/admin/agent-tools/:id", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const toolId = parseInt(req.params.id);
      const tool = await storage.getAgentTool(toolId);

      if (!tool) {
        return res.status(404).json({ error: "Agent Tool not found" });
      }

      // Update tool
      const updatedTool = await storage.updateAgentTool(toolId, req.body);
      res.json(updatedTool);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.delete("/api/admin/agent-tools/:id", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const toolId = parseInt(req.params.id);
      const tool = await storage.getAgentTool(toolId);

      if (!tool) {
        return res.status(404).json({ error: "Agent Tool not found" });
      }

      // Can't delete system tools
      if (tool.isSystem) {
        return res.status(403).json({ error: "Cannot delete system tools" });
      }

      // Delete tool
      await storage.deleteAgentTool(toolId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // User accessible agent tools (for agent task execution)
  app.get("/api/agent-tools", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Only return active tools for regular users
      const tools = await storage.getAllAgentTools();
      const activeTools = tools.filter((tool: AgentTool) => tool.isActive); // Added type
      res.json(activeTools);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.get(
    "/api/agent-tools/category/:category",
    requireAuth,
    async (req: Request, res: Response) => { // Added types
      try {
        const category = req.params.category;
        // Only return active tools for regular users
        const tools = await storage.getAgentToolsByCategory(category);
        const activeTools = tools.filter((tool: AgentTool) => tool.isActive); // Added type
        res.json(activeTools);
      } catch (error) {
        res.status(500).json({ error: handleError(error) }); // Use handleError
      }
    },
  );

  // Plans
  app.get("/api/plans", async (req: Request, res: Response) => { // Added types
    try {
      const plans = await storage.getActivePlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.get("/api/admin/plans", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const plans = await storage.getAllPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.post("/api/admin/plans", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const plan = await storage.createPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.patch("/api/admin/plans/:id", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const planId = parseInt(req.params.id);
      const updatedPlan = await storage.updatePlan(planId, req.body);

      if (!updatedPlan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // AI Providers Status Endpoint for dashboard
  app.get("/api/ai-providers/status", async (req: Request, res: Response) => { // Added types
    try {
      // Get active providers
      const activeProviders = await storage.getActiveAiProviders();

      // Transform data for the widget display
      const providerStatus = activeProviders.map((provider: AiProviderSchema) => ({ // Added type
        id: provider.provider,
        name: provider.name,
        status: provider.isActive ? 'active' : 'inactive',
        quotaUsed: 0, // This would be populated from usage data in a real implementation
        quotaLimit: 100, // This would be based on the user's plan
        quotaUnit: 'USD'
      }));

      res.json(providerStatus);
    } catch (error) {
      console.error("Error fetching AI provider status:", error);
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // AI Providers Admin Endpoints
  app.get("/api/admin/ai-providers", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const providers = await storage.getAllAiProviders();

      // Enhance each provider with API key availability
      const enhancedProviders = await Promise.all(providers.map(async (provider: AiProviderSchema) => { // Added type
        // Check env var first
        let hasApiKey = checkRequiredApiKey(provider.provider);

        // If not in env vars, check credentials table if user is authenticated
        if (!hasApiKey && req.user) {
          try {
            const credential = await credentialService.getCredentialByService(
              req.user.id,
              provider.provider
            );
            hasApiKey = !!credential;
          } catch (credError) {
            console.error("Error checking credential:", credError);
          }
        }

        return {
          ...provider,
          hasApiKey
        };
      }));

      res.json(enhancedProviders);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Check if API key is available for provider
  app.get("/api/admin/ai-providers/check-key/:provider", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { provider } = req.params;

      // Check env var first
      let hasApiKey = checkRequiredApiKey(provider);

      // If not in env vars, check credentials table if user is authenticated
      if (!hasApiKey && req.user) {
        try {
          const credential = await credentialService.getCredentialByService(
            req.user.id,
            provider
          );
          hasApiKey = !!credential;
        } catch (credError) {
          console.error("Error checking credential:", credError);
        }
      }

      res.json({ hasApiKey });
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.post("/api/admin/ai-providers", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      // Extract apiKey from the request if present
      const { apiKey, ...providerData } = req.body;

      // Store provider in database
      const provider = await storage.createAiProvider(providerData);

      // If API key was provided, create a credential record
      if (apiKey && req.user) {
        // Create credential using the credential service
        await credentialService.createCredential({
          userId: req.user.id,
          name: `${provider.name} API Key`,
          type: 'api_key',
          authMethod: 'apiKey',
          data: encrypt(apiKey), // Encrypt the API key
          service: provider.provider // Associate with the provider
        });
      }

      // Add hasApiKey flag - set to true immediately if we just stored an API key
      const environmentKeyExists = checkRequiredApiKey(provider.provider);
      // If we've just stored an API key via credentials, we know it exists
      const hasApiKey = environmentKeyExists || (apiKey ? true : false);

      res.status(201).json({
        ...provider,
        hasApiKey
      });
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.patch("/api/admin/ai-providers/:id", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const providerId = parseInt(req.params.id);

      // Extract apiKey from the request if present
      const { apiKey, ...providerData } = req.body;

      // Update provider in database
      const updatedProvider = await storage.updateAiProvider(
        providerId,
        providerData,
      );

      if (!updatedProvider) {
        return res.status(404).json({ error: "AI Provider not found" });
      }

      // If API key was provided, update or create a credential record
      if (apiKey && req.user) {
        // Get existing credential for this provider
        const existingCredential = await credentialService.getCredentialByService(
          req.user.id,
          updatedProvider.provider
        );

        if (existingCredential) {
          // Update existing credential
          await credentialService.updateCredential(existingCredential.id, {
            data: encrypt(apiKey)
          });
        } else {
          // Create new credential
          await credentialService.createCredential({
            userId: req.user.id,
            name: `${updatedProvider.name} API Key`,
            type: 'api_key',
            authMethod: 'apiKey',
            data: encrypt(apiKey),
            service: updatedProvider.provider
          });
        }
      }

      // Add hasApiKey flag - set to true immediately if we just stored an API key
      const environmentKeyExists = checkRequiredApiKey(updatedProvider.provider);
      // If we've just stored an API key via credentials, we know it exists
      const hasApiKey = environmentKeyExists || (apiKey ? true : false);

      res.json({
        ...updatedProvider,
        hasApiKey
      });
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // AI Models Admin Routes
  app.get("/api/admin/ai-models", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const models = await storage.getAllAiModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Get OpenRouter models endpoint
  app.get("/api/admin/openrouter/models", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        return res.status(400).json({
          error: "OpenRouter not configured",
          details: "OpenRouter API key is missing",
        });
      }

      // Import when needed to avoid startup errors if OpenRouter isn't configured
      const { default: openrouterService } = await import("./services/openrouter-service");

      // Get detailed model information
      const modelData = await openrouterService.getDetailedModels();

      return res.json(modelData);
    } catch (error: any) {
      console.error("Error fetching OpenRouter models:", error);
      return res.status(500).json({
        error: "Failed to fetch OpenRouter models",
        details: handleError(error), // Use handleError
      });
    }
  });

  app.get("/api/admin/ai-models/:id", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const modelId = parseInt(req.params.id);
      const model = await storage.getAiModel(modelId);

      if (!model) {
        return res.status(404).json({ error: "AI Model not found" });
      }

      res.json(model);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.post("/api/admin/ai-models", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      // Verify the provider exists
      const provider = await storage.getAiProvider(req.body.providerId);
      if (!provider) {
        return res.status(400).json({ error: "AI Provider not found" });
      }

      // Validate and create model
      const validatedData = insertAiModelSchema.safeParse(req.body);

      if (!validatedData.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validatedData.error.format(),
        });
      }

      // Create the model
      const newModel = await storage.createAiModel(validatedData.data);
      res.status(201).json(newModel);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.patch("/api/admin/ai-models/:id", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const modelId = parseInt(req.params.id);
      const model = await storage.getAiModel(modelId);

      if (!model) {
        return res.status(404).json({ error: "AI Model not found" });
      }

      // If provider is being updated, verify it exists
      if (req.body.providerId) {
        const provider = await storage.getAiProvider(req.body.providerId);
        if (!provider) {
          return res.status(400).json({ error: "AI Provider not found" });
        }
      }

      // Update model
      const updatedModel = await storage.updateAiModel(modelId, req.body);
      res.json(updatedModel);
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.delete("/api/admin/ai-models/:id", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const modelId = parseInt(req.params.id);

      // Check if any prompts are using this model
      const prompts = await storage.getAiPromptsByModelId(modelId);

      if (prompts.length > 0) {
        return res.status(400).json({
          error: "Cannot delete model while prompts are using it",
        });
      }

      // Delete model
      const success = await storage.deleteAiModel(modelId);

      if (success) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ error: "AI Model not found" });
      }
    } catch (error) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Payment Routes
  // Create a payment session for a subscription
  app.post("/api/payments/create-session", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      // Verify the plan exists
      const plan = await storage.getPlan(parseInt(planId));
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Create payment session using MyFatoorah
      const paymentSession = await paymentService.createPaymentSession(
        req.user.id,
        parseInt(planId),
      );

      res.json(paymentSession);
    } catch (error: any) {
      console.error("Payment session creation error:", error);
      res
        .status(500)
        .json({ error: handleError(error) }); // Use handleError
    }
  });

  // Payment verification callback endpoint
  app.get("/api/payments/callback", async (req: Request, res: Response) => { // Added types
    try {
      const paymentId = req.query.paymentId;

      if (!paymentId) {
        return res.redirect("/payment-failed?reason=no-payment-id");
      }

      // Verify the payment with MyFatoorah
      const verification = await paymentService.verifyPayment(
        paymentId.toString(),
      );

      if (!verification.isValid) {
        return res.redirect("/payment-failed?reason=verification-failed");
      }

      // At this point, payment is verified
      // In a real system we'd use a payment-specific user ID stored in the payment session
      // For simplicity, we'll redirect to a success page
      // The actual subscription update would be handled by a webhook or background process

      res.redirect("/payment-success");
    } catch (error: any) {
      console.error("Payment callback error:", error);
      res.redirect(
        `/payment-failed?reason=${encodeURIComponent(handleError(error))}`, // Use handleError
      );
    }
  });

  // Payment error callback endpoint
  app.get("/api/payments/error", (req: Request, res: Response) => { // Added types
    res.redirect("/payment-failed?reason=gateway-error");
  });

  // Webhook for payment notifications (would be configured in MyFatoorah dashboard)
  app.post("/api/payments/webhook", async (req: Request, res: Response) => { // Added types
    try {
      // Log the webhook payload for debugging
      console.log("Received payment webhook:", req.body);

      // MyFatoorah webhook contains InvoiceId and PaymentId
      const { InvoiceId, PaymentId } = req.body;

      if (!PaymentId) {
        return res.status(400).json({ error: "Missing payment ID" });
      }

      // Verify the payment with MyFatoorah
      const verification = await paymentService.verifyPayment(
        PaymentId.toString(),
      );

      if (!verification.isValid) {
        console.error("Payment verification failed in webhook", {
          PaymentId,
          InvoiceId,
        });
        return res.status(400).json({ error: "Payment verification failed" });
      }

      // In a real system, we would store the payment session information including
      // the user ID and plan ID when the session is created
      // For simplicity, we'll assume we have a way to get this information

      // For example:
      // const paymentRecord = await storage.getPaymentByInvoiceId(InvoiceId);
      // const userId = paymentRecord.userId;
      // const planId = paymentRecord.planId;

      // Update the user's subscription
      // This is commented out because we don't have a way to get userId and planId
      // in this simplified example
      /*
      const updatedUser = await paymentService.updateUserSubscription(
        userId,
        planId,
        {
          invoiceId: verification.invoiceId,
          transactionId: verification.transactionId,
          paymentMethod: verification.paymentMethod
        }
      );
      */

      // Respond with success to the webhook call
      res.status(200).json({ status: "success" });
    } catch (error: any) {
      console.error("Payment webhook error:", error);
      res
        .status(500)
        .json({ error: handleError(error) }); // Use handleError
    }
  });

  // Check subscription status
  app.get("/api/subscription", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await storage.getUser(req.user.id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get the plan details if the user has one
      let planDetails = null;
      if (user.planId) { // Check planId instead of user.plan
        planDetails = await storage.getPlan(user.planId); // Fetch plan by ID
      }

      // Determine plan name based on details or default to 'free'
      const planName = planDetails ? planDetails.name : "free";

      res.json({
        plan: planName, // Use derived plan name
        planExpiresAt: user.planExpiresAt,
        planDetails: planDetails, // Return full plan details
      });
    } catch (error: any) {
      res.status(500).json({
        error: handleError(error), // Use handleError
      });
    }
  });

  // User Admin Routes
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      // Get all users (only admin can access)
      const users = await storage.getAllUsers();

      // Remove sensitive data from the response
      const sanitizedUsers = users.map((user: User) => { // Added type
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(sanitizedUsers);
    } catch (error: any) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.get("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove sensitive data
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      // Validate required fields
      const { username, email, password, fullName } = req.body;
      if (!username || !email || !password || !fullName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create user object
      const newUser = {
        username,
        email,
        password: hashedPassword,
        fullName,
        role: req.body.role || "user",
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        planId: req.body.planId || undefined,
      };

      // Save user to database
      const createdUser = await storage.createUser(newUser);

      // Log user update activity (Corrected argument count)
      await storage.createUserActivity({
        userId: req.user.id,
        activityType: "user_created",
        resourceId: createdUser.id,
        resourceType: "user",
        metadata: {
          username: createdUser.username,
          role: createdUser.role,
        },
      });

      // Remove sensitive data
      const { password: _, ...userWithoutPassword } = createdUser;

      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });



  app.patch("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Process updates
      const updates: any = {};

      // Only allow certain fields to be updated
      if (req.body.username) updates.username = req.body.username;
      if (req.body.email) updates.email = req.body.email;
      if (req.body.fullName) updates.fullName = req.body.fullName;
      if (req.body.role) updates.role = req.body.role;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
      // Removed user.plan update as it doesn't exist on the type
      if (req.body.planId) updates.planId = req.body.planId;
      if (req.body.planExpiresAt)
        updates.planExpiresAt = new Date(req.body.planExpiresAt);

      // If password is being updated, hash it
      if (req.body.password) {
        updates.password = await hashPassword(req.body.password);
      }

      const updatedUser = await storage.updateUser(userId, updates);

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log user update activity (Corrected argument count)
      await storage.createUserActivity({
        userId: req.user.id,
        activityType: "user_updated",
        resourceId: userId,
        resourceType: "user",
        metadata: {
          fields: Object.keys(updates),
        },
      });

      // Remove sensitive data
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = parseInt(req.params.id);

      // Don't allow deletion of the current user
      if (req.user.id === userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete the user
      const result = await storage.deleteUser(userId);

      if (!result) {
        return res.status(500).json({ error: "Failed to delete user" });
      }

      // Log user deletion activity (Pass single object argument)
      await storage.createUserActivity({
        userId: req.user.id,
        activityType: "user_deleted",
        resourceId: userId,
        resourceType: "user",
        metadata: {
          username: user.username,
        },
      });

      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);

      // Handle the specific error for last admin user
      if (error instanceof Error && error.message === "Cannot delete the last admin user") {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // AI Translation Routes
  app.post("/api/ai/translate", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;

      if (!text || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "Text, source language, and target language are required",
        });
      }

      const translatedText = await aiService.translateText(
        text,
        sourceLanguage,
        targetLanguage,
      );
      return res.json({ translatedText });
    } catch (error: any) {
      console.error("Translation error:", error);
      return res.status(500).json({
        error: "Translation failed",
        details: handleError(error), // Use handleError
      });
    }
  });

  // Bulk translate translations (admin only)
  app.post("/api/ai/translate-bulk", requireAdmin, async (req: Request, res: Response) => { // Added types
    try {
      const { translations, sourceLanguage, targetLanguage } = req.body;

      if (!translations || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({
          error: "Missing required fields",
          details:
            "Translations object, source language, and target language are required",
        });
      }

      const translatedTranslationsObj = await aiService.translateTranslations(
        translations,
        sourceLanguage,
        targetLanguage,
      );

      return res.json({ translations: translatedTranslationsObj });
    } catch (error: any) {
      console.error("Bulk translation error:", error);
      return res.status(500).json({
        error: "Bulk translation failed",
        details: handleError(error), // Use handleError
      });
    }
  });

  // AI Content Generation Routes
  app.post("/api/ai/generate-content", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      const { prompt, contentType, tone } = req.body;

      if (!prompt || !contentType || !tone) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "Prompt, content type, and tone are required",
        });
      }

      const generatedContent = await aiService.generateContent(prompt, contentType, tone);
      return res.json({ content: generatedContent });
    } catch (error: any) {
      console.error("Content generation error:", error);
      return res.status(500).json({
        error: "Content generation failed",
        details: handleError(error), // Use handleError
      });
    }
  });

  // Analyze content
  app.post("/api/ai/analyze-content", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          error: "Missing required field",
          details: "Text to analyze is required",
        });
      }

      const analysis = await aiService.analyzeContent(text);
      return res.json(analysis);
    } catch (error: any) {
      console.error("Content analysis error:", error);
      return res.status(500).json({
        error: "Content analysis failed",
        details: handleError(error), // Use handleError
      });
    }
  });

  // User Activity & Dashboard Routes

  // Get user activity feed
  app.get("/api/user/activity", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { limit } = req.query;

      const activities = await storage.getUserActivitiesByUserId(
        req.user.id,
        limit ? parseInt(limit.toString()) : 10,
      );

      res.json(activities);
    } catch (error: any) {
      console.error("Error retrieving user activities:", error);
      res.status(500).json({
        error: handleError(error), // Use handleError
      });
    }
  });

  // Get user analytics summary
  app.get("/api/user/analytics", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const analytics = await storage.getUserAnalytics(req.user.id, "all");
      res.json(analytics || { message: "No analytics data available yet" });
    } catch (error: any) {
      console.error("Error retrieving user analytics:", error);
      res.status(500).json({
        error: handleError(error), // Use handleError
      });
    }
  });

  // Get user dashboard preferences
  app.get("/api/user/dashboard/preferences", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const preferences = await storage.getDashboardPreference(req.user.id);

      if (!preferences) {
        // Create default preferences if none exist
        const defaultPreferences = {
          userId: req.user.id,
          layout: {
            columns: 2,
            showWelcome: true,
            compactView: false,
          },
          favoriteAgents: [],
          recentTasks: [],
          widgets: [
            { id: "activity", position: 0, enabled: true },
            { id: "stats", position: 1, enabled: true },
            { id: "quickActions", position: 2, enabled: true },
            { id: "recentFiles", position: 3, enabled: true },
            { id: "agentStatus", position: 4, enabled: true },
          ],
          theme: "system",
          updatedAt: new Date(),
        };

        const newPreferences =
          await storage.createDashboardPreference(defaultPreferences);
        return res.json(newPreferences);
      }

      res.json(preferences);
    } catch (error: any) {
      console.error("Error retrieving dashboard preferences:", error);
      res.status(500).json({
        error: "Failed to retrieve dashboard preferences",
        details: handleError(error), // Use handleError
      });
    }
  });

  // Update dashboard preferences
  app.put("/api/user/dashboard/preferences", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      // Middleware ensures req.user exists, but TS needs explicit check
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { layout, widgets, theme, favoriteAgents, recentTasks } = req.body;

      // Get existing preferences
      let preferences = await storage.getDashboardPreference(req.user.id);

      if (!preferences) {
        // Create default preferences if none exist
        const defaultPreferences = {
          userId: req.user.id,
          layout: {
            columns: 2,
            showWelcome: true,
            compactView: false,
          },
          favoriteAgents: favoriteAgents || [],
          recentTasks: recentTasks || [],
          widgets: [
            { id: "activity", position: 0, enabled: true },
            { id: "stats", position: 1, enabled: true },
            { id: "quickActions", position: 2, enabled: true },
            { id: "recentFiles", position: 3, enabled: true },
            { id: "agentStatus", position: 4, enabled: true },
          ],
          theme: "system",
          updatedAt: new Date(),
        };

        const newPreferences =
          await storage.createDashboardPreference(defaultPreferences);
        return res.json(newPreferences);
      }

      // Update existing preferences
      const updates: any = {
        updatedAt: new Date(),
      };

      if (layout) updates.layout = layout;
      if (widgets) updates.widgets = widgets;
      if (theme) updates.theme = theme;
      if (favoriteAgents) updates.favoriteAgents = favoriteAgents;
      if (recentTasks) updates.recentTasks = recentTasks;

      const updatedPreferences = await storage.updateDashboardPreference(
        preferences.id,
        updates,
      );

      res.json(updatedPreferences);
    } catch (error: any) {
      console.error("Error updating dashboard preferences:", error);
      res.status(500).json({
        error: "Failed to update dashboard preferences",
        details: handleError(error), // Use handleError
      });
    }
  });

  // Add agent to favorites
  app.post(
    "/api/user/dashboard/favorites/agent/:agentId",
    requireAuth,
    async (req: Request, res: Response) => { // Added types
      try {
        // Middleware ensures req.user exists, but TS needs explicit check
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const { agentId } = req.params;

        if (!agentId) {
          return res.status(400).json({ error: "Agent ID is required" });
        }

        // Verify agent exists and belongs to user
        const agent = await storage.getAgent(parseInt(agentId));

        if (!agent) {
          return res.status(404).json({ error: "Agent not found" });
        }

        if (agent.userId !== req.user.id) {
          return res
            .status(403)
            .json({ error: "You don't have access to this agent" });
        }

        // Get preferences
        let preferences = await storage.getDashboardPreference(req.user.id);

        if (!preferences) {
          // Create preferences if they don't exist
          const defaultPreferences = {
            userId: req.user.id,
            layout: {
              columns: 2,
              showWelcome: true,
              compactView: false,
            },
            favoriteAgents: [parseInt(agentId)],
            recentTasks: [],
            widgets: [
              { id: "activity", position: 0, enabled: true },
              { id: "stats", position: 1, enabled: true },
              { id: "quickActions", position: 2, enabled: true },
              { id: "recentFiles", position: 3, enabled: true },
              { id: "agentStatus", position: 4, enabled: true },
            ],
            theme: "system",
            updatedAt: new Date(),
          };

          const newPreferences =
            await storage.createDashboardPreference(defaultPreferences);
          return res.json({
            success: true,
            favorites: newPreferences.favoriteAgents,
          });
        }

        // Update favorites (maximum of 5 favorites)
        const currentFavorites = (preferences.favoriteAgents as any[]) || [];
        const agentIdNum = parseInt(agentId);

        // If already in favorites, do nothing
        if (currentFavorites.includes(agentIdNum)) {
          return res.json({ success: true, favorites: currentFavorites });
        }

        // Add to favorites (maintain max 5)
        const updatedFavorites = [...currentFavorites, agentIdNum].slice(-5);

        await storage.updateDashboardPreference(preferences.id, {
          favoriteAgents: updatedFavorites,
          updatedAt: new Date(),
        });

        res.json({ success: true, favorites: updatedFavorites });
      } catch (error: any) {
        console.error("Error adding agent to favorites:", error);
        res.status(500).json({
          error: "Failed to add agent to favorites",
          details: handleError(error), // Use handleError
        });
      }
    },
  );

  // Remove agent from favorites
  app.delete(
    "/api/user/dashboard/favorites/agent/:agentId",
    requireAuth,
    async (req: Request, res: Response) => { // Added types
      try {
        // Middleware ensures req.user exists, but TS needs explicit check
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const { agentId } = req.params;

        if (!agentId) {
          return res.status(400).json({ error: "Agent ID is required" });
        }

        // Get preferences
        const preferences = await storage.getDashboardPreference(req.user.id);

        if (!preferences) {
          return res
            .status(404)
            .json({ error: "Dashboard preferences not found" });
        }

        // Remove from favorites
        const currentFavorites = (preferences.favoriteAgents as any[]) || [];
        const agentIdNum = parseInt(agentId);
        const updatedFavorites = currentFavorites.filter(
          (id) => id !== agentIdNum,
        );

        await storage.updateDashboardPreference(preferences.id, {
          favoriteAgents: updatedFavorites,
          updatedAt: new Date(),
        });

        res.json({ success: true, favorites: updatedFavorites });
      } catch (error: any) {
        console.error("Error removing agent from favorites:", error);
        res.status(500).json({
          error: "Failed to remove agent from favorites",
          details: handleError(error), // Use handleError
        });
      }
    },
  );

  // Chatbot routes
  // Chatbot message history
  app.get("/api/chatbot/history", async (req: Request, res: Response) => { // Added types
    try {
      const userId = req.isAuthenticated() ? req.user!.id : null;
      const sessionId = req.query.sessionId as string;

      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      const history = await getChatHistory(userId, sessionId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Send message to chatbot
  app.post("/api/chatbot/message", async (req: Request, res: Response) => { // Added types
    try {
      if (!req.body.content) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const content = req.body.content;
      const providedSessionId = req.body.sessionId;
      const userId = req.isAuthenticated() ? req.user!.id : null;

      // Get or create session ID
      const sessionId = await getOrCreateSessionId(providedSessionId);

      // Get current timestamp for consistent usage throughout the transaction
      const timestamp = new Date();

      // Store user message with timestamp
      await storeChatMessage({
        userId: userId || undefined,
        sessionId,
        content,
        isBot: false,
        timestamp
      });

      // Get or create game progress
      const gameInfo = await getOrCreateGameProgress(userId, sessionId);

      // Award points for activity (1 point per message)
      await awardPoints(userId, sessionId, 1);

      // Update user streak and check if it was incremented
      const streakIncremented = await updateStreak(userId, sessionId);

      // Generate dynamic response based on user message and game progress
      const botResponse = await generateResponse(userId, sessionId, content, gameInfo);

      // Enhance the response if streak was just incremented
      let responseContent = botResponse.content;
      if (streakIncremented) {
        // Only add streak message if the AI didn't already mention it
        if (!responseContent.toLowerCase().includes('streak')) {
          responseContent += ` 🔥 Great job on your ${gameInfo.streak + 1}-day streak! Keep coming back daily for more points and rewards.`;
        }
      }

      // Store bot response with the enhanced content
      await storeChatMessage({
        userId: userId || undefined,
        sessionId,
        content: responseContent,
        isBot: true,
        metadata: botResponse.metadata,
        timestamp
      });

      // Check for challenge completion based on message content
      // For example, if the user asks about a specific feature, we might complete a discovery challenge
      const userMessageLower = content.toLowerCase();

      // Feature discovery logic through natural conversation
      if (gameInfo.completedChallenges.length < 3) {
        if (
          (userMessageLower.includes('agent') || userMessageLower.includes('automation')) &&
          !gameInfo.completedChallenges.includes('1')
        ) {
          await completeChallenge(userId, sessionId, 1); // Complete "Discover Agents" challenge
        } else if (
          (userMessageLower.includes('credential') || userMessageLower.includes('api key')) &&
          !gameInfo.completedChallenges.includes('2')
        ) {
          await completeChallenge(userId, sessionId, 2); // Complete "Learn about Credentials" challenge
        } else if (
          (userMessageLower.includes('browser') || userMessageLower.includes('automate')) &&
          !gameInfo.completedChallenges.includes('3')
        ) {
          await completeChallenge(userId, sessionId, 3); // Complete "Explore Browser Automation" challenge
        }
      }

      // Get updated game progress after all operations
      const updatedGameInfo = await getOrCreateGameProgress(userId, sessionId);

      // Return enhanced response with game info and session
      res.json({
        content: responseContent,
        sessionId,
        gameInfo: updatedGameInfo,
        metadata: {
          ...botResponse.metadata,
          pointsEarned: 1, // Basic points earned from sending a message
          streakIncremented,
          newStreak: streakIncremented ? gameInfo.streak + 1 : gameInfo.streak,
          timestamp: timestamp.toISOString()
        }
      });
    } catch (error) {
      console.error("Error processing chatbot message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Get available challenges
  app.get("/api/chatbot/challenges", async (req: Request, res: Response) => { // Added types
    try {
      const difficulty = req.query.difficulty as string | undefined;
      // Correct: getAvailableChallenges only takes optional difficulty
      const challenges = await getAvailableChallenges(difficulty);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Complete a challenge
  app.post("/api/chatbot/complete-challenge", async (req: Request, res: Response) => { // Added types
    try {
      if (!req.body.challengeId || !req.body.sessionId) {
        return res.status(400).json({ error: "Challenge ID and Session ID are required" });
      }

      const challengeId = parseInt(req.body.challengeId);
      const userId = req.isAuthenticated() ? req.user!.id : null;
      const sessionId = req.body.sessionId;

      await completeChallenge(userId, sessionId, challengeId);

      // Get updated game progress
      const updatedGameInfo = await getOrCreateGameProgress(userId, sessionId);

      res.json({
        success: true,
        gameInfo: updatedGameInfo
      });
    } catch (error) {
      console.error("Error completing challenge:", error);
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Get user game progress
  app.get("/api/chatbot/game-progress", async (req: Request, res: Response) => { // Added types
    try {
      const userId = req.isAuthenticated() ? req.user!.id : null;
      const sessionId = req.query.sessionId as string;

      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      const gameInfo = await getOrCreateGameProgress(userId, sessionId);
      res.json(gameInfo);
    } catch (error) {
      console.error("Error fetching game progress:", error);
      res.status(500).json({ error: handleError(error) }); // Use handleError
    }
  });

  // Register browser observer routes
  import("./routes/browser-observer-routes").then(({ browserObserverRouter }) => {
    app.use("/api/browser-observer", browserObserverRouter);
  });

  // Import browser automation routes
  import("./routes/browser-automation-routes").then(({ browserAutomationRouter }) => {
    app.use("/api/browser-automation", browserAutomationRouter);
  });

  // Import workflow progress routes
  import("./routes/workflow-progress-routes").then(({ workflowProgressRouter }) => {
    app.use("/api/workflow-progress", workflowProgressRouter);
  });

  // Admin Router for super admin functionalities
  const adminRouter = Router();

  adminRouter.post("/login", (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (username === config.admin.username && password === config.admin.password) {
      if (req.session) {
        req.session.isAdmin = true; // Mark session as super admin
        res.json({ success: true, message: "Admin login successful" });
      } else {
        // This case should ideally not happen if session middleware is correctly set up
        res.status(500).json({ error: "Session not available" });
      }
    } else {
      res.status(401).json({ error: "Invalid admin credentials" });
    }
  });

  adminRouter.post("/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.isAdmin = false;
      res.json({ success: true, message: "Admin logout successful" });
    } else {
      res.status(500).json({ error: "Session not available" });
    }
  });

  // Middleware to protect super admin routes
  const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.isAdmin) {
      next();
    } else {
      res.status(403).json({ error: "Super admin access required" });
    }
  };

  // Example protected admin route
  adminRouter.get("/dashboard-access-check", requireSuperAdmin, (req: Request, res: Response) => {
    res.json({ success: true, message: "Welcome to the admin dashboard!" });
  });

  app.use("/api/admin", adminRouter); // Mount the admin router

  // Document Template Routes
  app.get("/api/document-templates", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      const templates = await documentTemplateService.listDocumentTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching document templates:", error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.get("/api/document-templates/:templateId", requireAuth, async (req: Request, res: Response) => { // Added types
    try {
      const templateId = req.params.templateId;
      const content = await documentTemplateService.getDocumentTemplateContent(templateId);
      if (content === null) {
        return res.status(404).json({ error: "Template not found or invalid ID" });
      }
      res.type("text/markdown").send(content); // Send as markdown
    } catch (error) {
      console.error(`Error fetching template ${req.params.templateId}:`, error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer; // Added return statement
}
