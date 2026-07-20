-- Package 2 follow-up: compensating CHECK constraint recommended in
-- Package 1's migration safety review (docs/audits/smokecraft-final-
-- completion/package-1/09-MIGRATION-077-SAFETY-REVIEW.md). Migration
-- 077 relaxed smoke_leaderboard_entries.smoke_session_id to nullable so
-- Golden Box results (which have no smoke_sessions row) could publish
-- into the existing leaderboard table. That relaxation alone would
-- technically allow a non-Golden-Box row to also have a null
-- smoke_session_id. This narrow, additive constraint closes that gap
-- without touching migration 077 itself.
ALTER TABLE smoke_leaderboard_entries
  ADD CONSTRAINT chk_sle_session_or_golden_box
  CHECK (smoke_session_id IS NOT NULL OR category = 'golden_box');
