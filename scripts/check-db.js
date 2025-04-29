const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkDatabase() {
  let connection;

  try {
    console.log("Checking database connection...");

    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      throw new Error("Database environment variables are not set");
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

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

    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${process.env.DB_NAME}'
      ORDER BY table_name;
    `);

    const existingTables = tables.map((t) => t.TABLE_NAME);
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
    const [userCount] = await connection.query(
      "SELECT COUNT(*) AS count FROM users",
    );
    console.log(`\nUser count: ${userCount[0].count}`);

    console.log("\n✅ Database is ready for deployment!");
  } catch (error) {
    console.error("❌ Database check failed:", error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabase().catch(console.error);
