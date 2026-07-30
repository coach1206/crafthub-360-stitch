-- Rollback for 103_smokecraft_golden_box_judging_authority.sql.
-- Not auto-run.
--   psql "$DATABASE_URL" -f server/db/rollbacks/103_smokecraft_golden_box_judging_authority.rollback.sql
--   DELETE FROM schema_migrations WHERE filename = '103_smokecraft_golden_box_judging_authority.sql';
--
-- Disclosed effect: server-computed weighted totals, rule versioning,
-- draft-save optimistic concurrency, and submission idempotency all
-- stop working. Existing scorecards/scores/assignments are untouched.

DROP INDEX IF EXISTS idx_gbsc_idempotency_key;
ALTER TABLE golden_box_scorecards
  DROP COLUMN IF EXISTS weighted_total,
  DROP COLUMN IF EXISTS rule_version,
  DROP COLUMN IF EXISTS draft_version,
  DROP COLUMN IF EXISTS idempotency_key,
  DROP COLUMN IF EXISTS updated_at;
ALTER TABLE golden_box_judge_assignments DROP COLUMN IF EXISTS assigned_by;
DROP TABLE IF EXISTS golden_box_rubric_criteria;
