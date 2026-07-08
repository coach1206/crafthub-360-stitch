-- Phase E.5: NOVEE OS Live Pilot Readiness Center (Phase D.8)
-- BUILD ONLY — no live pilot approval, no remote distribution, no public go-live

CREATE TABLE IF NOT EXISTS novee_os_pilot_venue_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  venue_name TEXT NOT NULL,
  venue_type TEXT NOT NULL DEFAULT 'unknown',
  pilot_status TEXT NOT NULL DEFAULT 'pending',
  pilot_approved BOOLEAN NOT NULL DEFAULT FALSE,
  pilot_approval_date TIMESTAMPTZ,
  pilot_approved_by TEXT,
  pilot_start_date TIMESTAMPTZ,
  pilot_end_date TIMESTAMPTZ,
  go_live_approved BOOLEAN NOT NULL DEFAULT FALSE,
  go_live_date TIMESTAMPTZ,
  remote_distribution_ready BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_live_pilot_readiness_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  gate_key TEXT NOT NULL UNIQUE,
  gate_label TEXT NOT NULL,
  gate_category TEXT NOT NULL DEFAULT 'general',
  gate_status TEXT NOT NULL DEFAULT 'not_started',
  required BOOLEAN NOT NULL DEFAULT TRUE,
  blocking BOOLEAN NOT NULL DEFAULT TRUE,
  pilot_approved BOOLEAN NOT NULL DEFAULT FALSE,
  evidence_ref TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_pilot_module_readiness_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  module_key TEXT NOT NULL UNIQUE,
  module_label TEXT NOT NULL,
  module_family TEXT NOT NULL DEFAULT 'unknown',
  readiness_status TEXT NOT NULL DEFAULT 'not_evaluated',
  pilot_approved BOOLEAN NOT NULL DEFAULT FALSE,
  production_ready BOOLEAN NOT NULL DEFAULT FALSE,
  blocking_issues INTEGER NOT NULL DEFAULT 0,
  last_evaluated_at TIMESTAMPTZ,
  evaluated_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_pilot_checklist_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  checklist_key TEXT NOT NULL,
  checklist_label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_pilot_evidence_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  gate_id UUID REFERENCES novee_os_live_pilot_readiness_gates(id),
  evidence_type TEXT NOT NULL DEFAULT 'manual',
  evidence_label TEXT NOT NULL,
  evidence_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_pilot_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  actor_id TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  payload JSONB,
  ip_address TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_pilot_acceptance_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  venue_id UUID REFERENCES novee_os_pilot_venue_registry(id),
  acceptance_type TEXT NOT NULL DEFAULT 'pilot',
  acceptance_status TEXT NOT NULL DEFAULT 'pending',
  acceptance_approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  live_pilot_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  public_go_live_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  remote_distribution_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
