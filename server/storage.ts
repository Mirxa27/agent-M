import {
  Agent,
  AgentTool,
  AiModel,
  AiPrompt,
  AiProvider,
  Analytics,
  BrowserSequence,
  BrowserSequenceStep, // Added by user
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
  InsertBrowserSequence,
  InsertBrowserSequenceStep, // Added by user
  InsertConversation // Added by user
  ,
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
  agentTools,
  agents,
  aiModels,
  aiPrompts,
  aiProviders,
  analytics,
  browserSequenceSteps,
  browserSequences,
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
  users
} from "@shared/schema";
import connectPg from "connect-pg-simple";
import { and, asc, desc, eq, inArray } from "drizzle-orm"; // Added or, inArray
import session from "express-session";
import createMemoryStore from "memorystore";
import { db, pool } from "./db";

// Define SessionStore type to avoid TypeScript errors
type SessionStore = any;

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Site Settings operations
  getSiteSettings(): Promise<SiteSettings | undefined>;
  createSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings>;
  updateSiteSettings(updates: Partial<Omit<SiteSettings, "id">>): Promise<SiteSettings | undefined>;

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
  deleteUser(id: number): Promise<boolean>;

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
  getAgentTemplates(): Promise<Agent[]>; // Added
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
  getMessagesByConversationId(conversationId: number): Promise<Message[]>; // Added
  createMessage(message: InsertMessage): Promise<Message>;

  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number, agentId?: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<Omit<Conversation, "id">>): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;

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

  // Session store
  sessionStore: any; // Using any for compatibility
}

// MemStorage class as provided by the user, including the "Method not implemented" errors
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
  private conversations: Map<number, Conversation>; // Added by user

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
  private conversationIdCounter: number; // Added by user

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
    this.conversations = new Map(); // Added by user

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
    this.conversationIdCounter = 1; // Added by user

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    this.initializePlans();
    this.initializeSiteSettings();
  }
  // Methods from user's version of MemStorage, including "throw new Error"
  getBrowserSequence(id: number): Promise<BrowserSequence | undefined> { throw new Error('Method not implemented.'); }
  getBrowserSequencesByUserId(userId: number): Promise<BrowserSequence[]> { throw new Error('Method not implemented.'); }
  createBrowserSequence(sequence: InsertBrowserSequence): Promise<BrowserSequence> { throw new Error('Method not implemented.'); }
  updateBrowserSequence(id: number, updates: Partial<Omit<BrowserSequence, 'id'>>): Promise<BrowserSequence | undefined> { throw new Error('Method not implemented.'); }
  deleteBrowserSequence(id: number): Promise<boolean> { throw new Error('Method not implemented.'); }
  getBrowserSequenceStep(id: number): Promise<BrowserSequenceStep | undefined> { throw new Error('Method not implemented.'); }
  getBrowserSequenceStepsBySequenceId(sequenceId: number): Promise<BrowserSequenceStep[]> { throw new Error('Method not implemented.'); }
  createBrowserSequenceStep(step: InsertBrowserSequenceStep): Promise<BrowserSequenceStep> { throw new Error('Method not implemented.'); }
  updateBrowserSequenceStep(id: number, updates: Partial<Omit<BrowserSequenceStep, 'id'>>): Promise<BrowserSequenceStep | undefined> { throw new Error('Method not implemented.'); }
  deleteBrowserSequenceStep(id: number): Promise<boolean> { throw new Error('Method not implemented.'); }
  linkFileToTask(taskId: number, fileId: number): Promise<TaskFile> { throw new Error('Method not implemented.'); }
  getTaskFilesByTaskId(taskId: number): Promise<TaskFile[]> { throw new Error('Method not implemented.'); }
  unlinkFileFromTask(taskId: number, fileId: number): Promise<boolean> { throw new Error('Method not implemented.'); }
  getTask(id: number): Promise<Task | undefined> { throw new Error('Method not implemented.'); }
  getTasksByUserId(userId: number, limit?: number): Promise<Task[]> { throw new Error('Method not implemented.'); }
  getTasksByAgentId(agentId: number): Promise<Task[]> { throw new Error('Method not implemented.'); }
  createTask(task: InsertTask): Promise<Task> { throw new Error('Method not implemented.'); }
  updateTask(id: number, updates: Partial<Omit<Task, 'id'>>): Promise<Task | undefined> { throw new Error('Method not implemented.'); }
  deleteTask(id: number): Promise<boolean> { throw new Error('Method not implemented.'); }
  getMessage(id: number): Promise<Message | undefined> { throw new Error('Method not implemented.'); }
  getMessagesByTaskId(taskId: number): Promise<Message[]> { throw new Error('Method not implemented.'); }
  getAiProvider(id: number): Promise<AiProvider | undefined> { throw new Error('Method not implemented.'); }
  getAllAiProviders(): Promise<AiProvider[]> { throw new Error('Method not implemented.'); }
  getActiveAiProviders(): Promise<AiProvider[]> { throw new Error('Method not implemented.'); }
  createAiProvider(provider: InsertAiProvider): Promise<AiProvider> { throw new Error('Method not implemented.'); }
  updateAiProvider(id: number, updates: Partial<Omit<AiProvider, 'id'>>): Promise<AiProvider | undefined> { throw new Error('Method not implemented.'); }
  deleteAiProvider(id: number): Promise<boolean> { throw new Error('Method not implemented.'); }
  getAiModel(id: number): Promise<AiModel | undefined> { throw new Error('Method not implemented.'); }
  getAiModelByName(modelId: string): Promise<AiModel | undefined> { throw new Error('Method not implemented.'); }
  getAllAiModels(): Promise<AiModel[]> { throw new Error('Method not implemented.'); }
  getAiModelsByProviderId(providerId: number): Promise<AiModel[]> { throw new Error('Method not implemented.'); }
  createAiModel(model: InsertAiModel): Promise<AiModel> { throw new Error('Method not implemented.'); }
  updateAiModel(id: number, updates: Partial<Omit<AiModel, 'id'>>): Promise<AiModel | undefined> { throw new Error('Method not implemented.'); }
  deleteAiModel(id: number): Promise<boolean> { throw new Error('Method not implemented.'); }
  getAiPrompt(id: number): Promise<AiPrompt | undefined> { throw new Error('Method not implemented.'); }
  getAllAiPrompts(): Promise<AiPrompt[]> { throw new Error('Method not implemented.'); }
  getAiPromptsByModelId(modelId: number): Promise<AiPrompt[]> { throw new Error('Method not implemented.'); }
  createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt> { throw new Error('Method not implemented.'); }
  updateAiPrompt(id: number, updates: Partial<Omit<AiPrompt, 'id'>>): Promise<AiPrompt | undefined> { throw new Error('Method not implemented.'); }
  deleteAiPrompt(id: number): Promise<boolean> { throw new Error('Method not implemented.'); }
  getPlan(id: number): Promise<Plan | undefined> { throw new Error('Method not implemented.'); }
  getPlanByName(name: string): Promise<Plan | undefined> { throw new Error('Method not implemented.'); }
  getAllPlans(): Promise<Plan[]> { return Promise.resolve(Array.from(this.plans.values())); } // Kept user's working version
  getActivePlans(): Promise<Plan[]> { return Promise.resolve(Array.from(this.plans.values()).filter(p => p.isActive)); } // Kept user's working version
  updatePlan(id: number, updates: Partial<Omit<Plan, 'id'>>): Promise<Plan | undefined> { throw new Error('Method not implemented.'); }
  deletePlan(id: number): Promise<boolean> { throw new Error('Method not implemented.'); }
  getUserActivity(id: number): Promise<UserActivity | undefined> { throw new Error('Method not implemented.'); }
  getUserActivitiesByUserId(userId: number, limit?: number): Promise<UserActivity[]> { throw new Error('Method not implemented.'); }
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity> { throw new Error('Method not implemented.'); }
  getDashboardPreference(userId: number): Promise<DashboardPreference | undefined> { throw new Error('Method not implemented.'); }
  createDashboardPreference(preference: InsertDashboardPreference): Promise<DashboardPreference> { throw new Error('Method not implemented.'); }
  updateDashboardPreference(userId: number, updates: Partial<Omit<DashboardPreference, 'id' | 'userId'>>): Promise<DashboardPreference | undefined> { throw new Error('Method not implemented.'); }
  getUserAnalytics(userId: number, period: string): Promise<Analytics | undefined> { throw new Error('Method not implemented.'); }
  createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> { throw new Error('Method not implemented.'); }
  updateAnalytics(id: number, updates: Partial<Omit<Analytics, 'id'>>): Promise<Analytics | undefined> { throw new Error('Method not implemented.'); }

  private initializePlans(): void {
    const defaultPlans: InsertPlan[] = [
      { name: "Free", price: 0, interval: "monthly", features: { agentLimit: 2, storageLimit: 500, credentialLimit: 3, taskLimit: 50, }, isActive: true, },
      { name: "Basic", price: 49, interval: "monthly", features: { agentLimit: 5, storageLimit: 2000, credentialLimit: 10, taskLimit: 500, }, isActive: true, },
      { name: "Professional", price: 149, interval: "monthly", features: { agentLimit: 20, storageLimit: 5000, credentialLimit: 50, taskLimit: 5000, }, isActive: true, },
      { name: "Enterprise", price: 499, interval: "monthly", features: { agentLimit: 100, storageLimit: 20000, credentialLimit: 200, taskLimit: 50000, }, isActive: true, },
    ];
    defaultPlans.forEach((plan) => this.createPlan(plan));
  }

  async createPlan(plan: InsertPlan): Promise<Plan> { // Kept user's working version
    const id = this.planIdCounter++;
    const newPlan: Plan = {
      id,
      ...plan,
      features: plan.features || { agentLimit: 0, storageLimit: 0, credentialLimit: 0, taskLimit: 0 }, // Provide default
      isActive: plan.isActive !== undefined ? plan.isActive : true, // Ensure isActive is boolean
    };
    this.plans.set(id, newPlan);
    return newPlan;
  }

  private initializeSiteSettings(): void {
    const now = new Date();
    this.siteSettingsObj = {
      id: 1,
      logo: { url: "/assets/images/mirxa-logo.svg", showText: true, text: "Mirxa.io", animated: true, },
      colors: { primary: "#6366f1", secondary: "#0ea5e9", accent: "#f97316", background: "#ffffff", text: "#1e293b", },
      header: { sticky: true, transparent: false, showLogo: true, showNavigation: true, },
      footer: { showCopyright: true, copyrightText: "© 2025 Mirxa.io. All rights reserved.", showSocial: true, },
      chatbot: { enabled: true, position: "bottom-right", welcomeMessage: "Hi! How can I assist you today?", color: "#6366f1", autoOpen: false }, // Added autoOpen as in DB schema
      widgets: [{ id: 'header-widget', label: 'Header' }, { id: 'hero-widget', label: 'Hero Section' }, { id: 'features-widget', label: 'Features' }, { id: 'testimonials-widget', label: 'Testimonials' }, { id: 'cta-widget', label: 'Call to Action' }, { id: 'footer-widget', label: 'Footer' },],
      version: 1,
      lastUpdated: now,
      updatedBy: null,
      // createdAt: now, // Removed due to type error: SiteSettings type inferred by TS doesn't have createdAt
    };
  }

  async getSiteSettings(): Promise<SiteSettings | undefined> {
    return Promise.resolve(this.siteSettingsObj);
  }
  async createSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const now = new Date();
    const newSiteSettings: SiteSettings = {
      id: 1,
      logo: settings.logo || { url: "/assets/images/mirxa-logo.svg", showText: true, text: "Mirxa.io", animated: true },
      colors: settings.colors || { primary: "#6366f1", secondary: "#0ea5e9", accent: "#f97316", background: "#ffffff", text: "#1e293b" },
      header: settings.header || { sticky: true, transparent: false, showLogo: true, showNavigation: true },
      footer: settings.footer || { showCopyright: true, copyrightText: "© 2025 Mirxa.io. All rights reserved.", showSocial: true },
      chatbot: settings.chatbot || { enabled: true, position: "bottom-right", welcomeMessage: "Hi! How can I assist you today?", color: "#6366f1", autoOpen: false },
      widgets: settings.widgets || [],
      version: settings.version || 1,
      lastUpdated: now,
      updatedBy: settings.updatedBy === undefined ? null : settings.updatedBy,
      // createdAt: settings.createdAt || now, // Removed due to type error: InsertSiteSettings and SiteSettings types inferred by TS don't have createdAt
    };
    this.siteSettingsObj = newSiteSettings;
    if (!this.siteSettingsObj) {
      throw new Error("Failed to create site settings object in MemStorage");
    }
    return Promise.resolve(this.siteSettingsObj);
  }
  async updateSiteSettings(updates: Partial<Omit<SiteSettings, "id">>): Promise<SiteSettings | undefined> {
    if (!this.siteSettingsObj) {
      this.initializeSiteSettings();
    }
    if (!this.siteSettingsObj) {
      return Promise.resolve(undefined);
    }
    this.siteSettingsObj = {
      ...this.siteSettingsObj,
      ...updates,
      version: (this.siteSettingsObj.version || 0) + 1,
      lastUpdated: new Date(),
    };
    return Promise.resolve(this.siteSettingsObj);
  }
  async getUser(id: number): Promise<User | undefined> { return Promise.resolve(this.users.get(id)); }
  async getUserByUsername(username: string): Promise<User | undefined> { return Promise.resolve(Array.from(this.users.values()).find(u => u.username.toLowerCase() === username.toLowerCase())); }
  async getUserByEmail(email: string): Promise<User | undefined> { return Promise.resolve(Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase())); }
  async getAllUsers(): Promise<User[]> { return Promise.resolve(Array.from(this.users.values())); }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    let freePlanId: number | undefined = undefined;
    if (this.plans.size > 0) {
      const freePlan = Array.from(this.plans.values()).find(p => p.name.toLowerCase() === "free");
      freePlanId = freePlan ? freePlan.id : Array.from(this.plans.values())[0].id;
    }
    const now = new Date();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      fullName: insertUser.fullName ?? null,
      planId: freePlanId ?? null,
      planExpiresAt: null,
      role: "user", // Default, as InsertUser type inferred by TS doesn't have 'role'
      isActive: true, // Default, as InsertUser type inferred by TS doesn't have 'isActive'
      createdAt: now, // Default, as InsertUser type inferred by TS doesn't have 'createdAt'
      updatedAt: now, // Default, as InsertUser type inferred by TS doesn't have 'updatedAt'
      avatarUrl: null, // Default, as InsertUser type inferred by TS doesn't have 'avatarUrl'
      bio: null, // Default, as InsertUser type inferred by TS doesn't have 'bio'
      lastLoginAt: null,
      emailVerified: false, // Default, as InsertUser type inferred by TS doesn't have 'emailVerified'
      settings: {}, // Default, as InsertUser type inferred by TS doesn't have 'settings'
    };
    this.users.set(id, user); return Promise.resolve(user);
  }
  async updateUser(id: number, updates: Partial<Omit<User, "id">>): Promise<User | undefined> {
    const user = await this.getUser(id); if (!user) return Promise.resolve(undefined);
    const updatedUser = { ...user, ...updates, updatedAt: new Date() }; this.users.set(id, updatedUser); return Promise.resolve(updatedUser);
  }
  async deleteUser(id: number): Promise<boolean> {
    const user = await this.getUser(id); if (!user) return false;
    if (user.role === "admin") { const admins = Array.from(this.users.values()).filter(u => u.role === "admin"); if (admins.length <= 1) throw new Error("Cannot delete the last admin user"); }
    return this.users.delete(id);
  }
  async getAgentTool(id: number): Promise<AgentTool | undefined> { return Promise.resolve(this.agentTools.get(id)); }
  async getAllAgentTools(): Promise<AgentTool[]> { return Promise.resolve(Array.from(this.agentTools.values())); }
  async getAgentToolsByCategory(category: string): Promise<AgentTool[]> { return Promise.resolve(Array.from(this.agentTools.values()).filter(t => t.category === category)); }
  async createAgentTool(tool: InsertAgentTool): Promise<AgentTool> {
    const id = this.agentToolIdCounter++; const now = new Date();
    const newTool: AgentTool = {
      id,
      name: tool.name,
      description: tool.description ?? null,
      category: tool.category ?? null,
      type: tool.type ?? null,
      icon: tool.icon ?? null,
      config: tool.config || {},
      isActive: tool.isActive !== undefined ? tool.isActive : true,
      isSystem: false, // Default, as InsertAgentTool type inferred by TS doesn't have 'isSystem'
      createdAt: now, // Default, as InsertAgentTool type inferred by TS doesn't have 'createdAt'
      updatedAt: now, // Default, as InsertAgentTool type inferred by TS doesn't have 'updatedAt'
    };
    this.agentTools.set(id, newTool); return Promise.resolve(newTool);
  }
  async updateAgentTool(id: number, updates: Partial<Omit<AgentTool, "id">>): Promise<AgentTool | undefined> {
    const tool = await this.getAgentTool(id); if (!tool) return Promise.resolve(undefined);
    if (tool.isSystem && updates.isSystem === false) throw new Error("Cannot change system status of a system tool");
    const updatedTool = { ...tool, ...updates, updatedAt: new Date(), }; this.agentTools.set(id, updatedTool); return Promise.resolve(updatedTool);
  }
  async deleteAgentTool(id: number): Promise<boolean> {
    const tool = await this.getAgentTool(id); if (tool && tool.isSystem) throw new Error("Cannot delete a system tool");
    return this.agentTools.delete(id);
  }
  async getAgent(id: number): Promise<Agent | undefined> { return Promise.resolve(this.agents.get(id)); }
  async getAgentsByUserId(userId: number): Promise<Agent[]> { return Promise.resolve(Array.from(this.agents.values()).filter(a => a.userId === userId && !a.isTemplate)); }
  async getAgentTemplates(): Promise<Agent[]> { return Promise.resolve(Array.from(this.agents.values()).filter(a => a.isTemplate === true)); }
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.agentIdCounter++; const now = new Date();
    const newAgent: Agent = {
      id,
      ...agent,
      config: agent.config ?? {},
      tools: agent.tools ?? [],
      taskCount: 0,
      isActive: agent.isActive !== undefined ? agent.isActive : true,
      isTemplate: agent.isTemplate !== undefined ? agent.isTemplate : false,
      createdAt: now,
      updatedAt: now
    };
    this.agents.set(id, newAgent); return Promise.resolve(newAgent);
  }
  async updateAgent(id: number, updates: Partial<Omit<Agent, "id">>): Promise<Agent | undefined> {
    const agent = await this.getAgent(id); if (!agent) return Promise.resolve(undefined);
    const updatedAgent = { ...agent, ...updates, updatedAt: new Date() }; this.agents.set(id, updatedAgent); return Promise.resolve(updatedAgent);
  }
  async deleteAgent(id: number): Promise<boolean> { return this.agents.delete(id); }
  async getCredential(id: number): Promise<Credential | undefined> { return Promise.resolve(this.credentials.get(id)); }
  async getCredentialsByUserId(userId: number): Promise<Credential[]> { return Promise.resolve(Array.from(this.credentials.values()).filter(c => c.userId === userId)); }
  async getCredentialsByAgentId(agentId: number): Promise<Credential[]> {
    const agent = await this.getAgent(agentId); if (!agent) return Promise.resolve([]); return this.getCredentialsByUserId(agent.userId);
  }
  async createCredential(credential: InsertCredential): Promise<Credential> {
    const id = this.credentialIdCounter++; const now = new Date();
    const newCredential: Credential = {
      id,
      ...credential,
      authMethod: credential.authMethod || "unknown",
      service: credential.service === undefined ? null : credential.service,
      expiresAt: credential.expiresAt === undefined ? null : credential.expiresAt,
      lastRefreshedAt: credential.lastRefreshedAt === undefined ? null : credential.lastRefreshedAt,
      createdAt: now,
      updatedAt: now,
    };
    this.credentials.set(id, newCredential); return Promise.resolve(newCredential);
  }
  async updateCredential(id: number, updates: Partial<Omit<Credential, "id">>): Promise<Credential | undefined> {
    const credential = await this.getCredential(id); if (!credential) return Promise.resolve(undefined);
    const updatedCredential = { ...credential, ...updates, updatedAt: new Date(), };
    this.credentials.set(id, updatedCredential); return Promise.resolve(updatedCredential);
  }
  async deleteCredential(id: number): Promise<boolean> { return Promise.resolve(this.credentials.delete(id)); }
  async getFile(id: number): Promise<File | undefined> { return Promise.resolve(this.files.get(id)); }
  async getFilesByUserId(userId: number): Promise<File[]> { return Promise.resolve(Array.from(this.files.values()).filter(f => f.userId === userId)); }
  async getTemplatesByUserId(userId: number): Promise<File[]> { return Promise.resolve(Array.from(this.files.values()).filter(f => f.userId === userId && f.isTemplate)); }
  async getFilesByTaskId(taskId: number): Promise<File[]> {
    const taskFileRelations = Array.from(this.taskFiles.values()).filter(tf => tf.taskId === taskId);
    return Promise.resolve(taskFileRelations.map(tf => this.files.get(tf.fileId)).filter(Boolean) as File[]);
  }
  async createFile(file: InsertFile): Promise<File> {
    const id = this.fileIdCounter++; const now = new Date();
    const newFile: File = {
      id,
      ...file,
      description: file.description === undefined ? null : file.description,
      isTemplate: file.isTemplate !== undefined ? file.isTemplate : false,
      templateType: file.templateType === undefined ? null : file.templateType,
      templateCategory: file.templateCategory === undefined ? null : file.templateCategory,
      createdAt: now,
      updatedAt: now,
    };
    this.files.set(id, newFile); return Promise.resolve(newFile);
  }
  async updateFile(id: number, updates: Partial<Omit<File, "id">>): Promise<File | undefined> {
    const file = await this.getFile(id); if (!file) return Promise.resolve(undefined);
    const updatedFile = { ...file, ...updates, updatedAt: new Date(), };
    this.files.set(id, updatedFile); return Promise.resolve(updatedFile);
  }
  async deleteFile(id: number): Promise<boolean> { return Promise.resolve(this.files.delete(id)); }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++; const now = new Date();
    const newMessage: Message = {
      id,
      // ...message, // Spreading InsertMessage might bring in fields not in Message select type
      taskId: message.taskId === undefined ? null : message.taskId,
      conversationId: message.conversationId === undefined ? null : message.conversationId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || now,
      metadata: message.metadata || {},
      createdAt: now, // Message select type has createdAt
    };
    this.messages.set(id, newMessage); return Promise.resolve(newMessage);
  }
  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return Promise.resolve(Array.from(this.messages.values()).filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  }
  async getConversation(id: number): Promise<Conversation | undefined> { return Promise.resolve(this.conversations.get(id)); }
  async getConversationsByUserId(userId: number, agentId?: number): Promise<Conversation[]> {
    let userConversations = Array.from(this.conversations.values()).filter(c => c.userId === userId);
    if (agentId !== undefined) { userConversations = userConversations.filter(c => c.agentId === agentId); }
    return Promise.resolve(userConversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationIdCounter++; const now = new Date();
    const newConversation: Conversation = {
      id,
      ...conversation,
      title: conversation.title === undefined ? null : conversation.title,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, newConversation); return Promise.resolve(newConversation);
  }
  async updateConversation(id: number, updates: Partial<Omit<Conversation, "id">>): Promise<Conversation | undefined> {
    const conversation = await this.getConversation(id); if (!conversation) return Promise.resolve(undefined);
    const updatedConversation = { ...conversation, ...updates, updatedAt: new Date() };
    this.conversations.set(id, updatedConversation); return Promise.resolve(updatedConversation);
  }
  async deleteConversation(id: number): Promise<boolean> {
    const messagesToDelete = Array.from(this.messages.values()).filter(m => m.conversationId === id).map(m => m.id);
    messagesToDelete.forEach(mid => this.messages.delete(mid));
    return Promise.resolve(this.conversations.delete(id));
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
        { name: "Free", price: 0, interval: "monthly", features: { agentLimit: 2, storageLimit: 500, credentialLimit: 3, taskLimit: 50, }, isActive: true, },
        { name: "Basic", price: 49, interval: "monthly", features: { agentLimit: 5, storageLimit: 2000, credentialLimit: 10, taskLimit: 500, }, isActive: true, },
        { name: "Professional", price: 149, interval: "monthly", features: { agentLimit: 20, storageLimit: 5000, credentialLimit: 50, taskLimit: 5000, }, isActive: true, },
        { name: "Enterprise", price: 499, interval: "monthly", features: { agentLimit: 100, storageLimit: 20000, credentialLimit: 200, taskLimit: 50000, }, isActive: true, },
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
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(asc(users.id));
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    let freePlanId: number | undefined = undefined;
    try {
      const [freePlan] = await db.select().from(plans).where(eq(plans.name, "Free")).limit(1);
      if (freePlan) freePlanId = freePlan.id;
    } catch (error) { console.error("Error finding free plan:", error); }

    const userToInsert: InsertUser = { // Ensure type is InsertUser
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      fullName: insertUser.fullName,
      planId: freePlanId ?? null,
      planExpiresAt: null,
      role: insertUser.role || "user",
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
      // createdAt and updatedAt are handled by DB defaults
    };

    const [user] = await db.insert(users).values(userToInsert).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<Omit<User, "id">>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const user = await this.getUser(id);
      if (!user) return false;
      if (user.role === "admin") {
        const admins = await db.select().from(users).where(eq(users.role, "admin"));
        if (admins.length <= 1) throw new Error("Cannot delete the last admin user");
      }
      const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      return false;
    }
  }

  async getAiModelByName(modelId: string): Promise<AiModel | undefined> {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.modelId, modelId));
    return model;
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
    const now = new Date();
    const toolToInsert: InsertAgentTool = { // Ensure type is InsertAgentTool
      name: tool.name,
      description: tool.description,
      category: tool.category,
      type: tool.type,
      icon: tool.icon,
      config: tool.config || {},
      isActive: tool.isActive !== undefined ? tool.isActive : true,
      isSystem: tool.isSystem ?? false, // Default isSystem if not provided
      // createdAt and updatedAt are handled by DB defaults
    };

    const [newTool] = await db.insert(agentTools).values(toolToInsert).returning();
    return newTool;
  }

  async updateAgentTool(id: number, updates: Partial<Omit<AgentTool, "id">>): Promise<AgentTool | undefined> {
    const tool = await this.getAgentTool(id);
    if (!tool) return undefined;
    if (tool.isSystem && updates.isSystem === false) throw new Error("Cannot change system status of a system tool");
    const [updatedTool] = await db.update(agentTools).set({ ...updates, updatedAt: new Date(), }).where(eq(agentTools.id, id)).returning();
    return updatedTool;
  }

  async deleteAgentTool(id: number): Promise<boolean> {
    const tool = await this.getAgentTool(id);
    if (!tool) return false;
    if (tool.isSystem) throw new Error("Cannot delete a system tool");
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
    const now = new Date();
    const [newAgent] = await db.insert(agents).values({ ...agent, taskCount: 0, createdAt: now, updatedAt: now, }).returning();
    return newAgent;
  }

  async updateAgent(id: number, updates: Partial<Omit<Agent, "id">>): Promise<Agent | undefined> {
    const [updatedAgent] = await db.update(agents).set({ ...updates, updatedAt: new Date() }).where(eq(agents.id, id)).returning();
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
    const agent = await this.getAgent(agentId);
    if (!agent) return [];
    return this.getCredentialsByUserId(agent.userId);
  }

  async createCredential(credential: InsertCredential): Promise<Credential> {
    const now = new Date();
    const [newCredential] = await db.insert(credentials).values({ ...credential, createdAt: now, updatedAt: now, }).returning();
    return newCredential;
  }

  async updateCredential(id: number, updates: Partial<Omit<Credential, "id">>): Promise<Credential | undefined> {
    const now = new Date();
    const [updatedCredential] = await db.update(credentials).set({ ...updates, updatedAt: now, }).where(eq(credentials.id, id)).returning();
    return updatedCredential;
  }

  async deleteCredential(id: number): Promise<boolean> {
    const result = await db.delete(credentials).where(eq(credentials.id, id));
    return (result.rowCount ?? 0) > 0;
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
    return await db.select().from(files).where(and(eq(files.userId, userId), eq(files.isTemplate, true)));
  }

  async createFile(fileData: InsertFile): Promise<File> { // Changed param name
    const now = new Date();
    const [newFile] = await db.insert(files).values({ ...fileData, createdAt: now, updatedAt: now, }).returning();
    return newFile;
  }

  async updateFile(id: number, updates: Partial<Omit<File, "id">>): Promise<File | undefined> {
    const now = new Date();
    const [updatedFile] = await db.update(files).set({ ...updates, updatedAt: now, }).where(eq(files.id, id)).returning();
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getFilesByTaskId(taskId: number): Promise<File[]> {
    const fileIdRows = await db.select({ fileId: taskFiles.fileId }).from(taskFiles).where(eq(taskFiles.taskId, taskId));
    if (fileIdRows.length === 0) return [];
    const fileIds = fileIdRows.map(row => row.fileId);
    return await db.select().from(files).where(inArray(files.id, fileIds));
  }

  async linkFileToTask(taskId: number, fileId: number): Promise<TaskFile> {
    const task = await this.getTask(taskId);
    if (!task) throw new Error(`Task with ID ${taskId} not found`);
    const file = await this.getFile(fileId);
    if (!file) throw new Error(`File with ID ${fileId} not found`);
    const now = new Date();
    const [taskFile] = await db.insert(taskFiles).values({ taskId, fileId, createdAt: now, }).returning();
    return taskFile;
  }

  async getTaskFilesByTaskId(taskId: number): Promise<TaskFile[]> {
    return await db.select().from(taskFiles).where(eq(taskFiles.taskId, taskId));
  }

  async unlinkFileFromTask(taskId: number, fileId: number): Promise<boolean> {
    const result = await db.delete(taskFiles).where(and(eq(taskFiles.taskId, taskId), eq(taskFiles.fileId, fileId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByUserId(userId: number, limit?: number): Promise<Task[]> {
    const baseQuery = db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
    if (limit) {
      return await baseQuery.limit(limit);
    }
    return await baseQuery;
  }

  async getTasksByAgentId(agentId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.agentId, agentId)).orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const now = new Date();
    const [newTask] = await db.insert(tasks).values({ ...task, status: "pending", result: null, createdAt: now, completedAt: null, }).returning();
    const agent = await this.getAgent(task.agentId);
    if (agent) await this.updateAgent(agent.id, { taskCount: agent.taskCount + 1 });
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Omit<Task, "id">>): Promise<Task | undefined> {
    let updatesWithTimestamp = { ...updates };
    if (updates.status === "completed") {
      const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
      if (task && !task.completedAt) updatesWithTimestamp.completedAt = new Date();
    }
    const [updatedTask] = await db.update(tasks).set(updatesWithTimestamp).where(eq(tasks.id, id)).returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    await db.delete(messages).where(eq(messages.taskId, id));
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesByTaskId(taskId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.taskId, taskId)).orderBy(asc(messages.timestamp));
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.timestamp));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const now = new Date();
    // Ensure that the properties match the `messagesTable` schema, especially nullability
    const messageToInsert: typeof messages.$inferInsert = {
      taskId: message.taskId === undefined ? null : message.taskId,
      conversationId: message.conversationId === undefined ? null : message.conversationId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || now,
      metadata: message.metadata || {},
      // createdAt is handled by DB default or trigger, not needed in insert usually
      // id is serial
    };

    const [newMessage] = await db.insert(messages).values(messageToInsert).returning();
    return newMessage;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getConversationsByUserId(userId: number, agentId?: number): Promise<Conversation[]> {
    const conditions = [eq(conversations.userId, userId)];
    if (agentId !== undefined) {
      conditions.push(eq(conversations.agentId, agentId));
    }
    // Use 'and' if there are multiple conditions, otherwise Drizzle handles a single condition fine.
    // However, to be safe and explicit, especially if conditions array could be empty (though not here):
    if (conditions.length === 0) { // Should not happen in this specific logic
      return await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
    }
    return await db.select().from(conversations)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const now = new Date();
    const [newConversation] = await db.insert(conversations).values({ ...conversation, createdAt: now, updatedAt: now, }).returning();
    return newConversation;
  }

  async updateConversation(id: number, updates: Partial<Omit<Conversation, "id">>): Promise<Conversation | undefined> {
    const [updatedConversation] = await db.update(conversations).set({ ...updates, updatedAt: new Date() }).where(eq(conversations.id, id)).returning();
    return updatedConversation;
  }

  async deleteConversation(id: number): Promise<boolean> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    const result = await db.delete(conversations).where(eq(conversations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAiProvider(id: number): Promise<AiProvider | undefined> {
    const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.id, id));
    return provider;
  }

  async getAllAiProviders(): Promise<AiProvider[]> {
    return await db.select().from(aiProviders);
  }

  async getActiveAiProviders(): Promise<AiProvider[]> {
    return await db.select().from(aiProviders).where(eq(aiProviders.isActive, true));
  }

  async createAiProvider(provider: InsertAiProvider): Promise<AiProvider> {
    const now = new Date();
    const [newProvider] = await db.insert(aiProviders).values({ ...provider, createdAt: now, updatedAt: now, }).returning();
    return newProvider;
  }

  async updateAiProvider(id: number, updates: Partial<Omit<AiProvider, "id">>): Promise<AiProvider | undefined> {
    const [updatedProvider] = await db.update(aiProviders).set({ ...updates, updatedAt: new Date(), }).where(eq(aiProviders.id, id)).returning();
    return updatedProvider;
  }

  async deleteAiProvider(id: number): Promise<boolean> {
    const modelsUsingProvider = await this.getAiModelsByProviderId(id);
    if (modelsUsingProvider.length > 0) throw new Error("Cannot delete provider while models are using it");
    const result = await db.delete(aiProviders).where(eq(aiProviders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAiModel(id: number): Promise<AiModel | undefined> {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.id, id));
    return model;
  }

  async getAllAiModels(): Promise<AiModel[]> {
    return await db.select().from(aiModels);
  }

  async getAiModelsByProviderId(providerId: number): Promise<AiModel[]> {
    return await db.select().from(aiModels).where(eq(aiModels.providerId, providerId));
  }

  async createAiModel(model: InsertAiModel): Promise<AiModel> {
    const now = new Date();
    const [newModel] = await db.insert(aiModels).values({ ...model, createdAt: now, updatedAt: now, }).returning();
    return newModel;
  }

  async updateAiModel(id: number, updates: Partial<Omit<AiModel, "id">>): Promise<AiModel | undefined> {
    const [updatedModel] = await db.update(aiModels).set({ ...updates, updatedAt: new Date(), }).where(eq(aiModels.id, id)).returning();
    return updatedModel;
  }

  async deleteAiModel(id: number): Promise<boolean> {
    const promptsUsingModel = await this.getAiPromptsByModelId(id);
    if (promptsUsingModel.length > 0) throw new Error("Cannot delete model while prompts are using it");
    const result = await db.delete(aiModels).where(eq(aiModels.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAiPrompt(id: number): Promise<AiPrompt | undefined> {
    const [prompt] = await db.select().from(aiPrompts).where(eq(aiPrompts.id, id));
    return prompt;
  }

  async getAllAiPrompts(): Promise<AiPrompt[]> {
    return await db.select().from(aiPrompts);
  }

  async getAiPromptsByModelId(modelId: number): Promise<AiPrompt[]> {
    return await db.select().from(aiPrompts).where(eq(aiPrompts.modelId, modelId));
  }

  async createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt> {
    const now = new Date();
    const [newPrompt] = await db.insert(aiPrompts).values({ ...prompt, createdAt: now, updatedAt: now, }).returning();
    return newPrompt;
  }

  async updateAiPrompt(id: number, updates: Partial<Omit<AiPrompt, "id">>): Promise<AiPrompt | undefined> {
    const [updatedPrompt] = await db.update(aiPrompts).set({ ...updates, updatedAt: new Date(), }).where(eq(aiPrompts.id, id)).returning();
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
    return await db.select().from(plans);
  }

  async getActivePlans(): Promise<Plan[]> {
    return await db.select().from(plans).where(eq(plans.isActive, true));
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    // Ensure the plan has isActive property set
    const planToInsert = {
      ...plan,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      // Ensure features is included even if not provided
      features: plan.features || { agentLimit: 0, storageLimit: 0, credentialLimit: 0, taskLimit: 0 }
    };

    const [newPlan] = await db.insert(plans).values(planToInsert).returning();
    return newPlan;
  }

  async updatePlan(id: number, updates: Partial<Omit<Plan, "id">>): Promise<Plan | undefined> {
    try {
      const [updatedPlan] = await db.update(plans).set(updates).where(eq(plans.id, id)).returning();
      return updatedPlan;
    } catch (error: any) {
      console.error("Error updating plan:", error);
      throw new Error(`Failed to update plan: ${error.message}`);
    }
  }

  async deletePlan(id: number): Promise<boolean> {
    const result = await db.delete(plans).where(eq(plans.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserActivity(id: number): Promise<UserActivity | undefined> {
    const [activity] = await db.select().from(userActivities).where(eq(userActivities.id, id));
    return activity;
  }

  async getUserActivitiesByUserId(userId: number, limit?: number): Promise<UserActivity[]> {
    const baseQuery = db.select().from(userActivities).where(eq(userActivities.userId, userId)).orderBy(desc(userActivities.createdAt));
    if (limit) {
      return await baseQuery.limit(limit);
    }
    return await baseQuery;
  }

  async createUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [newActivity] = await db.insert(userActivities).values(activity).returning();
    return newActivity;
  }

  async getDashboardPreference(userId: number): Promise<DashboardPreference | undefined> {
    const [preference] = await db.select().from(dashboardPreferences).where(eq(dashboardPreferences.userId, userId));
    return preference;
  }

  async createDashboardPreference(preference: InsertDashboardPreference): Promise<DashboardPreference> {
    const existing = await this.getDashboardPreference(preference.userId);
    if (existing) {
      return this.updateDashboardPreference(preference.userId, preference as Partial<Omit<DashboardPreference, "id" | "userId">>) as Promise<DashboardPreference>;
    }
    const [newPreference] = await db.insert(dashboardPreferences).values(preference).returning();
    return newPreference;
  }

  async updateDashboardPreference(userId: number, updates: Partial<Omit<DashboardPreference, "id" | "userId">>): Promise<DashboardPreference | undefined> {
    const [updated] = await db.update(dashboardPreferences).set({ ...updates, updatedAt: new Date() }).where(eq(dashboardPreferences.userId, userId)).returning();
    return updated;
  }

  async getUserAnalytics(userId: number, period: string): Promise<Analytics | undefined> {
    const [analyticsData] = await db.select().from(analytics).where(and(eq(analytics.userId, userId), eq(analytics.period, period))).orderBy(desc(analytics.periodEnd)).limit(1);
    return analyticsData;
  }

  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [newAnalytics] = await db.insert(analytics).values(analyticsData).returning();
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

  // Browser Sequence operations
  async getBrowserSequence(id: number): Promise<BrowserSequence | undefined> {
    const [sequence] = await db
      .select()
      .from(browserSequences)
      .where(eq(browserSequences.id, id));
    return sequence;
  }

  async getBrowserSequencesByUserId(userId: number): Promise<BrowserSequence[]> {
    const sequences = await db
      .select()
      .from(browserSequences)
      .where(eq(browserSequences.userId, userId))
      .orderBy(desc(browserSequences.updatedAt));
    return sequences;
  }

  async createBrowserSequence(sequence: InsertBrowserSequence): Promise<BrowserSequence> {
    const now = new Date();
    const sequenceToInsert = {
      ...sequence,
      createdAt: now,
      updatedAt: now,
      lastExecutedAt: null,
      executionCount: 0,
      isActive: sequence.isActive !== undefined ? sequence.isActive : true,
    };

    const [newSequence] = await db
      .insert(browserSequences)
      .values(sequenceToInsert)
      .returning();
    return newSequence;
  }

  async updateBrowserSequence(
    id: number,
    updates: Partial<Omit<BrowserSequence, "id">>,
  ): Promise<BrowserSequence | undefined> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };

    const [updatedSequence] = await db
      .update(browserSequences)
      .set(updatesWithTimestamp)
      .where(eq(browserSequences.id, id))
      .returning();

    return updatedSequence;
  }

  async deleteBrowserSequence(id: number): Promise<boolean> {
    // First delete all steps associated with this sequence
    try {
      await db
        .delete(browserSequenceSteps)
        .where(eq(browserSequenceSteps.sequenceId, id));

      // Then delete the sequence itself
      const result = await db
        .delete(browserSequences)
        .where(eq(browserSequences.id, id));

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`Error deleting browser sequence ${id}:`, error);
      return false;
    }
  }

  // Browser Sequence Step operations
  async getBrowserSequenceStep(id: number): Promise<BrowserSequenceStep | undefined> {
    const [step] = await db
      .select()
      .from(browserSequenceSteps)
      .where(eq(browserSequenceSteps.id, id));
    return step;
  }

  async getBrowserSequenceStepsBySequenceId(sequenceId: number): Promise<BrowserSequenceStep[]> {
    const steps = await db
      .select()
      .from(browserSequenceSteps)
      .where(eq(browserSequenceSteps.sequenceId, sequenceId))
      .orderBy(asc(browserSequenceSteps.stepOrder));
    return steps;
  }

  async createBrowserSequenceStep(step: InsertBrowserSequenceStep): Promise<BrowserSequenceStep> {
    const [newStep] = await db
      .insert(browserSequenceSteps)
      .values({
        ...step,
        waitBeforeMs: step.waitBeforeMs || 0,
        waitAfterMs: step.waitAfterMs || 0,
        isConditional: step.isConditional || false,
      })
      .returning();
    return newStep;
  }

  async updateBrowserSequenceStep(
    id: number,
    updates: Partial<Omit<BrowserSequenceStep, "id">>,
  ): Promise<BrowserSequenceStep | undefined> {
    const [updatedStep] = await db
      .update(browserSequenceSteps)
      .set(updates)
      .where(eq(browserSequenceSteps.id, id))
      .returning();
    return updatedStep;
  }

  async deleteBrowserSequenceStep(id: number): Promise<boolean> {
    const result = await db
      .delete(browserSequenceSteps)
      .where(eq(browserSequenceSteps.id, id));
    return (result.rowCount ?? 0) > 0;
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
      let existingSettings = await this.getSiteSettings();

      // If no settings, create default then apply updates
      if (!existingSettings) {
        console.log("No existing settings found, creating defaults first");
        await this.createDefaultSiteSettings(); // Ensure this is awaited
        existingSettings = await this.getSiteSettings(); // Re-fetch after creation
        if (!existingSettings) {
          console.error("Failed to create or retrieve default settings.");
          throw new Error("Failed to initialize site settings.");
        }
      }

      // Prepare updates with version increment and updated timestamp
      const updatesWithMeta = {
        ...updates,
        version: (existingSettings.version || 0) + 1, // Ensure version is a number
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
