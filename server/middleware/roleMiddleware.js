/**
 * Role Middleware — placeholder for future role-based access control.
 * Currently uses prototype/bypass mode. Real roles will be: guest, staff, manager, admin.
 */

const ROLE_HIERARCHY = { guest: 0, staff: 1, manager: 2, admin: 3 }

/**
 * Returns a middleware that requires the authenticated user to have
 * at minimum the specified role.
 */
export function requireRole(minRole) {
  return (req, res, next) => {
    // Prototype bypass — all requests pass in non-production
    if (process.env.NODE_ENV !== 'production') {
      return next()
    }
    const userRole  = req.user?.role || 'guest'
    const userLevel = ROLE_HIERARCHY[userRole] ?? 0
    const minLevel  = ROLE_HIERARCHY[minRole]  ?? 0
    if (userLevel < minLevel) {
      return res.status(403).json({
        success: false,
        message: `Access denied — requires role: ${minRole}`,
      })
    }
    next()
  }
}

/** Convenience: staff or higher. */
export const requireStaff   = requireRole('staff')

/** Convenience: manager or higher. */
export const requireManager = requireRole('manager')

/** Convenience: admin only. */
export const requireAdmin   = requireRole('admin')
