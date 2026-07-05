/**
 * Phase C.4 / Module 4 of 7 — NOVEE OS Security Governance Service
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * contains_secrets: false, stores_secrets: false — hardcoded; security records never hold secrets
 */

import { isDbAvailable, getDb } from '../../db/connection.js';
import {
  isValidUserStatus, isValidRoleStatus, isValidPermissionStatus,
  isValidAssignmentStatus, isValidApprovalStatus, isValidSecurityStatus,
  isValidDecisionStatus, isValidReviewStatus,
} from './noveeOSSecurityContracts.js';

const AREA = 'novee-os-security-governance';

function localFallback(extra = {}) {
  return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA, ...extra };
}

async function writeSecurityAuditInternal(db, { actorUserId, userId, organizationId, venueId, workspaceId, moduleKey, routePath, featureKey, roleKey, permissionKey, sensitiveActionKey, approvalRequestId, scopeLevel = 'platform', action, entityType, entityId, beforeSnapshot, afterSnapshot, reason, idempotencyKey }) {
  // contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets
  try {
    await db.query(
      `INSERT INTO novee_os_platform_security_audit
        (actor_user_id, user_id, organization_id, venue_id, workspace_id, module_key, route_path, feature_key, role_key, permission_key, sensitive_action_key, approval_request_id, scope_level, action, entity_type, entity_id, before_snapshot, after_snapshot, reason, idempotency_key, contains_secrets, stores_secrets)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,FALSE,FALSE)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [actorUserId || null, userId || null, organizationId || null, venueId || null, workspaceId || null, moduleKey || null, routePath || null, featureKey || null, roleKey || null, permissionKey || null, sensitiveActionKey || null, approvalRequestId || null, scopeLevel, action, entityType || null, entityId || null, beforeSnapshot ? JSON.stringify(beforeSnapshot) : null, afterSnapshot ? JSON.stringify(afterSnapshot) : null, reason || null, idempotencyKey || null]
    );
  } catch (_) { /* audit failure must not surface to callers */ }
}

// ─── Platform Users ──────────────────────────────────────────────────────────

export async function createPlatformUser({ payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_platform_users WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_platform_users (user_id, organization_id, venue_id, workspace_id, email, display_name, user_status, role_key, scope_level, idempotency_key, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [payload.userId || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.email || null, payload.displayName || null, 'invited_placeholder', payload.roleKey || null, payload.scopeLevel || 'platform', idempotencyKey, actorUserId || null]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_platform_user', entityType: 'platform_user', entityId: rows[0].id, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id, user_status: 'invited_placeholder' };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listPlatformUsers({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_platform_users ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function getPlatformUser({ userId } = {}) {
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_platform_users WHERE user_id=$1 OR id=$1 LIMIT 1', [userId]);
    if (!rows.length) return { ok: false, error: 'not_found' };
    return { ok: true, item: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updatePlatformUserStatus({ userId, status, actorUserId, reason, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isValidUserStatus(status)) return { ok: false, error: 'invalid_user_status' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    await db.query('UPDATE novee_os_platform_users SET user_status=$1, updated_by=$2, updated_at=NOW() WHERE user_id=$3 OR id=$3', [status, actorUserId || null, userId]);
    await writeSecurityAuditInternal(db, { actorUserId, action: 'update_platform_user_status', entityType: 'platform_user', afterSnapshot: { status, reason }, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, user_status: status };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createUserProfile({ userId, payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_user_profiles WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_user_profiles (user_id, organization_id, venue_id, workspace_id, display_name, timezone, locale, contact_email, idempotency_key, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [userId, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.displayName || null, payload.timezone || null, payload.locale || null, payload.contactEmail || null, idempotencyKey, actorUserId || null]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_user_profile', entityType: 'user_profile', entityId: rows[0].id, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function getUserProfile({ userId } = {}) {
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_user_profiles WHERE user_id=$1 LIMIT 1', [userId]);
    if (!rows.length) return { ok: false, error: 'not_found' };
    return { ok: true, item: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── Roles ───────────────────────────────────────────────────────────────────

export async function createRoleCatalogEntry({ payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_role_catalog WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_role_catalog (role_key, role_name, role_scope, organization_id, venue_id, workspace_id, role_status, scope_level, permission_group, idempotency_key, actor_user_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9,$10,$10) RETURNING id`,
      [payload.roleKey, payload.roleName, payload.roleScope || 'custom', payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.scopeLevel || 'platform', payload.permissionGroup || null, idempotencyKey, actorUserId || null]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_role', entityType: 'role_catalog', entityId: rows[0].id, roleKey: payload.roleKey, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id, role_status: 'draft' };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listRoleCatalog({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_role_catalog ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function updateRoleStatus({ roleKey, status, actorUserId, reason, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isValidRoleStatus(status)) return { ok: false, error: 'invalid_role_status' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    await db.query('UPDATE novee_os_role_catalog SET role_status=$1, updated_by=$2, updated_at=NOW() WHERE role_key=$3', [status, actorUserId || null, roleKey]);
    await writeSecurityAuditInternal(db, { actorUserId, action: 'update_role_status', entityType: 'role_catalog', roleKey, afterSnapshot: { status, reason }, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, role_status: status };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export async function createPermissionCatalogEntry({ payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_permission_catalog WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_permission_catalog (permission_key, permission_name, permission_group, module_key, route_path, feature_key, organization_id, venue_id, workspace_id, permission_status, scope_level, idempotency_key, actor_user_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,$11,$12,$12) RETURNING id`,
      [payload.permissionKey, payload.permissionName, payload.permissionGroup || null, payload.moduleKey || null, payload.routePath || null, payload.featureKey || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.scopeLevel || 'platform', idempotencyKey, actorUserId || null]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_permission', entityType: 'permission_catalog', entityId: rows[0].id, permissionKey: payload.permissionKey, moduleKey: payload.moduleKey, routePath: payload.routePath, featureKey: payload.featureKey, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id, permission_status: 'draft' };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listPermissionCatalog({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_permission_catalog ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function updatePermissionStatus({ permissionKey, status, actorUserId, reason, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isValidPermissionStatus(status)) return { ok: false, error: 'invalid_permission_status' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    await db.query('UPDATE novee_os_permission_catalog SET permission_status=$1, updated_by=$2, updated_at=NOW() WHERE permission_key=$3', [status, actorUserId || null, permissionKey]);
    await writeSecurityAuditInternal(db, { actorUserId, action: 'update_permission_status', entityType: 'permission_catalog', permissionKey, afterSnapshot: { status, reason }, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, permission_status: status };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createPermissionGroup({ payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_permission_groups WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_permission_groups (group_key, group_name, organization_id, venue_id, workspace_id, scope_level, idempotency_key, actor_user_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING id`,
      [payload.groupKey, payload.groupName, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.scopeLevel || 'platform', idempotencyKey, actorUserId || null]
    );
    return { ok: true, id: rows[0].id };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listPermissionGroups({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_permission_groups ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

// ─── Assignments ─────────────────────────────────────────────────────────────

export async function createRolePermissionAssignment({ roleKey, permissionKey, payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_role_permission_assignments WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_role_permission_assignments (role_key, permission_key, organization_id, venue_id, workspace_id, assignment_status, scope_level, idempotency_key, actor_user_id, created_by)
       VALUES ($1,$2,$3,$4,$5,'active_placeholder',$6,$7,$8,$8) RETURNING id`,
      [roleKey, permissionKey, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.scopeLevel || 'platform', idempotencyKey, actorUserId || null]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_role_permission_assignment', entityType: 'role_permission_assignment', entityId: rows[0].id, roleKey, permissionKey, afterSnapshot: { roleKey, permissionKey }, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id, assignment_status: 'active_placeholder' };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listRolePermissionAssignments({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_role_permission_assignments ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function createUserRoleAssignment({ userId, roleKey, payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_user_role_assignments WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_user_role_assignments (user_id, role_key, organization_id, venue_id, workspace_id, assignment_status, scope_level, idempotency_key, actor_user_id, created_by)
       VALUES ($1,$2,$3,$4,$5,'pending_placeholder',$6,$7,$8,$8) RETURNING id`,
      [userId, roleKey, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.scopeLevel || 'platform', idempotencyKey, actorUserId || null]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_user_role_assignment', entityType: 'user_role_assignment', entityId: rows[0].id, roleKey, afterSnapshot: { userId, roleKey }, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id, assignment_status: 'pending_placeholder' };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listUserRoleAssignments({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_user_role_assignments ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function updateUserRoleAssignmentStatus({ assignmentId, status, actorUserId, reason, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isValidAssignmentStatus(status)) return { ok: false, error: 'invalid_assignment_status' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    await db.query('UPDATE novee_os_user_role_assignments SET assignment_status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3', [status, actorUserId || null, assignmentId]);
    await writeSecurityAuditInternal(db, { actorUserId, action: 'update_user_role_assignment_status', entityType: 'user_role_assignment', afterSnapshot: { status, reason }, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, assignment_status: status };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createUserAccessGrant({ userId, payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_user_access_grants WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_user_access_grants (user_id, permission_key, role_key, module_key, route_path, feature_key, organization_id, venue_id, workspace_id, scope_level, assignment_status, idempotency_key, actor_user_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending_placeholder',$11,$12,$12) RETURNING id`,
      [userId, payload.permissionKey || null, payload.roleKey || null, payload.moduleKey || null, payload.routePath || null, payload.featureKey || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.scopeLevel || 'platform', idempotencyKey, actorUserId || null]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_user_access_grant', entityType: 'user_access_grant', entityId: rows[0].id, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id, assignment_status: 'pending_placeholder' };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listUserAccessGrants({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_user_access_grants ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

// ─── Permission Rules ─────────────────────────────────────────────────────────

export async function createModulePermissionRule({ moduleKey, payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_module_permission_rules WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_module_permission_rules (module_key, permission_key, role_key, organization_id, venue_id, workspace_id, scope_level, idempotency_key, actor_user_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING id`,
      [moduleKey, payload.permissionKey || null, payload.roleKey || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.scopeLevel || 'module', idempotencyKey, actorUserId || null]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_module_permission_rule', entityType: 'module_permission_rule', entityId: rows[0].id, moduleKey, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listModulePermissionRules({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_module_permission_rules ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function createRoutePermissionRule({ routePath, payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_route_permission_rules WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_route_permission_rules (route_path, permission_key, role_key, module_key, organization_id, venue_id, workspace_id, scope_level, idempotency_key, actor_user_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING id`,
      [routePath, payload.permissionKey || null, payload.roleKey || null, payload.moduleKey || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.scopeLevel || 'route', idempotencyKey, actorUserId || null]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_route_permission_rule', entityType: 'route_permission_rule', entityId: rows[0].id, routePath, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listRoutePermissionRules({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_route_permission_rules ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function createFeaturePermissionRule({ featureKey, payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_feature_permission_rules WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_feature_permission_rules (feature_key, permission_key, role_key, module_key, organization_id, venue_id, workspace_id, scope_level, idempotency_key, actor_user_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING id`,
      [featureKey, payload.permissionKey || null, payload.roleKey || null, payload.moduleKey || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.scopeLevel || 'feature', idempotencyKey, actorUserId || null]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_feature_permission_rule', entityType: 'feature_permission_rule', entityId: rows[0].id, featureKey, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listFeaturePermissionRules({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_feature_permission_rules ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export async function createAdminApprovalRequest({ payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_admin_approval_requests WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_admin_approval_requests (user_id, actor_user_id, organization_id, venue_id, workspace_id, sensitive_action_key, approval_status, scope_level, reason, idempotency_key, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$2) RETURNING id, approval_request_id`,
      [payload.userId || null, actorUserId || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.sensitiveActionKey || null, payload.scopeLevel || 'platform', payload.reason || null, idempotencyKey]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_admin_approval_request', entityType: 'admin_approval_request', entityId: rows[0].id, approvalRequestId: rows[0].approval_request_id, sensitiveActionKey: payload.sensitiveActionKey, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id, approval_request_id: rows[0].approval_request_id, approval_status: 'pending' };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listAdminApprovalRequests({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_admin_approval_requests ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function decideAdminApprovalRequest({ approvalRequestId, decision, actorUserId, reason, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isValidApprovalStatus(decision)) return { ok: false, error: 'invalid_approval_status' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    await db.query('UPDATE novee_os_admin_approval_requests SET approval_status=$1, decision_reason=$2, decided_by=$3, updated_at=NOW() WHERE approval_request_id=$4', [decision, reason || null, actorUserId || null, approvalRequestId]);
    await writeSecurityAuditInternal(db, { actorUserId, action: 'decide_admin_approval', entityType: 'admin_approval_request', approvalRequestId, afterSnapshot: { decision, reason }, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, approval_status: decision };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createSensitiveActionRequest({ payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_sensitive_action_requests WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_sensitive_action_requests (sensitive_action_key, user_id, actor_user_id, organization_id, venue_id, workspace_id, approval_request_id, approval_status, scope_level, reason, idempotency_key, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9,$10,$3) RETURNING id`,
      [payload.sensitiveActionKey, payload.userId || null, actorUserId || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.approvalRequestId || null, payload.scopeLevel || 'platform', payload.reason || null, idempotencyKey]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_sensitive_action_request', entityType: 'sensitive_action_request', entityId: rows[0].id, sensitiveActionKey: payload.sensitiveActionKey, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id, approval_status: 'pending' };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listSensitiveActionRequests({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_sensitive_action_requests ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function decideSensitiveActionRequest({ sensitiveActionRequestId, decision, actorUserId, reason, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isValidApprovalStatus(decision)) return { ok: false, error: 'invalid_approval_status' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    await db.query('UPDATE novee_os_sensitive_action_requests SET approval_status=$1, decision_reason=$2, decided_by=$3, updated_at=NOW() WHERE id=$4', [decision, reason || null, actorUserId || null, sensitiveActionRequestId]);
    await writeSecurityAuditInternal(db, { actorUserId, action: 'decide_sensitive_action', entityType: 'sensitive_action_request', sensitiveActionKey: sensitiveActionRequestId, afterSnapshot: { decision, reason }, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, approval_status: decision };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── Decisions / Denials ──────────────────────────────────────────────────────

export async function createPermissionDecisionRecord({ payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_permission_decision_records WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_permission_decision_records (user_id, actor_user_id, module_key, route_path, feature_key, permission_key, role_key, organization_id, venue_id, workspace_id, decision_status, scope_level, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [payload.userId || null, actorUserId || null, payload.moduleKey || null, payload.routePath || null, payload.featureKey || null, payload.permissionKey || null, payload.roleKey || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.decisionStatus || 'allowed_placeholder', payload.scopeLevel || 'platform', idempotencyKey]
    );
    return { ok: true, id: rows[0].id, decision_status: payload.decisionStatus || 'allowed_placeholder', permission_enforced: false };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listPermissionDecisionRecords({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_permission_decision_records ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function evaluatePermissionDecisionPlaceholder({ userId, moduleKey, routePath, featureKey, permissionKey } = {}) {
  return {
    ok: true,
    localPreview: true,
    decision: 'allowed_placeholder',
    permission_enforced: false,
    sso_connected: false,
    mfa_enforced: false,
    device_trust_enforced: false,
    ip_allowlist_enforced: false,
    security_provider_connected: false,
    compliance_certified: false,
    note: 'Placeholder decision only. Real permission enforcement requires provider activation.',
    userId, moduleKey, routePath, featureKey, permissionKey,
  };
}

export async function createAccessDenialRecord({ payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_access_denial_records WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_access_denial_records (user_id, actor_user_id, module_key, route_path, feature_key, permission_key, role_key, organization_id, venue_id, workspace_id, denial_reason, scope_level, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [payload.userId || null, actorUserId || null, payload.moduleKey || null, payload.routePath || null, payload.featureKey || null, payload.permissionKey || null, payload.roleKey || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.denialReason || null, payload.scopeLevel || 'platform', idempotencyKey]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_access_denial', entityType: 'access_denial_record', entityId: rows[0].id, moduleKey: payload.moduleKey, routePath: payload.routePath, featureKey: payload.featureKey, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listAccessDenialRecords({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_access_denial_records ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

// ─── Security Placeholders ───────────────────────────────────────────────────

async function _createSecurityPlaceholder(table, payload, actorUserId, idempotencyKey) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query(`SELECT id FROM ${table} WHERE idempotency_key=$1`, [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO ${table} (provider_key, organization_id, venue_id, workspace_id, scope_level, security_status, idempotency_key, actor_user_id, created_by)
       VALUES ($1,$2,$3,$4,$5,'not_configured',$6,$7,$7) RETURNING id`,
      [payload.providerKey || table.replace('novee_os_','').replace('_placeholders','_placeholder'), payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.scopeLevel || 'platform', idempotencyKey, actorUserId || null]
    );
    return { ok: true, id: rows[0].id, security_status: 'not_configured', sso_connected: false, mfa_enforced: false, device_trust_enforced: false, ip_allowlist_enforced: false, security_provider_connected: false, compliance_certified: false };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function _listSecurityPlaceholder(table) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 100`);
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export const createSessionPolicyPlaceholder  = ({ payload = {}, actorUserId, idempotencyKey } = {}) => _createSecurityPlaceholder('novee_os_session_policy_placeholders', payload, actorUserId, idempotencyKey);
export const listSessionPolicyPlaceholders   = () => _listSecurityPlaceholder('novee_os_session_policy_placeholders');
export const createMfaPolicyPlaceholder      = ({ payload = {}, actorUserId, idempotencyKey } = {}) => _createSecurityPlaceholder('novee_os_mfa_policy_placeholders', payload, actorUserId, idempotencyKey);
export const listMfaPolicyPlaceholders       = () => _listSecurityPlaceholder('novee_os_mfa_policy_placeholders');
export const createSsoProviderPlaceholder    = ({ payload = {}, actorUserId, idempotencyKey } = {}) => _createSecurityPlaceholder('novee_os_sso_provider_placeholders', payload, actorUserId, idempotencyKey);
export const listSsoProviderPlaceholders     = () => _listSecurityPlaceholder('novee_os_sso_provider_placeholders');
export const createDeviceTrustPlaceholder    = ({ payload = {}, actorUserId, idempotencyKey } = {}) => _createSecurityPlaceholder('novee_os_device_trust_placeholders', payload, actorUserId, idempotencyKey);
export const listDeviceTrustPlaceholders     = () => _listSecurityPlaceholder('novee_os_device_trust_placeholders');
export const createIpAllowlistPlaceholder    = ({ payload = {}, actorUserId, idempotencyKey } = {}) => _createSecurityPlaceholder('novee_os_ip_allowlist_placeholders', payload, actorUserId, idempotencyKey);
export const listIpAllowlistPlaceholders     = () => _listSecurityPlaceholder('novee_os_ip_allowlist_placeholders');

// ─── Security Events / Reviews ────────────────────────────────────────────────

export async function createSecurityEventRecord({ payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_security_event_records WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_security_event_records (user_id, actor_user_id, organization_id, venue_id, workspace_id, module_key, route_path, feature_key, permission_key, sensitive_action_key, security_status, scope_level, event_description, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'not_configured',$11,$12,$13) RETURNING id`,
      [payload.userId || null, actorUserId || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.moduleKey || null, payload.routePath || null, payload.featureKey || null, payload.permissionKey || null, payload.sensitiveActionKey || null, payload.scopeLevel || 'platform', payload.eventDescription || null, idempotencyKey]
    );
    return { ok: true, id: rows[0].id, notification_delivered: false };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listSecurityEventRecords({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_security_event_records ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function createGovernanceReviewRecord({ payload = {}, actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_governance_review_records WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const { rows } = await db.query(
      `INSERT INTO novee_os_governance_review_records (user_id, actor_user_id, organization_id, venue_id, workspace_id, scope_level, review_status, review_type, review_notes, idempotency_key, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9,$2) RETURNING id`,
      [payload.userId || null, actorUserId || null, payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.scopeLevel || 'platform', payload.reviewType || null, payload.reviewNotes || null, idempotencyKey]
    );
    await writeSecurityAuditInternal(db, { actorUserId, action: 'create_governance_review', entityType: 'governance_review_record', entityId: rows[0].id, afterSnapshot: payload, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, id: rows[0].id, review_status: 'draft' };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listGovernanceReviewRecords({ filters = {} } = {}) {
  if (!isDbAvailable()) return localFallback({ items: [] });
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_governance_review_records ORDER BY created_at DESC LIMIT 100');
    return { ok: true, items: rows };
  } catch (e) { return { ok: false, error: e.message, items: [] }; }
}

export async function updateGovernanceReviewStatus({ reviewId, status, actorUserId, reason, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isValidReviewStatus(status)) return { ok: false, error: 'invalid_review_status' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    await db.query('UPDATE novee_os_governance_review_records SET review_status=$1, decision_reason=$2, reviewed_by=$3, updated_at=NOW() WHERE id=$4', [status, reason || null, actorUserId || null, reviewId]);
    await writeSecurityAuditInternal(db, { actorUserId, action: 'update_governance_review_status', entityType: 'governance_review_record', afterSnapshot: { status, reason }, idempotencyKey: idempotencyKey + '_audit' });
    return { ok: true, review_status: status };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── Snapshots ────────────────────────────────────────────────────────────────

export async function createPlatformSecuritySnapshot({ actorUserId, idempotencyKey } = {}) {
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' };
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows: existing } = await db.query('SELECT id FROM novee_os_platform_security_snapshots WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) return { ok: true, idempotent: true, id: existing[0].id };
    const snapshotData = { sso_connected: false, mfa_enforced: false, device_trust_enforced: false, ip_allowlist_enforced: false, security_provider_connected: false, compliance_certified: false, permission_enforced: false, captured_at: new Date().toISOString() };
    const { rows } = await db.query(
      `INSERT INTO novee_os_platform_security_snapshots (actor_user_id, snapshot_data, sso_connected, mfa_enforced, device_trust_enforced, ip_allowlist_enforced, security_provider_connected, compliance_certified, permission_enforced, idempotency_key, created_by, stores_secrets, contains_secrets)
       VALUES ($1,$2,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,$3,$1,FALSE,FALSE) RETURNING id`,
      [actorUserId || null, JSON.stringify(snapshotData), idempotencyKey]
    );
    return { ok: true, id: rows[0].id, snapshot: snapshotData };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function getLatestPlatformSecuritySnapshot() {
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  try {
    const { rows } = await db.query('SELECT * FROM novee_os_platform_security_snapshots ORDER BY created_at DESC LIMIT 1');
    if (!rows.length) return { ok: true, item: null, note: 'No snapshot yet.' };
    return { ok: true, item: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── Claims ───────────────────────────────────────────────────────────────────

export function getSafeSecurityClaims() {
  return {
    ok: true,
    claims: [
      'Role catalog, permission catalog, and governance records are created and stored safely.',
      'All security provider states are tracked as placeholder only until a real provider is connected.',
      'No secrets, credentials, or sensitive tokens are stored in this security governance layer.',
      'User role assignments and access grants are recorded with full audit trail.',
      'Permission decision records are placeholder only — real enforcement requires provider activation.',
    ],
    sso_connected: false,
    mfa_enforced: false,
    device_trust_enforced: false,
    ip_allowlist_enforced: false,
    security_provider_connected: false,
    compliance_certified: false,
    contains_secrets: false,
    stores_secrets: false,
  };
}

export function getUnsafeSecurityClaims() {
  return {
    ok: true,
    notLive: [
      'Real SSO connection',
      'Real MFA enforcement',
      'Real device trust enforcement',
      'Real IP allowlist enforcement',
      'Real compliance certification',
      'Real SOC2 readiness',
      'Real security provider connection',
      'Real email or SMS security notifications',
      'Real identity provider integration',
      'Real full permission enforcement beyond placeholder decision records',
    ],
    sso_connected: false,
    mfa_enforced: false,
    security_provider_connected: false,
    compliance_certified: false,
    notification_delivered: false,
    permission_enforced: false,
  };
}

export function getSecurityHonestLimitations() {
  return {
    ok: true,
    limitations: [
      'A real security provider must be connected externally before SSO, MFA, or device trust can be enforced.',
      'All session policies, MFA policies, SSO providers, device trust, and IP allowlists are placeholder records only.',
      'Permission enforcement is a placeholder decision layer only. Real enforcement requires provider activation.',
      'Compliance certification is not implemented and has not been audited by any external party.',
      'Security event notifications are not delivered. Notification provider integration is required.',
    ],
  };
}

export function getSecurityPhaseRoadmap() {
  return {
    ok: true,
    roadmap: [
      { phase: 'C.1', module: 1, title: 'Module Registry', status: 'complete' },
      { phase: 'C.2', module: 2, title: 'Tenant / Venue / Org / Workspace Governance', status: 'complete' },
      { phase: 'C.3', module: 3, title: 'Licensing / Billing Gates', status: 'complete' },
      { phase: 'C.4', module: 4, title: 'User Roles / Permissions / Security', status: 'current' },
      { phase: 'C.5', module: 5, title: 'CraftHub Launcher', status: 'next' },
      { phase: 'C.6', module: 6, title: 'Venue Onboarding', status: 'pending' },
      { phase: 'C.7', module: 7, title: 'Final Platform Launch Lock', status: 'pending' },
    ],
    module: '4 of 7',
  };
}

// ─── Audit (public) ──────────────────────────────────────────────────────────

export async function writeSecurityAudit({ actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason } = {}) {
  if (!isDbAvailable()) return localFallback();
  const db = getDb();
  await writeSecurityAuditInternal(db, { actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason, idempotencyKey: `${action}_${Date.now()}` });
  return { ok: true };
}
