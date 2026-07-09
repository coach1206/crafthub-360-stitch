-- Migration 069: E.A.T. SmokeCraft Live Sync
-- Phase F.7 — Real backend sync tables for SmokeCraft → E.A.T. management activity
-- Safe: CREATE TABLE IF NOT EXISTS only. No DROP. No destructive ALTER.

-- 1. Session sync records
CREATE TABLE IF NOT EXISTS eat_smokecraft_session_sync (
  sync_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id               TEXT,
  smokecraft_session_id  TEXT,
  passport_session_id    TEXT,
  session_status         TEXT NOT NULL DEFAULT 'completed'
                           CHECK (session_status IN ('started', 'completed', 'abandoned')),
  completed_route        TEXT,
  completed_steps_json   JSONB NOT NULL DEFAULT '[]',
  xp_summary_json        JSONB NOT NULL DEFAULT '{}',
  stamp_summary_json     JSONB NOT NULL DEFAULT '[]',
  taste_profile_json     JSONB NOT NULL DEFAULT '{}',
  sync_status            TEXT NOT NULL DEFAULT 'ok'
                           CHECK (sync_status IN ('ok', 'failed', 'fallback', 'pending')),
  backend_connected      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eat_smokecraft_session_sync_guest
  ON eat_smokecraft_session_sync (guest_id, created_at DESC);

-- 2. Guest activity records
CREATE TABLE IF NOT EXISTS eat_smokecraft_guest_activity (
  activity_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id               TEXT,
  smokecraft_session_id  TEXT,
  activity_type          TEXT NOT NULL,
  activity_summary       TEXT,
  flavor_tags_json       JSONB NOT NULL DEFAULT '[]',
  loyalty_signal         TEXT NOT NULL DEFAULT 'none'
                           CHECK (loyalty_signal IN ('none', 'low', 'medium', 'high')),
  vip_signal             BOOLEAN NOT NULL DEFAULT FALSE,
  manager_visibility     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eat_smokecraft_guest_activity_guest
  ON eat_smokecraft_guest_activity (guest_id, created_at DESC);

-- 3. Staff handoff queue
CREATE TABLE IF NOT EXISTS eat_smokecraft_handoff_queue (
  handoff_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id               TEXT,
  smokecraft_session_id  TEXT,
  handoff_type           TEXT NOT NULL DEFAULT 'pos360_preview',
  target_system          TEXT NOT NULL DEFAULT 'pos360',
  handoff_status         TEXT NOT NULL DEFAULT 'queued'
                           CHECK (handoff_status IN ('queued', 'delivered', 'acknowledged', 'dismissed')),
  handoff_payload_json   JSONB NOT NULL DEFAULT '{}',
  staff_action_required  BOOLEAN NOT NULL DEFAULT TRUE,
  backend_connected      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eat_smokecraft_handoff_venue
  ON eat_smokecraft_handoff_queue (venue_id, handoff_status, created_at DESC);

-- 4. Manager alerts
CREATE TABLE IF NOT EXISTS eat_smokecraft_manager_alerts (
  alert_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id               TEXT,
  smokecraft_session_id  TEXT,
  alert_type             TEXT NOT NULL,
  alert_priority         TEXT NOT NULL DEFAULT 'normal'
                           CHECK (alert_priority IN ('low', 'normal', 'high', 'urgent')),
  alert_message          TEXT,
  resolved               BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eat_smokecraft_alerts_venue
  ON eat_smokecraft_manager_alerts (venue_id, resolved, created_at DESC);

-- 5. Inventory signals
CREATE TABLE IF NOT EXISTS eat_smokecraft_inventory_signals (
  signal_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  smokecraft_session_id  TEXT,
  cigar_reference        TEXT,
  menu_item_reference    TEXT,
  inventory_signal_type  TEXT NOT NULL DEFAULT 'interest'
                           CHECK (inventory_signal_type IN ('interest', 'purchase_request', 'reorder', 'low_stock_notice')),
  quantity_signal        INTEGER,
  reorder_signal         BOOLEAN NOT NULL DEFAULT FALSE,
  signal_status          TEXT NOT NULL DEFAULT 'pending'
                           CHECK (signal_status IN ('pending', 'acknowledged', 'actioned', 'dismissed')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eat_smokecraft_inventory_venue
  ON eat_smokecraft_inventory_signals (venue_id, signal_status, created_at DESC);

-- 6. Sync audit log
CREATE TABLE IF NOT EXISTS eat_smokecraft_sync_audit_log (
  audit_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id               TEXT,
  event_type             TEXT NOT NULL,
  sync_status            TEXT NOT NULL DEFAULT 'ok'
                           CHECK (sync_status IN ('ok', 'failed', 'fallback', 'skipped')),
  backend_connected      BOOLEAN NOT NULL DEFAULT FALSE,
  summary                TEXT,
  metadata_json          JSONB NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eat_smokecraft_audit_guest
  ON eat_smokecraft_sync_audit_log (guest_id, created_at DESC);
