import {
  users, User, InsertUser,
  agents, Agent, InsertAgent,
  credentials, Credential, InsertCredential,
  files, File, InsertFile,
  tasks, Task, InsertTask,
  messages, Message, InsertMessage,
  aiProviders, AiProvider, InsertAiProvider,
  plans, Plan, InsertPlan
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined>;
  
  // Agent operations
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentsByUserId(userId: number): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<Omit<Agent, 'id'>>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;
  
  // Credential operations
  getCredential(id: number): Promise<Credential | undefined>;
  getCredentialsByUserId(userId: number): Promise<Credential[]>;
  getCredentialsByAgentId(agentId: number): Promise<Credential[]>;
  createCredential(credential: InsertCredential): Promise<Credential>;
  updateCredential(id: number, updates: Partial<Omit<Credential, 'id'>>): Promise<Credential | undefined>;
  deleteCredential(id: number): Promise<boolean>;
  
  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByUserId(userId: number): Promise<File[]>;
  getTemplatesByUserId(userId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<Omit<File, 'id'>>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByUserId(userId: number, limit?: number): Promise<Task[]>;
  getTasksByAgentId(agentId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<Omit<Task, 'id'>>): Promise<Task | undefined>;
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
  updateAiProvider(id: number, updates: Partial<Omit<AiProvider, 'id'>>): Promise<AiProvider | undefined>;
  deleteAiProvider(id: number): Promise<boolean>;
  
  // Plan operations (admin only)
  getPlan(id: number): Promise<Plan | undefined>;
  getPlanByName(name: string): Promise<Plan | undefined>;
  getAllPlans(): Promise<Plan[]>;
  getActivePlans(): Promise<Plan[]>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, updates: Partial<Omit<Plan, 'id'>>): Promise<Plan | undefined>;
  deletePlan(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agents: Map<number, Agent>;
  private credentials: Map<number, Credential>;
  private files: Map<number, File>;
  private tasks: Map<number, Task>;
  private messages: Map<number, Message>;
  private aiProviders: Map<number, AiProvider>;
  private plans: Map<number, Plan>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private agentIdCounter: number;
  private credentialIdCounter: number;
  private fileIdCounter: number;
  private taskIdCounter: number;
  private messageIdCounter: number;
  private aiProviderIdCounter: number;
  private planIdCounter: number;

  constructor() {
    this.users = new Map();
    this.agents = new Map();
    this.credentials = new Map();
    this.files = new Map();
    this.tasks = new Map();
    this.messages = new Map();
    this.aiProviders = new Map();
    this.plans = new Map();
    
    this.userIdCounter = 1;
    this.agentIdCounter = 1;
    this.credentialIdCounter = 1;
    this.fileIdCounter = 1;
    this.taskIdCounter = 1;
    this.messageIdCounter = 1;
    this.aiProviderIdCounter = 1;
    this.planIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with some default plans
    this.initializePlans();
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
          taskLimit: 50
        },
        isActive: true
      },
      {
        name: "Basic",
        price: 49,
        interval: "monthly",
        features: {
          agentLimit: 5,
          storageLimit: 2000, // MB
          credentialLimit: 10,
          taskLimit: 500
        },
        isActive: true
      },
      {
        name: "Professional",
        price: 149,
        interval: "monthly",
        features: {
          agentLimit: 20,
          storageLimit: 5000, // MB
          credentialLimit: 50,
          taskLimit: 5000
        },
        isActive: true
      },
      {
        name: "Enterprise",
        price: 499,
        interval: "monthly",
        features: {
          agentLimit: 100,
          storageLimit: 20000, // MB
          credentialLimit: 200,
          taskLimit: 50000
        },
        isActive: true
      }
    ];
    
    plans.forEach(plan => this.createPlan(plan));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = {
      id,
      ...insertUser,
      plan: "free",
      planExpiresAt: null,
      role: "user"
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Agent operations
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }
  
  async getAgentsByUserId(userId: number): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.userId === userId
    );
  }
  
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.agentIdCounter++;
    const now = new Date();
    const newAgent: Agent = {
      id,
      ...agent,
      taskCount: 0,
      createdAt: now
    };
    this.agents.set(id, newAgent);
    return newAgent;
  }
  
  async updateAgent(id: number, updates: Partial<Omit<Agent, 'id'>>): Promise<Agent | undefined> {
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
      (credential) => credential.userId === userId
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
      updatedAt: now
    };
    this.credentials.set(id, newCredential);
    return newCredential;
  }
  
  async updateCredential(id: number, updates: Partial<Omit<Credential, 'id'>>): Promise<Credential | undefined> {
    const credential = await this.getCredential(id);
    if (!credential) return undefined;
    
    const updatedCredential = {
      ...credential,
      ...updates,
      updatedAt: new Date()
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
  
  async getFilesByUserId(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId
    );
  }
  
  async getTemplatesByUserId(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId && file.isTemplate
    );
  }
  
  async createFile(file: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const newFile: File = {
      id,
      ...file,
      createdAt: now,
      updatedAt: now
    };
    this.files.set(id, newFile);
    return newFile;
  }
  
  async updateFile(id: number, updates: Partial<Omit<File, 'id'>>): Promise<File | undefined> {
    const file = await this.getFile(id);
    if (!file) return undefined;
    
    const updatedFile = {
      ...file,
      ...updates,
      updatedAt: new Date()
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
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
      completedAt: null
    };
    this.tasks.set(id, newTask);
    
    // Update agent task count
    const agent = await this.getAgent(task.agentId);
    if (agent) {
      await this.updateAgent(agent.id, { taskCount: agent.taskCount + 1 });
    }
    
    return newTask;
  }
  
  async updateTask(id: number, updates: Partial<Omit<Task, 'id'>>): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    // If status is changing to completed, set completedAt
    const updatedTask: Task = {
      ...task,
      ...updates
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
      .filter(message => message.taskId === id)
      .map(message => message.id);
    
    messagesToDelete.forEach(messageId => this.messages.delete(messageId));
    
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
      createdAt: now
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
    return Array.from(this.aiProviders.values())
      .filter(provider => provider.isActive);
  }
  
  async createAiProvider(provider: InsertAiProvider): Promise<AiProvider> {
    const id = this.aiProviderIdCounter++;
    const now = new Date();
    const newProvider: AiProvider = {
      id,
      ...provider,
      createdAt: now
    };
    this.aiProviders.set(id, newProvider);
    return newProvider;
  }
  
  async updateAiProvider(id: number, updates: Partial<Omit<AiProvider, 'id'>>): Promise<AiProvider | undefined> {
    const provider = await this.getAiProvider(id);
    if (!provider) return undefined;
    
    const updatedProvider = { ...provider, ...updates };
    this.aiProviders.set(id, updatedProvider);
    return updatedProvider;
  }
  
  async deleteAiProvider(id: number): Promise<boolean> {
    return this.aiProviders.delete(id);
  }

  // Plan operations
  async getPlan(id: number): Promise<Plan | undefined> {
    return this.plans.get(id);
  }
  
  async getPlanByName(name: string): Promise<Plan | undefined> {
    return Array.from(this.plans.values()).find(
      (plan) => plan.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  async getAllPlans(): Promise<Plan[]> {
    return Array.from(this.plans.values());
  }
  
  async getActivePlans(): Promise<Plan[]> {
    return Array.from(this.plans.values())
      .filter(plan => plan.isActive);
  }
  
  async createPlan(plan: InsertPlan): Promise<Plan> {
    const id = this.planIdCounter++;
    const newPlan: Plan = {
      id,
      ...plan
    };
    this.plans.set(id, newPlan);
    return newPlan;
  }
  
  async updatePlan(id: number, updates: Partial<Omit<Plan, 'id'>>): Promise<Plan | undefined> {
    const plan = await this.getPlan(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...updates };
    this.plans.set(id, updatedPlan);
    return updatedPlan;
  }
  
  async deletePlan(id: number): Promise<boolean> {
    return this.plans.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
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
            taskLimit: 50
          },
          isActive: true
        },
        {
          name: "Basic",
          price: 49,
          interval: "monthly",
          features: {
            agentLimit: 5,
            storageLimit: 2000, // MB
            credentialLimit: 10,
            taskLimit: 500
          },
          isActive: true
        },
        {
          name: "Professional",
          price: 149,
          interval: "monthly",
          features: {
            agentLimit: 20,
            storageLimit: 5000, // MB
            credentialLimit: 50,
            taskLimit: 5000
          },
          isActive: true
        },
        {
          name: "Enterprise",
          price: 499,
          interval: "monthly",
          features: {
            agentLimit: 100,
            storageLimit: 20000, // MB
            credentialLimit: 200,
            taskLimit: 50000
          },
          isActive: true
        }
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const [user] = await db.insert(users).values({
      ...insertUser,
      plan: "free",
      planExpiresAt: null,
      role: "user"
    }).returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
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
    const [newAgent] = await db.insert(agents).values({
      ...agent,
      taskCount: 0,
      createdAt: now
    }).returning();
    return newAgent;
  }
  
  async updateAgent(id: number, updates: Partial<Omit<Agent, 'id'>>): Promise<Agent | undefined> {
    const [updatedAgent] = await db.update(agents)
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
    const [credential] = await db.select().from(credentials).where(eq(credentials.id, id));
    return credential;
  }
  
  async getCredentialsByUserId(userId: number): Promise<Credential[]> {
    return await db.select().from(credentials).where(eq(credentials.userId, userId));
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
    const [newCredential] = await db.insert(credentials).values({
      ...credential,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newCredential;
  }
  
  async updateCredential(id: number, updates: Partial<Omit<Credential, 'id'>>): Promise<Credential | undefined> {
    const now = new Date();
    const [updatedCredential] = await db.update(credentials)
      .set({
        ...updates,
        updatedAt: now
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
    return await db.select().from(files)
      .where(and(
        eq(files.userId, userId),
        eq(files.isTemplate, true)
      ));
  }
  
  async createFile(file: InsertFile): Promise<File> {
    const now = new Date();
    const [newFile] = await db.insert(files).values({
      ...file,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newFile;
  }
  
  async updateFile(id: number, updates: Partial<Omit<File, 'id'>>): Promise<File | undefined> {
    const now = new Date();
    const [updatedFile] = await db.update(files)
      .set({
        ...updates,
        updatedAt: now
      })
      .where(eq(files.id, id))
      .returning();
    return updatedFile;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return result.rowCount > 0;
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async getTasksByUserId(userId: number, limit?: number): Promise<Task[]> {
    let query = db.select().from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async getTasksByAgentId(agentId: number): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.agentId, agentId))
      .orderBy(desc(tasks.createdAt));
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const now = new Date();
    const [newTask] = await db.insert(tasks).values({
      ...task,
      status: "pending",
      result: null,
      createdAt: now,
      completedAt: null
    }).returning();
    
    // Update agent task count
    const agent = await this.getAgent(task.agentId);
    if (agent) {
      await this.updateAgent(agent.id, { taskCount: agent.taskCount + 1 });
    }
    
    return newTask;
  }
  
  async updateTask(id: number, updates: Partial<Omit<Task, 'id'>>): Promise<Task | undefined> {
    // If status is changing to completed, set completedAt
    let updatesWithTimestamp = { ...updates };
    
    if (updates.status === "completed") {
      const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
      if (task && !task.completedAt) {
        updatesWithTimestamp.completedAt = new Date();
      }
    }
    
    const [updatedTask] = await db.update(tasks)
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
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }
  
  async getMessagesByTaskId(taskId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.taskId, taskId))
      .orderBy(asc(messages.createdAt));
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const now = new Date();
    const [newMessage] = await db.insert(messages).values({
      ...message,
      createdAt: now
    }).returning();
    return newMessage;
  }

  // AI Provider operations
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
    const [newProvider] = await db.insert(aiProviders).values({
      ...provider,
      createdAt: now
    }).returning();
    return newProvider;
  }
  
  async updateAiProvider(id: number, updates: Partial<Omit<AiProvider, 'id'>>): Promise<AiProvider | undefined> {
    const [updatedProvider] = await db.update(aiProviders)
      .set(updates)
      .where(eq(aiProviders.id, id))
      .returning();
    return updatedProvider;
  }
  
  async deleteAiProvider(id: number): Promise<boolean> {
    const result = await db.delete(aiProviders).where(eq(aiProviders.id, id));
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
  
  async updatePlan(id: number, updates: Partial<Omit<Plan, 'id'>>): Promise<Plan | undefined> {
    const [updatedPlan] = await db.update(plans)
      .set(updates)
      .where(eq(plans.id, id))
      .returning();
    return updatedPlan;
  }
  
  async deletePlan(id: number): Promise<boolean> {
    const result = await db.delete(plans).where(eq(plans.id, id));
    return result.rowCount > 0;
  }
}

// Use database storage
export const storage = new DatabaseStorage();
