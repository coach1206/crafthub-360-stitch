-- Rollback for 095_smokecraft_gameplay_rank_and_rules.sql.
-- Not auto-run (see 092's rollback for the same convention).
--   psql "$DATABASE_URL" -f server/db/rollbacks/095_smokecraft_gameplay_rank_and_rules.rollback.sql
--   DELETE FROM schema_migrations WHERE filename = '095_smokecraft_gameplay_rank_and_rules.sql';
--
-- Disclosed data loss: rank-promotion history and leaderboard
-- eligibility preferences recorded after 095 was applied are lost.
-- rule_version columns on the pre-existing awards/completions tables
-- are dropped; those rows themselves (the actual awards) are untouched.

ALTER TABLE smokecraft_awards DROP COLUMN IF EXISTS rule_version;
ALTER TABLE smokecraft_session_completions DROP COLUMN IF EXISTS rule_version;
DROP TABLE IF EXISTS smokecraft_leaderboard_eligibility;
DROP TABLE IF EXISTS smokecraft_rank_history;
DROP TABLE IF EXISTS smokecraft_gameplay_rules;
