-- ============================================================
-- Migration 016 — POS3 Commerce Foundation
--
-- Adds persistent commerce tables required for:
--   • Customer self-order + staff-assisted order tracking
--   • POS3 order/item/station-queue persistence
--   • Receipt + adjustment persistence
--   • Guest loyalty ledger
--   • Venue inventory management
--
-- Also extends venue_menu_items (from 015) with POS3-specific columns.
--
-- Safe to re-run (all IF NOT EXISTS / IF NOT EXIST guards).
-- ============================================================

BEGIN;

-- ── Extend venue_menu_items (added in 015) ───────────────────
-- Add POS3-specific columns if they don't already exist.
ALTER TABLE venue_menu_items
  ADD COLUMN IF NOT EXISTS sku                TEXT,
  ADD COLUMN IF NOT EXISTS destination_station TEXT
                             CHECK (destination_station IN ('kitchen','bar','humidor','retail','staff')),
  ADD COLUMN IF NOT EXISTS prep_time_minutes   INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS modifier_schema     JSONB   NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS display_category    TEXT;

CREATE INDEX IF NOT EXISTS idx_venue_menu_items_sku ON venue_menu_items(sku) WHERE sku IS NOT NULL;

-- ── venue_inventory ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_inventory (
  id                  BIGSERIAL    PRIMARY KEY,
  venue_id            TEXT         NOT NULL,
  sku                 TEXT         NOT NULL,
  item_name           TEXT         NOT NULL,
  category            TEXT         NOT NULL,
  quantity_on_hand    INTEGER      NOT NULL DEFAULT 0,
  par_level           INTEGER      NOT NULL DEFAULT 0,
  unit_cost_cents     INTEGER      NOT NULL DEFAULT 0,
  location            TEXT,
  status              TEXT         NOT NULL DEFAULT 'ok'
                        CHECK (status IN ('ok','low','out','inactive')),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_venue_inventory_venue ON venue_inventory(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_inventory_sku ON venue_inventory(venue_id, sku);

-- ── pos3_orders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_orders (
  id                  BIGSERIAL    PRIMARY KEY,
  order_id            TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id            TEXT         NOT NULL,
  guest_session_id    TEXT,
  table_id            TEXT,
  table_number        TEXT,
  staff_user_id       TEXT,
  source              TEXT         NOT NULL DEFAULT 'customer_self_order'
                        CHECK (source IN (
                          'customer_self_order',
                          'staff_assisted_order',
                          'waitress_handoff',
                          'smokecraft_pairing',
                          'pos_terminal'
                        )),
  status              TEXT         NOT NULL DEFAULT 'draft'
                        CHECK (status IN (
                          'draft',
                          'pending_staff_confirmation',
                          'submitted',
                          'routed',
                          'in_progress',
                          'ready',
                          'completed',
                          'cancelled'
                        )),
  subtotal_cents      INTEGER      NOT NULL DEFAULT 0,
  tax_cents           INTEGER      NOT NULL DEFAULT 0,
  service_fee_cents   INTEGER      NOT NULL DEFAULT 0,
  discount_cents      INTEGER      NOT NULL DEFAULT 0,
  total_cents         INTEGER      NOT NULL DEFAULT 0,
  payment_status      TEXT         NOT NULL DEFAULT 'unpaid'
                        CHECK (payment_status IN ('unpaid','pending','paid','refunded','voided')),
  notes               TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos3_orders_venue ON pos3_orders(venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos3_orders_guest ON pos3_orders(guest_session_id) WHERE guest_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pos3_orders_status ON pos3_orders(venue_id, status);

-- ── pos3_order_items ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_order_items (
  id                  BIGSERIAL    PRIMARY KEY,
  order_item_id       TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  order_id            TEXT         NOT NULL REFERENCES pos3_orders(order_id) ON DELETE CASCADE,
  menu_item_id        TEXT,
  sku                 TEXT,
  name                TEXT         NOT NULL,
  category            TEXT         NOT NULL,
  destination_station TEXT         NOT NULL DEFAULT 'staff'
                        CHECK (destination_station IN ('kitchen','bar','humidor','retail','staff')),
  quantity            INTEGER      NOT NULL DEFAULT 1,
  unit_price_cents    INTEGER      NOT NULL DEFAULT 0,
  modifiers           JSONB        NOT NULL DEFAULT '[]',
  notes               TEXT,
  status              TEXT         NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_progress','ready','delivered','voided','comped')),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos3_order_items_order ON pos3_order_items(order_id);

-- ── pos3_station_queue ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_station_queue (
  id                  BIGSERIAL    PRIMARY KEY,
  queue_id            TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id            TEXT         NOT NULL,
  order_id            TEXT         NOT NULL,
  order_item_id       TEXT,
  station             TEXT         NOT NULL
                        CHECK (station IN ('kitchen','bar','humidor','retail','staff')),
  status              TEXT         NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued','started','ready','completed','cancelled')),
  priority            INTEGER      NOT NULL DEFAULT 5,
  item_name           TEXT,
  table_number        TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  started_at          TIMESTAMPTZ,
  ready_at            TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pos3_station_queue_venue ON pos3_station_queue(venue_id, station, status, created_at);
CREATE INDEX IF NOT EXISTS idx_pos3_station_queue_order ON pos3_station_queue(order_id);

-- ── pos3_receipts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_receipts (
  id                  BIGSERIAL    PRIMARY KEY,
  receipt_id          TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  order_id            TEXT         NOT NULL,
  venue_id            TEXT         NOT NULL,
  receipt_number      TEXT         NOT NULL UNIQUE,
  payment_method      TEXT         NOT NULL DEFAULT 'cash',
  subtotal_cents      INTEGER      NOT NULL DEFAULT 0,
  tax_cents           INTEGER      NOT NULL DEFAULT 0,
  service_fee_cents   INTEGER      NOT NULL DEFAULT 0,
  tip_cents           INTEGER      NOT NULL DEFAULT 0,
  total_cents         INTEGER      NOT NULL DEFAULT 0,
  receipt_payload     JSONB        NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos3_receipts_order ON pos3_receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_pos3_receipts_venue ON pos3_receipts(venue_id, created_at DESC);

-- ── pos3_adjustments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_adjustments (
  id                      BIGSERIAL    PRIMARY KEY,
  adjustment_id           TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  order_id                TEXT         NOT NULL,
  order_item_id           TEXT,
  adjustment_type         TEXT         NOT NULL
                            CHECK (adjustment_type IN ('void','comp','refund','discount')),
  amount_cents            INTEGER      NOT NULL DEFAULT 0,
  reason                  TEXT,
  requested_by_user_id    TEXT,
  approved_by_user_id     TEXT,
  status                  TEXT         NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','denied','applied')),
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos3_adjustments_order ON pos3_adjustments(order_id);

-- ── guest_loyalty_ledger ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS guest_loyalty_ledger (
  id                  BIGSERIAL    PRIMARY KEY,
  ledger_id           TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  guest_session_id    TEXT         NOT NULL,
  order_id            TEXT,
  event_type          TEXT         NOT NULL,
  points_delta        INTEGER      NOT NULL DEFAULT 0,
  balance_after       INTEGER      NOT NULL DEFAULT 0,
  metadata            JSONB        NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_loyalty_session ON guest_loyalty_ledger(guest_session_id, created_at DESC);

-- ── guest_scores ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guest_scores (
  id                  BIGSERIAL    PRIMARY KEY,
  guest_session_id    TEXT         NOT NULL UNIQUE,
  skill_score         INTEGER      NOT NULL DEFAULT 0,
  challenge_score     INTEGER      NOT NULL DEFAULT 0,
  loyalty_points      INTEGER      NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMIT;
