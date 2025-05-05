// fix it - Resolved Git Merge Conflict

// Use MySQL for database connection as indicated by the function's logic
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Removed NeonDB specific imports and configuration as the function uses MySQL

async function checkDatabase() {
  let connection;

  try {
    console.log("Checking database connection...");

    // Ensure required environment variables for MySQL are set
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      throw new Error("Database environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) are not set");
    }

    // Use mysql2/promise to create the connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      // Ensure DB_PORT is handled correctly, provide a default if needed or make it required
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306, // Default MySQL port
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

    // Query tables using MySQL syntax
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      ORDER BY table_name;
    `, [process.env.DB_NAME]); // Use query parameters for safety

    const existingTables = tables.map((t) => t.table_name); // Note: column name might be lowercase depending on DB/driver
    console.log("Existing tables:", existingTables.join(", "));

    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table),
    );

    if (missingTables.length > 0) {
      console.log("\n⚠️ Missing tables:", missingTables.join(", "));
      console.log('Run "npm run db:push" or your migration command to create missing tables');
    } else {
      console.log("\n✅ All required tables exist");
    }

    // Check for user count
    const [userCountResult] = await connection.query(
      "SELECT COUNT(*) AS count FROM users",
    );
    console.log(`\nUser count: ${userCountResult[0].count}`);

    console.log("\n✅ Database is ready for deployment!");
  } catch (error) {
    console.error("❌ Database check failed:", error.message);
    // Log the stack trace for better debugging
    if (error.stack) {
        console.error("Stack Trace:", error.stack);
    }
    // Optionally provide more specific error handling based on error codes (e.g., connection refused, auth failed)
    process.exit(1); // Exit with a non-zero code to indicate failure
  } finally {
    if (connection) {
      await connection.end();
      console.log("Database connection closed.");
    }
  }
}

checkDatabase().catch((err) => {
  // Catch any unhandled promise rejections from checkDatabase itself
  console.error("❌ Unhandled error during database check:", err);
  process.exit(1);
});