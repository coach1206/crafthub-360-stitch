-- Rollback for 102_smokecraft_golden_box_submission_authority.sql.
-- Not auto-run.
--   psql "$DATABASE_URL" -f server/db/rollbacks/102_smokecraft_golden_box_submission_authority.rollback.sql
--   DELETE FROM schema_migrations WHERE filename = '102_smokecraft_golden_box_submission_authority.sql';
--
-- Disclosed effect: draft-save/submission idempotency-key dedupe stops
-- being possible (a rapid double-click could again create a duplicate
-- version row). No existing entry/version/submission data is deleted.

DROP INDEX IF EXISTS idx_gbev_idempotency_key;
ALTER TABLE golden_box_entry_versions DROP COLUMN IF EXISTS idempotency_key;
DROP INDEX IF EXISTS idx_gbs_idempotency_key;
ALTER TABLE golden_box_submissions DROP COLUMN IF EXISTS idempotency_key;
