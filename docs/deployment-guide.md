# Mirxa AI Platform Deployment Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Deployment Options](#deployment-options)
3. [Prerequisites](#prerequisites)
4. [Environment Configuration](#environment-configuration)
5. [Building for Production](#building-for-production)
6. [Deployment to Replit](#deployment-to-replit)
7. [Deployment to Vercel](#deployment-to-vercel)
8. [Deployment to Railway](#deployment-to-railway)
9. [Deployment to AWS](#deployment-to-aws)
10. [Docker Deployment](#docker-deployment)
11. [Database Setup](#database-setup)
12. [Continuous Integration/Deployment](#continuous-integrationdeployment)
13. [Post-Deployment Verification](#post-deployment-verification)
14. [Monitoring and Maintenance](#monitoring-and-maintenance)
15. [Troubleshooting](#troubleshooting)

## Introduction

This guide provides comprehensive instructions for deploying the Mirxa AI Platform to various hosting environments. The platform is designed to be flexible and can be deployed to multiple cloud providers or on-premises environments.

## Deployment Options

The Mirxa AI Platform can be deployed in several ways:

1. **Single-Service Deployment**: Frontend and backend deployed together (simplest)
2. **Split Deployment**: Frontend deployed separately from backend
3. **Containerized Deployment**: Using Docker and container orchestration
4. **Serverless Deployment**: Using serverless functions for the backend

Choose the deployment strategy that best fits your scale, budget, and technical requirements.

## Prerequisites

Before deploying, ensure you have:

- Full access to the application source code
- Node.js v18 or newer installed
- npm v8 or newer installed
- Git installed
- Access to a PostgreSQL database (v14 or newer)
- Domain name (optional but recommended for production)
- SSL certificate (optional but recommended for production)

## Environment Configuration

The application requires several environment variables to function correctly. Create a `.env` file for local testing and configure these variables in your deployment environment:

### Required Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (use a strong random string)
- `NODE_ENV`: Set to `production` for deployment

### Optional Environment Variables

- `PORT`: Server port (defaults to 3000)
- `CORS_ORIGIN`: Allowed CORS origins
- `LOG_LEVEL`: Logging level (error, warn, info, debug)
- `API_RATE_LIMIT`: Rate limit for API requests
- `STRIPE_SECRET_KEY`: For payment processing
- `SENDGRID_API_KEY`: For email functionality

### Secrets Management

For production deployments, use your hosting provider's secrets management:

- Vercel: Environment Variables in project settings
- Railway: Environment Variables in project settings
- AWS: AWS Secrets Manager or Parameter Store
- Docker: Docker secrets or environment variables

### Setting Up Environment Variables in Vercel Project Settings

1. In the Vercel project dashboard, click on the "Settings" tab.
2. Scroll down to the "Environment Variables" section.
3. Click on the "Add" button to add a new environment variable.
4. Enter the name and value of the environment variable.
5. Repeat the process for all required and optional environment variables.
6. Save the changes.

## Building for Production

To prepare the application for deployment:

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/mirxa-ai.git
   cd mirxa-ai
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Build the application:
   ```
   npm run build
   ```

This creates optimized assets in the `dist` directory.

## Deployment to Replit

Replit provides a simple way to deploy fullstack JavaScript applications:

1. Fork the repository to your Replit account
2. Configure environment secrets in the Replit secrets panel
3. Click the "Run" button to start the server

### Replit-Specific Configuration

1. Update the `.replit` file to run the correct start command:

   ```
   run = "npm run start"
   ```

2. Add a `replit.nix` file if using custom packages.

## Deployment to Vercel

Vercel is ideal for deploying the frontend portion of the application:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel project settings
3. Set the build command to `npm run build`
4. Set the output directory to `dist`
5. Deploy the project

### Vercel-Specific Configuration

For a full-stack deployment with API routes, create a `vercel.json` file:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/vite.config.ts",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ]
}
```

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

### Detailed Steps for Setting Up Environment Variables in Vercel Project Settings

1. In the Vercel project dashboard, click on the "Settings" tab.
2. Scroll down to the "Environment Variables" section.
3. Click on the "Add" button to add a new environment variable.
4. Enter the name and value of the environment variable.
5. Repeat the process for all required and optional environment variables.
6. Save the changes.

## Deployment to Railway

Railway provides PaaS deployment with built-in PostgreSQL:

1. Connect your GitHub repository to Railway
2. Add a PostgreSQL database service
3. Configure environment variables, including the DATABASE_URL
4. Set the build command to `npm run build`
5. Set the start command to `npm run start`
6. Deploy the project

### Railway-Specific Configuration

Railway automatically detects Node.js projects, but you can create a `railway.json` file for custom configuration:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Deployment to AWS

For larger-scale deployments, AWS provides more control and scalability:

### AWS Elastic Beanstalk Deployment

1. Install the AWS CLI and EB CLI
2. Initialize Elastic Beanstalk in your project:
   ```
   eb init
   ```
3. Create a `.ebextensions` directory with configuration files
4. Deploy the application:
   ```
   eb create mirxa-production
   ```

### AWS ECS Deployment (with Docker)

1. Create a Docker image of the application
2. Push the image to Amazon ECR
3. Create an ECS cluster and task definition
4. Deploy the task as a service

### AWS Lambda Deployment (Serverless)

For serverless deployment, the application architecture needs to be adapted:

1. Split the backend into Lambda functions
2. Deploy the frontend to S3 + CloudFront
3. Configure API Gateway to route requests to Lambda functions

## Docker Deployment

Docker allows for consistent deployment across environments:

1. Create a `Dockerfile` in the project root:

   ```Dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production
   COPY --from=builder /app/package*.json ./
   RUN npm install --production
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/server ./server
   COPY --from=builder /app/shared ./shared

   EXPOSE 3000
   CMD ["npm", "run", "start"]
   ```

2. Create a `docker-compose.yml` file for local testing:

   ```yaml
   version: "3"
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://postgres:postgres@db:5432/mirxa
         - SESSION_SECRET=your_session_secret
         - NODE_ENV=production
       depends_on:
         - db
     db:
       image: postgres:14
       environment:
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=postgres
         - POSTGRES_DB=mirxa
       volumes:
         - postgres_data:/var/lib/postgresql/data

   volumes:
     postgres_data:
   ```

3. Build and run the Docker containers:
   ```
   docker-compose up --build
   ```

## Database Setup

### PostgreSQL Database Setup

1. Create a PostgreSQL database for the application
2. Ensure the database user has appropriate permissions
3. Update the `DATABASE_URL` environment variable with the connection string
4. Run migrations to set up the schema:
   ```
   npm run db:migrate
   ```

### Creating an Admin User

After deploying, create an initial admin user:

1. Access your deployed environment (SSH, console, etc.)
2. Run the admin creation script:

   ```
   node create-admin.js
   ```

   Or manually using the provided `hashPassword.js` utility:

   ```
   node hashPassword.js your_admin_password
   ```

   Then insert the user with the hashed password into the database.

## Continuous Integration/Deployment

### GitHub Actions CI/CD

Create a `.github/workflows/deploy.yml` file for CI/CD:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      # Deploy steps depend on your hosting provider
      # Example for Railway:
      - name: Deploy to Railway
        uses: railwayapp/railway-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

## Post-Deployment Verification

After deploying, verify that:

1. The application is accessible at the expected URL
2. You can register and login
3. Database connections are working properly
4. API endpoints are responding correctly
5. Frontend features are functioning as expected
6. Error logging is properly configured

### Health Check Endpoint

The application includes a health check endpoint at `/api/health` that returns:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "environment": "production",
  "databaseConnection": "ok"
}
```

## Monitoring and Maintenance

### Application Monitoring

Consider setting up:

1. **Error tracking**: Sentry, Rollbar, or similar
2. **Performance monitoring**: New Relic, Datadog, or similar
3. **Log management**: Papertrail, Loggly, or similar
4. **Uptime monitoring**: Uptime Robot, Pingdom, or similar

### Database Maintenance

1. Set up regular database backups
2. Monitor database performance
3. Implement database scaling strategy as needed

### Updates and Patches

1. Establish a regular update schedule
2. Test updates in a staging environment first
3. Use semantic versioning for releases
4. Maintain a changelog

## Troubleshooting

### Common Deployment Issues

1. **Database Connection Errors**:

   - Verify the `DATABASE_URL` is correct
   - Check database server is accessible from application server
   - Verify database user permissions

2. **Build Failures**:

   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

3. **Runtime Errors**:

   - Check server logs for error messages
   - Verify environment variables are set correctly
   - Check for network connectivity issues

4. **Performance Issues**:
   - Consider adding caching
   - Optimize database queries
   - Scale up server resources as needed

### Rollback Procedure

If a deployment causes issues:

1. Identify the problem through logs and monitoring
2. If possible, fix the issue with a hotfix
3. If necessary, roll back to previous version:
   - Revert to previous Docker image
   - Redeploy previous Git commit
   - Restore database backup if schema changed

## Support and Resources

For additional deployment support:

- Check the [GitHub repository](https://github.com/yourusername/mirxa-ai) for updates
- Join the community forum for peer support
- Contact the development team for professional support
- Refer to the documentation for your specific hosting provider
