-- Rollback for 100_smokecraft_mentor_voice_narration.sql. Not auto-run.
--   psql "$DATABASE_URL" -f server/db/rollbacks/100_smokecraft_mentor_voice_narration.rollback.sql
--   DELETE FROM schema_migrations WHERE filename = '100_smokecraft_mentor_voice_narration.sql';
--
-- Disclosed data loss: any cached guidance-narration audio is lost
-- (harmless — it is regenerated on next request). The plain voice-
-- preview cache rows (guest_reference = '') are preserved by
-- collapsing back to the original (mentor_id, speed, text_hash)
-- uniqueness; any narration rows (guest_reference != '') are removed
-- since they cannot be represented in the old schema.

DELETE FROM smokecraft_voice_preview_cache WHERE guest_reference != '';
ALTER TABLE smokecraft_voice_preview_cache
  DROP CONSTRAINT IF EXISTS smokecraft_voice_preview_cache_guest_mentor_speed_hash_key;
ALTER TABLE smokecraft_voice_preview_cache
  ADD CONSTRAINT smokecraft_voice_preview_cache_mentor_id_speed_text_hash_key
  UNIQUE (mentor_id, speed, text_hash);
ALTER TABLE smokecraft_voice_preview_cache DROP COLUMN IF EXISTS guest_reference;
