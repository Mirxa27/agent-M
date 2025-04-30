/**
 * Script to create example tasks for each agent template
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

// Example tasks for each agent
const agentTasks = [
  {
    agent: "Website Builder",
    tasks: [
      {
        title: "Create a Portfolio Website",
        description: "Design a professional portfolio website for a photographer with a minimalist style, gallery section, about page, and contact form.",
        status: "pending"
      },
      {
        title: "E-commerce Product Page",
        description: "Build a responsive product page template for an e-commerce website selling handmade jewelry, with product images, description, pricing, and add-to-cart functionality.",
        status: "pending"
      },
      {
        title: "Restaurant Website",
        description: "Create a website for a new Mediterranean restaurant featuring menu sections, reservation form, location map, and mobile-friendly design.",
        status: "pending"
      }
    ]
  },
  {
    agent: "Personal Secretary",
    tasks: [
      {
        title: "Weekly Schedule Organization",
        description: "Organize my calendar for next week including 3 client meetings, a team workshop on Thursday afternoon, and block 2 hours each day for focused work.",
        status: "pending"
      },
      {
        title: "Travel Planning",
        description: "Help me plan a business trip to Dubai next month including flight options, hotel recommendations, and scheduling meetings with local partners.",
        status: "pending"
      },
      {
        title: "Email Management",
        description: "Draft follow-up emails to the participants of yesterday's product launch meeting, summarizing key points and next steps.",
        status: "pending"
      }
    ]
  },
  {
    agent: "Multilingual Contract Writer",
    tasks: [
      {
        title: "Software Development Agreement",
        description: "Draft a software development contract between a Saudi company and a US-based developer, including IP rights, payment terms, and project milestones. Provide in both English and Arabic.",
        status: "pending"
      },
      {
        title: "Employment Contract Review",
        description: "Review this employment contract for a marketing director position and identify any clauses that may be problematic under UAE labor laws. Suggest improvements where needed.",
        status: "pending"
      },
      {
        title: "International Distribution Agreement",
        description: "Create a distribution agreement for a Saudi manufacturer looking to distribute products in European markets. Include territory definitions, exclusivity terms, and compliance requirements.",
        status: "pending"
      }
    ]
  },
  {
    agent: "Content Creator",
    tasks: [
      {
        title: "Product Launch Campaign",
        description: "Create a complete content package for our new smart home device launch, including blog post, social media announcements for Instagram and LinkedIn, and email newsletter.",
        status: "pending"
      },
      {
        title: "SEO-Optimized Blog Series",
        description: "Develop a 3-part blog series about sustainable investing trends for our financial advisory firm, optimized for search terms 'ESG investing', 'sustainable portfolio', and 'impact investing'.",
        status: "pending"
      },
      {
        title: "Social Media Content Calendar",
        description: "Create a month's worth of social media content for our fitness app, including motivational posts, workout tips, success stories, and promotional content balanced throughout the month.",
        status: "pending"
      }
    ]
  },
  {
    agent: "Data Analyst",
    tasks: [
      {
        title: "E-commerce Sales Analysis",
        description: "Analyze our quarterly e-commerce sales data to identify top-performing products, sales trends, and customer segments. Create visualizations and provide recommendations.",
        status: "pending"
      },
      {
        title: "Customer Satisfaction Survey Analysis",
        description: "Process and analyze results from our recent customer satisfaction survey with 500+ responses. Identify key areas of strength and opportunities for improvement.",
        status: "pending"
      },
      {
        title: "Market Trend Prediction",
        description: "Using our historical sales data and market research, generate predictions for upcoming market trends in the renewable energy sector for Q3 and Q4 2025.",
        status: "pending"
      }
    ]
  }
];

// Example conversation messages for tasks
const taskMessages = [
  {
    role: "system",
    content: "I am your AI assistant specialized in this task. I'll help you complete it efficiently while providing high-quality results."
  },
  {
    role: "user",
    content: "I'd like to get started with this task. What information do you need from me?"
  },
  {
    role: "assistant",
    content: "I'd be happy to help you with this task. To get started, I'll need some specific details to ensure I deliver exactly what you need. Let me analyze the requirements first."
  },
  {
    role: "assistant",
    content: "Based on your task description, here are some questions to help me understand your requirements better:\n\n1. What's your target audience for this?\n2. Do you have any specific preferences or examples you'd like me to reference?\n3. What's your timeline for completion?\n\nOnce I have this information, I can begin working on your request."
  }
];

async function createAgentTasks() {
  console.log('Creating example tasks for agent templates...');

  try {
    // Current timestamp
    const now = new Date();

    // Get admin user ID
    const adminUser = await pool.query(
      "SELECT id FROM users WHERE username = 'admin'"
    );
    
    if (adminUser.rows.length === 0) {
      console.error('Admin user not found.');
      return;
    }
    
    const adminId = adminUser.rows[0].id;

    for (const agentTaskSet of agentTasks) {
      // Find the agent by name
      const agent = await pool.query(
        'SELECT id FROM agents WHERE name = $1 AND user_id = $2',
        [agentTaskSet.agent, adminId]
      );

      if (agent.rows.length === 0) {
        console.log(`Agent "${agentTaskSet.agent}" not found, skipping tasks.`);
        continue;
      }

      const agentId = agent.rows[0].id;
      
      // Create tasks for this agent
      for (const task of agentTaskSet.tasks) {
        // Check if task already exists
        const existingTask = await pool.query(
          'SELECT id FROM tasks WHERE title = $1 AND agent_id = $2',
          [task.title, agentId]
        );

        if (existingTask.rows.length > 0) {
          console.log(`Task "${task.title}" already exists for agent "${agentTaskSet.agent}", skipping.`);
          continue;
        }

        // Insert new task
        const result = await pool.query(
          `INSERT INTO tasks (
            user_id, agent_id, title, description, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [
            adminId,
            agentId,
            task.title,
            task.description,
            task.status,
            now
          ]
        );
        
        const taskId = result.rows[0].id;
        console.log(`Created task "${task.title}" (ID: ${taskId}) for agent "${agentTaskSet.agent}"`);
        
        // Add initial conversation messages
        for (const message of taskMessages) {
          await pool.query(
            `INSERT INTO messages (
              task_id, role, content, created_at
            ) VALUES ($1, $2, $3, $4)`,
            [
              taskId,
              message.role,
              message.content,
              now
            ]
          );
        }
      }
      
      // Update agent task count
      const taskCount = await pool.query(
        'SELECT COUNT(*) as count FROM tasks WHERE agent_id = $1',
        [agentId]
      );
      
      await pool.query(
        'UPDATE agents SET task_count = $1, updated_at = $2 WHERE id = $3',
        [
          taskCount.rows[0].count,
          now,
          agentId
        ]
      );
    }

    console.log('Example tasks created successfully.');
  } catch (error) {
    console.error('Error creating agent tasks:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
createAgentTasks();