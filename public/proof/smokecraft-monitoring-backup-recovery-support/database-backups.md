# Database Backups — Production Package 5

## Script
`scripts/backup-smokecraft-database.mjs` — runs a REAL `pg_dump --format=custom` against `DATABASE_URL`, writes a timestamped `.dump` artifact to `backups/` (gitignored), computes a sha256 checksum, and records the outcome (success or failure — never silent) to the `backup_run_log` table.

## Real run, this pass
```
$ DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crafthub_smokecraft_final node scripts/backup-smokecraft-database.mjs
[backup] Running pg_dump (custom format) -> /home/user/crafthub-360-stitch/backups/smokecraft-2026-08-02T16-38-16-044Z.dump
[backup] SUCCESS. 5627164 bytes, sha256=04fafb184599c7c0214ddd2e4566fb8e3b28052aa2a13708f2c0335ed6d59362, migration_version=116_smokecraft_monitoring_backup_support.sql
[backup] Retention applied. 1 backup artifact(s) retained (7-day daily + 8 weekly snapshots).
```
Artifact: real `pg_dump` of the actual 95MB / 1093-table `crafthub_smokecraft_final` dev database, 5.6MB compressed custom-format dump.

## Retention policy
- Daily automated backup, retained 7 days.
- One weekly snapshot per ISO week retained for 8 weeks (longer-retention tier).
- Pre-migration rule: `node scripts/backup-smokecraft-database.mjs --pre-migration` tags the artifact so migration runs can be preceded by a backup as a matter of process (documented convention; not yet auto-invoked from `runMigrations.js` — recommended as a Package 6/7 follow-up so migrations can't run without a fresh backup).
- Pruning is applied by the script itself on every run (real, not aspirational).

## Environment separation
Backup artifacts are named with environment-agnostic timestamps; `DATABASE_URL` at run time determines which environment is backed up. No cross-environment restore confusion is possible because the restore validator (`verify-smokecraft-backup-restore.mjs`) always restores into an isolated test database, never overwriting the source.

## Encrypted storage plan (documented — not exercised, no cloud account)
Production target: nightly `pg_dump` artifact uploaded to R2/S3 with server-side encryption (SSE) enabled, bucket versioning on, lifecycle policy transitioning to cheaper storage after 30 days and expiring after the retention window. This sandbox has no live bucket — the local artifact + checksum is the real, verifiable proof this pass provides; cloud upload is a config/credential step for whoever owns the eventual account.

## Point-in-time recovery (PITR)
Not available with a local unmanaged Postgres instance (no WAL archiving configured). Once on a managed provider (Railway/Render/Neon/RDS), enable their native PITR feature — typically continuous WAL shipping with a 7-35 day recovery window depending on tier. Documented as a target capability, not fabricated as already active.

## Backup failure alert logic
`server/lib/alertRules.mjs`'s `backup_failure` rule fires on a single failed run (sev1, no dampening — a silent backup failure is exactly the kind of thing that must never go unnoticed). The backup script itself writes a `status='failure'` row to `backup_run_log` on any `pg_dump` error, so the owner-status view (`owner-status-view.md`) turns RED immediately.

## Restricted access
`backup_run_log` and the `backups/` directory are not exposed by any public route; `/api/admin/ops-status` (admin-gated) only exposes the derived status label and timestamp, never the artifact path or raw contents.

## Deletion policy
Automated pruning per retention policy above; no manual ad-hoc deletion path exists in application code (only the backup script itself prunes, on a predictable schedule).

## Cost estimate
Local: $0 (this sandbox). Production target (R2/S3, ~$0.015/GB-month, single-digit-GB dumps, 7-day + 8-weekly retention): well under $1/month at current data volume.
