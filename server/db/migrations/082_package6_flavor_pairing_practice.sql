-- Package 6: flavor-progression stage observations and pairing-builder
-- practice drafts. Additive only; does not modify migrations 075-081.
-- Cigar anatomy, ring gauge, vitola, strength/body, and burn-
-- troubleshooting content reuse the existing generic
-- smokecraft_seed_soil_notes/_progress/_quiz_attempts tables (Package 4,
-- migration 080) — already guest+component_id keyed, not screen-
-- specific, same reuse pattern established in Package 5.

CREATE TABLE IF NOT EXISTS smokecraft_flavor_stage_observations (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('cold_aroma', 'cold_draw', 'first_third', 'second_third', 'final_third', 'finish')),
  flavor_notes JSONB NOT NULL DEFAULT '[]',
  intensity TEXT,
  strength_perception TEXT,
  body TEXT,
  balance TEXT,
  complexity TEXT,
  burn TEXT,
  draw TEXT,
  temperature TEXT,
  personal_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, stage)
);
CREATE INDEX IF NOT EXISTS idx_sfso_guest ON smokecraft_flavor_stage_observations (guest_reference);

CREATE TABLE IF NOT EXISTS smokecraft_pairing_drafts (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  cigar_reference TEXT,
  pairing_category TEXT NOT NULL,
  pairing_item TEXT,
  intensity TEXT,
  sweetness TEXT,
  acidity TEXT,
  bitterness TEXT,
  texture TEXT,
  temperature TEXT,
  strategy TEXT CHECK (strategy IN ('complement', 'contrast') OR strategy IS NULL),
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'saved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_spd_guest ON smokecraft_pairing_drafts (guest_reference);

INSERT INTO xp_award_rules (rule_key, source_type, amount, description, enabled)
VALUES ('pairing_draft_saved', 'session_completion', 15, 'Saved a complete pairing practice draft', true)
ON CONFLICT (rule_key) DO NOTHING;
