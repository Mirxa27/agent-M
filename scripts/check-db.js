// Check database connectivity and structure for deployment
const { Pool } = require("@neondatabase/serverless");
const dotenv = require("dotenv");
const ws = require("ws");

// Load environment variables
dotenv.config();

// Required for Neon serverless connections
require("@neondatabase/serverless").neonConfig.webSocketConstructor = ws;

async function checkDatabase() {
  let pool;

  try {
    console.log("Checking database connection...");

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 10000,
    });

    // Test connection
    const client = await pool.connect();
    console.log("✅ Database connection successful");

    // Check for required tables
    const requiredTables = [
      "users",
      "agents",
      "agent_tools",
      "credentials",
      "files",
      "tasks",
      "messages",
      "task_files",
      "ai_providers",
      "ai_models",
      "ai_prompts",
      "plans",
      "user_activities",
      "dashboard_preferences",
      "analytics",
    ];

    console.log("\nChecking database tables...");

    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const existingTables = tables.map((t) => t.table_name);
    console.log("Existing tables:", existingTables.join(", "));

    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table),
    );

    if (missingTables.length > 0) {
      console.log("\n⚠️ Missing tables:", missingTables.join(", "));
      console.log('Run "npm run db:push" to create missing tables');
    } else {
      console.log("\n✅ All required tables exist");
    }

    // Check for user count
    const { rows: userCount } = await client.query(
      "SELECT COUNT(*) FROM users",
    );
    console.log(`\nUser count: ${userCount[0].count}`);

    // Release the client back to the pool
    client.release();

    console.log("\n✅ Database is ready for deployment!");
  } catch (error) {
    console.error("❌ Database check failed:", error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

checkDatabase().catch(console.error);
