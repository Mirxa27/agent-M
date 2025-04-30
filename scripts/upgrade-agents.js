/**
 * Script to upgrade the agent templates with complete functionality
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

// Enhanced agent configurations
const enhancedAgents = [
  {
    name: "Website Builder",
    enhancedConfig: {
      prompts: {
        default: "Create a responsive website based on the following requirements: {{input}}",
        designRequest: "Generate a modern website design for: {{input}}",
        seoOptimization: "Optimize the following webpage content for SEO: {{input}}",
        componentGeneration: "Create reusable HTML/CSS/JS components for: {{input}}",
        accessibilityCheck: "Review and improve the accessibility of this code: {{input}}"
      },
      frameworks: ["html5", "css3", "bootstrap", "tailwind", "react", "vue"],
      capabilities: ["responsive", "seo-friendly", "accessible", "interactive", "e-commerce"],
      designStyles: ["modern", "minimalist", "corporate", "creative", "luxury"],
      outputFormats: {
        code: true,
        preview: true,
        deployment: true
      },
      automations: {
        responsiveCheck: true,
        imageOptimization: true,
        codeLinting: true,
        performanceAnalysis: true
      },
      workflow: [
        {
          step: "requirements",
          description: "Gather project requirements and objectives"
        },
        {
          step: "design",
          description: "Create website design mockups and layout"
        },
        {
          step: "development",
          description: "Generate HTML, CSS and JavaScript code"
        },
        {
          step: "optimization",
          description: "Optimize for performance, SEO and accessibility"
        },
        {
          step: "deployment",
          description: "Prepare files for deployment"
        }
      ],
      tools: [3, 4, 6, 7], // IDs for OpenAI Chat, Anthropic Claude, Grok, and Code Generator
      defaultLanding: true,
      responseFormat: "html",
      designStyle: "modern"
    }
  },
  {
    name: "Personal Secretary",
    enhancedConfig: {
      prompts: {
        default: "Organize and manage the following task: {{input}}",
        emailDrafting: "Draft a professional email regarding: {{input}}",
        meetingSummary: "Summarize the following meeting notes: {{input}}",
        scheduling: "Schedule the following event and check for conflicts: {{input}}",
        prioritization: "Help me prioritize these tasks for today: {{input}}"
      },
      capabilities: [
        "email management", 
        "calendar scheduling", 
        "task prioritization", 
        "meeting coordination", 
        "travel planning", 
        "contact management"
      ],
      emailTemplates: [
        "meeting request", 
        "follow-up", 
        "introduction", 
        "confirmation", 
        "thank you"
      ],
      integrations: {
        calendar: true,
        email: true,
        tasks: true,
        contacts: true,
        files: true
      },
      reminderSystem: {
        channels: ["email", "notification", "sms"],
        urgencyLevels: ["low", "medium", "high", "critical"],
        timing: {
          advance: [5, 15, 30, 60, 1440], // minutes (1440 = 1 day)
          followUp: [1, 3, 7] // days
        }
      },
      summarizationOptions: {
        bullets: true,
        highlights: true,
        actionItems: true,
        nextSteps: true,
        decisions: true
      },
      workflow: [
        {
          step: "intake",
          description: "Receive and interpret requests"
        },
        {
          step: "process",
          description: "Process requests and gather necessary information"
        },
        {
          step: "execute",
          description: "Execute tasks or generate appropriate responses"
        },
        {
          step: "follow-up",
          description: "Schedule follow-ups and reminders"
        },
        {
          step: "learn",
          description: "Learn from interactions to improve future assistance"
        }
      ],
      tools: [3, 4, 5], // IDs for OpenAI Chat, Anthropic Claude, Perplexity
      notificationEnabled: true,
      prioritizationEnabled: true,
      summarizationEnabled: true,
      reminderFormat: "email",
      autoRespond: true
    }
  },
  {
    name: "Multilingual Contract Writer",
    enhancedConfig: {
      prompts: {
        default: "Draft a legal contract for the following situation: {{input}}",
        contractReview: "Review this contract and identify potential issues: {{input}}",
        translation: "Translate the following contract clause to {{language}}: {{input}}",
        simplification: "Simplify this legal language for a non-lawyer: {{input}}",
        clauseDrafting: "Draft a clause addressing the following issue: {{input}}"
      },
      contractTypes: [
        "employment", 
        "sales", 
        "service", 
        "lease", 
        "non-disclosure", 
        "partnership"
      ],
      languages: [
        "english", 
        "arabic", 
        "french", 
        "spanish", 
        "chinese", 
        "german", 
        "japanese",
        "russian"
      ],
      legalJurisdictions: [
        "international", 
        "saudi", 
        "uae", 
        "us", 
        "eu", 
        "uk", 
        "china", 
        "japan"
      ],
      complianceFrameworks: [
        "GDPR", 
        "CCPA", 
        "SOX", 
        "HIPAA", 
        "ISO27001"
      ],
      legalDatabase: {
        standardClauses: true,
        regulatoryUpdates: true,
        precedents: true,
        legalPhraseology: true
      },
      formatting: {
        numbered: true,
        sections: true,
        definitions: true,
        tableOfContents: true,
        appendices: true
      },
      workflow: [
        {
          step: "requirements",
          description: "Gather requirements and jurisdiction details"
        },
        {
          step: "drafting",
          description: "Draft contract terms and conditions"
        },
        {
          step: "review",
          description: "Review for legal accuracy and compliance"
        },
        {
          step: "translation",
          description: "Translate to required languages if needed"
        },
        {
          step: "finalization",
          description: "Format and finalize contract document"
        }
      ],
      tools: [3, 4, 5], // IDs for OpenAI Chat, Anthropic Claude, Perplexity
      templateEnabled: true,
      reviewEnabled: true
    }
  },
  {
    name: "Content Creator",
    enhancedConfig: {
      prompts: {
        default: "Create engaging content about: {{input}}",
        blog: "Write a comprehensive blog post about: {{input}}",
        social: "Create social media posts for {{platform}} about: {{input}}",
        email: "Write a compelling marketing email about: {{input}}",
        title: "Generate attention-grabbing titles for content about: {{input}}"
      },
      contentTypes: [
        "blog post", 
        "social media", 
        "email newsletter", 
        "product description", 
        "ad copy", 
        "video script",
        "podcast outline",
        "press release"
      ],
      toneOptions: [
        "professional", 
        "casual", 
        "persuasive", 
        "informative", 
        "humorous", 
        "inspiring", 
        "authoritative"
      ],
      audienceCategories: [
        "general", 
        "business", 
        "technical", 
        "academic", 
        "youth", 
        "senior"
      ],
      socialPlatforms: [
        "instagram", 
        "twitter", 
        "linkedin", 
        "facebook", 
        "tiktok", 
        "youtube"
      ],
      seoOptimization: {
        keywordResearch: true,
        densityAnalysis: true,
        metaTagGeneration: true,
        readabilityScoring: true,
        headingStructure: true
      },
      mediaGenerator: {
        images: true,
        infographics: true,
        thumbnails: true,
        banners: true
      },
      contentPlanner: {
        calendar: true,
        topics: true,
        trends: true,
        analytics: true
      },
      workflow: [
        {
          step: "research",
          description: "Research topic and gather key information"
        },
        {
          step: "outline",
          description: "Create content structure and outline"
        },
        {
          step: "draft",
          description: "Generate initial content draft"
        },
        {
          step: "optimize",
          description: "Optimize for SEO and target audience"
        },
        {
          step: "media",
          description: "Generate supporting media if needed"
        }
      ],
      tools: [3, 6, 7], // IDs for OpenAI Chat, Grok, and Code Generator
      mediaGeneration: true,
      seoOptimization: true,
      audienceTargeting: true
    }
  },
  {
    name: "Data Analyst",
    enhancedConfig: {
      prompts: {
        default: "Analyze this dataset and provide insights: {{input}}",
        visualization: "Create visualizations for this data: {{input}}",
        statistics: "Run statistical analysis on this dataset: {{input}}",
        prediction: "Generate predictions based on this data: {{input}}",
        cleaning: "Clean and preprocess this raw data: {{input}}"
      },
      dataFormats: [
        "csv", 
        "json", 
        "excel", 
        "sql", 
        "xml", 
        "parquet", 
        "api"
      ],
      analysisTypes: [
        "descriptive", 
        "diagnostic", 
        "predictive", 
        "prescriptive"
      ],
      statisticalMethods: [
        "regression", 
        "classification", 
        "clustering", 
        "anomaly detection", 
        "time series"
      ],
      visualizationTypes: [
        "bar", 
        "line", 
        "scatter", 
        "pie", 
        "heatmap", 
        "histogram", 
        "boxplot", 
        "geographical"
      ],
      dataProcessing: {
        cleaning: true,
        transformation: true,
        aggregation: true,
        normalization: true,
        imputation: true
      },
      reportGeneration: {
        executive: true,
        technical: true,
        interactive: true,
        presentations: true
      },
      libraries: [
        "pandas", 
        "numpy", 
        "scikit-learn", 
        "matplotlib", 
        "seaborn", 
        "plotly", 
        "tensorflow"
      ],
      workflow: [
        {
          step: "collection",
          description: "Collect and import data from various sources"
        },
        {
          step: "preprocessing",
          description: "Clean, transform and prepare data for analysis"
        },
        {
          step: "exploration",
          description: "Explore data patterns and relationships"
        },
        {
          step: "analysis",
          description: "Apply analytical methods and statistical tests"
        },
        {
          step: "visualization",
          description: "Create visual representations of insights"
        },
        {
          step: "reporting",
          description: "Generate comprehensive reports with findings"
        }
      ],
      tools: [3, 5, 7], // IDs for OpenAI Chat, Perplexity, and Code Generator
      statisticalAnalysis: true,
      predictiveModeling: true,
      reportGeneration: true
    }
  }
];

async function upgradeAgents() {
  console.log('Upgrading agent templates with complete functionality...');

  try {
    // Current timestamp
    const now = new Date();

    for (const agent of enhancedAgents) {
      // Find the agent by name
      const existingAgent = await pool.query(
        'SELECT id, config, tools FROM agents WHERE name = $1',
        [agent.name]
      );

      if (existingAgent.rows.length === 0) {
        console.log(`Agent "${agent.name}" not found, skipping.`);
        continue;
      }

      const agentId = existingAgent.rows[0].id;
      
      // Merge existing config with enhanced config
      const existingConfig = existingAgent.rows[0].config || {};
      const mergedConfig = { ...existingConfig, ...agent.enhancedConfig };
      
      // Update the agent with enhanced configuration
      await pool.query(
        `UPDATE agents 
         SET config = $1, tools = $2, updated_at = $3
         WHERE id = $4`,
        [
          JSON.stringify(mergedConfig),
          JSON.stringify(agent.enhancedConfig.tools || []),
          now,
          agentId
        ]
      );

      console.log(`Upgraded agent "${agent.name}" (ID: ${agentId}) with complete functionality`);
    }

    console.log('All agent templates upgraded successfully.');
  } catch (error) {
    console.error('Error upgrading agent templates:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
upgradeAgents();