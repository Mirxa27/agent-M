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

// Agent tools to add
const agentTools = [
  {
    name: "OpenAI Chat",
    description: "Uses OpenAI's GPT-4o model for advanced text generation and responses",
    type: "ai_chat",
    category: "language",
    icon: "message-square",
    config: {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      capabilities: ["text", "image_analysis", "code_generation"]
    },
    isActive: true
  },
  {
    name: "Anthropic Claude",
    description: "Leverages Anthropic's Claude model for nuanced AI conversations and content creation",
    type: "ai_chat",
    category: "language",
    icon: "message-circle",
    config: {
      provider: "anthropic",
      model: "claude-3-7-sonnet-20250219",
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      capabilities: ["text", "image_analysis", "reasoning"]
    },
    isActive: true
  },
  {
    name: "Perplexity AI",
    description: "Research-focused AI with real-time web access for accurate information",
    type: "ai_chat",
    category: "research",
    icon: "search",
    config: {
      provider: "perplexity",
      model: "llama-3.1-sonar-small-128k-online",
      temperature: 0.2,
      max_tokens: 2048,
      search_enabled: true,
      capabilities: ["text", "web_search", "information_retrieval"]
    },
    isActive: true
  },
  {
    name: "Grok by xAI",
    description: "xAI's conversational AI model with creative and informative responses",
    type: "ai_chat",
    category: "language",
    icon: "zap",
    config: {
      provider: "xai",
      model: "grok-2-1212",
      temperature: 0.8,
      max_tokens: 2048,
      top_p: 0.9,
      capabilities: ["text", "code_generation", "creative_content"]
    },
    isActive: true
  },
  {
    name: "Code Generator",
    description: "Specialized tool for generating development code across multiple languages",
    type: "code_generator",
    category: "development",
    icon: "code",
    config: {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 4096,
      languages: ["javascript", "python", "html", "css", "sql", "typescript", "bash"],
      capabilities: ["code_generation", "code_explanation", "debugging"]
    },
    isActive: true
  },
  {
    name: "Data Analyzer",
    description: "Tool for analyzing datasets and generating insights",
    type: "data_analysis",
    category: "analysis",
    icon: "bar-chart-2",
    config: {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4096,
      data_formats: ["csv", "json", "excel"],
      capabilities: ["statistical_analysis", "data_visualization", "trend_analysis"]
    },
    isActive: true
  },
  {
    name: "Content Optimizer",
    description: "Tool for optimizing content for SEO and readability",
    type: "content_optimizer",
    category: "marketing",
    icon: "edit",
    config: {
      provider: "anthropic",
      model: "claude-3-7-sonnet-20250219",
      temperature: 0.6,
      max_tokens: 2048,
      optimization_types: ["seo", "readability", "tone", "engagement"],
      capabilities: ["keyword_analysis", "content_refinement", "headline_optimization"]
    },
    isActive: true
  }
];

async function addAgentTools() {
  console.log('Adding agent tools to database...');

  try {
    // Current timestamp
    const now = new Date();

    for (const tool of agentTools) {
      // Check if tool already exists
      const existingTool = await pool.query(
        'SELECT id FROM agent_tools WHERE name = $1',
        [tool.name]
      );

      if (existingTool.rows.length > 0) {
        const toolId = existingTool.rows[0].id;
        console.log(`Tool "${tool.name}" already exists (ID: ${toolId}), updating...`);

        // Update existing tool
        await pool.query(
          `UPDATE agent_tools 
           SET description = $1, type = $2, category = $3, icon = $4, config = $5, is_active = $6, updated_at = $7
           WHERE id = $8`,
          [
            tool.description,
            tool.type,
            tool.category,
            tool.icon,
            JSON.stringify(tool.config),
            tool.isActive,
            now,
            toolId
          ]
        );
      } else {
        // Insert new tool
        const result = await pool.query(
          `INSERT INTO agent_tools (
            name, description, type, category, icon, config, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [
            tool.name,
            tool.description,
            tool.type,
            tool.category,
            tool.icon,
            JSON.stringify(tool.config),
            tool.isActive,
            now,
            now
          ]
        );

        console.log(`Added tool "${tool.name}" with ID ${result.rows[0].id}`);
      }
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