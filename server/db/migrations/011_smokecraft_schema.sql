-- Migration 011: SmokeCraft Shared Backend Schema (Phase 9 — planning/foundation)
-- Safe to run multiple times (all CREATE TABLE IF NOT EXISTS).
--
-- NOT YET APPLIED to any running database as of this commit. No server route
-- reads or writes these tables yet. See docs/smokecraft-backend-schema.md for
-- the full rationale and what remains pending per table.

-- ── A. smoke_sessions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smoke_sessions (
  id               SERIAL PRIMARY KEY,
  session_id       TEXT        NOT NULL UNIQUE REFERENCES guest_sessions(session_id) ON DELETE CASCADE,
  venue_id         TEXT        NOT NULL DEFAULT 'novee-grand-lounge',
  craft_session_id INTEGER,
  xp               INTEGER     NOT NULL DEFAULT 0,
  rank             TEXT,
  completed_steps  INTEGER     NOT NULL DEFAULT 0,
  final_score      INTEGER     NOT NULL DEFAULT 0,
  challenge_status TEXT        NOT NULL DEFAULT 'not_started'
                               CHECK (challenge_status IN ('not_started','in_progress','completed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smoke_sessions_venue_id ON smoke_sessions(venue_id);

-- ── B. smoke_session_events ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smoke_session_events (
  id               SERIAL PRIMARY KEY,
  smoke_session_id INTEGER     NOT NULL REFERENCES smoke_sessions(id) ON DELETE CASCADE,
  venue_id         TEXT        NOT NULL DEFAULT 'novee-grand-lounge',
  event_type       TEXT        NOT NULL,
  payload          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smoke_session_events_session_created
  ON smoke_session_events(smoke_session_id, created_at DESC);

-- ── C. smoke_purchase_intents ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smoke_purchase_intents (
  id                   SERIAL PRIMARY KEY,
  intent_id            TEXT        NOT NULL UNIQUE,
  smoke_session_id     INTEGER     NOT NULL REFERENCES smoke_sessions(id) ON DELETE CASCADE,
  venue_id             TEXT        NOT NULL DEFAULT 'novee-grand-lounge',
  product              TEXT,
  status               TEXT        NOT NULL DEFAULT 'intent_created'
                                   CHECK (status IN ('intent_created','pending_pos_verification','verified','rejected')),
  verification_status  TEXT        NOT NULL DEFAULT 'unverified'
                                   CHECK (verification_status IN ('unverified','verified','rejected')),
  verified_by_staff_id INTEGER,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smoke_purchase_intents_venue_status
  ON smoke_purchase_intents(venue_id, status);

-- ── D. smoke_purchase_verifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smoke_purchase_verifications (
  id                  SERIAL PRIMARY KEY,
  purchase_intent_id  INTEGER     NOT NULL REFERENCES smoke_purchase_intents(id) ON DELETE CASCADE,
  venue_id            TEXT        NOT NULL DEFAULT 'novee-grand-lounge',
  action              TEXT        NOT NULL CHECK (action IN ('verified','rejected')),
  staff_id            INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smoke_purchase_verifications_intent_created
  ON smoke_purchase_verifications(purchase_intent_id, created_at DESC);

-- ── E. smoke_leaderboard_entries ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smoke_leaderboard_entries (
  id               SERIAL PRIMARY KEY,
  smoke_session_id INTEGER     NOT NULL REFERENCES smoke_sessions(id) ON DELETE CASCADE,
  venue_id         TEXT        NOT NULL DEFAULT 'novee-grand-lounge',
  xp               INTEGER     NOT NULL DEFAULT 0,
  rank             TEXT,
  final_score      INTEGER     NOT NULL DEFAULT 0,
  completed_steps  INTEGER     NOT NULL DEFAULT 0,
  visibility       TEXT        NOT NULL DEFAULT 'local_only'
                               CHECK (visibility IN ('local_only','venue_shared')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smoke_leaderboard_entries_venue_score
  ON smoke_leaderboard_entries(venue_id, final_score DESC);

-- ── F. smoke_winner_categories ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smoke_winner_categories (
  id               SERIAL PRIMARY KEY,
  smoke_session_id INTEGER     NOT NULL REFERENCES smoke_sessions(id) ON DELETE CASCADE,
  category_id      TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('earned','pending','locked')),
  earned_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (smoke_session_id, category_id)
);

-- ── G. smoke_eat_handoffs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smoke_eat_handoffs (
  id                       SERIAL PRIMARY KEY,
  handoff_id               TEXT        NOT NULL UNIQUE,
  smoke_session_id         INTEGER     NOT NULL REFERENCES smoke_sessions(id) ON DELETE CASCADE,
  purchase_intent_id       INTEGER     REFERENCES smoke_purchase_intents(id) ON DELETE SET NULL,
  venue_id                 TEXT        NOT NULL DEFAULT 'novee-grand-lounge',
  visible_to_management    BOOLEAN     NOT NULL DEFAULT FALSE,
  status                   TEXT        NOT NULL DEFAULT 'pending',
  acknowledged_by_user_id  INTEGER,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smoke_eat_handoffs_venue_created
  ON smoke_eat_handoffs(venue_id, created_at DESC);

-- ── H. smoke_inventory_impact_previews ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS smoke_inventory_impact_previews (
  id                 SERIAL PRIMARY KEY,
  smoke_session_id   INTEGER     NOT NULL REFERENCES smoke_sessions(id) ON DELETE CASCADE,
  venue_id           TEXT        NOT NULL DEFAULT 'novee-grand-lounge',
  product            TEXT,
  previewed_quantity INTEGER     NOT NULL DEFAULT 0,
  applied            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smoke_inventory_impact_previews_session
  ON smoke_inventory_impact_previews(smoke_session_id);

-- ── I. smoke_audit_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smoke_audit_logs (
  id          SERIAL PRIMARY KEY,
  event_type  TEXT        NOT NULL,
  actor_role  TEXT,
  actor_id    INTEGER,
  venue_id    TEXT        NOT NULL DEFAULT 'novee-grand-lounge',
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smoke_audit_logs_venue_created ON smoke_audit_logs(venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smoke_audit_logs_event_type ON smoke_audit_logs(event_type);
