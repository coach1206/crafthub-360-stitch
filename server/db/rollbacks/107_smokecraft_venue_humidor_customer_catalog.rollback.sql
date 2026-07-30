-- Rollback for 107_smokecraft_venue_humidor_customer_catalog.sql.
-- Effect: customer browsing/detail fields and favorites are removed.
-- Core product/inventory/order data from migration 106 is untouched.

DROP TABLE IF EXISTS venue_cigar_favorites;

ALTER TABLE venue_cigar_products
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS body,
  DROP COLUMN IF EXISTS flavor_notes,
  DROP COLUMN IF EXISTS smoke_time_minutes,
  DROP COLUMN IF EXISTS experience_level,
  DROP COLUMN IF EXISTS length_inches,
  DROP COLUMN IF EXISTS ring_gauge,
  DROP COLUMN IF EXISTS binder,
  DROP COLUMN IF EXISTS filler,
  DROP COLUMN IF EXISTS box_price_cents,
  DROP COLUMN IF EXISTS box_quantity,
  DROP COLUMN IF EXISTS primary_image_url,
  DROP COLUMN IF EXISTS secondary_image_url,
  DROP COLUMN IF EXISTS venue_description,
  DROP COLUMN IF EXISTS staff_notes,
  DROP COLUMN IF EXISTS is_staff_pick,
  DROP COLUMN IF EXISTS is_archived,
  DROP COLUMN IF EXISTS is_customer_visible;
