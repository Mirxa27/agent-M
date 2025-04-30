// Direct database migration script to register agent tools and provider credentials

import { db } from '../server/db.js';
import { agentTools, agents, aiProviders, aiModels, tasks } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function registerTools() {
  try {
    console.log('Registering AI agent tools...');
    
    // Define the tools
    const tools = [
      {
        name: "OpenAI Chat",
        description: "Connect with OpenAI's GPT models for natural language tasks",
        category: "ai",
        icon: "sparkles",
        isActive: true,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {
          provider: "openai",
          supportedProviders: ["openai", "anthropic"],
          models: ["gpt-4o", "claude-3-7-sonnet-20250219"],
          capabilities: ["content improvement", "tone adjustment", "SEO optimization", "readability enhancement"]
        }
      }
    ];
    
    // Get existing tools
    const existingTools = await db.select().from(agentTools);
    const existingToolNames = existingTools.map(tool => tool.name);
    
    let added = 0;
    let updated = 0;
    
    // Add or update each tool
    for (const tool of tools) {
      if (!existingToolNames.includes(tool.name)) {
        await db.insert(agentTools).values(tool);
        added++;
      } else {
        const existingTool = existingTools.find(t => t.name === tool.name);
        if (existingTool) {
          await db
            .update(agentTools)
            .set({
              description: tool.description,
              category: tool.category,
              icon: tool.icon,
              isActive: tool.isActive,
              isSystem: true,
              config: tool.config,
              updatedAt: new Date()
            })
            .where(eq(agentTools.id, existingTool.id));
          updated++;
        }
      }
    }
    
    console.log(`Successfully registered tools: ${added} added, ${updated} updated`);
    return { success: true, added, updated };
  } catch (error) {
    console.error("Error registering tools:", error);
    throw error;
  }
}

async function registerProviders() {
  try {
    console.log('Registering AI providers...');
    
    const providers = [
      {
        name: 'OpenAI',
        slug: 'openai',
        description: 'Provider for GPT models like GPT-4o',
        isActive: true,
        icon: 'sparkles',
        apiUrl: 'https://api.openai.com/v1',
        createdAt: new Date(),
        updatedAt: new Date(),
        credentials: {
          apiKey: process.env.OPENAI_API_KEY || 'sk-...',
        }
      },
      {
        name: 'Anthropic',
        slug: 'anthropic',
        description: 'Provider for Claude models',
        isActive: true,
        icon: 'brain',
        apiUrl: 'https://api.anthropic.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        credentials: {
          apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-...',
        }
      },
      {
        name: 'xAI',
        slug: 'xai',
        description: 'Provider for Grok models',
        isActive: true,
        icon: 'zap',
        apiUrl: 'https://api.x.ai/v1',
        createdAt: new Date(),
        updatedAt: new Date(),
        credentials: {
          apiKey: process.env.XAI_API_KEY || 'sk-...',
        }
      },
      {
        name: 'Perplexity',
        slug: 'perplexity',
        description: 'Provider for Perplexity AI research models',
        isActive: true,
        icon: 'search',
        apiUrl: 'https://api.perplexity.ai',
        createdAt: new Date(),
        updatedAt: new Date(),
        credentials: {
          apiKey: process.env.PERPLEXITY_API_KEY || 'pplx-...',
        }
      }
    ];
    
    // Get existing providers
    const existingProviders = await db.select().from(aiProviders);
    const existingProviderSlugs = existingProviders.map(provider => provider.slug);
    
    let added = 0;
    let updated = 0;
    
    // Add or update each provider
    for (const provider of providers) {
      if (!existingProviderSlugs.includes(provider.slug)) {
        await db.insert(aiProviders).values(provider);
        added++;
      } else {
        const existingProvider = existingProviders.find(p => p.slug === provider.slug);
        if (existingProvider) {
          await db
            .update(aiProviders)
            .set({
              name: provider.name,
              description: provider.description,
              isActive: provider.isActive,
              icon: provider.icon,
              updatedAt: new Date()
            })
            .where(eq(aiProviders.id, existingProvider.id));
          updated++;
        }
      }
    }
    
    console.log(`Successfully registered providers: ${added} added, ${updated} updated`);
    return { success: true, added, updated };
  } catch (error) {
    console.error("Error registering providers:", error);
    throw error;
  }
}

async function registerAgentTemplates() {
  try {
    console.log('Registering agent templates...');
    
    // Get the tools first to link them properly
    const allTools = await db.select().from(agentTools);
    
    // Define agent templates
    const templates = [
      {
        name: 'Website Builder',
        description: 'Creates and designs complete website projects based on your specifications',
        type: 'builder',
        icon: 'layout',
        isActive: true,
        isTemplate: true,
        userId: 2, // admin user
        createdAt: new Date(),
        updatedAt: new Date(),
        tools: [
          allTools.find(t => t.name === 'OpenAI Chat')?.id, 
          allTools.find(t => t.name === 'Anthropic Claude')?.id,
          allTools.find(t => t.name === 'Grok by xAI')?.id,
          allTools.find(t => t.name === 'Code Generator')?.id
        ].filter(Boolean),
        config: {
          instructions: 'You are a specialized AI agent for website design and development. Create complete, responsive websites based on user requirements.',
          model: 'gpt-4o',
          temperature: 0.7,
          capabilities: ['website design', 'code generation', 'UI/UX design', 'responsive layouts']
        }
      },
      {
        name: 'Personal Secretary',
        description: 'Manages schedules, drafts communications, and handles administrative tasks',
        type: 'assistant',
        icon: 'calendar',
        isActive: true,
        isTemplate: true,
        userId: 2, // admin user
        createdAt: new Date(),
        updatedAt: new Date(),
        tools: [
          allTools.find(t => t.name === 'OpenAI Chat')?.id, 
          allTools.find(t => t.name === 'Anthropic Claude')?.id
        ].filter(Boolean),
        config: {
          instructions: 'You are a smart personal assistant. Help organize schedules, draft emails, and manage administrative tasks efficiently.',
          model: 'claude-3-7-sonnet-20250219',
          temperature: 0.5,
          capabilities: ['email drafting', 'scheduling', 'task organization', 'meeting preparation']
        }
      },
      {
        name: 'Multilingual Contract Writer',
        description: 'Creates and translates legal documents and contracts across multiple languages',
        type: 'writer',
        icon: 'fileCheck',
        isActive: true,
        isTemplate: true,
        userId: 2, // admin user
        createdAt: new Date(),
        updatedAt: new Date(),
        tools: [
          allTools.find(t => t.name === 'OpenAI Chat')?.id, 
          allTools.find(t => t.name === 'Anthropic Claude')?.id,
          allTools.find(t => t.name === 'Content Optimizer')?.id
        ].filter(Boolean),
        config: {
          instructions: 'You are a specialized agent for drafting, analyzing, and translating legal contracts in multiple languages.',
          model: 'gpt-4o',
          temperature: 0.3,
          capabilities: ['contract creation', 'legal analysis', 'multilingual translation', 'document review']
        }
      },
      {
        name: 'Content Creator',
        description: 'Generates high-quality content for blogs, social media, and marketing materials',
        type: 'creator',
        icon: 'pencil',
        isActive: true,
        isTemplate: true,
        userId: 2, // admin user
        createdAt: new Date(),
        updatedAt: new Date(),
        tools: [
          allTools.find(t => t.name === 'OpenAI Chat')?.id, 
          allTools.find(t => t.name === 'Anthropic Claude')?.id,
          allTools.find(t => t.name === 'Content Optimizer')?.id
        ].filter(Boolean),
        config: {
          instructions: 'You are a creative AI agent specialized in generating engaging content for various platforms and purposes.',
          model: 'claude-3-7-sonnet-20250219',
          temperature: 0.8,
          capabilities: ['blog writing', 'social media content', 'copywriting', 'content strategy']
        }
      },
      {
        name: 'Data Analyst',
        description: 'Analyzes datasets and provides actionable insights using AI-powered tools',
        type: 'analyst',
        icon: 'barChart',
        isActive: true,
        isTemplate: true,
        userId: 2, // admin user
        createdAt: new Date(),
        updatedAt: new Date(),
        tools: [
          allTools.find(t => t.name === 'OpenAI Chat')?.id,
          allTools.find(t => t.name === 'OpenRouter AI')?.id,
          allTools.find(t => t.name === 'Grok by xAI')?.id,
          allTools.find(t => t.name === 'Data Analyzer')?.id
        ].filter(Boolean),
        config: {
          instructions: 'You are a data analysis expert. Analyze datasets, identify trends, and provide actionable insights with visualizations.',
          model: 'anthropic/claude-3-5-sonnet',
          temperature: 0.2,
          provider: 'openrouter',
          capabilities: ['data analysis', 'statistical modeling', 'trend identification', 'visualization recommendation']
        }
      }
    ];
    
    // Get existing templates
    const existingAgents = await db.select().from(agents).where(eq(agents.isTemplate, true));
    const existingAgentNames = existingAgents.map(agent => agent.name);
    
    let added = 0;
    let updated = 0;
    let templateIds = [];
    
    // Add or update each template
    for (const template of templates) {
      if (!existingAgentNames.includes(template.name)) {
        const [newAgent] = await db.insert(agents).values(template).returning();
        added++;
        templateIds.push(newAgent.id);
      } else {
        const existingAgent = existingAgents.find(a => a.name === template.name);
        if (existingAgent) {
          await db
            .update(agents)
            .set({
              description: template.description,
              icon: template.icon,
              isActive: template.isActive,
              tools: template.tools,
              config: template.config,
              updatedAt: new Date()
            })
            .where(eq(agents.id, existingAgent.id));
          updated++;
          templateIds.push(existingAgent.id);
        }
      }
    }
    
    console.log(`Successfully registered agent templates: ${added} added, ${updated} updated`);
    return { success: true, added, updated, templateIds };
  } catch (error) {
    console.error("Error registering agent templates:", error);
    throw error;
  }
}

async function createExampleTasks(templateIds) {
  try {
    console.log('Creating example tasks for agent templates...');
    
    // Get all agent templates 
    const agentTemplates = await db.select().from(agents).where(eq(agents.isTemplate, true));
    
    // Example tasks for each template type
    const tasksByType = {
      'builder': [
        {
          title: 'Create a Portfolio Website',
          description: 'Design a modern portfolio website for a graphic designer with sections for projects, about, services, and contact information.',
          priority: 'high',
          status: 'pending'
        },
        {
          title: 'Build an E-commerce Product Page',
          description: 'Create a responsive product page with image gallery, product details, pricing, and add-to-cart functionality.',
          priority: 'medium',
          status: 'pending'
        }
      ],
      'assistant': [
        {
          title: 'Weekly Meeting Schedule',
          description: 'Organize my meetings for next week, sending calendar invites and preparing agenda templates for each.',
          priority: 'high',
          status: 'pending'
        },
        {
          title: 'Draft Client Follow-up Emails',
          description: 'Create personalized follow-up emails for the prospects from the conference last week.',
          priority: 'medium',
          status: 'pending'
        }
      ],
      'writer': [
        {
          title: 'Draft a Service Agreement',
          description: 'Create a comprehensive service agreement for a software development company that includes scope of work, payment terms, and intellectual property clauses.',
          priority: 'high',
          status: 'pending'
        },
        {
          title: 'Translate NDA to Spanish and French',
          description: 'Translate our standard non-disclosure agreement to Spanish and French while ensuring all legal terminology is accurate.',
          priority: 'medium',
          status: 'pending'
        }
      ],
      'creator': [
        {
          title: 'Create Social Media Campaign',
          description: 'Develop a month-long social media campaign for a new product launch including post copy, hashtags, and content themes.',
          priority: 'high',
          status: 'pending'
        },
        {
          title: 'Write Blog Series on Industry Trends',
          description: 'Create a 5-part blog series analyzing the latest trends in artificial intelligence and its impact on various industries.',
          priority: 'medium',
          status: 'pending'
        }
      ],
      'analyst': [
        {
          title: 'Market Research Analysis',
          description: 'Analyze the attached market research data and provide insights on consumer preferences and emerging trends in the industry.',
          priority: 'high',
          status: 'pending'
        },
        {
          title: 'Quarterly Sales Performance Report',
          description: 'Create a comprehensive analysis of Q1 sales data, identifying key performance indicators and areas for improvement.',
          priority: 'medium',
          status: 'pending'
        }
      ]
    };
    
    let tasksAdded = 0;
    
    // For each template, add example tasks
    for (const template of agentTemplates) {
      const tasksForType = tasksByType[template.type];
      if (!tasksForType) continue;
      
      for (const taskData of tasksForType) {
        const task = {
          ...taskData,
          userId: template.userId,
          agentId: template.id,
          isExample: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.insert(tasks).values(task);
        tasksAdded++;
      }
    }
    
    console.log(`Successfully created ${tasksAdded} example tasks`);
    return { success: true, count: tasksAdded };
  } catch (error) {
    console.error("Error creating example tasks:", error);
    throw error;
  }
}

async function registerModels() {
  try {
    console.log('Registering AI models...');
    
    // Get all providers first
    const providers = await db.select().from(aiProviders);
    
    // Define models
    const modelsToAdd = [
      // OpenAI models
      {
        name: 'GPT-4o',
        providerId: providers.find(p => p.slug === 'openai')?.id,
        modelId: 'gpt-4o',
        description: 'Latest multimodal model with vision capabilities',
        isActive: true,
        contextWindow: 128000,
        createdAt: new Date(),
        updatedAt: new Date(),
        capabilities: ['text', 'image-input', 'vision', 'chat', 'embeddings'],
        config: {
          endpoint: '/chat/completions',
          inputFormat: 'json',
          outputFormat: 'json',
          defaults: {
            temperature: 0.7,
            max_tokens: 4096
          }
        }
      },
      {
        name: 'GPT-4o-mini',
        providerId: providers.find(p => p.slug === 'openai')?.id,
        modelId: 'gpt-4o-mini',
        description: 'Efficient version of GPT-4o for faster responses',
        isActive: true,
        contextWindow: 128000,
        createdAt: new Date(),
        updatedAt: new Date(),
        capabilities: ['text', 'image-input', 'vision', 'chat'],
        config: {
          endpoint: '/chat/completions',
          inputFormat: 'json',
          outputFormat: 'json',
          defaults: {
            temperature: 0.7,
            max_tokens: 4096
          }
        }
      },
      
      // Anthropic models
      {
        name: 'Claude 3.7 Sonnet',
        providerId: providers.find(p => p.slug === 'anthropic')?.id,
        modelId: 'claude-3-7-sonnet-20250219',
        description: 'Anthropic\'s latest balanced model with strong reasoning and creative capabilities',
        isActive: true,
        contextWindow: 120000,
        createdAt: new Date(),
        updatedAt: new Date(),
        capabilities: ['text', 'image-input', 'vision', 'chat'],
        config: {
          endpoint: '/messages',
          inputFormat: 'json',
          outputFormat: 'json',
          defaults: {
            temperature: 0.5,
            max_tokens: 4096
          }
        }
      },
      {
        name: 'Claude 3.5 Sonnet',
        providerId: providers.find(p => p.slug === 'anthropic')?.id,
        modelId: 'claude-3-5-sonnet',
        description: 'Powerful model with excellent reasoning capabilities',
        isActive: true,
        contextWindow: 200000,
        createdAt: new Date(),
        updatedAt: new Date(),
        capabilities: ['text', 'image-input', 'vision', 'chat'],
        config: {
          endpoint: '/messages',
          inputFormat: 'json',
          outputFormat: 'json',
          defaults: {
            temperature: 0.5,
            max_tokens: 4096
          }
        }
      },
      
      // xAI models
      {
        name: 'Grok-2',
        providerId: providers.find(p => p.slug === 'xai')?.id,
        modelId: 'grok-2-1212',
        description: 'xAI\'s latest text model with strong reasoning capabilities',
        isActive: true,
        contextWindow: 131072,
        createdAt: new Date(),
        updatedAt: new Date(),
        capabilities: ['text', 'chat'],
        config: {
          endpoint: '/chat/completions',
          inputFormat: 'json',
          outputFormat: 'json',
          defaults: {
            temperature: 0.7,
            max_tokens: 4096
          }
        }
      },
      {
        name: 'Grok-2 Vision',
        providerId: providers.find(p => p.slug === 'xai')?.id,
        modelId: 'grok-2-vision-1212',
        description: 'xAI\'s multimodal model with vision capabilities',
        isActive: true,
        contextWindow: 8192,
        createdAt: new Date(),
        updatedAt: new Date(),
        capabilities: ['text', 'image-input', 'vision', 'chat'],
        config: {
          endpoint: '/chat/completions',
          inputFormat: 'json',
          outputFormat: 'json',
          defaults: {
            temperature: 0.7,
            max_tokens: 4096
          }
        }
      },
      
      // Perplexity models
      {
        name: 'Llama 3.1 Sonar Small',
        providerId: providers.find(p => p.slug === 'perplexity')?.id,
        modelId: 'llama-3.1-sonar-small-128k-online',
        description: 'Perplexity\'s efficient model with online search capabilities',
        isActive: true,
        contextWindow: 128000,
        createdAt: new Date(),
        updatedAt: new Date(),
        capabilities: ['text', 'chat', 'search'],
        config: {
          endpoint: '/chat/completions',
          inputFormat: 'json',
          outputFormat: 'json',
          defaults: {
            temperature: 0.2,
            max_tokens: 4096
          }
        }
      },
      {
        name: 'Llama 3.1 Sonar Large',
        providerId: providers.find(p => p.slug === 'perplexity')?.id,
        modelId: 'llama-3.1-sonar-large-128k-online',
        description: 'Perplexity\'s advanced model with powerful search and reasoning',
        isActive: true,
        contextWindow: 128000,
        createdAt: new Date(),
        updatedAt: new Date(),
        capabilities: ['text', 'chat', 'search'],
        config: {
          endpoint: '/chat/completions',
          inputFormat: 'json',
          outputFormat: 'json',
          defaults: {
            temperature: 0.2,
            max_tokens: 4096
          }
        }
      }
    ];
    
    // Filter out any models where provider wasn't found
    const models = modelsToAdd.filter(model => model.providerId);
    
    // Get existing models 
    const existingModels = await db.select().from(aiModels);
    const existingModelIds = existingModels.map(model => model.modelId);
    
    let added = 0;
    let updated = 0;
    
    // Add or update each model
    for (const model of models) {
      if (!existingModelIds.includes(model.modelId)) {
        await db.insert(aiModels).values(model);
        added++;
      } else {
        const existingModel = existingModels.find(m => m.modelId === model.modelId);
        if (existingModel) {
          await db
            .update(aiModels)
            .set({
              name: model.name,
              description: model.description,
              isActive: model.isActive,
              contextWindow: model.contextWindow,
              capabilities: model.capabilities,
              config: model.config,
              updatedAt: new Date()
            })
            .where(eq(aiModels.id, existingModel.id));
          updated++;
        }
      }
    }
    
    console.log(`Successfully registered models: ${added} added, ${updated} updated`);
    return { success: true, added, updated };
  } catch (error) {
    console.error("Error registering models:", error);
    throw error;
  }
}

// Run all setup functions
async function setupSystem() {
  try {
    // Step 1: Register tools
    await registerTools();
    
    // Step 2: Register providers
    await registerProviders();
    
    // Step 3: Register AI models
    await registerModels();
    
    // Step 4: Register agent templates
    const { templateIds } = await registerAgentTemplates();
    
    // Step 5: Create example tasks
    await createExampleTasks(templateIds);
    
    console.log('System setup completed successfully!');
  } catch (error) {
    console.error('System setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupSystem();