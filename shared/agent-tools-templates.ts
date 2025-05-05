/**
 * Templates for common agent tools
 */
import { InsertAgentTool } from "./schema";

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
export const templateToInsertTool = (
  template: AgentToolTemplate,
): InsertAgentTool => {
  return {
    name: template.name,
    description: template.description,
    category: template.category,
    type: template.type,
    icon: template.icon,
    config: template.config,
    isActive: true,
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
  CUSTOM: "custom",
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
    systemPrompt: "You are a helpful AI assistant.",
  },
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
    style: "vivid",
  },
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
    dimensions: 1536,
  },
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
    temperature: 0,
  },
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
    detailLevel: "high",
  },
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
    includeSnippets: true,
  },
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
    template: "default",
  },
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
    template: "default",
  },
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
    readOnly: true,
  },
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
    operation: "read",
  },
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
    operation: "write",
  },
};

/**
 * Template for Slack Integration
 */
export const SLACK_TEMPLATE: AgentToolTemplate = {
  name: "Slack Messenger",
  description: "Send messages to Slack channels",
  category: TOOL_CATEGORIES.COMMUNICATION,
  type: "webhook",
  icon: "MessageSquare",
  config: {
    service: "slack",
    defaultChannel: "general",
    username: "AI Agent",
  },
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
    operations: ["list", "create", "update"],
  },
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
    headers: {},
  },
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
    maxRows: 10000,
  },
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
    maxPages: 100,
  },
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
    preserveFormatting: true,
  },
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
    forecastDays: 5,
  },
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
    maxResults: 10,
  },
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
    defaultCalendar: "primary",
  },
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
    format: "svg",
  },
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
    includeTests: false,
  },
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
    topics: ["algebra", "calculus", "statistics", "geometry", "linear-algebra"],
  },
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
      token: "{{token}}",
    },
    endpoints: [
      {
        name: "list_items",
        method: "GET",
        path: "/items",
        params: [],
      },
      {
        name: "get_item",
        method: "GET",
        path: "/items/{id}",
        params: ["id"],
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
            description: { type: "string" },
          },
        },
      },
    ],
  },
};

/**
 * Template for AI Video Analysis
 */
export const VIDEO_ANALYSIS_TEMPLATE: AgentToolTemplate = {
  name: "Video Analysis",
  description:
    "Analyze video content and extract insights, transcriptions, and scene descriptions",
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
    maxVideoDuration: 600, // 10 minutes
  },
};

/**
 * Template for AI Document Summarization
 */
export const DOCUMENT_SUMMARIZATION_TEMPLATE: AgentToolTemplate = {
  name: "Document Summarization",
  description:
    "Generate concise summaries of documents with key points and insights",
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
    includeActionItems: true,
  },
};

/**
 * Template for Sentiment Analysis
 */
export const SENTIMENT_ANALYSIS_TEMPLATE: AgentToolTemplate = {
  name: "Sentiment Analysis",
  description:
    "Analyze text to determine sentiment, emotional tone, and key themes",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "openai",
  icon: "HeartPulse",
  config: {
    model: "gpt-4o",
    detailLevel: "high",
    sentiment: true,
    emotions: true,
    themes: true,
    metrics: ["positivity", "negativity", "objectivity", "subjectivity"],
  },
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
    defaultFormat: "text",
  },
};

/**
 * Template for Voice Generator
 */
export const VOICE_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Voice Generator",
  description:
    "Convert text to realistic speech in various languages and voices",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Mic",
  config: {
    model: "tts-1",
    voice: "alloy", // alloy, echo, fable, onyx, nova, shimmer
    speed: 1.0,
    format: "mp3",
    quality: "standard", // standard, high
    languages: ["en", "es", "fr", "de", "it", "pt", "ja", "zh"],
  },
};

/**
 * Template for Anthropic Claude
 */
export const ANTHROPIC_CLAUDE_TEMPLATE: AgentToolTemplate = {
  name: "Anthropic Claude",
  description:
    "Generate responses using Anthropic's Claude model with its strengths in reasoning and safety",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "anthropic",
  icon: "MessagesSquare",
  config: {
    model: "claude-3-opus-20240229",
    temperature: 0.7,
    maxTokens: 4000,
    systemPrompt:
      "You are Claude, a helpful AI assistant created by Anthropic.",
  },
};

/**
 * Template for Llama Integration
 */
export const LLAMA_TEMPLATE: AgentToolTemplate = {
  name: "Llama AI",
  description:
    "Generate content using Meta's Llama open-source AI model with local processing capability",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "llama",
  icon: "Flame",
  config: {
    model: "llama-3-70b-instruct",
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: "You are a helpful assistant.",
    localInference: true,
    quantization: "8bit",
  },
};

/**
 * Template for Gemini Integration
 */
export const GEMINI_TEMPLATE: AgentToolTemplate = {
  name: "Google Gemini",
  description:
    "Generate multimodal content using Google's Gemini model with advanced reasoning capabilities",
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
      dangerous: "block_medium_and_above",
    },
  },
};

/**
 * Template for Image Editing
 */
export const IMAGE_EDITOR_TEMPLATE: AgentToolTemplate = {
  name: "AI Image Editor",
  description:
    "Edit and manipulate images using AI with operations like inpainting, outpainting, and style transfer",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "ImagePlus",
  config: {
    model: "dall-e-2",
    operations: [
      "inpaint",
      "outpaint",
      "variation",
      "remove-background",
      "enhance",
    ],
    quality: "hd",
    preserveOriginal: true,
    maxEdits: 10,
    editHistory: true,
    outputFormats: ["png", "jpg", "webp"],
  },
};

/**
 * Template for Perplexity AI
 */
export const PERPLEXITY_TEMPLATE: AgentToolTemplate = {
  name: "Perplexity AI",
  description:
    "Generate research-focused responses with built-in web search capabilities",
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
    systemPrompt:
      "You are a research assistant that provides thorough, accurate information with proper citations.",
  },
};

/**
 * Template for XAI Integration
 */
export const XAI_TEMPLATE: AgentToolTemplate = {
  name: "Grok by xAI",
  description:
    "Generate creative and conversational responses using xAI's Grok model",
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
    systemPrompt:
      "You are Grok, a superintelligent AI with a bit of wit and humor. You aim to be helpful, accurate, and engaging.",
  },
};

/**
 * Template for OpenRouter Integration
 */
export const OPENROUTER_TEMPLATE: AgentToolTemplate = {
  name: "OpenRouter AI",
  description:
    "Access hundreds of AI models from various providers through a single unified API",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openrouter",
  icon: "Network",
  config: {
    model: "openai/gpt-4o",
    temperature: 0.7,
    maxTokens: 2000,
    supportedProviders: ["openai", "anthropic", "mistral", "meta", "google"],
    systemPrompt:
      "You are a helpful AI assistant with access to a wide variety of models from different providers.",
  },
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
    genres: ["ambient", "electronic", "cinematic", "jazz", "rock", "classical"],
  },
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
    background: "transparent",
  },
};

/**
 * Template for Chatbot Builder
 */
export const CHATBOT_BUILDER_TEMPLATE: AgentToolTemplate = {
  name: "Chatbot Builder",
  description:
    "Create and deploy specialized conversational agents for specific domains",
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
    feedbackLoop: true,
  },
};

/**
 * Template for Salesforce Integration
 */
export const SALESFORCE_TEMPLATE: AgentToolTemplate = {
  name: "Salesforce Integration",
  description:
    "Connect with Salesforce CRM to manage leads, opportunities, and customer data",
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
    webhookEvents: ["created", "updated", "deleted"],
  },
};

/**
 * Template for SAP Integration
 */
export const SAP_TEMPLATE: AgentToolTemplate = {
  name: "SAP Integration",
  description:
    "Connect with SAP ERP systems to manage business processes and data",
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
    batchProcessing: true,
  },
};

/**
 * Template for Microsoft Dynamics Integration
 */
export const DYNAMICS_TEMPLATE: AgentToolTemplate = {
  name: "Microsoft Dynamics",
  description:
    "Connect with Microsoft Dynamics 365 to manage business applications and customer data",
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
    customEntities: true,
  },
};

/**
 * Template for Zendesk Integration
 */
export const ZENDESK_TEMPLATE: AgentToolTemplate = {
  name: "Zendesk Integration",
  description: "Manage customer support tickets and interactions via Zendesk",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "webhook",
  icon: "Headphones",
  config: {
    service: "zendesk",
    apiVersion: "v2",
    resources: ["tickets", "users", "organizations", "comments"],
    operations: ["list", "show", "create", "update"],
    searchEnabled: true,
    customFields: true,
    webhookEvents: ["ticket_created", "ticket_updated"],
  },
};

/**
 * Template for Zapier Integration
 */
export const ZAPIER_TEMPLATE: AgentToolTemplate = {
  name: "Zapier Integration",
  description:
    "Connect with thousands of apps through Zapier's automation platform",
  category: TOOL_CATEGORIES.INTEGRATIONS,
  type: "webhook",
  icon: "Zap",
  config: {
    service: "zapier",
    triggerEvents: true,
    actionEvents: true,
    filterSteps: true,
    customWebhooks: true,
    zapierApps: [
      "gmail",
      "slack",
      "trello",
      "asana",
      "googlesheets",
      "dropbox",
    ],
  },
};

/**
 * Template for Data Analysis
 */
export const DATA_ANALYSIS_TEMPLATE: AgentToolTemplate = {
  name: "Data Analysis",
  description:
    "Perform advanced data analysis, statistical modeling, and insights generation",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "custom",
  icon: "LineChart",
  config: {
    operations: ["descriptive", "inferential", "predictive", "prescriptive"],
    dataSources: ["csv", "database", "json", "api"],
    visualization: true,
    statisticalTests: true,
    machineLearningModels: ["regression", "classification", "clustering"],
    reportingFormat: ["json", "pdf", "html"],
  },
};

/**
 * Template for Meeting Scheduler
 */
export const MEETING_SCHEDULER_TEMPLATE: AgentToolTemplate = {
  name: "Meeting Scheduler",
  description: "Find available times and schedule meetings on calendars",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "custom_api",
  icon: "CalendarDays",
  config: {
    providers: ["google_calendar", "outlook_calendar"],
    findAvailability: true,
    createEvent: true,
    sendInvites: true,
    timeZoneSupport: true,
  },
};

/**
 * Template for Knowledge Base Q&A
 */
export const KB_QA_TEMPLATE: AgentToolTemplate = {
  name: "Knowledge Base Q&A",
  description: "Answer questions based on a provided knowledge base or documents",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "openai",
  icon: "BookOpen",
  config: {
    embeddingModel: "text-embedding-3-small",
    completionModel: "gpt-4o",
    knowledgeSource: "vector_db", // vector_db, file_upload
    maxResults: 3,
    minConfidence: 0.7,
  },
};

/**
 * Template for Code Review Assistant
 */
export const CODE_REVIEW_ASSISTANT_TEMPLATE: AgentToolTemplate = {
  name: "Code Review Assistant",
  description: "Analyze code changes for potential issues, style violations, and improvements",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "Code2",
  config: {
    model: "gpt-4o",
    languages: ["javascript", "python", "typescript", "java", "c#"],
    reviewAspects: ["bugs", "style", "performance", "security", "best_practices"],
    outputFormat: "comments", // comments, report
  },
};


/**
 * Template for Recipe Generator
 */
export const RECIPE_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Recipe Generator",
  description: "Generate recipes based on ingredients, dietary restrictions, or cuisine type",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "ChefHat",
  config: {
    model: "gpt-4o",
    includeInstructions: true,
    includeNutritionalInfo: false,
    difficultyLevel: "any", // easy, medium, hard
    maxPrepTime: 60, // minutes
  },
};

/**
 * Template for Job Description Writer
 */
export const JOB_DESC_WRITER_TEMPLATE: AgentToolTemplate = {
  name: "Job Description Writer",
  description: "Generate compelling job descriptions based on role requirements",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "ClipboardEdit",
  config: {
    model: "gpt-4o",
    tone: "professional", // professional, engaging, casual
    includeCompanyInfo: true,
    includeBenefits: true,
    optimizeForSEO: false,
  },
};

/**
 * Template for Financial Data Analysis
 */
export const FINANCE_DATA_ANALYSIS_TEMPLATE: AgentToolTemplate = {
  name: "Financial Data Analysis",
  description: "Analyze financial statements, market data, or investment portfolios",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "custom",
  icon: "TrendingUp",
  config: {
    dataSources: ["stock_api", "csv", "database"],
    analysisTypes: ["ratio_analysis", "trend_analysis", "forecasting", "portfolio_optimization"],
    reporting: true,
    visualization: true,
  },
};

/**
 * Template for Legal Document Review
 */
export const LEGAL_DOC_REVIEW_TEMPLATE: AgentToolTemplate = {
  name: "Legal Document Review",
  description: "Review legal documents for key clauses, risks, or summaries (Use with caution!)",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "openai",
  icon: "Gavel",
  config: {
    model: "gpt-4o",
    reviewFocus: ["key_clauses", "potential_risks", "obligations", "summary"],
    disclaimer: "This tool provides preliminary analysis and is not a substitute for professional legal advice.",
    outputFormat: "report",
  },
};

/**
 * Template for Customer Feedback Analyzer
 */
export const FEEDBACK_ANALYZER_TEMPLATE: AgentToolTemplate = {
  name: "Customer Feedback Analyzer",
  description: "Analyze customer reviews, surveys, or support tickets for trends and insights",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "openai",
  icon: "Star",
  config: {
    model: "gpt-4o",
    sentimentAnalysis: true,
    topicExtraction: true,
    trendDetection: true,
    reporting: true,
    sourceTypes: ["reviews", "surveys", "tickets", "social_media"],
  },
};

/**
 * Template for Real Estate Market Analysis
 */
export const REAL_ESTATE_ANALYSIS_TEMPLATE: AgentToolTemplate = {
  name: "Real Estate Market Analysis",
  description: "Analyze property listings, market trends, and investment potential",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "search",
  icon: "Home",
  config: {
    searchEngine: "google",
    realEstateApi: "{{realEstateApiKey}}", // Placeholder
    analysisTypes: ["comparative_market_analysis", "rental_yield", "appreciation_forecast"],
    locationFocus: true,
    propertyTypes: ["residential", "commercial"],
  },
};

/**
 * Template for Personalized Learning Path Generator
 */
export const LEARNING_PATH_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Learning Path Generator",
  description: "Create customized learning plans based on goals, current knowledge, and learning style",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "GraduationCap",
  config: {
    model: "gpt-4o",
    resourceTypes: ["articles", "videos", "courses", "books", "projects"],
    includeTimeline: true,
    assessmentMethods: ["quizzes", "projects"],
    adaptive: false, // Future potential for adaptive learning
  },
};

/**
 * Template for Event Planning Assistant
 */
export const EVENT_PLANNER_TEMPLATE: AgentToolTemplate = {
  name: "Event Planning Assistant",
  description: "Assist with planning events, managing vendors, creating schedules, and tracking budgets",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "custom",
  icon: "CalendarCheck",
  config: {
    tasks: ["venue_search", "vendor_management", "budget_tracking", "schedule_creation", "guest_list"],
    integrations: ["calendar", "email", "sheets"], // Potential integrations
    budgeting: true,
    timelineManagement: true,
  },
};

/**
 * Template for Health & Fitness Tracker
 */
export const HEALTH_FITNESS_TRACKER_TEMPLATE: AgentToolTemplate = {
  name: "Health & Fitness Tracker",
  description: "Log workouts, track nutrition, monitor progress, and provide insights",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "custom",
  icon: "HeartPulse", // Reusing icon, consider ActivitySquare
  config: {
    tracking: ["workouts", "nutrition", "sleep", "weight", "measurements"],
    goalSetting: true,
    reporting: true,
    integrations: ["apple_health", "google_fit"], // Potential
    disclaimer: "This tool is for informational purposes only and not medical advice.",
  },
};

/**
 * Template for Product Description Generator
 */
export const PRODUCT_DESC_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Product Description Generator",
  description: "Generate engaging and persuasive descriptions for e-commerce products",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "ShoppingCart",
  config: {
    model: "gpt-4o",
    targetAudience: "general",
    keyFeaturesCount: 5,
    tone: "persuasive", // persuasive, informative, playful
    outputLength: "medium", // short, medium, long
    seoKeywords: [],
  },
};

/**
 * Template for Code Debugger Assistant
 */
export const CODE_DEBUGGER_TEMPLATE: AgentToolTemplate = {
  name: "Code Debugger Assistant",
  description: "Help identify and suggest fixes for bugs in code snippets",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "Bug",
  config: {
    model: "gpt-4o",
    languages: ["javascript", "python", "typescript", "java", "c#", "php"],
    provideExplanation: true,
    suggestFixes: true,
    analyzeStackTraces: true,
  },
};

/**
 * Template for Email Classifier/Organizer
 */
export const EMAIL_CLASSIFIER_TEMPLATE: AgentToolTemplate = {
  name: "Email Classifier",
  description: "Automatically categorize incoming emails based on content or sender",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "MailOpen",
  config: {
    model: "gpt-4o", // Or a cheaper/faster model if sufficient
    categories: ["important", "spam", "promotions", "social", "work", "personal"],
    integration: "api", // Needs integration with email provider API
    autoLabeling: true,
    autoFiltering: false,
  },
};

/**
 * Template for News Aggregator & Summarizer
 */
export const NEWS_AGGREGATOR_TEMPLATE: AgentToolTemplate = {
  name: "News Aggregator & Summarizer",
  description: "Fetch news articles from specified sources or topics and provide summaries",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "search",
  icon: "Newspaper",
  config: {
    searchEngine: "google_news", // Or specific News API
    summarizationModel: "gpt-4o-mini",
    topics: [],
    sources: [],
    summaryLength: "short",
    maxArticles: 10,
  },
};

/**
 * Template for Competitor Analysis Tool
 */
export const COMPETITOR_ANALYSIS_TEMPLATE: AgentToolTemplate = {
  name: "Competitor Analysis",
  description: "Research competitors, analyze their web presence, products, and pricing",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "search",
  icon: "Users",
  config: {
    searchEngine: "google",
    analysisAspects: ["website", "products", "pricing", "social_media", "reviews", "seo"],
    reporting: true,
    maxCompetitors: 5,
  },
};

/**
 * Template for Grant Proposal Writer Assistant
 */
export const GRANT_PROPOSAL_ASSISTANT_TEMPLATE: AgentToolTemplate = {
  name: "Grant Proposal Assistant",
  description: "Assist in drafting sections of grant proposals based on requirements",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Award",
  config: {
    model: "gpt-4o",
    sections: ["introduction", "problem_statement", "project_description", "budget_narrative", "evaluation_plan"],
    tone: "formal",
    inputRequirements: true, // Requires grant guidelines as input
  },
};


/**
 * Template for Language Learning Partner
 */
export const LANGUAGE_LEARNING_PARTNER_TEMPLATE: AgentToolTemplate = {
  name: "Language Learning Partner",
  description: "Practice conversation, get grammar explanations, and vocabulary help",
  category: TOOL_CATEGORIES.COMMUNICATION,
  type: "openai",
  icon: "Languages",
  config: {
    model: "gpt-4o",
    targetLanguage: "es", // Example: Spanish
    features: ["conversation_practice", "grammar_check", "translation", "vocabulary_builder"],
    difficultyLevel: "intermediate", // beginner, intermediate, advanced
    rolePlayScenarios: true,
  },
};

/**
 * Template for Technical Documentation Writer
 */
export const TECH_DOC_WRITER_TEMPLATE: AgentToolTemplate = {
  name: "Technical Documentation Writer",
  description: "Generate technical documentation, API references, or tutorials from code or descriptions",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "BookText",
  config: {
    model: "gpt-4o",
    docType: ["api_reference", "tutorial", "user_guide", "readme"],
    inputSource: ["code", "description"],
    outputFormat: "markdown",
    includeCodeExamples: true,
  },
};

/**
 * Template for Brainstorming Assistant
 */
export const BRAINSTORMING_ASSISTANT_TEMPLATE: AgentToolTemplate = {
  name: "Brainstorming Assistant",
  description: "Generate ideas for various topics, projects, or creative endeavors",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Lightbulb",
  config: {
    model: "gpt-4o",
    technique: "free_association", // free_association, mind_mapping, scamper
    numberOfIdeas: 10,
    constraints: [], // Optional constraints
    categorizeIdeas: true,
  },
};

/**
 * Template for Fact-Checking Assistant
 */
export const FACT_CHECKING_ASSISTANT_TEMPLATE: AgentToolTemplate = {
  name: "Fact-Checking Assistant",
  description: "Verify claims or statements using web search and provide sources",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "search",
  icon: "CheckSquare",
  config: {
    searchEngine: "google",
    provideSources: true,
    assessConfidence: true,
    maxSources: 3,
  },
};

/**
 * Template for Personalized Newsletter Generator
 */
export const NEWSLETTER_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Personalized Newsletter Generator",
  description: "Create personalized newsletters based on user interests and recent content",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "custom",
  icon: "Mail", // Reusing icon
  config: {
    contentSources: ["rss", "api", "web_scrape"],
    personalizationModel: "gpt-4o-mini",
    templateEngine: "handlebars", // Example
    scheduling: true,
    analytics: true,
  },
};

/**
 * Template for Code Review Assistant
 */
export const CODE_REVIEW_TEMPLATE: AgentToolTemplate = {
  name: "Code Review Assistant",
  description: "Analyze code for potential issues, style inconsistencies, and improvements",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "CodeXml",
  config: {
    model: "gpt-4o",
    temperature: 0.3,
    systemPrompt: "You are an expert code reviewer. Analyze the provided code snippet for bugs, style issues, performance concerns, and suggest improvements.",
    maxTokens: 1500,
  },
};

/**
 * Template for Meeting Summarizer
 */
export const MEETING_SUMMARIZER_TEMPLATE: AgentToolTemplate = {
  name: "Meeting Summarizer",
  description: "Generate concise summaries, action items, and key decisions from meeting transcripts",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "ClipboardList",
  config: {
    model: "gpt-4o",
    temperature: 0.5,
    systemPrompt: "Summarize the meeting transcript, identify key decisions, and list action items with owners if mentioned.",
    maxTokens: 1000,
  },
};

/**
 * Template for Grammar and Style Checker
 */
export const GRAMMAR_STYLE_CHECKER_TEMPLATE: AgentToolTemplate = {
  name: "Grammar & Style Checker",
  description: "Correct grammar, spelling, punctuation, and improve writing style",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "SpellCheck",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Proofread the following text for grammar, spelling, punctuation errors, and suggest improvements for clarity and style.",
    maxTokens: 1000,
  },
};

/**
 * Template for Idea Generator
 */
export const IDEA_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Idea Generator",
  description: "Brainstorm ideas for various topics like marketing campaigns, blog posts, or product features",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Lightbulb",
  config: {
    model: "gpt-4o",
    temperature: 0.9,
    systemPrompt: "Generate creative and diverse ideas based on the provided topic or problem.",
    maxTokens: 1500,
  },
};

/**
 * Template for Social Media Post Crafter
 */
export const SOCIAL_POST_CRAFTER_TEMPLATE: AgentToolTemplate = {
  name: "Social Media Post Crafter",
  description: "Create engaging posts for platforms like Twitter, LinkedIn, Facebook, Instagram",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Share",
  config: {
    model: "gpt-4o",
    temperature: 0.8,
    systemPrompt: "Generate social media posts tailored for the specified platform and audience, based on the given topic or goal. Include relevant hashtags.",
    maxTokens: 500,
  },
};

/**
 * Template for Email Responder
 */
export const EMAIL_RESPONDER_TEMPLATE: AgentToolTemplate = {
  name: "Email Responder",
  description: "Draft professional email replies based on context and desired tone",
  category: TOOL_CATEGORIES.COMMUNICATION,
  type: "openai",
  icon: "MailReply",
  config: {
    model: "gpt-4o",
    temperature: 0.6,
    systemPrompt: "Draft a professional email reply based on the provided email content and instructions. Adapt the tone as specified (e.g., formal, friendly, apologetic).",
    maxTokens: 800,
  },
};

/**
 * Template for Content Rewriter/Paraphraser
 */
export const CONTENT_REWRITER_TEMPLATE: AgentToolTemplate = {
  name: "Content Rewriter",
  description: "Paraphrase or rewrite existing text to avoid plagiarism or change the tone/style",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "RefreshCw",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Rewrite the provided text while preserving the core meaning. Adapt the style or tone as requested (e.g., simplify, make more formal, make more engaging).",
    maxTokens: 1500,
  },
};

/**
 * Template for FAQ Generator
 */
export const FAQ_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "FAQ Generator",
  description: "Create frequently asked questions and answers based on a document or topic",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "HelpCircle",
  config: {
    model: "gpt-4o",
    temperature: 0.6,
    systemPrompt: "Generate a list of frequently asked questions (FAQs) and their corresponding answers based on the provided document or topic.",
    maxTokens: 1500,
  },
};

/**
 * Template for Product Description Writer
 */
export const PRODUCT_DESCRIPTION_WRITER_TEMPLATE: AgentToolTemplate = {
  name: "Product Description Writer",
  description: "Generate compelling product descriptions for e-commerce sites",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "ShoppingCart",
  config: {
    model: "gpt-4o",
    temperature: 0.8,
    systemPrompt: "Write an engaging and persuasive product description based on the provided product features and target audience. Highlight key benefits.",
    maxTokens: 800,
  },
};

/**
 * Template for Blog Post Outline Generator
 */
export const BLOG_OUTLINE_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Blog Post Outline Generator",
  description: "Create a structured outline for a blog post on a given topic",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "List",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Generate a detailed and logical outline for a blog post on the given topic, including sections, sub-sections, and key points to cover.",
    maxTokens: 1000,
  },
};

/**
 * Template for Resume Enhancer
 */
export const RESUME_ENHANCER_TEMPLATE: AgentToolTemplate = {
  name: "Resume Enhancer",
  description: "Improve resume content, structure, and wording for specific job applications",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "FileText",
  config: {
    model: "gpt-4o",
    temperature: 0.5,
    systemPrompt: "Review the provided resume section and job description. Suggest improvements to tailor the resume for the specific role, focusing on action verbs, quantifiable achievements, and relevant keywords.",
    maxTokens: 1000,
  },
};

/**
 * Template for Cover Letter Generator
 */
export const COVER_LETTER_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Cover Letter Generator",
  description: "Draft personalized cover letters based on resume and job description",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "FileSignature",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Generate a compelling cover letter based on the provided resume and job description. Highlight relevant skills and experiences, express enthusiasm for the role, and tailor it to the company.",
    maxTokens: 800,
  },
};

/**
 * Template for Learning Assistant
 */
export const LEARNING_ASSISTANT_TEMPLATE: AgentToolTemplate = {
  name: "Learning Assistant",
  description: "Explain complex topics, answer questions, and provide learning resources",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "openai",
  icon: "GraduationCap",
  config: {
    model: "gpt-4o",
    temperature: 0.6,
    systemPrompt: "You are a helpful learning assistant. Explain the provided topic clearly and concisely. Answer follow-up questions and suggest relevant learning resources if appropriate.",
    maxTokens: 1500,
  },
};

/**
 * Template for Travel Planner
 */
export const TRAVEL_PLANNER_TEMPLATE: AgentToolTemplate = {
  name: "Travel Planner",
  description: "Generate travel itineraries, suggest activities, and find information about destinations",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai", // Could also integrate with travel APIs
  icon: "Plane",
  config: {
    model: "gpt-4o",
    temperature: 0.8,
    systemPrompt: "Create a travel itinerary based on the destination, duration, interests, and budget provided. Suggest activities, attractions, and dining options. Provide helpful travel tips.",
    maxTokens: 2000,
  },
};

/**
 * Template for Fitness Planner
 */
export const FITNESS_PLANNER_TEMPLATE: AgentToolTemplate = {
  name: "Fitness Planner",
  description: "Create personalized workout plans and provide fitness advice",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "Dumbbell",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Generate a fitness plan based on the user's goals, fitness level, available equipment, and time commitment. Provide exercise instructions and general fitness advice. Disclaimer: Consult a professional before starting any new fitness program.",
    maxTokens: 1500,
  },
};

/**
 * Template for Financial Explainer
 */
export const FINANCIAL_EXPLAINER_TEMPLATE: AgentToolTemplate = {
  name: "Financial Explainer",
  description: "Explain financial concepts, terms, and investment strategies",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "openai",
  icon: "Landmark",
  config: {
    model: "gpt-4o",
    temperature: 0.5,
    systemPrompt: "Explain the provided financial concept, term, or strategy in simple and understandable terms. Disclaimer: This is not financial advice. Consult a qualified financial advisor for personalized guidance.",
    maxTokens: 1000,
  },
};

/**
 * Template for Code Explainer
 */
export const CODE_EXPLAINER_TEMPLATE: AgentToolTemplate = {
  name: "Code Explainer",
  description: "Explain code snippets in plain language",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "FileCode",
  config: {
    model: "gpt-4o",
    temperature: 0.4,
    systemPrompt: "Explain the provided code snippet step-by-step in plain English. Describe its purpose, logic, and how it works.",
    maxTokens: 1000,
  },
};

/**
 * Template for Regex Generator
 */
export const REGEX_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Regex Generator",
  description: "Generate regular expressions based on pattern descriptions",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "Regex",
  config: {
    model: "gpt-4o",
    temperature: 0.3,
    systemPrompt: "Generate a regular expression (regex) based on the provided description of the pattern to match. Explain the generated regex.",
    maxTokens: 500,
  },
};

/**
 * Template for SQL Query Generator
 */
export const SQL_QUERY_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "SQL Query Generator",
  description: "Generate SQL queries based on natural language descriptions",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "Database",
  config: {
    model: "gpt-4o",
    temperature: 0.3,
    systemPrompt: "Generate a SQL query based on the provided natural language request and database schema information (if provided). Assume standard SQL syntax unless specified otherwise.",
    maxTokens: 1000,
  },
};

/**
 * Template for Unit Test Generator
 */
export const UNIT_TEST_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Unit Test Generator",
  description: "Generate unit tests for code snippets in various languages",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "TestTube",
  config: {
    model: "gpt-4o",
    temperature: 0.5,
    systemPrompt: "Generate unit tests for the provided code snippet in the specified language and testing framework. Cover common cases and edge cases.",
    maxTokens: 1500,
  },
};

/**
 * Template for API Documentation Writer
 */
export const API_DOC_WRITER_TEMPLATE: AgentToolTemplate = {
  name: "API Documentation Writer",
  description: "Generate documentation for API endpoints based on code or descriptions",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "BookText",
  config: {
    model: "gpt-4o",
    temperature: 0.6,
    systemPrompt: "Generate documentation for the provided API endpoint(s). Include description, parameters (path, query, body), request/response examples, and potential error codes. Use standard formats like OpenAPI/Swagger where appropriate.",
    maxTokens: 1500,
  },
};

/**
 * Template for Data Transformation Helper
 */
export const DATA_TRANSFORM_HELPER_TEMPLATE: AgentToolTemplate = {
  name: "Data Transformation Helper",
  description: "Suggest ways to clean, transform, or restructure data",
  category: TOOL_CATEGORIES.DATA_PROCESSING,
  type: "openai",
  icon: "TableProperties",
  config: {
    model: "gpt-4o",
    temperature: 0.5,
    systemPrompt: "Analyze the provided data sample or description. Suggest steps or code (e.g., Python/Pandas, SQL) to clean, transform, or restructure the data based on the desired outcome.",
    maxTokens: 1500,
  },
};

/**
 * Template for Spreadsheet Formula Generator
 */
export const SPREADSHEET_FORMULA_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Spreadsheet Formula Generator",
  description: "Generate formulas for Excel or Google Sheets based on descriptions",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "Sheet",
  config: {
    model: "gpt-4o",
    temperature: 0.4,
    systemPrompt: "Generate a spreadsheet formula (for Excel or Google Sheets, specify if needed) based on the provided description of the desired calculation or data manipulation. Explain the formula.",
    maxTokens: 500,
  },
};

/**
 * Template for Presentation Content Generator
 */
export const PRESENTATION_CONTENT_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Presentation Content Generator",
  description: "Generate content outlines and key points for presentation slides",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Presentation",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Generate content for a presentation based on the provided topic, audience, and desired number of slides. Create a title, outline, and key bullet points for each slide.",
    maxTokens: 2000,
  },
};

/**
 * Template for Story Generator
 */
export const STORY_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Story Generator",
  description: "Generate short stories or plot ideas based on prompts",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "BookOpen",
  config: {
    model: "gpt-4o",
    temperature: 0.9,
    systemPrompt: "Write a short story or develop plot ideas based on the provided prompt, genre, characters, or setting.",
    maxTokens: 2000,
  },
};

/**
 * Template for Poem Generator
 */
export const POEM_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Poem Generator",
  description: "Generate poems in various styles and forms",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Feather",
  config: {
    model: "gpt-4o",
    temperature: 0.8,
    systemPrompt: "Write a poem based on the provided theme, style, form (e.g., sonnet, haiku), or mood.",
    maxTokens: 500,
  },
};

/**
 * Template for Song Lyrics Generator
 */
export const LYRICS_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Song Lyrics Generator",
  description: "Generate song lyrics based on genre, theme, or mood",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Music2",
  config: {
    model: "gpt-4o",
    temperature: 0.8,
    systemPrompt: "Write song lyrics based on the provided genre, theme, mood, or story. Include verses, chorus, and potentially a bridge.",
    maxTokens: 1000,
  },
};

/**
 * Template for Scriptwriting Assistant
 */
export const SCRIPTWRITING_ASSISTANT_TEMPLATE: AgentToolTemplate = {
  name: "Scriptwriting Assistant",
  description: "Help write dialogue, scene descriptions, or plot points for scripts",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Clapperboard",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Assist with scriptwriting. Generate dialogue between characters, write scene descriptions, or brainstorm plot points based on the provided context and requirements.",
    maxTokens: 1500,
  },
};

/**
 * Template for Legal Document Explainer
 */
export const LEGAL_DOC_EXPLAINER_TEMPLATE: AgentToolTemplate = {
  name: "Legal Document Explainer",
  description: "Explain clauses or sections of legal documents in simpler terms (Not legal advice)",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "openai",
  icon: "Gavel",
  config: {
    model: "gpt-4o",
    temperature: 0.4,
    systemPrompt: "Explain the provided legal clause or document section in plain language. Disclaimer: This is for informational purposes only and does not constitute legal advice. Consult a qualified legal professional.",
    maxTokens: 1000,
  },
};

/**
 * Template for Medical Information Summarizer
 */
export const MEDICAL_INFO_SUMMARIZER_TEMPLATE: AgentToolTemplate = {
  name: "Medical Information Summarizer",
  description: "Summarize medical articles or information for easier understanding (Not medical advice)",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "openai",
  icon: "Stethoscope",
  config: {
    model: "gpt-4o",
    temperature: 0.5,
    systemPrompt: "Summarize the provided medical article or information in simpler terms. Disclaimer: This is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.",
    maxTokens: 1000,
  },
};

/**
 * Template for Historical Event Explainer
 */
export const HISTORY_EXPLAINER_TEMPLATE: AgentToolTemplate = {
  name: "Historical Event Explainer",
  description: "Provide summaries and context for historical events",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "openai",
  icon: "ScrollText",
  config: {
    model: "gpt-4o",
    temperature: 0.6,
    systemPrompt: "Provide a concise summary and context for the specified historical event. Include key dates, figures, causes, and consequences.",
    maxTokens: 1500,
  },
};

/**
 * Template for Scientific Concept Explainer
 */
export const SCIENCE_EXPLAINER_TEMPLATE: AgentToolTemplate = {
  name: "Scientific Concept Explainer",
  description: "Explain complex scientific concepts in an accessible way",
  category: TOOL_CATEGORIES.KNOWLEDGE,
  type: "openai",
  icon: "FlaskConical",
  config: {
    model: "gpt-4o",
    temperature: 0.5,
    systemPrompt: "Explain the provided scientific concept in a clear, accurate, and accessible way. Use analogies if helpful.",
    maxTokens: 1500,
  },
};

/**
 * Template for Market Research Assistant
 */
export const MARKET_RESEARCH_ASSISTANT_TEMPLATE: AgentToolTemplate = {
  name: "Market Research Assistant",
  description: "Gather information about market trends, competitors, and customer demographics",
  category: TOOL_CATEGORIES.KNOWLEDGE, // Could also use Web Search
  type: "openai",
  icon: "Target",
  config: {
    model: "gpt-4o",
    temperature: 0.6,
    systemPrompt: "Provide information on market trends, key competitors, or customer demographics for the specified industry or product. Use general knowledge up to your last update.",
    maxTokens: 1500,
  },
};

/**
 * Template for SWOT Analysis Generator
 */
export const SWOT_ANALYSIS_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "SWOT Analysis Generator",
  description: "Generate a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for a business or project",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "LayoutGrid",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Generate a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) based on the provided description of a business, product, or project.",
    maxTokens: 1000,
  },
};

/**
 * Template for Business Plan Section Writer
 */
export const BUSINESS_PLAN_WRITER_TEMPLATE: AgentToolTemplate = {
  name: "Business Plan Section Writer",
  description: "Draft sections of a business plan, like executive summary or market analysis",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Briefcase",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Draft a specific section of a business plan (e.g., Executive Summary, Market Analysis, Marketing Strategy) based on the provided information and context.",
    maxTokens: 1500,
  },
};

/**
 * Template for Press Release Generator
 */
export const PRESS_RELEASE_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Press Release Generator",
  description: "Write press releases for announcements or events",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "Newspaper",
  config: {
    model: "gpt-4o",
    temperature: 0.6,
    systemPrompt: "Write a professional press release based on the provided announcement details (what, who, when, where, why). Follow standard press release format.",
    maxTokens: 800,
  },
};

/**
 * Template for Job Description Writer
 */
export const JOB_DESCRIPTION_WRITER_TEMPLATE: AgentToolTemplate = {
  name: "Job Description Writer",
  description: "Create clear and attractive job descriptions",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "UserPlus",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Write a clear, concise, and appealing job description based on the provided role requirements, responsibilities, and company information. Include necessary qualifications and desired skills.",
    maxTokens: 1000,
  },
};

/**
 * Template for Interview Question Generator
 */
export const INTERVIEW_QUESTION_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Interview Question Generator",
  description: "Generate interview questions for specific roles or skills",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "MessagesSquare",
  config: {
    model: "gpt-4o",
    temperature: 0.6,
    systemPrompt: "Generate a list of relevant interview questions (behavioral, technical, situational) for the specified job role and required skills.",
    maxTokens: 1000,
  },
};

/**
 * Template for Performance Review Helper
 */
export const PERFORMANCE_REVIEW_HELPER_TEMPLATE: AgentToolTemplate = {
  name: "Performance Review Helper",
  description: "Help draft performance review comments based on achievements and areas for improvement",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "Star",
  config: {
    model: "gpt-4o",
    temperature: 0.5,
    systemPrompt: "Help draft constructive performance review comments. Based on the provided achievements, goals, and areas for development, generate balanced feedback focusing on specific examples.",
    maxTokens: 1000,
  },
};

/**
 * Template for Customer Support Response Generator
 */
export const SUPPORT_RESPONSE_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Customer Support Response Generator",
  description: "Draft empathetic and helpful responses to customer support inquiries",
  category: TOOL_CATEGORIES.COMMUNICATION,
  type: "openai",
  icon: "LifeBuoy",
  config: {
    model: "gpt-4o",
    temperature: 0.6,
    systemPrompt: "Draft a helpful and empathetic customer support response based on the provided customer inquiry and relevant context. Address the customer's issue clearly and provide solutions or next steps.",
    maxTokens: 800,
  },
};

/**
 * Template for User Persona Generator
 */
export const USER_PERSONA_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "User Persona Generator",
  description: "Create fictional user personas based on target audience descriptions",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "UserCircle",
  config: {
    model: "gpt-4o",
    temperature: 0.8,
    systemPrompt: "Generate a detailed user persona based on the provided target audience description. Include demographics, goals, motivations, frustrations, and a brief bio.",
    maxTokens: 1000,
  },
};

/**
 * Template for A/B Test Idea Generator
 */
export const AB_TEST_IDEA_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "A/B Test Idea Generator",
  description: "Suggest A/B testing ideas for websites, emails, or app features",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "Split",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Generate A/B testing ideas for the specified webpage element, email campaign, or app feature. For each idea, state the hypothesis and the metric to measure.",
    maxTokens: 1000,
  },
};

/**
 * Template for Risk Assessment Helper
 */
export const RISK_ASSESSMENT_HELPER_TEMPLATE: AgentToolTemplate = {
  name: "Risk Assessment Helper",
  description: "Identify potential risks for a project or business initiative",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "ShieldAlert",
  config: {
    model: "gpt-4o",
    temperature: 0.6,
    systemPrompt: "Identify potential risks (e.g., technical, financial, operational, market) associated with the described project or business initiative. Suggest potential mitigation strategies.",
    maxTokens: 1500,
  },
};

/**
 * Template for Decision Making Framework Helper
 */
export const DECISION_FRAMEWORK_HELPER_TEMPLATE: AgentToolTemplate = {
  name: "Decision Making Framework Helper",
  description: "Apply decision-making frameworks (e.g., Pros/Cons, SWOT, Cost-Benefit) to a situation",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "Scale",
  config: {
    model: "gpt-4o",
    temperature: 0.5,
    systemPrompt: "Help analyze a decision using a specified framework (e.g., Pros and Cons, Cost-Benefit Analysis, SWOT). Based on the provided situation and options, structure the analysis according to the framework.",
    maxTokens: 1500,
  },
};

/**
 * Template for Negotiation Point Generator
 */
export const NEGOTIATION_POINT_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Negotiation Point Generator",
  description: "Brainstorm arguments and counter-arguments for a negotiation",
  category: TOOL_CATEGORIES.UTILITIES,
  type: "openai",
  icon: "Handshake",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Generate potential arguments, counter-arguments, and negotiation points for the described scenario. Consider different perspectives and potential compromises.",
    maxTokens: 1500,
  },
};

/**
 * Template for Creative Writing Prompt Generator
 */
export const WRITING_PROMPT_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Creative Writing Prompt Generator",
  description: "Generate prompts to inspire creative writing",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "PenTool",
  config: {
    model: "gpt-4o",
    temperature: 0.9,
    systemPrompt: "Generate creative writing prompts based on the specified genre, theme, or constraints (e.g., first line, specific object).",
    maxTokens: 500,
  },
};

/**
 * Template for Language Style Transfer
 */
export const STYLE_TRANSFER_TEMPLATE: AgentToolTemplate = {
  name: "Language Style Transfer",
  description: "Rewrite text in a different style (e.g., formal to informal, technical to simple)",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "SwitchCamera",
  config: {
    model: "gpt-4o",
    temperature: 0.7,
    systemPrompt: "Rewrite the provided text in the specified target style (e.g., formal, informal, simple, technical, persuasive, humorous) while preserving the core message.",
    maxTokens: 1000,
  },
};

/**
 * Template for Analogy Generator
 */
export const ANALOGY_GENERATOR_TEMPLATE: AgentToolTemplate = {
  name: "Analogy Generator",
  description: "Generate analogies to explain complex concepts",
  category: TOOL_CATEGORIES.CONTENT_GENERATION,
  type: "openai",
  icon: "LightbulbFilament",
  config: {
    model: "gpt-4o",
    temperature: 0.8,
    systemPrompt: "Generate one or more analogies to help explain the provided complex concept in simpler, more relatable terms.",
    maxTokens: 500,
  },
};

/**
 * All available templates
 */
export const TOOL_TEMPLATES: Record<string, AgentToolTemplate> = {
  // AI Models & Core Generation
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
  VOICE_GENERATOR: VOICE_GENERATOR_TEMPLATE,
  CODE_GENERATOR: CODE_GENERATOR_TEMPLATE,
  TRANSLATION: TRANSLATION_TEMPLATE,
  DOCUMENT_SUMMARIZATION: DOCUMENT_SUMMARIZATION_TEMPLATE,
  RECIPE_GENERATOR: RECIPE_GENERATOR_TEMPLATE,
  JOB_DESC_WRITER: JOB_DESC_WRITER_TEMPLATE,
  PRODUCT_DESC_GENERATOR: PRODUCT_DESC_GENERATOR_TEMPLATE,
  GRANT_PROPOSAL_ASSISTANT: GRANT_PROPOSAL_ASSISTANT_TEMPLATE,
  SCRIPTWRITING_ASSISTANT: SCRIPTWRITING_ASSISTANT_TEMPLATE,
  TECH_DOC_WRITER: TECH_DOC_WRITER_TEMPLATE,
  BRAINSTORMING_ASSISTANT: BRAINSTORMING_ASSISTANT_TEMPLATE,
  NEWSLETTER_GENERATOR: NEWSLETTER_GENERATOR_TEMPLATE,

  // Data Processing & Analysis
  DATA_ANALYSIS: DATA_ANALYSIS_TEMPLATE,
  CSV_PROCESSOR: CSV_PROCESSOR_TEMPLATE,
  PDF_PROCESSOR: PDF_PROCESSOR_TEMPLATE,
  DATA_VISUALIZER: DATA_VISUALIZER_TEMPLATE,
  VIDEO_ANALYSIS: VIDEO_ANALYSIS_TEMPLATE,
  SENTIMENT_ANALYSIS: SENTIMENT_ANALYSIS_TEMPLATE,
  FINANCE_DATA_ANALYSIS: FINANCE_DATA_ANALYSIS_TEMPLATE,
  LEGAL_DOC_REVIEW: LEGAL_DOC_REVIEW_TEMPLATE,
  FEEDBACK_ANALYZER: FEEDBACK_ANALYZER_TEMPLATE,
  REAL_ESTATE_ANALYSIS: REAL_ESTATE_ANALYSIS_TEMPLATE,
  EMAIL_CLASSIFIER: EMAIL_CLASSIFIER_TEMPLATE,

  // Knowledge & Search
  WEB_SEARCH: WEB_SEARCH_TEMPLATE,
  NEWS: NEWS_TEMPLATE, // Assuming NEWS_TEMPLATE exists
  KB_QA_TEMPLATE: KB_QA_TEMPLATE,
  COMPETITOR_ANALYSIS: COMPETITOR_ANALYSIS_TEMPLATE,
  FACT_CHECKING_ASSISTANT: FACT_CHECKING_ASSISTANT_TEMPLATE,
  NEWS_AGGREGATOR: NEWS_AGGREGATOR_TEMPLATE,

  // Utilities & Communication
  EMAIL: EMAIL_TEMPLATE,
  SMS: SMS_TEMPLATE,
  MATH_SOLVER: MATH_SOLVER_TEMPLATE,
  CALENDAR: CALENDAR_TEMPLATE, // Assuming CALENDAR_TEMPLATE exists
  WEATHER: WEATHER_TEMPLATE, // Assuming WEATHER_TEMPLATE exists
  FILE_READER: FILE_READER_TEMPLATE,
  FILE_WRITER: FILE_WRITER_TEMPLATE,
  CHATBOT_BUILDER: CHATBOT_BUILDER_TEMPLATE,
  MEETING_SCHEDULER: MEETING_SCHEDULER_TEMPLATE,
  CODE_REVIEW_ASSISTANT: CODE_REVIEW_ASSISTANT_TEMPLATE,
  TRAVEL_PLANNER: TRAVEL_PLANNER_TEMPLATE,
  EVENT_PLANNER: EVENT_PLANNER_TEMPLATE,
  HEALTH_FITNESS_TRACKER: HEALTH_FITNESS_TRACKER_TEMPLATE,
  CODE_DEBUGGER: CODE_DEBUGGER_TEMPLATE,
  LANGUAGE_LEARNING_PARTNER: LANGUAGE_LEARNING_PARTNER_TEMPLATE,
  LEARNING_PATH_GENERATOR: LEARNING_PATH_GENERATOR_TEMPLATE,

  // Integrations & Custom
  CUSTOM_API: CUSTOM_API_TEMPLATE,
  DATABASE_QUERY: DATABASE_QUERY_TEMPLATE,
  SALESFORCE: SALESFORCE_TEMPLATE,
  SAP: SAP_TEMPLATE,
  DYNAMICS: DYNAMICS_TEMPLATE,
  ZENDESK: ZENDESK_TEMPLATE,
  ZAPIER: ZAPIER_TEMPLATE,
  SLACK: SLACK_TEMPLATE,
  GITHUB: GITHUB_TEMPLATE,
  WEBHOOK: WEBHOOK_TEMPLATE,
  SOCIAL_MEDIA_PUBLISHER: SOCIAL_MEDIA_PUBLISHER_TEMPLATE,

  // Content Generation (Media)
  IMAGE_EDITOR: IMAGE_EDITOR_TEMPLATE,
  AUDIO_GENERATION: AUDIO_GENERATION_TEMPLATE,
  MODEL_3D: MODEL_3D_TEMPLATE,

  // New Templates
  CODE_REVIEW: CODE_REVIEW_TEMPLATE,
  MEETING_SUMMARIZER: MEETING_SUMMARIZER_TEMPLATE,
  GRAMMAR_STYLE_CHECKER: GRAMMAR_STYLE_CHECKER_TEMPLATE,
  IDEA_GENERATOR: IDEA_GENERATOR_TEMPLATE,
  SOCIAL_POST_CRAFTER: SOCIAL_POST_CRAFTER_TEMPLATE,
  EMAIL_RESPONDER: EMAIL_RESPONDER_TEMPLATE,
  CONTENT_REWRITER: CONTENT_REWRITER_TEMPLATE,
  FAQ_GENERATOR: FAQ_GENERATOR_TEMPLATE,
  PRODUCT_DESCRIPTION_WRITER: PRODUCT_DESCRIPTION_WRITER_TEMPLATE,
  BLOG_OUTLINE_GENERATOR: BLOG_OUTLINE_GENERATOR_TEMPLATE,
  RESUME_ENHANCER: RESUME_ENHANCER_TEMPLATE,
  COVER_LETTER_GENERATOR: COVER_LETTER_GENERATOR_TEMPLATE,
  LEARNING_ASSISTANT: LEARNING_ASSISTANT_TEMPLATE,
  FITNESS_PLANNER: FITNESS_PLANNER_TEMPLATE,
  FINANCIAL_EXPLAINER: FINANCIAL_EXPLAINER_TEMPLATE,
  CODE_EXPLAINER: CODE_EXPLAINER_TEMPLATE,
  REGEX_GENERATOR: REGEX_GENERATOR_TEMPLATE,
  SQL_QUERY_GENERATOR: SQL_QUERY_GENERATOR_TEMPLATE,
  UNIT_TEST_GENERATOR: UNIT_TEST_GENERATOR_TEMPLATE,
  API_DOC_WRITER: API_DOC_WRITER_TEMPLATE,
  DATA_TRANSFORM_HELPER: DATA_TRANSFORM_HELPER_TEMPLATE,
  SPREADSHEET_FORMULA_GENERATOR: SPREADSHEET_FORMULA_GENERATOR_TEMPLATE,
  PRESENTATION_CONTENT_GENERATOR: PRESENTATION_CONTENT_GENERATOR_TEMPLATE,
  STORY_GENERATOR: STORY_GENERATOR_TEMPLATE,
  POEM_GENERATOR: POEM_GENERATOR_TEMPLATE,
  LYRICS_GENERATOR: LYRICS_GENERATOR_TEMPLATE,
  LEGAL_DOC_EXPLAINER: LEGAL_DOC_EXPLAINER_TEMPLATE,
  MEDICAL_INFO_SUMMARIZER: MEDICAL_INFO_SUMMARIZER_TEMPLATE,
  HISTORY_EXPLAINER: HISTORY_EXPLAINER_TEMPLATE,
  SCIENCE_EXPLAINER: SCIENCE_EXPLAINER_TEMPLATE,
  MARKET_RESEARCH_ASSISTANT: MARKET_RESEARCH_ASSISTANT_TEMPLATE,
  SWOT_ANALYSIS_GENERATOR: SWOT_ANALYSIS_GENERATOR_TEMPLATE,
  BUSINESS_PLAN_WRITER: BUSINESS_PLAN_WRITER_TEMPLATE,
  PRESS_RELEASE_GENERATOR: PRESS_RELEASE_GENERATOR_TEMPLATE,
  JOB_DESCRIPTION_WRITER: JOB_DESCRIPTION_WRITER_TEMPLATE,
  INTERVIEW_QUESTION_GENERATOR: INTERVIEW_QUESTION_GENERATOR_TEMPLATE,
  PERFORMANCE_REVIEW_HELPER: PERFORMANCE_REVIEW_HELPER_TEMPLATE,
  SUPPORT_RESPONSE_GENERATOR: SUPPORT_RESPONSE_GENERATOR_TEMPLATE,
  USER_PERSONA_GENERATOR: USER_PERSONA_GENERATOR_TEMPLATE,
  AB_TEST_IDEA_GENERATOR: AB_TEST_IDEA_GENERATOR_TEMPLATE,
  RISK_ASSESSMENT_HELPER: RISK_ASSESSMENT_HELPER_TEMPLATE,
  DECISION_FRAMEWORK_HELPER: DECISION_FRAMEWORK_HELPER_TEMPLATE,
  NEGOTIATION_POINT_GENERATOR: NEGOTIATION_POINT_GENERATOR_TEMPLATE,
  WRITING_PROMPT_GENERATOR: WRITING_PROMPT_GENERATOR_TEMPLATE,
  STYLE_TRANSFER: STYLE_TRANSFER_TEMPLATE,
  ANALOGY_GENERATOR: ANALOGY_GENERATOR_TEMPLATE,
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
export const getTemplatesByCategory = (
  category: string,
): AgentToolTemplate[] => {
  return Object.values(TOOL_TEMPLATES).filter(
    (template) => template.category === category,
  );
};

/**
 * Get a template by key
 */
export const getTemplate = (key: string): AgentToolTemplate | undefined => {
  return TOOL_TEMPLATES[key];
};
