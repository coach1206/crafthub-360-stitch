-- ============================================================
-- Migration 013 — Backend Reconciliation & Replay Confirmation (Phase 6F)
-- Adds reconciliation/conflict/replay truth fields to sync_events,
-- plus sync_conflict_decisions and sync_reconciliation_notes tables.
-- Does NOT alter sync_events' existing columns, sync_failures, or any
-- materialized projection table from migration 012.
-- ============================================================

BEGIN;

ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS business_action_fingerprint TEXT;
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS replay_status TEXT
  NOT NULL DEFAULT 'not_replayed'
  CHECK (replay_status IN ('not_replayed','replayed_confirmed','replay_blocked','replay_rejected','manual_review_required'));
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS replay_attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS replay_last_attempt_at TIMESTAMPTZ;
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS replay_confirmed_at TIMESTAMPTZ;
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS conflict_type TEXT NOT NULL DEFAULT 'none';
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS conflict_decision TEXT;
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS reconciliation_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS reconciliation_note TEXT;
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS reconciliation_resolved_at TIMESTAMPTZ;
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS reconciliation_resolved_by TEXT;
ALTER TABLE sync_events ADD COLUMN IF NOT EXISTS backend_confirmation_id TEXT;

CREATE INDEX IF NOT EXISTS idx_sync_events_fingerprint ON sync_events(business_action_fingerprint);
CREATE INDEX IF NOT EXISTS idx_sync_events_conflict     ON sync_events(conflict_type);
CREATE INDEX IF NOT EXISTS idx_sync_events_reconcile    ON sync_events(reconciliation_status);

-- ── sync_conflict_decisions — append-only staff/server decision log ─────────
CREATE TABLE IF NOT EXISTS sync_conflict_decisions (
  decision_id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                     UUID        NOT NULL REFERENCES sync_events(event_id),
  event_type                   TEXT        NOT NULL,
  business_action_fingerprint  TEXT,
  conflict_type                TEXT        NOT NULL,
  decision                     TEXT        NOT NULL,
  reason                       TEXT,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by                   TEXT,
  source                       TEXT        NOT NULL DEFAULT 'server',
  requires_manual_review       BOOLEAN     NOT NULL DEFAULT FALSE,
  safe_to_auto_resolve         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sync_conflict_decisions_event ON sync_conflict_decisions(event_id);

-- ── sync_reconciliation_notes — append-only staff notes ─────────────────────
CREATE TABLE IF NOT EXISTS sync_reconciliation_notes (
  note_id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID        NOT NULL REFERENCES sync_events(event_id),
  note       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  source     TEXT        NOT NULL DEFAULT 'staff'
);

CREATE INDEX IF NOT EXISTS idx_sync_reconciliation_notes_event ON sync_reconciliation_notes(event_id);

COMMIT;
