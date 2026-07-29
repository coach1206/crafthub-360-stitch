-- Holistic Fix 5C-1A — Challenge Hub scoring authority. Additive only.
--
-- 1. rule_version makes every active challenge definition's scoring
--    rule explicitly versioned (previously implicit/absent) — every
--    active definition is backfilled to version 1 (a direct,
--    unversioned port of its existing, already-approved
--    requirement_config; not a new rule).
--
-- 2. smokecraft_challenge_rewards is the real, database-enforced
--    idempotency guard for a Challenge Hub XP award: UNIQUE
--    (guest_reference, challenge_instance_key) means a challenge can
--    be rewarded at most once per learner per instance, no matter how
--    many times completion is (re-)evaluated (page reloads, two-tab
--    races, rapid double-clicks). The xp_reward value awarded is
--    already-approved, disclosed schema data (smokecraft_challenge_
--    definitions.xp_reward, currently 0 for both seeded challenges) —
--    this table makes that pre-existing column's value structurally
--    live for the first time; it does not introduce a new reward
--    amount.

ALTER TABLE smokecraft_challenge_definitions
  ADD COLUMN IF NOT EXISTS rule_version INT NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS smokecraft_challenge_rewards (
  id                    BIGSERIAL PRIMARY KEY,
  guest_reference       TEXT NOT NULL,
  challenge_key         TEXT NOT NULL,
  challenge_instance_key TEXT NOT NULL,
  rule_version          INT NOT NULL,
  xp_awarded            INT NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  idempotency_key       TEXT NOT NULL UNIQUE,
  source_route          TEXT,
  request_id            TEXT,
  device_id             TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, challenge_instance_key)
);
CREATE INDEX IF NOT EXISTS idx_scr_guest ON smokecraft_challenge_rewards (guest_reference);
