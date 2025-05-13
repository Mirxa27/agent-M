import { Router, Request, Response } from "express";
import * as documentTemplateService from "../services/document-template-service";
import { handleError } from "../utils/errorHandler";
import { requireAuth } from "../middleware/auth-middleware";

export const documentTemplateRouter = Router();

// Document Template Routes
documentTemplateRouter.get("/document-templates", requireAuth, async (req: Request, res: Response) => {
  try {
    const templates = await documentTemplateService.listDocumentTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching document templates:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

documentTemplateRouter.get("/document-templates/:templateId", requireAuth, async (req: Request, res: Response) => {
  try {
    const templateId = req.params.templateId;
    const content = await documentTemplateService.getDocumentTemplateContent(templateId);
    if (content === null) {
      return res.status(404).json({ error: "Template not found or invalid ID" });
    }
    res.type("text/markdown").send(content);
  } catch (error) {
    console.error(`Error fetching template ${req.params.templateId}:`, error);
    res.status(500).json({ error: handleError(error) });
  }
});
