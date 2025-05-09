// enhance-admin-dashboard.ts
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http'; // Changed to neon-http
import { agentTools, aiModels, aiPrompts, aiProviders, siteSettings } from './shared/schema'; // Corrected import path

dotenv.config();

async function enhanceAdminDashboard() {
    const { DATABASE_URL } = process.env;

    if (!DATABASE_URL) {
        console.error('DATABASE_URL environment variable is not set.');
        process.exit(1);
    }

    try {
        // Initialize database client
        const sql = neon(DATABASE_URL);
        const db = drizzle(sql);

        console.log('Starting admin dashboard enhancement...');

        // 1. Set up AI providers (if they don't exist)
        console.log('Setting up default AI providers...');
        const existingProviders = await db.select().from(aiProviders).execute();

        if (existingProviders.length === 0) {
            await db.insert(aiProviders).values([
                {
                    name: 'OpenAI',
                    provider: 'openai',
                    isActive: true,
                    // description, baseUrl, authType have defaults or are optional
                },
                {
                    name: 'Anthropic',
                    provider: 'anthropic',
                    isActive: true,
                },
                {
                    name: 'xAI',
                    provider: 'xai',
                    isActive: true,
                }
            ]).execute();
            console.log('Default AI providers created.');
        } else {
            console.log(`${existingProviders.length} AI providers already exist.`);
        }

        // 2. Set up default AI models
        console.log('Setting up default AI models...');
        const existingModels = await db.select().from(aiModels).execute();

        if (existingModels.length === 0) {
            const providersFromDb = await db.select().from(aiProviders).execute(); // Renamed to avoid conflict
            const providerMap: Record<string, number> = {}; // Added type

            providersFromDb.forEach(provider => { // Use renamed variable
                providerMap[provider.name] = provider.id;
            });

            if (providerMap['OpenAI']) {
                await db.insert(aiModels).values([
                    {
                        name: 'GPT-4o',
                        providerId: providerMap['OpenAI'],
                        isActive: true,
                        modelId: 'gpt-4o',
                        // other fields like capabilities, contextWindow are optional or have defaults
                    },
                    {
                        name: 'GPT-4-Turbo',
                        providerId: providerMap['OpenAI'],
                        isActive: true,
                        modelId: 'gpt-4-turbo',
                    }
                ]).execute();
            }

            if (providerMap['Anthropic']) {
                await db.insert(aiModels).values([
                    {
                        name: 'Claude 3 Opus',
                        providerId: providerMap['Anthropic'],
                        isActive: true,
                        modelId: 'claude-3-opus-20240229',
                    },
                    {
                        name: 'Claude 3 Sonnet',
                        providerId: providerMap['Anthropic'],
                        isActive: true,
                        modelId: 'claude-3-sonnet-20240229',
                    }
                ]).execute();
            }

            console.log('Default AI models created.');
        } else {
            console.log(`${existingModels.length} AI models already exist.`);
        }

        // 3. Set up default prompt templates for document generation
        console.log('Setting up default prompt templates...');
        const existingPrompts = await db.select().from(aiPrompts).execute();

        if (existingPrompts.length === 0) {
            // This section needs to align with aiPrompts schema
            // Assuming modelId is required and needs to be fetched or defaulted
            const defaultModel = await db.select().from(aiModels).limit(1).execute();
            const defaultModelId = defaultModel.length > 0 ? defaultModel[0].id : 1; // Fallback, ensure a model exists

            await db.insert(aiPrompts).values([
                {
                    modelId: defaultModelId,
                    name: 'Invoice Generator',
                    description: 'Creates professional invoices with customizable fields',
                    purpose: 'financial_document',
                    systemPrompt: 'Create a professional invoice with the following details: {{details}}. Include company branding for {{company}}, invoice number, date, due date, itemized services with descriptions, quantities, rates, and total amount. Add payment instructions for {{paymentMethod}}.',
                    // isActive, isDefault, temperature, topP, etc. have defaults
                },
                {
                    modelId: defaultModelId,
                    name: 'Contract Drafter',
                    description: 'Drafts comprehensive contracts based on provided terms',
                    purpose: 'legal_document',
                    systemPrompt: 'Draft a comprehensive {{type}} contract between {{party1}} and {{party2}}. Include the following terms: {{terms}}. The contract should be governed by {{jurisdiction}} law and include standard clauses for termination, dispute resolution, and confidentiality.',
                },
                {
                    modelId: defaultModelId,
                    name: 'Email Composer',
                    description: 'Creates professional emails for various business purposes',
                    purpose: 'communication',
                    systemPrompt: 'Compose a {{tone}} email to {{recipient}} regarding {{subject}}. The email should include: {{details}}. End with an appropriate call to action and professional signature for {{senderName}} from {{company}}.',
                }
            ]).execute();
            console.log('Default prompt templates created.');
        } else {
            console.log(`${existingPrompts.length} prompt templates already exist.`);
        }

        // 4. Set up default agent tools
        console.log('Setting up default agent tools...');
        const existingTools = await db.select().from(agentTools).execute();

        if (existingTools.length === 0) {
            // This section needs to align with agentTools schema
            await db.insert(agentTools).values([
                {
                    name: 'Google Drive Integration',
                    description: 'Allows agents to read from and write to Google Drive',
                    category: 'integration',
                    type: 'custom_api', // Example type, ensure this matches a defined tool type
                    config: {
                        // Example config, adjust based on actual custom_api tool needs
                        endpoint: "https://www.googleapis.com/drive/v3",
                        authMethod: "oauth2"
                    },
                    icon: 'google-drive',
                    isActive: true,
                    isSystem: true,
                },
                {
                    name: 'Email Sender',
                    description: 'Allows agents to compose and send emails through configured email providers',
                    category: 'action',
                    type: 'email',
                    config: {
                        provider: "smtp", // Example
                        credentialId: null // Placeholder, user would configure this
                    },
                    icon: 'mail',
                    isActive: true,
                    isSystem: true,
                },
                {
                    name: 'Web Search',
                    description: 'Enables agents to search the web for up-to-date information',
                    category: 'retrieval',
                    type: 'search',
                    config: {
                        provider: "google", // Example
                        apiKey: null // Placeholder, user would configure this
                    },
                    icon: 'search-icon',
                    isActive: true,
                    isSystem: true,
                }
            ]).execute();
            console.log('Default agent tools created.');
        } else {
            console.log(`${existingTools.length} agent tools already exist.`);
        }

        // 5. Set up guardrails schema if it doesn't exist
        console.log('Setting up agent guardrails schema...');
        try {
            // This is a placeholder for creating guardrails schema
            // You'll need to adjust this based on your actual database schema
            // Drizzle doesn't directly support CREATE TABLE IF NOT EXISTS in its query builder for all DBs in a universal way.
            // Raw SQL execution is used here.
            await db.execute(`
        CREATE TABLE IF NOT EXISTS agent_guardrails (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          rules TEXT NOT NULL, -- Consider JSONB if your DB supports it well with Neon
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

            // Insert default guardrails
            // Using raw SQL for INSERT ... WHERE NOT EXISTS for idempotency
            await db.execute(`
        INSERT INTO agent_guardrails (name, description, rules, is_active)
        SELECT
          'Content Safety',
          'Prevents generation of harmful, unethical, or inappropriate content',
          '{"banned_topics": ["violence", "hate_speech", "adult_content"], "content_filtering": "strict", "blocked_actions": ["file_deletion", "system_changes"]}',
          true
        WHERE NOT EXISTS (
          SELECT 1 FROM agent_guardrails WHERE name = 'Content Safety'
        )
      `);

            console.log('Agent guardrails schema and default rules created.');
        } catch (error) {
            console.log('Note: Unable to create guardrails schema directly. You may need to adjust your migration files or handle this manually.', error);
        }

        // 6. Update site settings
        console.log('Updating site settings...');
        const existingSettings = await db.select().from(siteSettings).execute();

        if (existingSettings.length === 0) {
            // This section needs to align with siteSettings schema
            await db.insert(siteSettings).values({
                // All fields in siteSettings have defaults, so an empty object insert
                // would use all default values. Or override specific jsonb fields:
                logo: { url: '/assets/images/mirxa-logo.svg', showText: true, text: "Mirxa.io", animated: true }, // Example override
                // colors, header, footer, chatbot, widgets will use defaults from schema
                // version, lastUpdated have defaults
                // updatedBy is optional
            }).execute();
            console.log('Site settings created with defaults (or specified overrides).');
        } else {
            console.log('Site settings already exist.');
        }

        console.log('Admin dashboard enhancement complete!');

    } catch (error) {
        console.error('Error enhancing admin dashboard:', error);
        process.exit(1);
    }
}

enhanceAdminDashboard();
