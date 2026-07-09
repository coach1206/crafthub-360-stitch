-- Migration 072: DayOne360 SmokeCraft Connections
-- Safe: CREATE TABLE IF NOT EXISTS only. No DROP, no TRUNCATE, no ALTER DROP.
-- DayOne360 is an internal workflow connection layer (www.dayone360.com reference only).
-- No live travel booking, relocation, or concierge fulfillment is claimed.

CREATE TABLE IF NOT EXISTS dayone360_smokecraft_connections (
  connection_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                TEXT NOT NULL,
  guest_id                TEXT,
  smokecraft_session_id   TEXT,
  tenant_id               TEXT,
  connection_type         TEXT NOT NULL DEFAULT 'smokecraft_session_link' CHECK (
    connection_type IN (
      'smokecraft_session_link',
      'guest_workflow_reference',
      'venue_integration_signal',
      'manager_referral'
    )
  ),
  connection_status       TEXT NOT NULL DEFAULT 'created' CHECK (
    connection_status IN ('created','acknowledged','pending_review','completed','cancelled')
  ),
  workflow_reference      TEXT,
  metadata                JSONB DEFAULT '{}',
  safe_claim              TEXT NOT NULL DEFAULT 'dayone360_smokecraft_connection_internal',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dayone360_guest_workflow_events (
  event_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id           UUID REFERENCES dayone360_smokecraft_connections(connection_id) ON DELETE SET NULL,
  venue_id                TEXT NOT NULL,
  guest_id                TEXT,
  smokecraft_session_id   TEXT,
  event_type              TEXT NOT NULL CHECK (
    event_type IN (
      'session_complete',
      'journey_milestone',
      'stamp_earned',
      'manager_alert',
      'handoff_signal',
      'workflow_reference_created'
    )
  ),
  event_payload           JSONB DEFAULT '{}',
  backend_connected       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dayone360_connection_audit_log (
  audit_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id           UUID REFERENCES dayone360_smokecraft_connections(connection_id) ON DELETE SET NULL,
  venue_id                TEXT,
  event_type              TEXT NOT NULL,
  sync_status             TEXT NOT NULL DEFAULT 'ok' CHECK (sync_status IN ('ok','fallback','failed','cancelled')),
  backend_connected       BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_d1_connections_venue ON dayone360_smokecraft_connections(venue_id);
CREATE INDEX IF NOT EXISTS idx_d1_connections_guest ON dayone360_smokecraft_connections(guest_id);
CREATE INDEX IF NOT EXISTS idx_d1_workflow_events_created ON dayone360_guest_workflow_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_d1_audit_log_created ON dayone360_connection_audit_log(created_at DESC);
