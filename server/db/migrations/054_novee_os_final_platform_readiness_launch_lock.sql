-- Safe migration: no destructive DDL, no truncation
-- Phase C.7 Module 7 of 7 — NOVEE OS Final Platform Readiness, Platform Audit, Marketplace Prep & Launch Lock
-- contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets

CREATE TABLE IF NOT EXISTS novee_os_final_readiness_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  session_name TEXT,
  phase_key TEXT DEFAULT 'c7_final_launch_lock',
  readiness_status TEXT NOT NULL DEFAULT 'not_checked' CHECK (readiness_status IN (
    'not_checked','foundation_ready','contract_ready','placeholder_ready',
    'configuration_required','provider_activation_required','license_required',
    'billing_required','security_required','deployment_required',
    'blocked','not_live','live_external','unavailable'
  )),
  launch_status TEXT NOT NULL DEFAULT 'not_started' CHECK (launch_status IN (
    'not_started','foundation_locked','launch_blocked','activation_required',
    'production_placeholder','production_live_external','unavailable'
  )),
  metadata JSONB,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  contract_ready BOOLEAN NOT NULL DEFAULT FALSE,
  placeholder_ready BOOLEAN NOT NULL DEFAULT FALSE,
  production_live BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_final_readiness_sessions_org ON novee_os_final_readiness_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_final_readiness_sessions_venue ON novee_os_final_readiness_sessions(venue_id);
CREATE INDEX IF NOT EXISTS idx_final_readiness_sessions_status ON novee_os_final_readiness_sessions(readiness_status);
CREATE INDEX IF NOT EXISTS idx_final_readiness_sessions_launch ON novee_os_final_readiness_sessions(launch_status);
CREATE INDEX IF NOT EXISTS idx_final_readiness_sessions_ikey ON novee_os_final_readiness_sessions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_final_readiness_sessions_created ON novee_os_final_readiness_sessions(created_at);

CREATE TABLE IF NOT EXISTS novee_os_final_readiness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  readiness_session_id UUID,
  organization_id UUID,
  venue_id UUID,
  phase_key TEXT,
  module_key TEXT,
  check_key TEXT NOT NULL,
  check_category TEXT,
  check_description TEXT,
  readiness_status TEXT NOT NULL DEFAULT 'not_checked' CHECK (readiness_status IN (
    'not_checked','foundation_ready','contract_ready','placeholder_ready',
    'configuration_required','provider_activation_required','license_required',
    'billing_required','security_required','deployment_required',
    'blocked','not_live','live_external','unavailable'
  )),
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  contract_ready BOOLEAN NOT NULL DEFAULT FALSE,
  placeholder_ready BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_final_checks_session ON novee_os_final_readiness_checks(readiness_session_id);
CREATE INDEX IF NOT EXISTS idx_final_checks_phase ON novee_os_final_readiness_checks(phase_key);
CREATE INDEX IF NOT EXISTS idx_final_checks_module ON novee_os_final_readiness_checks(module_key);
CREATE INDEX IF NOT EXISTS idx_final_checks_key ON novee_os_final_readiness_checks(check_key);
CREATE INDEX IF NOT EXISTS idx_final_checks_status ON novee_os_final_readiness_checks(readiness_status);
CREATE INDEX IF NOT EXISTS idx_final_checks_ikey ON novee_os_final_readiness_checks(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_final_readiness_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  readiness_session_id UUID,
  check_id UUID,
  organization_id UUID,
  venue_id UUID,
  phase_key TEXT,
  module_key TEXT,
  check_key TEXT,
  result_status TEXT NOT NULL DEFAULT 'not_checked' CHECK (result_status IN (
    'not_checked','foundation_ready','contract_ready','placeholder_ready',
    'configuration_required','provider_activation_required','license_required',
    'billing_required','security_required','deployment_required',
    'blocked','not_live','live_external','unavailable'
  )),
  result_message TEXT,
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_final_results_session ON novee_os_final_readiness_results(readiness_session_id);
CREATE INDEX IF NOT EXISTS idx_final_results_phase ON novee_os_final_readiness_results(phase_key);
CREATE INDEX IF NOT EXISTS idx_final_results_status ON novee_os_final_readiness_results(result_status);
CREATE INDEX IF NOT EXISTS idx_final_results_ikey ON novee_os_final_readiness_results(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_final_results_created ON novee_os_final_readiness_results(created_at);

CREATE TABLE IF NOT EXISTS novee_os_platform_audit_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  category_key TEXT NOT NULL,
  category_name TEXT,
  description TEXT,
  audit_status TEXT NOT NULL DEFAULT 'not_started' CHECK (audit_status IN (
    'not_started','in_progress','passed_placeholder','failed','review_required','unavailable'
  )),
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_categories_key ON novee_os_platform_audit_categories(category_key);
CREATE INDEX IF NOT EXISTS idx_audit_categories_status ON novee_os_platform_audit_categories(audit_status);
CREATE INDEX IF NOT EXISTS idx_audit_categories_ikey ON novee_os_platform_audit_categories(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_platform_audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_category_id UUID,
  organization_id UUID,
  venue_id UUID,
  phase_key TEXT,
  module_key TEXT,
  check_key TEXT,
  finding_key TEXT,
  finding_title TEXT,
  finding_description TEXT,
  audit_status TEXT NOT NULL DEFAULT 'not_started' CHECK (audit_status IN (
    'not_started','in_progress','passed_placeholder','failed','review_required','unavailable'
  )),
  readiness_status TEXT NOT NULL DEFAULT 'not_checked',
  severity TEXT DEFAULT 'informational',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_findings_category ON novee_os_platform_audit_findings(audit_category_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_phase ON novee_os_platform_audit_findings(phase_key);
CREATE INDEX IF NOT EXISTS idx_audit_findings_module ON novee_os_platform_audit_findings(module_key);
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON novee_os_platform_audit_findings(audit_status);
CREATE INDEX IF NOT EXISTS idx_audit_findings_ikey ON novee_os_platform_audit_findings(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_platform_launch_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  phase_key TEXT,
  module_key TEXT,
  blocker_key TEXT NOT NULL,
  blocker_title TEXT,
  blocker_description TEXT,
  blocker_status TEXT NOT NULL DEFAULT 'open' CHECK (blocker_status IN (
    'open','acknowledged','resolved_placeholder','resolved_external','waived_placeholder','unavailable'
  )),
  actor_user_id TEXT,
  metadata JSONB,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_launch_blockers_org ON novee_os_platform_launch_blockers(organization_id);
CREATE INDEX IF NOT EXISTS idx_launch_blockers_phase ON novee_os_platform_launch_blockers(phase_key);
CREATE INDEX IF NOT EXISTS idx_launch_blockers_key ON novee_os_platform_launch_blockers(blocker_key);
CREATE INDEX IF NOT EXISTS idx_launch_blockers_status ON novee_os_platform_launch_blockers(blocker_status);
CREATE INDEX IF NOT EXISTS idx_launch_blockers_ikey ON novee_os_platform_launch_blockers(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_platform_activation_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  phase_key TEXT,
  module_key TEXT,
  requirement_key TEXT NOT NULL,
  requirement_title TEXT,
  requirement_description TEXT,
  activation_status TEXT NOT NULL DEFAULT 'not_active' CHECK (activation_status IN (
    'not_active','activation_required','active_placeholder','active_external','blocked','unavailable'
  )),
  actor_user_id TEXT,
  metadata JSONB,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activation_req_org ON novee_os_platform_activation_requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_activation_req_key ON novee_os_platform_activation_requirements(requirement_key);
CREATE INDEX IF NOT EXISTS idx_activation_req_status ON novee_os_platform_activation_requirements(activation_status);
CREATE INDEX IF NOT EXISTS idx_activation_req_ikey ON novee_os_platform_activation_requirements(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_platform_marketplace_prep_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  marketplace_key TEXT NOT NULL,
  prep_status TEXT NOT NULL DEFAULT 'not_checked',
  readiness_status TEXT NOT NULL DEFAULT 'placeholder_ready',
  actor_user_id TEXT,
  metadata JSONB,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  placeholder_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_prep_org ON novee_os_platform_marketplace_prep_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_prep_key ON novee_os_platform_marketplace_prep_records(marketplace_key);
CREATE INDEX IF NOT EXISTS idx_marketplace_prep_ikey ON novee_os_platform_marketplace_prep_records(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_marketplace_listing_placeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  marketplace_key TEXT NOT NULL,
  module_key TEXT,
  listing_title TEXT,
  listing_description TEXT,
  readiness_status TEXT NOT NULL DEFAULT 'placeholder_ready',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  placeholder_ready BOOLEAN NOT NULL DEFAULT FALSE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_listing_key ON novee_os_marketplace_listing_placeholders(marketplace_key);
CREATE INDEX IF NOT EXISTS idx_marketplace_listing_module ON novee_os_marketplace_listing_placeholders(module_key);
CREATE INDEX IF NOT EXISTS idx_marketplace_listing_ikey ON novee_os_marketplace_listing_placeholders(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_marketplace_purchase_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  marketplace_key TEXT NOT NULL,
  module_key TEXT,
  readiness_status TEXT NOT NULL DEFAULT 'placeholder_ready',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_purchase_org ON novee_os_marketplace_purchase_readiness(organization_id);
CREATE INDEX IF NOT EXISTS idx_mkt_purchase_key ON novee_os_marketplace_purchase_readiness(marketplace_key);
CREATE INDEX IF NOT EXISTS idx_mkt_purchase_ikey ON novee_os_marketplace_purchase_readiness(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_provider_activation_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  provider_key TEXT NOT NULL,
  module_key TEXT,
  readiness_status TEXT NOT NULL DEFAULT 'provider_activation_required',
  activation_status TEXT NOT NULL DEFAULT 'not_active' CHECK (activation_status IN (
    'not_active','activation_required','active_placeholder','active_external','blocked','unavailable'
  )),
  actor_user_id TEXT,
  metadata JSONB,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_activation_org ON novee_os_provider_activation_readiness(organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_activation_key ON novee_os_provider_activation_readiness(provider_key);
CREATE INDEX IF NOT EXISTS idx_provider_activation_status ON novee_os_provider_activation_readiness(activation_status);
CREATE INDEX IF NOT EXISTS idx_provider_activation_ikey ON novee_os_provider_activation_readiness(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_deployment_readiness_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  deployment_key TEXT NOT NULL,
  module_key TEXT,
  readiness_status TEXT NOT NULL DEFAULT 'deployment_required',
  actor_user_id TEXT,
  metadata JSONB,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  deployment_completed BOOLEAN NOT NULL DEFAULT FALSE,
  production_live BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_certified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployment_readiness_org ON novee_os_deployment_readiness_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_deployment_readiness_key ON novee_os_deployment_readiness_records(deployment_key);
CREATE INDEX IF NOT EXISTS idx_deployment_readiness_ikey ON novee_os_deployment_readiness_records(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_demo_live_readiness_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  module_key TEXT,
  demo_live_mode TEXT NOT NULL DEFAULT 'demo' CHECK (demo_live_mode IN (
    'demo','local_preview','staging_placeholder','production_placeholder','live_external','unavailable'
  )),
  readiness_status TEXT NOT NULL DEFAULT 'not_checked',
  actor_user_id TEXT,
  metadata JSONB,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  production_live BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_live_readiness_org ON novee_os_demo_live_readiness_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_demo_live_readiness_mode ON novee_os_demo_live_readiness_records(demo_live_mode);
CREATE INDEX IF NOT EXISTS idx_demo_live_readiness_ikey ON novee_os_demo_live_readiness_records(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_safe_sales_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  claim_key TEXT NOT NULL,
  claim_title TEXT,
  claim_text TEXT,
  claim_status TEXT NOT NULL DEFAULT 'safe' CHECK (claim_status IN (
    'safe','unsafe','conditional','not_allowed','unavailable'
  )),
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT FALSE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  placeholder_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safe_claims_key ON novee_os_safe_sales_claims(claim_key);
CREATE INDEX IF NOT EXISTS idx_safe_claims_status ON novee_os_safe_sales_claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_safe_claims_ikey ON novee_os_safe_sales_claims(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_unsafe_sales_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  claim_key TEXT NOT NULL,
  claim_title TEXT,
  claim_text TEXT,
  claim_status TEXT NOT NULL DEFAULT 'unsafe' CHECK (claim_status IN (
    'safe','unsafe','conditional','not_allowed','unavailable'
  )),
  reason_unsafe TEXT,
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT FALSE,
  production_live BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unsafe_claims_key ON novee_os_unsafe_sales_claims(claim_key);
CREATE INDEX IF NOT EXISTS idx_unsafe_claims_status ON novee_os_unsafe_sales_claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_unsafe_claims_ikey ON novee_os_unsafe_sales_claims(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_foundation_lock_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  phase_key TEXT NOT NULL,
  module_key TEXT,
  lock_title TEXT,
  lock_description TEXT,
  launch_status TEXT NOT NULL DEFAULT 'foundation_locked' CHECK (launch_status IN (
    'not_started','foundation_locked','launch_blocked','activation_required',
    'production_placeholder','production_live_external','unavailable'
  )),
  readiness_status TEXT NOT NULL DEFAULT 'foundation_ready',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  contract_ready BOOLEAN NOT NULL DEFAULT FALSE,
  placeholder_ready BOOLEAN NOT NULL DEFAULT FALSE,
  production_live BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foundation_lock_phase ON novee_os_foundation_lock_records(phase_key);
CREATE INDEX IF NOT EXISTS idx_foundation_lock_status ON novee_os_foundation_lock_records(launch_status);
CREATE INDEX IF NOT EXISTS idx_foundation_lock_ikey ON novee_os_foundation_lock_records(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_phase_completion_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  phase_key TEXT NOT NULL,
  module_key TEXT,
  phase_name TEXT,
  module_number TEXT,
  total_modules TEXT,
  completion_status TEXT NOT NULL DEFAULT 'complete',
  commit_hash TEXT,
  verification_count INTEGER DEFAULT 0,
  build_status TEXT,
  api_route TEXT,
  ui_route TEXT,
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT FALSE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  contract_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phase_completion_phase ON novee_os_phase_completion_records(phase_key);
CREATE INDEX IF NOT EXISTS idx_phase_completion_status ON novee_os_phase_completion_records(completion_status);
CREATE INDEX IF NOT EXISTS idx_phase_completion_ikey ON novee_os_phase_completion_records(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_module_readiness_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  phase_key TEXT,
  module_key TEXT NOT NULL,
  module_name TEXT,
  readiness_status TEXT NOT NULL DEFAULT 'not_checked',
  launch_status TEXT NOT NULL DEFAULT 'not_started',
  actor_user_id TEXT,
  notes TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  contract_ready BOOLEAN NOT NULL DEFAULT FALSE,
  placeholder_ready BOOLEAN NOT NULL DEFAULT FALSE,
  production_live BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_certified BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_matrix_module ON novee_os_module_readiness_matrix(module_key);
CREATE INDEX IF NOT EXISTS idx_module_matrix_phase ON novee_os_module_readiness_matrix(phase_key);
CREATE INDEX IF NOT EXISTS idx_module_matrix_status ON novee_os_module_readiness_matrix(readiness_status);
CREATE INDEX IF NOT EXISTS idx_module_matrix_ikey ON novee_os_module_readiness_matrix(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_documentation_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  phase_key TEXT,
  module_key TEXT,
  route_path TEXT,
  ui_route TEXT,
  doc_title TEXT,
  readiness_status TEXT NOT NULL DEFAULT 'foundation_ready',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT FALSE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_readiness_phase ON novee_os_documentation_readiness(phase_key);
CREATE INDEX IF NOT EXISTS idx_doc_readiness_route ON novee_os_documentation_readiness(route_path);
CREATE INDEX IF NOT EXISTS idx_doc_readiness_ikey ON novee_os_documentation_readiness(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_verification_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  phase_key TEXT,
  module_key TEXT,
  script_name TEXT,
  check_count INTEGER DEFAULT 0,
  passed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  readiness_status TEXT NOT NULL DEFAULT 'foundation_ready',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT FALSE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_readiness_phase ON novee_os_verification_readiness(phase_key);
CREATE INDEX IF NOT EXISTS idx_verification_readiness_ikey ON novee_os_verification_readiness(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_build_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  phase_key TEXT,
  build_status TEXT NOT NULL DEFAULT 'clean',
  build_tool TEXT DEFAULT 'vite',
  readiness_status TEXT NOT NULL DEFAULT 'foundation_ready',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT FALSE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_build_readiness_phase ON novee_os_build_readiness(phase_key);
CREATE INDEX IF NOT EXISTS idx_build_readiness_ikey ON novee_os_build_readiness(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_route_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  phase_key TEXT,
  module_key TEXT,
  route_path TEXT NOT NULL,
  route_type TEXT DEFAULT 'api',
  readiness_status TEXT NOT NULL DEFAULT 'foundation_ready',
  guard_required BOOLEAN NOT NULL DEFAULT TRUE,
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_readiness_phase ON novee_os_route_readiness(phase_key);
CREATE INDEX IF NOT EXISTS idx_route_readiness_path ON novee_os_route_readiness(route_path);
CREATE INDEX IF NOT EXISTS idx_route_readiness_ikey ON novee_os_route_readiness(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_ui_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  phase_key TEXT,
  module_key TEXT,
  ui_route TEXT NOT NULL,
  component_name TEXT,
  readiness_status TEXT NOT NULL DEFAULT 'foundation_ready',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ui_readiness_phase ON novee_os_ui_readiness(phase_key);
CREATE INDEX IF NOT EXISTS idx_ui_readiness_route ON novee_os_ui_readiness(ui_route);
CREATE INDEX IF NOT EXISTS idx_ui_readiness_ikey ON novee_os_ui_readiness(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_governance_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  phase_key TEXT,
  module_key TEXT,
  governance_area TEXT NOT NULL,
  readiness_status TEXT NOT NULL DEFAULT 'foundation_ready',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  contract_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_governance_readiness_phase ON novee_os_governance_readiness(phase_key);
CREATE INDEX IF NOT EXISTS idx_governance_readiness_area ON novee_os_governance_readiness(governance_area);
CREATE INDEX IF NOT EXISTS idx_governance_readiness_ikey ON novee_os_governance_readiness(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_security_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  phase_key TEXT,
  module_key TEXT,
  security_area TEXT NOT NULL,
  readiness_status TEXT NOT NULL DEFAULT 'security_required',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_certified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_readiness_phase ON novee_os_security_readiness(phase_key);
CREATE INDEX IF NOT EXISTS idx_security_readiness_area ON novee_os_security_readiness(security_area);
CREATE INDEX IF NOT EXISTS idx_security_readiness_ikey ON novee_os_security_readiness(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_billing_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  phase_key TEXT,
  module_key TEXT,
  billing_area TEXT NOT NULL,
  readiness_status TEXT NOT NULL DEFAULT 'billing_required',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_readiness_phase ON novee_os_billing_readiness(phase_key);
CREATE INDEX IF NOT EXISTS idx_billing_readiness_area ON novee_os_billing_readiness(billing_area);
CREATE INDEX IF NOT EXISTS idx_billing_readiness_ikey ON novee_os_billing_readiness(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_integration_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  phase_key TEXT,
  module_key TEXT,
  provider_key TEXT,
  integration_area TEXT NOT NULL,
  readiness_status TEXT NOT NULL DEFAULT 'provider_activation_required',
  activation_status TEXT NOT NULL DEFAULT 'not_active',
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_readiness_phase ON novee_os_integration_readiness(phase_key);
CREATE INDEX IF NOT EXISTS idx_integration_readiness_provider ON novee_os_integration_readiness(provider_key);
CREATE INDEX IF NOT EXISTS idx_integration_readiness_ikey ON novee_os_integration_readiness(idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_final_launch_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  snapshot_label TEXT,
  phase_key TEXT DEFAULT 'c7_final_launch_lock',
  launch_status TEXT NOT NULL DEFAULT 'foundation_locked',
  readiness_status TEXT NOT NULL DEFAULT 'foundation_ready',
  snapshot_data JSONB,
  actor_user_id TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  foundation_ready BOOLEAN NOT NULL DEFAULT FALSE,
  contract_ready BOOLEAN NOT NULL DEFAULT FALSE,
  placeholder_ready BOOLEAN NOT NULL DEFAULT FALSE,
  production_live BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_certified BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_final_snapshots_org ON novee_os_final_launch_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_final_snapshots_status ON novee_os_final_launch_snapshots(launch_status);
CREATE INDEX IF NOT EXISTS idx_final_snapshots_ikey ON novee_os_final_launch_snapshots(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_final_snapshots_created ON novee_os_final_launch_snapshots(created_at);

CREATE TABLE IF NOT EXISTS novee_os_final_launch_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  before_snapshot JSONB,
  after_snapshot JSONB,
  reason TEXT,
  ip_address TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_final_audit_org ON novee_os_final_launch_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_final_audit_actor ON novee_os_final_launch_audit(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_final_audit_action ON novee_os_final_launch_audit(action);
CREATE INDEX IF NOT EXISTS idx_final_audit_entity ON novee_os_final_launch_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_final_audit_created ON novee_os_final_launch_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_final_audit_ikey ON novee_os_final_launch_audit(idempotency_key);
