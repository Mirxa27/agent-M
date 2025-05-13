import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { requireAuth } from "../middleware/auth-middleware";
import { AgentTool } from "@shared/schema";

export const agentToolsRouter = Router();

// User accessible agent tools (for agent task execution)
agentToolsRouter.get("/agent-tools", requireAuth, async (req: Request, res: Response) => {
  try {
    const tools = await storage.getAllAgentTools();
    const activeTools = tools.filter((tool: AgentTool) => tool.isActive);
    res.json(activeTools);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

agentToolsRouter.get("/agent-tools/category/:category", requireAuth, async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    const tools = await storage.getAgentToolsByCategory(category);
    const activeTools = tools.filter((tool: AgentTool) => tool.isActive);
    res.json(activeTools);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});
