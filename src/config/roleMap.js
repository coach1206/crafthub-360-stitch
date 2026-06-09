/**
 * NOVEE OS — Role Permission Map (frontend copy — Phase 10, Auth v2)
 *
 * Mirrors server/config/roleMap.js for use in SecurityContext,
 * ProtectedRoute, RoleGate, and PermissionGate.
 *
 * Hierarchy (ascending): guest → staff → manager → admin → founder_level_0
 * Sidecar roles (outside hierarchy): passport_member, human_mentor, developer
 *
 * IMPORTANT: Frontend permission checks are for UI rendering only.
 * All sensitive actions are enforced server-side.
 */

// ── Role hierarchy ────────────────────────────────────────────
export const ROLE_LEVELS = Object.freeze({
  guest:           0,
  staff:           1,
  manager:         2,
  admin:           3,
  founder_level_0: 4,
})

// Sidecar roles — permission-gated, not hierarchy-gated
export const SIDECAR_ROLES = Object.freeze(new Set([
  'passport_member',
  'human_mentor',
  'developer',
]))

export const ROLE_LABELS = Object.freeze({
  guest:           'Guest',
  staff:           'Staff',
  manager:         'Manager',
  admin:           'Admin',
  founder_level_0: 'Founder Level 0',
  passport_member: 'Passport Member',
  human_mentor:    'Human Mentor',
  developer:       'Developer',
})

// ── Permission sets per role ──────────────────────────────────
export const ROLE_MAP = Object.freeze({
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
    'create_passport_connection',
    'rsvp_to_events',
    'request_travel',
    'promote_to_member',
  ],

  human_mentor: [
    'view_guest_modules',
    'start_guest_session',
    'view_passport',
    'earn_passport_stamp',
    'view_leaderboard',
    'access_mentor_console',
    'view_assigned_sessions',
    'add_guidance_notes',
    'trigger_mentor_content',
    'view_learner_progress',
    'view_pairing_recommendations',
    'add_tasting_notes',
  ],

  developer: [
    'view_diagnostics',
    'view_error_logs',
    'view_system_metrics',
    'view_api_health',
  ],

  staff: [
    'view_guest_modules',
    'start_guest_session',
    'view_passport',
    'earn_passport_stamp',
    'view_leaderboard',
    'access_pos3_staff',
    'trigger_staff_assist',
    'view_table_status',
    'view_inventory_status',
    'view_guest_assistance',
  ],

  manager: [
    'view_guest_modules',
    'start_guest_session',
    'view_passport',
    'earn_passport_stamp',
    'view_leaderboard',
    'access_pos3_staff',
    'access_pos3_manager',
    'view_pos3_payloads',
    'access_eat_command',
    'view_eat_analytics',
    'trigger_staff_assist',
    'view_table_status',
    'manage_floor_operations',
    'manage_staff_activity',
    'manage_event_operations',
    'view_inventory_status',
    'manage_inventory',
    'view_guest_assistance',
    'manage_ticker',
  ],

  admin: [
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
    'view_table_status',
    'manage_floor_operations',
    'manage_staff_activity',
    'manage_event_operations',
    'view_inventory_status',
    'manage_inventory',
    'view_guest_assistance',
    'manage_ticker',
    'manage_ticker_full',
    'view_command_center',
    'view_audit_logs',
    'export_data',
    'manage_staff',
    'manage_integrations',
    'manage_users',
    'manage_venue_settings',
    'approve_human_mentors',
    'review_access_requests',
    'manage_admin_inbox',
    'view_access_requests',
    'view_security_events',
  ],

  founder_level_0: [
    // All permissions — founder sees everything
    'view_guest_modules', 'start_guest_session', 'view_passport',
    'earn_passport_stamp', 'view_leaderboard',
    'access_pos3_staff', 'access_pos3_manager', 'view_pos3_payloads',
    'modify_pos3_settings', 'access_eat_command', 'view_eat_analytics',
    'modify_eat_settings', 'trigger_staff_assist',
    'view_table_status', 'manage_floor_operations', 'manage_staff_activity',
    'manage_event_operations', 'view_inventory_status', 'manage_inventory',
    'view_guest_assistance', 'manage_ticker', 'manage_ticker_full',
    'view_command_center', 'view_audit_logs', 'export_data',
    'manage_staff', 'manage_integrations', 'manage_users',
    'manage_venue_settings', 'approve_human_mentors',
    'review_access_requests', 'manage_admin_inbox',
    'view_access_requests', 'view_security_events',
    // Founder-only
    'manage_roles', 'manage_revenue_settings', 'manage_deployment',
    'emergency_system_lock', 'founder_override',
    'grant_developer_access', 'revoke_developer_access',
    'archive_audit_logs', 'export_audit_logs',
    'manage_system_settings', 'manage_feature_flags',
    'manage_environment_settings', 'manage_founder_recovery',
    'transfer_ownership',
    // Mentor + developer + passport — founder can access all
    'access_mentor_console', 'view_assigned_sessions', 'add_guidance_notes',
    'trigger_mentor_content', 'view_learner_progress',
    'view_pairing_recommendations', 'add_tasting_notes',
    'view_diagnostics', 'view_error_logs', 'view_system_metrics', 'view_api_health',
    'view_own_passport', 'view_own_stamps', 'view_own_xp',
    'view_own_legacy_score', 'view_own_rewards', 'view_own_connections',
    'view_own_travel_history', 'view_own_event_history',
    'create_passport_connection', 'rsvp_to_events', 'request_travel', 'promote_to_member',
  ],
})

// ── All unique permission keys ────────────────────────────────
export const ALL_PERMISSIONS = Object.freeze([
  ...new Set(Object.values(ROLE_MAP).flat()),
])

// ── Helper functions ──────────────────────────────────────────

/** Returns true if the role holds the given permission. */
export function roleHasPermission(role, permKey) {
  if (role === 'founder_level_0') return true
  return (ROLE_MAP[role] || []).includes(permKey)
}

/** Returns true if role meets or exceeds the minimum required level in the hierarchy. */
export function meetsMinRole(role, minRole) {
  // Sidecar roles have no hierarchy level — treat as staff for minimum checks
  const effectiveLevel = ROLE_LEVELS[role] ?? (SIDECAR_ROLES.has(role) ? 1 : -1)
  return effectiveLevel >= (ROLE_LEVELS[minRole] ?? 999)
}

/** Returns true if the role is a sidecar role (not in the main hierarchy). */
export function isSidecarRole(role) {
  return SIDECAR_ROLES.has(role)
}

/**
 * Returns the full set of permissions for a role.
 * Equivalent to ROLE_MAP[role] || [].
 */
export function getEffectivePermissions(role) {
  return ROLE_MAP[role] || []
}

/** Human-readable label for a role. */
export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || 'Unknown'
}

/** All valid role keys (hierarchy + sidecar). */
export const ALL_ROLES = Object.freeze(Object.keys(ROLE_MAP))
