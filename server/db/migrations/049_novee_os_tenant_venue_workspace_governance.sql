-- Phase C.2 / Module 2 of 7
-- NOVEE OS Tenant, Venue, Organization & Workspace Governance
-- Migration: 049
-- All tables use CREATE TABLE IF NOT EXISTS
-- Safe migration: no destructive DDL, no truncation

-- ─── ORGANIZATIONS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_organizations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_key          TEXT NOT NULL UNIQUE,
  organization_name         TEXT NOT NULL,
  parent_organization_id    UUID REFERENCES novee_os_organizations(id),
  organization_status       TEXT NOT NULL DEFAULT 'draft'
                              CHECK (organization_status IN ('draft','active_placeholder','suspended','disabled','unavailable')),
  scope_level               TEXT NOT NULL DEFAULT 'organization'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','business_unit','department','location','module','custom')),
  governance_status         TEXT NOT NULL DEFAULT 'draft'
                              CHECK (governance_status IN ('draft','active_placeholder','review_required','blocked','disabled','unavailable')),
  readiness_status          TEXT NOT NULL DEFAULT 'not_checked'
                              CHECK (readiness_status IN ('not_checked','foundation_ready','configuration_required','provider_activation_required','production_ready_placeholder','incomplete','unavailable')),
  tenant_isolation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected         BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_organizations_status ON novee_os_organizations(organization_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_organizations_governance ON novee_os_organizations(governance_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_organizations_parent ON novee_os_organizations(parent_organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_organizations_created_at ON novee_os_organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_organizations_idempotency ON novee_os_organizations(idempotency_key);

-- ─── ORGANIZATION PROFILES ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_organization_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL REFERENCES novee_os_organizations(id),
  display_name              TEXT,
  legal_name                TEXT,
  address_line1             TEXT,
  address_line2             TEXT,
  city                      TEXT,
  state_province            TEXT,
  postal_code               TEXT,
  country_code              TEXT,
  primary_contact_email     TEXT,
  primary_contact_phone     TEXT,
  website_url               TEXT,
  timezone                  TEXT,
  locale                    TEXT DEFAULT 'en-US',
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_org_profiles_org_id ON novee_os_organization_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_org_profiles_created_at ON novee_os_organization_profiles(created_at);

-- ─── VENUE GROUPS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_venue_groups (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL,
  venue_group_key           TEXT NOT NULL,
  venue_group_name          TEXT NOT NULL,
  parent_venue_group_id     UUID REFERENCES novee_os_venue_groups(id),
  governance_status         TEXT NOT NULL DEFAULT 'draft'
                              CHECK (governance_status IN ('draft','active_placeholder','review_required','blocked','disabled','unavailable')),
  scope_level               TEXT NOT NULL DEFAULT 'venue_group',
  tenant_isolation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_venue_groups_org_id ON novee_os_venue_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_venue_groups_status ON novee_os_venue_groups(governance_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_venue_groups_created_at ON novee_os_venue_groups(created_at);

-- ─── VENUES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_venues (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL,
  venue_group_id            UUID REFERENCES novee_os_venue_groups(id),
  venue_key                 TEXT NOT NULL UNIQUE,
  venue_name                TEXT NOT NULL,
  venue_status              TEXT NOT NULL DEFAULT 'draft'
                              CHECK (venue_status IN ('draft','setup_placeholder','active_placeholder','deployed_external','suspended','disabled','unavailable')),
  governance_status         TEXT NOT NULL DEFAULT 'draft'
                              CHECK (governance_status IN ('draft','active_placeholder','review_required','blocked','disabled','unavailable')),
  readiness_status          TEXT NOT NULL DEFAULT 'not_checked'
                              CHECK (readiness_status IN ('not_checked','foundation_ready','configuration_required','provider_activation_required','production_ready_placeholder','incomplete','unavailable')),
  environment_key           TEXT NOT NULL DEFAULT 'demo',
  scope_level               TEXT NOT NULL DEFAULT 'venue',
  tenant_isolation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  venue_deployed            BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  demo_mode_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  provider_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected         BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_venues_org_id ON novee_os_venues(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_venues_group_id ON novee_os_venues(venue_group_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_venues_status ON novee_os_venues(venue_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_venues_governance ON novee_os_venues(governance_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_venues_environment ON novee_os_venues(environment_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_venues_created_at ON novee_os_venues(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_venues_idempotency ON novee_os_venues(idempotency_key);

-- ─── VENUE PROFILES ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_venue_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  organization_id           UUID NOT NULL,
  display_name              TEXT,
  venue_type                TEXT,
  address_line1             TEXT,
  address_line2             TEXT,
  city                      TEXT,
  state_province            TEXT,
  postal_code               TEXT,
  country_code              TEXT,
  primary_contact_email     TEXT,
  primary_contact_phone     TEXT,
  timezone                  TEXT,
  locale                    TEXT DEFAULT 'en-US',
  capacity_placeholder      INTEGER,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_venue_profiles_venue_id ON novee_os_venue_profiles(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_venue_profiles_org_id ON novee_os_venue_profiles(organization_id);

-- ─── WORKSPACES ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_workspaces (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL,
  venue_id                  UUID,
  venue_group_id            UUID,
  workspace_key             TEXT NOT NULL UNIQUE,
  workspace_name            TEXT NOT NULL,
  workspace_status          TEXT NOT NULL DEFAULT 'draft'
                              CHECK (workspace_status IN ('draft','provisioned_placeholder','active_placeholder','live_external','suspended','disabled','unavailable')),
  governance_status         TEXT NOT NULL DEFAULT 'draft'
                              CHECK (governance_status IN ('draft','active_placeholder','review_required','blocked','disabled','unavailable')),
  readiness_status          TEXT NOT NULL DEFAULT 'not_checked'
                              CHECK (readiness_status IN ('not_checked','foundation_ready','configuration_required','provider_activation_required','production_ready_placeholder','incomplete','unavailable')),
  environment_key           TEXT NOT NULL DEFAULT 'demo',
  scope_level               TEXT NOT NULL DEFAULT 'workspace',
  tenant_isolation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  workspace_provisioned     BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  demo_mode_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  provider_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected         BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_workspaces_org_id ON novee_os_workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_workspaces_venue_id ON novee_os_workspaces(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_workspaces_status ON novee_os_workspaces(workspace_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_workspaces_governance ON novee_os_workspaces(governance_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_workspaces_environment ON novee_os_workspaces(environment_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_workspaces_created_at ON novee_os_workspaces(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_workspaces_idempotency ON novee_os_workspaces(idempotency_key);

-- ─── WORKSPACE MEMBERSHIPS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_workspace_memberships (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              UUID NOT NULL,
  organization_id           UUID NOT NULL,
  venue_id                  UUID,
  user_id                   TEXT NOT NULL,
  actor_user_id             TEXT,
  membership_status         TEXT NOT NULL DEFAULT 'invited_placeholder'
                              CHECK (membership_status IN ('invited_placeholder','active_placeholder','suspended','removed','unavailable')),
  role_scope                TEXT NOT NULL DEFAULT 'staff',
  scope_level               TEXT NOT NULL DEFAULT 'workspace',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_ws_memberships_workspace_id ON novee_os_workspace_memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_memberships_org_id ON novee_os_workspace_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_memberships_user_id ON novee_os_workspace_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_memberships_status ON novee_os_workspace_memberships(membership_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_memberships_created_at ON novee_os_workspace_memberships(created_at);

-- ─── WORKSPACE ROLES ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_workspace_roles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              UUID NOT NULL,
  organization_id           UUID NOT NULL,
  role_key                  TEXT NOT NULL,
  role_name                 TEXT NOT NULL,
  role_scope                TEXT NOT NULL DEFAULT 'staff',
  scope_level               TEXT NOT NULL DEFAULT 'workspace',
  governance_status         TEXT NOT NULL DEFAULT 'draft',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_ws_roles_workspace_id ON novee_os_workspace_roles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_roles_org_id ON novee_os_workspace_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_roles_created_at ON novee_os_workspace_roles(created_at);

-- ─── WORKSPACE ACCESS BOUNDARIES ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_workspace_access_boundaries (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              UUID NOT NULL,
  organization_id           UUID NOT NULL,
  venue_id                  UUID,
  boundary_type             TEXT NOT NULL DEFAULT 'data_access',
  scope_level               TEXT NOT NULL DEFAULT 'workspace',
  boundary_status           TEXT NOT NULL DEFAULT 'draft',
  tenant_isolation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_ws_boundaries_workspace_id ON novee_os_workspace_access_boundaries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_boundaries_org_id ON novee_os_workspace_access_boundaries(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_boundaries_created_at ON novee_os_workspace_access_boundaries(created_at);

-- ─── BUSINESS UNITS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_business_units (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL,
  venue_id                  UUID,
  business_unit_key         TEXT NOT NULL,
  business_unit_name        TEXT NOT NULL,
  scope_level               TEXT NOT NULL DEFAULT 'business_unit',
  governance_status         TEXT NOT NULL DEFAULT 'draft',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_business_units_org_id ON novee_os_business_units(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_business_units_created_at ON novee_os_business_units(created_at);

-- ─── DEPARTMENTS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_departments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL,
  venue_id                  UUID,
  business_unit_id          UUID REFERENCES novee_os_business_units(id),
  location_id               UUID,
  department_key            TEXT NOT NULL,
  department_name           TEXT NOT NULL,
  scope_level               TEXT NOT NULL DEFAULT 'department',
  governance_status         TEXT NOT NULL DEFAULT 'draft',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_departments_org_id ON novee_os_departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_departments_bu_id ON novee_os_departments(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_departments_created_at ON novee_os_departments(created_at);

-- ─── LOCATIONS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_locations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL,
  venue_id                  UUID,
  venue_group_id            UUID,
  business_unit_id          UUID,
  department_id             UUID,
  location_key              TEXT NOT NULL,
  location_name             TEXT NOT NULL,
  scope_level               TEXT NOT NULL DEFAULT 'location',
  governance_status         TEXT NOT NULL DEFAULT 'draft',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_locations_org_id ON novee_os_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_locations_venue_id ON novee_os_locations(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_locations_created_at ON novee_os_locations(created_at);

-- ─── ENVIRONMENT MODES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_environment_modes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              UUID NOT NULL,
  organization_id           UUID NOT NULL,
  venue_id                  UUID,
  environment_key           TEXT NOT NULL DEFAULT 'demo',
  environment_mode          TEXT NOT NULL DEFAULT 'demo'
                              CHECK (environment_mode IN ('demo','local_preview','staging_placeholder','production_placeholder','live_external','unavailable')),
  live_mode_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  demo_mode_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  provider_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected         BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  tenant_isolation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  workspace_provisioned     BOOLEAN NOT NULL DEFAULT FALSE,
  venue_deployed            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                    TEXT,
  actor_user_id             TEXT,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_env_modes_workspace_id ON novee_os_environment_modes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_env_modes_org_id ON novee_os_environment_modes(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_env_modes_environment_key ON novee_os_environment_modes(environment_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_env_modes_created_at ON novee_os_environment_modes(created_at);

-- ─── DEMO / LIVE WORKSPACE MODES ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_demo_live_workspace_modes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              UUID NOT NULL,
  organization_id           UUID NOT NULL,
  venue_id                  UUID,
  mode                      TEXT NOT NULL DEFAULT 'demo'
                              CHECK (mode IN ('demo','local_preview','staging_placeholder','production_placeholder','live_external','unavailable')),
  live_mode_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  demo_mode_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  workspace_provisioned     BOOLEAN NOT NULL DEFAULT FALSE,
  venue_deployed            BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected         BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                    TEXT,
  actor_user_id             TEXT,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_dlw_modes_workspace_id ON novee_os_demo_live_workspace_modes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_dlw_modes_org_id ON novee_os_demo_live_workspace_modes(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_dlw_modes_created_at ON novee_os_demo_live_workspace_modes(created_at);

-- ─── MODULE WORKSPACE AVAILABILITY ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_module_workspace_availability (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              UUID NOT NULL,
  organization_id           UUID NOT NULL,
  venue_id                  UUID,
  module_key                TEXT NOT NULL,
  availability_status       TEXT NOT NULL DEFAULT 'not_available',
  scope_level               TEXT NOT NULL DEFAULT 'workspace',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_mwa_workspace_id ON novee_os_module_workspace_availability(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_mwa_module_key ON novee_os_module_workspace_availability(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_mwa_org_id ON novee_os_module_workspace_availability(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_mwa_created_at ON novee_os_module_workspace_availability(created_at);

-- ─── MODULE VENUE AVAILABILITY ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_module_venue_availability (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                  UUID NOT NULL,
  organization_id           UUID NOT NULL,
  module_key                TEXT NOT NULL,
  availability_status       TEXT NOT NULL DEFAULT 'not_available',
  scope_level               TEXT NOT NULL DEFAULT 'venue',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_mva_venue_id ON novee_os_module_venue_availability(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_mva_module_key ON novee_os_module_venue_availability(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_mva_org_id ON novee_os_module_venue_availability(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_mva_created_at ON novee_os_module_venue_availability(created_at);

-- ─── MODULE ORGANIZATION AVAILABILITY ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_module_organization_availability (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL,
  module_key                TEXT NOT NULL,
  availability_status       TEXT NOT NULL DEFAULT 'not_available',
  scope_level               TEXT NOT NULL DEFAULT 'organization',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_moa_org_id ON novee_os_module_organization_availability(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_moa_module_key ON novee_os_module_organization_availability(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_moa_created_at ON novee_os_module_organization_availability(created_at);

-- ─── DATA BOUNDARY RECORDS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_data_boundary_records (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL,
  venue_id                  UUID,
  workspace_id              UUID,
  boundary_type             TEXT NOT NULL DEFAULT 'data_access',
  scope_level               TEXT NOT NULL DEFAULT 'organization',
  tenant_isolation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id             TEXT,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_data_boundaries_org_id ON novee_os_data_boundary_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_data_boundaries_workspace_id ON novee_os_data_boundary_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_data_boundaries_venue_id ON novee_os_data_boundary_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_data_boundaries_created_at ON novee_os_data_boundary_records(created_at);

-- ─── TENANT HEALTH CHECKS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_tenant_health_checks (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  health_status             TEXT NOT NULL DEFAULT 'unknown',
  check_type                TEXT NOT NULL DEFAULT 'placeholder',
  tenant_isolation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  workspace_provisioned     BOOLEAN NOT NULL DEFAULT FALSE,
  venue_deployed            BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected         BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id             TEXT,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_tenant_health_org_id ON novee_os_tenant_health_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_tenant_health_workspace_id ON novee_os_tenant_health_checks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_tenant_health_created_at ON novee_os_tenant_health_checks(created_at);

-- ─── WORKSPACE READINESS RECORDS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_workspace_readiness_records (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              UUID NOT NULL,
  organization_id           UUID NOT NULL,
  venue_id                  UUID,
  readiness_status          TEXT NOT NULL DEFAULT 'not_checked'
                              CHECK (readiness_status IN ('not_checked','foundation_ready','configuration_required','provider_activation_required','production_ready_placeholder','incomplete','unavailable')),
  governance_status         TEXT NOT NULL DEFAULT 'draft',
  tenant_isolation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  workspace_provisioned     BOOLEAN NOT NULL DEFAULT FALSE,
  venue_deployed            BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected         BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id             TEXT,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_ws_readiness_workspace_id ON novee_os_workspace_readiness_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_readiness_org_id ON novee_os_workspace_readiness_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_readiness_status ON novee_os_workspace_readiness_records(readiness_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_readiness_created_at ON novee_os_workspace_readiness_records(created_at);

-- ─── TENANT GOVERNANCE SNAPSHOTS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_tenant_governance_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_version          INTEGER NOT NULL DEFAULT 1,
  organization_count        INTEGER NOT NULL DEFAULT 0,
  venue_count               INTEGER NOT NULL DEFAULT 0,
  workspace_count           INTEGER NOT NULL DEFAULT 0,
  active_memberships        INTEGER NOT NULL DEFAULT 0,
  governance_status         TEXT NOT NULL DEFAULT 'draft',
  tenant_isolation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  any_workspace_provisioned BOOLEAN NOT NULL DEFAULT FALSE,
  any_venue_deployed        BOOLEAN NOT NULL DEFAULT FALSE,
  any_live_mode_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  any_provider_connected    BOOLEAN NOT NULL DEFAULT FALSE,
  any_billing_connected     BOOLEAN NOT NULL DEFAULT FALSE,
  any_license_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  any_deployment_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id             TEXT,
  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB,
  created_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_gov_snapshots_created_at ON novee_os_tenant_governance_snapshots(created_at);

-- ─── TENANT GOVERNANCE AUDIT ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_tenant_governance_audit (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  actor_user_id             TEXT NOT NULL DEFAULT 'system',
  action                    TEXT NOT NULL,
  entity_type               TEXT NOT NULL,
  entity_id                 TEXT,
  before_snapshot           JSONB,
  after_snapshot            JSONB,
  reason                    TEXT,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_gov_audit_org_id ON novee_os_tenant_governance_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_gov_audit_workspace_id ON novee_os_tenant_governance_audit(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_gov_audit_actor ON novee_os_tenant_governance_audit(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_gov_audit_action ON novee_os_tenant_governance_audit(action);
CREATE INDEX IF NOT EXISTS idx_novee_os_gov_audit_entity_type ON novee_os_tenant_governance_audit(entity_type);
CREATE INDEX IF NOT EXISTS idx_novee_os_gov_audit_created_at ON novee_os_tenant_governance_audit(created_at);
