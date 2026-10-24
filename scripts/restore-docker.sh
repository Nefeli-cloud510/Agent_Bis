#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "usage: $0 backups/study_YYYYMMDD_HHMMSS.sql.gz" >&2
  exit 2
fi

cd "$(dirname "$0")/.."

POSTGRES_USER="${POSTGRES_USER:-study_app}"
POSTGRES_DB="${POSTGRES_DB:-study_data}"
BACKUP_FILE="$1"

gunzip -c "$BACKUP_FILE" | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
echo "restore finished from: $BACKUP_FILE"
