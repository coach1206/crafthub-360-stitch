/**
 * NOVEE OS — Permission Key Definitions (Phase 10 — Auth v2)
 *
 * Permission keys use underscore format.
 * Role → permission mapping lives in server/config/roleMap.js.
 * Use roleHasPermission(role, key) for all checks.
 */

export {
  ROLE_LEVELS,
  ROLE_MAP,
  ALL_PERMISSIONS,
  SIDECAR_ROLES,
  roleHasPermission,
  meetsMinRole,
  isSidecarRole,
  getEffectivePermissions,
  rolesWithPermission,
  buildPermissionMatrix,
} from './roleMap.js'

/**
 * All permission keys grouped by category.
 * Used by admin dashboards and permission matrix views.
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
  passport_member: {
    label: '360 Passport Member',
    keys: [
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
  },
  developer: {
    label: 'Developer Diagnostics',
    keys: [
      'view_diagnostics',
      'view_error_logs',
      'view_system_metrics',
      'view_api_health',
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
  mentor: {
    label: 'Human Mentor',
    keys: [
      'access_mentor_console',
      'view_assigned_sessions',
      'add_guidance_notes',
      'trigger_mentor_content',
      'view_learner_progress',
      'view_pairing_recommendations',
      'add_tasting_notes',
    ],
  },
  floor: {
    label: 'Floor Operations',
    keys: [
      'manage_floor_operations',
      'manage_staff_activity',
      'manage_event_operations',
      'view_table_status',
      'view_guest_assistance',
    ],
  },
  inventory: {
    label: 'Inventory Management',
    keys: [
      'view_inventory_status',
      'manage_inventory',
    ],
  },
  ticker: {
    label: 'TicketTicker',
    keys: [
      'manage_ticker',
      'manage_ticker_full',
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
      'manage_users',
      'manage_venue_settings',
      'approve_human_mentors',
      'review_access_requests',
      'manage_admin_inbox',
      'view_access_requests',
      'view_security_events',
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
      'grant_developer_access',
      'revoke_developer_access',
      'archive_audit_logs',
      'export_audit_logs',
      'manage_system_settings',
      'manage_feature_flags',
      'manage_environment_settings',
      'manage_founder_recovery',
      'transfer_ownership',
    ],
  },
})

/**
 * Human-readable descriptions for every permission key.
 */
export const PERMISSION_DESCRIPTIONS = Object.freeze({
  // Guest
  view_guest_modules:       'Access guest-facing craft modules and experiences',
  start_guest_session:      'Initiate a new guest kiosk session',
  view_passport:            'View the 360 Passport and earned stamps',
  earn_passport_stamp:      'Earn stamps through craft session completion',
  view_leaderboard:         'View the public leaderboard',

  // Passport Member
  view_own_passport:        'View own full Passport Member profile',
  view_own_stamps:          'View own earned passport stamps',
  view_own_xp:              'View own craft XP total',
  view_own_legacy_score:    'View own legacy score',
  view_own_rewards:         'View own rewards and perks',
  view_own_connections:     'View own 360 Passport Connections',
  view_own_travel_history:  'View own DayOne360 travel history',
  view_own_event_history:   'View own event attendance history',
  create_passport_connection: 'Create a new 360 Passport Connection with another member',
  rsvp_to_events:           'RSVP to upcoming events',
  request_travel:           'Request DayOne360 travel packages',
  promote_to_member:        'Convert a guest session to a verified Passport Member account',

  // Developer
  view_diagnostics:         'View NOVEE OS system diagnostics',
  view_error_logs:          'View server error logs (read-only)',
  view_system_metrics:      'View API performance and system metrics',
  view_api_health:          'View API route health status',

  // POS 3
  access_pos3_staff:        'Access POS 3 in staff mode',
  access_pos3_manager:      'Access POS 3 in manager mode with full payload visibility',
  view_pos3_payloads:       'View structured POS 3 guest payloads',
  modify_pos3_settings:     'Change POS 3 provider mode and configuration',

  // E.A.T.
  access_eat_command:       'Access the E.A.T. Command dashboard (management only)',
  view_eat_analytics:       'View E.A.T. engagement analytics and scores',
  modify_eat_settings:      'Change E.A.T. Command configuration',
  trigger_staff_assist:     'Trigger a staff assist alert for a guest',

  // Mentor
  access_mentor_console:    'Access the Human Mentor console',
  view_assigned_sessions:   'View sessions assigned to this mentor',
  add_guidance_notes:       'Add guidance notes to an assigned session',
  trigger_mentor_content:   'Trigger approved mentor content for a guest',
  view_learner_progress:    'View learner progress for assigned sessions',
  view_pairing_recommendations: 'View AI-powered pairing recommendations',
  add_tasting_notes:        'Add tasting notes to a guest session',

  // Floor
  manage_floor_operations:  'Manage live floor operations and seating',
  manage_staff_activity:    'Manage staff assignments and activity',
  manage_event_operations:  'Manage event floor execution',
  view_table_status:        'View live table and seat status',
  view_guest_assistance:    'View guest assistance requests',

  // Inventory
  view_inventory_status:    'View inventory levels and alerts',
  manage_inventory:         'Add, remove, and correct inventory records',

  // Ticker
  manage_ticker:            'Create and schedule TicketTicker messages',
  manage_ticker_full:       'Full TicketTicker admin — override, archive, all venues',

  // Admin
  view_command_center:      'Access the NOVEE OS Command Center overview',
  view_audit_logs:          'View audit and security event logs',
  export_data:              'Export session, analytics, or leaderboard data',
  manage_staff:             'Add, remove, and configure staff accounts',
  manage_integrations:      'Configure third-party integrations (POS, CRM, analytics)',
  manage_users:             'Manage all user accounts and access',
  manage_venue_settings:    'Configure venue settings and permissions',
  approve_human_mentors:    'Approve or revoke Human Mentor role assignments',
  review_access_requests:   'Review and act on access request submissions',
  manage_admin_inbox:       'Manage the admin action inbox',
  view_access_requests:     'View pending access requests',
  view_security_events:     'View the security events log',

  // Founder
  manage_roles:             'Grant and revoke role assignments at any level',
  manage_revenue_settings:  'Set pricing, commission rates, and billing configuration',
  manage_deployment:        'Control deployment targets and environment switches',
  emergency_system_lock:    'Trigger an emergency system lockdown',
  founder_override:         'Override any session, rule, or control in the system',
  grant_developer_access:   'Issue a time-limited developer access grant',
  revoke_developer_access:  'Revoke any active developer access grant',
  archive_audit_logs:       'Archive and export audit logs (read-only export)',
  export_audit_logs:        'Export audit log archives (Founder L0 only)',
  manage_system_settings:   'Manage NOVEE OS platform settings',
  manage_feature_flags:     'Enable or disable platform feature flags',
  manage_environment_settings: 'Configure environment-specific platform settings',
  manage_founder_recovery:  'Manage Founder Level 0 recovery codes',
  transfer_ownership:       'Transfer platform ownership (irreversible)',
})
