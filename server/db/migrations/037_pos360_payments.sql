-- POS360 Payments, Tips, Receipts & Settlement Hardening (Phase B.7)
-- Migration: 037_pos360_payments.sql
-- CREATE TABLE IF NOT EXISTS only. No DROP TABLE, no DROP COLUMN, no data destruction.

-- ── Payment intents ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_intents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  order_id              UUID,
  check_id              UUID,
  tab_id                UUID,
  device_id             TEXT,
  staff_user_id         TEXT,
  idempotency_key       TEXT NOT NULL,
  amount                NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency              TEXT NOT NULL DEFAULT 'USD',
  payment_status        TEXT NOT NULL DEFAULT 'not_started',
  provider_key          TEXT,
  provider_reference    TEXT,
  failure_reason        TEXT,
  notes                 TEXT,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB,
  audit_context         JSONB,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (idempotency_key, venue_id)
);

CREATE INDEX IF NOT EXISTS idx_pos360_payment_intents_venue   ON pos360_payment_intents(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_payment_intents_order   ON pos360_payment_intents(order_id);
CREATE INDEX IF NOT EXISTS idx_pos360_payment_intents_status  ON pos360_payment_intents(payment_status);
CREATE INDEX IF NOT EXISTS idx_pos360_payment_intents_idem    ON pos360_payment_intents(idempotency_key);

-- ── Payments ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 TEXT NOT NULL,
  venue_id                  TEXT NOT NULL,
  location_id               TEXT,
  order_id                  UUID,
  check_id                  UUID,
  tab_id                    UUID,
  payment_intent_id         UUID,
  settlement_batch_id       UUID,
  device_id                 TEXT,
  staff_user_id             TEXT,
  idempotency_key           TEXT NOT NULL,
  amount                    NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_tendered           NUMERIC(12,2),
  amount_due                NUMERIC(12,2),
  change_due                NUMERIC(12,2),
  tip_amount                NUMERIC(12,2) NOT NULL DEFAULT 0,
  service_charge_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount                NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_charged             NUMERIC(12,2),
  currency                  TEXT NOT NULL DEFAULT 'USD',
  payment_method            TEXT NOT NULL DEFAULT 'credit_card',
  payment_status            TEXT NOT NULL DEFAULT 'not_started',
  provider_key              TEXT,
  provider_reference        TEXT,
  masked_card               TEXT,
  card_brand                TEXT,
  card_last4                TEXT,
  is_split                  BOOLEAN NOT NULL DEFAULT FALSE,
  is_partial                BOOLEAN NOT NULL DEFAULT FALSE,
  is_offline                BOOLEAN NOT NULL DEFAULT FALSE,
  offline_queued_at         TIMESTAMPTZ,
  failure_reason            TEXT,
  authorized_at             TIMESTAMPTZ,
  paid_at                   TIMESTAMPTZ,
  settled_at                TIMESTAMPTZ,
  voided_at                 TIMESTAMPTZ,
  refunded_at               TIMESTAMPTZ,
  notes                     TEXT,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                  JSONB,
  audit_context             JSONB,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (idempotency_key, venue_id)
);

CREATE INDEX IF NOT EXISTS idx_pos360_payments_venue    ON pos360_payments(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_payments_order    ON pos360_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_pos360_payments_check    ON pos360_payments(check_id);
CREATE INDEX IF NOT EXISTS idx_pos360_payments_tab      ON pos360_payments(tab_id);
CREATE INDEX IF NOT EXISTS idx_pos360_payments_status   ON pos360_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_pos360_payments_method   ON pos360_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_pos360_payments_idem     ON pos360_payments(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_pos360_payments_batch    ON pos360_payments(settlement_batch_id);

-- ── Payment methods (venue-configured) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_methods (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL,
  venue_id          TEXT NOT NULL,
  method_key        TEXT NOT NULL,
  label             TEXT NOT NULL,
  is_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  requires_provider BOOLEAN NOT NULL DEFAULT FALSE,
  provider_key      TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB,
  UNIQUE (tenant_id, venue_id, method_key)
);

CREATE INDEX IF NOT EXISTS idx_pos360_payment_methods_venue ON pos360_payment_methods(venue_id);

-- ── Split payments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_splits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  order_id              UUID,
  check_id              UUID,
  tab_id                UUID,
  device_id             TEXT,
  staff_user_id         TEXT,
  total_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due           NUMERIC(12,2) NOT NULL DEFAULT 0,
  split_status          TEXT NOT NULL DEFAULT 'open',
  tender_count          INTEGER NOT NULL DEFAULT 0,
  notes                 TEXT,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB,
  audit_context         JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_splits_venue  ON pos360_payment_splits(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_splits_order  ON pos360_payment_splits(order_id);
CREATE INDEX IF NOT EXISTS idx_pos360_splits_check  ON pos360_payment_splits(check_id);

-- ── Tips ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_tips (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  payment_id            UUID,
  order_id              UUID,
  check_id              UUID,
  tab_id                UUID,
  staff_user_id         TEXT,
  server_user_id        TEXT,
  device_id             TEXT,
  tip_type              TEXT NOT NULL DEFAULT 'none',
  tip_percentage        NUMERIC(5,2),
  tip_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  pre_tax_base          NUMERIC(12,2),
  post_tax_base         NUMERIC(12,2),
  is_auto_gratuity      BOOLEAN NOT NULL DEFAULT FALSE,
  is_service_charge     BOOLEAN NOT NULL DEFAULT FALSE,
  is_pooled             BOOLEAN NOT NULL DEFAULT FALSE,
  pool_group_id         TEXT,
  adjustment_reason     TEXT,
  adjusted_at           TIMESTAMPTZ,
  adjusted_by           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB,
  audit_context         JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_tips_venue   ON pos360_payment_tips(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tips_payment ON pos360_payment_tips(payment_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tips_order   ON pos360_payment_tips(order_id);

-- ── Signatures ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_signatures (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  payment_id            UUID,
  order_id              UUID,
  device_id             TEXT,
  staff_user_id         TEXT,
  signature_status      TEXT NOT NULL DEFAULT 'pending',
  signature_required    BOOLEAN NOT NULL DEFAULT FALSE,
  signature_ref         TEXT,
  skipped_reason        TEXT,
  is_offline            BOOLEAN NOT NULL DEFAULT FALSE,
  offline_queued_at     TIMESTAMPTZ,
  captured_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB,
  audit_context         JSONB,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pos360_signatures_venue   ON pos360_payment_signatures(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_signatures_payment ON pos360_payment_signatures(payment_id);

-- ── Receipts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_receipts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  payment_id            UUID,
  order_id              UUID,
  check_id              UUID,
  tab_id                UUID,
  device_id             TEXT,
  staff_user_id         TEXT,
  receipt_number        TEXT,
  language              TEXT NOT NULL DEFAULT 'en-US',
  receipt_status        TEXT NOT NULL DEFAULT 'pending',
  delivery_method       TEXT,
  email_address         TEXT,
  phone_number          TEXT,
  preview_generated     BOOLEAN NOT NULL DEFAULT FALSE,
  email_queued          BOOLEAN NOT NULL DEFAULT FALSE,
  sms_queued            BOOLEAN NOT NULL DEFAULT FALSE,
  print_queued          BOOLEAN NOT NULL DEFAULT FALSE,
  subtotal              NUMERIC(12,2),
  tax_amount            NUMERIC(12,2),
  service_charge_amount NUMERIC(12,2),
  discount_amount       NUMERIC(12,2),
  tip_amount            NUMERIC(12,2),
  total_amount          NUMERIC(12,2),
  paid_amount           NUMERIC(12,2),
  balance_due           NUMERIC(12,2),
  refund_total          NUMERIC(12,2),
  masked_card           TEXT,
  receipt_lines         JSONB,
  payment_summary       JSONB,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB,
  audit_context         JSONB,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pos360_receipts_venue   ON pos360_payment_receipts(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_receipts_payment ON pos360_payment_receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_pos360_receipts_order   ON pos360_payment_receipts(order_id);

-- ── Refunds ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_refunds (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  payment_id            UUID NOT NULL,
  order_id              UUID,
  check_id              UUID,
  tab_id                UUID,
  settlement_batch_id   UUID,
  device_id             TEXT,
  staff_user_id         TEXT,
  idempotency_key       TEXT,
  refund_type           TEXT NOT NULL DEFAULT 'full',
  refund_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency              TEXT NOT NULL DEFAULT 'USD',
  refund_status         TEXT NOT NULL DEFAULT 'requested',
  refund_reason         TEXT,
  service_recovery      BOOLEAN NOT NULL DEFAULT FALSE,
  provider_key          TEXT,
  provider_reference    TEXT,
  requires_manager      BOOLEAN NOT NULL DEFAULT TRUE,
  manager_user_id       TEXT,
  manager_approved_at   TIMESTAMPTZ,
  manager_denied_at     TIMESTAMPTZ,
  denial_reason         TEXT,
  refunded_at           TIMESTAMPTZ,
  failure_reason        TEXT,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB,
  audit_context         JSONB,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pos360_refunds_venue   ON pos360_payment_refunds(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_refunds_payment ON pos360_payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_pos360_refunds_status  ON pos360_payment_refunds(refund_status);

-- ── Voids ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_voids (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  payment_id            UUID NOT NULL,
  order_id              UUID,
  device_id             TEXT,
  staff_user_id         TEXT,
  void_type             TEXT NOT NULL DEFAULT 'standard',
  void_reason           TEXT,
  void_status           TEXT NOT NULL DEFAULT 'requested',
  is_same_day           BOOLEAN NOT NULL DEFAULT FALSE,
  requires_manager      BOOLEAN NOT NULL DEFAULT TRUE,
  manager_user_id       TEXT,
  manager_approved_at   TIMESTAMPTZ,
  manager_denied_at     TIMESTAMPTZ,
  denial_reason         TEXT,
  voided_at             TIMESTAMPTZ,
  failure_reason        TEXT,
  provider_key          TEXT,
  provider_reference    TEXT,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB,
  audit_context         JSONB,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pos360_voids_venue   ON pos360_payment_voids(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_voids_payment ON pos360_payment_voids(payment_id);
CREATE INDEX IF NOT EXISTS idx_pos360_voids_status  ON pos360_payment_voids(void_status);

-- ── Settlement batches ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_settlement_batches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  batch_name            TEXT,
  batch_status          TEXT NOT NULL DEFAULT 'open',
  batch_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  is_end_of_day         BOOLEAN NOT NULL DEFAULT FALSE,
  total_sales           NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_tips            NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_service_charges NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_discounts       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_refunds         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_voids           NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cash            NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_card            NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_gift_card       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_house_account   NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_total             NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_count         INTEGER NOT NULL DEFAULT 0,
  opened_at             TIMESTAMPTZ,
  closed_at             TIMESTAMPTZ,
  failure_reason        TEXT,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB,
  audit_context         JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_settlement_venue  ON pos360_payment_settlement_batches(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_settlement_date   ON pos360_payment_settlement_batches(batch_date DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_settlement_status ON pos360_payment_settlement_batches(batch_status);

-- ── Settlement items ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_settlement_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  settlement_batch_id   UUID NOT NULL,
  payment_id            UUID,
  order_id              UUID,
  check_id              UUID,
  payment_method        TEXT,
  amount                NUMERIC(12,2) NOT NULL DEFAULT 0,
  tip_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  item_type             TEXT NOT NULL DEFAULT 'payment',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_settle_items_batch ON pos360_payment_settlement_items(settlement_batch_id);
CREATE INDEX IF NOT EXISTS idx_pos360_settle_items_venue ON pos360_payment_settlement_items(venue_id);

-- ── Cash drawer events ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_cash_drawer_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  settlement_batch_id   UUID,
  order_id              UUID,
  payment_id            UUID,
  event_type            TEXT NOT NULL,
  amount                NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_amount       NUMERIC(12,2),
  actual_amount         NUMERIC(12,2),
  variance              NUMERIC(12,2),
  variance_reason       TEXT,
  requires_manager      BOOLEAN NOT NULL DEFAULT FALSE,
  manager_user_id       TEXT,
  manager_approved_at   TIMESTAMPTZ,
  notes                 TEXT,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB,
  audit_context         JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_cash_drawer_venue   ON pos360_payment_cash_drawer_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_cash_drawer_type    ON pos360_payment_cash_drawer_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pos360_cash_drawer_device  ON pos360_payment_cash_drawer_events(device_id);

-- ── House account events ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_house_account_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL,
  venue_id          TEXT NOT NULL,
  payment_id        UUID,
  order_id          UUID,
  guest_id          TEXT,
  account_ref       TEXT,
  event_type        TEXT NOT NULL DEFAULT 'charge',
  amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  event_status      TEXT NOT NULL DEFAULT 'pending',
  notes             TEXT,
  created_by        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_house_acct_venue ON pos360_payment_house_account_events(venue_id);

-- ── Gift card events ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_gift_card_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL,
  venue_id          TEXT NOT NULL,
  payment_id        UUID,
  order_id          UUID,
  card_ref          TEXT,
  masked_card       TEXT,
  event_type        TEXT NOT NULL DEFAULT 'redemption',
  amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_before    NUMERIC(12,2),
  balance_after     NUMERIC(12,2),
  event_status      TEXT NOT NULL DEFAULT 'pending',
  provider_key      TEXT,
  notes             TEXT,
  created_by        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB,
  contains_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pos360_gift_card_venue ON pos360_payment_gift_card_events(venue_id);

-- ── Provider events ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_provider_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL,
  venue_id          TEXT NOT NULL,
  payment_id        UUID,
  payment_intent_id UUID,
  provider_key      TEXT NOT NULL,
  event_type        TEXT NOT NULL,
  event_status      TEXT NOT NULL DEFAULT 'received',
  provider_event_id TEXT,
  response_code     INTEGER,
  response_body     JSONB,
  failure_reason    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB,
  contains_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pos360_provider_events_venue    ON pos360_payment_provider_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_provider_events_provider ON pos360_payment_provider_events(provider_key);
CREATE INDEX IF NOT EXISTS idx_pos360_provider_events_payment  ON pos360_payment_provider_events(payment_id);

-- ── Payment risk reviews ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_risk_reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  payment_id            UUID,
  order_id              UUID,
  device_id             TEXT,
  staff_user_id         TEXT,
  review_type           TEXT NOT NULL,
  review_status         TEXT NOT NULL DEFAULT 'pending',
  risk_reason           TEXT,
  reviewed_by           TEXT,
  reviewed_at           TIMESTAMPTZ,
  decision              TEXT,
  decision_notes        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_risk_reviews_venue  ON pos360_payment_risk_reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_risk_reviews_status ON pos360_payment_risk_reviews(review_status);

-- ── E.A.T. payment alerts ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_eat_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL,
  venue_id          TEXT NOT NULL,
  location_id       TEXT,
  device_id         TEXT,
  payment_id        UUID,
  order_id          UUID,
  settlement_batch_id UUID,
  alert_type        TEXT NOT NULL,
  alert_level       TEXT NOT NULL DEFAULT 'warning',
  title             TEXT NOT NULL,
  body              TEXT,
  entity_type       TEXT,
  entity_id         TEXT,
  acknowledged      BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by   TEXT,
  acknowledged_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_pay_eat_venue  ON pos360_payment_eat_alerts(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_pay_eat_type   ON pos360_payment_eat_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_pos360_pay_eat_ack    ON pos360_payment_eat_alerts(acknowledged);

-- ── Payment audit ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_payment_audit (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  payment_id            UUID,
  payment_intent_id     UUID,
  settlement_batch_id   UUID,
  order_id              UUID,
  check_id              UUID,
  tab_id                UUID,
  entity_type           TEXT NOT NULL,
  entity_id             TEXT,
  action                TEXT NOT NULL,
  actor_id              TEXT,
  actor_role            TEXT,
  previous_value        JSONB,
  new_value             JSONB,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_pay_audit_venue   ON pos360_payment_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_pay_audit_payment ON pos360_payment_audit(payment_id);
CREATE INDEX IF NOT EXISTS idx_pos360_pay_audit_order   ON pos360_payment_audit(order_id);
CREATE INDEX IF NOT EXISTS idx_pos360_pay_audit_batch   ON pos360_payment_audit(settlement_batch_id);
