-- ============================================================================
-- Mirxa AI Platform Database Schema
-- Version: 1.0.0
-- Database: PostgreSQL 15+
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Hashed with bcrypt
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin', 'moderator')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    plan_id INTEGER,
    plan_expires_at TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role) WHERE is_active = true;
CREATE INDEX idx_users_plan_expires ON users(plan_expires_at) WHERE plan_expires_at IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- -----------------------------------------------------------------------------
-- Sessions Table (for authentication)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_sessions_expire ON sessions(expire);

-- -----------------------------------------------------------------------------
-- Subscription Plans Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_period VARCHAR(20) DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly', 'lifetime')),
    features JSONB DEFAULT '[]'::jsonb NOT NULL,
    limits JSONB DEFAULT '{}'::jsonb NOT NULL, -- e.g., {"agents": 10, "tasks_per_month": 1000}
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_plans_active ON plans(is_active);
CREATE INDEX idx_plans_sort_order ON plans(sort_order);

-- ============================================================================
-- AI AGENT TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Agent Tools Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}'::jsonb NOT NULL,
    icon VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_system BOOLEAN DEFAULT false NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_agent_tools_category ON agent_tools(category);
CREATE INDEX idx_agent_tools_type ON agent_tools(type);
CREATE INDEX idx_agent_tools_active ON agent_tools(is_active);

-- -----------------------------------------------------------------------------
-- Agents Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_template BOOLEAN DEFAULT false NOT NULL,
    is_public BOOLEAN DEFAULT false NOT NULL,
    task_count INTEGER DEFAULT 0 NOT NULL,
    success_rate DECIMAL(5, 2),
    avg_execution_time INTEGER, -- in milliseconds
    config JSONB DEFAULT '{}'::jsonb NOT NULL,
    tools JSONB DEFAULT '[]'::jsonb NOT NULL,
    tags TEXT[],
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_agent_name UNIQUE(user_id, name)
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_active ON agents(is_active);
CREATE INDEX idx_agents_template ON agents(is_template) WHERE is_template = true;
CREATE INDEX idx_agents_public ON agents(is_public) WHERE is_public = true;
CREATE INDEX idx_agents_tags ON agents USING GIN(tags);

-- -----------------------------------------------------------------------------
-- Tasks Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL 
        CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    execution_time INTEGER, -- in milliseconds
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority DESC) WHERE status IN ('pending', 'queued');
CREATE INDEX idx_tasks_scheduled ON tasks(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Messages Table (for task conversations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    tokens_used INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_messages_task_id ON messages(task_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_role ON messages(role);

-- ============================================================================
-- CREDENTIAL & SECURITY TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Credentials Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    service VARCHAR(50),
    auth_method VARCHAR(20) DEFAULT 'api_key' NOT NULL 
        CHECK (auth_method IN ('api_key', 'oauth', 'direct_login', 'bearer_token')),
    data TEXT NOT NULL, -- Encrypted
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_credential_name UNIQUE(user_id, name)
);

CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_credentials_type ON credentials(type);
CREATE INDEX idx_credentials_service ON credentials(service);
CREATE INDEX idx_credentials_expires ON credentials(expires_at) WHERE expires_at IS NOT NULL;

-- -----------------------------------------------------------------------------
-- API Keys Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash TEXT NOT NULL UNIQUE, -- Hashed API key
    last_four VARCHAR(4) NOT NULL, -- Last 4 characters for identification
    permissions JSONB DEFAULT '[]'::jsonb NOT NULL,
    rate_limit INTEGER DEFAULT 100, -- requests per hour
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- ============================================================================
-- FILE MANAGEMENT TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Files Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    path TEXT NOT NULL,
    url TEXT,
    thumbnail_url TEXT,
    is_template BOOLEAN DEFAULT false NOT NULL,
    template_type VARCHAR(50),
    template_category VARCHAR(50),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    hash VARCHAR(64), -- SHA-256 hash for deduplication
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_type ON files(type);
CREATE INDEX idx_files_template ON files(is_template) WHERE is_template = true;
CREATE INDEX idx_files_hash ON files(hash) WHERE hash IS NOT NULL;
CREATE INDEX idx_files_created_at ON files(created_at DESC);

-- -----------------------------------------------------------------------------
-- Task Files Junction Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_files (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    purpose VARCHAR(50), -- 'input', 'output', 'reference'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_task_file UNIQUE(task_id, file_id)
);

CREATE INDEX idx_task_files_task_id ON task_files(task_id);
CREATE INDEX idx_task_files_file_id ON task_files(file_id);

-- ============================================================================
-- AI PROVIDER TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- AI Providers Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL,
    description TEXT,
    base_url TEXT,
    auth_type VARCHAR(20) DEFAULT 'api_key' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_default BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_ai_providers_provider ON ai_providers(provider);
CREATE INDEX idx_ai_providers_active ON ai_providers(is_active);

-- -----------------------------------------------------------------------------
-- AI Models Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_models (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    description TEXT,
    capabilities JSONB DEFAULT '[]'::jsonb NOT NULL,
    context_window INTEGER,
    max_output_tokens INTEGER,
    cost_input_per_k DECIMAL(10, 6),
    cost_output_per_k DECIMAL(10, 6),
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    supports_functions BOOLEAN DEFAULT false,
    supports_vision BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_provider_model UNIQUE(provider_id, model_id)
);

CREATE INDEX idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX idx_ai_models_active ON ai_models(is_active);
CREATE INDEX idx_ai_models_default ON ai_models(is_default) WHERE is_default = true;

-- -----------------------------------------------------------------------------
-- AI Prompts Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_prompts (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES ai_models(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    purpose VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    system_prompt TEXT NOT NULL,
    default_user_prompt TEXT,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    top_p DECIMAL(3, 2) DEFAULT 1.0,
    frequency_penalty DECIMAL(3, 2) DEFAULT 0.0,
    presence_penalty DECIMAL(3, 2) DEFAULT 0.0,
    max_tokens INTEGER,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_ai_prompts_model_id ON ai_prompts(model_id);
CREATE INDEX idx_ai_prompts_purpose ON ai_prompts(purpose);
CREATE INDEX idx_ai_prompts_category ON ai_prompts(category);
CREATE INDEX idx_ai_prompts_active ON ai_prompts(is_active);

-- ============================================================================
-- PAYMENT & BILLING TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Transactions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' NOT NULL 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    provider_transaction_id VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    invoice_url TEXT,
    receipt_url TEXT,
    refunded_amount DECIMAL(10, 2) DEFAULT 0,
    failed_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_provider_id ON transactions(provider_transaction_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================================
-- ANALYTICS & MONITORING TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- User Activity Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_action ON user_activity(action);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX idx_user_activity_resource ON user_activity(resource_type, resource_id);

-- -----------------------------------------------------------------------------
-- Usage Metrics Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(20, 6) NOT NULL,
    unit VARCHAR(20),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_usage_metrics_user_id ON usage_metrics(user_id);
CREATE INDEX idx_usage_metrics_type ON usage_metrics(metric_type);
CREATE INDEX idx_usage_metrics_period ON usage_metrics(period_start, period_end);

-- ============================================================================
-- GAMIFICATION TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Gamification Points Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gamification_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    experience INTEGER DEFAULT 0 NOT NULL,
    streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    achievements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_gamification UNIQUE(user_id)
);

CREATE INDEX idx_gamification_points_user_id ON gamification_points(user_id);
CREATE INDEX idx_gamification_points_level ON gamification_points(level DESC);
CREATE INDEX idx_gamification_points_points ON gamification_points(points DESC);

-- -----------------------------------------------------------------------------
-- Gamification Badges Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gamification_badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    category VARCHAR(50),
    points_required INTEGER,
    criteria JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_gamification_badges_category ON gamification_badges(category);
CREATE INDEX idx_gamification_badges_active ON gamification_badges(is_active);

-- -----------------------------------------------------------------------------
-- User Badges Junction Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES gamification_badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_badge UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);

-- ============================================================================
-- BROWSER AUTOMATION TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Browser Sessions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS browser_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'active' NOT NULL 
        CHECK (status IN ('active', 'paused', 'completed', 'error')),
    browser_type VARCHAR(20) DEFAULT 'chrome',
    viewport_width INTEGER,
    viewport_height INTEGER,
    recording_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_browser_sessions_user_id ON browser_sessions(user_id);
CREATE INDEX idx_browser_sessions_session_id ON browser_sessions(session_id);
CREATE INDEX idx_browser_sessions_status ON browser_sessions(status);

-- -----------------------------------------------------------------------------
-- Browser Actions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS browser_actions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES browser_sessions(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    selector TEXT,
    value TEXT,
    url TEXT,
    screenshot_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_browser_actions_session_id ON browser_actions(session_id);
CREATE INDEX idx_browser_actions_type ON browser_actions(action_type);
CREATE INDEX idx_browser_actions_timestamp ON browser_actions(timestamp);

-- ============================================================================
-- WORKFLOW TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Workflows Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_template BOOLEAN DEFAULT false,
    schedule_cron TEXT,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_active ON workflows(is_active);
CREATE INDEX idx_workflows_next_run ON workflows(next_run_at) WHERE next_run_at IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Workflow Progress Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_progress (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    run_id UUID DEFAULT uuid_generate_v4() NOT NULL,
    status VARCHAR(20) DEFAULT 'running' NOT NULL 
        CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER,
    progress_percentage INTEGER DEFAULT 0,
    output JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_workflow_progress_workflow_id ON workflow_progress(workflow_id);
CREATE INDEX idx_workflow_progress_run_id ON workflow_progress(run_id);
CREATE INDEX idx_workflow_progress_status ON workflow_progress(status);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_tools_updated_at BEFORE UPDATE ON agent_tools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_providers_updated_at BEFORE UPDATE ON ai_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at BEFORE UPDATE ON ai_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gamification_points_updated_at BEFORE UPDATE ON gamification_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment agent task count
CREATE OR REPLACE FUNCTION increment_agent_task_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE agents 
    SET task_count = task_count + 1 
    WHERE id = NEW.agent_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_task_count AFTER INSERT ON tasks
    FOR EACH ROW EXECUTE FUNCTION increment_agent_task_count();

-- Function to update user last login
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET last_login_at = CURRENT_TIMESTAMP,
        login_count = login_count + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default plans
INSERT INTO plans (name, display_name, description, price, currency, billing_period, features, limits) 
VALUES 
    ('free', 'Free', 'Get started with basic features', 0, 'USD', 'monthly', 
     '["5 agents", "100 tasks/month", "Basic support"]'::jsonb, 
     '{"agents": 5, "tasks_per_month": 100}'::jsonb),
    ('pro', 'Professional', 'For professional developers', 29.99, 'USD', 'monthly', 
     '["Unlimited agents", "10000 tasks/month", "Priority support", "Advanced analytics"]'::jsonb, 
     '{"agents": -1, "tasks_per_month": 10000}'::jsonb),
    ('enterprise', 'Enterprise', 'For teams and organizations', 99.99, 'USD', 'monthly', 
     '["Unlimited everything", "Dedicated support", "Custom integrations", "SLA"]'::jsonb, 
     '{"agents": -1, "tasks_per_month": -1}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert default AI providers
INSERT INTO ai_providers (name, provider, description, is_active, is_default) 
VALUES 
    ('OpenAI', 'openai', 'OpenAI GPT models', true, true),
    ('Anthropic', 'anthropic', 'Claude AI models', true, false),
    ('xAI', 'xai', 'Grok AI models', true, false),
    ('Perplexity', 'perplexity', 'Perplexity AI models', true, false)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PERMISSIONS AND SECURITY
-- ============================================================================

-- Create read-only role for analytics
CREATE ROLE analytics_readonly;
GRANT CONNECT ON DATABASE mirxa_db TO analytics_readonly;
GRANT USAGE ON SCHEMA public TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;

-- Create application role with appropriate permissions
CREATE ROLE app_user;
GRANT CONNECT ON DATABASE mirxa_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ============================================================================
-- DATABASE MAINTENANCE
-- ============================================================================

-- Analyze tables for query optimization
ANALYZE;

-- Create statistics for better query planning
CREATE STATISTICS users_role_active ON role, is_active FROM users;
CREATE STATISTICS agents_user_type ON user_id, type FROM agents;
CREATE STATISTICS tasks_user_agent_status ON user_id, agent_id, status FROM tasks;