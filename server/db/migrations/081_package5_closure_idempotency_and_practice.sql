-- Package 5 closure pass: fix seed idempotency gap (no unique constraint
-- backed the ON CONFLICT DO NOTHING calls on
-- smokecraft_component_compatibility / smokecraft_quiz_questions, so a
-- repeated seed run silently duplicated rows) + add tables for the
-- tactile filler-arrangement exercise, the step-tracked rolling process,
-- and quality-control checklist decisions. Additive only; does not modify
-- migrations 075-080.

-- ── Idempotency fix: compatibility relationships ─────────────────────
-- A (source, target, relationship_type) triple is the natural key —
-- dedupe existing accidental duplicates first, then constrain.
DELETE FROM smokecraft_component_compatibility a USING smokecraft_component_compatibility b
WHERE a.id > b.id
  AND a.source_component_id = b.source_component_id
  AND a.target_component_id = b.target_component_id
  AND a.relationship_type = b.relationship_type;

ALTER TABLE smokecraft_component_compatibility
  ADD CONSTRAINT uq_scc_source_target_type UNIQUE (source_component_id, target_component_id, relationship_type);

-- ── Idempotency fix: quiz questions ───────────────────────────────────
-- Quiz question text is not a safe natural key (may legitimately change
-- during editing). Add a stable, seed-assigned slug instead.
ALTER TABLE smokecraft_quiz_questions ADD COLUMN IF NOT EXISTS question_key TEXT;

-- Dedupe any existing accidental duplicates (same question text) before
-- backfilling keys, keeping the earliest row.
DELETE FROM smokecraft_quiz_questions a USING smokecraft_quiz_questions b
WHERE a.id > b.id AND a.question = b.question;

-- Backfill any existing rows with no key using their own id (stable,
-- unique) so the constraint below can be NOT NULL — new seed rows always
-- supply a real slug.
UPDATE smokecraft_quiz_questions SET question_key = 'legacy-' || id WHERE question_key IS NULL;
ALTER TABLE smokecraft_quiz_questions ALTER COLUMN question_key SET NOT NULL;
ALTER TABLE smokecraft_quiz_questions ADD CONSTRAINT uq_scqq_question_key UNIQUE (question_key);

-- ── Package 5: tactile filler-arrangement practice ────────────────────
-- One active practice arrangement per guest — an ordered list of
-- {componentId, position} entries, not a Golden Box entry.
CREATE TABLE IF NOT EXISTS smokecraft_filler_arrangements (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL UNIQUE,
  arrangement JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Package 5: step-tracked rolling process ───────────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_rolling_progress (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  step_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'needs_review')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, step_key)
);

-- ── Package 5: quality-control checklist decisions ────────────────────
CREATE TABLE IF NOT EXISTS smokecraft_quality_control_decisions (
  id BIGSERIAL PRIMARY KEY,
  guest_reference TEXT NOT NULL,
  item_key TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('accept', 'rework', 'reject')),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, item_key)
);

INSERT INTO xp_award_rules (rule_key, source_type, amount, description, enabled)
VALUES ('rolling_process_complete', 'session_completion', 20, 'Completed the full leaf-to-cigar rolling process sequence', true)
ON CONFLICT (rule_key) DO NOTHING;
