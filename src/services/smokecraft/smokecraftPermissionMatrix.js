/**
 * SmokeCraft Permission Matrix (R10)
 *
 * Defines what each role can do within SmokeCraft.
 * Guest journey access is controlled by session progression (SmokeCraftSessionGuard),
 * not RBAC — guests do not have roles.
 *
 * This matrix governs management, venue, integration, and admin capabilities.
 *
 * Server-side enforcement is in server/middleware/authMiddleware.js.
 * Frontend uses this for rendering decisions only — server always re-checks.
 */

import { roleHasPermission, meetsMinRole } from '../../config/roleMap.js'

// ── Capability definitions ────────────────────────────────────────────────────

export const SMOKECRAFT_CAPABILITIES = Object.freeze({
  // Guest journey — progress-gated, not role-gated
  GUEST_JOURNEY:              'guest_journey',               // ALL (session-gated)

  // Staff venue capabilities
  VIEW_GUEST_SESSIONS:        'smokecraft_view_guest_sessions',
  ASSIST_GUEST:               'smokecraft_assist_guest',
  CONFIRM_PURCHASE:           'smokecraft_confirm_purchase',
  VIEW_FLOOR_REQUESTS:        'smokecraft_view_floor_requests',

  // Manager capabilities
  VIEW_MANAGEMENT_SYNC:       'smokecraft_view_management_sync',
  CONFIGURE_VENUE:            'smokecraft_configure_venue',
  VIEW_ERROR_LOGS:            'smokecraft_view_error_logs',
  VIEW_CONFLICT_REPORTS:      'smokecraft_view_conflict_reports',

  // Admin capabilities
  RESET_DEMO:                 'smokecraft_reset_demo',
  CONFIGURE_INTEGRATIONS:     'smokecraft_configure_integrations',

  // Founder-only capabilities
  MANAGE_FEATURE_FLAGS:       'smokecraft_manage_feature_flags',
  RELEASE_TAG:                'smokecraft_release_tag',
})

// ── Matrix: role → capabilities ───────────────────────────────────────────────

export const SMOKECRAFT_ROLE_CAPABILITIES = Object.freeze({
  guest:           [SMOKECRAFT_CAPABILITIES.GUEST_JOURNEY],
  staff:           [
    SMOKECRAFT_CAPABILITIES.GUEST_JOURNEY,
    SMOKECRAFT_CAPABILITIES.VIEW_GUEST_SESSIONS,
    SMOKECRAFT_CAPABILITIES.ASSIST_GUEST,
    SMOKECRAFT_CAPABILITIES.CONFIRM_PURCHASE,
    SMOKECRAFT_CAPABILITIES.VIEW_FLOOR_REQUESTS,
  ],
  manager:         [
    SMOKECRAFT_CAPABILITIES.GUEST_JOURNEY,
    SMOKECRAFT_CAPABILITIES.VIEW_GUEST_SESSIONS,
    SMOKECRAFT_CAPABILITIES.ASSIST_GUEST,
    SMOKECRAFT_CAPABILITIES.CONFIRM_PURCHASE,
    SMOKECRAFT_CAPABILITIES.VIEW_FLOOR_REQUESTS,
    SMOKECRAFT_CAPABILITIES.VIEW_MANAGEMENT_SYNC,
    SMOKECRAFT_CAPABILITIES.CONFIGURE_VENUE,
    SMOKECRAFT_CAPABILITIES.VIEW_ERROR_LOGS,
    SMOKECRAFT_CAPABILITIES.VIEW_CONFLICT_REPORTS,
  ],
  admin:           [
    SMOKECRAFT_CAPABILITIES.GUEST_JOURNEY,
    SMOKECRAFT_CAPABILITIES.VIEW_GUEST_SESSIONS,
    SMOKECRAFT_CAPABILITIES.ASSIST_GUEST,
    SMOKECRAFT_CAPABILITIES.CONFIRM_PURCHASE,
    SMOKECRAFT_CAPABILITIES.VIEW_FLOOR_REQUESTS,
    SMOKECRAFT_CAPABILITIES.VIEW_MANAGEMENT_SYNC,
    SMOKECRAFT_CAPABILITIES.CONFIGURE_VENUE,
    SMOKECRAFT_CAPABILITIES.VIEW_ERROR_LOGS,
    SMOKECRAFT_CAPABILITIES.VIEW_CONFLICT_REPORTS,
    SMOKECRAFT_CAPABILITIES.RESET_DEMO,
    SMOKECRAFT_CAPABILITIES.CONFIGURE_INTEGRATIONS,
  ],
  founder_level_0: Object.values(SMOKECRAFT_CAPABILITIES),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true if the role can perform the given SmokeCraft capability.
 * Guest journey is always checked via session progress, not this function.
 */
export function canSmokeCraft(role, capability) {
  if (!role) return false
  const caps = SMOKECRAFT_ROLE_CAPABILITIES[role] || []
  return caps.includes(capability)
}

/**
 * Returns true if the role can access management controls.
 */
export function canAccessManagement(role) {
  return meetsMinRole(role, 'manager')
}

/**
 * Returns true if the role can reset the investor demo.
 */
export function canResetDemo(role, isDemoMode) {
  return isDemoMode === true || meetsMinRole(role, 'admin')
}

/**
 * Returns true if the role can view error logs.
 */
export function canViewErrorLogs(role) {
  return meetsMinRole(role, 'manager') || roleHasPermission(role, 'view_error_logs')
}

/**
 * Returns true if the role can manage feature flags.
 */
export function canManageFeatureFlags(role) {
  return meetsMinRole(role, 'founder_level_0')
}

/**
 * Returns true if the role can configure integrations.
 */
export function canConfigureIntegrations(role) {
  return meetsMinRole(role, 'admin')
}

/**
 * Returns a summary of SmokeCraft capabilities for the given role.
 */
export function getSmokeCraftCapabilitySummary(role) {
  const granted = SMOKECRAFT_ROLE_CAPABILITIES[role] || []
  const all = Object.values(SMOKECRAFT_CAPABILITIES)
  return {
    role,
    granted,
    denied: all.filter(c => !granted.includes(c)),
    canAccessManagement: canAccessManagement(role),
    canResetDemo: canResetDemo(role, false),
    canViewErrorLogs: canViewErrorLogs(role),
    canManageFeatureFlags: canManageFeatureFlags(role),
    canConfigureIntegrations: canConfigureIntegrations(role),
  }
}
