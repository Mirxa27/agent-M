// Script to create an admin user
import { pool } from './server/db.js';
import { hashPassword } from './server/auth.js';
import crypto from 'crypto';

// Generate a secure password
const generateSecurePassword = () => {
  const length = 12;
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[crypto.randomInt(0, chars.length)];
  }
  return password;
};

async function createAdminUser() {
  try {
    // Admin user details
    const adminUser = {
      username: 'admin',
      email: 'admin@mirxa.io',
      fullName: 'Admin User',
      role: 'admin',
      plan: 'enterprise'
    };
    
    // Generate a secure password
    const password = generateSecurePassword();
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Check if admin already exists
    const checkResult = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [adminUser.username, adminUser.email]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists');
      await pool.end();
      return;
    }
    
    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, full_name, role, plan) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [
        adminUser.username,
        adminUser.email,
        hashedPassword,
        adminUser.fullName,
        adminUser.role,
        adminUser.plan
      ]
    );
    
    if (result.rows.length > 0) {
      console.log('Admin user created successfully');
      console.log('Username:', adminUser.username);
      console.log('Password:', password);
      console.log('Role:', adminUser.role);
      console.log('Email:', adminUser.email);
      console.log('Please save these credentials in a secure place.');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();