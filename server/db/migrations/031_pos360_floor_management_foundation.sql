-- Migration 031: POS360 Floor Management Foundation (Phase B.1)
-- Multi-tenant, venue-configurable floor management for any hospitality type.
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- No existing tables are dropped or altered destructively.

-- ── pos360_floor_sections ────────────────────────────────────────────────────
-- Venue-configurable sections (Dining Room, Patio, Bar, Cigar Lounge, VIP, etc.)
CREATE TABLE IF NOT EXISTS pos360_floor_sections (
  id              SERIAL PRIMARY KEY,
  section_id      TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  location_id     TEXT,
  section_name    TEXT        NOT NULL,
  section_type    TEXT        NOT NULL DEFAULT 'general',
  display_order   INTEGER     NOT NULL DEFAULT 0,
  color_hex       TEXT,
  icon            TEXT,
  capacity        INTEGER,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  feature_flags   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_sections_venue    ON pos360_floor_sections(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sections_active   ON pos360_floor_sections(venue_id, is_active);

-- ── pos360_floor_maps ────────────────────────────────────────────────────────
-- Named floor plans / layouts per venue. A venue may have multiple maps
-- (e.g., "Weekend Layout", "Event Night", "Standard").
CREATE TABLE IF NOT EXISTS pos360_floor_maps (
  id              SERIAL PRIMARY KEY,
  map_id          TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  location_id     TEXT,
  map_name        TEXT        NOT NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  canvas_width    INTEGER     NOT NULL DEFAULT 1200,
  canvas_height   INTEGER     NOT NULL DEFAULT 800,
  background_url  TEXT,
  feature_flags   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_maps_venue  ON pos360_floor_maps(venue_id);

-- ── pos360_tables ────────────────────────────────────────────────────────────
-- Physical tables / seating objects. Supports restaurants, lounges, bars,
-- hotel suites, casino pits, golf club bays, retail fitting rooms, etc.
CREATE TABLE IF NOT EXISTS pos360_tables (
  id                    SERIAL PRIMARY KEY,
  table_id              TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id             TEXT,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  map_id                TEXT,
  section_id            TEXT,
  table_name            TEXT        NOT NULL,
  table_number          TEXT,
  seat_count            INTEGER     NOT NULL DEFAULT 2,
  shape                 TEXT        NOT NULL DEFAULT 'rectangle',
  pos_x                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  pos_y                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  width                 NUMERIC(10,2) NOT NULL DEFAULT 80,
  height                NUMERIC(10,2) NOT NULL DEFAULT 60,
  rotation              NUMERIC(6,2) NOT NULL DEFAULT 0,
  status                TEXT        NOT NULL DEFAULT 'available',
  is_vip                BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  object_type           TEXT        NOT NULL DEFAULT 'table',
  feature_flags         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_tables_venue    ON pos360_tables(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tables_section  ON pos360_tables(section_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tables_status   ON pos360_tables(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_pos360_tables_map      ON pos360_tables(map_id);

-- ── pos360_table_status_history ──────────────────────────────────────────────
-- Full audit trail of every status transition.
CREATE TABLE IF NOT EXISTS pos360_table_status_history (
  id              SERIAL PRIMARY KEY,
  history_id      TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  table_id        TEXT        NOT NULL,
  from_status     TEXT,
  to_status       TEXT        NOT NULL,
  changed_by      TEXT,
  changed_by_role TEXT,
  reason          TEXT,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pos360_tsh_table    ON pos360_table_status_history(table_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tsh_venue    ON pos360_table_status_history(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tsh_created  ON pos360_table_status_history(created_at DESC);

-- ── pos360_table_server_assignments ─────────────────────────────────────────
-- Server → section or table assignment. Shift-aware.
CREATE TABLE IF NOT EXISTS pos360_table_server_assignments (
  id              SERIAL PRIMARY KEY,
  assignment_id   TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  table_id        TEXT,
  section_id      TEXT,
  server_id       TEXT        NOT NULL,
  server_name     TEXT,
  shift_id        TEXT,
  assigned_by     TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  assignment_type TEXT        NOT NULL DEFAULT 'table',
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_ssa_venue    ON pos360_table_server_assignments(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_ssa_server   ON pos360_table_server_assignments(server_id);
CREATE INDEX IF NOT EXISTS idx_pos360_ssa_table    ON pos360_table_server_assignments(table_id);
CREATE INDEX IF NOT EXISTS idx_pos360_ssa_section  ON pos360_table_server_assignments(section_id);

-- ── pos360_table_transfers ───────────────────────────────────────────────────
-- Complete transfer history: table-to-table or server-to-server handoffs.
CREATE TABLE IF NOT EXISTS pos360_table_transfers (
  id              SERIAL PRIMARY KEY,
  transfer_id     TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  from_table_id   TEXT,
  to_table_id     TEXT,
  from_server_id  TEXT,
  to_server_id    TEXT,
  order_id        TEXT,
  guest_link_id   TEXT,
  transferred_by  TEXT,
  reason          TEXT,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pos360_transfer_venue  ON pos360_table_transfers(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_transfer_from   ON pos360_table_transfers(from_table_id);
CREATE INDEX IF NOT EXISTS idx_pos360_transfer_to     ON pos360_table_transfers(to_table_id);

-- ── pos360_table_merges ──────────────────────────────────────────────────────
-- Merge / split history. parent_table_id is the surviving table after merge.
CREATE TABLE IF NOT EXISTS pos360_table_merges (
  id              SERIAL PRIMARY KEY,
  merge_id        TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  merge_type      TEXT        NOT NULL DEFAULT 'merge',
  parent_table_id TEXT        NOT NULL,
  child_table_ids JSONB       NOT NULL DEFAULT '[]'::jsonb,
  merged_by       TEXT,
  order_ids       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reversed_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_merges_venue   ON pos360_table_merges(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_merges_parent  ON pos360_table_merges(parent_table_id);

-- ── pos360_table_guest_links ─────────────────────────────────────────────────
-- Links a seated guest (session, reservation, waitlist slot) to a table.
-- Hooks for SmokeCraft journey, loyalty, E.A.T. recommendations.
CREATE TABLE IF NOT EXISTS pos360_table_guest_links (
  id                      SERIAL PRIMARY KEY,
  link_id                 TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id               TEXT,
  venue_id                TEXT        NOT NULL,
  table_id                TEXT        NOT NULL,
  guest_session_id        TEXT,
  user_id                 TEXT,
  reservation_id          TEXT,
  waitlist_id             TEXT,
  smokecraft_session_id   TEXT,
  loyalty_profile_id      TEXT,
  party_size              INTEGER,
  is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
  seated_at               TIMESTAMPTZ,
  departed_at             TIMESTAMPTZ,
  metadata                JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context           JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pos360_gl_venue     ON pos360_table_guest_links(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_gl_table     ON pos360_table_guest_links(table_id);
CREATE INDEX IF NOT EXISTS idx_pos360_gl_session   ON pos360_table_guest_links(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_pos360_gl_user      ON pos360_table_guest_links(user_id);
CREATE INDEX IF NOT EXISTS idx_pos360_gl_smokecraft ON pos360_table_guest_links(smokecraft_session_id);

-- ── pos360_floor_events ──────────────────────────────────────────────────────
-- Event bus persistence. All floor.* events are written here for replay/sync.
CREATE TABLE IF NOT EXISTS pos360_floor_events (
  id              SERIAL PRIMARY KEY,
  event_id        TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  event_type      TEXT        NOT NULL,
  entity_type     TEXT,
  entity_id       TEXT,
  actor_id        TEXT,
  actor_role      TEXT,
  payload         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  sync_status     TEXT        NOT NULL DEFAULT 'pending',
  device_id       TEXT,
  device_type     TEXT,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_fe_venue    ON pos360_floor_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_fe_type     ON pos360_floor_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pos360_fe_entity   ON pos360_floor_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_pos360_fe_sync     ON pos360_floor_events(sync_status);
CREATE INDEX IF NOT EXISTS idx_pos360_fe_created  ON pos360_floor_events(created_at DESC);

-- ── pos360_floor_audit ───────────────────────────────────────────────────────
-- Complete immutable audit log for all floor management operations.
CREATE TABLE IF NOT EXISTS pos360_floor_audit (
  id                    SERIAL PRIMARY KEY,
  audit_id              TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id             TEXT,
  venue_id              TEXT        NOT NULL,
  event_type            TEXT        NOT NULL,
  entity_type           TEXT,
  entity_id             TEXT,
  actor_id              TEXT,
  actor_role            TEXT,
  payload               JSONB       NOT NULL DEFAULT '{}'::jsonb,
  contains_secrets      BOOLEAN     NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pos360_audit_venue    ON pos360_floor_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_audit_type     ON pos360_floor_audit(event_type);
CREATE INDEX IF NOT EXISTS idx_pos360_audit_entity   ON pos360_floor_audit(entity_id);
CREATE INDEX IF NOT EXISTS idx_pos360_audit_created  ON pos360_floor_audit(created_at DESC);
