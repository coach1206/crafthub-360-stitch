/**
 * NOVEE OS — Permission Key Definitions (Phase 8 canonical)
 *
 * Permission keys use underscore format.
 * Role → permission mapping lives in server/config/roleMap.js.
 * Use roleHasPermission(role, key) for all checks.
 */

export {
  ROLE_LEVELS,
  ROLE_MAP,
  ALL_PERMISSIONS,
  roleHasPermission,
  meetsMinRole,
  getEffectivePermissions,
  rolesWithPermission,
  buildPermissionMatrix,
} from './roleMap.js'

/**
 * Convenience: all permission keys grouped by category.
 * Useful for admin dashboards and documentation.
 */
export const PERMISSION_GROUPS = Object.freeze({
  guest: {
    label: 'Guest Access',
    keys: [
      'view_guest_modules',
      'start_guest_session',
      'view_passport',
      'earn_passport_stamp',
      'view_leaderboard',
    ],
  },
  pos3: {
    label: 'POS 3',
    keys: [
      'access_pos3_staff',
      'access_pos3_manager',
      'view_pos3_payloads',
      'modify_pos3_settings',
    ],
  },
  eat: {
    label: 'E.A.T. Command',
    keys: [
      'access_eat_command',
      'view_eat_analytics',
      'modify_eat_settings',
      'trigger_staff_assist',
    ],
  },
  admin: {
    label: 'Administration',
    keys: [
      'view_command_center',
      'view_audit_logs',
      'export_data',
      'manage_staff',
      'manage_integrations',
    ],
  },
  founder: {
    label: 'Founder Level 0',
    keys: [
      'manage_roles',
      'manage_revenue_settings',
      'manage_deployment',
      'emergency_system_lock',
      'founder_override',
    ],
  },
})

/**
 * Human-readable descriptions for each permission key.
 */
export const PERMISSION_DESCRIPTIONS = Object.freeze({
  view_guest_modules:      'Access guest-facing craft modules and experiences',
  start_guest_session:     'Initiate a new guest kiosk session',
  view_passport:           'View the 360 Passport and earned stamps',
  earn_passport_stamp:     'Earn stamps through craft session completion',
  view_leaderboard:        'View the public leaderboard',
  access_pos3_staff:       'Access POS 3 in staff mode',
  access_pos3_manager:     'Access POS 3 in manager mode with full payload visibility',
  view_pos3_payloads:      'View structured POS 3 guest payloads',
  modify_pos3_settings:    'Change POS 3 provider mode and configuration',
  access_eat_command:      'Access the E.A.T. Command dashboard (management only)',
  view_eat_analytics:      'View E.A.T. engagement analytics and scores',
  modify_eat_settings:     'Change E.A.T. Command configuration',
  trigger_staff_assist:    'Trigger a staff assist alert for a guest',
  view_command_center:     'Access the NOVEE OS Command Center overview',
  view_audit_logs:         'View audit and security event logs',
  export_data:             'Export session, analytics, or leaderboard data',
  manage_staff:            'Add, remove, and configure staff accounts',
  manage_integrations:     'Configure third-party integrations (POS, CRM, analytics)',
  manage_roles:            'Grant and revoke role assignments at any level',
  manage_revenue_settings: 'Set pricing, commission rates, and billing configuration',
  manage_deployment:       'Control deployment targets and environment switches',
  emergency_system_lock:   'Trigger an emergency system lockdown',
  founder_override:        'Override any session, rule, or control in the system',
})
