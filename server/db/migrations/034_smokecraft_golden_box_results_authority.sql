-- Holistic Fix 5C-2B-1 — Golden Box results aggregation and final
-- ranking authority. Additive only.
--
-- golden_box_results already existed (migration 077) with
-- aggregate_score/placement/is_finalist/is_winner/tie_break_reason/
-- disqualified/published_at — this migration adds the columns needed
-- for a genuinely server-authoritative, versioned, idempotent
-- finalization: per-entry judge/completion counts, criterion-level
-- averages, variance, the rubric/result rule versions the finalized
-- row was computed under, and who/when finalized it.

ALTER TABLE golden_box_results
  ADD COLUMN IF NOT EXISTS judge_count INT,
  ADD COLUMN IF NOT EXISTS completed_scorecard_count INT,
  ADD COLUMN IF NOT EXISTS criterion_averages JSONB,
  ADD COLUMN IF NOT EXISTS min_score NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS max_score NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS score_variance NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS completion_status TEXT,
  ADD COLUMN IF NOT EXISTS result_version INT,
  ADD COLUMN IF NOT EXISTS rubric_version INT,
  ADD COLUMN IF NOT EXISTS finalized_by TEXT,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;

-- Idempotent, one-finalization-per-competition-per-result-version
-- authority. A finalization row is the durable, append-only fact that
-- "result_version N of competition C was finalized" — a repeated
-- finalize request for the same (competition_id, result_version) is
-- detected via this table and returns the original finalized result,
-- never recomputes or duplicates.
CREATE TABLE IF NOT EXISTS golden_box_result_finalizations (
  id              BIGSERIAL PRIMARY KEY,
  competition_id  BIGINT NOT NULL REFERENCES golden_box_competitions(id) ON DELETE CASCADE,
  result_version  INT NOT NULL,
  rubric_version  INT NOT NULL,
  finalized_by    TEXT NOT NULL,
  idempotency_key TEXT,
  finalized_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, result_version)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gbrf_idempotency_key
  ON golden_box_result_finalizations (idempotency_key) WHERE idempotency_key IS NOT NULL;
