-- ============================================================================
-- Database Views for Reporting and Analytics
-- ============================================================================

-- -----------------------------------------------------------------------------
-- User Dashboard Views
-- -----------------------------------------------------------------------------

-- User overview with plan and usage
CREATE OR REPLACE VIEW v_user_overview AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    u.created_at,
    u.last_login_at,
    p.name as plan_name,
    p.price as plan_price,
    u.plan_expires_at,
    CASE 
        WHEN u.plan_expires_at IS NULL THEN true
        WHEN u.plan_expires_at > CURRENT_TIMESTAMP THEN true
        ELSE false
    END as plan_active,
    (SELECT COUNT(*) FROM agents WHERE user_id = u.id) as agent_count,
    (SELECT COUNT(*) FROM tasks WHERE user_id = u.id) as task_count,
    (SELECT COUNT(*) FROM files WHERE user_id = u.id) as file_count,
    (SELECT COUNT(*) FROM credentials WHERE user_id = u.id) as credential_count
FROM users u
LEFT JOIN plans p ON u.plan_id = p.id;

-- Agent performance view
CREATE OR REPLACE VIEW v_agent_performance AS
SELECT 
    a.id,
    a.user_id,
    a.name,
    a.type,
    a.is_active,
    a.task_count,
    a.success_rate,
    a.avg_execution_time,
    COUNT(DISTINCT t.id) as tasks_last_7_days,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_last_7_days,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'failed') as failed_last_7_days,
    AVG(t.execution_time) FILTER (WHERE t.created_at > NOW() - INTERVAL '7 days') as avg_time_last_7_days
FROM agents a
LEFT JOIN tasks t ON a.id = t.agent_id AND t.created_at > NOW() - INTERVAL '7 days'
GROUP BY a.id;

-- Task summary view
CREATE OR REPLACE VIEW v_task_summary AS
SELECT 
    t.id,
    t.user_id,
    t.agent_id,
    a.name as agent_name,
    t.title,
    t.status,
    t.priority,
    t.progress,
    t.created_at,
    t.started_at,
    t.completed_at,
    t.execution_time,
    t.retry_count,
    COUNT(m.id) as message_count,
    SUM(m.tokens_used) as total_tokens,
    COUNT(tf.id) as file_count
FROM tasks t
LEFT JOIN agents a ON t.agent_id = a.id
LEFT JOIN messages m ON t.id = m.task_id
LEFT JOIN task_files tf ON t.id = tf.task_id
GROUP BY t.id, a.name;

-- -----------------------------------------------------------------------------
-- Analytics Views
-- -----------------------------------------------------------------------------

-- Daily usage statistics
CREATE OR REPLACE VIEW v_daily_usage AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_tasks,
    ROUND(AVG(execution_time)) as avg_execution_time,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE status = 'completed') / 
        NULLIF(COUNT(*), 0), 2
    ) as success_rate
FROM tasks
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- User activity summary
CREATE OR REPLACE VIEW v_user_activity_summary AS
SELECT 
    user_id,
    DATE(created_at) as activity_date,
    COUNT(*) as action_count,
    COUNT(DISTINCT action) as unique_actions,
    COUNT(DISTINCT resource_type) as resource_types_accessed,
    array_agg(DISTINCT action) as actions_performed
FROM user_activity
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, DATE(created_at);

-- AI model usage statistics
CREATE OR REPLACE VIEW v_ai_model_usage AS
SELECT 
    am.id as model_id,
    am.name as model_name,
    ap.name as provider_name,
    COUNT(DISTINCT t.id) as task_count,
    COUNT(DISTINCT t.user_id) as unique_users,
    SUM(m.tokens_used) as total_tokens,
    AVG(m.tokens_used) as avg_tokens_per_message,
    SUM(am.cost_input_per_k * m.tokens_used / 1000.0) as estimated_cost
FROM ai_models am
JOIN ai_providers ap ON am.provider_id = ap.id
LEFT JOIN tasks t ON t.result->>'model_id' = am.model_id::TEXT
LEFT JOIN messages m ON t.id = m.task_id
WHERE t.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY am.id, ap.name;

-- -----------------------------------------------------------------------------
-- Financial Views
-- -----------------------------------------------------------------------------

-- Monthly revenue view
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT user_id) as unique_customers,
    SUM(amount) FILTER (WHERE status = 'completed') as revenue,
    SUM(refunded_amount) as refunds,
    SUM(amount) FILTER (WHERE status = 'completed') - COALESCE(SUM(refunded_amount), 0) as net_revenue,
    AVG(amount) FILTER (WHERE status = 'completed') as avg_transaction_value
FROM transactions
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Subscription metrics
CREATE OR REPLACE VIEW v_subscription_metrics AS
SELECT 
    p.id as plan_id,
    p.name as plan_name,
    p.price,
    COUNT(DISTINCT u.id) as subscriber_count,
    COUNT(DISTINCT u.id) FILTER (WHERE u.plan_expires_at > CURRENT_TIMESTAMP) as active_subscribers,
    COUNT(DISTINCT u.id) FILTER (WHERE u.created_at >= CURRENT_DATE - INTERVAL '30 days') as new_subscribers_30d,
    p.price * COUNT(DISTINCT u.id) FILTER (WHERE u.plan_expires_at > CURRENT_TIMESTAMP) as mrr
FROM plans p
LEFT JOIN users u ON p.id = u.plan_id
GROUP BY p.id;

-- -----------------------------------------------------------------------------
-- Resource Usage Views
-- -----------------------------------------------------------------------------

-- Storage usage by user
CREATE OR REPLACE VIEW v_storage_usage AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(f.id) as file_count,
    SUM(f.size) as total_bytes,
    ROUND(SUM(f.size) / 1048576.0, 2) as total_mb,
    ROUND(SUM(f.size) / 1073741824.0, 3) as total_gb,
    MAX(f.created_at) as last_upload
FROM users u
LEFT JOIN files f ON u.id = f.user_id
GROUP BY u.id;

-- API usage view
CREATE OR REPLACE VIEW v_api_usage AS
SELECT 
    ak.id as api_key_id,
    ak.user_id,
    u.username,
    ak.name as key_name,
    ak.last_four,
    ak.rate_limit,
    ak.usage_count,
    ak.last_used_at,
    CASE 
        WHEN ak.expires_at IS NULL THEN true
        WHEN ak.expires_at > CURRENT_TIMESTAMP THEN true
        ELSE false
    END as is_valid,
    ak.created_at
FROM api_keys ak
JOIN users u ON ak.user_id = u.id
WHERE ak.is_active = true;

-- -----------------------------------------------------------------------------
-- Gamification Views
-- -----------------------------------------------------------------------------

-- User leaderboard
CREATE OR REPLACE VIEW v_user_leaderboard AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    gp.points,
    gp.level,
    gp.experience,
    gp.streak_days,
    COUNT(DISTINCT ub.badge_id) as badge_count,
    RANK() OVER (ORDER BY gp.points DESC) as global_rank,
    RANK() OVER (PARTITION BY DATE_TRUNC('month', CURRENT_DATE) ORDER BY gp.points DESC) as monthly_rank
FROM users u
LEFT JOIN gamification_points gp ON u.id = gp.user_id
LEFT JOIN user_badges ub ON u.id = ub.user_id
WHERE u.is_active = true
GROUP BY u.id, gp.points, gp.level, gp.experience, gp.streak_days;

-- Badge statistics
CREATE OR REPLACE VIEW v_badge_statistics AS
SELECT 
    gb.id,
    gb.name,
    gb.category,
    gb.points_required,
    COUNT(DISTINCT ub.user_id) as users_earned,
    MIN(ub.earned_at) as first_earned,
    MAX(ub.earned_at) as last_earned,
    ROUND(
        100.0 * COUNT(DISTINCT ub.user_id) / 
        (SELECT COUNT(*) FROM users WHERE is_active = true), 
        2
    ) as earn_percentage
FROM gamification_badges gb
LEFT JOIN user_badges ub ON gb.id = ub.badge_id
GROUP BY gb.id;

-- -----------------------------------------------------------------------------
-- System Health Views
-- -----------------------------------------------------------------------------

-- Database table sizes
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage statistics
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'RARELY USED'
        WHEN idx_scan < 1000 THEN 'OCCASIONALLY USED'
        ELSE 'FREQUENTLY USED'
    END as usage_category
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Active connections
CREATE OR REPLACE VIEW v_active_connections AS
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change,
    wait_event_type,
    wait_event,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- -----------------------------------------------------------------------------
-- Materialized Views for Performance
-- -----------------------------------------------------------------------------

-- Agent ranking (refreshed daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_agent_ranking AS
SELECT 
    a.id,
    a.name,
    a.user_id,
    a.type,
    a.is_public,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as successful_tasks,
    AVG(t.execution_time) as avg_execution_time,
    COALESCE(a.success_rate, 0) as success_rate,
    COUNT(DISTINCT t.user_id) as unique_users,
    RANK() OVER (ORDER BY COUNT(DISTINCT t.id) DESC) as usage_rank,
    RANK() OVER (ORDER BY COALESCE(a.success_rate, 0) DESC) as success_rank
FROM agents a
LEFT JOIN tasks t ON a.id = t.agent_id
WHERE a.is_active = true
GROUP BY a.id
WITH DATA;

CREATE UNIQUE INDEX ON mv_agent_ranking (id);
CREATE INDEX ON mv_agent_ranking (usage_rank);
CREATE INDEX ON mv_agent_ranking (success_rank);

-- User statistics (refreshed hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_stats AS
SELECT 
    u.id,
    u.username,
    COUNT(DISTINCT a.id) as agent_count,
    COUNT(DISTINCT t.id) as task_count,
    COUNT(DISTINCT t.id) FILTER (WHERE t.created_at >= CURRENT_DATE - INTERVAL '7 days') as tasks_last_7d,
    COUNT(DISTINCT t.id) FILTER (WHERE t.created_at >= CURRENT_DATE - INTERVAL '30 days') as tasks_last_30d,
    SUM(f.size) as total_storage_bytes,
    MAX(t.created_at) as last_task_at,
    MAX(u.last_login_at) as last_login_at
FROM users u
LEFT JOIN agents a ON u.id = a.user_id
LEFT JOIN tasks t ON u.id = t.user_id
LEFT JOIN files f ON u.id = f.user_id
GROUP BY u.id
WITH DATA;

CREATE UNIQUE INDEX ON mv_user_stats (id);

-- Refresh materialized views function
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agent_ranking;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_stats;
END;
$$ LANGUAGE plpgsql;