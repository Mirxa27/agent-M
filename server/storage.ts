import {
  users,
  User,
  InsertUser,
  agents,
  Agent,
  InsertAgent,
  agentTools,
  AgentTool,
  InsertAgentTool,
  credentials,
  Credential,
  InsertCredential,
  files,
  File,
  InsertFile,
  tasks,
  Task,
  InsertTask,
  messages,
  Message,
  InsertMessage,
  taskFiles,
  TaskFile,
  InsertTaskFile,
  aiProviders,
  AiProvider,
  InsertAiProvider,
  browserSequences,
  browserSequenceSteps,
  BrowserSequence,
  BrowserSequenceStep,
  InsertBrowserSequence,
  InsertBrowserSequenceStep,
  aiModels,
  AiModel,
  InsertAiModel,
  aiPrompts,
  AiPrompt,
  InsertAiPrompt,
  plans,
  Plan,
  InsertPlan,
  userActivities,
  UserActivity,
  InsertUserActivity,
  dashboardPreferences,
  DashboardPreference,
  InsertDashboardPreference,
  analytics,
  Analytics,
  InsertAnalytics,
  siteSettings,
  SiteSettings,
  InsertSiteSettings,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

// Define SessionStore type to avoid TypeScript errors
type SessionStore = any;
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Site Settings operations
  getSiteSettings(): Promise<SiteSettings | undefined>;
  createSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings>;
  updateSiteSettings(updates: Partial<Omit<SiteSettings, "id">>): Promise<SiteSettings | undefined>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(
    id: number,
    updates: Partial<Omit<User, "id">>,
  ): Promise<User | undefined>;

  // Agent tools operations
  getAgentTool(id: number): Promise<AgentTool | undefined>;
  getAllAgentTools(): Promise<AgentTool[]>;
  getAgentToolsByCategory(category: string): Promise<AgentTool[]>;
  createAgentTool(tool: InsertAgentTool): Promise<AgentTool>;
  updateAgentTool(
    id: number,
    updates: Partial<Omit<AgentTool, "id">>,
  ): Promise<AgentTool | undefined>;
  deleteAgentTool(id: number): Promise<boolean>;

  // Agent operations
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentsByUserId(userId: number): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(
    id: number,
    updates: Partial<Omit<Agent, "id">>,
  ): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;

  // Credential operations
  getCredential(id: number): Promise<Credential | undefined>;
  getCredentialsByUserId(userId: number): Promise<Credential[]>;
  getCredentialsByAgentId(agentId: number): Promise<Credential[]>;
  createCredential(credential: InsertCredential): Promise<Credential>;
  updateCredential(
    id: number,
    updates: Partial<Omit<Credential, "id">>,
  ): Promise<Credential | undefined>;
  deleteCredential(id: number): Promise<boolean>;

  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByUserId(userId: number): Promise<File[]>;
  getTemplatesByUserId(userId: number): Promise<File[]>;
  getFilesByTaskId(taskId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(
    id: number,
    updates: Partial<Omit<File, "id">>,
  ): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;

  // Task-File operations
  linkFileToTask(taskId: number, fileId: number): Promise<TaskFile>;
  getTaskFilesByTaskId(taskId: number): Promise<TaskFile[]>;
  unlinkFileFromTask(taskId: number, fileId: number): Promise<boolean>;

  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByUserId(userId: number, limit?: number): Promise<Task[]>;
  getTasksByAgentId(agentId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(
    id: number,
    updates: Partial<Omit<Task, "id">>,
  ): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByTaskId(taskId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // AI Provider operations (admin only)
  getAiProvider(id: number): Promise<AiProvider | undefined>;
  getAllAiProviders(): Promise<AiProvider[]>;
  getActiveAiProviders(): Promise<AiProvider[]>;
  createAiProvider(provider: InsertAiProvider): Promise<AiProvider>;
  updateAiProvider(
    id: number,
    updates: Partial<Omit<AiProvider, "id">>,
  ): Promise<AiProvider | undefined>;
  deleteAiProvider(id: number): Promise<boolean>;

  // AI Model operations (admin only)
  getAiModel(id: number): Promise<AiModel | undefined>;
  getAiModelByName(modelId: string): Promise<AiModel | undefined>;
  getAllAiModels(): Promise<AiModel[]>;
  getAiModelsByProviderId(providerId: number): Promise<AiModel[]>;
  createAiModel(model: InsertAiModel): Promise<AiModel>;
  updateAiModel(
    id: number,
    updates: Partial<Omit<AiModel, "id">>,
  ): Promise<AiModel | undefined>;
  deleteAiModel(id: number): Promise<boolean>;

  // AI Prompt operations (admin only)
  getAiPrompt(id: number): Promise<AiPrompt | undefined>;
  getAllAiPrompts(): Promise<AiPrompt[]>;
  getAiPromptsByModelId(modelId: number): Promise<AiPrompt[]>;
  createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt>;
  updateAiPrompt(
    id: number,
    updates: Partial<Omit<AiPrompt, "id">>,
  ): Promise<AiPrompt | undefined>;
  deleteAiPrompt(id: number): Promise<boolean>;

  // Plan operations (admin only)
  getPlan(id: number): Promise<Plan | undefined>;
  getPlanByName(name: string): Promise<Plan | undefined>;
  getAllPlans(): Promise<Plan[]>;
  getActivePlans(): Promise<Plan[]>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(
    id: number,
    updates: Partial<Omit<Plan, "id">>,
  ): Promise<Plan | undefined>;
  deletePlan(id: number): Promise<boolean>;

  // User Activity operations
  getUserActivity(id: number): Promise<UserActivity | undefined>;
  getUserActivitiesByUserId(
    userId: number,
    limit?: number,
  ): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;

  // Dashboard Preferences operations
  getDashboardPreference(
    userId: number,
  ): Promise<DashboardPreference | undefined>;
  createDashboardPreference(
    preference: InsertDashboardPreference,
  ): Promise<DashboardPreference>;
  updateDashboardPreference(
    userId: number,
    updates: Partial<Omit<DashboardPreference, "id" | "userId">>,
  ): Promise<DashboardPreference | undefined>;

  // Analytics operations
  getUserAnalytics(
    userId: number,
    period: string,
  ): Promise<Analytics | undefined>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  updateAnalytics(
    id: number,
    updates: Partial<Omit<Analytics, "id">>,
  ): Promise<Analytics | undefined>;

  // Browser Sequence operations
  getBrowserSequence(id: number): Promise<BrowserSequence | undefined>;
  getBrowserSequencesByUserId(userId: number): Promise<BrowserSequence[]>;
  createBrowserSequence(sequence: InsertBrowserSequence): Promise<BrowserSequence>;
  updateBrowserSequence(
    id: number,
    updates: Partial<Omit<BrowserSequence, "id">>,
  ): Promise<BrowserSequence | undefined>;
  deleteBrowserSequence(id: number): Promise<boolean>;
  
  // Browser Sequence Step operations
  getBrowserSequenceStep(id: number): Promise<BrowserSequenceStep | undefined>;
  getBrowserSequenceStepsBySequenceId(sequenceId: number): Promise<BrowserSequenceStep[]>;
  createBrowserSequenceStep(step: InsertBrowserSequenceStep): Promise<BrowserSequenceStep>;
  updateBrowserSequenceStep(
    id: number,
    updates: Partial<Omit<BrowserSequenceStep, "id">>,
  ): Promise<BrowserSequenceStep | undefined>;
  deleteBrowserSequenceStep(id: number): Promise<boolean>;

  // Session store
  sessionStore: any; // Using any for compatibility
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agentTools: Map<number, AgentTool>;
  private agents: Map<number, Agent>;
  private credentials: Map<number, Credential>;
  private files: Map<number, File>;
  private tasks: Map<number, Task>;
  private messages: Map<number, Message>;
  private taskFiles: Map<number, TaskFile>;
  private aiModels: Map<number, AiModel>;
  private aiPrompts: Map<number, AiPrompt>;
  private aiProviders: Map<number, AiProvider>;
  private plans: Map<number, Plan>;
  private userActivities: Map<number, UserActivity>;
  private dashboardPreferences: Map<number, DashboardPreference>;
  private analyticsEntries: Map<number, Analytics>;
  private browserSequences: Map<number, BrowserSequence>;
  private browserSequenceSteps: Map<number, BrowserSequenceStep>;

  sessionStore: SessionStore;

  private userIdCounter: number;
  private agentToolIdCounter: number;
  private agentIdCounter: number;
  private credentialIdCounter: number;
  private fileIdCounter: number;
  private taskIdCounter: number;
  private messageIdCounter: number;
  private taskFileIdCounter: number;
  private aiModelIdCounter: number;
  private aiPromptIdCounter: number;
  private aiProviderIdCounter: number;
  private planIdCounter: number;
  private userActivityIdCounter: number;
  private dashboardPreferenceIdCounter: number;
  private analyticsIdCounter: number;
  private browserSequenceIdCounter: number;
  private browserSequenceStepIdCounter: number;

  private siteSettingsObj: SiteSettings | undefined;
  
  constructor() {
    this.users = new Map();
    this.agentTools = new Map();
    this.agents = new Map();
    this.credentials = new Map();
    this.files = new Map();
    this.tasks = new Map();
    this.messages = new Map();
    this.taskFiles = new Map();
    this.aiModels = new Map();
    this.aiPrompts = new Map();
    this.aiProviders = new Map();
    this.plans = new Map();
    this.userActivities = new Map();
    this.dashboardPreferences = new Map();
    this.analyticsEntries = new Map();
    this.browserSequences = new Map();
    this.browserSequenceSteps = new Map();

    this.userIdCounter = 1;
    this.agentToolIdCounter = 1;
    this.agentIdCounter = 1;
    this.credentialIdCounter = 1;
    this.fileIdCounter = 1;
    this.taskIdCounter = 1;
    this.messageIdCounter = 1;
    this.taskFileIdCounter = 1;
    this.aiModelIdCounter = 1;
    this.aiPromptIdCounter = 1;
    this.aiProviderIdCounter = 1;
    this.planIdCounter = 1;
    this.userActivityIdCounter = 1;
    this.dashboardPreferenceIdCounter = 1;
    this.analyticsIdCounter = 1;
    this.browserSequenceIdCounter = 1;
    this.browserSequenceStepIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Initialize with some default plans
    this.initializePlans();
    
    // Initialize default site settings
    this.initializeSiteSettings();
  }

  private initializePlans(): void {
    const plans: InsertPlan[] = [
      {
        name: "Free",
        price: 0,
        interval: "monthly",
        features: {
          agentLimit: 2,
          storageLimit: 500, // MB
          credentialLimit: 3,
          taskLimit: 50,
        },
        isActive: true,
      },
      {
        name: "Basic",
        price: 49,
        interval: "monthly",
        features: {
          agentLimit: 5,
          storageLimit: 2000, // MB
          credentialLimit: 10,
          taskLimit: 500,
        },
        isActive: true,
      },
      {
        name: "Professional",
        price: 149,
        interval: "monthly",
        features: {
          agentLimit: 20,
          storageLimit: 5000, // MB
          credentialLimit: 50,
          taskLimit: 5000,
        },
        isActive: true,
      },
      {
        name: "Enterprise",
        price: 499,
        interval: "monthly",
        features: {
          agentLimit: 100,
          storageLimit: 20000, // MB
          credentialLimit: 200,
          taskLimit: 50000,
        },
        isActive: true,
      },
    ];

    plans.forEach((plan) => this.createPlan(plan));
  }
  
  private initializeSiteSettings(): void {
    // Create default site settings if none exist
    const now = new Date();
    this.siteSettingsObj = {
      id: 1,
      logo: {
        url: "/assets/images/mirxa-logo.svg",
        showText: true,
        text: "Mirxa.io",
        animated: true,
      },
      colors: {
        primary: "#6366f1",
        secondary: "#0ea5e9",
        accent: "#f97316",
        background: "#ffffff",
        text: "#1e293b",
      },
      header: {
        sticky: true,
        transparent: false,
        showLogo: true,
        showNavigation: true,
      },
      footer: {
        showCopyright: true,
        copyrightText: "© 2025 Mirxa.io. All rights reserved.",
        showSocial: true,
      },
      chatbot: {
        enabled: true,
        position: "bottom-right",
        welcomeMessage: "Hi! How can I assist you today?",
        color: "#6366f1",
      },
      widgets: [
        { id: 'header-widget', label: 'Header' },
        { id: 'hero-widget', label: 'Hero Section' },
        { id: 'features-widget', label: 'Features' },
        { id: 'testimonials-widget', label: 'Testimonials' },
        { id: 'cta-widget', label: 'Call to Action' },
        { id: 'footer-widget', label: 'Footer' },
      ],
      version: 1,
      lastUpdated: now,
      updatedBy: null,
    };
  }
  
  // Site Settings operations
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    try {
      // Always fetch site settings with ID 1 (singleton)
      const [settings] = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.id, 1));
      
      return settings;
    } catch (error) {
      console.error("Error fetching site settings:", error);
      // If settings don't exist, create default settings
      const existingSettings = await this.getSiteSettings();
      if (!existingSettings) {
        return this.createDefaultSiteSettings();
      }
      return undefined;
    }
  }

  async createDefaultSiteSettings(): Promise<SiteSettings> {
    const now = new Date();
    const defaultSettings = {
      logo: {
        url: "/assets/images/mirxa-logo.svg",
        showText: true,
        text: "Mirxa.io",
        animated: true,
      },
      colors: {
        primary: "#6366f1",
        secondary: "#0ea5e9",
        accent: "#f97316",
        background: "#ffffff",
        text: "#1e293b",
      },
      header: {
        sticky: true,
        transparent: false,
        showLogo: true,
        showNavigation: true,
      },
      footer: {
        showCopyright: true,
        copyrightText: "© 2025 Mirxa.io. All rights reserved.",
        showSocial: true,
      },
      chatbot: {
        enabled: true,
        position: "bottom-right",
        welcomeMessage: "Hi! How can I assist you today?",
        color: "#6366f1",
      },
      widgets: [
        { id: 'header-widget', label: 'Header' },
        { id: 'hero-widget', label: 'Hero Section' },
        { id: 'features-widget', label: 'Features' },
        { id: 'testimonials-widget', label: 'Testimonials' },
        { id: 'cta-widget', label: 'Call to Action' },
        { id: 'footer-widget', label: 'Footer' },
      ],
      version: 1,
      lastUpdated: now,
      updatedBy: null,
    };
    
    return this.createSiteSettings(defaultSettings);
  }

  async createSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    try {
      const [newSettings] = await db
        .insert(siteSettings)
        .values({
          ...settings,
          version: 1,
          lastUpdated: new Date(),
        })
        .returning();
      
      return newSettings;
    } catch (error) {
      console.error("Error creating site settings:", error);
      throw new Error("Failed to create site settings");
    }
  }

  async updateSiteSettings(updates: Partial<Omit<SiteSettings, "id">>): Promise<SiteSettings | undefined> {
    try {
      // First check if settings exist
      const existingSettings = await this.getSiteSettings();
      
      if (!existingSettings) {
        // If no settings exist, create default settings with updates applied
        const defaultSettings = await this.createDefaultSiteSettings();
        // Apply the updates on top of default settings
        return this.updateSiteSettings(updates);
      }
      
      // Prepare updates with version increment and updated timestamp
      const updatesWithMeta = {
        ...updates,
        version: existingSettings.version + 1,
        lastUpdated: new Date(),
      };
      
      // Update the settings in the database
      const [updatedSettings] = await db
        .update(siteSettings)
        .set(updatesWithMeta)
        .where(eq(siteSettings.id, 1))
        .returning();
      
      return updatedSettings;
    } catch (error) {
      console.error("Error updating site settings:", error);
      throw new Error("Failed to update site settings");
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();

    // Get the free plan or first plan available
    let freePlanId: number | null = null;
    if (this.plans.size > 0) {
      const freePlan = Array.from(this.plans.values()).find(
        (plan) => plan.name.toLowerCase() === "free",
      );
      if (freePlan) {
        freePlanId = freePlan.id;
      } else {
        // Use the first plan if "Free" not found
        freePlanId = Array.from(this.plans.values())[0].id;
      }
    }

    const user: User = {
      id,
      ...insertUser,
      planId: freePlanId,
      planExpiresAt: null,
      role: "user",
      isActive: true,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(
    id: number,
    updates: Partial<Omit<User, "id">>,
  ): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Agent Tool operations
  async getAgentTool(id: number): Promise<AgentTool | undefined> {
    return this.agentTools.get(id);
  }

  async getAllAgentTools(): Promise<AgentTool[]> {
    return Array.from(this.agentTools.values());
  }

  async getAgentToolsByCategory(category: string): Promise<AgentTool[]> {
    return Array.from(this.agentTools.values()).filter(
      (tool) => tool.category === category,
    );
  }

  async createAgentTool(tool: InsertAgentTool): Promise<AgentTool> {
    const id = this.agentToolIdCounter++;
    const now = new Date();
    const newTool: AgentTool = {
      id,
      ...tool,
      config: tool.config || {}, // Ensure config is not undefined
      isActive: tool.isActive !== undefined ? tool.isActive : true, // Default to true if not provided
      isSystem: false, // Default to false, only system can set to true
      createdAt: now,
      updatedAt: now,
    };

    this.agentTools.set(id, newTool);
    return newTool;
  }

  async updateAgentTool(
    id: number,
    updates: Partial<Omit<AgentTool, "id">>,
  ): Promise<AgentTool | undefined> {
    const tool = await this.getAgentTool(id);
    if (!tool) return undefined;

    // Don't allow changing isSystem status if it's a system tool
    if (tool.isSystem && updates.isSystem === false) {
      throw new Error("Cannot change system status of a system tool");
    }

    const updatedTool = {
      ...tool,
      ...updates,
      updatedAt: new Date(),
    };

    this.agentTools.set(id, updatedTool);
    return updatedTool;
  }

  async deleteAgentTool(id: number): Promise<boolean> {
    const tool = await this.getAgentTool(id);
    if (tool && tool.isSystem) {
      throw new Error("Cannot delete a system tool");
    }

    return this.agentTools.delete(id);
  }

  // Agent operations
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentsByUserId(userId: number): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.userId === userId,
    );
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.agentIdCounter++;
    const now = new Date();
    const newAgent: Agent = {
      id,
      ...agent,
      taskCount: 0,
      createdAt: now,
    };
    this.agents.set(id, newAgent);
    return newAgent;
  }

  async updateAgent(
    id: number,
    updates: Partial<Omit<Agent, "id">>,
  ): Promise<Agent | undefined> {
    const agent = await this.getAgent(id);
    if (!agent) return undefined;

    const updatedAgent = { ...agent, ...updates };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<boolean> {
    return this.agents.delete(id);
  }

  // Credential operations
  async getCredential(id: number): Promise<Credential | undefined> {
    return this.credentials.get(id);
  }

  async getCredentialsByUserId(userId: number): Promise<Credential[]> {
    return Array.from(this.credentials.values()).filter(
      (credential) => credential.userId === userId,
    );
  }

  async getCredentialsByAgentId(agentId: number): Promise<Credential[]> {
    // In a real implementation, we would have an agent-credential relationship
    // For simplicity, we'll just return credentials for the user who owns the agent
    const agent = await this.getAgent(agentId);
    if (!agent) return [];

    return this.getCredentialsByUserId(agent.userId);
  }

  async createCredential(credential: InsertCredential): Promise<Credential> {
    const id = this.credentialIdCounter++;
    const now = new Date();
    const newCredential: Credential = {
      id,
      ...credential,
      createdAt: now,
      updatedAt: now,
    };
    this.credentials.set(id, newCredential);
    return newCredential;
  }

  async updateCredential(
    id: number,
    updates: Partial<Omit<Credential, "id">>,
  ): Promise<Credential | undefined> {
    const credential = await this.getCredential(id);
    if (!credential) return undefined;

    const updatedCredential = {
      ...credential,
      ...updates,
      updatedAt: new Date(),
    };
    this.credentials.set(id, updatedCredential);
    return updatedCredential;
  }

  async deleteCredential(id: number): Promise<boolean> {
    return this.credentials.delete(id);
  }

  // File operations
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByUserId(
    userId: number, 
    options?: { limit?: number; orderBy?: string; order?: 'asc' | 'desc' }
  ): Promise<File[]> {
    let files = Array.from(this.files.values()).filter(
      (file) => file.userId === userId,
    );

    if (options?.orderBy) {
      const sortField = options.orderBy as keyof File;
      files = files.sort((a, b) => {
        if (options.order === 'desc') {
          return a[sortField] > b[sortField] ? -1 : 1;
        }
        return a[sortField] < b[sortField] ? -1 : 1;
      });
    }

    if (options?.limit && options.limit > 0) {
      files = files.slice(0, options.limit);
    }

    return files;
  }

  async getTemplatesByUserId(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId && file.isTemplate,
    );
  }

  async createFile(file: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const newFile: File = {
      id,
      ...file,
      createdAt: now,
      updatedAt: now,
    };
    this.files.set(id, newFile);
    return newFile;
  }

  async updateFile(
    id: number,
    updates: Partial<Omit<File, "id">>,
  ): Promise<File | undefined> {
    const file = await this.getFile(id);
    if (!file) return undefined;

    const updatedFile = {
      ...file,
      ...updates,
      updatedAt: new Date(),
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }

  // Get files associated with a task through the task-file relationship
  async getFilesByTaskId(taskId: number): Promise<File[]> {
    // Get all task-file relationships for this task
    const taskFileRelations = Array.from(this.taskFiles.values()).filter(
      (tf) => tf.taskId === taskId,
    );

    // Get the actual files
    const files = taskFileRelations
      .map((tf) => this.files.get(tf.fileId))
      .filter(Boolean) as File[];

    return files;
  }

  // Task-File relationship operations
  async linkFileToTask(taskId: number, fileId: number): Promise<TaskFile> {
    // Make sure the task and file exist
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const file = await this.getFile(fileId);
    if (!file) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    // Create new task-file relationship
    const id = this.taskFileIdCounter++;
    const now = new Date();
    const taskFile: TaskFile = {
      id,
      taskId,
      fileId,
      createdAt: now,
    };

    this.taskFiles.set(id, taskFile);
    return taskFile;
  }

  async getTaskFilesByTaskId(taskId: number): Promise<TaskFile[]> {
    return Array.from(this.taskFiles.values()).filter(
      (taskFile) => taskFile.taskId === taskId,
    );
  }

  async unlinkFileFromTask(taskId: number, fileId: number): Promise<boolean> {
    // Find the task-file relationship to remove
    const taskFileToRemove = Array.from(this.taskFiles.values()).find(
      (tf) => tf.taskId === taskId && tf.fileId === fileId,
    );

    if (!taskFileToRemove) {
      return false;
    }

    // Remove the relationship
    return this.taskFiles.delete(taskFileToRemove.id);
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByUserId(userId: number, limit?: number): Promise<Task[]> {
    const tasks = Array.from(this.tasks.values())
      .filter((task) => task.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return limit ? tasks.slice(0, limit) : tasks;
  }

  async getTasksByAgentId(agentId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((task) => task.agentId === agentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const newTask: Task = {
      id,
      ...task,
      status: "pending",
      result: null,
      createdAt: now,
      completedAt: null,
    };
    this.tasks.set(id, newTask);

    // Update agent task count
    const agent = await this.getAgent(task.agentId);
    if (agent) {
      await this.updateAgent(agent.id, { taskCount: agent.taskCount + 1 });
    }

    return newTask;
  }

  async updateTask(
    id: number,
    updates: Partial<Omit<Task, "id">>,
  ): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;

    // If status is changing to completed, set completedAt
    const updatedTask: Task = {
      ...task,
      ...updates,
    };

    if (updates.status === "completed" && !task.completedAt) {
      updatedTask.completedAt = new Date();
    }

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    // Also delete associated messages
    const messagesToDelete = Array.from(this.messages.values())
      .filter((message) => message.taskId === id)
      .map((message) => message.id);

    messagesToDelete.forEach((messageId) => this.messages.delete(messageId));

    return this.tasks.delete(id);
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByTaskId(taskId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const newMessage: Message = {
      id,
      ...message,
      createdAt: now,
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  // AI Provider operations
  async getAiProvider(id: number): Promise<AiProvider | undefined> {
    return this.aiProviders.get(id);
  }

  async getAllAiProviders(): Promise<AiProvider[]> {
    return Array.from(this.aiProviders.values());
  }

  async getActiveAiProviders(): Promise<AiProvider[]> {
    return Array.from(this.aiProviders.values()).filter(
      (provider) => provider.isActive,
    );
  }

  async createAiProvider(provider: InsertAiProvider): Promise<AiProvider> {
    const id = this.aiProviderIdCounter++;
    const now = new Date();
    const newProvider: AiProvider = {
      id,
      ...provider,
      createdAt: now,
    };
    this.aiProviders.set(id, newProvider);
    return newProvider;
  }

  async updateAiProvider(
    id: number,
    updates: Partial<Omit<AiProvider, "id">>,
  ): Promise<AiProvider | undefined> {
    const provider = await this.getAiProvider(id);
    if (!provider) return undefined;

    const updatedProvider = { ...provider, ...updates };
    this.aiProviders.set(id, updatedProvider);
    return updatedProvider;
  }

  async deleteAiProvider(id: number): Promise<boolean> {
    // Check if any models are using this provider
    const modelsUsingProvider = await this.getAiModelsByProviderId(id);

    if (modelsUsingProvider.length > 0) {
      throw new Error("Cannot delete provider while models are using it");
    }

    return this.aiProviders.delete(id);
  }

  // AI Model operations
  async getAiModel(id: number): Promise<AiModel | undefined> {
    return this.aiModels.get(id);
  }

  async getAiModelByName(modelId: string): Promise<AiModel | undefined> {
    return Array.from(this.aiModels.values()).find(
      (model) => model.modelId === modelId,
    );
  }

  async getAllAiModels(): Promise<AiModel[]> {
    return Array.from(this.aiModels.values());
  }

  async getAiModelsByProviderId(providerId: number): Promise<AiModel[]> {
    return Array.from(this.aiModels.values()).filter(
      (model) => model.providerId === providerId,
    );
  }

  async createAiModel(model: InsertAiModel): Promise<AiModel> {
    const id = this.aiModelIdCounter++;
    const now = new Date();
    const newModel: AiModel = {
      id,
      ...model,
      createdAt: now,
      updatedAt: now,
    };
    this.aiModels.set(id, newModel);
    return newModel;
  }

  async updateAiModel(
    id: number,
    updates: Partial<Omit<AiModel, "id">>,
  ): Promise<AiModel | undefined> {
    const model = await this.getAiModel(id);
    if (!model) return undefined;

    const updatedModel = {
      ...model,
      ...updates,
      updatedAt: new Date(),
    };
    this.aiModels.set(id, updatedModel);
    return updatedModel;
  }

  async deleteAiModel(id: number): Promise<boolean> {
    // Check if any prompts are using this model
    const promptsUsingModel = await this.getAiPromptsByModelId(id);

    if (promptsUsingModel.length > 0) {
      throw new Error("Cannot delete model while prompts are using it");
    }

    return this.aiModels.delete(id);
  }

  // AI Prompt operations
  async getAiPrompt(id: number): Promise<AiPrompt | undefined> {
    return this.aiPrompts.get(id);
  }

  async getAllAiPrompts(): Promise<AiPrompt[]> {
    return Array.from(this.aiPrompts.values());
  }

  async getAiPromptsByModelId(modelId: number): Promise<AiPrompt[]> {
    return Array.from(this.aiPrompts.values()).filter(
      (prompt) => prompt.modelId === modelId,
    );
  }

  async createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt> {
    const id = this.aiPromptIdCounter++;
    const now = new Date();
    const newPrompt: AiPrompt = {
      id,
      ...prompt,
      createdAt: now,
      updatedAt: now,
    };
    this.aiPrompts.set(id, newPrompt);
    return newPrompt;
  }

  async updateAiPrompt(
    id: number,
    updates: Partial<Omit<AiPrompt, "id">>,
  ): Promise<AiPrompt | undefined> {
    const prompt = await this.getAiPrompt(id);
    if (!prompt) return undefined;

    const updatedPrompt = {
      ...prompt,
      ...updates,
      updatedAt: new Date(),
    };
    this.aiPrompts.set(id, updatedPrompt);
    return updatedPrompt;
  }

  async deleteAiPrompt(id: number): Promise<boolean> {
    return this.aiPrompts.delete(id);
  }

  // Plan operations
  async getPlan(id: number): Promise<Plan | undefined> {
    return this.plans.get(id);
  }

  async getPlanByName(name: string): Promise<Plan | undefined> {
    return Array.from(this.plans.values()).find(
      (plan) => plan.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async getAllPlans(): Promise<Plan[]> {
    return Array.from(this.plans.values());
  }

  async getActivePlans(): Promise<Plan[]> {
    return Array.from(this.plans.values()).filter((plan) => plan.isActive);
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const id = this.planIdCounter++;
    const newPlan: Plan = {
      id,
      ...plan,
    };
    this.plans.set(id, newPlan);
    return newPlan;
  }

  async updatePlan(
    id: number,
    updates: Partial<Omit<Plan, "id">>,
  ): Promise<Plan | undefined> {
    const plan = await this.getPlan(id);
    if (!plan) return undefined;

    const updatedPlan = { ...plan, ...updates };
    this.plans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deletePlan(id: number): Promise<boolean> {
    return this.plans.delete(id);
  }

  // User Activity operations
  async getUserActivity(id: number): Promise<UserActivity | undefined> {
    return this.userActivities.get(id);
  }

  async getUserActivitiesByUserId(
    userId: number,
    limit?: number,
  ): Promise<UserActivity[]> {
    let activities = Array.from(this.userActivities.values())
      .filter((activity) => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (limit) {
      activities = activities.slice(0, limit);
    }

    return activities;
  }

  async createUserActivity(
    activity: InsertUserActivity,
  ): Promise<UserActivity> {
    const id = this.userActivityIdCounter++;
    const now = new Date();
    const newActivity: UserActivity = {
      id,
      ...activity,
      metadata: activity.metadata || {},
      createdAt: now,
    };

    this.userActivities.set(id, newActivity);
    return newActivity;
  }

  // Dashboard Preferences operations
  async getDashboardPreference(
    userId: number,
  ): Promise<DashboardPreference | undefined> {
    return Array.from(this.dashboardPreferences.values()).find(
      (pref) => pref.userId === userId,
    );
  }

  async createDashboardPreference(
    preference: InsertDashboardPreference,
  ): Promise<DashboardPreference> {
    // First check if preference already exists for this user
    const existingPreference = await this.getDashboardPreference(
      preference.userId,
    );
    if (existingPreference) {
      // If it exists, update it instead
      return this.updateDashboardPreference(preference.userId, {
        layout: preference.layout,
        favoriteAgents: preference.favoriteAgents,
        recentTasks: preference.recentTasks,
        widgets: preference.widgets,
        theme: preference.theme,
      }) as Promise<DashboardPreference>;
    }

    // Otherwise create new preference
    const id = this.dashboardPreferenceIdCounter++;
    const now = new Date();
    const newPreference: DashboardPreference = {
      id,
      ...preference,
      layout: preference.layout || {},
      favoriteAgents: preference.favoriteAgents || [],
      recentTasks: preference.recentTasks || [],
      widgets: preference.widgets || [],
      updatedAt: now,
    };

    this.dashboardPreferences.set(id, newPreference);
    return newPreference;
  }

  async updateDashboardPreference(
    userId: number,
    updates: Partial<Omit<DashboardPreference, "id" | "userId">>,
  ): Promise<DashboardPreference | undefined> {
    const preference = await this.getDashboardPreference(userId);
    if (!preference) return undefined;

    const updatedPreference = {
      ...preference,
      ...updates,
      updatedAt: new Date(),
    };

    this.dashboardPreferences.set(preference.id, updatedPreference);
    return updatedPreference;
  }

  // Analytics operations
  async getUserAnalytics(
    userId: number,
    period: string,
  ): Promise<Analytics | undefined> {
    return Array.from(this.analyticsEntries.values())
      .filter((a) => a.userId === userId && a.period === period)
      .sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime())[0];
  }

  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const id = this.analyticsIdCounter++;
    const now = new Date();
    const newAnalytics: Analytics = {
      id,
      ...analyticsData,
      metadata: analyticsData.metadata || {},
      createdAt: now,
    };

    this.analyticsEntries.set(id, newAnalytics);
    return newAnalytics;
  }

  async updateAnalytics(
    id: number,
    updates: Partial<Omit<Analytics, "id">>,
  ): Promise<Analytics | undefined> {
    const analytics = this.analyticsEntries.get(id);
    if (!analytics) return undefined;

    const updatedAnalytics = {
      ...analytics,
      ...updates,
    };

    this.analyticsEntries.set(id, updatedAnalytics);
    return updatedAnalytics;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session', // Explicitly name the session table
      schemaName: 'public', // Specify the schema
      ttl: 86400 * 30, // 30 days (in seconds)
      pruneSessionInterval: 60 * 60, // 1 hour (in seconds)
    });

    // Initialize default plans if they don't exist
    this.initializePlans();
  }

  private async initializePlans(): Promise<void> {
    const existingPlans = await this.getAllPlans();
    if (existingPlans.length === 0) {
      const defaultPlans: InsertPlan[] = [
        {
          name: "Free",
          price: 0,
          interval: "monthly",
          features: {
            agentLimit: 2,
            storageLimit: 500, // MB
            credentialLimit: 3,
            taskLimit: 50,
          },
          isActive: true,
        },
        {
          name: "Basic",
          price: 49,
          interval: "monthly",
          features: {
            agentLimit: 5,
            storageLimit: 2000, // MB
            credentialLimit: 10,
            taskLimit: 500,
          },
          isActive: true,
        },
        {
          name: "Professional",
          price: 149,
          interval: "monthly",
          features: {
            agentLimit: 20,
            storageLimit: 5000, // MB
            credentialLimit: 50,
            taskLimit: 5000,
          },
          isActive: true,
        },
        {
          name: "Enterprise",
          price: 499,
          interval: "monthly",
          features: {
            agentLimit: 100,
            storageLimit: 20000, // MB
            credentialLimit: 200,
            taskLimit: 50000,
          },
          isActive: true,
        },
      ];

      for (const plan of defaultPlans) {
        await this.createPlan(plan);
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users).orderBy(asc(users.id));
      return allUsers;
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Get the free plan ID, or use null if no plans exist yet
    let freePlanId: number | undefined = undefined;
    try {
      const [freePlan] = await db
        .select()
        .from(plans)
        .where(eq(plans.name, "Free"))
        .limit(1);
      if (freePlan) {
        freePlanId = freePlan.id;
      }
    } catch (error) {
      console.error("Error finding free plan:", error);
    }

    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        planId: freePlanId,
        planExpiresAt: null,
        role: "user",
        isActive: true,
      })
      .returning();
    return user;
  }

  async updateUser(
    id: number,
    updates: Partial<Omit<User, "id">>,
  ): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Helper method to get AI model by name
  async getAiModelByName(modelId: string): Promise<AiModel | undefined> {
    const [model] = await db
      .select()
      .from(aiModels)
      .where(eq(aiModels.modelId, modelId));
    return model;
  }

  // Agent Tool operations
  async getAgentTool(id: number): Promise<AgentTool | undefined> {
    const [tool] = await db
      .select()
      .from(agentTools)
      .where(eq(agentTools.id, id));
    return tool;
  }

  async getAllAgentTools(): Promise<AgentTool[]> {
    return await db.select().from(agentTools);
  }

  async getAgentToolsByCategory(category: string): Promise<AgentTool[]> {
    return await db
      .select()
      .from(agentTools)
      .where(eq(agentTools.category, category));
  }

  async createAgentTool(tool: InsertAgentTool): Promise<AgentTool> {
    const now = new Date();
    const toolWithDefaults = {
      ...tool,
      isSystem: false, // Default to false, only system can set to true
      createdAt: now,
      updatedAt: now,
    };

    const [newTool] = await db
      .insert(agentTools)
      .values(toolWithDefaults)
      .returning();

    return newTool;
  }

  async updateAgentTool(
    id: number,
    updates: Partial<Omit<AgentTool, "id">>,
  ): Promise<AgentTool | undefined> {
    // Check if tool exists and if it's a system tool
    const tool = await this.getAgentTool(id);
    if (!tool) return undefined;

    // Don't allow changing isSystem status if it's a system tool
    if (tool.isSystem && updates.isSystem === false) {
      throw new Error("Cannot change system status of a system tool");
    }

    // Set the updated timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };

    const [updatedTool] = await db
      .update(agentTools)
      .set(updatesWithTimestamp)
      .where(eq(agentTools.id, id))
      .returning();

    return updatedTool;
  }

  async deleteAgentTool(id: number): Promise<boolean> {
    // Check if tool exists and if it's a system tool
    const tool = await this.getAgentTool(id);
    if (!tool) return false;

    // Cannot delete system tools
    if (tool.isSystem) {
      throw new Error("Cannot delete a system tool");
    }

    const result = await db.delete(agentTools).where(eq(agentTools.id, id));

    return result.rowCount > 0;
  }

  // Agent operations
  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async getAgentsByUserId(userId: number): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.userId, userId));
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const now = new Date();
    const [newAgent] = await db
      .insert(agents)
      .values({
        ...agent,
        taskCount: 0,
        createdAt: now,
      })
      .returning();
    return newAgent;
  }

  async updateAgent(
    id: number,
    updates: Partial<Omit<Agent, "id">>,
  ): Promise<Agent | undefined> {
    const [updatedAgent] = await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, id))
      .returning();
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<boolean> {
    const result = await db.delete(agents).where(eq(agents.id, id));
    return result.rowCount > 0;
  }

  // Credential operations
  async getCredential(id: number): Promise<Credential | undefined> {
    const [credential] = await db
      .select()
      .from(credentials)
      .where(eq(credentials.id, id));
    return credential;
  }

  async getCredentialsByUserId(userId: number): Promise<Credential[]> {
    return await db
      .select()
      .from(credentials)
      .where(eq(credentials.userId, userId));
  }

  async getCredentialsByAgentId(agentId: number): Promise<Credential[]> {
    // In a real implementation, we would have an agent-credential relationship
    // For now, we get the agent first, then get credentials for that user
    const agent = await this.getAgent(agentId);
    if (!agent) return [];

    return this.getCredentialsByUserId(agent.userId);
  }

  async createCredential(credential: InsertCredential): Promise<Credential> {
    const now = new Date();
    const [newCredential] = await db
      .insert(credentials)
      .values({
        ...credential,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return newCredential;
  }

  async updateCredential(
    id: number,
    updates: Partial<Omit<Credential, "id">>,
  ): Promise<Credential | undefined> {
    const now = new Date();
    const [updatedCredential] = await db
      .update(credentials)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(credentials.id, id))
      .returning();
    return updatedCredential;
  }

  async deleteCredential(id: number): Promise<boolean> {
    const result = await db.delete(credentials).where(eq(credentials.id, id));
    return result.rowCount > 0;
  }

  // File operations
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

  async createFile(file: InsertFile): Promise<File> {
    const now = new Date();
    const [newFile] = await db
      .insert(files)
      .values({
        ...file,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return newFile;
  }

  async updateFile(
    id: number,
    updates: Partial<Omit<File, "id">>,
  ): Promise<File | undefined> {
    const now = new Date();
    const [updatedFile] = await db
      .update(files)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(files.id, id))
      .returning();
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return result.rowCount > 0;
  }

  // Get files linked to a task through the task-file relationship
  async getFilesByTaskId(taskId: number): Promise<File[]> {
    // Get file IDs from task-file relationship
    const fileIds = await db
      .select({ fileId: taskFiles.fileId })
      .from(taskFiles)
      .where(eq(taskFiles.taskId, taskId));

    if (fileIds.length === 0) {
      return [];
    }

    // Create an array of OR conditions for each fileId
    const fileIdConditions = fileIds.map((row) => eq(files.id, row.fileId));

    return await db
      .select()
      .from(files)
      .where(or(...fileIdConditions));
  }

  // Task-File relationship operations
  async linkFileToTask(taskId: number, fileId: number): Promise<TaskFile> {
    // Verify the task and file exist
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const file = await this.getFile(fileId);
    if (!file) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    // Create the relationship record
    const now = new Date();
    const [taskFile] = await db
      .insert(taskFiles)
      .values({
        taskId,
        fileId,
        createdAt: now,
      })
      .returning();

    return taskFile;
  }

  async getTaskFilesByTaskId(taskId: number): Promise<TaskFile[]> {
    return await db
      .select()
      .from(taskFiles)
      .where(eq(taskFiles.taskId, taskId));
  }

  async unlinkFileFromTask(taskId: number, fileId: number): Promise<boolean> {
    const result = await db
      .delete(taskFiles)
      .where(and(eq(taskFiles.taskId, taskId), eq(taskFiles.fileId, fileId)));

    return result.rowCount > 0;
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByUserId(userId: number, limit?: number): Promise<Task[]> {
    let query = db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }

  async getTasksByAgentId(agentId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.agentId, agentId))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const now = new Date();
    const [newTask] = await db
      .insert(tasks)
      .values({
        ...task,
        status: "pending",
        result: null,
        createdAt: now,
        completedAt: null,
      })
      .returning();

    // Update agent task count
    const agent = await this.getAgent(task.agentId);
    if (agent) {
      await this.updateAgent(agent.id, { taskCount: agent.taskCount + 1 });
    }

    return newTask;
  }

  async updateTask(
    id: number,
    updates: Partial<Omit<Task, "id">>,
  ): Promise<Task | undefined> {
    // If status is changing to completed, set completedAt
    let updatesWithTimestamp = { ...updates };

    if (updates.status === "completed") {
      const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
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
    // Delete associated messages first
    await db.delete(messages).where(eq(messages.taskId, id));

    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message;
  }

  async getMessagesByTaskId(taskId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.taskId, taskId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const now = new Date();
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        createdAt: now,
      })
      .returning();
    return newMessage;
  }

  // AI Provider operations
  async getAiProvider(id: number): Promise<AiProvider | undefined> {
    const [provider] = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.id, id));
    return provider;
  }

  async getAllAiProviders(): Promise<AiProvider[]> {
    return await db.select().from(aiProviders);
  }

  async getActiveAiProviders(): Promise<AiProvider[]> {
    return await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.isActive, true));
  }

  async createAiProvider(provider: InsertAiProvider): Promise<AiProvider> {
    const now = new Date();
    const [newProvider] = await db
      .insert(aiProviders)
      .values({
        ...provider,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return newProvider;
  }

  async updateAiProvider(
    id: number,
    updates: Partial<Omit<AiProvider, "id">>,
  ): Promise<AiProvider | undefined> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };

    const [updatedProvider] = await db
      .update(aiProviders)
      .set(updatesWithTimestamp)
      .where(eq(aiProviders.id, id))
      .returning();
    return updatedProvider;
  }

  async deleteAiProvider(id: number): Promise<boolean> {
    // Check if any models are using this provider
    const modelsUsingProvider = await this.getAiModelsByProviderId(id);

    if (modelsUsingProvider.length > 0) {
      throw new Error("Cannot delete provider while models are using it");
    }

    const result = await db.delete(aiProviders).where(eq(aiProviders.id, id));
    return result.rowCount > 0;
  }

  // AI Model operations
  async getAiModel(id: number): Promise<AiModel | undefined> {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.id, id));
    return model;
  }

  async getAllAiModels(): Promise<AiModel[]> {
    return await db.select().from(aiModels);
  }

  async getAiModelsByProviderId(providerId: number): Promise<AiModel[]> {
    return await db
      .select()
      .from(aiModels)
      .where(eq(aiModels.providerId, providerId));
  }

  async createAiModel(model: InsertAiModel): Promise<AiModel> {
    const now = new Date();
    const [newModel] = await db
      .insert(aiModels)
      .values({
        ...model,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return newModel;
  }

  async updateAiModel(
    id: number,
    updates: Partial<Omit<AiModel, "id">>,
  ): Promise<AiModel | undefined> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };

    const [updatedModel] = await db
      .update(aiModels)
      .set(updatesWithTimestamp)
      .where(eq(aiModels.id, id))
      .returning();
    return updatedModel;
  }

  async deleteAiModel(id: number): Promise<boolean> {
    // Check if any prompts are using this model
    const promptsUsingModel = await this.getAiPromptsByModelId(id);

    if (promptsUsingModel.length > 0) {
      throw new Error("Cannot delete model while prompts are using it");
    }

    const result = await db.delete(aiModels).where(eq(aiModels.id, id));
    return result.rowCount > 0;
  }

  // AI Prompt operations
  async getAiPrompt(id: number): Promise<AiPrompt | undefined> {
    const [prompt] = await db
      .select()
      .from(aiPrompts)
      .where(eq(aiPrompts.id, id));
    return prompt;
  }

  async getAllAiPrompts(): Promise<AiPrompt[]> {
    return await db.select().from(aiPrompts);
  }

  async getAiPromptsByModelId(modelId: number): Promise<AiPrompt[]> {
    return await db
      .select()
      .from(aiPrompts)
      .where(eq(aiPrompts.modelId, modelId));
  }

  async createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt> {
    const now = new Date();
    const [newPrompt] = await db
      .insert(aiPrompts)
      .values({
        ...prompt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return newPrompt;
  }

  async updateAiPrompt(
    id: number,
    updates: Partial<Omit<AiPrompt, "id">>,
  ): Promise<AiPrompt | undefined> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };

    const [updatedPrompt] = await db
      .update(aiPrompts)
      .set(updatesWithTimestamp)
      .where(eq(aiPrompts.id, id))
      .returning();
    return updatedPrompt;
  }

  async deleteAiPrompt(id: number): Promise<boolean> {
    const result = await db.delete(aiPrompts).where(eq(aiPrompts.id, id));
    return result.rowCount > 0;
  }

  // Plan operations
  async getPlan(id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async getPlanByName(name: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.name, name));
    return plan;
  }

  async getAllPlans(): Promise<Plan[]> {
    return await db.select().from(plans);
  }

  async getActivePlans(): Promise<Plan[]> {
    return await db.select().from(plans).where(eq(plans.isActive, true));
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [newPlan] = await db.insert(plans).values(plan).returning();
    return newPlan;
  }

  async updatePlan(
    id: number,
    updates: Partial<Omit<Plan, "id">>,
  ): Promise<Plan | undefined> {
    try {
      const [updatedPlan] = await db
        .update(plans)
        .set(updates)
        .where(eq(plans.id, id))
        .returning();
      return updatedPlan;
    } catch (error) {
      console.error("Error updating plan:", error);
      throw new Error(`Failed to update plan: ${error.message}`);
    }
  }

  async deletePlan(id: number): Promise<boolean> {
    const result = await db.delete(plans).where(eq(plans.id, id));
    return result.rowCount > 0;
  }

  // User Activity operations
  async getUserActivity(id: number): Promise<UserActivity | undefined> {
    const [activity] = await db
      .select()
      .from(userActivities)
      .where(eq(userActivities.id, id));
    return activity;
  }

  async getUserActivitiesByUserId(
    userId: number,
    limit?: number,
  ): Promise<UserActivity[]> {
    let query = db
      .select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.createdAt));

    if (limit) {
      query = query.limit(limit);
    }

    return query;
  }

  async createUserActivity(
    activity: InsertUserActivity,
  ): Promise<UserActivity> {
    const [newActivity] = await db
      .insert(userActivities)
      .values(activity)
      .returning();
    return newActivity;
  }

  // Dashboard Preferences operations
  async getDashboardPreference(
    userId: number,
  ): Promise<DashboardPreference | undefined> {
    const [preference] = await db
      .select()
      .from(dashboardPreferences)
      .where(eq(dashboardPreferences.userId, userId));
    return preference;
  }

  async createDashboardPreference(
    preference: InsertDashboardPreference,
  ): Promise<DashboardPreference> {
    // First check if preference already exists for this user
    const existingPreference = await this.getDashboardPreference(
      preference.userId,
    );
    if (existingPreference) {
      // If it exists, update it instead
      return this.updateDashboardPreference(preference.userId, {
        layout: preference.layout,
        favoriteAgents: preference.favoriteAgents,
        recentTasks: preference.recentTasks,
        widgets: preference.widgets,
        theme: preference.theme,
      }) as Promise<DashboardPreference>;
    }

    // Otherwise create new preference
    const [newPreference] = await db
      .insert(dashboardPreferences)
      .values(preference)
      .returning();
    return newPreference;
  }

  async updateDashboardPreference(
    userId: number,
    updates: Partial<Omit<DashboardPreference, "id" | "userId">>,
  ): Promise<DashboardPreference | undefined> {
    // Add updated timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };

    const result = await db
      .update(dashboardPreferences)
      .set(updatesWithTimestamp)
      .where(eq(dashboardPreferences.userId, userId))
      .returning();

    return result[0];
  }

  // Analytics operations
  async getUserAnalytics(
    userId: number,
    period: string,
  ): Promise<Analytics | undefined> {
    const [analyticsData] = await db
      .select()
      .from(analytics)
      .where(and(eq(analytics.userId, userId), eq(analytics.period, period)))
      .orderBy(desc(analytics.periodEnd))
      .limit(1);

    return analyticsData;
  }

  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [newAnalytics] = await db
      .insert(analytics)
      .values(analyticsData)
      .returning();
    return newAnalytics;
  }

  async updateAnalytics(
    id: number,
    updates: Partial<Omit<Analytics, "id">>,
  ): Promise<Analytics | undefined> {
    const result = await db
      .update(analytics)
      .set(updates)
      .where(eq(analytics.id, id))
      .returning();

    return result[0];
  }

  // Site Settings operations
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    try {
      console.log("Getting site settings from database");
      const [settings] = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.id, 1));
      
      console.log("Site settings found:", settings ? "yes" : "no");
      return settings;
    } catch (error) {
      console.error("Error getting site settings:", error);
      return undefined;
    }
  }

  async createDefaultSiteSettings(): Promise<SiteSettings> {
    const now = new Date();
    const defaultSettings = {
      logo: {
        url: "/assets/images/mirxa-logo.svg",
        showText: true,
        text: "Mirxa.io",
        animated: true,
      },
      colors: {
        primary: "#6366f1",
        secondary: "#0ea5e9",
        accent: "#f97316",
        background: "#ffffff",
        text: "#1e293b",
      },
      header: {
        sticky: true,
        transparent: false,
        showLogo: true,
        showNavigation: true,
      },
      footer: {
        showCopyright: true,
        copyrightText: "© 2025 Mirxa.io. All rights reserved.",
        showSocial: true,
      },
      chatbot: {
        enabled: true,
        position: "bottom-right",
        welcomeMessage: "Hi! How can I assist you today?",
        autoOpen: false,
      },
      version: 1,
      createdAt: now,
      lastUpdated: now,
    };

    console.log("Creating default site settings");
    return this.createSiteSettings(defaultSettings);
  }

  async createSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    try {
      // Always use ID 1 for site settings
      const settingsWithId = {
        ...settings,
        id: 1
      };
      
      console.log("Inserting site settings into database");
      const [newSettings] = await db
        .insert(siteSettings)
        .values(settingsWithId)
        .onConflictDoUpdate({
          target: siteSettings.id,
          set: settingsWithId
        })
        .returning();
      
      console.log("Site settings created successfully");
      return newSettings;
    } catch (error) {
      console.error("Error creating site settings:", error);
      throw new Error("Failed to create site settings");
    }
  }

  async updateSiteSettings(updates: Partial<Omit<SiteSettings, "id">>): Promise<SiteSettings | undefined> {
    try {
      // Check if settings exist
      const existingSettings = await this.getSiteSettings();
      
      // If no settings, create default then apply updates
      if (!existingSettings) {
        console.log("No existing settings found, creating defaults first");
        const defaultSettings = await this.createDefaultSiteSettings();
        // Apply the updates on top of default settings
        return this.updateSiteSettings(updates);
      }
      
      // Prepare updates with version increment and updated timestamp
      const updatesWithMeta = {
        ...updates,
        version: existingSettings.version + 1,
        lastUpdated: new Date(),
      };
      
      console.log("Updating site settings in database");
      // Update the settings in the database
      const [updatedSettings] = await db
        .update(siteSettings)
        .set(updatesWithMeta)
        .where(eq(siteSettings.id, 1))
        .returning();
      
      console.log("Site settings updated successfully");
      return updatedSettings;
    } catch (error) {
      console.error("Error updating site settings:", error);
      throw new Error("Failed to update site settings");
    }
  }
}

// Use database storage
export const storage = new DatabaseStorage();
