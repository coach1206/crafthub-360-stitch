-- Venue Humidor 1B-2B-3 — customer pickup, venue service, and
-- fulfillment (handoff) confirmation. Additive only. Completion and
-- cancellation remain exclusively owned by checkoutService.js
-- (completeOrder/cancelOrder); this migration adds only the
-- pre-completion verification/handoff surface fulfillmentService.js
-- needs, plus a minimal, honest Passport-acquisition boundary that
-- did not exist anywhere in the codebase before this pass (confirmed
-- by audit: no purchase-completion flow anywhere calls into any
-- passport/collection table).

ALTER TABLE venue_cigar_orders
  -- Pickup-code verification: a bcrypt hash only, never plaintext.
  ADD COLUMN IF NOT EXISTS pickup_code_hash          TEXT,
  ADD COLUMN IF NOT EXISTS pickup_code_attempts       INTEGER NOT NULL DEFAULT 0 CHECK (pickup_code_attempts >= 0),
  ADD COLUMN IF NOT EXISTS pickup_code_expires_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pickup_code_generated_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at                 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_method         TEXT CHECK (verification_method IN (
    'pickup_code','staff_visual','customer_account', NULL
  )),
  -- Handoff: who handed the order over, when, and any approved notes.
  ADD COLUMN IF NOT EXISTS handoff_staff_id            TEXT,
  ADD COLUMN IF NOT EXISTS handoff_staff_role          TEXT,
  ADD COLUMN IF NOT EXISTS handoff_at                  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handoff_location            TEXT,
  ADD COLUMN IF NOT EXISTS handoff_notes               TEXT,
  -- No-show is a real, lightweight operational marker (not a distinct
  -- terminal fulfillment_status, per mandate — the actual next action
  -- is a separate, explicit block/cancel/expire/extend call).
  ADD COLUMN IF NOT EXISTS no_show_at                   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_reason               TEXT;

-- Widen the append-only fulfillment-event ledger's real event_type
-- vocabulary (verification/handoff/no-show/expiration/passport) —
-- same table, same constraints, no second ledger.
ALTER TABLE venue_cigar_fulfillment_events
  DROP CONSTRAINT IF EXISTS venue_cigar_fulfillment_events_event_type_check;
ALTER TABLE venue_cigar_fulfillment_events
  ADD CONSTRAINT venue_cigar_fulfillment_events_event_type_check CHECK (event_type IN (
    'order_claimed','order_assigned','order_confirmed','preparation_started',
    'item_picked','order_ready','order_completed','order_cancelled',
    'order_blocked','order_unblocked','fulfillment_note_added',
    'verification_generated','verification_attempted','verification_passed','verification_failed',
    'handoff_confirmed','no_show_marked','pickup_window_extended','order_expired',
    'passport_save_triggered','passport_save_completed','passport_save_failed'
  ));

-- Minimal, honest Passport-acquisition boundary. Written ONLY inside
-- checkoutService.completeOrder() (the sole canonical completion
-- path) — never from a pickup/handoff-specific code path — so it
-- applies exactly once per completed order regardless of entry point.
-- Mirrors smokecraft_collection_ownership's idempotency-key + unique-
-- constraint pattern (migration 087) rather than reusing that table
-- (different identity/domain) or passport_stamps (gameplay-eligibility
-- domain, not commercial acquisition).
CREATE TABLE IF NOT EXISTS venue_cigar_passport_acquisitions (
  id                    BIGSERIAL PRIMARY KEY,
  acquisition_id        UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES venue_cigar_orders(order_id) ON DELETE CASCADE,
  order_item_id          UUID NOT NULL REFERENCES venue_cigar_order_items(order_item_id) ON DELETE CASCADE,
  venue_id              TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  customer_reference     TEXT NOT NULL,
  product_id             UUID NOT NULL REFERENCES venue_cigar_products(product_id) ON DELETE RESTRICT,
  product_snapshot        JSONB NOT NULL DEFAULT '{}',
  quantity                INTEGER NOT NULL CHECK (quantity > 0),
  verified_fulfillment     BOOLEAN NOT NULL DEFAULT true,
  acquired_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key          TEXT NOT NULL UNIQUE,
  UNIQUE (order_item_id)
);
CREATE INDEX IF NOT EXISTS idx_vcpa_customer ON venue_cigar_passport_acquisitions (customer_reference);
CREATE INDEX IF NOT EXISTS idx_vcpa_venue ON venue_cigar_passport_acquisitions (venue_id);
CREATE INDEX IF NOT EXISTS idx_vcpa_order ON venue_cigar_passport_acquisitions (order_id);
