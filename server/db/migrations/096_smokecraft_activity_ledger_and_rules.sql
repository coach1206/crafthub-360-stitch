-- Holistic Fix 5A-2 — canonical activity ledger + seeded rule registry.
-- Additive only.

-- One real, generic, evidence-bearing ledger row per scored/verified
-- gameplay activity (quiz submission, tiered-score challenge, named
-- one-time XP activity). Distinct from smokecraft_awards (which records
-- the *reward*, not the underlying evidence/attempt) — this table is the
-- "how the server decided" record the mandate calls for.
CREATE TABLE IF NOT EXISTS smokecraft_activity_attempts (
  id                BIGSERIAL PRIMARY KEY,
  event_id          UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  guest_reference   TEXT NOT NULL,
  activity_type     TEXT NOT NULL,   -- 'quiz' | 'leaf_challenge' | 'named_xp'
  activity_key      TEXT NOT NULL,   -- module id / activity id
  evidence          JSONB,           -- submitted responses/answers (never correctness/score)
  score             INT,
  total             INT,
  xp_awarded        INT NOT NULL DEFAULT 0,
  rule_version      INT,
  idempotency_key   TEXT NOT NULL,
  source_route      TEXT,
  request_id        TEXT,
  device_id         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, activity_type, activity_key),
  UNIQUE (guest_reference, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_saa_guest ON smokecraft_activity_attempts(guest_reference);

-- Append-only correction/reversal ledger. A correction never deletes or
-- edits the original award/attempt row — it records a new, separately
-- traceable event that references what it corrects and why, then the
-- affected totals are recalculated transactionally from the full history.
CREATE TABLE IF NOT EXISTS smokecraft_reward_corrections (
  id                  BIGSERIAL PRIMARY KEY,
  event_id            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  guest_reference     TEXT NOT NULL,
  correction_type     TEXT NOT NULL,   -- 'xp' | 'badge' | 'passport_stamp' | 'rank'
  target_table        TEXT NOT NULL,   -- table the original record lives in
  target_id           BIGINT,          -- original row id, when applicable
  target_award_key    TEXT,
  delta_xp            INT NOT NULL DEFAULT 0,
  reversed             BOOLEAN NOT NULL DEFAULT false,
  reason              TEXT NOT NULL,
  authorized_by       TEXT NOT NULL,   -- staff/admin identity, never a learner identity
  idempotency_key     TEXT NOT NULL UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_src_guest ON smokecraft_reward_corrections(guest_reference);

-- Seeded, versioned rule registry rows (version 1) for every core
-- gameplay rule this pass converts to server authority. Values are
-- copied verbatim from the pre-existing, already-approved client
-- constants at seed time (see scripts/seedSmokecraftGameplayRules.mjs) —
-- this table becomes the durable, queryable record of what those values
-- were, without inventing new ones.
