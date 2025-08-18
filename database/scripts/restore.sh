#!/bin/bash

# ============================================================================
# Database Restore Script for Mirxa AI Platform
# ============================================================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/workspace/database/backups}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mirxa_db}"
DB_USER="${DB_USER:-mirxa_user}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_prompt() {
    echo -e "${BLUE}[?]${NC} $1"
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS] [BACKUP_FILE]"
    echo ""
    echo "Options:"
    echo "  --latest          Restore from latest backup"
    echo "  --list            List available backups"
    echo "  --verify          Verify backup before restore"
    echo "  --clean           Drop existing database before restore"
    echo "  --no-confirm      Skip confirmation prompt"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --latest"
    echo "  $0 --clean mirxa_backup_20240101_120000_full.dump"
    echo "  $0 --list"
    exit 0
}

# Parse arguments
CLEAN_RESTORE=false
NO_CONFIRM=false
VERIFY_BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --latest)
            BACKUP_FILE=$(ls -t ${BACKUP_DIR}/mirxa_backup_*_full.dump 2>/dev/null | head -1)
            if [ -z "$BACKUP_FILE" ]; then
                log_error "No backup files found in ${BACKUP_DIR}"
                exit 1
            fi
            shift
            ;;
        --list)
            log_info "Available backups in ${BACKUP_DIR}:"
            ls -lh ${BACKUP_DIR}/mirxa_backup_* 2>/dev/null || echo "No backups found"
            exit 0
            ;;
        --verify)
            VERIFY_BACKUP=true
            shift
            ;;
        --clean)
            CLEAN_RESTORE=true
            shift
            ;;
        --no-confirm)
            NO_CONFIRM=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

# Check if backup file is specified
if [ -z "$BACKUP_FILE" ]; then
    log_error "No backup file specified"
    echo "Use --latest for most recent backup or specify a file"
    echo "Use --list to see available backups"
    exit 1
fi

# Check if backup file is absolute path or relative
if [[ "$BACKUP_FILE" != /* ]]; then
    # If relative path, check in backup directory first
    if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    fi
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

log_info "Backup file: ${BACKUP_FILE}"
log_info "Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    log_info "Decompressing backup file..."
    gunzip -k "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE%.gz}"
    TEMP_DECOMPRESSED=true
fi

# Verify backup if requested
if [ "$VERIFY_BACKUP" = true ]; then
    log_info "Verifying backup file..."
    if pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1; then
        log_info "✓ Backup file is valid"
    else
        log_error "Backup file appears to be corrupted or invalid"
        exit 1
    fi
fi

# Show backup info
log_info "Backup information:"
echo "  File size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "  Created: $(stat -c %y "$BACKUP_FILE" 2>/dev/null || stat -f "%Sm" "$BACKUP_FILE" 2>/dev/null || echo "Unknown")"

# Confirmation prompt
if [ "$NO_CONFIRM" = false ]; then
    log_warn "⚠️  This will restore the database from backup!"
    if [ "$CLEAN_RESTORE" = true ]; then
        log_warn "⚠️  The existing database will be DROPPED!"
    fi
    log_prompt "Are you sure you want to continue? (yes/no): "
    read -r CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi
fi

# Create restore report
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${BACKUP_DIR}/restore_report_${TIMESTAMP}.txt"

cat > "$REPORT_FILE" << EOF
Restore Report
==============
Date: $(date)
Backup File: ${BACKUP_FILE}
Database: ${DB_NAME}
Host: ${DB_HOST}:${DB_PORT}
Clean Restore: ${CLEAN_RESTORE}

Pre-restore Statistics:
EOF

# Get pre-restore statistics
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \
    "SELECT 'Tables: ' || COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" \
    >> "$REPORT_FILE" 2>/dev/null || echo "Could not fetch statistics" >> "$REPORT_FILE"

# Perform restore
log_info "Starting database restore..."

if [ "$CLEAN_RESTORE" = true ]; then
    log_warn "Dropping existing database..."
    
    # Terminate existing connections
    psql -h $DB_HOST -p $DB_PORT -U postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
        2>/dev/null || true
    
    # Drop and recreate database
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null
    
    log_info "Database recreated"
fi

# Restore based on file type
if [[ "$BACKUP_FILE" == *.dump ]]; then
    # Binary format restore
    pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        --verbose --no-owner --no-privileges \
        "$BACKUP_FILE" 2>&1 | tee -a "$REPORT_FILE"
elif [[ "$BACKUP_FILE" == *.sql ]]; then
    # Plain SQL restore
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -f "$BACKUP_FILE" 2>&1 | tee -a "$REPORT_FILE"
else
    log_error "Unknown backup file format"
    exit 1
fi

# Post-restore tasks
log_info "Running post-restore tasks..."

# Update sequences
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT sequence_name, table_name, column_name
        FROM information_schema.columns
        WHERE column_default LIKE 'nextval%'
    LOOP
        EXECUTE format('SELECT setval(''%I'', COALESCE(MAX(%I), 1)) FROM %I',
            r.sequence_name, r.column_name, r.table_name);
    END LOOP;
END\$\$;
EOF

# Analyze tables for query optimizer
log_info "Analyzing tables..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "ANALYZE;"

# Get post-restore statistics
cat >> "$REPORT_FILE" << EOF

Post-restore Statistics:
EOF

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \
    "SELECT tablename, n_live_tup as rows FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10;" \
    >> "$REPORT_FILE" 2>/dev/null || echo "Could not fetch statistics" >> "$REPORT_FILE"

echo "Status: SUCCESS" >> "$REPORT_FILE"

# Clean up temporary decompressed file
if [ "$TEMP_DECOMPRESSED" = true ]; then
    rm -f "$BACKUP_FILE"
fi

log_info "✅ Database restore completed successfully!"
log_info "Restore report saved to: ${REPORT_FILE}"

# Optional: Send notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Database restore completed from: $(basename ${BACKUP_FILE})\"}" \
        "$SLACK_WEBHOOK_URL" 2>/dev/null || true
fi