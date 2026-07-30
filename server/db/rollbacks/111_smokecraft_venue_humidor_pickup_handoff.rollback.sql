-- Rollback for 111_smokecraft_venue_humidor_pickup_handoff.sql.
-- Effect: pickup verification, handoff, no-show, expiration-reason
-- columns and the passport-acquisition table are removed. Core
-- 106/107/108/109/110 data is untouched. Restores the fulfillment
-- event_type CHECK constraint to its 1B-2B-2 vocabulary.

DROP TABLE IF EXISTS venue_cigar_passport_acquisitions;

ALTER TABLE venue_cigar_fulfillment_events
  DROP CONSTRAINT IF EXISTS venue_cigar_fulfillment_events_event_type_check;
ALTER TABLE venue_cigar_fulfillment_events
  ADD CONSTRAINT venue_cigar_fulfillment_events_event_type_check CHECK (event_type IN (
    'order_claimed','order_assigned','order_confirmed','preparation_started',
    'item_picked','order_ready','order_completed','order_cancelled',
    'order_blocked','order_unblocked','fulfillment_note_added'
  ));

ALTER TABLE venue_cigar_orders
  DROP COLUMN IF EXISTS pickup_code_hash,
  DROP COLUMN IF EXISTS pickup_code_attempts,
  DROP COLUMN IF EXISTS pickup_code_expires_at,
  DROP COLUMN IF EXISTS pickup_code_generated_at,
  DROP COLUMN IF EXISTS verified_at,
  DROP COLUMN IF EXISTS verification_method,
  DROP COLUMN IF EXISTS handoff_staff_id,
  DROP COLUMN IF EXISTS handoff_staff_role,
  DROP COLUMN IF EXISTS handoff_at,
  DROP COLUMN IF EXISTS handoff_location,
  DROP COLUMN IF EXISTS handoff_notes,
  DROP COLUMN IF EXISTS no_show_at,
  DROP COLUMN IF EXISTS expired_reason;
