/**
 * NOVEE OS — Role Permission Map (frontend copy)
 *
 * Mirrors server/config/roleMap.js for use in SecurityContext,
 * ProtectedRoute, RoleGate, and PermissionGate.
 *
 * IMPORTANT: This is the prototype source of truth for the frontend.
 * In production, permission checks against sensitive actions must
 * always be verified server-side as well.
 */

export const ROLE_LEVELS = Object.freeze({
  guest:           0,
  staff:           1,
  manager:         2,
  admin:           3,
  founder_level_0: 4,
})

export const ROLE_LABELS = Object.freeze({
  guest:           'Guest',
  staff:           'Staff',
  manager:         'Manager',
  admin:           'Admin',
  founder_level_0: 'Founder Level 0',
})

export const ROLE_MAP = Object.freeze({
  guest: [
    'view_guest_modules',
    'start_guest_session',
    'view_passport',
    'earn_passport_stamp',
    'view_leaderboard',
  ],
  staff: [
    'access_pos3_staff',
    'trigger_staff_assist',
  ],
  manager: [
    'access_pos3_staff',
    'access_pos3_manager',
    'view_pos3_payloads',
    'access_eat_command',
    'view_eat_analytics',
    'trigger_staff_assist',
    'view_leaderboard',
  ],
  admin: [
    'access_pos3_staff',
    'access_pos3_manager',
    'view_pos3_payloads',
    'modify_pos3_settings',
    'access_eat_command',
    'view_eat_analytics',
    'modify_eat_settings',
    'trigger_staff_assist',
    'view_leaderboard',
    'view_command_center',
    'view_audit_logs',
    'export_data',
    'manage_staff',
    'manage_integrations',
  ],
  founder_level_0: [
    'view_guest_modules',
    'start_guest_session',
    'view_passport',
    'earn_passport_stamp',
    'view_leaderboard',
    'access_pos3_staff',
    'access_pos3_manager',
    'view_pos3_payloads',
    'modify_pos3_settings',
    'access_eat_command',
    'view_eat_analytics',
    'modify_eat_settings',
    'trigger_staff_assist',
    'view_command_center',
    'view_audit_logs',
    'export_data',
    'manage_staff',
    'manage_integrations',
    'manage_roles',
    'manage_revenue_settings',
    'manage_deployment',
    'emergency_system_lock',
    'founder_override',
  ],
})

/** Returns true if the role holds the given permission. */
export function roleHasPermission(role, permKey) {
  if (role === 'founder_level_0') return true
  return (ROLE_MAP[role] || []).includes(permKey)
}

/** Returns true if role meets or exceeds the minimum required level. */
export function meetsMinRole(role, minRole) {
  return (ROLE_LEVELS[role] ?? -1) >= (ROLE_LEVELS[minRole] ?? 999)
}

/** Human-readable label for a role. */
export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || 'Unknown'
}

/** All valid role keys. */
export const ALL_ROLES = Object.keys(ROLE_MAP)
