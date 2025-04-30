import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { db, checkDatabaseConnection } from "./db";
import { checkRequiredApiKey } from "./config";
import { eq, count, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { processAgentTask } from "./services/ai-service";

// Configure multer for file uploads
const storage_engine = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
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
  fileFilter: (req, file, cb) => {
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
import {
  insertAgentSchema,
  insertCredentialSchema,
  insertFileSchema,
  insertTaskSchema,
  insertMessageSchema,
  insertAiProviderSchema,
  insertAiModelSchema,
  insertAiPromptSchema,
  insertPlanSchema,
  insertAgentToolSchema,
  aiModels,
  aiPrompts,
  agentTools,
} from "@shared/schema";
import { encrypt, decrypt } from "../shared/crypto";
import { paymentService } from "./services/payment-service";
import {
  translateText,
  translateTranslations,
  generateContent,
  analyzeContent,
} from "./services/openai-service";
import {
  getOrCreateSessionId,
  getOrCreateGameProgress,
  storeChatMessage,
  getChatHistory,
  generateResponse,
  awardPoints,
  getAvailableChallenges,
  completeChallenge,
  updateStreak
} from "./services/chatbot-service";
import { credentialService, SERVICE_TYPES, AUTH_METHODS } from "./services/credential-service";
import { gmailService } from "./services/gmail-service";

// Helper function to handle errors consistently
const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error occurred";
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint - no auth required, useful for deployment monitoring
  app.get("/api/health", async (req, res) => {
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
  app.get("/api/site-settings", async (req, res) => {
    try {
      // Get settings or create default if none exist
      let settings = await storage.getSiteSettings();
      
      // If no settings found, create default settings
      if (!settings) {
        console.log("No site settings found, creating default settings");
        settings = await storage.createDefaultSiteSettings();
      }
      
      // Remove any sensitive information before sending to the client
      const sanitizedSettings = { ...settings };
      
      // Remove updatedBy if it exists (contains user ID)
      if (sanitizedSettings.updatedBy) {
        delete sanitizedSettings.updatedBy;
      }
      
      res.json(sanitizedSettings);
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
  app.post("/api/admin/upload-logo", requireAdmin, upload.single('logo'), async (req, res) => {
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
            ...existingSettings.logo,
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
        error: error instanceof Error ? error.message : "Unknown error occurred during upload",
      });
    }
  });
  
  // Dashboard preferences routes
  import("./services/dashboard-service").then((dashboardService) => {
    // Get user dashboard preferences
    app.get("/api/user/dashboard/preferences", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send({ error: "Not authenticated" });
      }
      
      try {
        let preferences = await dashboardService.getDashboardPreferences(req.user.id);
        
        if (!preferences) {
          preferences = await dashboardService.createDefaultDashboardPreferences(req.user.id);
        }
        
        res.json(preferences);
      } catch (error) {
        console.error("Error fetching dashboard preferences:", error);
        res.status(500).send({ error: "Failed to fetch dashboard preferences" });
      }
    });
    
    // Update user dashboard preferences
    app.patch("/api/user/dashboard/preferences", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send({ error: "Not authenticated" });
      }
      
      try {
        const updates = req.body;
        const updated = await dashboardService.updateDashboardPreferences(req.user.id, updates);
        res.json(updated);
      } catch (error) {
        console.error("Error updating dashboard preferences:", error);
        res.status(500).send({ error: "Failed to update dashboard preferences" });
      }
    });
  });

  // API routes
  // Get user profile
  app.get("/api/profile", requireAuth, (req: Request, res: Response) => {
    // We can safely assume user exists because requireAuth middleware checks it
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Update user profile
  app.patch("/api/profile", requireAuth, async (req: Request, res: Response) => {
    try {
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
  app.get("/api/agents", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const agents = await storage.getAgentsByUserId(req.user.id);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Agent status endpoint for dashboard - must come before the :id route
  app.get("/api/agents/status", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const agents = await storage.getAgentsByUserId(req.user.id);
      
      // Count agents by status
      const agentCounts = {
        total: agents.length,
        active: agents.filter(agent => agent.isActive === true).length,
        inactive: agents.filter(agent => agent.isActive === false || agent.isActive === undefined).length
      };
      
      res.json(agentCounts);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.get("/api/agents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
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

  app.post("/api/agents", requireAuth, async (req: Request, res: Response) => {
    try {
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

  app.patch("/api/agents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
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

      // Update agent
      const updatedAgent = await storage.updateAgent(agentId, req.body);
      res.json(updatedAgent);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.delete("/api/agents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
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
  app.get("/api/credentials", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const credentials = await storage.getCredentialsByUserId(req.user.id);
      // Don't include sensitive data in the response
      const sanitizedCredentials = credentials.map((cred) => {
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
  app.get("/api/credentials/service/:type", requireAuth, async (req, res) => {
    try {
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
  app.get("/api/credentials/expiring", requireAuth, async (req, res) => {
    try {
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

  app.get("/api/credentials/:id", requireAuth, async (req, res) => {
    try {
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

  app.post("/api/credentials", requireAuth, async (req, res) => {
    try {
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

  app.patch("/api/credentials/:id", requireAuth, async (req, res) => {
    try {
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

  app.delete("/api/credentials/:id", requireAuth, async (req, res) => {
    try {
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
  app.post("/api/services/gmail/credentials", requireAuth, async (req, res) => {
    try {
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
  
  app.get("/api/services/gmail/credentials", requireAuth, async (req, res) => {
    try {
      const credentials = await gmailService.listGmailCredentials(req.user.id);
      res.json(credentials);
    } catch (error) {
      console.error("Error listing Gmail credentials:", error);
      res.status(500).json({ error: "Failed to list Gmail credentials" });
    }
  });
  
  app.post("/api/services/gmail/send-email", requireAuth, async (req, res) => {
    try {
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
  
  app.get("/api/services/gmail/messages", requireAuth, async (req, res) => {
    try {
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
  app.post("/api/services/gmail/refresh-token", requireAuth, async (req, res) => {
    try {
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
  app.get("/api/files", requireAuth, async (req, res) => {
    try {
      const files = await storage.getFilesByUserId(req.user.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Recent files endpoint for dashboard
  app.get("/api/files/recent", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 5;
      const files = await storage.getFilesByUserId(req.user.id, { limit, orderBy: 'createdAt', order: 'desc' });
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/templates", requireAuth, async (req, res) => {
    try {
      const templates = await storage.getTemplatesByUserId(req.user.id);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/files/:id", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  // Note: File upload would typically be handled with multipart/form-data and a library like multer
  // For simplicity in this prototype, we're just storing file metadata
  app.post("/api/files", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/files/:id", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  // Task routes
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const tasks = await storage.getTasksByUserId(req.user.id, limit);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // API endpoint to register AI agent tools
  app.post("/api/admin/register-tools", requireAdmin, async (req, res) => {
    try {
      const tools = [
        {
          name: "OpenAI Chat",
          description: "Connect with OpenAI's GPT models for natural language tasks",
          category: "ai",
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
          icon: "code",
          isActive: true,
          isSystem: true,
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
            await db
              .update(agentTools)
              .set({
                description: tool.description,
                category: tool.category,
                icon: tool.icon,
                isActive: tool.isActive,
                isSystem: true,
                config: tool.config,
                updatedAt: new Date()
              })
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

  app.get("/api/agents/:agentId/tasks", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
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
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  // Message routes
  app.get("/api/tasks/:taskId/messages", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks/:taskId/messages", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check ownership
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
        // Process the task in the background
        setTimeout(async () => {
          try {
            const { processAgentTask } = require('./services/ai-service');
            await processAgentTask(taskId, storage);
          } catch (error) {
            console.error('Error processing agent task:', error);
          }
        }, 0);
      }
      
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Endpoint to explicitly execute a task with an agent
  app.post("/api/tasks/:taskId/execute", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check ownership
      if (task.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Update task status to pending
      await storage.updateTask(taskId, { status: "pending" });
      
      // Process in the background
      setTimeout(async () => {
        try {
          await processAgentTask(taskId, storage);
        } catch (error) {
          console.error('Error executing agent task:', error instanceof Error ? error.message : String(error));
          await storage.updateTask(taskId, { 
            status: "failed",
            result: JSON.stringify({ 
              error: error instanceof Error ? error.message : "Unknown error occurred"
            })
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
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Task-File relationship routes
  app.get("/api/tasks/:taskId/files", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  // Link a file to a task
  app.post(
    "/api/tasks/:taskId/files/:fileId",
    requireAuth,
    async (req, res) => {
      try {
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
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Unlink a file from a task
  app.delete(
    "/api/tasks/:taskId/files/:fileId",
    requireAuth,
    async (req, res) => {
      try {
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
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Admin routes
  
  // Site Settings Admin Route
  app.patch("/api/admin/site-settings", requireAdmin, async (req, res) => {
    try {
      console.log("Updating site settings with payload:", req.body);
      const updates = req.body;
      
      // Add the user ID who made the update if available
      if (req.user && req.user.id) {
        updates.updatedBy = req.user.id;
      }
      
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
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Agent Tools Routes
  app.get("/api/admin/agent-tools", requireAdmin, async (req, res) => {
    try {
      const tools = await storage.getAllAgentTools();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/agent-tools/:id", requireAdmin, async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const tool = await storage.getAgentTool(toolId);

      if (!tool) {
        return res.status(404).json({ error: "Agent Tool not found" });
      }

      res.json(tool);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/agent-tools", requireAdmin, async (req, res) => {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/agent-tools/:id", requireAdmin, async (req, res) => {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/agent-tools/:id", requireAdmin, async (req, res) => {
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
      res.status(500).json({ error: error.message });
    }
  });

  // User accessible agent tools (for agent task execution)
  app.get("/api/agent-tools", requireAuth, async (req, res) => {
    try {
      // Only return active tools for regular users
      const tools = await storage.getAllAgentTools();
      const activeTools = tools.filter((tool) => tool.isActive);
      res.json(activeTools);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get(
    "/api/agent-tools/category/:category",
    requireAuth,
    async (req, res) => {
      try {
        const category = req.params.category;
        // Only return active tools for regular users
        const tools = await storage.getAgentToolsByCategory(category);
        const activeTools = tools.filter((tool) => tool.isActive);
        res.json(activeTools);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Plans
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getActivePlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/plans", requireAdmin, async (req, res) => {
    try {
      const plans = await storage.getAllPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/plans", requireAdmin, async (req, res) => {
    try {
      const plan = await storage.createPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/plans/:id", requireAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const updatedPlan = await storage.updatePlan(planId, req.body);

      if (!updatedPlan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Providers Status Endpoint for dashboard
  app.get("/api/ai-providers/status", async (req, res) => {
    try {
      // Get active providers
      const activeProviders = await storage.getActiveAiProviders();
      
      // Transform data for the widget display
      const providerStatus = activeProviders.map(provider => ({
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
      res.status(500).json({ error: error.message });
    }
  });

  // AI Providers Admin Endpoints
  app.get("/api/admin/ai-providers", requireAdmin, async (req, res) => {
    try {
      const providers = await storage.getAllAiProviders();
      
      // Enhance each provider with API key availability
      const enhancedProviders = await Promise.all(providers.map(async provider => {
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
      res.status(500).json({ error: error.message });
    }
  });
  
  // Check if API key is available for provider
  app.get("/api/admin/ai-providers/check-key/:provider", requireAdmin, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/ai-providers", requireAdmin, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/ai-providers/:id", requireAdmin, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  // AI Models Admin Routes
  app.get("/api/admin/ai-models", requireAdmin, async (req, res) => {
    try {
      const models = await storage.getAllAiModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/ai-models/:id", requireAdmin, async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const model = await storage.getAiModel(modelId);

      if (!model) {
        return res.status(404).json({ error: "AI Model not found" });
      }

      res.json(model);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/ai-models", requireAdmin, async (req, res) => {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/ai-models/:id", requireAdmin, async (req, res) => {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/ai-models/:id", requireAdmin, async (req, res) => {
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
      res.status(500).json({ error: error.message });
    }
  });

  // AI Prompts Admin Routes
  app.get("/api/admin/ai-prompts", requireAdmin, async (req, res) => {
    try {
      const prompts = await storage.getAllAiPrompts();
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/ai-prompts/:id", requireAdmin, async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      const prompt = await storage.getAiPrompt(promptId);

      if (!prompt) {
        return res.status(404).json({ error: "AI Prompt not found" });
      }

      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/ai-prompts", requireAdmin, async (req, res) => {
    try {
      // Verify the model exists
      const model = await storage.getAiModel(req.body.modelId);
      if (!model) {
        return res.status(400).json({ error: "AI Model not found" });
      }

      // Validate and create prompt
      const validatedData = insertAiPromptSchema.safeParse(req.body);

      if (!validatedData.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validatedData.error.format(),
        });
      }

      // Create the prompt
      const newPrompt = await storage.createAiPrompt(validatedData.data);
      res.status(201).json(newPrompt);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/ai-prompts/:id", requireAdmin, async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      const prompt = await storage.getAiPrompt(promptId);

      if (!prompt) {
        return res.status(404).json({ error: "AI Prompt not found" });
      }

      // If model is being updated, verify it exists
      if (req.body.modelId) {
        const model = await storage.getAiModel(req.body.modelId);
        if (!model) {
          return res.status(400).json({ error: "AI Model not found" });
        }
      }

      // Update prompt
      const updatedPrompt = await storage.updateAiPrompt(promptId, req.body);
      res.json(updatedPrompt);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/ai-prompts/:id", requireAdmin, async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);

      // Delete prompt
      const success = await storage.deleteAiPrompt(promptId);

      if (success) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ error: "AI Prompt not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Payment Routes
  // Create a payment session for a subscription
  app.post("/api/payments/create-session", requireAuth, async (req, res) => {
    try {
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
        .json({ error: error.message || "Failed to create payment session" });
    }
  });

  // Payment verification callback endpoint
  app.get("/api/payments/callback", async (req, res) => {
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
        `/payment-failed?reason=${encodeURIComponent(error.message || "Unknown error")}`,
      );
    }
  });

  // Payment error callback endpoint
  app.get("/api/payments/error", (req, res) => {
    res.redirect("/payment-failed?reason=gateway-error");
  });

  // Webhook for payment notifications (would be configured in MyFatoorah dashboard)
  app.post("/api/payments/webhook", async (req, res) => {
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
        .json({ error: error.message || "Webhook processing failed" });
    }
  });

  // Check subscription status
  app.get("/api/subscription", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get the plan details if the user has one
      let plan = null;
      if (user.plan) {
        plan = await storage.getPlanByName(user.plan);
      }

      res.json({
        plan: user.plan || "free",
        planExpiresAt: user.planExpiresAt,
        planDetails: plan,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to retrieve subscription information",
      });
    }
  });

  // User Admin Routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      // Get all users (only admin can access)
      const users = await storage.getAllUsers();

      // Remove sensitive data from the response
      const sanitizedUsers = users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(sanitizedUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
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

      // Create user activity log entry
      if (req.user && req.user.id) {
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
      }

      // Remove sensitive data
      const { password: _, ...userWithoutPassword } = createdUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: error.message });
    }
  });
  


  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
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
      if (req.body.plan) updates.plan = req.body.plan;
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

      // Log user update activity
      if (req.user && req.user.id) {
        await storage.createUserActivity({
          userId: req.user.id,
          activityType: "user_updated",
          resourceId: userId,
          resourceType: "user",
          metadata: {
            fields: Object.keys(updates),
          },
        });
      }

      // Remove sensitive data
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Don't allow deletion of the current user
      if (req.user && req.user.id === userId) {
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
      
      // Log user deletion activity
      if (req.user && req.user.id) {
        await storage.createUserActivity({
          userId: req.user.id,
          activityType: "user_deleted",
          resourceId: userId,
          resourceType: "user",
          metadata: {
            username: user.username,
          },
        });
      }
      
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      
      // Handle the specific error for last admin user
      if (error.message === "Cannot delete the last admin user") {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  });

  // AI Translation Routes
  app.post("/api/ai/translate", requireAuth, async (req, res) => {
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;

      if (!text || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "Text, source language, and target language are required",
        });
      }

      const translatedText = await translateText(
        text,
        sourceLanguage,
        targetLanguage,
      );
      return res.json({ translatedText });
    } catch (error: any) {
      console.error("Translation error:", error);
      return res.status(500).json({
        error: "Translation failed",
        details: error.message,
      });
    }
  });

  // Bulk translate translations (admin only)
  app.post("/api/ai/translate-bulk", requireAdmin, async (req, res) => {
    try {
      const { translations, sourceLanguage, targetLanguage } = req.body;

      if (!translations || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({
          error: "Missing required fields",
          details:
            "Translations object, source language, and target language are required",
        });
      }

      const translatedTranslationsObj = await translateTranslations(
        translations,
        sourceLanguage,
        targetLanguage,
      );

      return res.json({ translations: translatedTranslationsObj });
    } catch (error: any) {
      console.error("Bulk translation error:", error);
      return res.status(500).json({
        error: "Bulk translation failed",
        details: error.message,
      });
    }
  });

  // AI Content Generation Routes
  app.post("/api/ai/generate-content", requireAuth, async (req, res) => {
    try {
      const { prompt, contentType, tone } = req.body;

      if (!prompt || !contentType || !tone) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "Prompt, content type, and tone are required",
        });
      }

      const generatedContent = await generateContent(prompt, contentType, tone);
      return res.json({ content: generatedContent });
    } catch (error: any) {
      console.error("Content generation error:", error);
      return res.status(500).json({
        error: "Content generation failed",
        details: error.message,
      });
    }
  });

  // Analyze content
  app.post("/api/ai/analyze-content", requireAuth, async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          error: "Missing required field",
          details: "Text to analyze is required",
        });
      }

      const analysis = await analyzeContent(text);
      return res.json(analysis);
    } catch (error: any) {
      console.error("Content analysis error:", error);
      return res.status(500).json({
        error: "Content analysis failed",
        details: error.message,
      });
    }
  });

  // User Activity & Dashboard Routes

  // Get user activity feed
  app.get("/api/user/activity", requireAuth, async (req, res) => {
    try {
      const { limit } = req.query;

      const activities = await storage.getUserActivitiesByUserId(
        req.user.id,
        limit ? parseInt(limit.toString()) : 10,
      );

      res.json(activities);
    } catch (error: any) {
      console.error("Error retrieving user activities:", error);
      res.status(500).json({
        error: "Failed to retrieve user activities",
        details: error.message,
      });
    }
  });

  // Get user analytics summary
  app.get("/api/user/analytics", requireAuth, async (req, res) => {
    try {
      const analytics = await storage.getUserAnalytics(req.user.id);
      res.json(analytics || { message: "No analytics data available yet" });
    } catch (error: any) {
      console.error("Error retrieving user analytics:", error);
      res.status(500).json({
        error: "Failed to retrieve analytics data",
        details: error.message,
      });
    }
  });

  // Get user dashboard preferences
  app.get("/api/user/dashboard/preferences", requireAuth, async (req, res) => {
    try {
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
        details: error.message,
      });
    }
  });

  // Update dashboard preferences
  app.put("/api/user/dashboard/preferences", requireAuth, async (req, res) => {
    try {
      const { layout, widgets, theme, favoriteAgents, recentTasks } = req.body;

      // Get existing preferences
      let preferences = await storage.getDashboardPreference(req.user.id);

      if (!preferences) {
        // Create default preferences if none exist
        const defaultPreferences = {
          userId: req.user.id,
          layout: layout || {
            columns: 2,
            showWelcome: true,
            compactView: false,
          },
          favoriteAgents: favoriteAgents || [],
          recentTasks: recentTasks || [],
          widgets: widgets || [
            { id: "activity", position: 0, enabled: true },
            { id: "stats", position: 1, enabled: true },
            { id: "quickActions", position: 2, enabled: true },
            { id: "recentFiles", position: 3, enabled: true },
            { id: "agentStatus", position: 4, enabled: true },
          ],
          theme: theme || "system",
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
        details: error.message,
      });
    }
  });

  // Add agent to favorites
  app.post(
    "/api/user/dashboard/favorites/agent/:agentId",
    requireAuth,
    async (req, res) => {
      try {
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
          details: error.message,
        });
      }
    },
  );

  // Remove agent from favorites
  app.delete(
    "/api/user/dashboard/favorites/agent/:agentId",
    requireAuth,
    async (req, res) => {
      try {
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
          details: error.message,
        });
      }
    },
  );

  // Chatbot routes
  // Chatbot message history
  app.get("/api/chatbot/history", async (req, res) => {
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
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  // Send message to chatbot
  app.post("/api/chatbot/message", async (req, res) => {
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
  app.get("/api/chatbot/challenges", async (req, res) => {
    try {
      const difficulty = req.query.difficulty as string | undefined;
      const challenges = await getAvailableChallenges(difficulty);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  // Complete a challenge
  app.post("/api/chatbot/complete-challenge", async (req, res) => {
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
      res.status(500).json({ error: "Failed to complete challenge" });
    }
  });

  // Get user game progress
  app.get("/api/chatbot/game-progress", async (req, res) => {
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
      res.status(500).json({ error: "Failed to fetch game progress" });
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

  const httpServer = createServer(app);
  return httpServer;
}
