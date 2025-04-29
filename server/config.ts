import { z } from "zod";

// Define environment variable schema with validation
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  
  // Database configuration
  DATABASE_URL: z.string({
    required_error: "DATABASE_URL is required",
  }),
  DB_HOST: z.string({
    required_error: "DB_HOST is required",
  }),
  DB_PORT: z.coerce.number({
    required_error: "DB_PORT is required",
  }).default(3306),
  DB_USER: z.string({
    required_error: "DB_USER is required",
  }),
  DB_PASSWORD: z.string({
    required_error: "DB_PASSWORD is required",
  }),
  DB_NAME: z.string({
    required_error: "DB_NAME is required",
  }),
  
  // Session configuration
  SESSION_SECRET: z.string().default("mirxa-super-secret-session-key"),
  SESSION_MAX_AGE: z.coerce.number().default(24 * 60 * 60 * 1000), // 24 hours in ms
  
  // Security
  ENCRYPTION_KEY: z.string({
    required_error: "ENCRYPTION_KEY is required for credential encryption",
  }),
  
  // AI Provider API keys
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
  
  // Server configuration
  PORT: z.coerce.number().default(5000),
  HOST: z.string().default("0.0.0.0"),
  
  // OAuth configuration - Client IDs and Secrets
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  DROPBOX_CLIENT_ID: z.string().optional(),
  DROPBOX_CLIENT_SECRET: z.string().optional(),
  TWITTER_CLIENT_ID: z.string().optional(),
  TWITTER_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  INSTAGRAM_CLIENT_ID: z.string().optional(),
  
  // OAuth redirect URIs
  BASE_URL: z.string().default("https://bot.mirxa.io"),
  
  // SMTP Configuration
  SMTP_HOST: z.string({
    required_error: "SMTP_HOST is required",
  }).default("smtp.hostinger.com"),
  SMTP_PORT: z.coerce.number({
    required_error: "SMTP_PORT is required",
  }).default(465),
  SMTP_USER: z.string({
    required_error: "SMTP_USER is required",
  }).default("join@Mirxa.io"),
  SMTP_PASS: z.string({
    required_error: "SMTP_PASS is required",
  }).default("Mirxa420$"),
  EMAIL_FROM: z.string({
    required_error: "EMAIL_FROM is required",
  }).default("Mirxa"),
});

// Parse environment variables
const envParse = () => {
  try {
    const parsed = envSchema.safeParse(process.env);
    
    if (!parsed.success) {
      console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
      throw new Error("Invalid environment configuration");
    }
    
    return parsed.data;
  } catch (error) {
    console.error("Failed to parse environment variables:", error);
    process.exit(1);
  }
};

// Configuration object with environment-specific overrides
const createConfig = () => {
  const env = envParse();
  const isDev = env.NODE_ENV === "development";
  const isProd = env.NODE_ENV === "production";
  
  // Base configuration
  const config = {
    env: env.NODE_ENV,
    
    // Server
    server: {
      port: env.PORT,
      host: env.HOST,
    },
    
    // Database
    database: {
      url: `mysql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
      poolMax: isProd ? 20 : 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    
    // Session
    session: {
      secret: env.SESSION_SECRET,
      cookieMaxAge: env.SESSION_MAX_AGE,
      secureCookies: isProd,
    },
    
    // Security
    security: {
      encryptionKey: env.ENCRYPTION_KEY,
      bcryptSaltRounds: 10,
    },
    
    // OAuth URLs
    oauth: {
      baseUrl: env.BASE_URL,
      redirectUris: {
        google: `${env.BASE_URL}/api/oauth/callback/google`,
        microsoft: `${env.BASE_URL}/api/oauth/callback/microsoft`,
        dropbox: `${env.BASE_URL}/api/oauth/callback/dropbox`,
        twitter: `${env.BASE_URL}/api/oauth/callback/twitter`,
        linkedin: `${env.BASE_URL}/api/oauth/callback/linkedin`,
        facebook: `${env.BASE_URL}/api/oauth/callback/facebook`,
        instagram: `${env.BASE_URL}/api/oauth/callback/instagram`,
      },
      credentials: {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
        microsoft: {
          clientId: env.MICROSOFT_CLIENT_ID,
          clientSecret: env.MICROSOFT_CLIENT_SECRET,
        },
        dropbox: {
          clientId: env.DROPBOX_CLIENT_ID,
          clientSecret: env.DROPBOX_CLIENT_SECRET,
        },
        twitter: {
          clientId: env.TWITTER_CLIENT_ID,
          clientSecret: env.TWITTER_CLIENT_SECRET,
        },
        linkedin: {
          clientId: env.LINKEDIN_CLIENT_ID,
          clientSecret: env.LINKEDIN_CLIENT_SECRET,
        },
        facebook: {
          clientId: env.FACEBOOK_CLIENT_ID,
          clientSecret: env.FACEBOOK_CLIENT_SECRET,
        },
        instagram: {
          clientId: env.INSTAGRAM_CLIENT_ID,
          clientSecret: env.INSTAGRAM_CLIENT_SECRET,
        },
      }
    },
    
    // AI Provider Configurations
    ai: {
      openai: {
        apiKey: env.OPENAI_API_KEY,
        defaultModel: "gpt-4o", // Most recent model as of May 2024
      },
      anthropic: {
        apiKey: env.ANTHROPIC_API_KEY,
        defaultModel: "claude-3-7-sonnet-20250219", // Most recent model as of Feb 2025
      },
      xai: {
        apiKey: env.XAI_API_KEY,
        defaultModel: "grok-2-1212",
        baseUrl: "https://api.x.ai/v1",
      },
      perplexity: {
        apiKey: env.PERPLEXITY_API_KEY,
        defaultModel: "llama-3.1-sonar-small-128k-online",
      },
    },
    
    // Feature flags
    features: {
      aiAuthRequired: isProd,
      fileUploadEnabled: true,
      oauthEnabled: true,
      aiAnonalytics: isProd,
      agentTasks: true,
    },
    
    // Credential settings
    credentials: {
      defaultExpirationDays: 90,
      refreshTokenBeforeDays: 7,
    },
    
    // SMTP Configuration
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.EMAIL_FROM,
    },
  };
  
  return config;
};

// Export the configuration
const config = createConfig();
export default config;

// Export a function to check if required API keys are available
export function checkRequiredApiKey(provider: string): boolean {
  switch (provider.toLowerCase()) {
    case 'openai':
      return !!config.ai.openai.apiKey;
    case 'anthropic':
      return !!config.ai.anthropic.apiKey;
    case 'xai':
      return !!config.ai.xai.apiKey;
    case 'perplexity':
      return !!config.ai.perplexity.apiKey;
    default:
      return false;
  }
}

// Export helper function to check OAuth configuration
export function checkOAuthConfig(service: string): boolean {
  const serviceKey = service.toLowerCase();
  if (!(serviceKey in config.oauth.credentials)) {
    return false;
  }
  
  const creds = config.oauth.credentials[serviceKey as keyof typeof config.oauth.credentials];
  return !!(creds.clientId && creds.clientSecret);
}
