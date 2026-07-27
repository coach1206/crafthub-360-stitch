-- Holistic Fix 5A — canonical gameplay ledger extensions.
-- Additive only. Reuses smokecraft_player_state / smokecraft_awards /
-- smokecraft_session_completions / smokecraft_award_audit (migrations
-- 092/093) as the real, already-idempotent event ledger backbone rather
-- than building a second competing one, per this codebase's established
-- "do not introduce a second competing system" convention.

-- Versioned rule registry — every reward rule (session XP, badge
-- criteria, Passport-stamp criteria, rank thresholds) is recorded here
-- with an explicit version, so historical awards can always cite the
-- exact rule that produced them (rule_version already existed on
-- smokecraft_awards' sibling audit trail conceptually; this table makes
-- the rule itself a first-class, queryable, versioned record instead of
-- only living in application source).
CREATE TABLE IF NOT EXISTS smokecraft_gameplay_rules (
  id                BIGSERIAL PRIMARY KEY,
  rule_key          TEXT NOT NULL,       -- e.g. 'session-xp:enroll', 'badge:sc-profile-started', 'rank-ladder'
  version           INT NOT NULL,
  active            BOOLEAN NOT NULL DEFAULT true,
  activity_type     TEXT NOT NULL,       -- 'session_completion' | 'badge' | 'passport_stamp' | 'rank'
  definition        JSONB NOT NULL,      -- the rule's actual parameters (xp amount, thresholds, criteria)
  explanation       TEXT,
  active_from       TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_to         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rule_key, version)
);
CREATE INDEX IF NOT EXISTS idx_sgr_key_active ON smokecraft_gameplay_rules(rule_key, active);

-- Records the rule_version an award was issued under — added as a
-- nullable column on the existing awards/completions tables (additive,
-- no data loss for pre-5A rows, which simply have rule_version = NULL,
-- honestly meaning "issued before rule versioning existed").
ALTER TABLE smokecraft_awards
  ADD COLUMN IF NOT EXISTS rule_version INT;
ALTER TABLE smokecraft_session_completions
  ADD COLUMN IF NOT EXISTS rule_version INT;

-- Real, append-only rank-change history — one row per promotion,
-- computed server-side, never client-submitted. UNIQUE on
-- (guest_reference, rank_label) prevents the exact same promotion being
-- recorded twice (idempotent), while still allowing a guest to be
-- promoted through multiple distinct ranks over time (each rank gets
-- its own row).
CREATE TABLE IF NOT EXISTS smokecraft_rank_history (
  id                BIGSERIAL PRIMARY KEY,
  event_id          UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  guest_reference   TEXT NOT NULL,
  rank_label        TEXT NOT NULL,
  xp_at_promotion   INT NOT NULL,
  rule_version      INT,
  promoted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_reference, rank_label)
);
CREATE INDEX IF NOT EXISTS idx_srh_guest ON smokecraft_rank_history(guest_reference);

-- Leaderboard eligibility — a guest/account must opt in (or be
-- eligible by default per policy) before appearing on any leaderboard
-- read. Defaults to eligible=true (matches the pre-existing product
-- behavior — SmokeCraft's leaderboard has always shown all active
-- guests, confirmed by reading services/leaderboardService.js), with an
-- explicit off-switch honored going forward. display_name is stored
-- separately from the account's real identity fields so the
-- leaderboard never leaks email/profile data — only what the guest
-- explicitly set as their display name (falls back to an honest
-- "Guest ####" pattern when unset, never a real email).
CREATE TABLE IF NOT EXISTS smokecraft_leaderboard_eligibility (
  id                BIGSERIAL PRIMARY KEY,
  guest_reference   TEXT NOT NULL UNIQUE,
  eligible          BOOLEAN NOT NULL DEFAULT true,
  display_name      TEXT,
  venue_id          TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
