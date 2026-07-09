-- Phase E.7: NOVEE OS Onboarding + Training Center
-- BUILD ONLY — manual publication, completion tracking, and remote distribution
-- unlock all disabled by default

CREATE TABLE IF NOT EXISTS novee_os_onboarding_program_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  program_key TEXT NOT NULL UNIQUE,
  program_name TEXT NOT NULL,
  program_type TEXT NOT NULL DEFAULT 'admin_onboarding',
  audience_role TEXT NOT NULL DEFAULT 'admin',
  module_scope_json JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  published BOOLEAN NOT NULL DEFAULT FALSE,
  required_for_pilot BOOLEAN NOT NULL DEFAULT FALSE,
  required_for_remote_distribution BOOLEAN NOT NULL DEFAULT FALSE,
  required_for_go_live BOOLEAN NOT NULL DEFAULT FALSE,
  safe_claim TEXT NOT NULL DEFAULT 'onboarding_program_record_exists',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_training_manual_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  manual_key TEXT NOT NULL UNIQUE,
  manual_title TEXT NOT NULL,
  manual_type TEXT NOT NULL DEFAULT 'admin_guide',
  audience_role TEXT NOT NULL DEFAULT 'admin',
  module_key TEXT,
  version_label TEXT NOT NULL DEFAULT '0.1.0-draft',
  status TEXT NOT NULL DEFAULT 'draft',
  published BOOLEAN NOT NULL DEFAULT FALSE,
  content_summary TEXT,
  full_content_required BOOLEAN NOT NULL DEFAULT TRUE,
  safe_claim TEXT NOT NULL DEFAULT 'training_manual_record_exists',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_training_lesson_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  manual_id UUID REFERENCES novee_os_training_manual_registry(id),
  program_id UUID REFERENCES novee_os_onboarding_program_registry(id),
  lesson_key TEXT NOT NULL UNIQUE,
  lesson_title TEXT NOT NULL,
  lesson_category TEXT NOT NULL DEFAULT 'platform_overview',
  audience_role TEXT NOT NULL DEFAULT 'admin',
  module_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'draft',
  estimated_minutes INTEGER NOT NULL DEFAULT 15,
  safe_claim TEXT NOT NULL DEFAULT 'training_lesson_record_exists',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_onboarding_checklist_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  program_id UUID REFERENCES novee_os_onboarding_program_registry(id),
  checklist_key TEXT NOT NULL,
  checklist_title TEXT NOT NULL,
  checklist_category TEXT NOT NULL DEFAULT 'general',
  owner_role TEXT NOT NULL DEFAULT 'admin',
  required BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'not_started',
  blocker_reason TEXT,
  evidence_required BOOLEAN NOT NULL DEFAULT FALSE,
  evidence_present BOOLEAN NOT NULL DEFAULT FALSE,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  safe_claim TEXT NOT NULL DEFAULT 'onboarding_checklist_item_exists',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_training_progress_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  program_id UUID REFERENCES novee_os_onboarding_program_registry(id),
  lesson_id UUID REFERENCES novee_os_training_lesson_registry(id),
  trainee_reference_only TEXT,
  trainee_role TEXT NOT NULL DEFAULT 'staff',
  progress_status TEXT NOT NULL DEFAULT 'not_started',
  completion_status TEXT NOT NULL DEFAULT 'incomplete',
  evidence_required BOOLEAN NOT NULL DEFAULT FALSE,
  evidence_present BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  safe_claim TEXT NOT NULL DEFAULT 'training_progress_record_exists',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_training_evidence_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  program_id UUID REFERENCES novee_os_onboarding_program_registry(id),
  lesson_id UUID REFERENCES novee_os_training_lesson_registry(id),
  evidence_type TEXT NOT NULL DEFAULT 'manual',
  evidence_title TEXT NOT NULL,
  evidence_status TEXT NOT NULL DEFAULT 'pending',
  source TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_onboarding_acceptance_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  program_id UUID REFERENCES novee_os_onboarding_program_registry(id),
  acceptance_type TEXT NOT NULL DEFAULT 'admin_acknowledgment',
  accepted_by_reference_only TEXT,
  accepted_by_role TEXT NOT NULL DEFAULT 'admin',
  acceptance_status TEXT NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  evidence_reference TEXT,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_onboarding_audit_log (
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
