# Mirxa AI Platform Development Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Frontend Development](#frontend-development)
6. [Backend Development](#backend-development)
7. [Database Management](#database-management)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Contributing Guidelines](#contributing-guidelines)

## Introduction

This guide is designed to help developers understand the Mirxa AI Platform codebase and contribute effectively to its development. The platform is built with modern web technologies and follows best practices for maintainability, scalability, and security.

## Development Environment Setup

### Prerequisites

- Node.js (v18 or newer)
- npm (v8 or newer)
- PostgreSQL (v14 or newer)
- Git

### Setup Steps

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/mirxa-ai.git
   cd mirxa-ai
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory:

   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/mirxa
   SESSION_SECRET=your_local_development_secret
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

### Development Tools

- **VS Code**: Recommended editor with the following extensions:

  - ESLint
  - Prettier
  - TypeScript
  - Tailwind CSS IntelliSense

- **Postman/Insomnia**: For testing API endpoints

- **pgAdmin**: For database management

## Project Structure

```
mirxa-ai/
├── client/                   # Frontend code
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions and configurations
│   │   ├── locales/          # i18n translation files
│   │   ├── pages/            # Page components
│   │   ├── App.tsx           # Main application component
│   │   └── main.tsx          # Application entry point
├── server/                   # Backend code
│   ├── auth.ts               # Authentication logic
│   ├── db.ts                 # Database connection
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API routes
│   ├── services/             # Business logic services
│   └── storage.ts            # Data access layer
├── shared/                   # Shared code between client and server
│   └── schema.ts             # Database schema and types
├── docs/                     # Documentation
├── .env                      # Environment variables
├── .eslintrc.js              # ESLint configuration
├── .gitignore                # Git ignore configuration
├── drizzle.config.ts         # Drizzle ORM configuration
├── package.json              # npm package configuration
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
```

## Architecture Overview

Mirxa AI Platform follows a modern web application architecture:

- **Frontend**: React single-page application built with TypeScript and Vite
- **Backend**: Node.js server with Express
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: React Query for server state, React Context for application state
- **Authentication**: Custom auth with sessions stored in PostgreSQL
- **Internationalization**: i18next for multi-language support

### Key Design Principles

1. **Type Safety**: Use TypeScript throughout the application
2. **Component-Based Architecture**: Build UI with reusable components
3. **Unidirectional Data Flow**: Follow React's recommended patterns
4. **API-First Design**: Design the API before implementing the UI
5. **Progressive Enhancement**: Ensure basic functionality works without JS
6. **Responsive Design**: Support all screen sizes and devices

## Frontend Development

### Technology Stack

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and development server
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Component library based on Radix UI
- **React Query**: Server state management
- **wouter**: Lightweight routing library
- **i18next**: Internationalization

### Component Structure

Components are organized in a hierarchy:

1. **Pages**: Top-level components that correspond to routes
2. **Layouts**: Components that define the overall structure of pages
3. **Sections**: Large, page-specific components
4. **UI Components**: Reusable, atomic UI elements

### State Management

- **Server State**: Use React Query for API data fetching and caching
- **Application State**: Use React Context for global state
- **Component State**: Use React's useState and useReducer for component-specific state

### Routing

The application uses `wouter` for client-side routing. Routes are defined in `client/src/App.tsx`.

### Styling

The application uses TailwindCSS for styling, with the following conventions:

- Use utility classes directly for component styling
- Use the `cn()` utility for conditional class names
- Follow the shadcn/ui component patterns for consistency

### Internationalization

- Translation files are stored in `client/src/locales/`
- Use the `useTranslation` hook to access translations
- Follow the key naming conventions: `section.subsection.element`

## Backend Development

### Technology Stack

- **Node.js**: JavaScript runtime
- **Express**: Web server framework
- **TypeScript**: Type-safe JavaScript
- **Drizzle ORM**: Database ORM
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### API Design

- RESTful API endpoints follow the `/api/resource` pattern
- Use appropriate HTTP methods (GET, POST, PATCH, DELETE)
- Return consistent JSON responses
- Validate request inputs with Zod
- Handle errors gracefully with appropriate status codes

### Authentication

The authentication system uses session-based auth with the following features:

- User credentials stored securely with bcrypt
- Session data stored in PostgreSQL
- Role-based access control (user, admin)
- Session timeout and renewal

### Error Handling

The backend uses a centralized error handling middleware that:

- Logs errors appropriately
- Returns user-friendly error messages
- Preserves error details in development mode
- Sanitizes error information in production

## Database Management

### Schema Design

The database schema is defined in `shared/schema.ts` using Drizzle ORM.

Key tables include:

- `users`: User accounts and profile information
- `plans`: Subscription plans and features
- `agents`: AI agent configurations
- `tasks`: User tasks and results
- `messages`: Task conversation messages
- `files`: Uploaded files and metadata
- `credentials`: User API credentials

### Migrations

Database schema changes are managed through Drizzle's migration system:

1. Modify the schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes directly
3. For production, use `npm run db:migrate` to create migration files

### Queries

Database queries are encapsulated in the Storage interface in `server/storage.ts`.

### Transactions

Use transactions for operations that require multiple related database changes:

```typescript
await db.transaction(async (tx) => {
  await tx.insert(tasks).values({
    title: "New Task",
    userId: 1,
    agentId: 2,
  });

  await tx.insert(messages).values({
    taskId: taskId,
    role: "user",
    content: "Initial message",
  });
});
```

## Testing

### Unit Testing

Unit tests are written with Vitest and React Testing Library.

To run unit tests:

```
npm run test
```

### Integration Testing

Integration tests are written with Supertest for API testing.

To run integration tests:

```
npm run test:integration
```

### End-to-End Testing

End-to-end tests are written with Playwright.

To run e2e tests:

```
npm run test:e2e
```

### Testing Conventions

- Test files are located alongside the code they test with a `.test.ts` suffix
- Use meaningful test descriptions with the pattern "it should..."
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies appropriately
- Aim for high test coverage of critical functionality

## Deployment

### Build Process

The application is built for production using:

```
npm run build
```

This creates optimized assets in the `dist` directory.

### Deployment Environments

- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live environment for end-users

### Environment Configuration

Environment-specific configuration is managed through `.env` files and environment variables.

### Deployment Platforms

The application can be deployed to:

- **Vercel**: Frontend deployment
- **Railway**: Backend and database deployment
- **AWS**: Full infrastructure deployment
- **Docker**: Containerized deployment

## Contributing Guidelines

### Code Style

The project uses ESLint and Prettier for code style enforcement:

- Run `npm run lint` to check for linting issues
- Run `npm run format` to automatically format code

### Git Workflow

1. Fork the repository
2. Create a feature branch: `feature/your-feature-name`
3. Make your changes
4. Run tests: `npm run test`
5. Commit with conventional commits: `feat: add new feature`
6. Push to your fork
7. Create a pull request

### Commit Message Format

Follow the Conventional Commits specification:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation change
- `style`: Code style change (formatting, semicolons)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or fixing tests
- `chore`: Changes to the build process or auxiliary tools

### Pull Request Process

1. Create a pull request with a clear title and description
2. Link to any related issues
3. Pass all automated checks (tests, linting)
4. Get approval from at least one maintainer
5. Maintainer will merge the PR

### Code Review Guidelines

- Focus on correctness, readability, and maintainability
- Be constructive and respectful
- Explain the reasoning behind comments
- Use GitHub's suggestion feature for small changes

## Additional Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express Documentation](https://expressjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## Getting Help

If you need help with development, you can:

1. Check the documentation
2. Open an issue on GitHub
3. Reach out to the development team
4. Join the community Discord server
