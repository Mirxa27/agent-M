# Mirxa AI Platform - Database Documentation

## Overview

The Mirxa AI Platform uses PostgreSQL 15+ as its primary database. The schema is designed for scalability, performance, and data integrity with proper indexing, constraints, and relationships.

## Database Architecture

### Core Design Principles

1. **Normalization**: Tables follow 3NF to minimize redundancy
2. **Performance**: Strategic indexing for common query patterns
3. **Security**: Encrypted sensitive data, role-based access
4. **Scalability**: Designed for horizontal partitioning if needed
5. **Audit Trail**: Timestamps and activity tracking throughout

## Table Categories

### 1. Core Tables (User & Authentication)

#### `users`
- **Purpose**: Store user accounts and authentication data
- **Key Fields**: 
  - `id` (PK): Unique user identifier
  - `username`: Unique username for login
  - `email`: Unique email address
  - `password`: Bcrypt hashed password
  - `role`: User role (user/admin/moderator)
- **Indexes**: email, username, role, plan_expires_at
- **Relationships**: One-to-many with most other tables

#### `sessions`
- **Purpose**: Store active user sessions
- **Key Fields**:
  - `sid` (PK): Session identifier
  - `sess`: Session data (JSON)
  - `expire`: Session expiration time
- **Indexes**: expire

#### `api_keys`
- **Purpose**: API authentication for programmatic access
- **Key Fields**:
  - `key_hash`: Hashed API key
  - `permissions`: JSON array of allowed operations
  - `rate_limit`: Requests per hour limit
- **Security**: Keys are hashed, only last 4 chars stored

### 2. AI Agent Tables

#### `agents`
- **Purpose**: AI agent configurations
- **Key Fields**:
  - `config`: JSON configuration for agent behavior
  - `tools`: Array of tool IDs available to agent
  - `success_rate`: Calculated success metric
  - `tags`: Array for categorization
- **Indexes**: user_id, type, active, template, public, tags (GIN)
- **Features**: Templates, public sharing, versioning

#### `agent_tools`
- **Purpose**: Available tools/capabilities for agents
- **Key Fields**:
  - `category`: Tool categorization
  - `type`: Integration type (openai, custom, webhook)
  - `config`: Tool-specific configuration
  - `is_system`: System-provided vs user-created
- **Indexes**: category, type, active

#### `tasks`
- **Purpose**: Agent task execution tracking
- **Key Fields**:
  - `status`: Task lifecycle status
  - `priority`: 1-10 priority scale
  - `parent_task_id`: For subtask hierarchies
  - `retry_count`: Automatic retry tracking
- **Indexes**: user_id, agent_id, status, priority, scheduled_at
- **Features**: Scheduling, retries, progress tracking

#### `messages`
- **Purpose**: Conversation history for tasks
- **Key Fields**:
  - `role`: user/assistant/system/tool
  - `metadata`: Additional context (tool calls, etc.)
  - `tokens_used`: Token consumption tracking
- **Indexes**: task_id, timestamp, role

### 3. File Management Tables

#### `files`
- **Purpose**: File storage and management
- **Key Fields**:
  - `hash`: SHA-256 for deduplication
  - `path`: Storage location
  - `metadata`: Extensible file metadata
  - `is_template`: Template file flag
- **Indexes**: user_id, type, template, hash
- **Features**: Deduplication, templates, public sharing

#### `task_files`
- **Purpose**: Associate files with tasks
- **Key Fields**:
  - `purpose`: input/output/reference classification
- **Relationships**: Many-to-many between tasks and files

### 4. AI Provider Tables

#### `ai_providers`
- **Purpose**: Configure AI service providers
- **Key Fields**:
  - `provider`: openai/anthropic/xai/perplexity
  - `base_url`: Custom endpoint support
  - `auth_type`: Authentication method
- **Indexes**: provider, active

#### `ai_models`
- **Purpose**: Available AI models per provider
- **Key Fields**:
  - `model_id`: Provider's model identifier
  - `capabilities`: JSON array of features
  - `context_window`: Max token context
  - `cost_input_per_k`: Pricing per 1K input tokens
- **Indexes**: provider_id, active, default
- **Features**: Cost tracking, capability filtering

#### `ai_prompts`
- **Purpose**: Reusable prompt templates
- **Key Fields**:
  - `purpose`: Use case categorization
  - `system_prompt`: System instruction
  - `temperature`: Model parameters
- **Indexes**: model_id, purpose, category

### 5. Credential Management

#### `credentials`
- **Purpose**: Third-party service credentials
- **Key Fields**:
  - `data`: AES-256 encrypted credential data
  - `auth_method`: api_key/oauth/direct_login
  - `expires_at`: Credential expiration
- **Indexes**: user_id, type, service, expires_at
- **Security**: All credentials encrypted at rest

### 6. Payment & Billing

#### `plans`
- **Purpose**: Subscription plan definitions
- **Key Fields**:
  - `limits`: JSON object with plan limitations
  - `features`: JSON array of included features
  - `billing_period`: monthly/yearly/lifetime
- **Indexes**: active, sort_order

#### `transactions`
- **Purpose**: Payment transaction records
- **Key Fields**:
  - `provider_transaction_id`: External reference
  - `status`: Transaction lifecycle
  - `refunded_amount`: Partial refund support
- **Indexes**: user_id, status, provider_transaction_id

### 7. Analytics & Monitoring

#### `user_activity`
- **Purpose**: Audit trail of user actions
- **Key Fields**:
  - `action`: Action performed
  - `resource_type/id`: Target of action
  - `ip_address`: Source IP
- **Indexes**: user_id, action, created_at, resource

#### `usage_metrics`
- **Purpose**: Resource usage tracking
- **Key Fields**:
  - `metric_type`: Type of metric
  - `period_start/end`: Time window
- **Indexes**: user_id, metric_type, period

### 8. Gamification

#### `gamification_points`
- **Purpose**: User progression and rewards
- **Key Fields**:
  - `level`: Current user level
  - `experience`: XP points
  - `streak_days`: Consecutive activity
  - `achievements`: JSON array of unlocked items
- **Indexes**: user_id (unique), level, points

#### `gamification_badges`
- **Purpose**: Achievement definitions
- **Key Fields**:
  - `criteria`: JSON rules for earning
  - `points_required`: Unlock threshold
- **Indexes**: category, active

### 9. Browser Automation

#### `browser_sessions`
- **Purpose**: Browser automation session tracking
- **Key Fields**:
  - `session_id`: UUID session identifier
  - `recording_url`: Session recording location
  - `viewport_width/height`: Browser dimensions
- **Indexes**: user_id, session_id, status

#### `browser_actions`
- **Purpose**: Recorded browser interactions
- **Key Fields**:
  - `action_type`: click/type/navigate/etc.
  - `selector`: DOM selector
  - `screenshot_url`: Visual capture
- **Indexes**: session_id, action_type, timestamp

### 10. Workflow Management

#### `workflows`
- **Purpose**: Automated workflow definitions
- **Key Fields**:
  - `schedule_cron`: Cron expression for scheduling
  - `config`: Workflow configuration
  - `next_run_at`: Next scheduled execution
- **Indexes**: user_id, active, next_run_at

#### `workflow_progress`
- **Purpose**: Workflow execution tracking
- **Key Fields**:
  - `run_id`: UUID for execution instance
  - `current_step/total_steps`: Progress tracking
  - `output`: Execution results
- **Indexes**: workflow_id, run_id, status

## Indexes Strategy

### Primary Indexes
- All primary keys have automatic B-tree indexes
- Foreign keys are indexed for JOIN performance

### Composite Indexes
```sql
-- Optimized for common queries
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_agents_user_active ON agents(user_id, is_active);
```

### Partial Indexes
```sql
-- Only index relevant data
CREATE INDEX idx_agents_template ON agents(is_template) WHERE is_template = true;
CREATE INDEX idx_tasks_priority ON tasks(priority DESC) WHERE status IN ('pending', 'queued');
```

### GIN Indexes
```sql
-- For array/JSONB searches
CREATE INDEX idx_agents_tags ON agents USING GIN(tags);
```

## Triggers

### `update_updated_at_column()`
- Automatically updates `updated_at` timestamp on row modification
- Applied to: users, agents, credentials, files, etc.

### `increment_agent_task_count()`
- Maintains denormalized task count on agents table
- Triggered on task insertion

### `update_user_last_login()`
- Tracks user login timestamps and count
- Can be triggered by session creation

## Security Considerations

### Encryption
- Passwords: Bcrypt hashed
- Credentials: AES-256 encrypted
- API Keys: SHA-256 hashed

### Access Control
```sql
-- Read-only analytics role
CREATE ROLE analytics_readonly;
GRANT SELECT ON ALL TABLES TO analytics_readonly;

-- Application role
CREATE ROLE app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES TO app_user;
```

### Data Privacy
- PII is encrypted or hashed
- Soft deletes for audit trail
- Activity logging for compliance

## Performance Optimization

### Query Optimization
1. **Indexes**: Cover all foreign keys and common WHERE clauses
2. **Statistics**: Custom statistics for multi-column correlations
3. **Partitioning Ready**: Date-based partitioning for large tables

### Connection Pooling
```javascript
// Recommended pool settings
{
  max: 20,          // Maximum connections
  min: 5,           // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}
```

### Maintenance Tasks
```sql
-- Regular maintenance
VACUUM ANALYZE;  -- Weekly
REINDEX;        -- Monthly
```

## Migration Strategy

### Version Control
- All schema changes in numbered migration files
- Rollback scripts for each migration
- Migration history tracked in database

### Zero-Downtime Migrations
1. Add new columns as nullable
2. Backfill data
3. Add constraints
4. Remove old columns

### Backup Strategy
```bash
# Daily backups
pg_dump -Fc mirxa_db > backup_$(date +%Y%m%d).dump

# Point-in-time recovery
pg_basebackup -D /backup/base -Fp -Xs -P
```

## Monitoring Queries

### Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Slow Queries
```sql
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Index Usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

## Common Queries

### User Dashboard Stats
```sql
-- User's agent performance
SELECT 
    a.name,
    a.task_count,
    a.success_rate,
    COUNT(t.id) as recent_tasks
FROM agents a
LEFT JOIN tasks t ON a.id = t.agent_id 
    AND t.created_at > NOW() - INTERVAL '7 days'
WHERE a.user_id = $1
GROUP BY a.id;
```

### Task Analytics
```sql
-- Task completion rates by agent
SELECT 
    a.name as agent_name,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE t.status = 'completed') as completed,
    AVG(t.execution_time) as avg_time_ms
FROM tasks t
JOIN agents a ON t.agent_id = a.id
WHERE t.user_id = $1
    AND t.created_at > NOW() - INTERVAL '30 days'
GROUP BY a.id;
```

## Scaling Considerations

### Horizontal Partitioning
- `user_activity`: Partition by month
- `messages`: Partition by task_id range
- `usage_metrics`: Partition by period_start

### Read Replicas
- Analytics queries on replica
- Real-time queries on primary
- Async replication for reporting

### Caching Strategy
- Redis for session data
- Materialized views for analytics
- Query result caching for dashboards

## Compliance

### GDPR
- User data export capability
- Right to deletion implementation
- Audit trail for data access

### Data Retention
- Activity logs: 90 days
- Task data: 1 year
- Transaction records: 7 years

## Troubleshooting

### Common Issues

1. **Slow Queries**
   - Check EXPLAIN ANALYZE output
   - Verify index usage
   - Update table statistics

2. **Lock Contention**
   - Monitor pg_locks
   - Use advisory locks for long operations
   - Consider SKIP LOCKED for queues

3. **Storage Growth**
   - Regular VACUUM FULL for bloat
   - Archive old data
   - Implement partitioning

## Best Practices

1. **Always use transactions** for multi-table operations
2. **Avoid SELECT *** in production code
3. **Use prepared statements** to prevent SQL injection
4. **Index foreign keys** for JOIN performance
5. **Regular ANALYZE** for query planner statistics
6. **Monitor slow query log** for optimization opportunities
7. **Use connection pooling** to reduce overhead
8. **Implement retry logic** for transient failures