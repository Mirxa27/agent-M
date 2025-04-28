import { AgentTool, InsertAgentTool } from "@shared/schema";
import { storage } from "../storage";
import { createAIService } from "./ai-service";

/**
 * Service for managing agent tools
 */
export class AgentToolsService {
  /**
   * Get all agent tools
   * @returns All agent tools in the system
   */
  async getAllTools(): Promise<AgentTool[]> {
    return storage.getAllAgentTools();
  }

  /**
   * Get a specific agent tool by ID
   * @param id Tool ID
   * @returns Agent tool or null if not found
   */
  async getToolById(id: number): Promise<AgentTool | undefined> {
    return storage.getAgentTool(id);
  }

  /**
   * Create a new agent tool
   * @param tool Tool data
   * @returns Created agent tool
   */
  async createTool(tool: InsertAgentTool): Promise<AgentTool> {
    return storage.createAgentTool(tool);
  }

  /**
   * Update an existing agent tool
   * @param id Tool ID
   * @param updates Updates to apply
   * @returns Updated agent tool
   */
  async updateTool(
    id: number,
    updates: Partial<Omit<AgentTool, "id">>,
  ): Promise<AgentTool | undefined> {
    return storage.updateAgentTool(id, updates);
  }

  /**
   * Delete an agent tool
   * @param id Tool ID
   * @returns Success flag
   */
  async deleteTool(id: number): Promise<boolean> {
    const tool = await storage.getAgentTool(id);

    // Don't allow deletion of system tools
    if (tool && tool.isSystem) {
      throw new Error("Cannot delete system tools");
    }

    return storage.deleteAgentTool(id);
  }

  /**
   * Execute a specific agent tool
   * @param toolId Tool ID
   * @param input Input data for the tool
   * @returns Result of the tool execution
   */
  async executeTool(toolId: number, input: any): Promise<any> {
    const tool = await storage.getAgentTool(toolId);

    if (!tool) {
      throw new Error(`Tool with ID ${toolId} not found`);
    }

    if (!tool.isActive) {
      throw new Error(`Tool ${tool.name} is inactive`);
    }

    switch (tool.type) {
      case "openai":
        return this.executeOpenAITool(tool, input);
      case "custom_api":
        return this.executeCustomApiTool(tool, input);
      case "webhook":
        return this.executeWebhookTool(tool, input);
      case "database":
        return this.executeDatabaseTool(tool, input);
      case "file_system":
        return this.executeFileSystemTool(tool, input);
      case "email":
        return this.executeEmailTool(tool, input);
      case "sms":
        return this.executeSMSTool(tool, input);
      case "search":
        return this.executeSearchTool(tool, input);
      default:
        throw new Error(`Unsupported tool type: ${tool.type}`);
    }
  }

  /**
   * Execute OpenAI-based tool
   */
  private async executeOpenAITool(tool: AgentTool, input: any): Promise<any> {
    try {
      const config = tool.config as any;

      // Get AI provider and model
      const provider = await storage.getAiProvider(config.providerId || 1);
      if (!provider) {
        throw new Error(`AI Provider not found`);
      }

      const model = await storage.getAiModelByName(config.modelId || "gpt-4o");
      if (!model) {
        throw new Error(`AI Model not found`);
      }

      // Create AI service client
      const aiService = createAIService(provider, model);

      // Generate response from AI service with input and system prompt
      const systemPrompt =
        config.systemPrompt || "You are a helpful assistant.";
      const response = await aiService.generateText(input, {
        systemPrompt,
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || undefined,
      });

      return {
        success: true,
        result: response.text,
        usage: response.usage,
      };
    } catch (error: any) {
      console.error(`Error executing OpenAI tool ${tool.name}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute custom API tool
   */
  private async executeCustomApiTool(
    tool: AgentTool,
    input: any,
  ): Promise<any> {
    try {
      const config = tool.config as any;

      // Validate required config
      if (!config.endpoint) {
        throw new Error("Custom API endpoint not specified in tool config");
      }

      const method = config.method || "POST";
      const headers = config.headers || { "Content-Type": "application/json" };

      // Make the API request
      const response = await fetch(config.endpoint, {
        method,
        headers,
        body: method !== "GET" ? JSON.stringify(input) : undefined,
      });

      if (!response.ok) {
        throw new Error(
          `API call failed with status ${response.status}: ${response.statusText}`,
        );
      }

      const contentType = response.headers.get("content-type");
      let result;

      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        result = await response.text();
      }

      return {
        success: true,
        result,
      };
    } catch (error: any) {
      console.error(`Error executing custom API tool ${tool.name}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute webhook tool
   */
  private async executeWebhookTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const config = tool.config as any;

      // Validate required config
      if (!config.webhookUrl) {
        throw new Error("Webhook URL not specified in tool config");
      }

      // Make the webhook request
      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.headers || {}),
        },
        body: JSON.stringify({
          toolId: tool.id,
          toolName: tool.name,
          input,
          timestamp: new Date().toISOString(),
          ...(config.additionalData || {}),
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Webhook call failed with status ${response.status}: ${response.statusText}`,
        );
      }

      const contentType = response.headers.get("content-type");
      let result;

      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        result = await response.text();
      }

      return {
        success: true,
        result,
      };
    } catch (error: any) {
      console.error(`Error executing webhook tool ${tool.name}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute database tool
   */
  private async executeDatabaseTool(tool: AgentTool, input: any): Promise<any> {
    // This is a placeholder implementation
    return {
      success: false,
      error: "Database tool execution not yet implemented",
    };
  }

  /**
   * Execute file system tool
   */
  private async executeFileSystemTool(
    tool: AgentTool,
    input: any,
  ): Promise<any> {
    // This is a placeholder implementation
    return {
      success: false,
      error: "File system tool execution not yet implemented",
    };
  }

  /**
   * Execute email tool
   */
  private async executeEmailTool(tool: AgentTool, input: any): Promise<any> {
    // This is a placeholder implementation
    return {
      success: false,
      error: "Email tool execution not yet implemented",
    };
  }

  /**
   * Execute SMS tool
   */
  private async executeSMSTool(tool: AgentTool, input: any): Promise<any> {
    // This is a placeholder implementation
    return {
      success: false,
      error: "SMS tool execution not yet implemented",
    };
  }

  /**
   * Execute search tool
   */
  private async executeSearchTool(tool: AgentTool, input: any): Promise<any> {
    // This is a placeholder implementation
    return {
      success: false,
      error: "Search tool execution not yet implemented",
    };
  }
}

// Singleton instance
export const agentToolsService = new AgentToolsService();
