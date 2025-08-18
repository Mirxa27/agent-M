-- ============================================================================
-- Comprehensive Index Strategy for Performance
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Drop existing indexes if needed (for clean setup)
-- -----------------------------------------------------------------------------

-- Note: In production, be careful about dropping indexes
-- This section is commented out by default

-- DROP INDEX IF EXISTS idx_users_email;
-- DROP INDEX IF EXISTS idx_users_username;
-- ... etc

-- -----------------------------------------------------------------------------
-- Primary Table Indexes
-- -----------------------------------------------------------------------------

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_plan_expires ON users(plan_expires_at) WHERE plan_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email_verification ON users(email_verification_token) WHERE email_verified = false;

-- Agents table indexes
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_template ON agents(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_agents_public ON agents(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_success_rate ON agents(success_rate DESC) WHERE success_rate IS NOT NULL;

-- GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_agents_tags ON agents USING GIN(tags);

-- GIN index for JSONB config
CREATE INDEX IF NOT EXISTS idx_agents_config ON agents USING GIN(config);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_agents_search ON agents 
USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority DESC) WHERE status IN ('pending', 'queued');
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_status ON tasks(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON tasks(user_id, created_at DESC);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_task_timestamp ON messages(task_id, timestamp DESC);

-- GIN index for metadata
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING GIN(metadata);

-- Credentials table indexes
CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON credentials(type);
CREATE INDEX IF NOT EXISTS idx_credentials_service ON credentials(service);
CREATE INDEX IF NOT EXISTS idx_credentials_expires ON credentials(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credentials_valid ON credentials(is_valid) WHERE is_valid = true;

-- Files table indexes
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_template ON files(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash) WHERE hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_public ON files(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_files_content_type ON files(content_type);

-- Task files junction table indexes
CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_files_file_id ON task_files(file_id);
CREATE INDEX IF NOT EXISTS idx_task_files_purpose ON task_files(purpose);

-- -----------------------------------------------------------------------------
-- AI Provider Related Indexes
-- -----------------------------------------------------------------------------

-- AI providers indexes
CREATE INDEX IF NOT EXISTS idx_ai_providers_provider ON ai_providers(provider);
CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_providers_default ON ai_providers(is_default) WHERE is_default = true;

-- AI models indexes
CREATE INDEX IF NOT EXISTS idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_active ON ai_models(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_models_default ON ai_models(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_ai_models_capabilities ON ai_models USING GIN(capabilities);

-- AI prompts indexes
CREATE INDEX IF NOT EXISTS idx_ai_prompts_model_id ON ai_prompts(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_purpose ON ai_prompts(purpose);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_category ON ai_prompts(category);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_active ON ai_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_default ON ai_prompts(is_default) WHERE is_default = true;

-- -----------------------------------------------------------------------------
-- Payment and Billing Indexes
-- -----------------------------------------------------------------------------

-- Plans indexes
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_featured ON plans(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_plans_sort_order ON plans(sort_order);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_id ON transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);

-- Composite index for financial queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_status_date ON transactions(user_id, status, created_at DESC);

-- -----------------------------------------------------------------------------
-- Analytics and Monitoring Indexes
-- -----------------------------------------------------------------------------

-- User activity indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_resource ON user_activity(resource_type, resource_id);

-- Composite index for activity queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_date ON user_activity(user_id, created_at DESC);

-- Usage metrics indexes
CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_id ON usage_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON usage_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_period ON usage_metrics(period_start, period_end);

-- Composite index for metric queries
CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_type_period ON usage_metrics(user_id, metric_type, period_start DESC);

-- -----------------------------------------------------------------------------
-- API and Security Indexes
-- -----------------------------------------------------------------------------

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used ON api_keys(last_used_at DESC);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
CREATE INDEX IF NOT EXISTS idx_sessions_sess_user ON sessions USING GIN((sess::jsonb));

-- -----------------------------------------------------------------------------
-- Gamification Indexes
-- -----------------------------------------------------------------------------

-- Gamification points indexes
CREATE INDEX IF NOT EXISTS idx_gamification_points_user_id ON gamification_points(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_points_level ON gamification_points(level DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_points_points ON gamification_points(points DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_points_streak ON gamification_points(streak_days DESC);

-- Gamification badges indexes
CREATE INDEX IF NOT EXISTS idx_gamification_badges_category ON gamification_badges(category);
CREATE INDEX IF NOT EXISTS idx_gamification_badges_active ON gamification_badges(is_active);
CREATE INDEX IF NOT EXISTS idx_gamification_badges_points ON gamification_badges(points_required);

-- User badges indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- -----------------------------------------------------------------------------
-- Browser Automation Indexes
-- -----------------------------------------------------------------------------

-- Browser sessions indexes
CREATE INDEX IF NOT EXISTS idx_browser_sessions_user_id ON browser_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_session_id ON browser_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_status ON browser_sessions(status);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_started_at ON browser_sessions(started_at DESC);

-- Browser actions indexes
CREATE INDEX IF NOT EXISTS idx_browser_actions_session_id ON browser_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_browser_actions_type ON browser_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_browser_actions_timestamp ON browser_actions(timestamp DESC);

-- Composite index for action queries
CREATE INDEX IF NOT EXISTS idx_browser_actions_session_timestamp ON browser_actions(session_id, timestamp DESC);

-- -----------------------------------------------------------------------------
-- Workflow Indexes
-- -----------------------------------------------------------------------------

-- Workflows indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_template ON workflows(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_workflows_next_run ON workflows(next_run_at) WHERE next_run_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflows_type ON workflows(type);

-- Workflow progress indexes
CREATE INDEX IF NOT EXISTS idx_workflow_progress_workflow_id ON workflow_progress(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_progress_run_id ON workflow_progress(run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_progress_status ON workflow_progress(status);
CREATE INDEX IF NOT EXISTS idx_workflow_progress_started_at ON workflow_progress(started_at DESC);

-- -----------------------------------------------------------------------------
-- Specialized Indexes
-- -----------------------------------------------------------------------------

-- Partial indexes for specific query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_pending_priority ON tasks(priority DESC, created_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_tasks_running ON tasks(started_at) 
WHERE status = 'running';

CREATE INDEX IF NOT EXISTS idx_credentials_expired ON credentials(user_id, expires_at) 
WHERE is_valid = true AND expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_files_templates_category ON files(template_category) 
WHERE is_template = true;

-- Expression indexes
CREATE INDEX IF NOT EXISTS idx_users_lower_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_lower_username ON users(LOWER(username));

-- Trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_agents_name_trgm ON agents USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_files_name_trgm ON files USING GIN (name gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Index Maintenance
-- -----------------------------------------------------------------------------

-- Function to rebuild indexes
CREATE OR REPLACE FUNCTION rebuild_indexes()
RETURNS void AS $$
DECLARE
    index_name TEXT;
BEGIN
    FOR index_name IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'REINDEX INDEX ' || index_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze index usage
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE (
    index_name TEXT,
    table_name TEXT,
    index_scans BIGINT,
    index_size TEXT,
    usage_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        indexrelname::TEXT,
        relname::TEXT,
        idx_scan,
        pg_size_pretty(pg_relation_size(indexrelid)),
        CASE 
            WHEN idx_scan = 0 THEN 'UNUSED - Consider dropping'
            WHEN idx_scan < 100 THEN 'RARELY USED'
            WHEN idx_scan < 1000 THEN 'MODERATELY USED'
            ELSE 'FREQUENTLY USED'
        END
    FROM pg_stat_user_indexes
    ORDER BY idx_scan;
END;
$$ LANGUAGE plpgsql;