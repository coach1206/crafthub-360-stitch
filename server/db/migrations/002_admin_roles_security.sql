-- ============================================================
-- Migration 002 — Admin Roles + Security Layer
-- Applied: Phase 8
-- Description: Adds system_users, role_permissions,
--   founder_controls, protected_route_rules, security_events.
-- Does NOT modify Phase 7 tables.
-- ============================================================

BEGIN;

-- ── system_users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_users (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT        NOT NULL UNIQUE,
  email         TEXT        UNIQUE,
  display_name  TEXT,
  role          TEXT        NOT NULL DEFAULT 'staff'
                  CHECK (role IN ('founder_level_0','admin','manager','staff','guest')),
  status        TEXT        NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive','suspended')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- ── role_permissions ──────────────────────────────────────────
-- Allows dynamic overrides of the static roleMap.
CREATE TABLE IF NOT EXISTS role_permissions (
  id             BIGSERIAL PRIMARY KEY,
  role           TEXT        NOT NULL,
  permission_key TEXT        NOT NULL,
  enabled        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role, permission_key)
);

-- ── founder_controls ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS founder_controls (
  id            BIGSERIAL PRIMARY KEY,
  control_key   TEXT        NOT NULL UNIQUE,
  control_value JSONB       NOT NULL DEFAULT '{}',
  locked        BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_by    TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default founder control keys
INSERT INTO founder_controls (control_key, control_value, locked) VALUES
  ('revenue_settings',     '{"tier":"standard","commissionRate":0,"status":"locked"}', TRUE),
  ('deployment_controls',  '{"environment":"development","deployLock":false,"status":"prototype"}', FALSE),
  ('emergency_lock',       '{"active":false,"activatedAt":null,"reason":null,"status":"prototype"}', FALSE),
  ('integration_settings', '{"pos":"prototype","crm":"prototype","analytics":"prototype"}', FALSE),
  ('license',              '{"status":"prototype","venueId":"novee-grand-lounge","tier":"development"}', TRUE)
ON CONFLICT (control_key) DO NOTHING;

-- ── protected_route_rules ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS protected_route_rules (
  id              BIGSERIAL PRIMARY KEY,
  route_path      TEXT        NOT NULL UNIQUE,
  required_role   TEXT,
  permission_key  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed core protected routes
INSERT INTO protected_route_rules (route_path, required_role, permission_key) VALUES
  ('/api/pos3/*',       'staff',           'access_pos3_staff'),
  ('/api/eat/*',        'manager',         'access_eat_command'),
  ('/api/audit/*',      'manager',         'view_audit_logs'),
  ('/api/admin/*',      'admin',           'view_command_center'),
  ('/api/founder/*',    'founder_level_0', 'founder_override')
ON CONFLICT (route_path) DO NOTHING;

-- ── security_events ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_events (
  id         BIGSERIAL PRIMARY KEY,
  actor_id   TEXT,
  actor_role TEXT        NOT NULL DEFAULT 'guest',
  event_type TEXT        NOT NULL,
  route_path TEXT,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_actor_id   ON security_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_users_role          ON system_users(role);
CREATE INDEX IF NOT EXISTS idx_system_users_status        ON system_users(status);

COMMIT;
