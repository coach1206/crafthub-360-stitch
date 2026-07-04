-- Migration 032: POS360 Venue Menu Builder & Dynamic Menu Engine (Phase B.2)
-- Multi-tenant, fully dynamic menu system for any hospitality business model.
-- No hardcoded categories, items, or venue types.
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS).
-- No DROP TABLE, no DROP COLUMN, no data destruction.

-- ── pos360_menus ─────────────────────────────────────────────────────────────
-- Top-level menu container. A venue may have multiple menus
-- (e.g., "Dinner Menu", "Happy Hour", "Events", "Seasonal").
CREATE TABLE IF NOT EXISTS pos360_menus (
  id              SERIAL PRIMARY KEY,
  menu_id         TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  location_id     TEXT,
  menu_name       TEXT        NOT NULL,
  menu_description TEXT,
  status          TEXT        NOT NULL DEFAULT 'draft',
  display_order   INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT FALSE,
  schedule_start  TIMESTAMPTZ,
  schedule_end    TIMESTAMPTZ,
  source_menu_id  TEXT,
  is_active_handheld BOOLEAN  NOT NULL DEFAULT FALSE,
  feature_flags   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_menus_venue    ON pos360_menus(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_menus_status   ON pos360_menus(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_pos360_menus_active   ON pos360_menus(venue_id, is_active);

-- ── pos360_menu_categories ────────────────────────────────────────────────────
-- Fully dynamic categories. No hardcoded names.
-- A venue creates whatever categories fit their business: "Premium Cigars",
-- "Appetizers", "Draft Beer", "Golf Packages", "Treatments", etc.
CREATE TABLE IF NOT EXISTS pos360_menu_categories (
  id              SERIAL PRIMARY KEY,
  category_id     TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  location_id     TEXT,
  menu_id         TEXT        NOT NULL,
  category_name   TEXT        NOT NULL,
  category_description TEXT,
  display_order   INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  icon            TEXT,
  color_hex       TEXT,
  image_url       TEXT,
  age_gated       BOOLEAN     NOT NULL DEFAULT FALSE,
  routing_station_id TEXT,
  feature_flags   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_cats_menu    ON pos360_menu_categories(menu_id);
CREATE INDEX IF NOT EXISTS idx_pos360_cats_venue   ON pos360_menu_categories(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_cats_active  ON pos360_menu_categories(menu_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pos360_cats_order   ON pos360_menu_categories(menu_id, display_order);

-- ── pos360_menu_subcategories ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_menu_subcategories (
  id              SERIAL PRIMARY KEY,
  subcategory_id  TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  location_id     TEXT,
  menu_id         TEXT        NOT NULL,
  category_id     TEXT        NOT NULL,
  subcategory_name TEXT       NOT NULL,
  subcategory_description TEXT,
  display_order   INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  icon            TEXT,
  color_hex       TEXT,
  image_url       TEXT,
  age_gated       BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_subcats_category ON pos360_menu_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_pos360_subcats_menu     ON pos360_menu_subcategories(menu_id);
CREATE INDEX IF NOT EXISTS idx_pos360_subcats_active   ON pos360_menu_subcategories(category_id, is_active);

-- ── pos360_menu_items ─────────────────────────────────────────────────────────
-- Core item record. All category/subcategory context is linked, not hardcoded.
-- metadata JSONB carries optional SmokeCraft/EAT intelligence hooks.
CREATE TABLE IF NOT EXISTS pos360_menu_items (
  id                  SERIAL PRIMARY KEY,
  item_id             TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id           TEXT,
  venue_id            TEXT        NOT NULL,
  location_id         TEXT,
  menu_id             TEXT        NOT NULL,
  category_id         TEXT,
  subcategory_id      TEXT,
  item_name           TEXT        NOT NULL,
  item_description    TEXT,
  sku                 TEXT,
  barcode             TEXT,
  base_price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price          NUMERIC(10,2),
  status              TEXT        NOT NULL DEFAULT 'draft',
  display_order       INTEGER     NOT NULL DEFAULT 0,
  is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
  is_featured         BOOLEAN     NOT NULL DEFAULT FALSE,
  is_age_gated        BOOLEAN     NOT NULL DEFAULT FALSE,
  minimum_age         INTEGER,
  is_taxable          BOOLEAN     NOT NULL DEFAULT TRUE,
  preparation_notes   TEXT,
  allergen_info       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  dietary_tags        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  item_tags           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  -- SmokeCraft / EAT intelligence hooks (optional, provider-agnostic)
  smokecraft_meta     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  eat_meta            JSONB       NOT NULL DEFAULT '{}'::jsonb,
  loyalty_eligible    BOOLEAN     NOT NULL DEFAULT FALSE,
  vip_eligible        BOOLEAN     NOT NULL DEFAULT FALSE,
  feature_flags       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata            JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_items_menu      ON pos360_menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_pos360_items_category  ON pos360_menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_pos360_items_venue     ON pos360_menu_items(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_items_status    ON pos360_menu_items(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_pos360_items_active    ON pos360_menu_items(menu_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pos360_items_order     ON pos360_menu_items(category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_pos360_items_sku       ON pos360_menu_items(sku) WHERE sku IS NOT NULL;

-- ── pos360_menu_item_photos ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_menu_item_photos (
  id          SERIAL PRIMARY KEY,
  photo_id    TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id   TEXT,
  venue_id    TEXT        NOT NULL,
  item_id     TEXT        NOT NULL,
  photo_url   TEXT        NOT NULL,
  alt_text    TEXT,
  is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
  display_order INTEGER   NOT NULL DEFAULT 0,
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_photos_item  ON pos360_menu_item_photos(item_id);
CREATE INDEX IF NOT EXISTS idx_pos360_photos_venue ON pos360_menu_item_photos(venue_id);

-- ── pos360_menu_modifier_groups ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_menu_modifier_groups (
  id              SERIAL PRIMARY KEY,
  group_id        TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  group_name      TEXT        NOT NULL,
  group_description TEXT,
  selection_type  TEXT        NOT NULL DEFAULT 'single',
  min_selections  INTEGER     NOT NULL DEFAULT 0,
  max_selections  INTEGER,
  is_required     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  display_order   INTEGER     NOT NULL DEFAULT 0,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_modgroups_venue ON pos360_menu_modifier_groups(venue_id);

-- ── pos360_menu_modifiers ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_menu_modifiers (
  id              SERIAL PRIMARY KEY,
  modifier_id     TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  group_id        TEXT        NOT NULL,
  modifier_name   TEXT        NOT NULL,
  modifier_description TEXT,
  price_delta     NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  display_order   INTEGER     NOT NULL DEFAULT 0,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_mods_group ON pos360_menu_modifiers(group_id);
CREATE INDEX IF NOT EXISTS idx_pos360_mods_venue ON pos360_menu_modifiers(venue_id);

-- ── pos360_menu_item_modifier_groups ─────────────────────────────────────────
-- Junction: which modifier groups attach to which items
CREATE TABLE IF NOT EXISTS pos360_menu_item_modifier_groups (
  id              SERIAL PRIMARY KEY,
  item_id         TEXT        NOT NULL,
  group_id        TEXT        NOT NULL,
  display_order   INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_id, group_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_img_item  ON pos360_menu_item_modifier_groups(item_id);
CREATE INDEX IF NOT EXISTS idx_pos360_img_group ON pos360_menu_item_modifier_groups(group_id);

-- ── pos360_menu_item_addons ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_menu_item_addons (
  id              SERIAL PRIMARY KEY,
  addon_id        TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  item_id         TEXT        NOT NULL,
  addon_name      TEXT        NOT NULL,
  addon_description TEXT,
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  display_order   INTEGER     NOT NULL DEFAULT 0,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_addons_item  ON pos360_menu_item_addons(item_id);
CREATE INDEX IF NOT EXISTS idx_pos360_addons_venue ON pos360_menu_item_addons(venue_id);

-- ── pos360_menu_item_bundles ──────────────────────────────────────────────────
-- Bundle / combo meal header
CREATE TABLE IF NOT EXISTS pos360_menu_item_bundles (
  id              SERIAL PRIMARY KEY,
  bundle_id       TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  menu_id         TEXT        NOT NULL,
  bundle_name     TEXT        NOT NULL,
  bundle_description TEXT,
  bundle_type     TEXT        NOT NULL DEFAULT 'combo',
  bundle_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_bundles_menu  ON pos360_menu_item_bundles(menu_id);
CREATE INDEX IF NOT EXISTS idx_pos360_bundles_venue ON pos360_menu_item_bundles(venue_id);

-- ── pos360_menu_bundle_items ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_menu_bundle_items (
  id              SERIAL PRIMARY KEY,
  bundle_id       TEXT        NOT NULL,
  item_id         TEXT        NOT NULL,
  quantity        INTEGER     NOT NULL DEFAULT 1,
  price_override  NUMERIC(10,2),
  display_order   INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bundle_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_bi_bundle ON pos360_menu_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_pos360_bi_item   ON pos360_menu_bundle_items(item_id);

-- ── pos360_menu_pricing_rules ─────────────────────────────────────────────────
-- Dynamic pricing: happy hour, time-based, VIP, member, loyalty, promo, etc.
CREATE TABLE IF NOT EXISTS pos360_menu_pricing_rules (
  id              SERIAL PRIMARY KEY,
  rule_id         TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  location_id     TEXT,
  item_id         TEXT,
  category_id     TEXT,
  menu_id         TEXT,
  rule_type       TEXT        NOT NULL DEFAULT 'base_price',
  rule_name       TEXT        NOT NULL,
  price_value     NUMERIC(10,2),
  price_percent   NUMERIC(6,4),
  conditions      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  priority        INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  days_of_week    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  time_from       TEXT,
  time_until      TEXT,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_pricing_venue   ON pos360_menu_pricing_rules(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_pricing_item    ON pos360_menu_pricing_rules(item_id);
CREATE INDEX IF NOT EXISTS idx_pos360_pricing_type    ON pos360_menu_pricing_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pos360_pricing_active  ON pos360_menu_pricing_rules(venue_id, is_active);

-- ── pos360_menu_tax_rules ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_menu_tax_rules (
  id              SERIAL PRIMARY KEY,
  tax_rule_id     TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  location_id     TEXT,
  tax_name        TEXT        NOT NULL,
  tax_rate        NUMERIC(8,6) NOT NULL DEFAULT 0,
  applies_to      TEXT        NOT NULL DEFAULT 'item',
  item_id         TEXT,
  category_id     TEXT,
  menu_id         TEXT,
  is_inclusive    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_tax_venue ON pos360_menu_tax_rules(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tax_item  ON pos360_menu_tax_rules(item_id) WHERE item_id IS NOT NULL;

-- ── pos360_menu_routing_stations ──────────────────────────────────────────────
-- Configurable prep stations: Kitchen, Bar, Humidor, Coffee Station, Retail, etc.
-- Venues create their own stations. Nothing is hardcoded.
CREATE TABLE IF NOT EXISTS pos360_menu_routing_stations (
  id              SERIAL PRIMARY KEY,
  station_id      TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  location_id     TEXT,
  station_name    TEXT        NOT NULL,
  station_type    TEXT        NOT NULL DEFAULT 'custom',
  display_order   INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  kds_enabled     BOOLEAN     NOT NULL DEFAULT FALSE,
  print_enabled   BOOLEAN     NOT NULL DEFAULT FALSE,
  display_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_stations_venue ON pos360_menu_routing_stations(venue_id);

-- ── pos360_menu_item_routing ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_menu_item_routing (
  id                  SERIAL PRIMARY KEY,
  routing_id          TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id           TEXT,
  venue_id            TEXT        NOT NULL,
  item_id             TEXT        NOT NULL,
  station_id          TEXT        NOT NULL,
  is_primary          BOOLEAN     NOT NULL DEFAULT FALSE,
  fulfillment_type    TEXT,
  prep_priority       INTEGER     NOT NULL DEFAULT 0,
  routing_notes       TEXT,
  metadata            JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_routing_item    ON pos360_menu_item_routing(item_id);
CREATE INDEX IF NOT EXISTS idx_pos360_routing_station ON pos360_menu_item_routing(station_id);
CREATE INDEX IF NOT EXISTS idx_pos360_routing_venue   ON pos360_menu_item_routing(venue_id);

-- ── pos360_menu_schedules ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_menu_schedules (
  id              SERIAL PRIMARY KEY,
  schedule_id     TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  menu_id         TEXT        NOT NULL,
  schedule_name   TEXT        NOT NULL,
  schedule_type   TEXT        NOT NULL DEFAULT 'recurring',
  days_of_week    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  time_from       TEXT,
  time_until      TEXT,
  date_from       DATE,
  date_until      DATE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  priority        INTEGER     NOT NULL DEFAULT 0,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  updated_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_schedules_menu  ON pos360_menu_schedules(menu_id);
CREATE INDEX IF NOT EXISTS idx_pos360_schedules_venue ON pos360_menu_schedules(venue_id);

-- ── pos360_menu_import_exports ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_menu_import_exports (
  id              SERIAL PRIMARY KEY,
  operation_id    TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT,
  venue_id        TEXT        NOT NULL,
  operation_type  TEXT        NOT NULL DEFAULT 'export',
  status          TEXT        NOT NULL DEFAULT 'pending',
  source_menu_id  TEXT,
  target_venue_id TEXT,
  target_location_id TEXT,
  payload         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  result          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  error_log       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_ie_venue ON pos360_menu_import_exports(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_ie_type  ON pos360_menu_import_exports(operation_type);

-- ── pos360_menu_events ────────────────────────────────────────────────────────
-- Event bus persistence for all menu.* events.
CREATE TABLE IF NOT EXISTS pos360_menu_events (
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
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pos360_me_venue   ON pos360_menu_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_me_type    ON pos360_menu_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pos360_me_entity  ON pos360_menu_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_pos360_me_created ON pos360_menu_events(created_at DESC);

-- ── pos360_menu_audit ─────────────────────────────────────────────────────────
-- Immutable audit trail for all menu management operations.
CREATE TABLE IF NOT EXISTS pos360_menu_audit (
  id                    SERIAL PRIMARY KEY,
  audit_id              TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_id             TEXT,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  action                TEXT        NOT NULL,
  entity_type           TEXT,
  entity_id             TEXT,
  actor_id              TEXT,
  actor_role            TEXT,
  previous_value        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  new_value             JSONB       NOT NULL DEFAULT '{}'::jsonb,
  contains_secrets      BOOLEAN     NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pos360_maudit_venue   ON pos360_menu_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_maudit_action  ON pos360_menu_audit(action);
CREATE INDEX IF NOT EXISTS idx_pos360_maudit_entity  ON pos360_menu_audit(entity_id);
CREATE INDEX IF NOT EXISTS idx_pos360_maudit_created ON pos360_menu_audit(created_at DESC);
