-- Production Package 5 — Monitoring, Backups, Recovery, and Support
-- Adds: support case model, corrective-action audit trail, and
-- backup/restore run history. Append-only where it matters (audit rows are
-- never updated/deleted by application code).

CREATE TABLE IF NOT EXISTS support_cases (
  id                  SERIAL PRIMARY KEY,
  case_number         TEXT UNIQUE NOT NULL,
  customer_identifier TEXT,             -- email or player/session id (fake data only in proof docs)
  venue_id            TEXT,
  category            TEXT NOT NULL,    -- login | session | xp | passport | reward | payment | receipt | order | product | refund | media | venue_mismatch | golden_box | other
  severity            TEXT NOT NULL DEFAULT 'sev4',
  status              TEXT NOT NULL DEFAULT 'open', -- open | investigating | pending_customer | resolved | closed
  assigned_owner      TEXT,
  related_order_id    TEXT,
  related_payment_id  TEXT,
  related_session_id  TEXT,
  description         TEXT NOT NULL,
  resolution_code     TEXT,
  resolution_notes    TEXT,
  opened_by           TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_cases_status ON support_cases(status);
CREATE INDEX IF NOT EXISTS idx_support_cases_venue ON support_cases(venue_id);

-- Every corrective action taken by support staff against player/order/
-- inventory/payment state must be logged here BEFORE it is applied.
-- Application code enforces: preview -> authorize -> apply -> log, never
-- a silent write. reversed_by/reversed_at let a corrective action be
-- rolled back without deleting the original audit row.
CREATE TABLE IF NOT EXISTS support_case_actions (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER NOT NULL REFERENCES support_cases(id),
  actor_id        TEXT NOT NULL,
  actor_role      TEXT NOT NULL,
  action_type     TEXT NOT NULL,   -- note | lookup | corrective_action | resolution | escalation
  target_entity   TEXT,            -- e.g. 'order', 'xp_ledger', 'inventory_events'
  target_id       TEXT,
  before_state    JSONB,
  after_state     JSONB,
  reason          TEXT,
  reversible      BOOLEAN NOT NULL DEFAULT true,
  reversed_by     TEXT,
  reversed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_case_actions_case ON support_case_actions(case_id);

-- Local backup run history — populated by scripts/backup-smokecraft-database.mjs
-- and scripts/verify-smokecraft-backup-restore.mjs. Never stores secrets or
-- full connection strings, only artifact metadata and outcome.
CREATE TABLE IF NOT EXISTS backup_run_log (
  id                SERIAL PRIMARY KEY,
  run_type          TEXT NOT NULL,   -- backup | restore_test
  status            TEXT NOT NULL,   -- success | failure
  artifact_path     TEXT,
  artifact_bytes    BIGINT,
  artifact_sha256   TEXT,
  migration_version TEXT,
  detail            JSONB,
  started_at        TIMESTAMPTZ NOT NULL,
  finished_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
