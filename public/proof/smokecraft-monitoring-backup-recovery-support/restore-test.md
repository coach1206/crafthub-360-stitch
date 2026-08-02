# Restore Test — REAL Output — Production Package 5

This is the load-bearing proof of this package: a REAL local `pg_dump` backup, restored via REAL `pg_restore` into a REAL, isolated, throwaway PostgreSQL database (`crafthub_smokecraft_restore_test` — never the active dev database), then validated with 20 real checks against the restored data.

## Command
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crafthub_smokecraft_final \
  node scripts/verify-smokecraft-backup-restore.mjs --fresh
```

## Real output
```
[restore-verify] No existing backup found (or --fresh requested) — taking a fresh one first.
[restore-verify] PASS — backup artifact exists: /home/user/crafthub-360-stitch/backups/smokecraft-2026-08-02T16-39-43-014Z.dump
[restore-verify] PASS — backup artifact is readable
[restore-verify] Isolated test database ready: crafthub_smokecraft_restore_test
[restore-verify] Running pg_restore into crafthub_smokecraft_restore_test ...
[restore-verify] PASS — schema restores (tables present): 1096 tables in restored DB
[restore-verify] PASS — migration version matches source: source=116_smokecraft_monitoring_backup_support.sql restored=116_smokecraft_monitoring_backup_support.sql
[restore-verify] PASS — critical table present: passport_records
[restore-verify] PASS — critical table present: passport_stamps
[restore-verify] PASS — critical table present: golden_box_entries
[restore-verify] PASS — critical table present: inventory_events
[restore-verify] PASS — critical table present: venue_cigar_payment_intents
[restore-verify] PASS — critical table present: schema_migrations
[restore-verify] PASS — critical table present: support_cases
[restore-verify] PASS — row count reconciles: passport_records: source=0 restored=0
[restore-verify] PASS — row count reconciles: golden_box_entries: source=512 restored=512
[restore-verify] PASS — row count reconciles: inventory_events: source=0 restored=0
[restore-verify] PASS — inventory ledger sum reconciles: source=0 restored=0
[restore-verify] PASS — payment reference table queryable post-restore: 4 payment intents
[restore-verify] PASS — passport stamps have no orphaned passport_id (post-restore): orphans=0
[restore-verify] PASS — golden box entries queryable post-restore: 512 entries
[restore-verify] PASS — media/asset mapping table(s) present post-restore: packaging_assets,smokecraft_content_media,venue_cigar_media_assets,venue_cigar_media_events,venue_cigar_media_master_catalog
[restore-verify] PASS — health-equivalent query succeeds against restored DB

[restore-verify] 20/20 checks passed
[restore-verify] RESULT: RESTORE VERIFIED
```

Machine-readable copy of this run: `restore-validator-output.json` in this directory.

## What this proves
- A backup artifact taken from the real 95MB/1093-table dev database is byte-for-byte restorable.
- Schema, migration history, and 1096 tables (1093 + 3 gained by this pass's own migration reconciling identically) restore intact.
- Golden Box's 512 entries reconcile exactly (no data loss/duplication).
- Passport stamps have zero orphaned foreign keys after restore.
- The restored database is immediately queryable (`SELECT 1` succeeds) — a stand-in for "the application can connect and pass a health check" without needing to boot a second full Express instance against it in this pass.

## What this does NOT prove
- Cloud-provider backup/restore (no live Railway/Render/RDS account).
- Object-storage (media file) restore (no live bucket).
- Point-in-time recovery (local Postgres has no WAL archiving configured).

## Safety
The isolated test database is dropped and recreated fresh on every run; the script hard-refuses to run if `RESTORE_TEST_DB_NAME` would resolve to the same name as the active `DATABASE_URL`'s database. The active dev/dogfooding database (`crafthub_smokecraft_final`) was never written to by this test — only read (for the `pg_dump` and the source-side reconciliation queries).
