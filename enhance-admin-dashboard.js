// enhance-admin-dashboard.js
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { agentTools, aiModels, aiPrompts, aiProviders, siteSettings } from './shared/db/schema.js';

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
                    icon: 'openai-logo.png',
                    isActive: true,
                    apiKeyName: 'OPENAI_API_KEY',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Anthropic',
                    icon: 'anthropic-logo.png',
                    isActive: true,
                    apiKeyName: 'ANTHROPIC_API_KEY',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'xAI',
                    icon: 'xai-logo.png',
                    isActive: true,
                    apiKeyName: 'XAI_API_KEY',
                    createdAt: new Date(),
                    updatedAt: new Date()
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
            const providers = await db.select().from(aiProviders).execute();
            const providerMap = {};

            providers.forEach(provider => {
                providerMap[provider.name] = provider.id;
            });

            if (providerMap['OpenAI']) {
                await db.insert(aiModels).values([
                    {
                        name: 'GPT-4o',
                        providerId: providerMap['OpenAI'],
                        isActive: true,
                        modelId: 'gpt-4o',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                    {
                        name: 'GPT-4-Turbo',
                        providerId: providerMap['OpenAI'],
                        isActive: true,
                        modelId: 'gpt-4-turbo',
                        createdAt: new Date(),
                        updatedAt: new Date()
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
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                    {
                        name: 'Claude 3 Sonnet',
                        providerId: providerMap['Anthropic'],
                        isActive: true,
                        modelId: 'claude-3-sonnet-20240229',
                        createdAt: new Date(),
                        updatedAt: new Date()
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
            await db.insert(aiPrompts).values([
                {
                    name: 'Invoice Generator',
                    description: 'Creates professional invoices with customizable fields',
                    promptText: 'Create a professional invoice with the following details: {{details}}. Include company branding for {{company}}, invoice number, date, due date, itemized services with descriptions, quantities, rates, and total amount. Add payment instructions for {{paymentMethod}}.',
                    category: 'Financial',
                    tags: ['invoice', 'billing', 'financial'],
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Contract Drafter',
                    description: 'Drafts comprehensive contracts based on provided terms',
                    promptText: 'Draft a comprehensive {{type}} contract between {{party1}} and {{party2}}. Include the following terms: {{terms}}. The contract should be governed by {{jurisdiction}} law and include standard clauses for termination, dispute resolution, and confidentiality.',
                    category: 'Legal',
                    tags: ['contract', 'legal', 'agreement'],
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Email Composer',
                    description: 'Creates professional emails for various business purposes',
                    promptText: 'Compose a {{tone}} email to {{recipient}} regarding {{subject}}. The email should include: {{details}}. End with an appropriate call to action and professional signature for {{senderName}} from {{company}}.',
                    category: 'Communication',
                    tags: ['email', 'outreach', 'communication'],
                    createdAt: new Date(),
                    updatedAt: new Date()
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
            await db.insert(agentTools).values([
                {
                    name: 'Google Drive Integration',
                    description: 'Allows agents to read from and write to Google Drive',
                    toolType: 'integration',
                    configSchema: JSON.stringify({
                        required: ['clientId', 'clientSecret'],
                        properties: {
                            clientId: {
                                type: 'string',
                                description: 'Google Client ID'
                            },
                            clientSecret: {
                                type: 'string',
                                description: 'Google Client Secret'
                            }
                        }
                    }),
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Email Sender',
                    description: 'Allows agents to compose and send emails through configured email providers',
                    toolType: 'action',
                    configSchema: JSON.stringify({
                        required: ['smtpServer', 'smtpPort', 'username', 'password'],
                        properties: {
                            smtpServer: {
                                type: 'string',
                                description: 'SMTP Server'
                            },
                            smtpPort: {
                                type: 'number',
                                description: 'SMTP Port'
                            },
                            username: {
                                type: 'string',
                                description: 'Email Username'
                            },
                            password: {
                                type: 'string',
                                description: 'Email Password'
                            }
                        }
                    }),
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Web Search',
                    description: 'Enables agents to search the web for up-to-date information',
                    toolType: 'retrieval',
                    configSchema: JSON.stringify({
                        required: ['apiKey', 'searchEngine'],
                        properties: {
                            apiKey: {
                                type: 'string',
                                description: 'Search API Key'
                            },
                            searchEngine: {
                                type: 'string',
                                enum: ['google', 'bing', 'duckduckgo'],
                                description: 'Search Engine'
                            }
                        }
                    }),
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
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
            await db.execute(`
        CREATE TABLE IF NOT EXISTS agent_guardrails (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          rules TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

            // Insert default guardrails
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
            console.log('Note: Unable to create guardrails schema directly. You may need to adjust your migration files.');
        }

        // 6. Update site settings
        console.log('Updating site settings...');
        const existingSettings = await db.select().from(siteSettings).execute();

        if (existingSettings.length === 0) {
            await db.insert(siteSettings).values({
                siteName: 'Mirxa.io',
                siteDescription: 'One prompt, many finished documents—Mirxa.io turns work into autopilot.',
                primaryColor: '#4f46e5',
                logoUrl: '/logo.png',
                faviconUrl: '/favicon.ico',
                createdAt: new Date(),
                updatedAt: new Date()
            }).execute();
            console.log('Site settings created.');
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
