import { hashPassword } from './server/auth';
import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';
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
    const existingUser = await db.select().from(users).where(eq(users.username, adminUser.username));
    
    if (existingUser.length > 0) {
      console.log('Admin user already exists');
      
      // Generate a new password for the existing admin
      const newPassword = generateSecurePassword();
      const newHashedPassword = await hashPassword(newPassword);
      
      // Update the admin password
      await db.update(users)
        .set({ password: newHashedPassword })
        .where(eq(users.id, existingUser[0].id));
      
      console.log('Admin password has been reset');
      console.log('Username:', adminUser.username);
      console.log('New Password:', newPassword);
      console.log('Role:', existingUser[0].role);
      console.log('Email:', existingUser[0].email);
      console.log('Please save these credentials in a secure place.');
      return;
    }
    
    // Insert admin user
    const result = await db.insert(users).values({
      username: adminUser.username,
      email: adminUser.email,
      password: hashedPassword,
      fullName: adminUser.fullName,
      role: adminUser.role,
      plan: adminUser.plan
    }).returning();
    
    if (result.length > 0) {
      console.log('Admin user created successfully');
      console.log('Username:', adminUser.username);
      console.log('Password:', password);
      console.log('Role:', adminUser.role);
      console.log('Email:', adminUser.email);
      console.log('Please save these credentials in a secure place.');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();