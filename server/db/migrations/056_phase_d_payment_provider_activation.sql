-- Safe migration: no destructive DDL, no truncation
-- Phase D.2 — Payment Provider Activation Contracts
-- contains_secrets: false, stores_secrets: false — no raw credentials, keys, or tokens ever stored

CREATE TABLE IF NOT EXISTS payment_provider_registry (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL CHECK (provider_key IN (
    'stripe','square','manual_invoice','cash_offline','future_placeholder'
  )),
  provider_name               TEXT NOT NULL,
  provider_status             TEXT NOT NULL DEFAULT 'credentials_required' CHECK (provider_status IN (
    'not_started','credentials_required','credentials_present_unverified',
    'verification_failed','verified_test_mode','verified_live_mode_locked',
    'live_mode_requested','live_mode_approved','live_mode_enabled'
  )),
  provider_mode               TEXT NOT NULL DEFAULT 'not_configured' CHECK (provider_mode IN (
    'not_configured','test_placeholder','live_locked','live_external','unavailable'
  )),
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected          BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_present         BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_configured          BOOLEAN NOT NULL DEFAULT FALSE,
  payout_enabled              BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  metadata                    JSONB DEFAULT '{}',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_credentials_status (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  credential_label            TEXT NOT NULL,
  presence_status             TEXT NOT NULL DEFAULT 'not_provided' CHECK (presence_status IN (
    'not_provided','provided_unverified','verification_pending',
    'verified_test','verified_live','rejected','expired','unavailable'
  )),
  credential_source           TEXT NOT NULL DEFAULT 'external' CHECK (credential_source IN (
    'external','environment_variable','secrets_manager','unavailable'
  )),
  credentials_present         BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_raw_keys             BOOLEAN NOT NULL DEFAULT FALSE,
  stores_card_data            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  last_verified_at            TIMESTAMPTZ,
  verification_error_code     TEXT,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_verification_attempts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  attempt_status              TEXT NOT NULL DEFAULT 'not_started' CHECK (attempt_status IN (
    'not_started','in_progress','passed_test_mode','passed_live_mode',
    'failed_no_credentials','failed_invalid_credentials','failed_network',
    'failed_rate_limit','skipped','unavailable'
  )),
  attempt_mode                TEXT NOT NULL DEFAULT 'test_placeholder' CHECK (attempt_mode IN (
    'test_placeholder','live_locked','external_only','unavailable'
  )),
  credentials_used            BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_attempted         BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed           BOOLEAN NOT NULL DEFAULT FALSE,
  error_code                  TEXT,
  error_safe_message          TEXT,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_card_data            BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_capability_matrix (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  capability                  TEXT NOT NULL,
  capability_status           TEXT NOT NULL DEFAULT 'not_available' CHECK (capability_status IN (
    'not_available','foundation_ready','activation_required',
    'active_external','blocked','unavailable'
  )),
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_live_mode_requests (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  request_status              TEXT NOT NULL DEFAULT 'not_requested' CHECK (request_status IN (
    'not_requested','submitted','under_review','approved_preview',
    'rejected','cancelled','unavailable'
  )),
  live_mode_requested         BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_approved          BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  request_reason              TEXT,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  actor_user_id               TEXT NOT NULL DEFAULT 'system',
  reviewed_by                 TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_live_mode_approvals (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  request_id                  UUID,
  approval_status             TEXT NOT NULL DEFAULT 'not_approved' CHECK (approval_status IN (
    'not_approved','approved_preview_only','approved_external',
    'revoked','unavailable'
  )),
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  approved_by                 TEXT,
  approval_notes              TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_webhook_registry (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  webhook_label               TEXT NOT NULL,
  webhook_status              TEXT NOT NULL DEFAULT 'not_configured' CHECK (webhook_status IN (
    'not_configured','configured_placeholder','active_external',
    'failed','disabled','unavailable'
  )),
  webhook_configured          BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_webhook_secret       BOOLEAN NOT NULL DEFAULT FALSE,
  endpoint_path               TEXT,
  event_types                 JSONB DEFAULT '[]',
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_webhook_health (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  webhook_id                  UUID,
  health_status               TEXT NOT NULL DEFAULT 'unknown' CHECK (health_status IN (
    'unknown','healthy','degraded','failing','not_configured','unavailable'
  )),
  last_event_at               TIMESTAMPTZ,
  last_failure_at             TIMESTAMPTZ,
  failure_count               INTEGER NOT NULL DEFAULT 0,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_event_audit (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  event_type                  TEXT NOT NULL,
  event_source                TEXT NOT NULL DEFAULT 'internal',
  safe_event_summary          TEXT,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_card_data            BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_manual_invoice_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  profile_name                TEXT NOT NULL,
  profile_status              TEXT NOT NULL DEFAULT 'not_configured' CHECK (profile_status IN (
    'not_configured','configured','active','suspended','unavailable'
  )),
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  invoice_prefix              TEXT,
  payment_terms_days          INTEGER NOT NULL DEFAULT 30,
  currency                    TEXT NOT NULL DEFAULT 'USD',
  metadata                    JSONB DEFAULT '{}',
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_manual_invoice_records (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  profile_id                  UUID,
  invoice_number              TEXT NOT NULL,
  invoice_status              TEXT NOT NULL DEFAULT 'draft' CHECK (invoice_status IN (
    'draft','sent','paid_recorded','overdue','cancelled','unavailable'
  )),
  amount_cents                INTEGER NOT NULL DEFAULT 0,
  currency                    TEXT NOT NULL DEFAULT 'USD',
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_card_data            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  due_date                    DATE,
  paid_at                     TIMESTAMPTZ,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_cash_offline_records (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  record_type                 TEXT NOT NULL DEFAULT 'cash' CHECK (record_type IN (
    'cash','check','bank_transfer_recorded','other_offline','unavailable'
  )),
  record_status               TEXT NOT NULL DEFAULT 'recorded' CHECK (record_status IN (
    'recorded','verified','voided','unavailable'
  )),
  amount_cents                INTEGER NOT NULL DEFAULT 0,
  currency                    TEXT NOT NULL DEFAULT 'USD',
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_card_data            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  recorded_at                 TIMESTAMPTZ DEFAULT NOW(),
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_refund_policy_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT,
  policy_name                 TEXT NOT NULL,
  policy_status               TEXT NOT NULL DEFAULT 'not_configured' CHECK (policy_status IN (
    'not_configured','configured','active','suspended','unavailable'
  )),
  refund_window_days          INTEGER NOT NULL DEFAULT 30,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                    JSONB DEFAULT '{}',
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_tax_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT,
  profile_name                TEXT NOT NULL,
  tax_engine_status           TEXT NOT NULL DEFAULT 'not_configured' CHECK (tax_engine_status IN (
    'not_configured','configured_placeholder','active_external','unavailable'
  )),
  tax_engine_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  default_tax_rate_pct        NUMERIC(5,4) NOT NULL DEFAULT 0,
  metadata                    JSONB DEFAULT '{}',
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_tip_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT,
  profile_name                TEXT NOT NULL,
  tip_profile_status          TEXT NOT NULL DEFAULT 'not_configured' CHECK (tip_profile_status IN (
    'not_configured','configured','active','suspended','unavailable'
  )),
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  tip_options_pct             JSONB DEFAULT '[15, 18, 20, 25]',
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_fee_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT,
  profile_name                TEXT NOT NULL,
  fee_profile_status          TEXT NOT NULL DEFAULT 'not_configured' CHECK (fee_profile_status IN (
    'not_configured','configured_placeholder','active_external','unavailable'
  )),
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  processing_fee_pct          NUMERIC(5,4) NOT NULL DEFAULT 0,
  flat_fee_cents              INTEGER NOT NULL DEFAULT 0,
  metadata                    JSONB DEFAULT '{}',
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_settlement_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT,
  profile_name                TEXT NOT NULL,
  settlement_status           TEXT NOT NULL DEFAULT 'not_configured' CHECK (settlement_status IN (
    'not_configured','configured_placeholder','active_external','unavailable'
  )),
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payout_enabled              BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  settlement_cycle            TEXT NOT NULL DEFAULT 'not_configured',
  metadata                    JSONB DEFAULT '{}',
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_payout_readiness (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  payout_status               TEXT NOT NULL DEFAULT 'not_ready' CHECK (payout_status IN (
    'not_ready','configuration_required','activation_required',
    'ready_placeholder','active_external','blocked','unavailable'
  )),
  payout_enabled              BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_marketplace_readiness (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  marketplace_status          TEXT NOT NULL DEFAULT 'not_ready' CHECK (marketplace_status IN (
    'not_ready','configuration_required','activation_required',
    'ready_placeholder','active_external','blocked','unavailable'
  )),
  marketplace_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_tenant_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL,
  provider_key                TEXT NOT NULL,
  mapping_status              TEXT NOT NULL DEFAULT 'not_configured' CHECK (mapping_status IN (
    'not_configured','configured','active','suspended','unavailable'
  )),
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_module_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  module_key                  TEXT NOT NULL,
  mapping_status              TEXT NOT NULL DEFAULT 'not_configured' CHECK (mapping_status IN (
    'not_configured','configured','active','suspended','unavailable'
  )),
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_environment_locks (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  lock_status                 TEXT NOT NULL DEFAULT 'locked' CHECK (lock_status IN (
    'locked','unlock_requested','unlocked_test_only','unlocked_live','unavailable'
  )),
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  locked_by                   TEXT NOT NULL DEFAULT 'system',
  lock_reason                 TEXT NOT NULL DEFAULT 'Phase D.2 activation required before live mode',
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_compliance_checklist (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  checklist_item              TEXT NOT NULL,
  item_status                 TEXT NOT NULL DEFAULT 'not_started' CHECK (item_status IN (
    'not_started','in_progress','complete','failed','not_applicable','unavailable'
  )),
  required                    BOOLEAN NOT NULL DEFAULT TRUE,
  completed                   BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_risk_flags (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  flag_label                  TEXT NOT NULL,
  flag_status                 TEXT NOT NULL DEFAULT 'active' CHECK (flag_status IN (
    'active','resolved','deferred','informational','unavailable'
  )),
  severity                    TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN (
    'blocking','warning','informational'
  )),
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processing_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  resolution_notes            TEXT,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_activation_audit (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT,
  actor_user_id               TEXT NOT NULL DEFAULT 'system',
  action                      TEXT NOT NULL,
  entity_type                 TEXT NOT NULL,
  entity_id                   TEXT,
  before_snapshot             JSONB DEFAULT '{}',
  after_snapshot              JSONB DEFAULT '{}',
  reason                      TEXT,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_card_data            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pay_prov_registry_tenant     ON payment_provider_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_registry_key        ON payment_provider_registry(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_registry_status     ON payment_provider_registry(provider_status);
CREATE INDEX IF NOT EXISTS idx_pay_prov_cred_tenant         ON payment_provider_credentials_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_cred_key            ON payment_provider_credentials_status(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_cred_status         ON payment_provider_credentials_status(presence_status);
CREATE INDEX IF NOT EXISTS idx_pay_prov_verif_tenant        ON payment_provider_verification_attempts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_verif_key           ON payment_provider_verification_attempts(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_verif_status        ON payment_provider_verification_attempts(attempt_status);
CREATE INDEX IF NOT EXISTS idx_pay_prov_cap_tenant          ON payment_provider_capability_matrix(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_cap_key             ON payment_provider_capability_matrix(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_live_req_tenant     ON payment_provider_live_mode_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_live_req_key        ON payment_provider_live_mode_requests(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_live_req_status     ON payment_provider_live_mode_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_pay_prov_live_appr_tenant    ON payment_provider_live_mode_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_live_appr_key       ON payment_provider_live_mode_approvals(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_webhook_tenant      ON payment_provider_webhook_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_webhook_key         ON payment_provider_webhook_registry(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_wh_health_key       ON payment_provider_webhook_health(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_event_audit_tenant  ON payment_provider_event_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_event_audit_key     ON payment_provider_event_audit(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_event_audit_type    ON payment_provider_event_audit(event_type);
CREATE INDEX IF NOT EXISTS idx_pay_prov_event_audit_at      ON payment_provider_event_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_pay_prov_inv_profile_tenant  ON payment_provider_manual_invoice_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_inv_rec_tenant      ON payment_provider_manual_invoice_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_inv_rec_status      ON payment_provider_manual_invoice_records(invoice_status);
CREATE INDEX IF NOT EXISTS idx_pay_prov_cash_tenant         ON payment_provider_cash_offline_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_refund_tenant       ON payment_provider_refund_policy_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_tax_tenant          ON payment_provider_tax_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_tip_tenant          ON payment_provider_tip_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_fee_tenant          ON payment_provider_fee_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_settle_tenant       ON payment_provider_settlement_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_payout_tenant       ON payment_provider_payout_readiness(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_payout_key          ON payment_provider_payout_readiness(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_mkt_tenant          ON payment_provider_marketplace_readiness(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_mkt_key             ON payment_provider_marketplace_readiness(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_tenant_map_tenant   ON payment_provider_tenant_mapping(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_tenant_map_key      ON payment_provider_tenant_mapping(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_module_map_tenant   ON payment_provider_module_mapping(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_env_lock_tenant     ON payment_provider_environment_locks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_env_lock_key        ON payment_provider_environment_locks(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_compliance_tenant   ON payment_provider_compliance_checklist(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_compliance_key      ON payment_provider_compliance_checklist(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_risk_tenant         ON payment_provider_risk_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_risk_key            ON payment_provider_risk_flags(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_audit_tenant        ON payment_provider_activation_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_audit_key           ON payment_provider_activation_audit(provider_key);
CREATE INDEX IF NOT EXISTS idx_pay_prov_audit_actor         ON payment_provider_activation_audit(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_pay_prov_audit_at            ON payment_provider_activation_audit(created_at);
