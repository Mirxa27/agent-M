# Mirxa.io AI Agent Platform

A next-generation AI Agent platform designed to streamline task automation, developer workflows, and credential management through intelligent service integrations.

## Admin Dashboard Implementation

The admin dashboard has been enhanced to provide a robust interface for managing the platform's AI capabilities:

### Key Features:

1. **Model Stack Selection**:
   - Configure multiple AI providers (OpenAI, Anthropic, xAI)
   - Enable/disable specific models
   - Set default models for different agent types

2. **Tool Wiring**:
   - Connect to external services via API integrations
   - Configure webhooks for event-driven automation
   - Set up Google Workspace integration

3. **Prompt Libraries**:
   - Create, edit, and manage prompt templates
   - Organize prompts by categories
   - Share prompt collections with specific user groups

4. **Agent Composition**:
   - Build custom agents by combining:
     - AI Models
     - Prompt Templates
     - Tools & Integrations
     - Safety Guardrails

## Running Locally

We've simplified the setup process with a startup script that handles database initialization, admin user creation, and server startup:

```bash
# Make the startup script executable
chmod +x startup.sh

# Run the startup script
./startup.sh
```

This script will:
1. Create a .env file template if one doesn't exist
2. Install dependencies
3. Set up the database
4. Create an admin user
5. Configure the admin dashboard with default settings
6. Start the browser service
7. Launch the main application

## Admin Credentials

Once the application is running, you can access the admin dashboard at:
- URL: http://localhost:5000/admin/login
- Email: admin@mirxa.io
- Password: Admin123!

**Important**: Remember to change this password after your first login!

## Detailed Documentation

For more detailed instructions on setting up and running Mirxa.io locally, see:
- [Local Setup Guide](./docs/local-setup.md)
- [Landing Page Content](./docs/landing-page-content.md)

## License

Copyright © 2025 Mirxa AI
