-- POS360 Offline Mode, Sync Engine & Conflict Handling (Phase B.6)
-- Migration: 036_pos360_offline_sync.sql
-- CREATE TABLE IF NOT EXISTS only. No DROP TABLE, no DROP COLUMN, no data destruction.

-- ── Sync batches ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_batches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           TEXT NOT NULL,
  venue_id            TEXT NOT NULL,
  location_id         TEXT,
  device_id           TEXT NOT NULL,
  staff_user_id       TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
  priority            TEXT NOT NULL DEFAULT 'order',
  action_count        INTEGER NOT NULL DEFAULT 0,
  success_count       INTEGER NOT NULL DEFAULT 0,
  failed_count        INTEGER NOT NULL DEFAULT 0,
  conflict_count      INTEGER NOT NULL DEFAULT 0,
  dead_letter_count   INTEGER NOT NULL DEFAULT 0,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  paused_at           TIMESTAMPTZ,
  retry_count         INTEGER NOT NULL DEFAULT 0,
  max_retries         INTEGER NOT NULL DEFAULT 5,
  rollback_triggered  BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_at         TIMESTAMPTZ,
  notes               TEXT,
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB,
  audit_context       JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_sync_batches_venue   ON pos360_sync_batches(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_batches_device  ON pos360_sync_batches(device_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_batches_status  ON pos360_sync_batches(status);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_batches_created ON pos360_sync_batches(created_at DESC);

-- ── Sync actions (offline queue entries) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_actions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  device_id             TEXT NOT NULL,
  staff_user_id         TEXT,
  sync_batch_id         UUID,
  idempotency_key       TEXT NOT NULL,
  action_hash           TEXT NOT NULL,
  action_type           TEXT NOT NULL,
  entity_type           TEXT NOT NULL,
  entity_id             TEXT,
  order_id              UUID,
  table_id              UUID,
  action_payload        JSONB NOT NULL,
  priority              TEXT NOT NULL DEFAULT 'order',
  sync_status           TEXT NOT NULL DEFAULT 'queued',
  conflict_status       TEXT,
  replay_attempt_count  INTEGER NOT NULL DEFAULT 0,
  max_replay_attempts   INTEGER NOT NULL DEFAULT 5,
  device_created_at     TIMESTAMPTZ NOT NULL,
  server_received_at    TIMESTAMPTZ,
  replayed_at           TIMESTAMPTZ,
  failed_at             TIMESTAMPTZ,
  dead_lettered_at      TIMESTAMPTZ,
  failure_reason        TEXT,
  is_high_risk          BOOLEAN NOT NULL DEFAULT FALSE,
  requires_manager_review BOOLEAN NOT NULL DEFAULT FALSE,
  clock_drift_ms        INTEGER,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB,
  audit_context         JSONB,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (idempotency_key, venue_id)
);

CREATE INDEX IF NOT EXISTS idx_pos360_sync_actions_venue       ON pos360_sync_actions(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_actions_device      ON pos360_sync_actions(device_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_actions_status      ON pos360_sync_actions(sync_status);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_actions_priority    ON pos360_sync_actions(priority);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_actions_batch       ON pos360_sync_actions(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_actions_idem        ON pos360_sync_actions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_actions_order       ON pos360_sync_actions(order_id);

-- ── Sync conflicts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_conflicts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  sync_action_id        UUID,
  sync_batch_id         UUID,
  order_id              UUID,
  table_id              UUID,
  entity_type           TEXT NOT NULL,
  entity_id             TEXT,
  conflict_type         TEXT NOT NULL,
  conflict_status       TEXT NOT NULL DEFAULT 'detected',
  resolution_policy     TEXT,
  server_value          JSONB,
  device_value          JSONB,
  resolved_value        JSONB,
  resolved_by           TEXT,
  resolved_at           TIMESTAMPTZ,
  is_high_risk          BOOLEAN NOT NULL DEFAULT FALSE,
  requires_manager_review BOOLEAN NOT NULL DEFAULT FALSE,
  manager_review_id     UUID,
  notes                 TEXT,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB,
  audit_context         JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_conflicts_venue   ON pos360_sync_conflicts(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_conflicts_status  ON pos360_sync_conflicts(conflict_status);
CREATE INDEX IF NOT EXISTS idx_pos360_conflicts_entity  ON pos360_sync_conflicts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pos360_conflicts_action  ON pos360_sync_conflicts(sync_action_id);

-- ── Conflict resolution log ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_conflict_resolutions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL,
  venue_id          TEXT NOT NULL,
  conflict_id       UUID NOT NULL,
  resolution_policy TEXT NOT NULL,
  resolved_by       TEXT,
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_conflict_resolutions ON pos360_sync_conflict_resolutions(conflict_id);

-- ── Dead-letter queue ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_dead_letters (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  sync_action_id        UUID,
  sync_batch_id         UUID,
  idempotency_key       TEXT,
  action_type           TEXT NOT NULL,
  entity_type           TEXT NOT NULL,
  entity_id             TEXT,
  action_payload        JSONB,
  failure_reason        TEXT,
  replay_attempt_count  INTEGER NOT NULL DEFAULT 0,
  escalated             BOOLEAN NOT NULL DEFAULT FALSE,
  escalated_at          TIMESTAMPTZ,
  archived              BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pos360_dead_letters_venue  ON pos360_sync_dead_letters(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_dead_letters_device ON pos360_sync_dead_letters(device_id);

-- ── Device sync health ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_device_health (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  device_id             TEXT NOT NULL,
  device_type           TEXT,
  device_name           TEXT,
  app_version           TEXT,
  network_status        TEXT NOT NULL DEFAULT 'unknown',
  connection_type       TEXT,
  battery_level         INTEGER,
  is_charging           BOOLEAN,
  last_online_at        TIMESTAMPTZ,
  last_offline_at       TIMESTAMPTZ,
  last_sync_at          TIMESTAMPTZ,
  pending_queue_count   INTEGER NOT NULL DEFAULT 0,
  failed_queue_count    INTEGER NOT NULL DEFAULT 0,
  dead_letter_count     INTEGER NOT NULL DEFAULT 0,
  conflict_count        INTEGER NOT NULL DEFAULT 0,
  sync_health_score     NUMERIC(5,2),
  clock_drift_ms        INTEGER,
  clock_drift_detected  BOOLEAN NOT NULL DEFAULT FALSE,
  error_state           TEXT,
  is_local_fallback     BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_device_health_venue  ON pos360_sync_device_health(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_device_health_device ON pos360_sync_device_health(device_id);
CREATE INDEX IF NOT EXISTS idx_pos360_device_health_time   ON pos360_sync_device_health(recorded_at DESC);

-- ── Replay logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_replay_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  device_id             TEXT,
  sync_action_id        UUID NOT NULL,
  sync_batch_id         UUID,
  attempt_number        INTEGER NOT NULL DEFAULT 1,
  status                TEXT NOT NULL DEFAULT 'attempted',
  response_code         INTEGER,
  response_body         JSONB,
  failure_reason        TEXT,
  replay_duration_ms    INTEGER,
  actor_id              TEXT,
  actor_role            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_replay_logs_action ON pos360_sync_replay_logs(sync_action_id);
CREATE INDEX IF NOT EXISTS idx_pos360_replay_logs_batch  ON pos360_sync_replay_logs(sync_batch_id);

-- ── Retry policies ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_retry_policies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL,
  venue_id          TEXT NOT NULL,
  action_type       TEXT NOT NULL,
  priority          TEXT NOT NULL DEFAULT 'order',
  max_retries       INTEGER NOT NULL DEFAULT 5,
  backoff_strategy  TEXT NOT NULL DEFAULT 'exponential',
  initial_delay_ms  INTEGER NOT NULL DEFAULT 2000,
  max_delay_ms      INTEGER NOT NULL DEFAULT 60000,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB,
  UNIQUE (tenant_id, venue_id, action_type)
);

CREATE INDEX IF NOT EXISTS idx_pos360_retry_policies_venue ON pos360_sync_retry_policies(venue_id);

-- ── Conflict policy registry ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_policy_registry (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL,
  venue_id          TEXT NOT NULL,
  conflict_type     TEXT NOT NULL,
  entity_type       TEXT,
  resolution_policy TEXT NOT NULL DEFAULT 'server_wins',
  is_high_risk      BOOLEAN NOT NULL DEFAULT FALSE,
  manager_required  BOOLEAN NOT NULL DEFAULT FALSE,
  notes             TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB,
  UNIQUE (tenant_id, venue_id, conflict_type)
);

CREATE INDEX IF NOT EXISTS idx_pos360_policy_registry_venue ON pos360_sync_policy_registry(venue_id);

-- ── Manager review queue ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_manager_review_queue (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  sync_action_id        UUID,
  sync_batch_id         UUID,
  conflict_id           UUID,
  dead_letter_id        UUID,
  review_type           TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending',
  priority              TEXT NOT NULL DEFAULT 'order',
  reason                TEXT,
  reviewed_by           TEXT,
  reviewed_at           TIMESTAMPTZ,
  decision              TEXT,
  decision_notes        TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  entity_type           TEXT,
  entity_id             TEXT,
  action_payload        JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_mgr_review_venue  ON pos360_sync_manager_review_queue(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_mgr_review_status ON pos360_sync_manager_review_queue(status);

-- ── E.A.T. sync alerts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_eat_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT NOT NULL,
  venue_id          TEXT NOT NULL,
  location_id       TEXT,
  device_id         TEXT,
  alert_type        TEXT NOT NULL,
  alert_level       TEXT NOT NULL DEFAULT 'warning',
  title             TEXT NOT NULL,
  body              TEXT,
  entity_type       TEXT,
  entity_id         TEXT,
  sync_action_id    UUID,
  sync_batch_id     UUID,
  conflict_id       UUID,
  acknowledged      BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by   TEXT,
  acknowledged_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_eat_alerts_venue  ON pos360_sync_eat_alerts(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_eat_alerts_type   ON pos360_sync_eat_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_pos360_eat_alerts_ack    ON pos360_sync_eat_alerts(acknowledged);

-- ── Sync audit ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_sync_audit (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             TEXT NOT NULL,
  venue_id              TEXT NOT NULL,
  location_id           TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  sync_batch_id         UUID,
  sync_action_id        UUID,
  entity_type           TEXT NOT NULL,
  entity_id             TEXT,
  action                TEXT NOT NULL,
  actor_id              TEXT,
  actor_role            TEXT,
  previous_value        JSONB,
  new_value             JSONB,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB
);

CREATE INDEX IF NOT EXISTS idx_pos360_sync_audit_venue  ON pos360_sync_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_audit_device ON pos360_sync_audit(device_id);
CREATE INDEX IF NOT EXISTS idx_pos360_sync_audit_batch  ON pos360_sync_audit(sync_batch_id);
