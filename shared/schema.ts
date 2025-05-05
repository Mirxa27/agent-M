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
  })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
    email: z.string().email("Invalid email address"),
  });

// Agent tools schema
export const agentTools = pgTable("agent_tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., 'data_processing', 'content_generation', etc.
  type: text("type").notNull(), // e.g., 'openai', 'custom', 'webhook', etc.
  config: jsonb("config").default({}).notNull(), // Tool specific configuration
  icon: text("icon").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isSystem: boolean("is_system").default(false).notNull(), // If true, tool is provided by system and can't be deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentToolSchema = createInsertSchema(agentTools).pick({
  name: true,
  description: true,
  category: true,
  type: true,
  config: true,
  icon: true,
  isActive: true,
});

// Agent schema
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  icon: text("icon").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isTemplate: boolean("is_template").default(false).notNull(), // Flag for agent templates
  taskCount: integer("task_count").default(0).notNull(),
  config: jsonb("config").default({}).notNull(),
  tools: jsonb("tools").default([]).notNull(), // List of attached tool IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentSchema = createInsertSchema(agents).pick({
  userId: true,
  name: true,
  description: true,
  type: true,
  icon: true,
  isActive: true,
  isTemplate: true,
  config: true,
  tools: true,
});

// Credential schema
export const credentials = pgTable("credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  data: text("data").notNull(), // Encrypted data
  authMethod: text("auth_method").default("api_key").notNull(), // 'api_key', 'oauth', 'direct_login'
  service: text("service"), // Service identifier (e.g., 'openai', 'anthropic', etc.)
  expiresAt: timestamp("expires_at"), // When credentials expire (null for non-expiring)
  lastRefreshedAt: timestamp("last_refreshed_at"), // For OAuth refresh tokens
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCredentialSchema = createInsertSchema(credentials).pick({
  userId: true,
  name: true,
  type: true,
  data: true,
  authMethod: true,
  service: true,
  expiresAt: true,
  lastRefreshedAt: true,
});

// File/Template schema
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  isTemplate: boolean("is_template").default(false).notNull(),
  templateType: text("template_type"),
  templateCategory: text("template_category"), // New: category for organizing templates
  description: text("description"), // New: description for templates
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFileSchema = createInsertSchema(files).pick({
  userId: true,
  name: true,
  type: true,
  contentType: true,
  size: true,
  path: true,
  isTemplate: true,
  templateType: true,
  templateCategory: true,
  description: true,
});

// Task schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  agentId: integer("agent_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  userId: true,
  agentId: true,
  title: true,
  description: true,
});

// Message schema (for task conversations)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  role: text("role").notNull(), // 'user', 'assistant', or 'system'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull(), // Added for tool call info and extensibility
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  taskId: true,
  role: true,
  content: true,
  timestamp: true,
  metadata: true, // Added
});

// Task-File relationship schema
export const taskFiles = pgTable("task_files", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  fileId: integer("file_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskFileSchema = createInsertSchema(taskFiles).pick({
  taskId: true,
  fileId: true,
});

// AI Provider schema (for admin)
export const aiProviders = pgTable("ai_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // e.g., 'openai', 'anthropic', 'xai'
  description: text("description"),
  baseUrl: text("base_url"),
  authType: text("auth_type").default("api_key").notNull(), // 'api_key', 'oauth', 'basic_auth'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiProviderSchema = createInsertSchema(aiProviders).pick({
  name: true,
  provider: true,
  description: true,
  baseUrl: true,
  authType: true,
  isActive: true,
});

// AI Model schema
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  name: text("name").notNull(),
  modelId: text("model_id").notNull(), // The actual model ID used by the provider (e.g., "gpt-4o")
  description: text("description"),
  capabilities: jsonb("capabilities").default([]).notNull(), // e.g., ["text", "image", "audio"]
  contextWindow: integer("context_window"), // Max tokens in context
  maxOutputTokens: integer("max_output_tokens"),
  costInputPerK: decimal("cost_input_per_k", { precision: 10, scale: 6 }), // Cost per 1K input tokens
  costOutputPerK: decimal("cost_output_per_k", { precision: 10, scale: 6 }), // Cost per 1K output tokens
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiModelSchema = createInsertSchema(aiModels).pick({
  providerId: true,
  name: true,
  modelId: true,
  description: true,
  capabilities: true,
  contextWindow: true,
  maxOutputTokens: true,
  costInputPerK: true,
  costOutputPerK: true,
  isActive: true,
  isDefault: true,
});

// AI Model Prompts schema
export const aiPrompts = pgTable("ai_prompts", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  purpose: text("purpose").notNull(), // e.g., "email_writing", "code_generation", "general"
  systemPrompt: text("system_prompt").notNull(),
  defaultUserPrompt: text("default_user_prompt"),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default(
    "0.7",
  ),
  topP: decimal("top_p", { precision: 3, scale: 2 }).default("1.0"),
  frequencyPenalty: decimal("frequency_penalty", {
    precision: 3,
    scale: 2,
  }).default("0.0"),
  presencePenalty: decimal("presence_penalty", {
    precision: 3,
    scale: 2,
  }).default("0.0"),
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiPromptSchema = createInsertSchema(aiPrompts).pick({
  modelId: true,
  name: true,
  description: true,
  purpose: true,
  systemPrompt: true,
  defaultUserPrompt: true,
  temperature: true,
  topP: true,
  frequencyPenalty: true,
  presencePenalty: true,
  isActive: true,
  isDefault: true,
});

// Subscription Plan schema
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  price: integer("price").notNull(), // in SAR (Saudi Riyal)
  interval: text("interval").notNull(), // 'monthly' or 'yearly'
  features: jsonb("features").default({}).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertPlanSchema = createInsertSchema(plans).pick({
  name: true,
  price: true,
  interval: true,
  features: true,
  isActive: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AgentTool = typeof agentTools.$inferSelect;
export type InsertAgentTool = z.infer<typeof insertAgentToolSchema>;

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type Credential = typeof credentials.$inferSelect;
export type InsertCredential = z.infer<typeof insertCredentialSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type TaskFile = typeof taskFiles.$inferSelect;
export type InsertTaskFile = z.infer<typeof insertTaskFileSchema>;

export type AiProvider = typeof aiProviders.$inferSelect;
export type InsertAiProvider = z.infer<typeof insertAiProviderSchema>;

export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiModel = z.infer<typeof insertAiModelSchema>;

export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = z.infer<typeof insertAiPromptSchema>;

// User Activities schema
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: text("activity_type").notNull(), // 'login', 'agent_created', 'task_created', 'task_completed', etc.
  resourceId: integer("resource_id"), // Related resource ID (e.g., taskId, agentId)
  resourceType: text("resource_type"), // 'task', 'agent', 'credential', etc.
  metadata: jsonb("metadata").default({}).notNull(), // Additional activity details
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserActivitySchema = createInsertSchema(userActivities).pick(
  {
    userId: true,
    activityType: true,
    resourceId: true,
    resourceType: true,
    metadata: true,
  },
);

// User Dashboard Preferences schema
export const dashboardPreferences = pgTable("dashboard_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  layout: jsonb("layout").default({}).notNull(), // Widget layout configuration
  favoriteAgents: jsonb("favorite_agents").default([]).notNull(), // List of favorite agent IDs
  recentTasks: jsonb("recent_tasks").default([]).notNull(), // List of recent task IDs
  widgets: jsonb("widgets").default([]).notNull(), // Enabled widgets and their configs
  theme: text("theme").default("light").notNull(), // 'light', 'dark', 'system'
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDashboardPreferenceSchema = createInsertSchema(
  dashboardPreferences,
).pick({
  userId: true,
  layout: true,
  favoriteAgents: true,
  recentTasks: true,
  widgets: true,
  theme: true,
});

// Analytics schema (for user insights)
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  period: text("period").notNull(), // 'day', 'week', 'month', 'year'
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  taskCount: integer("task_count").default(0).notNull(),
  successfulTaskCount: integer("successful_task_count").default(0).notNull(),
  failedTaskCount: integer("failed_task_count").default(0).notNull(),
  tokenUsage: integer("token_usage").default(0).notNull(),
  mostUsedAgentId: integer("most_used_agent_id"),
  mostUsedToolType: text("most_used_tool_type"),
  averageCompletionTime: integer("average_completion_time"), // in seconds
  metadata: jsonb("metadata").default({}).notNull(), // Additional analytics data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).pick({
  userId: true,
  period: true,
  periodStart: true,
  periodEnd: true,
  taskCount: true,
  successfulTaskCount: true,
  failedTaskCount: true,
  tokenUsage: true,
  mostUsedAgentId: true,
  mostUsedToolType: true,
  averageCompletionTime: true,
  metadata: true,
});

// Site Settings schema
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  logo: jsonb("logo").default({
    url: "/assets/images/mirxa-logo.svg",
    showText: true,
    text: "Mirxa.io",
    animated: true,
  }).notNull(),
  colors: jsonb("colors").default({
    primary: "#6366f1",
    secondary: "#0ea5e9",
    accent: "#f97316",
    background: "#ffffff",
    text: "#1e293b",
  }).notNull(),
  header: jsonb("header").default({
    sticky: true,
    transparent: false,
    showLogo: true,
    showNavigation: true,
  }).notNull(),
  footer: jsonb("footer").default({
    showCopyright: true,
    copyrightText: "© 2025 Mirxa.io. All rights reserved.",
    showSocial: true,
  }).notNull(),
  chatbot: jsonb("chatbot").default({
    enabled: true,
    position: "bottom-right",
    welcomeMessage: "Hi! How can I assist you today?",
    color: "#6366f1",
  }).notNull(),
  widgets: jsonb("widgets").default([
    { id: 'header-widget', label: 'Header' },
    { id: 'hero-widget', label: 'Hero Section' },
    { id: 'features-widget', label: 'Features' },
    { id: 'testimonials-widget', label: 'Testimonials' },
    { id: 'cta-widget', label: 'Call to Action' },
    { id: 'footer-widget', label: 'Footer' },
  ]).notNull(),
  version: integer("version").default(1).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedBy: integer("updated_by"), // User ID who last updated settings
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).pick({
  logo: true,
  colors: true,
  header: true,
  footer: true,
  chatbot: true,
  widgets: true,
  version: true,
  updatedBy: true,
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

export type DashboardPreference = typeof dashboardPreferences.$inferSelect;
export type InsertDashboardPreference = z.infer<
  typeof insertDashboardPreferenceSchema
>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

// AI Browser Observer schema
export const browserActions = pgTable("browser_actions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  actionType: text("action_type").notNull(), // 'click', 'input', 'navigation', 'scroll', 'select', etc.
  targetElement: text("target_element").notNull(), // CSS selector or XPath
  url: text("url").notNull(),
  valueOrText: text("value_or_text"), // Content of an input field or text of a clicked element
  metadata: jsonb("metadata").default({}).notNull(), // Additional context (e.g., attributes, screen size)
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const browserSequences = pgTable("browser_sequences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isAutomated: boolean("is_automated").default(false).notNull(),
  triggerType: text("trigger_type"), // 'manual', 'scheduled', 'event'
  triggerCondition: jsonb("trigger_condition"), // Conditions for automatic execution
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastExecutedAt: timestamp("last_executed_at"),
  executionCount: integer("execution_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const browserSequenceSteps = pgTable("browser_sequence_steps", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").notNull(),
  stepOrder: integer("step_order").notNull(),
  actionType: text("action_type").notNull(), // Same as browserActions.actionType
  targetElement: text("target_element").notNull(),
  targetUrl: text("target_url"),
  valueOrText: text("value_or_text"),
  waitBeforeMs: integer("wait_before_ms").default(0).notNull(), // Delay before this step in ms
  waitAfterMs: integer("wait_after_ms").default(0).notNull(), // Delay after this step in ms
  isConditional: boolean("is_conditional").default(false).notNull(),
  condition: jsonb("condition"), // Conditions for executing this step
  metadata: jsonb("metadata").default({}).notNull(),
});

export const browserAiSuggestions = pgTable("browser_ai_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  suggestionType: text("suggestion_type").notNull(), // 'automation', 'improvement', 'shortcut'
  title: text("title").notNull(),
  description: text("description").notNull(),
  suggestedActions: jsonb("suggested_actions").notNull(), // Steps for implementation
  status: text("status").default("pending").notNull(), // 'pending', 'accepted', 'rejected', 'implemented'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  implementedAt: timestamp("implemented_at"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.75").notNull(),
});

export const browserSettings = pgTable("browser_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  privacyLevel: text("privacy_level").default("balanced").notNull(), // 'minimal', 'balanced', 'complete'
  recordUrls: boolean("record_urls").default(true).notNull(),
  recordInputValues: boolean("record_input_values").default(true).notNull(),
  domainAllowList: jsonb("domain_allow_list").default([]).notNull(), // Domains to observe
  domainBlockList: jsonb("domain_block_list").default([]).notNull(), // Domains to ignore
  aiSuggestions: boolean("ai_suggestions").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workflow Executions - for tracking sequence execution progress
export const workflowExecutions = pgTable("workflow_executions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sequenceId: integer("sequence_id").notNull(),
  status: text("status").default("pending").notNull(), // pending, running, completed, failed, cancelled
  progress: integer("progress").default(0).notNull(), // 0-100 percentage
  currentStepId: integer("current_step_id"), // Currently executing step
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  error: text("error"), // Error message if failed
  metadata: jsonb("metadata").default({}).notNull(), // Additional execution details
  browserSessionId: text("browser_session_id"), // Associated browser session
});

// Workflow Step Executions - for tracking individual step progress
export const workflowStepExecutions = pgTable("workflow_step_executions", {
  id: serial("id").primaryKey(),
  executionId: integer("execution_id").notNull(), // FK to workflowExecutions.id
  stepId: integer("step_id").notNull(), // FK to browserSequenceSteps.id
  status: text("status").default("pending").notNull(), // pending, running, completed, skipped, failed
  order: integer("order").notNull(), // Order of execution
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // Duration in milliseconds
  retries: integer("retries").default(0).notNull(), // Number of retry attempts
  error: text("error"), // Error message if failed
  result: jsonb("result"), // Result of step execution (e.g., extracted data)
  screenshot: text("screenshot"), // Path to step screenshot if taken
  logs: jsonb("logs").default([]).notNull(), // Logs for this specific step
});

// Insert schemas for browser observer tables
export const insertBrowserActionSchema = createInsertSchema(browserActions).pick({
  userId: true,
  sessionId: true,
  actionType: true,
  targetElement: true,
  url: true,
  valueOrText: true,
  metadata: true,
});

export const insertBrowserSequenceSchema = createInsertSchema(browserSequences).pick({
  userId: true,
  name: true,
  description: true,
  isAutomated: true,
  triggerType: true,
  triggerCondition: true,
  isActive: true,
});

export const insertBrowserSequenceStepSchema = createInsertSchema(browserSequenceSteps).pick({
  sequenceId: true,
  stepOrder: true,
  actionType: true,
  targetElement: true,
  targetUrl: true,
  valueOrText: true,
  waitBeforeMs: true,
  waitAfterMs: true,
  isConditional: true,
  condition: true,
  metadata: true,
});

export const insertBrowserAiSuggestionSchema = createInsertSchema(browserAiSuggestions).pick({
  userId: true,
  sessionId: true,
  suggestionType: true,
  title: true,
  description: true,
  suggestedActions: true,
  confidence: true,
});

export const insertBrowserSettingSchema = createInsertSchema(browserSettings).pick({
  userId: true,
  isEnabled: true,
  privacyLevel: true,
  recordUrls: true,
  recordInputValues: true,
  domainAllowList: true,
  domainBlockList: true,
  aiSuggestions: true,
});

// Insert schemas for workflow execution tracking
export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).pick({
  userId: true,
  sequenceId: true,
  status: true,
  progress: true,
  currentStepId: true,
  startedAt: true,
  completedAt: true,
  error: true,
  metadata: true,
  browserSessionId: true,
});

export const insertWorkflowStepExecutionSchema = createInsertSchema(workflowStepExecutions).pick({
  executionId: true,
  stepId: true,
  status: true,
  order: true,
  startedAt: true,
  completedAt: true,
  duration: true,
  retries: true,
  error: true,
  result: true,
  screenshot: true,
  logs: true,
});

// Gamified Chatbot schemas
export const chatbotMessages = pgTable("chatbot_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  sessionId: text("session_id").notNull(),
  content: text("content").notNull(),
  isBot: boolean("is_bot").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const chatbotGameProgress = pgTable("chatbot_game_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  sessionId: text("session_id").notNull(), // For non-logged in users
  points: integer("points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  badges: jsonb("badges").default([]).notNull(), // Array of earned badges
  completedChallenges: jsonb("completed_challenges").default([]).notNull(),
  streak: integer("streak").default(0).notNull(),
  lastInteraction: timestamp("last_interaction").defaultNow().notNull(),
  avatarChoice: text("avatar_choice").default("default"),
});

export const chatbotChallenges = pgTable("chatbot_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'quiz', 'task', 'feature_discovery'
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  pointsReward: integer("points_reward").default(10).notNull(),
  badgeReward: text("badge_reward"),
  requirements: jsonb("requirements").default({}).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertChatbotMessageSchema = createInsertSchema(chatbotMessages).pick({
  userId: true,
  sessionId: true,
  content: true,
  isBot: true,
  metadata: true,
  timestamp: true,
});

export const insertChatbotGameProgressSchema = createInsertSchema(chatbotGameProgress).pick({
  userId: true,
  sessionId: true,
  points: true,
  level: true,
  badges: true,
  completedChallenges: true,
  streak: true,
  avatarChoice: true,
});

export const insertChatbotChallengeSchema = createInsertSchema(chatbotChallenges).pick({
  title: true,
  description: true,
  type: true,
  difficulty: true,
  pointsReward: true,
  badgeReward: true,
  requirements: true,
  isActive: true,
});

// Type exports
export type ChatbotMessage = typeof chatbotMessages.$inferSelect;
export type InsertChatbotMessage = z.infer<typeof insertChatbotMessageSchema>;

export type ChatbotGameProgress = typeof chatbotGameProgress.$inferSelect;
export type InsertChatbotGameProgress = z.infer<typeof insertChatbotGameProgressSchema>;

export type ChatbotChallenge = typeof chatbotChallenges.$inferSelect;
export type InsertChatbotChallenge = z.infer<typeof insertChatbotChallengeSchema>;

// Site Settings export
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;

// Browser observer type exports
export type BrowserAction = typeof browserActions.$inferSelect;
export type InsertBrowserAction = z.infer<typeof insertBrowserActionSchema>;

export type BrowserSequence = typeof browserSequences.$inferSelect;
export type InsertBrowserSequence = z.infer<typeof insertBrowserSequenceSchema>;

export type BrowserSequenceStep = typeof browserSequenceSteps.$inferSelect;
export type InsertBrowserSequenceStep = z.infer<typeof insertBrowserSequenceStepSchema>;

export type BrowserAiSuggestion = typeof browserAiSuggestions.$inferSelect;
export type InsertBrowserAiSuggestion = z.infer<typeof insertBrowserAiSuggestionSchema>;

export type BrowserSetting = typeof browserSettings.$inferSelect;
export type InsertBrowserSetting = z.infer<typeof insertBrowserSettingSchema>;

// Workflow execution type exports
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;

export type WorkflowStepExecution = typeof workflowStepExecutions.$inferSelect;
export type InsertWorkflowStepExecution = z.infer<typeof insertWorkflowStepExecutionSchema>;
