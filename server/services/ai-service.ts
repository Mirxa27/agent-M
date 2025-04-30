/**
 * AI Service - Handles interactions with various AI providers
 * This service provides real functional capabilities for the AI agents
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { Agent, AgentTool, Credential, Task, Message } from "@shared/schema";
import { db } from "../db";
import { IStorage } from "../storage";
import { eq } from "drizzle-orm";

// Initialize API clients based on environment variables
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple encryption/decryption for API keys
function decrypt(encryptedData: string, key: string): string {
  const [ivHex, encryptedHex] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(Buffer.from(encryptedHex, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Function to prepare the message for AI processing
function preparePrompt(agent: Agent, task: Task, messages: Message[]): string {
  const config = agent.config as any;
  const defaultPrompt = config.prompts?.default || "Complete the following task: {{input}}";
  
  // Format the prompt by replacing placeholders
  let prompt = defaultPrompt.replace("{{input}}", task.description || "");
  
  // Add task context from previous messages if available
  if (messages.length > 0) {
    const context = messages
      .filter(m => m.role !== "system")
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");
    
    prompt = `${prompt}\n\nPrevious conversation:\n${context}`;
  }
  
  // Add agent-specific capabilities information
  if (config.capabilities) {
    prompt += `\n\nI have the following capabilities: ${config.capabilities.join(", ")}`;
  }
  
  return prompt;
}

// Process tasks with the WebsiteBuilder agent
async function processWebsiteBuilderTask(
  agent: Agent, 
  task: Task, 
  messages: Message[],
  tools: AgentTool[],
  credentials: Credential[],
  storage: IStorage
): Promise<string> {
  // Extract configuration
  const config = agent.config as any;
  const prompt = preparePrompt(agent, task, messages);
  
  // Use OpenAI for code generation
  const openaiTool = tools.find(t => t.name === "OpenAI Chat" || t.name === "Code Generator");
  
  try {
    // Assuming we have credentials for OpenAI
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o", // Use the newest model
      messages: [
        { role: "system", content: "You are a professional website developer. Create responsive, accessible, and well-designed websites based on user requirements. Provide complete code that works out of the box." },
        { role: "user", content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    // Extract the response content
    const content = response.choices[0].message.content || "";
    
    // Log the interaction
    await storage.createMessage({
      taskId: task.id,
      role: "assistant",
      content: content,
    });
    
    // Update task status
    await storage.updateTask(task.id, {
      status: "completed",
      result: JSON.stringify({
        type: "website",
        content: content
      }),
    });
    
    return content;
  } catch (error) {
    console.error("Error processing Website Builder task:", error);
    await storage.createMessage({
      taskId: task.id,
      role: "assistant",
      content: `I encountered an error while processing your website request. Please try again or provide more details.`,
    });
    
    await storage.updateTask(task.id, {
      status: "failed",
      result: JSON.stringify({
        error: error.message
      }),
    });
    
    return `Error: ${error.message}`;
  }
}

// Process tasks with the PersonalSecretary agent
async function processPersonalSecretaryTask(
  agent: Agent, 
  task: Task, 
  messages: Message[],
  tools: AgentTool[],
  credentials: Credential[],
  storage: IStorage
): Promise<string> {
  // Extract configuration
  const config = agent.config as any;
  const prompt = preparePrompt(agent, task, messages);
  
  try {
    // Use Claude for personal assistant tasks
    const claudeTool = tools.find(t => t.name === "Anthropic Claude");
    
    const response = await anthropicClient.messages.create({
      model: "claude-3-7-sonnet-20250219", // The newest Anthropic model
      max_tokens: 4000,
      messages: [
        { role: "user", content: prompt }
      ],
      system: "You are a professional personal assistant. Help organize tasks, draft communications, manage schedules, and handle information in a professional and efficient manner. Be concise and provide practical advice."
    });

    // Extract the response content
    const content = response.content[0].text;
    
    // Log the interaction
    await storage.createMessage({
      taskId: task.id,
      role: "assistant",
      content: content,
    });
    
    // Update task status
    await storage.updateTask(task.id, {
      status: "completed",
      result: JSON.stringify({
        type: "secretary",
        content: content
      }),
    });
    
    return content;
  } catch (error) {
    console.error("Error processing Personal Secretary task:", error);
    await storage.createMessage({
      taskId: task.id,
      role: "assistant",
      content: `I encountered an error while processing your request. Please try again or provide more details.`,
    });
    
    await storage.updateTask(task.id, {
      status: "failed",
      result: JSON.stringify({
        error: error.message
      }),
    });
    
    return `Error: ${error.message}`;
  }
}

// Process tasks with the MultilingualContractWriter agent
async function processContractWriterTask(
  agent: Agent, 
  task: Task, 
  messages: Message[],
  tools: AgentTool[],
  credentials: Credential[],
  storage: IStorage
): Promise<string> {
  // Extract configuration
  const config = agent.config as any;
  const prompt = preparePrompt(agent, task, messages);
  
  try {
    // Use Claude for legal contract writing
    const anthropicTool = tools.find(t => t.name === "Anthropic Claude");
    
    // Extract language from the task description if available
    const languageMatch = task.description?.match(/in ([a-zA-Z]+)/i);
    const language = languageMatch ? languageMatch[1].toLowerCase() : "english";
    
    const templateEnabled = config.templateEnabled || false;
    let systemPrompt = "You are a professional legal contract writer with expertise in multiple languages and jurisdictions. ";
    
    if (templateEnabled) {
      systemPrompt += "Use standard legal templates and clauses where appropriate. ";
    }
    
    systemPrompt += `Create contracts that are legally sound, clear, and comprehensive. Provide the contract in ${language} unless otherwise specified.`;
    
    const response = await anthropicClient.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      messages: [
        { role: "user", content: prompt }
      ],
      system: systemPrompt
    });

    // Extract the response content
    const content = response.content[0].text;
    
    // Log the interaction
    await storage.createMessage({
      taskId: task.id,
      role: "assistant",
      content: content,
    });
    
    // Update task status
    await storage.updateTask(task.id, {
      status: "completed",
      result: JSON.stringify({
        type: "contract",
        language: language,
        content: content
      }),
    });
    
    return content;
  } catch (error) {
    console.error("Error processing Contract Writer task:", error);
    await storage.createMessage({
      taskId: task.id,
      role: "assistant",
      content: `I encountered an error while drafting your contract. Please try again or provide more specific details.`,
    });
    
    await storage.updateTask(task.id, {
      status: "failed",
      result: JSON.stringify({
        error: error.message
      }),
    });
    
    return `Error: ${error.message}`;
  }
}

// Process tasks with the ContentCreator agent
async function processContentCreatorTask(
  agent: Agent, 
  task: Task, 
  messages: Message[],
  tools: AgentTool[],
  credentials: Credential[],
  storage: IStorage
): Promise<string> {
  // Extract configuration
  const config = agent.config as any;
  const prompt = preparePrompt(agent, task, messages);
  
  try {
    // Use OpenAI for content creation
    const openaiTool = tools.find(t => t.name === "OpenAI Chat");
    
    // Extract content type from task description or default to blog post
    const contentTypes = config.contentTypes || ["blog post"];
    let contentType = "blog post";
    
    for (const type of contentTypes) {
      if (task.description?.toLowerCase().includes(type.toLowerCase())) {
        contentType = type;
        break;
      }
    }
    
    // Check for tone specification
    const tones = config.toneOptions || ["professional"];
    let tone = "professional";
    
    for (const t of tones) {
      if (task.description?.toLowerCase().includes(t.toLowerCase())) {
        tone = t;
        break;
      }
    }
    
    const systemPrompt = `You are a creative content creator specializing in ${contentType} creation. 
Write in a ${tone} tone and aim to engage the target audience effectively. 
Create content that is original, well-structured, and optimized for ${config.seoOptimization ? "SEO" : "readability"}.`;
    
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    // Extract the response content
    const content = response.choices[0].message.content || "";
    
    // Log the interaction
    await storage.createMessage({
      taskId: task.id,
      role: "assistant",
      content: content,
    });
    
    // Update task status
    await storage.updateTask(task.id, {
      status: "completed",
      result: JSON.stringify({
        type: "content",
        contentType: contentType,
        tone: tone,
        content: content
      }),
    });
    
    return content;
  } catch (error) {
    console.error("Error processing Content Creator task:", error);
    await storage.createMessage({
      taskId: task.id,
      role: "assistant",
      content: `I encountered an error while creating your content. Please try again or provide more specific guidelines.`,
    });
    
    await storage.updateTask(task.id, {
      status: "failed",
      result: JSON.stringify({
        error: error.message
      }),
    });
    
    return `Error: ${error.message}`;
  }
}

// Process tasks with the DataAnalyst agent
async function processDataAnalystTask(
  agent: Agent, 
  task: Task, 
  messages: Message[],
  tools: AgentTool[],
  credentials: Credential[],
  storage: IStorage
): Promise<string> {
  // Extract configuration
  const config = agent.config as any;
  const prompt = preparePrompt(agent, task, messages);
  
  try {
    // Use OpenAI for data analysis
    const openaiTool = tools.find(t => t.name === "OpenAI Chat" || t.name === "Data Analyzer");
    
    // Determine the analysis type from the task description
    const analysisTypes = config.analysisTypes || ["descriptive"];
    let analysisType = "descriptive";
    
    for (const type of analysisTypes) {
      if (task.description?.toLowerCase().includes(type.toLowerCase())) {
        analysisType = type;
        break;
      }
    }
    
    // Determine if visualization is needed
    const needsVisualization = task.description?.toLowerCase().includes("visual") || 
                              task.description?.toLowerCase().includes("chart") ||
                              task.description?.toLowerCase().includes("graph");
    
    let systemPrompt = `You are a data analyst specializing in ${analysisType} analysis. `;
    
    if (needsVisualization) {
      systemPrompt += "Include recommendations for appropriate data visualizations. For each visualization, describe what it should show and how it should be structured. ";
    }
    
    systemPrompt += "Provide clear, actionable insights based on the data described. If statistical methods are needed, explain them briefly.";
    
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.2,
    });

    // Extract the response content
    const content = response.choices[0].message.content || "";
    
    // Log the interaction
    await storage.createMessage({
      taskId: task.id,
      role: "assistant",
      content: content,
    });
    
    // Update task status
    await storage.updateTask(task.id, {
      status: "completed",
      result: JSON.stringify({
        type: "analysis",
        analysisType: analysisType,
        visualization: needsVisualization,
        content: content
      }),
    });
    
    return content;
  } catch (error) {
    console.error("Error processing Data Analyst task:", error);
    await storage.createMessage({
      taskId: task.id,
      role: "assistant",
      content: `I encountered an error while analyzing your data. Please try again with more specific data or requirements.`,
    });
    
    await storage.updateTask(task.id, {
      status: "failed",
      result: JSON.stringify({
        error: error.message
      }),
    });
    
    return `Error: ${error.message}`;
  }
}

// Main function to process a task with the appropriate agent
export async function processAgentTask(taskId: number, storage: IStorage): Promise<string> {
  try {
    // Get task information
    const task = await storage.getTask(taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Get agent information
    const agent = await storage.getAgent(task.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }
    
    // Update task status to running
    await storage.updateTask(taskId, { status: "running" });
    
    // Get messages for this task
    const messages = await storage.getMessagesByTaskId(taskId);
    
    // Get tools for this agent
    const agentToolIds = agent.tools as number[] || [];
    const tools: AgentTool[] = [];
    
    for (const toolId of agentToolIds) {
      const tool = await storage.getAgentTool(toolId);
      if (tool) {
        tools.push(tool);
      }
    }
    
    // Get credentials for this agent's user
    const userCredentials = await storage.getCredentialsByUserId(agent.userId);
    
    // Process task according to agent type
    let result: string;
    
    switch (agent.name) {
      case "Website Builder":
        result = await processWebsiteBuilderTask(agent, task, messages, tools, userCredentials, storage);
        break;
      case "Personal Secretary":
        result = await processPersonalSecretaryTask(agent, task, messages, tools, userCredentials, storage);
        break;
      case "Multilingual Contract Writer":
        result = await processContractWriterTask(agent, task, messages, tools, userCredentials, storage);
        break;
      case "Content Creator":
        result = await processContentCreatorTask(agent, task, messages, tools, userCredentials, storage);
        break;
      case "Data Analyst":
        result = await processDataAnalystTask(agent, task, messages, tools, userCredentials, storage);
        break;
      default:
        // Generic processing for unknown agent types
        result = await processGenericTask(agent, task, messages, tools, userCredentials, storage);
    }
    
    return result;
  } catch (error) {
    console.error("Error processing agent task:", error);
    throw error;
  }
}

// Generic task processing for any agent type
async function processGenericTask(
  agent: Agent, 
  task: Task, 
  messages: Message[],
  tools: AgentTool[],
  credentials: Credential[],
  storage: IStorage
): Promise<string> {
  // Extract configuration
  const prompt = preparePrompt(agent, task, messages);
  
  try {
    // Default to OpenAI if available
    const openaiTool = tools.find(t => t.name === "OpenAI Chat");
    
    if (openaiTool) {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: `You are an AI agent assisting with ${agent.name} tasks.` },
          { role: "user", content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || "";
      
      // Log the interaction
      await storage.createMessage({
        taskId: task.id,
        role: "assistant",
        content: content,
      });
      
      // Update task status
      await storage.updateTask(task.id, {
        status: "completed",
        result: JSON.stringify({
          type: "generic",
          content: content
        }),
      });
      
      return content;
    } else {
      throw new Error("No compatible tools available for this agent");
    }
  } catch (error) {
    console.error("Error processing Generic task:", error);
    await storage.createMessage({
      taskId: task.id,
      role: "assistant",
      content: `I encountered an error while processing your request. Please try again or provide more details.`,
    });
    
    await storage.updateTask(task.id, {
      status: "failed",
      result: JSON.stringify({
        error: error.message
      }),
    });
    
    return `Error: ${error.message}`;
  }
}