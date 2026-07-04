-- Phase C.3 / Module 3 of 7
-- NOVEE OS Licensing, Plans, Trials, Billing Gates & Feature Access
-- Migration: 050
-- All tables use CREATE TABLE IF NOT EXISTS
-- Safe migration: no destructive DDL, no truncation

-- ─── PLAN CATALOGS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_plan_catalogs (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key                      TEXT NOT NULL UNIQUE,
  plan_name                     TEXT NOT NULL,
  plan_description              TEXT,
  billing_interval              TEXT NOT NULL DEFAULT 'none',
  plan_status                   TEXT NOT NULL DEFAULT 'draft'
                                  CHECK (plan_status IN ('draft','available_placeholder','active_placeholder','disabled','deprecated','unavailable')),
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_plan_catalogs_plan_key ON novee_os_plan_catalogs(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_catalogs_status ON novee_os_plan_catalogs(plan_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_catalogs_created_at ON novee_os_plan_catalogs(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_catalogs_idempotency ON novee_os_plan_catalogs(idempotency_key);

-- ─── PLAN TIERS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_plan_tiers (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key                      TEXT NOT NULL,
  tier_key                      TEXT NOT NULL,
  tier_name                     TEXT NOT NULL,
  tier_description              TEXT,
  tier_status                   TEXT NOT NULL DEFAULT 'draft'
                                  CHECK (tier_status IN ('draft','available_placeholder','active_placeholder','disabled','unavailable')),
  billing_interval              TEXT NOT NULL DEFAULT 'none',
  price_amount_placeholder      NUMERIC(12,2),
  price_currency_placeholder    TEXT DEFAULT 'USD',
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_plan_tiers_plan_key ON novee_os_plan_tiers(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_tiers_tier_status ON novee_os_plan_tiers(tier_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_tiers_org_id ON novee_os_plan_tiers(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_tiers_venue_id ON novee_os_plan_tiers(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_tiers_workspace_id ON novee_os_plan_tiers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_tiers_created_at ON novee_os_plan_tiers(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_tiers_idempotency ON novee_os_plan_tiers(idempotency_key);

-- ─── PLAN FEATURES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_plan_features (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key                      TEXT NOT NULL,
  feature_key                   TEXT NOT NULL,
  feature_name                  TEXT NOT NULL,
  feature_description           TEXT,
  feature_gate_status           TEXT NOT NULL DEFAULT 'locked'
                                  CHECK (feature_gate_status IN ('locked','unlocked_placeholder','enabled_placeholder','disabled','unavailable')),
  module_key                    TEXT,
  addon_key                     TEXT,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_plan_features_plan_key ON novee_os_plan_features(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_features_feature_key ON novee_os_plan_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_features_module_key ON novee_os_plan_features(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_features_created_at ON novee_os_plan_features(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_plan_features_idempotency ON novee_os_plan_features(idempotency_key);

-- ─── MODULE PLAN GATES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_module_plan_gates (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key                    TEXT NOT NULL,
  plan_key                      TEXT NOT NULL,
  feature_gate_status           TEXT NOT NULL DEFAULT 'locked'
                                  CHECK (feature_gate_status IN ('locked','unlocked_placeholder','enabled_placeholder','disabled','unavailable')),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_module_plan_gates_module_key ON novee_os_module_plan_gates(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_plan_gates_plan_key ON novee_os_module_plan_gates(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_plan_gates_org_id ON novee_os_module_plan_gates(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_plan_gates_venue_id ON novee_os_module_plan_gates(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_plan_gates_workspace_id ON novee_os_module_plan_gates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_plan_gates_created_at ON novee_os_module_plan_gates(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_plan_gates_idempotency ON novee_os_module_plan_gates(idempotency_key);

-- ─── FEATURE ACCESS GATES ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_feature_access_gates (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key                   TEXT NOT NULL,
  plan_key                      TEXT,
  module_key                    TEXT,
  addon_key                     TEXT,
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  feature_gate_status           TEXT NOT NULL DEFAULT 'locked'
                                  CHECK (feature_gate_status IN ('locked','unlocked_placeholder','enabled_placeholder','disabled','unavailable')),
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  entitlement_active            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_feature_gates_feature_key ON novee_os_feature_access_gates(feature_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_feature_gates_plan_key ON novee_os_feature_access_gates(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_feature_gates_module_key ON novee_os_feature_access_gates(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_feature_gates_org_id ON novee_os_feature_access_gates(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_feature_gates_venue_id ON novee_os_feature_access_gates(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_feature_gates_workspace_id ON novee_os_feature_access_gates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_feature_gates_user_id ON novee_os_feature_access_gates(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_feature_gates_created_at ON novee_os_feature_access_gates(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_feature_gates_idempotency ON novee_os_feature_access_gates(idempotency_key);

-- ─── TRIAL POLICIES ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_trial_policies (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key                      TEXT NOT NULL,
  trial_duration_days           INTEGER NOT NULL DEFAULT 14,
  trial_status                  TEXT NOT NULL DEFAULT 'not_started'
                                  CHECK (trial_status IN ('not_started','active_placeholder','expired_placeholder','converted_external','cancelled','unavailable')),
  grace_period_days             INTEGER NOT NULL DEFAULT 3,
  trial_converted               BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_trial_policies_plan_key ON novee_os_trial_policies(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_trial_policies_status ON novee_os_trial_policies(trial_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_trial_policies_created_at ON novee_os_trial_policies(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_trial_policies_idempotency ON novee_os_trial_policies(idempotency_key);

-- ─── TRIAL INSTANCES ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_trial_instances (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key                      TEXT NOT NULL,
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  trial_status                  TEXT NOT NULL DEFAULT 'not_started'
                                  CHECK (trial_status IN ('not_started','active_placeholder','expired_placeholder','converted_external','cancelled','unavailable')),
  trial_start_placeholder       TIMESTAMPTZ,
  trial_end_placeholder         TIMESTAMPTZ,
  trial_converted               BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                        TEXT,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_trial_instances_plan_key ON novee_os_trial_instances(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_trial_instances_org_id ON novee_os_trial_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_trial_instances_venue_id ON novee_os_trial_instances(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_trial_instances_workspace_id ON novee_os_trial_instances(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_trial_instances_user_id ON novee_os_trial_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_trial_instances_status ON novee_os_trial_instances(trial_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_trial_instances_created_at ON novee_os_trial_instances(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_trial_instances_idempotency ON novee_os_trial_instances(idempotency_key);

-- ─── GRACE PERIOD RECORDS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_grace_period_records (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key                      TEXT,
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  grace_period_days             INTEGER NOT NULL DEFAULT 3,
  grace_period_status           TEXT NOT NULL DEFAULT 'not_started',
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  trial_converted               BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_grace_periods_org_id ON novee_os_grace_period_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_grace_periods_venue_id ON novee_os_grace_period_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_grace_periods_workspace_id ON novee_os_grace_period_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_grace_periods_user_id ON novee_os_grace_period_records(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_grace_periods_created_at ON novee_os_grace_period_records(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_grace_periods_idempotency ON novee_os_grace_period_records(idempotency_key);

-- ─── ORGANIZATION LICENSES ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_organization_licenses (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID NOT NULL,
  plan_key                      TEXT NOT NULL,
  license_status                TEXT NOT NULL DEFAULT 'not_licensed'
                                  CHECK (license_status IN ('not_licensed','license_required_placeholder','active_placeholder','verified_external','expired_placeholder','suspended','unavailable')),
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_paid                  BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  trial_converted               BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  renewal_charged               BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                        TEXT,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_org_licenses_org_id ON novee_os_organization_licenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_org_licenses_plan_key ON novee_os_organization_licenses(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_org_licenses_status ON novee_os_organization_licenses(license_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_org_licenses_created_at ON novee_os_organization_licenses(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_org_licenses_idempotency ON novee_os_organization_licenses(idempotency_key);

-- ─── VENUE LICENSES ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_venue_licenses (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                      UUID NOT NULL,
  organization_id               UUID NOT NULL,
  plan_key                      TEXT NOT NULL,
  license_status                TEXT NOT NULL DEFAULT 'not_licensed'
                                  CHECK (license_status IN ('not_licensed','license_required_placeholder','active_placeholder','verified_external','expired_placeholder','suspended','unavailable')),
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_paid                  BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  trial_converted               BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  renewal_charged               BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                        TEXT,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_venue_licenses_venue_id ON novee_os_venue_licenses(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_venue_licenses_org_id ON novee_os_venue_licenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_venue_licenses_plan_key ON novee_os_venue_licenses(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_venue_licenses_status ON novee_os_venue_licenses(license_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_venue_licenses_created_at ON novee_os_venue_licenses(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_venue_licenses_idempotency ON novee_os_venue_licenses(idempotency_key);

-- ─── WORKSPACE LICENSES ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_workspace_licenses (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                  UUID NOT NULL,
  organization_id               UUID NOT NULL,
  venue_id                      UUID,
  plan_key                      TEXT NOT NULL,
  license_status                TEXT NOT NULL DEFAULT 'not_licensed'
                                  CHECK (license_status IN ('not_licensed','license_required_placeholder','active_placeholder','verified_external','expired_placeholder','suspended','unavailable')),
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_paid                  BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  trial_converted               BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  renewal_charged               BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                        TEXT,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_ws_licenses_workspace_id ON novee_os_workspace_licenses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_licenses_org_id ON novee_os_workspace_licenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_licenses_venue_id ON novee_os_workspace_licenses(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_licenses_plan_key ON novee_os_workspace_licenses(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_licenses_status ON novee_os_workspace_licenses(license_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_licenses_created_at ON novee_os_workspace_licenses(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_ws_licenses_idempotency ON novee_os_workspace_licenses(idempotency_key);

-- ─── USER SEAT ALLOCATIONS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_user_seat_allocations (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID NOT NULL,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT NOT NULL,
  plan_key                      TEXT NOT NULL,
  seat_status                   TEXT NOT NULL DEFAULT 'not_licensed',
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_seat_alloc_org_id ON novee_os_user_seat_allocations(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_seat_alloc_venue_id ON novee_os_user_seat_allocations(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_seat_alloc_workspace_id ON novee_os_user_seat_allocations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_seat_alloc_user_id ON novee_os_user_seat_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_seat_alloc_plan_key ON novee_os_user_seat_allocations(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_seat_alloc_created_at ON novee_os_user_seat_allocations(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_seat_alloc_idempotency ON novee_os_user_seat_allocations(idempotency_key);

-- ─── ADDON CATALOG ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_addon_catalog (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_key                     TEXT NOT NULL UNIQUE,
  addon_name                    TEXT NOT NULL,
  addon_type                    TEXT NOT NULL DEFAULT 'module_addon',
  addon_status                  TEXT NOT NULL DEFAULT 'draft',
  module_key                    TEXT,
  plan_key                      TEXT,
  billing_interval              TEXT NOT NULL DEFAULT 'none',
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_addon_catalog_addon_key ON novee_os_addon_catalog(addon_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_addon_catalog_module_key ON novee_os_addon_catalog(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_addon_catalog_plan_key ON novee_os_addon_catalog(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_addon_catalog_created_at ON novee_os_addon_catalog(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_addon_catalog_idempotency ON novee_os_addon_catalog(idempotency_key);

-- ─── ADDON ASSIGNMENTS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_addon_assignments (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_key                     TEXT NOT NULL,
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  plan_key                      TEXT,
  assignment_status             TEXT NOT NULL DEFAULT 'not_active',
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  entitlement_active            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_addon_assign_addon_key ON novee_os_addon_assignments(addon_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_addon_assign_org_id ON novee_os_addon_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_addon_assign_venue_id ON novee_os_addon_assignments(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_addon_assign_workspace_id ON novee_os_addon_assignments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_addon_assign_user_id ON novee_os_addon_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_addon_assign_created_at ON novee_os_addon_assignments(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_addon_assign_idempotency ON novee_os_addon_assignments(idempotency_key);

-- ─── ENTITLEMENT RECORDS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_entitlement_records (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  plan_key                      TEXT,
  module_key                    TEXT,
  feature_key                   TEXT,
  addon_key                     TEXT,
  entitlement_status            TEXT NOT NULL DEFAULT 'not_active'
                                  CHECK (entitlement_status IN ('not_active','active_placeholder','active_external','expired','revoked','unavailable')),
  entitlement_active            BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  trial_converted               BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                        TEXT,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_entitlements_org_id ON novee_os_entitlement_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_entitlements_venue_id ON novee_os_entitlement_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_entitlements_workspace_id ON novee_os_entitlement_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_entitlements_user_id ON novee_os_entitlement_records(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_entitlements_plan_key ON novee_os_entitlement_records(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_entitlements_module_key ON novee_os_entitlement_records(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_entitlements_feature_key ON novee_os_entitlement_records(feature_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_entitlements_addon_key ON novee_os_entitlement_records(addon_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_entitlements_status ON novee_os_entitlement_records(entitlement_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_entitlements_created_at ON novee_os_entitlement_records(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_entitlements_idempotency ON novee_os_entitlement_records(idempotency_key);

-- ─── ACCESS DECISION RECORDS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_access_decision_records (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  module_key                    TEXT,
  feature_key                   TEXT,
  plan_key                      TEXT,
  addon_key                     TEXT,
  access_decision               TEXT NOT NULL DEFAULT 'blocked_plan_required',
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  entitlement_active            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_access_dec_org_id ON novee_os_access_decision_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_dec_venue_id ON novee_os_access_decision_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_dec_workspace_id ON novee_os_access_decision_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_dec_user_id ON novee_os_access_decision_records(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_dec_module_key ON novee_os_access_decision_records(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_dec_feature_key ON novee_os_access_decision_records(feature_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_dec_plan_key ON novee_os_access_decision_records(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_dec_created_at ON novee_os_access_decision_records(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_access_dec_idempotency ON novee_os_access_decision_records(idempotency_key);

-- ─── BILLING PROVIDER PROFILES ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_billing_provider_profiles (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key                  TEXT NOT NULL,
  provider_name                 TEXT NOT NULL,
  billing_status                TEXT NOT NULL DEFAULT 'not_connected'
                                  CHECK (billing_status IN ('not_connected','configured_placeholder','connected_external','failed','unavailable')),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  external_customer_reference   TEXT,
  external_subscription_reference TEXT,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                        TEXT,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_billing_provider_key ON novee_os_billing_provider_profiles(provider_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_provider_org_id ON novee_os_billing_provider_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_provider_venue_id ON novee_os_billing_provider_profiles(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_provider_workspace_id ON novee_os_billing_provider_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_provider_status ON novee_os_billing_provider_profiles(billing_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_provider_created_at ON novee_os_billing_provider_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_provider_idempotency ON novee_os_billing_provider_profiles(idempotency_key);

-- ─── BILLING CUSTOMER METADATA ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_billing_customer_metadata (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  provider_key                  TEXT NOT NULL DEFAULT 'platform_placeholder',
  external_customer_reference   TEXT,
  billing_status                TEXT NOT NULL DEFAULT 'not_connected',
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_billing_customer_org_id ON novee_os_billing_customer_metadata(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_customer_venue_id ON novee_os_billing_customer_metadata(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_customer_workspace_id ON novee_os_billing_customer_metadata(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_customer_user_id ON novee_os_billing_customer_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_customer_provider_key ON novee_os_billing_customer_metadata(provider_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_customer_created_at ON novee_os_billing_customer_metadata(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_customer_idempotency ON novee_os_billing_customer_metadata(idempotency_key);

-- ─── SUBSCRIPTION METADATA ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_subscription_metadata (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  plan_key                      TEXT NOT NULL,
  provider_key                  TEXT NOT NULL DEFAULT 'platform_placeholder',
  subscription_status           TEXT NOT NULL DEFAULT 'not_started'
                                  CHECK (subscription_status IN ('not_started','active_placeholder','active_external','past_due_placeholder','cancelled_placeholder','cancelled_external','unavailable')),
  external_subscription_reference TEXT,
  external_customer_reference   TEXT,
  billing_interval              TEXT NOT NULL DEFAULT 'none',
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_paid                  BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  renewal_charged               BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                        TEXT,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_subscription_org_id ON novee_os_subscription_metadata(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_subscription_venue_id ON novee_os_subscription_metadata(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_subscription_workspace_id ON novee_os_subscription_metadata(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_subscription_user_id ON novee_os_subscription_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_subscription_plan_key ON novee_os_subscription_metadata(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_subscription_provider_key ON novee_os_subscription_metadata(provider_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_subscription_status ON novee_os_subscription_metadata(subscription_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_subscription_created_at ON novee_os_subscription_metadata(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_subscription_idempotency ON novee_os_subscription_metadata(idempotency_key);

-- ─── INVOICE METADATA ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_invoice_metadata (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  plan_key                      TEXT,
  provider_key                  TEXT NOT NULL DEFAULT 'platform_placeholder',
  invoice_status                TEXT NOT NULL DEFAULT 'draft_placeholder'
                                  CHECK (invoice_status IN ('draft_placeholder','open_placeholder','paid_external','failed_external','void_placeholder','unavailable')),
  external_invoice_reference    TEXT,
  external_customer_reference   TEXT,
  external_subscription_reference TEXT,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_paid                  BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                        TEXT,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_invoice_org_id ON novee_os_invoice_metadata(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_invoice_venue_id ON novee_os_invoice_metadata(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_invoice_workspace_id ON novee_os_invoice_metadata(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_invoice_user_id ON novee_os_invoice_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_invoice_plan_key ON novee_os_invoice_metadata(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_invoice_provider_key ON novee_os_invoice_metadata(provider_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_invoice_status ON novee_os_invoice_metadata(invoice_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_invoice_created_at ON novee_os_invoice_metadata(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_invoice_idempotency ON novee_os_invoice_metadata(idempotency_key);

-- ─── PAYMENT STATUS PLACEHOLDERS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_payment_status_placeholders (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  plan_key                      TEXT,
  provider_key                  TEXT NOT NULL DEFAULT 'platform_placeholder',
  payment_status                TEXT NOT NULL DEFAULT 'not_processed'
                                  CHECK (payment_status IN ('not_processed','pending_external','processed_external','failed_external','unavailable')),
  external_payment_reference    TEXT,
  external_invoice_reference    TEXT,
  external_customer_reference   TEXT,
  external_subscription_reference TEXT,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_paid                  BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                        TEXT,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_payment_ph_org_id ON novee_os_payment_status_placeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_payment_ph_venue_id ON novee_os_payment_status_placeholders(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_payment_ph_workspace_id ON novee_os_payment_status_placeholders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_payment_ph_user_id ON novee_os_payment_status_placeholders(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_payment_ph_provider_key ON novee_os_payment_status_placeholders(provider_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_payment_ph_status ON novee_os_payment_status_placeholders(payment_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_payment_ph_created_at ON novee_os_payment_status_placeholders(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_payment_ph_idempotency ON novee_os_payment_status_placeholders(idempotency_key);

-- ─── UPGRADE / DOWNGRADE REQUESTS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_upgrade_downgrade_requests (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  from_plan_key                 TEXT,
  to_plan_key                   TEXT NOT NULL,
  request_type                  TEXT NOT NULL DEFAULT 'upgrade',
  request_status                TEXT NOT NULL DEFAULT 'draft'
                                  CHECK (request_status IN ('draft','pending_review','approved_placeholder','completed_external','rejected','cancelled','unavailable')),
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                        TEXT,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_upgrade_req_org_id ON novee_os_upgrade_downgrade_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_upgrade_req_venue_id ON novee_os_upgrade_downgrade_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_upgrade_req_workspace_id ON novee_os_upgrade_downgrade_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_upgrade_req_status ON novee_os_upgrade_downgrade_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_upgrade_req_plan_key ON novee_os_upgrade_downgrade_requests(to_plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_upgrade_req_created_at ON novee_os_upgrade_downgrade_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_upgrade_req_idempotency ON novee_os_upgrade_downgrade_requests(idempotency_key);

-- ─── CANCELLATION REQUESTS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_cancellation_requests (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  plan_key                      TEXT,
  request_status                TEXT NOT NULL DEFAULT 'draft'
                                  CHECK (request_status IN ('draft','pending_review','approved_placeholder','completed_external','rejected','cancelled','unavailable')),
  cancellation_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                        TEXT,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  updated_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_cancel_req_org_id ON novee_os_cancellation_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_cancel_req_venue_id ON novee_os_cancellation_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_cancel_req_workspace_id ON novee_os_cancellation_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_cancel_req_plan_key ON novee_os_cancellation_requests(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_cancel_req_status ON novee_os_cancellation_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_cancel_req_created_at ON novee_os_cancellation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_cancel_req_idempotency ON novee_os_cancellation_requests(idempotency_key);

-- ─── RENEWAL REMINDER RECORDS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_renewal_reminder_records (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  plan_key                      TEXT,
  provider_key                  TEXT DEFAULT 'platform_placeholder',
  reminder_status               TEXT NOT NULL DEFAULT 'pending_review',
  renewal_charged               BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_renewal_org_id ON novee_os_renewal_reminder_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_renewal_venue_id ON novee_os_renewal_reminder_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_renewal_workspace_id ON novee_os_renewal_reminder_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_renewal_user_id ON novee_os_renewal_reminder_records(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_renewal_plan_key ON novee_os_renewal_reminder_records(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_renewal_created_at ON novee_os_renewal_reminder_records(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_renewal_idempotency ON novee_os_renewal_reminder_records(idempotency_key);

-- ─── MARKETPLACE PURCHASE PLACEHOLDERS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_marketplace_purchase_placeholders (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  module_key                    TEXT,
  addon_key                     TEXT,
  plan_key                      TEXT,
  provider_key                  TEXT DEFAULT 'platform_placeholder',
  purchase_status               TEXT NOT NULL DEFAULT 'pending_review',
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_marketplace_org_id ON novee_os_marketplace_purchase_placeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_marketplace_venue_id ON novee_os_marketplace_purchase_placeholders(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_marketplace_workspace_id ON novee_os_marketplace_purchase_placeholders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_marketplace_user_id ON novee_os_marketplace_purchase_placeholders(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_marketplace_module_key ON novee_os_marketplace_purchase_placeholders(module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_marketplace_addon_key ON novee_os_marketplace_purchase_placeholders(addon_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_marketplace_plan_key ON novee_os_marketplace_purchase_placeholders(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_marketplace_created_at ON novee_os_marketplace_purchase_placeholders(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_marketplace_idempotency ON novee_os_marketplace_purchase_placeholders(idempotency_key);

-- ─── LICENSE HEALTH CHECKS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_license_health_checks (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  plan_key                      TEXT,
  health_status                 TEXT NOT NULL DEFAULT 'unknown'
                                  CHECK (health_status IN ('unknown','healthy_placeholder','degraded','failed','unavailable')),
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_paid                  BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  trial_converted               BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  renewal_charged               BOOLEAN NOT NULL DEFAULT FALSE,
  entitlement_active            BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_license_health_org_id ON novee_os_license_health_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_license_health_venue_id ON novee_os_license_health_checks(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_license_health_workspace_id ON novee_os_license_health_checks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_license_health_user_id ON novee_os_license_health_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_license_health_plan_key ON novee_os_license_health_checks(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_license_health_status ON novee_os_license_health_checks(health_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_license_health_created_at ON novee_os_license_health_checks(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_license_health_idempotency ON novee_os_license_health_checks(idempotency_key);

-- ─── BILLING GOVERNANCE SNAPSHOTS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_billing_governance_snapshots (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_version              INTEGER NOT NULL DEFAULT 1,
  plan_catalog_count            INTEGER NOT NULL DEFAULT 0,
  organization_license_count    INTEGER NOT NULL DEFAULT 0,
  venue_license_count           INTEGER NOT NULL DEFAULT 0,
  workspace_license_count       INTEGER NOT NULL DEFAULT 0,
  active_trial_count            INTEGER NOT NULL DEFAULT 0,
  active_entitlement_count      INTEGER NOT NULL DEFAULT 0,
  governance_status             TEXT NOT NULL DEFAULT 'draft',
  billing_connected             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed             BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active           BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_paid                  BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  trial_converted               BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  renewal_charged               BOOLEAN NOT NULL DEFAULT FALSE,
  entitlement_active            BOOLEAN NOT NULL DEFAULT FALSE,
  provider_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id                 TEXT,
  idempotency_key               TEXT UNIQUE,
  metadata                      JSONB,
  created_by                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_billing_snapshot_created_at ON novee_os_billing_governance_snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_snapshot_idempotency ON novee_os_billing_governance_snapshots(idempotency_key);

-- ─── BILLING AUDIT ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS novee_os_billing_audit (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID,
  venue_id                      UUID,
  workspace_id                  UUID,
  user_id                       TEXT,
  actor_user_id                 TEXT NOT NULL DEFAULT 'system',
  action                        TEXT NOT NULL,
  entity_type                   TEXT NOT NULL,
  entity_id                     TEXT,
  plan_key                      TEXT,
  provider_key                  TEXT,
  before_snapshot               JSONB,
  after_snapshot                JSONB,
  reason                        TEXT,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets                BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_billing_audit_org_id ON novee_os_billing_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_audit_venue_id ON novee_os_billing_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_audit_workspace_id ON novee_os_billing_audit(workspace_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_audit_user_id ON novee_os_billing_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_audit_actor ON novee_os_billing_audit(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_audit_action ON novee_os_billing_audit(action);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_audit_entity_type ON novee_os_billing_audit(entity_type);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_audit_plan_key ON novee_os_billing_audit(plan_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_audit_provider_key ON novee_os_billing_audit(provider_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_billing_audit_created_at ON novee_os_billing_audit(created_at);
