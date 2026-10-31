#!/usr/bin/env bash
set -euo pipefail

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/vetma-backup-test.XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT
mkdir -p "$work_dir/source/attachments"
sqlite3 "$work_dir/source/database.sqlite" <<'SQL'
CREATE TABLE app_user (id INTEGER PRIMARY KEY, email TEXT NOT NULL);
CREATE TABLE Client (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE Patient (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE Attention (id INTEGER PRIMARY KEY, reason TEXT NOT NULL);
INSERT INTO app_user VALUES (1, 'restore-test@example.test');
INSERT INTO Client VALUES (1, 'Restore test');
INSERT INTO Patient VALUES (1, 'Luna');
INSERT INTO Attention VALUES (1, 'Backup drill');
SQL
printf 'attachment restore drill\n' > "$work_dir/source/attachments/study.txt"
tar -czf "$work_dir/sample.tar.gz" -C "$work_dir/source" database.sqlite attachments
"$(dirname "$0")/restore-drill.sh" "$work_dir/sample.tar.gz"
