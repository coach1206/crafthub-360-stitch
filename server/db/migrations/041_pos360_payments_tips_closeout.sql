-- Migration 041: POS360 Payments, Tips, Signatures, Receipts, Split Tender, Closeout & Payment Provider Contracts
-- Phase B.11 Prompt X
-- Uses CREATE TABLE IF NOT EXISTS. No DROP TABLE. No destructive column changes.

-- Compatibility: pos360_payment_intents was created by migration 037 with a different schema
-- (UUID PK, payment_status column). Add columns that migration 041 indexes but 037 omitted.
ALTER TABLE IF EXISTS pos360_payment_intents ADD COLUMN IF NOT EXISTS reservation_id TEXT;
ALTER TABLE IF EXISTS pos360_payment_intents ADD COLUMN IF NOT EXISTS private_event_id TEXT;
ALTER TABLE IF EXISTS pos360_payment_intents ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE IF EXISTS pos360_payment_intents ADD COLUMN IF NOT EXISTS payment_intent_status TEXT NOT NULL DEFAULT 'draft';

-- Payment provider profiles
CREATE TABLE IF NOT EXISTS pos360_payment_provider_profiles (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  provider_name       TEXT NOT NULL CHECK (provider_name IN ('stripe','square','clover','toast','adyen','authorize_net','worldpay','manual_external','other')),
  provider_status     TEXT NOT NULL DEFAULT 'not_connected' CHECK (provider_status IN ('not_connected','configured_placeholder','connected_external','disabled','error')),
  display_name        TEXT,
  provider_reference  TEXT,
  capability_payload  JSONB NOT NULL DEFAULT '{}',
  stores_card_data    BOOLEAN NOT NULL DEFAULT FALSE,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pmt_provider_venue ON pos360_payment_provider_profiles(venue_id);
CREATE INDEX IF NOT EXISTS idx_pmt_provider_name ON pos360_payment_provider_profiles(provider_name);
CREATE INDEX IF NOT EXISTS idx_pmt_provider_status ON pos360_payment_provider_profiles(provider_status);

-- Payment terminal profiles
CREATE TABLE IF NOT EXISTS pos360_payment_terminal_profiles (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  provider_profile_id INTEGER REFERENCES pos360_payment_provider_profiles(id),
  terminal_name       TEXT NOT NULL,
  terminal_type       TEXT NOT NULL DEFAULT 'other' CHECK (terminal_type IN ('handheld','tablet','kiosk','counter','external','virtual','other')),
  terminal_status     TEXT NOT NULL DEFAULT 'not_connected' CHECK (terminal_status IN ('not_connected','available_external','unavailable','disabled','error')),
  device_reference    TEXT,
  location_hint       TEXT,
  stores_card_data    BOOLEAN NOT NULL DEFAULT FALSE,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pmt_terminal_venue ON pos360_payment_terminal_profiles(venue_id);
CREATE INDEX IF NOT EXISTS idx_pmt_terminal_type ON pos360_payment_terminal_profiles(terminal_type);
CREATE INDEX IF NOT EXISTS idx_pmt_terminal_status ON pos360_payment_terminal_profiles(terminal_status);

-- Payment intents
CREATE TABLE IF NOT EXISTS pos360_payment_intents (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  order_id                    TEXT,
  reservation_id              TEXT,
  private_event_id            TEXT,
  package_selection_id        INTEGER,
  deposit_record_id           INTEGER,
  minimum_spend_progress_id   INTEGER,
  customer_id                 TEXT,
  guest_profile_id            TEXT,
  amount_due                  NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount                  NUMERIC(12,2) NOT NULL DEFAULT 0,
  service_fee_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  gratuity_amount             NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount             NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount                NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency                    TEXT NOT NULL DEFAULT 'USD',
  payment_intent_status       TEXT NOT NULL DEFAULT 'draft' CHECK (payment_intent_status IN ('draft','pending_external','authorized_external','captured_external','failed_external','cancelled','unavailable')),
  provider_profile_id         INTEGER REFERENCES pos360_payment_provider_profiles(id),
  terminal_profile_id         INTEGER REFERENCES pos360_payment_terminal_profiles(id),
  provider_reference          TEXT,
  processed_externally        BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  created_by                  TEXT,
  updated_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pmt_intents_venue ON pos360_payment_intents(venue_id);
CREATE INDEX IF NOT EXISTS idx_pmt_intents_order ON pos360_payment_intents(order_id);
CREATE INDEX IF NOT EXISTS idx_pmt_intents_reservation ON pos360_payment_intents(reservation_id);
CREATE INDEX IF NOT EXISTS idx_pmt_intents_private_event ON pos360_payment_intents(private_event_id);
CREATE INDEX IF NOT EXISTS idx_pmt_intents_customer ON pos360_payment_intents(customer_id);
CREATE INDEX IF NOT EXISTS idx_pmt_intents_status ON pos360_payment_intents(payment_intent_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pmt_intents_idem ON pos360_payment_intents(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Split tender groups
CREATE TABLE IF NOT EXISTS pos360_split_tender_groups (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  order_id            TEXT,
  payment_intent_id   INTEGER, -- fk-ref: pos360_payment_intents; omitted — 037 uses UUID PK incompatible with INTEGER
  expected_total      NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_total       NUMERIC(12,2) NOT NULL DEFAULT 0,
  remaining_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  split_status        TEXT NOT NULL DEFAULT 'open' CHECK (split_status IN ('open','partially_paid','complete_external','cancelled','unavailable')),
  idempotency_key     TEXT,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_split_tender_venue ON pos360_split_tender_groups(venue_id);
CREATE INDEX IF NOT EXISTS idx_split_tender_order ON pos360_split_tender_groups(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_split_tender_idem ON pos360_split_tender_groups(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Payment records
CREATE TABLE IF NOT EXISTS pos360_payment_records (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  payment_intent_id           INTEGER, -- fk-ref: pos360_payment_intents; omitted — 037 uses UUID PK incompatible with INTEGER
  split_tender_group_id       INTEGER REFERENCES pos360_split_tender_groups(id),
  order_id                    TEXT,
  reservation_id              TEXT,
  private_event_id            TEXT,
  customer_id                 TEXT,
  guest_profile_id            TEXT,
  tender_type                 TEXT NOT NULL DEFAULT 'manual_external' CHECK (tender_type IN ('cash','card_external','gift_card_external','comp','house_account','manual_external','other')),
  payment_amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
  tip_amount                  NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount                NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency                    TEXT NOT NULL DEFAULT 'USD',
  payment_status              TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','marked_paid_external','authorized_external','captured_external','failed_external','refunded_external','partially_refunded_external','voided_external','cancelled')),
  provider_profile_id         INTEGER REFERENCES pos360_payment_provider_profiles(id),
  terminal_profile_id         INTEGER REFERENCES pos360_payment_terminal_profiles(id),
  external_payment_reference  TEXT,
  processed_externally        BOOLEAN NOT NULL DEFAULT FALSE,
  received_by_user_id         TEXT,
  idempotency_key             TEXT,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  stores_card_data            BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  created_by                  TEXT,
  updated_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pmt_records_venue ON pos360_payment_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_pmt_records_order ON pos360_payment_records(order_id);
CREATE INDEX IF NOT EXISTS idx_pmt_records_reservation ON pos360_payment_records(reservation_id);
CREATE INDEX IF NOT EXISTS idx_pmt_records_private_event ON pos360_payment_records(private_event_id);
CREATE INDEX IF NOT EXISTS idx_pmt_records_customer ON pos360_payment_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_pmt_records_status ON pos360_payment_records(payment_status);
CREATE INDEX IF NOT EXISTS idx_pmt_records_tender ON pos360_payment_records(tender_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pmt_records_idem ON pos360_payment_records(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Payment tenders
CREATE TABLE IF NOT EXISTS pos360_payment_tenders (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  payment_record_id     INTEGER NOT NULL REFERENCES pos360_payment_records(id),
  split_tender_group_id INTEGER REFERENCES pos360_split_tender_groups(id),
  tender_type           TEXT NOT NULL CHECK (tender_type IN ('cash','card_external','gift_card_external','comp','house_account','manual_external','other')),
  tender_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  tender_status         TEXT NOT NULL DEFAULT 'pending',
  provider_reference    TEXT,
  processed_externally  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pmt_tenders_venue ON pos360_payment_tenders(venue_id);
CREATE INDEX IF NOT EXISTS idx_pmt_tenders_record ON pos360_payment_tenders(payment_record_id);

-- Payment status history
CREATE TABLE IF NOT EXISTS pos360_payment_status_history (
  id                SERIAL PRIMARY KEY,
  tenant_id         TEXT,
  venue_id          TEXT NOT NULL,
  payment_record_id INTEGER NOT NULL REFERENCES pos360_payment_records(id),
  from_status       TEXT,
  to_status         TEXT NOT NULL,
  changed_by        TEXT,
  reason            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pmt_status_hist_record ON pos360_payment_status_history(payment_record_id);

-- Tip records
CREATE TABLE IF NOT EXISTS pos360_tip_records (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  payment_record_id   INTEGER REFERENCES pos360_payment_records(id),
  order_id            TEXT,
  server_user_id      TEXT,
  tip_type            TEXT NOT NULL DEFAULT 'no_tip' CHECK (tip_type IN ('preset','custom','no_tip','adjusted','comp_related','manual_external')),
  preset_percentage   NUMERIC(5,2),
  tip_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  tip_status          TEXT NOT NULL DEFAULT 'pending' CHECK (tip_status IN ('pending','recorded_external','adjusted','voided','paid_out_external','unavailable')),
  tip_pool_metadata   JSONB NOT NULL DEFAULT '{}',
  idempotency_key     TEXT,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tip_records_venue ON pos360_tip_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_tip_records_server ON pos360_tip_records(server_user_id);
CREATE INDEX IF NOT EXISTS idx_tip_records_payment ON pos360_tip_records(payment_record_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tip_records_idem ON pos360_tip_records(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Tip adjustments
CREATE TABLE IF NOT EXISTS pos360_tip_adjustments (
  id                        SERIAL PRIMARY KEY,
  tenant_id                 TEXT,
  venue_id                  TEXT NOT NULL,
  tip_record_id             INTEGER NOT NULL REFERENCES pos360_tip_records(id),
  previous_tip_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  new_tip_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  adjustment_reason         TEXT,
  manager_approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  manager_approved_by       TEXT,
  manager_approved_at       TIMESTAMPTZ,
  status                    TEXT NOT NULL DEFAULT 'pending_manager_approval' CHECK (status IN ('pending_manager_approval','approved','rejected','cancelled')),
  idempotency_key           TEXT,
  created_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tip_adj_venue ON pos360_tip_adjustments(venue_id);
CREATE INDEX IF NOT EXISTS idx_tip_adj_tip ON pos360_tip_adjustments(tip_record_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tip_adj_idem ON pos360_tip_adjustments(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Signature records
CREATE TABLE IF NOT EXISTS pos360_signature_records (
  id                      SERIAL PRIMARY KEY,
  tenant_id               TEXT,
  venue_id                TEXT NOT NULL,
  payment_record_id       INTEGER REFERENCES pos360_payment_records(id),
  order_id                TEXT,
  signature_status        TEXT NOT NULL DEFAULT 'not_required' CHECK (signature_status IN ('not_required','pending_external','captured_external_reference','declined','unavailable')),
  signature_provider      TEXT,
  signature_reference     TEXT,
  signer_name             TEXT,
  signer_consent_snapshot JSONB NOT NULL DEFAULT '{}',
  stores_raw_signature    BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data    BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data  BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key         TEXT,
  created_by              TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sig_records_venue ON pos360_signature_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_sig_records_payment ON pos360_signature_records(payment_record_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sig_records_idem ON pos360_signature_records(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Receipt records
CREATE TABLE IF NOT EXISTS pos360_receipt_records (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  payment_record_id   INTEGER REFERENCES pos360_payment_records(id),
  order_id            TEXT,
  receipt_number      TEXT,
  receipt_status      TEXT NOT NULL DEFAULT 'draft' CHECK (receipt_status IN ('draft','generated','print_ready','email_ready','sms_ready','sent_external','failed_external','unavailable')),
  receipt_payload     JSONB NOT NULL DEFAULT '{}',
  delivery_preference TEXT NOT NULL DEFAULT 'none' CHECK (delivery_preference IN ('print','email','sms','qr','none','external')),
  recipient_email     TEXT,
  recipient_phone     TEXT,
  sent_externally     BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data   BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key     TEXT,
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_receipt_records_venue ON pos360_receipt_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_receipt_records_payment ON pos360_receipt_records(payment_record_id);
CREATE INDEX IF NOT EXISTS idx_receipt_records_status ON pos360_receipt_records(receipt_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipt_records_idem ON pos360_receipt_records(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Receipt delivery attempts
CREATE TABLE IF NOT EXISTS pos360_receipt_delivery_attempts (
  id                SERIAL PRIMARY KEY,
  tenant_id         TEXT,
  venue_id          TEXT NOT NULL,
  receipt_record_id INTEGER NOT NULL REFERENCES pos360_receipt_records(id),
  delivery_method   TEXT NOT NULL,
  attempt_status    TEXT NOT NULL DEFAULT 'pending',
  attempt_note      TEXT,
  attempted_by      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_receipt_delivery_receipt ON pos360_receipt_delivery_attempts(receipt_record_id);

-- Refund requests
CREATE TABLE IF NOT EXISTS pos360_refund_requests (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  payment_record_id           INTEGER NOT NULL REFERENCES pos360_payment_records(id),
  refund_amount               NUMERIC(12,2) NOT NULL DEFAULT 0,
  refund_reason               TEXT,
  refund_status               TEXT NOT NULL DEFAULT 'pending_manager_approval' CHECK (refund_status IN ('pending_manager_approval','approved','rejected','marked_refunded_external','failed_external','cancelled')),
  manager_approval_required   BOOLEAN NOT NULL DEFAULT TRUE,
  manager_approved_by         TEXT,
  manager_approved_at         TIMESTAMPTZ,
  external_refund_reference   TEXT,
  processed_externally        BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by                  TEXT,
  updated_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refund_req_venue ON pos360_refund_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_refund_req_payment ON pos360_refund_requests(payment_record_id);
CREATE INDEX IF NOT EXISTS idx_refund_req_status ON pos360_refund_requests(refund_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refund_req_idem ON pos360_refund_requests(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Void requests
CREATE TABLE IF NOT EXISTS pos360_void_requests (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  payment_record_id           INTEGER NOT NULL REFERENCES pos360_payment_records(id),
  void_reason                 TEXT,
  void_status                 TEXT NOT NULL DEFAULT 'pending_manager_approval' CHECK (void_status IN ('pending_manager_approval','approved','rejected','marked_voided_external','failed_external','cancelled')),
  manager_approval_required   BOOLEAN NOT NULL DEFAULT TRUE,
  manager_approved_by         TEXT,
  manager_approved_at         TIMESTAMPTZ,
  external_void_reference     TEXT,
  processed_externally        BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by                  TEXT,
  updated_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_void_req_venue ON pos360_void_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_void_req_payment ON pos360_void_requests(payment_record_id);
CREATE INDEX IF NOT EXISTS idx_void_req_status ON pos360_void_requests(void_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_void_req_idem ON pos360_void_requests(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Cash drawers
CREATE TABLE IF NOT EXISTS pos360_cash_drawers (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  drawer_name           TEXT NOT NULL,
  terminal_profile_id   INTEGER REFERENCES pos360_payment_terminal_profiles(id),
  opened_by_user_id     TEXT NOT NULL,
  closed_by_user_id     TEXT,
  opening_cash_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_cash_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  counted_cash_amount   NUMERIC(12,2),
  over_short_amount     NUMERIC(12,2),
  drawer_status         TEXT NOT NULL DEFAULT 'open' CHECK (drawer_status IN ('open','pending_review','closed','locked','unavailable')),
  opened_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at             TIMESTAMPTZ,
  idempotency_key       TEXT,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cash_drawers_venue ON pos360_cash_drawers(venue_id);
CREATE INDEX IF NOT EXISTS idx_cash_drawers_status ON pos360_cash_drawers(drawer_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_drawers_idem ON pos360_cash_drawers(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Cash drawer events
CREATE TABLE IF NOT EXISTS pos360_cash_drawer_events (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  cash_drawer_id        INTEGER NOT NULL REFERENCES pos360_cash_drawers(id),
  event_type            TEXT NOT NULL CHECK (event_type IN ('opening_cash','cash_payment','cash_refund','payout','drop','adjustment','close_count','manager_review')),
  event_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  event_reason          TEXT,
  actor_user_id         TEXT,
  manager_approved_by   TEXT,
  idempotency_key       TEXT,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drawer_events_venue ON pos360_cash_drawer_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_drawer_events_drawer ON pos360_cash_drawer_events(cash_drawer_id);

-- Server closeouts
CREATE TABLE IF NOT EXISTS pos360_server_closeouts (
  id                      SERIAL PRIMARY KEY,
  tenant_id               TEXT,
  venue_id                TEXT NOT NULL,
  closeout_date           DATE NOT NULL,
  closeout_type           TEXT NOT NULL DEFAULT 'server',
  server_user_id          TEXT,
  opened_by_user_id       TEXT,
  closed_by_user_id       TEXT,
  expected_cash_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  counted_cash_total      NUMERIC(12,2),
  card_external_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  gift_card_external_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  comp_total              NUMERIC(12,2) NOT NULL DEFAULT 0,
  house_account_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  manual_external_total   NUMERIC(12,2) NOT NULL DEFAULT 0,
  tip_total               NUMERIC(12,2) NOT NULL DEFAULT 0,
  refund_total            NUMERIC(12,2) NOT NULL DEFAULT 0,
  void_total              NUMERIC(12,2) NOT NULL DEFAULT 0,
  over_short_amount       NUMERIC(12,2),
  closeout_status         TEXT NOT NULL DEFAULT 'draft' CHECK (closeout_status IN ('draft','pending_review','approved','rejected','closed','unavailable')),
  manager_approved_by     TEXT,
  manager_approved_at     TIMESTAMPTZ,
  idempotency_key         TEXT,
  exposes_financial_data  BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_server_closeout_venue ON pos360_server_closeouts(venue_id);
CREATE INDEX IF NOT EXISTS idx_server_closeout_date ON pos360_server_closeouts(closeout_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_server_closeout_idem ON pos360_server_closeouts(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Shift closeouts
CREATE TABLE IF NOT EXISTS pos360_shift_closeouts (
  id                      SERIAL PRIMARY KEY,
  tenant_id               TEXT,
  venue_id                TEXT NOT NULL,
  closeout_date           DATE NOT NULL,
  closeout_type           TEXT NOT NULL DEFAULT 'shift',
  server_user_id          TEXT,
  opened_by_user_id       TEXT,
  closed_by_user_id       TEXT,
  expected_cash_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  counted_cash_total      NUMERIC(12,2),
  card_external_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  gift_card_external_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  comp_total              NUMERIC(12,2) NOT NULL DEFAULT 0,
  house_account_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  manual_external_total   NUMERIC(12,2) NOT NULL DEFAULT 0,
  tip_total               NUMERIC(12,2) NOT NULL DEFAULT 0,
  refund_total            NUMERIC(12,2) NOT NULL DEFAULT 0,
  void_total              NUMERIC(12,2) NOT NULL DEFAULT 0,
  over_short_amount       NUMERIC(12,2),
  closeout_status         TEXT NOT NULL DEFAULT 'draft' CHECK (closeout_status IN ('draft','pending_review','approved','rejected','closed','unavailable')),
  manager_approved_by     TEXT,
  manager_approved_at     TIMESTAMPTZ,
  idempotency_key         TEXT,
  exposes_financial_data  BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shift_closeout_venue ON pos360_shift_closeouts(venue_id);
CREATE INDEX IF NOT EXISTS idx_shift_closeout_date ON pos360_shift_closeouts(closeout_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shift_closeout_idem ON pos360_shift_closeouts(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Daily closeouts
CREATE TABLE IF NOT EXISTS pos360_daily_closeouts (
  id                      SERIAL PRIMARY KEY,
  tenant_id               TEXT,
  venue_id                TEXT NOT NULL,
  closeout_date           DATE NOT NULL,
  closeout_type           TEXT NOT NULL DEFAULT 'daily',
  opened_by_user_id       TEXT,
  closed_by_user_id       TEXT,
  expected_cash_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  counted_cash_total      NUMERIC(12,2),
  card_external_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  gift_card_external_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  comp_total              NUMERIC(12,2) NOT NULL DEFAULT 0,
  house_account_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  manual_external_total   NUMERIC(12,2) NOT NULL DEFAULT 0,
  tip_total               NUMERIC(12,2) NOT NULL DEFAULT 0,
  refund_total            NUMERIC(12,2) NOT NULL DEFAULT 0,
  void_total              NUMERIC(12,2) NOT NULL DEFAULT 0,
  over_short_amount       NUMERIC(12,2),
  closeout_status         TEXT NOT NULL DEFAULT 'draft' CHECK (closeout_status IN ('draft','pending_review','approved','rejected','closed','unavailable')),
  manager_approved_by     TEXT,
  manager_approved_at     TIMESTAMPTZ,
  idempotency_key         TEXT,
  exposes_financial_data  BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_daily_closeout_venue ON pos360_daily_closeouts(venue_id);
CREATE INDEX IF NOT EXISTS idx_daily_closeout_date ON pos360_daily_closeouts(closeout_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_closeout_idem ON pos360_daily_closeouts(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Payment risk flags
CREATE TABLE IF NOT EXISTS pos360_payment_risk_flags (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  payment_record_id   INTEGER REFERENCES pos360_payment_records(id),
  order_id            TEXT,
  server_user_id      TEXT,
  risk_type           TEXT NOT NULL CHECK (risk_type IN ('duplicate_payment','excessive_voids','excessive_refunds','large_tip','failed_payment_pattern','drawer_over_short','manager_override_pattern','provider_unavailable','other')),
  risk_status         TEXT NOT NULL DEFAULT 'open' CHECK (risk_status IN ('open','reviewed','dismissed','escalated')),
  risk_payload        JSONB NOT NULL DEFAULT '{}',
  reviewed_by         TEXT,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_risk_flags_venue ON pos360_payment_risk_flags(venue_id);
CREATE INDEX IF NOT EXISTS idx_risk_flags_type ON pos360_payment_risk_flags(risk_type);
CREATE INDEX IF NOT EXISTS idx_risk_flags_status ON pos360_payment_risk_flags(risk_status);

-- Payment revenue insights
CREATE TABLE IF NOT EXISTS pos360_payment_revenue_insights (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  insight_type                TEXT NOT NULL,
  insight_payload             JSONB NOT NULL DEFAULT '{}',
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  ai_confidence               NUMERIC(5,4),
  source                      TEXT NOT NULL DEFAULT 'system',
  honest_state                TEXT NOT NULL DEFAULT 'placeholder',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pmt_insights_venue ON pos360_payment_revenue_insights(venue_id);
CREATE INDEX IF NOT EXISTS idx_pmt_insights_type ON pos360_payment_revenue_insights(insight_type);

-- Payment offline queue
CREATE TABLE IF NOT EXISTS pos360_payment_offline_queue (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  device_id           TEXT,
  actor_user_id       TEXT,
  action_type         TEXT NOT NULL,
  entity_type         TEXT,
  entity_id           TEXT,
  payload             JSONB NOT NULL DEFAULT '{}',
  sync_status         TEXT NOT NULL DEFAULT 'queued' CHECK (sync_status IN ('queued','syncing','synced','failed','conflict')),
  retry_count         INTEGER NOT NULL DEFAULT 0,
  idempotency_key     TEXT,
  synced_by           TEXT,
  synced_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pmt_offline_venue ON pos360_payment_offline_queue(venue_id);
CREATE INDEX IF NOT EXISTS idx_pmt_offline_status ON pos360_payment_offline_queue(sync_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pmt_offline_idem ON pos360_payment_offline_queue(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Payment audit
CREATE TABLE IF NOT EXISTS pos360_payment_audit (
  id                      SERIAL PRIMARY KEY,
  tenant_id               TEXT,
  venue_id                TEXT NOT NULL,
  actor_user_id           TEXT,
  action                  TEXT NOT NULL,
  entity_type             TEXT,
  entity_id               TEXT,
  before_snapshot         JSONB NOT NULL DEFAULT '{}',
  after_snapshot          JSONB NOT NULL DEFAULT '{}',
  reason                  TEXT,
  manager_override        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data    BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data  BOOLEAN NOT NULL DEFAULT TRUE,
  stores_card_data        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pmt_audit_venue ON pos360_payment_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_pmt_audit_entity ON pos360_payment_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pmt_audit_created ON pos360_payment_audit(created_at);
