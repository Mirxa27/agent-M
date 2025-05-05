// Import types from schema
import { AgentTask } from "./schema";
import { AIProvider } from "../server/services/ai-service";

// Define AI message structure
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  functionCall?: any;
}

// Define AI agent config
export interface AgentConfig {
  provider: AIProvider;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

// Define agent response structure
export interface AgentResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  error?: string;
}

// Re-export types
export { AgentTask, AIProvider };