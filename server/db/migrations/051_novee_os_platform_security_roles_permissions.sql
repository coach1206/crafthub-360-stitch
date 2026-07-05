-- Phase C.4 / Module 4 of 7 — NOVEE OS Platform Security, Roles & Permissions
-- Safe migration: no destructive DDL, no truncation

-- 1. Platform Users
CREATE TABLE IF NOT EXISTS novee_os_platform_users (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  email                     TEXT,
  display_name              TEXT,
  user_status               TEXT NOT NULL DEFAULT 'invited_placeholder'
                              CHECK (user_status IN ('invited_placeholder','active_placeholder','suspended','removed','unavailable')),
  role_key                  TEXT,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  idempotency_key           TEXT UNIQUE,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_users_user_id         ON novee_os_platform_users(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_users_organization_id ON novee_os_platform_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_users_venue_id        ON novee_os_platform_users(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_users_workspace_id    ON novee_os_platform_users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_users_role_key        ON novee_os_platform_users(role_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_users_created_at      ON novee_os_platform_users(created_at);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS novee_os_user_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  display_name              TEXT,
  timezone                  TEXT,
  locale                    TEXT,
  contact_email             TEXT,
  idempotency_key           TEXT UNIQUE,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_profiles_user_id         ON novee_os_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_profiles_organization_id ON novee_os_user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_profiles_created_at      ON novee_os_user_profiles(created_at);

-- 3. Role Catalog
CREATE TABLE IF NOT EXISTS novee_os_role_catalog (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key                  TEXT NOT NULL UNIQUE,
  role_name                 TEXT NOT NULL,
  role_scope                TEXT NOT NULL DEFAULT 'custom',
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  role_status               TEXT NOT NULL DEFAULT 'draft'
                              CHECK (role_status IN ('draft','active_placeholder','disabled','deprecated','unavailable')),
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  permission_group          TEXT,
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_role_catalog_role_key        ON novee_os_role_catalog(role_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_role_catalog_organization_id ON novee_os_role_catalog(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_role_catalog_venue_id        ON novee_os_role_catalog(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_role_catalog_role_status     ON novee_os_role_catalog(role_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_role_catalog_created_at      ON novee_os_role_catalog(created_at);

-- 4. Permission Catalog
CREATE TABLE IF NOT EXISTS novee_os_permission_catalog (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key            TEXT NOT NULL UNIQUE,
  permission_name           TEXT NOT NULL,
  permission_group          TEXT,
  module_key                TEXT,
  route_path                TEXT,
  feature_key               TEXT,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  permission_status         TEXT NOT NULL DEFAULT 'draft'
                              CHECK (permission_status IN ('draft','active_placeholder','disabled','unavailable')),
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  permission_enforced       BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_catalog_permission_key ON novee_os_permission_catalog(permission_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_catalog_module_key     ON novee_os_permission_catalog(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_catalog_route_path     ON novee_os_permission_catalog(route_path);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_catalog_feature_key    ON novee_os_permission_catalog(feature_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_catalog_created_at     ON novee_os_permission_catalog(created_at);

-- 5. Permission Groups
CREATE TABLE IF NOT EXISTS novee_os_permission_groups (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key                 TEXT NOT NULL UNIQUE,
  group_name                TEXT NOT NULL,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_groups_organization_id ON novee_os_permission_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_groups_created_at      ON novee_os_permission_groups(created_at);

-- 6. Role Permission Assignments
CREATE TABLE IF NOT EXISTS novee_os_role_permission_assignments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key                  TEXT NOT NULL,
  permission_key            TEXT NOT NULL,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  assignment_status         TEXT NOT NULL DEFAULT 'active_placeholder'
                              CHECK (assignment_status IN ('pending_placeholder','active_placeholder','revoked','expired','unavailable')),
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  permission_enforced       BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_role_permission_assignments_role_key       ON novee_os_role_permission_assignments(role_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_role_permission_assignments_permission_key ON novee_os_role_permission_assignments(permission_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_role_permission_assignments_created_at     ON novee_os_role_permission_assignments(created_at);

-- 7. User Role Assignments
CREATE TABLE IF NOT EXISTS novee_os_user_role_assignments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL,
  role_key                  TEXT NOT NULL,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  assignment_status         TEXT NOT NULL DEFAULT 'pending_placeholder'
                              CHECK (assignment_status IN ('pending_placeholder','active_placeholder','revoked','expired','unavailable')),
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  approval_request_id       UUID,
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  permission_enforced       BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_role_assignments_user_id         ON novee_os_user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_role_assignments_role_key        ON novee_os_user_role_assignments(role_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_role_assignments_organization_id ON novee_os_user_role_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_role_assignments_venue_id        ON novee_os_user_role_assignments(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_role_assignments_workspace_id    ON novee_os_user_role_assignments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_role_assignments_created_at      ON novee_os_user_role_assignments(created_at);

-- 8. User Access Grants
CREATE TABLE IF NOT EXISTS novee_os_user_access_grants (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL,
  permission_key            TEXT,
  role_key                  TEXT,
  module_key                TEXT,
  route_path                TEXT,
  feature_key               TEXT,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  assignment_status         TEXT NOT NULL DEFAULT 'pending_placeholder'
                              CHECK (assignment_status IN ('pending_placeholder','active_placeholder','revoked','expired','unavailable')),
  approval_request_id       UUID,
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  permission_enforced       BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_access_grants_user_id         ON novee_os_user_access_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_access_grants_permission_key  ON novee_os_user_access_grants(permission_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_access_grants_module_key      ON novee_os_user_access_grants(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_access_grants_organization_id ON novee_os_user_access_grants(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_user_access_grants_created_at      ON novee_os_user_access_grants(created_at);

-- 9. Module Permission Rules
CREATE TABLE IF NOT EXISTS novee_os_module_permission_rules (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key                TEXT NOT NULL,
  permission_key            TEXT,
  role_key                  TEXT,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'module'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  assignment_status         TEXT NOT NULL DEFAULT 'active_placeholder'
                              CHECK (assignment_status IN ('pending_placeholder','active_placeholder','revoked','expired','unavailable')),
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  permission_enforced       BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_permission_rules_module_key     ON novee_os_module_permission_rules(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_permission_rules_permission_key ON novee_os_module_permission_rules(permission_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_permission_rules_created_at     ON novee_os_module_permission_rules(created_at);

-- 10. Route Permission Rules
CREATE TABLE IF NOT EXISTS novee_os_route_permission_rules (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path                TEXT NOT NULL,
  permission_key            TEXT,
  role_key                  TEXT,
  module_key                TEXT,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'route'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  assignment_status         TEXT NOT NULL DEFAULT 'active_placeholder'
                              CHECK (assignment_status IN ('pending_placeholder','active_placeholder','revoked','expired','unavailable')),
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  permission_enforced       BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_route_permission_rules_route_path     ON novee_os_route_permission_rules(route_path);
CREATE INDEX IF NOT EXISTS idx_novee_os_route_permission_rules_permission_key ON novee_os_route_permission_rules(permission_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_route_permission_rules_created_at     ON novee_os_route_permission_rules(created_at);

-- 11. Feature Permission Rules
CREATE TABLE IF NOT EXISTS novee_os_feature_permission_rules (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key               TEXT NOT NULL,
  permission_key            TEXT,
  role_key                  TEXT,
  module_key                TEXT,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'feature'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  assignment_status         TEXT NOT NULL DEFAULT 'active_placeholder'
                              CHECK (assignment_status IN ('pending_placeholder','active_placeholder','revoked','expired','unavailable')),
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  permission_enforced       BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_feature_permission_rules_feature_key    ON novee_os_feature_permission_rules(feature_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_feature_permission_rules_permission_key ON novee_os_feature_permission_rules(permission_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_feature_permission_rules_created_at     ON novee_os_feature_permission_rules(created_at);

-- 12. Admin Approval Requests
CREATE TABLE IF NOT EXISTS novee_os_admin_approval_requests (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id       UUID UNIQUE DEFAULT gen_random_uuid(),
  user_id                   UUID,
  actor_user_id             UUID,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  sensitive_action_key      TEXT,
  approval_status           TEXT NOT NULL DEFAULT 'pending'
                              CHECK (approval_status IN ('pending','approved_placeholder','rejected','cancelled','expired','unavailable')),
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  reason                    TEXT,
  decision_reason           TEXT,
  decided_by                UUID,
  idempotency_key           TEXT UNIQUE,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_admin_approval_requests_user_id         ON novee_os_admin_approval_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_admin_approval_requests_actor_user_id   ON novee_os_admin_approval_requests(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_admin_approval_requests_organization_id ON novee_os_admin_approval_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_admin_approval_requests_approval_status ON novee_os_admin_approval_requests(approval_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_admin_approval_requests_created_at      ON novee_os_admin_approval_requests(created_at);

-- 13. Sensitive Action Requests
CREATE TABLE IF NOT EXISTS novee_os_sensitive_action_requests (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensitive_action_key      TEXT NOT NULL,
  user_id                   UUID,
  actor_user_id             UUID,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  approval_request_id       UUID,
  approval_status           TEXT NOT NULL DEFAULT 'pending'
                              CHECK (approval_status IN ('pending','approved_placeholder','rejected','cancelled','expired','unavailable')),
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  reason                    TEXT,
  decision_reason           TEXT,
  decided_by                UUID,
  idempotency_key           TEXT UNIQUE,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_sensitive_action_requests_user_id         ON novee_os_sensitive_action_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_sensitive_action_requests_actor_user_id   ON novee_os_sensitive_action_requests(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_sensitive_action_requests_organization_id ON novee_os_sensitive_action_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_sensitive_action_requests_approval_status ON novee_os_sensitive_action_requests(approval_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_sensitive_action_requests_created_at      ON novee_os_sensitive_action_requests(created_at);

-- 14. Permission Decision Records
CREATE TABLE IF NOT EXISTS novee_os_permission_decision_records (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID,
  actor_user_id             UUID,
  module_key                TEXT,
  route_path                TEXT,
  feature_key               TEXT,
  permission_key            TEXT,
  role_key                  TEXT,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  decision_status           TEXT NOT NULL DEFAULT 'allowed_placeholder'
                              CHECK (decision_status IN ('allowed_placeholder','denied','requires_approval','blocked','unavailable')),
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  idempotency_key           TEXT UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  permission_enforced       BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_decision_records_user_id         ON novee_os_permission_decision_records(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_decision_records_actor_user_id   ON novee_os_permission_decision_records(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_decision_records_module_key      ON novee_os_permission_decision_records(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_decision_records_route_path      ON novee_os_permission_decision_records(route_path);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_decision_records_feature_key     ON novee_os_permission_decision_records(feature_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_decision_records_permission_key  ON novee_os_permission_decision_records(permission_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_permission_decision_records_created_at      ON novee_os_permission_decision_records(created_at);

-- 15. Access Denial Records
CREATE TABLE IF NOT EXISTS novee_os_access_denial_records (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID,
  actor_user_id             UUID,
  module_key                TEXT,
  route_path                TEXT,
  feature_key               TEXT,
  permission_key            TEXT,
  role_key                  TEXT,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  denial_reason             TEXT,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  idempotency_key           TEXT UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  permission_enforced       BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_denial_records_user_id        ON novee_os_access_denial_records(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_denial_records_actor_user_id  ON novee_os_access_denial_records(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_denial_records_module_key     ON novee_os_access_denial_records(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_denial_records_route_path     ON novee_os_access_denial_records(route_path);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_denial_records_created_at     ON novee_os_access_denial_records(created_at);

-- 16. Session Policy Placeholders
CREATE TABLE IF NOT EXISTS novee_os_session_policy_placeholders (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key              TEXT NOT NULL DEFAULT 'sso_placeholder',
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  security_status           TEXT NOT NULL DEFAULT 'not_configured'
                              CHECK (security_status IN ('not_configured','configured_placeholder','enforced_external','failed','disabled','unavailable')),
  sso_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_enforced              BOOLEAN NOT NULL DEFAULT FALSE,
  device_trust_enforced     BOOLEAN NOT NULL DEFAULT FALSE,
  ip_allowlist_enforced     BOOLEAN NOT NULL DEFAULT FALSE,
  security_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_certified      BOOLEAN NOT NULL DEFAULT FALSE,
  notification_delivered    BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_session_policy_placeholders_organization_id ON novee_os_session_policy_placeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_session_policy_placeholders_created_at      ON novee_os_session_policy_placeholders(created_at);

-- 17. MFA Policy Placeholders
CREATE TABLE IF NOT EXISTS novee_os_mfa_policy_placeholders (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key              TEXT NOT NULL DEFAULT 'mfa_placeholder',
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  security_status           TEXT NOT NULL DEFAULT 'not_configured'
                              CHECK (security_status IN ('not_configured','configured_placeholder','enforced_external','failed','disabled','unavailable')),
  mfa_enforced              BOOLEAN NOT NULL DEFAULT FALSE,
  sso_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  security_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_certified      BOOLEAN NOT NULL DEFAULT FALSE,
  notification_delivered    BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_mfa_policy_placeholders_organization_id ON novee_os_mfa_policy_placeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_mfa_policy_placeholders_created_at      ON novee_os_mfa_policy_placeholders(created_at);

-- 18. SSO Provider Placeholders
CREATE TABLE IF NOT EXISTS novee_os_sso_provider_placeholders (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key              TEXT NOT NULL DEFAULT 'sso_placeholder',
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  security_status           TEXT NOT NULL DEFAULT 'not_configured'
                              CHECK (security_status IN ('not_configured','configured_placeholder','enforced_external','failed','disabled','unavailable')),
  sso_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_enforced              BOOLEAN NOT NULL DEFAULT FALSE,
  security_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_certified      BOOLEAN NOT NULL DEFAULT FALSE,
  notification_delivered    BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_sso_provider_placeholders_organization_id ON novee_os_sso_provider_placeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_sso_provider_placeholders_created_at      ON novee_os_sso_provider_placeholders(created_at);

-- 19. Device Trust Placeholders
CREATE TABLE IF NOT EXISTS novee_os_device_trust_placeholders (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key              TEXT NOT NULL DEFAULT 'device_trust_placeholder',
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  security_status           TEXT NOT NULL DEFAULT 'not_configured'
                              CHECK (security_status IN ('not_configured','configured_placeholder','enforced_external','failed','disabled','unavailable')),
  device_trust_enforced     BOOLEAN NOT NULL DEFAULT FALSE,
  sso_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  security_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_certified      BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_device_trust_placeholders_organization_id ON novee_os_device_trust_placeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_device_trust_placeholders_created_at      ON novee_os_device_trust_placeholders(created_at);

-- 20. IP Allowlist Placeholders
CREATE TABLE IF NOT EXISTS novee_os_ip_allowlist_placeholders (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key              TEXT NOT NULL DEFAULT 'ip_allowlist_placeholder',
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  security_status           TEXT NOT NULL DEFAULT 'not_configured'
                              CHECK (security_status IN ('not_configured','configured_placeholder','enforced_external','failed','disabled','unavailable')),
  ip_allowlist_enforced     BOOLEAN NOT NULL DEFAULT FALSE,
  security_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_certified      BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  actor_user_id             UUID,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_ip_allowlist_placeholders_organization_id ON novee_os_ip_allowlist_placeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ip_allowlist_placeholders_created_at      ON novee_os_ip_allowlist_placeholders(created_at);

-- 21. Security Event Records
CREATE TABLE IF NOT EXISTS novee_os_security_event_records (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID,
  actor_user_id             UUID,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  module_key                TEXT,
  route_path                TEXT,
  feature_key               TEXT,
  permission_key            TEXT,
  sensitive_action_key      TEXT,
  security_status           TEXT NOT NULL DEFAULT 'not_configured'
                              CHECK (security_status IN ('not_configured','configured_placeholder','enforced_external','failed','disabled','unavailable')),
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  event_description         TEXT,
  idempotency_key           TEXT UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  notification_delivered    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_security_event_records_user_id         ON novee_os_security_event_records(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_security_event_records_actor_user_id   ON novee_os_security_event_records(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_security_event_records_organization_id ON novee_os_security_event_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_security_event_records_security_status ON novee_os_security_event_records(security_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_security_event_records_created_at      ON novee_os_security_event_records(created_at);

-- 22. Governance Review Records
CREATE TABLE IF NOT EXISTS novee_os_governance_review_records (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID,
  actor_user_id             UUID,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  review_status             TEXT NOT NULL DEFAULT 'draft'
                              CHECK (review_status IN ('draft','in_review','approved_placeholder','rejected','remediation_required','unavailable')),
  review_type               TEXT,
  review_notes              TEXT,
  decision_reason           TEXT,
  reviewed_by               UUID,
  idempotency_key           TEXT UNIQUE,
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_certified      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB
);
CREATE INDEX IF NOT EXISTS idx_novee_os_governance_review_records_user_id         ON novee_os_governance_review_records(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_governance_review_records_actor_user_id   ON novee_os_governance_review_records(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_governance_review_records_organization_id ON novee_os_governance_review_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_governance_review_records_review_status   ON novee_os_governance_review_records(review_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_governance_review_records_created_at      ON novee_os_governance_review_records(created_at);

-- 23. Platform Security Snapshots
CREATE TABLE IF NOT EXISTS novee_os_platform_security_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id             UUID,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  snapshot_data             JSONB,
  sso_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_enforced              BOOLEAN NOT NULL DEFAULT FALSE,
  device_trust_enforced     BOOLEAN NOT NULL DEFAULT FALSE,
  ip_allowlist_enforced     BOOLEAN NOT NULL DEFAULT FALSE,
  security_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_certified      BOOLEAN NOT NULL DEFAULT FALSE,
  permission_enforced       BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key           TEXT UNIQUE,
  created_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_security_snapshots_actor_user_id   ON novee_os_platform_security_snapshots(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_security_snapshots_organization_id ON novee_os_platform_security_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_security_snapshots_created_at      ON novee_os_platform_security_snapshots(created_at);

-- 24. Platform Security Audit
CREATE TABLE IF NOT EXISTS novee_os_platform_security_audit (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id             UUID,
  user_id                   UUID,
  organization_id           UUID,
  venue_id                  UUID,
  workspace_id              UUID,
  module_key                TEXT,
  route_path                TEXT,
  feature_key               TEXT,
  role_key                  TEXT,
  permission_key            TEXT,
  sensitive_action_key      TEXT,
  approval_request_id       UUID,
  scope_level               TEXT NOT NULL DEFAULT 'platform'
                              CHECK (scope_level IN ('platform','organization','venue_group','venue','workspace','module','route','feature','user','custom')),
  action                    TEXT NOT NULL,
  entity_type               TEXT,
  entity_id                 UUID,
  before_snapshot           JSONB,
  after_snapshot            JSONB,
  reason                    TEXT,
  idempotency_key           TEXT UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_security_audit_actor_user_id   ON novee_os_platform_security_audit(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_security_audit_user_id         ON novee_os_platform_security_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_security_audit_organization_id ON novee_os_platform_security_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_security_audit_module_key      ON novee_os_platform_security_audit(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_security_audit_role_key        ON novee_os_platform_security_audit(role_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_security_audit_permission_key  ON novee_os_platform_security_audit(permission_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_security_audit_created_at      ON novee_os_platform_security_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_platform_security_audit_idempotency_key ON novee_os_platform_security_audit(idempotency_key);
