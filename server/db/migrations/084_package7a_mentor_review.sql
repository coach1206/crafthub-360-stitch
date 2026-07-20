-- Package 7A: mentor review for Golden Box entries. Additive only; does
-- not modify migrations 075-083. Judging/scorecard/results/rewards reuse
-- Package 1's existing tables and services unchanged — no new tables for
-- those (see docs/audits/smokecraft-final-completion/package-7a/
-- 01-JUDGING-BACKEND-AUDIT.md).

CREATE TABLE IF NOT EXISTS golden_box_mentor_reviews (
  id BIGSERIAL PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES golden_box_entries(entry_id) ON DELETE CASCADE,
  mentor_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'amended')),
  readiness_status TEXT CHECK (readiness_status IN ('not_ready', 'needs_work', 'ready', 'strong') OR readiness_status IS NULL),
  strengths TEXT,
  component_feedback TEXT,
  construction_feedback TEXT,
  flavor_feedback TEXT,
  pairing_feedback TEXT,
  presentation_feedback TEXT,
  common_mistakes TEXT,
  improvement_areas TEXT,
  questions_for_learner TEXT,
  final_guidance TEXT,
  visibility TEXT NOT NULL DEFAULT 'entrant' CHECK (visibility IN ('entrant', 'judges', 'administrators')),
  amended_from BIGINT REFERENCES golden_box_mentor_reviews(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gbmr_entry ON golden_box_mentor_reviews (entry_id);

-- Official competition scoring stays exclusively in golden_box_scores
-- (scorer_type CHECK already excludes anything but human_judge /
-- administrative_adjustment / tie_break / disqualification) — mentor
-- review is structurally incapable of becoming an official score, same
-- separation pattern as golden_box_ai_analyses.
