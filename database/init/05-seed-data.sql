-- ============================================================================
-- Seed Data for Initial Setup
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Plans
-- -----------------------------------------------------------------------------

INSERT INTO plans (name, display_name, description, price, currency, billing_period, features, limits, is_active, is_featured, sort_order) 
VALUES 
    ('free', 'Free', 'Perfect for trying out Mirxa AI Platform', 0, 'USD', 'monthly', 
     '["5 AI agents", "100 tasks per month", "1GB storage", "Community support", "Basic analytics"]'::jsonb, 
     '{"agents": 5, "tasks_per_month": 100, "storage_gb": 1, "api_calls_per_hour": 100}'::jsonb,
     true, false, 1),
     
    ('starter', 'Starter', 'Great for individuals and small projects', 9.99, 'USD', 'monthly', 
     '["15 AI agents", "1000 tasks per month", "5GB storage", "Email support", "Advanced analytics", "API access"]'::jsonb, 
     '{"agents": 15, "tasks_per_month": 1000, "storage_gb": 5, "api_calls_per_hour": 500}'::jsonb,
     true, false, 2),
     
    ('professional', 'Professional', 'For professional developers and teams', 29.99, 'USD', 'monthly', 
     '["Unlimited agents", "10000 tasks per month", "25GB storage", "Priority support", "Advanced analytics", "Full API access", "Custom integrations", "Team collaboration"]'::jsonb, 
     '{"agents": -1, "tasks_per_month": 10000, "storage_gb": 25, "api_calls_per_hour": 2000}'::jsonb,
     true, true, 3),
     
    ('enterprise', 'Enterprise', 'For large organizations with custom needs', 99.99, 'USD', 'monthly', 
     '["Unlimited everything", "100GB storage", "24/7 dedicated support", "Custom integrations", "SLA guarantee", "Advanced security", "Custom training", "White-label options"]'::jsonb, 
     '{"agents": -1, "tasks_per_month": -1, "storage_gb": 100, "api_calls_per_hour": -1}'::jsonb,
     true, false, 4)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits;

-- -----------------------------------------------------------------------------
-- AI Providers
-- -----------------------------------------------------------------------------

INSERT INTO ai_providers (name, provider, description, base_url, auth_type, is_active, is_default, config) 
VALUES 
    ('OpenAI', 'openai', 'OpenAI GPT models including GPT-4', 'https://api.openai.com/v1', 'api_key', true, true,
     '{"api_version": "v1", "organization_id": null}'::jsonb),
     
    ('Anthropic', 'anthropic', 'Claude AI models for advanced reasoning', 'https://api.anthropic.com', 'api_key', true, false,
     '{"api_version": "2023-06-01", "max_retries": 3}'::jsonb),
     
    ('xAI', 'xai', 'Grok AI models', 'https://api.x.ai/v1', 'api_key', true, false,
     '{"api_version": "v1"}'::jsonb),
     
    ('Perplexity', 'perplexity', 'Perplexity AI for web-aware responses', 'https://api.perplexity.ai', 'api_key', true, false,
     '{"api_version": "v1"}'::jsonb),
     
    ('OpenRouter', 'openrouter', 'Access multiple AI models through one API', 'https://openrouter.ai/api/v1', 'api_key', true, false,
     '{"api_version": "v1", "site_url": "https://mirxa.io", "app_name": "Mirxa AI Platform"}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    base_url = EXCLUDED.base_url,
    config = EXCLUDED.config;

-- -----------------------------------------------------------------------------
-- AI Models
-- -----------------------------------------------------------------------------

-- OpenAI Models
INSERT INTO ai_models (provider_id, name, model_id, description, capabilities, context_window, max_output_tokens, cost_input_per_k, cost_output_per_k, is_active, is_default, supports_functions, supports_vision)
SELECT 
    (SELECT id FROM ai_providers WHERE provider = 'openai'),
    model_name,
    model_id,
    description,
    capabilities,
    context_window,
    max_output_tokens,
    cost_input,
    cost_output,
    is_active,
    is_default,
    supports_functions,
    supports_vision
FROM (VALUES
    ('GPT-4o', 'gpt-4o', 'Most capable GPT-4 model with vision', '["text", "vision", "function_calling"]'::jsonb, 128000, 4096, 0.005, 0.015, true, true, true, true),
    ('GPT-4o mini', 'gpt-4o-mini', 'Small, fast, and cost-efficient model', '["text", "function_calling"]'::jsonb, 128000, 4096, 0.00015, 0.0006, true, false, true, false),
    ('GPT-4 Turbo', 'gpt-4-turbo', 'GPT-4 Turbo with vision', '["text", "vision", "function_calling"]'::jsonb, 128000, 4096, 0.01, 0.03, true, false, true, true),
    ('GPT-3.5 Turbo', 'gpt-3.5-turbo', 'Fast and efficient for simple tasks', '["text", "function_calling"]'::jsonb, 16385, 4096, 0.0005, 0.0015, true, false, true, false)
) AS models(model_name, model_id, description, capabilities, context_window, max_output_tokens, cost_input, cost_output, is_active, is_default, supports_functions, supports_vision)
ON CONFLICT (provider_id, model_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    capabilities = EXCLUDED.capabilities,
    cost_input_per_k = EXCLUDED.cost_input_per_k,
    cost_output_per_k = EXCLUDED.cost_output_per_k;

-- Anthropic Models
INSERT INTO ai_models (provider_id, name, model_id, description, capabilities, context_window, max_output_tokens, cost_input_per_k, cost_output_per_k, is_active, is_default, supports_functions, supports_vision)
SELECT 
    (SELECT id FROM ai_providers WHERE provider = 'anthropic'),
    model_name,
    model_id,
    description,
    capabilities,
    context_window,
    max_output_tokens,
    cost_input,
    cost_output,
    is_active,
    is_default,
    supports_functions,
    supports_vision
FROM (VALUES
    ('Claude 3 Opus', 'claude-3-opus-20240229', 'Most powerful Claude model', '["text", "vision"]'::jsonb, 200000, 4096, 0.015, 0.075, true, false, false, true),
    ('Claude 3 Sonnet', 'claude-3-sonnet-20240229', 'Balanced performance and cost', '["text", "vision"]'::jsonb, 200000, 4096, 0.003, 0.015, true, true, false, true),
    ('Claude 3 Haiku', 'claude-3-haiku-20240307', 'Fast and cost-effective', '["text", "vision"]'::jsonb, 200000, 4096, 0.00025, 0.00125, true, false, false, true)
) AS models(model_name, model_id, description, capabilities, context_window, max_output_tokens, cost_input, cost_output, is_active, is_default, supports_functions, supports_vision)
ON CONFLICT (provider_id, model_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    capabilities = EXCLUDED.capabilities,
    cost_input_per_k = EXCLUDED.cost_input_per_k,
    cost_output_per_k = EXCLUDED.cost_output_per_k;

-- -----------------------------------------------------------------------------
-- Agent Tools
-- -----------------------------------------------------------------------------

INSERT INTO agent_tools (name, description, category, type, config, icon, is_active, is_system)
VALUES
    ('Web Search', 'Search the web for current information', 'research', 'api', 
     '{"endpoint": "/api/tools/web-search", "requires_api_key": true}'::jsonb, 
     'Search', true, true),
     
    ('Code Executor', 'Execute code in various programming languages', 'development', 'sandbox',
     '{"languages": ["python", "javascript", "typescript", "sql"], "timeout": 30}'::jsonb,
     'Code', true, true),
     
    ('File Analyzer', 'Analyze and extract information from files', 'data_processing', 'internal',
     '{"supported_formats": ["pdf", "docx", "xlsx", "csv", "json", "txt"], "max_size_mb": 10}'::jsonb,
     'FileText', true, true),
     
    ('Image Generator', 'Generate images using AI', 'creative', 'api',
     '{"provider": "openai", "model": "dall-e-3", "default_size": "1024x1024"}'::jsonb,
     'Image', true, true),
     
    ('Email Sender', 'Send emails through configured SMTP', 'communication', 'smtp',
     '{"requires_credentials": true, "rate_limit": 100}'::jsonb,
     'Mail', true, true),
     
    ('Database Query', 'Query databases with SQL', 'data_processing', 'database',
     '{"supported_databases": ["postgresql", "mysql", "sqlite"], "read_only": true}'::jsonb,
     'Database', true, true),
     
    ('API Caller', 'Make HTTP requests to external APIs', 'integration', 'http',
     '{"methods": ["GET", "POST", "PUT", "DELETE"], "timeout": 30}'::jsonb,
     'Globe', true, true),
     
    ('Text Translator', 'Translate text between languages', 'language', 'api',
     '{"provider": "openai", "supported_languages": ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar"]}'::jsonb,
     'Languages', true, true),
     
    ('Data Visualizer', 'Create charts and visualizations', 'analytics', 'internal',
     '{"chart_types": ["line", "bar", "pie", "scatter", "heatmap"], "export_formats": ["png", "svg", "pdf"]}'::jsonb,
     'BarChart', true, true),
     
    ('Schedule Manager', 'Schedule and manage recurring tasks', 'automation', 'cron',
     '{"min_interval": "5m", "max_tasks": 100}'::jsonb,
     'Calendar', true, true)
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- AI Prompts Templates
-- -----------------------------------------------------------------------------

INSERT INTO ai_prompts (model_id, name, description, purpose, category, system_prompt, default_user_prompt, temperature, top_p, is_active, is_default)
VALUES
    (NULL, 'General Assistant', 'General purpose helpful assistant', 'general', 'assistant',
     'You are a helpful, harmless, and honest AI assistant. Always strive to provide accurate, relevant, and thoughtful responses.',
     NULL, 0.7, 1.0, true, true),
     
    (NULL, 'Code Expert', 'Expert programmer and code reviewer', 'code_generation', 'development',
     'You are an expert programmer proficient in multiple languages. Provide clean, efficient, well-commented code with best practices. Always explain your code and suggest improvements.',
     'Please help me with the following programming task:', 0.3, 0.95, true, false),
     
    (NULL, 'Data Analyst', 'Data analysis and insights expert', 'data_analysis', 'analytics',
     'You are a data analyst expert. Analyze data, identify patterns, provide insights, and suggest actionable recommendations. Use statistical methods when appropriate.',
     'Please analyze the following data:', 0.5, 0.9, true, false),
     
    (NULL, 'Creative Writer', 'Creative content generation', 'content_generation', 'creative',
     'You are a creative writer with expertise in various styles and formats. Create engaging, original content while maintaining the requested tone and style.',
     'Please write the following:', 0.9, 0.95, true, false),
     
    (NULL, 'Technical Documentation', 'Technical documentation writer', 'documentation', 'technical',
     'You are a technical documentation expert. Write clear, comprehensive, and well-structured documentation. Include examples and best practices.',
     'Please document the following:', 0.3, 0.9, true, false)
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Gamification Badges
-- -----------------------------------------------------------------------------

INSERT INTO gamification_badges (name, description, icon, category, points_required, criteria, is_active)
VALUES
    ('First Steps', 'Complete your first task', 'Trophy', 'achievement', 10,
     '{"tasks_completed": 1}'::jsonb, true),
     
    ('Agent Creator', 'Create your first AI agent', 'Robot', 'achievement', 20,
     '{"agents_created": 1}'::jsonb, true),
     
    ('Task Master', 'Complete 100 tasks', 'Star', 'milestone', 100,
     '{"tasks_completed": 100}'::jsonb, true),
     
    ('Speed Demon', 'Complete 10 tasks in one day', 'Zap', 'challenge', 50,
     '{"tasks_per_day": 10}'::jsonb, true),
     
    ('Perfectionist', 'Achieve 95% success rate over 50 tasks', 'CheckCircle', 'excellence', 75,
     '{"success_rate": 95, "min_tasks": 50}'::jsonb, true),
     
    ('Early Bird', 'Use the platform for 7 consecutive days', 'Sun', 'consistency', 30,
     '{"streak_days": 7}'::jsonb, true),
     
    ('Power User', 'Use 5 different agent tools', 'Cpu', 'exploration', 40,
     '{"unique_tools_used": 5}'::jsonb, true),
     
    ('Data Wizard', 'Process over 1GB of data', 'Database', 'milestone', 60,
     '{"data_processed_gb": 1}'::jsonb, true),
     
    ('Community Helper', 'Share 5 agent templates', 'Users', 'community', 50,
     '{"templates_shared": 5}'::jsonb, true),
     
    ('Innovation Award', 'Create a highly-rated agent template', 'Award', 'excellence', 100,
     '{"template_rating": 4.5, "min_ratings": 10}'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Demo Users (for testing - remove in production)
-- -----------------------------------------------------------------------------

-- Note: Passwords are hashed versions of 'demo123!' 
-- In production, use proper password hashing
INSERT INTO users (username, password, email, full_name, role, is_active, email_verified, plan_id)
VALUES
    ('admin', crypt('admin123!', gen_salt('bf', 10)), 'admin@mirxa.io', 'System Administrator', 'admin', true, true,
     (SELECT id FROM plans WHERE name = 'enterprise')),
     
    ('demo_user', crypt('demo123!', gen_salt('bf', 10)), 'demo@mirxa.io', 'Demo User', 'user', true, true,
     (SELECT id FROM plans WHERE name = 'professional')),
     
    ('test_user', crypt('test123!', gen_salt('bf', 10)), 'test@mirxa.io', 'Test User', 'user', true, true,
     (SELECT id FROM plans WHERE name = 'free'))
ON CONFLICT (username) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Demo Agents (for testing)
-- -----------------------------------------------------------------------------

INSERT INTO agents (user_id, name, description, type, icon, is_active, is_template, is_public, config, tools)
SELECT 
    (SELECT id FROM users WHERE username = 'demo_user'),
    agent_name,
    description,
    agent_type,
    icon,
    true,
    is_template,
    is_public,
    config,
    tools
FROM (VALUES
    ('Research Assistant', 'Helps with research and information gathering', 'research', 'Search', true, true,
     '{"max_search_results": 10, "summarize": true}'::jsonb,
     '[1, 8]'::jsonb),
     
    ('Code Helper', 'Assists with programming and code review', 'development', 'Code', true, true,
     '{"languages": ["python", "javascript", "typescript"], "style_guide": "google"}'::jsonb,
     '[2, 6]'::jsonb),
     
    ('Data Analyst', 'Analyzes data and creates visualizations', 'analytics', 'BarChart', false, false,
     '{"auto_visualize": true, "statistical_analysis": true}'::jsonb,
     '[3, 6, 9]'::jsonb)
) AS agents(agent_name, description, agent_type, icon, is_template, is_public, config, tools)
ON CONFLICT (user_id, name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Initial Gamification Points for Demo Users
-- -----------------------------------------------------------------------------

INSERT INTO gamification_points (user_id, points, level, experience, streak_days)
SELECT 
    id,
    CASE username
        WHEN 'admin' THEN 1000
        WHEN 'demo_user' THEN 250
        ELSE 10
    END,
    CASE username
        WHEN 'admin' THEN 10
        WHEN 'demo_user' THEN 5
        ELSE 1
    END,
    CASE username
        WHEN 'admin' THEN 10000
        WHEN 'demo_user' THEN 2500
        ELSE 100
    END,
    CASE username
        WHEN 'admin' THEN 30
        WHEN 'demo_user' THEN 7
        ELSE 1
    END
FROM users
WHERE username IN ('admin', 'demo_user', 'test_user')
ON CONFLICT (user_id) DO NOTHING;