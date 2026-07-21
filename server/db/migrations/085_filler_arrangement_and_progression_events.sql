-- Package: Filler Arrangement standalone lesson + shared progression-event
-- foundation. Additive only; does not touch migrations 075-084.
--
-- Scope honesty: this migration builds the real backend for the Filler
-- Arrangement screen (notes/progress/quiz, same proven pattern as
-- migration 080's Seed & Soil tables) plus one genuinely shared,
-- reusable event-log table (smokecraft_progression_events) that Skill
-- Tree/Collections/Challenge Hub can adopt in a future controlled pass.
-- This pass only emits events into it from Filler Arrangement's real
-- lesson_completed/knowledge_check_passed moments -- it does not attempt
-- full Skill Tree node persistence, Collection ownership, or Challenge
-- Hub live state in this same migration (that remains real, disclosed,
-- deferred scope).

CREATE TABLE IF NOT EXISTS smokecraft_filler_arrangement_notes (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference)
);

CREATE TABLE IF NOT EXISTS smokecraft_filler_arrangement_progress (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  zone_key TEXT NOT NULL, -- ligero | viso | seco | volado | airflow | density | strength | flavor | combustion | draw | faults
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, zone_key)
);
CREATE INDEX IF NOT EXISTS idx_far_guest ON smokecraft_filler_arrangement_progress (guest_reference);

CREATE TABLE IF NOT EXISTS smokecraft_filler_arrangement_quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  question_key TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  xp_awarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, question_key)
);

CREATE TABLE IF NOT EXISTS smokecraft_filler_arrangement_completion (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL UNIQUE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  xp_awarded BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO xp_award_rules (rule_key, source_type, amount, description, enabled)
VALUES ('filler_arrangement_quiz_correct', 'quiz', 15, 'Filler Arrangement knowledge check answered correctly', true)
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO xp_award_rules (rule_key, source_type, amount, description, enabled)
VALUES ('filler_arrangement_lesson_complete', 'session_completion', 10, 'Filler Arrangement standalone lesson completed', true)
ON CONFLICT (rule_key) DO NOTHING;

-- Shared, reusable progression-event log. Real schema, real idempotency
-- (unique on idempotency_key), intended as the foundation the mandate's
-- Task 2 describes -- but only Filler Arrangement writes to it this pass.
CREATE TABLE IF NOT EXISTS smokecraft_progression_events (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL DEFAULT gen_random_uuid(),
  guest_reference TEXT NOT NULL,
  venue_id TEXT,
  source_screen TEXT NOT NULL,
  source_route TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INT NOT NULL DEFAULT 1,
  idempotency_key TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'processed' CHECK (processing_status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_spe_guest ON smokecraft_progression_events (guest_reference);
CREATE INDEX IF NOT EXISTS idx_spe_type ON smokecraft_progression_events (event_type);
