import { AgentTask } from "@shared/schema";
import { AIMessage, AgentResponse } from "./openai-service";
import openaiService from "./openai-service";
import anthropicService from "./anthropic-service";
import perplexityService from "./perplexity-service";
import xaiService from "./xai-service";

// Provider types
export type AIProvider = "openai" | "anthropic" | "perplexity" | "xai";

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
  size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024"
): Promise<string> {
  try {
    return await openaiService.generateImage(prompt, size);
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error(`Image generation error: ${error.message}`);
  }
}

export default {
  processTask,
  analyzeImage,
  generateImage,
};