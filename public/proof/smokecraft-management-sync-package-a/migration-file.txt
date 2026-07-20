-- Migration 074: SmokeCraft Management Sync — Database Foundation (Package A)
-- Safe: CREATE TABLE IF NOT EXISTS only. No DROP. No destructive ALTER.
-- No existing table is modified. venue_id references the confirmed
-- authoritative venues(venue_id) (see docs/SMOKECRAFT_MANAGEMENT_SYNC_VENUE_MODEL_AUDIT.md).
-- user_id/actor_user_id are intentionally NOT foreign keys — the
-- System 1 (system_users) vs. System 2 (novee_os_platform_users) user
-- table question is deferred; see docs/SMOKECRAFT_MANAGEMENT_SYNC_ROLE_MODEL_AUDIT.md.
-- Guest identity is a soft TEXT reference — Package B implements issuing
-- and verification (docs/SMOKECRAFT_MANAGEMENT_SYNC_GUEST_IDENTITY_DESIGN.md).
-- venue_insights aggregate table is intentionally NOT included — deferred
-- per the on-demand-vs-materialized tradeoff decision (see
-- docs/SMOKECRAFT_MANAGEMENT_SYNC_DATABASE_SCHEMA.md).

-- 1. SmokeCraft journeys — authoritative completed-journey identity
CREATE TABLE IF NOT EXISTS smokecraft_management_sync_journeys (
  journey_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        TEXT NOT NULL,
  venue_id         TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE RESTRICT,
  user_id          TEXT,
  guest_reference  TEXT NOT NULL,
  session_number   SMALLINT NOT NULL
                     CONSTRAINT chk_sms_journeys_session_number CHECK (session_number BETWEEN 1 AND 27),
  phase            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'in_progress'
                     CONSTRAINT chk_sms_journeys_status CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  source_version   TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_journeys_venue_status ON smokecraft_management_sync_journeys(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_journeys_user          ON smokecraft_management_sync_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_journeys_guest_ref      ON smokecraft_management_sync_journeys(guest_reference);

-- 2. SmokeCraft journey snapshots — versioned, append-only content payload
CREATE TABLE IF NOT EXISTS smokecraft_management_sync_snapshots (
  snapshot_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id               UUID NOT NULL REFERENCES smokecraft_management_sync_journeys(journey_id) ON DELETE CASCADE,
  snapshot_version          INTEGER NOT NULL DEFAULT 1,
  cigar_selection           JSONB,
  pairing_selection         JSONB,
  flavor_notes               JSONB,
  mentor_selections         JSONB,
  scorecard                 JSONB,
  rating                    SMALLINT
                              CONSTRAINT chk_sms_snapshots_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  preferences                JSONB,
  feedback_text              TEXT,
  return_intent              TEXT
                              CONSTRAINT chk_sms_snapshots_return_intent CHECK (return_intent IS NULL OR return_intent IN ('yes', 'no', 'maybe')),
  connections_saved          SMALLINT NOT NULL DEFAULT 0,
  completion_state           TEXT NOT NULL,
  passport_state             JSONB,
  staff_handoff_requested    BOOLEAN NOT NULL DEFAULT FALSE,
  payload_hash                TEXT NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_sms_snapshots_journey_version UNIQUE (journey_id, snapshot_version),
  CONSTRAINT uq_sms_snapshots_journey_hash UNIQUE (journey_id, payload_hash)
);

CREATE INDEX IF NOT EXISTS idx_sms_snapshots_journey_version ON smokecraft_management_sync_snapshots(journey_id, snapshot_version);

-- 3. Management Sync events — explicit sync requests/results, idempotent
CREATE TABLE IF NOT EXISTS smokecraft_management_sync_events (
  event_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id        UUID NOT NULL REFERENCES smokecraft_management_sync_journeys(journey_id) ON DELETE CASCADE,
  snapshot_id       UUID NOT NULL REFERENCES smokecraft_management_sync_snapshots(snapshot_id) ON DELETE RESTRICT,
  venue_id          TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE RESTRICT,
  guest_reference   TEXT NOT NULL,
  destination       TEXT NOT NULL
                      CONSTRAINT chk_sms_events_destination CHECK (destination IN ('venue_insights', 'eat_360', 'pos_360', 'novee_os', 'inventory', 'staff_handoff')),
  status            TEXT NOT NULL DEFAULT 'pending'
                      CONSTRAINT chk_sms_events_status CHECK (status IN ('pending', 'completed', 'failed')),
  idempotency_key    TEXT NOT NULL,
  payload_version    INTEGER NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at         TIMESTAMPTZ,
  completed_at       TIMESTAMPTZ,
  error_code         TEXT,
  error_message      TEXT,
  retry_count        SMALLINT NOT NULL DEFAULT 0,
  audit_metadata     JSONB,
  CONSTRAINT uq_sms_events_idempotency UNIQUE (venue_id, journey_id, destination, payload_version)
);

CREATE INDEX IF NOT EXISTS idx_sms_events_journey     ON smokecraft_management_sync_events(journey_id);
CREATE INDEX IF NOT EXISTS idx_sms_events_venue_status ON smokecraft_management_sync_events(venue_id, status);

-- 4. Management actions — only real, supported action types
CREATE TABLE IF NOT EXISTS smokecraft_management_sync_actions (
  action_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE RESTRICT,
  journey_id      UUID REFERENCES smokecraft_management_sync_journeys(journey_id) ON DELETE SET NULL,
  sync_event_id   UUID REFERENCES smokecraft_management_sync_events(event_id) ON DELETE SET NULL,
  actor_user_id   TEXT NOT NULL,
  action_type     TEXT NOT NULL
                    CONSTRAINT chk_sms_actions_type CHECK (action_type IN ('analytics_viewed', 'staff_feedback_submitted', 'inventory_handoff_requested', 'sync_requested', 'sync_completed', 'sync_failed')),
  action_status   TEXT NOT NULL DEFAULT 'completed'
                    CONSTRAINT chk_sms_actions_status CHECK (action_status IN ('completed', 'failed')),
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_actions_venue   ON smokecraft_management_sync_actions(venue_id);
CREATE INDEX IF NOT EXISTS idx_sms_actions_journey ON smokecraft_management_sync_actions(journey_id);
