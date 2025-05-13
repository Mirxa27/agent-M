import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { requireAuth, requireAdmin } from "../middleware/auth-middleware"; // requireAuth might not be needed if all are requireAdmin
import { AgentTool, agentTools, insertAgentToolSchema } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads (copied from server/routes.ts)
const storage_engine = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file, cb) => {
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
  fileFilter: (req: Request, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, gif, svg) are allowed!"));
  }
});

export const adminMiscRouter = Router();

// Simple endpoint to check if user has admin access - for testing
adminMiscRouter.get("/check", requireAdmin, (req: Request, res: Response) => {
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
adminMiscRouter.post("/upload-logo", requireAdmin, upload.single('logo'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      const existingSettings = await storage.getSiteSettings();
      if (existingSettings) {
        await storage.updateSiteSettings({
          logo: {
            ...((existingSettings.logo && typeof existingSettings.logo === 'object') ? existingSettings.logo : {}),
            url: fileUrl
          }
        });
      }
      res.status(200).json({
        success: true,
        url: fileUrl,
        message: "Logo uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ error: handleError(error) });
    }
  });


// Site Settings Admin Route
adminMiscRouter.patch("/site-settings", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const updates = req.body;
    updates.updatedBy = req.user.id;
    let settings = await storage.getSiteSettings();
    if (!settings) {
      settings = await storage.createDefaultSiteSettings();
    }
     if (!settings && storage.createDefaultSiteSettings) {
        settings = await storage.createDefaultSiteSettings();
      }
    const updatedSettings = await storage.updateSiteSettings(updates);
    if (!updatedSettings) {
      return res.status(500).json({ error: "Failed to update site settings" });
    }
    res.json(updatedSettings);
  } catch (error) {
    console.error("Error updating site settings:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

// Agent Tools Admin Routes
adminMiscRouter.get("/agent-tools", requireAdmin, async (req: Request, res: Response) => {
  try {
    const tools = await storage.getAllAgentTools();
    res.json(tools);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminMiscRouter.get("/agent-tools/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const toolId = parseInt(req.params.id);
    const tool = await storage.getAgentTool(toolId);
    if (!tool) {
      return res.status(404).json({ error: "Agent Tool not found" });
    }
    res.json(tool);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminMiscRouter.post("/agent-tools", requireAdmin, async (req: Request, res: Response) => {
  try {
    const validatedData = insertAgentToolSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ error: "Validation failed", details: validatedData.error.format() });
    }
    const tool = await storage.createAgentTool(validatedData.data);
    res.status(201).json(tool);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminMiscRouter.patch("/agent-tools/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const toolId = parseInt(req.params.id);
    const tool = await storage.getAgentTool(toolId);
    if (!tool) {
      return res.status(404).json({ error: "Agent Tool not found" });
    }
    const updatedTool = await storage.updateAgentTool(toolId, req.body);
    res.json(updatedTool);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminMiscRouter.delete("/agent-tools/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const toolId = parseInt(req.params.id);
    const tool = await storage.getAgentTool(toolId);
    if (!tool) {
      return res.status(404).json({ error: "Agent Tool not found" });
    }
    if (tool.isSystem) {
      return res.status(403).json({ error: "Cannot delete system tools" });
    }
    await storage.deleteAgentTool(toolId);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

// Plans Admin Routes
adminMiscRouter.get("/plans", requireAdmin, async (req: Request, res: Response) => {
  try {
    const plans = await storage.getAllPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminMiscRouter.post("/plans", requireAdmin, async (req: Request, res: Response) => {
  try {
    const plan = await storage.createPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminMiscRouter.patch("/plans/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const updatedPlan = await storage.updatePlan(planId, req.body);
    if (!updatedPlan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    res.json(updatedPlan);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

// API endpoint to register AI agent tools (moved from main routes.ts)
adminMiscRouter.post("/register-tools", requireAdmin, async (req: Request, res: Response) => {
    try {
      const tools = [
        { name: "OpenAI Chat", description: "Connect with OpenAI's GPT models for natural language tasks", category: "ai", type: "ai", icon: "sparkles", isActive: true, isSystem: true, config: { provider: "openai", models: ["gpt-4o", "gpt-4-turbo", "gpt-4o-mini"], capabilities: ["text generation", "instruction following", "creative writing", "summarization", "code generation"]}},
        { name: "Anthropic Claude", description: "Use Anthropic's Claude models for nuanced and safe outputs", category: "ai", type: "ai", icon: "brain", isActive: true, isSystem: true, config: { provider: "anthropic", models: ["claude-3-7-sonnet-20250219", "claude-3-5-sonnet", "claude-3-haiku"], capabilities: ["text generation", "instruction following", "creative writing", "document analysis", "nuanced reasoning"]}},
        { name: "Perplexity AI", description: "Leverage Perplexity for real-time research and information gathering", category: "research", type: "research", icon: "search", isActive: true, isSystem: true, config: { provider: "perplexity", models: ["llama-3.1-sonar-small-128k-online", "llama-3.1-sonar-large-128k-online"], capabilities: ["online search", "fact verification", "current information", "research synthesis", "citation"]}},
        { name: "Grok by xAI", description: "Utilize Grok for analytical and technical tasks", category: "ai", type: "ai", icon: "zap", isActive: true, isSystem: true, config: { provider: "xai", models: ["grok-2-1212", "grok-2-vision-1212"], capabilities: ["analytical reasoning", "technical explanations", "real-time data analysis", "image understanding"]}},
        { name: "Code Generator", description: "Generate code in various programming languages", category: "code", type: "code", icon: "code", isActive: true, isSystem: true, config: { provider: "openai", models: ["gpt-4o"], capabilities: ["code generation", "debugging", "optimization", "documentation"]}},
        { name: "Data Analyzer", description: "Analyze datasets and provide insights", category: "data", type: "data", icon: "barChart", isActive: true, isSystem: true, config: { provider: "openai", supportedProviders: ["openai", "xai", "perplexity"], models: ["gpt-4o", "grok-2-1212"], capabilities: ["data analysis", "visualization recommendations", "statistical inference", "trend identification"]}},
        { name: "Content Optimizer", description: "Improve and optimize existing content", category: "content", type: "content", icon: "fileText", isActive: true, isSystem: true, config: { provider: "openai", supportedProviders: ["openai", "anthropic"], models: ["gpt-4o", "claude-3-7-sonnet-20250219"], capabilities: ["content improvement", "tone adjustment", "SEO optimization", "readability enhancement"]}}
      ];
      const existingTools = await db.select().from(agentTools);
      const existingToolNames = existingTools.map(tool => tool.name);
      let added = 0;
      let updated = 0;
      for (const tool of tools) {
        if (!tool.type) { console.warn(`Tool '${tool.name}' is missing 'type'. Skipping.`); continue; }
        if (!existingToolNames.includes(tool.name)) {
          const newTool = { ...tool, isSystem: true, createdAt: new Date(), updatedAt: new Date() };
          await db.insert(agentTools).values(newTool);
          added++;
        } else {
          const existingTool = existingTools.find(t => t.name === tool.name);
          if (existingTool) {
            const updateSet: Partial<typeof agentTools.$inferSelect> = { description: tool.description, category: tool.category, icon: tool.icon, isActive: tool.isActive, isSystem: true, config: tool.config, updatedAt: new Date(), type: tool.type };
            await db.update(agentTools).set(updateSet).where(eq(agentTools.id, existingTool.id));
            updated++;
          }
        }
      }
      res.json({ success: true, message: `Successfully registered tools: ${added} added, ${updated} updated` });
    } catch (error) {
      console.error("Error registering tools:", error);
      res.status(500).json({ error: "Failed to register tools" });
    }
  });
