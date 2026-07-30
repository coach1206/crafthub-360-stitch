-- Venue Humidor 1B-2A — checkout, order creation, and hold conversion.
-- Additive only, extends venue_cigar_orders (106) rather than
-- duplicating order ownership.

ALTER TABLE venue_cigar_orders
  ADD COLUMN IF NOT EXISTS order_number             TEXT,
  ADD COLUMN IF NOT EXISTS hold_id                   UUID REFERENCES venue_cigar_inventory_holds(hold_id),
  ADD COLUMN IF NOT EXISTS reservation_id            UUID REFERENCES venue_cigar_reservations(reservation_id),
  ADD COLUMN IF NOT EXISTS fulfillment_method        TEXT CHECK (fulfillment_method IN (
    'counter_pickup','table_delivery','lounge_seat_delivery','pos_tab_existing','pos_tab_new', NULL
  )),
  ADD COLUMN IF NOT EXISTS fulfillment_details       JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS customer_notes            TEXT,
  ADD COLUMN IF NOT EXISTS tax_cents                 INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  ADD COLUMN IF NOT EXISTS service_charge_cents      INTEGER NOT NULL DEFAULT 0 CHECK (service_charge_cents >= 0),
  ADD COLUMN IF NOT EXISTS discount_cents            INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  ADD COLUMN IF NOT EXISTS tip_cents                 INTEGER NOT NULL DEFAULT 0 CHECK (tip_cents >= 0),
  ADD COLUMN IF NOT EXISTS currency                  TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS age_verification_required BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS age_verified              BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_status            TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid','pending_staff_confirmation','pending_pos_confirmation','confirmed','not_applicable'
  )),
  ADD COLUMN IF NOT EXISTS product_snapshot          JSONB,
  ADD COLUMN IF NOT EXISTS pairing_snapshot          JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vco_order_number ON venue_cigar_orders (order_number) WHERE order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vco_hold ON venue_cigar_orders (hold_id);
