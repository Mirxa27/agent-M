# Mirxa AI Agent Platform

![Mirxa AI Logo](./generated-icon.png)

## Overview

Mirxa is a next-generation AI Agent platform designed to streamline task automation, developer workflows, and credential management through intelligent service integrations. The platform provides a unified interface for creating, managing, and deploying AI agents for various tasks.

## Key Features

- 🤖 **AI Agent Creation**: Build customizable AI agents with different capabilities
- 🔄 **Task Automation**: Automate repetitive tasks with intelligent workflows
- 🔐 **Credential Management**: Securely store and manage API keys and credentials
- 📁 **File Management**: Upload, organize, and process files with your agents
- 🌐 **Multi-language Support**: Full internationalization with English and Arabic languages
- 👤 **User Management**: Comprehensive user authentication and permission system
- 📊 **Admin Dashboard**: Manage users, plans, and system settings

## Tech Stack

- **Frontend**: React with TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom auth system with session management
- **Internationalization**: i18next for multi-language support
- **State Management**: React Query for server state, React Context for application state

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mirxa-ai.git
   cd mirxa-ai
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/mirxa
   SESSION_SECRET=your_session_secret
   ```

4. Initialize the database:
   ```
   npm run db:push
   ```

5. Create an admin user:
   ```
   node create-admin.js
   ```

6. Start the development server:
   ```
   npm run dev
   ```

7. Access the application at http://localhost:3000

## Documentation

For detailed documentation, please see:

- [User Guide](./docs/user-guide.md)
- [API Documentation](./docs/api-docs.md)
- [Development Guide](./docs/development-guide.md)
- [Deployment Guide](./docs/deployment-guide.md)

## Contributing

Contributions are welcome! Please see our [Contributing Guide](./docs/contributing.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.