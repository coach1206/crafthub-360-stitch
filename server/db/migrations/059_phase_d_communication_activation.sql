-- Migration 059: Phase D.5 Communication Activation Contracts
-- Safe migration: no destructive DDL, no truncation
-- contains_secrets: false, stores_secrets: false
-- All real delivery / auto-send booleans DEFAULT FALSE
-- All enforcement flags DEFAULT TRUE

CREATE TABLE IF NOT EXISTS communication_provider_registry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  provider_key     TEXT NOT NULL,
  provider_label   TEXT NOT NULL,
  provider_type    TEXT NOT NULL DEFAULT 'external',
  supported_channels TEXT[],
  companion_mode   BOOLEAN NOT NULL DEFAULT FALSE,
  connected        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets   BOOLEAN NOT NULL DEFAULT FALSE,
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_provider_status (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  provider_key     TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'not_started',
  connected        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_provider_credentials_status (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID,
  provider_key         TEXT NOT NULL,
  credential_presence  TEXT NOT NULL DEFAULT 'absent',
  contains_secrets     BOOLEAN NOT NULL DEFAULT FALSE,
  stores_raw_keys      BOOLEAN NOT NULL DEFAULT FALSE,
  notes                TEXT,
  idempotency_key      TEXT UNIQUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_channel_registry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  channel_key      TEXT NOT NULL,
  channel_label    TEXT NOT NULL,
  channel_type     TEXT NOT NULL DEFAULT 'digital',
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  real_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_area_registry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  area_key         TEXT NOT NULL,
  area_label       TEXT NOT NULL,
  channel_keys     TEXT[],
  sort_order       INTEGER NOT NULL DEFAULT 0,
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_area_status (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID,
  area_key              TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'setup_required',
  real_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  auto_send_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  notes                 TEXT,
  idempotency_key       TEXT UNIQUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_template_registry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  template_key     TEXT NOT NULL,
  template_label   TEXT NOT NULL,
  area_key         TEXT NOT NULL,
  channel_key      TEXT NOT NULL,
  template_type    TEXT NOT NULL DEFAULT 'transactional',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  approved         BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_template_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  template_id      UUID NOT NULL,
  version_number   INTEGER NOT NULL DEFAULT 1,
  subject_line     TEXT,
  body_text        TEXT,
  body_html        TEXT,
  is_current       BOOLEAN NOT NULL DEFAULT FALSE,
  approved         BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_template_locale_variants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  template_id      UUID NOT NULL,
  version_id       UUID,
  locale_key       TEXT NOT NULL,
  subject_line     TEXT,
  body_text        TEXT,
  body_html        TEXT,
  approved         BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_template_approval_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  template_id      UUID NOT NULL,
  version_id       UUID,
  requested_by     TEXT,
  request_status   TEXT NOT NULL DEFAULT 'pending',
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_template_approval_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  request_id       UUID NOT NULL,
  template_id      UUID NOT NULL,
  approved_by      TEXT,
  approved_at      TIMESTAMPTZ,
  approval_status  TEXT NOT NULL DEFAULT 'pending',
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_message_preview_records (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID,
  area_key           TEXT NOT NULL,
  channel_key        TEXT NOT NULL,
  provider_key       TEXT,
  template_id        UUID,
  recipient_preview  TEXT,
  subject_preview    TEXT,
  body_preview       TEXT,
  is_real_message    BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_attempted BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key    TEXT UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_message_queue_preview (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID,
  area_key              TEXT NOT NULL,
  channel_key           TEXT NOT NULL,
  provider_key          TEXT,
  queue_label           TEXT,
  estimated_recipients  INTEGER,
  is_real_queue         BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  queued_for_send       BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key       TEXT UNIQUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_delivery_attempt_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT NOT NULL,
  channel_key       TEXT NOT NULL,
  provider_key      TEXT,
  message_id        UUID,
  recipient_ref     TEXT,
  preview_only      BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_status   TEXT NOT NULL DEFAULT 'preview_only',
  real_delivery_attempted BOOLEAN NOT NULL DEFAULT FALSE,
  provider_response TEXT,
  error_message     TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_delivery_status_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  attempt_id        UUID,
  channel_key       TEXT NOT NULL,
  provider_key      TEXT,
  status_code       TEXT NOT NULL DEFAULT 'preview_only',
  delivered         BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  provider_message_id TEXT,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_recipient_group_registry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  group_key        TEXT NOT NULL,
  group_label      TEXT NOT NULL,
  area_key         TEXT,
  channel_keys     TEXT[],
  member_count     INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_recipient_group_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  group_id         UUID NOT NULL,
  member_ref       TEXT NOT NULL,
  member_type      TEXT NOT NULL DEFAULT 'user',
  opt_in_status    TEXT NOT NULL DEFAULT 'unknown',
  channel_key      TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_staff_alert_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_manager_alert_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_guest_message_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  requires_opt_in  BOOLEAN NOT NULL DEFAULT TRUE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_vendor_message_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_inventory_alert_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  requires_real_inventory_data BOOLEAN NOT NULL DEFAULT TRUE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_payment_alert_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_pos_order_alert_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_reservation_alert_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_loyalty_message_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  requires_opt_in  BOOLEAN NOT NULL DEFAULT TRUE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_passport_message_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  requires_opt_in  BOOLEAN NOT NULL DEFAULT TRUE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_smokecraft_message_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  requires_opt_in  BOOLEAN NOT NULL DEFAULT TRUE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_crafthub_message_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_eat_command_alert_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_security_alert_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_system_health_alert_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_marketplace_message_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  requires_opt_in  BOOLEAN NOT NULL DEFAULT TRUE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_campaign_message_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  requires_opt_in  BOOLEAN NOT NULL DEFAULT TRUE,
  approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  approved         BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_manual_message_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_key      TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  channel_keys     TEXT[],
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_opt_in_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  area_key         TEXT,
  channel_key      TEXT NOT NULL,
  recipient_ref    TEXT,
  opt_in_status    TEXT NOT NULL DEFAULT 'unknown',
  opt_in_at        TIMESTAMPTZ,
  opt_in_method    TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_opt_out_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  area_key         TEXT,
  channel_key      TEXT NOT NULL,
  recipient_ref    TEXT,
  opt_out_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opt_out_reason   TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_rate_limit_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  area_key         TEXT,
  channel_key      TEXT NOT NULL,
  max_per_hour     INTEGER NOT NULL DEFAULT 0,
  max_per_day      INTEGER NOT NULL DEFAULT 0,
  max_per_week     INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_quiet_hour_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  area_key         TEXT,
  channel_key      TEXT NOT NULL,
  quiet_start_hour INTEGER NOT NULL DEFAULT 22,
  quiet_end_hour   INTEGER NOT NULL DEFAULT 8,
  timezone         TEXT NOT NULL DEFAULT 'America/New_York',
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_webhook_registry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  provider_key     TEXT NOT NULL,
  endpoint_label   TEXT NOT NULL,
  webhook_status   TEXT NOT NULL DEFAULT 'not_configured',
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets   BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_webhook_health (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  webhook_id       UUID NOT NULL,
  provider_key     TEXT NOT NULL,
  health_status    TEXT NOT NULL DEFAULT 'unknown',
  last_checked_at  TIMESTAMPTZ,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_live_delivery_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT NOT NULL,
  provider_key      TEXT,
  channel_key       TEXT,
  requested_by      TEXT,
  request_status    TEXT NOT NULL DEFAULT 'pending',
  live_delivery_gated BOOLEAN NOT NULL DEFAULT TRUE,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_live_delivery_approvals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID,
  request_id            UUID NOT NULL,
  area_key              TEXT NOT NULL,
  approved_by           TEXT,
  approved_at           TIMESTAMPTZ,
  approval_status       TEXT NOT NULL DEFAULT 'pending',
  live_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notes                 TEXT,
  idempotency_key       TEXT UNIQUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_environment_locks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT NOT NULL,
  lock_type         TEXT NOT NULL DEFAULT 'live_delivery',
  is_locked         BOOLEAN NOT NULL DEFAULT TRUE,
  lock_reason       TEXT NOT NULL DEFAULT 'Phase D.5 activation required before live message delivery',
  unlocked_by       TEXT,
  unlocked_at       TIMESTAMPTZ,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_tenant_mapping (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL,
  area_key          TEXT NOT NULL,
  module_key        TEXT,
  mapping_status    TEXT NOT NULL DEFAULT 'not_started',
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_module_mapping (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  module_key        TEXT NOT NULL,
  area_key          TEXT NOT NULL,
  mapping_status    TEXT NOT NULL DEFAULT 'not_started',
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_compliance_checklist (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT,
  check_key         TEXT NOT NULL,
  check_label       TEXT NOT NULL,
  check_status      TEXT NOT NULL DEFAULT 'not_started',
  completed_by      TEXT,
  completed_at      TIMESTAMPTZ,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_risk_flags (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT,
  flag_key          TEXT NOT NULL,
  flag_label        TEXT NOT NULL,
  severity          TEXT NOT NULL DEFAULT 'medium',
  flagged_by        TEXT,
  resolved          BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by       TEXT,
  resolved_at       TIMESTAMPTZ,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_activation_audit (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT,
  provider_key      TEXT,
  channel_key       TEXT,
  event_type        TEXT NOT NULL,
  actor_id          TEXT,
  payload_summary   TEXT,
  contains_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supplemental alias tables for service layer compatibility
CREATE TABLE IF NOT EXISTS communication_credential_presence_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  provider_key     TEXT NOT NULL,
  credentials_present  BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_verified BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets     BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets       BOOLEAN NOT NULL DEFAULT FALSE,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_sendgrid_contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  connected        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_mailgun_contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  connected        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_twilio_contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  connected        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_firebase_contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  connected        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_onesignal_contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  connected        BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_manual_email_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  is_real_message  BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_attempted BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  preview_only     BOOLEAN NOT NULL DEFAULT TRUE,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_manual_sms_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  is_real_message  BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_attempted BOOLEAN NOT NULL DEFAULT FALSE,
  real_delivery    BOOLEAN NOT NULL DEFAULT FALSE,
  preview_only     BOOLEAN NOT NULL DEFAULT TRUE,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_template_approvals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  template_id      UUID,
  approval_status  TEXT,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_message_previews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  preview_only     BOOLEAN NOT NULL DEFAULT TRUE,
  is_real_message  BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_attempted BOOLEAN NOT NULL DEFAULT FALSE,
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_queue_previews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  is_real_queue    BOOLEAN NOT NULL DEFAULT FALSE,
  queued_for_send  BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_recipient_groups (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  group_name       TEXT,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_live_delivery_lock (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  real_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  auto_send        BOOLEAN NOT NULL DEFAULT FALSE,
  approved_for_live BOOLEAN NOT NULL DEFAULT FALSE,
  live_delivery_gated  BOOLEAN NOT NULL DEFAULT TRUE,
  environment_lock TEXT NOT NULL DEFAULT 'Phase D.5 activation required before live message delivery',
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_tenant_mappings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  mapping_key      TEXT,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_module_mappings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  module_key       TEXT,
  actor_id         TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
