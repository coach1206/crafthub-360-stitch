-- Venue Humidor 1B-2B-4 — customer order history, receipts, Passport
-- acquisition read surface, and post-purchase experience. Additive
-- only. venue_cigar_passport_acquisitions (migration 111) remains the
-- sole acquisition source of truth — this migration adds no second
-- acquisition table, no duplicate order-history status, no duplicate
-- receipt-totals table. Order history/receipts/reorder all read the
-- existing venue_cigar_orders/venue_cigar_order_items/venue_cigar_products
-- columns directly.
--
-- Confirmed by audit: no existing rating/review or purchase-linked
-- "mark as smoked" system exists anywhere in the codebase (the only
-- adjacent tables — smokecraft_tasting_drafts, golden_box_mentor_reviews,
-- smokecraft_collection_ownership — are gameplay/mentorship/in-game-
-- collection concepts, not real-purchase consumption tracking). Per
-- mandate section 11, this adds ONLY a narrow verified-purchase
-- rating/tasting-note/smoked boundary, one row per real acquisition,
-- never a public review platform.
CREATE TABLE IF NOT EXISTS venue_cigar_acquisition_notes (
  id                  BIGSERIAL PRIMARY KEY,
  note_id             UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  acquisition_id      UUID NOT NULL UNIQUE REFERENCES venue_cigar_passport_acquisitions(acquisition_id) ON DELETE CASCADE,
  customer_reference  TEXT NOT NULL,
  rating              SMALLINT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  tasting_note        TEXT,
  is_smoked           BOOLEAN NOT NULL DEFAULT false,
  smoked_at           TIMESTAMPTZ,
  idempotency_key     TEXT UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcan_customer ON venue_cigar_acquisition_notes (customer_reference);
