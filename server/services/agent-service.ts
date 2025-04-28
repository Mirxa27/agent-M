import { createAIService, AIServiceResponse } from "./ai-service";
import { storage } from "../storage";
import { Agent, Credential, Task, InsertTask, File } from "@shared/schema";
import { decrypt } from "@shared/crypto";
import { loadAndProcessFile, getFilesByTaskId } from "./file-service";

// Types for agent execution
export interface AgentTaskContext {
  agent: Agent;
  credentials: Credential[];
  task: Task;
  files?: File[];
}

export interface AgentTaskResult {
  success: boolean;
  result: any;
  error?: string;
}

// Handles the execution of an agent task
export class AgentExecutionService {
  // Main method to process a task
  async executeTask(taskId: number): Promise<AgentTaskResult> {
    try {
      // Get task information
      const task = await storage.getTask(taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Update task status to in-progress
      await storage.updateTask(taskId, { status: "processing" });

      // Get agent details
      const agent = await storage.getAgent(task.agentId);
      if (!agent) {
        throw new Error(`Agent with ID ${task.agentId} not found`);
      }

      // Get credentials for this agent
      const credentials = await storage.getCredentialsByAgentId(agent.id);

      // Get any files associated with this task
      const files = await getFilesByTaskId(task.id);

      // Set up execution context
      const context: AgentTaskContext = {
        agent,
        credentials: credentials.map((cred) => ({
          ...cred,
          value: decrypt(cred.value),
        })),
        task,
        files,
      };

      // Execute the agent based on its type
      let result: AgentTaskResult;
      switch (agent.type) {
        case "ai_assistant":
          result = await this.executeAIAssistant(context);
          break;
        case "data_processor":
          result = await this.executeDataProcessor(context);
          break;
        case "web_scraper":
          result = await this.executeWebScraper(context);
          break;
        case "file_analyzer":
          result = await this.executeFileAnalyzer(context);
          break;
        default:
          throw new Error(`Unsupported agent type: ${agent.type}`);
      }

      // Update task with result
      await storage.updateTask(taskId, {
        status: result.success ? "completed" : "failed",
        result: result.result || null,
        completedAt: new Date(),
      });

      // Record a completion message
      await storage.createMessage({
        taskId: task.id,
        role: "system",
        content: result.success
          ? "Task completed successfully"
          : `Task failed: ${result.error}`,
        timestamp: new Date(),
      });

      return result;
    } catch (error: any) {
      console.error(`Error executing task ${taskId}:`, error);

      // Update task as failed
      await storage.updateTask(taskId, {
        status: "failed",
        result: { error: error.message },
        completedAt: new Date(),
      });

      // Record error message
      await storage.createMessage({
        taskId,
        role: "system",
        content: `Error executing task: ${error.message}`,
        timestamp: new Date(),
      });

      return {
        success: false,
        result: null,
        error: error.message,
      };
    }
  }

  // Helper methods for specific agent types
  private async executeAIAssistant(
    context: AgentTaskContext,
  ): Promise<AgentTaskResult> {
    try {
      const { agent, task } = context;
      const config = agent.config as any;

      // Get AI provider and model
      const provider = await storage.getAiProvider(config.providerId);
      if (!provider) {
        throw new Error(`AI Provider with ID ${config.providerId} not found`);
      }

      const model = await storage.getAiModel(config.modelId);
      if (!model) {
        throw new Error(`AI Model with ID ${config.modelId} not found`);
      }

      // Create AI service client
      const aiService = createAIService(provider, model);

      // Generate response from AI service
      const prompt = task.description || task.title;
      const response = await aiService.generateText(prompt, {
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || undefined,
      });

      // Record assistant message
      await storage.createMessage({
        taskId: task.id,
        role: "assistant",
        content: response.text,
        timestamp: new Date(),
      });

      return {
        success: true,
        result: {
          text: response.text,
          usage: response.usage,
          model: response.model,
        },
      };
    } catch (error: any) {
      console.error("Error executing AI Assistant:", error);
      return {
        success: false,
        result: null,
        error: error.message,
      };
    }
  }

  private async executeDataProcessor(
    context: AgentTaskContext,
  ): Promise<AgentTaskResult> {
    // Implementation for data processing agent
    // This could include data transformation, analysis, or other processing tasks
    return {
      success: true,
      result: {
        message: "Data processing not yet implemented",
      },
    };
  }

  private async executeWebScraper(
    context: AgentTaskContext,
  ): Promise<AgentTaskResult> {
    // Implementation for web scraping agent
    // This would handle fetching data from websites and processing it
    return {
      success: true,
      result: {
        message: "Web scraping not yet implemented",
      },
    };
  }

  private async executeFileAnalyzer(
    context: AgentTaskContext,
  ): Promise<AgentTaskResult> {
    try {
      const { agent, task, files } = context;
      const config = agent.config as any;

      if (!files || files.length === 0) {
        throw new Error("No files provided for analysis");
      }

      // Get AI provider and model
      const provider = await storage.getAiProvider(config.providerId);
      if (!provider) {
        throw new Error(`AI Provider with ID ${config.providerId} not found`);
      }

      const model = await storage.getAiModel(config.modelId);
      if (!model) {
        throw new Error(`AI Model with ID ${config.modelId} not found`);
      }

      // Create AI service client
      const aiService = createAIService(provider, model);

      // Process each file
      const results = [];

      for (const file of files) {
        // Get file content
        const fileData = await loadAndProcessFile(file);

        // Create prompt for file analysis
        const prompt = `Analyze the following ${file.type} file named ${file.name}:\n\n${fileData.textContent}\n\nProvide a detailed analysis.`;

        // Generate response from AI service
        const response = await aiService.generateText(prompt, {
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || undefined,
        });

        results.push({
          fileName: file.name,
          fileType: file.type,
          analysis: response.text,
        });

        // Record assistant message
        await storage.createMessage({
          taskId: task.id,
          role: "assistant",
          content: `Analysis of ${file.name}: ${response.text}`,
          timestamp: new Date(),
        });
      }

      return {
        success: true,
        result: {
          fileAnalyses: results,
        },
      };
    } catch (error: any) {
      console.error("Error executing File Analyzer:", error);
      return {
        success: false,
        result: null,
        error: error.message,
      };
    }
  }
}

// Function to create a new agent execution task
export async function createAgentTask(
  agentId: number,
  title: string,
  description?: string | null,
): Promise<Task> {
  // Get agent details to verify it exists
  const agent = await storage.getAgent(agentId);
  if (!agent) {
    throw new Error(`Agent with ID ${agentId} not found`);
  }

  // Create a new task
  const task = await storage.createTask({
    userId: agent.userId,
    agentId,
    title,
    description,
    status: "pending",
    result: null,
    createdAt: new Date(),
    completedAt: null,
  });

  // Record initial message
  await storage.createMessage({
    taskId: task.id,
    role: "user",
    content: description || title,
    timestamp: new Date(),
  });

  return task;
}

// Helper function to run a task immediately
export async function runTask(taskId: number): Promise<AgentTaskResult> {
  const executionService = new AgentExecutionService();
  return executionService.executeTask(taskId);
}
