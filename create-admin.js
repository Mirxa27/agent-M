import { Pool, neonConfig } from '@neondatabase/serverless';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import ws from 'ws';

// Configure neon for WebSockets
neonConfig.webSocketConstructor = ws;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    // Database connection
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Define admin user details
    const adminUsername = 'admin';
    const adminPassword = 'tU5&RhL+hzm(';
    const adminEmail = 'admin@mirxa.io';
    const adminFullName = 'Mirxa Administrator';

    // Check if admin already exists
    const checkQuery = 'SELECT * FROM users WHERE username = $1';
    const existingUser = await pool.query(checkQuery, [adminUsername]);
    
    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await hashPassword(adminPassword);

    // Create admin user
    const insertQuery = `
      INSERT INTO users (username, password, email, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const res = await pool.query(insertQuery, [
      adminUsername,
      hashedPassword,
      adminEmail,
      adminFullName,
      'admin'
    ]);

    const user = res.rows[0];
    
    console.log('✅ Admin user created successfully');
    console.log('Username:', adminUsername);
    console.log('Password:', adminPassword);
    console.log('Email:', adminEmail);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();