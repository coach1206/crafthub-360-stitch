-- Rollback for 108_smokecraft_venue_humidor_checkout_authority.sql.
-- Effect: checkout/order-detail fields are removed. Core order/
-- inventory data from 106/107 is untouched.

ALTER TABLE venue_cigar_orders
  DROP COLUMN IF EXISTS order_number,
  DROP COLUMN IF EXISTS hold_id,
  DROP COLUMN IF EXISTS reservation_id,
  DROP COLUMN IF EXISTS fulfillment_method,
  DROP COLUMN IF EXISTS fulfillment_details,
  DROP COLUMN IF EXISTS customer_notes,
  DROP COLUMN IF EXISTS tax_cents,
  DROP COLUMN IF EXISTS service_charge_cents,
  DROP COLUMN IF EXISTS discount_cents,
  DROP COLUMN IF EXISTS tip_cents,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS age_verification_required,
  DROP COLUMN IF EXISTS age_verified,
  DROP COLUMN IF EXISTS payment_status,
  DROP COLUMN IF EXISTS product_snapshot,
  DROP COLUMN IF EXISTS pairing_snapshot;
