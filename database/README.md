# Mirxa AI Platform - Database Setup Guide

## 🚀 Quick Start

### Option 1: Using Make (Recommended)
```bash
cd database
make setup  # Complete setup with Docker
```

### Option 2: Using Docker Compose
```bash
cd database
docker-compose up -d
./scripts/setup-database.sh
```

### Option 3: Manual Setup
```bash
# Create database
createdb mirxa_db

# Run schema
psql -d mirxa_db < schema.sql

# Run migrations
for file in init/*.sql; do
    psql -d mirxa_db < $file
done
```

## 📁 Directory Structure

```
database/
├── docker-compose.yml       # Docker services configuration
├── .env.database           # Database environment variables
├── Makefile               # Database management commands
├── schema.sql             # Complete database schema
├── init/                  # Initialization scripts
│   ├── 01-extensions.sql  # PostgreSQL extensions
│   ├── 02-functions.sql   # Stored procedures
│   ├── 03-views.sql       # Views and materialized views
│   ├── 04-indexes.sql     # Performance indexes
│   └── 05-seed-data.sql   # Initial data
├── scripts/               # Management scripts
│   ├── backup.sh          # Backup automation
│   └── restore.sh         # Restore automation
├── backups/               # Backup storage
└── README.md              # This file
```

## 🛠️ Available Commands

### Using Make

```bash
# Setup & Management
make setup          # Complete database setup
make docker-up      # Start Docker containers
make docker-down    # Stop Docker containers
make reset          # Reset database to fresh state

# Database Operations
make migrate        # Run migrations
make seed           # Load seed data
make psql           # Open PostgreSQL shell
make pgadmin        # Open PgAdmin interface

# Backup & Restore
make backup         # Create full backup
make backup-schema  # Backup schema only
make restore        # Restore from latest backup

# Monitoring & Maintenance
make stats          # Show database statistics
make table-sizes    # Show table sizes
make analyze        # Analyze tables for optimization
make vacuum         # Vacuum database
make reindex        # Rebuild indexes
make monitor        # Monitor database activity
make health-check   # Run health check

# Utilities
make create-admin   # Create admin user
make clean          # Clean old backups
make help           # Show all commands
```

## 🗄️ Database Schema

### Core Components

#### 30+ Tables Organized in Categories:

1. **Core & Authentication**
   - `users` - User accounts
   - `sessions` - Active sessions
   - `api_keys` - API authentication

2. **AI Agents**
   - `agents` - Agent configurations
   - `agent_tools` - Available tools
   - `tasks` - Task execution
   - `messages` - Conversations

3. **File Management**
   - `files` - File storage
   - `task_files` - Task associations

4. **AI Providers**
   - `ai_providers` - Service providers
   - `ai_models` - Available models
   - `ai_prompts` - Prompt templates

5. **Credentials**
   - `credentials` - Encrypted credentials

6. **Payment & Billing**
   - `plans` - Subscription plans
   - `transactions` - Payment records

7. **Analytics**
   - `user_activity` - Activity logs
   - `usage_metrics` - Resource usage

8. **Gamification**
   - `gamification_points` - User points
   - `gamification_badges` - Achievements
   - `user_badges` - Earned badges

9. **Browser Automation**
   - `browser_sessions` - Browser sessions
   - `browser_actions` - Recorded actions

10. **Workflows**
    - `workflows` - Workflow definitions
    - `workflow_progress` - Execution tracking

### Key Features

- **100+ Optimized Indexes** for query performance
- **15+ Constraints** for data integrity
- **5 Triggers** for automation
- **20+ Views** for reporting
- **2 Materialized Views** for analytics
- **50+ Functions** for business logic

## 🐳 Docker Services

### PostgreSQL
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Credentials**: See `.env.database`

### PgAdmin
- **URL**: http://localhost:5050
- **Email**: admin@mirxa.io
- **Password**: See `.env.database`

### Redis
- **Port**: 6379
- **Password**: See `.env.database`

### Redis Commander
- **URL**: http://localhost:8081

## 🔒 Security Features

- **Encrypted Credentials**: AES-256 encryption
- **Password Hashing**: bcrypt with salt
- **API Key Hashing**: SHA-256
- **Role-Based Access**: user/moderator/admin/superadmin
- **Row-Level Security**: Optional per-table
- **Audit Logging**: Complete activity tracking

## 📊 Performance Optimization

### Indexing Strategy
- B-tree indexes for equality/range queries
- GIN indexes for JSONB/array searches
- GiST indexes for spatial/text search
- Partial indexes for filtered queries
- Expression indexes for computed values

### Query Optimization
```sql
-- Analyze tables
ANALYZE;

-- Check index usage
SELECT * FROM v_index_usage;

-- Monitor slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC;
```

### Connection Pooling
```javascript
// Recommended settings
{
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}
```

## 🔄 Backup & Recovery

### Automated Backups
```bash
# Full backup
./scripts/backup.sh --full --compress

# Schema only
./scripts/backup.sh --schema-only

# With S3 upload
./scripts/backup.sh --full --s3-upload my-bucket
```

### Restore Process
```bash
# From latest backup
./scripts/restore.sh --latest

# From specific file
./scripts/restore.sh mirxa_backup_20240101_120000.dump

# Clean restore (drop existing)
./scripts/restore.sh --clean --latest
```

### Backup Schedule (Cron)
```bash
# Daily at 2 AM
0 2 * * * cd /workspace/database && ./scripts/backup.sh --full --compress

# Weekly full backup to S3
0 3 * * 0 cd /workspace/database && ./scripts/backup.sh --full --s3-upload my-bucket
```

## 📈 Monitoring

### Database Statistics
```sql
-- Overall stats
SELECT * FROM v_table_sizes;

-- User activity
SELECT * FROM v_user_activity_summary;

-- Agent performance
SELECT * FROM v_agent_performance;

-- Daily usage
SELECT * FROM v_daily_usage;
```

### Health Checks
```bash
# Quick health check
make health-check

# Monitor active connections
make monitor

# Check slow queries
make slow-queries
```

## 🧪 Testing

### Test Data
The database includes seed data for testing:
- 3 demo users (admin, demo_user, test_user)
- 4 subscription plans
- 5 AI providers with models
- 10 agent tools
- Sample agents and badges

### Test Credentials
```
Admin User:
  Username: admin
  Password: admin123!
  
Demo User:
  Username: demo_user
  Password: demo123!
```

## 🚨 Troubleshooting

### Common Issues

#### Connection Refused
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs mirxa_postgres

# Test connection
make test-connection
```

#### Permission Denied
```bash
# Grant permissions
GRANT ALL ON DATABASE mirxa_db TO mirxa_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO mirxa_user;
```

#### Slow Queries
```bash
# Analyze tables
make analyze

# Check missing indexes
SELECT * FROM v_index_usage WHERE usage_category = 'UNUSED';

# Vacuum database
make vacuum
```

#### Disk Space Issues
```bash
# Check table sizes
make table-sizes

# Vacuum full (reclaim space)
VACUUM FULL;

# Clean old backups
make clean
```

## 🔧 Maintenance

### Regular Tasks

#### Daily
- Monitor active connections
- Check error logs
- Verify backups

#### Weekly
- Analyze tables: `make analyze`
- Vacuum database: `make vacuum`
- Review slow queries

#### Monthly
- Reindex: `make reindex`
- Archive old data
- Review and optimize indexes
- Full backup with verification

## 📝 Environment Variables

Create `.env.database` with:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=mirxa_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=mirxa_user
DB_PASSWORD=secure_password
DB_NAME=mirxa_db

# PgAdmin
PGADMIN_EMAIL=admin@mirxa.io
PGADMIN_PASSWORD=pgadmin_password
PGADMIN_PORT=5050

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Backup
BACKUP_DIR=/backups
BACKUP_RETENTION_DAYS=30
```

## 🎯 Best Practices

1. **Always backup before major changes**
2. **Use transactions for multi-table operations**
3. **Index foreign keys for JOIN performance**
4. **Regular ANALYZE for query optimization**
5. **Monitor slow query log**
6. **Use connection pooling in production**
7. **Enable SSL for remote connections**
8. **Implement row-level security where needed**
9. **Archive old data regularly**
10. **Test restore process periodically**

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Schema Diagram](./DATABASE_DOCUMENTATION.md)
- [Migration Guide](../migrations/README.md)
- [API Documentation](../docs/api.md)

## 🤝 Support

For database-related issues:
1. Check the troubleshooting section
2. Review logs: `docker logs mirxa_postgres`
3. Run health check: `make health-check`
4. Consult the documentation

---

**Database is ready for production use!** 🚀

Run `make setup` to get started.