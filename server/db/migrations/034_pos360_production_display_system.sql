-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 034 — POS360 Production Display System (Phase B.4)
-- No DROP TABLE, no DROP COLUMN, no data destruction.
-- All tables: CREATE TABLE IF NOT EXISTS
-- Stations are configurable per venue/location — no hardcoded station types.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Production Stations ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_stations (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  station_name          TEXT        NOT NULL,
  station_type          TEXT        NOT NULL DEFAULT 'kitchen',
    -- kitchen | bar | humidor | expo | dessert | coffee | retail
    -- merchandise | gift_shop | custom
  display_mode          TEXT        NOT NULL DEFAULT 'station_view',
    -- station_view | expo_view | all_stations_view | table_view
    -- order_view | rush_view | delayed_view | completed_view | manager_view
  prep_sla_seconds      INTEGER     NOT NULL DEFAULT 900,
  escalation_seconds    INTEGER     NOT NULL DEFAULT 1200,
  printer_settings      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  display_settings      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  routing_rules         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  escalation_rules      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order            INTEGER     NOT NULL DEFAULT 0,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_stations_venue
  ON pos360_production_stations (venue_id, tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pos360_prod_stations_type
  ON pos360_production_stations (station_type, venue_id);

-- ── Station Devices ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_station_devices (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  station_id            TEXT        NOT NULL,
  device_id             TEXT        NOT NULL,
  device_type           TEXT        NOT NULL DEFAULT 'kitchen_display',
  device_name           TEXT,
  is_primary            BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  last_heartbeat_at     TIMESTAMPTZ,
  is_online             BOOLEAN     NOT NULL DEFAULT FALSE,
  display_preferences   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_station_devices_station
  ON pos360_production_station_devices (station_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pos360_prod_station_devices_device
  ON pos360_production_station_devices (device_id);

-- ── Production Tickets ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_tickets (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  station_id            TEXT        NOT NULL,
  station_type          TEXT        NOT NULL DEFAULT 'kitchen',
  order_id              TEXT,
  table_id              TEXT,
  guest_id              TEXT,
  staff_user_id         TEXT,
  device_id             TEXT,
  ticket_number         SERIAL,
  ticket_status         TEXT        NOT NULL DEFAULT 'queued',
    -- queued | held | fired | in_progress | ready | bumped
    -- completed | canceled | voided | delayed | escalated
  priority              INTEGER     NOT NULL DEFAULT 0,
  is_rush               BOOLEAN     NOT NULL DEFAULT FALSE,
  is_held               BOOLEAN     NOT NULL DEFAULT FALSE,
  routing_source        TEXT,
  source_device_id      TEXT,
  fired_at              TIMESTAMPTZ,
  started_at            TIMESTAMPTZ,
  ready_at              TIMESTAMPTZ,
  bumped_at             TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  promised_at           TIMESTAMPTZ,
  elapsed_seconds       INTEGER,
  notes                 TEXT,
  expo_notes            TEXT,
  allergy_flags         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  vip_flags             JSONB       NOT NULL DEFAULT '{}'::jsonb,
  smokecraft_flags      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  loyalty_flags         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  eat_context           JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_tickets_station
  ON pos360_production_tickets (station_id, ticket_status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_pos360_prod_tickets_venue
  ON pos360_production_tickets (venue_id, ticket_status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_pos360_prod_tickets_order
  ON pos360_production_tickets (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pos360_prod_tickets_table
  ON pos360_production_tickets (table_id) WHERE table_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pos360_prod_tickets_rush
  ON pos360_production_tickets (venue_id, is_rush, ticket_status)
  WHERE is_rush = TRUE;

-- ── Production Ticket Items ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_ticket_items (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  ticket_id             TEXT        NOT NULL,
  station_id            TEXT        NOT NULL,
  order_id              TEXT,
  menu_item_id          TEXT,
  item_name             TEXT        NOT NULL,
  quantity              INTEGER     NOT NULL DEFAULT 1,
  modifiers             JSONB       NOT NULL DEFAULT '[]'::jsonb,
  addons                JSONB       NOT NULL DEFAULT '[]'::jsonb,
  notes                 TEXT,
  item_status           TEXT        NOT NULL DEFAULT 'queued',
    -- queued | held | fired | in_progress | ready
    -- completed | canceled | voided | refired | delayed
  prep_priority         INTEGER     NOT NULL DEFAULT 0,
  is_held               BOOLEAN     NOT NULL DEFAULT FALSE,
  is_rush               BOOLEAN     NOT NULL DEFAULT FALSE,
  allergy_flags         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  age_gated             BOOLEAN     NOT NULL DEFAULT FALSE,
  smokecraft_pairing    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  vip_member_flag       BOOLEAN     NOT NULL DEFAULT FALSE,
  loyalty_flag          BOOLEAN     NOT NULL DEFAULT FALSE,
  routing_station_id    TEXT,
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  elapsed_prep_seconds  INTEGER,
  fired_at              TIMESTAMPTZ,
  refired_count         INTEGER     NOT NULL DEFAULT 0,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_ticket_items_ticket
  ON pos360_production_ticket_items (ticket_id, item_status);
CREATE INDEX IF NOT EXISTS idx_pos360_prod_ticket_items_station
  ON pos360_production_ticket_items (station_id, item_status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_pos360_prod_ticket_items_order
  ON pos360_production_ticket_items (order_id) WHERE order_id IS NOT NULL;

-- ── Ticket Status History ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_ticket_status_history (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  ticket_id             TEXT        NOT NULL,
  station_id            TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  previous_status       TEXT        NOT NULL,
  new_status            TEXT        NOT NULL,
  reason                TEXT,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_ticket_status_hist
  ON pos360_production_ticket_status_history (ticket_id, created_at DESC);

-- ── Item Status History ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_item_status_history (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  ticket_item_id        TEXT        NOT NULL,
  ticket_id             TEXT,
  station_id            TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  previous_status       TEXT        NOT NULL,
  new_status            TEXT        NOT NULL,
  reason                TEXT,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_item_status_hist
  ON pos360_production_item_status_history (ticket_item_id, created_at DESC);

-- ── Routing Rules ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_routing_rules (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  station_id            TEXT        NOT NULL,
  rule_name             TEXT        NOT NULL,
  rule_type             TEXT        NOT NULL DEFAULT 'item_category',
    -- item_category | menu_item | item_tag | venue_type | custom
  match_criteria        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  priority_order        INTEGER     NOT NULL DEFAULT 0,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_routing_rules_station
  ON pos360_production_routing_rules (station_id, is_active, priority_order);
CREATE INDEX IF NOT EXISTS idx_pos360_prod_routing_rules_venue
  ON pos360_production_routing_rules (venue_id, is_active);

-- ── Hold / Fire Events ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_hold_fire_events (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  station_id            TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  event_type            TEXT        NOT NULL DEFAULT 'fire',
    -- hold | fire | hold_course | fire_course | fire_order
    -- delayed_fire | timed_fire | cancel_hold | manager_override
  entity_type           TEXT        NOT NULL DEFAULT 'ticket',
    -- ticket | ticket_item | course | order
  entity_id             TEXT        NOT NULL,
  order_id              TEXT,
  table_id              TEXT,
  scheduled_fire_at     TIMESTAMPTZ,
  notes                 TEXT,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_hold_fire_venue
  ON pos360_production_hold_fire_events (venue_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_prod_hold_fire_entity
  ON pos360_production_hold_fire_events (entity_id, entity_type, created_at DESC);

-- ── Station Events ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_station_events (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  station_id            TEXT        NOT NULL,
  device_id             TEXT,
  staff_user_id         TEXT,
  event_type            TEXT        NOT NULL,
  event_payload         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_station_events_station
  ON pos360_production_station_events (station_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_prod_station_events_venue
  ON pos360_production_station_events (venue_id, event_type, created_at DESC);

-- ── Display Preferences ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_display_preferences (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  station_id            TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  display_mode          TEXT        NOT NULL DEFAULT 'station_view',
  columns_count         INTEGER     NOT NULL DEFAULT 4,
  show_timers           BOOLEAN     NOT NULL DEFAULT TRUE,
  show_allergy_flags    BOOLEAN     NOT NULL DEFAULT TRUE,
  show_vip_flags        BOOLEAN     NOT NULL DEFAULT TRUE,
  show_smokecraft_flags BOOLEAN     NOT NULL DEFAULT TRUE,
  show_eat_alerts       BOOLEAN     NOT NULL DEFAULT TRUE,
  auto_bump_seconds     INTEGER,
  font_size             TEXT        NOT NULL DEFAULT 'medium',
  color_scheme          TEXT        NOT NULL DEFAULT 'dark_gold',
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_display_prefs_station
  ON pos360_production_display_preferences (station_id, device_id)
  WHERE station_id IS NOT NULL;

-- ── Analytics Events ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_analytics_events (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  station_id            TEXT,
  device_id             TEXT,
  order_id              TEXT,
  ticket_id             TEXT,
  metric_type           TEXT        NOT NULL,
    -- prep_time | queue_depth | bump_rate | completion_rate
    -- escalation_rate | rush_rate | cancel_rate | refire_rate
  metric_value          NUMERIC,
  metric_unit           TEXT,
  metric_context        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_analytics_station
  ON pos360_production_analytics_events (station_id, metric_type, created_at DESC)
  WHERE station_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pos360_prod_analytics_venue
  ON pos360_production_analytics_events (venue_id, metric_type, created_at DESC);

-- ── Production Audit ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_production_audit (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  station_id            TEXT,
  device_id             TEXT,
  order_id              TEXT,
  staff_user_id         TEXT,
  action                TEXT        NOT NULL,
  entity_type           TEXT,
  entity_id             TEXT,
  actor_role            TEXT,
  previous_value        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  new_value             JSONB       NOT NULL DEFAULT '{}'::jsonb,
  contains_secrets      BOOLEAN     NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_prod_audit_venue
  ON pos360_production_audit (venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_prod_audit_station
  ON pos360_production_audit (station_id, created_at DESC)
  WHERE station_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pos360_prod_audit_entity
  ON pos360_production_audit (entity_type, entity_id, created_at DESC);
