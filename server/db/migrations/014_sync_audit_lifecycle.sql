-- ============================================================
-- Migration 014 — Sync Audit Logs & Event Lifecycle Timeline (Phase 6G)
-- Adds venue-grade audit/accountability tables. Does NOT alter sync_events,
-- sync_failures, sync_conflict_decisions, or sync_reconciliation_notes from
-- migrations 012/013 — purely additive append-only logs referencing them.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS sync_audit_logs (
  audit_id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                     UUID,
  business_action_fingerprint  TEXT,
  actor_user_id                TEXT,
  actor_staff_id               TEXT,
  actor_role                   TEXT,
  actor_display_name           TEXT,
  actor_source                 TEXT        NOT NULL DEFAULT 'system',
  device_id                    TEXT,
  action_type                  TEXT        NOT NULL,
  action_category              TEXT        NOT NULL
                                  CHECK (action_category IN
                                    ('sync','replay','conflict','reconciliation','staff_action','eat_catchup','security','system')),
  entity_type                  TEXT,
  entity_id                    TEXT,
  previous_status               TEXT,
  new_status                    TEXT,
  decision_id                  UUID,
  reconciliation_note_id       UUID,
  replay_attempt_id            TEXT,
  reason                       TEXT,
  metadata                     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  ip_address                   TEXT,
  user_agent                   TEXT,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_audit_logs_event        ON sync_audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_logs_fingerprint  ON sync_audit_logs(business_action_fingerprint);
CREATE INDEX IF NOT EXISTS idx_sync_audit_logs_actor_staff  ON sync_audit_logs(actor_staff_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_logs_actor_user   ON sync_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_logs_action_type  ON sync_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_sync_audit_logs_category     ON sync_audit_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_sync_audit_logs_created      ON sync_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_audit_logs_entity       ON sync_audit_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS sync_event_lifecycle (
  lifecycle_id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                     UUID        NOT NULL,
  business_action_fingerprint  TEXT,
  event_type                   TEXT        NOT NULL,
  device_id                    TEXT,
  lifecycle_stage               TEXT        NOT NULL
                                  CHECK (lifecycle_stage IN (
                                    'received','queued','failed','conflict_detected','replay_previewed',
                                    'replay_attempted','replay_blocked','replay_confirmed','replay_rejected',
                                    'manual_review_required','reconciliation_note_added','reconciliation_resolved',
                                    'conflict_decision_recorded','eat_catchup_processed','confirmed_by_backend'
                                  )),
  stage_status                  TEXT        NOT NULL DEFAULT 'recorded',
  source                        TEXT        NOT NULL DEFAULT 'server',
  actor_user_id                 TEXT,
  actor_staff_id                 TEXT,
  actor_role                    TEXT,
  reason                        TEXT,
  metadata                      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_event_lifecycle_event        ON sync_event_lifecycle(event_id);
CREATE INDEX IF NOT EXISTS idx_sync_event_lifecycle_fingerprint  ON sync_event_lifecycle(business_action_fingerprint);
CREATE INDEX IF NOT EXISTS idx_sync_event_lifecycle_actor_staff  ON sync_event_lifecycle(actor_staff_id);
CREATE INDEX IF NOT EXISTS idx_sync_event_lifecycle_stage        ON sync_event_lifecycle(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_sync_event_lifecycle_created      ON sync_event_lifecycle(created_at DESC);

COMMIT;
