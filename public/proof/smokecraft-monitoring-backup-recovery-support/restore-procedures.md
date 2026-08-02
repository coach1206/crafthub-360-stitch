# Restore Procedures — Production Package 5

## Full database restore (tested this pass — see restore-test.md)
1. Identify the backup artifact (`backups/*.dump`, sha256-verified).
2. Create/target an **isolated** database — NEVER the active dev/production database.
3. `pg_restore --no-owner --no-privileges --dbname <isolated-db-url> <artifact>`.
4. Run `scripts/verify-smokecraft-backup-restore.mjs`'s validation suite (schema/migration/critical-tables/reconciliation checks).
5. Only after validation passes is the restored data considered trustworthy — a restore that "ran without error" but fails validation is treated as a restore FAILURE (see `alerts-inventory.md`'s `restore_verification_failure`).
6. Promote the isolated DB to the real connection string only via a deliberate, reviewed cutover (out of scope for an automated script — this is a human decision with the validated restore as evidence).

## Point-in-time restore (documented target, not exercised — no managed provider)
On a managed Postgres provider with WAL archiving, PITR restores to a specific timestamp before the incident. Locally, without WAL archiving, only full-dump restores (to the moment of the last backup) are possible — documented as the honest MVP capability, not fabricated as PITR.

## Single-table recovery
`pg_restore --table=<table_name> --data-only --dbname <isolated-db-url> <artifact>` into the isolated DB, then a manual, reviewed `INSERT ... SELECT` (or `pg_dump`/`psql \copy`) into production for just the affected rows — never a blind full-table overwrite. Always preceded by a diff between production and the restored isolated copy.

## Media-original / media-metadata restoration
Metadata (asset mapping/rights tables) restores as part of the standard DB restore above (verified this pass). Media originals restore from the object-storage provider's versioning/replication (see `object-storage-protection.md`) — not exercised, no live bucket.

## Failed-deployment rollback
Package 4 already provides `scripts/rollback.sh` and `server/scripts/verifyDeploymentReadiness.js`; this package does not duplicate that machinery. New addition: `/api/admin/ops-status`'s `latestDeployment` field gives the owner a single place to see current build identity alongside backup/restore/incident status.

## Migration rollback
`server/db/rollbacks/` (pre-existing) holds the down-migrations. Recommended process (documented): take a `--pre-migration` backup (this pass's script supports the flag) before running any migration, so a rollback SQL failure still has a full-dump fallback.

## Accidental product/media retirement recovery
`venue_cigar_media_events` is event-sourced (append-only) — a "retire" event does not delete the underlying asset row, so recovery is "replay/ignore the retirement event," not "restore from backup," for the common case. Full restore is the fallback only if the event history itself is corrupted.

## Payment-state reconciliation after restore
Use the canonical reconciliation tooling already built in Package 2 (`venue_cigar_payment_reconciliation_runs` table + its service) against the restored data — not a new ad-hoc script. This pass's restore validator confirms the payment-reference tables are queryable and row-consistent post-restore; it does not re-run Package 2's full reconciliation logic (out of scope duplication) but leaves the data in a state where that tooling can.

## Inventory reconciliation after restore
`inventory_events` is append-only; the restore validator confirms row count AND (when a quantity-delta column exists) the sum of deltas reconciles exactly between source and restored copy — proof that no ledger rows were lost or duplicated by the restore.

## Passport/Golden Box consistency checks
Restore validator confirms: zero orphaned `passport_stamps` (every stamp's `passport_id` resolves to a real `passport_records` row) and `golden_box_entries` row count reconciles exactly (512/512 this pass).

**A restore is not considered complete until `scripts/verify-smokecraft-backup-restore.mjs` exits 0.**
