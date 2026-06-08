/**
 * NOVEE OS — Role-Based Access Control (RBAC) Matrix
 *
 * Role hierarchy (lowest → highest):
 *   guest (0) → staff (1) → manager (2) → admin (3) → founder (4)
 *
 * Each role inherits ALL permissions of every role below it.
 *
 * Founders have an absolute ceiling — no role can exceed founder.
 * "Admin" can do everything EXCEPT founder-locked controls.
 */

// ── Role hierarchy ────────────────────────────────────────────
export const ROLES = Object.freeze({
  guest:   0,
  staff:   1,
  manager: 2,
  admin:   3,
  founder: 4,
})

export const ROLE_NAMES = Object.freeze(
  Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [v, k]))
)

// ── Permission registry ───────────────────────────────────────
/**
 * Each key is a permission slug.
 * `minRole`  — minimum role required (inclusive).
 * `maxRole`  — maximum role that may hold this permission (default: founder).
 *              Use maxRole to BLOCK higher roles from a permission (rare — only for
 *              "this action is founder-exclusive at that exact tier" cases).
 * `founderOnly` — shorthand: only the founder role may use this.
 * `description` — human-readable summary.
 */
export const PERMISSIONS = Object.freeze({

  // ── Guest ─────────────────────────────────────────────────
  'session.view.own': {
    minRole:     ROLES.guest,
    description: 'View the guest\'s own active session data',
  },
  'session.create': {
    minRole:     ROLES.guest,
    description: 'Start a new guest session via the kiosk',
  },
  'passport.view.own': {
    minRole:     ROLES.guest,
    description: 'View the guest\'s own 360 Passport',
  },
  'leaderboard.view': {
    minRole:     ROLES.guest,
    description: 'View the public leaderboard',
  },

  // ── Staff ─────────────────────────────────────────────────
  'session.view.all': {
    minRole:     ROLES.staff,
    description: 'View all active guest sessions on the floor',
  },
  'session.override': {
    minRole:     ROLES.staff,
    description: 'Force-advance, reset, or intervene in any guest session',
  },
  'pos3.access': {
    minRole:     ROLES.staff,
    description: 'Access POS 3 activity feeds and payload previews',
  },
  'pos3.view.payload': {
    minRole:     ROLES.staff,
    description: 'View POS 3 payload for a given session',
  },
  'passport.award.stamp': {
    minRole:     ROLES.staff,
    description: 'Manually award a passport stamp on behalf of a guest',
  },
  'leaderboard.submit': {
    minRole:     ROLES.staff,
    description: 'Submit or adjust leaderboard scores',
  },

  // ── Manager ───────────────────────────────────────────────
  'eat.access': {
    minRole:     ROLES.manager,
    description: 'Access the E.A.T. Command analytics dashboard — never guest-facing',
  },
  'eat.view.dashboard': {
    minRole:     ROLES.manager,
    description: 'View the E.A.T. Command summary dashboard',
  },
  'eat.view.payload': {
    minRole:     ROLES.manager,
    description: 'View full E.A.T. Command payload for any session',
  },
  'data.export': {
    minRole:     ROLES.manager,
    description: 'Export session, analytics, or leaderboard data as CSV/JSON',
  },
  'audit.view': {
    minRole:     ROLES.manager,
    description: 'View audit logs for any session or actor',
  },
  'staff.manage': {
    minRole:     ROLES.manager,
    description: 'Add, remove, and update staff accounts and PINs',
  },
  'staff.view': {
    minRole:     ROLES.manager,
    description: 'View staff roster and assigned roles',
  },
  'session.delete': {
    minRole:     ROLES.manager,
    description: 'Permanently delete a guest session record',
  },

  // ── Admin ─────────────────────────────────────────────────
  'system.config': {
    minRole:     ROLES.admin,
    description: 'Modify system-level settings (venue ID, device ID, feature flags)',
  },
  'system.events.view': {
    minRole:     ROLES.admin,
    description: 'View raw system event log',
  },
  'schema.migrate': {
    minRole:     ROLES.admin,
    description: 'Trigger schema migrations and database maintenance',
  },
  'user.manage.admin': {
    minRole:     ROLES.admin,
    description: 'Promote/demote users up to admin level (not founder)',
  },
  'integrations.manage': {
    minRole:     ROLES.admin,
    description: 'Configure third-party integrations (POS systems, CRM, analytics)',
  },

  // ── Founder-only ──────────────────────────────────────────
  'money.settings': {
    minRole:     ROLES.founder,
    founderOnly: true,
    description: 'Change pricing, revenue splits, commission rates, and payment settings',
  },
  'billing.manage': {
    minRole:     ROLES.founder,
    founderOnly: true,
    description: 'Manage subscription billing, platform fees, and invoices',
  },
  'founder.controls': {
    minRole:     ROLES.founder,
    founderOnly: true,
    description: 'Access the founder control panel — system-wide overrides, white-label config',
  },
  'user.manage.founder': {
    minRole:     ROLES.founder,
    founderOnly: true,
    description: 'Grant or revoke founder-level access',
  },
  'data.wipe': {
    minRole:     ROLES.founder,
    founderOnly: true,
    description: 'Permanently wipe all venue data (irreversible)',
  },
  'license.manage': {
    minRole:     ROLES.founder,
    founderOnly: true,
    description: 'Manage NOVEE OS license keys and venue activation',
  },
})

// ── Helpers ───────────────────────────────────────────────────

/** Returns true if `role` satisfies the minimum required for `permissionSlug`. */
export function hasPermission(role, permissionSlug) {
  const roleLvl = typeof role === 'number' ? role : (ROLES[role] ?? -1)
  const perm    = PERMISSIONS[permissionSlug]
  if (!perm) return false
  if (perm.founderOnly && roleLvl !== ROLES.founder) return false
  return roleLvl >= perm.minRole
}

/** Returns true if the role value meets or exceeds `minRoleName`. */
export function meetsMinRole(role, minRoleName) {
  const roleLvl = typeof role === 'number' ? role : (ROLES[role] ?? -1)
  return roleLvl >= (ROLES[minRoleName] ?? 999)
}

/** Returns all permission slugs accessible to a given role. */
export function getPermissionsForRole(roleName) {
  const lvl = ROLES[roleName] ?? -1
  return Object.entries(PERMISSIONS)
    .filter(([, perm]) => {
      if (perm.founderOnly) return lvl === ROLES.founder
      return lvl >= perm.minRole
    })
    .map(([slug]) => slug)
}

/** Returns a summary matrix for all roles — useful for admin dashboards. */
export function buildPermissionMatrix() {
  return Object.keys(ROLES).map(roleName => ({
    role:        roleName,
    level:       ROLES[roleName],
    permissions: getPermissionsForRole(roleName),
  }))
}
