-- Migration 068: Passport 360 SmokeCraft Live Persistence
-- Phase F.5 — Real database-backed Passport 360 persistence for SmokeCraft 360
-- Safe: CREATE TABLE IF NOT EXISTS only. No DROP. No destructive ALTER.

-- 1. Guest profiles
CREATE TABLE IF NOT EXISTS passport_360_guest_profiles (
  guest_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL DEFAULT 'novee-default',
  venue_id              TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_reference       TEXT NOT NULL,
  display_name          TEXT,
  email_hash            TEXT,
  phone_hash            TEXT,
  profile_status        TEXT NOT NULL DEFAULT 'active'
                          CHECK (profile_status IN ('active', 'inactive', 'pending')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_passport_guest_ref
  ON passport_360_guest_profiles (tenant_id, venue_id, guest_reference);

-- 2. Guest progress
CREATE TABLE IF NOT EXISTS passport_360_guest_progress (
  progress_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 TEXT NOT NULL DEFAULT 'novee-default',
  venue_id                  TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id                  UUID NOT NULL REFERENCES passport_360_guest_profiles(guest_id) ON DELETE CASCADE,
  module_key                TEXT NOT NULL DEFAULT 'smokecraft-360',
  total_xp                  INTEGER NOT NULL DEFAULT 0,
  current_level             INTEGER NOT NULL DEFAULT 1,
  completed_sessions_count  INTEGER NOT NULL DEFAULT 0,
  last_session_key          TEXT,
  last_completed_route      TEXT,
  return_visit_count        INTEGER NOT NULL DEFAULT 0,
  progress_status           TEXT NOT NULL DEFAULT 'active'
                              CHECK (progress_status IN ('active', 'complete', 'paused')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_passport_progress_guest_module
  ON passport_360_guest_progress (guest_id, module_key);

-- 3. Earned stamps (dedupe_key prevents duplicate awards)
CREATE TABLE IF NOT EXISTS passport_360_earned_stamps (
  earned_stamp_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL DEFAULT 'novee-default',
  venue_id          TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id          UUID NOT NULL REFERENCES passport_360_guest_profiles(guest_id) ON DELETE CASCADE,
  stamp_id          TEXT NOT NULL,
  module_key        TEXT NOT NULL DEFAULT 'smokecraft-360',
  source_session_id TEXT,
  source_route      TEXT,
  xp_awarded        INTEGER NOT NULL DEFAULT 0,
  earned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dedupe_key        TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_passport_stamp_dedupe
  ON passport_360_earned_stamps (dedupe_key);

-- 4. Badges
CREATE TABLE IF NOT EXISTS passport_360_badges (
  badge_record_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL DEFAULT 'novee-default',
  venue_id          TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id          UUID NOT NULL REFERENCES passport_360_guest_profiles(guest_id) ON DELETE CASCADE,
  badge_id          TEXT NOT NULL,
  badge_label       TEXT,
  module_key        TEXT NOT NULL DEFAULT 'smokecraft-360',
  source_session_id TEXT,
  earned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passport_badges_guest
  ON passport_360_badges (guest_id, module_key);

-- 5. SmokeCraft flavor memory
CREATE TABLE IF NOT EXISTS passport_360_smokecraft_flavor_memory (
  flavor_memory_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL DEFAULT 'novee-default',
  venue_id              TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id              UUID NOT NULL REFERENCES passport_360_guest_profiles(guest_id) ON DELETE CASCADE,
  source_session_id     TEXT,
  taste_tags_json       JSONB NOT NULL DEFAULT '[]',
  tasting_notes_json    JSONB NOT NULL DEFAULT '{}',
  flavor_profile_source TEXT NOT NULL DEFAULT 'not_collected',
  data_quality_status   TEXT NOT NULL DEFAULT 'observe_confirm_only'
                          CHECK (data_quality_status IN ('observe_confirm_only', 'partial', 'complete')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passport_flavor_guest
  ON passport_360_smokecraft_flavor_memory (guest_id);

-- 6. SmokeCraft sessions
CREATE TABLE IF NOT EXISTS passport_360_smokecraft_sessions (
  passport_session_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL DEFAULT 'novee-default',
  venue_id              TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id              UUID NOT NULL REFERENCES passport_360_guest_profiles(guest_id) ON DELETE CASCADE,
  smokecraft_session_id TEXT,
  session_status        TEXT NOT NULL DEFAULT 'completed'
                          CHECK (session_status IN ('started', 'completed', 'abandoned')),
  completed_route       TEXT,
  completed_steps_json  JSONB NOT NULL DEFAULT '[]',
  taste_profile_json    JSONB NOT NULL DEFAULT '{}',
  xp_summary_json       JSONB NOT NULL DEFAULT '{}',
  stamp_summary_json    JSONB NOT NULL DEFAULT '[]',
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passport_sessions_guest
  ON passport_360_smokecraft_sessions (guest_id);

-- 7. Sync audit log
CREATE TABLE IF NOT EXISTS passport_360_sync_audit_log (
  audit_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL DEFAULT 'novee-default',
  venue_id          TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id          UUID,
  event_type        TEXT NOT NULL,
  sync_status       TEXT NOT NULL DEFAULT 'ok'
                      CHECK (sync_status IN ('ok', 'failed', 'fallback', 'skipped')),
  backend_connected BOOLEAN NOT NULL DEFAULT FALSE,
  summary           TEXT,
  metadata_json     JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passport_audit_guest
  ON passport_360_sync_audit_log (guest_id, created_at DESC);
