import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { db } from "./db";
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
  aiModels,
  aiPrompts
} from "@shared/schema";
import { encrypt, decrypt } from "../shared/crypto";
import { paymentService } from "./services/payment-service";

export async function registerRoutes(app: Express): Promise<Server> {
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
        userId: req.user.id
      });
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validatedData.error.format() 
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
      const sanitizedCredentials = credentials.map(cred => {
        const { data, ...rest } = cred;
        return rest;
      });
      res.json(sanitizedCredentials);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      
      // Decrypt the credential data
      const decryptedData = decrypt(credential.data);
      
      // Return credential with decrypted data
      res.json({
        ...credential,
        data: JSON.parse(decryptedData)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/credentials", requireAuth, async (req, res) => {
    try {
      // Encrypt the credential data
      const encryptedData = encrypt(JSON.stringify(req.body.data));
      
      // Validate and create credential
      const validatedData = insertCredentialSchema.safeParse({
        userId: req.user.id,
        name: req.body.name,
        type: req.body.type,
        data: encryptedData
      });
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validatedData.error.format() 
        });
      }
      
      const credential = await storage.createCredential(validatedData.data);
      
      // Don't include sensitive data in the response
      const { data, ...credentialWithoutData } = credential;
      res.status(201).json(credentialWithoutData);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      
      // Update credential
      const updates: any = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.type) updates.type = req.body.type;
      if (req.body.data) {
        updates.data = encrypt(JSON.stringify(req.body.data));
      }
      
      const updatedCredential = await storage.updateCredential(credentialId, updates);
      
      // Don't include sensitive data in the response
      const { data, ...credentialWithoutData } = updatedCredential;
      res.json(credentialWithoutData);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
        userId: req.user.id
      });
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validatedData.error.format() 
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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
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
        return res.status(403).json({ error: "Not authorized to use this agent" });
      }
      
      // Validate and create task
      const validatedData = insertTaskSchema.safeParse({
        ...req.body,
        userId: req.user.id
      });
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validatedData.error.format() 
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
        taskId
      });
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validatedData.error.format() 
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
  app.post("/api/tasks/:taskId/files/:fileId", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const fileId = parseInt(req.params.fileId);
      
      // Verify task exists and user owns it
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      if (task.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to access this task" });
      }
      
      // Verify file exists and user owns it
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      if (file.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to access this file" });
      }
      
      // Link file to task
      const taskFile = await storage.linkFileToTask(taskId, fileId);
      res.status(201).json({ success: true, taskFile });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Unlink a file from a task
  app.delete("/api/tasks/:taskId/files/:fileId", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const fileId = parseInt(req.params.fileId);
      
      // Verify task exists and user owns it
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      if (task.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to access this task" });
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
  });

  // Admin routes
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
      const updatedProvider = await storage.updateAiProvider(providerId, req.body);
      
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
          details: validatedData.error.format() 
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
          error: "Cannot delete model while prompts are using it" 
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
          details: validatedData.error.format() 
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
        parseInt(planId)
      );
      
      res.json(paymentSession);
    } catch (error: any) {
      console.error("Payment session creation error:", error);
      res.status(500).json({ error: error.message || "Failed to create payment session" });
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
      const verification = await paymentService.verifyPayment(paymentId.toString());
      
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
      res.redirect(`/payment-failed?reason=${encodeURIComponent(error.message || "Unknown error")}`);
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
      const verification = await paymentService.verifyPayment(PaymentId.toString());
      
      if (!verification.isValid) {
        console.error("Payment verification failed in webhook", { PaymentId, InvoiceId });
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
      res.status(500).json({ error: error.message || "Webhook processing failed" });
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
        planDetails: plan
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to retrieve subscription information" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
