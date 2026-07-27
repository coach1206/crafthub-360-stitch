-- Rollback / compensating migration for
-- 092_smokecraft_canonical_player_state.sql.
--
-- Not auto-run by runMigrations.js (this repo has no down-migration
-- runner) — apply manually if this migration must be reverted:
--   psql "$DATABASE_URL" -f server/db/migrations/092_smokecraft_canonical_player_state.rollback.sql
-- Then also: DELETE FROM schema_migrations WHERE filename = '092_smokecraft_canonical_player_state.sql';
--
-- Safe: only drops the 4 new tables added by 092. Never touches any
-- pre-existing table. Learner-facing data loss on rollback is
-- unavoidable for awards issued after 092 was applied and before
-- rollback (there is no other copy of that data) — this is disclosed,
-- not hidden. Existing client-side localStorage state
-- (novee_guest_session / sc_journey_v1) is completely unaffected by
-- this rollback since it never depended on these tables.

DROP TABLE IF EXISTS smokecraft_award_audit;
DROP TABLE IF EXISTS smokecraft_awards;
DROP TABLE IF EXISTS smokecraft_session_completions;
DROP TABLE IF EXISTS smokecraft_player_state;
