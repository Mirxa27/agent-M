# Mirxa AI Agent Platform

A next-generation AI Agent platform designed to streamline task automation, developer workflows, and credential management through intelligent service integrations.

## Overview

Mirxa AI Agent Platform provides a unified interface for creating, managing, and deploying AI agents that can interact with various services and APIs. The platform focuses on secure credential management, file handling, and multi-language support, all within a user-friendly interface.

## Features

- **AI Agent Creation and Management**: Build custom AI agents using templates or from scratch
- **Secure Credential Management**: Store and manage credentials for third-party services with 90-day expiration
- **Multiple Authentication Methods**: Support for API Key, OAuth, and Direct Login authentication
- **AI-Powered Browser**: Observe, record, and replay user actions for automation
- **Gamified Chatbot**: Interactive assistant with points, badges, challenges, and user progression
- **File Management**: Upload, manage, and process files with AI-powered analysis
- **Multi-Language Support**: Support for multiple languages through OpenAI translation
- **Admin Dashboard**: Monitor usage, manage users, and view analytics

## Technology Stack

- **Frontend**: React/TypeScript with shadcn/ui components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **AI Providers**: OpenAI, Anthropic, xAI, Perplexity
- **Authentication**: Custom auth with PostgreSQL session storage
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- API keys for AI providers (at least one of: OpenAI, Anthropic, xAI, Perplexity)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in required values
4. Set up the database:
   ```
   npm run db:push
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## Documentation

- [Deployment Guide](docs/deployment.md)
- [Database Schema](docs/database-schema.md)

## Architecture

The Mirxa AI Agent Platform follows a component-based architecture with clear separation between client, server, and shared code:

- **Client**: React/TypeScript application with component libraries, hooks, and state management
- **Server**: Express API with controllers, services, and middleware
- **Shared**: Common types, schemas, and utilities used by both client and server

## Security

- All credentials are encrypted using AES-256 encryption
- Authentication uses secure session management with PostgreSQL storage
- HTTPS is enforced in production
- API endpoints are protected with authentication middleware

## Deployment on Hostinger

### Prerequisites

- Hostinger account
- SSH access to your Hostinger server
- MySQL database credentials

### Database Configuration

1. Update your `.env` file with the following MySQL credentials:
   ```
   DB_HOST=srv1505.hstgr.io
   DB_PORT=3306
   DB_USER=u221943340_agent
   DB_PASSWORD=Mirxa420$
   DB_NAME=u221943340_agent
   ```

### SSH Access

1. Connect to your Hostinger server via SSH:
   ```
   ssh -p 65002 u221943340@82.112.251.126
   ```
   Password: `Mirxa420$`

### Deployment Steps

1. Navigate to your web directory:
   ```
   cd /home/u221943340/domains/bot.mirxa.io/public_html
   ```

2. Clone the repository:
   ```
   git clone https://github.com/yourusername/mirxa-ai.git
   cd mirxa-ai
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Build the application:
   ```
   npm run build
   ```

5. Start the application:
   ```
   npm start
   ```

## Deployment on Vercel

### Prerequisites

- Vercel account
- GitHub repository connected to Vercel

### Deployment Steps

1. Connect your GitHub repository to Vercel.
2. Configure environment variables in the Vercel project settings.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Deploy the project.

### Environment Variable Configuration

To configure environment variables in Vercel:

1. Go to your Vercel project dashboard.
2. Navigate to the "Settings" tab.
3. Click on "Environment Variables".
4. Add the required environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NODE_ENV`
   - Any other optional variables as needed.

### Setting Up Environment Variables in Vercel Project Settings

1. In the Vercel project dashboard, click on the "Settings" tab.
2. Scroll down to the "Environment Variables" section.
3. Click on the "Add" button to add a new environment variable.
4. Enter the name and value of the environment variable.
5. Repeat the process for all required and optional environment variables.
6. Save the changes.

### Deploying the Project to Vercel

1. Ensure your GitHub repository is connected to Vercel.
2. Push your code to the main branch of your GitHub repository.
3. Vercel will automatically detect the changes and start the deployment process.
4. Monitor the deployment status in the Vercel dashboard.
5. Once the deployment is complete, your project will be live on Vercel.

## License

Copyright © 2025 Mirxa AI
