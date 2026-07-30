-- Rollback for 104_smokecraft_golden_box_results_authority.sql.
-- Effect: server-computed criterion averages/variance/versioning and
-- idempotent finalization stop working. No entry/scorecard/submission
-- data is deleted; golden_box_results rows retain only their
-- pre-existing aggregate_score/placement/is_finalist/is_winner/
-- tie_break_reason/disqualified/published_at columns.

DROP TABLE IF EXISTS golden_box_result_finalizations;

ALTER TABLE golden_box_results
  DROP COLUMN IF EXISTS judge_count,
  DROP COLUMN IF EXISTS completed_scorecard_count,
  DROP COLUMN IF EXISTS criterion_averages,
  DROP COLUMN IF EXISTS min_score,
  DROP COLUMN IF EXISTS max_score,
  DROP COLUMN IF EXISTS score_variance,
  DROP COLUMN IF EXISTS completion_status,
  DROP COLUMN IF EXISTS result_version,
  DROP COLUMN IF EXISTS rubric_version,
  DROP COLUMN IF EXISTS finalized_by,
  DROP COLUMN IF EXISTS finalized_at;
