/**
 * Role Middleware — enforces role-based access control for all protected routes.
 *
 * Roles (ascending): guest → staff → manager → admin → founder
 *
 * Usage:
 *   import { requireRole, requirePermission } from './roleMiddleware.js'
 *
 *   router.get('/dashboard', requireRole('manager'), ctrl.getDashboard)
 *   router.post('/billing',  requirePermission('money.settings'), ctrl.updateBilling)
 *   router.delete('/wipe',   founderOnly, ctrl.wipeData)
 *
 * In prototype/development mode all checks pass automatically.
 * Set NODE_ENV=production to enforce roles.
 */

import { ROLES, hasPermission, meetsMinRole } from '../config/permissions.js'

// ── Core gate ─────────────────────────────────────────────────

/**
 * Requires the requesting user to hold at minimum `minRoleName`.
 * In prototype mode (NODE_ENV !== 'production'), all requests pass through
 * with a synthetic role attached to req.user.
 *
 * @param {'guest'|'staff'|'manager'|'admin'|'founder'} minRoleName
 */
export function requireRole(minRoleName) {
  return (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
      req.user = req.user || _protoUser(minRoleName)
      return next()
    }
    const user = req.user
    if (!user) {
      return _deny(res, 'Authentication required', 401)
    }
    if (!meetsMinRole(user.role, minRoleName)) {
      return _deny(res, `Access denied — requires role: ${minRoleName}`)
    }
    next()
  }
}

/**
 * Requires the requesting user to hold a specific named permission.
 * Founder-only permissions are enforced even in development mode.
 *
 * @param {string} permissionSlug  — e.g. 'money.settings', 'eat.access'
 */
export function requirePermission(permissionSlug) {
  return (req, res, next) => {
    const isDev = process.env.NODE_ENV !== 'production'
    const user  = req.user || (isDev ? _protoUser('admin') : null)

    if (!user) return _deny(res, 'Authentication required', 401)

    if (!hasPermission(user.role, permissionSlug)) {
      const isFounderOnly = permissionSlug.startsWith('founder.') ||
        ['money.settings', 'billing.manage', 'data.wipe', 'license.manage',
         'user.manage.founder'].includes(permissionSlug)

      return _deny(
        res,
        isFounderOnly
          ? 'This action is restricted to Founder accounts'
          : `Access denied — missing permission: ${permissionSlug}`,
        isFounderOnly ? 403 : 403
      )
    }
    next()
  }
}

// ── Convenience exports ───────────────────────────────────────

/** Only staff and above. */
export const requireStaff   = requireRole('staff')

/** Only managers and above. */
export const requireManager = requireRole('manager')

/** Only admins and above. */
export const requireAdmin   = requireRole('admin')

/**
 * Founder-only gate — enforced in ALL environments, including development.
 * Nothing — not even admin — bypasses this.
 */
export function founderOnly(req, res, next) {
  const user = req.user
  if (!user || user.role !== 'founder') {
    return _deny(res, 'This action is restricted to Founder accounts', 403)
  }
  next()
}

// ── Route-specific permission guards ─────────────────────────
export const canAccessPOS3         = requirePermission('pos3.access')
export const canAccessEAT          = requirePermission('eat.access')
export const canExportData         = requirePermission('data.export')
export const canManageStaff        = requirePermission('staff.manage')
export const canOverrideSession    = requirePermission('session.override')
export const canChangeMoneySettings = requirePermission('money.settings')
export const canViewAuditLogs      = requirePermission('audit.view')

// ── Private helpers ───────────────────────────────────────────

function _deny(res, message, status = 403) {
  return res.status(status).json({ success: false, message })
}

/**
 * Prototype identity — used in development so routes work without a real auth system.
 * Level is set to `minRoleName` so only the minimum required access is simulated.
 */
function _protoUser(roleName) {
  return {
    id:    'proto-user',
    role:  roleName || 'staff',
    mode:  'prototype',
    venue: process.env.VENUE_ID || 'novee-grand-lounge',
  }
}
