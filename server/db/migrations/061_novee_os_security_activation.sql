-- NOVEE OS — Security Activation Center (Phase D.6 / Phase E.3)
-- Migration: 061_novee_os_security_activation.sql
-- Safe migration — CREATE TABLE IF NOT EXISTS only. No drops. No renames.
-- contains_secrets: false
-- stores_secrets: false

-- ── A. Security Provider Registry ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_security_provider_registry (
  provider_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID,
  provider_key             TEXT NOT NULL,
  provider_name            TEXT NOT NULL,
  provider_type            TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'preview',
  configured               BOOLEAN NOT NULL DEFAULT FALSE,
  production_ready         BOOLEAN NOT NULL DEFAULT FALSE,
  live_connection_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  credential_reference_only BOOLEAN NOT NULL DEFAULT TRUE,
  last_verified_at         TIMESTAMPTZ,
  idempotency_key          TEXT UNIQUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_providers_tenant   ON novee_os_security_provider_registry (tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_providers_type     ON novee_os_security_provider_registry (provider_type);
CREATE INDEX IF NOT EXISTS idx_security_providers_status   ON novee_os_security_provider_registry (status);

-- ── B. Security Activation Gates ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_security_activation_gates (
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

CREATE INDEX IF NOT EXISTS idx_security_gates_tenant   ON novee_os_security_activation_gates (tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_gates_key      ON novee_os_security_activation_gates (gate_key);
CREATE INDEX IF NOT EXISTS idx_security_gates_status   ON novee_os_security_activation_gates (status);

-- ── C. Security Audit Log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_security_audit_log (
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

CREATE INDEX IF NOT EXISTS idx_security_audit_tenant   ON novee_os_security_audit_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_type     ON novee_os_security_audit_log (event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON novee_os_security_audit_log (severity);

-- ── D. Security Risk Registry ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_security_risk_registry (
  risk_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID,
  risk_key           TEXT NOT NULL,
  risk_title         TEXT NOT NULL,
  risk_category      TEXT NOT NULL,
  severity           TEXT NOT NULL DEFAULT 'medium',
  status             TEXT NOT NULL DEFAULT 'open',
  owner_role         TEXT,
  mitigation_summary TEXT,
  blocker            BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key    TEXT UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_risks_tenant   ON novee_os_security_risk_registry (tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_risks_severity ON novee_os_security_risk_registry (severity);
CREATE INDEX IF NOT EXISTS idx_security_risks_status   ON novee_os_security_risk_registry (status);

-- ── E. Security Readiness Evidence ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_security_readiness_evidence (
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

CREATE INDEX IF NOT EXISTS idx_security_evidence_tenant ON novee_os_security_readiness_evidence (tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_evidence_type   ON novee_os_security_readiness_evidence (evidence_type);
CREATE INDEX IF NOT EXISTS idx_security_evidence_status ON novee_os_security_readiness_evidence (evidence_status);

-- ── F. Security Feature Flags Snapshot ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS novee_os_security_feature_flags_snapshot (
  snapshot_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  flag_key          TEXT NOT NULL,
  flag_value        BOOLEAN NOT NULL DEFAULT FALSE,
  flag_category     TEXT NOT NULL,
  production_impact BOOLEAN NOT NULL DEFAULT FALSE,
  safe_default      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_flags_tenant ON novee_os_security_feature_flags_snapshot (tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_flags_key    ON novee_os_security_feature_flags_snapshot (flag_key);
