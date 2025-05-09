#!/bin/bash
# startup.sh - Script to set up and run Mirxa.io platform locally

# Color codes for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Mirxa.io platform setup...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating a template...${NC}"
    cat > .env << EOF
# Database configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mirxa_db
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=mirxa_db
PGHOST=localhost
PGPORT=5432

# Session configuration
SESSION_SECRET=mirxa_local_dev_secret

# AI Provider API Keys (at least one is required)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=
PERPLEXITY_API_KEY=

# Browser service configuration
BROWSER_SERVICE_URL=http://localhost:3001
EOF
    echo -e "${YELLOW}Please edit the .env file with your database and API credentials.${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies. Please check the errors above.${NC}"
        exit 1
    fi
fi

# Run database migrations
echo -e "${GREEN}Setting up database...${NC}"
npm run db:push
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Database migration failed. This might be due to TypeScript errors.${NC}"
    echo -e "${YELLOW}Attempting alternative approach...${NC}"

    # Try to run drizzle-kit directly
    echo -e "${GREEN}Running drizzle-kit push directly...${NC}"
    npx drizzle-kit push:pg

    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to set up database. Please check your database connection.${NC}"
        echo -e "${YELLOW}You can try to run the database migration manually:${NC}"
        echo -e "npx drizzle-kit push:pg"
    fi
fi

# Create admin user
echo -e "${GREEN}Creating admin user...${NC}"
npx tsx setup-admin.ts
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create admin user. Please check the errors above.${NC}"
    echo -e "${YELLOW}You can try to run the admin setup manually:${NC}"
    echo -e "npx tsx setup-admin.ts"
fi

# Set up admin dashboard
echo -e "${GREEN}Setting up admin dashboard...${NC}"
npx tsx enhance-admin-dashboard.ts
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to set up admin dashboard. Please check the errors above.${NC}"
    echo -e "${YELLOW}You can try to run the dashboard enhancement manually:${NC}"
    echo -e "npx tsx enhance-admin-dashboard.ts"
fi

# Start the browser service in the background
echo -e "${GREEN}Starting browser service...${NC}"
# Check if Dockerfile.browser exists and use it, otherwise run node directly
if [ -f "Dockerfile.browser" ]; then
    echo -e "${GREEN}Building browser service container...${NC}"
    docker build -f Dockerfile.browser -t mirxa-browser-service .
    echo -e "${GREEN}Running browser service container...${NC}"
    docker run -d -p 3001:3001 --name mirxa-browser-service mirxa-browser-service
else
    echo -e "${YELLOW}Dockerfile.browser not found. Attempting to start browser service directly...${NC}"
    node server/browser-service.js &
fi

# Start the main application
echo -e "${GREEN}Starting Mirxa.io platform...${NC}"
echo -e "${YELLOW}Note: TypeScript errors are expected and won't prevent the dev server from running.${NC}"
npm run dev

# Admin credentials reminder
echo -e "${GREEN}=== Admin Credentials ====${NC}"
echo -e "URL: http://localhost:5000/admin/login"
echo -e "Email: admin@mirxa.io"
echo -e "Password: Admin123!"
echo -e "${YELLOW}Remember to change this password after first login!${NC}"
