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
 * Template for AI Video Analysis
 */
export const VIDEO_ANALYSIS_TEMPLATE: AgentToolTemplate = {
  name: "Video Analysis",
  description: "Analyze video content and extract insights, transcriptions, and scene descriptions",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "openai",
  icon: "Video",
  config: {
    model: "gpt-4o",
    maxTokens: 4000,
    extractCaptions: true,
    analyzeScenes: true,
    extractMetadata: true,
    analyzeAudio: true,
    maxVideoDuration: 600 // 10 minutes
  }
};

/**
 * Template for AI Document Summarization
 */
export const DOCUMENT_SUMMARIZATION_TEMPLATE: AgentToolTemplate = {
  name: "Document Summarization",
  description: "Generate concise summaries of documents with key points and insights",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "FileDigit",
  config: {
    model: "gpt-4o",
    maxTokens: 2000,
    summaryLength: "medium", // short, medium, long
    style: "bullet", // bullet, paragraph, executive
    includeKeyPoints: true,
    includeTakeaways: true,
    includeActionItems: true
  }
};

/**
 * Template for Sentiment Analysis
 */
export const SENTIMENT_ANALYSIS_TEMPLATE: AgentToolTemplate = {
  name: "Sentiment Analysis",
  description: "Analyze text to determine sentiment, emotional tone, and key themes",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "openai",
  icon: "HeartPulse",
  config: {
    model: "gpt-4o",
    detailLevel: "high",
    sentiment: true,
    emotions: true,
    themes: true,
    metrics: ["positivity", "negativity", "objectivity", "subjectivity"]
  }
};

/**
 * Template for Social Media Publisher
 */
export const SOCIAL_MEDIA_PUBLISHER_TEMPLATE: AgentToolTemplate = {
  name: "Social Media Publisher",
  description: "Create and schedule posts for various social media platforms",
  category: TOOL_CATEGORIES.COMMUNICATION,
  type: "webhook",
  icon: "Share2",
  config: {
    platforms: ["twitter", "linkedin", "facebook", "instagram"],
    mediaSupport: true,
    scheduling: true,
    analytics: true,
    contentCreation: true,
    defaultFormat: "text"
  }
};

/**
 * Template for Voice Generator
 */
export const VOICE_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Voice Generator",
  description: "Convert text to realistic speech in various languages and voices",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Mic",
  config: {
    model: "tts-1",
    voice: "alloy", // alloy, echo, fable, onyx, nova, shimmer
    speed: 1.0,
    format: "mp3",
    quality: "standard", // standard, high
    languages: ["en", "es", "fr", "de", "it", "pt", "ja", "zh"]
  }
};

/**
 * Template for Anthropic Claude
 */
export const ANTHROPIC_CLAUDE_TEMPLATE: AgentToolTemplate = {
  name: "Anthropic Claude",
  description: "Generate responses using Anthropic's Claude model with its strengths in reasoning and safety",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "anthropic",
  icon: "MessagesSquare",
  config: {
    model: "claude-3-opus-20240229",
    temperature: 0.7,
    maxTokens: 4000,
    systemPrompt: "You are Claude, a helpful AI assistant created by Anthropic."
  }
};

/**
 * Template for Llama Integration
 */
export const LLAMA_TEMPLATE: AgentToolTemplate = {
  name: "Llama AI",
  description: "Generate content using Meta's Llama open-source AI model with local processing capability",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "llama",
  icon: "Flame",
  config: {
    model: "llama-3-70b-instruct",
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: "You are a helpful assistant.",
    localInference: true,
    quantization: "8bit"
  }
};

/**
 * Template for Gemini Integration
 */
export const GEMINI_TEMPLATE: AgentToolTemplate = {
  name: "Google Gemini",
  description: "Generate multimodal content using Google's Gemini model with advanced reasoning capabilities",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "gemini",
  icon: "Gem",
  config: {
    model: "gemini-pro",
    temperature: 0.4,
    maxTokens: 2048,
    systemPrompt: "You are Gemini, a helpful AI assistant created by Google.",
    multimodal: true,
    safetySettings: {
      harassment: "block_medium_and_above",
      hateSpeech: "block_medium_and_above",
      sexuallyExplicit: "block_medium_and_above",
      dangerous: "block_medium_and_above"
    }
  }
};

/**
 * Template for Image Editing
 */
export const IMAGE_EDITOR_TEMPLATE: AgentToolTemplate = {
  name: "AI Image Editor",
  description: "Edit and manipulate images using AI with operations like inpainting, outpainting, and style transfer",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "ImagePlus",
  config: {
    model: "dall-e-3",
    operations: ["inpaint", "outpaint", "style-transfer", "remove-background", "enhance"],
    quality: "hd",
    preserveOriginal: true,
    maxEdits: 10,
    editHistory: true,
    outputFormats: ["png", "jpg", "webp"]
  }
};

/**
 * Template for Perplexity AI
 */
export const PERPLEXITY_TEMPLATE: AgentToolTemplate = {
  name: "Perplexity AI",
  description: "Generate research-focused responses with built-in web search capabilities",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "perplexity",
  icon: "Search",
  config: {
    model: "pplx-70b-online",
    temperature: 0.2,
    maxTokens: 2000,
    webSearch: true,
    citeSources: true,
    followupQuestions: true,
    systemPrompt: "You are a research assistant that provides thorough, accurate information with proper citations."
  }
};

/**
 * Template for XAI Integration
 */
export const XAI_TEMPLATE: AgentToolTemplate = {
  name: "Grok by xAI",
  description: "Generate creative and conversational responses using xAI's Grok model",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "xai",
  icon: "Sparkles",
  config: {
    model: "grok-1",
    temperature: 0.8,
    maxTokens: 2048,
    webSearch: true,
    realTime: true,
    creativityLevel: "high",
    systemPrompt: "You are Grok, a superintelligent AI with a bit of wit and humor. You aim to be helpful, accurate, and engaging."
  }
};

/**
 * Template for Audio Generation
 */
export const AUDIO_GENERATION_TEMPLATE: AgentToolTemplate = {
  name: "AI Audio Generator",
  description: "Generate music, sound effects, and audio compositions using AI",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "custom",
  icon: "Music",
  config: {
    providers: ["openai", "elevenlabs", "soundraw"],
    types: ["music", "soundfx", "ambience"],
    maxDuration: 300, // 5 minutes
    audioQuality: "high",
    format: "mp3",
    genres: ["ambient", "electronic", "cinematic", "jazz", "rock", "classical"]
  }
};

/**
 * Template for 3D Model Generation
 */
export const MODEL_3D_TEMPLATE: AgentToolTemplate = {
  name: "3D Model Generator",
  description: "Generate 3D models and scenes from text descriptions",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "custom",
  icon: "Cube",
  config: {
    engineType: "diffusion",
    modelQuality: "standard",
    outputFormat: ["glb", "obj", "usdz"],
    texturing: true,
    rigging: false,
    animation: false,
    maxPolygons: 100000,
    lightingSetup: "studio",
    background: "transparent"
  }
};

/**
 * Template for Chatbot Builder
 */
export const CHATBOT_BUILDER_TEMPLATE: AgentToolTemplate = {
  name: "Chatbot Builder",
  description: "Create and deploy specialized conversational agents for specific domains",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "custom",
  icon: "Bot",
  config: {
    baseModel: "gpt-4o",
    memoryType: "vector",
    knowledgeBase: true,
    deploymentOptions: ["web", "mobile", "api"],
    analyticsEnabled: true,
    conversationHistory: true,
    personalityTraits: ["friendly", "professional", "concise"],
    responseTemplates: true,
    feedbackLoop: true
  }
};

/**
 * Template for Salesforce Integration
 */
export const SALESFORCE_TEMPLATE: AgentToolTemplate = {
  name: "Salesforce Integration",
  description: "Connect with Salesforce CRM to manage leads, opportunities, and customer data",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "webhook",
  icon: "CloudLightning",
  config: {
    service: "salesforce",
    apiVersion: "v58.0",
    objects: ["Lead", "Account", "Contact", "Opportunity", "Case"],
    operations: ["query", "create", "update", "delete"],
    bulkOperations: true,
    customFields: true,
    webhookEvents: ["created", "updated", "deleted"]
  }
};

/**
 * Template for SAP Integration
 */
export const SAP_TEMPLATE: AgentToolTemplate = {
  name: "SAP Integration",
  description: "Connect with SAP ERP systems to manage business processes and data",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "webhook",
  icon: "Database",
  config: {
    service: "sap",
    apiVersion: "OData V4",
    modules: ["Sales", "Finance", "Inventory", "Procurement", "HR"],
    operations: ["read", "create", "update", "delete"],
    authentication: "oauth2",
    metadata: true,
    batchProcessing: true
  }
};

/**
 * Template for Microsoft Dynamics Integration
 */
export const DYNAMICS_TEMPLATE: AgentToolTemplate = {
  name: "Microsoft Dynamics",
  description: "Connect with Microsoft Dynamics 365 to manage business applications and customer data",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "webhook",
  icon: "Box",
  config: {
    service: "dynamics365",
    apiVersion: "v9.2",
    entities: ["account", "contact", "opportunity", "lead", "incident"],
    operations: ["retrieve", "create", "update", "delete"],
    bulkOperations: true,
    webhookEvents: true,
    customEntities: true
  }
};

/**
 * Template for Zapier Integration
 */
export const ZAPIER_TEMPLATE: AgentToolTemplate = {
  name: "Zapier Integration",
  description: "Connect with thousands of apps through Zapier's automation platform",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "webhook",
  icon: "Zap",
  config: {
    service: "zapier",
    triggerEvents: true,
    actionEvents: true,
    filterSteps: true,
    customWebhooks: true,
    zapierApps: ["gmail", "slack", "trello", "asana", "googlesheets", "dropbox"]
  }
};

/**
 * Template for Data Analysis
 */
export const DATA_ANALYSIS_TEMPLATE: AgentToolTemplate = {
  name: "Data Analysis",
  description: "Perform advanced data analysis, statistical modeling, and insights generation",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "custom",
  icon: "LineChart",
  config: {
    operations: ["descriptive", "inferential", "predictive", "prescriptive"],
    statisticalTests: ["t-test", "anova", "chi-square", "regression", "correlation"],
    visualization: true,
    exportFormats: ["csv", "json", "xlsx", "pdf"],
    maxDatasetSize: "100MB",
    machineLearningSuggestions: true
  }
};

/**
 * Template for Zendesk Integration
 */
export const ZENDESK_TEMPLATE: AgentToolTemplate = {
  name: "Zendesk Integration",
  description: "Connect with Zendesk to manage customer support tickets and interactions",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "webhook",
  icon: "HeadphonesIcon",
  config: {
    service: "zendesk",
    apiVersion: "v2",
    resources: ["tickets", "users", "groups", "organizations"],
    operations: ["list", "show", "create", "update", "delete"],
    webhookEvents: ["ticket.created", "ticket.updated", "ticket.solved"],
    customFields: true,
    macros: true
  }
};

/**
 * All available templates
 */
export const TOOL_TEMPLATES: Record<string, AgentToolTemplate> = {
  // AI Models
  OPENAI_CHAT: OPENAI_CHAT_TEMPLATE,
  OPENAI_IMAGE: OPENAI_IMAGE_TEMPLATE,
  OPENAI_EMBEDDINGS: OPENAI_EMBEDDINGS_TEMPLATE,
  OPENAI_TRANSCRIPTION: OPENAI_TRANSCRIPTION_TEMPLATE,
  OPENAI_VISION: OPENAI_VISION_TEMPLATE,
  ANTHROPIC_CLAUDE: ANTHROPIC_CLAUDE_TEMPLATE,
  LLAMA: LLAMA_TEMPLATE,
  GEMINI: GEMINI_TEMPLATE,
  PERPLEXITY: PERPLEXITY_TEMPLATE,
  XAI: XAI_TEMPLATE,
  
  // Content Generation
  IMAGE_EDITOR: IMAGE_EDITOR_TEMPLATE,
  AUDIO_GENERATION: AUDIO_GENERATION_TEMPLATE,
  MODEL_3D: MODEL_3D_TEMPLATE,
  VOICE_GENERATOR: VOICE_GENERATOR_TEMPLATE,
  
  // Utilities
  CHATBOT_BUILDER: CHATBOT_BUILDER_TEMPLATE,
  WEB_SEARCH: WEB_SEARCH_TEMPLATE,
  EMAIL: EMAIL_TEMPLATE,
  SMS: SMS_TEMPLATE,
  
  // Data Processing
  DATABASE_QUERY: DATABASE_QUERY_TEMPLATE,
  DATA_ANALYSIS: DATA_ANALYSIS_TEMPLATE,
  CSV_PROCESSOR: CSV_PROCESSOR_TEMPLATE,
  PDF_PROCESSOR: PDF_PROCESSOR_TEMPLATE,
  DATA_VISUALIZER: DATA_VISUALIZER_TEMPLATE,
  VIDEO_ANALYSIS: VIDEO_ANALYSIS_TEMPLATE,
  SENTIMENT_ANALYSIS: SENTIMENT_ANALYSIS_TEMPLATE,
  
  // File Operations
  FILE_READER: FILE_READER_TEMPLATE,
  FILE_WRITER: FILE_WRITER_TEMPLATE,
  
  // Development Tools
  CODE_GENERATOR: CODE_GENERATOR_TEMPLATE,
  MATH_SOLVER: MATH_SOLVER_TEMPLATE,
  CUSTOM_API: CUSTOM_API_TEMPLATE,
  
  // Communication and Content
  TRANSLATION: TRANSLATION_TEMPLATE,
  DOCUMENT_SUMMARIZATION: DOCUMENT_SUMMARIZATION_TEMPLATE,
  SOCIAL_MEDIA_PUBLISHER: SOCIAL_MEDIA_PUBLISHER_TEMPLATE,
  
  // External Services
  WEATHER: WEATHER_TEMPLATE,
  NEWS: NEWS_TEMPLATE,
  CALENDAR: CALENDAR_TEMPLATE,
  
  // Enterprise Integrations
  SALESFORCE: SALESFORCE_TEMPLATE,
  SAP: SAP_TEMPLATE,
  DYNAMICS: DYNAMICS_TEMPLATE,
  ZENDESK: ZENDESK_TEMPLATE,
  ZAPIER: ZAPIER_TEMPLATE,
  SLACK: SLACK_TEMPLATE,
  GITHUB: GITHUB_TEMPLATE,
  WEBHOOK: WEBHOOK_TEMPLATE
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