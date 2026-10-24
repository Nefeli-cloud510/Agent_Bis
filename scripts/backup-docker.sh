#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

POSTGRES_USER="${POSTGRES_USER:-study_app}"
POSTGRES_DB="${POSTGRES_DB:-study_data}"
mkdir -p backups
OUTFILE="backups/study_$(date +%Y%m%d_%H%M%S).sql.gz"

docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$OUTFILE"
echo "backup written: $OUTFILE"
