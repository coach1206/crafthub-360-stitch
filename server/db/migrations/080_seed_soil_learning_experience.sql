-- Package 4: Seed and Soil live educational journey — user-scoped notes,
-- progress tracking, and quiz attempts. Additive only; does not touch
-- migrations 075-079. Reuses golden_box_component_catalog (seed_genetics/
-- soil/terroir/plant_anatomy/country/region rows already seeded in
-- Package 3) and smokecraft_quiz_questions (Package 3) rather than
-- duplicating content storage.

CREATE TABLE IF NOT EXISTS smokecraft_seed_soil_notes (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  component_id BIGINT REFERENCES golden_box_component_catalog(id) ON DELETE SET NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ssn_guest ON smokecraft_seed_soil_notes (guest_reference);

CREATE TABLE IF NOT EXISTS smokecraft_seed_soil_progress (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  component_id BIGINT NOT NULL REFERENCES golden_box_component_catalog(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, component_id)
);
CREATE INDEX IF NOT EXISTS idx_ssp_guest ON smokecraft_seed_soil_progress (guest_reference);

CREATE TABLE IF NOT EXISTS smokecraft_seed_soil_quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  question_id BIGINT NOT NULL REFERENCES smokecraft_quiz_questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  xp_awarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, question_id)
);
CREATE INDEX IF NOT EXISTS idx_ssqa_guest ON smokecraft_seed_soil_quiz_attempts (guest_reference);

INSERT INTO xp_award_rules (rule_key, source_type, amount, description, enabled)
VALUES ('seed_soil_quiz_correct', 'quiz', 15, 'Seed and Soil knowledge check answered correctly', true)
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO xp_award_rules (rule_key, source_type, amount, description, enabled)
VALUES ('seed_soil_exploration_complete', 'session_completion', 10, 'Seed and Soil — all zones explored', true)
ON CONFLICT (rule_key) DO NOTHING;
