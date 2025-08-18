#!/bin/bash

set -e

echo "🚀 Setting up Mirxa AI Platform improvements..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install new dependencies
print_status "Installing security and logging dependencies..."
npm install --save winston ioredis prom-client express-rate-limit

print_status "Installing development dependencies..."
npm install --save-dev @types/redis eslint prettier husky lint-staged \
    @typescript-eslint/eslint-plugin @typescript-eslint/parser \
    eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks \
    eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-security \
    @types/jest @types/supertest

# Create necessary directories
print_status "Creating directory structure..."
mkdir -p server/middleware
mkdir -p server/utils
mkdir -p server/services/__tests__
mkdir -p server/routes/__tests__
mkdir -p .github/workflows
mkdir -p logs
mkdir -p monitoring

# Setup Husky for git hooks
print_status "Setting up Husky git hooks..."
npx husky-init || true
npm install

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linting on staged files
npx lint-staged

# Run type checking
npm run type-check || {
    echo "Type checking failed. Please fix TypeScript errors before committing."
    exit 1
}
EOF

chmod +x .husky/pre-commit

# Update package.json scripts
print_status "Updating package.json scripts..."
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add new scripts
const newScripts = {
    'lint': 'eslint . --ext .ts,.tsx',
    'lint:fix': 'eslint . --ext .ts,.tsx --fix',
    'lint:staged': 'lint-staged',
    'format': 'prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"',
    'format:check': 'prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"',
    'type-check': 'tsc --noEmit',
    'test:watch': 'jest --watch',
    'test:coverage': 'jest --coverage',
    'test:changed': 'jest --onlyChanged',
    'security:check': 'npm audit',
    'security:fix': 'npm audit fix',
    'prepare': 'husky install'
};

packageJson.scripts = { ...packageJson.scripts, ...newScripts };

// Add lint-staged configuration
packageJson['lint-staged'] = {
    '*.{ts,tsx}': [
        'eslint --fix',
        'prettier --write'
    ],
    '*.{js,jsx,json,md}': [
        'prettier --write'
    ]
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✓ package.json updated successfully');
"

# Run security audit and fix
print_status "Running security audit..."
npm audit || true

print_warning "Attempting to fix security vulnerabilities..."
npm audit fix || print_warning "Some vulnerabilities require manual review"

# Run initial type checking
print_status "Running TypeScript type checking..."
npm run type-check || print_warning "TypeScript errors found - please review"

# Run initial tests
print_status "Running existing tests..."
npm test || print_warning "Some tests failed - please review"

# Create GitHub Actions workflow
print_status "Creating GitHub Actions CI workflow..."
cat > .github/workflows/ci.yml << 'EOF'
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
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: mirxa_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
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
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/mirxa_test
          SESSION_SECRET: test-secret
          ENCRYPTION_KEY: test-encryption-key-32-characters!!
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
      
      - name: Build application
        run: npm run build
      
      - name: Security audit
        run: npm audit --audit-level=moderate
EOF

# Create monitoring configuration
print_status "Creating monitoring configuration..."
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mirxa-api'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
EOF

# Create .env.example if it doesn't exist
if [ ! -f .env.example ]; then
    print_status "Creating .env.example..."
    cat > .env.example << 'EOF'
# Node Environment
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/mirxa_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=username
DB_PASSWORD=password
DB_NAME=mirxa_db

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this
SESSION_MAX_AGE=86400000

# Security
ENCRYPTION_KEY=your-32-character-encryption-key!!

# AI Provider API Keys (at least one required)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=
PERPLEXITY_API_KEY=

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Monitoring (optional)
SENTRY_DSN=
LOG_LEVEL=info

# Server Configuration
PORT=5000
HOST=0.0.0.0
EOF
fi

# Summary
echo ""
echo "========================================="
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Review and fix any TypeScript errors: npm run type-check"
echo "2. Review and fix any linting issues: npm run lint:fix"
echo "3. Review security vulnerabilities: npm audit"
echo "4. Update .env file with required configuration"
echo "5. Run tests: npm test"
echo "6. Start development server: npm run dev"
echo ""
print_warning "Important: Some manual configuration may be required."
print_warning "Please review the generated files and update as needed."