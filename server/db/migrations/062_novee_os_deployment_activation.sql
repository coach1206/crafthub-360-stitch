-- NOVEE OS — Deployment Activation Center (Phase D.7 / Phase E.4)
-- Migration: 062_novee_os_deployment_activation.sql
-- Safe migration — CREATE TABLE IF NOT EXISTS only. No drops. No renames.
-- contains_secrets: false
-- stores_secrets: false

-- ── A. Deployment Environment Registry ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_deployment_environment_registry (
  environment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID,
  environment_key     TEXT NOT NULL,
  environment_name    TEXT NOT NULL,
  environment_type    TEXT NOT NULL,
  hosting_provider    TEXT,
  status              TEXT NOT NULL DEFAULT 'preview',
  production_candidate BOOLEAN NOT NULL DEFAULT FALSE,
  verified            BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  last_verified_at    TIMESTAMPTZ,
  safe_claim          TEXT,
  idempotency_key     TEXT UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deploy_env_tenant   ON novee_os_deployment_environment_registry (tenant_id);
CREATE INDEX IF NOT EXISTS idx_deploy_env_type     ON novee_os_deployment_environment_registry (environment_type);
CREATE INDEX IF NOT EXISTS idx_deploy_env_status   ON novee_os_deployment_environment_registry (status);

-- ── B. Deployment Readiness Gates ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_deployment_readiness_gates (
  gate_id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID,
  gate_key                    TEXT NOT NULL,
  gate_name                   TEXT NOT NULL,
  gate_category               TEXT NOT NULL,
  required_for_deployment     BOOLEAN NOT NULL DEFAULT TRUE,
  required_for_remote_distribution BOOLEAN NOT NULL DEFAULT TRUE,
  status                      TEXT NOT NULL DEFAULT 'pending',
  blocker_reason              TEXT,
  evidence_required           BOOLEAN NOT NULL DEFAULT TRUE,
  evidence_present            BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deploy_gates_tenant ON novee_os_deployment_readiness_gates (tenant_id);
CREATE INDEX IF NOT EXISTS idx_deploy_gates_key    ON novee_os_deployment_readiness_gates (gate_key);
CREATE INDEX IF NOT EXISTS idx_deploy_gates_status ON novee_os_deployment_readiness_gates (status);

-- ── C. Deployment Package Registry ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_deployment_package_registry (
  package_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                  UUID,
  package_key                TEXT NOT NULL,
  package_name               TEXT NOT NULL,
  package_type               TEXT NOT NULL,
  version_label              TEXT,
  status                     TEXT NOT NULL DEFAULT 'preview',
  build_status               TEXT NOT NULL DEFAULT 'not_built',
  verification_status        TEXT NOT NULL DEFAULT 'not_verified',
  security_gate_status       TEXT NOT NULL DEFAULT 'pending',
  deployment_ready           BOOLEAN NOT NULL DEFAULT FALSE,
  remote_distribution_ready  BOOLEAN NOT NULL DEFAULT FALSE,
  safe_claim                 TEXT,
  idempotency_key            TEXT UNIQUE,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deploy_pkg_tenant ON novee_os_deployment_package_registry (tenant_id);
CREATE INDEX IF NOT EXISTS idx_deploy_pkg_type   ON novee_os_deployment_package_registry (package_type);
CREATE INDEX IF NOT EXISTS idx_deploy_pkg_status ON novee_os_deployment_package_registry (status);

-- ── D. Deployment Audit Log ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_deployment_audit_log (
  audit_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID,
  actor_id       TEXT,
  actor_role     TEXT,
  event_type     TEXT NOT NULL,
  event_category TEXT NOT NULL,
  severity       TEXT NOT NULL DEFAULT 'info',
  summary        TEXT NOT NULL,
  metadata_json  JSONB,
  ip_address     TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deploy_audit_tenant   ON novee_os_deployment_audit_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_deploy_audit_type     ON novee_os_deployment_audit_log (event_type);
CREATE INDEX IF NOT EXISTS idx_deploy_audit_severity ON novee_os_deployment_audit_log (severity);

-- ── E. Rollback Plan Registry ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_rollback_plan_registry (
  rollback_plan_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID,
  plan_key                  TEXT NOT NULL,
  plan_name                 TEXT NOT NULL,
  package_id                UUID,
  version_label             TEXT,
  rollback_available        BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_execution_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_tested           BOOLEAN NOT NULL DEFAULT FALSE,
  blocker_reason            TEXT,
  safe_claim                TEXT,
  idempotency_key           TEXT UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rollback_tenant ON novee_os_rollback_plan_registry (tenant_id);
CREATE INDEX IF NOT EXISTS idx_rollback_key    ON novee_os_rollback_plan_registry (plan_key);

-- ── F. Deployment Evidence Registry ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_deployment_evidence_registry (
  evidence_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID,
  evidence_type   TEXT NOT NULL,
  evidence_title  TEXT NOT NULL,
  evidence_status TEXT NOT NULL DEFAULT 'pending',
  source          TEXT,
  verified_by     TEXT,
  verified_at     TIMESTAMPTZ,
  notes           TEXT,
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deploy_evidence_tenant ON novee_os_deployment_evidence_registry (tenant_id);
CREATE INDEX IF NOT EXISTS idx_deploy_evidence_type   ON novee_os_deployment_evidence_registry (evidence_type);
CREATE INDEX IF NOT EXISTS idx_deploy_evidence_status ON novee_os_deployment_evidence_registry (evidence_status);
