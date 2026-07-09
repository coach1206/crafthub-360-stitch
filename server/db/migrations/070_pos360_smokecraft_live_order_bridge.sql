-- Migration 070: POS360 SmokeCraft Live Order Bridge
-- Phase F.8 — Real backend persistence for SmokeCraft → POS360 order / handoff intent
-- Safe: CREATE TABLE IF NOT EXISTS only. No DROP. No destructive ALTER.

-- 1. Order intents (purchase / cigar request from SmokeCraft)
CREATE TABLE IF NOT EXISTS pos360_smokecraft_order_intents (
  order_intent_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id               TEXT,
  smokecraft_session_id  TEXT,
  passport_session_id    TEXT,
  cigar_reference        TEXT,
  menu_item_reference    TEXT,
  quantity               INTEGER NOT NULL DEFAULT 1,
  modifiers_json         JSONB NOT NULL DEFAULT '[]',
  order_payload_json     JSONB NOT NULL DEFAULT '{}',
  order_source           TEXT NOT NULL DEFAULT 'smokecraft',
  order_type             TEXT NOT NULL DEFAULT 'cigar_request'
                           CHECK (order_type IN ('cigar_request', 'smokecraft_purchase_intent', 'pairing_request', 'staff_review')),
  order_status           TEXT NOT NULL DEFAULT 'pending_staff_review'
                           CHECK (order_status IN ('pending_staff_review', 'staff_acknowledged', 'sent_to_pos', 'cancelled', 'fulfilled')),
  backend_connected      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_smokecraft_order_intents_guest
  ON pos360_smokecraft_order_intents (guest_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pos360_smokecraft_order_intents_venue
  ON pos360_smokecraft_order_intents (venue_id, order_status, created_at DESC);

-- 2. Staff handoff requests
CREATE TABLE IF NOT EXISTS pos360_smokecraft_handoff_requests (
  handoff_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id               TEXT,
  smokecraft_session_id  TEXT,
  passport_session_id    TEXT,
  source                 TEXT NOT NULL DEFAULT 'smokecraft',
  target_system          TEXT NOT NULL DEFAULT 'pos360',
  handoff_payload_json   JSONB NOT NULL DEFAULT '{}',
  handoff_status         TEXT NOT NULL DEFAULT 'initiated'
                           CHECK (handoff_status IN ('initiated', 'pending_staff_action', 'acknowledged', 'completed', 'cancelled')),
  staff_action_required  BOOLEAN NOT NULL DEFAULT TRUE,
  backend_connected      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_smokecraft_handoff_venue
  ON pos360_smokecraft_handoff_requests (venue_id, handoff_status, created_at DESC);

-- 3. Menu item references (links SmokeCraft selections to POS360 menu items)
CREATE TABLE IF NOT EXISTS pos360_smokecraft_menu_item_refs (
  ref_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  smokecraft_session_id  TEXT,
  order_intent_id        UUID REFERENCES pos360_smokecraft_order_intents(order_intent_id) ON DELETE CASCADE,
  cigar_reference        TEXT,
  menu_item_reference    TEXT,
  pairing_reference      TEXT,
  quantity               INTEGER NOT NULL DEFAULT 1,
  modifiers_json         JSONB NOT NULL DEFAULT '[]',
  price_point_signal     TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_smokecraft_menu_ref_session
  ON pos360_smokecraft_menu_item_refs (smokecraft_session_id);

-- 4. Staff action records
CREATE TABLE IF NOT EXISTS pos360_smokecraft_staff_actions (
  action_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  order_intent_id        UUID,
  handoff_id             UUID,
  smokecraft_session_id  TEXT,
  staff_user_id          TEXT,
  action_type            TEXT NOT NULL,
  action_notes           TEXT,
  action_payload_json    JSONB NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_smokecraft_staff_actions_session
  ON pos360_smokecraft_staff_actions (smokecraft_session_id, created_at DESC);

-- 5. Order sync status (tracks state of order as it moves through POS360)
CREATE TABLE IF NOT EXISTS pos360_smokecraft_order_sync_status (
  sync_status_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  order_intent_id        UUID REFERENCES pos360_smokecraft_order_intents(order_intent_id) ON DELETE CASCADE,
  smokecraft_session_id  TEXT,
  sync_phase             TEXT NOT NULL DEFAULT 'intent_created',
  sync_status            TEXT NOT NULL DEFAULT 'pending'
                           CHECK (sync_status IN ('pending', 'ok', 'failed', 'fallback', 'cancelled')),
  backend_connected      BOOLEAN NOT NULL DEFAULT FALSE,
  sync_notes             TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_smokecraft_sync_status_intent
  ON pos360_smokecraft_order_sync_status (order_intent_id, created_at DESC);

-- 6. Order audit log
CREATE TABLE IF NOT EXISTS pos360_smokecraft_order_audit_log (
  audit_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              TEXT NOT NULL DEFAULT 'novee-default',
  venue_id               TEXT NOT NULL DEFAULT 'novee-grand-lounge',
  guest_id               TEXT,
  order_intent_id        UUID,
  handoff_id             UUID,
  smokecraft_session_id  TEXT,
  event_type             TEXT NOT NULL,
  sync_status            TEXT NOT NULL DEFAULT 'ok'
                           CHECK (sync_status IN ('ok', 'failed', 'fallback', 'skipped')),
  backend_connected      BOOLEAN NOT NULL DEFAULT FALSE,
  summary                TEXT,
  metadata_json          JSONB NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_smokecraft_audit_guest
  ON pos360_smokecraft_order_audit_log (guest_id, created_at DESC);
