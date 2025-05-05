/**
 * Script to add AI agent tools to the database
 */

import { db } from '../server/db.js';
import { agentTools } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function addAgentTools() {
  console.log('Adding agent tools to the database...');

  // Check if tools already exist (by name)
  const existingTools = await db.select().from(agentTools);
  const existingToolNames = existingTools.map(tool => tool.name);

  console.log('Existing tools:', existingToolNames);

  // Define tools
  const tools = [
    {
      name: "OpenAI Chat",
      description: "Connect with OpenAI's GPT models for natural language tasks",
      category: "ai",
      icon: "sparkles",
      isActive: true,
      isSystem: true,
      config: {
        provider: "openai",
        models: ["gpt-4o", "gpt-4-turbo", "gpt-4o-mini"],
        capabilities: ["text generation", "instruction following", "creative writing", "summarization", "code generation"]
      }
    },
    {
      name: "Anthropic Claude",
      description: "Use Anthropic's Claude models for nuanced and safe outputs",
      category: "ai",
      icon: "brain",
      isActive: true,
      isSystem: true,
      config: {
        provider: "anthropic",
        models: ["claude-3-7-sonnet-20250219", "claude-3-5-sonnet", "claude-3-haiku"],
        capabilities: ["text generation", "instruction following", "creative writing", "document analysis", "nuanced reasoning"]
      }
    },
    {
      name: "Perplexity AI",
      description: "Leverage Perplexity for real-time research and information gathering",
      category: "research",
      icon: "search",
      isActive: true,
      isSystem: true,
      config: {
        provider: "perplexity",
        models: ["llama-3.1-sonar-small-128k-online", "llama-3.1-sonar-large-128k-online"],
        capabilities: ["online search", "fact verification", "current information", "research synthesis", "citation"]
      }
    },
    {
      name: "Grok by xAI",
      description: "Utilize Grok for analytical and technical tasks",
      category: "ai",
      icon: "zap",
      isActive: true,
      isSystem: true,
      config: {
        provider: "xai",
        models: ["grok-2-1212", "grok-2-vision-1212"],
        capabilities: ["analytical reasoning", "technical explanations", "real-time data analysis", "image understanding"]
      }
    },
    {
      name: "Code Generator",
      description: "Generate code in various programming languages",
      category: "code",
      icon: "code",
      isActive: true,
      isSystem: true,
      config: {
        provider: "openai",
        models: ["gpt-4o"],
        capabilities: ["code generation", "debugging", "optimization", "documentation"]
      }
    },
    {
      name: "Data Analyzer",
      description: "Analyze datasets and provide insights",
      category: "data",
      icon: "barChart",
      isActive: true, 
      isSystem: true,
      config: {
        provider: "openai",
        supportedProviders: ["openai", "xai", "perplexity"],
        models: ["gpt-4o", "grok-2-1212"],
        capabilities: ["data analysis", "visualization recommendations", "statistical inference", "trend identification"]
      }
    },
    {
      name: "Content Optimizer",
      description: "Improve and optimize existing content",
      category: "content",
      icon: "fileText",
      isActive: true,
      isSystem: true,
      config: {
        provider: "openai",
        supportedProviders: ["openai", "anthropic"],
        models: ["gpt-4o", "claude-3-7-sonnet-20250219"],
        capabilities: ["content improvement", "tone adjustment", "SEO optimization", "readability enhancement"]
      }
    }
  ];

  // Insert tools that don't already exist
  for (const tool of tools) {
    if (!existingToolNames.includes(tool.name)) {
      try {
        const [insertedTool] = await db.insert(agentTools).values(tool).returning();
        console.log(`Added tool: ${tool.name}`);
      } catch (error) {
        console.error(`Error adding tool ${tool.name}:`, error);
      }
    } else {
      // Update existing tool
      const existingTool = existingTools.find(t => t.name === tool.name);
      try {
        const [updatedTool] = await db
          .update(agentTools)
          .set({
            description: tool.description,
            category: tool.category,
            icon: tool.icon,
            isActive: tool.isActive,
            isSystem: tool.isSystem,
            config: tool.config
          })
          .where(eq(agentTools.id, existingTool.id))
          .returning();
        console.log(`Updated tool: ${tool.name}`);
      } catch (error) {
        console.error(`Error updating tool ${tool.name}:`, error);
      }
    }
  }

  console.log('All tools have been added or updated.');
}

// Run the script
addAgentTools()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

export { addAgentTools };