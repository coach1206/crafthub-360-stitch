/**
 * SmokeCraft Venue Permission Service
 * Role-gated access for venue admin, staff operations, analytics, and management controls.
 * customer role is always blocked from admin access.
 */

const PERMISSIONS = {
  staff: [
    'view_staff_queue',
    'accept_order',
    'update_order_status',
    'view_assigned_orders',
  ],
  manager: [
    'view_staff_queue',
    'accept_order',
    'update_order_status',
    'view_assigned_orders',
    'view_all_staff_activity',
    'view_analytics',
    'view_reward_summary',
    'view_pairing_summary',
    'view_menu_status',
    'view_integration_status',
  ],
  venueOwner: [
    'view_staff_queue',
    'accept_order',
    'update_order_status',
    'view_assigned_orders',
    'view_all_staff_activity',
    'view_analytics',
    'view_reward_summary',
    'view_pairing_summary',
    'view_menu_status',
    'view_integration_status',
    'view_venue_dashboard',
    'view_revenue_preview',
    'view_staff_performance',
    'view_management_controls',
    'view_operational_audit',
  ],
  platformAdmin: [
    'view_staff_queue',
    'accept_order',
    'update_order_status',
    'view_assigned_orders',
    'view_all_staff_activity',
    'view_analytics',
    'view_reward_summary',
    'view_pairing_summary',
    'view_menu_status',
    'view_integration_status',
    'view_venue_dashboard',
    'view_revenue_preview',
    'view_staff_performance',
    'view_management_controls',
    'view_operational_audit',
    'view_all_admin_controls',
    'clear_demo_data',
    'inspect_system_health',
    'inspect_module_audit',
  ],
}

const BLOCKED_ROLES = ['customer']

export function hasAdminAccess(role) {
  if (!role || BLOCKED_ROLES.includes(role)) return false
  return role in PERMISSIONS
}

export function hasPermission(role, permission) {
  if (!hasAdminAccess(role)) return false
  return (PERMISSIONS[role] ?? []).includes(permission)
}

export function getPermissionsForRole(role) {
  if (!hasAdminAccess(role)) return []
  return PERMISSIONS[role] ?? []
}

export function assertAdminAccess(role) {
  if (!hasAdminAccess(role)) {
    return { allowed: false, blockedReason: 'customer_role_blocked', role }
  }
  return { allowed: true, role }
}

export function assertPermission(role, permission) {
  if (!hasAdminAccess(role)) {
    return { allowed: false, blockedReason: 'customer_role_blocked' }
  }
  if (!hasPermission(role, permission)) {
    return { allowed: false, blockedReason: 'insufficient_role', required: permission, role }
  }
  return { allowed: true }
}

export function getPermissionServiceReport() {
  return {
    blockedRoles: BLOCKED_ROLES,
    allowedRoles: Object.keys(PERMISSIONS),
    customerBlocked: true,
    staffCanAccessStaffOps: true,
    managerCanAccessAnalytics: true,
    venueOwnerCanAccessManagementControls: true,
    platformAdminCanClearDemoData: true,
  }
}
