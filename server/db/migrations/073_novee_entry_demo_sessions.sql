-- Migration 073: NOVEE Entry Demo Sessions
-- Adds a dedicated table for guest-initiated demo sessions from the lounge entry.
-- Separate from demo_sessions (which is for founder/manager presenter demos).
-- Safe to run multiple times (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS novee_entry_demo_sessions (
  id          SERIAL       PRIMARY KEY,
  session_id  TEXT         NOT NULL UNIQUE,
  user_id     TEXT         NOT NULL DEFAULT 'guest',
  tenant_id   TEXT,
  mode        TEXT         NOT NULL DEFAULT 'demo',
  status      TEXT         NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','ended','expired')),
  expires_at  TIMESTAMPTZ  NOT NULL,
  ended_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  metadata    JSONB        NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_novee_entry_demo_sessions_session_id
  ON novee_entry_demo_sessions (session_id);

CREATE INDEX IF NOT EXISTS idx_novee_entry_demo_sessions_expires_at
  ON novee_entry_demo_sessions (expires_at);

CREATE INDEX IF NOT EXISTS idx_novee_entry_demo_sessions_status
  ON novee_entry_demo_sessions (status);

-- Rollback note:
--   DROP TABLE IF EXISTS novee_entry_demo_sessions;
