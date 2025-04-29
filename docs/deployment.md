# Deployment Guide for Mirxa AI Agent Platform

This guide provides instructions for deploying the Mirxa AI Agent Platform to production environments.

## Prerequisites

Before proceeding with deployment, ensure you have:

1. A PostgreSQL database (version 13+)
2. Node.js (version 18+) environment
3. Required API keys (OpenAI, Anthropic, xAI, Perplexity)
4. OAuth credentials for supporting services (if applicable)
5. A secure server or cloud platform for hosting
6. A domain name (optional, but recommended)

## Environment Configuration

1. Copy `.env.example` to `.env.production`
2. Fill in all required environment variables:

```
NODE_ENV=production
PORT=5000  # Or your desired port
HOST=0.0.0.0
BASE_URL=https://your-domain.com  # No trailing slash

# Database Configuration
DATABASE_URL=postgres://username:password@hostname:5432/database_name

# Security
SESSION_SECRET=your-long-random-string-here
ENCRYPTION_KEY=your-32-character-encryption-key-here

# AI Provider API Keys (at least one is required)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
XAI_API_KEY=your-xai-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key

# OAuth credentials (optional, only needed for specific integrations)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# Add other OAuth credentials as needed
```

### Important Security Notes

- Use a secure, randomly generated string for `SESSION_SECRET` (recommend 32+ characters)
- Use a strong encryption key for `ENCRYPTION_KEY` (exactly 32 characters for AES-256)
- Store production environment variables securely, never commit them to version control

## Database Setup

1. Create a PostgreSQL database for the application:

```bash
createdb mirxa_production
```

2. Run the database migrations:

```bash
NODE_ENV=production npm run db:push
```

3. (Optional) Create an admin user:

```bash
NODE_ENV=production npm run create-admin admin@yourdomain.com password123
```

## Building for Production

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
NODE_ENV=production npm start
```

## Deployment Options

### Docker Deployment

1. Build the Docker image:

```bash
docker build -t mirxa-ai-platform .
```

2. Run the container:

```bash
docker run -p 5000:5000 --env-file .env.production mirxa-ai-platform
```

### Replit Deployment

1. Set up all environment variables in the Replit Secrets tab.
2. Click the Deploy button in the Replit interface.

### Cloud Platform Deployment

#### AWS

1. Create an Elastic Beanstalk application
2. Configure environment variables
3. Deploy the application package

#### Google Cloud

1. Create an App Engine application
2. Configure environment variables in app.yaml
3. Deploy with gcloud CLI

## Health Checks

Once deployed, verify the following:

1. Database connection is successful
2. Authentication system works (register/login)
3. AI integrations are functioning (requires valid API keys)
4. OAuth connections are working properly (if configured)

## Monitoring and Maintenance

1. Set up logging to monitor application health
2. Configure database backups
3. Set up alerts for application downtime
4. Implement a strategy for managing API key rotations

## Scaling Considerations

- Configure proper connection pooling for the database
- Consider using a Redis cache for session storage in high-traffic scenarios
- Set up a load balancer if deploying multiple instances

## Troubleshooting

Common issues:

1. Database connection failures: Verify DATABASE_URL and network connectivity
2. AI service errors: Check API keys and service status
3. OAuth failures: Verify client IDs, secrets, and redirect URIs
4. Session issues: Check SESSION_SECRET and session store configuration

## Support

For additional assistance, contact the Mirxa support team.