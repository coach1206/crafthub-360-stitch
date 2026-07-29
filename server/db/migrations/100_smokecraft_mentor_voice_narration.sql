-- Holistic Fix 5B-2B-2 — extends the 5B-2B-1 voice-preview cache to
-- also cover guidance narration. Unlike a preview (fixed, identical
-- text for every learner previewing a given mentor), narrated
-- guidance text is per-learner (it comes from
-- mentorGuidanceService.getGuidance(), which reads that learner's own
-- real progress/pairing/quiz/tasting signals) — so the cache must be
-- learner-scoped for narration, while remaining the existing
-- global/anonymous cache for a plain voice preview.
--
-- guest_reference defaults to '' (empty string, not NULL) so the
-- existing (mentor_id, speed, text_hash) preview rows keep working
-- unchanged under the new composite unique key — Postgres treats NULL
-- as never equal to itself for uniqueness purposes, which would have
-- silently broken the preview cache's ON CONFLICT dedupe.

ALTER TABLE smokecraft_voice_preview_cache
  ADD COLUMN IF NOT EXISTS guest_reference TEXT NOT NULL DEFAULT '';

ALTER TABLE smokecraft_voice_preview_cache
  DROP CONSTRAINT IF EXISTS smokecraft_voice_preview_cache_mentor_id_speed_text_hash_key;

ALTER TABLE smokecraft_voice_preview_cache
  ADD CONSTRAINT smokecraft_voice_preview_cache_guest_mentor_speed_hash_key
  UNIQUE (guest_reference, mentor_id, speed, text_hash);

CREATE INDEX IF NOT EXISTS idx_svpc_guest ON smokecraft_voice_preview_cache(guest_reference);
