-- Holistic Fix 4 — canonical, server-authoritative SmokeCraft player
-- state for the primary 27-session curriculum: session completions and
-- idempotent awards (XP, badges, Passport stamps). Additive only — does
-- not touch any existing table (smokecraft_progression_events,
-- smokecraft_management_sync_journeys, smokecraft_collection_ownership,
-- etc. are reused/left as-is per SMOKECRAFT_STATE_OWNERSHIP_MAP.md).
--
-- Design note: guest_reference is a TEXT identifier matching the pattern
-- already established by smokecraft_progression_events and the
-- Management Sync journey table (ownerGuestReference() in
-- managementSyncController.js: `user:${id}` for an authenticated
-- account, or the raw cookie-issued guest id for a guest) — this schema
-- reuses that exact convention rather than inventing a second identity
-- scheme, so it composes with the existing
-- ensureSmokeCraftGuestIdentity middleware without modification.

-- One row per guest/account — the root authoritative record.
CREATE TABLE IF NOT EXISTS smokecraft_player_state (
  id                BIGSERIAL PRIMARY KEY,
  guest_reference   TEXT NOT NULL UNIQUE,
  venue_id          TEXT,
  schema_version    INT NOT NULL DEFAULT 1,
  xp_total          INT NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
  rank_label        TEXT,
  last_synced_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sps_guest ON smokecraft_player_state(guest_reference);

-- One row per (guest, session) — UNIQUE constraint is the real
-- duplicate-completion guard (not a client `if (done) return`).
CREATE TABLE IF NOT EXISTS smokecraft_session_completions (
  id                  BIGSERIAL PRIMARY KEY,
  completion_id       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  guest_reference     TEXT NOT NULL,
  session_id          TEXT NOT NULL,
  idempotency_key     TEXT NOT NULL UNIQUE,
  xp_awarded          INT NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  completed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_route        TEXT,
  request_id          TEXT,
  device_id           TEXT,
  UNIQUE (guest_reference, session_id)
);
CREATE INDEX IF NOT EXISTS idx_ssc_guest ON smokecraft_session_completions(guest_reference);
CREATE INDEX IF NOT EXISTS idx_ssc_session ON smokecraft_session_completions(session_id);

-- One row per unique award (XP delta not tied to a session completion,
-- badge unlock, or Passport stamp). idempotency_key is the real
-- duplicate-award guard, enforced by a database UNIQUE constraint —
-- a replayed request with the same key always returns the original
-- award row rather than creating a second one.
CREATE TABLE IF NOT EXISTS smokecraft_awards (
  id                BIGSERIAL PRIMARY KEY,
  award_id          UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  guest_reference   TEXT NOT NULL,
  award_type        TEXT NOT NULL CHECK (award_type IN ('xp', 'badge', 'passport_stamp')),
  award_key         TEXT NOT NULL, -- badge id / stamp id / xp-source label
  amount            INT NOT NULL DEFAULT 0 CHECK (amount >= 0), -- XP amount; 0 for badge/stamp
  idempotency_key   TEXT NOT NULL UNIQUE,
  source_route      TEXT,
  request_id        TEXT,
  device_id         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sa_guest ON smokecraft_awards(guest_reference);
CREATE INDEX IF NOT EXISTS idx_sa_type ON smokecraft_awards(award_type);
-- A given (guest, type, key) should only ever be earned once — e.g. the
-- "session-1-complete" badge can't be independently granted twice under
-- two different idempotency keys (a defense-in-depth constraint beyond
-- the idempotency-key uniqueness, which only protects against exact
-- request replay, not two logically-different requests for the same
-- logical award).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_sa_guest_type_key ON smokecraft_awards(guest_reference, award_type, award_key);

-- Structured, append-only audit trail for every award mutation attempt
-- (including rejected duplicates), reusing the same
-- gen_random_uuid()-keyed audit-id pattern already proven in
-- smokecraft_reward_audit. Never stores free-text guest notes/content —
-- only structured mutation metadata, per the mandate's observability
-- requirement.
CREATE TABLE IF NOT EXISTS smokecraft_award_audit (
  id                BIGSERIAL PRIMARY KEY,
  audit_id          UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  guest_reference   TEXT NOT NULL,
  mutation_type     TEXT NOT NULL, -- 'session_complete' | 'award_xp' | 'award_badge' | 'award_passport_stamp'
  idempotency_key   TEXT NOT NULL,
  outcome           TEXT NOT NULL CHECK (outcome IN ('applied', 'duplicate_replay', 'rejected')),
  reject_reason     TEXT,
  request_id        TEXT,
  device_id         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saa_guest ON smokecraft_award_audit(guest_reference);
CREATE INDEX IF NOT EXISTS idx_saa_created ON smokecraft_award_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saa_idempotency ON smokecraft_award_audit(idempotency_key);
