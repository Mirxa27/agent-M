import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { requireAuth } from "../middleware/auth-middleware";
import { insertUserDocumentTemplateSchema, UserDocumentTemplate } from "@shared/schema";
import { z } from "zod";

export const userDocumentTemplateRouter = Router();

// Get all templates for the authenticated user
userDocumentTemplateRouter.get("/user-document-templates", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const templates = await storage.getUserDocumentTemplates(req.user.id);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching user document templates:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

// Get a specific template by ID
userDocumentTemplateRouter.get("/user-document-templates/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const templateId = parseInt(req.params.id);
    const template = await storage.getUserDocumentTemplate(templateId);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    if (template.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to access this template" });
    }
    res.json(template);
  } catch (error) {
    console.error("Error fetching user document template:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

// Create a new template
userDocumentTemplateRouter.post("/user-document-templates", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const validatedData = insertUserDocumentTemplateSchema.safeParse({
      ...req.body,
      userId: req.user.id,
    });

    if (!validatedData.success) {
      return res.status(400).json({ error: "Validation failed", details: validatedData.error.format() });
    }

    const newTemplate = await storage.createUserDocumentTemplate(validatedData.data);
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error("Error creating user document template:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

// Update an existing template
userDocumentTemplateRouter.patch("/user-document-templates/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const templateId = parseInt(req.params.id);
    const existingTemplate = await storage.getUserDocumentTemplate(templateId);

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }
    if (existingTemplate.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this template" });
    }

    // Validate only the fields present in the request body
    const partialSchema = insertUserDocumentTemplateSchema.partial();
    const validatedData = partialSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({ error: "Validation failed", details: validatedData.error.format() });
    }

    const updatedTemplate = await storage.updateUserDocumentTemplate(templateId, validatedData.data);
    res.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating user document template:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

// Delete a template
userDocumentTemplateRouter.delete("/user-document-templates/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const templateId = parseInt(req.params.id);
    const template = await storage.getUserDocumentTemplate(templateId);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    if (template.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this template" });
    }

    await storage.deleteUserDocumentTemplate(templateId);
    res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting user document template:", error);
    res.status(500).json({ error: handleError(error) });
  }
});
