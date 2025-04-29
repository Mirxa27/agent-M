import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import config from "./config";

// Required for Neon serverless connections
neonConfig.webSocketConstructor = ws;

// Connection pool configuration with settings from config
export const pool = new Pool({
  connectionString: config.database.url,
  max: config.database.poolMax,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
});

// Log connection events for monitoring
pool.on("connect", (client) => {
  console.log("New database connection established");
});

pool.on("error", (err) => {
  console.error("Unexpected database connection error:", err);
});

// Initialize Drizzle ORM with the connection pool and schema
export const db = drizzle({ client: pool, schema });

// Health check function to test database connectivity
export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    client.release();
    console.log("Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// Handle graceful shutdown to close database connections properly
process.on("SIGINT", async () => {
  console.log("Closing database pool connections...");
  await pool.end();
  console.log("Database pool connections closed");
  process.exit(0);
});

// Initialize connection check
checkDatabaseConnection().catch(console.error);
