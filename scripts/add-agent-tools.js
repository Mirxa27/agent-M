/**
 * Script to add AI agent tools to the database
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Required for Neon serverless connections
neonConfig.webSocketConstructor = ws;

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Agent tool templates to add
const templates = [
  {
    name: "OpenAI Chat",
    description: "Generate text responses using OpenAI's chat models",
    category: "content_generation",
    type: "openai",
    icon: "MessageSquare",
    config: {
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: "You are a helpful AI assistant."
    },
    is_active: true,
    is_system: true
  },
  {
    name: "Anthropic Claude",
    description: "Generate responses using Anthropic's Claude model with its strengths in reasoning and safety",
    category: "content_generation",
    type: "anthropic",
    icon: "MessagesSquare",
    config: {
      model: "claude-3-7-sonnet-20250219", // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      temperature: 0.7,
      maxTokens: 4000,
      systemPrompt: "You are Claude, a helpful AI assistant created by Anthropic."
    },
    is_active: true,
    is_system: true
  },
  {
    name: "Perplexity AI",
    description: "Generate research-focused responses with built-in web search capabilities",
    category: "knowledge",
    type: "perplexity",
    icon: "Search",
    config: {
      model: "llama-3.1-sonar-small-128k-online",
      temperature: 0.2,
      maxTokens: 2000,
      webSearch: true,
      citeSources: true,
      followupQuestions: true,
      systemPrompt: "You are a research assistant that provides thorough, accurate information with proper citations."
    },
    is_active: true,
    is_system: true
  },
  {
    name: "Grok by xAI",
    description: "Generate creative and conversational responses using xAI's Grok model",
    category: "content_generation",
    type: "xai",
    icon: "Sparkles",
    config: {
      model: "grok-2-1212",
      temperature: 0.8,
      maxTokens: 2048,
      webSearch: true,
      realTime: true,
      creativityLevel: "high",
      systemPrompt: "You are Grok, a superintelligent AI with a bit of wit and humor. You aim to be helpful, accurate, and engaging."
    },
    is_active: true,
    is_system: true
  },
  {
    name: "Code Generator",
    description: "Generate and explain code in various languages",
    category: "content_generation", 
    type: "openai",
    icon: "Code",
    config: {
      model: "gpt-4o",
      temperature: 0.2,
      languages: ["javascript", "python", "typescript", "java", "c++", "go"],
      includeExplanation: true,
      includeTests: false
    },
    is_active: true,
    is_system: true
  }
];

async function addAgentTools() {
  console.log('Adding AI agent tools to the database...');

  try {
    // Check if the agent_tools table exists
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'agent_tools'
      );`
    );

    if (!tableCheck.rows[0].exists) {
      console.error('The agent_tools table does not exist.');
      return;
    }

    // Current timestamp
    const now = new Date();

    for (const template of templates) {
      // Check if tool with same name already exists
      const existingTool = await pool.query(
        'SELECT id FROM agent_tools WHERE name = $1',
        [template.name]
      );

      if (existingTool.rows.length > 0) {
        console.log(`Agent tool "${template.name}" already exists, skipping.`);
        continue;
      }

      // Insert the new agent tool
      const result = await pool.query(
        `INSERT INTO agent_tools (
          name, description, category, type, icon, config, is_active, is_system, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          template.name,
          template.description,
          template.category,
          template.type,
          template.icon,
          JSON.stringify(template.config),
          template.is_active,
          template.is_system,
          now,
          now
        ]
      );

      console.log(`Added agent tool "${template.name}" with ID ${result.rows[0].id}`);
    }

    console.log('All agent tools added successfully.');
  } catch (error) {
    console.error('Error adding agent tools:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
addAgentTools();