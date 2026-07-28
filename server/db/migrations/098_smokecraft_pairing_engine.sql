-- Holistic Fix 5B-1 — server-authoritative pairing engine. Additive
-- only; reuses smokecraft_progression_events (migration 085) for the
-- pairing_requested/pairing_recommended/pairing_saved/pairing_rated
-- ledger events rather than creating a competing event log.
--
-- Rule/scoring model operates ONLY on the real, already-approved
-- pairing input fields already collected by PairingLab.jsx (S11) and
-- PairingRecommendations.jsx (S22): cigar shape, wrapper, origin,
-- strength, beverage/pairing type, flavor notes, pairing goal. No cigar
-- or beverage facts (e.g. ring gauge, sweetness/acidity/bitterness) are
-- invented — those fields simply do not exist in this game's approved
-- data model and are intentionally not represented here.

CREATE TABLE IF NOT EXISTS smokecraft_pairing_rules (
  id                BIGSERIAL PRIMARY KEY,
  rule_key          TEXT NOT NULL,
  version           INT NOT NULL,
  active            BOOLEAN NOT NULL DEFAULT true,
  cigar_condition   TEXT NOT NULL,       -- plain-language summary of the cigar-side condition
  beverage_condition TEXT NOT NULL,      -- plain-language summary of the beverage-side condition
  positive_effect   INT NOT NULL DEFAULT 0,   -- added to the base score when the rule's positive condition is met
  conflict_effect   INT NOT NULL DEFAULT 0,   -- subtracted from the base score when the rule's conflict condition is met (stored positive, subtracted by the engine)
  weight            INT NOT NULL DEFAULT 1,
  explanation_text  TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rule_key, version)
);
CREATE INDEX IF NOT EXISTS idx_spr_active ON smokecraft_pairing_rules (active) WHERE active = true;

-- Rule set version 1 — a direct, versioned port of the pre-existing
-- rule-based logic already live in src/utils/pairingEngine.js
-- (STRENGTH_SCORE / TYPE_STRENGTH / HARMONY / GOAL_DESC), so scoring
-- behavior is unchanged for real users, just now server-authoritative,
-- explainable, and versioned.
INSERT INTO smokecraft_pairing_rules
  (rule_key, version, active, cigar_condition, beverage_condition, positive_effect, conflict_effect, weight, explanation_text)
VALUES
  ('strength-intensity-balance', 1, true,
   'cigar strength (Mild=1..Full=4)', 'beverage/pairing-type intensity (TYPE_STRENGTH 1..4)',
   0, 12, 1,
   'A cigar''s strength and a pairing''s intensity should sit close together on a 1–4 scale — each step of mismatch reduces the score by 12 points, since an intense pairing can overpower a mild cigar (or the reverse).'),
  ('flavor-note-harmony', 1, true,
   'selected flavor notes', 'the pairing type''s harmony note list',
   6, 0, 1,
   'Each selected flavor note that matches the pairing type''s known harmony notes adds 6 points — these are notes that are known to reinforce each other.'),
  ('flavor-note-clash', 1, true,
   'selected flavor notes', 'the pairing type''s known clash note list',
   0, 10, 1,
   'Each selected flavor note that matches the pairing type''s known clash list subtracts 10 points — these notes are known to fight each other rather than blend.'),
  ('origin-strength-hold', 1, true,
   'cigar origin present + strength >= Medium-Full', 'n/a (cigar-only signal)',
   4, 0, 1,
   'A fuller-bodied leaf origin holds up well against a more assertive pairing rather than being overwhelmed by it.')
ON CONFLICT (rule_key, version) DO NOTHING;

CREATE TABLE IF NOT EXISTS smokecraft_pairing_saves (
  id                  BIGSERIAL PRIMARY KEY,
  guest_reference     TEXT NOT NULL,
  idempotency_key     TEXT NOT NULL UNIQUE,
  cigar_shape         TEXT,
  wrapper             TEXT,
  origin              TEXT,
  strength            TEXT,
  pairing_type        TEXT NOT NULL,
  flavor_notes        JSONB NOT NULL DEFAULT '[]'::jsonb,
  pairing_goal        TEXT,
  compat_score        INT NOT NULL,
  balance_score       INT NOT NULL,
  contrast_score      INT NOT NULL,
  intensity_match     TEXT NOT NULL,
  confidence          NUMERIC NOT NULL,
  explanation         TEXT NOT NULL,
  matched_flavor_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  conflicts           JSONB NOT NULL DEFAULT '[]'::jsonb,
  serving_sequence    TEXT NOT NULL,
  alternative_type    TEXT,
  alternative_score   INT,
  rule_set_version    INT NOT NULL,
  learner_rating      INT CHECK (learner_rating IS NULL OR (learner_rating BETWEEN 1 AND 5)),
  learner_notes       TEXT,
  save_version        INT NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, cigar_shape, wrapper, origin, strength, pairing_type)
);
CREATE INDEX IF NOT EXISTS idx_sps_guest ON smokecraft_pairing_saves (guest_reference);

-- Append-only revision history — a rating/notes edit never overwrites
-- history, it snapshots the pre-edit state here first.
CREATE TABLE IF NOT EXISTS smokecraft_pairing_save_revisions (
  id          BIGSERIAL PRIMARY KEY,
  save_id     BIGINT NOT NULL REFERENCES smokecraft_pairing_saves(id) ON DELETE CASCADE,
  snapshot    JSONB NOT NULL,
  revised_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_spsr_save ON smokecraft_pairing_save_revisions (save_id);
