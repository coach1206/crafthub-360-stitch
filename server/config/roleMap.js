/**
 * NOVEE OS — Role Permission Map (Phase 10 — Auth v2)
 *
 * MAIN HIERARCHY (used by requireRole / meetsMinRole):
 *   guest (0) → staff (1) → manager (2) → admin (3) → founder_level_0 (4)
 *
 * SIDECAR ROLES (outside the main chain — use requirePermission gates):
 *   passport_member (level 0) — authenticated guest with server-side profile
 *   human_mentor    (level 1) — real human mentor, separate from AI personas
 *   developer       (level 0) — read-only diagnostics, Founder L0 grant required
 *
 * Sidecar roles fail requireRole('manager') and above by design.
 * Their routes use requirePermission('access_mentor_console') etc.
 */

// ── Role hierarchy (numeric) ─────────────────────────────────
export const ROLE_LEVELS = Object.freeze({
  guest:           0,
  passport_member: 0,   // sidecar — same floor as guest
  developer:       0,   // sidecar — diagnostics only, Founder grant required
  staff:           1,
  human_mentor:    1,   // sidecar — mentor scope only, not POS/EAT
  manager:         2,
  admin:           3,
  founder_level_0: 4,
})

/** Sidecar roles — outside the main operational hierarchy */
export const SIDECAR_ROLES = Object.freeze(new Set([
  'passport_member',
  'human_mentor',
  'developer',
]))

// ── Direct permission keys per role ──────────────────────────
const RAW_ROLE_MAP = {
  guest: [
    'view_guest_modules',
    'start_guest_session',
    'view_passport',
    'earn_passport_stamp',
    'view_leaderboard',
  ],

  passport_member: [
    'view_guest_modules',
    'start_guest_session',
    'view_leaderboard',
    'view_own_passport',
    'view_own_stamps',
    'view_own_xp',
    'view_own_legacy_score',
    'view_own_rewards',
    'view_own_connections',
    'view_own_travel_history',
    'view_own_event_history',
    'earn_passport_stamp',
    'create_passport_connection',
    'rsvp_to_events',
    'request_travel',
    'promote_to_member',
  ],

  developer: [
    'view_diagnostics',
    'view_error_logs',
    'view_system_metrics',
    'view_api_health',
  ],

  staff: [
    'access_pos3_staff',
    'trigger_staff_assist',
    'view_table_status',
    'view_guest_assistance',
  ],

  human_mentor: [
    'access_mentor_console',
    'view_assigned_sessions',
    'add_guidance_notes',
    'trigger_mentor_content',
    'view_learner_progress',
    'view_pairing_recommendations',
    'add_tasting_notes',
  ],

  manager: [
    'access_pos3_staff',
    'access_pos3_manager',
    'view_pos3_payloads',
    'access_eat_command',
    'view_eat_analytics',
    'trigger_staff_assist',
    'view_leaderboard',
    'view_table_status',
    'view_guest_assistance',
    'manage_floor_operations',
    'manage_staff_activity',
    'manage_ticker',
    'view_inventory_status',
    'manage_event_operations',
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
    'view_table_status',
    'view_guest_assistance',
    'view_command_center',
    'view_audit_logs',
    'export_data',
    'manage_staff',
    'manage_integrations',
    'manage_floor_operations',
    'manage_staff_activity',
    'manage_ticker',
    'view_inventory_status',
    'manage_inventory',
    'manage_event_operations',
    'manage_venue_settings',
    'manage_users',
    'approve_human_mentors',
    'review_access_requests',
    'manage_admin_inbox',
    'view_access_requests',
    'view_security_events',
    'manage_ticker_full',
  ],

  founder_level_0: [
    // All permissions — absolute ceiling
    'view_guest_modules',
    'start_guest_session',
    'view_passport',
    'earn_passport_stamp',
    'view_leaderboard',
    'view_own_passport',
    'view_own_stamps',
    'view_own_xp',
    'view_own_legacy_score',
    'view_own_rewards',
    'view_own_connections',
    'view_own_travel_history',
    'view_own_event_history',
    'earn_passport_stamp',
    'create_passport_connection',
    'rsvp_to_events',
    'request_travel',
    'view_diagnostics',
    'view_error_logs',
    'view_system_metrics',
    'view_api_health',
    'access_pos3_staff',
    'access_pos3_manager',
    'view_pos3_payloads',
    'modify_pos3_settings',
    'access_eat_command',
    'view_eat_analytics',
    'modify_eat_settings',
    'trigger_staff_assist',
    'view_table_status',
    'view_guest_assistance',
    'view_command_center',
    'view_audit_logs',
    'export_data',
    'manage_staff',
    'manage_integrations',
    'manage_floor_operations',
    'manage_staff_activity',
    'manage_ticker',
    'manage_ticker_full',
    'view_inventory_status',
    'manage_inventory',
    'manage_event_operations',
    'manage_venue_settings',
    'manage_users',
    'approve_human_mentors',
    'review_access_requests',
    'manage_admin_inbox',
    'view_access_requests',
    'view_security_events',
    // Founder-exclusive
    'manage_roles',
    'manage_revenue_settings',
    'manage_deployment',
    'emergency_system_lock',
    'founder_override',
    'grant_developer_access',
    'revoke_developer_access',
    'archive_audit_logs',
    'export_audit_logs',
    'manage_system_settings',
    'manage_feature_flags',
    'manage_environment_settings',
    'manage_founder_recovery',
    'transfer_ownership',
    'access_mentor_console',
    'view_assigned_sessions',
    'add_guidance_notes',
    'trigger_mentor_content',
    'view_learner_progress',
    'view_pairing_recommendations',
    'add_tasting_notes',
  ],
}

// Frozen copy of the role map for external consumers
export const ROLE_MAP = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_ROLE_MAP).map(([role, perms]) => [role, Object.freeze([...perms])])
  )
)

/** All defined permission keys */
export const ALL_PERMISSIONS = Object.freeze([
  // Guest / public
  'view_guest_modules', 'start_guest_session', 'view_passport',
  'earn_passport_stamp', 'view_leaderboard',
  // Passport Member
  'view_own_passport', 'view_own_stamps', 'view_own_xp',
  'view_own_legacy_score', 'view_own_rewards', 'view_own_connections',
  'view_own_travel_history', 'view_own_event_history',
  'create_passport_connection', 'rsvp_to_events', 'request_travel', 'promote_to_member',
  // Developer
  'view_diagnostics', 'view_error_logs', 'view_system_metrics', 'view_api_health',
  // Staff
  'access_pos3_staff', 'trigger_staff_assist', 'view_table_status', 'view_guest_assistance',
  // Human Mentor
  'access_mentor_console', 'view_assigned_sessions', 'add_guidance_notes',
  'trigger_mentor_content', 'view_learner_progress', 'view_pairing_recommendations',
  'add_tasting_notes',
  // Manager
  'access_pos3_manager', 'view_pos3_payloads', 'access_eat_command', 'view_eat_analytics',
  'manage_floor_operations', 'manage_staff_activity', 'manage_ticker',
  'view_inventory_status', 'manage_event_operations',
  // Admin
  'modify_pos3_settings', 'modify_eat_settings', 'view_command_center',
  'view_audit_logs', 'export_data', 'manage_staff', 'manage_integrations',
  'manage_inventory', 'manage_venue_settings', 'manage_users',
  'approve_human_mentors', 'review_access_requests', 'manage_admin_inbox',
  'view_access_requests', 'view_security_events', 'manage_ticker_full',
  // Founder-exclusive
  'manage_roles', 'manage_revenue_settings', 'manage_deployment',
  'emergency_system_lock', 'founder_override', 'grant_developer_access',
  'revoke_developer_access', 'archive_audit_logs', 'export_audit_logs',
  'manage_system_settings', 'manage_feature_flags', 'manage_environment_settings',
  'manage_founder_recovery', 'transfer_ownership',
])

// ── Founder-only permission set ───────────────────────────────
const FOUNDER_ONLY = new Set([
  'manage_roles',
  'manage_revenue_settings',
  'manage_deployment',
  'emergency_system_lock',
  'founder_override',
  'grant_developer_access',
  'revoke_developer_access',
  'archive_audit_logs',
  'export_audit_logs',
  'manage_system_settings',
  'manage_feature_flags',
  'manage_environment_settings',
  'manage_founder_recovery',
  'transfer_ownership',
])

// ── Permission helpers ────────────────────────────────────────

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

/** Returns true if role is a sidecar (not in the main operational hierarchy). */
export function isSidecarRole(role) {
  return SIDECAR_ROLES.has(role)
}

/** Builds a full permission matrix for admin dashboards. */
export function buildPermissionMatrix() {
  return Object.entries(ROLE_LEVELS).map(([role, level]) => ({
    name:        role,
    level,
    isSidecar:   SIDECAR_ROLES.has(role),
    permissions: RAW_ROLE_MAP[role] || [],
  }))
}
