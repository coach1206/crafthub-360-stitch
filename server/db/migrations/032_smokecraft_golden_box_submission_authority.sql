-- Holistic Fix 5C-1B — Golden Box submission foundation. Additive only.
--
-- golden_box_entry_versions.idempotency_key: a rapid double-click on
-- Save Draft previously always created a new version row (no dedupe
-- at all) — this closes that gap the same way every other mutation in
-- this codebase already works (idempotency_key UNIQUE, caller-supplied,
-- a duplicate request returns the existing row rather than creating a
-- second one).
--
-- golden_box_submissions already has a real UNIQUE(entry_id)
-- constraint (migration 077) — a genuine two-tab race on Submit was
-- already impossible to duplicate at the database level, but
-- entryService.submitEntry() never caught the resulting unique
-- violation, so the LOSER of the race got an unhandled 500 instead of
-- an honest "already submitted" result. idempotency_key here is
-- additional defense-in-depth for exact request replay (matching the
-- established pattern elsewhere), not a replacement for the existing
-- entry-level uniqueness.

ALTER TABLE golden_box_entry_versions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_gbev_idempotency_key
  ON golden_box_entry_versions (idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE golden_box_submissions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_gbs_idempotency_key
  ON golden_box_submissions (idempotency_key) WHERE idempotency_key IS NOT NULL;
