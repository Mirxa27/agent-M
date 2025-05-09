# How to Run Mirxa.io Locally

This guide will help you set up and run the Mirxa.io platform locally for testing.

## Prerequisites

1. Node.js 18+ installed
2. PostgreSQL 13+ installed and running
3. API keys for at least one AI provider (OpenAI, Anthropic, xAI, or Perplexity)

## Setup Steps

### 1. Environment Setup

First, create a `.env` file in the root of the project with the following variables:

```
# Database configuration
DATABASE_URL=postgresql://username:password@localhost:5432/mirxa_db
PGUSER=username
PGPASSWORD=password
PGDATABASE=mirxa_db
PGHOST=localhost
PGPORT=5432

# Session configuration
SESSION_SECRET=your_secret_key_here

# AI Provider API Keys (at least one is required)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
XAI_API_KEY=your_xai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Browser service configuration
BROWSER_SERVICE_URL=http://localhost:3001
```

Replace the placeholders with your actual values.

### 2. Install Dependencies

Install all required dependencies:

```bash
npm install
```

### 3. Set Up Database

Initialize the database schema:

```bash
npm run db:push
```

### 4. Create Admin User

Run the setup-admin script to create an admin user:

```bash
node setup-admin.js
```

This will create an admin user with the following credentials:
- Email: admin@mirxa.io
- Password: Admin123!
- Username: admin

### 5. Initialize Admin Dashboard

Run the enhance-admin-dashboard script to set up default AI providers, models, prompts, and agent tools:

```bash
node enhance-admin-dashboard.js
```

### 6. Start the Application

Run the development server:

```bash
npm run dev
```

This will start the Mirxa.io platform on http://localhost:5000 (or the port specified in your .env file).

### 7. Access the Admin Dashboard

1. Open your browser and navigate to http://localhost:5000/admin/login
2. Log in using the admin credentials:
   - Email: admin@mirxa.io
   - Password: Admin123!

## Admin Dashboard Features

As an admin, you can:

1. **Manage AI Models**: Configure which models (GPT, Claude, etc.) are available
2. **Configure Tools**: Set up integrations with various services
3. **Create Prompt Libraries**: Build and manage reusable prompt templates
4. **Compose Agents**: Combine models, prompts, tools, and guardrails into agents
5. **Manage Users**: Create, edit, and delete user accounts
6. **Monitor Usage**: View platform usage statistics and analytics

## Note on TypeScript Errors

There are currently 225 TypeScript errors in the codebase. These errors do not prevent the application from running in development mode, but they should be addressed before deploying to production.

## Troubleshooting

- **Database Connection Issues**: Make sure your PostgreSQL instance is running and the DATABASE_URL in your .env file is correct.
- **Missing Dependencies**: If you encounter dependency errors, try running `npm install` again.
- **API Key Errors**: Ensure you have valid API keys for at least one of the AI providers.
