-- Holistic Fix 4B — guest-to-account conversion record + journey-
-- snapshot columns for the remaining active learner-content state
-- (tasting notes, selections, quiz answers, pairing, etc.) that was
-- previously client-cache-only (see SMOKECRAFT_STATE_OWNERSHIP_MAP.md).
--
-- Design note (journey snapshot, not 15 new bespoke tables): the
-- remaining ~30 SmokeCraftJourneyContext fields are per-session content
-- decisions (mentor pick, tasting notes, quiz answers, pairing
-- selections) that are updated together as one logical unit per screen
-- visit and read together on resume — there is no cross-field query
-- requirement (nothing ever needs "all guests who picked mentor X" as a
-- SQL WHERE clause). A single versioned JSONB snapshot column, guarded
-- by real optimistic-concurrency (journey_version), is the correct,
-- minimal server-authoritative representation for this kind of blob-
-- shaped state — the same pattern Postgres JSONB is designed for, and
-- consistent with this table's existing xp_total/completions being
-- server-authoritative counters rather than needing per-field columns.

ALTER TABLE smokecraft_player_state
  ADD COLUMN IF NOT EXISTS journey_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS journey_version INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS journey_updated_at TIMESTAMPTZ;

-- One row per successfully-converted guest identity. UNIQUE on
-- guest_reference is the real duplicate-conversion guard (a guest
-- identity can only ever be converted once, ever — not once per
-- request) — combined with idempotency_key UNIQUE for exact-replay
-- protection of the specific request that performed it.
CREATE TABLE IF NOT EXISTS smokecraft_guest_conversions (
  id                    BIGSERIAL PRIMARY KEY,
  conversion_id         UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  guest_reference       TEXT NOT NULL UNIQUE,
  user_id               TEXT NOT NULL,
  idempotency_key       TEXT NOT NULL,
  sessions_transferred  INT NOT NULL DEFAULT 0,
  sessions_merged_duplicate INT NOT NULL DEFAULT 0,
  awards_transferred    INT NOT NULL DEFAULT 0,
  awards_merged_duplicate INT NOT NULL DEFAULT 0,
  journey_merge_outcome TEXT, -- 'guest_snapshot_used' | 'account_snapshot_used' | 'no_guest_snapshot' | 'no_account_snapshot'
  converted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_id            TEXT,
  device_id             TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_sgc_user_idempotency_key ON smokecraft_guest_conversions(user_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_sgc_user ON smokecraft_guest_conversions(user_id);
