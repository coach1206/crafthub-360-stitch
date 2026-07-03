/**
 * LOCC — Role Safety Gateway
 * Enforces role-based access for all operations control actions.
 * No guest/customer/server/bartender/kitchen_staff/humidor_staff access to control operations.
 */

export const OWNER_ROLES    = new Set(['owner', 'admin'])
export const MANAGER_ROLES  = new Set(['manager', 'owner', 'admin'])
export const STAFF_ROLES    = new Set(['staff', 'manager', 'owner', 'admin'])
export const VIEWER_ROLES   = new Set(['manager', 'owner', 'admin', 'auditor'])

export const BLOCKED_ROLES  = new Set([
  'guest','customer','server','bartender','kitchen_staff',
  'humidor_staff','cashier','host','busser',
])

export function validateOwnerControl(actorRole) {
  const allowed = OWNER_ROLES.has(actorRole)
  return {
    allowed,
    role:   actorRole,
    status: allowed ? 'role_authorized' : 'role_insufficient',
    requiredRoles: [...OWNER_ROLES],
    error:  allowed ? null : `Role '${actorRole}' cannot perform owner-level control. Required: owner or admin.`,
  }
}

export function validateManagerControl(actorRole) {
  const allowed = MANAGER_ROLES.has(actorRole)
  return {
    allowed,
    role:   actorRole,
    status: allowed ? 'role_authorized' : 'role_insufficient',
    requiredRoles: [...MANAGER_ROLES],
    error:  allowed ? null : `Role '${actorRole}' cannot perform manager-level control. Required: manager, owner, or admin.`,
  }
}

export function validateViewerAccess(actorRole) {
  const allowed = VIEWER_ROLES.has(actorRole)
  return {
    allowed,
    role:   actorRole,
    status: allowed ? 'role_authorized' : 'role_insufficient',
    requiredRoles: [...VIEWER_ROLES],
    error:  allowed ? null : `Role '${actorRole}' cannot view operations dashboard.`,
  }
}

export function isBlockedRole(actorRole) {
  return BLOCKED_ROLES.has(actorRole)
}

export function buildRoleBlockedResponse(actorRole, action) {
  return {
    ok:               false,
    status:           'role_blocked',
    action,
    role:             actorRole,
    error:            `Role '${actorRole}' is not permitted to perform: ${action}`,
    blockedRoles:     [...BLOCKED_ROLES],
    allowedRoles:     [...MANAGER_ROLES],
    operationBlocked: true,
  }
}

export function assertManagerRole(actorRole, action) {
  if (isBlockedRole(actorRole)) return buildRoleBlockedResponse(actorRole, action)
  const validation = validateManagerControl(actorRole)
  if (!validation.allowed) {
    return {
      ok:               false,
      status:           'role_insufficient',
      action,
      role:             actorRole,
      error:            validation.error,
      requiredRoles:    validation.requiredRoles,
      operationBlocked: true,
    }
  }
  return null
}

export function assertOwnerRole(actorRole, action) {
  const validation = validateOwnerControl(actorRole)
  if (!validation.allowed) {
    return {
      ok:               false,
      status:           'role_insufficient',
      action,
      role:             actorRole,
      error:            validation.error,
      requiredRoles:    validation.requiredRoles,
      operationBlocked: true,
    }
  }
  return null
}
