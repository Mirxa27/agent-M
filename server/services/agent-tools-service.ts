import { AgentTool, InsertAgentTool, Task, insertAgentToolSchema, openAIToolConfigSchema, customApiToolConfigSchema, webhookToolConfigSchema, databaseToolConfigSchema, fileSystemToolConfigSchema, emailToolConfigSchema, smsToolConfigSchema, searchToolConfigSchema, customToolConfigSchema, type Credential } from "@shared/schema";
import fs from "fs/promises";
import path from "path";
import { storage } from "../storage";
import aiService, { AIProvider, AgentConfig, AIMessage } from "./ai-service";
import { DatabaseStorage } from "../storage";
import nodemailer from "nodemailer";
import { decrypt } from "../../shared/crypto";
import * as twilio from 'twilio';
import axios from 'axios';






export class AgentToolsService {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  async getAllTools(): Promise<AgentTool[]> {
    return this.storage.getAllAgentTools();
  }

  async getToolById(id: number): Promise<AgentTool | undefined> {
    return this.storage.getAgentTool(id);
  }

  async createTool(tool: InsertAgentTool): Promise<AgentTool> {
    const validationResult = insertAgentToolSchema.safeParse(tool);
    if (!validationResult.success) {
      console.error("Agent tool creation validation failed:", validationResult.error.flatten());
      throw new Error(`Invalid agent tool data: ${validationResult.error.flatten().fieldErrors}`);
    }
    return this.storage.createAgentTool(validationResult.data);
  }

  async updateTool(id: number, updates: Partial<InsertAgentTool>): Promise<AgentTool | undefined> {
    const existingTool = await this.storage.getAgentTool(id);
    if (!existingTool) {
      throw new Error(`Tool with ID ${id} not found for update.`);
    }

    const mergedData = {
      name: existingTool.name,
      description: existingTool.description,
      category: existingTool.category,
      type: existingTool.type,
      config: existingTool.config,
      icon: existingTool.icon,
      isActive: existingTool.isActive,
      ...updates,
    };

    const validationResult = insertAgentToolSchema.safeParse(mergedData);

    if (!validationResult.success) {
      console.error(`Agent tool update validation failed for ID ${id}:`, validationResult.error.flatten().fieldErrors);
      const flatError = validationResult.error.flatten();
      let errorMessages = "Invalid agent tool update data: ";
      // Iterate over fieldErrors, which is an object where keys are paths
      for (const pathKey in flatError.fieldErrors) {
          const pathErrors = flatError.fieldErrors[pathKey as keyof typeof flatError.fieldErrors];
          if (pathErrors) {
              errorMessages += `${pathKey}: ${pathErrors.join(', ')}; `;
          }
      }
      if (flatError.formErrors.length > 0) {
          errorMessages += `Global: ${flatError.formErrors.join(', ')};`;
      }
      throw new Error(errorMessages);
    }

    const validatedFullObject = validationResult.data; // This is InsertAgentTool
    const changesToPersist: Partial<AgentTool> = {};

    // Iterate over the keys of the original 'updates' object
    for (const k of Object.keys(updates) as Array<keyof Partial<InsertAgentTool>>) {
        if (updates[k] !== undefined && validatedFullObject.hasOwnProperty(k)) {
             // Assign the validated value from mergedData (which became validationResult.data)
            (changesToPersist as any)[k] = (validatedFullObject as any)[k];
        }
    }
    return this.storage.updateAgentTool(id, changesToPersist);
  }

  async deleteTool(id: number): Promise<boolean> {
    const tool = await this.storage.getAgentTool(id);
    if (tool && tool.isSystem) {
      throw new Error("Cannot delete system tools");
    }
    return this.storage.deleteAgentTool(id);
  }

  async executeTool(toolId: number, input: any, userId?: number): Promise<any> {
    const tool = await this.storage.getAgentTool(toolId);
    if (!tool) throw new Error(`Tool with ID ${toolId} not found`);
    if (!tool.isActive) throw new Error(`Tool ${tool.name} is inactive`);

    console.log(`User ${userId} executed tool ${tool.name} with input:`, input);

    switch (tool.type) {
      case "openai":
        return this.executeOpenAITool(tool, input, userId); // Pass userId to executeOpenAITool
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
      case "custom":
        return this.executeCustomTool(tool, input);
      default:
        throw new Error(`Unsupported tool type: ${tool.type}`);
    }
  }

  private async executeOpenAITool(tool: AgentTool, input: any, userId?: number): Promise<any> { // Add userId parameter
    try {
      const validationResult = openAIToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid OpenAI tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const toolConfig = validationResult.data;

      const providerInfo = await storage.getAiProvider(toolConfig.providerId || 1);
      if (!providerInfo) throw new Error(`AI Provider for OpenAI tool not found (ID: ${toolConfig.providerId || 1}).`);

      const modelInfo = await storage.getAiModelByName(toolConfig.modelId || "gpt-4o");
      if (!modelInfo) throw new Error(`AI Model '${toolConfig.modelId || "gpt-4o"}' not found.`);

      const systemPrompt = toolConfig.systemPrompt || "You are a helpful assistant.";

      const userMessages: { role: "system" | "user" | "assistant" | "tool"; content: string | null }[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: String(input) },
      ];

      const mockTask: Task = {
        id: 0,
        userId: userId || 0, // Use provided userId or default to 0
        agentId: 0,
        title: `OpenAI Tool: ${tool.name}`,
        description: `Executing OpenAI tool with input: ${String(input).substring(0, 100)}...`,
        status: "processing",
        createdAt: new Date(),
        completedAt: null,
        result: null,
      };

      const agentServiceConfig: AgentConfig = { // Use imported AgentConfig
        provider: providerInfo.provider as AIProvider,
        model: modelInfo.modelId,
        systemInstructions: systemPrompt,
        tools: [],
      };

      const response = await aiService.processTask(mockTask, agentServiceConfig, userMessages as AIMessage[]);
      return { success: true, result: response.content, usage: response.usage };
    } catch (error: any) {
      console.error(`Error executing OpenAI tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

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

  private async executeDatabaseTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = databaseToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid Database tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      // Get database connection details from config
      const connectionType = config.connectionType;
      const connectionString = config.connectionString;
      const allowedTables = config.allowedTables;

      if (!connectionType || !connectionString) {
        throw new Error("Database connection details not found in tool config");
      }

      const dbClient = await this.getDbClient(connectionType, connectionString);

      // Validate and sanitize input
      const { operation, tableName, query, columns, conditions, values } = input;

      if (!operation || !tableName) {
        throw new Error("Database operation and table name must be specified");
      }

      this.validateTableAccess(tableName, allowedTables);
      const sanitizedTableName = this.sanitizeIdentifier(tableName);

      let result;
      switch (operation.toLowerCase()) {
        case "query":
          if (!query) throw new Error("Query operation requires a 'query' parameter");
          this.validateSafeQuery(query); // Placeholder for query validation
          result = await dbClient.query(query);
          break;
        case "select":
          result = await dbClient.select(columns || "*").from(sanitizedTableName).where(conditions);
          break;
        case "insert":
          if (!values) throw new Error("Insert operation requires 'values' parameter");
          result = await dbClient.insert(sanitizedTableName).values(values).returning();
          break;
        case "update":
          if (!values) throw new Error("Update operation requires 'values' parameter");
          result = await dbClient.update(sanitizedTableName).set(values).where(conditions).returning();
          break;
        case "delete":
          result = await dbClient.delete(sanitizedTableName).where(conditions).returning();
          break;
        default:
          throw new Error(`Unsupported database operation: ${operation}`);
      }

      return { success: true, result };
    } catch (error: any) {
      console.error(`Error executing database tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }




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

      try {
        await fs.access(baseDirectory);
      } catch {
        await fs.mkdir(baseDirectory, { recursive: true });
      }

      const getSecurePath = (requestedPath: string): string => {
        const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, "");
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
          const dirPathToList = input.path ? getSecurePath(input.path) : baseDirectory;
          const filesInDir = await fs.readdir(dirPathToList);
          const fileDetails = await Promise.all(filesInDir.map(async (file: string) => {
            const fullFilePath = path.join(dirPathToList, file);
            const stats = await fs.stat(fullFilePath);
            return {
              name: file,
              path: path.relative(baseDirectory, fullFilePath),
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
          await fs.mkdir(destDirPathFull, { recursive: true });
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
          await fs.mkdir(destDirPathFull, { recursive: true });
          if (stats.isDirectory()) {
            throw new Error("Copying directories recursively is not implemented in this basic version. Use fs.cp if available or implement manually.");
          } else {
            await fs.copyFile(sourcePathFull, destPathFull);
          }
          return { success: true, result: { source: input.source, destination: input.destination, copied: true, isDirectory: stats.isDirectory() } };
        }
        default:
          return { success: false, error: `Unsupported file system operation: ${operation}` }; // Return a default value
      }
    } catch (error: any) {
      console.error(`Error executing file system tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  private async executeEmailTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = emailToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid Email tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      const { to, subject, body } = input;

      if (!to || !subject || !body) {
        throw new Error("Email requires 'to', 'subject', and 'body' parameters");
      }

      let transporter;
      if (config.credentialId) {
        // Use credential if provided
        const credential = await this.storage.getCredential(config.credentialId);
        if (!credential) {
          throw new Error(`Credential with ID ${config.credentialId} not found`);
        }
        const decryptedData = decrypt(credential.data);
        if (!decryptedData) {
          throw new Error("Failed to decrypt credential data");
        }
        const credentialData = JSON.parse(decryptedData);

        // Assuming credential data contains necessary info for Nodemailer
        transporter = nodemailer.createTransport(credentialData);
      } else if (config.provider === "sendgrid" && config.apiKey) {
        // Use SendGrid if configured
        transporter = nodemailer.createTransport({
          service: "SendGrid",
          auth: {
            user: "apikey",
            pass: config.apiKey,
          },
        });
      } else if (config.provider === "smtp") {
        // Use SMTP if configured
        transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: config.user,
            pass: config.password,
          },
        });
      } else if (config.provider === "custom_api" && config.apiUrl) {
        // Use custom API if configured
        // Implementation would depend on the specific API
        throw new Error("Custom email API not yet implemented");
      } else {
        throw new Error("Email provider or credential not configured");
      }

      const mailOptions = {
        from: config.from || '"Mirxa AI" <noreply@mirxa.ai>', // Default sender
        to,
        subject,
        html: body, // Use HTML body
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, result: info };
    } catch (error: any) {
      console.error(`Error executing email tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }


  private async executeSMSTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = smsToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid SMS tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      const { to, message } = input;

      if (!to || !message) {
        throw new Error("SMS requires 'to' and 'message' parameters");
      }

      let client;
      if (config.credentialId) {
        const credential = await this.storage.getCredential(config.credentialId);
        if (!credential) {
          throw new Error(`Credential with ID ${config.credentialId} not found`);
        }

        const decryptedData = decrypt(credential.data);
        if (!decryptedData) {
          throw new Error("Failed to decrypt credential data");
        }

        const credentialData = JSON.parse(decryptedData);
        client = new twilio.Twilio(credentialData.accountSid, credentialData.authToken);
      } else if (config.provider === "twilio" && config.accountSid && config.authToken) {
        client = new twilio.Twilio(config.accountSid, config.authToken);
      } else if (config.provider === "custom_api" && config.apiUrl) {
        // Implementation would depend on the specific API
        throw new Error("Custom SMS API not yet implemented");
      } else {
        throw new Error("SMS provider or credential not configured");
      }

      const messageData = {
        body: message,
        from: config.fromNumber || "+1234567890", // Replace with your Twilio number
        to,
      };

      const result = await client.messages.create(messageData);
      return { success: true, result };

    } catch (error: any) {
      console.error(`Error executing SMS tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }


  private async executeSearchTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = searchToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid Search tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      const { query } = input;

      if (!query) {
        throw new Error("Search tool requires a 'query' parameter");
      }

      let searchUrl: string;
      let headers: Record<string, string> = {};

      if (config.credentialId) {
        const credential = await this.storage.getCredential(config.credentialId);
        if (!credential) {
          throw new Error(`Credential with ID ${config.credentialId} not found`);
        }
        const decryptedData = decrypt(credential.data);
        if (!decryptedData) {
          throw new Error("Failed to decrypt credential data");
        }
        const credentialData = JSON.parse(decryptedData);

        if (config.provider === "google" && credentialData.apiKey && config.searchEngineId) {
          searchUrl = `https://www.googleapis.com/customsearch/v1?key=${credentialData.apiKey}&cx=${config.searchEngineId}&q=${encodeURIComponent(query)}`;
        } else if (config.provider === "bing" && credentialData.apiKey) {
          searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`;
          headers['Ocp-Apim-Subscription-Key'] = credentialData.apiKey;
        } else if (config.provider === "custom_api" && config.apiUrl && credentialData.apiKey) {
          searchUrl = `${config.apiUrl}?q=${encodeURIComponent(query)}`;
          headers['Authorization'] = `Bearer ${credentialData.apiKey}`;
        } else {
          throw new Error("Search provider or credential not configured correctly");
        }
      } else if (config.provider === "google" && config.apiKey && config.searchEngineId) {
        searchUrl = `https://www.googleapis.com/customsearch/v1?key=${config.apiKey}&cx=${config.searchEngineId}&q=${encodeURIComponent(query)}`;
      } else if (config.provider === "bing" && config.apiKey) {
        searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`;
        headers['Ocp-Apim-Subscription-Key'] = config.apiKey;
      } else if (config.provider === "custom_api" && config.apiUrl && config.apiKey) {
        searchUrl = `${config.apiUrl}?q=${encodeURIComponent(query)}`;
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      } else {
        throw new Error("Search provider or API key not configured");
      }

      const response = await axios.get(searchUrl, { headers });

      // Basic result formatting - may need to be customized per provider
      let results;
      if (config.provider === "google") {
        results = response.data.items || response.data.webPages?.value || response.data;
      } else if (config.provider === "bing") {
        results = response.data.webPages?.value || response.data;
      } else {
        results = response.data;
      }

      return { success: true, result: results };

    } catch (error: any) {
      console.error(`Error executing search tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }


  private async executeCustomTool(tool: AgentTool, input: any): Promise<any> {
    try {
      const validationResult = customToolConfigSchema.safeParse(tool.config);
      if (!validationResult.success) {
        throw new Error(`Invalid Custom tool configuration: ${validationResult.error.flatten().fieldErrors}`);
      }
      const config = validationResult.data;

      if (!config.scriptPath) {
        throw new Error("Custom tool requires 'scriptPath' in config");
      }

      const scriptPath = path.join(process.cwd(), config.scriptPath);

      // Basic execution - could be expanded to support different runtimes
      // For now, assumes a Node.js script
      try {
        // Dynamically import the script
        const customScript = await import(scriptPath);

        // Assuming the script exports a default function that takes input and config
        if (typeof customScript.default === 'function') {
          const result = await customScript.default(input, config.parameters);
          return { success: true, result };
        } else {
          throw new Error(`Custom script at ${config.scriptPath} does not export a default function`);
        }
      } catch (importError: any) {
        console.error(`Error importing custom script ${config.scriptPath}:`, importError);
        throw new Error(`Failed to load custom script: ${importError.message}`);
      }

    } catch (error: any) {
      console.error(`Error executing custom tool ${tool.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  private getDbClient(type: string, connectionString: string, options: any = {}): Promise<any> {
    console.warn("STUB: getDbClient not implemented", type, connectionString, options);
    throw new Error("STUB: getDbClient not implemented");
  }

  private validateSafeQuery(query: string): void {
    console.warn("STUB: validateSafeQuery not implemented", query);
    // This method is void, so no return/throw needed if it's just a stub
  }

  private validateTableAccess(tableName: string, allowedTables?: string[]): void {
    console.warn("STUB: validateTableAccess not implemented", tableName, allowedTables);
    // This method is void, so no return/throw needed if it's just a stub
  }

  private sanitizeIdentifier(identifier: string): string {
    console.warn("STUB: sanitizeIdentifier not implemented", identifier);
    // Return a placeholder or throw, as it expects a string return
    return identifier; // Placeholder: return the original identifier
  }
}

export const agentToolsService = new AgentToolsService(storage);
