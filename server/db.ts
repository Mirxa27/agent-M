import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Required for Neon serverless connections
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Connection pool configuration with optimized settings for production
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // Maximum time to wait for a connection from the pool
});

// Log connection events for monitoring
pool.on('connect', (client) => {
  console.log('New database connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected database connection error:', err);
});

// Initialize Drizzle ORM with the connection pool and schema
export const db = drizzle(pool, { schema });

// Health check function to test database connectivity
export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Handle graceful shutdown to close database connections properly
process.on('SIGINT', async () => {
  console.log('Closing database pool connections...');
  await pool.end();
  console.log('Database pool connections closed');
  process.exit(0);
});

// Initialize connection check
checkDatabaseConnection().catch(console.error);