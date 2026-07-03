-- Migration 026: Staff Order Management and Table/Patio Layout Engine
-- Preview-only. Does not claim live POS sync, payment capture, KDS notification,
-- inventory reservation, or persisted floor layouts.

CREATE TABLE IF NOT EXISTS venue_floor_sections (
  section_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id       UUID NOT NULL,
  section_name   TEXT NOT NULL,
  section_type   TEXT NOT NULL DEFAULT 'lounge',
  section_status TEXT NOT NULL DEFAULT 'section_layout_preview',
  capacity       INTEGER,
  metadata       JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS venue_tables (
  table_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id       UUID NOT NULL,
  section_id     UUID,
  table_name     TEXT NOT NULL,
  table_type     TEXT NOT NULL DEFAULT 'standard',
  seat_count     INTEGER NOT NULL DEFAULT 2,
  table_status   TEXT NOT NULL DEFAULT 'table_assignment_pending',
  server_id      UUID,
  metadata       JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS venue_table_layout_positions (
  layout_position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id           UUID NOT NULL,
  section_id         UUID,
  table_id           UUID NOT NULL,
  x_position         NUMERIC NOT NULL DEFAULT 0,
  y_position         NUMERIC NOT NULL DEFAULT 0,
  width              NUMERIC NOT NULL DEFAULT 100,
  height             NUMERIC NOT NULL DEFAULT 80,
  rotation           NUMERIC NOT NULL DEFAULT 0,
  layout_status      TEXT NOT NULL DEFAULT 'floor_layout_preview',
  device_mode        TEXT NOT NULL DEFAULT 'tablet',
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_order_sessions (
  staff_order_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id               UUID NOT NULL,
  staff_id               UUID,
  table_id               UUID,
  section_id             UUID,
  customer_id            UUID,
  checkout_cart_id       UUID,
  order_id               UUID,
  session_status         TEXT NOT NULL DEFAULT 'staff_order_preview',
  order_mode             TEXT NOT NULL DEFAULT 'staff_entered',
  payment_status         TEXT NOT NULL DEFAULT 'payment_confirmation_required',
  tax_status             TEXT NOT NULL DEFAULT 'tax_preview_required',
  pos_status             TEXT NOT NULL DEFAULT 'pos_sync_pending',
  kds_status             TEXT NOT NULL DEFAULT 'kds_routing_pending',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_order_assignments (
  assignment_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id               UUID NOT NULL,
  staff_order_session_id UUID NOT NULL,
  staff_id               UUID,
  table_id               UUID,
  section_id             UUID,
  assignment_status      TEXT NOT NULL DEFAULT 'staff_assignment_pending',
  role_scope             TEXT NOT NULL DEFAULT 'server',
  metadata               JSONB NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_order_actions (
  action_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id               UUID NOT NULL,
  staff_order_session_id UUID,
  order_id               UUID,
  staff_id               UUID,
  action_type            TEXT NOT NULL DEFAULT 'create_order',
  action_status          TEXT NOT NULL DEFAULT 'staff_order_preview',
  requires_manager_approval BOOLEAN NOT NULL DEFAULT FALSE,
  metadata               JSONB NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manager_approval_requests (
  approval_request_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id                UUID NOT NULL,
  staff_order_session_id  UUID,
  order_id                UUID,
  requested_by_staff_id   UUID,
  approved_by_manager_id  UUID,
  approval_type           TEXT NOT NULL,
  approval_status         TEXT NOT NULL DEFAULT 'manager_approval_required',
  reason                  TEXT,
  metadata                JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manual_pos360_handoff_logs (
  handoff_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id               UUID NOT NULL,
  staff_order_session_id UUID,
  order_id               UUID,
  staff_id               UUID,
  handoff_status         TEXT NOT NULL DEFAULT 'manual_pos360_handoff',
  pos_status             TEXT NOT NULL DEFAULT 'pos_sync_pending',
  handoff_snapshot       JSONB NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS table_status_events (
  event_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id     UUID NOT NULL,
  table_id     UUID NOT NULL,
  from_status  TEXT,
  to_status    TEXT NOT NULL,
  event_status TEXT NOT NULL DEFAULT 'status_preview',
  actor_id     UUID,
  actor_role   TEXT NOT NULL DEFAULT 'staff',
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_order_audit_logs (
  log_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID,
  actor_role   TEXT NOT NULL DEFAULT 'staff',
  venue_id     UUID,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  action       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'audit_logged',
  details      JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
