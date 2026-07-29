-- Rollback for 099_smokecraft_mentor_voice.sql. Not auto-run.
--   psql "$DATABASE_URL" -f server/db/rollbacks/099_smokecraft_mentor_voice.rollback.sql
--   DELETE FROM schema_migrations WHERE filename = '099_smokecraft_mentor_voice.sql';
--
-- Disclosed data loss: saved voice preferences (enabled/speed/captions/
-- last-previewed mentor) and any cached preview audio are lost. No XP,
-- score, badge, or Passport data is touched.

DROP TABLE IF EXISTS smokecraft_voice_preview_cache;
DROP TABLE IF EXISTS smokecraft_voice_preferences;
