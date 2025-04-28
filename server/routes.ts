import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { db, checkDatabaseConnection } from "./db";
import { eq, count } from "drizzle-orm";
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
} from "@shared/schema";
import { encrypt, decrypt } from "../shared/crypto";
import { paymentService } from "./services/payment-service";
import {
  translateText,
  translateTranslations,
  generateContent,
  analyzeContent,
} from "./services/openai-service";

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
        details: error.message,
      });
    }
  });

  // Set up authentication routes
  setupAuth(app);

  // Authentication middleware
  const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  };

  // Admin middleware
  const requireAdmin = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    next();
  };

  // API routes
  // Get user profile
  app.get("/api/profile", requireAuth, (req, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Update user profile
  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const updates = {};

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
      res.status(500).json({ error: error.message });
    }
  });

  // Agent routes
  app.get("/api/agents", requireAuth, async (req, res) => {
    try {
      const agents = await storage.getAgentsByUserId(req.user.id);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agents/:id", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/agents/:id", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/agents/:id", requireAuth, async (req, res) => {
    try {
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
      res.status(500).json({ error: error.message });
    }
  });

  // Credential routes
  app.get("/api/credentials", requireAuth, async (req, res) => {
    try {
      const credentials = await storage.getCredentialsByUserId(req.user.id);
      // Don't include sensitive data in the response
      const sanitizedCredentials = credentials.map((cred) => {
        const { data, ...rest } = cred;
        return rest;
      });
      res.json(sanitizedCredentials);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      res.status(500).json({ error: "Failed to fetch credentials" });
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

  // File/Template routes
  app.get("/api/files", requireAuth, async (req, res) => {
    try {
      const files = await storage.getFilesByUserId(req.user.id);
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
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: error.message });
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

  // AI Providers
  app.get("/api/admin/ai-providers", requireAdmin, async (req, res) => {
    try {
      const providers = await storage.getAllAiProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/ai-providers", requireAdmin, async (req, res) => {
    try {
      const provider = await storage.createAiProvider(req.body);
      res.status(201).json(provider);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/ai-providers/:id", requireAdmin, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const updatedProvider = await storage.updateAiProvider(
        providerId,
        req.body,
      );

      if (!updatedProvider) {
        return res.status(404).json({ error: "AI Provider not found" });
      }

      res.json(updatedProvider);
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

      // Remove sensitive data
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}
