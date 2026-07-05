-- Phase D.3 External POS Activation
-- Safe migration: no destructive DDL, no truncation
-- contains_secrets: false, stores_secrets: false

CREATE TABLE IF NOT EXISTS external_pos_provider_registry (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL CHECK (provider_key IN ('toast','clover','square_pos','lightspeed','shopify_pos','spoton','touchbistro','revel','generic_csv','manual_pos_companion','future_pos_provider')),
  provider_name               TEXT NOT NULL,
  provider_status             TEXT NOT NULL DEFAULT 'not_started' CHECK (provider_status IN ('not_started','credentials_required','credentials_present_unverified','mapping_required','mapping_in_progress','import_ready','import_tested','api_contract_ready','api_verification_required','api_verified_test_mode','api_live_mode_locked','live_mode_requested','live_mode_approved','live_mode_enabled','disabled','blocked','failed')),
  connected                   BOOLEAN NOT NULL DEFAULT FALSE,
  api_sync_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_enabled             BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  companion_mode_available    BOOLEAN NOT NULL DEFAULT FALSE,
  import_mode_available       BOOLEAN NOT NULL DEFAULT FALSE,
  api_mode_available          BOOLEAN NOT NULL DEFAULT FALSE,
  manual_mapping_available    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  notes                       TEXT,
  created_by                  TEXT,
  updated_by                  TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_provider_status (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  current_status              TEXT NOT NULL DEFAULT 'not_started',
  active_mode                 TEXT,
  last_status_change          TIMESTAMPTZ,
  status_changed_by           TEXT,
  status_reason               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_credentials_status (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  presence_status             TEXT NOT NULL DEFAULT 'absent' CHECK (presence_status IN ('absent','present_unverified','present_verified_test','present_verified_live','expired','revoked')),
  stores_raw_keys             BOOLEAN NOT NULL DEFAULT FALSE,
  stores_api_secret           BOOLEAN NOT NULL DEFAULT FALSE,
  stores_card_data            BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked_at             TIMESTAMPTZ,
  checked_by                  TEXT,
  notes                       TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_mode_registry (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  mode_key                    TEXT NOT NULL CHECK (mode_key IN ('companion_mode','export_import_mode','api_contract_mode','manual_mapping_mode','hybrid_mode')),
  mode_enabled                BOOLEAN NOT NULL DEFAULT FALSE,
  mode_status                 TEXT NOT NULL DEFAULT 'not_started',
  activated_at                TIMESTAMPTZ,
  activated_by                TEXT,
  notes                       TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_companion_mode_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  venue_id                    UUID,
  profile_name                TEXT NOT NULL,
  companion_description       TEXT,
  staff_visibility_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  guest_profile_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  loyalty_tracking_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_notes_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  manager_dashboard_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  humidor_intel_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  bar_intel_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  kitchen_intel_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  is_active                   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by                  TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_import_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  venue_id                    UUID,
  profile_name                TEXT NOT NULL,
  import_format               TEXT DEFAULT 'csv' CHECK (import_format IN ('csv','xlsx','json','xml','txt','pdf','manual')),
  import_scope                TEXT,
  auto_import_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_import_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  sales_import_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  closeout_import_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  report_import_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  last_import_at              TIMESTAMPTZ,
  is_active                   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by                  TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_csv_import_templates (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name               TEXT NOT NULL,
  provider_key                TEXT,
  tenant_id                   UUID,
  template_type               TEXT,
  column_mapping              JSONB DEFAULT '{}',
  sample_headers              TEXT[],
  is_active                   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by                  TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_import_batches (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  import_profile_id           UUID,
  batch_status                TEXT NOT NULL DEFAULT 'pending' CHECK (batch_status IN ('pending','processing','completed','failed','cancelled')),
  import_format               TEXT,
  file_name                   TEXT,
  record_count                INTEGER DEFAULT 0,
  processed_count             INTEGER DEFAULT 0,
  error_count                 INTEGER DEFAULT 0,
  batch_notes                 TEXT,
  started_at                  TIMESTAMPTZ,
  completed_at                TIMESTAMPTZ,
  created_by                  TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_import_batch_items (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id                    UUID NOT NULL,
  tenant_id                   UUID,
  row_number                  INTEGER,
  item_type                   TEXT,
  raw_data                    JSONB DEFAULT '{}',
  mapped_data                 JSONB DEFAULT '{}',
  item_status                 TEXT NOT NULL DEFAULT 'pending',
  error_message               TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_manual_mapping_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  venue_id                    UUID,
  profile_name                TEXT NOT NULL,
  mapping_status              TEXT NOT NULL DEFAULT 'not_started',
  menu_mapping_complete       BOOLEAN NOT NULL DEFAULT FALSE,
  staff_mapping_complete      BOOLEAN NOT NULL DEFAULT FALSE,
  section_mapping_complete    BOOLEAN NOT NULL DEFAULT FALSE,
  tax_mapping_complete        BOOLEAN NOT NULL DEFAULT FALSE,
  payment_mapping_complete    BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_mapping_complete  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active                   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by                  TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_menu_category_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_category_id        TEXT,
  external_category_name      TEXT,
  internal_category_id        UUID,
  internal_category_name      TEXT,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_menu_item_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_item_id            TEXT,
  external_item_name          TEXT,
  internal_item_id            UUID,
  internal_item_name          TEXT,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_modifier_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_modifier_id        TEXT,
  external_modifier_name      TEXT,
  internal_modifier_id        UUID,
  internal_modifier_name      TEXT,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_tax_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_tax_id             TEXT,
  external_tax_name           TEXT,
  internal_tax_id             UUID,
  internal_tax_name           TEXT,
  tax_rate                    NUMERIC(5,4),
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_tip_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_tip_id             TEXT,
  external_tip_name           TEXT,
  internal_tip_id             UUID,
  tip_type                    TEXT,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_payment_type_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_payment_type_id    TEXT,
  external_payment_type_name  TEXT,
  internal_payment_type_id    UUID,
  internal_payment_type_name  TEXT,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_staff_role_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_role_id            TEXT,
  external_role_name          TEXT,
  internal_role_id            UUID,
  internal_role_name          TEXT,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_table_section_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_section_id         TEXT,
  external_section_name       TEXT,
  internal_section_id         UUID,
  internal_section_name       TEXT,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_revenue_center_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_center_id          TEXT,
  external_center_name        TEXT,
  internal_center_id          UUID,
  internal_center_name        TEXT,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_department_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_dept_id            TEXT,
  external_dept_name          TEXT,
  internal_dept_id            UUID,
  internal_dept_name          TEXT,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_inventory_signal_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_signal_id          TEXT,
  external_signal_name        TEXT,
  internal_signal_id          UUID,
  signal_type                 TEXT,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_humidor_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_humidor_id         TEXT,
  external_humidor_name       TEXT,
  internal_humidor_id         UUID,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_bar_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_bar_id             TEXT,
  external_bar_name           TEXT,
  internal_bar_id             UUID,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_kitchen_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_kitchen_id         TEXT,
  external_kitchen_name       TEXT,
  internal_kitchen_id         UUID,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_order_flow_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_flow_id            TEXT,
  external_flow_name          TEXT,
  internal_flow_id            UUID,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_ticket_flow_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_ticket_id          TEXT,
  external_ticket_name        TEXT,
  internal_ticket_id          UUID,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_closeout_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_closeout_id        TEXT,
  external_closeout_name      TEXT,
  internal_closeout_id        UUID,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_report_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  provider_key                TEXT NOT NULL,
  external_report_id          TEXT,
  external_report_name        TEXT,
  internal_report_id          UUID,
  mapping_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_api_contract_registry (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  api_contract_status         TEXT NOT NULL DEFAULT 'not_started',
  api_version                 TEXT,
  contract_notes              TEXT,
  api_sync_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  partner_approved            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_webhook_registry (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  webhook_url                 TEXT,
  webhook_status              TEXT NOT NULL DEFAULT 'not_configured',
  webhook_enabled             BOOLEAN NOT NULL DEFAULT FALSE,
  stores_webhook_secret       BOOLEAN NOT NULL DEFAULT FALSE,
  last_delivery_at            TIMESTAMPTZ,
  last_delivery_status        TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_webhook_health (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_registry_id         UUID,
  provider_key                TEXT NOT NULL,
  health_status               TEXT NOT NULL DEFAULT 'unknown',
  last_checked_at             TIMESTAMPTZ,
  success_count               INTEGER DEFAULT 0,
  failure_count               INTEGER DEFAULT 0,
  last_error                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_live_mode_requests (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  request_status              TEXT NOT NULL DEFAULT 'pending' CHECK (request_status IN ('pending','approved','denied','cancelled')),
  requested_by                TEXT,
  requested_at                TIMESTAMPTZ DEFAULT NOW(),
  request_reason              TEXT,
  approved_by                 TEXT,
  approved_at                 TIMESTAMPTZ,
  denied_by                   TEXT,
  denied_at                   TIMESTAMPTZ,
  denial_reason               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_live_mode_approvals (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id                  UUID NOT NULL,
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  approval_status             TEXT NOT NULL DEFAULT 'pending',
  approved_by                 TEXT,
  approved_at                 TIMESTAMPTZ,
  approval_notes              TEXT,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_environment_locks (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  lock_status                 TEXT NOT NULL DEFAULT 'locked' CHECK (lock_status IN ('locked','unlock_requested','unlock_approved','unlocked')),
  lock_reason                 TEXT NOT NULL DEFAULT 'Phase D.3 activation required before live mode',
  locked_by                   TEXT,
  unlocked_by                 TEXT,
  unlocked_at                 TIMESTAMPTZ,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_tenant_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL,
  provider_key                TEXT NOT NULL,
  tenant_pos_account_ref      TEXT,
  mapping_status              TEXT NOT NULL DEFAULT 'not_started',
  is_active                   BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_module_mapping (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key                  TEXT NOT NULL,
  provider_key                TEXT NOT NULL,
  tenant_id                   UUID,
  mapping_status              TEXT NOT NULL DEFAULT 'not_started',
  is_active                   BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_compliance_checklist (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT,
  tenant_id                   UUID,
  checklist_item              TEXT NOT NULL,
  item_status                 TEXT NOT NULL DEFAULT 'pending' CHECK (item_status IN ('pending','in_progress','completed','waived','blocked')),
  completed_by                TEXT,
  completed_at                TIMESTAMPTZ,
  notes                       TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_risk_flags (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT,
  tenant_id                   UUID,
  flag_type                   TEXT NOT NULL,
  flag_severity               TEXT NOT NULL DEFAULT 'info' CHECK (flag_severity IN ('info','warning','critical','blocking')),
  flag_description            TEXT NOT NULL,
  is_resolved                 BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by                 TEXT,
  resolved_at                 TIMESTAMPTZ,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_pos_activation_audit (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                TEXT,
  tenant_id                   UUID,
  event_type                  TEXT NOT NULL,
  event_description           TEXT,
  event_data                  JSONB DEFAULT '{}',
  actor_id                    TEXT,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ext_pos_provider_registry_key   ON external_pos_provider_registry (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_provider_status_key     ON external_pos_provider_status (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_cred_status_key         ON external_pos_credentials_status (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_mode_registry_key       ON external_pos_mode_registry (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_companion_key           ON external_pos_companion_mode_profiles (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_import_profiles_key     ON external_pos_import_profiles (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_import_batches_key      ON external_pos_import_batches (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_manual_mapping_key      ON external_pos_manual_mapping_profiles (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_menu_cat_key            ON external_pos_menu_category_mapping (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_menu_item_key           ON external_pos_menu_item_mapping (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_api_contract_key        ON external_pos_api_contract_registry (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_webhook_key             ON external_pos_webhook_registry (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_live_req_key            ON external_pos_live_mode_requests (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_env_locks_key           ON external_pos_environment_locks (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_audit_key               ON external_pos_activation_audit (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_audit_tenant            ON external_pos_activation_audit (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ext_pos_compliance_key          ON external_pos_compliance_checklist (provider_key);
CREATE INDEX IF NOT EXISTS idx_ext_pos_risk_flags_key          ON external_pos_risk_flags (provider_key);
