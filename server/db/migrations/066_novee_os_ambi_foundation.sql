-- Phase E.8: NOVEE OS AMBI Foundation
-- SOFTWARE FOUNDATION ONLY — no live hardware, no telemetry, no device control

CREATE TABLE IF NOT EXISTS novee_os_ambi_device_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  device_key TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'unknown',
  device_status TEXT NOT NULL DEFAULT 'draft',
  hardware_ready BOOLEAN NOT NULL DEFAULT FALSE,
  software_ready BOOLEAN NOT NULL DEFAULT FALSE,
  connected BOOLEAN NOT NULL DEFAULT FALSE,
  live_telemetry_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  live_control_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  consent_required BOOLEAN NOT NULL DEFAULT TRUE,
  safe_claim TEXT NOT NULL DEFAULT 'ambi_device_record_exists',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_ambi_device_pairing_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  ambi_device_id UUID REFERENCES novee_os_ambi_device_registry(id),
  pairing_status TEXT NOT NULL DEFAULT 'not_started',
  pairing_mode TEXT NOT NULL DEFAULT 'manual',
  pairing_reference_only TEXT,
  pairing_token_reference_only TEXT,
  paired_by_reference_only TEXT,
  paired_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  live_pairing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  safe_claim TEXT NOT NULL DEFAULT 'ambi_pairing_record_exists',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_ambi_firmware_readiness_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  ambi_device_id UUID REFERENCES novee_os_ambi_device_registry(id),
  firmware_version_label TEXT NOT NULL DEFAULT '0.0.0-preview',
  firmware_status TEXT NOT NULL DEFAULT 'draft',
  update_available BOOLEAN NOT NULL DEFAULT FALSE,
  update_required BOOLEAN NOT NULL DEFAULT FALSE,
  update_tested BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_available BOOLEAN NOT NULL DEFAULT FALSE,
  live_update_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  safe_claim TEXT NOT NULL DEFAULT 'ambi_firmware_record_exists',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_ambi_hardware_provider_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  provider_key TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'internal_demo',
  provider_status TEXT NOT NULL DEFAULT 'draft',
  configured BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  live_connection_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  credential_reference_only TEXT,
  safe_claim TEXT NOT NULL DEFAULT 'ambi_hardware_provider_record_exists',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_ambi_aura_state_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  aura_key TEXT NOT NULL UNIQUE,
  aura_name TEXT NOT NULL,
  aura_category TEXT NOT NULL DEFAULT 'custom',
  state_status TEXT NOT NULL DEFAULT 'draft',
  active BOOLEAN NOT NULL DEFAULT FALSE,
  preview_only BOOLEAN NOT NULL DEFAULT TRUE,
  live_automation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  required_consent BOOLEAN NOT NULL DEFAULT TRUE,
  safe_claim TEXT NOT NULL DEFAULT 'ambi_aura_state_record_exists',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_ambi_environment_signal_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  signal_key TEXT NOT NULL UNIQUE,
  signal_name TEXT NOT NULL,
  signal_type TEXT NOT NULL DEFAULT 'unknown',
  signal_status TEXT NOT NULL DEFAULT 'draft',
  source_type TEXT NOT NULL DEFAULT 'manual',
  live_ingestion_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  simulated BOOLEAN NOT NULL DEFAULT TRUE,
  consent_required BOOLEAN NOT NULL DEFAULT TRUE,
  safe_claim TEXT NOT NULL DEFAULT 'ambi_environment_signal_record_exists',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_ambi_privacy_consent_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  subject_reference_only TEXT,
  consent_type TEXT NOT NULL DEFAULT 'data_privacy_acknowledgment',
  consent_status TEXT NOT NULL DEFAULT 'pending',
  consent_scope_json JSONB NOT NULL DEFAULT '[]',
  required_for_feature TEXT,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  evidence_reference TEXT,
  safe_claim TEXT NOT NULL DEFAULT 'ambi_consent_record_exists',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_ambi_presence_access_event_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  subject_reference_only TEXT,
  event_type TEXT NOT NULL DEFAULT 'manual_check_in',
  event_status TEXT NOT NULL DEFAULT 'pending',
  source_type TEXT NOT NULL DEFAULT 'manual',
  consent_status TEXT NOT NULL DEFAULT 'pending',
  live_tracking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  simulated BOOLEAN NOT NULL DEFAULT TRUE,
  safe_claim TEXT NOT NULL DEFAULT 'ambi_presence_event_record_exists',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_ambi_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  actor_id TEXT NOT NULL DEFAULT 'system',
  actor_role TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'general',
  severity TEXT NOT NULL DEFAULT 'info',
  summary TEXT NOT NULL,
  metadata_json JSONB,
  ip_address TEXT,
  user_agent TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
