import Anthropic from "@anthropic-ai/sdk";
import { AgentTask } from "@shared/schema";
import { AIMessage, AgentResponse } from "./openai-service";

// Create Anthropic client
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Process a task using Anthropic Claude
 */
export async function processWithAnthropic(
  task: AgentTask,
  model: string = "claude-3-7-sonnet-20250219",
  systemInstructions?: string,
  previousMessages: AIMessage[] = []
): Promise<AgentResponse> {
  try {
    // Build the messages array
    const messages = [];
    
    // Add previous conversation history if any
    if (previousMessages.length > 0) {
      for (const msg of previousMessages) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }
    
    // Add the current task as the user message
    messages.push({
      role: "user",
      content: task.content,
    });
    
    // Make the API call
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 2048,
      messages: messages,
      system: systemInstructions || "",
    });
    
    // Extract the response content
    const content = response.content[0]?.text || "";
    
    return {
      content,
      rawResponse: response,
      usage: {
        promptTokens: response.usage?.input_tokens,
        completionTokens: response.usage?.output_tokens,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
    };
  } catch (error) {
    console.error("Error processing task with Anthropic:", error);
    throw new Error(`Anthropic API error: ${error.message}`);
  }
}

/**
 * Analyze an image using Anthropic multimodal capabilities
 */
export async function analyzeImageWithAnthropic(
  imageBase64: string,
  prompt: string,
  model: string = "claude-3-7-sonnet-20250219"
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });
    
    return response.content[0]?.text || "";
  } catch (error) {
    console.error("Error analyzing image with Anthropic:", error);
    throw new Error(`Anthropic vision API error: ${error.message}`);
  }
}

export default {
  processTask: processWithAnthropic,
  analyzeImage: analyzeImageWithAnthropic,
};