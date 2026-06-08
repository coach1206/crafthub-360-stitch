-- ============================================================
-- Migration 005 — POS 3 Operational Hardening
-- Applied: Phase 9.5
-- Does NOT modify Phase 7, 8, 8.5, or 9 tables.
-- ============================================================

BEGIN;

-- ── pos3_sync_runs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos3_sync_runs (
  id               BIGSERIAL PRIMARY KEY,
  provider_key     TEXT        NOT NULL,
  sync_type        TEXT        NOT NULL DEFAULT 'auto'
                     CHECK (sync_type IN ('auto','manual','startup','triggered')),
  status           TEXT        NOT NULL DEFAULT 'started'
                     CHECK (status IN ('started','success','failed','partial')),
  orders_count     INTEGER,
  inventory_count  INTEGER,
  tables_count     INTEGER,
  staff_count      INTEGER,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at      TIMESTAMPTZ,
  duration_ms      INTEGER,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos3_sync_runs_key    ON pos3_sync_runs(provider_key);
CREATE INDEX IF NOT EXISTS idx_pos3_sync_runs_status ON pos3_sync_runs(status);
CREATE INDEX IF NOT EXISTS idx_pos3_sync_runs_started ON pos3_sync_runs(started_at DESC);

COMMIT;
