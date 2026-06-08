-- Migration 009: Demo & Pilot Package
-- Phase 13 — Founder Demo / Investor / Pilot Package
-- DO NOT modify existing tables.

CREATE TABLE IF NOT EXISTS demo_sessions (
  id             SERIAL PRIMARY KEY,
  demo_id        TEXT        NOT NULL UNIQUE DEFAULT ('demo_' || gen_random_uuid()::text),
  demo_type      TEXT        NOT NULL DEFAULT 'founder_walkthrough',
  audience_type  TEXT        NOT NULL DEFAULT 'founder_only',
  venue_name     TEXT        NOT NULL DEFAULT '',
  presenter_name TEXT        NOT NULL DEFAULT '',
  status         TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at       TIMESTAMPTZ,
  created_by     TEXT        NOT NULL DEFAULT 'system',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demo_events (
  id          SERIAL PRIMARY KEY,
  demo_id     TEXT        NOT NULL,
  event_type  TEXT        NOT NULL DEFAULT 'screen_view',
  screen_name TEXT        NOT NULL DEFAULT 'unknown',
  module_name TEXT        NOT NULL DEFAULT 'unknown',
  payload     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pilot_partners (
  id            SERIAL PRIMARY KEY,
  partner_id    TEXT        NOT NULL UNIQUE DEFAULT ('pp_' || gen_random_uuid()::text),
  venue_name    TEXT        NOT NULL,
  contact_name  TEXT        NOT NULL DEFAULT '',
  contact_email TEXT        NOT NULL DEFAULT '',
  contact_phone TEXT        NOT NULL DEFAULT '',
  city          TEXT        NOT NULL DEFAULT '',
  state         TEXT        NOT NULL DEFAULT '',
  status        TEXT        NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect','contacted','agreement_sent','active_pilot','completed','declined')),
  pilot_tier    TEXT        NOT NULL DEFAULT 'single_tablet',
  notes         JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pilot_requirements (
  id              SERIAL PRIMARY KEY,
  partner_id      TEXT        NOT NULL REFERENCES pilot_partners(partner_id) ON DELETE CASCADE,
  requirement_key TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','met','not_met','waived')),
  notes           TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pilot_demo_exports (
  id          SERIAL PRIMARY KEY,
  demo_id     TEXT        NOT NULL,
  export_type TEXT        NOT NULL DEFAULT 'json',
  payload     JSONB       NOT NULL DEFAULT '{}',
  created_by  TEXT        NOT NULL DEFAULT 'system',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_events_demo_id    ON demo_events(demo_id);
CREATE INDEX IF NOT EXISTS idx_pilot_req_partner_id   ON pilot_requirements(partner_id);
CREATE INDEX IF NOT EXISTS idx_pilot_exports_demo_id  ON pilot_demo_exports(demo_id);
