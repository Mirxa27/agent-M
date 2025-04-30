/**
 * Script to add AI provider credentials for the agents
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import ws from 'ws';
import crypto from 'crypto';

dotenv.config();

// Required for Neon serverless connections
neonConfig.webSocketConstructor = ws;

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Generate a secure encryption key for credentials
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'default-encryption-key-for-development-only';

// Simple encryption function for API keys (in production, use stronger encryption)
function encryptData(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// AI Provider configurations to add
const providers = [
  {
    name: "OpenAI API Integration",
    provider: "openai",
    description: "Integration with OpenAI API for ChatGPT, DALL-E, and other services",
    baseUrl: "https://api.openai.com/v1",
    authType: "api_key",
    isActive: true
  },
  {
    name: "Anthropic API Integration",
    provider: "anthropic",
    description: "Integration with Anthropic Claude API for advanced reasoning",
    baseUrl: "https://api.anthropic.com",
    authType: "api_key",
    isActive: true
  },
  {
    name: "xAI Grok Integration",
    provider: "xai",
    description: "Integration with xAI's Grok API for creative conversations",
    baseUrl: "https://api.x.ai/v1",
    authType: "api_key",
    isActive: true
  },
  {
    name: "Perplexity API Integration",
    provider: "perplexity",
    description: "Integration with Perplexity API for research-focused responses",
    baseUrl: "https://api.perplexity.ai",
    authType: "api_key",
    isActive: true
  }
];

// Credentials for the admin user to use with the providers
const credentials = [
  {
    userId: 2, // Admin user ID
    name: "OpenAI API Key",
    type: "api_key",
    service: "openai",
    authMethod: "api_key",
    // The actual API key value is stored encrypted and uses the environment variable
    apiKeyEnvVar: "OPENAI_API_KEY"
  },
  {
    userId: 2, // Admin user ID
    name: "Anthropic API Key",
    type: "api_key",
    service: "anthropic",
    authMethod: "api_key",
    apiKeyEnvVar: "ANTHROPIC_API_KEY"
  },
  {
    userId: 2, // Admin user ID
    name: "xAI API Key",
    type: "api_key",
    service: "xai",
    authMethod: "api_key",
    apiKeyEnvVar: "XAI_API_KEY"
  },
  {
    userId: 2, // Admin user ID
    name: "Perplexity API Key",
    type: "api_key",
    service: "perplexity",
    authMethod: "api_key",
    apiKeyEnvVar: "PERPLEXITY_API_KEY"
  }
];

// Models for the providers
const models = [
  {
    providerId: 1, // Will be set dynamically
    name: "GPT-4o",
    modelId: "gpt-4o",
    description: "OpenAI's most advanced model, blending intelligence across text, vision, and audio",
    capabilities: ["text", "image", "audio"],
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costInputPerK: 0.005,
    costOutputPerK: 0.015,
    isActive: true,
    isDefault: true
  },
  {
    providerId: 2, // Will be set dynamically
    name: "Claude 3.7 Sonnet",
    modelId: "claude-3-7-sonnet-20250219",
    description: "Anthropic's advanced model with exceptional reasoning and safety features",
    capabilities: ["text", "image"],
    contextWindow: 200000,
    maxOutputTokens: 4096,
    costInputPerK: 0.003,
    costOutputPerK: 0.015,
    isActive: true,
    isDefault: true
  },
  {
    providerId: 3, // Will be set dynamically
    name: "Grok-2-1212",
    modelId: "grok-2-1212",
    description: "xAI's conversational model with web search capabilities",
    capabilities: ["text"],
    contextWindow: 131072,
    maxOutputTokens: 4096,
    costInputPerK: 0.005,
    costOutputPerK: 0.015,
    isActive: true,
    isDefault: true
  },
  {
    providerId: 4, // Will be set dynamically
    name: "Llama-3.1-Sonar-Small",
    modelId: "llama-3.1-sonar-small-128k-online",
    description: "Perplexity's research-focused model with real-time web search",
    capabilities: ["text"],
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costInputPerK: 0.0015,
    costOutputPerK: 0.006,
    isActive: true,
    isDefault: true
  }
];

async function addProvidersAndCredentials() {
  console.log('Setting up AI providers and credentials...');

  try {
    // Current timestamp
    const now = new Date();

    // Add or update providers
    for (const provider of providers) {
      // Check if provider already exists
      const existingProvider = await pool.query(
        'SELECT id FROM ai_providers WHERE provider = $1',
        [provider.provider]
      );

      let providerId;

      if (existingProvider.rows.length > 0) {
        providerId = existingProvider.rows[0].id;
        console.log(`Provider "${provider.name}" already exists (ID: ${providerId}), updating...`);

        // Update existing provider
        await pool.query(
          `UPDATE ai_providers 
           SET name = $1, description = $2, base_url = $3, auth_type = $4, is_active = $5, updated_at = $6
           WHERE id = $7`,
          [
            provider.name,
            provider.description,
            provider.baseUrl,
            provider.authType,
            provider.isActive,
            now,
            providerId
          ]
        );
      } else {
        // Insert new provider
        const result = await pool.query(
          `INSERT INTO ai_providers (
            name, provider, description, base_url, auth_type, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            provider.name,
            provider.provider,
            provider.description,
            provider.baseUrl,
            provider.authType,
            provider.isActive,
            now,
            now
          ]
        );

        providerId = result.rows[0].id;
        console.log(`Added provider "${provider.name}" with ID ${providerId}`);
      }

      // Store providerId for models
      const index = providers.findIndex(p => p.provider === provider.provider);
      if (index !== -1) {
        models[index].providerId = providerId;
      }
    }

    // Add credentials
    for (const credential of credentials) {
      // Get API key from environment variable
      const apiKey = process.env[credential.apiKeyEnvVar];
      
      if (!apiKey) {
        console.log(`Warning: Environment variable ${credential.apiKeyEnvVar} not found. Using placeholder for "${credential.name}"`);
        continue;
      }
      
      // Encrypt the API key
      const encryptedData = encryptData(apiKey);

      // Check if credential already exists
      const existingCredential = await pool.query(
        'SELECT id FROM credentials WHERE user_id = $1 AND service = $2',
        [credential.userId, credential.service]
      );

      if (existingCredential.rows.length > 0) {
        const credentialId = existingCredential.rows[0].id;
        console.log(`Credential "${credential.name}" already exists (ID: ${credentialId}), updating...`);

        // Update existing credential
        await pool.query(
          `UPDATE credentials 
           SET name = $1, type = $2, data = $3, auth_method = $4, updated_at = $5
           WHERE id = $6`,
          [
            credential.name,
            credential.type,
            encryptedData,
            credential.authMethod,
            now,
            credentialId
          ]
        );
      } else {
        // Insert new credential
        const result = await pool.query(
          `INSERT INTO credentials (
            user_id, name, type, data, auth_method, service, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            credential.userId,
            credential.name,
            credential.type,
            encryptedData,
            credential.authMethod,
            credential.service,
            now,
            now
          ]
        );

        console.log(`Added credential "${credential.name}" with ID ${result.rows[0].id}`);
      }
    }

    // Add models
    for (const model of models) {
      // Check if model already exists
      const existingModel = await pool.query(
        'SELECT id FROM ai_models WHERE provider_id = $1 AND model_id = $2',
        [model.providerId, model.modelId]
      );

      if (existingModel.rows.length > 0) {
        const modelId = existingModel.rows[0].id;
        console.log(`Model "${model.name}" already exists (ID: ${modelId}), updating...`);

        // Update existing model
        await pool.query(
          `UPDATE ai_models 
           SET name = $1, description = $2, capabilities = $3, context_window = $4,
               max_output_tokens = $5, cost_input_per_k = $6, cost_output_per_k = $7,
               is_active = $8, is_default = $9, updated_at = $10
           WHERE id = $11`,
          [
            model.name,
            model.description,
            JSON.stringify(model.capabilities),
            model.contextWindow,
            model.maxOutputTokens,
            model.costInputPerK,
            model.costOutputPerK,
            model.isActive,
            model.isDefault,
            now,
            modelId
          ]
        );
      } else {
        // Insert new model
        const result = await pool.query(
          `INSERT INTO ai_models (
            provider_id, name, model_id, description, capabilities, context_window,
            max_output_tokens, cost_input_per_k, cost_output_per_k, is_active, is_default,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
          [
            model.providerId,
            model.name,
            model.modelId,
            model.description,
            JSON.stringify(model.capabilities),
            model.contextWindow,
            model.maxOutputTokens,
            model.costInputPerK,
            model.costOutputPerK,
            model.isActive,
            model.isDefault,
            now,
            now
          ]
        );

        console.log(`Added model "${model.name}" with ID ${result.rows[0].id}`);
      }
    }

    console.log('AI providers and credentials setup completed successfully.');
  } catch (error) {
    console.error('Error setting up AI providers and credentials:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
addProvidersAndCredentials();