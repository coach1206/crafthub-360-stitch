/**
 * SmokeCraft Permission Contract
 * Defines role-to-capability mapping for the SmokeCraft Experience Module.
 * Aligns with the NOVEE OS Module Build 1 permission service.
 */

export const SMOKECRAFT_PERMISSIONS = {
  customer: [
    'smokecraft.start_session',
    'smokecraft.view_recommendations',
    'smokecraft.request_order',
    'smokecraft.complete_scorecard',
    'smokecraft.earn_passport_stamp',
    'smokecraft.view_connections_when_unlocked',
  ],
  staff: [
    'smokecraft.view_order_requests',
    'smokecraft.accept_order_request',
    'smokecraft.update_order_status',
    'smokecraft.assist_customer_order',
  ],
  manager: [
    'smokecraft.view_management_sync',
    'smokecraft.view_venue_smokecraft_activity',
    'smokecraft.view_pairing_performance',
    ...['smokecraft.view_order_requests', 'smokecraft.accept_order_request',
        'smokecraft.update_order_status', 'smokecraft.assist_customer_order'],
  ],
  venueOwner: [
    'smokecraft.configure_venue_menu_connection',
    'smokecraft.view_revenue_activity',
    'smokecraft.view_staff_activity',
    'smokecraft.view_management_sync',
    'smokecraft.view_venue_smokecraft_activity',
  ],
  platformAdmin: [
    'smokecraft.register_module',
    'smokecraft.update_module_manifest',
    'smokecraft.inspect_module_audit',
    'smokecraft.manage_module_lifecycle_preview',
  ],
}

const STAFF_ONLY_PERMISSIONS = new Set([
  'smokecraft.view_order_requests',
  'smokecraft.accept_order_request',
  'smokecraft.update_order_status',
  'smokecraft.assist_customer_order',
])

const MANAGER_ONLY_PERMISSIONS = new Set([
  'smokecraft.view_management_sync',
  'smokecraft.view_venue_smokecraft_activity',
  'smokecraft.view_pairing_performance',
])

/**
 * Returns whether a role has a given permission.
 * customer roles are blocked from staff-only and manager-only actions.
 */
export function hasSmokeCraftPermission(role, permission) {
  if (role === 'customer' && STAFF_ONLY_PERMISSIONS.has(permission)) return false
  if (role === 'customer' && MANAGER_ONLY_PERMISSIONS.has(permission)) return false
  const perms = SMOKECRAFT_PERMISSIONS[role] ?? []
  return perms.includes(permission)
}

export function getPermissionsForRole(role) {
  return SMOKECRAFT_PERMISSIONS[role] ?? []
}

export function buildSmokeCraftPermissionReport() {
  return {
    moduleId: 'smokecraft-experience',
    permissionMap: SMOKECRAFT_PERMISSIONS,
    preview_only: true,
    note: 'Customer users cannot perform staff-only or manager-only actions.',
  }
}

export const PERMISSION_CONTRACT_VERSION = '0.1.0'
