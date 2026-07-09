-- 045_pos360_external_integrations_sync_governance.sql
-- Phase B.15 Prompt AB: POS360 External Integrations, POS Overlay Connectors,
-- Provider Contracts, Webhooks & Sync Governance
-- CREATE TABLE IF NOT EXISTS only — safe, additive migration. No destructive changes.

CREATE TABLE IF NOT EXISTS pos360_external_provider_profiles (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  provider_key          TEXT NOT NULL,
  provider_name         TEXT NOT NULL,
  provider_type         TEXT NOT NULL DEFAULT 'pos' CHECK (provider_type IN ('pos','payments','accounting','payroll','reservations','email','sms','printer','kitchen_display','inventory_vendor','ecommerce','bi','eat','smokecraft','other')),
  provider_status       TEXT NOT NULL DEFAULT 'not_connected' CHECK (provider_status IN ('not_connected','configured_placeholder','connected_external','disabled','error')),
  provider_connected    BOOLEAN NOT NULL DEFAULT FALSE,
  capability_payload    JSONB,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  stores_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata              JSONB,
  created_by            TEXT,
  updated_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_pos_overlay_connectors (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  provider_profile_id   BIGINT,
  connector_name        TEXT NOT NULL,
  connector_type        TEXT NOT NULL DEFAULT 'manual_csv' CHECK (connector_type IN ('sales_export','item_mix','closeout_report','payment_summary','inventory_import','customer_import','staff_import','menu_import','order_status_import','manual_csv','api_placeholder','webhook_placeholder','other')),
  overlay_mode          TEXT NOT NULL DEFAULT 'manual' CHECK (overlay_mode IN ('companion','export_import','api_contract','webhook_contract','manual','unavailable')),
  connector_status      TEXT NOT NULL DEFAULT 'draft' CHECK (connector_status IN ('draft','configured_placeholder','active_placeholder','connected_external','disabled','error')),
  connector_connected   BOOLEAN NOT NULL DEFAULT FALSE,
  source_system         TEXT,
  target_system         TEXT,
  metadata              JSONB,
  created_by            TEXT,
  updated_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_provider_capability_registry (
  id                       BIGSERIAL PRIMARY KEY,
  venue_id                 TEXT,
  provider_profile_id      BIGINT,
  provider_key             TEXT NOT NULL,
  capability_key           TEXT NOT NULL,
  capability_group         TEXT NOT NULL DEFAULT 'orders' CHECK (capability_group IN ('orders','payments','inventory','customers','loyalty','staff','reservations','reports','webhooks','exports','imports','accounting','payroll','custom')),
  supported_status         TEXT NOT NULL DEFAULT 'unknown' CHECK (supported_status IN ('unknown','not_supported','supported_placeholder','supported_external')),
  requires_credentials     BOOLEAN NOT NULL DEFAULT TRUE,
  requires_webhook         BOOLEAN NOT NULL DEFAULT FALSE,
  requires_manual_review   BOOLEAN NOT NULL DEFAULT FALSE,
  capability_notes         TEXT,
  created_by               TEXT,
  idempotency_key          TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_provider_readiness_results (
  id                      BIGSERIAL PRIMARY KEY,
  venue_id                TEXT NOT NULL,
  provider_profile_id     BIGINT,
  provider_key            TEXT NOT NULL,
  readiness_type          TEXT NOT NULL DEFAULT 'configuration',
  readiness_status        TEXT NOT NULL DEFAULT 'not_checked',
  check_payload           JSONB,
  checked_by              TEXT,
  checked_at              TIMESTAMPTZ,
  contains_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  created_by              TEXT,
  idempotency_key         TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_integration_credential_metadata (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  provider_profile_id   BIGINT NOT NULL,
  credential_type       TEXT NOT NULL DEFAULT 'api_key_reference' CHECK (credential_type IN ('api_key_reference','oauth_reference','webhook_secret_reference','sftp_reference','manual_external','other')),
  credential_status     TEXT NOT NULL DEFAULT 'not_configured' CHECK (credential_status IN ('not_configured','configured_placeholder','connected_external','disabled','error')),
  credential_reference  TEXT,
  stores_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  last_rotated_at       TIMESTAMPTZ,
  created_by            TEXT,
  updated_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_webhook_endpoint_contracts (
  id                       BIGSERIAL PRIMARY KEY,
  venue_id                 TEXT NOT NULL,
  provider_profile_id      BIGINT,
  endpoint_name            TEXT NOT NULL,
  webhook_type             TEXT NOT NULL DEFAULT 'orders' CHECK (webhook_type IN ('orders','payments','inventory','customers','staff','reservations','menu','reports','custom')),
  endpoint_status          TEXT NOT NULL DEFAULT 'draft' CHECK (endpoint_status IN ('draft','configured_placeholder','active_placeholder','connected_external','disabled','error')),
  signature_required       BOOLEAN NOT NULL DEFAULT TRUE,
  signature_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  expected_event_types     JSONB,
  metadata                 JSONB,
  created_by               TEXT,
  updated_by               TEXT,
  idempotency_key          TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_webhook_event_intake_log (
  id                       BIGSERIAL PRIMARY KEY,
  venue_id                 TEXT NOT NULL,
  webhook_endpoint_id      BIGINT,
  provider_profile_id      BIGINT,
  event_type               TEXT NOT NULL,
  event_status             TEXT NOT NULL DEFAULT 'received_placeholder' CHECK (event_status IN ('received_placeholder','rejected_unverified','processed_placeholder','failed','ignored')),
  signature_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  raw_payload_reference    TEXT,
  normalized_payload       JSONB,
  processing_notes         TEXT,
  exposes_private_data     BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data   BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key          TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_sync_job_definitions (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  connector_id          BIGINT,
  provider_profile_id   BIGINT,
  sync_name             TEXT NOT NULL,
  sync_type             TEXT NOT NULL DEFAULT 'import' CHECK (sync_type IN ('import','export','bidirectional_placeholder','reconciliation','manual','webhook','custom')),
  source_system         TEXT,
  target_system         TEXT,
  module_key            TEXT,
  sync_status           TEXT NOT NULL DEFAULT 'draft' CHECK (sync_status IN ('draft','enabled_placeholder','paused','disabled','unavailable')),
  schedule_payload      JSONB,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            TEXT,
  updated_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_sync_job_runs (
  id                         BIGSERIAL PRIMARY KEY,
  venue_id                   TEXT NOT NULL,
  sync_job_id                BIGINT NOT NULL,
  run_status                 TEXT NOT NULL DEFAULT 'queued' CHECK (run_status IN ('queued','running_placeholder','succeeded_external','failed_external','paused','disabled','unavailable')),
  started_at                 TIMESTAMPTZ,
  finished_at                TIMESTAMPTZ,
  records_seen_count         INTEGER NOT NULL DEFAULT 0,
  records_imported_count     INTEGER NOT NULL DEFAULT 0,
  records_exported_count     INTEGER NOT NULL DEFAULT 0,
  records_failed_count       INTEGER NOT NULL DEFAULT 0,
  sync_completed             BOOLEAN NOT NULL DEFAULT FALSE,
  run_payload                JSONB,
  created_by                 TEXT,
  idempotency_key            TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_sync_retry_policies (
  id                   BIGSERIAL PRIMARY KEY,
  venue_id             TEXT NOT NULL,
  sync_job_id          BIGINT,
  retry_strategy       TEXT NOT NULL DEFAULT 'manual' CHECK (retry_strategy IN ('none','manual','fixed_delay_placeholder','exponential_placeholder','external')),
  max_retries          INTEGER NOT NULL DEFAULT 3,
  retry_delay_seconds  INTEGER NOT NULL DEFAULT 60,
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_by           TEXT,
  idempotency_key      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_sync_error_logs (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  sync_run_id           BIGINT,
  sync_job_id           BIGINT,
  error_code            TEXT,
  error_message         TEXT,
  entity_type           TEXT,
  entity_id             TEXT,
  error_payload         JSONB,
  resolved              BOOLEAN NOT NULL DEFAULT FALSE,
  created_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_sync_conflict_records (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  sync_run_id           BIGINT,
  entity_type           TEXT NOT NULL,
  entity_id             TEXT,
  external_reference    TEXT,
  conflict_type         TEXT NOT NULL DEFAULT 'data_mismatch' CHECK (conflict_type IN ('duplicate','mapping_missing','data_mismatch','stale_record','permission_blocked','validation_failed','other')),
  conflict_status       TEXT NOT NULL DEFAULT 'open' CHECK (conflict_status IN ('open','under_review','resolved_placeholder','ignored','failed')),
  conflict_payload      JSONB,
  resolution_notes      TEXT,
  reviewed_by           TEXT,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_sync_reconciliation_records (
  id                          BIGSERIAL PRIMARY KEY,
  venue_id                    TEXT NOT NULL,
  sync_run_id                 BIGINT,
  reconciliation_type         TEXT NOT NULL DEFAULT 'orders' CHECK (reconciliation_type IN ('payments','orders','inventory','customers','staff','reservations','reports','accounting','custom')),
  reconciliation_status       TEXT NOT NULL DEFAULT 'draft' CHECK (reconciliation_status IN ('draft','in_review','reconciled_placeholder','failed','unavailable')),
  source_total                NUMERIC,
  target_total                NUMERIC,
  difference_amount           NUMERIC,
  reconciliation_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  reconciliation_payload      JSONB,
  reviewed_by                 TEXT,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by                  TEXT,
  idempotency_key             TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_data_mapping_profiles (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  connector_id          BIGINT,
  provider_profile_id   BIGINT,
  profile_name          TEXT NOT NULL,
  source_system         TEXT,
  target_system         TEXT,
  entity_type           TEXT NOT NULL DEFAULT 'menu_items' CHECK (entity_type IN ('menu_items','modifiers','taxes','tenders','staff','customers','loyalty','inventory','vendors','orders','payments','reservations','reports','custom')),
  mapping_status        TEXT NOT NULL DEFAULT 'draft' CHECK (mapping_status IN ('draft','active_placeholder','disabled','error')),
  metadata              JSONB,
  created_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_data_mapping_rules (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  mapping_profile_id    BIGINT NOT NULL,
  source_field          TEXT NOT NULL,
  target_field          TEXT NOT NULL,
  transform_type        TEXT NOT NULL DEFAULT 'none' CHECK (transform_type IN ('none','rename','normalize','lookup','split','combine','custom_placeholder')),
  transform_payload     JSONB,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_import_batch_records (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  connector_id          BIGINT,
  provider_profile_id   BIGINT,
  import_type           TEXT NOT NULL DEFAULT 'csv' CHECK (import_type IN ('csv','json','api_placeholder','sftp_placeholder','webhook','manual_upload','external_connector','other')),
  import_status         TEXT NOT NULL DEFAULT 'queued' CHECK (import_status IN ('queued','parsed_placeholder','imported_placeholder','failed','cancelled','unavailable')),
  import_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  source_reference      TEXT,
  records_total         INTEGER NOT NULL DEFAULT 0,
  records_accepted      INTEGER NOT NULL DEFAULT 0,
  records_rejected      INTEGER NOT NULL DEFAULT 0,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_import_batch_items (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  import_batch_id       BIGINT NOT NULL,
  item_status           TEXT NOT NULL DEFAULT 'queued',
  raw_payload           JSONB,
  mapped_payload        JSONB,
  rejection_reason      TEXT,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_export_batch_records (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  connector_id          BIGINT,
  provider_profile_id   BIGINT,
  export_type           TEXT NOT NULL DEFAULT 'csv' CHECK (export_type IN ('csv','json','api_placeholder','sftp_placeholder','webhook','manual_download','external_connector','other')),
  export_status         TEXT NOT NULL DEFAULT 'requested' CHECK (export_status IN ('requested','generated_placeholder','ready_placeholder','sent_external','failed_external','unavailable')),
  export_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  target_reference      TEXT,
  records_total         INTEGER NOT NULL DEFAULT 0,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_export_batch_items (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  export_batch_id       BIGINT NOT NULL,
  item_status           TEXT NOT NULL DEFAULT 'queued',
  raw_payload           JSONB,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_data_lineage_records (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  entity_type           TEXT NOT NULL,
  entity_id             TEXT,
  source_system         TEXT NOT NULL,
  target_system         TEXT NOT NULL,
  provider_profile_id   BIGINT,
  sync_run_id           BIGINT,
  lineage_status        TEXT NOT NULL DEFAULT 'recorded_placeholder' CHECK (lineage_status IN ('recorded_placeholder','linked_external','failed','unavailable')),
  lineage_payload       JSONB,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_eat_sync_visibility_records (
  id                          BIGSERIAL PRIMARY KEY,
  venue_id                    TEXT NOT NULL,
  provider_profile_id         BIGINT,
  sync_run_id                 BIGINT,
  visibility_type             TEXT NOT NULL DEFAULT 'sync_status',
  visibility_payload          JSONB,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  honest_state                TEXT NOT NULL DEFAULT 'placeholder',
  created_by                  TEXT,
  idempotency_key             TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_smokecraft_sync_visibility_records (
  id                    BIGSERIAL PRIMARY KEY,
  venue_id              TEXT NOT NULL,
  provider_profile_id   BIGINT,
  sync_run_id           BIGINT,
  visibility_type       TEXT NOT NULL DEFAULT 'guest_link',
  visibility_payload    JSONB,
  sync_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  honest_state          TEXT NOT NULL DEFAULT 'placeholder',
  created_by            TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_integration_offline_queue (
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
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_integration_audit (
  id                      BIGSERIAL PRIMARY KEY,
  venue_id                TEXT NOT NULL,
  actor_user_id           TEXT,
  action                  TEXT NOT NULL,
  entity_type             TEXT NOT NULL,
  entity_id               TEXT,
  before_snapshot         JSONB,
  after_snapshot          JSONB,
  reason                  TEXT,
  contains_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data    BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pos360_ext_providers_venue_id ON pos360_external_provider_profiles (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_ext_providers_provider_key ON pos360_external_provider_profiles (provider_key);
CREATE INDEX IF NOT EXISTS idx_pos360_ext_providers_provider_type ON pos360_external_provider_profiles (provider_type);
CREATE INDEX IF NOT EXISTS idx_pos360_ext_providers_status ON pos360_external_provider_profiles (provider_status);
CREATE INDEX IF NOT EXISTS idx_pos360_pos_overlay_connectors_venue_id ON pos360_pos_overlay_connectors (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_pos_overlay_connectors_connector_type ON pos360_pos_overlay_connectors (connector_type);
CREATE INDEX IF NOT EXISTS idx_pos360_pos_overlay_connectors_status ON pos360_pos_overlay_connectors (connector_status);
CREATE INDEX IF NOT EXISTS idx_pos360_provider_capability_registry_venue_id ON pos360_provider_capability_registry (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_provider_capability_registry_provider_key ON pos360_provider_capability_registry (provider_key);
CREATE INDEX IF NOT EXISTS idx_pos360_provider_readiness_results_venue_id ON pos360_provider_readiness_results (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_integration_credential_metadata_venue_id ON pos360_integration_credential_metadata (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_integration_credential_metadata_provider ON pos360_integration_credential_metadata (provider_profile_id);
CREATE INDEX IF NOT EXISTS idx_pos360_webhook_endpoint_contracts_venue_id ON pos360_webhook_endpoint_contracts (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_webhook_event_intake_log_venue_id ON pos360_webhook_event_intake_log (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_webhook_event_intake_log_status ON pos360_webhook_event_intake_log (event_status);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_job_definitions_venue_id ON pos360_sync_job_definitions (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_job_definitions_module_key ON pos360_sync_job_definitions (module_key);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_job_runs_venue_id ON pos360_sync_job_runs (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_job_runs_sync_job_id ON pos360_sync_job_runs (sync_job_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_job_runs_status ON pos360_sync_job_runs (run_status);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_retry_policies_venue_id ON pos360_sync_retry_policies (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_error_logs_venue_id ON pos360_sync_error_logs (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_error_logs_sync_run_id ON pos360_sync_error_logs (sync_run_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_conflict_records_venue_id ON pos360_sync_conflict_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_conflict_records_status ON pos360_sync_conflict_records (conflict_status);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_reconciliation_records_venue_id ON pos360_sync_reconciliation_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_reconciliation_records_status ON pos360_sync_reconciliation_records (reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_pos360_data_mapping_profiles_venue_id ON pos360_data_mapping_profiles (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_data_mapping_rules_venue_id ON pos360_data_mapping_rules (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_data_mapping_rules_mapping_profile_id ON pos360_data_mapping_rules (mapping_profile_id);
CREATE INDEX IF NOT EXISTS idx_pos360_import_batch_records_venue_id ON pos360_import_batch_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_import_batch_records_status ON pos360_import_batch_records (import_status);
CREATE INDEX IF NOT EXISTS idx_pos360_import_batch_items_venue_id ON pos360_import_batch_items (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_import_batch_items_import_batch_id ON pos360_import_batch_items (import_batch_id);
CREATE INDEX IF NOT EXISTS idx_pos360_export_batch_records_venue_id ON pos360_export_batch_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_export_batch_records_status ON pos360_export_batch_records (export_status);
CREATE INDEX IF NOT EXISTS idx_pos360_export_batch_items_venue_id ON pos360_export_batch_items (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_export_batch_items_export_batch_id ON pos360_export_batch_items (export_batch_id);
CREATE INDEX IF NOT EXISTS idx_pos360_data_lineage_records_venue_id ON pos360_data_lineage_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_data_lineage_records_entity_type ON pos360_data_lineage_records (entity_type);
CREATE INDEX IF NOT EXISTS idx_pos360_eat_sync_visibility_venue_id ON pos360_eat_sync_visibility_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_smokecraft_sync_visibility_venue_id ON pos360_smokecraft_sync_visibility_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_integration_offline_queue_venue_id ON pos360_integration_offline_queue (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_integration_offline_queue_sync_status ON pos360_integration_offline_queue (sync_status);
CREATE INDEX IF NOT EXISTS idx_pos360_integration_audit_venue_id ON pos360_integration_audit (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_integration_audit_entity_type ON pos360_integration_audit (entity_type);
CREATE INDEX IF NOT EXISTS idx_pos360_integration_audit_created_at ON pos360_integration_audit (created_at);
