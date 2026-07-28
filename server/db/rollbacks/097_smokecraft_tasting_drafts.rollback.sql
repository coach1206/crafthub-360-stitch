-- Rollback for 097_smokecraft_tasting_drafts.sql.
-- Not auto-run (see 092/095/096's rollbacks for the same convention).
--   psql "$DATABASE_URL" -f server/db/rollbacks/097_smokecraft_tasting_drafts.rollback.sql
--   DELETE FROM schema_migrations WHERE filename = '097_smokecraft_tasting_drafts.sql';
--
-- Disclosed data loss: in-progress (unsubmitted) tasting drafts are lost.
-- Completed tasting attempts (in smokecraft_activity_attempts) and the
-- XP/awards they granted are untouched — this only drops draft state.

DROP TABLE IF EXISTS smokecraft_tasting_drafts;
