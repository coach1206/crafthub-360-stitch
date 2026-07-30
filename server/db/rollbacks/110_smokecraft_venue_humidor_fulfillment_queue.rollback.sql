-- Rollback for 110_smokecraft_venue_humidor_fulfillment_queue.sql.
-- Effect: staff fulfillment-workflow columns, item-picking columns,
-- and the append-only fulfillment event history table are removed.
-- Core 106/107/108/109 product, order, hold, reservation, and
-- inventory-event data is untouched.

DROP TABLE IF EXISTS venue_cigar_fulfillment_events;

DROP INDEX IF EXISTS idx_vco_venue_fulfillment;
DROP INDEX IF EXISTS idx_vco_assigned_staff;
DROP INDEX IF EXISTS idx_vco_order_number_search;

ALTER TABLE venue_cigar_orders
  DROP COLUMN IF EXISTS fulfillment_status,
  DROP COLUMN IF EXISTS assigned_staff_id,
  DROP COLUMN IF EXISTS assigned_staff_role,
  DROP COLUMN IF EXISTS assigned_at,
  DROP COLUMN IF EXISTS assignment_version,
  DROP COLUMN IF EXISTS promised_at,
  DROP COLUMN IF EXISTS ready_at,
  DROP COLUMN IF EXISTS blocked_reason,
  DROP COLUMN IF EXISTS cancellation_reason;

ALTER TABLE venue_cigar_order_items
  DROP COLUMN IF EXISTS is_picked,
  DROP COLUMN IF EXISTS picked_at,
  DROP COLUMN IF EXISTS picked_by;
