import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { AiProvider } from "@shared/schema"; // Corrected import
import { checkRequiredApiKey } from "../config";
import { credentialService } from "../services/credential-service";

export const publicRouter = Router();

// Publicly accessible plans
publicRouter.get("/plans", async (req: Request, res: Response) => {
  try {
    const plans = await storage.getActivePlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

// AI Providers Status Endpoint for dashboard (publicly accessible for now, might need auth later)
publicRouter.get("/ai-providers/status", async (req: Request, res: Response) => {
  try {
    const activeProviders = await storage.getActiveAiProviders();

    const providerStatus = activeProviders.map((provider: AiProvider) => ({ // Corrected type
      id: provider.provider,
      name: provider.name,
      status: provider.isActive ? 'active' : 'inactive',
      quotaUsed: 0,
      quotaLimit: 100,
      quotaUnit: 'USD'
    }));

    res.json(providerStatus);
  } catch (error) {
    console.error("Error fetching AI provider status:", error);
    res.status(500).json({ error: handleError(error) });
  }
});
