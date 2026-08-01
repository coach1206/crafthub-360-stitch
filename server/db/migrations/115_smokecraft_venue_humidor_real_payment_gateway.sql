-- Venue Humidor Real Payment Gateway Integration — Production Package
-- 2 of 7. Additive only. Extends venue_cigar_orders (106/108) rather
-- than creating a second order/payment ledger. Canonical payment
-- state is tracked separately from order.status/payment_status
-- (which remain the staff/POS-confirmation fields from 108) via the
-- new venue_cigar_payment_intents table — this is the ONLY table that
-- owns real-provider payment state. Inventory mutation continues to
-- go through inventoryService.applyInventoryEvent() exclusively; this
-- migration adds no second inventory ledger.

-- ── Canonical payment-intent record — one row per real provider
-- PaymentIntent (or, if the order is retried, one row per attempt,
-- all linked to the same order). This is the single source of truth
-- for real-money payment state, distinct from venue_cigar_orders
-- .payment_status (which reflects staff/POS confirmation workflow,
-- unrelated to whether a card was actually charged).
CREATE TABLE IF NOT EXISTS venue_cigar_payment_intents (
  id                      BIGSERIAL PRIMARY KEY,
  payment_intent_id       UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  order_id                UUID NOT NULL REFERENCES venue_cigar_orders(order_id) ON DELETE CASCADE,
  venue_id                TEXT NOT NULL,
  customer_reference      TEXT NOT NULL,
  provider                TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe')),
  provider_mode           TEXT NOT NULL CHECK (provider_mode IN ('live', 'test', 'mocked_adapter_boundary')),
  provider_customer_id    TEXT,
  provider_payment_intent_id TEXT UNIQUE,
  provider_client_secret_issued BOOLEAN NOT NULL DEFAULT false,
  currency                TEXT NOT NULL DEFAULT 'USD',
  amount_authorized_cents INTEGER NOT NULL CHECK (amount_authorized_cents >= 0),
  amount_captured_cents   INTEGER NOT NULL DEFAULT 0 CHECK (amount_captured_cents >= 0),
  amount_refunded_cents   INTEGER NOT NULL DEFAULT 0 CHECK (amount_refunded_cents >= 0),
  -- Canonical payment state machine (mandate section 4) — deliberately
  -- separate from venue_cigar_orders.status/payment_status.
  payment_state           TEXT NOT NULL DEFAULT 'not_started' CHECK (payment_state IN (
    'not_started','payment_pending','requires_customer_action','processing',
    'paid','failed','canceled','partially_refunded','refunded','disputed','expired'
  )),
  failure_code             TEXT,
  failure_message          TEXT,
  idempotency_key           TEXT NOT NULL UNIQUE,
  hold_id                   UUID REFERENCES venue_cigar_inventory_holds(hold_id),
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at                TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_vcpi_order ON venue_cigar_payment_intents (order_id);
CREATE INDEX IF NOT EXISTS idx_vcpi_venue ON venue_cigar_payment_intents (venue_id);
CREATE INDEX IF NOT EXISTS idx_vcpi_customer ON venue_cigar_payment_intents (customer_reference);
CREATE INDEX IF NOT EXISTS idx_vcpi_state ON venue_cigar_payment_intents (payment_state);
CREATE INDEX IF NOT EXISTS idx_vcpi_provider_pi ON venue_cigar_payment_intents (provider_payment_intent_id);

-- ── Append-only webhook event ledger — every verified inbound webhook
-- is recorded exactly once (unique provider event id), before any
-- processing side-effect runs, giving idempotent processing and a
-- real audit trail. Never trusts a client-forwarded event.
CREATE TABLE IF NOT EXISTS venue_cigar_payment_webhook_events (
  id                    BIGSERIAL PRIMARY KEY,
  webhook_event_id      UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  provider               TEXT NOT NULL DEFAULT 'stripe',
  provider_event_id      TEXT NOT NULL,
  provider_event_type    TEXT NOT NULL,
  provider_payment_intent_id TEXT,
  signature_verified     BOOLEAN NOT NULL DEFAULT false,
  processing_status      TEXT NOT NULL DEFAULT 'received' CHECK (processing_status IN (
    'received','processed','ignored_duplicate','ignored_out_of_order','error'
  )),
  payload_snapshot        JSONB NOT NULL,
  error_message            TEXT,
  received_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at              TIMESTAMPTZ,
  UNIQUE (provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS idx_vcpwe_pi ON venue_cigar_payment_webhook_events (provider_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_vcpwe_status ON venue_cigar_payment_webhook_events (processing_status);

-- ── Refund ledger — one row per real or mocked-adapter-boundary
-- refund attempt. Duplicate-refund protection via idempotency_key;
-- partial/full refunds both recorded; inventory restoration remains
-- governed by checkoutService.cancelOrder's existing explicit
-- restock rule (mandate section 10) — this table records the money
-- side only, never triggers a second inventory mutation path.
CREATE TABLE IF NOT EXISTS venue_cigar_payment_refunds (
  id                    BIGSERIAL PRIMARY KEY,
  refund_id             UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  payment_intent_id     UUID NOT NULL REFERENCES venue_cigar_payment_intents(payment_intent_id) ON DELETE CASCADE,
  order_id              UUID NOT NULL REFERENCES venue_cigar_orders(order_id) ON DELETE CASCADE,
  provider_refund_id    TEXT UNIQUE,
  amount_cents          INTEGER NOT NULL CHECK (amount_cents > 0),
  reason                TEXT,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','succeeded','failed'
  )),
  failure_message        TEXT,
  requested_by_staff_id   TEXT NOT NULL,
  idempotency_key          TEXT NOT NULL UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcpr_pi ON venue_cigar_payment_refunds (payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_vcpr_order ON venue_cigar_payment_refunds (order_id);

-- ── Dispute/chargeback ledger (mandate section 11) — record-only,
-- no automated legal response of any kind.
CREATE TABLE IF NOT EXISTS venue_cigar_payment_disputes (
  id                     BIGSERIAL PRIMARY KEY,
  dispute_id              UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  payment_intent_id       UUID NOT NULL REFERENCES venue_cigar_payment_intents(payment_intent_id) ON DELETE CASCADE,
  order_id                UUID NOT NULL REFERENCES venue_cigar_orders(order_id) ON DELETE CASCADE,
  venue_id                 TEXT NOT NULL,
  provider_dispute_id       TEXT NOT NULL,
  amount_disputed_cents      INTEGER NOT NULL CHECK (amount_disputed_cents >= 0),
  status                     TEXT NOT NULL DEFAULT 'opened' CHECK (status IN (
    'opened','updated','won','lost'
  )),
  reason                     TEXT,
  opened_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at                    TIMESTAMPTZ,
  UNIQUE (provider_dispute_id)
);
CREATE INDEX IF NOT EXISTS idx_vcpd_venue ON venue_cigar_payment_disputes (venue_id);
CREATE INDEX IF NOT EXISTS idx_vcpd_order ON venue_cigar_payment_disputes (order_id);

-- ── Reconciliation run ledger — records each manual/scheduled
-- reconciliation pass and any discrepancies found/repaired, for
-- admin visibility and audit (mandate section 9).
CREATE TABLE IF NOT EXISTS venue_cigar_payment_reconciliation_runs (
  id                    BIGSERIAL PRIMARY KEY,
  reconciliation_id      UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  triggered_by            TEXT NOT NULL CHECK (triggered_by IN ('manual_admin', 'scheduled')),
  triggered_by_staff_id     TEXT,
  orders_checked             INTEGER NOT NULL DEFAULT 0,
  discrepancies_found         INTEGER NOT NULL DEFAULT 0,
  discrepancies_repaired       INTEGER NOT NULL DEFAULT 0,
  discrepancy_detail            JSONB NOT NULL DEFAULT '[]',
  started_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at                    TIMESTAMPTZ
);

-- venue_cigar_orders already has payment_status (108) for the staff/
-- POS confirmation workflow. Link the canonical real-money payment
-- intent without overloading that column, per mandate section 4.
ALTER TABLE venue_cigar_orders
  ADD COLUMN IF NOT EXISTS active_payment_intent_id UUID REFERENCES venue_cigar_payment_intents(payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_vco_active_payment_intent ON venue_cigar_orders (active_payment_intent_id);
