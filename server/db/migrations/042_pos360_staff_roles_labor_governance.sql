-- Migration 042: POS360 Staff Roles, Permissions, Scheduling, Shift Controls, Labor Intelligence & Manager Governance
-- Phase B.12 Prompt Y
-- Uses CREATE TABLE IF NOT EXISTS. No DROP TABLE. No destructive column changes.

-- Staff profiles
CREATE TABLE IF NOT EXISTS pos360_staff_profiles (
  id                        SERIAL PRIMARY KEY,
  tenant_id                 TEXT,
  venue_id                  TEXT NOT NULL,
  staff_user_id             TEXT,
  display_name              TEXT NOT NULL,
  legal_name                TEXT,
  staff_code                TEXT,
  email                     TEXT,
  phone                     TEXT,
  emergency_contact_snapshot JSONB NOT NULL DEFAULT '{}',
  preferred_language        TEXT NOT NULL DEFAULT 'en-US',
  active                    BOOLEAN NOT NULL DEFAULT TRUE,
  hire_date                 DATE,
  termination_date          DATE,
  staff_notes               TEXT,
  idempotency_key           TEXT,
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_by                TEXT,
  updated_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_venue ON pos360_staff_profiles(venue_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user ON pos360_staff_profiles(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_active ON pos360_staff_profiles(active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_profiles_idem ON pos360_staff_profiles(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Staff roles
CREATE TABLE IF NOT EXISTS pos360_staff_roles (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  role_name           TEXT NOT NULL,
  role_key            TEXT NOT NULL,
  role_type           TEXT NOT NULL DEFAULT 'custom' CHECK (role_type IN ('owner','general_manager','manager','host','server','bartender','kitchen','humidor_specialist','cashier','event_coordinator','inventory_manager','auditor','limited_staff','custom')),
  description         TEXT,
  is_manager_role     BOOLEAN NOT NULL DEFAULT FALSE,
  is_system_template  BOOLEAN NOT NULL DEFAULT FALSE,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key     TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_by          TEXT,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_roles_venue ON pos360_staff_roles(venue_id);
CREATE INDEX IF NOT EXISTS idx_staff_roles_type ON pos360_staff_roles(role_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_roles_idem ON pos360_staff_roles(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Role templates (venue-configurable)
CREATE TABLE IF NOT EXISTS pos360_staff_role_templates (
  id                    SERIAL PRIMARY KEY,
  template_key          TEXT NOT NULL UNIQUE,
  template_name         TEXT NOT NULL,
  role_type             TEXT NOT NULL,
  default_permissions   JSONB NOT NULL DEFAULT '[]',
  description           TEXT,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_role_templates_key ON pos360_staff_role_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_role_templates_type ON pos360_staff_role_templates(role_type);

-- Permissions
CREATE TABLE IF NOT EXISTS pos360_staff_permissions (
  id                        SERIAL PRIMARY KEY,
  permission_key            TEXT NOT NULL UNIQUE,
  permission_group          TEXT NOT NULL CHECK (permission_group IN ('orders','payments','refunds','voids','tips','cash_drawer','closeout','reservations','waitlist','tables','private_events','event_packages','loyalty','inventory','eat','smokecraft','staff','reports','admin','audit')),
  display_name              TEXT NOT NULL,
  description               TEXT,
  requires_manager_role     BOOLEAN NOT NULL DEFAULT FALSE,
  financial_permission      BOOLEAN NOT NULL DEFAULT FALSE,
  private_data_permission   BOOLEAN NOT NULL DEFAULT FALSE,
  active                    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_group ON pos360_staff_permissions(permission_group);

-- Role permissions
CREATE TABLE IF NOT EXISTS pos360_staff_role_permissions (
  id              SERIAL PRIMARY KEY,
  tenant_id       TEXT,
  venue_id        TEXT NOT NULL,
  role_id         INTEGER NOT NULL REFERENCES pos360_staff_roles(id),
  permission_key  TEXT NOT NULL,
  allowed         BOOLEAN NOT NULL DEFAULT FALSE,
  granted_by      TEXT,
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_venue ON pos360_staff_role_permissions(venue_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON pos360_staff_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_key ON pos360_staff_role_permissions(permission_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_idem ON pos360_staff_role_permissions(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Permission overrides
CREATE TABLE IF NOT EXISTS pos360_staff_permission_overrides (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  staff_profile_id      INTEGER NOT NULL REFERENCES pos360_staff_profiles(id),
  permission_key        TEXT NOT NULL,
  override_type         TEXT NOT NULL CHECK (override_type IN ('grant','deny')),
  reason                TEXT,
  starts_at             TIMESTAMPTZ,
  ends_at               TIMESTAMPTZ,
  manager_approved_by   TEXT,
  manager_approved_at   TIMESTAMPTZ,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key       TEXT,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_perm_overrides_venue ON pos360_staff_permission_overrides(venue_id);
CREATE INDEX IF NOT EXISTS idx_perm_overrides_staff ON pos360_staff_permission_overrides(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_perm_overrides_key ON pos360_staff_permission_overrides(permission_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_perm_overrides_idem ON pos360_staff_permission_overrides(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Staff assignments (cross-phase hooks)
CREATE TABLE IF NOT EXISTS pos360_staff_assignments (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  staff_profile_id      INTEGER NOT NULL REFERENCES pos360_staff_profiles(id),
  role_id               INTEGER REFERENCES pos360_staff_roles(id),
  assignment_type       TEXT NOT NULL CHECK (assignment_type IN ('section','table','reservation','waitlist','private_event','order','payment','cash_drawer','closeout','humidor','bar','kitchen','patio','smokecraft','other')),
  section_id            TEXT,
  table_id              TEXT,
  reservation_id        TEXT,
  waitlist_entry_id     TEXT,
  private_event_id      TEXT,
  order_id              TEXT,
  payment_record_id     INTEGER,
  cash_drawer_id        INTEGER,
  closeout_id           INTEGER,
  assignment_status     TEXT NOT NULL DEFAULT 'assigned' CHECK (assignment_status IN ('assigned','active','completed','cancelled','transferred')),
  starts_at             TIMESTAMPTZ,
  ends_at               TIMESTAMPTZ,
  assigned_by           TEXT,
  assignment_notes      TEXT,
  idempotency_key       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_venue ON pos360_staff_assignments(venue_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff ON pos360_staff_assignments(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_type ON pos360_staff_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_private_event ON pos360_staff_assignments(private_event_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_reservation ON pos360_staff_assignments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_table ON pos360_staff_assignments(table_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_assignments_idem ON pos360_staff_assignments(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Schedule templates
CREATE TABLE IF NOT EXISTS pos360_staff_schedule_templates (
  id              SERIAL PRIMARY KEY,
  tenant_id       TEXT,
  venue_id        TEXT NOT NULL,
  template_name   TEXT NOT NULL,
  template_type   TEXT NOT NULL DEFAULT 'weekly',
  shift_patterns  JSONB NOT NULL DEFAULT '[]',
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_schedule_templates_venue ON pos360_staff_schedule_templates(venue_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_templates_idem ON pos360_staff_schedule_templates(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Scheduled shifts
CREATE TABLE IF NOT EXISTS pos360_staff_scheduled_shifts (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  staff_profile_id      INTEGER NOT NULL REFERENCES pos360_staff_profiles(id),
  role_id               INTEGER REFERENCES pos360_staff_roles(id),
  schedule_template_id  INTEGER REFERENCES pos360_staff_schedule_templates(id),
  shift_date            DATE NOT NULL,
  start_time            TIME NOT NULL,
  end_time              TIME NOT NULL,
  scheduled_minutes     INTEGER NOT NULL DEFAULT 0,
  section_id            TEXT,
  table_zone_metadata   JSONB NOT NULL DEFAULT '{}',
  position_label        TEXT,
  shift_status          TEXT NOT NULL DEFAULT 'draft' CHECK (shift_status IN ('draft','scheduled','published_placeholder','acknowledged_external','clocked_in','clocked_out','missed','cancelled')),
  publish_status        TEXT NOT NULL DEFAULT 'draft' CHECK (publish_status IN ('draft','ready_to_publish','published_placeholder','notification_not_connected')),
  notes                 TEXT,
  idempotency_key       TEXT,
  created_by            TEXT,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shifts_venue ON pos360_staff_scheduled_shifts(venue_id);
CREATE INDEX IF NOT EXISTS idx_shifts_staff ON pos360_staff_scheduled_shifts(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON pos360_staff_scheduled_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON pos360_staff_scheduled_shifts(shift_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_idem ON pos360_staff_scheduled_shifts(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Shift status history
CREATE TABLE IF NOT EXISTS pos360_staff_shift_status_history (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  scheduled_shift_id  INTEGER NOT NULL REFERENCES pos360_staff_scheduled_shifts(id),
  from_status         TEXT,
  to_status           TEXT NOT NULL,
  changed_by          TEXT,
  reason              TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shift_history_shift ON pos360_staff_shift_status_history(scheduled_shift_id);

-- Staff availability
CREATE TABLE IF NOT EXISTS pos360_staff_availability (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  staff_profile_id      INTEGER NOT NULL REFERENCES pos360_staff_profiles(id),
  day_of_week           INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  available_start_time  TIME,
  available_end_time    TIME,
  preference_level      TEXT NOT NULL DEFAULT 'available' CHECK (preference_level IN ('preferred','available','unavailable')),
  notes                 TEXT,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key       TEXT,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_availability_venue ON pos360_staff_availability(venue_id);
CREATE INDEX IF NOT EXISTS idx_availability_staff ON pos360_staff_availability(staff_profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_idem ON pos360_staff_availability(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Time-off requests
CREATE TABLE IF NOT EXISTS pos360_staff_time_off_requests (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  staff_profile_id      INTEGER NOT NULL REFERENCES pos360_staff_profiles(id),
  request_start_date    DATE NOT NULL,
  request_end_date      DATE NOT NULL,
  request_type          TEXT NOT NULL DEFAULT 'personal' CHECK (request_type IN ('vacation','sick','personal','unavailable','other')),
  request_status        TEXT NOT NULL DEFAULT 'pending' CHECK (request_status IN ('pending','approved','denied','cancelled')),
  reason                TEXT,
  manager_approved_by   TEXT,
  manager_approved_at   TIMESTAMPTZ,
  idempotency_key       TEXT,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_time_off_venue ON pos360_staff_time_off_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_time_off_staff ON pos360_staff_time_off_requests(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_time_off_status ON pos360_staff_time_off_requests(request_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_off_idem ON pos360_staff_time_off_requests(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Time clock punches
CREATE TABLE IF NOT EXISTS pos360_staff_time_clock_punches (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  staff_profile_id      INTEGER NOT NULL REFERENCES pos360_staff_profiles(id),
  scheduled_shift_id    INTEGER REFERENCES pos360_staff_scheduled_shifts(id),
  punch_type            TEXT NOT NULL CHECK (punch_type IN ('clock_in','clock_out','break_start','break_end','missed_punch_placeholder','offline_punch')),
  punch_time            TIMESTAMPTZ NOT NULL,
  punch_source          TEXT NOT NULL DEFAULT 'staff' CHECK (punch_source IN ('staff','manager','offline','imported','external')),
  punch_status          TEXT NOT NULL DEFAULT 'recorded' CHECK (punch_status IN ('recorded','pending_review','corrected','rejected','unavailable')),
  location_metadata     JSONB NOT NULL DEFAULT '{}',
  provider_reference    TEXT,
  processed_externally  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key       TEXT,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_punches_venue ON pos360_staff_time_clock_punches(venue_id);
CREATE INDEX IF NOT EXISTS idx_punches_staff ON pos360_staff_time_clock_punches(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_punches_type ON pos360_staff_time_clock_punches(punch_type);
CREATE INDEX IF NOT EXISTS idx_punches_status ON pos360_staff_time_clock_punches(punch_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_punches_idem ON pos360_staff_time_clock_punches(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Time clock corrections
CREATE TABLE IF NOT EXISTS pos360_staff_time_clock_corrections (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   TEXT,
  venue_id                    TEXT NOT NULL,
  time_clock_punch_id         INTEGER REFERENCES pos360_staff_time_clock_punches(id),
  staff_profile_id            INTEGER NOT NULL REFERENCES pos360_staff_profiles(id),
  correction_type             TEXT NOT NULL CHECK (correction_type IN ('missed_clock_in','missed_clock_out','break_adjustment','time_adjustment','duplicate_punch','other')),
  previous_snapshot           JSONB NOT NULL DEFAULT '{}',
  corrected_snapshot          JSONB NOT NULL DEFAULT '{}',
  correction_reason           TEXT,
  manager_approval_required   BOOLEAN NOT NULL DEFAULT TRUE,
  manager_approved_by         TEXT,
  manager_approved_at         TIMESTAMPTZ,
  correction_status           TEXT NOT NULL DEFAULT 'pending_manager_approval' CHECK (correction_status IN ('pending_manager_approval','approved','rejected','cancelled')),
  idempotency_key             TEXT,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  created_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_corrections_venue ON pos360_staff_time_clock_corrections(venue_id);
CREATE INDEX IF NOT EXISTS idx_corrections_staff ON pos360_staff_time_clock_corrections(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_corrections_status ON pos360_staff_time_clock_corrections(correction_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_corrections_idem ON pos360_staff_time_clock_corrections(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Break records
CREATE TABLE IF NOT EXISTS pos360_staff_break_records (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  staff_profile_id      INTEGER NOT NULL REFERENCES pos360_staff_profiles(id),
  scheduled_shift_id    INTEGER REFERENCES pos360_staff_scheduled_shifts(id),
  break_start_punch_id  INTEGER REFERENCES pos360_staff_time_clock_punches(id),
  break_end_punch_id    INTEGER REFERENCES pos360_staff_time_clock_punches(id),
  break_minutes         INTEGER NOT NULL DEFAULT 0,
  break_type            TEXT NOT NULL DEFAULT 'unpaid' CHECK (break_type IN ('paid','unpaid','meal','rest')),
  break_status          TEXT NOT NULL DEFAULT 'started' CHECK (break_status IN ('started','ended','missed_end','corrected')),
  idempotency_key       TEXT,
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_breaks_venue ON pos360_staff_break_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_breaks_staff ON pos360_staff_break_records(staff_profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_breaks_idem ON pos360_staff_break_records(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Labor summaries
CREATE TABLE IF NOT EXISTS pos360_staff_labor_summaries (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  staff_profile_id      INTEGER REFERENCES pos360_staff_profiles(id),
  role_id               INTEGER REFERENCES pos360_staff_roles(id),
  summary_date          DATE NOT NULL,
  scheduled_minutes     INTEGER NOT NULL DEFAULT 0,
  actual_minutes        INTEGER NOT NULL DEFAULT 0,
  break_minutes         INTEGER NOT NULL DEFAULT 0,
  overtime_minutes      INTEGER NOT NULL DEFAULT 0,
  labor_cost_amount     NUMERIC(12,2),
  labor_cost_source     TEXT NOT NULL DEFAULT 'none' CHECK (labor_cost_source IN ('none','manual','imported','external_payroll')),
  payroll_connected     BOOLEAN NOT NULL DEFAULT FALSE,
  summary_status        TEXT NOT NULL DEFAULT 'draft' CHECK (summary_status IN ('draft','calculated_placeholder','reviewed','locked')),
  idempotency_key       TEXT,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            TEXT,
  locked_by             TEXT,
  locked_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_labor_summaries_venue ON pos360_staff_labor_summaries(venue_id);
CREATE INDEX IF NOT EXISTS idx_labor_summaries_staff ON pos360_staff_labor_summaries(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_labor_summaries_date ON pos360_staff_labor_summaries(summary_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_labor_summaries_idem ON pos360_staff_labor_summaries(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Manager governance rules
CREATE TABLE IF NOT EXISTS pos360_manager_governance_rules (
  id                        SERIAL PRIMARY KEY,
  tenant_id                 TEXT,
  venue_id                  TEXT NOT NULL,
  governance_key            TEXT NOT NULL,
  protected_action          TEXT NOT NULL,
  requires_manager_approval BOOLEAN NOT NULL DEFAULT TRUE,
  required_role_type        TEXT,
  active                    BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key           TEXT,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_by                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_governance_rules_venue ON pos360_manager_governance_rules(venue_id);
CREATE INDEX IF NOT EXISTS idx_governance_rules_action ON pos360_manager_governance_rules(protected_action);
CREATE UNIQUE INDEX IF NOT EXISTS idx_governance_rules_idem ON pos360_manager_governance_rules(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Manager approval requests
CREATE TABLE IF NOT EXISTS pos360_manager_approval_requests (
  id                            SERIAL PRIMARY KEY,
  tenant_id                     TEXT,
  venue_id                      TEXT NOT NULL,
  requested_by_staff_profile_id INTEGER REFERENCES pos360_staff_profiles(id),
  manager_staff_profile_id      INTEGER REFERENCES pos360_staff_profiles(id),
  protected_action              TEXT NOT NULL,
  entity_type                   TEXT,
  entity_id                     TEXT,
  request_reason                TEXT,
  approval_status               TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected','cancelled')),
  decision_reason               TEXT,
  decided_at                    TIMESTAMPTZ,
  before_snapshot               JSONB NOT NULL DEFAULT '{}',
  after_snapshot                JSONB NOT NULL DEFAULT '{}',
  idempotency_key               TEXT,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mgr_approvals_venue ON pos360_manager_approval_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_mgr_approvals_status ON pos360_manager_approval_requests(approval_status);
CREATE INDEX IF NOT EXISTS idx_mgr_approvals_action ON pos360_manager_approval_requests(protected_action);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mgr_approvals_idem ON pos360_manager_approval_requests(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Staff risk flags
CREATE TABLE IF NOT EXISTS pos360_staff_risk_flags (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  staff_profile_id      INTEGER REFERENCES pos360_staff_profiles(id),
  risk_type             TEXT NOT NULL CHECK (risk_type IN ('excessive_refunds','excessive_voids','large_tip_pattern','drawer_over_short_pattern','missed_punch_pattern','schedule_gap','overtime_risk','permission_override_pattern','manager_override_pattern','other')),
  risk_status           TEXT NOT NULL DEFAULT 'open' CHECK (risk_status IN ('open','reviewed','dismissed','escalated')),
  risk_payload          JSONB NOT NULL DEFAULT '{}',
  reviewed_by           TEXT,
  reviewed_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_risk_flags_venue ON pos360_staff_risk_flags(venue_id);
CREATE INDEX IF NOT EXISTS idx_staff_risk_flags_staff ON pos360_staff_risk_flags(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_risk_flags_type ON pos360_staff_risk_flags(risk_type);

-- Labor insights (E.A.T. hooks)
CREATE TABLE IF NOT EXISTS pos360_staff_labor_insights (
  id                              SERIAL PRIMARY KEY,
  tenant_id                       TEXT,
  venue_id                        TEXT NOT NULL,
  insight_type                    TEXT NOT NULL,
  insight_payload                 JSONB NOT NULL DEFAULT '{}',
  contains_ai_generated_content   BOOLEAN NOT NULL DEFAULT FALSE,
  ai_confidence                   NUMERIC(5,4),
  source                          TEXT NOT NULL DEFAULT 'system',
  honest_state                    TEXT NOT NULL DEFAULT 'placeholder',
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_labor_insights_venue ON pos360_staff_labor_insights(venue_id);
CREATE INDEX IF NOT EXISTS idx_labor_insights_type ON pos360_staff_labor_insights(insight_type);

-- Payroll provider profiles
CREATE TABLE IF NOT EXISTS pos360_staff_payroll_provider_profiles (
  id                    SERIAL PRIMARY KEY,
  tenant_id             TEXT,
  venue_id              TEXT NOT NULL,
  provider_name         TEXT NOT NULL CHECK (provider_name IN ('gusto','adp','paychex','quickbooks','square_payroll','toast_payroll','manual_external','other')),
  provider_status       TEXT NOT NULL DEFAULT 'not_connected' CHECK (provider_status IN ('not_connected','configured_placeholder','connected_external','disabled','error')),
  display_name          TEXT,
  provider_reference    TEXT,
  capability_payload    JSONB NOT NULL DEFAULT '{}',
  stores_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key       TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payroll_providers_venue ON pos360_staff_payroll_provider_profiles(venue_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_providers_idem ON pos360_staff_payroll_provider_profiles(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Offline queue
CREATE TABLE IF NOT EXISTS pos360_staff_offline_queue (
  id                  SERIAL PRIMARY KEY,
  tenant_id           TEXT,
  venue_id            TEXT NOT NULL,
  actor_user_id       TEXT,
  action_type         TEXT NOT NULL,
  entity_type         TEXT,
  entity_id           TEXT,
  payload             JSONB NOT NULL DEFAULT '{}',
  sync_status         TEXT NOT NULL DEFAULT 'queued' CHECK (sync_status IN ('queued','syncing','synced','failed','conflict')),
  retry_count         INTEGER NOT NULL DEFAULT 0,
  idempotency_key     TEXT,
  synced_by           TEXT,
  synced_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_offline_venue ON pos360_staff_offline_queue(venue_id);
CREATE INDEX IF NOT EXISTS idx_staff_offline_status ON pos360_staff_offline_queue(sync_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_offline_idem ON pos360_staff_offline_queue(idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL;

-- Staff audit
CREATE TABLE IF NOT EXISTS pos360_staff_audit (
  id                      SERIAL PRIMARY KEY,
  tenant_id               TEXT,
  venue_id                TEXT NOT NULL,
  actor_user_id           TEXT,
  action                  TEXT NOT NULL,
  entity_type             TEXT,
  entity_id               TEXT,
  before_snapshot         JSONB NOT NULL DEFAULT '{}',
  after_snapshot          JSONB NOT NULL DEFAULT '{}',
  reason                  TEXT,
  manager_override        BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data    BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_audit_venue ON pos360_staff_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_entity ON pos360_staff_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_created ON pos360_staff_audit(created_at);
