-- Migration 019: Stripe Connect / Money Bridge Foundation
-- Tables: payment_provider_accounts, payment_intents_log,
--         money_bridge_settlement_ledger, money_bridge_refund_reversal_logs,
--         payment_webhook_events, payment_audit_logs

-- 1. Payment Provider Accounts
CREATE TABLE IF NOT EXISTS payment_provider_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type            TEXT NOT NULL,
  owner_id              TEXT NOT NULL,
  owner_name            TEXT,
  payment_provider      TEXT NOT NULL DEFAULT 'stripe',
  provider_account_id   TEXT,
  connected_account_id  TEXT,
  onboarding_status     TEXT NOT NULL DEFAULT 'onboarding_required',
  charges_enabled       BOOLEAN DEFAULT FALSE,
  payouts_enabled       BOOLEAN DEFAULT FALSE,
  details_submitted     BOOLEAN DEFAULT FALSE,
  requirements_json     JSONB DEFAULT '{}',
  capabilities_json     JSONB DEFAULT '{}',
  account_status        TEXT NOT NULL DEFAULT 'stripe_required',
  last_verified_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT payment_provider_accounts_owner_type_check
    CHECK (owner_type IN ('platform','venue','partner_vendor','distributor','manufacturer')),
  CONSTRAINT payment_provider_accounts_onboarding_status_check
    CHECK (onboarding_status IN ('stripe_required','onboarding_required','onboarding_pending',
      'onboarding_complete','restricted','rejected','disabled','preview_only')),
  CONSTRAINT payment_provider_accounts_account_status_check
    CHECK (account_status IN ('stripe_required','connected_account_required','onboarding_required',
      'onboarding_pending','charges_disabled','payouts_disabled','active','restricted',
      'disabled','preview_only'))
);

CREATE INDEX IF NOT EXISTS idx_payment_provider_accounts_owner
  ON payment_provider_accounts (owner_type, owner_id);

-- 2. Payment Intents Log
CREATE TABLE IF NOT EXISTS payment_intents_log (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                    TEXT,
  customer_session_id         TEXT,
  smokecraft_order_id         TEXT,
  cart_id                     TEXT,
  payment_provider            TEXT DEFAULT 'stripe',
  provider_payment_intent_id  TEXT,
  amount_total                INTEGER,
  currency                    TEXT DEFAULT 'usd',
  payment_status              TEXT NOT NULL DEFAULT 'payment_preview',
  payment_payload_json        JSONB DEFAULT '{}',
  provider_response_json      JSONB DEFAULT '{}',
  error_json                  JSONB DEFAULT '{}',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT payment_intents_log_status_check
    CHECK (payment_status IN ('payment_preview','payment_required','payment_pending',
      'requires_action','authorized','succeeded','failed','cancelled','refunded','preview_only'))
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_log_order
  ON payment_intents_log (smokecraft_order_id);

-- 3. Money Bridge Settlement Ledger
CREATE TABLE IF NOT EXISTS money_bridge_settlement_ledger (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                    TEXT,
  partner_id                  TEXT,
  partner_name                TEXT,
  smokecraft_order_id         TEXT,
  cart_id                     TEXT,
  payment_intent_id           TEXT,
  partner_food_subtotal       INTEGER,
  smokecraft_commission_rate  NUMERIC,
  venue_referral_rate         NUMERIC,
  partner_payout_rate         NUMERIC,
  smokecraft_commission_amount INTEGER,
  venue_referral_amount       INTEGER,
  partner_payout_amount       INTEGER,
  delivery_routing_fee        INTEGER,
  tax_amount                  INTEGER,
  total_customer_charge       INTEGER,
  settlement_status           TEXT NOT NULL DEFAULT 'settlement_pending_preview',
  settlement_processor        TEXT DEFAULT 'stripe',
  transfer_group              TEXT,
  stripe_charge_id            TEXT,
  stripe_transfer_id          TEXT,
  stripe_application_fee_id   TEXT,
  processor_response_json     JSONB DEFAULT '{}',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT money_bridge_settlement_ledger_status_check
    CHECK (settlement_status IN ('settlement_pending_preview','settlement_pending',
      'settlement_ready','transfer_pending','transfer_complete','payout_pending',
      'payout_complete','settlement_failed','refund_pending','reversal_pending',
      'reversed','preview_only'))
);

CREATE INDEX IF NOT EXISTS idx_money_bridge_settlement_order
  ON money_bridge_settlement_ledger (smokecraft_order_id);

-- 4. Money Bridge Refund/Reversal Logs
CREATE TABLE IF NOT EXISTS money_bridge_refund_reversal_logs (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                        TEXT,
  partner_id                      TEXT,
  smokecraft_order_id             TEXT,
  payment_intent_id               TEXT,
  refund_id                       TEXT,
  reversal_id                     TEXT,
  refund_type                     TEXT,
  refund_amount                   INTEGER,
  smokecraft_commission_reversal  INTEGER,
  venue_referral_reversal         INTEGER,
  partner_payout_reversal         INTEGER,
  reason                          TEXT,
  refund_status                   TEXT NOT NULL DEFAULT 'refund_pending',
  processor_response_json         JSONB DEFAULT '{}',
  created_at                      TIMESTAMPTZ DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT refund_reversal_type_check
    CHECK (refund_type IN ('full','partial','item_unavailable','vendor_rejected',
      'venue_cancelled','customer_cancelled','dispute','manual_review')),
  CONSTRAINT refund_reversal_status_check
    CHECK (refund_status IN ('refund_pending','refund_preview','refund_requires_processor',
      'refund_submitted','refund_completed','refund_failed','reversal_pending',
      'reversal_completed','reversal_failed'))
);

CREATE INDEX IF NOT EXISTS idx_refund_reversal_payment_intent
  ON money_bridge_refund_reversal_logs (payment_intent_id);

-- 5. Payment Webhook Events
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_provider    TEXT DEFAULT 'stripe',
  provider_event_id   TEXT,
  event_type          TEXT,
  payload_json        JSONB DEFAULT '{}',
  signature_verified  BOOLEAN DEFAULT FALSE,
  processing_status   TEXT DEFAULT 'webhook_pending',
  received_at         TIMESTAMPTZ DEFAULT NOW(),
  processed_at        TIMESTAMPTZ,
  error_json          JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT payment_webhook_processing_status_check
    CHECK (processing_status IN ('webhook_pending','processed','ignored','failed',
      'signature_required','provider_not_connected'))
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_provider_event
  ON payment_webhook_events (provider_event_id);

-- 6. Payment Audit Logs
CREATE TABLE IF NOT EXISTS payment_audit_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id         TEXT,
  actor_role       TEXT,
  owner_type       TEXT,
  owner_id         TEXT,
  action_type      TEXT,
  target_type      TEXT,
  target_id        TEXT,
  payment_provider TEXT,
  request_json     JSONB DEFAULT '{}',
  response_json    JSONB DEFAULT '{}',
  status           TEXT DEFAULT 'audit_logged',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT payment_audit_logs_status_check
    CHECK (status IN ('audit_logged','preview_fallback','processor_required','failed'))
);
