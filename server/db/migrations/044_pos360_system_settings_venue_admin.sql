-- 044_pos360_system_settings_venue_admin.sql
-- Phase B.14 Prompt AA: POS360 System Settings, Venue Configuration,
-- White-Label Controls, Module Governance & Admin Console
-- CREATE TABLE IF NOT EXISTS only — safe, additive migration. No destructive changes.

CREATE TABLE IF NOT EXISTS pos360_venue_profiles (
  id                     BIGSERIAL PRIMARY KEY,
  venue_id               TEXT NOT NULL,
  venue_name             TEXT NOT NULL,
  legal_business_name    TEXT,
  venue_type             TEXT NOT NULL DEFAULT 'restaurant' CHECK (venue_type IN ('restaurant','lounge','cigar_lounge','bar','club','hotel','event_space','hybrid','other')),
  contact_email          TEXT,
  contact_phone          TEXT,
  website_url            TEXT,
  address_snapshot       JSONB,
  active                 BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_private_data   BOOLEAN NOT NULL DEFAULT TRUE,
  metadata               JSONB,
  created_by             TEXT,
  updated_by             TEXT,
  idempotency_key        TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_venue_regional_settings (
  id                   BIGSERIAL PRIMARY KEY,
  venue_id             TEXT NOT NULL,
  default_locale       TEXT NOT NULL DEFAULT 'en-US',
  supported_locales    JSONB NOT NULL DEFAULT '["en-US"]',
  timezone             TEXT NOT NULL DEFAULT 'UTC',
  currency_code        TEXT NOT NULL DEFAULT 'USD',
  date_format          TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  time_format          TEXT NOT NULL DEFAULT '12h',
  measurement_unit     TEXT NOT NULL DEFAULT 'imperial' CHECK (measurement_unit IN ('imperial','metric','mixed')),
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_by           TEXT,
  updated_by           TEXT,
  idempotency_key      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_venue_operating_rules (
  id                         BIGSERIAL PRIMARY KEY,
  venue_id                   TEXT NOT NULL,
  rule_group                 TEXT NOT NULL DEFAULT 'orders' CHECK (rule_group IN ('orders','payments','tips','reservations','tables','private_events','loyalty','inventory','staff','reports','eat','smokecraft','custom')),
  rule_key                   TEXT NOT NULL,
  rule_payload               JSONB,
  requires_manager_approval  BOOLEAN NOT NULL DEFAULT FALSE,
  active                     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by                 TEXT,
  updated_by                 TEXT,
  idempotency_key            TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_venue_financial_policies (
  id                              BIGSERIAL PRIMARY KEY,
  venue_id                        TEXT NOT NULL,
  policy_group                    TEXT NOT NULL DEFAULT 'tax' CHECK (policy_group IN ('tax','service_charge','gratuity','refunds','voids','comps','house_account','deposits','minimum_spend','accounting','custom')),
  policy_key                      TEXT NOT NULL,
  policy_payload                  JSONB,
  calculation_enabled             BOOLEAN NOT NULL DEFAULT FALSE,
  external_accounting_connected   BOOLEAN NOT NULL DEFAULT FALSE,
  requires_manager_approval       BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data          BOOLEAN NOT NULL DEFAULT TRUE,
  created_by                      TEXT,
  updated_by                      TEXT,
  idempotency_key                 TEXT,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_venue_compliance_settings (
  id                        BIGSERIAL PRIMARY KEY,
  venue_id                  TEXT NOT NULL,
  compliance_group          TEXT NOT NULL DEFAULT 'privacy' CHECK (compliance_group IN ('privacy','pii','financial_data','audit_retention','consent','exports','accessibility','regional','custom')),
  compliance_key            TEXT NOT NULL,
  compliance_payload        JSONB,
  compliance_certified      BOOLEAN NOT NULL DEFAULT FALSE,
  certification_reference   TEXT,
  active                    BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by                TEXT,
  updated_by                TEXT,
  idempotency_key           TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_venue_privacy_notices (
  id                   BIGSERIAL PRIMARY KEY,
  venue_id             TEXT NOT NULL,
  notice_type          TEXT NOT NULL DEFAULT 'privacy_policy',
  notice_title         TEXT NOT NULL,
  notice_body          TEXT,
  locale               TEXT NOT NULL DEFAULT 'en-US',
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by           TEXT,
  idempotency_key      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_white_label_profiles (
  id                      BIGSERIAL PRIMARY KEY,
  venue_id                TEXT NOT NULL,
  brand_name              TEXT NOT NULL,
  display_name            TEXT NOT NULL,
  logo_reference          TEXT,
  favicon_reference       TEXT,
  custom_domain           TEXT,
  custom_domain_status    TEXT NOT NULL DEFAULT 'not_configured' CHECK (custom_domain_status IN ('not_configured','configured_placeholder','connected_external','error','disabled')),
  white_label_status      TEXT NOT NULL DEFAULT 'draft' CHECK (white_label_status IN ('draft','configured_placeholder','active_placeholder','deployed_external','disabled')),
  white_label_deployed    BOOLEAN NOT NULL DEFAULT FALSE,
  legal_footer_text       TEXT,
  receipt_footer_text     TEXT,
  dashboard_title         TEXT,
  exposes_private_data    BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                JSONB,
  created_by              TEXT,
  updated_by              TEXT,
  idempotency_key         TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_white_label_theme_tokens (
  id                      BIGSERIAL PRIMARY KEY,
  venue_id                TEXT NOT NULL,
  white_label_profile_id  BIGINT,
  token_group             TEXT NOT NULL DEFAULT 'colors' CHECK (token_group IN ('colors','typography','spacing','logo','receipt','dashboard','module_names','custom')),
  token_key               TEXT NOT NULL,
  token_value             TEXT NOT NULL,
  active                  BOOLEAN NOT NULL DEFAULT TRUE,
  created_by              TEXT,
  updated_by              TEXT,
  idempotency_key         TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_module_registry (
  id              BIGSERIAL PRIMARY KEY,
  venue_id        TEXT,
  module_key      TEXT NOT NULL CHECK (module_key IN ('customers','loyalty','reservations','event_packages','payments','staff','reports','inventory','eat','smokecraft','pos_overlay','settings','custom')),
  module_name     TEXT NOT NULL,
  module_status   TEXT NOT NULL DEFAULT 'available' CHECK (module_status IN ('available','enabled','disabled','hidden','unavailable','deprecated')),
  system_module   BOOLEAN NOT NULL DEFAULT FALSE,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos360_module_governance_rules (
  id                         BIGSERIAL PRIMARY KEY,
  venue_id                   TEXT NOT NULL,
  module_key                 TEXT NOT NULL,
  governance_key             TEXT NOT NULL,
  governance_payload         JSONB,
  enabled                    BOOLEAN NOT NULL DEFAULT TRUE,
  requires_manager_approval  BOOLEAN NOT NULL DEFAULT FALSE,
  created_by                 TEXT,
  idempotency_key            TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_feature_flag_overrides (
  id                      BIGSERIAL PRIMARY KEY,
  venue_id                TEXT NOT NULL,
  module_key              TEXT NOT NULL,
  flag_key                TEXT NOT NULL,
  flag_value              TEXT NOT NULL,
  override_reason         TEXT,
  override_status         TEXT NOT NULL DEFAULT 'draft' CHECK (override_status IN ('draft','active','disabled','pending_approval','rejected')),
  manager_approved_by     TEXT,
  manager_approved_at     TIMESTAMPTZ,
  created_by              TEXT,
  idempotency_key         TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_integration_status_registry (
  id                      BIGSERIAL PRIMARY KEY,
  venue_id                TEXT NOT NULL,
  provider_key            TEXT NOT NULL,
  provider_type           TEXT NOT NULL DEFAULT 'payments' CHECK (provider_type IN ('payments','payroll','bi','reservations','sms','email','printer','kitchen_display','accounting','inventory_vendor','external_pos','eat','smokecraft','custom')),
  provider_name           TEXT NOT NULL,
  integration_status      TEXT NOT NULL DEFAULT 'not_connected' CHECK (integration_status IN ('not_connected','configured_placeholder','connected_external','disabled','error')),
  integration_connected   BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  capability_payload      JSONB,
  last_checked_at         TIMESTAMPTZ,
  metadata                JSONB,
  created_by              TEXT,
  updated_by              TEXT,
  idempotency_key         TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_provider_readiness_checks (
  id                      BIGSERIAL PRIMARY KEY,
  venue_id                TEXT NOT NULL,
  integration_status_id   BIGINT,
  provider_key            TEXT NOT NULL,
  readiness_type          TEXT NOT NULL DEFAULT 'configuration' CHECK (readiness_type IN ('configuration','credentials','webhook','data_sync','permissions','compliance','custom')),
  readiness_status        TEXT NOT NULL DEFAULT 'not_checked' CHECK (readiness_status IN ('not_checked','ready_placeholder','ready_external','failed','unavailable')),
  check_payload           JSONB,
  checked_by              TEXT,
  checked_at              TIMESTAMPTZ,
  contains_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  created_by              TEXT,
  idempotency_key         TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_admin_console_profiles (
  id              BIGSERIAL PRIMARY KEY,
  venue_id        TEXT NOT NULL,
  admin_user_id   TEXT NOT NULL,
  profile_name    TEXT NOT NULL,
  access_groups   JSONB,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  metadata        JSONB,
  created_by      TEXT,
  idempotency_key TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_admin_settings_views (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  admin_user_id         TEXT NOT NULL,
  setting_group         TEXT NOT NULL,
  viewed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data  BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key       TEXT,
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_settings_change_requests (
  id                   BIGSERIAL PRIMARY KEY,
  venue_id             TEXT NOT NULL,
  setting_group        TEXT NOT NULL,
  setting_key          TEXT NOT NULL,
  entity_type          TEXT NOT NULL,
  entity_id            TEXT,
  previous_snapshot    JSONB,
  requested_snapshot   JSONB,
  change_status        TEXT NOT NULL DEFAULT 'draft' CHECK (change_status IN ('draft','pending_approval','applied','rejected','cancelled')),
  requested_by         TEXT NOT NULL,
  reason               TEXT,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_settings_approval_requests (
  id                       BIGSERIAL PRIMARY KEY,
  venue_id                 TEXT NOT NULL,
  change_request_id        BIGINT,
  protected_setting_type   TEXT NOT NULL DEFAULT 'financial_policy' CHECK (protected_setting_type IN ('financial_policy','tax_setting','refund_void_policy','module_toggle','white_label_identity','data_retention','provider_status','compliance_setting','custom')),
  approval_status          TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected','cancelled')),
  requested_by             TEXT NOT NULL,
  manager_user_id          TEXT,
  decision_reason          TEXT,
  decided_at               TIMESTAMPTZ,
  before_snapshot          JSONB,
  after_snapshot           JSONB,
  exposes_private_data     BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data   BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key          TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_settings_version_history (
  id               BIGSERIAL PRIMARY KEY,
  venue_id         TEXT NOT NULL,
  setting_group    TEXT NOT NULL,
  setting_key      TEXT NOT NULL,
  version_number   INTEGER NOT NULL DEFAULT 1,
  snapshot_payload JSONB,
  changed_by       TEXT NOT NULL,
  change_reason    TEXT,
  rollback_available BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_settings_rollback_records (
  id                  BIGSERIAL PRIMARY KEY,
  venue_id            TEXT NOT NULL,
  version_history_id  BIGINT,
  rollback_status     TEXT NOT NULL DEFAULT 'requested' CHECK (rollback_status IN ('requested','approved','applied','rejected','cancelled')),
  requested_by        TEXT NOT NULL,
  approved_by         TEXT,
  applied_at          TIMESTAMPTZ,
  reason              TEXT,
  idempotency_key     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_settings_export_requests (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  export_type           TEXT NOT NULL DEFAULT 'json' CHECK (export_type IN ('json','csv','pdf_placeholder','print_ready','external_backup','custom')),
  export_status         TEXT NOT NULL DEFAULT 'requested' CHECK (export_status IN ('requested','generated_placeholder','ready_placeholder','sent_external','failed_external','unavailable')),
  export_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  requested_by          TEXT NOT NULL,
  provider_reference    TEXT,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_settings_offline_queue (
  id              BIGSERIAL PRIMARY KEY,
  venue_id        TEXT NOT NULL,
  action_type     TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  payload         JSONB,
  sync_status     TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','failed','cancelled')),
  actor_user_id   TEXT,
  synced_at       TIMESTAMPTZ,
  idempotency_key TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);

CREATE TABLE IF NOT EXISTS pos360_settings_audit (
  id                          BIGSERIAL PRIMARY KEY,
  venue_id                    TEXT NOT NULL,
  actor_user_id               TEXT,
  action                      TEXT NOT NULL,
  entity_type                 TEXT NOT NULL,
  entity_id                   TEXT,
  before_snapshot             JSONB,
  after_snapshot              JSONB,
  reason                      TEXT,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pos360_venue_profiles_venue_id ON pos360_venue_profiles (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_venue_regional_settings_venue_id ON pos360_venue_regional_settings (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_venue_operating_rules_venue_id ON pos360_venue_operating_rules (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_venue_operating_rules_rule_group ON pos360_venue_operating_rules (rule_group);
CREATE INDEX IF NOT EXISTS idx_pos360_venue_financial_policies_venue_id ON pos360_venue_financial_policies (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_venue_financial_policies_policy_group ON pos360_venue_financial_policies (policy_group);
CREATE INDEX IF NOT EXISTS idx_pos360_venue_compliance_settings_venue_id ON pos360_venue_compliance_settings (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_venue_compliance_settings_group ON pos360_venue_compliance_settings (compliance_group);
CREATE INDEX IF NOT EXISTS idx_pos360_venue_privacy_notices_venue_id ON pos360_venue_privacy_notices (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_white_label_profiles_venue_id ON pos360_white_label_profiles (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_white_label_theme_tokens_venue_id ON pos360_white_label_theme_tokens (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_white_label_theme_tokens_group ON pos360_white_label_theme_tokens (token_group);
CREATE INDEX IF NOT EXISTS idx_pos360_module_registry_module_key ON pos360_module_registry (module_key);
CREATE INDEX IF NOT EXISTS idx_pos360_module_registry_venue_id ON pos360_module_registry (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_module_governance_rules_venue_id ON pos360_module_governance_rules (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_module_governance_rules_module_key ON pos360_module_governance_rules (module_key);
CREATE INDEX IF NOT EXISTS idx_pos360_feature_flag_overrides_venue_id ON pos360_feature_flag_overrides (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_feature_flag_overrides_module_key ON pos360_feature_flag_overrides (module_key);
CREATE INDEX IF NOT EXISTS idx_pos360_integration_status_registry_venue_id ON pos360_integration_status_registry (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_integration_status_registry_provider_key ON pos360_integration_status_registry (provider_key);
CREATE INDEX IF NOT EXISTS idx_pos360_integration_status_registry_provider_type ON pos360_integration_status_registry (provider_type);
CREATE INDEX IF NOT EXISTS idx_pos360_integration_status_registry_status ON pos360_integration_status_registry (integration_status);
CREATE INDEX IF NOT EXISTS idx_pos360_provider_readiness_checks_venue_id ON pos360_provider_readiness_checks (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_provider_readiness_checks_provider_key ON pos360_provider_readiness_checks (provider_key);
CREATE INDEX IF NOT EXISTS idx_pos360_admin_console_profiles_venue_id ON pos360_admin_console_profiles (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_admin_settings_views_venue_id ON pos360_admin_settings_views (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_admin_settings_views_admin_user_id ON pos360_admin_settings_views (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_change_requests_venue_id ON pos360_settings_change_requests (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_change_requests_status ON pos360_settings_change_requests (change_status);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_change_requests_setting_group ON pos360_settings_change_requests (setting_group);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_approval_requests_venue_id ON pos360_settings_approval_requests (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_approval_requests_status ON pos360_settings_approval_requests (approval_status);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_version_history_venue_id ON pos360_settings_version_history (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_version_history_setting_group ON pos360_settings_version_history (setting_group);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_rollback_records_venue_id ON pos360_settings_rollback_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_export_requests_venue_id ON pos360_settings_export_requests (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_offline_queue_venue_id ON pos360_settings_offline_queue (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_offline_queue_sync_status ON pos360_settings_offline_queue (sync_status);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_audit_venue_id ON pos360_settings_audit (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_audit_entity_type ON pos360_settings_audit (entity_type);
CREATE INDEX IF NOT EXISTS idx_pos360_settings_audit_created_at ON pos360_settings_audit (created_at);
