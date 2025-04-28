/**
 * Agent Tool Templates
 * 
 * This file contains predefined templates for agent tools that can be used to create
 * powerful AI agents with various capabilities. Each template defines a specific tool
 * that can be integrated with an agent to extend its functionality.
 */

import { InsertAgentTool } from './schema';

// Tool categories
export const TOOL_CATEGORIES = {
  DATA_PROCESSING: 'data_processing',
  CONTENT_GENERATION: 'content_generation',
  WEB_INTERACTION: 'web_interaction',
  COMMUNICATION: 'communication',
  RESEARCH: 'research',
  DEVELOPMENT: 'development',
  PRODUCTIVITY: 'productivity',
  ANALYTICS: 'analytics',
};

// Tool types
export const TOOL_TYPES = {
  OPENAI: 'openai',
  CUSTOM_API: 'custom_api',
  WEBHOOK: 'webhook',
  DATABASE: 'database',
  FILE_SYSTEM: 'file_system',
  EMAIL: 'email',
  SMS: 'sms',
  SEARCH: 'search',
};

// Interface for tool template
export interface AgentToolTemplate extends Omit<InsertAgentTool, 'isActive' | 'icon'> {
  id: string;
  icon: string;
  isSystem: boolean;
}

/**
 * Predefined agent tool templates
 * Collection of 25+ tool templates for various agent capabilities
 */
export const AGENT_TOOL_TEMPLATES: AgentToolTemplate[] = [
  // CONTENT GENERATION TOOLS
  {
    id: 'text-generator',
    name: 'Text Generator',
    description: 'Generates high-quality text content based on prompts',
    category: TOOL_CATEGORIES.CONTENT_GENERATION,
    type: TOOL_TYPES.OPENAI,
    icon: 'text',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: 'You are a professional content writer. Generate high-quality text based on the provided prompt.',
    }
  },
  {
    id: 'blog-post-writer',
    name: 'Blog Post Writer',
    description: 'Creates complete blog posts with proper structure and SEO optimization',
    category: TOOL_CATEGORIES.CONTENT_GENERATION,
    type: TOOL_TYPES.OPENAI,
    icon: 'file-text',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: 'You are a professional blog writer. Create a well-structured, SEO-optimized blog post with headings, subheadings, and bullet points where appropriate.',
    }
  },
  {
    id: 'social-media-post-creator',
    name: 'Social Media Post Creator',
    description: 'Creates engaging social media posts optimized for different platforms',
    category: TOOL_CATEGORIES.CONTENT_GENERATION,
    type: TOOL_TYPES.OPENAI,
    icon: 'share',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.8,
      maxTokens: 500,
      systemPrompt: 'Create engaging social media posts optimized for the specified platform (Twitter, LinkedIn, Facebook, Instagram). Include relevant hashtags and a call to action.',
    }
  },
  {
    id: 'email-composer',
    name: 'Email Composer',
    description: 'Drafts professional and personalized emails',
    category: TOOL_CATEGORIES.CONTENT_GENERATION,
    type: TOOL_TYPES.OPENAI,
    icon: 'mail',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.6,
      maxTokens: 1000,
      systemPrompt: 'You are a professional email writer. Compose a clear, professional email based on the provided context. Include a subject line, appropriate greeting, and professional closing.',
    }
  },
  {
    id: 'product-description-writer',
    name: 'Product Description Writer',
    description: 'Creates compelling product descriptions for e-commerce',
    category: TOOL_CATEGORIES.CONTENT_GENERATION,
    type: TOOL_TYPES.OPENAI,
    icon: 'tag',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 800,
      systemPrompt: 'Write a compelling, benefit-focused product description that highlights features, advantages, and creates desire for purchase.',
    }
  },
  
  // DATA PROCESSING TOOLS
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    description: 'Analyzes data sets and provides insights and summaries',
    category: TOOL_CATEGORIES.DATA_PROCESSING,
    type: TOOL_TYPES.OPENAI,
    icon: 'bar-chart',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 1500,
      systemPrompt: 'You are a data analysis expert. Review the provided data and extract key insights, trends, and anomalies. Provide a clear summary with actionable recommendations.',
    }
  },
  {
    id: 'text-summarizer',
    name: 'Text Summarizer',
    description: 'Creates concise summaries of longer documents or articles',
    category: TOOL_CATEGORIES.DATA_PROCESSING,
    type: TOOL_TYPES.OPENAI,
    icon: 'file-minus',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.4,
      maxTokens: 800,
      systemPrompt: 'Provide a concise, comprehensive summary of the following text. Maintain the key points and main arguments while significantly reducing length.',
    }
  },
  {
    id: 'sentiment-analyzer',
    name: 'Sentiment Analyzer',
    description: 'Analyzes text to determine sentiment and emotional tone',
    category: TOOL_CATEGORIES.DATA_PROCESSING,
    type: TOOL_TYPES.OPENAI,
    icon: 'heart-pulse',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.2,
      maxTokens: 600,
      systemPrompt: 'Analyze the sentiment of the provided text. Determine if it is positive, negative, or neutral. Provide specific examples of language that contributes to this sentiment.',
    }
  },
  {
    id: 'data-formatter',
    name: 'Data Formatter',
    description: 'Converts data between formats (CSV, JSON, etc.) and cleans datasets',
    category: TOOL_CATEGORIES.DATA_PROCESSING,
    type: TOOL_TYPES.OPENAI,
    icon: 'database',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.2,
      maxTokens: 1000,
      systemPrompt: 'Convert the provided data into the requested format. Ensure proper structure, field names, and data types. Clean the data by removing duplicates and fixing inconsistencies.',
    }
  },
  
  // RESEARCH TOOLS
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Conducts in-depth research on a topic and compiles findings',
    category: TOOL_CATEGORIES.RESEARCH,
    type: TOOL_TYPES.OPENAI,
    icon: 'search',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 2000,
      systemPrompt: 'You are a research assistant. Based on the query, provide comprehensive information, cite sources when possible, and organize findings in a structured format.',
    }
  },
  {
    id: 'competitor-analyzer',
    name: 'Competitor Analyzer',
    description: 'Analyzes competitor products, websites, and marketing materials',
    category: TOOL_CATEGORIES.RESEARCH,
    type: TOOL_TYPES.OPENAI,
    icon: 'target',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 1500,
      systemPrompt: 'Conduct a competitor analysis of the provided information. Compare features, positioning, strengths, weaknesses, and unique selling propositions. Provide insights on differentiation opportunities.',
    }
  },
  {
    id: 'market-trend-analyzer',
    name: 'Market Trend Analyzer',
    description: 'Identifies and analyzes market trends in specified industries',
    category: TOOL_CATEGORIES.RESEARCH,
    type: TOOL_TYPES.OPENAI,
    icon: 'trending-up',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 1800,
      systemPrompt: 'Analyze current market trends in the specified industry. Identify emerging patterns, consumer behavior shifts, technological impacts, and potential opportunities.',
    }
  },
  
  // DEVELOPMENT TOOLS
  {
    id: 'code-generator',
    name: 'Code Generator',
    description: 'Generates code snippets and solutions for programming tasks',
    category: TOOL_CATEGORIES.DEVELOPMENT,
    type: TOOL_TYPES.OPENAI,
    icon: 'code',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 1500,
      systemPrompt: 'You are an experienced software developer. Write clean, efficient, and well-commented code based on the requirements provided. Explain your implementation approach.',
    }
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Reviews code for bugs, efficiency, and best practices',
    category: TOOL_CATEGORIES.DEVELOPMENT,
    type: TOOL_TYPES.OPENAI,
    icon: 'bug',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 1500,
      systemPrompt: 'You are a senior code reviewer. Analyze the provided code for bugs, security issues, performance optimizations, and adherence to best practices. Provide specific recommendations for improvement.',
    }
  },
  {
    id: 'sql-query-builder',
    name: 'SQL Query Builder',
    description: 'Creates and optimizes SQL queries based on requirements',
    category: TOOL_CATEGORIES.DEVELOPMENT,
    type: TOOL_TYPES.OPENAI,
    icon: 'database',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 1000,
      systemPrompt: 'Create optimized SQL queries based on the described requirements and database schema. Consider performance, indexing, and query complexity.',
    }
  },
  
  // COMMUNICATION TOOLS
  {
    id: 'translation-tool',
    name: 'Translation Tool',
    description: 'Translates text between multiple languages',
    category: TOOL_CATEGORIES.COMMUNICATION,
    type: TOOL_TYPES.OPENAI,
    icon: 'globe',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 1500,
      systemPrompt: 'Translate the provided text from the source language to the target language. Maintain context, meaning, and tone as accurately as possible.',
    }
  },
  {
    id: 'meeting-summarizer',
    name: 'Meeting Summarizer',
    description: 'Creates concise summaries of meeting transcripts with action items',
    category: TOOL_CATEGORIES.COMMUNICATION,
    type: TOOL_TYPES.OPENAI,
    icon: 'clipboard-list',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.4,
      maxTokens: 1000,
      systemPrompt: 'Summarize the meeting transcript, highlighting key discussions, decisions made, and action items. Include responsible parties and deadlines for action items when mentioned.',
    }
  },
  {
    id: 'customer-inquiry-responder',
    name: 'Customer Inquiry Responder',
    description: 'Generates professional responses to customer inquiries',
    category: TOOL_CATEGORIES.COMMUNICATION,
    type: TOOL_TYPES.OPENAI,
    icon: 'message-square',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 800,
      systemPrompt: 'You are a customer service professional. Create a helpful, empathetic response to the customer inquiry. Address their concerns directly and provide clear solutions or next steps.',
    }
  },
  
  // WEB INTERACTION TOOLS
  {
    id: 'web-content-extractor',
    name: 'Web Content Extractor',
    description: 'Extracts and processes content from web pages',
    category: TOOL_CATEGORIES.WEB_INTERACTION,
    type: TOOL_TYPES.CUSTOM_API,
    icon: 'download',
    isSystem: true,
    config: {
      endpoint: '/api/tools/web-extractor',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  },
  {
    id: 'seo-analyzer',
    name: 'SEO Analyzer',
    description: 'Analyzes content for SEO optimization and provides recommendations',
    category: TOOL_CATEGORIES.WEB_INTERACTION,
    type: TOOL_TYPES.OPENAI,
    icon: 'search',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.4,
      maxTokens: 1000,
      systemPrompt: 'Analyze the provided content for SEO effectiveness. Evaluate keyword usage, meta description, readability, and header structure. Provide actionable recommendations for improvement.',
    }
  },
  
  // PRODUCTIVITY TOOLS
  {
    id: 'task-planner',
    name: 'Task Planner',
    description: 'Creates structured task plans with timelines and priorities',
    category: TOOL_CATEGORIES.PRODUCTIVITY,
    type: TOOL_TYPES.OPENAI,
    icon: 'list-checks',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 1200,
      systemPrompt: 'Create a detailed task plan for the described project or goal. Break it down into specific tasks, assign priorities, estimate time requirements, and suggest an execution order.',
    }
  },
  {
    id: 'meeting-agenda-creator',
    name: 'Meeting Agenda Creator',
    description: 'Creates structured meeting agendas based on topics and goals',
    category: TOOL_CATEGORIES.PRODUCTIVITY,
    type: TOOL_TYPES.OPENAI,
    icon: 'calendar',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 800,
      systemPrompt: 'Create a detailed meeting agenda based on the provided information. Include topics for discussion, allocated time for each, required pre-work, and desired outcomes or goals.',
    }
  },
  
  // ANALYTICS TOOLS
  {
    id: 'data-visualization-assistant',
    name: 'Data Visualization Assistant',
    description: 'Provides recommendations for effective data visualization',
    category: TOOL_CATEGORIES.ANALYTICS,
    type: TOOL_TYPES.OPENAI,
    icon: 'pie-chart',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 1000,
      systemPrompt: 'Recommend appropriate data visualization types based on the provided data and objectives. Consider data characteristics, relationships, and what insights need to be communicated.',
    }
  },
  {
    id: 'performance-analyzer',
    name: 'Performance Analyzer',
    description: 'Analyzes performance metrics and provides insights and recommendations',
    category: TOOL_CATEGORIES.ANALYTICS,
    type: TOOL_TYPES.OPENAI,
    icon: 'activity',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.4,
      maxTokens: 1200,
      systemPrompt: 'Analyze the provided performance metrics. Identify trends, anomalies, and areas for improvement. Provide specific, actionable recommendations to enhance performance.',
    }
  },
  {
    id: 'report-generator',
    name: 'Report Generator',
    description: 'Creates comprehensive reports from data and analysis',
    category: TOOL_CATEGORIES.ANALYTICS,
    type: TOOL_TYPES.OPENAI,
    icon: 'file-text',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 2000,
      systemPrompt: 'Generate a comprehensive report based on the provided data and analysis requirements. Include an executive summary, methodology, key findings, data visualizations, and recommendations.',
    }
  },
  {
    id: 'survey-analyzer',
    name: 'Survey Analyzer',
    description: 'Analyzes survey responses and provides insights',
    category: TOOL_CATEGORIES.ANALYTICS,
    type: TOOL_TYPES.OPENAI,
    icon: 'clipboard-check',
    isSystem: true,
    config: {
      modelId: 'gpt-4o',
      temperature: 0.4,
      maxTokens: 1500,
      systemPrompt: 'Analyze the provided survey responses. Identify patterns, trends, and statistically significant findings. Segment responses by demographic groups if applicable and summarize key insights.',
    }
  }
];

/**
 * Get all available agent tool templates
 * @returns Array of all available tool templates
 */
export function getAllToolTemplates(): AgentToolTemplate[] {
  return AGENT_TOOL_TEMPLATES;
}

/**
 * Get tool templates by category
 * @param category - Tool category to filter by
 * @returns Array of tool templates in specified category
 */
export function getToolTemplatesByCategory(category: string): AgentToolTemplate[] {
  return AGENT_TOOL_TEMPLATES.filter(template => template.category === category);
}

/**
 * Get a specific tool template by ID
 * @param id - Template ID to retrieve
 * @returns Tool template or undefined if not found
 */
export function getToolTemplateById(id: string): AgentToolTemplate | undefined {
  return AGENT_TOOL_TEMPLATES.find(template => template.id === id);
}