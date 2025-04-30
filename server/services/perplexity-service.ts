import { AgentTask } from "@shared/schema";
import { AIMessage, AgentResponse } from "./openai-service";
import axios from "axios";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

/**
 * Process a task using Perplexity
 */
export async function processWithPerplexity(
  task: AgentTask,
  model: string = "llama-3.1-sonar-small-128k-online",
  systemInstructions?: string,
  previousMessages: AIMessage[] = []
): Promise<AgentResponse> {
  try {
    // Build the messages array
    const messages = [];
    
    // Add system message if provided
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
      content: task.content,
    });
    
    // Make the API call
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: model,
        messages: messages,
        temperature: 0.2,
        max_tokens: 1024,
        top_p: 0.9,
        search_recency_filter: "month",
        stream: false,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        },
      }
    );
    
    // Extract the response content
    const content = response.data.choices[0]?.message.content || "";
    
    // If there are citations, append them to the content
    let formattedContent = content;
    if (response.data.citations && response.data.citations.length > 0) {
      formattedContent += "\n\nReferences:\n";
      response.data.citations.forEach((citation: string, index: number) => {
        formattedContent += `[${index + 1}] ${citation}\n`;
      });
    }
    
    return {
      content: formattedContent,
      rawResponse: response.data,
      usage: {
        promptTokens: response.data.usage?.prompt_tokens,
        completionTokens: response.data.usage?.completion_tokens,
        totalTokens: response.data.usage?.total_tokens,
      },
    };
  } catch (error) {
    console.error("Error processing task with Perplexity:", error);
    throw new Error(`Perplexity API error: ${error.response?.data?.error?.message || error.message}`);
  }
}

export default {
  processTask: processWithPerplexity,
};