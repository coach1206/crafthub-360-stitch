/**
 * NOVEE OS — Role Permission Map (server-side canonical)
 *
 * Each role lists EXACTLY which permission keys it holds.
 * This is not additive by default — permissions are explicit per role.
 * Use getEffectivePermissions(role) to get the full inherited set.
 *
 * Canonical role names (Phase 8):
 *   guest | staff | manager | admin | founder_level_0
 */

// ── Role hierarchy (numeric) ─────────────────────────────────
export const ROLE_LEVELS = Object.freeze({
  guest:           0,
  staff:           1,
  manager:         2,
  admin:           3,
  founder_level_0: 4,
})

// ── Direct permission keys per role ──────────────────────────
const RAW_ROLE_MAP = {
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
    // Inherits all manager perms + admin-specific ones
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
    // All permissions — absolute ceiling
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
    // Founder-exclusive
    'manage_roles',
    'manage_revenue_settings',
    'manage_deployment',
    'emergency_system_lock',
    'founder_override',
  ],
}

// ── All defined permission keys ───────────────────────────────
export const ALL_PERMISSIONS = Object.freeze([
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
  'manage_roles',
  'manage_integrations',
  'manage_revenue_settings',
  'manage_deployment',
  'emergency_system_lock',
  'founder_override',
])

// Frozen copy of the role map for external consumers
export const ROLE_MAP = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_ROLE_MAP).map(([role, perms]) => [role, Object.freeze([...perms])])
  )
)

// ── Permission helpers ────────────────────────────────────────

/** Founder-exclusive permissions that admin and below can never hold. */
const FOUNDER_ONLY = new Set([
  'manage_roles',
  'manage_revenue_settings',
  'manage_deployment',
  'emergency_system_lock',
  'founder_override',
])

/** Returns true if the role holds the given permission key. */
export function roleHasPermission(role, permKey) {
  if (role === 'founder_level_0') return true
  if (FOUNDER_ONLY.has(permKey)) return false
  return (RAW_ROLE_MAP[role] || []).includes(permKey)
}

/** Returns true if role meets the minimum numeric level. */
export function meetsMinRole(role, minRole) {
  return (ROLE_LEVELS[role] ?? -1) >= (ROLE_LEVELS[minRole] ?? 999)
}

/** Returns the full permission array for a role. */
export function getEffectivePermissions(role) {
  return RAW_ROLE_MAP[role] || []
}

/** Returns all roles that hold the given permission. */
export function rolesWithPermission(permKey) {
  return Object.keys(RAW_ROLE_MAP).filter(r => roleHasPermission(r, permKey))
}

/**
 * Builds a full permission matrix for admin dashboards.
 * Returns an array of role objects with their level and permission lists.
 */
export function buildPermissionMatrix() {
  return Object.entries(ROLE_LEVELS).map(([role, level]) => ({
    name:        role,
    level,
    permissions: RAW_ROLE_MAP[role] || [],
  }))
}
