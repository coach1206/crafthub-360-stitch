-- Migration 029: SmokeCraft Persistence Hardening (Production Phase A)
-- Safe to run multiple times (all CREATE TABLE IF NOT EXISTS).
-- Creates database-backed tables for SmokeCraft operational data areas
-- that previously existed only in memory fallback.

-- ── smokecraft_orders ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_orders (
  id                      SERIAL PRIMARY KEY,
  order_id                TEXT        NOT NULL UNIQUE,
  venue_id                TEXT,
  user_id                 TEXT,
  session_id              TEXT,
  visit_id                TEXT,
  table_id                TEXT,
  server_id               TEXT,
  order_mode              TEXT,
  order_status            TEXT        NOT NULL DEFAULT 'draft',
  items                   JSONB       NOT NULL DEFAULT '[]'::jsonb,
  pairing_recommendations JSONB       NOT NULL DEFAULT '[]'::jsonb,
  customer_notes          TEXT        NOT NULL DEFAULT '',
  staff_notes             TEXT        NOT NULL DEFAULT '',
  source_module           TEXT        NOT NULL DEFAULT 'smokecraft-experience',
  target_system           TEXT,
  sync_status             TEXT        NOT NULL DEFAULT 'not_connected',
  pos_sync_status         TEXT        NOT NULL DEFAULT 'not_connected',
  eat_sync_status         TEXT        NOT NULL DEFAULT 'not_connected',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_orders_venue_id      ON smokecraft_orders(venue_id);
CREATE INDEX IF NOT EXISTS idx_sc_orders_user_id       ON smokecraft_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_sc_orders_session_id    ON smokecraft_orders(session_id);
CREATE INDEX IF NOT EXISTS idx_sc_orders_created_at    ON smokecraft_orders(created_at DESC);

-- ── smokecraft_order_audit ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_order_audit (
  id          SERIAL PRIMARY KEY,
  audit_id    TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  order_id    TEXT,
  event_type  TEXT        NOT NULL,
  actor_role  TEXT,
  actor_id    TEXT,
  venue_id    TEXT,
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_order_audit_order_id  ON smokecraft_order_audit(order_id);
CREATE INDEX IF NOT EXISTS idx_sc_order_audit_created   ON smokecraft_order_audit(created_at DESC);

-- ── smokecraft_staff_queue ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_staff_queue (
  id          SERIAL PRIMARY KEY,
  queue_id    TEXT        NOT NULL UNIQUE,
  venue_id    TEXT,
  order_id    TEXT,
  staff_id    TEXT,
  queue_type  TEXT        NOT NULL DEFAULT 'general',
  status      TEXT        NOT NULL DEFAULT 'queued',
  priority    INTEGER     NOT NULL DEFAULT 0,
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_staff_queue_venue     ON smokecraft_staff_queue(venue_id);
CREATE INDEX IF NOT EXISTS idx_sc_staff_queue_status    ON smokecraft_staff_queue(status);
CREATE INDEX IF NOT EXISTS idx_sc_staff_queue_created   ON smokecraft_staff_queue(created_at DESC);

-- ── smokecraft_venue_menu ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_venue_menu (
  id          SERIAL PRIMARY KEY,
  menu_id     TEXT        NOT NULL UNIQUE,
  venue_id    TEXT,
  menu_source TEXT        NOT NULL DEFAULT 'local_fallback',
  menu_data   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_venue_menu_venue ON smokecraft_venue_menu(venue_id);

-- ── smokecraft_pairing_profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_pairing_profiles (
  id          SERIAL PRIMARY KEY,
  profile_id  TEXT        NOT NULL UNIQUE,
  user_id     TEXT,
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_pairing_profiles_user ON smokecraft_pairing_profiles(user_id);

-- ── smokecraft_pairing_recommendations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_pairing_recommendations (
  id                 SERIAL PRIMARY KEY,
  recommendation_id  TEXT        NOT NULL UNIQUE,
  profile_id         TEXT,
  user_id            TEXT,
  session_id         TEXT,
  data               JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_pairing_recs_user    ON smokecraft_pairing_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_sc_pairing_recs_session ON smokecraft_pairing_recommendations(session_id);

-- ── smokecraft_pairing_audit ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_pairing_audit (
  id          SERIAL PRIMARY KEY,
  audit_id    TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  profile_id  TEXT,
  user_id     TEXT,
  event_type  TEXT        NOT NULL,
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_pairing_audit_user    ON smokecraft_pairing_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_sc_pairing_audit_created ON smokecraft_pairing_audit(created_at DESC);

-- ── smokecraft_flavor_memory ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_flavor_memory (
  id          SERIAL PRIMARY KEY,
  memory_id   TEXT        NOT NULL UNIQUE,
  session_id  TEXT,
  user_id     TEXT,
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_flavor_memory_user    ON smokecraft_flavor_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_sc_flavor_memory_session ON smokecraft_flavor_memory(session_id);

-- ── smokecraft_rewards ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_rewards (
  id          SERIAL PRIMARY KEY,
  reward_id   TEXT        NOT NULL UNIQUE,
  user_id     TEXT,
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_rewards_user    ON smokecraft_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_sc_rewards_created ON smokecraft_rewards(created_at DESC);

-- ── smokecraft_reward_audit ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_reward_audit (
  id          SERIAL PRIMARY KEY,
  audit_id    TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  reward_id   TEXT,
  user_id     TEXT,
  event_type  TEXT        NOT NULL,
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_reward_audit_user    ON smokecraft_reward_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_sc_reward_audit_created ON smokecraft_reward_audit(created_at DESC);

-- ── smokecraft_loyalty_records ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_loyalty_records (
  id          SERIAL PRIMARY KEY,
  loyalty_id  TEXT        NOT NULL UNIQUE,
  user_id     TEXT,
  venue_id    TEXT,
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_loyalty_user  ON smokecraft_loyalty_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sc_loyalty_venue ON smokecraft_loyalty_records(venue_id);

-- ── smokecraft_passport_rewards ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_passport_rewards (
  id          SERIAL PRIMARY KEY,
  passport_id TEXT        NOT NULL UNIQUE,
  user_id     TEXT,
  venue_id    TEXT,
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  locked      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_passport_user  ON smokecraft_passport_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_sc_passport_venue ON smokecraft_passport_rewards(venue_id);

-- ── smokecraft_venue_admin ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_venue_admin (
  id          SERIAL PRIMARY KEY,
  admin_id    TEXT        NOT NULL UNIQUE,
  venue_id    TEXT,
  actor_role  TEXT,
  actor_id    TEXT,
  action_type TEXT        NOT NULL,
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_venue_admin_venue   ON smokecraft_venue_admin(venue_id);
CREATE INDEX IF NOT EXISTS idx_sc_venue_admin_created ON smokecraft_venue_admin(created_at DESC);

-- ── smokecraft_analytics_snapshots ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_analytics_snapshots (
  id           SERIAL PRIMARY KEY,
  snapshot_id  TEXT        NOT NULL UNIQUE,
  venue_id     TEXT,
  period       TEXT,
  data         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_analytics_venue   ON smokecraft_analytics_snapshots(venue_id);
CREATE INDEX IF NOT EXISTS idx_sc_analytics_created ON smokecraft_analytics_snapshots(created_at DESC);

-- ── smokecraft_sync_events ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_sync_events (
  id          SERIAL PRIMARY KEY,
  event_id    TEXT        NOT NULL UNIQUE,
  venue_id    TEXT,
  area_id     TEXT,
  event_type  TEXT        NOT NULL,
  sync_status TEXT        NOT NULL DEFAULT 'not_connected',
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_sync_events_venue   ON smokecraft_sync_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_sc_sync_events_area    ON smokecraft_sync_events(area_id);
CREATE INDEX IF NOT EXISTS idx_sc_sync_events_created ON smokecraft_sync_events(created_at DESC);

-- ── smokecraft_connector_audit ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_connector_audit (
  id          SERIAL PRIMARY KEY,
  audit_id    TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  connector   TEXT,
  event_type  TEXT        NOT NULL,
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_connector_audit_created ON smokecraft_connector_audit(created_at DESC);

-- ── smokecraft_governance_audit ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_governance_audit (
  id          SERIAL PRIMARY KEY,
  audit_id    TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  area_id     TEXT,
  event_type  TEXT        NOT NULL,
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_governance_audit_area    ON smokecraft_governance_audit(area_id);
CREATE INDEX IF NOT EXISTS idx_sc_governance_audit_created ON smokecraft_governance_audit(created_at DESC);

-- ── smokecraft_persistence_audit ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_persistence_audit (
  id                       SERIAL PRIMARY KEY,
  audit_id                 TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  area_id                  TEXT,
  event_type               TEXT        NOT NULL,
  previous_persistence_mode TEXT,
  next_persistence_mode    TEXT,
  database_configured      BOOLEAN     NOT NULL DEFAULT FALSE,
  database_verified        BOOLEAN     NOT NULL DEFAULT FALSE,
  production_ready         BOOLEAN     NOT NULL DEFAULT FALSE,
  contains_secrets         BOOLEAN     NOT NULL DEFAULT FALSE,
  exposes_private_data     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_persistence_audit_area    ON smokecraft_persistence_audit(area_id);
CREATE INDEX IF NOT EXISTS idx_sc_persistence_audit_created ON smokecraft_persistence_audit(created_at DESC);
