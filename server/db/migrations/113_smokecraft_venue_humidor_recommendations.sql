-- Venue Humidor 1B-2B-5 — inventory-aware pairing, venue
-- recommendations, and assisted selling. Additive only.
--
-- No new inventory table (available quantity is always live-computed
-- via inventoryService.getProductAvailability), no new product/cart/
-- checkout/order table, no new Passport table, and no new generic
-- analytics ledger — recommendation analytics events reuse the
-- existing, already-idempotent smokecraft_progression_events log
-- (migration 085), following the exact pattern already established by
-- server/services/venueHumidor/venueHumidorEventService.js.
--
-- The one genuinely new table below exists because no customer
-- cigar-preference store exists anywhere in the codebase (confirmed by
-- audit) — this is a single-row-per-customer preference record, not a
-- duplicate of venue_cigar_acquisition_notes (purchase-linked ratings/
-- tasting notes) or any other existing table.
CREATE TABLE IF NOT EXISTS venue_cigar_recommendation_preferences (
  id                    BIGSERIAL PRIMARY KEY,
  customer_reference    TEXT NOT NULL UNIQUE,
  preferred_strength    TEXT,
  preferred_body        TEXT,
  flavor_families       JSONB NOT NULL DEFAULT '[]'::jsonb,
  aroma_families        JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience_level      TEXT,
  smoking_duration_pref INTEGER,
  occasion              TEXT,
  time_of_day           TEXT,
  beverage_category     TEXT,
  budget_min_cents      INTEGER,
  budget_max_cents      INTEGER,
  preferred_vitola      TEXT,
  preferred_country     TEXT,
  liked_product_ids     JSONB NOT NULL DEFAULT '[]'::jsonb,
  disliked_product_ids  JSONB NOT NULL DEFAULT '[]'::jsonb,
  new_vs_familiar       TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcrp_customer ON venue_cigar_recommendation_preferences (customer_reference);

-- Assisted-selling outcome record — one row per staff-run recommendation
-- session outcome (accepted/declined/modified). Kept separate from the
-- append-only progression-events ledger because a staff actor needs a
-- queryable per-session outcome record (venue, staff, customer,
-- product, outcome) for the required assisted-selling UI, while the
-- event-level detail (candidates/ranked results/reason codes) still
-- goes through smokecraft_progression_events. Idempotent, append-only.
CREATE TABLE IF NOT EXISTS venue_cigar_assisted_selling_outcomes (
  id                  BIGSERIAL PRIMARY KEY,
  outcome_id          UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  venue_id            TEXT NOT NULL,
  staff_actor_id      TEXT NOT NULL,
  staff_actor_role    TEXT NOT NULL,
  customer_reference  TEXT,
  product_id          UUID NOT NULL REFERENCES venue_cigar_products(product_id),
  outcome             TEXT NOT NULL CHECK (outcome IN ('accepted','declined','modified')),
  notes               TEXT,
  idempotency_key     TEXT NOT NULL UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcaso_venue ON venue_cigar_assisted_selling_outcomes (venue_id, created_at DESC);
