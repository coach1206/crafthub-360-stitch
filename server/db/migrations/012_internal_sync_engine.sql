-- ============================================================
-- Migration 012 — Internal Sync Engine (Phase 6B)
-- Backend event store for multi-device POS3/E.A.T./SmokeCraft/Passport sync.
-- Does NOT modify or duplicate venue_devices (migration 006) — extends it.
-- Does NOT touch pos3_provider_* tables (migration 004/005, third-party bridge).
-- ============================================================

BEGIN;

-- ── sync_events — append-only event log, source of truth for ordering/audit ──
CREATE TABLE IF NOT EXISTS sync_events (
  event_id          UUID        PRIMARY KEY,
  source_device_id  TEXT        NOT NULL,
  source_system     TEXT        NOT NULL
                       CHECK (source_system IN ('POS3','EAT','KITCHEN','BAR','HUMIDOR','INVENTORY','SMOKECRAFT','PASSPORT')),
  event_type        TEXT        NOT NULL,
  entity_id         TEXT,
  payload           JSONB       NOT NULL DEFAULT '{}'::jsonb,
  sync_status       TEXT        NOT NULL DEFAULT 'synced'
                       CHECK (sync_status IN ('pending','syncing','synced','failed')),
  client_created_at TIMESTAMPTZ NOT NULL,
  received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempt_count     INTEGER     NOT NULL DEFAULT 1,
  created_by_user_id TEXT,
  created_by_role     TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_events_entity      ON sync_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_type        ON sync_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sync_events_created     ON sync_events(client_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_events_received    ON sync_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_events_source_sys  ON sync_events(source_system);

-- ── sync_failures — conflicts / rejected events, never silently dropped ──────
CREATE TABLE IF NOT EXISTS sync_failures (
  id               BIGSERIAL PRIMARY KEY,
  event_id         UUID,
  source_device_id TEXT,
  reason           TEXT        NOT NULL,
  payload          JSONB,
  occurred_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sync_failures_event    ON sync_failures(event_id);
CREATE INDEX IF NOT EXISTS idx_sync_failures_resolved ON sync_failures(resolved) WHERE resolved = FALSE;

-- ── pos_orders / pos_order_items / pos_order_events — materialized POS3 state ─
CREATE TABLE IF NOT EXISTS pos_orders (
  order_id     TEXT PRIMARY KEY,
  venue_id     TEXT        NOT NULL DEFAULT 'novee-grand-lounge',
  table_id     TEXT,
  staff_id     TEXT,
  status       TEXT        NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','sent','held','closed','cancelled')),
  opened_at    TIMESTAMPTZ NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL,
  closed_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pos_order_items (
  id         BIGSERIAL PRIMARY KEY,
  order_id   TEXT        NOT NULL REFERENCES pos_orders(order_id) ON DELETE CASCADE,
  item_id    TEXT        NOT NULL,
  name       TEXT,
  qty        INTEGER     NOT NULL DEFAULT 1,
  price      NUMERIC(10,2),
  status     TEXT        NOT NULL DEFAULT 'ordered',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_order ON pos_order_items(order_id);

CREATE TABLE IF NOT EXISTS pos_order_events (
  id         BIGSERIAL PRIMARY KEY,
  order_id   TEXT        NOT NULL REFERENCES pos_orders(order_id) ON DELETE CASCADE,
  event_id   UUID        NOT NULL REFERENCES sync_events(event_id),
  event_type TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_order_events_order ON pos_order_events(order_id);

-- ── Station queues — materialized current state, replayable from sync_events ─
CREATE TABLE IF NOT EXISTS kitchen_queue (
  id          BIGSERIAL PRIMARY KEY,
  order_id    TEXT        NOT NULL,
  item_id     TEXT,
  status      TEXT        NOT NULL DEFAULT 'queued'
                 CHECK (status IN ('queued','accepted','completed','cancelled')),
  accepted_by TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, item_id)
);

CREATE TABLE IF NOT EXISTS bar_queue (
  id          BIGSERIAL PRIMARY KEY,
  order_id    TEXT        NOT NULL,
  item_id     TEXT,
  status      TEXT        NOT NULL DEFAULT 'queued'
                 CHECK (status IN ('queued','accepted','completed','cancelled')),
  accepted_by TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, item_id)
);

CREATE TABLE IF NOT EXISTS humidor_queue (
  id          BIGSERIAL PRIMARY KEY,
  order_id    TEXT        NOT NULL,
  item_id     TEXT,
  status      TEXT        NOT NULL DEFAULT 'queued'
                 CHECK (status IN ('queued','accepted','completed','cancelled')),
  accepted_by TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_kitchen_queue_status ON kitchen_queue(status);
CREATE INDEX IF NOT EXISTS idx_bar_queue_status     ON bar_queue(status);
CREATE INDEX IF NOT EXISTS idx_humidor_queue_status ON humidor_queue(status);

-- ── inventory_events / passport_events / smokecraft_events — append logs ────
CREATE TABLE IF NOT EXISTS inventory_events (
  id         BIGSERIAL PRIMARY KEY,
  event_id   UUID        NOT NULL REFERENCES sync_events(event_id),
  sku        TEXT        NOT NULL,
  delta      INTEGER     NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS passport_events (
  id          BIGSERIAL PRIMARY KEY,
  event_id    UUID        NOT NULL REFERENCES sync_events(event_id),
  passport_id TEXT        NOT NULL,
  event_type  TEXT        NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smokecraft_events (
  id          BIGSERIAL PRIMARY KEY,
  event_id    UUID        NOT NULL REFERENCES sync_events(event_id),
  session_id  TEXT        NOT NULL,
  event_type  TEXT        NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_events_sku       ON inventory_events(sku);
CREATE INDEX IF NOT EXISTS idx_passport_events_passport   ON passport_events(passport_id);
CREATE INDEX IF NOT EXISTS idx_smokecraft_events_session  ON smokecraft_events(session_id);

-- ── Device registry — REUSE venue_devices (migration 006), do not duplicate ──
ALTER TABLE venue_devices ADD COLUMN IF NOT EXISTS sync_version INTEGER NOT NULL DEFAULT 0;

COMMIT;
