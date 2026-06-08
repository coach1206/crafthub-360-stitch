-- ============================================================
-- NOVEE OS — PostgreSQL Schema
-- Target version: Phase 7
-- Run: psql $DATABASE_URL < server/db/schema.sql
-- ============================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── guest_sessions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guest_sessions (
  id                        BIGSERIAL PRIMARY KEY,
  session_id                TEXT        NOT NULL UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  selected_craft            TEXT,
  selected_mentor           TEXT,
  selected_mentor_country   TEXT,
  selected_level            TEXT,
  current_session           JSONB,
  completed_sessions        JSONB        NOT NULL DEFAULT '[]',
  last_visited_route        TEXT,
  schema_version            INTEGER      NOT NULL DEFAULT 4,
  kiosk_mode                BOOLEAN      NOT NULL DEFAULT FALSE,
  source_module             TEXT
);

-- ── guest_profiles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guest_profiles (
  id                        BIGSERIAL PRIMARY KEY,
  session_id                TEXT        NOT NULL REFERENCES guest_sessions(session_id) ON DELETE CASCADE,
  first_name                TEXT,
  last_name                 TEXT,
  nickname                  TEXT,
  age_range                 TEXT,
  phone                     TEXT,
  email                     TEXT,
  city                      TEXT,
  state                     TEXT,
  zip                       TEXT,
  profile_image_url         TEXT,
  image_moderation_status   TEXT         NOT NULL DEFAULT 'pending',
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── craft_sessions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS craft_sessions (
  id                        BIGSERIAL PRIMARY KEY,
  session_id                TEXT        NOT NULL,
  craft                     TEXT         NOT NULL DEFAULT 'SmokeCraft 360',
  session_number            INTEGER      NOT NULL DEFAULT 1,
  score                     INTEGER      NOT NULL DEFAULT 0,
  flavor_preferences        JSONB        NOT NULL DEFAULT '[]',
  strength_tolerance        TEXT,
  aroma_interests           JSONB        NOT NULL DEFAULT '[]',
  vitola_preferences        JSONB        NOT NULL DEFAULT '[]',
  pairing_selections        JSONB        NOT NULL DEFAULT '[]',
  soil_seed_selections      JSONB        NOT NULL DEFAULT '[]',
  mentor_notes              JSONB        NOT NULL DEFAULT '[]',
  completed_at              TIMESTAMPTZ
);

-- ── passport_records ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS passport_records (
  id                        BIGSERIAL PRIMARY KEY,
  passport_id               TEXT        NOT NULL UNIQUE,
  session_id                TEXT        NOT NULL,
  connection_count          INTEGER      NOT NULL DEFAULT 0,
  event_name                TEXT,
  ceremony_seen             BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── passport_stamps ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS passport_stamps (
  id                        BIGSERIAL PRIMARY KEY,
  stamp_id                  TEXT        NOT NULL,
  passport_id               TEXT        NOT NULL REFERENCES passport_records(passport_id) ON DELETE CASCADE,
  session_id                TEXT        NOT NULL,
  title                     TEXT,
  craft                     TEXT,
  session_number            INTEGER      NOT NULL DEFAULT 1,
  event_name                TEXT,
  earned_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  visual_theme              TEXT         NOT NULL DEFAULT 'gold',
  points                    INTEGER      NOT NULL DEFAULT 100,
  source_module             TEXT,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (stamp_id, passport_id)
);

-- ── leaderboard_entries ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id                        BIGSERIAL PRIMARY KEY,
  session_id                TEXT        NOT NULL UNIQUE,
  display_name              TEXT,
  score                     INTEGER      NOT NULL DEFAULT 0,
  rank                      TEXT         NOT NULL DEFAULT 'Novice',
  submitted                 BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── pos3_activity ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_activity (
  id                        BIGSERIAL PRIMARY KEY,
  session_id                TEXT        NOT NULL,
  guest_nickname            TEXT,
  selected_craft            TEXT,
  selected_level            TEXT,
  selected_mentor           TEXT,
  flavor_preferences        JSONB        NOT NULL DEFAULT '[]',
  pairing_selections        JSONB        NOT NULL DEFAULT '[]',
  suggested_pairings        JSONB        NOT NULL DEFAULT '[]',
  upsell_recommendations    JSONB        NOT NULL DEFAULT '[]',
  inventory_signals         JSONB        NOT NULL DEFAULT '[]',
  provider_mode             TEXT         NOT NULL DEFAULT 'prototype',
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── eat_analytics ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eat_analytics (
  id                        BIGSERIAL PRIMARY KEY,
  session_id                TEXT        NOT NULL,
  engagement_score          INTEGER      NOT NULL DEFAULT 0,
  guest_mood_signal         TEXT,
  session_value             INTEGER      NOT NULL DEFAULT 0,
  staff_assist_triggered    BOOLEAN      NOT NULL DEFAULT FALSE,
  environment_notes         JSONB        NOT NULL DEFAULT '[]',
  asset_signals             JSONB        NOT NULL DEFAULT '[]',
  transaction_signals       JSONB        NOT NULL DEFAULT '[]',
  command_payload           JSONB,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── audit_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id                        BIGSERIAL PRIMARY KEY,
  actor_type                TEXT         NOT NULL DEFAULT 'system',
  actor_id                  TEXT,
  action                    TEXT         NOT NULL,
  target_type               TEXT,
  target_id                 TEXT,
  metadata                  JSONB,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── system_events ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_events (
  id                        BIGSERIAL PRIMARY KEY,
  event_type                TEXT         NOT NULL,
  source_module             TEXT,
  session_id                TEXT,
  payload                   JSONB,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_guest_profiles_session_id        ON guest_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_craft_sessions_session_id        ON craft_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_passport_records_session_id      ON passport_records(session_id);
CREATE INDEX IF NOT EXISTS idx_passport_stamps_passport_id      ON passport_stamps(passport_id);
CREATE INDEX IF NOT EXISTS idx_passport_stamps_session_id       ON passport_stamps(session_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score        ON leaderboard_entries(score DESC);
CREATE INDEX IF NOT EXISTS idx_pos3_activity_session_id         ON pos3_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_eat_analytics_session_id         ON eat_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id             ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session               ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_system_events_session_id         ON system_events(session_id);
CREATE INDEX IF NOT EXISTS idx_system_events_event_type         ON system_events(event_type);
