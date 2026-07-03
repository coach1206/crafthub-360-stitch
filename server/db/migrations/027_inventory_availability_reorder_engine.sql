-- Migration 027: Inventory Availability and Reorder Engine (ISPAE + DMRC)
-- Preview-only. Does not claim live inventory sync, live vendor API, or live reorder submission.

-- ISPAE: Inventory availability per product per venue
CREATE TABLE IF NOT EXISTS venue_inventory (
  inventory_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id          UUID NOT NULL,
  product_id        TEXT NOT NULL,
  product_name      TEXT NOT NULL,
  product_category  TEXT NOT NULL DEFAULT 'general',
  craft_module      TEXT NOT NULL DEFAULT 'smokecraft',
  fulfillment_owner TEXT NOT NULL DEFAULT 'venue',
  partner_id        UUID,
  current_stock     INTEGER NOT NULL DEFAULT 0,
  reserved_stock    INTEGER NOT NULL DEFAULT 0,
  available_stock   INTEGER NOT NULL DEFAULT 0,
  reorder_threshold INTEGER NOT NULL DEFAULT 5,
  reorder_quantity  INTEGER NOT NULL DEFAULT 10,
  unit              TEXT NOT NULL DEFAULT 'unit',
  availability_status TEXT NOT NULL DEFAULT 'availability_required',
  sync_status       TEXT NOT NULL DEFAULT 'inventory_sync_pending',
  last_sync_at      TIMESTAMPTZ,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ISPAE: Inventory events (adjustments, receipts, sales, reservations)
CREATE TABLE IF NOT EXISTS inventory_events (
  event_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id          UUID NOT NULL,
  inventory_id      UUID NOT NULL,
  product_id        TEXT NOT NULL,
  event_type        TEXT NOT NULL DEFAULT 'adjustment',
  quantity_delta    INTEGER NOT NULL DEFAULT 0,
  stock_before      INTEGER NOT NULL DEFAULT 0,
  stock_after       INTEGER NOT NULL DEFAULT 0,
  event_source      TEXT NOT NULL DEFAULT 'manual',
  actor_id          UUID,
  actor_role        TEXT NOT NULL DEFAULT 'staff',
  order_id          UUID,
  reference_id      TEXT,
  event_status      TEXT NOT NULL DEFAULT 'inventory_event_preview',
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ISPAE: Product availability blocks (checkout, staff, KDS, POS360)
CREATE TABLE IF NOT EXISTS product_availability_blocks (
  block_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id          UUID NOT NULL,
  product_id        TEXT NOT NULL,
  block_reason      TEXT NOT NULL DEFAULT 'inventory_unavailable',
  block_source      TEXT NOT NULL DEFAULT 'system',
  block_status      TEXT NOT NULL DEFAULT 'availability_blocked',
  blocked_for       TEXT[] NOT NULL DEFAULT '{}',
  unblocked_at      TIMESTAMPTZ,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DMRC: Vendor (distributor/manufacturer/wholesaler) registry
CREATE TABLE IF NOT EXISTS reorder_vendors (
  vendor_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id               UUID NOT NULL,
  vendor_type            TEXT NOT NULL DEFAULT 'distributor',
  vendor_name            TEXT NOT NULL,
  vendor_display_name    TEXT,
  vendor_category        TEXT NOT NULL DEFAULT 'general',
  craft_modules_supported TEXT[] NOT NULL DEFAULT '{}',
  contact_name           TEXT,
  contact_email          TEXT,
  contact_phone          TEXT,
  order_email            TEXT,
  api_base_url           TEXT,
  api_connection_status  TEXT NOT NULL DEFAULT 'pending_setup',
  api_credential_status  TEXT NOT NULL DEFAULT 'credentials_required',
  preferred_vendor       BOOLEAN NOT NULL DEFAULT FALSE,
  backup_vendor          BOOLEAN NOT NULL DEFAULT FALSE,
  minimum_order_amount   INTEGER NOT NULL DEFAULT 0,
  minimum_order_quantity INTEGER NOT NULL DEFAULT 1,
  case_pack_rules        JSONB NOT NULL DEFAULT '{}',
  lead_time_days         INTEGER NOT NULL DEFAULT 3,
  shipping_region        TEXT,
  reorder_method         TEXT NOT NULL DEFAULT 'preview_only',
  active                 BOOLEAN NOT NULL DEFAULT TRUE,
  approved_by_venue      BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by_owner      BOOLEAN NOT NULL DEFAULT FALSE,
  last_sync_at           TIMESTAMPTZ,
  metadata               JSONB NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DMRC: Reorder recommendations
CREATE TABLE IF NOT EXISTS reorder_recommendations (
  recommendation_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id           UUID NOT NULL,
  product_id         TEXT NOT NULL,
  product_name       TEXT NOT NULL,
  vendor_id          UUID,
  reorder_reason     TEXT NOT NULL DEFAULT 'low_stock',
  reorder_source     TEXT NOT NULL DEFAULT 'system',
  urgency            TEXT NOT NULL DEFAULT 'normal',
  current_stock      INTEGER NOT NULL DEFAULT 0,
  recommended_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_status     TEXT NOT NULL DEFAULT 'reorder_recommended',
  demand_signals     JSONB NOT NULL DEFAULT '{}',
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DMRC: Purchase order drafts
CREATE TABLE IF NOT EXISTS purchase_order_drafts (
  purchase_order_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id           UUID NOT NULL,
  vendor_id          UUID,
  vendor_name        TEXT,
  requested_by       UUID,
  requested_by_role  TEXT NOT NULL DEFAULT 'manager',
  approval_required  BOOLEAN NOT NULL DEFAULT TRUE,
  approval_status    TEXT NOT NULL DEFAULT 'pending_manager_approval',
  approved_by        UUID,
  approved_by_role   TEXT,
  estimated_total    INTEGER NOT NULL DEFAULT 0,
  estimated_lead_time_days INTEGER NOT NULL DEFAULT 3,
  reorder_reason     TEXT,
  reorder_source     TEXT NOT NULL DEFAULT 'system',
  sync_status        TEXT NOT NULL DEFAULT 'reorder_preview_only',
  submission_status  TEXT NOT NULL DEFAULT 'reorder_not_submitted',
  preview_only       BOOLEAN NOT NULL DEFAULT TRUE,
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DMRC: Purchase order line items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  po_item_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id    UUID NOT NULL,
  venue_id             UUID NOT NULL,
  product_id           TEXT NOT NULL,
  product_name         TEXT NOT NULL,
  sku                  TEXT,
  vendor_sku           TEXT,
  current_stock        INTEGER NOT NULL DEFAULT 0,
  available_quantity   INTEGER NOT NULL DEFAULT 0,
  reorder_threshold    INTEGER NOT NULL DEFAULT 5,
  recommended_quantity INTEGER NOT NULL DEFAULT 0,
  minimum_order_quantity INTEGER NOT NULL DEFAULT 1,
  case_pack_quantity   INTEGER NOT NULL DEFAULT 1,
  estimated_unit_cost  INTEGER NOT NULL DEFAULT 0,
  estimated_line_total INTEGER NOT NULL DEFAULT 0,
  urgency              TEXT NOT NULL DEFAULT 'normal',
  reason               TEXT,
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DMRC: Reorder demand signals
CREATE TABLE IF NOT EXISTS reorder_demand_signals (
  signal_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id          UUID NOT NULL,
  product_id        TEXT NOT NULL,
  product_name      TEXT NOT NULL,
  signal_type       TEXT NOT NULL DEFAULT 'low_stock',
  signal_source     TEXT NOT NULL DEFAULT 'system',
  signal_strength   TEXT NOT NULL DEFAULT 'normal',
  current_stock     INTEGER,
  times_blocked     INTEGER NOT NULL DEFAULT 1,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DMRC: Receiving preview
CREATE TABLE IF NOT EXISTS inventory_receiving_previews (
  receiving_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id           UUID NOT NULL,
  purchase_order_id  UUID,
  vendor_id          UUID,
  receiving_status   TEXT NOT NULL DEFAULT 'receiving_pending',
  items_expected     INTEGER NOT NULL DEFAULT 0,
  items_received     INTEGER NOT NULL DEFAULT 0,
  receiving_note     TEXT,
  persistence_status TEXT NOT NULL DEFAULT 'database_required',
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
