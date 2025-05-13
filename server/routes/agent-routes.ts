import express, { Router, Request, Response } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { requireAuth, requireAdmin } from "../middleware/auth-middleware"; // Import requireAdmin
import { Agent, insertAgentSchema } from "@shared/schema";
import { workflowTemplates, WorkflowTemplate } from "../../shared/agent-tools-templates"; // Import workflow templates and interface

export const agentRouter = Router();

// Agent routes
agentRouter.get("/agents", requireAuth, async (req: Request, res: Response) => {
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

agentRouter.get("/agent-templates", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const templates = await storage.getAgentTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

agentRouter.get("/agents/status", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const agents = await storage.getAgentsByUserId(req.user.id);
    const agentCounts = {
      total: agents.length,
      active: agents.filter((agent: Agent) => agent.isActive === true).length,
      inactive: agents.filter((agent: Agent) => agent.isActive === false || agent.isActive === undefined).length,
    };
    res.json(agentCounts);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

agentRouter.get("/agents/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const agent = await storage.getAgent(parseInt(req.params.id));
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    if (agent.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

agentRouter.post("/agents", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
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

agentRouter.patch("/agents/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const agentId = parseInt(req.params.id);
    const agent = await storage.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    if (agent.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updates: Partial<Agent> = {};
    // Direct properties of Agent model
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.icon !== undefined) updates.icon = req.body.icon;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.type !== undefined) updates.type = req.body.type; // Added type based on schema
    if (req.body.tools !== undefined) updates.tools = req.body.tools; // Added tools based on schema

    // Handle config updates, including systemPrompt
    let currentConfig = agent.config as Record<string, any> || {};
    let configChanged = false;

    if (req.body.config && typeof req.body.config === 'object') {
      currentConfig = { ...currentConfig, ...req.body.config };
      configChanged = true;
    }
    if (req.body.systemPrompt !== undefined) {
      currentConfig.systemPrompt = req.body.systemPrompt;
      configChanged = true;
    }

    if (configChanged) {
      updates.config = currentConfig;
    }

    // 'isPublic' is not in the schema, so it's removed.
    // 'isTemplate' could be updatable, but typically by admins or specific logic.
    // 'taskCount' is usually managed internally.

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update provided." });
    }

    const updatedAgent = await storage.updateAgent(agentId, updates);
    res.json(updatedAgent);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

agentRouter.delete("/agents/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const agentId = parseInt(req.params.id);
    const agent = await storage.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    if (agent.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    await storage.deleteAgent(agentId);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});
