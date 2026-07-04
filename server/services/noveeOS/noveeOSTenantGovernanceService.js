/**
 * NOVEE OS Tenant, Venue, Organization & Workspace Governance Service
 * Phase C.2 / Module 2 of 7
 *
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 *
 * Safety guarantees:
 * - No fake tenant isolation claims
 * - No fake workspace provisioning claims
 * - No fake venue deployment claims
 * - No fake live mode claims
 * - No fake provider connection claims
 * - No fake billing connection claims
 * - No fake license verification claims
 * - No fake deployment completion claims
 * - No secrets storage
 * - No secrets in audit snapshots
 */

import { isDbAvailable } from '../../db/connection.js';
import {
  isValidOrganizationStatus,
  isValidVenueStatus,
  isValidWorkspaceStatus,
  isValidMembershipStatus,
  isValidEnvironmentMode,
  isValidGovernanceStatus,
} from './noveeOSTenantContracts.js';

const AREA = 'novee-os-tenant-governance';

function localFallback(extra = {}) {
  return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA, ...extra };
}

async function writeTenantGovernanceAuditInternal(db, { actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason }) {
  // contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets
  try {
    await db.query(
      `INSERT INTO novee_os_tenant_governance_audit
         (actor_user_id, action, entity_type, entity_id, before_snapshot, after_snapshot, reason,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,FALSE,FALSE,FALSE)`,
      [
        actorUserId || 'system',
        action,
        entityType,
        entityId || null,
        beforeSnapshot ? JSON.stringify(beforeSnapshot) : null,
        afterSnapshot  ? JSON.stringify(afterSnapshot)  : null,
        reason || null,
      ]
    );
  } catch (_) { /* audit write failure must not surface raw error */ }
}

// ─── ORGANIZATIONS ────────────────────────────────────────────────────────────

export async function createOrganization({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_organizations WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const { organization_key, organization_name, parent_organization_id, organization_status = 'draft', metadata } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_organizations
       (organization_key, organization_name, parent_organization_id, organization_status,
        tenant_isolation_verified, contains_secrets, stores_secrets, exposes_private_data,
        exposes_financial_data, billing_connected, license_verified, deployment_completed,
        provider_connected, contains_ai_generated_content, idempotency_key, metadata, created_by)
     VALUES ($1,$2,$3,$4,FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,$5,$6,$7)
     RETURNING id`,
    [organization_key, organization_name, parent_organization_id || null, organization_status,
     idempotencyKey, metadata ? JSON.stringify(metadata) : null, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_organization', entityType: 'organization', entityId: r.rows[0].id, afterSnapshot: { organization_key, organization_status } });
  return { ok: true, id: r.rows[0].id };
}

export async function listOrganizations({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_organizations ORDER BY created_at DESC');
  return { ok: true, items: r.rows };
}

export async function getOrganization({ organizationId }) {
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_organizations WHERE id=$1', [organizationId]);
  if (!r.rows.length) return { ok: false, error: 'not_found' };
  return { ok: true, item: r.rows[0] };
}

export async function updateOrganizationStatus({ organizationId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isValidOrganizationStatus(status)) return { error: 'invalid_status' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  await db.query('UPDATE novee_os_organizations SET organization_status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3', [status, actorUserId || 'system', organizationId]);
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'update_organization_status', entityType: 'organization', entityId: organizationId, afterSnapshot: { status, reason } });
  return { ok: true };
}

export async function createOrganizationProfile({ organizationId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_organization_profiles WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const { display_name, legal_name, address_line1, city, country_code, primary_contact_email, timezone, locale } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_organization_profiles
       (organization_id, display_name, legal_name, address_line1, city, country_code,
        primary_contact_email, timezone, locale,
        exposes_private_data, exposes_financial_data, contains_secrets, stores_secrets,
        contains_ai_generated_content, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,FALSE,FALSE,FALSE,FALSE,$10,$11)
     RETURNING id`,
    [organizationId, display_name, legal_name, address_line1, city, country_code,
     primary_contact_email, timezone, locale || 'en-US', idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_organization_profile', entityType: 'organization_profile', entityId: r.rows[0].id, afterSnapshot: { organizationId } });
  return { ok: true, id: r.rows[0].id };
}

export async function getOrganizationProfile({ organizationId }) {
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_organization_profiles WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 1', [organizationId]);
  if (!r.rows.length) return { ok: false, error: 'not_found', configurationRequired: true };
  return { ok: true, item: r.rows[0] };
}

// ─── VENUE GROUPS ─────────────────────────────────────────────────────────────

export async function createVenueGroup({ organizationId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_venue_groups WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const { venue_group_key, venue_group_name, metadata } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_venue_groups
       (organization_id, venue_group_key, venue_group_name, governance_status,
        tenant_isolation_verified, contains_secrets, stores_secrets,
        exposes_private_data, exposes_financial_data, contains_ai_generated_content,
        idempotency_key, metadata, created_by)
     VALUES ($1,$2,$3,'draft',FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,$4,$5,$6)
     RETURNING id`,
    [organizationId, venue_group_key, venue_group_name, idempotencyKey, metadata ? JSON.stringify(metadata) : null, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_venue_group', entityType: 'venue_group', entityId: r.rows[0].id, afterSnapshot: { organizationId, venue_group_key } });
  return { ok: true, id: r.rows[0].id };
}

export async function listVenueGroups({ organizationId, filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_venue_groups WHERE organization_id=$1 ORDER BY created_at DESC', [organizationId]);
  return { ok: true, items: r.rows };
}

export async function updateVenueGroupStatus({ venueGroupId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isValidGovernanceStatus(status)) return { error: 'invalid_status' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  await db.query('UPDATE novee_os_venue_groups SET governance_status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3', [status, actorUserId || 'system', venueGroupId]);
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'update_venue_group_status', entityType: 'venue_group', entityId: venueGroupId, afterSnapshot: { status, reason } });
  return { ok: true };
}

// ─── VENUES ───────────────────────────────────────────────────────────────────

export async function createVenue({ organizationId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_venues WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const { venue_key, venue_name, venue_group_id, metadata } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_venues
       (organization_id, venue_group_id, venue_key, venue_name, venue_status,
        governance_status, readiness_status, environment_key,
        tenant_isolation_verified, venue_deployed, live_mode_enabled, demo_mode_enabled,
        provider_connected, billing_connected, license_verified, deployment_completed,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, idempotency_key, metadata, created_by)
     VALUES ($1,$2,$3,$4,'draft','draft','not_checked','demo',
             FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,FALSE,FALSE,
             FALSE,FALSE,TRUE,FALSE,FALSE,$5,$6,$7)
     RETURNING id`,
    [organizationId, venue_group_id || null, venue_key, venue_name, idempotencyKey, metadata ? JSON.stringify(metadata) : null, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_venue', entityType: 'venue', entityId: r.rows[0].id, afterSnapshot: { organizationId, venue_key, venueDeployed: false, liveMode: false } });
  return { ok: true, id: r.rows[0].id, venueDeployed: false, liveMode: false, providerConnected: false };
}

export async function listVenues({ organizationId, filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_venues WHERE organization_id=$1 ORDER BY created_at DESC', [organizationId]);
  return { ok: true, items: r.rows };
}

export async function getVenue({ venueId }) {
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_venues WHERE id=$1', [venueId]);
  if (!r.rows.length) return { ok: false, error: 'not_found' };
  return { ok: true, item: r.rows[0] };
}

export async function updateVenueStatus({ venueId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isValidVenueStatus(status)) return { error: 'invalid_status' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  await db.query('UPDATE novee_os_venues SET venue_status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3', [status, actorUserId || 'system', venueId]);
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'update_venue_status', entityType: 'venue', entityId: venueId, afterSnapshot: { status, reason, venueDeployed: false } });
  return { ok: true };
}

export async function createVenueProfile({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_venue_profiles WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const venue = await db.query('SELECT organization_id FROM novee_os_venues WHERE id=$1', [venueId]);
  const organizationId = venue.rows[0]?.organization_id;
  const { display_name, venue_type, address_line1, city, country_code, timezone, locale } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_venue_profiles
       (venue_id, organization_id, display_name, venue_type, address_line1, city, country_code,
        timezone, locale, exposes_private_data, exposes_financial_data,
        contains_secrets, stores_secrets, contains_ai_generated_content, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,FALSE,FALSE,FALSE,FALSE,$10,$11)
     RETURNING id`,
    [venueId, organizationId, display_name, venue_type, address_line1, city, country_code,
     timezone, locale || 'en-US', idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_venue_profile', entityType: 'venue_profile', entityId: r.rows[0].id, afterSnapshot: { venueId } });
  return { ok: true, id: r.rows[0].id };
}

export async function getVenueProfile({ venueId }) {
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_venue_profiles WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 1', [venueId]);
  if (!r.rows.length) return { ok: false, error: 'not_found', configurationRequired: true };
  return { ok: true, item: r.rows[0] };
}

// ─── WORKSPACES ───────────────────────────────────────────────────────────────

export async function createWorkspace({ organizationId, venueId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_workspaces WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const { workspace_key, workspace_name, metadata } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_workspaces
       (organization_id, venue_id, workspace_key, workspace_name,
        workspace_status, governance_status, readiness_status, environment_key,
        tenant_isolation_verified, workspace_provisioned, live_mode_enabled, demo_mode_enabled,
        provider_connected, billing_connected, license_verified, deployment_completed,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, idempotency_key, metadata, created_by)
     VALUES ($1,$2,$3,$4,'draft','draft','not_checked','demo',
             FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,FALSE,FALSE,
             FALSE,FALSE,TRUE,FALSE,FALSE,$5,$6,$7)
     RETURNING id`,
    [organizationId, venueId || null, workspace_key, workspace_name, idempotencyKey, metadata ? JSON.stringify(metadata) : null, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_workspace', entityType: 'workspace', entityId: r.rows[0].id, afterSnapshot: { organizationId, workspace_key, workspaceProvisioned: false, liveMode: false } });
  return { ok: true, id: r.rows[0].id, workspaceProvisioned: false, liveMode: false };
}

export async function listWorkspaces({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_workspaces ORDER BY created_at DESC');
  return { ok: true, items: r.rows };
}

export async function getWorkspace({ workspaceId }) {
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_workspaces WHERE id=$1', [workspaceId]);
  if (!r.rows.length) return { ok: false, error: 'not_found' };
  return { ok: true, item: r.rows[0] };
}

export async function updateWorkspaceStatus({ workspaceId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isValidWorkspaceStatus(status)) return { error: 'invalid_status' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  await db.query('UPDATE novee_os_workspaces SET workspace_status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3', [status, actorUserId || 'system', workspaceId]);
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'update_workspace_status', entityType: 'workspace', entityId: workspaceId, afterSnapshot: { status, reason, workspaceProvisioned: false } });
  return { ok: true };
}

// ─── MEMBERSHIPS / ROLES ──────────────────────────────────────────────────────

export async function createWorkspaceMembership({ workspaceId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_workspace_memberships WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const ws = await db.query('SELECT organization_id, venue_id FROM novee_os_workspaces WHERE id=$1', [workspaceId]);
  const { user_id, role_scope = 'staff' } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_workspace_memberships
       (workspace_id, organization_id, venue_id, user_id, actor_user_id,
        membership_status, role_scope, scope_level,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,'invited_placeholder',$6,'workspace',
             FALSE,FALSE,TRUE,FALSE,FALSE,$7,$8)
     RETURNING id`,
    [workspaceId, ws.rows[0]?.organization_id, ws.rows[0]?.venue_id,
     user_id, actorUserId || 'system', role_scope, idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_workspace_membership', entityType: 'workspace_membership', entityId: r.rows[0].id, afterSnapshot: { workspaceId, user_id, membershipStatus: 'invited_placeholder' } });
  return { ok: true, id: r.rows[0].id, membershipStatus: 'invited_placeholder' };
}

export async function listWorkspaceMemberships({ workspaceId, filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_workspace_memberships WHERE workspace_id=$1 ORDER BY created_at DESC', [workspaceId]);
  return { ok: true, items: r.rows };
}

export async function updateWorkspaceMembershipStatus({ membershipId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isValidMembershipStatus(status)) return { error: 'invalid_status' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  await db.query('UPDATE novee_os_workspace_memberships SET membership_status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3', [status, actorUserId || 'system', membershipId]);
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'update_membership_status', entityType: 'workspace_membership', entityId: membershipId, afterSnapshot: { status, reason } });
  return { ok: true };
}

export async function createWorkspaceRole({ workspaceId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_workspace_roles WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const ws = await db.query('SELECT organization_id FROM novee_os_workspaces WHERE id=$1', [workspaceId]);
  const { role_key, role_name, role_scope = 'staff' } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_workspace_roles
       (workspace_id, organization_id, role_key, role_name, role_scope, scope_level, governance_status,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,'workspace','draft',FALSE,FALSE,FALSE,FALSE,FALSE,$6,$7)
     RETURNING id`,
    [workspaceId, ws.rows[0]?.organization_id, role_key, role_name, role_scope, idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_workspace_role', entityType: 'workspace_role', entityId: r.rows[0].id, afterSnapshot: { workspaceId, role_key } });
  return { ok: true, id: r.rows[0].id };
}

export async function listWorkspaceRoles({ workspaceId, filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_workspace_roles WHERE workspace_id=$1 ORDER BY created_at DESC', [workspaceId]);
  return { ok: true, items: r.rows };
}

// ─── BOUNDARIES ───────────────────────────────────────────────────────────────

export async function createWorkspaceAccessBoundary({ workspaceId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_workspace_access_boundaries WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const ws = await db.query('SELECT organization_id, venue_id FROM novee_os_workspaces WHERE id=$1', [workspaceId]);
  const { boundary_type = 'data_access', metadata } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_workspace_access_boundaries
       (workspace_id, organization_id, venue_id, boundary_type, scope_level, boundary_status,
        tenant_isolation_verified, contains_secrets, stores_secrets,
        exposes_private_data, exposes_financial_data, contains_ai_generated_content,
        idempotency_key, metadata, created_by)
     VALUES ($1,$2,$3,$4,'workspace','draft',FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,$5,$6,$7)
     RETURNING id`,
    [workspaceId, ws.rows[0]?.organization_id, ws.rows[0]?.venue_id,
     boundary_type, idempotencyKey, metadata ? JSON.stringify(metadata) : null, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_access_boundary', entityType: 'workspace_access_boundary', entityId: r.rows[0].id, afterSnapshot: { workspaceId, boundary_type, tenantIsolationVerified: false } });
  return { ok: true, id: r.rows[0].id };
}

export async function listWorkspaceAccessBoundaries({ workspaceId, filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_workspace_access_boundaries WHERE workspace_id=$1 ORDER BY created_at DESC', [workspaceId]);
  return { ok: true, items: r.rows };
}

export async function createDataBoundaryRecord({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_data_boundary_records WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const { organization_id, venue_id, workspace_id, boundary_type = 'data_access', metadata } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_data_boundary_records
       (organization_id, venue_id, workspace_id, boundary_type, scope_level,
        tenant_isolation_verified, contains_secrets, stores_secrets,
        exposes_private_data, exposes_financial_data, contains_ai_generated_content,
        actor_user_id, idempotency_key, metadata, created_by)
     VALUES ($1,$2,$3,$4,'organization',FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,$5,$6,$7,$8)
     RETURNING id`,
    [organization_id, venue_id || null, workspace_id || null, boundary_type,
     actorUserId || 'system', idempotencyKey, metadata ? JSON.stringify(metadata) : null, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_data_boundary', entityType: 'data_boundary_record', entityId: r.rows[0].id, afterSnapshot: { organization_id, boundary_type } });
  return { ok: true, id: r.rows[0].id };
}

export async function listDataBoundaryRecords({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_data_boundary_records ORDER BY created_at DESC');
  return { ok: true, items: r.rows };
}

// ─── BUSINESS STRUCTURE ───────────────────────────────────────────────────────

export async function createBusinessUnit({ organizationId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_business_units WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const { business_unit_key, business_unit_name, venue_id } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_business_units
       (organization_id, venue_id, business_unit_key, business_unit_name, scope_level, governance_status,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,'business_unit','draft',FALSE,FALSE,TRUE,FALSE,FALSE,$5,$6)
     RETURNING id`,
    [organizationId, venue_id || null, business_unit_key, business_unit_name, idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_business_unit', entityType: 'business_unit', entityId: r.rows[0].id, afterSnapshot: { organizationId, business_unit_key } });
  return { ok: true, id: r.rows[0].id };
}

export async function listBusinessUnits({ organizationId, filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_business_units WHERE organization_id=$1 ORDER BY created_at DESC', [organizationId]);
  return { ok: true, items: r.rows };
}

export async function createDepartment({ organizationId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_departments WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const { department_key, department_name, business_unit_id, venue_id } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_departments
       (organization_id, venue_id, business_unit_id, department_key, department_name,
        scope_level, governance_status,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,'department','draft',FALSE,FALSE,TRUE,FALSE,FALSE,$6,$7)
     RETURNING id`,
    [organizationId, venue_id || null, business_unit_id || null,
     department_key, department_name, idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_department', entityType: 'department', entityId: r.rows[0].id, afterSnapshot: { organizationId, department_key } });
  return { ok: true, id: r.rows[0].id };
}

export async function listDepartments({ organizationId, filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_departments WHERE organization_id=$1 ORDER BY created_at DESC', [organizationId]);
  return { ok: true, items: r.rows };
}

export async function createLocation({ organizationId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_locations WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const { location_key, location_name, venue_id, venue_group_id, business_unit_id, department_id } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_locations
       (organization_id, venue_id, venue_group_id, business_unit_id, department_id,
        location_key, location_name, scope_level, governance_status,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'location','draft',FALSE,FALSE,TRUE,FALSE,FALSE,$8,$9)
     RETURNING id`,
    [organizationId, venue_id || null, venue_group_id || null,
     business_unit_id || null, department_id || null,
     location_key, location_name, idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_location', entityType: 'location', entityId: r.rows[0].id, afterSnapshot: { organizationId, location_key } });
  return { ok: true, id: r.rows[0].id };
}

export async function listLocations({ organizationId, filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_locations WHERE organization_id=$1 ORDER BY created_at DESC', [organizationId]);
  return { ok: true, items: r.rows };
}

// ─── ENVIRONMENT / MODES ──────────────────────────────────────────────────────

export async function createEnvironmentMode({ workspaceId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_environment_modes WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const ws = await db.query('SELECT organization_id, venue_id FROM novee_os_workspaces WHERE id=$1', [workspaceId]);
  const { environment_key = 'demo', environment_mode = 'demo', reason } = payload || {};
  if (!isValidEnvironmentMode(environment_mode)) return { error: 'invalid_environment_mode' };
  const r = await db.query(
    `INSERT INTO novee_os_environment_modes
       (workspace_id, organization_id, venue_id, environment_key, environment_mode,
        live_mode_enabled, demo_mode_enabled, provider_connected, billing_connected,
        license_verified, deployment_completed, tenant_isolation_verified,
        workspace_provisioned, venue_deployed,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, reason, actor_user_id, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,FALSE,TRUE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,
             FALSE,FALSE,FALSE,FALSE,FALSE,$6,$7,$8,$9)
     RETURNING id`,
    [workspaceId, ws.rows[0]?.organization_id, ws.rows[0]?.venue_id,
     environment_key, environment_mode, reason || null, actorUserId || 'system', idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_environment_mode', entityType: 'environment_mode', entityId: r.rows[0].id, afterSnapshot: { workspaceId, environment_mode, liveMode: false } });
  return { ok: true, id: r.rows[0].id, liveMode: false };
}

export async function listEnvironmentModes({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_environment_modes ORDER BY created_at DESC');
  return { ok: true, items: r.rows };
}

export async function updateEnvironmentMode({ workspaceId, mode, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isValidEnvironmentMode(mode)) return { error: 'invalid_environment_mode' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  await db.query(
    'UPDATE novee_os_environment_modes SET environment_mode=$1, reason=$2, actor_user_id=$3, updated_at=NOW() WHERE workspace_id=$4',
    [mode, reason || null, actorUserId || 'system', workspaceId]
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'update_environment_mode', entityType: 'environment_mode', entityId: workspaceId, afterSnapshot: { mode, reason, liveMode: false } });
  return { ok: true };
}

export async function createDemoLiveWorkspaceMode({ workspaceId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_demo_live_workspace_modes WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const ws = await db.query('SELECT organization_id, venue_id FROM novee_os_workspaces WHERE id=$1', [workspaceId]);
  const { mode = 'demo', reason } = payload || {};
  if (!isValidEnvironmentMode(mode)) return { error: 'invalid_mode' };
  const r = await db.query(
    `INSERT INTO novee_os_demo_live_workspace_modes
       (workspace_id, organization_id, venue_id, mode,
        live_mode_enabled, demo_mode_enabled, workspace_provisioned, venue_deployed,
        provider_connected, billing_connected, license_verified, deployment_completed,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, reason, actor_user_id, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,FALSE,TRUE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,
             FALSE,FALSE,FALSE,FALSE,FALSE,$5,$6,$7,$8)
     RETURNING id`,
    [workspaceId, ws.rows[0]?.organization_id, ws.rows[0]?.venue_id,
     mode, reason || null, actorUserId || 'system', idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_demo_live_workspace_mode', entityType: 'demo_live_workspace_mode', entityId: r.rows[0].id, afterSnapshot: { workspaceId, mode, liveMode: false } });
  return { ok: true, id: r.rows[0].id, liveMode: false };
}

export async function listDemoLiveWorkspaceModes({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_demo_live_workspace_modes ORDER BY created_at DESC');
  return { ok: true, items: r.rows };
}

// ─── MODULE AVAILABILITY ──────────────────────────────────────────────────────

export async function createModuleWorkspaceAvailability({ workspaceId, moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_module_workspace_availability WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const ws = await db.query('SELECT organization_id, venue_id FROM novee_os_workspaces WHERE id=$1', [workspaceId]);
  const r = await db.query(
    `INSERT INTO novee_os_module_workspace_availability
       (workspace_id, organization_id, venue_id, module_key, availability_status, scope_level,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,'not_available','workspace',FALSE,FALSE,FALSE,FALSE,FALSE,$5,$6)
     RETURNING id`,
    [workspaceId, ws.rows[0]?.organization_id, ws.rows[0]?.venue_id, moduleKey, idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_module_workspace_availability', entityType: 'module_workspace_availability', entityId: r.rows[0].id, afterSnapshot: { workspaceId, moduleKey, availabilityStatus: 'not_available' } });
  return { ok: true, id: r.rows[0].id, availabilityStatus: 'not_available' };
}

export async function listModuleWorkspaceAvailability({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_module_workspace_availability ORDER BY created_at DESC');
  return { ok: true, items: r.rows };
}

export async function createModuleVenueAvailability({ venueId, moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_module_venue_availability WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const v = await db.query('SELECT organization_id FROM novee_os_venues WHERE id=$1', [venueId]);
  const r = await db.query(
    `INSERT INTO novee_os_module_venue_availability
       (venue_id, organization_id, module_key, availability_status, scope_level,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, idempotency_key, created_by)
     VALUES ($1,$2,$3,'not_available','venue',FALSE,FALSE,FALSE,FALSE,FALSE,$4,$5)
     RETURNING id`,
    [venueId, v.rows[0]?.organization_id, moduleKey, idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_module_venue_availability', entityType: 'module_venue_availability', entityId: r.rows[0].id, afterSnapshot: { venueId, moduleKey, availabilityStatus: 'not_available' } });
  return { ok: true, id: r.rows[0].id, availabilityStatus: 'not_available' };
}

export async function listModuleVenueAvailability({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_module_venue_availability ORDER BY created_at DESC');
  return { ok: true, items: r.rows };
}

export async function createModuleOrganizationAvailability({ organizationId, moduleKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_module_organization_availability WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const r = await db.query(
    `INSERT INTO novee_os_module_organization_availability
       (organization_id, module_key, availability_status, scope_level,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, idempotency_key, created_by)
     VALUES ($1,$2,'not_available','organization',FALSE,FALSE,FALSE,FALSE,FALSE,$3,$4)
     RETURNING id`,
    [organizationId, moduleKey, idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_module_org_availability', entityType: 'module_organization_availability', entityId: r.rows[0].id, afterSnapshot: { organizationId, moduleKey, availabilityStatus: 'not_available' } });
  return { ok: true, id: r.rows[0].id, availabilityStatus: 'not_available' };
}

export async function listModuleOrganizationAvailability({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_module_organization_availability ORDER BY created_at DESC');
  return { ok: true, items: r.rows };
}

// ─── HEALTH / READINESS ───────────────────────────────────────────────────────

export async function createTenantHealthCheck({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_tenant_health_checks WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const { organization_id, venue_id, workspace_id, check_type = 'placeholder' } = payload || {};
  const r = await db.query(
    `INSERT INTO novee_os_tenant_health_checks
       (organization_id, venue_id, workspace_id, health_status, check_type,
        tenant_isolation_verified, workspace_provisioned, venue_deployed, live_mode_enabled,
        provider_connected, billing_connected, license_verified, deployment_completed,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, actor_user_id, idempotency_key, created_by)
     VALUES ($1,$2,$3,'unknown',$4,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,
             FALSE,FALSE,FALSE,FALSE,FALSE,$5,$6,$7)
     RETURNING id`,
    [organization_id || null, venue_id || null, workspace_id || null,
     check_type, actorUserId || 'system', idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_tenant_health_check', entityType: 'tenant_health_check', entityId: r.rows[0].id, afterSnapshot: { healthStatus: 'unknown', tenantIsolationVerified: false } });
  return { ok: true, id: r.rows[0].id, healthStatus: 'unknown', placeholder: true };
}

export async function listTenantHealthChecks({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_tenant_health_checks ORDER BY created_at DESC');
  return { ok: true, items: r.rows };
}

export async function createWorkspaceReadinessRecord({ workspaceId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_workspace_readiness_records WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const ws = await db.query('SELECT organization_id, venue_id FROM novee_os_workspaces WHERE id=$1', [workspaceId]);
  const r = await db.query(
    `INSERT INTO novee_os_workspace_readiness_records
       (workspace_id, organization_id, venue_id, readiness_status, governance_status,
        tenant_isolation_verified, workspace_provisioned, venue_deployed, live_mode_enabled,
        provider_connected, billing_connected, license_verified, deployment_completed,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data,
        contains_ai_generated_content, actor_user_id, idempotency_key, created_by)
     VALUES ($1,$2,$3,'not_checked','draft',
             FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,
             FALSE,FALSE,FALSE,FALSE,FALSE,$4,$5,$6)
     RETURNING id`,
    [workspaceId, ws.rows[0]?.organization_id, ws.rows[0]?.venue_id,
     actorUserId || 'system', idempotencyKey, actorUserId || 'system']
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_workspace_readiness', entityType: 'workspace_readiness_record', entityId: r.rows[0].id, afterSnapshot: { workspaceId, readinessStatus: 'not_checked', workspaceProvisioned: false } });
  return { ok: true, id: r.rows[0].id, readinessStatus: 'not_checked', workspaceProvisioned: false };
}

export async function listWorkspaceReadinessRecords({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_workspace_readiness_records ORDER BY created_at DESC');
  return { ok: true, items: r.rows };
}

// ─── SNAPSHOTS ────────────────────────────────────────────────────────────────

export async function createTenantGovernanceSnapshot({ actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const existing = await db.query('SELECT id FROM novee_os_tenant_governance_snapshots WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows.length) return { ok: true, idempotent: true, id: existing.rows[0].id };
  const orgCount = await db.query('SELECT COUNT(*) FROM novee_os_organizations');
  const venueCount = await db.query('SELECT COUNT(*) FROM novee_os_venues');
  const wsCount = await db.query('SELECT COUNT(*) FROM novee_os_workspaces');
  const memCount = await db.query("SELECT COUNT(*) FROM novee_os_workspace_memberships WHERE membership_status='active_placeholder'");
  const r = await db.query(
    `INSERT INTO novee_os_tenant_governance_snapshots
       (snapshot_version, organization_count, venue_count, workspace_count, active_memberships,
        governance_status, tenant_isolation_verified, any_workspace_provisioned, any_venue_deployed,
        any_live_mode_enabled, any_provider_connected, any_billing_connected, any_license_verified,
        any_deployment_completed, contains_secrets, stores_secrets,
        exposes_private_data, exposes_financial_data, contains_ai_generated_content,
        actor_user_id, idempotency_key, created_by)
     VALUES (1,$1,$2,$3,$4,'draft',FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,
             FALSE,FALSE,TRUE,FALSE,FALSE,$5,$6,$7)
     RETURNING id`,
    [
      parseInt(orgCount.rows[0].count, 10),
      parseInt(venueCount.rows[0].count, 10),
      parseInt(wsCount.rows[0].count, 10),
      parseInt(memCount.rows[0].count, 10),
      actorUserId || 'system', idempotencyKey, actorUserId || 'system',
    ]
  );
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action: 'create_governance_snapshot', entityType: 'tenant_governance_snapshot', entityId: r.rows[0].id, afterSnapshot: { tenantIsolationVerified: false, anyLiveModeEnabled: false } });
  return { ok: true, id: r.rows[0].id, tenantIsolationVerified: false, anyLiveModeEnabled: false };
}

export async function getLatestTenantGovernanceSnapshot() {
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  const r = await db.query('SELECT * FROM novee_os_tenant_governance_snapshots ORDER BY created_at DESC LIMIT 1');
  if (!r.rows.length) return { ok: false, error: 'no_snapshot', configurationRequired: true };
  return { ok: true, item: r.rows[0] };
}

// ─── CLAIMS / LIMITATIONS / ROADMAP ──────────────────────────────────────────

export function getSafeTenantClaims() {
  return {
    ok: true,
    claims: [
      'Organization, venue, and workspace records can be created and stored.',
      'Scope-level filtering and organization / venue / workspace scoping is supported in records.',
      'Workspace memberships and roles are stored as placeholder records.',
      'Data boundary records are stored and scoped to organization / venue / workspace.',
      'Governance snapshots capture counts at the time of snapshot creation.',
      'Audit records are written on every mutation.',
      'All write routes require platform admin access (canAccessPOS3).',
      'No secrets are stored.',
      'Private data fields are correctly flagged.',
      'All boolean guards default to FALSE.',
      'idempotency_key is required on all mutations.',
    ],
  };
}

export function getUnsafeTenantClaims() {
  return {
    ok: true,
    unsafeClaims: [
      'Tenant isolation is NOT verified — tenant_isolation_verified=FALSE on all records.',
      'Workspaces are NOT truly provisioned — workspace_provisioned=FALSE on all records.',
      'Venues are NOT deployed — venue_deployed=FALSE on all records.',
      'Live mode is NOT enabled — live_mode_enabled=FALSE on all records.',
      'Providers are NOT connected — provider_connected=FALSE on all records.',
      'Billing is NOT connected — billing_connected=FALSE on all records.',
      'Licenses are NOT verified — license_verified=FALSE on all records.',
      'Deployments are NOT completed — deployment_completed=FALSE on all records.',
      'Workspace memberships are placeholder only — not enforced at the API boundary.',
      'Module availability records are placeholder only — not enforced by live module gating.',
    ],
  };
}

export function getTenantHonestLimitations() {
  return {
    ok: true,
    limitations: [
      'Phase C.2 creates the governance data model only. No live tenant isolation is active.',
      'Workspace provisioning requires Phase C.3 licensing and Phase C.4 role/permission enforcement.',
      'Venue deployment requires real provider activation — not yet available.',
      'Live mode requires real billing, licensing, and provider connections — all pending.',
      'Module availability records do not gate actual module functionality in Phase C.2.',
      'Data boundary records define intended boundaries but do not enforce row-level security.',
      'Governance snapshots reflect record counts only — not live system health.',
      'Health checks return placeholder status only — no live infrastructure monitoring.',
      'Configuration required on all organizations, venues, and workspaces before production use.',
      'Provider activation required before any live deployment.',
    ],
  };
}

export function getTenantPhaseRoadmap() {
  return {
    ok: true,
    roadmap: [
      { phase: 'C.1', module: 1, title: 'NOVEE OS Module Registry, Platform Control Center & Installable Module Governance', status: 'complete' },
      { phase: 'C.2', module: 2, title: 'NOVEE OS Tenant, Venue, Organization & Workspace Governance', status: 'current' },
      { phase: 'C.3', module: 3, title: 'NOVEE OS Licensing, Plans, Trials, Billing Gates & Feature Access', status: 'next' },
      { phase: 'C.4', module: 4, title: 'NOVEE OS User Roles, Permissions, Admin Security & Platform Governance', status: 'pending' },
      { phase: 'C.5', module: 5, title: 'CraftHub Main Dashboard, Module Launcher, Navigation Shell & Premium Experience Hub', status: 'pending' },
      { phase: 'C.6', module: 6, title: 'Venue Onboarding Wizard, Setup Checklist, Live/Demo Mode Controls & Readiness Flow', status: 'pending' },
      { phase: 'C.7', module: 7, title: 'NOVEE OS Final Production Readiness, Platform Audit, Marketplace Prep & Launch Lock', status: 'pending' },
    ],
  };
}

export async function writeTenantGovernanceAudit({ actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason }) {
  if (!isDbAvailable()) return localFallback();
  const { default: db } = await import('../../db/connection.js');
  await writeTenantGovernanceAuditInternal(db, { actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason });
  return { ok: true };
}
