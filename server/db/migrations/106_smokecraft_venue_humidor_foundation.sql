-- Venue Humidor 1A — architecture, venue isolation, and database
-- foundation. Additive only. Reuses the existing `venues`/
-- `venue_memberships` tables (migration 010) for venue identity and
-- staff RBAC — no parallel venue or membership concept invented.
--
-- All quantities are tracked in individual sticks. "Opening a sealed
-- box" is inventory-neutral (an administrative event recording the
-- box was opened — box count is not separately modeled this pass);
-- "adding/removing loose sticks" are the real quantity-affecting
-- events. See SMOKECRAFT_VENUE_HUMIDOR_ARCHITECTURE_MAP.md.

CREATE TABLE IF NOT EXISTS venue_cigar_products (
  id                    BIGSERIAL PRIMARY KEY,
  product_id            UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  venue_id              TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  sku                   TEXT NOT NULL,
  barcode               TEXT,
  name                  TEXT NOT NULL,
  brand                 TEXT,
  vitola                TEXT,
  wrapper               TEXT,
  strength              TEXT CHECK (strength IN ('mild','mild_medium','medium','medium_full','full')),
  price_cents           INTEGER NOT NULL CHECK (price_cents >= 0),
  physical_quantity     INTEGER NOT NULL DEFAULT 0 CHECK (physical_quantity >= 0),
  unavailable_quantity  INTEGER NOT NULL DEFAULT 0 CHECK (unavailable_quantity >= 0),
  reorder_threshold     INTEGER NOT NULL DEFAULT 5 CHECK (reorder_threshold >= 0),
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold_out','discontinued')),
  is_featured           BOOLEAN NOT NULL DEFAULT false,
  is_limited_release    BOOLEAN NOT NULL DEFAULT false,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_by            TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_vcp_unavailable_le_physical CHECK (unavailable_quantity <= physical_quantity)
);
-- SKU uniqueness is per-venue, never global (two venues may legitimately
-- carry the same manufacturer SKU).
CREATE UNIQUE INDEX IF NOT EXISTS idx_vcp_venue_sku ON venue_cigar_products (venue_id, sku);
-- Barcode uniqueness per-venue, nullable (not every product has a scanned barcode).
CREATE UNIQUE INDEX IF NOT EXISTS idx_vcp_venue_barcode ON venue_cigar_products (venue_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vcp_venue ON venue_cigar_products (venue_id);
CREATE INDEX IF NOT EXISTS idx_vcp_venue_status ON venue_cigar_products (venue_id, status);

-- Append-only inventory ledger — the sole source of truth for how
-- venue_cigar_products.physical_quantity reached its current value.
-- Never overwritten or deleted (matches golden_box_activity_log's
-- append-only, trigger-enforced pattern).
CREATE TABLE IF NOT EXISTS venue_cigar_inventory_events (
  id                          BIGSERIAL PRIMARY KEY,
  event_id                    UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  venue_id                    TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  product_id                  UUID NOT NULL REFERENCES venue_cigar_products(product_id) ON DELETE CASCADE,
  event_type                  TEXT NOT NULL CHECK (event_type IN (
    'receiving','box_opened','stick_added','stick_removed','damage','loss',
    'complimentary','return','count_correction','reservation_created',
    'reservation_released','reservation_fulfilled','hold_created',
    'hold_expired','hold_released','sale_completed','cancellation_restored'
  )),
  quantity_delta              INTEGER NOT NULL,
  physical_quantity_before    INTEGER NOT NULL CHECK (physical_quantity_before >= 0),
  physical_quantity_after     INTEGER NOT NULL CHECK (physical_quantity_after >= 0),
  actor_id                    TEXT NOT NULL,
  actor_role                  TEXT,
  reason                      TEXT,
  reference_type               TEXT CHECK (reference_type IN ('hold','reservation','order', NULL)),
  reference_id                TEXT,
  idempotency_key              TEXT,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcie_venue ON venue_cigar_inventory_events (venue_id);
CREATE INDEX IF NOT EXISTS idx_vcie_product ON venue_cigar_inventory_events (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vcie_idempotency_key ON venue_cigar_inventory_events (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Short-lived, expiring holds (e.g. an active checkout in progress).
CREATE TABLE IF NOT EXISTS venue_cigar_inventory_holds (
  id                BIGSERIAL PRIMARY KEY,
  hold_id           UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  venue_id          TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES venue_cigar_products(product_id) ON DELETE CASCADE,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','released','converted')),
  held_by           TEXT NOT NULL,
  order_id          UUID,
  expires_at        TIMESTAMPTZ NOT NULL,
  idempotency_key   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcih_venue ON venue_cigar_inventory_holds (venue_id);
CREATE INDEX IF NOT EXISTS idx_vcih_product_status ON venue_cigar_inventory_holds (product_id, status);
CREATE INDEX IF NOT EXISTS idx_vcih_expires ON venue_cigar_inventory_holds (expires_at) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS idx_vcih_idempotency_key ON venue_cigar_inventory_holds (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Longer-lived, staff-created reservations (e.g. "hold this box for a
-- member until Friday").
CREATE TABLE IF NOT EXISTS venue_cigar_reservations (
  id                BIGSERIAL PRIMARY KEY,
  reservation_id    UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  venue_id          TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES venue_cigar_products(product_id) ON DELETE CASCADE,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','fulfilled','cancelled','expired')),
  reserved_for       TEXT NOT NULL,
  reserved_by        TEXT NOT NULL,
  expires_at        TIMESTAMPTZ,
  idempotency_key   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcr_venue ON venue_cigar_reservations (venue_id);
CREATE INDEX IF NOT EXISTS idx_vcr_product_status ON venue_cigar_reservations (product_id, status);
CREATE INDEX IF NOT EXISTS idx_vcr_expires ON venue_cigar_reservations (expires_at) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS idx_vcr_idempotency_key ON venue_cigar_reservations (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS venue_cigar_orders (
  id                  BIGSERIAL PRIMARY KEY,
  order_id            UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  venue_id            TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  customer_reference  TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_payment','completed','cancelled','refunded')),
  subtotal_cents      INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  total_cents         INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  idempotency_key     TEXT,
  completed_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vco_venue ON venue_cigar_orders (venue_id);
CREATE INDEX IF NOT EXISTS idx_vco_venue_status ON venue_cigar_orders (venue_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vco_idempotency_key ON venue_cigar_orders (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS venue_cigar_order_items (
  id                BIGSERIAL PRIMARY KEY,
  order_item_id     UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES venue_cigar_orders(order_id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES venue_cigar_products(product_id) ON DELETE RESTRICT,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents  INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  line_total_cents  INTEGER NOT NULL CHECK (line_total_cents >= 0),
  hold_id           UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_vcoi_order ON venue_cigar_order_items (order_id);
