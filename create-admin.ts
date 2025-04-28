import { db } from './server/db';
import { users } from './shared/schema';
import { hashPassword } from './server/auth';

async function createAdminUser() {
  try {
    // Define admin user details
    const adminUsername = 'admin';
    const adminPassword = 'tU5&RhL+hzm(';
    const adminEmail = 'admin@mirxa.io';
    const adminFullName = 'Mirxa Administrator';

    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, adminUsername),
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await hashPassword(adminPassword);

    // Create admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        username: adminUsername,
        password: hashedPassword,
        email: adminEmail,
        fullName: adminFullName,
        role: 'admin',
      })
      .returning();

    console.log('✅ Admin user created successfully');
    console.log('Username:', adminUsername);
    console.log('Password:', adminPassword);
    console.log('Email:', adminEmail);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();