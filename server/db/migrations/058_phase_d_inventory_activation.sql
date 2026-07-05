-- Migration 058: Phase D.4 Inventory Activation Contracts
-- Safe migration: no destructive DDL, no truncation
-- contains_secrets: false, stores_secrets: false
-- All live/sync/vendor-order booleans DEFAULT FALSE
-- All enforcement flags DEFAULT TRUE

CREATE TABLE IF NOT EXISTS inventory_activation_area_registry (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID,
  area_key             TEXT NOT NULL,
  area_label           TEXT NOT NULL,
  area_category        TEXT NOT NULL DEFAULT 'general',
  description          TEXT,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  enabled              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, area_key)
);

CREATE TABLE IF NOT EXISTS inventory_activation_area_status (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID,
  area_key                 TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'not_started',
  live_sync_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  vendor_ordering_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  auto_reorder_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  external_pos_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notes                    TEXT,
  idempotency_key          TEXT UNIQUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_location_registry (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID,
  location_key   TEXT NOT NULL,
  location_label TEXT NOT NULL,
  location_type  TEXT NOT NULL DEFAULT 'venue',
  address_line   TEXT,
  notes          TEXT,
  enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_storage_zone_registry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  location_id      UUID,
  zone_key         TEXT NOT NULL,
  zone_label       TEXT NOT NULL,
  zone_type        TEXT NOT NULL DEFAULT 'general',
  area_key         TEXT,
  temperature_zone TEXT,
  notes            TEXT,
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_item_registry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  item_key         TEXT NOT NULL,
  item_label       TEXT NOT NULL,
  area_key         TEXT NOT NULL,
  category_key     TEXT,
  unit_key         TEXT,
  sku              TEXT,
  barcode          TEXT,
  description      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_item_category_registry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  category_key     TEXT NOT NULL,
  category_label   TEXT NOT NULL,
  area_key         TEXT NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_item_variant_registry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  item_id          UUID,
  variant_key      TEXT NOT NULL,
  variant_label    TEXT NOT NULL,
  sku              TEXT,
  unit_key         TEXT,
  notes            TEXT,
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_unit_registry (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  unit_key         TEXT NOT NULL,
  unit_label       TEXT NOT NULL,
  unit_abbreviation TEXT,
  unit_type        TEXT NOT NULL DEFAULT 'count',
  base_unit_key    TEXT,
  conversion_factor NUMERIC(18,6),
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_par_level_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  item_id          UUID,
  area_key         TEXT NOT NULL,
  location_id      UUID,
  zone_id          UUID,
  par_quantity     NUMERIC(18,4) NOT NULL DEFAULT 0,
  unit_key         TEXT,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_reorder_rule_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID,
  item_id                   UUID,
  area_key                  TEXT NOT NULL,
  vendor_id                 UUID,
  reorder_threshold         NUMERIC(18,4) NOT NULL DEFAULT 0,
  reorder_quantity          NUMERIC(18,4) NOT NULL DEFAULT 0,
  unit_key                  TEXT,
  auto_reorder_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  vendor_order_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  real_order_submission     BOOLEAN NOT NULL DEFAULT FALSE,
  notes                     TEXT,
  idempotency_key           TEXT UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_low_stock_rule_profiles (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID,
  item_id                UUID,
  area_key               TEXT NOT NULL,
  low_stock_threshold    NUMERIC(18,4) NOT NULL DEFAULT 0,
  unit_key               TEXT,
  alert_preview_only     BOOLEAN NOT NULL DEFAULT TRUE,
  requires_real_count    BOOLEAN NOT NULL DEFAULT TRUE,
  notes                  TEXT,
  idempotency_key        TEXT UNIQUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_count_session_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT NOT NULL,
  location_id       UUID,
  zone_id           UUID,
  session_label     TEXT NOT NULL,
  session_status    TEXT NOT NULL DEFAULT 'setup_required',
  count_date        DATE,
  counted_by        TEXT,
  is_real_count     BOOLEAN NOT NULL DEFAULT FALSE,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_count_session_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  session_id        UUID NOT NULL,
  item_id           UUID,
  item_key          TEXT,
  expected_quantity NUMERIC(18,4),
  counted_quantity  NUMERIC(18,4),
  unit_key          TEXT,
  variance          NUMERIC(18,4),
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_adjustment_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT NOT NULL,
  item_id           UUID,
  item_key          TEXT,
  location_id       UUID,
  adjustment_type   TEXT NOT NULL DEFAULT 'manual',
  quantity_delta    NUMERIC(18,4) NOT NULL DEFAULT 0,
  unit_key          TEXT,
  reason            TEXT,
  adjusted_by       TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transfer_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT NOT NULL,
  item_id           UUID,
  item_key          TEXT,
  from_location_id  UUID,
  to_location_id    UUID,
  from_zone_id      UUID,
  to_zone_id        UUID,
  quantity          NUMERIC(18,4) NOT NULL DEFAULT 0,
  unit_key          TEXT,
  transfer_reason   TEXT,
  transferred_by    TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_waste_spoilage_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT NOT NULL,
  item_id           UUID,
  item_key          TEXT,
  location_id       UUID,
  quantity          NUMERIC(18,4) NOT NULL DEFAULT 0,
  unit_key          TEXT,
  waste_type        TEXT NOT NULL DEFAULT 'spoilage',
  reason            TEXT,
  recorded_by       TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_vendor_registry (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  vendor_key        TEXT NOT NULL,
  vendor_label      TEXT NOT NULL,
  vendor_type       TEXT NOT NULL DEFAULT 'general',
  contact_name      TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  website_url       TEXT,
  notes             TEXT,
  contains_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_vendor_catalog_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  vendor_id         UUID NOT NULL,
  vendor_key        TEXT NOT NULL,
  catalog_label     TEXT NOT NULL,
  area_key          TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_vendor_catalog_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  catalog_id        UUID NOT NULL,
  vendor_key        TEXT NOT NULL,
  vendor_sku        TEXT,
  item_label        TEXT NOT NULL,
  unit_key          TEXT,
  unit_cost         NUMERIC(18,4),
  minimum_order_qty NUMERIC(18,4),
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_vendor_order_preview_records (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID,
  vendor_id              UUID NOT NULL,
  vendor_key             TEXT NOT NULL,
  preview_label          TEXT,
  items_json             JSONB,
  estimated_total        NUMERIC(18,4),
  is_real_order          BOOLEAN NOT NULL DEFAULT FALSE,
  order_submitted        BOOLEAN NOT NULL DEFAULT FALSE,
  real_vendor_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  notes                  TEXT,
  idempotency_key        TEXT UNIQUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_vendor_order_approval_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID,
  preview_id           UUID NOT NULL,
  vendor_key           TEXT NOT NULL,
  requested_by         TEXT,
  approval_status      TEXT NOT NULL DEFAULT 'pending',
  approved_by          TEXT,
  approved_at          TIMESTAMPTZ,
  approval_notes       TEXT,
  real_order_gated     BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key      TEXT UNIQUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_purchase_order_preview_records (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID,
  vendor_id            UUID,
  vendor_key           TEXT,
  area_key             TEXT,
  po_label             TEXT,
  line_items_json      JSONB,
  estimated_total      NUMERIC(18,4),
  is_real_po           BOOLEAN NOT NULL DEFAULT FALSE,
  po_submitted         BOOLEAN NOT NULL DEFAULT FALSE,
  notes                TEXT,
  idempotency_key      TEXT UNIQUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_import_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  area_key         TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  import_format    TEXT NOT NULL DEFAULT 'csv',
  import_status    TEXT NOT NULL DEFAULT 'import_required',
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_import_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  area_key         TEXT NOT NULL,
  template_label   TEXT NOT NULL,
  import_format    TEXT NOT NULL DEFAULT 'csv',
  column_map_json  JSONB,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_import_batches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  profile_id       UUID,
  area_key         TEXT NOT NULL,
  batch_label      TEXT,
  batch_status     TEXT NOT NULL DEFAULT 'pending',
  record_count     INTEGER NOT NULL DEFAULT 0,
  error_count      INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_import_batch_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  batch_id         UUID NOT NULL,
  row_index        INTEGER,
  row_data_json    JSONB,
  item_key         TEXT,
  import_status    TEXT NOT NULL DEFAULT 'pending',
  error_message    TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_export_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  area_key         TEXT NOT NULL,
  profile_label    TEXT NOT NULL,
  export_format    TEXT NOT NULL DEFAULT 'csv',
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_external_pos_signal_mapping (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID,
  area_key              TEXT NOT NULL,
  provider_key          TEXT NOT NULL,
  signal_type           TEXT NOT NULL DEFAULT 'item_depletion',
  internal_item_key     TEXT,
  external_item_ref     TEXT,
  mapping_confirmed     BOOLEAN NOT NULL DEFAULT FALSE,
  live_sync_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  notes                 TEXT,
  idempotency_key       TEXT UNIQUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_humidor_mapping (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  item_id           UUID,
  item_key          TEXT NOT NULL,
  zone_id           UUID,
  cigar_vitola      TEXT,
  cigar_brand       TEXT,
  cigar_strength    TEXT,
  storage_humidity  TEXT,
  storage_temp      TEXT,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_bar_mapping (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  item_id           UUID,
  item_key          TEXT NOT NULL,
  zone_id           UUID,
  bottle_category   TEXT,
  bottle_brand      TEXT,
  bottle_size       TEXT,
  spirit_type       TEXT,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_kitchen_mapping (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  item_id           UUID,
  item_key          TEXT NOT NULL,
  zone_id           UUID,
  food_category     TEXT,
  allergen_flags    TEXT,
  storage_type      TEXT,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_retail_mapping (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  item_id           UUID,
  item_key          TEXT NOT NULL,
  zone_id           UUID,
  retail_category   TEXT,
  display_location  TEXT,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_menu_ingredient_mapping (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  menu_item_key     TEXT NOT NULL,
  ingredient_item_id UUID,
  ingredient_key    TEXT NOT NULL,
  quantity_required NUMERIC(18,4),
  unit_key          TEXT,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_recipe_mapping (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  recipe_key        TEXT NOT NULL,
  recipe_label      TEXT NOT NULL,
  menu_item_key     TEXT,
  ingredients_json  JSONB,
  yield_quantity    NUMERIC(18,4),
  yield_unit_key    TEXT,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_cogs_profile_records (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID,
  area_key               TEXT NOT NULL,
  profile_label          TEXT NOT NULL,
  requires_real_cost_data BOOLEAN NOT NULL DEFAULT TRUE,
  requires_real_sales_data BOOLEAN NOT NULL DEFAULT TRUE,
  cogs_calculated        BOOLEAN NOT NULL DEFAULT FALSE,
  cost_data_source       TEXT NOT NULL DEFAULT 'not_configured',
  sales_data_source      TEXT NOT NULL DEFAULT 'not_configured',
  notes                  TEXT,
  idempotency_key        TEXT UNIQUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_shrinkage_profile_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT NOT NULL,
  profile_label     TEXT NOT NULL,
  shrinkage_type    TEXT NOT NULL DEFAULT 'general',
  period_start      DATE,
  period_end        DATE,
  estimated_value   NUMERIC(18,4),
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_alert_rule_registry (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID,
  area_key           TEXT NOT NULL,
  item_id            UUID,
  alert_type         TEXT NOT NULL DEFAULT 'low_stock',
  threshold_quantity NUMERIC(18,4),
  unit_key           TEXT,
  alert_preview_only BOOLEAN NOT NULL DEFAULT TRUE,
  requires_real_data BOOLEAN NOT NULL DEFAULT TRUE,
  enabled            BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key    TEXT UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_alert_preview_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  rule_id           UUID,
  area_key          TEXT NOT NULL,
  item_key          TEXT,
  alert_type        TEXT NOT NULL DEFAULT 'low_stock',
  alert_preview_msg TEXT,
  is_real_alert     BOOLEAN NOT NULL DEFAULT FALSE,
  requires_real_count BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_live_sync_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT NOT NULL,
  provider_key      TEXT,
  requested_by      TEXT,
  request_status    TEXT NOT NULL DEFAULT 'pending',
  live_sync_gated   BOOLEAN NOT NULL DEFAULT TRUE,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_live_sync_approvals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  request_id        UUID NOT NULL,
  area_key          TEXT NOT NULL,
  approved_by       TEXT,
  approved_at       TIMESTAMPTZ,
  approval_status   TEXT NOT NULL DEFAULT 'pending',
  live_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_environment_locks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT NOT NULL,
  lock_type         TEXT NOT NULL DEFAULT 'live_sync',
  is_locked         BOOLEAN NOT NULL DEFAULT TRUE,
  lock_reason       TEXT NOT NULL DEFAULT 'Phase D.4 activation required before live inventory sync',
  unlocked_by       TEXT,
  unlocked_at       TIMESTAMPTZ,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_tenant_mapping (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL,
  area_key          TEXT NOT NULL,
  module_key        TEXT,
  mapping_status    TEXT NOT NULL DEFAULT 'not_started',
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_module_mapping (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  module_key        TEXT NOT NULL,
  area_key          TEXT NOT NULL,
  mapping_status    TEXT NOT NULL DEFAULT 'not_started',
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_compliance_checklist (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT,
  check_key         TEXT NOT NULL,
  check_label       TEXT NOT NULL,
  check_status      TEXT NOT NULL DEFAULT 'not_started',
  completed_by      TEXT,
  completed_at      TIMESTAMPTZ,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_risk_flags (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT,
  flag_key          TEXT NOT NULL,
  flag_label        TEXT NOT NULL,
  severity          TEXT NOT NULL DEFAULT 'medium',
  flagged_by        TEXT,
  resolved          BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by       TEXT,
  resolved_at       TIMESTAMPTZ,
  notes             TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_activation_audit (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  area_key          TEXT,
  event_type        TEXT NOT NULL,
  actor_id          TEXT,
  payload_summary   TEXT,
  contains_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
