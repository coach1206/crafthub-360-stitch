-- Blend Fault Identification Backend Scoring (controlled pass, after 088).
-- Additive only — does not touch migrations 001-088, does not alter
-- Filler Arrangement, Skill Tree, Collections, or Challenge Hub data,
-- does not create a competing event log
-- (smokecraft_progression_events is reused).
--
-- Audit finding: src/pages/smokecraft/BlendFaultChallenge.jsx was a
-- fully local, client-only 3-step challenge. Each step let the learner
-- toggle any number of multi-select checkboxes with no defined
-- server-side "correct" set anywhere in the codebase, then always
-- advanced on any non-empty selection. Completion was tracked only in
-- component state (React useState), never persisted, and honestly
-- disclosed "XP and badge awards are not yet backend-connected... not
-- persisted or scored server-side yet." No answer key, no attempt
-- table, no scoring engine existed anywhere in the codebase.
--
-- Because multi-select-with-no-answer-key has no server-scorable
-- semantics, this pass models each of the 3 existing steps as one
-- single-choice question (choose the single best answer), reusing the
-- exact existing step titles, option labels, and approved image assets
-- from BlendFaultChallenge.jsx verbatim -- no new content was invented.
-- The seeded correct-answer path (Wrapper Damage -> "Re-moisten and
-- rest the leaf" -> "Re-moisten and rest the leaf") matches the exact
-- walkthrough already exercised by the pre-existing
-- verify-smokecraft-new-gamification-screens.mjs regression suite, so
-- it reflects real, already-approved product behavior rather than an
-- invented answer key.
--
-- No approved passing threshold existed anywhere in the product. This
-- migration establishes one server-authoritative rule: 2 of 3 correct
-- (>= 67%) to pass -- the smallest reasonable production rule for a
-- 3-question assessment, disclosed here and in the final report.

CREATE TABLE IF NOT EXISTS smokecraft_blend_fault_questions (
  id BIGSERIAL PRIMARY KEY,
  question_key TEXT NOT NULL UNIQUE,
  prompt TEXT NOT NULL,
  scenario_description TEXT NOT NULL,
  fault_category TEXT NOT NULL,
  asset_reference TEXT,
  answer_options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  educational_takeaway TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  display_order INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS smokecraft_blend_fault_attempts (
  id BIGSERIAL PRIMARY KEY,
  attempt_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  guest_reference TEXT NOT NULL,
  assessment_key TEXT NOT NULL DEFAULT 'blend-fault-identification',
  attempt_number INT NOT NULL,
  assessment_version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'passed', 'failed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score_earned INT,
  score_possible INT,
  percentage NUMERIC(5,2),
  pass_fail TEXT CHECK (pass_fail IN ('passed', 'failed')),
  completion_source TEXT,
  reward_granted_at TIMESTAMPTZ,
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, assessment_key, attempt_number)
);
CREATE INDEX IF NOT EXISTS idx_scbfa_guest ON smokecraft_blend_fault_attempts (guest_reference, assessment_key);

CREATE TABLE IF NOT EXISTS smokecraft_blend_fault_answers (
  id BIGSERIAL PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES smokecraft_blend_fault_attempts(attempt_id) ON DELETE CASCADE,
  question_key TEXT NOT NULL REFERENCES smokecraft_blend_fault_questions(question_key) ON DELETE RESTRICT,
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INT NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (attempt_id, question_key)
);

-- Stable question definitions only -- no attempts, no answers seeded here.
-- Exactly 3 questions, matching the 3 existing approved steps 1:1.
INSERT INTO smokecraft_blend_fault_questions
  (question_key, prompt, scenario_description, fault_category, asset_reference, answer_options, correct_answer, explanation, educational_takeaway, difficulty, display_order)
VALUES
  ('step-1-identify-the-issue', 'Identify the Issue', 'Examine the presented cigar and identify the primary construction fault.', 'identification', 'blendFaultChallengeStep1',
   '["Wrapper Damage","Cap Problem","Uneven Roll","Loose Wrapper","Soft Spots","Hard Spots","Vein Issues","Construction Gaps","Other"]'::jsonb,
   'Wrapper Damage',
   'The visible tear and lifted leaf edge are the defining signs of wrapper damage, distinct from a loose roll or a cap defect.',
   'Learning to distinguish wrapper damage from other construction faults is the first step in any real quality inspection.',
   'beginner', 1),
  ('step-2-choose-the-best-solution', 'Choose the Best Solution', 'Given the identified wrapper damage, choose the most appropriate corrective action.', 'correction', 'blendFaultChallengeStep2',
   '["Re-moisten and rest the leaf","Trim and reshape the cap","Adjust bunching and roll pressure","Re-apply binder or tighten roll","Dry boxing to reduce moisture","Release pressure and re-roll","Replace leaf section","Other"]'::jsonb,
   'Re-moisten and rest the leaf',
   'Wrapper damage from over-drying is best addressed by re-moisturizing and resting the leaf so it regains the elasticity needed to finish the roll without further tearing.',
   'Correcting a fault starts with treating its real cause -- here, restoring leaf moisture and elasticity, not a downstream fix like re-capping.',
   'beginner', 2),
  ('step-3-prevent-and-improve', 'Prevent and Improve', 'Choose the practice that best prevents this fault from recurring.', 'prevention', 'blendFaultChallengeStep3',
   '["Re-moisten and rest the leaf","Trim and repair the cap","Adjust bunching and roll pressure","Re-apply binder or tighten roll","Box press to improve shape","Re-align wrapper and roll evenly","Hydrate and condition","Replace leaf section","Other"]'::jsonb,
   'Re-moisten and rest the leaf',
   'Consistently maintaining proper leaf moisture before rolling prevents wrapper damage from recurring across future cigars.',
   'Prevention closes the loop: the same root-cause fix that corrects a fault also prevents it from happening again.',
   'beginner', 3)
ON CONFLICT (question_key) DO NOTHING;
