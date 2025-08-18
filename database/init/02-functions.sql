-- ============================================================================
-- Database Functions and Stored Procedures
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Utility Functions
-- -----------------------------------------------------------------------------

-- Generate random string
CREATE OR REPLACE FUNCTION generate_random_string(length INTEGER)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
    RETURN 'sk_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Hash password (using pgcrypto)
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql;

-- Verify password
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Trigger Functions
-- -----------------------------------------------------------------------------

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log user activity
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_activity (user_id, action, resource_type, resource_id, metadata)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', CURRENT_TIMESTAMP
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Increment agent task count
CREATE OR REPLACE FUNCTION increment_agent_task_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE agents 
    SET task_count = task_count + 1 
    WHERE id = NEW.agent_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update agent success rate
CREATE OR REPLACE FUNCTION update_agent_success_rate()
RETURNS TRIGGER AS $$
DECLARE
    total_tasks INTEGER;
    successful_tasks INTEGER;
    new_rate DECIMAL(5, 2);
BEGIN
    IF NEW.status = 'completed' OR NEW.status = 'failed' THEN
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'completed')
        INTO total_tasks, successful_tasks
        FROM tasks
        WHERE agent_id = NEW.agent_id
            AND status IN ('completed', 'failed');
        
        IF total_tasks > 0 THEN
            new_rate := (successful_tasks::DECIMAL / total_tasks) * 100;
            UPDATE agents 
            SET success_rate = new_rate
            WHERE id = NEW.agent_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate credential expiration
CREATE OR REPLACE FUNCTION check_credential_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < CURRENT_TIMESTAMP THEN
        NEW.is_valid = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Business Logic Functions
-- -----------------------------------------------------------------------------

-- Get user's current plan
CREATE OR REPLACE FUNCTION get_user_plan(user_id INTEGER)
RETURNS TABLE (
    plan_id INTEGER,
    plan_name VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.plan_id,
        p.name,
        u.plan_expires_at,
        CASE 
            WHEN u.plan_expires_at IS NULL THEN true
            WHEN u.plan_expires_at > CURRENT_TIMESTAMP THEN true
            ELSE false
        END as is_active
    FROM users u
    LEFT JOIN plans p ON u.plan_id = p.id
    WHERE u.id = $1;
END;
$$ LANGUAGE plpgsql;

-- Check user's resource limits
CREATE OR REPLACE FUNCTION check_user_limits(
    p_user_id INTEGER,
    p_resource_type VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan_limits JSONB;
    v_current_usage INTEGER;
    v_limit INTEGER;
BEGIN
    -- Get plan limits
    SELECT p.limits 
    INTO v_plan_limits
    FROM users u
    JOIN plans p ON u.plan_id = p.id
    WHERE u.id = p_user_id;
    
    -- Get limit for resource type
    v_limit := COALESCE((v_plan_limits->>p_resource_type)::INTEGER, -1);
    
    -- -1 means unlimited
    IF v_limit = -1 THEN
        RETURN true;
    END IF;
    
    -- Count current usage based on resource type
    CASE p_resource_type
        WHEN 'agents' THEN
            SELECT COUNT(*) INTO v_current_usage
            FROM agents
            WHERE user_id = p_user_id AND is_active = true;
        WHEN 'tasks_per_month' THEN
            SELECT COUNT(*) INTO v_current_usage
            FROM tasks
            WHERE user_id = p_user_id 
                AND created_at >= date_trunc('month', CURRENT_DATE);
        ELSE
            RETURN true; -- Unknown resource type, allow by default
    END CASE;
    
    RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Calculate user's usage for billing
CREATE OR REPLACE FUNCTION calculate_user_usage(
    p_user_id INTEGER,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    total_tasks INTEGER,
    total_agents INTEGER,
    total_tokens BIGINT,
    total_storage_mb DECIMAL,
    total_api_calls INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM tasks 
         WHERE user_id = p_user_id 
         AND created_at BETWEEN p_start_date AND p_end_date)::INTEGER as total_tasks,
        
        (SELECT COUNT(*) FROM agents 
         WHERE user_id = p_user_id 
         AND created_at <= p_end_date)::INTEGER as total_agents,
        
        (SELECT COALESCE(SUM(m.tokens_used), 0) 
         FROM messages m
         JOIN tasks t ON m.task_id = t.id
         WHERE t.user_id = p_user_id 
         AND m.timestamp BETWEEN p_start_date AND p_end_date)::BIGINT as total_tokens,
        
        (SELECT COALESCE(SUM(f.size) / 1048576.0, 0) 
         FROM files f
         WHERE f.user_id = p_user_id 
         AND f.created_at <= p_end_date)::DECIMAL as total_storage_mb,
        
        (SELECT COUNT(*) FROM user_activity 
         WHERE user_id = p_user_id 
         AND action LIKE 'API_%'
         AND created_at BETWEEN p_start_date AND p_end_date)::INTEGER as total_api_calls;
END;
$$ LANGUAGE plpgsql;

-- Get agent performance metrics
CREATE OR REPLACE FUNCTION get_agent_metrics(
    p_agent_id INTEGER,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    failed_tasks BIGINT,
    success_rate DECIMAL,
    avg_execution_time DECIMAL,
    total_tokens_used BIGINT,
    daily_tasks JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH task_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            AVG(execution_time) as avg_time
        FROM tasks
        WHERE agent_id = p_agent_id
            AND created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    ),
    token_stats AS (
        SELECT COALESCE(SUM(m.tokens_used), 0) as tokens
        FROM messages m
        JOIN tasks t ON m.task_id = t.id
        WHERE t.agent_id = p_agent_id
            AND t.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    ),
    daily_stats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'date', date,
                'count', count
            ) ORDER BY date
        ) as daily
        FROM (
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM tasks
            WHERE agent_id = p_agent_id
                AND created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
            GROUP BY DATE(created_at)
        ) d
    )
    SELECT 
        ts.total,
        ts.completed,
        ts.failed,
        CASE 
            WHEN ts.total > 0 THEN ROUND((ts.completed::DECIMAL / ts.total) * 100, 2)
            ELSE 0
        END as success_rate,
        ROUND(ts.avg_time::DECIMAL, 2),
        tok.tokens,
        ds.daily
    FROM task_stats ts, token_stats tok, daily_stats ds;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expire < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Archive old data
CREATE OR REPLACE FUNCTION archive_old_data(months_old INTEGER DEFAULT 6)
RETURNS TABLE (
    archived_tasks INTEGER,
    archived_messages INTEGER,
    archived_activity INTEGER
) AS $$
DECLARE
    v_archived_tasks INTEGER;
    v_archived_messages INTEGER;
    v_archived_activity INTEGER;
    v_cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    v_cutoff_date := CURRENT_DATE - INTERVAL '1 month' * months_old;
    
    -- Archive tasks (move to archive table or mark as archived)
    WITH archived AS (
        UPDATE tasks 
        SET status = 'archived'
        WHERE created_at < v_cutoff_date 
            AND status IN ('completed', 'failed', 'cancelled')
        RETURNING id
    )
    SELECT COUNT(*) INTO v_archived_tasks FROM archived;
    
    -- Archive messages
    WITH archived AS (
        DELETE FROM messages 
        WHERE task_id IN (
            SELECT id FROM tasks 
            WHERE created_at < v_cutoff_date 
                AND status = 'archived'
        )
        RETURNING id
    )
    SELECT COUNT(*) INTO v_archived_messages FROM archived;
    
    -- Archive user activity
    WITH archived AS (
        DELETE FROM user_activity 
        WHERE created_at < v_cutoff_date
        RETURNING id
    )
    SELECT COUNT(*) INTO v_archived_activity FROM archived;
    
    RETURN QUERY SELECT v_archived_tasks, v_archived_messages, v_archived_activity;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Search Functions
-- -----------------------------------------------------------------------------

-- Full text search on agents
CREATE OR REPLACE FUNCTION search_agents(
    p_query TEXT,
    p_user_id INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR,
    description TEXT,
    type VARCHAR,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.description,
        a.type,
        ts_rank(
            to_tsvector('english', a.name || ' ' || COALESCE(a.description, '')),
            plainto_tsquery('english', p_query)
        ) as rank
    FROM agents a
    WHERE (p_user_id IS NULL OR a.user_id = p_user_id)
        AND (a.is_public = true OR a.user_id = p_user_id)
        AND to_tsvector('english', a.name || ' ' || COALESCE(a.description, '')) 
            @@ plainto_tsquery('english', p_query)
    ORDER BY rank DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;