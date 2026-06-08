-- Migration 008: Venue Testing System
-- Phase 12 — Real-World Venue Testing Mode
-- DO NOT modify existing tables. Adds only new testing tables.

-- ── A. venue_tests ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_tests (
  id              SERIAL PRIMARY KEY,
  venue_test_id   TEXT        NOT NULL UNIQUE DEFAULT ('vt_' || gen_random_uuid()::text),
  venue_name      TEXT        NOT NULL,
  test_type       TEXT        NOT NULL DEFAULT 'venue_walkthrough',
  test_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  created_by      TEXT        NOT NULL DEFAULT 'system',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── B. venue_test_sessions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_test_sessions (
  id                SERIAL PRIMARY KEY,
  venue_test_id     TEXT        NOT NULL REFERENCES venue_tests(venue_test_id) ON DELETE CASCADE,
  guest_session_id  TEXT,
  participant_label TEXT        NOT NULL DEFAULT 'Participant',
  participant_type  TEXT        NOT NULL DEFAULT 'guest' CHECK (participant_type IN ('guest','staff','manager','founder','observer')),
  start_time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time          TIMESTAMPTZ,
  completion_status TEXT        NOT NULL DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress','completed','abandoned','partial')),
  notes             JSONB       NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── C. observer_notes ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS observer_notes (
  id               SERIAL PRIMARY KEY,
  venue_test_id    TEXT        NOT NULL,
  guest_session_id TEXT,
  screen_name      TEXT        NOT NULL DEFAULT 'unknown',
  event_type       TEXT        NOT NULL DEFAULT 'observation',
  note             TEXT        NOT NULL,
  severity         TEXT        NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','blocker')),
  created_by       TEXT        NOT NULL DEFAULT 'observer',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── D. venue_test_issues ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_test_issues (
  id               SERIAL PRIMARY KEY,
  venue_test_id    TEXT        NOT NULL,
  guest_session_id TEXT,
  issue_type       TEXT        NOT NULL DEFAULT 'other',
  screen_name      TEXT        NOT NULL DEFAULT 'unknown',
  description      TEXT        NOT NULL,
  severity         TEXT        NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','blocker')),
  status           TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','wont_fix')),
  created_by       TEXT        NOT NULL DEFAULT 'observer',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── E. venue_test_exports ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_test_exports (
  id            SERIAL PRIMARY KEY,
  venue_test_id TEXT        NOT NULL,
  export_type   TEXT        NOT NULL DEFAULT 'json',
  file_path     TEXT,
  created_by    TEXT        NOT NULL DEFAULT 'system',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vts_venue_test_id   ON venue_test_sessions(venue_test_id);
CREATE INDEX IF NOT EXISTS idx_on_venue_test_id    ON observer_notes(venue_test_id);
CREATE INDEX IF NOT EXISTS idx_vti_venue_test_id   ON venue_test_issues(venue_test_id);
CREATE INDEX IF NOT EXISTS idx_vte_venue_test_id   ON venue_test_exports(venue_test_id);
