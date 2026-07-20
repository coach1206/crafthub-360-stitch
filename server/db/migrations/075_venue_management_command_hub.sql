-- Package 6A: Venue Management Command Hub + NOVEE OS Remote Venue Operations
-- Schema foundation only. No UI/service logic in this migration.
--
-- Reuses (not duplicated here): venues, venue_memberships, venue_permissions,
-- audit_logs (category 'VENUE'). Does NOT touch novee_os_venues (System 2) —
-- all venue_id FKs below point at the authoritative venues(venue_id).

-- Generic content lifecycle + version history for Command Hub-managed
-- records (venue profile, branding/media, products, menus, events, etc.).
-- One shared table rather than a per-entity-type version table, since the
-- lifecycle state machine and audit fields are identical across entity
-- types (Phase 6 of the mandate).
CREATE TABLE IF NOT EXISTS venue_management_content_versions (
  id BIGSERIAL PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'venue_profile', 'branding_media', 'product', 'menu', 'menu_item',
    'event', 'challenge', 'announcement', 'staff_permission_set'
  )),
  entity_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'PUBLISHED',
    'PAUSED', 'UNPUBLISHED', 'REJECTED', 'EXPIRED', 'ARCHIVED'
  )),
  payload JSONB NOT NULL,
  scheduled_publish_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  UNIQUE (venue_id, entity_type, entity_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_vmcv_venue_entity
  ON venue_management_content_versions (venue_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_vmcv_status
  ON venue_management_content_versions (venue_id, status);

-- Secure media library. No storage provider exists yet in this codebase
-- (confirmed by audit); this table records metadata for whatever files
-- are actually persisted by Package 6B's upload service — it does not
-- itself imply a working upload pipeline until 6B ships one.
CREATE TABLE IF NOT EXISTS venue_management_media (
  id BIGSERIAL PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'logo', 'banner', 'document')),
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  in_use BOOLEAN NOT NULL DEFAULT false,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vmm_venue ON venue_management_media (venue_id) WHERE deleted_at IS NULL;

-- NOVEE OS remote venue operations — the full audit/approval/rollback
-- record for any action a platform operator takes against a specific
-- venue from the Remote Operations Hub. Scope of *categories* is
-- deliberately restricted per the mandate's Phase 7 exclusions (no
-- licensing, subscriptions, deployment, device fleet, secrets, prod DB —
-- those are Package 7).
CREATE TABLE IF NOT EXISTS novee_os_remote_venue_actions (
  id BIGSERIAL PRIMARY KEY,
  operator_user_id TEXT NOT NULL,
  target_venue_id TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  action_category TEXT NOT NULL CHECK (action_category IN (
    'read_only_support', 'venue_approved_change', 'platform_controlled_change', 'emergency_action'
  )),
  action_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'not_required' CHECK (approval_status IN (
    'pending', 'approved', 'rejected', 'not_required'
  )),
  before_value JSONB,
  after_value JSONB,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ,
  notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (notification_status IN (
    'pending', 'sent', 'not_required', 'failed'
  )),
  rollback_reference BIGINT REFERENCES novee_os_remote_venue_actions(id),
  outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN (
    'pending', 'success', 'failed', 'rolled_back'
  ))
);

CREATE INDEX IF NOT EXISTS idx_novra_target_venue ON novee_os_remote_venue_actions (target_venue_id);
CREATE INDEX IF NOT EXISTS idx_novra_operator ON novee_os_remote_venue_actions (operator_user_id);

-- Append-only guarantee for the remote-action ledger, matching the
-- existing audit_logs pattern (Phase 8: complete, tamper-evident audit).
CREATE OR REPLACE FUNCTION novee_os_remote_actions_no_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'novee_os_remote_venue_actions rows cannot be deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_novra_no_delete ON novee_os_remote_venue_actions;
CREATE TRIGGER trg_novra_no_delete
  BEFORE DELETE ON novee_os_remote_venue_actions
  FOR EACH ROW EXECUTE FUNCTION novee_os_remote_actions_no_delete();
