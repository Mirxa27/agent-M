// setup-admin.js
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { users } from './shared/schema.js';

dotenv.config();

// Secure hash function for passwords - matches the schema format
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    // Match the format expected by the application
    return `${hash}.${salt}`;
}

async function createAdmin() {
    const { DATABASE_URL } = process.env;

    if (!DATABASE_URL) {
        console.error('DATABASE_URL environment variable is not set.');
        process.exit(1);
    }

    // Default admin credentials
    const email = 'admin@mirxa.io';
    const password = 'Admin123!'; // You should change this in production
    const username = 'admin';

    try {
        // Initialize database client
        const sql = neon(DATABASE_URL);
        const db = drizzle(sql);

        // Check if admin user already exists
        const existingUser = await db.select()
            .from(users)
            .where(users.email.equals(email))
            .execute();

        if (existingUser.length > 0) {
            console.log(`Admin user with email ${email} already exists.`);
            process.exit(0);
        }

        // Create password hash
        const hashedPassword = hashPassword(password);

        // Insert the admin user
        await db.insert(users)
            .values({
                email,
                username,
                password: hashedPassword, // Match the column name in schema
                fullName: 'Admin User',
                role: 'admin',
                isActive: true
            })
            .execute();

        console.log(`Admin user created with email: ${email} and username: ${username}`);
        console.log('Password:', password);
        console.log('Remember to change this password after first login!');
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin();
