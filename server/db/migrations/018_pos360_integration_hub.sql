-- ============================================================
-- Migration 018 — POS360 Integration Hub
-- Phase: 10 — POS Platform Layer
--
-- New tables:
--   pos_provider_connections     — per-venue POS provider credentials/status
--   pos_location_mappings        — venue ↔ provider location mapping
--   pos_menu_item_mappings       — SmokeCraft item ↔ provider item mapping
--   pos_inventory_sync_logs      — inventory sync audit trail
--   pos_order_sync_logs          — order sync audit trail
--   pos_webhook_events           — incoming provider webhook events
--   pos360_manual_orders         — local manual tickets (no POS required)
--   pos360_audit_logs            — immutable audit log for all POS360 actions
--   pos360_idempotency_keys      — duplicate order/sync protection
--
-- Safe to run multiple times (all CREATE TABLE IF NOT EXISTS).
-- ============================================================

BEGIN;

-- ── pos_provider_connections ──────────────────────────────────────────────────
-- Stores per-venue POS provider connection state.
-- Tokens stored encrypted (AES-256-CBC via server/utils/encryption.js).
-- Raw tokens NEVER stored in plaintext.
CREATE TABLE IF NOT EXISTS pos_provider_connections (
  id                       BIGSERIAL     PRIMARY KEY,
  connection_id            TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                 TEXT          NOT NULL,
  provider_name            TEXT          NOT NULL,
    -- square | toast | clover | lightspeed | shopify_pos | manual_pos360 | future_provider
  provider_account_id      TEXT,
  location_id              TEXT,
  merchant_id              TEXT,
  access_token_encrypted   TEXT,          -- AES-256-CBC encrypted; never plaintext
  refresh_token_encrypted  TEXT,          -- AES-256-CBC encrypted; never plaintext
  token_expires_at         TIMESTAMPTZ,
  scopes_json              JSONB,
  connection_status        TEXT          NOT NULL DEFAULT 'provider_not_connected',
    -- provider_not_connected | oauth_required | credentials_missing
    -- encryption_key_required | connected_pending_sync | sync_required
    -- disconnected | error | manual_mode
  readiness_status         TEXT          NOT NULL DEFAULT 'provider_not_connected',
  last_sync_at             TIMESTAMPTZ,
  last_error               TEXT,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by               TEXT,
  updated_by               TEXT,
  UNIQUE (venue_id, provider_name)
);

CREATE INDEX IF NOT EXISTS idx_ppc_venue           ON pos_provider_connections (venue_id);
CREATE INDEX IF NOT EXISTS idx_ppc_provider        ON pos_provider_connections (provider_name);
CREATE INDEX IF NOT EXISTS idx_ppc_status          ON pos_provider_connections (connection_status);

-- ── pos_location_mappings ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_location_mappings (
  id                       BIGSERIAL     PRIMARY KEY,
  mapping_id               TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                 TEXT          NOT NULL,
  provider_name            TEXT          NOT NULL,
  provider_location_id     TEXT,
  provider_location_name   TEXT,
  internal_location_id     TEXT,
  location_type            TEXT,         -- main | bar | humidor | kitchen | partner
  status                   TEXT          NOT NULL DEFAULT 'mapping_required',
    -- mapping_required | mapped | mismatch | inactive
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, provider_name, provider_location_id)
);

-- ── pos_menu_item_mappings ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_menu_item_mappings (
  id                       BIGSERIAL     PRIMARY KEY,
  mapping_id               TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                 TEXT          NOT NULL,
  provider_name            TEXT          NOT NULL,
  smokecraft_item_id       TEXT          NOT NULL,
  smokecraft_item_name     TEXT,
  pos_item_id              TEXT,          -- provider's item ID (must not be guessed)
  pos_variation_id         TEXT,
  pos_item_name            TEXT,
  pos_category_id          TEXT,
  partner_id               TEXT,
  item_type                TEXT,          -- cigar | drink | food | partner_food | bundle
  mapping_status           TEXT          NOT NULL DEFAULT 'mapping_required',
    -- mapping_required | mapped | mismatch | inactive
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by               TEXT,
  updated_by               TEXT,
  UNIQUE (venue_id, provider_name, smokecraft_item_id)
);

CREATE INDEX IF NOT EXISTS idx_pmim_venue_provider ON pos_menu_item_mappings (venue_id, provider_name);
CREATE INDEX IF NOT EXISTS idx_pmim_status         ON pos_menu_item_mappings (mapping_status);

-- ── pos_inventory_sync_logs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_inventory_sync_logs (
  id                       BIGSERIAL     PRIMARY KEY,
  log_id                   TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                 TEXT          NOT NULL,
  provider_name            TEXT          NOT NULL,
  sync_type                TEXT,          -- full | delta | single_item
  sync_status              TEXT          NOT NULL DEFAULT 'preview_inventory',
    -- preview_inventory | sync_required | connected_pending_sync
    -- synced_from_provider | failed | provider_not_connected
    -- NOTE: synced_from_provider only when real provider API call succeeds
  items_requested          INTEGER       NOT NULL DEFAULT 0,
  items_updated            INTEGER       NOT NULL DEFAULT 0,
  items_failed             INTEGER       NOT NULL DEFAULT 0,
  error_json               JSONB,
  started_at               TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pisl_venue_provider ON pos_inventory_sync_logs (venue_id, provider_name);
CREATE INDEX IF NOT EXISTS idx_pisl_status         ON pos_inventory_sync_logs (sync_status);
CREATE INDEX IF NOT EXISTS idx_pisl_created        ON pos_inventory_sync_logs (created_at DESC);

-- ── pos_order_sync_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_order_sync_logs (
  id                       BIGSERIAL     PRIMARY KEY,
  log_id                   TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                 TEXT          NOT NULL,
  provider_name            TEXT          NOT NULL,
  smokecraft_order_id      TEXT,
  provider_order_id        TEXT,          -- null until provider confirms
  idempotency_key          TEXT          NOT NULL,
  order_payload_json       JSONB,
  provider_response_json   JSONB,
  sync_status              TEXT          NOT NULL DEFAULT 'order_sync_pending',
    -- order_sync_pending | mapping_required | provider_not_connected
    -- pushed_to_provider | failed | manual_mode | idempotency_conflict
    -- NOTE: pushed_to_provider only when real provider API call succeeds
  error_json               JSONB,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posl_venue_provider ON pos_order_sync_logs (venue_id, provider_name);
CREATE INDEX IF NOT EXISTS idx_posl_order          ON pos_order_sync_logs (smokecraft_order_id);
CREATE INDEX IF NOT EXISTS idx_posl_idempotency    ON pos_order_sync_logs (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_posl_status         ON pos_order_sync_logs (sync_status);

-- ── pos_webhook_events ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_webhook_events (
  id                       BIGSERIAL     PRIMARY KEY,
  event_id                 TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  provider_name            TEXT          NOT NULL,
  venue_id                 TEXT,
  provider_event_id        TEXT,          -- provider's own event ID (for dedup)
  event_type               TEXT,
  payload_json             JSONB,
  signature_verified       BOOLEAN       NOT NULL DEFAULT FALSE,
  processing_status        TEXT          NOT NULL DEFAULT 'webhook_pending',
    -- webhook_pending | processed | ignored | failed | provider_not_connected
  received_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  processed_at             TIMESTAMPTZ,
  error_json               JSONB,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pwe_provider        ON pos_webhook_events (provider_name);
CREATE INDEX IF NOT EXISTS idx_pwe_status          ON pos_webhook_events (processing_status);
CREATE INDEX IF NOT EXISTS idx_pwe_provider_event  ON pos_webhook_events (provider_name, provider_event_id);
CREATE INDEX IF NOT EXISTS idx_pwe_received        ON pos_webhook_events (received_at DESC);

-- ── pos360_manual_orders ──────────────────────────────────────────────────────
-- For venues without a supported POS provider.
CREATE TABLE IF NOT EXISTS pos360_manual_orders (
  id                       BIGSERIAL     PRIMARY KEY,
  manual_order_id          TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                 TEXT          NOT NULL,
  smokecraft_order_id      TEXT,
  manual_order_status      TEXT          NOT NULL DEFAULT 'manual_mode',
    -- manual_mode | route_pending | staff_acknowledged | fulfilled | cancelled
  assigned_staff_role      TEXT,
  assigned_staff_id        TEXT,
  printed_ticket_json      JSONB,
  routing_station          TEXT,          -- bar | humidor | kitchen | partner | server_pickup
  customer_visible_status  TEXT,          -- pending | preparing | ready
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pmo_venue           ON pos360_manual_orders (venue_id);
CREATE INDEX IF NOT EXISTS idx_pmo_status          ON pos360_manual_orders (manual_order_status);

-- ── pos360_audit_logs ─────────────────────────────────────────────────────────
-- Immutable. Never delete. Append only.
CREATE TABLE IF NOT EXISTS pos360_audit_logs (
  id                       BIGSERIAL     PRIMARY KEY,
  audit_id                 TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                 TEXT,
  actor_id                 TEXT,
  actor_role               TEXT,
  action_type              TEXT          NOT NULL,
  target_type              TEXT,
  target_id                TEXT,
  provider_name            TEXT,
  request_json             JSONB,         -- sensitive fields must be masked before insert
  response_json            JSONB,         -- tokens must be masked before insert
  status                   TEXT          NOT NULL DEFAULT 'audit_logged',
    -- audit_logged | preview_fallback | provider_not_connected | failed
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pal_venue           ON pos360_audit_logs (venue_id);
CREATE INDEX IF NOT EXISTS idx_pal_action          ON pos360_audit_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_pal_created         ON pos360_audit_logs (created_at DESC);

-- ── pos360_idempotency_keys ───────────────────────────────────────────────────
-- Prevents duplicate order pushes, checkout attempts, inventory syncs.
CREATE TABLE IF NOT EXISTS pos360_idempotency_keys (
  id                       BIGSERIAL     PRIMARY KEY,
  idempotency_id           TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id                 TEXT          NOT NULL,
  idempotency_key          TEXT          NOT NULL,
  request_hash             TEXT,
  response_json            JSONB,
  status                   TEXT          NOT NULL DEFAULT 'pending',
    -- pending | used | expired | idempotency_conflict
  expires_at               TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_pik_venue_key       ON pos360_idempotency_keys (venue_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_pik_expires         ON pos360_idempotency_keys (expires_at);

COMMIT;
