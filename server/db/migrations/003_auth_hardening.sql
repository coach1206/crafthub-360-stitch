-- ============================================================
-- Migration 003 — Auth Hardening
-- Applied: Phase 8.5
-- Adds: auth_credentials, auth_sessions, pin_login_attempts,
--       founder_access_events
-- Does NOT modify Phase 7 or Phase 8 tables.
-- ============================================================

BEGIN;

-- ── auth_credentials ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_credentials (
  id                    BIGSERIAL PRIMARY KEY,
  user_id               TEXT        NOT NULL UNIQUE,
  credential_type       TEXT        NOT NULL DEFAULT 'pin'
                          CHECK (credential_type IN ('pin','email_pin','founder_challenge')),
  credential_hash       TEXT,
  pin_hash              TEXT,
  founder_secret_hash   TEXT,
  mfa_enabled           BOOLEAN     NOT NULL DEFAULT FALSE,
  failed_attempts       INTEGER     NOT NULL DEFAULT 0,
  locked_until          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── auth_sessions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_sessions (
  id                BIGSERIAL PRIMARY KEY,
  session_token_id  TEXT        NOT NULL UNIQUE,
  user_id           TEXT        NOT NULL,
  role              TEXT        NOT NULL,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked           BOOLEAN     NOT NULL DEFAULT FALSE,
  revoked_at        TIMESTAMPTZ,
  ip_address        TEXT,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── pin_login_attempts ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pin_login_attempts (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT,
  email           TEXT,
  role_attempted  TEXT,
  success         BOOLEAN     NOT NULL DEFAULT FALSE,
  failure_reason  TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── founder_access_events ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS founder_access_events (
  id               BIGSERIAL PRIMARY KEY,
  founder_user_id  TEXT        NOT NULL,
  event_type       TEXT        NOT NULL,
  metadata         JSONB,
  ip_address       TEXT,
  user_agent       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id         ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_id        ON auth_sessions(session_token_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at      ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_pin_attempts_user_id          ON pin_login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_pin_attempts_created_at       ON pin_login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_events_user_id        ON founder_access_events(founder_user_id);
CREATE INDEX IF NOT EXISTS idx_founder_events_created_at     ON founder_access_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_credentials_user_id      ON auth_credentials(user_id);

COMMIT;
