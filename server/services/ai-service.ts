import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { AiProvider, AiModel } from "@shared/schema";

// AI Provider Types
export type AIProviderType = "openai" | "anthropic" | "perplexity" | "xai";

// Base interface for AI service responses
export interface AIServiceResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  id: string;
  provider: AIProviderType;
}

// Base class for all AI services
export abstract class AIService {
  protected provider: AiProvider;
  protected model: AiModel;

  constructor(provider: AiProvider, model: AiModel) {
    this.provider = provider;
    this.model = model;
  }

  abstract generateText(
    prompt: string,
    options?: any,
  ): Promise<AIServiceResponse>;
  abstract generateImage?(prompt: string, options?: any): Promise<string>;
  abstract processFile?(
    fileData: Buffer,
    options?: any,
  ): Promise<AIServiceResponse>;
}

// OpenAI Service Implementation
export class OpenAIService extends AIService {
  private client: OpenAI;

  constructor(provider: AiProvider, model: AiModel) {
    super(provider, model);
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for OpenAI service");
    }
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: provider.baseUrl || undefined,
    });
  }

  async generateText(
    prompt: string,
    options?: any,
  ): Promise<AIServiceResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model.modelId,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens:
          options?.maxTokens || this.model.maxOutputTokens || undefined,
      });

      return {
        text: response.choices[0].message.content || "",
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: this.model.name,
        id: response.id,
        provider: "openai",
      };
    } catch (error: any) {
      console.error("OpenAI error:", error);
      throw new Error(`OpenAI error: ${error.message}`);
    }
  }

  async generateImage(prompt: string, options?: any): Promise<string> {
    try {
      const response = await this.client.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: options?.size || "1024x1024",
        quality: options?.quality || "standard",
      });

      return response.data[0].url || "";
    } catch (error: any) {
      console.error("OpenAI image generation error:", error);
      throw new Error(`OpenAI image generation error: ${error.message}`);
    }
  }
}

// Anthropic Service Implementation
export class AnthropicService extends AIService {
  private client: Anthropic;

  constructor(provider: AiProvider, model: AiModel) {
    super(provider, model);
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is required for Anthropic service");
    }
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: provider.baseUrl || undefined,
    });
  }

  async generateText(
    prompt: string,
    options?: any,
  ): Promise<AIServiceResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.model.modelId,
        max_tokens: options?.maxTokens || this.model.maxOutputTokens || 1024,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature || 0.7,
      });

      return {
        text: response.content[0].text,
        usage: {
          promptTokens: 0, // Anthropic doesn't provide token counts in the same way
          completionTokens: 0,
          totalTokens: 0,
        },
        model: this.model.name,
        id: response.id,
        provider: "anthropic",
      };
    } catch (error: any) {
      console.error("Anthropic error:", error);
      throw new Error(`Anthropic error: ${error.message}`);
    }
  }
}

// Perplexity Service Implementation using OpenAI's SDK
export class PerplexityService extends AIService {
  private client: OpenAI;

  constructor(provider: AiProvider, model: AiModel) {
    super(provider, model);
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is required for Perplexity service");
    }
    this.client = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: provider.baseUrl || "https://api.perplexity.ai",
    });
  }

  async generateText(
    prompt: string,
    options?: any,
  ): Promise<AIServiceResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model.modelId,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens:
          options?.maxTokens || this.model.maxOutputTokens || undefined,
      });

      return {
        text: response.choices[0].message.content || "",
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: this.model.name,
        id: response.id,
        provider: "perplexity",
      };
    } catch (error: any) {
      console.error("Perplexity error:", error);
      throw new Error(`Perplexity error: ${error.message}`);
    }
  }
}

// xAI Service Implementation using OpenAI's SDK
export class XAIService extends AIService {
  private client: OpenAI;

  constructor(provider: AiProvider, model: AiModel) {
    super(provider, model);
    if (!process.env.XAI_API_KEY) {
      throw new Error("XAI_API_KEY is required for xAI service");
    }
    this.client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: provider.baseUrl || "https://api.x.ai/v1",
    });
  }

  async generateText(
    prompt: string,
    options?: any,
  ): Promise<AIServiceResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model.modelId,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens:
          options?.maxTokens || this.model.maxOutputTokens || undefined,
      });

      return {
        text: response.choices[0].message.content || "",
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: this.model.name,
        id: response.id,
        provider: "xai",
      };
    } catch (error: any) {
      console.error("xAI error:", error);
      throw new Error(`xAI error: ${error.message}`);
    }
  }
}

// Factory method to create the appropriate AI service based on provider
export function createAIService(
  provider: AiProvider,
  model: AiModel,
): AIService {
  switch (provider.provider.toLowerCase()) {
    case "openai":
      return new OpenAIService(provider, model);
    case "anthropic":
      return new AnthropicService(provider, model);
    case "perplexity":
      return new PerplexityService(provider, model);
    case "xai":
      return new XAIService(provider, model);
    default:
      throw new Error(`Unsupported provider: ${provider.provider}`);
  }
}
