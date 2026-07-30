-- Venue Humidor 1B-2B-2 — staff order and fulfillment queue.
-- Additive only. `venue_cigar_orders.status`/`payment_status` remain
-- exclusively owned by checkoutService.js (completeOrder/cancelOrder)
-- for the completed/cancelled/refunded terminal states — this
-- migration adds a SEPARATE `fulfillment_status` dimension for the
-- pre-completion staff workflow (new -> confirmed -> in_preparation ->
-- ready) that does not exist anywhere in the prior schema, so it is
-- new surface, not a rename/duplicate of an existing state. Once an
-- order reaches a real terminal state via checkoutService.js,
-- fulfillment_status is stamped to match in that SAME call (see
-- checkoutService.completeOrder()/cancelOrder() below) so there is
-- never a second, drifting status field.

ALTER TABLE venue_cigar_orders
  ADD COLUMN IF NOT EXISTS fulfillment_status   TEXT NOT NULL DEFAULT 'new'
    CHECK (fulfillment_status IN (
      'new','awaiting_confirmation','confirmed','in_preparation','ready',
      'completed','cancelled','expired','blocked'
    )),
  ADD COLUMN IF NOT EXISTS assigned_staff_id     TEXT,
  ADD COLUMN IF NOT EXISTS assigned_staff_role   TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at           TIMESTAMPTZ,
  -- Optimistic-concurrency guard for claim/assign/status-transition
  -- races: every mutating fulfillment write is a conditional
  -- `WHERE assignment_version = $expected` UPDATE, incrementing this
  -- column; a 0-row result means someone else moved first (409).
  ADD COLUMN IF NOT EXISTS assignment_version    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promised_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ready_at               TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason          TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason      TEXT;

CREATE INDEX IF NOT EXISTS idx_vco_venue_fulfillment ON venue_cigar_orders (venue_id, fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_vco_assigned_staff ON venue_cigar_orders (venue_id, assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_vco_order_number_search ON venue_cigar_orders (venue_id, order_number);

-- Item-level picking. Backend does not support partial-quantity
-- fulfillment (per 1A/1B-2A design: applyInventoryEvent deducts a
-- whole order item's quantity at completion) — so this is a real,
-- honest whole-item "picked" boolean, never a faked partial-quantity
-- counter.
ALTER TABLE venue_cigar_order_items
  ADD COLUMN IF NOT EXISTS is_picked   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS picked_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS picked_by   TEXT;

-- Append-only staff fulfillment event history — the sole record of
-- every queue mutation (claim, assign, confirm, prepare, pick, ready,
-- complete, cancel, block, note). Mirrors the existing
-- venue_cigar_inventory_events append-only pattern; no UPDATE/DELETE
-- path is ever exposed by the application.
CREATE TABLE IF NOT EXISTS venue_cigar_fulfillment_events (
  id                BIGSERIAL PRIMARY KEY,
  event_id          UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  venue_id          TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  order_id          UUID NOT NULL REFERENCES venue_cigar_orders(order_id) ON DELETE CASCADE,
  order_item_id     UUID,
  event_type        TEXT NOT NULL CHECK (event_type IN (
    'order_claimed','order_assigned','order_confirmed','preparation_started',
    'item_picked','order_ready','order_completed','order_cancelled',
    'order_blocked','order_unblocked','fulfillment_note_added'
  )),
  previous_state    TEXT,
  new_state         TEXT,
  actor_id          TEXT NOT NULL,
  actor_role        TEXT,
  assigned_staff_id TEXT,
  reason            TEXT,
  staff_note        TEXT,
  idempotency_key   TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcfe_venue ON venue_cigar_fulfillment_events (venue_id);
CREATE INDEX IF NOT EXISTS idx_vcfe_order ON venue_cigar_fulfillment_events (order_id);
CREATE INDEX IF NOT EXISTS idx_vcfe_actor ON venue_cigar_fulfillment_events (actor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vcfe_idempotency_key ON venue_cigar_fulfillment_events (idempotency_key) WHERE idempotency_key IS NOT NULL;
