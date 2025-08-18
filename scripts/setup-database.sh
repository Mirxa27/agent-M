#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Default values
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mirxa_db}"
DB_USER="${DB_USER:-mirxa_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            DB_HOST="$2"
            shift 2
            ;;
        --port)
            DB_PORT="$2"
            shift 2
            ;;
        --dbname)
            DB_NAME="$2"
            shift 2
            ;;
        --user)
            DB_USER="$2"
            shift 2
            ;;
        --password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        --postgres-user)
            POSTGRES_USER="$2"
            shift 2
            ;;
        --postgres-password)
            POSTGRES_PASSWORD="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --host HOST                Database host (default: localhost)"
            echo "  --port PORT                Database port (default: 5432)"
            echo "  --dbname NAME              Database name (default: mirxa_db)"
            echo "  --user USER                Database user (default: mirxa_user)"
            echo "  --password PASSWORD        Database password"
            echo "  --postgres-user USER       PostgreSQL superuser (default: postgres)"
            echo "  --postgres-password PASS   PostgreSQL superuser password"
            echo "  --help                     Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "========================================="
echo "Mirxa AI Platform - Database Setup"
echo "========================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL client (psql) is not installed."
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  macOS: brew install postgresql"
    echo "  RHEL/CentOS: sudo yum install postgresql"
    exit 1
fi

# Prompt for passwords if not provided
if [ -z "$DB_PASSWORD" ]; then
    read -s -p "Enter password for database user '$DB_USER': " DB_PASSWORD
    echo ""
fi

if [ -z "$POSTGRES_PASSWORD" ]; then
    read -s -p "Enter password for PostgreSQL superuser '$POSTGRES_USER': " POSTGRES_PASSWORD
    echo ""
fi

# Export for psql to use
export PGPASSWORD="$POSTGRES_PASSWORD"

# Test connection to PostgreSQL
print_info "Testing connection to PostgreSQL..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -c '\q' 2>/dev/null; then
    print_error "Failed to connect to PostgreSQL at $DB_HOST:$DB_PORT"
    print_error "Please check your connection settings and PostgreSQL service status"
    exit 1
fi
print_status "Connected to PostgreSQL successfully"

# Create database if it doesn't exist
print_info "Creating database '$DB_NAME'..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" <<EOF
SELECT 'CREATE DATABASE $DB_NAME' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\\gexec
EOF
print_status "Database '$DB_NAME' ready"

# Create user if it doesn't exist
print_info "Creating user '$DB_USER'..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    ELSE
        ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
print_status "User '$DB_USER' configured"

# Switch to the new database
export PGPASSWORD="$DB_PASSWORD"

# Enable extensions
print_info "Enabling PostgreSQL extensions..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$DB_NAME" <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF
print_status "Extensions enabled"

# Grant schema permissions
print_info "Setting up permissions..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$DB_NAME" <<EOF
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF
print_status "Permissions configured"

# Run migrations
print_info "Running database migrations..."

# Check if migrations directory exists
if [ ! -d "migrations" ]; then
    print_error "Migrations directory not found"
    print_info "Creating from database schema..."
    
    # Create the schema from the complete SQL file
    if [ -f "database/schema.sql" ]; then
        print_info "Applying complete schema..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < database/schema.sql
        print_status "Schema created successfully"
    else
        print_warning "No schema.sql found. Please run migrations manually."
    fi
else
    # Run Drizzle migrations
    if command -v npx &> /dev/null; then
        print_info "Running Drizzle migrations..."
        DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" npx drizzle-kit push
        print_status "Migrations completed"
    else
        # Fallback to manual migration
        print_info "Running SQL migrations manually..."
        for migration in migrations/*.sql; do
            if [ -f "$migration" ]; then
                filename=$(basename "$migration")
                print_info "Applying $filename..."
                psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$migration"
            fi
        done
        print_status "Migrations completed"
    fi
fi

# Verify tables were created
print_info "Verifying database structure..."
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
TABLE_COUNT=$(echo $TABLE_COUNT | xargs)

if [ "$TABLE_COUNT" -gt 0 ]; then
    print_status "Database contains $TABLE_COUNT tables"
    
    # List tables
    print_info "Tables created:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt"
else
    print_error "No tables found in database"
    exit 1
fi

# Create initial admin user (optional)
print_info "Creating initial admin user..."
read -p "Do you want to create an admin user? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Admin username: " ADMIN_USERNAME
    read -s -p "Admin password: " ADMIN_PASSWORD
    echo ""
    read -p "Admin email: " ADMIN_EMAIL
    
    # Hash the password (requires Node.js)
    if command -v node &> /dev/null; then
        HASHED_PASSWORD=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 10));" 2>/dev/null || echo "")
        
        if [ -n "$HASHED_PASSWORD" ]; then
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
INSERT INTO users (username, password, email, full_name, role, is_active, email_verified)
VALUES ('$ADMIN_USERNAME', '$HASHED_PASSWORD', '$ADMIN_EMAIL', 'Administrator', 'admin', true, true)
ON CONFLICT (username) DO NOTHING;
EOF
            print_status "Admin user created"
        else
            print_warning "Could not hash password. Please install bcryptjs: npm install bcryptjs"
            print_info "You can create an admin user later using: npm run create-admin"
        fi
    else
        print_warning "Node.js not found. Cannot hash password."
        print_info "You can create an admin user later using: npm run create-admin"
    fi
fi

# Generate .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_info "Generating .env file..."
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Session Configuration
SESSION_SECRET=$(openssl rand -hex 32)
SESSION_MAX_AGE=86400000

# Security
ENCRYPTION_KEY=$(openssl rand -hex 16)

# Node Environment
NODE_ENV=development

# Server Configuration
PORT=5000
HOST=0.0.0.0

# AI Provider API Keys (add your keys here)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=
PERPLEXITY_API_KEY=

# Optional Services
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Monitoring (optional)
SENTRY_DSN=
LOG_LEVEL=info
EOF
    print_status ".env file created"
    print_warning "Please update the .env file with your API keys"
else
    print_info ".env file already exists, skipping..."
fi

# Summary
echo ""
echo "========================================="
echo -e "${GREEN}✅ Database setup completed successfully!${NC}"
echo "========================================="
echo ""
echo "Database Information:"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Tables: $TABLE_COUNT"
echo ""
echo "Connection String:"
echo "  postgresql://$DB_USER:[PASSWORD]@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "Next steps:"
echo "1. Update .env file with your AI provider API keys"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm run dev' to start the development server"
echo ""
print_info "For production, remember to:"
echo "  - Use strong passwords"
echo "  - Enable SSL connections"
echo "  - Set up regular backups"
echo "  - Configure connection pooling"
echo "  - Monitor database performance"