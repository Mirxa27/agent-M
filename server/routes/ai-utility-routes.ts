import { Router, Request, Response } from "express";
import aiService from "../services/ai-service";
import { handleError } from "../utils/errorHandler";
import { requireAuth, requireAdmin } from "../middleware/auth-middleware";
import { storage } from "../storage"; // Correct import

export const aiUtilityRouter = Router();

// AI Translation Routes
aiUtilityRouter.post("/ai/translate", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;
    if (!text || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Text, source language, and target language are required",
      });
    }
    const translatedText = await aiService.translateText(text, sourceLanguage, targetLanguage);
    return res.json({ translatedText });
  } catch (error: any) {
    console.error("Translation error:", error);
    return res.status(500).json({
      error: "Translation failed",
      details: handleError(error),
    });
  }
});

aiUtilityRouter.post("/ai/translate-bulk", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { translations, sourceLanguage, targetLanguage } = req.body;
    if (!translations || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Translations object, source language, and target language are required",
      });
    }
    const translatedTranslationsObj = await aiService.translateTranslations(
      translations,
      sourceLanguage,
      targetLanguage,
    );
    return res.json({ translations: translatedTranslationsObj });
  } catch (error: any) {
    console.error("Bulk translation error:", error);
    return res.status(500).json({
      error: "Bulk translation failed",
      details: handleError(error),
    });
  }
});

// AI Content Generation Routes
aiUtilityRouter.post("/ai/generate-content", requireAuth, async (req: Request, res: Response) => {
  try {
    const { prompt, contentType, tone } = req.body;
    if (!prompt || !contentType || !tone) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Prompt, content type, and tone are required",
      });
    }
    const generatedContent = await aiService.generateContent(prompt, contentType, tone);
    return res.json({ content: generatedContent });
  } catch (error: any) {
    console.error("Content generation error:", error);
    return res.status(500).json({
      error: "Content generation failed",
      details: handleError(error),
    });
  }
});

// Analyze content
aiUtilityRouter.post("/ai/analyze-content", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({
        error: "Missing required field",
        details: "Text to analyze is required",
      });
    }
    const analysis = await aiService.analyzeContent(text);
    return res.json(analysis);
  } catch (error: any) {
    console.error("Content analysis error:", error);
    return res.status(500).json({
      error: "Content analysis failed",
      details: handleError(error),
    });
  }
});

// Image generation route
aiUtilityRouter.post("/ai/generate-image", requireAuth, async (req: Request, res: Response) => {
  try {
    const { prompt, size, n } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const imageResponse = await aiService.generateImageOpenAI(prompt, size, n);
    res.json(imageResponse);
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// Code generation route
aiUtilityRouter.post("/ai/generate-code", requireAuth, async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const codeResponse = await aiService.generateCode(prompt);
    res.json(codeResponse);
  } catch (error) {
    console.error("Error generating code:", error);
    res.status(500).json({ error: "Failed to generate code" });
  }
});
