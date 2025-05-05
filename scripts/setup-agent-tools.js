// Script to set up AI agent tools through the admin API

import fetch from 'node-fetch';

async function loginAsAdmin() {
  try {
    console.log('Logging in as admin...');
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123', // This should match your admin password
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    // Extract cookies from response
    const cookies = response.headers.get('set-cookie');
    if (!cookies) {
      throw new Error('No cookies returned from login');
    }

    return cookies;
  } catch (error) {
    console.error('Admin login failed:', error);
    throw error;
  }
}

async function setupTools(sessionCookie) {
  try {
    console.log('Setting up AI agent tools...');
    const response = await fetch('http://localhost:5000/api/admin/register-tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`Failed to set up tools: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Tools setup result:', result);
    return result;
  } catch (error) {
    console.error('Error setting up tools:', error);
    throw error;
  }
}

async function setupProviderCredentials(sessionCookie) {
  try {
    console.log('Setting up AI provider credentials...');
    
    // Define the provider credentials
    const providers = [
      {
        name: 'OpenAI',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        service: 'openai',
        icon: 'sparkles'
      },
      {
        name: 'Anthropic',
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        service: 'anthropic',
        icon: 'brain'
      },
      {
        name: 'xAI',
        apiKeyEnvVar: 'XAI_API_KEY',
        service: 'xai',
        icon: 'zap'
      },
      {
        name: 'Perplexity',
        apiKeyEnvVar: 'PERPLEXITY_API_KEY',
        service: 'perplexity',
        icon: 'search'
      }
    ];
    
    for (const provider of providers) {
      const response = await fetch('http://localhost:5000/api/admin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify({
          name: `${provider.name} API Key`,
          type: 'api_key',
          authMethod: 'api_key',
          service: provider.service,
          data: {
            api_key: process.env[provider.apiKeyEnvVar],
            provider: provider.service,
            icon: provider.icon
          }
        })
      });

      if (!response.ok) {
        console.warn(`Warning: Failed to add credential for ${provider.name}: ${response.statusText}`);
        continue;
      }

      const result = await response.json();
      console.log(`${provider.name} credential setup result:`, result.success ? 'Success' : 'Failed');
    }
    
    return { success: true, message: 'Provider credentials setup completed' };
  } catch (error) {
    console.error('Error setting up provider credentials:', error);
    throw error;
  }
}

async function setupAgentTemplates(sessionCookie) {
  try {
    console.log('Setting up AI agent templates...');
    
    const templates = [
      {
        name: 'Website Builder',
        description: 'Creates and designs complete website projects based on your specifications',
        type: 'builder',
        icon: 'layout',
        isTemplate: true,
        isActive: true,
        tools: ['OpenAI Chat', 'Anthropic Claude', 'Grok by xAI', 'Code Generator'],
        config: {
          instructions: 'You are a specialized AI agent for website design and development. Create complete, responsive websites based on user requirements.',
          model: 'gpt-4o',
          temperature: 0.7,
          capabilities: ['website design', 'code generation', 'UI/UX design', 'responsive layouts']
        }
      },
      {
        name: 'Personal Secretary',
        description: 'Manages schedules, drafts communications, and handles administrative tasks',
        type: 'assistant',
        icon: 'calendar',
        isTemplate: true,
        isActive: true,
        tools: ['OpenAI Chat', 'Anthropic Claude'],
        config: {
          instructions: 'You are a smart personal assistant. Help organize schedules, draft emails, and manage administrative tasks efficiently.',
          model: 'claude-3-7-sonnet-20250219',
          temperature: 0.5,
          capabilities: ['email drafting', 'scheduling', 'task organization', 'meeting preparation']
        }
      },
      {
        name: 'Multilingual Contract Writer',
        description: 'Creates and translates legal documents and contracts across multiple languages',
        type: 'writer',
        icon: 'fileCheck',
        isTemplate: true,
        isActive: true,
        tools: ['OpenAI Chat', 'Anthropic Claude', 'Content Optimizer'],
        config: {
          instructions: 'You are a specialized agent for drafting, analyzing, and translating legal contracts in multiple languages.',
          model: 'gpt-4o',
          temperature: 0.3,
          capabilities: ['contract creation', 'legal analysis', 'multilingual translation', 'document review']
        }
      },
      {
        name: 'Content Creator',
        description: 'Generates high-quality content for blogs, social media, and marketing materials',
        type: 'creator',
        icon: 'pencil',
        isTemplate: true,
        isActive: true,
        tools: ['OpenAI Chat', 'Anthropic Claude', 'Content Optimizer'],
        config: {
          instructions: 'You are a creative AI agent specialized in generating engaging content for various platforms and purposes.',
          model: 'claude-3-7-sonnet-20250219',
          temperature: 0.8,
          capabilities: ['blog writing', 'social media content', 'copywriting', 'content strategy']
        }
      },
      {
        name: 'Data Analyst',
        description: 'Analyzes datasets and provides actionable insights using AI-powered tools',
        type: 'analyst',
        icon: 'barChart',
        isTemplate: true,
        isActive: true,
        tools: ['OpenAI Chat', 'OpenRouter AI', 'Grok by xAI', 'Data Analyzer'],
        config: {
          instructions: 'You are a data analysis expert. Analyze datasets, identify trends, and provide actionable insights with visualizations.',
          model: 'anthropic/claude-3-5-sonnet',
          temperature: 0.2,
          provider: 'openrouter',
          capabilities: ['data analysis', 'statistical modeling', 'trend identification', 'visualization recommendation']
        }
      }
    ];
    
    for (const template of templates) {
      const response = await fetch('http://localhost:5000/api/admin/agent-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify(template)
      });

      if (!response.ok) {
        console.warn(`Warning: Failed to add template ${template.name}: ${response.statusText}`);
        continue;
      }

      const result = await response.json();
      console.log(`${template.name} template setup result:`, result.success ? 'Success' : 'Failed');
    }
    
    return { success: true, message: 'Agent templates setup completed' };
  } catch (error) {
    console.error('Error setting up agent templates:', error);
    throw error;
  }
}

async function setupExampleTasks(sessionCookie) {
  try {
    console.log('Setting up example tasks for agent templates...');
    
    // First get all agent templates
    const templatesResponse = await fetch('http://localhost:5000/api/admin/agent-templates', {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    if (!templatesResponse.ok) {
      throw new Error(`Failed to fetch agent templates: ${templatesResponse.statusText}`);
    }
    
    const templates = await templatesResponse.json();
    
    // Example tasks for each template type
    const tasksByType = {
      'builder': [
        {
          title: 'Create a Portfolio Website',
          description: 'Design a modern portfolio website for a graphic designer with sections for projects, about, services, and contact information.',
          priority: 'high'
        },
        {
          title: 'Build an E-commerce Product Page',
          description: 'Create a responsive product page with image gallery, product details, pricing, and add-to-cart functionality.',
          priority: 'medium'
        }
      ],
      'assistant': [
        {
          title: 'Weekly Meeting Schedule',
          description: 'Organize my meetings for next week, sending calendar invites and preparing agenda templates for each.',
          priority: 'high'
        },
        {
          title: 'Draft Client Follow-up Emails',
          description: 'Create personalized follow-up emails for the prospects from the conference last week.',
          priority: 'medium'
        }
      ],
      'writer': [
        {
          title: 'Draft a Service Agreement',
          description: 'Create a comprehensive service agreement for a software development company that includes scope of work, payment terms, and intellectual property clauses.',
          priority: 'high'
        },
        {
          title: 'Translate NDA to Spanish and French',
          description: 'Translate our standard non-disclosure agreement to Spanish and French while ensuring all legal terminology is accurate.',
          priority: 'medium'
        }
      ],
      'creator': [
        {
          title: 'Create Social Media Campaign',
          description: 'Develop a month-long social media campaign for a new product launch including post copy, hashtags, and content themes.',
          priority: 'high'
        },
        {
          title: 'Write Blog Series on Industry Trends',
          description: 'Create a 5-part blog series analyzing the latest trends in artificial intelligence and its impact on various industries.',
          priority: 'medium'
        }
      ],
      'analyst': [
        {
          title: 'Market Research Analysis',
          description: 'Analyze the attached market research data and provide insights on consumer preferences and emerging trends in the industry.',
          priority: 'high'
        },
        {
          title: 'Quarterly Sales Performance Report',
          description: 'Create a comprehensive analysis of Q1 sales data, identifying key performance indicators and areas for improvement.',
          priority: 'medium'
        }
      ]
    };
    
    for (const template of templates) {
      const tasks = tasksByType[template.type];
      if (!tasks) continue;
      
      for (const task of tasks) {
        const response = await fetch('http://localhost:5000/api/admin/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie
          },
          body: JSON.stringify({
            ...task,
            agentId: template.id,
            status: 'pending',
            isExample: true
          })
        });

        if (!response.ok) {
          console.warn(`Warning: Failed to add task for ${template.name}: ${response.statusText}`);
          continue;
        }
      }
      
      console.log(`Example tasks created for ${template.name}`);
    }
    
    return { success: true, message: 'Example tasks setup completed' };
  } catch (error) {
    console.error('Error setting up example tasks:', error);
    throw error;
  }
}

async function main() {
  try {
    // Login as admin to get session cookie
    const sessionCookie = await loginAsAdmin();
    
    // Set up agent tools
    await setupTools(sessionCookie);
    
    // Set up provider credentials 
    await setupProviderCredentials(sessionCookie);
    
    // Set up agent templates
    await setupAgentTemplates(sessionCookie);
    
    // Set up example tasks
    await setupExampleTasks(sessionCookie);
    
    console.log('Complete setup finished successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
main();