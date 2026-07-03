/**
 * NOMPF — Module Permission Service
 * Maps module-level permissions without breaking current role behavior.
 */

import { getModuleById } from './moduleRegistryService.js'

export const ALL_ROLES = [
  'guest', 'customer', 'server', 'bartender', 'kitchen_staff',
  'humidor_staff', 'cashier', 'host', 'busser',
  'manager', 'owner', 'admin', 'internal_admin', 'reseller_admin',
]

export const ADMIN_ROLES = ['owner', 'admin', 'internal_admin', 'reseller_admin']
export const MANAGER_ROLES = ['manager', 'owner', 'admin', 'internal_admin']

function defaultPermissionForRole(role, module) {
  if (ADMIN_ROLES.includes(role)) return 'permission_granted'
  if (MANAGER_ROLES.includes(role)) {
    if (['addon_module', 'connector_module', 'licensing_module', 'marketplace_module'].includes(module?.moduleType))
      return 'owner_required'
    return 'permission_granted'
  }
  return 'preview_only'
}

export function getModulePermissions(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return {
    moduleId,
    moduleName: m.moduleName,
    requiredPermissions: m.requiredPermissions ?? [],
    preview_only: true,
  }
}

export function getRoleModulePermissions(role, moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', role, moduleId }
  return {
    role,
    moduleId,
    status: defaultPermissionForRole(role, m),
    preview_only: true,
  }
}

export function validateModulePermission(role, moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { granted: false, status: 'module_not_found' }
  const status = defaultPermissionForRole(role, m)
  return { granted: status === 'permission_granted', status, role, moduleId, preview_only: true }
}

export function validateModuleAccessForRole(role, moduleId) {
  return validateModulePermission(role, moduleId)
}

export function buildPermissionMapForModule(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { error: 'module_not_found', moduleId }
  return {
    moduleId,
    moduleName: m.moduleName,
    permissionMap: Object.fromEntries(
      ALL_ROLES.map(r => [r, defaultPermissionForRole(r, m)])
    ),
    preview_only: true,
  }
}

export function buildModulePermissionReport(moduleId) {
  const m = getModuleById(moduleId)
  if (!m) return { status: 'module_not_found', moduleId }
  return {
    moduleId,
    moduleName: m.moduleName,
    roles: ALL_ROLES,
    permissionMap: buildPermissionMapForModule(moduleId).permissionMap,
    adminRoles: ADMIN_ROLES,
    managerRoles: MANAGER_ROLES,
    preview_only: true,
    note: 'Module permissions are preview-only. Existing role behavior is unchanged.',
  }
}

export function buildPermissionDeniedResponse(role, moduleId, reason) {
  return {
    granted: false,
    status: 'permission_denied',
    role,
    moduleId,
    reason: reason ?? 'insufficient_role',
    preview_only: true,
  }
}
