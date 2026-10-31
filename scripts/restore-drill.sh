#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo 'Usage: scripts/restore-drill.sh <local-archive.tar.gz|rclone-remote:path>' >&2
  exit 2
fi

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/vetma-restore.XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT
archive="$1"
if [[ -f "$archive" ]]; then
  cp -- "$archive" "$work_dir/backup.tar.gz"
else
  rclone copyto "$archive" "$work_dir/backup.tar.gz"
fi

mkdir "$work_dir/restored"
tar -xzf "$work_dir/backup.tar.gz" -C "$work_dir/restored"
database="$work_dir/restored/database.sqlite"
attachments="$work_dir/restored/attachments"
[[ -s "$database" ]] || { echo 'Restored database is missing or empty.' >&2; exit 1; }
[[ -d "$attachments" ]] || { echo 'Restored attachments directory is missing.' >&2; exit 1; }

integrity="$(sqlite3 "$database" 'PRAGMA integrity_check;')"
[[ "$integrity" == 'ok' ]] || { echo "SQLite integrity check failed: $integrity" >&2; exit 1; }
[[ -z "$(sqlite3 "$database" 'PRAGMA foreign_key_check;')" ]] || { echo 'Restored database has foreign-key violations.' >&2; exit 1; }
tables="$(sqlite3 "$database" '.tables')"
for table in app_user Client Patient Attention; do
  [[ " $tables " == *" $table "* ]] || { echo "Restored database is missing table $table." >&2; exit 1; }
done

users="$(sqlite3 "$database" 'SELECT COUNT(*) FROM app_user;')"
clients="$(sqlite3 "$database" 'SELECT COUNT(*) FROM Client;')"
patients="$(sqlite3 "$database" 'SELECT COUNT(*) FROM Patient;')"
files="$(find "$attachments" -type f | wc -l | tr -d ' ')"
echo "Restore drill passed in an isolated temporary directory. Users: $users; clients: $clients; patients: $patients; attachments: $files."
