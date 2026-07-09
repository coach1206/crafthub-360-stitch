-- Migration: 039_pos360_reservations_guest_flow.sql
-- Phase B.9: Reservations, Waitlist, Table/Patio, Private Events & Guest Flow Intelligence
-- No DROP TABLE, no DROP COLUMN, no data destruction.
-- Uses CREATE TABLE IF NOT EXISTS throughout.

-- ── Compatibility: add missing 'active' column to tables created by migration 031 ──────
-- Migration 031 created pos360_floor_sections and pos360_tables with column 'is_active'.
-- This migration expects 'active'. These ALTER TABLE statements are safe no-ops on fresh
-- installs (table does not exist yet) and safe additive operations on existing databases.
ALTER TABLE IF EXISTS pos360_floor_sections ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE IF EXISTS pos360_tables         ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- ── Reservations ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_reservations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  location_id               UUID,
  reservation_code          TEXT NOT NULL,
  customer_id               UUID,
  guest_profile_id          UUID,
  guest_name                TEXT NOT NULL,
  guest_phone               TEXT,
  guest_email               TEXT,
  party_size                INTEGER NOT NULL DEFAULT 1,
  reservation_date          DATE NOT NULL,
  reservation_time          TIME NOT NULL,
  duration_minutes          INTEGER NOT NULL DEFAULT 90,
  preferred_section_id      UUID,
  assigned_table_id         UUID,
  occasion                  TEXT,
  source                    TEXT NOT NULL DEFAULT 'staff'
    CHECK (source IN ('staff','host','manager','guest_web','kiosk','phone','api','imported','offline')),
  status                    TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','seated','completed','cancelled','no_show','expired')),
  notes                     TEXT,
  internal_notes            TEXT,
  consent_snapshot          JSONB NOT NULL DEFAULT '{}',
  loyalty_snapshot          JSONB NOT NULL DEFAULT '{}',
  smokecraft_snapshot       JSONB NOT NULL DEFAULT '{}',
  eat_snapshot              JSONB NOT NULL DEFAULT '{}',
  idempotency_key           TEXT NOT NULL,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key, venue_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_reservations_venue_date ON pos360_reservations (venue_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_pos360_reservations_customer ON pos360_reservations (customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pos360_reservations_status ON pos360_reservations (venue_id, status);
CREATE INDEX IF NOT EXISTS idx_pos360_reservations_code ON pos360_reservations (reservation_code, venue_id);

-- ── Reservation Guests (additional party members) ─────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_reservation_guests (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  reservation_id            UUID NOT NULL REFERENCES pos360_reservations(id) ON DELETE CASCADE,
  customer_id               UUID,
  guest_name                TEXT,
  guest_phone               TEXT,
  role                      TEXT NOT NULL DEFAULT 'guest',
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_res_guests_reservation ON pos360_reservation_guests (reservation_id);

-- ── Reservation Status History ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_reservation_status_history (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  reservation_id            UUID NOT NULL REFERENCES pos360_reservations(id) ON DELETE CASCADE,
  from_status               TEXT,
  to_status                 TEXT NOT NULL,
  reason                    TEXT,
  actor_user_id             UUID NOT NULL,
  manager_override          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_res_status_hist ON pos360_reservation_status_history (reservation_id, created_at DESC);

-- ── Waitlist Entries ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_waitlist_entries (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID,
  guest_profile_id          UUID,
  guest_name                TEXT NOT NULL,
  guest_phone               TEXT,
  party_size                INTEGER NOT NULL DEFAULT 1,
  quoted_wait_minutes       INTEGER,
  actual_wait_minutes       INTEGER,
  preferred_section_id      UUID,
  status                    TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting','notified','seated','cancelled','no_show','expired')),
  priority_level            INTEGER NOT NULL DEFAULT 0,
  priority_reason           TEXT,
  manager_override_required BOOLEAN NOT NULL DEFAULT FALSE,
  manager_approved_by       UUID,
  manager_approved_at       TIMESTAMPTZ,
  source                    TEXT NOT NULL DEFAULT 'staff',
  notes                     TEXT,
  idempotency_key           TEXT NOT NULL,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key, venue_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_waitlist_venue_status ON pos360_waitlist_entries (venue_id, status);
CREATE INDEX IF NOT EXISTS idx_pos360_waitlist_customer ON pos360_waitlist_entries (customer_id) WHERE customer_id IS NOT NULL;

-- ── Waitlist Status History ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_waitlist_status_history (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  waitlist_entry_id         UUID NOT NULL REFERENCES pos360_waitlist_entries(id) ON DELETE CASCADE,
  from_status               TEXT,
  to_status                 TEXT NOT NULL,
  reason                    TEXT,
  actor_user_id             UUID NOT NULL,
  manager_override          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_waitlist_status_hist ON pos360_waitlist_status_history (waitlist_entry_id, created_at DESC);

-- ── Floor Sections ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_floor_sections (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  name                      TEXT NOT NULL,
  section_type              TEXT NOT NULL DEFAULT 'dining'
    CHECK (section_type IN ('dining','patio','bar','lounge','humidor','private_room','event_space','other')),
  capacity                  INTEGER NOT NULL DEFAULT 0,
  active                    BOOLEAN NOT NULL DEFAULT TRUE,
  display_order             INTEGER NOT NULL DEFAULT 0,
  layout_metadata           JSONB NOT NULL DEFAULT '{}',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_sections_venue ON pos360_floor_sections (venue_id, active);

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_tables (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  section_id                UUID, -- fk-ref: pos360_floor_sections; omitted — 031 uses SERIAL PK incompatible with UUID
  table_name                TEXT NOT NULL,
  table_number              TEXT,
  capacity_min              INTEGER NOT NULL DEFAULT 1,
  capacity_max              INTEGER NOT NULL DEFAULT 4,
  table_shape               TEXT NOT NULL DEFAULT 'rectangle',
  x_position                NUMERIC(8,2) NOT NULL DEFAULT 0,
  y_position                NUMERIC(8,2) NOT NULL DEFAULT 0,
  rotation                  INTEGER NOT NULL DEFAULT 0,
  status                    TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','occupied','reserved','dirty','cleaning','blocked','out_of_service')),
  server_id                 UUID,
  active                    BOOLEAN NOT NULL DEFAULT TRUE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_tables_venue ON pos360_tables (venue_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tables_section ON pos360_tables (section_id);
CREATE INDEX IF NOT EXISTS idx_pos360_tables_status ON pos360_tables (venue_id, status);

-- ── Table Status History ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_table_status_history (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  table_id                  UUID NOT NULL, -- fk-ref: pos360_tables; omitted — 031 uses SERIAL PK incompatible with UUID
  from_status               TEXT,
  to_status                 TEXT NOT NULL,
  reason                    TEXT,
  actor_user_id             UUID NOT NULL,
  manager_override          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_table_status_hist ON pos360_table_status_history (table_id, created_at DESC);

-- ── Table Assignments ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_table_assignments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  table_id                  UUID NOT NULL, -- fk-ref: pos360_tables; omitted — 031 uses SERIAL PK incompatible with UUID
  reservation_id            UUID REFERENCES pos360_reservations(id),
  waitlist_entry_id         UUID REFERENCES pos360_waitlist_entries(id),
  seating_session_id        UUID,
  assigned_by               UUID NOT NULL,
  assigned_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at               TIMESTAMPTZ,
  status                    TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','released','cancelled')),
  idempotency_key           TEXT NOT NULL,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  UNIQUE (idempotency_key, venue_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_table_assignments_table ON pos360_table_assignments (table_id, status);
CREATE INDEX IF NOT EXISTS idx_pos360_table_assignments_reservation ON pos360_table_assignments (reservation_id) WHERE reservation_id IS NOT NULL;

-- ── Table Merge Groups ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_table_merge_groups (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  primary_table_id          UUID NOT NULL, -- fk-ref: pos360_tables; omitted — 031 uses SERIAL PK incompatible with UUID
  merged_table_ids          UUID[] NOT NULL DEFAULT '{}',
  combined_capacity         INTEGER NOT NULL DEFAULT 0,
  status                    TEXT NOT NULL DEFAULT 'active',
  reason                    TEXT,
  merged_by                 UUID NOT NULL,
  released_at               TIMESTAMPTZ,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_merge_groups_venue ON pos360_table_merge_groups (venue_id, status);

-- ── Seating Sessions ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_seating_sessions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  table_id                  UUID NOT NULL, -- fk-ref: pos360_tables; omitted — 031 uses SERIAL PK incompatible with UUID
  reservation_id            UUID REFERENCES pos360_reservations(id),
  waitlist_entry_id         UUID REFERENCES pos360_waitlist_entries(id),
  customer_id               UUID,
  guest_profile_id          UUID,
  party_size                INTEGER NOT NULL DEFAULT 1,
  seated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at              TIMESTAMPTZ,
  duration_minutes          INTEGER,
  status                    TEXT NOT NULL DEFAULT 'active',
  server_id                 UUID,
  order_ids                 UUID[] NOT NULL DEFAULT '{}',
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_seating_sessions_venue ON pos360_seating_sessions (venue_id, status);
CREATE INDEX IF NOT EXISTS idx_pos360_seating_sessions_table ON pos360_seating_sessions (table_id);

-- ── Private Events ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_private_events (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  customer_id               UUID,
  guest_profile_id          UUID,
  event_name                TEXT NOT NULL,
  host_name                 TEXT NOT NULL,
  host_phone                TEXT,
  host_email                TEXT,
  event_date                DATE NOT NULL,
  start_time                TIME NOT NULL,
  end_time                  TIME,
  guest_count               INTEGER NOT NULL DEFAULT 1,
  section_id                UUID, -- fk-ref: pos360_floor_sections; omitted — 031 uses SERIAL PK incompatible with UUID
  status                    TEXT NOT NULL DEFAULT 'inquiry'
    CHECK (status IN ('inquiry','proposed','hold','confirmed','deposit_pending','deposit_paid','completed','cancelled')),
  contract_status           TEXT NOT NULL DEFAULT 'not_required'
    CHECK (contract_status IN ('not_required','draft','sent','signed','declined','expired')),
  deposit_status            TEXT NOT NULL DEFAULT 'not_required'
    CHECK (deposit_status IN ('not_required','pending','paid','refunded','waived','failed')),
  deposit_amount_cents      BIGINT NOT NULL DEFAULT 0,
  minimum_spend_cents       BIGINT NOT NULL DEFAULT 0,
  package_summary           TEXT,
  kitchen_notes             TEXT,
  bar_notes                 TEXT,
  humidor_notes             TEXT,
  cigar_package_notes       TEXT,
  staff_notes               TEXT,
  manager_approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  manager_approved_by       UUID,
  manager_approved_at       TIMESTAMPTZ,
  idempotency_key           TEXT NOT NULL,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_by                UUID,
  updated_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key, venue_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_private_events_venue ON pos360_private_events (venue_id, status);
CREATE INDEX IF NOT EXISTS idx_pos360_private_events_date ON pos360_private_events (venue_id, event_date);
CREATE INDEX IF NOT EXISTS idx_pos360_private_events_customer ON pos360_private_events (customer_id) WHERE customer_id IS NOT NULL;

-- ── Private Event Packages ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_private_event_packages (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  private_event_id          UUID NOT NULL REFERENCES pos360_private_events(id) ON DELETE CASCADE,
  package_type              TEXT NOT NULL, -- menu, bar, cigar, experience
  package_name              TEXT NOT NULL,
  price_cents               BIGINT NOT NULL DEFAULT 0,
  notes                     TEXT,
  confirmed                 BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_event_packages_event ON pos360_private_event_packages (private_event_id);

-- ── Private Event Deposits ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_private_event_deposits (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  private_event_id          UUID NOT NULL REFERENCES pos360_private_events(id) ON DELETE CASCADE,
  deposit_type              TEXT NOT NULL DEFAULT 'initial',
  amount_cents              BIGINT NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'pending',
  payment_reference         TEXT,
  requires_manager          BOOLEAN NOT NULL DEFAULT FALSE,
  reversed_by               UUID,
  reversed_at               TIMESTAMPTZ,
  reversal_reason           TEXT,
  idempotency_key           TEXT NOT NULL,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key, venue_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_event_deposits_event ON pos360_private_event_deposits (private_event_id);

-- ── Private Event Status History ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_private_event_status_history (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  private_event_id          UUID NOT NULL REFERENCES pos360_private_events(id) ON DELETE CASCADE,
  from_status               TEXT,
  to_status                 TEXT NOT NULL,
  reason                    TEXT,
  actor_user_id             UUID NOT NULL,
  manager_override          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_event_status_hist ON pos360_private_event_status_history (private_event_id, created_at DESC);

-- ── Guest Flow Events ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_flow_events (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  reservation_id            UUID,
  waitlist_entry_id         UUID,
  private_event_id          UUID,
  customer_id               UUID,
  guest_profile_id          UUID,
  event_type                TEXT NOT NULL,
  event_payload             JSONB NOT NULL DEFAULT '{}',
  source                    TEXT NOT NULL DEFAULT 'pos360',
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  ai_confidence             NUMERIC(5,4),
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_flow_events_venue ON pos360_guest_flow_events (venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_flow_events_type ON pos360_guest_flow_events (venue_id, event_type);
CREATE INDEX IF NOT EXISTS idx_pos360_guest_flow_events_customer ON pos360_guest_flow_events (customer_id) WHERE customer_id IS NOT NULL;

-- ── Guest Flow Insights (honest placeholders) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_guest_flow_insights (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  insight_type              TEXT NOT NULL,
  insight_source            TEXT NOT NULL DEFAULT 'placeholder',
  insight_data              JSONB NOT NULL DEFAULT '{}',
  is_actionable             BOOLEAN NOT NULL DEFAULT FALSE,
  actioned                  BOOLEAN NOT NULL DEFAULT FALSE,
  actioned_at               TIMESTAMPTZ,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_flow_insights_venue ON pos360_guest_flow_insights (venue_id, created_at DESC);

-- ── Reservation Offline Queue ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_reservation_offline_queue (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  action_type               TEXT NOT NULL,
  payload                   JSONB NOT NULL DEFAULT '{}',
  status                    TEXT NOT NULL DEFAULT 'queued',
  replayed_at               TIMESTAMPTZ,
  idempotency_key           TEXT NOT NULL,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key, venue_id)
);
CREATE INDEX IF NOT EXISTS idx_pos360_res_offline_venue ON pos360_reservation_offline_queue (venue_id, status);

-- ── Reservation Audit ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos360_reservation_audit (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL,
  venue_id                  UUID NOT NULL,
  actor_user_id             UUID NOT NULL,
  action                    TEXT NOT NULL,
  entity_type               TEXT NOT NULL,
  entity_id                 UUID,
  before_snapshot           JSONB NOT NULL DEFAULT '{}',
  after_snapshot            JSONB NOT NULL DEFAULT '{}',
  reason                    TEXT,
  manager_override          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos360_res_audit_venue ON pos360_reservation_audit (venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos360_res_audit_entity ON pos360_reservation_audit (entity_type, entity_id) WHERE entity_id IS NOT NULL;
