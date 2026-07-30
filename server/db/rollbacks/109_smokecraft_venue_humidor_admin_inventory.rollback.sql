-- Rollback for 109_smokecraft_venue_humidor_admin_inventory.sql.
-- Effect: staff admin display/classification fields (cost, supplier,
-- storage location, tags, sealed/opened box counts, venue-exclusive
-- flag) are removed. Core 106/107/108 product, inventory-event, hold,
-- reservation, and order data is untouched.

DROP INDEX IF EXISTS idx_vcp_venue_line;

ALTER TABLE venue_cigar_products
  DROP COLUMN IF EXISTS cost_cents,
  DROP COLUMN IF EXISTS product_line,
  DROP COLUMN IF EXISTS region,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS supplier_name,
  DROP COLUMN IF EXISTS supplier_sku,
  DROP COLUMN IF EXISTS humidor_zone,
  DROP COLUMN IF EXISTS storage_location,
  DROP COLUMN IF EXISTS is_venue_exclusive,
  DROP COLUMN IF EXISTS sealed_box_count,
  DROP COLUMN IF EXISTS opened_box_count;
