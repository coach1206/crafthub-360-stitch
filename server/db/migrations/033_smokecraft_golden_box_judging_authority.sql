-- Holistic Fix 5C-2A — Golden Box judge-assignment and scorecard-
-- scoring authority. Additive only.
--
-- golden_box_rubric_criteria formalizes the rubric that was already
-- live and approved (JudgeEntryReview.jsx's CATEGORIES array /
-- judgingService.js's VALID_CATEGORIES, both already matching
-- Package 7A's documented scorecard map) — the same 12 categories,
-- equal weight (1 each, matching the existing unweighted-average
-- behavior in computeAggregateResult()), 0-10 range, no required-
-- comment rule (comments are documented as optional in the existing
-- UI). Nothing here is a new or conflicting rubric.

CREATE TABLE IF NOT EXISTS golden_box_rubric_criteria (
  id                BIGSERIAL PRIMARY KEY,
  criterion_key     TEXT NOT NULL,
  rule_version      INT NOT NULL DEFAULT 1,
  label             TEXT NOT NULL,
  description       TEXT NOT NULL,
  min_score         NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_score         NUMERIC(5,2) NOT NULL DEFAULT 10,
  weight            NUMERIC(5,2) NOT NULL DEFAULT 1,
  comment_required  BOOLEAN NOT NULL DEFAULT false,
  active            BOOLEAN NOT NULL DEFAULT true,
  display_order     INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (criterion_key, rule_version)
);
CREATE INDEX IF NOT EXISTS idx_gbrc_active ON golden_box_rubric_criteria (active) WHERE active = true;

INSERT INTO golden_box_rubric_criteria (criterion_key, rule_version, label, description, min_score, max_score, weight, comment_required, display_order) VALUES
  ('construction', 1, 'Construction', 'How evenly and securely the cigar is built — firmness, seams, cap security.', 0, 10, 1, false, 1),
  ('draw', 1, 'Draw', 'Airflow resistance when drawing smoke through the cigar.', 0, 10, 1, false, 2),
  ('burn', 1, 'Burn', 'How evenly the cigar burns down its length.', 0, 10, 1, false, 3),
  ('aroma', 1, 'Aroma (Blend)', 'Cold and lit aroma character of the blend as a whole.', 0, 10, 1, false, 4),
  ('flavor', 1, 'Flavor', 'Overall flavor quality and clarity of the blend.', 0, 10, 1, false, 5),
  ('balance', 1, 'Balance', 'Whether strength, body, and flavor work together rather than one dominating.', 0, 10, 1, false, 6),
  ('complexity', 1, 'Complexity', 'How many distinct, well-integrated notes the blend presents.', 0, 10, 1, false, 7),
  ('progression', 1, 'Flavor Progression', 'How the flavor evolves from first to final third.', 0, 10, 1, false, 8),
  ('finish', 1, 'Finish', 'The sensation and flavor that lingers after each puff.', 0, 10, 1, false, 9),
  ('creativity', 1, 'Creativity', 'Originality of the blend concept and pairing rationale.', 0, 10, 1, false, 10),
  ('rule_compliance', 1, 'Presentation (Rule Compliance)', 'Whether the entry followed competition requirements and presented a complete, defensible submission.', 0, 10, 1, false, 11),
  ('overall_impression', 1, 'Overall Impression (incl. Pairing)', 'Holistic judgment of the blend, presentation, and pairing rationale together.', 0, 10, 1, false, 12)
ON CONFLICT (criterion_key, rule_version) DO NOTHING;

-- Judge-assignment authority: who assigned, real append-only audit
-- trail (assigned_by previously did not exist as a column at all —
-- only logActivity's generic, unstructured metadata captured it).
ALTER TABLE golden_box_judge_assignments
  ADD COLUMN IF NOT EXISTS assigned_by TEXT;

-- Scorecard authority: server-computed weighted total (never client-
-- submitted), the rubric rule version it was scored under, optimistic-
-- concurrency version for draft saves, and idempotency for final
-- submission.
ALTER TABLE golden_box_scorecards
  ADD COLUMN IF NOT EXISTS weighted_total NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS rule_version INT,
  ADD COLUMN IF NOT EXISTS draft_version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS idx_gbsc_idempotency_key
  ON golden_box_scorecards (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- The table's existing UNIQUE(entry_id, judge_id, amended_from) never
-- actually enforced "at most one original (non-amended) scorecard per
-- judge+entry" — Postgres treats every NULL amended_from as distinct
-- for uniqueness purposes, so two concurrent first-ever draft saves
-- (a real two-tab race, found live) could both pass the row-lock
-- check (no row existed yet to lock) and both INSERT a new scorecard.
-- A partial unique index, keyed only on the real "original scorecard"
-- rows (amended_from IS NULL), closes this for real.
CREATE UNIQUE INDEX IF NOT EXISTS idx_gbsc_one_original_per_judge_entry
  ON golden_box_scorecards (entry_id, judge_id) WHERE amended_from IS NULL;
