import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { requireAuth } from "../middleware/auth-middleware";
import { insertFileSchema } from "@shared/schema";

export const fileTemplateRouter = Router();

// File routes
fileTemplateRouter.get("/files", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const files = await storage.getFilesByUserId(req.user.id);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

fileTemplateRouter.get("/files/recent", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 5;
    // Assuming getFilesByUserId can handle a limit or we fetch all and slice.
    // For now, let's assume it fetches all and we might need to adjust if performance is an issue.
    const files = await storage.getFilesByUserId(req.user.id);
    res.json(files.slice(0, limit)); // Simple slice, might need ordering by date in storage layer
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

fileTemplateRouter.get("/files/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const file = await storage.getFile(parseInt(req.params.id));
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    if (file.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

fileTemplateRouter.post("/files", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
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
    res.status(500).json({ error: handleError(error) });
  }
});

fileTemplateRouter.delete("/files/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const fileId = parseInt(req.params.id);
    const file = await storage.getFile(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    if (file.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    await storage.deleteFile(fileId);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

// Template routes
fileTemplateRouter.get("/templates", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const templates = await storage.getTemplatesByUserId(req.user.id);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});
