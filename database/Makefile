# Makefile for Mirxa AI Platform Database Management

# Load environment variables
include .env.database

# Variables
DOCKER_COMPOSE = docker-compose -f docker-compose.yml
DB_CONTAINER = mirxa_postgres
TIMESTAMP = $(shell date +%Y%m%d_%H%M%S)

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "Mirxa AI Platform - Database Management"
	@echo "========================================"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "Quick start: make setup"

.PHONY: setup
setup: docker-up wait-db create-db migrate seed ## Complete database setup

.PHONY: docker-up
docker-up: ## Start Docker containers
	@echo "$(GREEN)Starting Docker containers...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ Containers started$(NC)"

.PHONY: docker-down
docker-down: ## Stop Docker containers
	@echo "$(YELLOW)Stopping Docker containers...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ Containers stopped$(NC)"

.PHONY: docker-restart
docker-restart: docker-down docker-up ## Restart Docker containers

.PHONY: docker-logs
docker-logs: ## Show Docker container logs
	$(DOCKER_COMPOSE) logs -f

.PHONY: wait-db
wait-db: ## Wait for database to be ready
	@echo "$(YELLOW)Waiting for database to be ready...$(NC)"
	@until docker exec $(DB_CONTAINER) pg_isready -U $(POSTGRES_USER) > /dev/null 2>&1; do \
		echo -n "."; \
		sleep 1; \
	done
	@echo ""
	@echo "$(GREEN)✓ Database is ready$(NC)"

.PHONY: create-db
create-db: ## Create database and user
	@echo "$(GREEN)Creating database and user...$(NC)"
	@docker exec -i $(DB_CONTAINER) psql -U $(POSTGRES_USER) <<< \
		"CREATE DATABASE $(DB_NAME); \
		 CREATE USER $(DB_USER) WITH PASSWORD '$(DB_PASSWORD)'; \
		 GRANT ALL PRIVILEGES ON DATABASE $(DB_NAME) TO $(DB_USER);" \
		2>/dev/null || echo "Database/user may already exist"
	@echo "$(GREEN)✓ Database created$(NC)"

.PHONY: drop-db
drop-db: ## Drop database (DESTRUCTIVE!)
	@echo "$(RED)⚠️  WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ] || exit 1
	@docker exec -i $(DB_CONTAINER) psql -U $(POSTGRES_USER) <<< \
		"DROP DATABASE IF EXISTS $(DB_NAME);"
	@echo "$(GREEN)✓ Database dropped$(NC)"

.PHONY: migrate
migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	@for file in init/*.sql; do \
		echo "  Applying $$file..."; \
		docker exec -i $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) < $$file; \
	done
	@echo "$(GREEN)✓ Migrations completed$(NC)"

.PHONY: seed
seed: ## Load seed data
	@echo "$(GREEN)Loading seed data...$(NC)"
	@docker exec -i $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) < init/05-seed-data.sql
	@echo "$(GREEN)✓ Seed data loaded$(NC)"

.PHONY: reset
reset: drop-db create-db migrate seed ## Reset database to fresh state

.PHONY: backup
backup: ## Create database backup
	@echo "$(GREEN)Creating backup...$(NC)"
	@mkdir -p backups
	@docker exec $(DB_CONTAINER) pg_dump -U $(DB_USER) -Fc $(DB_NAME) > backups/mirxa_backup_$(TIMESTAMP).dump
	@echo "$(GREEN)✓ Backup created: backups/mirxa_backup_$(TIMESTAMP).dump$(NC)"

.PHONY: backup-schema
backup-schema: ## Backup schema only
	@echo "$(GREEN)Creating schema backup...$(NC)"
	@mkdir -p backups
	@docker exec $(DB_CONTAINER) pg_dump -U $(DB_USER) -s $(DB_NAME) > backups/mirxa_schema_$(TIMESTAMP).sql
	@echo "$(GREEN)✓ Schema backup created: backups/mirxa_schema_$(TIMESTAMP).sql$(NC)"

.PHONY: restore
restore: ## Restore from latest backup
	@echo "$(GREEN)Restoring from latest backup...$(NC)"
	@latest=$$(ls -t backups/mirxa_backup_*.dump 2>/dev/null | head -1); \
	if [ -z "$$latest" ]; then \
		echo "$(RED)No backup found$(NC)"; \
		exit 1; \
	fi; \
	echo "  Using backup: $$latest"; \
	docker exec -i $(DB_CONTAINER) pg_restore -U $(DB_USER) -d $(DB_NAME) --clean < $$latest
	@echo "$(GREEN)✓ Database restored$(NC)"

.PHONY: psql
psql: ## Open PostgreSQL shell
	@docker exec -it $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME)

.PHONY: pgadmin
pgadmin: ## Open PgAdmin in browser
	@echo "$(GREEN)Opening PgAdmin...$(NC)"
	@echo "URL: http://localhost:$(PGADMIN_PORT)"
	@echo "Email: $(PGADMIN_EMAIL)"
	@echo "Password: $(PGADMIN_PASSWORD)"
	@open http://localhost:$(PGADMIN_PORT) 2>/dev/null || xdg-open http://localhost:$(PGADMIN_PORT) 2>/dev/null || echo "Please open manually"

.PHONY: redis-cli
redis-cli: ## Open Redis CLI
	@docker exec -it mirxa_redis redis-cli -a $(REDIS_PASSWORD)

.PHONY: stats
stats: ## Show database statistics
	@echo "$(GREEN)Database Statistics$(NC)"
	@echo "===================="
	@docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -c \
		"SELECT 'Database Size' as metric, pg_size_pretty(pg_database_size('$(DB_NAME)')) as value \
		 UNION ALL \
		 SELECT 'Tables', COUNT(*)::text FROM information_schema.tables WHERE table_schema = 'public' \
		 UNION ALL \
		 SELECT 'Indexes', COUNT(*)::text FROM pg_indexes WHERE schemaname = 'public' \
		 UNION ALL \
		 SELECT 'Total Rows', SUM(n_live_tup)::text FROM pg_stat_user_tables;"

.PHONY: table-sizes
table-sizes: ## Show table sizes
	@docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -c \
		"SELECT tablename, \
		        pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS total_size, \
		        pg_size_pretty(pg_relation_size(tablename::regclass)) AS table_size, \
		        pg_size_pretty(pg_indexes_size(tablename::regclass)) AS indexes_size, \
		        n_live_tup as row_count \
		 FROM pg_stat_user_tables \
		 ORDER BY pg_total_relation_size(tablename::regclass) DESC \
		 LIMIT 20;"

.PHONY: analyze
analyze: ## Analyze all tables for query optimization
	@echo "$(GREEN)Analyzing tables...$(NC)"
	@docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -c "ANALYZE;"
	@echo "$(GREEN)✓ Analysis completed$(NC)"

.PHONY: vacuum
vacuum: ## Vacuum database to reclaim space
	@echo "$(GREEN)Vacuuming database...$(NC)"
	@docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -c "VACUUM ANALYZE;"
	@echo "$(GREEN)✓ Vacuum completed$(NC)"

.PHONY: reindex
reindex: ## Rebuild all indexes
	@echo "$(GREEN)Rebuilding indexes...$(NC)"
	@docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -c "REINDEX DATABASE $(DB_NAME);"
	@echo "$(GREEN)✓ Reindex completed$(NC)"

.PHONY: refresh-views
refresh-views: ## Refresh materialized views
	@echo "$(GREEN)Refreshing materialized views...$(NC)"
	@docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -c "SELECT refresh_materialized_views();"
	@echo "$(GREEN)✓ Views refreshed$(NC)"

.PHONY: test-connection
test-connection: ## Test database connection
	@echo "$(GREEN)Testing database connection...$(NC)"
	@docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -c "SELECT version();" > /dev/null && \
		echo "$(GREEN)✓ Connection successful$(NC)" || \
		echo "$(RED)✗ Connection failed$(NC)"

.PHONY: create-admin
create-admin: ## Create admin user
	@read -p "Admin username: " username; \
	read -sp "Admin password: " password; \
	echo ""; \
	read -p "Admin email: " email; \
	docker exec -i $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) <<< \
		"INSERT INTO users (username, password, email, full_name, role, is_active, email_verified) \
		 VALUES ('$$username', crypt('$$password', gen_salt('bf', 10)), '$$email', 'Administrator', 'admin', true, true) \
		 ON CONFLICT (username) DO NOTHING;"
	@echo "$(GREEN)✓ Admin user created$(NC)"

.PHONY: monitor
monitor: ## Monitor database activity
	@watch -n 2 "docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -c \
		\"SELECT pid, usename, application_name, state, \
		        CASE WHEN state = 'active' THEN query ELSE '' END as current_query, \
		        CASE WHEN state = 'active' THEN now() - query_start ELSE NULL END as duration \
		 FROM pg_stat_activity \
		 WHERE datname = '$(DB_NAME)' AND state != 'idle' \
		 ORDER BY query_start;\""

.PHONY: slow-queries
slow-queries: ## Show slow queries
	@docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -c \
		"SELECT query, calls, total_time, mean_time, max_time \
		 FROM pg_stat_statements \
		 WHERE query NOT LIKE '%pg_stat_statements%' \
		 ORDER BY mean_time DESC \
		 LIMIT 10;" 2>/dev/null || echo "pg_stat_statements extension not enabled"

.PHONY: health-check
health-check: ## Comprehensive health check
	@echo "$(GREEN)Running health check...$(NC)"
	@echo ""
	@make test-connection
	@echo ""
	@make stats
	@echo ""
	@docker exec $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME) -c \
		"SELECT 'Active Connections' as metric, COUNT(*)::text as value \
		 FROM pg_stat_activity WHERE state = 'active';"
	@echo ""
	@echo "$(GREEN)✓ Health check completed$(NC)"

.PHONY: clean
clean: ## Clean up backup files older than 30 days
	@echo "$(YELLOW)Cleaning old backups...$(NC)"
	@find backups -name "*.dump" -mtime +30 -delete 2>/dev/null || true
	@find backups -name "*.sql" -mtime +30 -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Cleanup completed$(NC)"

.PHONY: install-extensions
install-extensions: ## Install additional PostgreSQL extensions
	@echo "$(GREEN)Installing extensions...$(NC)"
	@docker exec -i $(DB_CONTAINER) psql -U postgres -d $(DB_NAME) <<< \
		"CREATE EXTENSION IF NOT EXISTS pg_stat_statements; \
		 CREATE EXTENSION IF NOT EXISTS postgres_fdw; \
		 CREATE EXTENSION IF NOT EXISTS pg_trgm; \
		 CREATE EXTENSION IF NOT EXISTS btree_gist;"
	@echo "$(GREEN)✓ Extensions installed$(NC)"

.DEFAULT_GOAL := help