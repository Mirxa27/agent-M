# Mirxa AI Platform - Improvement Implementation Plan

## Phase 1: Critical Security & Testing (Week 1)

### Day 1-2: Security Fixes

#### 1. Fix NPM Vulnerabilities
```bash
# Run automated fixes
npm audit fix

# For breaking changes, review and update
npm audit fix --force

# Update specific vulnerable packages
npm update multer@latest
npm update form-data@latest
npm update tar-fs@latest
npm update vite@latest
npm update esbuild@latest
```

#### 2. Add Security Middleware
Create `/server/middleware/security.ts`:
```typescript
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = {
  // Rate limiting per endpoint
  apiLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Strict rate limiting for auth endpoints
  authLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
  }),
  
  // Enhanced security headers
  enhancedHelmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
};
```

### Day 3-4: Testing Infrastructure

#### 1. Enhanced Jest Configuration
Create `/jest.config.js`:
```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server', '<rootDir>/client/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'server/**/*.ts',
    'client/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

#### 2. Test Suite Templates

##### Service Test Template
`/server/services/__tests__/ai-service.test.ts`:
```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AIService } from '../ai-service';

describe('AIService', () => {
  let service: AIService;
  
  beforeEach(() => {
    service = new AIService();
    jest.clearAllMocks();
  });
  
  describe('generateResponse', () => {
    it('should generate response with OpenAI provider', async () => {
      // Test implementation
    });
    
    it('should handle provider errors gracefully', async () => {
      // Test implementation
    });
    
    it('should fallback to alternative provider on failure', async () => {
      // Test implementation
    });
  });
});
```

##### API Route Test Template
`/server/routes/__tests__/auth.test.ts`:
```typescript
import request from 'supertest';
import app from '../../app';
import { db } from '../../db';

describe('Auth Routes', () => {
  beforeEach(async () => {
    await db.delete(users).execute();
  });
  
  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'Test123!@#',
          email: 'test@example.com',
          fullName: 'Test User',
        });
      
      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('testuser');
    });
    
    it('should reject weak passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: '123',
          email: 'test@example.com',
          fullName: 'Test User',
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('password');
    });
  });
});
```

### Day 5: Error Handling & Logging

#### 1. Centralized Error Handler
Create `/server/middleware/error-handler.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }
  
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors,
    });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', err);
  
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
```

#### 2. Structured Logging
Create `/server/utils/logger.ts`:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mirxa-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

## Phase 2: Performance & Monitoring (Week 2)

### 1. Redis Caching
Create `/server/utils/cache.ts`:
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  },
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(...keys);
    }
  },
};
```

### 2. Database Query Optimization
Create `/migrations/add_indexes.sql`:
```sql
-- Performance indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_is_active ON agents(is_active);

CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_credentials_expires_at ON credentials(expires_at);

CREATE INDEX idx_messages_task_id ON messages(task_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_is_template ON files(is_template);

-- Composite indexes for common queries
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_agents_user_active ON agents(user_id, is_active);
```

### 3. Monitoring Setup
Create `/server/utils/metrics.ts`:
```typescript
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Business metrics
export const activeAgents = new Gauge({
  name: 'active_agents_total',
  help: 'Total number of active agents',
});

export const taskExecutions = new Counter({
  name: 'task_executions_total',
  help: 'Total number of task executions',
  labelNames: ['agent_type', 'status'],
});

// Metrics endpoint
export const metricsHandler = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
```

## Phase 3: Developer Experience (Week 3)

### 1. ESLint Configuration
Create `.eslintrc.json`:
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error"],
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "react/prop-types": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

### 2. Prettier Configuration
Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 3. Pre-commit Hooks
Create `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linting
npm run lint:staged

# Run type checking
npm run type-check

# Run tests for changed files
npm run test:changed
```

### 4. GitHub Actions CI/CD
Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
      
      - name: Build application
        run: npm run build
```

## Implementation Scripts

### 1. Setup Script
Create `/scripts/setup-improvements.sh`:
```bash
#!/bin/bash

echo "🚀 Setting up Mirxa AI Platform improvements..."

# Install new dependencies
echo "📦 Installing dependencies..."
npm install --save winston ioredis prom-client
npm install --save-dev @types/redis eslint prettier husky lint-staged

# Setup Husky
echo "🐶 Setting up Husky..."
npx husky-init && npm install

# Create directories
echo "📁 Creating directories..."
mkdir -p server/middleware
mkdir -p server/utils
mkdir -p server/__tests__
mkdir -p .github/workflows

# Run security fixes
echo "🔒 Running security fixes..."
npm audit fix

# Run initial tests
echo "🧪 Running tests..."
npm test

echo "✅ Setup complete!"
```

### 2. Package.json Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "lint:staged": "lint-staged",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:changed": "jest --onlyChanged",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,jsx,json,md}": [
      "prettier --write"
    ]
  }
}
```

## Monitoring Dashboard

### Grafana Dashboard Configuration
Create `/monitoring/grafana-dashboard.json`:
```json
{
  "dashboard": {
    "title": "Mirxa AI Platform Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
          }
        ]
      },
      {
        "title": "Active Agents",
        "targets": [
          {
            "expr": "active_agents_total"
          }
        ]
      },
      {
        "title": "Task Success Rate",
        "targets": [
          {
            "expr": "rate(task_executions_total{status=\"success\"}[5m]) / rate(task_executions_total[5m])"
          }
        ]
      }
    ]
  }
}
```

## Success Metrics

### Week 1 Goals
- ✅ All security vulnerabilities fixed
- ✅ Test coverage > 70%
- ✅ Error handling implemented
- ✅ Logging system in place

### Week 2 Goals
- ✅ Redis caching operational
- ✅ Database queries optimized
- ✅ Monitoring dashboard live
- ✅ Performance improved by 30%

### Week 3 Goals
- ✅ CI/CD pipeline running
- ✅ Code quality tools integrated
- ✅ Documentation updated
- ✅ Developer workflow streamlined

## Next Steps

1. **Immediate**: Run `./scripts/setup-improvements.sh`
2. **Day 1**: Fix security vulnerabilities
3. **Day 2-3**: Implement testing suite
4. **Day 4-5**: Add error handling and logging
5. **Week 2**: Performance optimization
6. **Week 3**: Developer experience improvements

This plan provides a structured approach to addressing the critical issues identified in the codebase analysis while maintaining system stability and improving overall quality.