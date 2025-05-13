import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  planId: integer("plan_id"),
  planExpiresAt: timestamp("plan_expires_at"),
  role: text("role").default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
    fullName: true,
    planId: true,
    planExpiresAt: true,
    role: true,
    isActive: true,
  })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
    email: z.string().email("Invalid email address"),
    planId: z.number().nullable().optional(),
    planExpiresAt: z.date().nullable().optional(),
    role: z.string().optional(),
    isActive: z.boolean().optional(),
  });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Agent tools schema
export const agentTools = pgTable("agent_tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(),
  config: jsonb("config").default({}).notNull(),
  icon: text("icon").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const openAIToolConfigSchema = z.object({
  providerId: z.number().optional().describe("AI Provider ID (defaults to a system default if not provided)"),
  modelId: z.string().optional().describe("AI Model Name (e.g., 'gpt-4o', defaults to a system default if not provided)"),
  systemPrompt: z.string().optional().describe("System prompt for the OpenAI tool"),
  temperature: z.number().min(0).max(2).optional().describe("Sampling temperature"),
  maxTokens: z.number().int().positive().optional().describe("Maximum tokens to generate"),
}).strict();

export const customApiToolConfigSchema = z.object({
  endpoint: z.string().url("Must be a valid URL").describe("API endpoint URL"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("POST").describe("HTTP method"),
  headers: z.record(z.string()).optional().describe("HTTP headers as key-value pairs"),
}).strict();

export const webhookToolConfigSchema = z.object({
  webhookUrl: z.string().url("Must be a valid URL").describe("Webhook URL to call"),
  headers: z.record(z.string()).optional().describe("Custom headers for the webhook call"),
  additionalData: z.record(z.any()).optional().describe("Additional static data to include in the webhook payload"),
}).strict();

export const databaseToolConfigSchema = z.object({
  connectionType: z.enum(["postgres", "mysql", "sqlite"]).describe("Type of the database"),
  connectionString: z.string().describe("Database connection string (sensitive, should be handled securely if stored directly, consider referencing a credential ID)"),
  allowedTables: z.array(z.string()).optional().describe("List of tables the tool is allowed to interact with. If empty or undefined, access might be restricted or open based on service implementation."),
}).strict();

export const fileSystemToolConfigSchema = z.object({
  baseDirectory: z.string().optional().describe("Base directory for sandboxing. If not set, uses AGENT_FILE_SANDBOX_DIR env var."),
}).strict();

export const emailToolConfigSchema = z.object({
  credentialId: z.number().int().positive().optional().describe("ID of the credential to use for sending email"),
  provider: z.enum(["sendgrid", "smtp", "custom_api"]).optional().describe("Email provider type"),
  apiKey: z.string().optional().describe("API Key for email service (use credentialId instead if possible)"),
  apiUrl: z.string().url().optional().describe("API URL for email service (if custom_api)"),
  host: z.string().optional().describe("SMTP server host"),
  port: z.number().optional().describe("SMTP server port"),
  secure: z.boolean().optional().describe("Use secure connection for SMTP"),
  user: z.string().optional().describe("SMTP username"),
  password: z.string().optional().describe("SMTP password"),
  from: z.string().optional().describe("Sender email address"),
}).strict();

export const smsToolConfigSchema = z.object({
  authToken: z.string().optional().describe("Twilio Auth Token"),
  credentialId: z.number().int().positive().optional().describe("ID of the credential to use for sending SMS"),
  provider: z.enum(["twilio", "custom_api"]).optional().describe("SMS provider type"),
  accountSid: z.string().optional().describe("Account SID for SMS service (use credentialId instead if possible)"),
  apiKey: z.string().optional().describe("API Key/Auth Token for SMS service (use credentialId instead if possible)"),
  apiUrl: z.string().url().optional().describe("API URL for SMS service (if custom_api)"),
  fromNumber: z.string().optional().describe("Default 'from' phone number"),
}).strict();

export const searchToolConfigSchema = z.object({
  credentialId: z.number().int().positive().optional().describe("ID of the credential to use for the search API"),
  provider: z.enum(["google", "bing", "custom_api"]).optional().describe("Search provider type"),
  apiKey: z.string().optional().describe("API Key for search service (use credentialId instead if possible)"),
  searchEngineId: z.string().optional().describe("Search Engine ID (e.g., for Google Custom Search)"),
  searchEngineUrl: z.string().url().optional().describe("API URL for search service (if custom_api)"),
  apiUrl: z.string().url().optional().describe("API URL for search service (if custom_api)"),
}).strict();

export const customToolConfigSchema = z.object({
  scriptPath: z.string().optional().describe("Path to a custom script to execute (if applicable)"),
  runtime: z.string().optional().describe("Runtime for the script (e.g., 'nodejs', 'python')"),
  parameters: z.record(z.any()).optional().describe("Custom parameters for the tool"),
}).strict();

export const agentToolConfigSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("openai"), config: openAIToolConfigSchema }),
  z.object({ type: z.literal("custom_api"), config: customApiToolConfigSchema }),
  z.object({ type: z.literal("webhook"), config: webhookToolConfigSchema }),
  z.object({ type: z.literal("database"), config: databaseToolConfigSchema }),
  z.object({ type: z.literal("file_system"), config: fileSystemToolConfigSchema }),
  z.object({ type: z.literal("email"), config: emailToolConfigSchema }),
  z.object({ type: z.literal("sms"), config: smsToolConfigSchema }),
  z.object({ type: z.literal("search"), config: searchToolConfigSchema }),
  z.object({ type: z.literal("custom"), config: customToolConfigSchema }),
]);


export type AgentTool = typeof agentTools.$inferSelect;
export type InsertAgentTool = z.infer<typeof insertAgentToolSchema>;
