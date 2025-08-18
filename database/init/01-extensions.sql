-- ============================================================================
-- PostgreSQL Extensions Setup
-- ============================================================================

-- Core extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Trigram text search
CREATE EXTENSION IF NOT EXISTS "btree_gist";     -- GiST index support
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query performance monitoring

-- Optional but recommended extensions
CREATE EXTENSION IF NOT EXISTS "hstore";         -- Key-value storage
CREATE EXTENSION IF NOT EXISTS "citext";         -- Case-insensitive text
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- Remove accents from text
CREATE EXTENSION IF NOT EXISTS "tablefunc";      -- Crosstab and other functions

-- JSON extensions (if not already included)
CREATE EXTENSION IF NOT EXISTS "plpgsql";        -- PL/pgSQL procedural language

-- Full text search configuration
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS english_unaccent ( COPY = english );
ALTER TEXT SEARCH CONFIGURATION english_unaccent
    ALTER MAPPING FOR hword, hword_part, word
    WITH unaccent, english_stem;

-- Create custom types
DO $$ 
BEGIN
    -- Status enum type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM (
            'pending', 'queued', 'running', 'completed', 'failed', 'cancelled'
        );
    END IF;
    
    -- User role enum type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'user', 'moderator', 'admin', 'superadmin'
        );
    END IF;
    
    -- Auth method enum type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_method') THEN
        CREATE TYPE auth_method AS ENUM (
            'api_key', 'oauth', 'direct_login', 'bearer_token', 'jwt'
        );
    END IF;
    
    -- Payment status enum type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM (
            'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
        );
    END IF;
END $$;