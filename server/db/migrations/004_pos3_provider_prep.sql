-- ============================================================
-- Migration 004 — POS 3 Provider Integration Prep
-- Applied: Phase 9
-- Does NOT modify Phase 7, 8, or 8.5 tables.
-- ============================================================

BEGIN;

-- ── pos3_provider_connections ─────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_provider_connections (
  id               BIGSERIAL PRIMARY KEY,
  provider_key     TEXT        NOT NULL,
  provider_name    TEXT        NOT NULL,
  venue_id         TEXT        NOT NULL,
  location_id      TEXT,
  status           TEXT        NOT NULL DEFAULT 'not_configured'
                     CHECK (status IN ('active','not_configured','error','disabled')),
  mode             TEXT        NOT NULL DEFAULT 'prototype'
                     CHECK (mode IN ('prototype','live','sandbox')),
  credentials_ref  TEXT,
  last_sync_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── pos3_provider_events ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_provider_events (
  id           BIGSERIAL PRIMARY KEY,
  provider_key TEXT        NOT NULL,
  event_type   TEXT        NOT NULL,
  external_id  TEXT,
  session_id   TEXT,
  payload      JSONB,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status       TEXT        NOT NULL DEFAULT 'received'
                 CHECK (status IN ('received','processed','failed','ignored'))
);

-- ── pos3_normalized_orders ────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_normalized_orders (
  id                 BIGSERIAL PRIMARY KEY,
  provider           TEXT        NOT NULL,
  provider_order_id  TEXT        NOT NULL,
  venue_id           TEXT,
  location_id        TEXT,
  table_number       TEXT,
  seat_number        TEXT,
  staff_id           TEXT,
  staff_name         TEXT,
  guest_session_id   TEXT,
  status             TEXT        NOT NULL DEFAULT 'open',
  items              JSONB,
  subtotal           NUMERIC(10,2),
  tax                NUMERIC(10,2),
  total              NUMERIC(10,2),
  currency           TEXT        NOT NULL DEFAULT 'USD',
  opened_at          TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_order_id)
);

-- ── pos3_normalized_inventory ─────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_normalized_inventory (
  id                   BIGSERIAL PRIMARY KEY,
  provider             TEXT        NOT NULL,
  provider_item_id     TEXT        NOT NULL,
  name                 TEXT        NOT NULL,
  category             TEXT,
  subcategory          TEXT,
  current_stock        INTEGER     NOT NULL DEFAULT 0,
  low_stock_threshold  INTEGER     NOT NULL DEFAULT 5,
  reorder_recommended  BOOLEAN     NOT NULL DEFAULT FALSE,
  location_id          TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_item_id)
);

-- ── pos3_recommendations ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_recommendations (
  id                   BIGSERIAL PRIMARY KEY,
  session_id           TEXT,
  provider             TEXT,
  provider_order_id    TEXT,
  recommendation_type  TEXT        NOT NULL
                         CHECK (recommendation_type IN ('pairing','upsell','inventory_alert','featured')),
  title                TEXT        NOT NULL,
  description          TEXT,
  items                JSONB,
  confidence_score     NUMERIC(4,3),
  sent_to_staff        BOOLEAN     NOT NULL DEFAULT FALSE,
  accepted             BOOLEAN,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── pos3_table_mapping ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_table_mapping (
  id                 BIGSERIAL PRIMARY KEY,
  venue_id           TEXT        NOT NULL,
  provider           TEXT        NOT NULL,
  table_id           TEXT        NOT NULL,
  table_number       TEXT,
  zone               TEXT,
  seats              INTEGER,
  assigned_staff_id  TEXT,
  active_order_id    TEXT,
  status             TEXT        NOT NULL DEFAULT 'available'
                       CHECK (status IN ('available','occupied','reserved','closed')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, table_id, venue_id)
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pos3_connections_key      ON pos3_provider_connections(provider_key);
CREATE INDEX IF NOT EXISTS idx_pos3_events_key           ON pos3_provider_events(provider_key);
CREATE INDEX IF NOT EXISTS idx_pos3_events_received      ON pos3_provider_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos3_orders_provider      ON pos3_normalized_orders(provider, provider_order_id);
CREATE INDEX IF NOT EXISTS idx_pos3_orders_session       ON pos3_normalized_orders(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_pos3_orders_status        ON pos3_normalized_orders(status);
CREATE INDEX IF NOT EXISTS idx_pos3_inventory_provider   ON pos3_normalized_inventory(provider, provider_item_id);
CREATE INDEX IF NOT EXISTS idx_pos3_inventory_reorder    ON pos3_normalized_inventory(reorder_recommended) WHERE reorder_recommended = TRUE;
CREATE INDEX IF NOT EXISTS idx_pos3_recs_session         ON pos3_recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_pos3_recs_type            ON pos3_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_pos3_tables_provider      ON pos3_table_mapping(provider, venue_id);

COMMIT;
