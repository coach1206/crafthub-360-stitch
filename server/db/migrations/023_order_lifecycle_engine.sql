-- Migration 023: Order Lifecycle Engine
-- Phase 8 — tracks every order through a safe, auditable state machine.
-- All statuses are preview-safe; no live payment capture or POS sync is claimed.

-- 1. order_lifecycle_orders
CREATE TABLE IF NOT EXISTS order_lifecycle_orders (
  order_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id           TEXT NOT NULL,
  customer_id        TEXT,
  order_source       TEXT NOT NULL DEFAULT 'smokecraft',
  order_type         TEXT NOT NULL DEFAULT 'venue_order',
  lifecycle_status   TEXT NOT NULL DEFAULT 'order_draft',
  payment_status     TEXT NOT NULL DEFAULT 'payment_confirmation_required',
  tax_status         TEXT NOT NULL DEFAULT 'tax_preview_required',
  pos_status         TEXT NOT NULL DEFAULT 'pos_sync_pending',
  kds_status         TEXT NOT NULL DEFAULT 'kds_routing_pending',
  fulfillment_status TEXT NOT NULL DEFAULT 'fulfillment_pending',
  subtotal_amount    INTEGER NOT NULL DEFAULT 0,
  fee_amount         INTEGER NOT NULL DEFAULT 0,
  tax_amount         INTEGER NOT NULL DEFAULT 0,
  total_amount       INTEGER NOT NULL DEFAULT 0,
  currency           TEXT NOT NULL DEFAULT 'usd',
  metadata           JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. order_lifecycle_line_items
CREATE TABLE IF NOT EXISTS order_lifecycle_line_items (
  line_item_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID NOT NULL REFERENCES order_lifecycle_orders(order_id),
  venue_id           TEXT NOT NULL,
  partner_id         TEXT,
  product_id         TEXT,
  item_name          TEXT NOT NULL,
  item_category      TEXT NOT NULL DEFAULT 'general',
  quantity           INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_amount        INTEGER NOT NULL DEFAULT 0 CHECK (unit_amount >= 0),
  line_subtotal_amount INTEGER NOT NULL DEFAULT 0,
  tax_category       TEXT NOT NULL DEFAULT 'general',
  fulfillment_owner  TEXT NOT NULL DEFAULT 'venue',
  line_status        TEXT NOT NULL DEFAULT 'line_item_pending',
  metadata           JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. order_lifecycle_status_events
CREATE TABLE IF NOT EXISTS order_lifecycle_status_events (
  event_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID NOT NULL REFERENCES order_lifecycle_orders(order_id),
  from_status        TEXT,
  to_status          TEXT NOT NULL,
  transition_status  TEXT NOT NULL DEFAULT 'transition_logged',
  actor_id           TEXT,
  actor_role         TEXT,
  reason             TEXT,
  metadata           JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. order_lifecycle_payment_links
CREATE TABLE IF NOT EXISTS order_lifecycle_payment_links (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES order_lifecycle_orders(order_id),
  payment_intent_id   TEXT,
  settlement_ledger_id TEXT,
  payment_status      TEXT NOT NULL DEFAULT 'payment_confirmation_required',
  payment_mode        TEXT NOT NULL DEFAULT 'payment_preview',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. order_lifecycle_tax_links
CREATE TABLE IF NOT EXISTS order_lifecycle_tax_links (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES order_lifecycle_orders(order_id),
  tax_calculation_id  TEXT,
  tax_status          TEXT NOT NULL DEFAULT 'tax_preview_required',
  tax_mode            TEXT NOT NULL DEFAULT 'tax_preview',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. order_lifecycle_partner_fulfillment
CREATE TABLE IF NOT EXISTS order_lifecycle_partner_fulfillment (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES order_lifecycle_orders(order_id),
  partner_id          TEXT NOT NULL,
  venue_id            TEXT NOT NULL,
  fulfillment_status  TEXT NOT NULL DEFAULT 'partner_fulfillment_pending',
  approval_status     TEXT NOT NULL DEFAULT 'venue_approval_required',
  availability_status TEXT NOT NULL DEFAULT 'availability_required',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. order_lifecycle_pos_routing
CREATE TABLE IF NOT EXISTS order_lifecycle_pos_routing (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES order_lifecycle_orders(order_id),
  venue_id            TEXT NOT NULL,
  provider_name       TEXT,
  routing_status      TEXT NOT NULL DEFAULT 'pos_sync_pending',
  routing_mode        TEXT NOT NULL DEFAULT 'routing_preview',
  idempotency_key     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. order_lifecycle_kds_routing
CREATE TABLE IF NOT EXISTS order_lifecycle_kds_routing (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES order_lifecycle_orders(order_id),
  venue_id            TEXT NOT NULL,
  station_name        TEXT,
  routing_status      TEXT NOT NULL DEFAULT 'kds_routing_pending',
  routing_mode        TEXT NOT NULL DEFAULT 'routing_preview',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. order_lifecycle_refund_links
CREATE TABLE IF NOT EXISTS order_lifecycle_refund_links (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES order_lifecycle_orders(order_id),
  refund_id           TEXT,
  refund_status       TEXT NOT NULL DEFAULT 'refund_pending',
  refund_mode         TEXT NOT NULL DEFAULT 'refund_preview',
  refund_amount       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. order_lifecycle_audit_logs
CREATE TABLE IF NOT EXISTS order_lifecycle_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    TEXT,
  actor_role  TEXT,
  order_id    UUID,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  action      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'audit_logged',
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
