-- NOVEE OS Module Registry & Platform Control Center
-- Migration 048 — CREATE TABLE IF NOT EXISTS only, no destructive changes

CREATE TABLE IF NOT EXISTS novee_os_module_registry (
  id                          SERIAL PRIMARY KEY,
  module_key                  VARCHAR(128) NOT NULL UNIQUE,
  module_name                 VARCHAR(255) NOT NULL,
  module_category             VARCHAR(64)  NOT NULL,
  module_status               VARCHAR(64)  NOT NULL DEFAULT 'registered',
  module_version              VARCHAR(32)  NOT NULL DEFAULT '0.1.0',
  description                 TEXT,
  organization_id             UUID,
  venue_id                    UUID,
  install_status              VARCHAR(64)  NOT NULL DEFAULT 'not_installed',
  activation_status           VARCHAR(64)  NOT NULL DEFAULT 'not_active',
  readiness_status            VARCHAR(64)  NOT NULL DEFAULT 'not_checked',
  health_status               VARCHAR(64)  NOT NULL DEFAULT 'unknown',
  demo_live_mode              VARCHAR(64)  NOT NULL DEFAULT 'demo',
  live_provider_connected     BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified            BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected           BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                    JSONB,
  idempotency_key             VARCHAR(255),
  created_by                  VARCHAR(255),
  updated_by                  VARCHAR(255),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_module_registry_key      ON novee_os_module_registry (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_registry_category ON novee_os_module_registry (module_category);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_registry_status   ON novee_os_module_registry (module_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_registry_install  ON novee_os_module_registry (install_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_registry_activation ON novee_os_module_registry (activation_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_registry_org      ON novee_os_module_registry (organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_registry_venue    ON novee_os_module_registry (venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_registry_created  ON novee_os_module_registry (created_at);

CREATE TABLE IF NOT EXISTS novee_os_module_versions (
  id              SERIAL PRIMARY KEY,
  module_key      VARCHAR(128) NOT NULL,
  module_version  VARCHAR(32)  NOT NULL,
  changelog       TEXT,
  release_notes   TEXT,
  organization_id UUID,
  venue_id        UUID,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  metadata        JSONB,
  idempotency_key VARCHAR(255),
  created_by      VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_module_versions_key     ON novee_os_module_versions (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_versions_created ON novee_os_module_versions (created_at);

CREATE TABLE IF NOT EXISTS novee_os_module_routes (
  id              SERIAL PRIMARY KEY,
  module_key      VARCHAR(128) NOT NULL,
  route_path      VARCHAR(512) NOT NULL,
  http_method     VARCHAR(16)  NOT NULL DEFAULT 'GET',
  route_label     VARCHAR(255),
  guard_required  VARCHAR(128),
  organization_id UUID,
  venue_id        UUID,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key VARCHAR(255),
  created_by      VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_module_routes_key     ON novee_os_module_routes (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_routes_created ON novee_os_module_routes (created_at);

CREATE TABLE IF NOT EXISTS novee_os_module_frontend_routes (
  id              SERIAL PRIMARY KEY,
  module_key      VARCHAR(128) NOT NULL,
  route_path      VARCHAR(512) NOT NULL,
  component_name  VARCHAR(255),
  guard_required  VARCHAR(128),
  organization_id UUID,
  venue_id        UUID,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key VARCHAR(255),
  created_by      VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_module_frontend_routes_key ON novee_os_module_frontend_routes (module_key);

CREATE TABLE IF NOT EXISTS novee_os_module_dependencies (
  id                    SERIAL PRIMARY KEY,
  module_key            VARCHAR(128) NOT NULL,
  dependency_module_key VARCHAR(128) NOT NULL,
  dependency_status     VARCHAR(64)  NOT NULL DEFAULT 'required',
  organization_id       UUID,
  venue_id              UUID,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key       VARCHAR(255),
  created_by            VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_module_deps_key ON novee_os_module_dependencies (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_deps_dep ON novee_os_module_dependencies (dependency_module_key);

CREATE TABLE IF NOT EXISTS novee_os_module_permissions (
  id              SERIAL PRIMARY KEY,
  module_key      VARCHAR(128) NOT NULL,
  permission_key  VARCHAR(255) NOT NULL,
  permission_scope VARCHAR(64) NOT NULL DEFAULT 'staff',
  description     TEXT,
  organization_id UUID,
  venue_id        UUID,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key VARCHAR(255),
  created_by      VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_module_permissions_key  ON novee_os_module_permissions (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_permissions_pkey ON novee_os_module_permissions (permission_key);

CREATE TABLE IF NOT EXISTS novee_os_module_feature_flags (
  id               SERIAL PRIMARY KEY,
  module_key       VARCHAR(128) NOT NULL,
  feature_flag_key VARCHAR(255) NOT NULL,
  flag_value       BOOLEAN NOT NULL DEFAULT FALSE,
  description      TEXT,
  organization_id  UUID,
  venue_id         UUID,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets   BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key  VARCHAR(255),
  created_by       VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_module_flags_key     ON novee_os_module_feature_flags (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_flags_fkey    ON novee_os_module_feature_flags (feature_flag_key);

CREATE TABLE IF NOT EXISTS novee_os_module_installations (
  id              SERIAL PRIMARY KEY,
  module_key      VARCHAR(128) NOT NULL,
  module_version  VARCHAR(32),
  install_status  VARCHAR(64)  NOT NULL DEFAULT 'not_installed',
  install_reason  TEXT,
  organization_id UUID,
  venue_id        UUID,
  live_provider_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified               BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected              BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets   BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data    BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key  VARCHAR(255),
  created_by       VARCHAR(255),
  updated_by       VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_module_installs_key    ON novee_os_module_installations (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_installs_status ON novee_os_module_installations (install_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_installs_org    ON novee_os_module_installations (organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_installs_venue  ON novee_os_module_installations (venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_installs_ikey   ON novee_os_module_installations (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_module_installs_created ON novee_os_module_installations (created_at);

CREATE TABLE IF NOT EXISTS novee_os_module_activation_states (
  id                SERIAL PRIMARY KEY,
  module_key        VARCHAR(128) NOT NULL,
  module_version    VARCHAR(32),
  activation_status VARCHAR(64)  NOT NULL DEFAULT 'not_active',
  activation_reason TEXT,
  organization_id   UUID,
  venue_id          UUID,
  live_provider_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified               BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected              BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets    BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data   BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key   VARCHAR(255),
  created_by        VARCHAR(255),
  updated_by        VARCHAR(255),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_activation_key    ON novee_os_module_activation_states (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_activation_status ON novee_os_module_activation_states (activation_status);
CREATE INDEX IF NOT EXISTS idx_novee_os_activation_org    ON novee_os_module_activation_states (organization_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_activation_venue  ON novee_os_module_activation_states (venue_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_activation_ikey   ON novee_os_module_activation_states (idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_module_tenant_availability (
  id              SERIAL PRIMARY KEY,
  module_key      VARCHAR(128) NOT NULL,
  organization_id UUID,
  available       BOOLEAN NOT NULL DEFAULT FALSE,
  availability_status VARCHAR(64) NOT NULL DEFAULT 'unavailable',
  reason          TEXT,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key VARCHAR(255),
  created_by      VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_tenant_avail_key ON novee_os_module_tenant_availability (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_tenant_avail_org ON novee_os_module_tenant_availability (organization_id);

CREATE TABLE IF NOT EXISTS novee_os_module_venue_availability (
  id              SERIAL PRIMARY KEY,
  module_key      VARCHAR(128) NOT NULL,
  venue_id        UUID,
  organization_id UUID,
  available       BOOLEAN NOT NULL DEFAULT FALSE,
  availability_status VARCHAR(64) NOT NULL DEFAULT 'unavailable',
  reason          TEXT,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key VARCHAR(255),
  created_by      VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_venue_avail_key   ON novee_os_module_venue_availability (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_venue_avail_venue ON novee_os_module_venue_availability (venue_id);

CREATE TABLE IF NOT EXISTS novee_os_module_plan_requirements (
  id                     SERIAL PRIMARY KEY,
  module_key             VARCHAR(128) NOT NULL,
  plan_requirement_status VARCHAR(64) NOT NULL DEFAULT 'not_required',
  plan_name              VARCHAR(255),
  description            TEXT,
  organization_id        UUID,
  venue_id               UUID,
  contains_secrets       BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets         BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key        VARCHAR(255),
  created_by             VARCHAR(255),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_plan_req_key ON novee_os_module_plan_requirements (module_key);

CREATE TABLE IF NOT EXISTS novee_os_module_license_requirements (
  id                       SERIAL PRIMARY KEY,
  module_key               VARCHAR(128) NOT NULL,
  license_requirement_status VARCHAR(64) NOT NULL DEFAULT 'not_required',
  license_name             VARCHAR(255),
  license_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  description              TEXT,
  organization_id          UUID,
  venue_id                 UUID,
  contains_secrets         BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets           BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key          VARCHAR(255),
  created_by               VARCHAR(255),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_license_req_key ON novee_os_module_license_requirements (module_key);

CREATE TABLE IF NOT EXISTS novee_os_module_demo_live_modes (
  id              SERIAL PRIMARY KEY,
  module_key      VARCHAR(128) NOT NULL,
  demo_live_mode  VARCHAR(64)  NOT NULL DEFAULT 'demo',
  reason          TEXT,
  organization_id UUID,
  venue_id        UUID,
  live_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key VARCHAR(255),
  created_by      VARCHAR(255),
  updated_by      VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_demo_live_key  ON novee_os_module_demo_live_modes (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_demo_live_mode ON novee_os_module_demo_live_modes (demo_live_mode);

CREATE TABLE IF NOT EXISTS novee_os_module_readiness_records (
  id               SERIAL PRIMARY KEY,
  module_key       VARCHAR(128) NOT NULL,
  readiness_status VARCHAR(64)  NOT NULL DEFAULT 'not_checked',
  notes            TEXT,
  organization_id  UUID,
  venue_id         UUID,
  live_provider_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_purchase_completed BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified               BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected              BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_ai_generated_content  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets   BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key  VARCHAR(255),
  created_by       VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_readiness_key    ON novee_os_module_readiness_records (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_readiness_status ON novee_os_module_readiness_records (readiness_status);

CREATE TABLE IF NOT EXISTS novee_os_module_health_checks (
  id              SERIAL PRIMARY KEY,
  module_key      VARCHAR(128) NOT NULL,
  health_status   VARCHAR(64)  NOT NULL DEFAULT 'unknown',
  check_notes     TEXT,
  organization_id UUID,
  venue_id        UUID,
  live_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key VARCHAR(255),
  created_by      VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_health_key    ON novee_os_module_health_checks (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_health_status ON novee_os_module_health_checks (health_status);

CREATE TABLE IF NOT EXISTS novee_os_module_rollbacks (
  id              SERIAL PRIMARY KEY,
  module_key      VARCHAR(128) NOT NULL,
  module_version  VARCHAR(32),
  rollback_status VARCHAR(64)  NOT NULL DEFAULT 'not_requested',
  rollback_reason TEXT,
  rollback_metadata JSONB,
  organization_id UUID,
  venue_id        UUID,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key VARCHAR(255),
  created_by      VARCHAR(255),
  updated_by      VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, module_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_rollback_key    ON novee_os_module_rollbacks (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_rollback_status ON novee_os_module_rollbacks (rollback_status);

CREATE TABLE IF NOT EXISTS novee_os_module_audit (
  id              SERIAL PRIMARY KEY,
  module_key      VARCHAR(128),
  actor_user_id   VARCHAR(255),
  action          VARCHAR(255) NOT NULL,
  entity_type     VARCHAR(128),
  entity_id       VARCHAR(255),
  before_snapshot JSONB,
  after_snapshot  JSONB,
  reason          TEXT,
  organization_id UUID,
  venue_id        UUID,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data   BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novee_os_audit_key     ON novee_os_module_audit (module_key);
CREATE INDEX IF NOT EXISTS idx_novee_os_audit_actor   ON novee_os_module_audit (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_novee_os_audit_action  ON novee_os_module_audit (action);
CREATE INDEX IF NOT EXISTS idx_novee_os_audit_created ON novee_os_module_audit (created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_audit_ikey    ON novee_os_module_audit (idempotency_key);

CREATE TABLE IF NOT EXISTS novee_os_platform_control_snapshots (
  id                   SERIAL PRIMARY KEY,
  snapshot_label       VARCHAR(255),
  total_modules        INTEGER NOT NULL DEFAULT 0,
  registered_modules   INTEGER NOT NULL DEFAULT 0,
  active_modules       INTEGER NOT NULL DEFAULT 0,
  installed_modules    INTEGER NOT NULL DEFAULT 0,
  platform_status      VARCHAR(64) NOT NULL DEFAULT 'foundation_ready',
  live_providers_connected BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected    BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed BOOLEAN NOT NULL DEFAULT FALSE,
  snapshot_data        JSONB,
  organization_id      UUID,
  venue_id             UUID,
  contains_secrets     BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets       BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key      VARCHAR(255),
  created_by           VARCHAR(255),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_novee_os_snapshots_created ON novee_os_platform_control_snapshots (created_at);
CREATE INDEX IF NOT EXISTS idx_novee_os_snapshots_ikey    ON novee_os_platform_control_snapshots (idempotency_key);
