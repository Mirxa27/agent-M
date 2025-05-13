import { AgentTool, Task } from "@shared/schema";
import anthropicService from "./anthropic-service";
import openaiService, { AIMessage, AgentResponse } from "./openai-service";
export { AIMessage } from "./openai-service"; // Re-export AIMessage
import openrouterService from "./openrouter-service";
import perplexityService from "./perplexity-service";
import xaiService from "./xai-service";
import OpenAI from "openai";
import type { ImagesResponse } from "openai/resources/images";
import config from "../config";
import { handleError } from "../utils/errorHandler";

const openai = new OpenAI({ apiKey: config.ai.openai.apiKey });

export type AIProvider = "openai" | "anthropic" | "perplexity" | "xai" | "openrouter";

export interface AgentConfig { // Add export
  provider: AIProvider;
  model?: string;
  systemInstructions?: string;
  tools?: AgentTool[];
}

export async function processTask(
  task: Task,
  config: AgentConfig,
  previousMessages: AIMessage[] = []
): Promise<AgentResponse> {
  const { provider, model, systemInstructions, tools } = config;

  try {
    switch (provider) {
      case "openai":
        return await openaiService.processTask(
          task,
          {
            provider,
            model: model || "gpt-4o",
            systemInstructions
          },
          previousMessages,
          tools || []
        );

      case "anthropic":
        return await anthropicService.processTask(
          task,
          model || "claude-3-7-sonnet-20250219",
          systemInstructions,
          previousMessages
        );

      case "perplexity":
        return await perplexityService.processTask(
          task,
          model || "llama-3.1-sonar-small-128k-online",
          systemInstructions,
          previousMessages
        );

      case "xai":
        return await xaiService.processTask(
          task,
          model || "grok-2-1212",
          systemInstructions,
          previousMessages
        );

      case "openrouter":
        return await openrouterService.processAgentTask(
          task,
          {
            provider: "openrouter",
            model: model || "openai/gpt-4o",
            systemPrompt: systemInstructions
          },
          previousMessages
        );

      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Error processing task with ${provider}:`, msg);
    throw new Error(`AI processing error: ${msg}`);
  }
}

export async function analyzeImage(
  imageUrl: string,
  prompt: string,
  provider: AIProvider,
  model?: string
): Promise<string> {
  try {
    switch (provider) {
      case "openai":
        return await openaiService.analyzeImage(
          imageUrl,
          prompt,
          model || "gpt-4o"
        );

      case "anthropic": {
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString("base64");
        return await anthropicService.analyzeImage(
          base64Image,
          prompt,
          model || "claude-3-7-sonnet-20250219"
        );
      }

      case "xai":
        return await xaiService.analyzeImage(
          imageUrl,
          prompt,
          model || "grok-2-vision-1212"
        );

      case "perplexity":
        throw new Error("Image analysis not supported with Perplexity");

      case "openrouter":
        return await openrouterService.analyzeImage(
          imageUrl,
          prompt,
          "openrouter",
          model || "openai/gpt-4-vision"
        );

      default:
        return ""; // Return a default value for unsupported providers
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Error analyzing image with ${provider}:`, msg);
    return ""; // Returning a default value for now
  }
}

export async function generateImage(
  prompt: string,
  size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024",
  provider: AIProvider = "openai"
): Promise<string> {
  try {
    if (provider === "openrouter") {
      return await openrouterService.generateImage(prompt, size);
    } else {
      return await openaiService.generateImage(prompt, size);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Error generating image with ${provider}:`, msg);

    if (provider === "openai" && process.env.OPENROUTER_API_KEY) {
      try {
        console.log("Falling back to OpenRouter for image generation");
        return await openrouterService.generateImage(prompt, size);
      } catch (fallbackError) {
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error("Fallback to OpenRouter also failed:", fallbackMsg);
        throw new Error(`Image generation error: ${msg}`);
      }
    }

    throw new Error(`Image generation error: ${msg}`);
  }
}

export async function generateImageOpenAI(prompt: string, size: "256x256" | "512x512" | "1024x1024" = "1024x1024", n: number = 1): Promise<ImagesResponse> {
  try {
    const response = await openai.images.generate({
      prompt,
      size,
      n,
    });
    return response;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image");
  }
}

export async function translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  const task: Task = {
    id: 0,
    title: `Translate from ${sourceLanguage} to ${targetLanguage}`,
    description: text,
    status: "in_progress",
    userId: 0,
    createdAt: new Date(),
    agentId: 0,
    completedAt: null,
    result: null
  };

  const config: AgentConfig = {
    provider: "openai",
    model: "gpt-4o",
    systemInstructions: `You are a professional translator. Translate text from ${sourceLanguage} to ${targetLanguage} accurately and naturally. Preserve meaning and tone.`
  };

  const response = await processTask(task, config);
  return response.content;
}

export async function translateTranslations(
  translations: Record<string, string>,
  sourceLanguage: string,
  targetLanguage: string
): Promise<Record<string, string>> {
  const textToTranslate = Object.entries(translations).map(([key, value]) => `${key}: ${value}`).join("\n");

  const task: Task = {
    id: 0,
    title: `Bulk Translation from ${sourceLanguage} to ${targetLanguage}`,
    description: textToTranslate,
    status: "in_progress",
    userId: 0,
    createdAt: new Date(),
    agentId: 0,
    completedAt: null,
    result: null,
  };

  const config: AgentConfig = {
    provider: "openai",
    model: "gpt-4o",
    systemInstructions: `You are a professional translator specializing in localization. Translate the following key-value pairs from ${sourceLanguage} to ${targetLanguage} accurately and naturally. Preserve meaning, tone, and formatting.  Return a valid JSON object with the translated values.

Input format:
key1: value1
key2: value2
...

Output format:
{
  "key1": "translated value1",
  "key2": "translated value2",
  ...
}`
  };

  const response = await processTask(task, config);

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error("Failed to parse translation response:", error);
    throw new Error("Failed to parse translated content");
  }
}

export async function generateContent(prompt: string, contentType: string, tone: string): Promise<string> {
  const task: Task = {
    id: 0,
    title: `Content Generation: ${contentType}`,
    description: prompt,
    status: "in_progress",
    userId: 0,
    createdAt: new Date(),
    agentId: 0,
    completedAt: null,
    result: null
  };

  const config: AgentConfig = {
    provider: "openai",
    model: "gpt-4o",
    systemInstructions: `You are a professional content creator specializing in ${contentType}. Create content with a ${tone} tone. Be creative, engaging, and authentic.`
  };

  const response = await processTask(task, config);
  return response.content;
}

export async function analyzeContent(text: string): Promise<any> {
  const task: Task = {
    id: 0,
    title: "Content Analysis",
    description: text,
    status: "in_progress",
    userId: 0,
    createdAt: new Date(),
    agentId: 0,
    completedAt: null,
    result: null
  };

  const config: AgentConfig = {
    provider: "openai",
    model: "gpt-4o",
    systemInstructions: `You are a professional content analyst. Analyze text for sentiment (positive, negative, neutral), readability (grade level), key themes, and provide suggestions for improvement. Return your analysis in JSON format.`
  };

  const response = await processTask(task, config);

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error("Failed to parse analysis response:", error);
    return {
      analysis: response.content,
      error: "Could not parse as JSON"
    };
  }
}

export async function generateCode(prompt: string): Promise<{ html: string; css: string; js: string; }> {
  try {
    const task: Task = {
      id: 0,
      title: "Code Generation",
      description: prompt,
      status: "in_progress",
      userId: 0,
      createdAt: new Date(),
      agentId: 0,
      completedAt: null,
      result: null,
    };

    const config: AgentConfig = {
      provider: "openai",
      model: "gpt-4o",
      systemInstructions: `You are a professional web developer.  Generate clean and functional HTML, CSS, and JavaScript code based on the following prompt.  Return your code as a JSON object with 'html', 'css', and 'js' keys.`
    };

    const response = await processTask(task, config);

    try {
      const code = JSON.parse(response.content);
      return {
        html: code.html || "",
        css: code.css || "",
        js: code.js || ""
      };
    } catch (error) {
      console.error("Error parsing code generation response:", error);
      return {
        html: response.content,
        css: "",
        js: ""
      };
    }
  } catch (error) {
    console.error("Error generating code:", error);
    throw new Error("Failed to generate code");
  }
}

export default {
  processTask,
  analyzeImage,
  generateImage,
  translateText,
  translateTranslations,
  generateContent,
  analyzeContent,
  generateImageOpenAI,
  generateCode,
};
