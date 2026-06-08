-- Migration 006: Device Deployment Tables
-- Phase 11 — Kiosk / Tablet Deployment Package
-- Safe to run multiple times (all CREATE TABLE IF NOT EXISTS)

-- ── A. venue_devices ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_devices (
  id             SERIAL PRIMARY KEY,
  device_id      TEXT        NOT NULL UNIQUE,
  venue_id       TEXT        NOT NULL DEFAULT 'novee-grand-lounge',
  device_name    TEXT        NOT NULL DEFAULT 'NOVEE Device',
  device_type    TEXT        NOT NULL DEFAULT 'tablet'
                             CHECK (device_type IN ('tablet','kiosk','staff_terminal','manager_terminal','founder_terminal','demo_browser')),
  kiosk_mode     BOOLEAN     NOT NULL DEFAULT FALSE,
  assigned_module TEXT,
  allowed_routes JSONB       NOT NULL DEFAULT '[]'::jsonb,
  status         TEXT        NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active','inactive','locked')),
  last_seen_at   TIMESTAMPTZ,
  app_version    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── B. device_events ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_events (
  id          SERIAL PRIMARY KEY,
  device_id   TEXT        NOT NULL,
  venue_id    TEXT        NOT NULL DEFAULT 'novee-grand-lounge',
  event_type  TEXT        NOT NULL,
  route_path  TEXT,
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_events_device_id ON device_events(device_id);
CREATE INDEX IF NOT EXISTS idx_device_events_created_at ON device_events(created_at DESC);

-- ── C. deployment_checks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deployment_checks (
  id         SERIAL PRIMARY KEY,
  check_key  TEXT        NOT NULL UNIQUE,
  status     TEXT        NOT NULL DEFAULT 'unknown'
             CHECK (status IN ('pass','fail','warn','unknown')),
  message    TEXT,
  metadata   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed a default prototype device if none exists
INSERT INTO venue_devices (device_id, venue_id, device_name, device_type, kiosk_mode, app_version)
VALUES ('device-prototype-001', 'novee-grand-lounge', 'Prototype Device', 'demo_browser', FALSE, '4.2.0')
ON CONFLICT (device_id) DO NOTHING;
