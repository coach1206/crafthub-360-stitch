-- Holistic Fix 5B-2B-1 — server-authoritative mentor-voice foundation.
-- Additive only. Two tables:
--   1. smokecraft_voice_preferences — one row per guest/account
--      (voice enabled, playback speed, captions, last-previewed
--      mentor), server-authoritative and survives refresh/second
--      device, same pattern as smokecraft_player_state (guest_reference
--      is the sole identity key, composed with the existing
--      ensureSmokeCraftGuestIdentity middleware).
--   2. smokecraft_voice_preview_cache — a bounded-lifetime cache of
--      already-synthesized preview audio, keyed by (mentor_id, speed,
--      text_hash). Preview text is always server-owned (never
--      arbitrary client text), so this cache holds no private learner
--      data — it exists purely to avoid duplicate ElevenLabs provider
--      calls for the same mentor/speed/text combination, including
--      protecting against a rapid double-click before the first
--      request has completed.

CREATE TABLE IF NOT EXISTS smokecraft_voice_preferences (
  id                    BIGSERIAL PRIMARY KEY,
  guest_reference       TEXT NOT NULL UNIQUE,
  voice_enabled         BOOLEAN NOT NULL DEFAULT true,
  playback_speed        NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  captions_enabled      BOOLEAN NOT NULL DEFAULT true,
  last_previewed_mentor_id TEXT,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_svp_guest ON smokecraft_voice_preferences(guest_reference);

CREATE TABLE IF NOT EXISTS smokecraft_voice_preview_cache (
  id            BIGSERIAL PRIMARY KEY,
  mentor_id     TEXT NOT NULL,
  speed         NUMERIC(3,2) NOT NULL,
  text_hash     TEXT NOT NULL,
  transcript    TEXT NOT NULL,
  audio_base64  TEXT NOT NULL,
  content_type  TEXT NOT NULL DEFAULT 'audio/mpeg',
  voice_id      TEXT NOT NULL,
  request_id    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  UNIQUE (mentor_id, speed, text_hash)
);
CREATE INDEX IF NOT EXISTS idx_svpc_expires ON smokecraft_voice_preview_cache(expires_at);
