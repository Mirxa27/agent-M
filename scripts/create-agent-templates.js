/**
 * Script to create AI agent templates
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

// Agent templates to add
const templates = [
  {
    name: "Website Builder",
    description: "Create and design websites from descriptions or mockups",
    type: "specialized",
    icon: "Layout",
    isActive: true,
    config: {
      defaultLanding: true,
      responseFormat: "html",
      capabilities: ["responsive", "seo-friendly", "accessible"],
      designStyle: "modern",
      tools: [3, 4, 6] // IDs for OpenAI Chat, Anthropic Claude, Grok tools
    },
    userId: 2 // Admin user
  },
  {
    name: "Personal Secretary",
    description: "Manage schedules, emails, and organize tasks",
    type: "assistant",
    icon: "CalendarDays",
    isActive: true,
    config: {
      notificationEnabled: true,
      prioritizationEnabled: true,
      summarizationEnabled: true,
      reminderFormat: "email",
      autoRespond: true,
      tools: [3, 4] // IDs for OpenAI Chat, Anthropic Claude
    },
    userId: 2 // Admin user
  },
  {
    name: "Multilingual Contract Writer",
    description: "Draft and review legal contracts in multiple languages",
    type: "legal",
    icon: "FileText",
    isActive: true,
    config: {
      languages: ["english", "arabic", "french", "spanish", "chinese"],
      legalJurisdictions: ["international", "saudi", "uae", "us", "eu"],
      templateEnabled: true,
      reviewEnabled: true,
      tools: [3, 4, 5] // IDs for OpenAI Chat, Anthropic Claude, Perplexity
    },
    userId: 2 // Admin user
  },
  {
    name: "Content Creator",
    description: "Generate marketing content, blog posts, and social media updates",
    type: "creative",
    icon: "Pencil",
    isActive: true,
    config: {
      contentTypes: ["blog", "social", "email", "ad"],
      toneOptions: ["professional", "casual", "persuasive", "informative"],
      mediaGeneration: true,
      seoOptimization: true,
      audienceTargeting: true,
      tools: [3, 6, 7] // IDs for OpenAI Chat, Grok, and Code Generator
    },
    userId: 2 // Admin user
  },
  {
    name: "Data Analyst",
    description: "Analyze data, generate insights, and create visualizations",
    type: "analytical",
    icon: "BarChart",
    isActive: true,
    config: {
      dataFormats: ["csv", "json", "excel", "sql"],
      visualizationTypes: ["bar", "line", "scatter", "pie", "heatmap"],
      statisticalAnalysis: true,
      predictiveModeling: true,
      reportGeneration: true,
      tools: [3, 5, 7] // IDs for OpenAI Chat, Perplexity, and Code Generator
    },
    userId: 2 // Admin user
  }
];

async function createAgentTemplates() {
  console.log('Creating agent templates...');

  try {
    // Check if the agents table exists
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'agents'
      );`
    );

    if (!tableCheck.rows[0].exists) {
      console.error('The agents table does not exist.');
      return;
    }

    // Current timestamp
    const now = new Date();

    for (const template of templates) {
      // Check if template with same name already exists
      const existingAgent = await pool.query(
        'SELECT id FROM agents WHERE name = $1 AND user_id = $2',
        [template.name, template.userId]
      );

      if (existingAgent.rows.length > 0) {
        console.log(`Agent template "${template.name}" already exists, skipping.`);
        continue;
      }

      // Insert the new agent template
      const result = await pool.query(
        `INSERT INTO agents (
          user_id, name, description, type, icon, is_active, task_count, config, tools, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [
          template.userId,
          template.name,
          template.description,
          template.type,
          template.icon,
          template.isActive,
          0, // Initial task count
          JSON.stringify(template.config),
          JSON.stringify(template.config.tools || []),
          now,
          now
        ]
      );

      console.log(`Created agent template "${template.name}" with ID ${result.rows[0].id}`);
    }

    console.log('All agent templates created successfully.');
  } catch (error) {
    console.error('Error creating agent templates:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
createAgentTemplates();