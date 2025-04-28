/**
 * Templates for common agent tools
 */
import { AgentTool, InsertAgentTool } from './schema';

/**
 * Template type for tool creation
 */
export interface AgentToolTemplate {
  name: string;
  description: string;
  category: string;
  type: string;
  icon: string;
  config: Record<string, any>;
}

/**
 * Helper function to convert a template to an agent tool insert object
 */
export const templateToInsertTool = (template: AgentToolTemplate): InsertAgentTool => {
  return {
    name: template.name,
    description: template.description,
    category: template.category,
    type: template.type,
    icon: template.icon,
    config: template.config,
    isActive: true
  };
};

/**
 * Categories and their descriptions
 */
export const TOOL_CATEGORIES = {
  DATA_PROCESSING: "data_processing",
  CONTENT_GENERATION: "content_generation",
  COMMUNICATION: "communication",
  KNOWLEDGE: "knowledge",
  UTILITIES: "utilities",
  INTEGRATIONS: "integrations",
  CUSTOM: "custom"
};

/**
 * Template for OpenAI Chat Completion
 */
export const OPENAI_CHAT_TEMPLATE: AgentToolTemplate = {
  name: "OpenAI Chat",
  description: "Generate text responses using OpenAI's chat models",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "MessageSquare",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: "You are a helpful AI assistant."
  }
};

/**
 * Template for OpenAI Image Generation (DALL-E)
 */
export const OPENAI_IMAGE_TEMPLATE: AgentToolTemplate = {
  name: "OpenAI Image Generation",
  description: "Generate images from text descriptions using DALL-E",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Image",
  config: {
    model: "dall-e-3",
    size: "1024x1024",
    quality: "standard",
    style: "vivid"
  }
};

/**
 * Template for OpenAI Text Analysis (Embeddings)
 */
export const OPENAI_EMBEDDINGS_TEMPLATE: AgentToolTemplate = {
  name: "OpenAI Text Analysis",
  description: "Generate vector embeddings for text similarity and analysis",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "openai",
  icon: "FileText",
  config: {
    model: "text-embedding-3-small",
    dimensions: 1536
  }
};

/**
 * Template for OpenAI Audio Transcription
 */
export const OPENAI_TRANSCRIPTION_TEMPLATE: AgentToolTemplate = {
  name: "OpenAI Audio Transcription",
  description: "Convert speech to text from audio files",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "openai",
  icon: "Mic",
  config: {
    model: "whisper-1",
    language: "en",
    temperature: 0
  }
};

/**
 * Template for OpenAI Vision (Image Analysis)
 */
export const OPENAI_VISION_TEMPLATE: AgentToolTemplate = {
  name: "OpenAI Vision",
  description: "Analyze and describe images using multimodal models",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "openai",
  icon: "Eye",
  config: {
    model: "gpt-4o",
    maxTokens: 1000,
    detailLevel: "high"
  }
};

/**
 * Template for Web Search
 */
export const WEB_SEARCH_TEMPLATE: AgentToolTemplate = {
  name: "Web Search",
  description: "Search the web for information",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "search",
  icon: "Search",
  config: {
    engine: "google",
    resultCount: 5,
    includeSnippets: true
  }
};

/**
 * Template for Email Sending
 */
export const EMAIL_TEMPLATE: AgentToolTemplate = {
  name: "Email Sender",
  description: "Send emails to specified recipients",
  category: TOOL_CATEGORIES.COMMUNICATION,
  type: "email",
  icon: "Mail",
  config: {
    service: "sendgrid",
    from: "{{sender}}",
    subject: "{{subject}}",
    template: "default"
  }
};

/**
 * Template for SMS Sending
 */
export const SMS_TEMPLATE: AgentToolTemplate = {
  name: "SMS Sender",
  description: "Send SMS messages to specified phone numbers",
  category: TOOL_CATEGORIES.COMMUNICATION,
  type: "sms",
  icon: "MessageCircle",
  config: {
    service: "twilio",
    from: "{{sender}}",
    template: "default"
  }
};

/**
 * Template for Database Query
 */
export const DATABASE_QUERY_TEMPLATE: AgentToolTemplate = {
  name: "Database Query",
  description: "Execute SQL queries against databases",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "database",
  icon: "Database",
  config: {
    type: "postgresql",
    allowedTables: ["public.*"],
    maxRows: 1000,
    readOnly: true
  }
};

/**
 * Template for File Reader
 */
export const FILE_READER_TEMPLATE: AgentToolTemplate = {
  name: "File Reader",
  description: "Read content from files",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "filesystem",
  icon: "FileText",
  config: {
    allowedExtensions: [".txt", ".md", ".csv", ".json", ".xml"],
    maxSizeKB: 5000,
    operation: "read"
  }
};

/**
 * Template for File Writer
 */
export const FILE_WRITER_TEMPLATE: AgentToolTemplate = {
  name: "File Writer",
  description: "Write content to files",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "filesystem",
  icon: "FilePlus",
  config: {
    allowedExtensions: [".txt", ".md", ".csv", ".json", ".xml"],
    maxSizeKB: 5000,
    operation: "write"
  }
};

/**
 * Template for Slack Integration
 */
export const SLACK_TEMPLATE: AgentToolTemplate = {
  name: "Slack Messenger",
  description: "Send messages to Slack channels",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "webhook",
  icon: "MessageSquare",
  config: {
    service: "slack",
    defaultChannel: "general",
    username: "AI Agent"
  }
};

/**
 * Template for GitHub Integration
 */
export const GITHUB_TEMPLATE: AgentToolTemplate = {
  name: "GitHub Issues",
  description: "Create and manage GitHub issues",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "webhook",
  icon: "Github",
  config: {
    service: "github",
    owner: "{{owner}}",
    repo: "{{repo}}",
    operations: ["list", "create", "update"]
  }
};

/**
 * Template for Webhook
 */
export const WEBHOOK_TEMPLATE: AgentToolTemplate = {
  name: "Custom Webhook",
  description: "Send data to a custom webhook endpoint",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "webhook",
  icon: "Link",
  config: {
    url: "{{url}}",
    method: "POST",
    headers: {}
  }
};

/**
 * Template for CSV Processor
 */
export const CSV_PROCESSOR_TEMPLATE: AgentToolTemplate = {
  name: "CSV Processor",
  description: "Process and analyze CSV data",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "custom",
  icon: "Table",
  config: {
    operations: ["read", "transform", "filter", "aggregate"],
    delimiter: ",",
    maxRows: 10000
  }
};

/**
 * Template for PDF Processor
 */
export const PDF_PROCESSOR_TEMPLATE: AgentToolTemplate = {
  name: "PDF Processor",
  description: "Extract text and data from PDF files",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "custom",
  icon: "FileText",
  config: {
    extractText: true,
    extractImages: false,
    extractTables: true,
    maxPages: 100
  }
};

/**
 * Template for Translation
 */
export const TRANSLATION_TEMPLATE: AgentToolTemplate = {
  name: "Text Translator",
  description: "Translate text between languages",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Globe",
  config: {
    model: "gpt-4o",
    sourceLanguage: "auto",
    targetLanguage: "en",
    preserveFormatting: true
  }
};

/**
 * Template for Weather Information
 */
export const WEATHER_TEMPLATE: AgentToolTemplate = {
  name: "Weather Information",
  description: "Get current weather and forecasts for locations",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "webhook",
  icon: "Cloud",
  config: {
    service: "openweathermap",
    units: "metric",
    includesForecast: true,
    forecastDays: 5
  }
};

/**
 * Template for News Fetcher
 */
export const NEWS_TEMPLATE: AgentToolTemplate = {
  name: "News Fetcher",
  description: "Get the latest news from various sources",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "webhook",
  icon: "Newspaper",
  config: {
    service: "newsapi",
    sources: ["bbc-news", "cnn", "the-verge"],
    language: "en",
    maxResults: 10
  }
};

/**
 * Template for Calendar Integration
 */
export const CALENDAR_TEMPLATE: AgentToolTemplate = {
  name: "Calendar Integration",
  description: "Manage calendar events and appointments",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "webhook",
  icon: "Calendar",
  config: {
    service: "google_calendar",
    operations: ["list", "create", "update", "delete"],
    defaultCalendar: "primary"
  }
};

/**
 * Template for Data Visualizer
 */
export const DATA_VISUALIZER_TEMPLATE: AgentToolTemplate = {
  name: "Data Visualizer",
  description: "Generate charts and visualizations from data",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "custom",
  icon: "BarChart",
  config: {
    chartTypes: ["bar", "line", "pie", "scatter"],
    width: 800,
    height: 600,
    format: "svg"
  }
};

/**
 * Template for Code Generator
 */
export const CODE_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Code Generator",
  description: "Generate and explain code in various languages",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Code",
  config: {
    model: "gpt-4o",
    temperature: 0.2,
    languages: ["javascript", "python", "typescript", "java", "c++", "go"],
    includeExplanation: true,
    includeTests: false
  }
};

/**
 * Template for Math Solver
 */
export const MATH_SOLVER_TEMPLATE: AgentToolTemplate = {
  name: "Math Solver",
  description: "Solve and explain mathematical problems",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "Calculator",
  config: {
    model: "gpt-4o",
    showWorkingSteps: true,
    generateGraphs: false,
    topics: ["algebra", "calculus", "statistics", "geometry", "linear-algebra"]
  }
};

/**
 * Template for Custom API Connector
 */
export const CUSTOM_API_TEMPLATE: AgentToolTemplate = {
  name: "Custom API Connector",
  description: "Connect to and interact with custom REST APIs",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "custom_api",
  icon: "Link",
  config: {
    baseUrl: "{{baseUrl}}",
    authentication: {
      type: "bearer",
      token: "{{token}}"
    },
    endpoints: [
      {
        name: "list_items",
        method: "GET",
        path: "/items",
        params: []
      },
      {
        name: "get_item",
        method: "GET",
        path: "/items/{id}",
        params: ["id"]
      },
      {
        name: "create_item",
        method: "POST",
        path: "/items",
        bodySchema: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            description: { type: "string" }
          }
        }
      }
    ]
  }
};

/**
 * All available templates
 */
export const TOOL_TEMPLATES: Record<string, AgentToolTemplate> = {
  OPENAI_CHAT: OPENAI_CHAT_TEMPLATE,
  OPENAI_IMAGE: OPENAI_IMAGE_TEMPLATE,
  OPENAI_EMBEDDINGS: OPENAI_EMBEDDINGS_TEMPLATE,
  OPENAI_TRANSCRIPTION: OPENAI_TRANSCRIPTION_TEMPLATE,
  OPENAI_VISION: OPENAI_VISION_TEMPLATE,
  WEB_SEARCH: WEB_SEARCH_TEMPLATE,
  EMAIL: EMAIL_TEMPLATE,
  SMS: SMS_TEMPLATE,
  DATABASE_QUERY: DATABASE_QUERY_TEMPLATE,
  FILE_READER: FILE_READER_TEMPLATE,
  FILE_WRITER: FILE_WRITER_TEMPLATE,
  SLACK: SLACK_TEMPLATE,
  GITHUB: GITHUB_TEMPLATE,
  WEBHOOK: WEBHOOK_TEMPLATE,
  CSV_PROCESSOR: CSV_PROCESSOR_TEMPLATE,
  PDF_PROCESSOR: PDF_PROCESSOR_TEMPLATE,
  TRANSLATION: TRANSLATION_TEMPLATE,
  WEATHER: WEATHER_TEMPLATE,
  NEWS: NEWS_TEMPLATE,
  CALENDAR: CALENDAR_TEMPLATE,
  DATA_VISUALIZER: DATA_VISUALIZER_TEMPLATE,
  CODE_GENERATOR: CODE_GENERATOR_TEMPLATE,
  MATH_SOLVER: MATH_SOLVER_TEMPLATE,
  CUSTOM_API: CUSTOM_API_TEMPLATE
};

/**
 * Get all templates
 */
export const getAllTemplates = (): AgentToolTemplate[] => {
  return Object.values(TOOL_TEMPLATES);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: string): AgentToolTemplate[] => {
  return Object.values(TOOL_TEMPLATES).filter(template => template.category === category);
};

/**
 * Get a template by key
 */
export const getTemplate = (key: string): AgentToolTemplate | undefined => {
  return TOOL_TEMPLATES[key];
};