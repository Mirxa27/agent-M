const readline = require('readline');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const { hashPassword } = require('./hashPassword');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const questions = [
  { key: 'DB_HOST', question: 'Enter your MySQL host: ' },
  { key: 'DB_PORT', question: 'Enter your MySQL port: ', default: '3306' },
  { key: 'DB_USER', question: 'Enter your MySQL user: ' },
  { key: 'DB_PASSWORD', question: 'Enter your MySQL password: ' },
  { key: 'DB_NAME', question: 'Enter your MySQL database name: ' },
  { key: 'SMTP_HOST', question: 'Enter your SMTP host: ' },
  { key: 'SMTP_PORT', question: 'Enter your SMTP port: ', default: '465' },
  { key: 'SMTP_USER', question: 'Enter your SMTP user: ' },
  { key: 'SMTP_PASS', question: 'Enter your SMTP password: ' },
  { key: 'EMAIL_FROM', question: 'Enter your email from address: ' },
  { key: 'ADMIN_USERNAME', question: 'Enter admin username: ', default: 'admin' },
  { key: 'ADMIN_PASSWORD', question: 'Enter admin password: ' },
  { key: 'ADMIN_EMAIL', question: 'Enter admin email: ' },
  { key: 'ADMIN_FULL_NAME', question: 'Enter admin full name: ', default: 'Administrator' },
  { key: 'OPENAI_API_KEY', question: 'Enter your OpenAI API key: ' },
  { key: 'ANTHROPIC_API_KEY', question: 'Enter your Anthropic API key: ' },
  { key: 'XAI_API_KEY', question: 'Enter your xAI API key: ' },
  { key: 'PERPLEXITY_API_KEY', question: 'Enter your Perplexity API key: ' },
];

const answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
    return setup();
  }

  const { key, question, default: defaultValue } = questions[index];
  rl.question(question, (answer) => {
    answers[key] = answer || defaultValue;
    askQuestion(index + 1);
  });
}

async function setup() {
  rl.close();

  // Write to .env file
  const envPath = path.resolve(__dirname, '.env');
  const envContent = Object.entries(answers)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(envPath, envContent);

  // Check database connection
  try {
    const connection = await mysql.createConnection({
      host: answers.DB_HOST,
      port: answers.DB_PORT,
      user: answers.DB_USER,
      password: answers.DB_PASSWORD,
      database: answers.DB_NAME,
    });
    console.log('✅ Database connection successful');
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // Create admin user
  try {
    const connection = await mysql.createConnection({
      host: answers.DB_HOST,
      port: answers.DB_PORT,
      user: answers.DB_USER,
      password: answers.DB_PASSWORD,
      database: answers.DB_NAME,
    });

    const hashedPassword = await hashPassword(answers.ADMIN_PASSWORD);
    const insertQuery = `
      INSERT INTO users (username, password, email, full_name, role)
      VALUES (?, ?, ?, ?, 'admin')
    `;
    await connection.execute(insertQuery, [
      answers.ADMIN_USERNAME,
      hashedPassword,
      answers.ADMIN_EMAIL,
      answers.ADMIN_FULL_NAME,
    ]);

    console.log('✅ Admin user created successfully');
    await connection.end();
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    process.exit(1);
  }

  // Check SMTP configuration
  try {
    const transporter = nodemailer.createTransport({
      host: answers.SMTP_HOST,
      port: answers.SMTP_PORT,
      secure: true,
      auth: {
        user: answers.SMTP_USER,
        pass: answers.SMTP_PASS,
      },
    });

    await transporter.verify();
    console.log('✅ SMTP configuration successful');
  } catch (error) {
    console.error('❌ SMTP configuration failed:', error.message);
    process.exit(1);
  }

  // Check API configurations
  const apiKeys = [
    { key: 'OPENAI_API_KEY', name: 'OpenAI' },
    { key: 'ANTHROPIC_API_KEY', name: 'Anthropic' },
    { key: 'XAI_API_KEY', name: 'xAI' },
    { key: 'PERPLEXITY_API_KEY', name: 'Perplexity' },
  ];

  for (const { key, name } of apiKeys) {
    if (!answers[key]) {
      console.warn(`⚠️  ${name} API key is not set. Some features may not work.`);
    } else {
      console.log(`✅ ${name} API key is set.`);
    }
  }

  console.log('✅ Setup completed successfully');
}

askQuestion(0);
