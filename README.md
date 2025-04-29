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

## License

Copyright © 2025 Mirxa AI