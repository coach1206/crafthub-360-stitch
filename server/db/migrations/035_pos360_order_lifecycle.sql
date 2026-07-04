-- POS360 Order Lifecycle, Tabs, Courses & Routing Execution (Phase B.5)
-- Migration: 035_pos360_order_lifecycle.sql
-- CREATE TABLE IF NOT EXISTS only. No DROP TABLE, no DROP COLUMN, no data destruction.

-- ── Orders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           TEXT NOT NULL,
  venue_id            TEXT NOT NULL,
  location_id         TEXT,
  order_number        SERIAL,
  order_type          TEXT NOT NULL DEFAULT 'dine_in',
  status              TEXT NOT NULL DEFAULT 'draft',
  table_id            UUID,
  guest_id            UUID,
  staff_user_id       TEXT,
  device_id           TEXT,
  tab_id              UUID,
  course_count        INTEGER NOT NULL DEFAULT 0,
  item_count          INTEGER NOT NULL DEFAULT 0,
  subtotal_cents      INTEGER NOT NULL DEFAULT 0,
  discount_cents      INTEGER NOT NULL DEFAULT 0,
  total_cents         INTEGER NOT NULL DEFAULT 0,
  notes               TEXT,
  rush_flag           BOOLEAN NOT NULL DEFAULT FALSE,
  vip_flag            BOOLEAN NOT NULL DEFAULT FALSE,
  allergy_flags       JSONB,
  smokecraft_session_id TEXT,
  loyalty_profile_id  TEXT,
  fire_time           TIMESTAMPTZ,
  held_at             TIMESTAMPTZ,
  fired_at            TIMESTAMPTZ,
  served_at           TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ,
  canceled_at         TIMESTAMPTZ,
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB,
  audit_context       JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_orders_venue    ON pos360_orders(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_orders_tenant   ON pos360_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pos360_orders_status   ON pos360_orders(status);
CREATE INDEX IF NOT EXISTS idx_pos360_orders_table    ON pos360_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_pos360_orders_guest    ON pos360_orders(guest_id);
CREATE INDEX IF NOT EXISTS idx_pos360_orders_tab      ON pos360_orders(tab_id);
CREATE INDEX IF NOT EXISTS idx_pos360_orders_active   ON pos360_orders(venue_id, is_active, status);

-- ── Order items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           TEXT NOT NULL,
  venue_id            TEXT NOT NULL,
  location_id         TEXT,
  order_id            UUID NOT NULL,
  course_id           UUID,
  menu_item_id        UUID,
  item_name           TEXT NOT NULL,
  item_sku            TEXT,
  category_id         UUID,
  station_type        TEXT,
  quantity            INTEGER NOT NULL DEFAULT 1,
  unit_price_cents    INTEGER NOT NULL DEFAULT 0,
  discount_cents      INTEGER NOT NULL DEFAULT 0,
  total_cents         INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'draft',
  notes               TEXT,
  allergy_flags       JSONB,
  smokecraft_flags    JSONB,
  rush_flag           BOOLEAN NOT NULL DEFAULT FALSE,
  held_at             TIMESTAMPTZ,
  fired_at            TIMESTAMPTZ,
  routed_at           TIMESTAMPTZ,
  production_ticket_id UUID,
  production_item_id  UUID,
  routing_station_id  UUID,
  routing_resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  staff_user_id       TEXT,
  device_id           TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB,
  audit_context       JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_order_items_order   ON pos360_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_pos360_order_items_venue   ON pos360_order_items(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_order_items_status  ON pos360_order_items(status);
CREATE INDEX IF NOT EXISTS idx_pos360_order_items_course  ON pos360_order_items(course_id);

-- ── Order item modifiers ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_item_modifiers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           TEXT NOT NULL,
  venue_id            TEXT NOT NULL,
  order_id            UUID NOT NULL,
  order_item_id       UUID NOT NULL,
  modifier_id         UUID,
  modifier_name       TEXT NOT NULL,
  modifier_group      TEXT,
  price_delta_cents   INTEGER NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata            JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_item_mods_item ON pos360_order_item_modifiers(order_item_id);

-- ── Order item add-ons ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_item_addons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           TEXT NOT NULL,
  venue_id            TEXT NOT NULL,
  order_id            UUID NOT NULL,
  order_item_id       UUID NOT NULL,
  addon_id            UUID,
  addon_name          TEXT NOT NULL,
  price_cents         INTEGER NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata            JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_item_addons_item ON pos360_order_item_addons(order_item_id);

-- ── Order courses ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_courses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           TEXT NOT NULL,
  venue_id            TEXT NOT NULL,
  location_id         TEXT,
  order_id            UUID NOT NULL,
  course_name         TEXT NOT NULL,
  course_label        TEXT,
  sequence_number     INTEGER NOT NULL DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'draft',
  station_type        TEXT,
  routing_station_id  UUID,
  notes               TEXT,
  fire_time           TIMESTAMPTZ,
  held_at             TIMESTAMPTZ,
  fired_at            TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  staff_user_id       TEXT,
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB,
  audit_context       JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_courses_order  ON pos360_order_courses(order_id);
CREATE INDEX IF NOT EXISTS idx_pos360_courses_status ON pos360_order_courses(status);

-- ── Order tabs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_tabs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           TEXT NOT NULL,
  venue_id            TEXT NOT NULL,
  location_id         TEXT,
  tab_number          SERIAL,
  tab_type            TEXT NOT NULL DEFAULT 'table',
  tab_name            TEXT,
  status              TEXT NOT NULL DEFAULT 'open',
  table_id            UUID,
  guest_id            UUID,
  staff_user_id       TEXT,
  device_id           TEXT,
  order_count         INTEGER NOT NULL DEFAULT 0,
  total_cents         INTEGER NOT NULL DEFAULT 0,
  payment_pending_at  TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ,
  transferred_to_tab  UUID,
  merged_into_tab     UUID,
  notes               TEXT,
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB,
  audit_context       JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_tabs_venue   ON pos360_order_tabs(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tabs_status  ON pos360_order_tabs(status);
CREATE INDEX IF NOT EXISTS idx_pos360_tabs_guest   ON pos360_order_tabs(guest_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tabs_table   ON pos360_order_tabs(table_id);

-- ── Order tab links ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_tab_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL,
  venue_id      TEXT NOT NULL,
  tab_id        UUID NOT NULL,
  order_id      UUID NOT NULL,
  linked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlinked_at   TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  metadata      JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_tab_links_tab   ON pos360_order_tab_links(tab_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tab_links_order ON pos360_order_tab_links(order_id);

-- ── Order status history ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_status_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL,
  venue_id      TEXT NOT NULL,
  order_id      UUID NOT NULL,
  from_status   TEXT,
  to_status     TEXT NOT NULL,
  reason        TEXT,
  actor_id      TEXT,
  actor_role    TEXT,
  device_id     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata      JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_order_status_hist ON pos360_order_status_history(order_id);

-- ── Order item status history ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_item_status_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL,
  venue_id      TEXT NOT NULL,
  order_id      UUID NOT NULL,
  order_item_id UUID NOT NULL,
  from_status   TEXT,
  to_status     TEXT NOT NULL,
  reason        TEXT,
  actor_id      TEXT,
  actor_role    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata      JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_item_status_hist ON pos360_order_item_status_history(order_item_id);

-- ── Order routing events ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_routing_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  order_id              UUID NOT NULL,
  order_item_id         UUID,
  routing_rule_id       UUID,
  station_id            UUID,
  station_type          TEXT,
  production_ticket_id  UUID,
  production_item_id    UUID,
  routing_status        TEXT NOT NULL DEFAULT 'pending',
  failure_reason        TEXT,
  retry_count           INTEGER NOT NULL DEFAULT 0,
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_routing_events_order ON pos360_order_routing_events(order_id);
CREATE INDEX IF NOT EXISTS idx_pos360_routing_events_item  ON pos360_order_routing_events(order_item_id);

-- ── Order hold/fire events ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_hold_fire_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       TEXT NOT NULL,
  venue_id        TEXT NOT NULL,
  order_id        UUID NOT NULL,
  order_item_id   UUID,
  course_id       UUID,
  event_type      TEXT NOT NULL,
  actor_id        TEXT,
  actor_role      TEXT,
  device_id       TEXT,
  fire_time       TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata        JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_hold_fire_order ON pos360_order_hold_fire_events(order_id);

-- ── Order guest links ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_guest_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   TEXT NOT NULL,
  venue_id    TEXT NOT NULL,
  order_id    UUID NOT NULL,
  guest_id    UUID NOT NULL,
  tab_id      UUID,
  linked_by   TEXT,
  linked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  metadata    JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_guest_links_order ON pos360_order_guest_links(order_id);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_links_guest ON pos360_order_guest_links(guest_id);

-- ── Order table links ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_table_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL,
  venue_id      TEXT NOT NULL,
  order_id      UUID NOT NULL,
  table_id      UUID NOT NULL,
  linked_by     TEXT,
  linked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlinked_at   TIMESTAMPTZ,
  is_primary    BOOLEAN NOT NULL DEFAULT TRUE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  metadata      JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_table_links_order ON pos360_order_table_links(order_id);
CREATE INDEX IF NOT EXISTS idx_pos360_table_links_table ON pos360_order_table_links(table_id);

-- ── Order SmokeCraft links ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_smokecraft_links (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  order_id              UUID NOT NULL,
  smokecraft_session_id TEXT,
  guest_id              UUID,
  pairing_note          TEXT,
  recommendation_item   JSONB,
  linked_by             TEXT,
  linked_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_smokecraft_links_order ON pos360_order_smokecraft_links(order_id);

-- ── Order loyalty links ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_loyalty_links (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           TEXT NOT NULL,
  venue_id            TEXT NOT NULL,
  order_id            UUID NOT NULL,
  loyalty_profile_id  TEXT NOT NULL,
  guest_id            UUID,
  reward_applied      BOOLEAN NOT NULL DEFAULT FALSE,
  reward_type         TEXT,
  discount_cents      INTEGER NOT NULL DEFAULT 0,
  points_earned       INTEGER NOT NULL DEFAULT 0,
  linked_by           TEXT,
  linked_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_loyalty_links_order ON pos360_order_loyalty_links(order_id);

-- ── Order audit ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_order_audit (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           TEXT NOT NULL,
  venue_id            TEXT NOT NULL,
  location_id         TEXT,
  order_id            UUID,
  entity_type         TEXT NOT NULL,
  entity_id           UUID,
  action              TEXT NOT NULL,
  actor_id            TEXT,
  actor_role          TEXT,
  device_id           TEXT,
  previous_value      JSONB,
  new_value           JSONB,
  contains_secrets    BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata            JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_order_audit_order  ON pos360_order_audit(order_id);
CREATE INDEX IF NOT EXISTS idx_pos360_order_audit_venue  ON pos360_order_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_order_audit_entity ON pos360_order_audit(entity_type, entity_id);
