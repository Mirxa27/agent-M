import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { requireAdmin } from "../middleware/auth-middleware";
import { checkRequiredApiKey } from "../config";
import { credentialService } from "../services/credential-service";
import { encrypt } from "../../shared/crypto";
import { AiProvider as AiProviderSchema, insertAiModelSchema, insertAiProviderSchema } from "@shared/schema"; // Assuming insertAiProviderSchema exists
import config from "../config"; // For OpenRouter API Key check

// Dynamically import openrouterService only when needed
let openrouterService: any;
const importOpenRouterService = async () => {
  if (!openrouterService) {
    const module = await import("../services/openrouter-service");
    openrouterService = module.default;
  }
  return openrouterService;
};

export const adminAiRouter = Router();

// AI Providers Admin Endpoints
adminAiRouter.get("/ai-providers", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const providers = await storage.getAllAiProviders();
    const enhancedProviders = await Promise.all(providers.map(async (provider: AiProviderSchema) => {
      let hasApiKey = checkRequiredApiKey(provider.provider);
      if (!hasApiKey && req.user) {
        try {
          const credential = await credentialService.getCredentialByService(req.user.id, provider.provider);
          hasApiKey = !!credential;
        } catch (credError) {
          console.error("Error checking credential:", credError);
        }
      }
      return { ...provider, hasApiKey };
    }));
    res.json(enhancedProviders);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminAiRouter.get("/ai-providers/check-key/:provider", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { provider } = req.params;
    let hasApiKey = checkRequiredApiKey(provider);
    if (!hasApiKey && req.user) {
      try {
        const credential = await credentialService.getCredentialByService(req.user.id, provider);
        hasApiKey = !!credential;
      } catch (credError) {
        console.error("Error checking credential:", credError);
      }
    }
    res.json({ hasApiKey });
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminAiRouter.post("/ai-providers", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { apiKey, ...providerData } = req.body;

    // Validate with insertAiProviderSchema if available, otherwise basic validation
    // For now, assuming providerData is valid or insertAiProviderSchema handles it
    const provider = await storage.createAiProvider(providerData);

    if (apiKey && req.user) {
      await credentialService.createCredential({
        userId: req.user.id,
        name: `${provider.name} API Key`,
        type: 'api_key',
        authMethod: 'apiKey',
        data: encrypt(apiKey),
        service: provider.provider
      });
    }
    const environmentKeyExists = checkRequiredApiKey(provider.provider);
    const hasApiKey = environmentKeyExists || (apiKey ? true : false);
    res.status(201).json({ ...provider, hasApiKey });
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminAiRouter.patch("/ai-providers/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const providerId = parseInt(req.params.id);
    const { apiKey, ...providerData } = req.body;
    const updatedProvider = await storage.updateAiProvider(providerId, providerData);
    if (!updatedProvider) {
      return res.status(404).json({ error: "AI Provider not found" });
    }
    if (apiKey && req.user) {
      const existingCredential = await credentialService.getCredentialByService(req.user.id, updatedProvider.provider);
      if (existingCredential) {
        await credentialService.updateCredential(existingCredential.id, { data: encrypt(apiKey) });
      } else {
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
    const environmentKeyExists = checkRequiredApiKey(updatedProvider.provider);
    const hasApiKey = environmentKeyExists || (apiKey ? true : false);
    res.json({ ...updatedProvider, hasApiKey });
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

// AI Models Admin Routes
adminAiRouter.get("/ai-models", requireAdmin, async (req: Request, res: Response) => {
  try {
    const models = await storage.getAllAiModels();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminAiRouter.get("/openrouter/models", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) { // Check only env
      return res.status(400).json({ error: "OpenRouter not configured", details: "OpenRouter API key is missing" });
    }
    const oRouterService = await importOpenRouterService();
    const modelData = await oRouterService.getDetailedModels();
    return res.json(modelData);
  } catch (error: any) {
    console.error("Error fetching OpenRouter models:", error);
    return res.status(500).json({ error: "Failed to fetch OpenRouter models", details: handleError(error) });
  }
});

adminAiRouter.get("/ai-models/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);
    const model = await storage.getAiModel(modelId);
    if (!model) {
      return res.status(404).json({ error: "AI Model not found" });
    }
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminAiRouter.post("/ai-models", requireAdmin, async (req: Request, res: Response) => {
  try {
    const provider = await storage.getAiProvider(req.body.providerId); // providerId should be number
    if (!provider) {
      return res.status(400).json({ error: "AI Provider not found" });
    }
    const validatedData = insertAiModelSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ error: "Validation failed", details: validatedData.error.format() });
    }
    const newModel = await storage.createAiModel(validatedData.data);
    res.status(201).json(newModel);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminAiRouter.patch("/ai-models/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);
    const model = await storage.getAiModel(modelId);
    if (!model) {
      return res.status(404).json({ error: "AI Model not found" });
    }
    if (req.body.providerId) {
      const provider = await storage.getAiProvider(req.body.providerId);
      if (!provider) {
        return res.status(400).json({ error: "AI Provider not found" });
      }
    }
    const updatedModel = await storage.updateAiModel(modelId, req.body);
    res.json(updatedModel);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminAiRouter.delete("/ai-models/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);
    const prompts = await storage.getAiPromptsByModelId(modelId);
    if (prompts.length > 0) {
      return res.status(400).json({ error: "Cannot delete model while prompts are using it" });
    }
    const success = await storage.deleteAiModel(modelId);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(404).json({ error: "AI Model not found" });
    }
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

// AI Prompts Admin Routes
adminAiRouter.get("/ai-prompts", requireAdmin, async (req: Request, res: Response) => {
  try {
    const prompts = await storage.getAllAiPrompts();
    res.json(prompts);
  } catch (error) {
    console.error("Error fetching AI prompts:", error);
    res.status(500).json({ error: handleError(error) });
  }
});
// TODO: Add POST, PATCH, DELETE endpoints for /api/admin/ai-prompts/:id as needed
