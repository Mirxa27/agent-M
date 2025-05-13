import {
  Agent,
  AgentTool,
  AiModel,
  AiPrompt,
  AiProvider,
  Analytics,
  BrowserAction,
  BrowserAiSuggestion,
  BrowserSequence,
  BrowserSequenceStep,
  BrowserSetting,
  ChatbotChallenge,
  ChatbotGameProgress,
  ChatbotMessage,
  Conversation,
  Credential,
  DashboardPreference,
  File,
  InsertAgent,
  InsertAgentTool,
  InsertAiModel,
  InsertAiPrompt,
  InsertAiProvider,
  InsertAnalytics,
  InsertBrowserAction,
  InsertBrowserAiSuggestion,
  InsertBrowserSequence,
  InsertBrowserSequenceStep,
  InsertBrowserSetting,
  InsertChatbotChallenge,
  InsertChatbotGameProgress,
  InsertChatbotMessage,
  InsertConversation,
  InsertCredential,
  InsertDashboardPreference,
  InsertFile,
  InsertMessage,
  InsertPlan,
  InsertSiteSettings,
  InsertTask,
  InsertUser,
  InsertUserActivity,
  Message,
  Plan,
  SiteSettings,
  Task,
  TaskFile,
  User,
  UserActivity,
  UserDocumentTemplate,
  InsertUserDocumentTemplate,
  WorkflowExecution,
  WorkflowStepExecution,
  InsertWorkflowExecution,
  InsertWorkflowStepExecution,
  agentTools,
  agents,
  aiModels,
  aiPrompts,
  aiProviders,
  analytics,
  browserActions,
  browserAiSuggestions,
  browserSequenceSteps,
  browserSequences,
  browserSettings,
  chatbotChallenges,
  chatbotGameProgress,
  chatbotMessages,
  conversations,
  credentials,
  dashboardPreferences,
  files,
  messages,
  plans,
  siteSettings,
  taskFiles,
  tasks,
  userActivities,
  userDocumentTemplates,
  users,
  workflowExecutions,
  workflowStepExecutions,
} from "@shared/schema";
import connectPg from "connect-pg-simple";
import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db, pool } from "./db";
import { handleError } from "./utils/errorHandler";

type SessionStore = any;

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getSiteSettings(): Promise<SiteSettings | undefined>;
  createSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings>;
  updateSiteSettings(updates: Partial<SiteSettings>): Promise<SiteSettings | undefined>;

  getBrowserSequence(id: number): Promise<BrowserSequence | undefined>;
  getBrowserSequencesByUserId(userId: number): Promise<BrowserSequence[]>;
  createBrowserSequence(sequence: InsertBrowserSequence): Promise<BrowserSequence>;
  updateBrowserSequence(id: number, updates: Partial<BrowserSequence>): Promise<BrowserSequence | undefined>;
  deleteBrowserSequence(id: number): Promise<boolean>;

  getBrowserSequenceStep(id: number): Promise<BrowserSequenceStep | undefined>;
  getBrowserSequenceStepsBySequenceId(sequenceId: number): Promise<BrowserSequenceStep[]>;
  createBrowserSequenceStep(step: InsertBrowserSequenceStep): Promise<BrowserSequenceStep>;
  updateBrowserSequenceStep(id: number, updates: Partial<BrowserSequenceStep>): Promise<BrowserSequenceStep | undefined>;
  deleteBrowserSequenceStep(id: number): Promise<boolean>;

  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  getAgentTool(id: number): Promise<AgentTool | undefined>;
  getAllAgentTools(): Promise<AgentTool[]>;
  getAgentToolsByCategory(category: string): Promise<AgentTool[]>;
  createAgentTool(tool: InsertAgentTool): Promise<AgentTool>;
  updateAgentTool(id: number, updates: Partial<AgentTool>): Promise<AgentTool | undefined>;
  deleteAgentTool(id: number): Promise<boolean>;

  getAgent(id: number): Promise<Agent | undefined>;
  getAgentsByUserId(userId: number): Promise<Agent[]>;
  getAgentTemplates(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;

  getCredential(id: number): Promise<Credential | undefined>;
  getCredentialsByUserId(userId: number): Promise<Credential[]>;
  getCredentialsByAgentId(agentId: number): Promise<Credential[]>;
  createCredential(credential: InsertCredential): Promise<Credential>;
  updateCredential(id: number, updates: Partial<Credential>): Promise<Credential | undefined>;
  deleteCredential(id: number): Promise<boolean>;

  getFile(id: number): Promise<File | undefined>;
  getFilesByUserId(userId: number): Promise<File[]>;
  getTemplatesByUserId(userId: number): Promise<File[]>;
  getFilesByTaskId(taskId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<File>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;

  linkFileToTask(taskId: number, fileId: number): Promise<TaskFile>;
  getTaskFilesByTaskId(taskId: number): Promise<TaskFile[]>;
  unlinkFileFromTask(taskId: number, fileId: number): Promise<boolean>;

  getTask(id: number): Promise<Task | undefined>;
  getTasksByUserId(userId: number, limit?: number): Promise<Task[]>;
  getTasksByAgentId(agentId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByTaskId(taskId: number): Promise<Message[]>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number, agentId?: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;

  getAiProvider(id: number): Promise<AiProvider | undefined>;
  getAllAiProviders(): Promise<AiProvider[]>;
  getActiveAiProviders(): Promise<AiProvider[]>;
  createAiProvider(provider: InsertAiProvider): Promise<AiProvider>;
  updateAiProvider(id: number, updates: Partial<AiProvider>): Promise<AiProvider | undefined>;
  deleteAiProvider(id: number): Promise<boolean>;

  getAiModel(id: number): Promise<AiModel | undefined>;
  getAiModelByName(modelId: string): Promise<AiModel | undefined>;
  getAllAiModels(): Promise<AiModel[]>;
  getAiModelsByProviderId(providerId: number): Promise<AiModel[]>;
  createAiModel(model: InsertAiModel): Promise<AiModel>;
  updateAiModel(id: number, updates: Partial<AiModel>): Promise<AiModel | undefined>;
  deleteAiModel(id: number): Promise<boolean>;

  getAiPrompt(id: number): Promise<AiPrompt | undefined>;
  getAllAiPrompts(): Promise<AiPrompt[]>;
  getAiPromptsByModelId(modelId: number): Promise<AiPrompt[]>;
  createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt>;
  updateAiPrompt(id: number, updates: Partial<AiPrompt>): Promise<AiPrompt | undefined>;
  deleteAiPrompt(id: number): Promise<boolean>;

  getPlan(id: number): Promise<Plan | undefined>;
  getPlanByName(name: string): Promise<Plan | undefined>;
  getAllPlans(): Promise<Plan[]>;
  getActivePlans(): Promise<Plan[]>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, updates: Partial<Plan>): Promise<Plan | undefined>;
  deletePlan(id: number): Promise<boolean>;

  getUserActivity(id: number): Promise<UserActivity | undefined>;
  getUserActivitiesByUserId(userId: number, limit?: number): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;

  getDashboardPreference(userId: number): Promise<DashboardPreference | undefined>;
  createDashboardPreference(preference: InsertDashboardPreference): Promise<DashboardPreference>;
  updateDashboardPreference(userId: number, updates: Partial<DashboardPreference>): Promise<DashboardPreference | undefined>;

  getUserAnalytics(userId: number, period: string): Promise<Analytics | undefined>;
  createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics>;
  updateAnalytics(id: number, updates: Partial<Analytics>): Promise<Analytics | undefined>;

  getUserDocumentTemplates(userId: number): Promise<UserDocumentTemplate[]>;
  getUserDocumentTemplate(id: number): Promise<UserDocumentTemplate | undefined>;
  createUserDocumentTemplate(template: InsertUserDocumentTemplate): Promise<UserDocumentTemplate>;
  updateUserDocumentTemplate(id: number, updates: Partial<UserDocumentTemplate>): Promise<UserDocumentTemplate | undefined>;
  deleteUserDocumentTemplate(id: number): Promise<boolean>;

  // Browser Observer related methods
  getBrowserAction(id: number): Promise<BrowserAction | undefined>;
  getBrowserActionsBySessionId(sessionId: string): Promise<BrowserAction[]>;
  createBrowserAction(action: InsertBrowserAction): Promise<BrowserAction>;

  getBrowserAiSuggestion(id: number): Promise<BrowserAiSuggestion | undefined>;
  getBrowserAiSuggestionsBySessionId(sessionId: string): Promise<BrowserAiSuggestion[]>;
  createBrowserAiSuggestion(suggestion: InsertBrowserAiSuggestion): Promise<BrowserAiSuggestion>;
  updateBrowserAiSuggestion(id: number, updates: Partial<BrowserAiSuggestion>): Promise<BrowserAiSuggestion | undefined>;

  getBrowserSetting(userId: number): Promise<BrowserSetting | undefined>;
  createBrowserSetting(setting: InsertBrowserSetting): Promise<BrowserSetting>;
  updateBrowserSetting(userId: number, updates: Partial<BrowserSetting>): Promise<BrowserSetting | undefined>;

  // Workflow Execution related methods
  getWorkflowExecution(id: number): Promise<WorkflowExecution | undefined>;
  getWorkflowExecutionsByUserId(userId: number): Promise<WorkflowExecution[]>;
  getWorkflowExecutionsBySequenceId(sequenceId: number): Promise<WorkflowExecution[]>;
  createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution>;
  updateWorkflowExecution(id: number, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution | undefined>;

  getWorkflowStepExecution(id: number): Promise<WorkflowStepExecution | undefined>;
  getWorkflowStepExecutionsByExecutionId(executionId: number): Promise<WorkflowStepExecution[]>;
  createWorkflowStepExecution(stepExecution: InsertWorkflowStepExecution): Promise<WorkflowStepExecution>;
  updateWorkflowStepExecution(id: number, updates: Partial<WorkflowStepExecution>): Promise<WorkflowStepExecution | undefined>;

  // Chatbot related methods
  getChatbotMessage(id: number): Promise<ChatbotMessage | undefined>;
  getChatbotMessagesBySessionId(sessionId: string): Promise<ChatbotMessage[]>;
  createChatbotMessage(message: InsertChatbotMessage): Promise<ChatbotMessage>;

  getChatbotGameProgress(sessionId: string): Promise<ChatbotGameProgress | undefined>;
  createChatbotGameProgress(progress: InsertChatbotGameProgress): Promise<ChatbotGameProgress>;
  updateChatbotGameProgress(sessionId: string, updates: Partial<ChatbotGameProgress>): Promise<ChatbotGameProgress | undefined>;

  getChatbotChallenge(id: number): Promise<ChatbotChallenge | undefined>;
  getAllChatbotChallenges(): Promise<ChatbotChallenge[]>;
  createChatbotChallenge(challenge: InsertChatbotChallenge): Promise<ChatbotChallenge>;
  updateChatbotChallenge(id: number, updates: Partial<ChatbotChallenge>): Promise<ChatbotChallenge | undefined>;
  deleteChatbotChallenge(id: number): Promise<boolean>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session',
      schemaName: 'public',
      ttl: 86400 * 30,
      pruneSessionInterval: 60 * 60,
    });
    this.initializePlans();
  }

  private async initializePlans() {
    const existingPlans = await db.select().from(plans);
    if (existingPlans.length === 0) {
      const defaultPlans: InsertPlan[] = [
        { name: "Free", price: 0, interval: "monthly", features: { tasks: 10, agents: 1 }, isActive: true },
        { name: "Pro", price: 2900, interval: "monthly", features: { tasks: 100, agents: 5 }, isActive: true },
        { name: "Team", price: 9900, interval: "monthly", features: { tasks: 500, agents: 10 }, isActive: true },
      ];
      await db.insert(plans).values(defaultPlans);
      console.log("Default plans initialized.");
    }
  }

  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
    return settings;
  }

  async createSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const settingsWithId = { ...settings, id: 1 }; // Ensure ID is 1 for the single site settings row
    const [newSettings] = await db.insert(siteSettings).values(settingsWithId).onConflictDoUpdate({ target: siteSettings.id, set: settingsWithId }).returning();
    return newSettings;
  }

  async createDefaultSiteSettings(): Promise<SiteSettings> {
    // const now = new Date(); // createdAt and lastUpdated are handled by DB default or on update
    const defaultSettingsData: InsertSiteSettings = {
      logo: { url: "/assets/images/mirxa-logo.svg", showText: true, text: "Mirxa.io", animated: true },
      colors: { primary: "#6366f1", secondary: "#0ea5e9", accent: "#f97316", background: "#ffffff", text: "#1e293b" },
      header: { sticky: true, transparent: false, showLogo: true, showNavigation: true },
      footer: { showCopyright: true, copyrightText: "© 2025 Mirxa.io. All rights reserved.", showSocial: true },
      chatbot: { enabled: true, position: "bottom-right", welcomeMessage: "Hi! How can I assist you today?", color: "#6366f1", autoOpen: false },
      widgets: [{ id: 'header-widget', label: 'Header' }, { id: 'hero-widget', label: 'Hero Section' }, { id: 'features-widget', label: 'Features' }, { id: 'testimonials-widget', label: 'Testimonials' }, { id: 'cta-widget', label: 'Call to Action' }, { id: 'footer-widget', label: 'Footer' }],
      version: 1,
      // updatedBy: undefined, // Explicitly set to undefined if not provided
    };
    return this.createSiteSettings(defaultSettingsData);
  }

  async updateSiteSettings(updates: Partial<SiteSettings>): Promise<SiteSettings | undefined> {
    let existingSettings = await this.getSiteSettings();
    if (!existingSettings) {
      await this.createDefaultSiteSettings(); // Ensure default settings exist
      existingSettings = await this.getSiteSettings(); // Re-fetch after creation
      if (!existingSettings) {
        // This should ideally not happen if createDefaultSiteSettings is successful
        throw new Error("Failed to initialize site settings after attempting creation.");
      }
    }

    const updatesWithMeta = { ...updates, version: (existingSettings.version || 0) + 1, lastUpdated: new Date() };
    const [updatedSettings] = await db.update(siteSettings).set(updatesWithMeta).where(eq(siteSettings.id, 1)).returning();
    return updatedSettings;
  }

  async getBrowserSequence(id: number): Promise<BrowserSequence | undefined> {
    const [sequence] = await db.select().from(browserSequences).where(eq(browserSequences.id, id));
    return sequence;
  }

  async getBrowserSequencesByUserId(userId: number): Promise<BrowserSequence[]> {
    return await db.select().from(browserSequences).where(eq(browserSequences.userId, userId)).orderBy(desc(browserSequences.updatedAt));
  }

  async createBrowserSequence(sequence: InsertBrowserSequence): Promise<BrowserSequence> {
    const now = new Date();
    const sequenceToInsert = {
      ...sequence,
      createdAt: now,
      updatedAt: now,
      lastExecutedAt: null, // Explicitly set null for nullable fields
      executionCount: 0,
      isActive: sequence.isActive !== undefined ? sequence.isActive : true,
    };

    const [newSequence] = await db.insert(browserSequences).values(sequenceToInsert).returning();
    return newSequence;
  }

  async updateBrowserSequence(id: number, updates: Partial<BrowserSequence>): Promise<BrowserSequence | undefined> {
    const updatesWithTimestamp = { ...updates, updatedAt: new Date() };
    const [updatedSequence] = await db.update(browserSequences).set(updatesWithTimestamp).where(eq(browserSequences.id, id)).returning();
    return updatedSequence;
  }

  async deleteBrowserSequence(id: number): Promise<boolean> {
    try {
      // Delete associated steps first
      await db.delete(browserSequenceSteps).where(eq(browserSequenceSteps.sequenceId, id));
      const result = await db.delete(browserSequences).where(eq(browserSequences.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Error deleting browser sequence ${id}:`, error);
      return false;
    }
  }

  async getBrowserSequenceStep(id: number): Promise<BrowserSequenceStep | undefined> {
    const [step] = await db.select().from(browserSequenceSteps).where(eq(browserSequenceSteps.id, id));
    return step;
  }

  async getBrowserSequenceStepsBySequenceId(sequenceId: number): Promise<BrowserSequenceStep[]> {
    return await db.select().from(browserSequenceSteps).where(eq(browserSequenceSteps.sequenceId, sequenceId)).orderBy(asc(browserSequenceSteps.stepOrder));
  }

  async createBrowserSequenceStep(step: InsertBrowserSequenceStep): Promise<BrowserSequenceStep> {
    const [newStep] = await db.insert(browserSequenceSteps).values({
      ...step,
      waitBeforeMs: step.waitBeforeMs || 0,
      waitAfterMs: step.waitAfterMs || 0,
      isConditional: step.isConditional || false,
    }).returning();
    return newStep;
  }

  async updateBrowserSequenceStep(id: number, updates: Partial<BrowserSequenceStep>): Promise<BrowserSequenceStep | undefined> {
    const [updatedStep] = await db.update(browserSequenceSteps).set(updates).where(eq(browserSequenceSteps.id, id)).returning();
    return updatedStep;
  }

  async deleteBrowserSequenceStep(id: number): Promise<boolean> {
    const result = await db.delete(browserSequenceSteps).where(eq(browserSequenceSteps.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.id));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    let freePlanId: number | undefined = undefined;
    try {
      const [freePlan] = await db.select().from(plans).where(eq(plans.name, "Free")).limit(1);
      if (freePlan) freePlanId = freePlan.id;
    } catch (error) {
      console.error("Error finding free plan:", error);
      // Continue without a planId if free plan not found or error occurs
    }

    const userToInsert: typeof users.$inferInsert = {
      username: insertUser.username,
      password: insertUser.password, // Assuming password is pre-hashed
      email: insertUser.email,
      fullName: insertUser.fullName,
      planId: freePlanId ?? null, // Use null if freePlanId is undefined
      planExpiresAt: null, // Explicitly set null for nullable fields
      role: "user", // Default role
      isActive: true, // Default active status
    };

    const [user] = await db.insert(users).values(userToInsert).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const user = await this.getUser(id);
      if (!user) return false;

      // Prevent deletion of the last admin
      if (user.role === "admin") {
        const admins = await db.select().from(users).where(eq(users.role, "admin"));
        if (admins.length <= 1) {
          throw new Error("Cannot delete the last admin user");
        }
      }

      // Perform deletion
      const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      // handleError(error, `Error deleting user with ID ${id}`); // Optional: use a centralized error handler
      return false; // Indicate failure
    }
  }


  async getAgentTool(id: number): Promise<AgentTool | undefined> {
    const [tool] = await db.select().from(agentTools).where(eq(agentTools.id, id));
    return tool;
  }

  async getAllAgentTools(): Promise<AgentTool[]> {
    return await db.select().from(agentTools);
  }

  async getAgentToolsByCategory(category: string): Promise<AgentTool[]> {
    return await db.select().from(agentTools).where(eq(agentTools.category, category));
  }

  async createAgentTool(tool: InsertAgentTool): Promise<AgentTool> {
    // Ensure default values are set if not provided, matching schema defaults
    const toolToInsert = {
      ...tool,
      config: tool.config || {}, // Default from schema
      isActive: tool.isActive !== undefined ? tool.isActive : true, // Default from schema
      isSystem: tool.isSystem || false, // Default from schema
    };

    const [newTool] = await db.insert(agentTools).values(toolToInsert).returning();
    return newTool;
  }

  async updateAgentTool(id: number, updates: Partial<AgentTool>): Promise<AgentTool | undefined> {
    const tool = await this.getAgentTool(id);
    if (!tool) return undefined;

    // Prevent changing system status of a system tool
    if (tool.isSystem && updates.isSystem === false) {
      throw new Error("Cannot change system status of a system tool");
    }

    const [updatedTool] = await db
      .update(agentTools)
      .set({ ...updates, updatedAt: new Date() }) // Always update 'updatedAt'
      .where(eq(agentTools.id, id))
      .returning();
    return updatedTool;
  }

  async deleteAgentTool(id: number): Promise<boolean> {
    const tool = await this.getAgentTool(id);
    if (tool && tool.isSystem) {
      throw new Error("Cannot delete a system tool");
    }
    const result = await db.delete(agentTools).where(eq(agentTools.id, id));
    return (result.rowCount ?? 0) > 0;
  }


  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async getAgentsByUserId(userId: number): Promise<Agent[]> {
    return await db.select().from(agents).where(and(eq(agents.userId, userId), eq(agents.isTemplate, false)));
  }

  async getAgentTemplates(): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.isTemplate, true));
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    if (!agent.userId) { // Ensure userId is present
      throw new Error("userId is required to create an agent.");
    }

    const now = new Date();
    const [newAgent] = await db
      .insert(agents)
      .values({ ...agent, taskCount: 0, createdAt: now, updatedAt: now }) // Set defaults
      .returning();
    return newAgent;
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined> {
    const [updatedAgent] = await db
      .update(agents)
      .set({ ...updates, updatedAt: new Date() }) // Always update 'updatedAt'
      .where(eq(agents.id, id))
      .returning();
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<boolean> {
    const result = await db.delete(agents).where(eq(agents.id, id));
    return (result.rowCount ?? 0) > 0;
  }


  async getCredential(id: number): Promise<Credential | undefined> {
    const [credential] = await db.select().from(credentials).where(eq(credentials.id, id));
    return credential;
  }

  async getCredentialsByUserId(userId: number): Promise<Credential[]> {
    return await db.select().from(credentials).where(eq(credentials.userId, userId));
  }

  async getCredentialsByAgentId(agentId: number): Promise<Credential[]> {
    // This logic might need adjustment if agents can use credentials not owned by their user.
    // For now, assumes agent uses credentials of its owner.
    const agent = await this.getAgent(agentId);
    if (!agent) return [];
    return this.getCredentialsByUserId(agent.userId);
  }

  async createCredential(credential: InsertCredential): Promise<Credential> {
    const now = new Date();
    const [newCredential] = await db
      .insert(credentials)
      .values({ ...credential, createdAt: now, updatedAt: now }) // Set timestamps
      .returning();
    return newCredential;
  }

  async updateCredential(id: number, updates: Partial<Credential>): Promise<Credential | undefined> {
    const now = new Date();
    const [updatedCredential] = await db
      .update(credentials)
      .set({ ...updates, updatedAt: now }) // Always update 'updatedAt'
      .where(eq(credentials.id, id))
      .returning();
    return updatedCredential;
  }

  async deleteCredential(id: number): Promise<boolean> {
    const result = await db.delete(credentials).where(eq(credentials.id, id));
    return (result.rowCount ?? 0) > 0;
  }


  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getFilesByUserId(userId: number): Promise<File[]> {
    return await db.select().from(files).where(eq(files.userId, userId));
  }

  async getTemplatesByUserId(userId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.isTemplate, true)));
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const now = new Date();
    const [newFile] = await db
      .insert(files)
      .values({ ...fileData, createdAt: now, updatedAt: now }) // Set timestamps
      .returning();
    return newFile;
  }

  async updateFile(id: number, updates: Partial<File>): Promise<File | undefined> {
    const now = new Date();
    const [updatedFile] = await db
      .update(files)
      .set({ ...updates, updatedAt: now }) // Always update 'updatedAt'
      .where(eq(files.id, id))
      .returning();
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return (result.rowCount ?? 0) > 0;
  }


  async getFilesByTaskId(taskId: number): Promise<File[]> {
    const fileIdRows = await db
      .select({ fileId: taskFiles.fileId })
      .from(taskFiles)
      .where(eq(taskFiles.taskId, taskId));

    if (fileIdRows.length === 0) return [];

    const fileIds = fileIdRows.map((row) => row.fileId);
    return await db.select().from(files).where(inArray(files.id, fileIds));
  }

  async linkFileToTask(taskId: number, fileId: number): Promise<TaskFile> {
    // Ensure task and file exist before linking
    const task = await this.getTask(taskId);
    if (!task) throw new Error(`Task with ID ${taskId} not found`);

    const file = await this.getFile(fileId);
    if (!file) throw new Error(`File with ID ${fileId} not found`);

    const now = new Date();
    const [taskFile] = await db
      .insert(taskFiles)
      .values({ taskId, fileId, createdAt: now }) // Set timestamp
      .returning();
    return taskFile;
  }

  async getTaskFilesByTaskId(taskId: number): Promise<TaskFile[]> {
    return await db.select().from(taskFiles).where(eq(taskFiles.taskId, taskId));
  }

  async unlinkFileFromTask(taskId: number, fileId: number): Promise<boolean> {
    const result = await db
      .delete(taskFiles)
      .where(and(eq(taskFiles.taskId, taskId), eq(taskFiles.fileId, fileId)));
    return (result.rowCount ?? 0) > 0;
  }


  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByUserId(userId: number, limit?: number): Promise<Task[]> {
    const baseQuery = db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));

    if (limit) {
      return await baseQuery.limit(limit);
    }
    return await baseQuery;
  }

  async getTasksByAgentId(agentId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.agentId, agentId))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    if (!task.agentId) { // Ensure agentId is present
      throw new Error("agentId is required to create a task.");
    }

    // const now = new Date(); // createdAt is handled by DB default
    const taskDataForDb: typeof tasks.$inferInsert = {
      userId: task.userId,
      agentId: task.agentId,
      title: task.title,
      description: task.description,
      status: "pending", // Default status
      result: null, // Explicitly set null for nullable fields
      completedAt: null, // Explicitly set null for nullable fields
    };

    const [newTask] = await db.insert(tasks).values(taskDataForDb).returning();

    // Increment agent's task count
    const agentResult = await this.getAgent(task.agentId);
    if (agentResult) {
      await this.updateAgent(agentResult.id, {
        taskCount: (agentResult.taskCount || 0) + 1,
      });
    }
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    let updatesWithTimestamp = { ...updates };
    // If status is 'completed' and completedAt is not already set, set it now
    if (updates.status === "completed") {
      const [task] = await db.select({ completedAt: tasks.completedAt }).from(tasks).where(eq(tasks.id, id));
      if (task && !task.completedAt) {
        updatesWithTimestamp.completedAt = new Date();
      }
    }
    const [updatedTask] = await db
      .update(tasks)
      .set(updatesWithTimestamp)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    // Consider cascading deletes or soft deletes based on application requirements
    // For now, hard delete messages associated with the task
    await db.delete(messages).where(eq(messages.taskId, id));
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }


  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesByTaskId(taskId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.taskId, taskId))
      .orderBy(asc(messages.timestamp));
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.timestamp));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const messageToInsert: Partial<typeof messages.$inferInsert> = {
      role: message.role,
      content: message.content,
      metadata: message.metadata || {}, // Default from schema
    };

    // Ensure either taskId or conversationId is provided, but not both if that's the logic.
    // Current schema allows both to be nullable, but one should be present.
    if (message.taskId && message.conversationId) {
      // Decide on a prioritization strategy or throw an error if this state is invalid
      console.warn(
        `Message creation attempt with both taskId (${message.taskId}) and conversationId (${message.conversationId}). Prioritizing taskId.`
      );
      messageToInsert.taskId = message.taskId;
      messageToInsert.conversationId = undefined; // Or handle as per application logic
    } else if (message.taskId !== undefined) {
      messageToInsert.taskId = message.taskId;
    } else if (message.conversationId !== undefined) {
      messageToInsert.conversationId = message.conversationId;
    } else {
      throw new Error("Message must have either a taskId or a conversationId.");
    }

    if (message.timestamp) { // Allow overriding defaultNow if a specific timestamp is provided
      messageToInsert.timestamp = message.timestamp;
    }
    // else, timestamp will use defaultNow() from schema

    const [newMessage] = await db
      .insert(messages)
      .values(messageToInsert as typeof messages.$inferInsert) // Cast if properties are optional in Partial but required in full type
      .returning();

    return newMessage;
  }


  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async getConversationsByUserId(userId: number, agentId?: number): Promise<Conversation[]> {
    const conditions = [eq(conversations.userId, userId)];

    if (agentId !== undefined) {
      conditions.push(eq(conversations.agentId, agentId));
    }

    // Drizzle's `where` expects a single condition or `and`/`or` combinators.
    // If there's only one condition, no need for `and()`.
    const finalCondition = conditions.length > 1 ? and(...conditions) : (conditions.length === 1 ? conditions[0] : undefined);

    let query = db
      .select()
      .from(conversations);

    if (finalCondition) {
      // The 'where' method on a select query builder returns a new query builder instance,
      // so we need to assign it back if we want to chain further methods like orderBy.
      // However, to avoid type issues with reassignment, we can build the query step-by-step.
      // For this specific case, Drizzle's .where() can be chained.
      // The issue might be more subtle, let's ensure the query object is correctly typed.
      // A common pattern is to build the query and then execute it.
      const selectWithWhere = finalCondition ? query.where(finalCondition) : query;
      return await selectWithWhere.orderBy(desc(conversations.updatedAt));
    } else {
      // No conditions, just order by
      return await query.orderBy(desc(conversations.updatedAt));
    }
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const now = new Date();
    if (!conversation.agentId) { // Ensure agentId is present
      throw new Error("agentId is required to create a conversation.");
    }

    const conversationDataForDb: typeof conversations.$inferInsert = {
      userId: conversation.userId,
      agentId: conversation.agentId,
      title: conversation.title, // title is nullable in schema, so it's fine if undefined
      createdAt: now,
      updatedAt: now,
    };

    const [newConversation] = await db
      .insert(conversations)
      .values(conversationDataForDb)
      .returning();
    return newConversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [updatedConversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() }) // Always update 'updatedAt'
      .where(eq(conversations.id, id))
      .returning();
    return updatedConversation;
  }

  async deleteConversation(id: number): Promise<boolean> {
    // Delete associated messages first
    await db.delete(messages).where(eq(messages.conversationId, id));
    const result = await db.delete(conversations).where(eq(conversations.id, id));
    return (result.rowCount ?? 0) > 0;
  }


  async getAiProvider(id: number): Promise<AiProvider | undefined> {
    const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.id, id));
    return provider;
  }

  async getAllAiProviders(): Promise<AiProvider[]> {
    return db.select().from(aiProviders).orderBy(asc(aiProviders.name));
  }

  async getActiveAiProviders(): Promise<AiProvider[]> {
    return db.select().from(aiProviders).where(eq(aiProviders.isActive, true)).orderBy(asc(aiProviders.name));
  }

  async createAiProvider(providerData: InsertAiProvider): Promise<AiProvider> {
    const [newProvider] = await db.insert(aiProviders).values(providerData).returning();
    return newProvider;
  }

  async updateAiProvider(id: number, updates: Partial<AiProvider>): Promise<AiProvider | undefined> {
    const [updatedProvider] = await db.update(aiProviders).set({ ...updates, updatedAt: new Date() }).where(eq(aiProviders.id, id)).returning();
    return updatedProvider;
  }

  async deleteAiProvider(id: number): Promise<boolean> {
    // Consider implications: what happens to AI Models using this provider?
    // For now, direct delete. Add cascading logic or checks if needed.
    const result = await db.delete(aiProviders).where(eq(aiProviders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAiModel(id: number): Promise<AiModel | undefined> {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.id, id));
    return model;
  }

  async getAiModelByName(modelIdString: string): Promise<AiModel | undefined> {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.modelId, modelIdString));
    return model;
  }

  async getAllAiModels(): Promise<AiModel[]> {
    return db.select().from(aiModels).orderBy(asc(aiModels.name));
  }

  async getAiModelsByProviderId(providerId: number): Promise<AiModel[]> {
    return db.select().from(aiModels).where(eq(aiModels.providerId, providerId)).orderBy(asc(aiModels.name));
  }

  async createAiModel(modelData: InsertAiModel): Promise<AiModel> {
    const [newModel] = await db.insert(aiModels).values(modelData).returning();
    return newModel;
  }

  async updateAiModel(id: number, updates: Partial<AiModel>): Promise<AiModel | undefined> {
    const [updatedModel] = await db.update(aiModels).set({ ...updates, updatedAt: new Date() }).where(eq(aiModels.id, id)).returning();
    return updatedModel;
  }

  async deleteAiModel(id: number): Promise<boolean> {
    // Consider implications: what happens to AI Prompts using this model?
    const result = await db.delete(aiModels).where(eq(aiModels.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAiPrompt(id: number): Promise<AiPrompt | undefined> {
    const [prompt] = await db.select().from(aiPrompts).where(eq(aiPrompts.id, id));
    return prompt;
  }

  async getAllAiPrompts(): Promise<AiPrompt[]> {
    return db.select().from(aiPrompts).orderBy(asc(aiPrompts.name));
  }

  async getAiPromptsByModelId(modelId: number): Promise<AiPrompt[]> {
    return db.select().from(aiPrompts).where(eq(aiPrompts.modelId, modelId)).orderBy(asc(aiPrompts.name));
  }

  async createAiPrompt(promptData: InsertAiPrompt): Promise<AiPrompt> {
    const [newPrompt] = await db.insert(aiPrompts).values(promptData).returning();
    return newPrompt;
  }

  async updateAiPrompt(id: number, updates: Partial<AiPrompt>): Promise<AiPrompt | undefined> {
    const [updatedPrompt] = await db.update(aiPrompts).set({ ...updates, updatedAt: new Date() }).where(eq(aiPrompts.id, id)).returning();
    return updatedPrompt;
  }

  async deleteAiPrompt(id: number): Promise<boolean> {
    const result = await db.delete(aiPrompts).where(eq(aiPrompts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async getPlanByName(name: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.name, name));
    return plan;
  }

  async getAllPlans(): Promise<Plan[]> {
    return db.select().from(plans).orderBy(asc(plans.price));
  }

  async getActivePlans(): Promise<Plan[]> {
    return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(asc(plans.price));
  }

  async createPlan(planData: InsertPlan): Promise<Plan> {
    const [newPlan] = await db.insert(plans).values(planData).returning();
    return newPlan;
  }

  async updatePlan(id: number, updates: Partial<Plan>): Promise<Plan | undefined> {
    const [updatedPlan] = await db.update(plans).set(updates).where(eq(plans.id, id)).returning();
    return updatedPlan;
  }

  async deletePlan(id: number): Promise<boolean> {
    // Consider implications: what happens to users on this plan?
    const result = await db.delete(plans).where(eq(plans.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserActivity(id: number): Promise<UserActivity | undefined> {
    const [activity] = await db.select().from(userActivities).where(eq(userActivities.id, id));
    return activity;
  }

  async getUserActivitiesByUserId(userId: number, limit?: number): Promise<UserActivity[]> {
    const query = db.select().from(userActivities).where(eq(userActivities.userId, userId)).orderBy(desc(userActivities.createdAt));
    if (limit) {
      return query.limit(limit);
    }
    return query;
  }

  async createUserActivity(activityData: InsertUserActivity): Promise<UserActivity> {
    const [newActivity] = await db.insert(userActivities).values(activityData).returning();
    return newActivity;
  }

  async getDashboardPreference(userId: number): Promise<DashboardPreference | undefined> {
    const [preference] = await db.select().from(dashboardPreferences).where(eq(dashboardPreferences.userId, userId));
    return preference;
  }

  async createDashboardPreference(preferenceData: InsertDashboardPreference): Promise<DashboardPreference> {
    const [newPreference] = await db.insert(dashboardPreferences).values(preferenceData).returning();
    return newPreference;
  }

  async updateDashboardPreference(userId: number, updates: Partial<DashboardPreference>): Promise<DashboardPreference | undefined> {
    const [updatedPreference] = await db.update(dashboardPreferences).set({ ...updates, updatedAt: new Date() }).where(eq(dashboardPreferences.userId, userId)).returning();
    return updatedPreference;
  }

  async getUserAnalytics(userId: number, period: string): Promise<Analytics | undefined> {
    const [analyticRecord] = await db.select().from(analytics).where(and(eq(analytics.userId, userId), eq(analytics.period, period)));
    return analyticRecord;
  }

  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [newAnalytics] = await db.insert(analytics).values(analyticsData).returning();
    return newAnalytics;
  }

  async updateAnalytics(id: number, updates: Partial<Analytics>): Promise<Analytics | undefined> {
    const [updatedAnalytics] = await db.update(analytics).set(updates).where(eq(analytics.id, id)).returning();
    return updatedAnalytics;
  }

  async getUserDocumentTemplates(userId: number): Promise<UserDocumentTemplate[]> {
    return db.select().from(userDocumentTemplates).where(eq(userDocumentTemplates.userId, userId)).orderBy(asc(userDocumentTemplates.name));
  }

  async getUserDocumentTemplate(id: number): Promise<UserDocumentTemplate | undefined> {
    const [template] = await db.select().from(userDocumentTemplates).where(eq(userDocumentTemplates.id, id));
    return template;
  }

  async createUserDocumentTemplate(templateData: InsertUserDocumentTemplate): Promise<UserDocumentTemplate> {
    const [newTemplate] = await db.insert(userDocumentTemplates).values(templateData).returning();
    return newTemplate;
  }

  async updateUserDocumentTemplate(id: number, updates: Partial<UserDocumentTemplate>): Promise<UserDocumentTemplate | undefined> {
    const [updatedTemplate] = await db.update(userDocumentTemplates).set({ ...updates, updatedAt: new Date() }).where(eq(userDocumentTemplates.id, id)).returning();
    return updatedTemplate;
  }

  async deleteUserDocumentTemplate(id: number): Promise<boolean> {
    const result = await db.delete(userDocumentTemplates).where(eq(userDocumentTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Browser Observer Stubs
  async getBrowserAction(id: number): Promise<BrowserAction | undefined> {
    console.warn("STUB: getBrowserAction not implemented", id);
    return undefined;
  }
  async getBrowserActionsBySessionId(sessionId: string): Promise<BrowserAction[]> {
    console.warn("STUB: getBrowserActionsBySessionId not implemented", sessionId);
    return [];
  }
  async createBrowserAction(action: InsertBrowserAction): Promise<BrowserAction> {
    console.warn("STUB: createBrowserAction not implemented", action);
    // @ts-ignore
    return { id: -1, createdAt: new Date(), ...action };
  }

  async getBrowserAiSuggestion(id: number): Promise<BrowserAiSuggestion | undefined> {
    console.warn("STUB: getBrowserAiSuggestion not implemented", id);
    return undefined;
  }
  async getBrowserAiSuggestionsBySessionId(sessionId: string): Promise<BrowserAiSuggestion[]> {
    console.warn("STUB: getBrowserAiSuggestionsBySessionId not implemented", sessionId);
    return [];
  }
  async createBrowserAiSuggestion(suggestion: InsertBrowserAiSuggestion): Promise<BrowserAiSuggestion> {
    console.warn("STUB: createBrowserAiSuggestion not implemented", suggestion);
    // @ts-ignore
    return { id: -1, createdAt: new Date(), implementedAt: null, ...suggestion };
  }
  async updateBrowserAiSuggestion(id: number, updates: Partial<BrowserAiSuggestion>): Promise<BrowserAiSuggestion | undefined> {
    console.warn("STUB: updateBrowserAiSuggestion not implemented", id, updates);
    return undefined;
  }

  async getBrowserSetting(userId: number): Promise<BrowserSetting | undefined> {
    console.warn("STUB: getBrowserSetting not implemented", userId);
    return undefined;
  }
  async createBrowserSetting(setting: InsertBrowserSetting): Promise<BrowserSetting> {
    console.warn("STUB: createBrowserSetting not implemented", setting);
    // @ts-ignore
    return { id: -1, updatedAt: new Date(), ...setting };
  }
  async updateBrowserSetting(userId: number, updates: Partial<BrowserSetting>): Promise<BrowserSetting | undefined> {
    console.warn("STUB: updateBrowserSetting not implemented", userId, updates);
    return undefined;
  }

  // Workflow Execution Stubs
  async getWorkflowExecution(id: number): Promise<WorkflowExecution | undefined> {
    console.warn("STUB: getWorkflowExecution not implemented", id);
    return undefined;
  }
  async getWorkflowExecutionsByUserId(userId: number): Promise<WorkflowExecution[]> {
    console.warn("STUB: getWorkflowExecutionsByUserId not implemented", userId);
    return [];
  }
  async getWorkflowExecutionsBySequenceId(sequenceId: number): Promise<WorkflowExecution[]> {
    console.warn("STUB: getWorkflowExecutionsBySequenceId not implemented", sequenceId);
    return [];
  }
  async createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution> {
    console.warn("STUB: createWorkflowExecution not implemented", execution);
    // @ts-ignore
    return { id: -1, startedAt: new Date(), completedAt: null, ...execution };
  }
  async updateWorkflowExecution(id: number, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution | undefined> {
    console.warn("STUB: updateWorkflowExecution not implemented", id, updates);
    return undefined;
  }

  async getWorkflowStepExecution(id: number): Promise<WorkflowStepExecution | undefined> {
    console.warn("STUB: getWorkflowStepExecution not implemented", id);
    return undefined;
  }
  async getWorkflowStepExecutionsByExecutionId(executionId: number): Promise<WorkflowStepExecution[]> {
    console.warn("STUB: getWorkflowStepExecutionsByExecutionId not implemented", executionId);
    return [];
  }
  async createWorkflowStepExecution(stepExecution: InsertWorkflowStepExecution): Promise<WorkflowStepExecution> {
    console.warn("STUB: createWorkflowStepExecution not implemented", stepExecution);
    // @ts-ignore
    return { id: -1, startedAt: null, completedAt: null, ...stepExecution };
  }
  async updateWorkflowStepExecution(id: number, updates: Partial<WorkflowStepExecution>): Promise<WorkflowStepExecution | undefined> {
    console.warn("STUB: updateWorkflowStepExecution not implemented", id, updates);
    return undefined;
  }

  // Chatbot Stubs
  async getChatbotMessage(id: number): Promise<ChatbotMessage | undefined> {
    console.warn("STUB: getChatbotMessage not implemented", id);
    return undefined;
  }
  async getChatbotMessagesBySessionId(sessionId: string): Promise<ChatbotMessage[]> {
    console.warn("STUB: getChatbotMessagesBySessionId not implemented", sessionId);
    return [];
  }
  async createChatbotMessage(message: InsertChatbotMessage): Promise<ChatbotMessage> {
    console.warn("STUB: createChatbotMessage not implemented", message);
    // @ts-ignore
    return { id: -1, timestamp: new Date(), ...message };
  }

  async getChatbotGameProgress(sessionId: string): Promise<ChatbotGameProgress | undefined> {
    console.warn("STUB: getChatbotGameProgress not implemented", sessionId);
    return undefined;
  }
  async createChatbotGameProgress(progress: InsertChatbotGameProgress): Promise<ChatbotGameProgress> {
    console.warn("STUB: createChatbotGameProgress not implemented", progress);
    // @ts-ignore
    return { id: -1, lastInteraction: new Date(), ...progress };
  }
  async updateChatbotGameProgress(sessionId: string, updates: Partial<ChatbotGameProgress>): Promise<ChatbotGameProgress | undefined> {
    console.warn("STUB: updateChatbotGameProgress not implemented", sessionId, updates);
    return undefined;
  }

  async getChatbotChallenge(id: number): Promise<ChatbotChallenge | undefined> {
    console.warn("STUB: getChatbotChallenge not implemented", id);
    return undefined;
  }
  async getAllChatbotChallenges(): Promise<ChatbotChallenge[]> {
    console.warn("STUB: getAllChatbotChallenges not implemented");
    return [];
  }
  async createChatbotChallenge(challenge: InsertChatbotChallenge): Promise<ChatbotChallenge> {
    console.warn("STUB: createChatbotChallenge not implemented", challenge);
    // @ts-ignore
    return { id: -1, createdAt: new Date(), ...challenge };
  }
  async updateChatbotChallenge(id: number, updates: Partial<ChatbotChallenge>): Promise<ChatbotChallenge | undefined> {
    console.warn("STUB: updateChatbotChallenge not implemented", id, updates);
    return undefined;
  }
  async deleteChatbotChallenge(id: number): Promise<boolean> {
    console.warn("STUB: deleteChatbotChallenge not implemented", id);
    return false;
  }
}

export const storage = new DatabaseStorage();
