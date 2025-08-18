#!/bin/bash

# ============================================================================
# Database Backup Script for Mirxa AI Platform
# ============================================================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/workspace/database/backups}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mirxa_db}"
DB_USER="${DB_USER:-mirxa_user}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mirxa_backup_${TIMESTAMP}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            BACKUP_TYPE="full"
            shift
            ;;
        --schema-only)
            BACKUP_TYPE="schema"
            shift
            ;;
        --data-only)
            BACKUP_TYPE="data"
            shift
            ;;
        --compress)
            COMPRESS=true
            shift
            ;;
        --s3-upload)
            S3_UPLOAD=true
            S3_BUCKET="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Default to full backup
BACKUP_TYPE="${BACKUP_TYPE:-full}"

log_info "Starting ${BACKUP_TYPE} backup of ${DB_NAME}"
log_info "Backup file: ${BACKUP_FILE}"

# Build pg_dump command
PG_DUMP_CMD="pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

case $BACKUP_TYPE in
    full)
        PG_DUMP_CMD="$PG_DUMP_CMD -Fc"
        BACKUP_FILE="${BACKUP_FILE}_full.dump"
        ;;
    schema)
        PG_DUMP_CMD="$PG_DUMP_CMD -s"
        BACKUP_FILE="${BACKUP_FILE}_schema.sql"
        ;;
    data)
        PG_DUMP_CMD="$PG_DUMP_CMD -a"
        BACKUP_FILE="${BACKUP_FILE}_data.sql"
        ;;
esac

# Perform backup
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

if $PG_DUMP_CMD > "$BACKUP_PATH" 2>/dev/null; then
    log_info "Backup completed successfully"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    log_info "Backup size: ${BACKUP_SIZE}"
    
    # Compress if requested
    if [ "$COMPRESS" = true ]; then
        log_info "Compressing backup..."
        gzip "$BACKUP_PATH"
        BACKUP_PATH="${BACKUP_PATH}.gz"
        COMPRESSED_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
        log_info "Compressed size: ${COMPRESSED_SIZE}"
    fi
    
    # Upload to S3 if requested
    if [ "$S3_UPLOAD" = true ] && [ -n "$S3_BUCKET" ]; then
        log_info "Uploading to S3 bucket: ${S3_BUCKET}"
        if command -v aws &> /dev/null; then
            if aws s3 cp "$BACKUP_PATH" "s3://${S3_BUCKET}/database-backups/$(basename $BACKUP_PATH)"; then
                log_info "Upload to S3 completed"
            else
                log_error "Failed to upload to S3"
            fi
        else
            log_warn "AWS CLI not installed, skipping S3 upload"
        fi
    fi
    
    # Create latest symlink
    LATEST_LINK="${BACKUP_DIR}/latest_${BACKUP_TYPE}"
    rm -f "$LATEST_LINK"
    ln -s "$BACKUP_PATH" "$LATEST_LINK"
    log_info "Created symlink: ${LATEST_LINK}"
    
    # Clean up old backups
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days"
    find "$BACKUP_DIR" -name "mirxa_backup_*" -type f -mtime +${RETENTION_DAYS} -delete
    
    # Generate backup report
    cat > "${BACKUP_DIR}/backup_report_${TIMESTAMP}.txt" << EOF
Backup Report
=============
Date: $(date)
Database: ${DB_NAME}
Host: ${DB_HOST}:${DB_PORT}
Type: ${BACKUP_TYPE}
File: ${BACKUP_FILE}
Size: ${BACKUP_SIZE:-Unknown}
Compressed: ${COMPRESS:-false}
S3 Upload: ${S3_UPLOAD:-false}
Status: SUCCESS

Table Statistics:
$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT tablename, n_live_tup as rows FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10;" 2>/dev/null || echo "Could not fetch statistics")

Database Size:
$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));" 2>/dev/null || echo "Could not fetch size")
EOF
    
    log_info "Backup report generated"
    log_info "✅ Backup completed successfully!"
    
else
    log_error "Backup failed!"
    exit 1
fi

# Optional: Send notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Database backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})\"}" \
        "$SLACK_WEBHOOK_URL" 2>/dev/null || true
fi