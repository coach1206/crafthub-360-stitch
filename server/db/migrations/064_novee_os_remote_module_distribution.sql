-- Phase E.6: NOVEE OS Remote Module Distribution System
-- BUILD ONLY — live remote delivery, client provisioning, invite links,
-- license validation, remote activation, and rollback execution all disabled by default

CREATE TABLE IF NOT EXISTS novee_os_module_deployment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  package_key TEXT NOT NULL UNIQUE,
  package_name TEXT NOT NULL,
  package_type TEXT NOT NULL DEFAULT 'preview_bundle',
  module_keys_json JSONB NOT NULL DEFAULT '[]',
  version_label TEXT NOT NULL DEFAULT '0.0.1-preview',
  package_status TEXT NOT NULL DEFAULT 'draft',
  security_gate_status TEXT NOT NULL DEFAULT 'not_verified',
  deployment_gate_status TEXT NOT NULL DEFAULT 'not_verified',
  pilot_gate_status TEXT NOT NULL DEFAULT 'not_verified',
  remote_distribution_ready BOOLEAN NOT NULL DEFAULT FALSE,
  remote_distribution_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  production_ready BOOLEAN NOT NULL DEFAULT FALSE,
  safe_claim TEXT NOT NULL DEFAULT 'module_deployment_package_record_exists',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_client_provisioning_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  client_name TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'venue',
  venue_name TEXT,
  venue_type TEXT,
  requested_modules_json JSONB NOT NULL DEFAULT '[]',
  approved_modules_json JSONB NOT NULL DEFAULT '[]',
  provisioning_status TEXT NOT NULL DEFAULT 'pending',
  requested_by TEXT,
  approved_by TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  blocker_reason TEXT,
  safe_claim TEXT NOT NULL DEFAULT 'client_provisioning_request_record_exists',
  idempotency_key TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_invite_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  provisioning_request_id UUID REFERENCES novee_os_client_provisioning_requests(id),
  invite_code_reference TEXT,
  invite_status TEXT NOT NULL DEFAULT 'draft',
  invite_type TEXT NOT NULL DEFAULT 'pilot',
  target_email_reference_only TEXT,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  accepted_by_reference_only TEXT,
  module_scope_json JSONB NOT NULL DEFAULT '[]',
  onboarding_scope_json JSONB NOT NULL DEFAULT '[]',
  remote_activation_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  safe_claim TEXT NOT NULL DEFAULT 'invite_session_record_exists',
  idempotency_key TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_license_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  provisioning_request_id UUID REFERENCES novee_os_client_provisioning_requests(id),
  license_key_reference TEXT,
  license_type TEXT NOT NULL DEFAULT 'pilot',
  license_status TEXT NOT NULL DEFAULT 'draft',
  module_scope_json JSONB NOT NULL DEFAULT '[]',
  seat_limit INTEGER NOT NULL DEFAULT 0,
  venue_limit INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  validation_status TEXT NOT NULL DEFAULT 'not_validated',
  activated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  safe_claim TEXT NOT NULL DEFAULT 'license_key_record_exists',
  idempotency_key TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_module_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  provisioning_request_id UUID REFERENCES novee_os_client_provisioning_requests(id),
  module_key TEXT NOT NULL,
  module_name TEXT NOT NULL,
  module_status TEXT NOT NULL DEFAULT 'not_activated',
  activation_status TEXT NOT NULL DEFAULT 'pending',
  activation_mode TEXT NOT NULL DEFAULT 'preview',
  activated_for_client BOOLEAN NOT NULL DEFAULT FALSE,
  activated_for_pilot BOOLEAN NOT NULL DEFAULT FALSE,
  activated_for_production BOOLEAN NOT NULL DEFAULT FALSE,
  remote_activation_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  security_gate_status TEXT NOT NULL DEFAULT 'not_verified',
  deployment_gate_status TEXT NOT NULL DEFAULT 'not_verified',
  pilot_gate_status TEXT NOT NULL DEFAULT 'not_verified',
  safe_claim TEXT NOT NULL DEFAULT 'module_activation_record_exists',
  idempotency_key TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_deployment_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  package_id UUID REFERENCES novee_os_module_deployment_packages(id),
  version_label TEXT NOT NULL,
  version_status TEXT NOT NULL DEFAULT 'draft',
  changelog_summary TEXT,
  module_versions_json JSONB NOT NULL DEFAULT '{}',
  security_verified BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_verified BOOLEAN NOT NULL DEFAULT FALSE,
  pilot_verified BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_available BOOLEAN NOT NULL DEFAULT FALSE,
  production_ready BOOLEAN NOT NULL DEFAULT FALSE,
  safe_claim TEXT NOT NULL DEFAULT 'deployment_version_record_exists',
  idempotency_key TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_rollback_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  package_id UUID REFERENCES novee_os_module_deployment_packages(id),
  deployment_version_id UUID REFERENCES novee_os_deployment_versions(id),
  rollback_target_version TEXT,
  rollback_status TEXT NOT NULL DEFAULT 'not_initiated',
  rollback_available BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_execution_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_tested BOOLEAN NOT NULL DEFAULT FALSE,
  blocker_reason TEXT,
  safe_claim TEXT NOT NULL DEFAULT 'rollback_record_exists',
  idempotency_key TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_remote_distribution_audit_log (
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
