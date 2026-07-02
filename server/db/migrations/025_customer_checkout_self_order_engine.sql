-- Migration 025: Customer Checkout and Self-Order Engine
-- Preview-only. Does not claim live payment, POS sync, KDS notification,
-- inventory reservation, or tax collection.

CREATE TABLE IF NOT EXISTS customer_checkout_carts (
  cart_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id             UUID NOT NULL,
  customer_id          UUID,
  session_id           TEXT,
  cart_status          TEXT NOT NULL DEFAULT 'cart_preview',
  order_mode           TEXT NOT NULL DEFAULT 'self_order_preview',
  order_type           TEXT NOT NULL DEFAULT 'venue_order',
  subtotal_amount      INTEGER NOT NULL DEFAULT 0,
  fee_amount           INTEGER NOT NULL DEFAULT 0,
  tax_amount           INTEGER NOT NULL DEFAULT 0,
  total_amount         INTEGER NOT NULL DEFAULT 0,
  currency             TEXT NOT NULL DEFAULT 'usd',
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_checkout_cart_items (
  cart_item_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id              UUID NOT NULL REFERENCES customer_checkout_carts(cart_id) ON DELETE CASCADE,
  venue_id             UUID NOT NULL,
  partner_id           UUID,
  product_id           UUID,
  item_name            TEXT NOT NULL,
  item_category        TEXT NOT NULL DEFAULT 'general',
  quantity             INTEGER NOT NULL DEFAULT 1,
  unit_amount          INTEGER NOT NULL DEFAULT 0,
  line_subtotal_amount INTEGER NOT NULL DEFAULT 0,
  tax_category         TEXT,
  fulfillment_owner    TEXT NOT NULL DEFAULT 'venue',
  availability_status  TEXT NOT NULL DEFAULT 'availability_required',
  approval_status      TEXT NOT NULL DEFAULT 'approval_required',
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_checkout_sessions (
  checkout_session_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id              UUID NOT NULL REFERENCES customer_checkout_carts(cart_id) ON DELETE CASCADE,
  venue_id             UUID NOT NULL,
  customer_id          UUID,
  session_status       TEXT NOT NULL DEFAULT 'checkout_preview',
  payment_status       TEXT NOT NULL DEFAULT 'payment_confirmation_required',
  tax_status           TEXT NOT NULL DEFAULT 'tax_preview_required',
  order_status         TEXT NOT NULL DEFAULT 'order_submission_preview',
  pos_status           TEXT NOT NULL DEFAULT 'pos_sync_pending',
  kds_status           TEXT NOT NULL DEFAULT 'kds_routing_pending',
  inventory_status     TEXT NOT NULL DEFAULT 'inventory_unavailable',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_checkout_order_previews (
  preview_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id              UUID NOT NULL REFERENCES customer_checkout_carts(cart_id) ON DELETE CASCADE,
  venue_id             UUID NOT NULL,
  order_id             UUID,
  preview_status       TEXT NOT NULL DEFAULT 'order_lifecycle_preview',
  order_snapshot       JSONB NOT NULL DEFAULT '{}',
  tax_snapshot         JSONB NOT NULL DEFAULT '{}',
  payment_snapshot     JSONB NOT NULL DEFAULT '{}',
  kds_snapshot         JSONB NOT NULL DEFAULT '{}',
  pos_snapshot         JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_checkout_receipt_previews (
  receipt_preview_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id              UUID NOT NULL REFERENCES customer_checkout_carts(cart_id) ON DELETE CASCADE,
  venue_id             UUID NOT NULL,
  order_id             UUID,
  receipt_status       TEXT NOT NULL DEFAULT 'receipt_preview',
  subtotal_amount      INTEGER NOT NULL DEFAULT 0,
  fee_amount           INTEGER NOT NULL DEFAULT 0,
  tax_amount           INTEGER NOT NULL DEFAULT 0,
  total_amount         INTEGER NOT NULL DEFAULT 0,
  payment_status       TEXT NOT NULL DEFAULT 'payment_confirmation_required',
  tax_status           TEXT NOT NULL DEFAULT 'tax_preview_required',
  order_status         TEXT NOT NULL DEFAULT 'order_submission_preview',
  receipt_snapshot     JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_checkout_status_events (
  event_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id              UUID,
  checkout_session_id  UUID,
  order_id             UUID,
  from_status          TEXT,
  to_status            TEXT NOT NULL,
  event_status         TEXT NOT NULL DEFAULT 'status_preview',
  actor_id             UUID,
  actor_role           TEXT NOT NULL DEFAULT 'system',
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_checkout_staff_handoffs (
  handoff_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id              UUID NOT NULL REFERENCES customer_checkout_carts(cart_id) ON DELETE CASCADE,
  venue_id             UUID NOT NULL,
  staff_id             UUID,
  handoff_status       TEXT NOT NULL DEFAULT 'staff_handoff_preview',
  handoff_reason       TEXT,
  staff_action_required BOOLEAN NOT NULL DEFAULT TRUE,
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_checkout_audit_logs (
  log_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id             UUID,
  actor_role           TEXT NOT NULL DEFAULT 'system',
  cart_id              UUID,
  checkout_session_id  UUID,
  entity_type          TEXT NOT NULL,
  entity_id            TEXT NOT NULL,
  action               TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'audit_logged',
  details              JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
