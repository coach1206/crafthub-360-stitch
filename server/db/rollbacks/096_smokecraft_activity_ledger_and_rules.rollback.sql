-- Rollback for 096_smokecraft_activity_ledger_and_rules.sql.
-- Not auto-run (see 092/095's rollbacks for the same convention).
--   psql "$DATABASE_URL" -f server/db/rollbacks/096_smokecraft_activity_ledger_and_rules.rollback.sql
--   DELETE FROM schema_migrations WHERE filename = '096_smokecraft_activity_ledger_and_rules.sql';
--
-- Disclosed data loss: quiz/leaf-challenge attempt evidence and any
-- recorded reward corrections are lost. The XP/badge/stamp awards those
-- attempts produced (in smokecraft_awards / smokecraft_player_state) are
-- untouched — this only drops the supporting evidence/correction tables.
-- Seeded rule rows in smokecraft_gameplay_rules (added by the separate,
-- idempotent seed script, not by this migration) are NOT touched here —
-- run the seed script's own cleanup if a full rollback of rule rows is
-- also required.

DROP TABLE IF EXISTS smokecraft_reward_corrections;
DROP TABLE IF EXISTS smokecraft_activity_attempts;
