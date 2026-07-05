-- Safe migration: no destructive DDL, no truncation
-- Phase C.6 Venue Onboarding Wizard, Setup Checklist, Live/Demo Mode Controls & Readiness Flow
-- 36 tables

CREATE TABLE IF NOT EXISTS crafthub_onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  onboarding_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started','in_progress_placeholder','blocked','complete_placeholder','complete_external','unavailable')),
  current_step_key TEXT,
  steps_completed JSONB DEFAULT '[]',
  steps_total INTEGER DEFAULT 0,
  completion_percent INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  workspace_provisioned BOOLEAN NOT NULL DEFAULT FALSE,
  venue_deployed BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_org ON crafthub_onboarding_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_venue ON crafthub_onboarding_sessions(venue_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_workspace ON crafthub_onboarding_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user ON crafthub_onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_status ON crafthub_onboarding_sessions(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_created ON crafthub_onboarding_sessions(created_at);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  step_key TEXT NOT NULL,
  step_label TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 0,
  step_category TEXT,
  step_description TEXT,
  is_required BOOLEAN DEFAULT TRUE,
  is_skippable BOOLEAN DEFAULT FALSE,
  module_key TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_org ON crafthub_onboarding_steps(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_venue ON crafthub_onboarding_steps(venue_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_step_key ON crafthub_onboarding_steps(step_key);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_module ON crafthub_onboarding_steps(module_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_step_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  onboarding_session_id UUID,
  step_key TEXT NOT NULL,
  step_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (step_status IN ('not_started','in_progress_placeholder','complete_placeholder','blocked','skipped','unavailable')),
  setup_status TEXT DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_step_progress_org ON crafthub_onboarding_step_progress(organization_id);
CREATE INDEX IF NOT EXISTS idx_step_progress_venue ON crafthub_onboarding_step_progress(venue_id);
CREATE INDEX IF NOT EXISTS idx_step_progress_workspace ON crafthub_onboarding_step_progress(workspace_id);
CREATE INDEX IF NOT EXISTS idx_step_progress_user ON crafthub_onboarding_step_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_step_progress_session ON crafthub_onboarding_step_progress(onboarding_session_id);
CREATE INDEX IF NOT EXISTS idx_step_progress_step_key ON crafthub_onboarding_step_progress(step_key);
CREATE INDEX IF NOT EXISTS idx_step_progress_status ON crafthub_onboarding_step_progress(step_status);
CREATE INDEX IF NOT EXISTS idx_step_progress_ikey ON crafthub_onboarding_step_progress(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  checklist_item_key TEXT NOT NULL,
  item_label TEXT NOT NULL,
  item_category TEXT,
  step_key TEXT,
  module_key TEXT,
  item_status TEXT NOT NULL DEFAULT 'not_started',
  setup_status TEXT DEFAULT 'not_started',
  is_required BOOLEAN DEFAULT TRUE,
  is_blocker BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_checklist_org ON crafthub_onboarding_checklist_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_checklist_venue ON crafthub_onboarding_checklist_items(venue_id);
CREATE INDEX IF NOT EXISTS idx_checklist_workspace ON crafthub_onboarding_checklist_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_checklist_user ON crafthub_onboarding_checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item_key ON crafthub_onboarding_checklist_items(checklist_item_key);
CREATE INDEX IF NOT EXISTS idx_checklist_step_key ON crafthub_onboarding_checklist_items(step_key);
CREATE INDEX IF NOT EXISTS idx_checklist_ikey ON crafthub_onboarding_checklist_items(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  blocker_key TEXT NOT NULL,
  blocker_type TEXT NOT NULL,
  blocker_label TEXT NOT NULL,
  blocker_description TEXT,
  step_key TEXT,
  module_key TEXT,
  blocker_status TEXT NOT NULL DEFAULT 'open'
    CHECK (blocker_status IN ('open','acknowledged','resolved_placeholder','resolved_external','waived_placeholder','unavailable')),
  resolution_notes TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_blockers_org ON crafthub_onboarding_blockers(organization_id);
CREATE INDEX IF NOT EXISTS idx_blockers_venue ON crafthub_onboarding_blockers(venue_id);
CREATE INDEX IF NOT EXISTS idx_blockers_workspace ON crafthub_onboarding_blockers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_blockers_blocker_key ON crafthub_onboarding_blockers(blocker_key);
CREATE INDEX IF NOT EXISTS idx_blockers_step_key ON crafthub_onboarding_blockers(step_key);
CREATE INDEX IF NOT EXISTS idx_blockers_status ON crafthub_onboarding_blockers(blocker_status);
CREATE INDEX IF NOT EXISTS idx_blockers_ikey ON crafthub_onboarding_blockers(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_activation_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  requirement_key TEXT NOT NULL,
  requirement_label TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  step_key TEXT,
  module_key TEXT,
  activation_status TEXT NOT NULL DEFAULT 'not_active'
    CHECK (activation_status IN ('not_active','activation_required','active_placeholder','active_external','blocked','unavailable')),
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_act_req_org ON crafthub_onboarding_activation_requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_act_req_venue ON crafthub_onboarding_activation_requirements(venue_id);
CREATE INDEX IF NOT EXISTS idx_act_req_requirement_key ON crafthub_onboarding_activation_requirements(requirement_key);
CREATE INDEX IF NOT EXISTS idx_act_req_step_key ON crafthub_onboarding_activation_requirements(step_key);
CREATE INDEX IF NOT EXISTS idx_act_req_status ON crafthub_onboarding_activation_requirements(activation_status);
CREATE INDEX IF NOT EXISTS idx_act_req_ikey ON crafthub_onboarding_activation_requirements(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_organization_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'organization_setup',
  org_name TEXT,
  org_type TEXT,
  org_country TEXT,
  org_timezone TEXT,
  org_locale TEXT,
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_org_setup_org ON crafthub_onboarding_organization_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_setup_venue ON crafthub_onboarding_organization_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_org_setup_user ON crafthub_onboarding_organization_setup(user_id);
CREATE INDEX IF NOT EXISTS idx_org_setup_step_key ON crafthub_onboarding_organization_setup(step_key);
CREATE INDEX IF NOT EXISTS idx_org_setup_ikey ON crafthub_onboarding_organization_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_venue_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'venue_profile',
  venue_name TEXT,
  venue_type TEXT,
  venue_address TEXT,
  venue_city TEXT,
  venue_country TEXT,
  venue_timezone TEXT,
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  venue_deployed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_venue_setup_org ON crafthub_onboarding_venue_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_venue_setup_venue ON crafthub_onboarding_venue_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_setup_user ON crafthub_onboarding_venue_setup(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_setup_ikey ON crafthub_onboarding_venue_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_workspace_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'workspace_setup',
  workspace_name TEXT,
  workspace_type TEXT,
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  workspace_provisioned BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_ws_setup_org ON crafthub_onboarding_workspace_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_ws_setup_venue ON crafthub_onboarding_workspace_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_ws_setup_workspace ON crafthub_onboarding_workspace_setup(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ws_setup_ikey ON crafthub_onboarding_workspace_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'business_units',
  unit_name TEXT,
  unit_type TEXT,
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_biz_units_org ON crafthub_onboarding_business_units(organization_id);
CREATE INDEX IF NOT EXISTS idx_biz_units_venue ON crafthub_onboarding_business_units(venue_id);
CREATE INDEX IF NOT EXISTS idx_biz_units_workspace ON crafthub_onboarding_business_units(workspace_id);
CREATE INDEX IF NOT EXISTS idx_biz_units_ikey ON crafthub_onboarding_business_units(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'departments',
  department_name TEXT,
  department_type TEXT,
  parent_unit_id UUID,
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_dept_org ON crafthub_onboarding_departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_dept_venue ON crafthub_onboarding_departments(venue_id);
CREATE INDEX IF NOT EXISTS idx_dept_workspace ON crafthub_onboarding_departments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dept_ikey ON crafthub_onboarding_departments(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'locations',
  location_name TEXT,
  location_type TEXT,
  location_address TEXT,
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_loc_org ON crafthub_onboarding_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_loc_venue ON crafthub_onboarding_locations(venue_id);
CREATE INDEX IF NOT EXISTS idx_loc_workspace ON crafthub_onboarding_locations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_loc_ikey ON crafthub_onboarding_locations(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_role_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'roles_permissions',
  role_name TEXT,
  role_type TEXT,
  permissions JSONB DEFAULT '[]',
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_role_setup_org ON crafthub_onboarding_role_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_setup_venue ON crafthub_onboarding_role_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_role_setup_workspace ON crafthub_onboarding_role_setup(workspace_id);
CREATE INDEX IF NOT EXISTS idx_role_setup_ikey ON crafthub_onboarding_role_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'staff_invites',
  invitee_name TEXT,
  invitee_role TEXT,
  invite_status TEXT DEFAULT 'placeholder',
  staff_invite_delivered BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_staff_invite_org ON crafthub_onboarding_staff_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_invite_venue ON crafthub_onboarding_staff_invites(venue_id);
CREATE INDEX IF NOT EXISTS idx_staff_invite_workspace ON crafthub_onboarding_staff_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_staff_invite_ikey ON crafthub_onboarding_staff_invites(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_module_selection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'module_selection',
  module_key TEXT NOT NULL,
  selected BOOLEAN DEFAULT FALSE,
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_mod_sel_org ON crafthub_onboarding_module_selection(organization_id);
CREATE INDEX IF NOT EXISTS idx_mod_sel_venue ON crafthub_onboarding_module_selection(venue_id);
CREATE INDEX IF NOT EXISTS idx_mod_sel_module_key ON crafthub_onboarding_module_selection(module_key);
CREATE INDEX IF NOT EXISTS idx_mod_sel_ikey ON crafthub_onboarding_module_selection(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_module_setup_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  module_key TEXT NOT NULL,
  step_key TEXT,
  setup_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (setup_status IN ('not_started','configuration_required','configured_placeholder','activation_required','active_placeholder','active_external','blocked','unavailable')),
  readiness_status TEXT NOT NULL DEFAULT 'not_ready',
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_mod_status_org ON crafthub_onboarding_module_setup_status(organization_id);
CREATE INDEX IF NOT EXISTS idx_mod_status_venue ON crafthub_onboarding_module_setup_status(venue_id);
CREATE INDEX IF NOT EXISTS idx_mod_status_module_key ON crafthub_onboarding_module_setup_status(module_key);
CREATE INDEX IF NOT EXISTS idx_mod_status_step_key ON crafthub_onboarding_module_setup_status(step_key);
CREATE INDEX IF NOT EXISTS idx_mod_status_setup ON crafthub_onboarding_module_setup_status(setup_status);
CREATE INDEX IF NOT EXISTS idx_mod_status_readiness ON crafthub_onboarding_module_setup_status(readiness_status);
CREATE INDEX IF NOT EXISTS idx_mod_status_ikey ON crafthub_onboarding_module_setup_status(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_pos360_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'pos360_setup',
  module_key TEXT DEFAULT 'pos360',
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_pos360_org ON crafthub_onboarding_pos360_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_pos360_venue ON crafthub_onboarding_pos360_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_module_key ON crafthub_onboarding_pos360_setup(module_key);
CREATE INDEX IF NOT EXISTS idx_pos360_ikey ON crafthub_onboarding_pos360_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_smokecraft_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'smokecraft_setup',
  module_key TEXT DEFAULT 'smokecraft',
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_sc_setup_org ON crafthub_onboarding_smokecraft_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_sc_setup_venue ON crafthub_onboarding_smokecraft_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_sc_setup_module_key ON crafthub_onboarding_smokecraft_setup(module_key);
CREATE INDEX IF NOT EXISTS idx_sc_setup_ikey ON crafthub_onboarding_smokecraft_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_pourcraft_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'pourcraft_setup',
  module_key TEXT DEFAULT 'pourcraft',
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_pc_setup_org ON crafthub_onboarding_pourcraft_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_pc_setup_venue ON crafthub_onboarding_pourcraft_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_pc_setup_ikey ON crafthub_onboarding_pourcraft_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_eat_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'eat_setup',
  module_key TEXT DEFAULT 'eat_system',
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_eat_setup_org ON crafthub_onboarding_eat_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_eat_setup_venue ON crafthub_onboarding_eat_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_eat_setup_ikey ON crafthub_onboarding_eat_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_passport_connections_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'passport_connections_setup',
  module_key TEXT DEFAULT 'passport_connections',
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_passport_setup_org ON crafthub_onboarding_passport_connections_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_passport_setup_venue ON crafthub_onboarding_passport_connections_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_passport_setup_ikey ON crafthub_onboarding_passport_connections_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_loyalty_rewards_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'loyalty_rewards_setup',
  module_key TEXT DEFAULT 'loyalty_rewards',
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  module_activated BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_loyalty_setup_org ON crafthub_onboarding_loyalty_rewards_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_setup_venue ON crafthub_onboarding_loyalty_rewards_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_setup_ikey ON crafthub_onboarding_loyalty_rewards_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_inventory_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'inventory_setup',
  module_key TEXT DEFAULT 'inventory',
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_inv_setup_org ON crafthub_onboarding_inventory_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_inv_setup_venue ON crafthub_onboarding_inventory_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_inv_setup_ikey ON crafthub_onboarding_inventory_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_menu_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'menu_setup',
  module_key TEXT DEFAULT 'menu',
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  module_installed BOOLEAN NOT NULL DEFAULT FALSE,
  menu_import_completed BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_menu_setup_org ON crafthub_onboarding_menu_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_menu_setup_venue ON crafthub_onboarding_menu_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_menu_setup_ikey ON crafthub_onboarding_menu_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_fulfillment_area_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'fulfillment_areas',
  module_key TEXT DEFAULT 'fulfillment',
  area_name TEXT,
  area_type TEXT,
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_fulfillment_org ON crafthub_onboarding_fulfillment_area_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_venue ON crafthub_onboarding_fulfillment_area_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_ikey ON crafthub_onboarding_fulfillment_area_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_table_patio_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'tables_patio',
  module_key TEXT DEFAULT 'tables_patio',
  area_name TEXT,
  table_count INTEGER DEFAULT 0,
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_table_setup_org ON crafthub_onboarding_table_patio_setup(organization_id);
CREATE INDEX IF NOT EXISTS idx_table_setup_venue ON crafthub_onboarding_table_patio_setup(venue_id);
CREATE INDEX IF NOT EXISTS idx_table_setup_ikey ON crafthub_onboarding_table_patio_setup(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_payment_provider_placeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'payment_provider',
  provider_key TEXT NOT NULL,
  provider_name TEXT,
  provider_status TEXT NOT NULL DEFAULT 'not_connected'
    CHECK (provider_status IN ('not_connected','configured_placeholder','connected_external','failed','unavailable')),
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_payment_ph_org ON crafthub_onboarding_payment_provider_placeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_ph_venue ON crafthub_onboarding_payment_provider_placeholders(venue_id);
CREATE INDEX IF NOT EXISTS idx_payment_ph_provider_key ON crafthub_onboarding_payment_provider_placeholders(provider_key);
CREATE INDEX IF NOT EXISTS idx_payment_ph_status ON crafthub_onboarding_payment_provider_placeholders(provider_status);
CREATE INDEX IF NOT EXISTS idx_payment_ph_ikey ON crafthub_onboarding_payment_provider_placeholders(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_billing_license_placeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'billing_license',
  provider_key TEXT,
  billing_plan TEXT,
  license_tier TEXT,
  provider_status TEXT NOT NULL DEFAULT 'not_connected',
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  billing_connected BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_billing_ph_org ON crafthub_onboarding_billing_license_placeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_ph_venue ON crafthub_onboarding_billing_license_placeholders(venue_id);
CREATE INDEX IF NOT EXISTS idx_billing_ph_provider_key ON crafthub_onboarding_billing_license_placeholders(provider_key);
CREATE INDEX IF NOT EXISTS idx_billing_ph_ikey ON crafthub_onboarding_billing_license_placeholders(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_security_placeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'security_setup',
  provider_key TEXT,
  security_feature TEXT,
  provider_status TEXT NOT NULL DEFAULT 'not_connected',
  setup_status TEXT NOT NULL DEFAULT 'not_started',
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_sec_ph_org ON crafthub_onboarding_security_placeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_sec_ph_venue ON crafthub_onboarding_security_placeholders(venue_id);
CREATE INDEX IF NOT EXISTS idx_sec_ph_provider_key ON crafthub_onboarding_security_placeholders(provider_key);
CREATE INDEX IF NOT EXISTS idx_sec_ph_ikey ON crafthub_onboarding_security_placeholders(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_demo_live_mode_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  step_key TEXT DEFAULT 'demo_live_mode',
  mode_key TEXT NOT NULL,
  demo_live_mode TEXT NOT NULL DEFAULT 'demo'
    CHECK (demo_live_mode IN ('demo','local_preview','staging_placeholder','production_placeholder','live_external','unavailable')),
  previous_mode TEXT,
  reason TEXT,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_mode_ctrl_org ON crafthub_onboarding_demo_live_mode_controls(organization_id);
CREATE INDEX IF NOT EXISTS idx_mode_ctrl_venue ON crafthub_onboarding_demo_live_mode_controls(venue_id);
CREATE INDEX IF NOT EXISTS idx_mode_ctrl_mode_key ON crafthub_onboarding_demo_live_mode_controls(mode_key);
CREATE INDEX IF NOT EXISTS idx_mode_ctrl_demo_live ON crafthub_onboarding_demo_live_mode_controls(demo_live_mode);
CREATE INDEX IF NOT EXISTS idx_mode_ctrl_ikey ON crafthub_onboarding_demo_live_mode_controls(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_readiness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  readiness_status TEXT NOT NULL DEFAULT 'not_ready'
    CHECK (readiness_status IN ('not_ready','configuration_required','activation_required','provider_required','license_required','billing_required','role_required','ready_placeholder','ready_external','blocked','unavailable')),
  score_percent INTEGER DEFAULT 0,
  blockers_open INTEGER DEFAULT 0,
  steps_complete INTEGER DEFAULT 0,
  steps_total INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  workspace_provisioned BOOLEAN NOT NULL DEFAULT FALSE,
  venue_deployed BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_readiness_org ON crafthub_onboarding_readiness_scores(organization_id);
CREATE INDEX IF NOT EXISTS idx_readiness_venue ON crafthub_onboarding_readiness_scores(venue_id);
CREATE INDEX IF NOT EXISTS idx_readiness_status ON crafthub_onboarding_readiness_scores(readiness_status);
CREATE INDEX IF NOT EXISTS idx_readiness_ikey ON crafthub_onboarding_readiness_scores(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_launch_readiness_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  readiness_status TEXT NOT NULL DEFAULT 'not_ready',
  blockers_summary JSONB DEFAULT '[]',
  activation_summary JSONB DEFAULT '[]',
  modules_ready JSONB DEFAULT '[]',
  modules_blocked JSONB DEFAULT '[]',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  workspace_provisioned BOOLEAN NOT NULL DEFAULT FALSE,
  venue_deployed BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_launch_rr_org ON crafthub_onboarding_launch_readiness_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_launch_rr_venue ON crafthub_onboarding_launch_readiness_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_launch_rr_status ON crafthub_onboarding_launch_readiness_records(readiness_status);
CREATE INDEX IF NOT EXISTS idx_launch_rr_ikey ON crafthub_onboarding_launch_readiness_records(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_safe_claim_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  claim_key TEXT NOT NULL,
  claim_text TEXT NOT NULL,
  claim_category TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_placeholder BOOLEAN DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_safe_claim_org ON crafthub_onboarding_safe_claim_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_safe_claim_venue ON crafthub_onboarding_safe_claim_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_safe_claim_ikey ON crafthub_onboarding_safe_claim_records(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_unsafe_claim_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  claim_key TEXT NOT NULL,
  claim_text TEXT NOT NULL,
  claim_reason TEXT,
  is_blocked BOOLEAN DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_unsafe_claim_org ON crafthub_onboarding_unsafe_claim_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_unsafe_claim_venue ON crafthub_onboarding_unsafe_claim_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_unsafe_claim_ikey ON crafthub_onboarding_unsafe_claim_records(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT,
  snapshot_version TEXT,
  onboarding_state JSONB DEFAULT '{}',
  readiness_state JSONB DEFAULT '{}',
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_snapshots_org ON crafthub_onboarding_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_venue ON crafthub_onboarding_snapshots(venue_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_created ON crafthub_onboarding_snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_ikey ON crafthub_onboarding_snapshots(idempotency_key);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id UUID,
  workspace_id UUID,
  user_id UUID,
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  step_key TEXT,
  module_key TEXT,
  before_snapshot JSONB DEFAULT '{}',
  after_snapshot JSONB DEFAULT '{}',
  reason TEXT,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onb_audit_org ON crafthub_onboarding_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_onb_audit_venue ON crafthub_onboarding_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_onb_audit_workspace ON crafthub_onboarding_audit(workspace_id);
CREATE INDEX IF NOT EXISTS idx_onb_audit_user ON crafthub_onboarding_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_onb_audit_actor ON crafthub_onboarding_audit(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_onb_audit_action ON crafthub_onboarding_audit(action);
CREATE INDEX IF NOT EXISTS idx_onb_audit_step_key ON crafthub_onboarding_audit(step_key);
CREATE INDEX IF NOT EXISTS idx_onb_audit_module_key ON crafthub_onboarding_audit(module_key);
CREATE INDEX IF NOT EXISTS idx_onb_audit_created ON crafthub_onboarding_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_onb_audit_ikey ON crafthub_onboarding_audit(idempotency_key);
