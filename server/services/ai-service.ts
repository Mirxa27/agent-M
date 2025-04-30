import { AgentTask } from "@shared/schema";
import { AIMessage, AgentResponse } from "./openai-service";
import openaiService from "./openai-service";
import anthropicService from "./anthropic-service";
import perplexityService from "./perplexity-service";
import xaiService from "./xai-service";
import openrouterService from "./openrouter-service";

// Provider types
export type AIProvider = "openai" | "anthropic" | "perplexity" | "xai" | "openrouter";

interface AgentConfig {
  provider: AIProvider;
  model?: string;
  systemInstructions?: string;
}

/**
 * Main service to process AI tasks across multiple providers
 */
export async function processTask(
  task: AgentTask,
  config: AgentConfig,
  previousMessages: AIMessage[] = []
): Promise<AgentResponse> {
  const { provider, model, systemInstructions } = config;
  
  try {
    switch (provider) {
      case "openai":
        return await openaiService.processTask(
          task,
          model || "gpt-4o",
          systemInstructions,
          previousMessages
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
    console.error(`Error processing task with ${provider}:`, error);
    throw new Error(`AI processing error: ${error.message}`);
  }
}

/**
 * Process an image analysis task using the appropriate provider
 */
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
        // For Anthropic, we need to convert URL to base64 first
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
        throw new Error(`Unsupported AI provider for image analysis: ${provider}`);
    }
  } catch (error) {
    console.error(`Error analyzing image with ${provider}:`, error);
    throw new Error(`Image analysis error: ${error.message}`);
  }
}

/**
 * Generate an image using DALL-E (OpenAI only)
 */
export async function generateImage(
  prompt: string,
  size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024",
  provider: AIProvider = "openai"
): Promise<string> {
  try {
    if (provider === "openrouter") {
      return await openrouterService.generateImage(prompt, size);
    } else {
      // Default to OpenAI's DALL-E
      return await openaiService.generateImage(prompt, size);
    }
  } catch (error) {
    console.error(`Error generating image with ${provider}:`, error);
    
    // If OpenAI fails, try OpenRouter as fallback
    if (provider === "openai" && process.env.OPENROUTER_API_KEY) {
      try {
        console.log("Falling back to OpenRouter for image generation");
        return await openrouterService.generateImage(prompt, size);
      } catch (fallbackError) {
        console.error("Fallback to OpenRouter also failed:", fallbackError);
        throw new Error(`Image generation error: ${error.message}`);
      }
    }
    
    throw new Error(`Image generation error: ${error.message}`);
  }
}

// Translation related functions (used in routes.ts)
export async function translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  const task: AgentTask = {
    id: 0,
    title: "Translation",
    description: "Translate text",
    content: `Translate the following text from ${sourceLanguage} to ${targetLanguage}:\n\n${text}`,
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
  // Create a string with all keys and values to translate in one go
  const keysToTranslate = Object.keys(translations);
  const textsToTranslate = keysToTranslate.map(key => translations[key]);
  
  const task: AgentTask = {
    id: 0,
    title: "Bulk Translation",
    description: "Translate multiple texts",
    content: `Translate the following JSON object from ${sourceLanguage} to ${targetLanguage}. Keep the same keys but translate all values:\n\n${JSON.stringify(translations, null, 2)}\n\nRespond with the translated JSON object only.`,
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
    systemInstructions: `You are a professional translator specializing in JSON localization files. Translate the values from ${sourceLanguage} to ${targetLanguage} accurately and naturally. Preserve meaning and tone. Return a valid JSON object with the same keys.`
  };
  
  const response = await processTask(task, config);
  
  try {
    // Extract JSON from the response
    const responseText = response.content;
    const jsonStartIndex = responseText.indexOf('{');
    const jsonEndIndex = responseText.lastIndexOf('}') + 1;
    
    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
      const jsonStr = responseText.substring(jsonStartIndex, jsonEndIndex);
      return JSON.parse(jsonStr);
    } else {
      // Fallback to simple parsing
      return JSON.parse(responseText);
    }
  } catch (error) {
    console.error("Failed to parse translation response:", error);
    throw new Error("Failed to parse translated content");
  }
}

// Content generation function used in routes.ts
export async function generateContent(prompt: string, contentType: string, tone: string): Promise<string> {
  const task: AgentTask = {
    id: 0,
    title: "Content Generation",
    description: `Generate ${contentType} content with ${tone} tone`,
    content: prompt,
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

// Content analysis function used in routes.ts
export async function analyzeContent(text: string): Promise<any> {
  const task: AgentTask = {
    id: 0,
    title: "Content Analysis",
    description: "Analyze content for sentiment, readability, and key themes",
    content: `Analyze the following content and provide a detailed report on sentiment, readability score, key themes, and suggestions for improvement:\n\n${text}`,
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
    // Extract JSON from the response
    const responseText = response.content;
    const jsonStartIndex = responseText.indexOf('{');
    const jsonEndIndex = responseText.lastIndexOf('}') + 1;
    
    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
      const jsonStr = responseText.substring(jsonStartIndex, jsonEndIndex);
      return JSON.parse(jsonStr);
    } else {
      // Fallback to simple parsing if possible
      return JSON.parse(responseText);
    }
  } catch (error) {
    console.error("Failed to parse analysis response:", error);
    // Return text response if JSON parsing fails
    return { 
      analysis: response.content,
      error: "Could not parse as JSON" 
    };
  }
}

export default {
  processTask,
  analyzeImage,
  generateImage,
  translateText,
  translateTranslations,
  generateContent,
  analyzeContent
};