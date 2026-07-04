-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 033 — POS360 Handheld Device Suite (Phase B.3)
-- No DROP TABLE, no DROP COLUMN, no data destruction.
-- All tables: CREATE TABLE IF NOT EXISTS
-- Audit table: contains_secrets = FALSE, exposes_private_data = FALSE
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Device Registry ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_devices (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  device_name           TEXT        NOT NULL,
  device_type           TEXT        NOT NULL DEFAULT 'handheld',
    -- handheld | tablet | desktop | kiosk | manager_station
    -- kitchen_display | bar_display | humidor_display
  serial_number         TEXT,
  hardware_model        TEXT,
  os_version            TEXT,
  app_version           TEXT,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  is_online             BOOLEAN     NOT NULL DEFAULT FALSE,
  last_seen_at          TIMESTAMPTZ,
  last_sync_at          TIMESTAMPTZ,
  assigned_staff_id     TEXT,
  registration_token    TEXT,
  card_reader_id        TEXT,
  printer_id            TEXT,
  kds_station_id        TEXT,
  network_info          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  capabilities          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pos360_devices_venue
  ON pos360_devices (venue_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_pos360_devices_type
  ON pos360_devices (device_type, is_active);
CREATE INDEX IF NOT EXISTS idx_pos360_devices_staff
  ON pos360_devices (assigned_staff_id) WHERE assigned_staff_id IS NOT NULL;

-- ── Device Sessions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_device_sessions (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  device_id             TEXT        NOT NULL,
  staff_user_id         TEXT        NOT NULL,
  staff_role            TEXT,
  session_token         TEXT,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at              TIMESTAMPTZ,
  end_reason            TEXT,
  ip_address            TEXT,
  user_agent            TEXT,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_device_sessions_device
  ON pos360_device_sessions (device_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pos360_device_sessions_staff
  ON pos360_device_sessions (staff_user_id, venue_id);

-- ── Device Diagnostics ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_device_diagnostics (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  device_id             TEXT        NOT NULL,
  staff_user_id         TEXT,
  battery_level         INTEGER,
  is_charging           BOOLEAN,
  network_status        TEXT,
  connection_type       TEXT,
  signal_strength       INTEGER,
  card_reader_status    TEXT,
  printer_status        TEXT,
  kds_status            TEXT,
  scanner_status        TEXT,
  camera_permission     TEXT,
  app_version           TEXT,
  last_sync_at          TIMESTAMPTZ,
  offline_queue_count   INTEGER     NOT NULL DEFAULT 0,
  error_state           TEXT,
  diagnostics_payload   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_device_diagnostics_device
  ON pos360_device_diagnostics (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_device_diagnostics_venue
  ON pos360_device_diagnostics (venue_id, tenant_id, created_at DESC);

-- ── Device Sync Events ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_device_sync_events (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  device_id             TEXT        NOT NULL,
  staff_user_id         TEXT,
  sync_direction        TEXT        NOT NULL DEFAULT 'outbound',
    -- outbound | inbound | bidirectional
  sync_status           TEXT        NOT NULL DEFAULT 'started',
    -- started | completed | failed | partial
  records_sent          INTEGER     NOT NULL DEFAULT 0,
  records_received      INTEGER     NOT NULL DEFAULT 0,
  records_conflicted    INTEGER     NOT NULL DEFAULT 0,
  error_message         TEXT,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  duration_ms           INTEGER,
  sync_payload          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_device_sync_events_device
  ON pos360_device_sync_events (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_device_sync_events_venue
  ON pos360_device_sync_events (venue_id, sync_status, created_at DESC);

-- ── Handheld User Preferences ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_handheld_user_preferences (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  device_id             TEXT,
  staff_user_id         TEXT        NOT NULL,
  preferred_nav_layout  TEXT        NOT NULL DEFAULT 'bottom',
  preferred_menu_view   TEXT        NOT NULL DEFAULT 'categories',
  preferred_table_view  TEXT        NOT NULL DEFAULT 'grid',
  tile_order            JSONB       NOT NULL DEFAULT '[]'::jsonb,
  quick_actions         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  theme_overrides       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  notification_prefs    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos360_handheld_prefs_staff
  ON pos360_handheld_user_preferences (staff_user_id, venue_id)
  WHERE is_active = TRUE;

-- ── Handheld Notifications ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_handheld_notifications (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  notification_type     TEXT        NOT NULL DEFAULT 'info',
    -- info | warning | alert | urgent | manager_request | eat_recommendation
  title                 TEXT        NOT NULL,
  body                  TEXT,
  action_type           TEXT,
  action_payload        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_read               BOOLEAN     NOT NULL DEFAULT FALSE,
  read_at               TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_handheld_notifications_staff
  ON pos360_handheld_notifications (staff_user_id, venue_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_handheld_notifications_device
  ON pos360_handheld_notifications (device_id, is_read)
  WHERE device_id IS NOT NULL;

-- ── Handheld Offline Queue ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_handheld_offline_queue (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  device_id             TEXT        NOT NULL,
  staff_user_id         TEXT,
  action_type           TEXT        NOT NULL,
    -- order.create | order.update | order.item_add | table.status_change
    -- payment.start | guest.attach | sync.manual
  entity_type           TEXT,
  entity_id             TEXT,
  action_payload        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  queue_status          TEXT        NOT NULL DEFAULT 'pending',
    -- pending | replaying | replayed | failed | skipped
  replayed_at           TIMESTAMPTZ,
  replay_result         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  retry_count           INTEGER     NOT NULL DEFAULT 0,
  error_message         TEXT,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_handheld_offline_queue_device
  ON pos360_handheld_offline_queue (device_id, queue_status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_pos360_handheld_offline_queue_venue
  ON pos360_handheld_offline_queue (venue_id, queue_status);

-- ── Handheld Action Audit ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_handheld_action_audit (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  device_id             TEXT,
  staff_user_id         TEXT,
  action                TEXT        NOT NULL,
  entity_type           TEXT,
  entity_id             TEXT,
  actor_role            TEXT,
  previous_value        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  new_value             JSONB       NOT NULL DEFAULT '{}'::jsonb,
  contains_secrets      BOOLEAN     NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_handheld_action_audit_staff
  ON pos360_handheld_action_audit (staff_user_id, venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_handheld_action_audit_device
  ON pos360_handheld_action_audit (device_id, created_at DESC)
  WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pos360_handheld_action_audit_entity
  ON pos360_handheld_action_audit (entity_type, entity_id, created_at DESC);

-- ── Handheld Manager Approvals ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_handheld_manager_approvals (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  device_id             TEXT,
  requesting_staff_id   TEXT        NOT NULL,
  approving_manager_id  TEXT,
  action_type           TEXT        NOT NULL,
    -- discount | void | refund | override | table_transfer | manual_price
  entity_type           TEXT,
  entity_id             TEXT,
  action_payload        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  approval_status       TEXT        NOT NULL DEFAULT 'pending',
    -- pending | approved | denied | expired | cancelled
  approval_note         TEXT,
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at           TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_manager_approvals_venue
  ON pos360_handheld_manager_approvals (venue_id, approval_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_manager_approvals_staff
  ON pos360_handheld_manager_approvals (requesting_staff_id, approval_status);

-- ── Handheld Emergency Events ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos360_handheld_emergency_events (
  id                    TEXT        NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  tenant_id             TEXT        NOT NULL,
  venue_id              TEXT        NOT NULL,
  location_id           TEXT,
  device_id             TEXT,
  staff_user_id         TEXT        NOT NULL,
  emergency_type        TEXT        NOT NULL DEFAULT 'general',
    -- general | fire | medical | security | power_loss | network_loss
  emergency_status      TEXT        NOT NULL DEFAULT 'active',
    -- active | deactivated | acknowledged
  activated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at        TIMESTAMPTZ,
  deactivated_by        TEXT,
  notes                 TEXT,
  affected_systems      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  recovery_actions      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  audit_context         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos360_handheld_emergency_venue
  ON pos360_handheld_emergency_events (venue_id, emergency_status, created_at DESC);
