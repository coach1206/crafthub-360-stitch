-- Venue Humidor 1B-2B-1 — staff inventory administration fields.
-- Additive only, extends 106/107's venue_cigar_products rather than
-- duplicating it. Quantity-affecting mutations continue to flow
-- exclusively through inventoryService.applyInventoryEvent() and the
-- existing venue_cigar_inventory_events ledger (migration 106) — its
-- event_type CHECK constraint already covers every admin mutation
-- action this pass needs (receiving, box_opened, stick_added,
-- stick_removed, damage, loss, complimentary, return,
-- count_correction), so no ledger change is required here.

ALTER TABLE venue_cigar_products
  ADD COLUMN IF NOT EXISTS cost_cents            INTEGER CHECK (cost_cents IS NULL OR cost_cents >= 0),
  ADD COLUMN IF NOT EXISTS product_line           TEXT,
  ADD COLUMN IF NOT EXISTS region                 TEXT,
  ADD COLUMN IF NOT EXISTS tags                   JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS supplier_name           TEXT,
  ADD COLUMN IF NOT EXISTS supplier_sku            TEXT,
  ADD COLUMN IF NOT EXISTS humidor_zone            TEXT,
  ADD COLUMN IF NOT EXISTS storage_location         TEXT,
  ADD COLUMN IF NOT EXISTS is_venue_exclusive       BOOLEAN NOT NULL DEFAULT false,
  -- Sealed/opened box counts are administrative, display-only counters
  -- (106 already notes "opening a box" is inventory-neutral for the
  -- authoritative stick count) — mutated only by the admin receiving/
  -- box-open actions, never by customer-facing flows.
  ADD COLUMN IF NOT EXISTS sealed_box_count         INTEGER NOT NULL DEFAULT 0 CHECK (sealed_box_count >= 0),
  ADD COLUMN IF NOT EXISTS opened_box_count         INTEGER NOT NULL DEFAULT 0 CHECK (opened_box_count >= 0);

CREATE INDEX IF NOT EXISTS idx_vcp_venue_line ON venue_cigar_products (venue_id, product_line);
