-- Migration 028: Operational Inventory Persistence and Sync Layer (OIPSL)
-- Extends migration 027. Adds durable records for adjustments, audit trail,
-- approvals, receiving, and operational sync events.
-- Does not duplicate tables created in 027.

-- OIPSL: Full inventory records (extends venue_inventory with ISPAE model fields)
CREATE TABLE IF NOT EXISTS inventory_records (
  inventory_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id               UUID NOT NULL,
  product_id             TEXT NOT NULL,
  partner_vendor_id      UUID,
  craft_module           TEXT NOT NULL DEFAULT 'smokecraft',
  product_name           TEXT NOT NULL,
  product_type           TEXT NOT NULL DEFAULT 'product',
  category               TEXT NOT NULL DEFAULT 'general',
  sku                    TEXT,
  barcode                TEXT,
  external_pos_product_id TEXT,
  external_vendor_product_id TEXT,
  stock_on_hand          INTEGER NOT NULL DEFAULT 0,
  reserved_quantity      INTEGER NOT NULL DEFAULT 0,
  available_quantity     INTEGER NOT NULL DEFAULT 0,
  minimum_threshold      INTEGER NOT NULL DEFAULT 0,
  reorder_threshold      INTEGER NOT NULL DEFAULT 5,
  max_capacity           INTEGER,
  unit_type              TEXT NOT NULL DEFAULT 'unit',
  package_size           INTEGER NOT NULL DEFAULT 1,
  service_modes          TEXT[] NOT NULL DEFAULT '{}',
  fulfillment_routes     TEXT[] NOT NULL DEFAULT '{}',
  availability_status    TEXT NOT NULL DEFAULT 'pending_sync',
  availability_reason    TEXT,
  visibility_status      TEXT NOT NULL DEFAULT 'visible',
  compliance_lock_status TEXT NOT NULL DEFAULT 'unlocked',
  staff_permission_lock_status TEXT NOT NULL DEFAULT 'unlocked',
  orderable              BOOLEAN NOT NULL DEFAULT TRUE,
  recommendable          BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_checkout       BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_staff_order    BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_pos360         BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_ncie           BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_kds            BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_eat            BOOLEAN NOT NULL DEFAULT TRUE,
  reorder_eligible       BOOLEAN NOT NULL DEFAULT TRUE,
  reorder_recommended    BOOLEAN NOT NULL DEFAULT FALSE,
  reorder_urgency        TEXT NOT NULL DEFAULT 'none',
  preferred_vendor_id    UUID,
  backup_vendor_id       UUID,
  manufacturer_id        UUID,
  distributor_id         UUID,
  sync_status            TEXT NOT NULL DEFAULT 'database_required',
  sync_source            TEXT NOT NULL DEFAULT 'manual',
  sync_mode              TEXT NOT NULL DEFAULT 'manual',
  last_sync_at           TIMESTAMPTZ,
  degraded_mode          BOOLEAN NOT NULL DEFAULT FALSE,
  degraded_mode_reason   TEXT,
  metadata               JSONB NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(venue_id, product_id)
);

-- OIPSL: Inventory adjustments (durable ledger of all stock changes)
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  adjustment_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id               UUID,
  product_id                 TEXT NOT NULL,
  venue_id                   UUID NOT NULL,
  adjustment_type            TEXT NOT NULL DEFAULT 'manual_adjustment',
  quantity_delta             INTEGER NOT NULL DEFAULT 0,
  previous_stock_on_hand     INTEGER NOT NULL DEFAULT 0,
  new_stock_on_hand          INTEGER NOT NULL DEFAULT 0,
  previous_reserved_quantity INTEGER NOT NULL DEFAULT 0,
  new_reserved_quantity      INTEGER NOT NULL DEFAULT 0,
  previous_available_quantity INTEGER NOT NULL DEFAULT 0,
  new_available_quantity     INTEGER NOT NULL DEFAULT 0,
  reason                     TEXT,
  source_system              TEXT NOT NULL DEFAULT 'manual',
  source_event_id            UUID,
  performed_by               UUID,
  role                       TEXT NOT NULL DEFAULT 'staff',
  approval_id                UUID,
  receiving_id               UUID,
  order_id                   UUID,
  checkout_id                UUID,
  pos360_order_id            UUID,
  kds_order_id               UUID,
  persisted                  BOOLEAN NOT NULL DEFAULT TRUE,
  persistence_status         TEXT NOT NULL DEFAULT 'persisted',
  metadata                   JSONB NOT NULL DEFAULT '{}',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OIPSL: Inventory audit events
CREATE TABLE IF NOT EXISTS inventory_audit_events (
  audit_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       TEXT NOT NULL,
  system           TEXT NOT NULL DEFAULT 'ispae',
  venue_id         UUID NOT NULL,
  product_id       TEXT,
  inventory_id     UUID,
  purchase_order_id UUID,
  receiving_id     UUID,
  actor_id         UUID,
  actor_role       TEXT NOT NULL DEFAULT 'system',
  previous_value   JSONB,
  new_value        JSONB,
  reason           TEXT,
  status           TEXT NOT NULL DEFAULT 'recorded',
  persisted        BOOLEAN NOT NULL DEFAULT TRUE,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OIPSL: Reorder approvals (durable approval decisions)
CREATE TABLE IF NOT EXISTS reorder_approvals (
  approval_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_type    TEXT NOT NULL DEFAULT 'reorder_purchase_order',
  purchase_order_id UUID,
  venue_id         UUID NOT NULL,
  requested_by     UUID,
  requested_role   TEXT NOT NULL DEFAULT 'manager',
  approved_by      UUID,
  approved_role    TEXT,
  approval_status  TEXT NOT NULL DEFAULT 'pending_manager_approval',
  approval_notes   TEXT,
  decision_reason  TEXT,
  persisted        BOOLEAN NOT NULL DEFAULT TRUE,
  persistence_status TEXT NOT NULL DEFAULT 'persisted',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at       TIMESTAMPTZ
);

-- OIPSL: Receiving records
CREATE TABLE IF NOT EXISTS receiving_records (
  receiving_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id         UUID,
  venue_id                  UUID NOT NULL,
  vendor_id                 UUID,
  vendor_name               TEXT,
  received_by               UUID,
  receiving_status          TEXT NOT NULL DEFAULT 'receiving_pending',
  items_expected            INTEGER NOT NULL DEFAULT 0,
  items_received            INTEGER NOT NULL DEFAULT 0,
  damaged_items             INTEGER NOT NULL DEFAULT 0,
  short_shipped_items       INTEGER NOT NULL DEFAULT 0,
  over_shipped_items        INTEGER NOT NULL DEFAULT 0,
  notes                     TEXT,
  inventory_adjustment_ids  UUID[] NOT NULL DEFAULT '{}',
  persisted                 BOOLEAN NOT NULL DEFAULT TRUE,
  persistence_status        TEXT NOT NULL DEFAULT 'persisted',
  database_required         BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OIPSL: Receiving line items
CREATE TABLE IF NOT EXISTS receiving_items (
  receiving_item_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiving_id       UUID NOT NULL,
  venue_id           UUID NOT NULL,
  product_id         TEXT NOT NULL,
  product_name       TEXT NOT NULL,
  expected_quantity  INTEGER NOT NULL DEFAULT 0,
  received_quantity  INTEGER NOT NULL DEFAULT 0,
  damaged_quantity   INTEGER NOT NULL DEFAULT 0,
  discrepancy        INTEGER NOT NULL DEFAULT 0,
  item_status        TEXT NOT NULL DEFAULT 'receiving_pending',
  adjustment_id      UUID,
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OIPSL: Operational sync events
CREATE TABLE IF NOT EXISTS operational_sync_events (
  sync_event_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       TEXT NOT NULL,
  source_system    TEXT NOT NULL DEFAULT 'ispae',
  target_system    TEXT NOT NULL DEFAULT 'internal',
  venue_id         UUID NOT NULL,
  product_id       TEXT,
  inventory_id     UUID,
  purchase_order_id UUID,
  payload          JSONB NOT NULL DEFAULT '{}',
  sync_status      TEXT NOT NULL DEFAULT 'queued',
  retry_count      INTEGER NOT NULL DEFAULT 0,
  last_attempt_at  TIMESTAMPTZ,
  next_retry_at    TIMESTAMPTZ,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_records_venue     ON inventory_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_inventory_records_product   ON inventory_records(venue_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_venue ON inventory_adjustments(venue_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_prod  ON inventory_adjustments(venue_id, product_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_venue          ON inventory_audit_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_product        ON inventory_audit_events(venue_id, product_id);
CREATE INDEX IF NOT EXISTS idx_receiving_records_venue     ON receiving_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_receiving_records_po        ON receiving_records(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_venue           ON operational_sync_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_status          ON operational_sync_events(sync_status);
CREATE INDEX IF NOT EXISTS idx_reorder_approvals_venue     ON reorder_approvals(venue_id);
CREATE INDEX IF NOT EXISTS idx_reorder_approvals_po        ON reorder_approvals(purchase_order_id);
