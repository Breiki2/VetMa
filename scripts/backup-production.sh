#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_REMOTE:?Set BACKUP_REMOTE to an rclone crypt remote, for example vetma-crypt:backups}"
[[ -f .env.prod ]] || { echo 'Missing .env.prod; copy production.env.example and configure production secrets.' >&2; exit 1; }

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="${BACKUP_REMOTE%/}/vetma-${timestamp}.tar.gz"

docker compose --env-file .env.prod -f compose.prod.yaml exec -T app sh -euc '
  backup_dir=/app/var/.backup
  mkdir -p "$backup_dir"
  trap '\''rm -f "$backup_dir/database.sqlite"'\'' EXIT
  sqlite3 /app/var/data.db ".backup $backup_dir/database.sqlite"
  tar -czf - -C "$backup_dir" database.sqlite -C /app/var attachments
' | rclone rcat "$destination"

echo "Encrypted off-server backup written to $destination"
