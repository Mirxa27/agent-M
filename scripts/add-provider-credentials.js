/**
 * Script to add AI provider credentials for the agents
 */

const { db } = require('../server/db');
const { aiProviders, aiModels } = require('../shared/schema');
const { eq } = require('drizzle-orm');
const crypto = require('crypto');

function encryptData(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.DATABASE_URL.slice(0, 32).padEnd(32)),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function addProvidersAndCredentials() {
  console.log('Adding AI providers and credentials to the database...');

  // Check if providers already exist
  const existingProviders = await db.select().from(aiProviders);
  const existingProviderNames = existingProviders.map(provider => provider.name);

  console.log('Existing providers:', existingProviderNames);

  // Define AI providers
  const providers = [
    {
      name: "OpenAI",
      description: "OpenAI's advanced AI models for various tasks",
      apiEndpoint: "https://api.openai.com/v1",
      authMethod: "apiKey",
      isActive: true,
      config: {
        apiKeyHeader: "Authorization",
        apiKeyPrefix: "Bearer "
      }
    },
    {
      name: "Anthropic",
      description: "Anthropic's Claude models for conversational AI",
      apiEndpoint: "https://api.anthropic.com/v1",
      authMethod: "apiKey",
      isActive: true,
      config: {
        apiKeyHeader: "x-api-key",
        apiKeyPrefix: ""
      }
    },
    {
      name: "Perplexity",
      description: "Perplexity AI for real-time research and information retrieval",
      apiEndpoint: "https://api.perplexity.ai",
      authMethod: "apiKey",
      isActive: true,
      config: {
        apiKeyHeader: "Authorization",
        apiKeyPrefix: "Bearer "
      }
    },
    {
      name: "xAI",
      description: "xAI's Grok models for analytical and technical tasks",
      apiEndpoint: "https://api.x.ai/v1",
      authMethod: "apiKey",
      isActive: true,
      config: {
        apiKeyHeader: "Authorization",
        apiKeyPrefix: "Bearer "
      }
    }
  ];

  // Insert providers that don't already exist
  for (const provider of providers) {
    if (!existingProviderNames.includes(provider.name)) {
      try {
        const [insertedProvider] = await db.insert(aiProviders).values(provider).returning();
        console.log(`Added provider: ${provider.name}`);
      } catch (error) {
        console.error(`Error adding provider ${provider.name}:`, error);
      }
    } else {
      // Update existing provider
      const existingProvider = existingProviders.find(p => p.name === provider.name);
      try {
        const [updatedProvider] = await db
          .update(aiProviders)
          .set({
            description: provider.description,
            apiEndpoint: provider.apiEndpoint,
            authMethod: provider.authMethod,
            isActive: provider.isActive,
            config: provider.config
          })
          .where(eq(aiProviders.id, existingProvider.id))
          .returning();
        console.log(`Updated provider: ${provider.name}`);
      } catch (error) {
        console.error(`Error updating provider ${provider.name}:`, error);
      }
    }
  }

  // Add models for each provider
  await addModels();

  // Add credentials if environment variables are available
  await addCredentials();

  console.log('All providers, models, and credentials have been added or updated.');
}

async function addModels() {
  // Get providers
  const providers = await db.select().from(aiProviders);
  const existingModels = await db.select().from(aiModels);
  const existingModelNames = existingModels.map(model => model.name);

  // Add OpenAI models
  const openaiProvider = providers.find(p => p.name === "OpenAI");
  if (openaiProvider) {
    const openaiModels = [
      {
        providerId: openaiProvider.id,
        name: "gpt-4o",
        displayName: "GPT-4o",
        description: "OpenAI's most advanced multimodal model",
        capabilities: ["text", "vision", "reasoning", "code"],
        contextWindow: 128000,
        isActive: true
      },
      {
        providerId: openaiProvider.id,
        name: "gpt-4-turbo",
        displayName: "GPT-4 Turbo",
        description: "Powerful model with good performance/cost balance",
        capabilities: ["text", "reasoning", "code"],
        contextWindow: 128000,
        isActive: true
      },
      {
        providerId: openaiProvider.id,
        name: "gpt-4o-mini",
        displayName: "GPT-4o Mini",
        description: "Smaller, cost-effective version of GPT-4o",
        capabilities: ["text", "vision", "reasoning", "code"],
        contextWindow: 128000,
        isActive: true
      }
    ];

    for (const model of openaiModels) {
      if (!existingModelNames.includes(model.name)) {
        try {
          await db.insert(aiModels).values(model);
          console.log(`Added model: ${model.name}`);
        } catch (error) {
          console.error(`Error adding model ${model.name}:`, error);
        }
      }
    }
  }

  // Add Anthropic models
  const anthropicProvider = providers.find(p => p.name === "Anthropic");
  if (anthropicProvider) {
    const anthropicModels = [
      {
        providerId: anthropicProvider.id,
        name: "claude-3-7-sonnet-20250219",
        displayName: "Claude 3.7 Sonnet",
        description: "Anthropic's newest and most capable model",
        capabilities: ["text", "vision", "reasoning"],
        contextWindow: 200000,
        isActive: true
      },
      {
        providerId: anthropicProvider.id,
        name: "claude-3-5-sonnet",
        displayName: "Claude 3.5 Sonnet",
        description: "Balanced performance and cost",
        capabilities: ["text", "vision", "reasoning"],
        contextWindow: 200000,
        isActive: true
      },
      {
        providerId: anthropicProvider.id,
        name: "claude-3-haiku",
        displayName: "Claude 3 Haiku",
        description: "Fast and cost-effective",
        capabilities: ["text", "vision", "reasoning"],
        contextWindow: 200000,
        isActive: true
      }
    ];

    for (const model of anthropicModels) {
      if (!existingModelNames.includes(model.name)) {
        try {
          await db.insert(aiModels).values(model);
          console.log(`Added model: ${model.name}`);
        } catch (error) {
          console.error(`Error adding model ${model.name}:`, error);
        }
      }
    }
  }

  // Add Perplexity models
  const perplexityProvider = providers.find(p => p.name === "Perplexity");
  if (perplexityProvider) {
    const perplexityModels = [
      {
        providerId: perplexityProvider.id,
        name: "llama-3.1-sonar-small-128k-online",
        displayName: "Llama 3.1 Sonar Small (Online)",
        description: "Fast model with online search capabilities",
        capabilities: ["text", "search", "citations"],
        contextWindow: 128000,
        isActive: true
      },
      {
        providerId: perplexityProvider.id,
        name: "llama-3.1-sonar-large-128k-online",
        displayName: "Llama 3.1 Sonar Large (Online)",
        description: "Large model with enhanced online search capabilities",
        capabilities: ["text", "search", "citations"],
        contextWindow: 128000,
        isActive: true
      }
    ];

    for (const model of perplexityModels) {
      if (!existingModelNames.includes(model.name)) {
        try {
          await db.insert(aiModels).values(model);
          console.log(`Added model: ${model.name}`);
        } catch (error) {
          console.error(`Error adding model ${model.name}:`, error);
        }
      }
    }
  }

  // Add xAI models
  const xaiProvider = providers.find(p => p.name === "xAI");
  if (xaiProvider) {
    const xaiModels = [
      {
        providerId: xaiProvider.id,
        name: "grok-2-1212",
        displayName: "Grok 2",
        description: "xAI's powerful text model",
        capabilities: ["text", "reasoning", "analysis"],
        contextWindow: 131072,
        isActive: true
      },
      {
        providerId: xaiProvider.id,
        name: "grok-2-vision-1212",
        displayName: "Grok 2 Vision",
        description: "xAI's multimodal model with vision capabilities",
        capabilities: ["text", "vision", "reasoning", "analysis"],
        contextWindow: 8192,
        isActive: true
      }
    ];

    for (const model of xaiModels) {
      if (!existingModelNames.includes(model.name)) {
        try {
          await db.insert(aiModels).values(model);
          console.log(`Added model: ${model.name}`);
        } catch (error) {
          console.error(`Error adding model ${model.name}:`, error);
        }
      }
    }
  }
}

async function addCredentials() {
  // Add system credentials for providers using environment variables
  // System user ID is typically 1, make sure it exists
  const [adminUser] = await db.select().from('users').where(eq('users.role', 'admin')).limit(1);
  
  if (!adminUser) {
    console.warn('No admin user found to attach credentials to');
    return;
  }
  
  const userId = adminUser.id;
  console.log(`Using admin user ID ${userId} for system credentials`);
  
  // OpenAI
  if (process.env.OPENAI_API_KEY) {
    const [openaiProvider] = await db.select().from(aiProviders).where(eq(aiProviders.name, "OpenAI"));
    if (openaiProvider) {
      const encryptedKey = encryptData(process.env.OPENAI_API_KEY);
      await addOrUpdateCredential({
        userId,
        name: "OpenAI System Credential",
        type: "apiKey",
        service: "openai",
        data: encryptedKey,
        authMethod: "apiKey"
      });
    }
  }
  
  // Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    const [anthropicProvider] = await db.select().from(aiProviders).where(eq(aiProviders.name, "Anthropic"));
    if (anthropicProvider) {
      const encryptedKey = encryptData(process.env.ANTHROPIC_API_KEY);
      await addOrUpdateCredential({
        userId,
        name: "Anthropic System Credential",
        type: "apiKey",
        service: "anthropic",
        data: encryptedKey,
        authMethod: "apiKey"
      });
    }
  }
  
  // Perplexity
  if (process.env.PERPLEXITY_API_KEY) {
    const [perplexityProvider] = await db.select().from(aiProviders).where(eq(aiProviders.name, "Perplexity"));
    if (perplexityProvider) {
      const encryptedKey = encryptData(process.env.PERPLEXITY_API_KEY);
      await addOrUpdateCredential({
        userId,
        name: "Perplexity System Credential",
        type: "apiKey",
        service: "perplexity",
        data: encryptedKey,
        authMethod: "apiKey"
      });
    }
  }
  
  // xAI
  if (process.env.XAI_API_KEY) {
    const [xaiProvider] = await db.select().from(aiProviders).where(eq(aiProviders.name, "xAI"));
    if (xaiProvider) {
      const encryptedKey = encryptData(process.env.XAI_API_KEY);
      await addOrUpdateCredential({
        userId,
        name: "xAI System Credential",
        type: "apiKey",
        service: "xai",
        data: encryptedKey,
        authMethod: "apiKey"
      });
    }
  }
}

async function addOrUpdateCredential(credential) {
  try {
    // Check if credential already exists for this user and service
    const [existingCredential] = await db
      .select()
      .from('credentials')
      .where(eq('credentials.userId', credential.userId))
      .where(eq('credentials.service', credential.service));
    
    if (existingCredential) {
      // Update existing credential
      await db
        .update('credentials')
        .set({
          name: credential.name,
          type: credential.type,
          data: credential.data,
          authMethod: credential.authMethod,
          updatedAt: new Date()
        })
        .where(eq('credentials.id', existingCredential.id));
      console.log(`Updated credential: ${credential.name}`);
    } else {
      // Insert new credential
      await db.insert('credentials').values({
        ...credential,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added credential: ${credential.name}`);
    }
  } catch (error) {
    console.error(`Error adding/updating credential ${credential.name}:`, error);
  }
}

// Run the script if executed directly
if (require.main === module) {
  addProvidersAndCredentials()
    .then(() => {
      console.log('Script completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addProvidersAndCredentials };