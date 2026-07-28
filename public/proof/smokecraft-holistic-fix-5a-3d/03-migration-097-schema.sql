-- Holistic Fix 5A-3D — server-authoritative tasting draft/completion state.
-- Additive only. Mirrors the exact optimistic-concurrency pattern already
-- proven for smokecraft_player_state.journey_snapshot (migration 094) —
-- a version column + expectedVersion check on write, 409 on stale write —
-- kept as its own small table (rather than folding into the large
-- journey-snapshot blob) so a tasting draft has its own real, auditable,
-- idempotent history separate from the rest of journey content.
CREATE TABLE IF NOT EXISTS smokecraft_tasting_drafts (
  id                BIGSERIAL PRIMARY KEY,
  guest_reference   TEXT NOT NULL,
  activity_key      TEXT NOT NULL,   -- e.g. 'mini-tasting'
  draft_data        JSONB NOT NULL DEFAULT '{}'::jsonb,  -- learner observations only — never score/XP/completion validity
  version           INT NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, activity_key)
);
CREATE INDEX IF NOT EXISTS idx_std_guest ON smokecraft_tasting_drafts(guest_reference);
