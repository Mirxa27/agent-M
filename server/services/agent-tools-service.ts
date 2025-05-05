import { AgentTool, InsertAgentTool } from "@shared/schema";
import fs from "fs/promises";
import path from "path";
import { storage } from "../storage";
import aiService from "./ai-service";

/**
 * Service for managing agent tools
 */
export class AgentToolsService {
  async getAllTools(): Promise<AgentTool[]> {
    return storage.getAllAgentTools();
  }

  async getToolById(id: number): Promise<AgentTool | undefined> {
    return storage.getAgentTool(id);
  }

  async createTool(tool: InsertAgentTool): Promise<AgentTool> {
    return storage.createAgentTool(tool);
  }

  async updateTool(
    id: number,
    updates: Partial<Omit<AgentTool, "id">>,
  ): Promise<AgentTool | undefined> {
    return storage.updateAgentTool(id, updates);
  }

  async deleteTool(id: number): Promise<boolean> {
    const tool = await storage.getAgentTool(id);
    if (tool && tool.isSystem) {
      throw new Error("Cannot delete system tools");
    }
    return storage.deleteAgentTool(id);
  }

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

  private async executeOpenAITool(tool: AgentTool, input: any): Promise<any> {
    try {
      const config = tool.config as any;
      const provider = await storage.getAiProvider(config.providerId || 1);
      if (!provider) throw new Error(`AI Provider not found`);
      const model = await storage.getAiModelByName(config.modelId || "gpt-4o");
      if (!model) throw new Error(`AI Model not found`);
      const systemPrompt = config.systemPrompt || "You are a helpful assistant.";
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ];
      const response = await aiService.createChatCompletion(
        model,
        messages,
        {
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens ?? undefined,
        }
      );
      return {
        success: true,
        result: response.content,
        usage: response.usage,
      };
    } catch (error: any) {
      console.error(`Error executing OpenAI tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  private async executeCustomApiTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const config = tool.config as any;
      if (!config.endpoint) throw new Error("Custom API endpoint not specified in tool config");
      const method = config.method || "POST";
      const headers = config.headers || { "Content-Type": "application/json" };
      const response = await fetch(config.endpoint, {
        method,
        headers,
        body: method !== "GET" ? JSON.stringify(input) : undefined,
      });
      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
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

  private async executeWebhookTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const config = tool.config as any;
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
        throw new Error(`Webhook call failed with status ${response.status}: ${response.statusText}`);
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

  private async executeDatabaseTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const config = tool.config as any;
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
          maxQueryExecutionTime: 5000,
          maxResultRows: 1000,
        });
        switch (operation.toLowerCase()) {
          case "query":
            if (!query || typeof query !== "string") throw new Error("Query operation requires a 'query' string");
            this.validateSafeQuery(query);
            result = await client.query(query, params || []);
            break;
          case "select":
            if (!tableName || typeof tableName !== "string") throw new Error("Select operation requires 'tableName'");
            this.validateTableAccess(tableName, config.allowedTables);
            const selectColumns = columns && Array.isArray(columns) ? columns : ["*"];
            let selectQuery = `SELECT ${selectColumns.join(", ")} FROM ${this.sanitizeIdentifier(tableName)}`;
            const whereParams = [];
            if (conditions && typeof conditions === "object") {
              const whereClauses = [];
              let paramIndex = 1;
              for (const [column, value] of Object.entries(conditions)) {
                whereClauses.push(`${this.sanitizeIdentifier(column)} = $${paramIndex}`);
                whereParams.push(value);
                paramIndex++;
              }
              if (whereClauses.length > 0) selectQuery += ` WHERE ${whereClauses.join(" AND ")}`;
            }
            selectQuery += " LIMIT 100";
            result = await client.query(selectQuery, whereParams);
            break;
          case "insert":
            if (!tableName || typeof tableName !== "string" || !values || typeof values !== "object") {
              throw new Error("Insert operation requires 'tableName' and 'values'");
            }
            this.validateTableAccess(tableName, config.allowedTables);
            const insertColumns = Object.keys(values).map((col) => this.sanitizeIdentifier(col));
            const placeholders = insertColumns.map((_, i) => `$${i + 1}`);
            const insertValues = Object.values(values);
            const insertQuery = `
              INSERT INTO ${this.sanitizeIdentifier(tableName)}
              (${insertColumns.join(", ")})
              VALUES (${placeholders.join(", ")})
              RETURNING *
            `;
            result = await client.query(insertQuery, insertValues);
            break;
          case "update":
            if (!tableName || typeof tableName !== "string" || !values || typeof values !== "object" || !conditions || typeof conditions !== "object") {
              throw new Error("Update operation requires 'tableName', 'values', and 'conditions'");
            }
            this.validateTableAccess(tableName, config.allowedTables);
            const updateClauses = [];
            const updateParams = [];
            let paramIndex = 1;
            for (const [column, value] of Object.entries(values)) {
              updateClauses.push(`${this.sanitizeIdentifier(column)} = $${paramIndex}`);
              updateParams.push(value);
              paramIndex++;
            }
            const whereClauses = [];
            for (const [column, value] of Object.entries(conditions)) {
              whereClauses.push(`${this.sanitizeIdentifier(column)} = $${paramIndex}`);
              updateParams.push(value);
              paramIndex++;
            }
            const updateQuery = `
              UPDATE ${this.sanitizeIdentifier(tableName)}
              SET ${updateClauses.join(", ")}
              WHERE ${whereClauses.join(" AND ")}
              RETURNING *
            `;
            result = await client.query(updateQuery, updateParams);
            break;
          case "delete":
            if (!tableName || typeof tableName !== "string" || !conditions || typeof conditions !== "object") {
              throw new Error("Delete operation requires 'tableName' and 'conditions'");
            }
            this.validateTableAccess(tableName, config.allowedTables);
            const deleteWhereClauses = [];
            const deleteParams = [];
            let deleteParamIndex = 1;
            for (const [column, value] of Object.entries(conditions)) {
              deleteWhereClauses.push(`${this.sanitizeIdentifier(column)} = $${deleteParamIndex}`);
              deleteParams.push(value);
              deleteParamIndex++;
            }
            if (deleteWhereClauses.length === 0) throw new Error("At least one condition is required for DELETE operations");
            const deleteQuery = `
              DELETE FROM ${this.sanitizeIdentifier(tableName)}
              WHERE ${deleteWhereClauses.join(" AND ")}
              RETURNING *
            `;
            result = await client.query(deleteQuery, deleteParams);
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

  private async executeFileSystemTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const config = tool.config as any;
      const { operation } = input;
      if (!operation) throw new Error("File system operation must be specified");
      const baseDirectory = config.baseDirectory || process.env.AGENT_FILE_SANDBOX_DIR;
      if (!baseDirectory) throw new Error("File system tool requires a base directory for sandboxing");
      try { await fs.access(baseDirectory); }
      catch { await fs.mkdir(baseDirectory, { recursive: true }); }
      const getSecurePath = (requestedPath: string) => {
        const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, "");
        const fullPath = path.join(baseDirectory, normalizedPath);
        if (!fullPath.startsWith(baseDirectory)) throw new Error(`Access denied to path outside sandbox: ${requestedPath}`);
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
          await fs.mkdir(dirPath, { recursive: true });
          await fs.writeFile(filePath, input.content);
          return { success: true, result: { path: input.path, bytesWritten: Buffer.byteLength(input.content) } };
        }
        case "append": {
          if (!input.path || input.content === undefined) throw new Error("Append operation requires 'path' and 'content' parameters");
          const filePath = getSecurePath(input.path);
          const dirPath = path.dirname(filePath);
          await fs.mkdir(dirPath, { recursive: true });
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
          const dirPath = input.path ? getSecurePath(input.path) : baseDirectory;
          const files = await fs.readdir(dirPath);
          const fileDetails = await Promise.all(files.map(async (file: string) => {
            const fullPath = path.join(dirPath, file);
            const stats = await fs.stat(fullPath);
            return {
              name: file,
              path: path.relative(baseDirectory, fullPath),
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
          const dirPath = getSecurePath(input.path);
          await fs.mkdir(dirPath, { recursive: true });
          return { success: true, result: { path: input.path, created: true } };
        }
        case "rmdir": {
          if (!input.path) throw new Error("Rmdir operation requires a 'path' parameter");
          const dirPath = getSecurePath(input.path);
          if (input.recursive) await fs.rm(dirPath, { recursive: true, force: true });
          else await fs.rmdir(dirPath);
          return { success: true, result: { path: input.path, removed: true } };
        }
        case "move": {
          if (!input.source || !input.destination) throw new Error("Move operation requires 'source' and 'destination' parameters");
          const sourcePath = getSecurePath(input.source);
          const destPath = getSecurePath(input.destination);
          const destDirPath = path.dirname(destPath);
          await fs.mkdir(destDirPath, { recursive: true });
          await fs.rename(sourcePath, destPath);
          return { success: true, result: { source: input.source, destination: input.destination, moved: true } };
        }
        case "copy": {
          if (!input.source || !input.destination) throw new Error("Copy operation requires 'source' and 'destination' parameters");
          const sourcePath = getSecurePath(input.source);
          const destPath = getSecurePath(input.destination);
          try { await fs.access(sourcePath); } catch { throw new Error(`Source file not found: ${input.source}`); }
          const stats = await fs.stat(sourcePath);
          const destDirPath = path.dirname(destPath);
          await fs.mkdir(destDirPath, { recursive: true });
          if (stats.isDirectory()) throw new Error("Copying directories is not supported in this version");
          else {
            const content = await fs.readFile(sourcePath);
            await fs.writeFile(destPath, content);
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

  private async executeEmailTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const config = tool.config as any;
      const { apiKey, apiUrl } = config;
      const { to, subject, body } = input;
      if (!apiKey || !apiUrl) throw new Error("Email tool requires 'apiKey' and 'apiUrl' in config.");
      if (!to || !subject || !body) throw new Error("Email tool input requires 'to', 'subject', and 'body'.");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ to, subject, body }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Email API call failed with status ${response.status}: ${errorText}`);
      }
      const result = await response.json();
      return { success: true, result: result || "Email sent successfully." };
    } catch (error: any) {
      console.error(`Error executing email tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  private async executeSMSTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const config = tool.config as any;
      const { apiKey, apiUrl, fromNumber } = config;
      const { to, message } = input;
      if (!apiKey || !apiUrl) throw new Error("SMS tool requires 'apiKey' and 'apiUrl' in config.");
      if (!to || !message) throw new Error("SMS tool input requires 'to' and 'message'.");
      const payload: any = { to, body: message };
      if (fromNumber) payload.from = fromNumber;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${config.accountSid || ""}:${apiKey}`).toString("base64")}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SMS API call failed with status ${response.status}: ${errorText}`);
      }
      const result = await response.json();
      return { success: true, result: result || "SMS sent successfully." };
    } catch (error: any) {
      console.error(`Error executing SMS tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  private async executeSearchTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const config = tool.config as any;
      const { apiKey, searchEngineUrl = "https://api.example-search.com/search" } = config;
      const query = typeof input === "string" ? input : input?.query;
      if (!apiKey) throw new Error("Search tool requires 'apiKey' in config.");
      if (!query) throw new Error("Search tool input requires a query string.");
      const searchUrl = new URL(searchEngineUrl);
      searchUrl.searchParams.append("q", query);
      const response = await fetch(searchUrl.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search API call failed with status ${response.status}: ${errorText}`);
      }
      const results = await response.json();
      return { success: true, result: results };
    } catch (error: any) {
      console.error(`Error executing search tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  private async executeCustomTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const config = tool.config as any;
      if (config.webhookUrl) {
        const response = await fetch(config.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
          },
          body: JSON.stringify({
            tool: tool.name,
            input,
            config: { ...config, apiKey: undefined },
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Custom tool webhook failed with status ${response.status}: ${errorText}`);
        }
        const result = await response.json();
        return result;
      } else {
        throw new Error("Custom tool requires a webhookUrl in config");
      }
    } catch (error: any) {
      console.error(`Error executing custom tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  // --- Security helpers ---

  private getDbClient(type: string, connectionString: string, options: any): Promise<any> {
    // Not implemented for security reasons
    throw new Error("Database connections are disabled in this version for security reasons");
  }

  private validateSafeQuery(query: string): void {
    const forbiddenPatterns = [
      /\bDROP\b/i,
      /\bTRUNCATE\b/i,
      /\bALTER\b/i,
      /\bCREATE\b/i,
      /\bDELETE\b(?!\s+FROM)/i,
      /\bUPDATE\b(?!\s+\w+\s+SET)/i,
      /\bGRANT\b/i,
      /\bREVOKE\b/i,
      /\bDELETE\s+FROM\s+\w+\s*(?!\s+WHERE)/i,
      /\bUPDATE\s+\w+\s+SET\s+(?:\w+\s*=\s*\w+\s*,\s*)*\w+\s*=\s*\w+\\s*(?!\s+WHERE)/i,
    ];
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(query)) throw new Error(`Query contains forbidden operation: ${pattern}`);
    }
  }

  private validateTableAccess(tableName: string, allowedTables?: string[]): void {
    if (allowedTables && Array.isArray(allowedTables) && allowedTables.length > 0) {
      if (!allowedTables.includes(tableName)) throw new Error(`Access to table '${tableName}' is not allowed`);
    }
  }

  private sanitizeIdentifier(identifier: string): string {
    const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, "");
    if (sanitized !== identifier) {
      console.warn(`Identifier '${identifier}' was sanitized to '${sanitized}'`);
    }
    return sanitized;
  }
}

export const agentToolsService = new AgentToolsService();
