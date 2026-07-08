-- Migration 060: NOVEE OS Universal 360 Platform Registry
-- Safe migration: no destructive DDL, no truncation
-- contains_secrets: false, stores_secrets: false
-- NOVEE OS powers all present and future 360 platforms.
-- No platform is marked production_ready without verified implementation.

CREATE TABLE IF NOT EXISTS novee_os_360_platform_registry (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                    UUID,
  org_id                       UUID,
  workspace_id                 UUID,
  platform_key                 TEXT NOT NULL UNIQUE,
  platform_name                TEXT NOT NULL,
  platform_type                TEXT NOT NULL,
  platform_category            TEXT NOT NULL,
  parent_platform              TEXT NOT NULL DEFAULT 'novee_os',
  brand_family                 TEXT,
  owner_scope                  TEXT,
  target_market                TEXT,
  target_user_type             TEXT,
  install_status               TEXT NOT NULL DEFAULT 'not_installed',
  activation_status            TEXT NOT NULL DEFAULT 'reserved',
  entitlement_status           TEXT NOT NULL DEFAULT 'not_entitled',
  license_status               TEXT NOT NULL DEFAULT 'unlicensed',
  version                      TEXT NOT NULL DEFAULT '0.0.0',
  preview_only                 BOOLEAN NOT NULL DEFAULT TRUE,
  reserved_only                BOOLEAN NOT NULL DEFAULT FALSE,
  production_ready             BOOLEAN NOT NULL DEFAULT FALSE,
  ai_supported                 BOOLEAN NOT NULL DEFAULT FALSE,
  coaching_supported           BOOLEAN NOT NULL DEFAULT FALSE,
  commerce_supported           BOOLEAN NOT NULL DEFAULT FALSE,
  education_supported          BOOLEAN NOT NULL DEFAULT FALSE,
  analytics_supported          BOOLEAN NOT NULL DEFAULT FALSE,
  remote_activation_supported  BOOLEAN NOT NULL DEFAULT FALSE,
  white_label_supported        BOOLEAN NOT NULL DEFAULT FALSE,
  required_modules_json        JSONB NOT NULL DEFAULT '[]',
  dependencies_json            JSONB NOT NULL DEFAULT '[]',
  required_permissions_json    JSONB NOT NULL DEFAULT '[]',
  required_integrations_json   JSONB NOT NULL DEFAULT '[]',
  required_documentation_json  JSONB NOT NULL DEFAULT '[]',
  idempotency_key              TEXT UNIQUE,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_360_platform_registry_key    ON novee_os_360_platform_registry (platform_key);
CREATE INDEX IF NOT EXISTS idx_360_platform_registry_type   ON novee_os_360_platform_registry (platform_type);
CREATE INDEX IF NOT EXISTS idx_360_platform_registry_status ON novee_os_360_platform_registry (activation_status);
