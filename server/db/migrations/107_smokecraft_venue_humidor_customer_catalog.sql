-- Venue Humidor 1B-1 — customer browsing/detail catalog fields and
-- favorites. Additive only, extends 106's venue_cigar_products rather
-- than duplicating it.

ALTER TABLE venue_cigar_products
  ADD COLUMN IF NOT EXISTS country              TEXT,
  ADD COLUMN IF NOT EXISTS body                 TEXT CHECK (body IN ('light','light_medium','medium','medium_full','full')),
  ADD COLUMN IF NOT EXISTS flavor_notes         JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS smoke_time_minutes   INT,
  ADD COLUMN IF NOT EXISTS experience_level     TEXT CHECK (experience_level IN ('beginner','intermediate','experienced', NULL)),
  ADD COLUMN IF NOT EXISTS length_inches        NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS ring_gauge           INT,
  ADD COLUMN IF NOT EXISTS binder               TEXT,
  ADD COLUMN IF NOT EXISTS filler               TEXT,
  ADD COLUMN IF NOT EXISTS box_price_cents      INTEGER CHECK (box_price_cents IS NULL OR box_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS box_quantity         INTEGER CHECK (box_quantity IS NULL OR box_quantity > 0),
  ADD COLUMN IF NOT EXISTS primary_image_url    TEXT,
  ADD COLUMN IF NOT EXISTS secondary_image_url  TEXT,
  ADD COLUMN IF NOT EXISTS venue_description    TEXT,
  ADD COLUMN IF NOT EXISTS staff_notes          TEXT,
  ADD COLUMN IF NOT EXISTS is_staff_pick        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_customer_visible  BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_vcp_customer_visible ON venue_cigar_products (venue_id, is_customer_visible, is_archived);

-- One favorite per guest per product — real, server-enforced dedupe.
CREATE TABLE IF NOT EXISTS venue_cigar_favorites (
  id                BIGSERIAL PRIMARY KEY,
  favorite_id       UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  venue_id          TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES venue_cigar_products(product_id) ON DELETE CASCADE,
  guest_reference   TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, product_id)
);
CREATE INDEX IF NOT EXISTS idx_vcf_guest ON venue_cigar_favorites (guest_reference);
