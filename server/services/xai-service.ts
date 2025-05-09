import OpenAI from "openai";
import { Task } from "../../shared/schema";
import { AIMessage, AgentResponse } from "./openai-service";

// Create xAI client using the OpenAI SDK
const xai = new OpenAI({
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY,
});

/**
 * Process a task using xAI's Grok
 */
export async function processWithGrok(
  task: Task,
  model: string = "grok-2-1212",
  systemInstructions?: string,
  previousMessages: AIMessage[] = []
): Promise<AgentResponse> {
  try {
    // Build the message array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system instructions if provided
    if (systemInstructions) {
      messages.push({
        role: "system",
        content: systemInstructions,
      });
    }

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
      content: task.description || "",
    });

    // Make the API call
    const response = await xai.chat.completions.create({
      model: model,
      messages: messages,
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
    console.error("Error processing task with xAI Grok:", error);
    if (error instanceof Error) {
      throw new Error(`xAI API error: ${error.message}`);
    }
    throw new Error(`xAI API error: An unknown error occurred`);
  }
}

/**
 * Analyze an image using Grok Vision
 */
export async function analyzeImageWithGrok(
  imageUrl: string,
  prompt: string,
  model: string = "grok-2-vision-1212"
): Promise<string> {
  try {
    const response = await xai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error analyzing image with Grok Vision:", error);
    if (error instanceof Error) {
      throw new Error(`Grok vision API error: ${error.message}`);
    }
    throw new Error(`Grok vision API error: An unknown error occurred`);
  }
}

export default {
  processTask: processWithGrok,
  analyzeImage: analyzeImageWithGrok,
};
