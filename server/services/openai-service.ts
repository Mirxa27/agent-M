import OpenAI from "openai";
import { AgentTask } from "@shared/schema";

// Create OpenAI client
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  content: string;
  rawResponse?: any;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Process a task using OpenAI
 */
export async function processWithOpenAI(
  task: AgentTask,
  model: string = "gpt-4o",
  systemInstructions?: string,
  previousMessages: AIMessage[] = []
): Promise<AgentResponse> {
  try {
    // Build the message array
    const messages: AIMessage[] = [];
    
    // Add system instructions if provided
    if (systemInstructions) {
      messages.push({
        role: "system",
        content: systemInstructions,
      });
    }
    
    // Add previous conversation history if any
    if (previousMessages.length > 0) {
      messages.push(...previousMessages);
    }
    
    // Add the current task as the user message
    messages.push({
      role: "user",
      content: task.content,
    });
    
    // Make the API call
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 2048,
    });
    
    // Extract the response content
    const content = response.choices[0].message.content || "";
    
    return {
      content,
      rawResponse: response,
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      },
    };
  } catch (error) {
    console.error("Error processing task with OpenAI:", error);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

/**
 * Generate an image using DALL-E 3
 */
export async function generateImageWithOpenAI(
  prompt: string,
  size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024",
  quality: "standard" | "hd" = "standard"
): Promise<string> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality,
    });
    
    return response.data[0].url || "";
  } catch (error) {
    console.error("Error generating image with OpenAI:", error);
    throw new Error(`OpenAI image generation error: ${error.message}`);
  }
}

/**
 * Analyze an image using Vision API
 */
export async function analyzeImageWithOpenAI(
  imageUrl: string,
  prompt: string,
  model: string = "gpt-4o"
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { 
              type: "image_url", 
              image_url: { url: imageUrl }
            }
          ],
        },
      ],
      max_tokens: 1000,
    });
    
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error analyzing image with OpenAI:", error);
    throw new Error(`OpenAI vision API error: ${error.message}`);
  }
}

export default {
  processTask: processWithOpenAI,
  generateImage: generateImageWithOpenAI,
  analyzeImage: analyzeImageWithOpenAI,
};