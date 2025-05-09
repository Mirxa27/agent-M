import { AgentTool, InsertAgentTool, Task, insertAgentToolSchema, openAIToolConfigSchema, customApiToolConfigSchema, webhookToolConfigSchema, databaseToolConfigSchema, fileSystemToolConfigSchema, emailToolConfigSchema, smsToolConfigSchema, searchToolConfigSchema, customToolConfigSchema } from "@shared/schema";
import fs from "fs/promises";
import path from "path";
import { storage } from "../storage";
import aiService from "./ai-service"; // Imports processTask, AIProvider type, etc.
// AIMessage and AgentResponse are not directly used here if aiService.processTask handles them internally
// and returns a compatible structure. If not, they might need to be imported for type casting.

/**
 * Service for managing agent tools
 */
export class AgentToolsService {
  /**
   * Retrieves all agent tools.
   * @returns {Promise<AgentTool[]>} A promise that resolves to an array of all agent tools.
   */
  async getAllTools(): Promise<AgentTool[]> {
    return storage.getAllAgentTools();
  }

  /**
   * Retrieves a specific agent tool by its ID.
   * @param {number} id - The ID of the tool to retrieve.
   * @returns {Promise<AgentTool | undefined>} A promise that resolves to the agent tool if found, otherwise undefined.
   */
  async getToolById(id: number): Promise<AgentTool | undefined> {
    return storage.getAgentTool(id);
  }

  /**
   * Creates a new agent tool.
   * @param {InsertAgentTool} tool - The data for the new tool.
   * @returns {Promise<AgentTool>} A promise that resolves to the created agent tool.
   */
  async createTool(tool: InsertAgentTool): Promise<AgentTool> {
    const validationResult = insertAgentToolSchema.safeParse(tool);
    if (!validationResult.success) {
      console.error("Agent tool creation validation failed:", validationResult.error.flatten());
      throw new Error(`Invalid agent tool data: ${validationResult.error.flatten().fieldErrors}`);
    }
    return storage.createAgentTool(validationResult.data);
  }

  /**
   * Updates an existing agent tool.
   * @param {number} id - The ID of the tool to update.
   * @param {Partial<Omit<AgentTool, "id">>} updates - An object containing the fields to update.
   * @returns {Promise<AgentTool | undefined>} A promise that resolves to the updated agent tool, or undefined if not found.
   */
  async updateTool(
    id: number,
    updates: Partial<Omit<AgentTool, "id">>,
  ): Promise<AgentTool | undefined> {
    const existingTool = await storage.getAgentTool(id);
    if (!existingTool) {
      throw new Error(`Tool with ID ${id} not found for update.`);
    }

    // Merge existing tool data with updates to perform a full validation
    const mergedData = {
      // Start with all fields from the existing tool that are part of InsertAgentTool
      name: existingTool.name,
      description: existingTool.description,
      category: existingTool.category,
      type: existingTool.type,
      config: existingTool.config, // This will be an object
      icon: existingTool.icon,
      isActive: existingTool.isActive,
      // Then overwrite with any provided updates
      ...updates,
    };

    // Validate the merged data against the full schema
    const validationResult = insertAgentToolSchema.safeParse(mergedData);

    if (!validationResult.success) {
      console.error(`Agent tool update validation failed for ID ${id}:`, validationResult.error.flatten().fieldErrors);
      // Construct a more detailed error message
      let errorMessages = "Invalid agent tool update data: ";
      const fieldErrors = validationResult.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      for (const key in fieldErrors) {
        if (fieldErrors[key]) {
          errorMessages += `${key}: ${fieldErrors[key]?.join(', ')}; `;
        }
      }
      const formErrors = validationResult.error.flatten().formErrors;
      if (formErrors.length > 0) {
        errorMessages += `Global: ${formErrors.join(', ')};`;
      }
      throw new Error(errorMessages);
    }

    // Only pass the validated `updates` to storage, not the fully merged object,
    // as storage.updateAgentTool expects partial updates.
    // However, we've validated that these updates, when combined with the existing tool, are valid.
    // The `validationResult.data` contains the fully merged and validated object.
    // We should pass the original `updates` that have now been implicitly validated
    // through the merging and full schema check.
    // Or, more correctly, pass the validated parts of `updates`.
    // For simplicity and to ensure only intended fields are updated:
    const validatedUpdates: Partial<InsertAgentTool> = {};
    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            // @ts-ignore
            validatedUpdates[key as keyof InsertAgentTool] = validationResult.data[key as keyof InsertAgentTool];
        }
    }

    return storage.updateAgentTool(id, validatedUpdates);
  }

  /**
   * Deletes an agent tool by its ID. System tools cannot be deleted.
   * @param {number} id - The ID of the tool to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if deletion was successful, false otherwise.
   * @throws {Error} If attempting to delete a system tool.
   */
  async deleteTool(id: number): Promise<boolean> {
    const tool = await storage.getAgentTool(id);
    if (tool && tool.isSystem) {
      throw new Error("Cannot delete system tools");
    }
    return storage.deleteAgentTool(id);
  }

  /**
   * Executes a specified agent tool with the given input.
   * @param {number} toolId - The ID of the tool to execute.
   * @param {any} input - The input data for the tool. Structure depends on the tool type.
   * @returns {Promise<any>} A promise that resolves to the execution result.
   *                         The result structure should ideally be standardized, e.g.,
   *                         `{ success: boolean, result?: any, error?: string, usage?: any }`.
   * @throws {Error} If the tool is not found or is inactive.
   */
  async executeTool(toolId: number, input: any): Promise<any> {
    const tool = await storage.getAgentTool(toolId);
    if (!tool) throw new Error(`Tool with ID ${toolId} not found`);
    if (!tool.isActive) throw new Error(`Tool ${tool.name} is inactive`);

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
        return this.executeCustomTool(tool, input);
    }
  }

  /**
   * Executes an OpenAI tool by calling the aiService.processTask method.
   * @private
   * @param {AgentTool} tool - The OpenAI tool to execute, containing configuration.
   * @param {any} input - The input prompt (string) for the OpenAI model.
   * @returns {Promise<object>} The result of the AI processing, including success status, content, and usage.
   */
  private async executeOpenAITool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = openAIToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid OpenAI tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const toolConfig = validationResult.data;

      const providerInfo = await storage.getAiProvider(toolConfig.providerId || 1); // Assuming 1 is a default OpenAI provider ID
      if (!providerInfo) throw new Error(`AI Provider for OpenAI tool not found (ID: ${toolConfig.providerId || 1}).`);

      const modelInfo = await storage.getAiModelByName(toolConfig.modelId || "gpt-4o");
      if (!modelInfo) throw new Error(`AI Model '${toolConfig.modelId || "gpt-4o"}' not found.`);

      const systemPrompt = toolConfig.systemPrompt || "You are a helpful assistant.";

      // Ensure messages format matches AIMessage from openai-service (imported via ai-service)
      const userMessages: { role: "system" | "user" | "assistant" | "tool"; content: string | null }[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: String(input) }, // Ensure input is a string
      ];

      // Construct a minimal Task object for aiService.processTask
      const mockTask: Task = {
        id: 0, // Mock ID, as this is a direct tool execution, not a persisted task
        userId: 0, // Mock User ID or determine if a real one is needed (e.g., from context if available)
        agentId: 0, // Mock Agent ID
        title: `OpenAI Tool: ${tool.name}`,
        description: `Executing OpenAI tool with input: ${String(input).substring(0,100)}...`,
        status: "processing",
        createdAt: new Date(),
        completedAt: null,
        result: null,
      };

      // Construct AgentConfig for aiService.processTask (matches local AgentConfig in ai-service.ts)
      const agentServiceConfig = {
        provider: providerInfo.provider as "openai" | "anthropic" | "perplexity" | "xai" | "openrouter",
        model: modelInfo.modelId,
        systemInstructions: systemPrompt,
        tools: [], // No sub-tools for this direct execution
        // Temperature and maxTokens are typically handled by the specific service (e.g., openaiService)
        // called by aiService.processTask, based on the model or provider defaults,
        // or they might need to be passed through if aiService.processTask supports overriding them.
        // For now, we assume the underlying service (openaiService) will use its defaults or model-specific settings.
        // If direct control over temperature/maxTokens is needed here, aiService.processTask or its callees would need to support it.
      };

      const response = await aiService.processTask(
        mockTask,
        agentServiceConfig,
        userMessages as any // Cast if AIMessage type from openai-service is not directly compatible
      );

      return {
        success: true,
        result: response.content,
        usage: response.usage, // Assuming AgentResponse includes usage
      };
    } catch (error: any) {
      console.error(`Error executing OpenAI tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Executes a custom API tool.
   * @private
   * @param {AgentTool} tool - The custom API tool to execute.
   * @param {any} input - The data to send to the API.
   * @returns {Promise<object>} The result of the API call, including success status and API response.
   */
  private async executeCustomApiTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = customApiToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid Custom API tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      if (!config.endpoint) throw new Error("Custom API endpoint not specified in tool config");
      const method = config.method || "POST";
      const headers = config.headers || { "Content-Type": "application/json" };
      const response = await fetch(config.endpoint, {
        method,
        headers,
        body: method !== "GET" && input !== undefined ? JSON.stringify(input) : undefined,
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => `Status: ${response.statusText}`);
        throw new Error(`API call failed with status ${response.status}: ${errorText}`);
      }
      const contentType = response.headers.get("content-type");
      let result;
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        result = await response.text();
      }
      return { success: true, result };
    } catch (error: any) {
      console.error(`Error executing custom API tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Executes a webhook tool.
   * @private
   * @param {AgentTool} tool - The webhook tool to execute.
   * @param {any} input - The data to send in the webhook payload.
   * @returns {Promise<object>} The result of the webhook call, including success status and response from the webhook.
   */
  private async executeWebhookTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = webhookToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid Webhook tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      if (!config.webhookUrl) throw new Error("Webhook URL not specified in tool config");
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
        const errorText = await response.text().catch(() => `Status: ${response.statusText}`);
        throw new Error(`Webhook call failed with status ${response.status}: ${errorText}`);
      }
      const contentType = response.headers.get("content-type");
      let result;
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        result = await response.text();
      }
      return { success: true, result };
    } catch (error: any) {
      console.error(`Error executing webhook tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Executes a database interaction tool.
   * @private
   * @param {AgentTool} tool - The database tool to execute.
   * @param {any} input - The input specifying the database operation and parameters.
   * @returns {Promise<object>} The result of the database operation.
   */
  private async executeDatabaseTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = databaseToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid Database tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      if (!config.connectionType || !config.connectionString) {
        throw new Error("Database tool requires 'connectionType' and 'connectionString' in config");
      }
      if (!input || typeof input !== "object") {
        throw new Error("Database tool requires an object with 'operation' and appropriate parameters");
      }
      const { operation, query, params, tableName, columns, conditions, values } = input;
      if (!operation) throw new Error("Operation must be specified (query, select, insert, update, delete)");
      const allowedDbTypes = ["postgres", "mysql", "sqlite"];
      if (!allowedDbTypes.includes(config.connectionType)) {
        throw new Error(`Database type ${config.connectionType} not supported. Allowed types: ${allowedDbTypes.join(", ")}`);
      }
      let client;
      let result;
      try {
        client = await this.getDbClient(config.connectionType, config.connectionString, {
          maxQueryExecutionTime: 5000, // Example: Default query timeout
          maxResultRows: 1000,       // Example: Default row limit
        });
        switch (operation.toLowerCase()) {
          case "query":
            if (!query || typeof query !== "string") throw new Error("Query operation requires a 'query' string");
            this.validateSafeQuery(query); // Basic safety check
            result = await client.query(query, params || []);
            break;
          case "select":
            if (!tableName || typeof tableName !== "string") throw new Error("Select operation requires 'tableName'");
            this.validateTableAccess(tableName, config.allowedTables);
            const selectColumns = columns && Array.isArray(columns) ? columns : ["*"];
            let selectQuery = `SELECT ${selectColumns.join(", ")} FROM ${this.sanitizeIdentifier(tableName)}`;
            const whereParamsSelect: any[] = [];
            if (conditions && typeof conditions === "object") {
              const whereClausesSelect: string[] = [];
              let paramIndexSelect = 1;
              for (const [column, value] of Object.entries(conditions)) {
                whereClausesSelect.push(`${this.sanitizeIdentifier(column)} = $${paramIndexSelect}`);
                whereParamsSelect.push(value);
                paramIndexSelect++;
              }
              if (whereClausesSelect.length > 0) selectQuery += ` WHERE ${whereClausesSelect.join(" AND ")}`;
            }
            selectQuery += " LIMIT 100"; // Default limit
            result = await client.query(selectQuery, whereParamsSelect);
            break;
          case "insert":
            if (!tableName || typeof tableName !== "string" || !values || typeof values !== "object") {
              throw new Error("Insert operation requires 'tableName' and 'values'");
            }
            this.validateTableAccess(tableName, config.allowedTables);
            const insertColumnsArr = Object.keys(values).map((col) => this.sanitizeIdentifier(col));
            const placeholdersArr = insertColumnsArr.map((_, i) => `$${i + 1}`);
            const insertValuesArr = Object.values(values);
            const insertQueryStr = `
              INSERT INTO ${this.sanitizeIdentifier(tableName)}
              (${insertColumnsArr.join(", ")})
              VALUES (${placeholdersArr.join(", ")})
              RETURNING *
            `;
            result = await client.query(insertQueryStr, insertValuesArr);
            break;
          case "update":
            if (!tableName || typeof tableName !== "string" || !values || typeof values !== "object" || !conditions || typeof conditions !== "object") {
              throw new Error("Update operation requires 'tableName', 'values', and 'conditions'");
            }
            this.validateTableAccess(tableName, config.allowedTables);
            const updateClausesArr: string[] = [];
            const updateParamsArr: any[] = [];
            let paramIndexUpdate = 1;
            for (const [column, value] of Object.entries(values)) {
              updateClausesArr.push(`${this.sanitizeIdentifier(column)} = $${paramIndexUpdate}`);
              updateParamsArr.push(value);
              paramIndexUpdate++;
            }
            const whereClausesUpdate: string[] = [];
            for (const [column, value] of Object.entries(conditions)) {
              whereClausesUpdate.push(`${this.sanitizeIdentifier(column)} = $${paramIndexUpdate}`);
              updateParamsArr.push(value);
              paramIndexUpdate++;
            }
            const updateQueryStr = `
              UPDATE ${this.sanitizeIdentifier(tableName)}
              SET ${updateClausesArr.join(", ")}
              WHERE ${whereClausesUpdate.join(" AND ")}
              RETURNING *
            `;
            result = await client.query(updateQueryStr, updateParamsArr);
            break;
          case "delete":
            if (!tableName || typeof tableName !== "string" || !conditions || typeof conditions !== "object") {
              throw new Error("Delete operation requires 'tableName' and 'conditions'");
            }
            this.validateTableAccess(tableName, config.allowedTables);
            const deleteWhereClausesArr: string[] = [];
            const deleteParamsArr: any[] = [];
            let deleteParamIndexCounter = 1;
            for (const [column, value] of Object.entries(conditions)) {
              deleteWhereClausesArr.push(`${this.sanitizeIdentifier(column)} = $${deleteParamIndexCounter}`);
              deleteParamsArr.push(value);
              deleteParamIndexCounter++;
            }
            if (deleteWhereClausesArr.length === 0) throw new Error("At least one condition is required for DELETE operations");
            const deleteQueryStr = `
              DELETE FROM ${this.sanitizeIdentifier(tableName)}
              WHERE ${deleteWhereClausesArr.join(" AND ")}
              RETURNING *
            `;
            result = await client.query(deleteQueryStr, deleteParamsArr);
            break;
          default:
            throw new Error(`Unsupported database operation: ${operation}`);
        }
        return {
          success: true,
          result: {
            rowCount: result.rowCount,
            rows: result.rows,
          },
        };
      } catch (error: any) {
        throw new Error(`Database operation failed: ${error.message}`);
      } finally {
        if (client && client.release) client.release();
        else if (client && client.end) await client.end();
      }
    } catch (error: any) {
      console.error(`Error executing database tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Executes a file system interaction tool.
   * @private
   * @param {AgentTool} tool - The file system tool to execute.
   * @param {any} input - The input specifying the file system operation and parameters.
   * @returns {Promise<object>} The result of the file system operation.
   */
  private async executeFileSystemTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = fileSystemToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid File System tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      const { operation } = input;
      if (!operation) throw new Error("File system operation must be specified");
      const baseDirectory = config.baseDirectory || process.env.AGENT_FILE_SANDBOX_DIR;
      if (!baseDirectory) throw new Error("File system tool requires a base directory for sandboxing");
      try { await fs.access(baseDirectory); }
      catch { await fs.mkdir(baseDirectory, { recursive: true }); }

      const getSecurePath = (requestedPath: string): string => {
        const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, ""); // Prevent path traversal
        const fullPath = path.join(baseDirectory, normalizedPath);
        if (!fullPath.startsWith(baseDirectory)) {
          throw new Error(`Access denied to path outside sandbox: ${requestedPath}`);
        }
        return fullPath;
      };

      switch (operation.toLowerCase()) {
        case "read": {
          if (!input.path) throw new Error("Read operation requires a 'path' parameter");
          const filePath = getSecurePath(input.path);
          const content = await fs.readFile(filePath, "utf8");
          return { success: true, result: { content, path: input.path } };
        }
        case "write": {
          if (!input.path || input.content === undefined) throw new Error("Write operation requires 'path' and 'content' parameters");
          const filePath = getSecurePath(input.path);
          const dirPath = path.dirname(filePath);
          await fs.mkdir(dirPath, { recursive: true }); // Ensure directory exists
          await fs.writeFile(filePath, input.content);
          return { success: true, result: { path: input.path, bytesWritten: Buffer.byteLength(input.content) } };
        }
        case "append": {
          if (!input.path || input.content === undefined) throw new Error("Append operation requires 'path' and 'content' parameters");
          const filePath = getSecurePath(input.path);
          const dirPath = path.dirname(filePath);
          await fs.mkdir(dirPath, { recursive: true }); // Ensure directory exists
          await fs.appendFile(filePath, input.content);
          return { success: true, result: { path: input.path, bytesAppended: Buffer.byteLength(input.content) } };
        }
        case "delete": {
          if (!input.path) throw new Error("Delete operation requires a 'path' parameter");
          const filePath = getSecurePath(input.path);
          await fs.unlink(filePath);
          return { success: true, result: { path: input.path, deleted: true } };
        }
        case "list": {
          const dirPathToList = input.path ? getSecurePath(input.path) : baseDirectory;
          const filesInDir = await fs.readdir(dirPathToList);
          const fileDetails = await Promise.all(filesInDir.map(async (file: string) => {
            const fullFilePath = path.join(dirPathToList, file);
            const stats = await fs.stat(fullFilePath);
            return {
              name: file,
              path: path.relative(baseDirectory, fullFilePath), // Path relative to sandbox
              isDirectory: stats.isDirectory(),
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
            };
          }));
          return { success: true, result: { path: input.path || "/", files: fileDetails } };
        }
        case "exists": {
          if (!input.path) throw new Error("Exists operation requires a 'path' parameter");
          const filePath = getSecurePath(input.path);
          try {
            await fs.access(filePath);
            const stats = await fs.stat(filePath);
            return {
              success: true,
              result: {
                path: input.path,
                exists: true,
                isDirectory: stats.isDirectory(),
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
              },
            };
          } catch {
            return { success: true, result: { path: input.path, exists: false } };
          }
        }
        case "mkdir": {
          if (!input.path) throw new Error("Mkdir operation requires a 'path' parameter");
          const dirToMakePath = getSecurePath(input.path);
          await fs.mkdir(dirToMakePath, { recursive: true });
          return { success: true, result: { path: input.path, created: true } };
        }
        case "rmdir": {
          if (!input.path) throw new Error("Rmdir operation requires a 'path' parameter");
          const dirToRemovePath = getSecurePath(input.path);
          if (input.recursive) await fs.rm(dirToRemovePath, { recursive: true, force: true });
          else await fs.rmdir(dirToRemovePath);
          return { success: true, result: { path: input.path, removed: true } };
        }
        case "move": {
          if (!input.source || !input.destination) throw new Error("Move operation requires 'source' and 'destination' parameters");
          const sourcePathFull = getSecurePath(input.source);
          const destPathFull = getSecurePath(input.destination);
          const destDirPathFull = path.dirname(destPathFull);
          await fs.mkdir(destDirPathFull, { recursive: true }); // Ensure destination directory exists
          await fs.rename(sourcePathFull, destPathFull);
          return { success: true, result: { source: input.source, destination: input.destination, moved: true } };
        }
        case "copy": {
          if (!input.source || !input.destination) throw new Error("Copy operation requires 'source' and 'destination' parameters");
          const sourcePathFull = getSecurePath(input.source);
          const destPathFull = getSecurePath(input.destination);
          try { await fs.access(sourcePathFull); } catch { throw new Error(`Source file not found: ${input.source}`); }
          const stats = await fs.stat(sourcePathFull);
          const destDirPathFull = path.dirname(destPathFull);
          await fs.mkdir(destDirPathFull, { recursive: true }); // Ensure destination directory exists
          if (stats.isDirectory()) {
             // For directory copy, a recursive copy function would be needed.
             // fs.cp is available in newer Node.js versions (e.g., v16.7.0+)
             // For simplicity, this example doesn't implement recursive directory copy.
            throw new Error("Copying directories recursively is not implemented in this basic version. Use fs.cp if available or implement manually.");
          } else {
            await fs.copyFile(sourcePathFull, destPathFull);
          }
          return { success: true, result: { source: input.source, destination: input.destination, copied: true, isDirectory: stats.isDirectory() } };
        }
        default:
          throw new Error(`Unsupported file system operation: ${operation}`);
      }
    } catch (error: any) {
      console.error(`Error executing file system tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Executes an email sending tool.
   * @private
   * @param {AgentTool} tool - The email tool to execute.
   * @param {any} input - The input containing email details (to, subject, body).
   * @returns {Promise<object>} The result of the email sending operation.
   */
  private async executeEmailTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = emailToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid Email tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      const { apiKey, apiUrl } = config; // These might come from a credential lookup based on config.credentialId
      const { to, subject, body } = input;
      if (!apiKey || !apiUrl) throw new Error("Email tool requires 'apiKey' and 'apiUrl' in config (or via credentialId).");
      if (!to || !subject || !body) throw new Error("Email tool input requires 'to', 'subject', and 'body'.");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`, // Adjust auth based on actual provider
        },
        body: JSON.stringify({ to, subject, body }), // Payload structure depends on the email API
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => `Status: ${response.statusText}`);
        throw new Error(`Email API call failed with status ${response.status}: ${errorText}`);
      }
      const result = await response.json().catch(() => response.text()); // Handle non-JSON responses
      return { success: true, result: result || "Email sent successfully." };
    } catch (error: any) {
      console.error(`Error executing email tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Executes an SMS sending tool.
   * @private
   * @param {AgentTool} tool - The SMS tool to execute.
   * @param {any} input - The input containing SMS details (to, message).
   * @returns {Promise<object>} The result of the SMS sending operation.
   */
  private async executeSMSTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = smsToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid SMS tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      const { accountSid, apiKey, apiUrl, fromNumber } = config; // These might come from a credential lookup
      const { to, message } = input;
      if (!accountSid || !apiKey || !apiUrl) throw new Error("SMS tool requires 'accountSid', 'apiKey', and 'apiUrl' in config (or via credentialId).");
      if (!to || !message) throw new Error("SMS tool input requires 'to' and 'message'.");
      const payload: any = { To: to, Body: message }; // Twilio specific example
      if (fromNumber) payload.From = fromNumber;

      const response = await fetch(`${apiUrl}/Accounts/${accountSid}/Messages.json`, { // Example Twilio URL structure
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // Twilio expects form-urlencoded
          Authorization: `Basic ${Buffer.from(`${accountSid}:${apiKey}`).toString("base64")}`,
        },
        body: new URLSearchParams(payload).toString(),
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => `Status: ${response.statusText}`);
        throw new Error(`SMS API call failed with status ${response.status}: ${errorText}`);
      }
      const result = await response.json().catch(() => response.text());
      return { success: true, result: result || "SMS sent successfully." };
    } catch (error: any) {
      console.error(`Error executing SMS tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Executes a web search tool.
   * @private
   * @param {AgentTool} tool - The search tool to execute.
   * @param {any} input - The input containing the search query.
   * @returns {Promise<object>} The search results.
   */
  private async executeSearchTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = searchToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid Search tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      const { apiKey, searchEngineUrl = "https://customsearch.googleapis.com/customsearch/v1" } = config; // Example Google CSE
      const query = typeof input === "string" ? input : input?.query;
      if (!apiKey) throw new Error("Search tool requires 'apiKey' in config (or via credentialId).");
      if (!query) throw new Error("Search tool input requires a query string.");

      const searchUrl = new URL(searchEngineUrl);
      searchUrl.searchParams.append("q", query);
      searchUrl.searchParams.append("key", apiKey);
      if (config.searchEngineId) searchUrl.searchParams.append("cx", config.searchEngineId); // For Google CSE

      const response = await fetch(searchUrl.toString(), {
        method: "GET",
        // headers: { Authorization: `Bearer ${apiKey}` }, // Google CSE uses key in query param
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => `Status: ${response.statusText}`);
        throw new Error(`Search API call failed with status ${response.status}: ${errorText}`);
      }
      const results = await response.json();
      return { success: true, result: results };
    } catch (error: any) {
      console.error(`Error executing search tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Executes a custom-defined tool.
   * @private
   * @param {AgentTool} tool - The custom tool to execute.
   * @param {any} input - The input for the custom tool.
   * @returns {Promise<object>} The result of the custom tool's execution.
   * @throws {Error} If the custom tool's configuration is invalid or execution fails.
   * @remarks This method currently uses `new AsyncFunction` to execute code from `tool.config.codeToRun`.
   *          This is a **significant security risk** if the code is not from a trusted source or properly sandboxed.
   *          Consider replacing this with a more secure plugin architecture or sandboxed execution environment.
   */
  private async executeCustomTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = customToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid Custom tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      if (!config.scriptPath && (!config.parameters || typeof config.parameters.codeToRun !== 'string')) { // Adjusted to check parameters.codeToRun if scriptPath is not present
        throw new Error("Custom tool requires 'scriptPath' or 'parameters.codeToRun' (string) in config");
      }
      // WARNING: Executing arbitrary code like this is a major security risk.
      // This should be heavily sandboxed or replaced with a safer mechanism.
      // Consider using a dedicated isolated environment or a more structured plugin system.
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      // Provide a limited set of globals to the custom code for security.
      // `storage` and `aiService` could grant too much power if not careful.
      const codeToRun = config.scriptPath ? await fs.readFile(config.scriptPath, 'utf8') : config.parameters!.codeToRun as string; // Ensure parameters and codeToRun exist
      const func = new AsyncFunction("input", "toolConfig", "fs", "path", /* "storage", "aiService" */ codeToRun);
      const result = await func(input, config, fs, path /*, storage, aiService */);
      return { success: true, result };
    } catch (error: any) {
      console.error(`Error executing custom tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper to get a database client based on type.
   * @private
   * @param {string} type - The type of database ('postgres', 'mysql', 'sqlite').
   * @param {string} connectionString - The database connection string.
   * @param {any} options - Additional options for the client (e.g., timeouts).
   * @returns {Promise<any>} A promise that resolves to the database client.
   * @throws {Error} If the database type is unsupported or client creation fails.
   * @remarks This is a placeholder and should be implemented with actual DB client libraries and connection pooling.
   */
  private getDbClient(type: string, connectionString: string, options: any): Promise<any> {
    // This is a placeholder. In a real app, you'd use a proper DB client
    // library (e.g., 'pg' for PostgreSQL, 'mysql2' for MySQL, 'sqlite3' for SQLite)
    // and manage connections appropriately (e.g., connection pooling).
    return new Promise((resolve, reject) => {
      if (type === "postgres") {
        // Example (requires 'pg' package):
        // const { Pool } = require("pg");
        // const pool = new Pool({ connectionString, statement_timeout: options.maxQueryExecutionTime });
        // resolve(pool); // Simplified: should return a client from the pool for a single query
        reject(new Error("PostgreSQL client not fully implemented in this mock. Ensure 'pg' is installed and configured."));
      } else if (type === "mysql") {
        // Example (requires 'mysql2' package):
        // const mysql = require('mysql2/promise');
        // resolve(mysql.createConnection(connectionString)); // Simplified, consider pooling
        reject(new Error("MySQL client not implemented. Ensure 'mysql2' is installed and configured."));
      } else if (type === "sqlite") {
        // Example (requires 'sqlite3' package):
        // const sqlite3 = require('sqlite3');
        // resolve(new sqlite3.Database(connectionString)); // Simplified
        reject(new Error("SQLite client not implemented. Ensure 'sqlite3' is installed and configured."));
      } else {
        reject(new Error(`Unsupported database type: ${type}`));
      }
    });
  }

  /**
   * Validates a raw SQL query for potentially unsafe keywords.
   * @private
   * @param {string} query - The SQL query string.
   * @throws {Error} If the query contains forbidden keywords and is not a SELECT query.
   * @remarks This is a basic check. Prefer constructing SQL programmatically.
   */
  private validateSafeQuery(query: string): void {
    const lowerQuery = query.toLowerCase();
    const forbiddenKeywords = ["drop", "delete from", "truncate", "alter table", "update ", "insert into", "grant", "revoke"]; // Made more specific
    // This is a very basic check. A more robust solution would involve parsing the query
    // or using a library designed for SQL sanitization/validation if allowing raw queries.
    // For specific operations like SELECT, INSERT, UPDATE, DELETE, it's better to construct
    // queries programmatically rather than accepting raw SQL.
    // The current database tool implementation mostly constructs queries, but the 'query' operation is raw.
    if (forbiddenKeywords.some(keyword => lowerQuery.includes(keyword))) {
      // Allow SELECT queries even if they might contain these words in comments or string literals.
      // A more sophisticated parser would be needed for true safety.
      if (!lowerQuery.trim().startsWith("select")) {
         throw new Error(`Query contains potentially unsafe keywords: ${forbiddenKeywords.filter(k => lowerQuery.includes(k)).join(', ')}. Only SELECT queries are allowed for raw execution if they contain these terms.`);
      }
    }
  }

  /**
   * Validates if a table name is allowed for access by the tool.
   * @private
   * @param {string} tableName - The name of the table.
   * @param {string[] | undefined} allowedTables - An array of allowed table names from the tool's config.
   * @throws {Error} If access to the table is not allowed.
   */
  private validateTableAccess(tableName: string, allowedTables?: string[]): void {
    if (allowedTables && allowedTables.length > 0 && !allowedTables.includes(tableName)) {
      throw new Error(`Access to table '${tableName}' is not allowed by this tool's configuration.`);
    }
    // If allowedTables is undefined or empty, current behavior is to allow access.
    // For stricter security, an empty or undefined allowedTables list could mean no access.
    // Example for stricter approach:
    // if (!allowedTables || allowedTables.length === 0) {
    //   throw new Error(`No tables are allowed for this tool. Configure 'allowedTables' in the tool settings for table '${tableName}'.`);
    // }
  }

  /**
   * Basic sanitization for SQL identifiers (table/column names).
   * WARNING: This is not foolproof and should be used with caution.
   * Prefer parameterized queries or ORM features for constructing SQL.
   * @private
   * @param {string} identifier - The identifier to sanitize.
   * @returns {string} The sanitized identifier, typically quoted.
   * @throws {Error} If the identifier contains invalid characters.
   */
  private sanitizeIdentifier(identifier: string): string {
    // Basic sanitization for SQL identifiers (table/column names)
    // Replace non-alphanumeric characters (except underscore)
    // THIS IS NOT FOOLPROOF and depends on the specific SQL dialect.
    // For production, use proper parameterized queries or ORM features.
    if (!/^[a-zA-Z0-9_]+$/.test(identifier)) { // Ensure it only contains allowed characters
        throw new Error(`Invalid characters in SQL identifier: ${identifier}. Only alphanumeric characters and underscores are allowed.`);
    }
    // Example for PostgreSQL, adjust quoting for other SQL dialects if necessary
    return `"${identifier}"`;
  }
}

export const agentToolsService = new AgentToolsService();
