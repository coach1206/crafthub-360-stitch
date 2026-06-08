/**
 * Role Middleware — enforces role-based access control.
 *
 * Roles (ascending): guest → staff → manager → admin → founder_level_0
 *
 * requireAuth() must run BEFORE any role check to populate req.user.
 * In development, use x-novee-user-role header to simulate any role.
 *
 * requireFounderLevel0() is the absolute ceiling — it is enforced in
 * ALL environments. No dev bypass. No admin exemption. Ever.
 */

import { meetsMinRole, roleHasPermission, ROLE_LEVELS } from '../config/roleMap.js'
import { recordAccessDenied, recordAccessGranted } from '../services/securityEventService.js'

// ── Identity helper ───────────────────────────────────────────

/**
 * Ensures req.user exists. If no requireAuth() ran upstream, attaches a
 * prototype guest identity (development only).
 */
function ensureUser(req) {
  if (!req.user) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: 'proto-guest', role: 'guest', mode: 'prototype' }
    }
  }
  return req.user
}

// ── Core gates ────────────────────────────────────────────────

/**
 * Requires the requesting user to hold at minimum `minRoleName`.
 * Logs denied attempts as security events.
 *
 * @param {'guest'|'staff'|'manager'|'admin'|'founder_level_0'} minRoleName
 */
export function requireRole(minRoleName) {
  return async (req, res, next) => {
    const user = ensureUser(req)

    if (!meetsMinRole(user.role, minRoleName)) {
      await recordAccessDenied(user.id, user.role, req.path, minRoleName)
      return res.status(403).json({
        success: false,
        message: `Access denied — requires role: ${minRoleName}`,
      })
    }
    next()
  }
}

/**
 * Requires the requesting user to hold a specific named permission key.
 * Logs all denied attempts.
 *
 * @param {string} permissionKey — e.g. 'access_eat_command'
 */
export function requirePermission(permissionKey) {
  return async (req, res, next) => {
    const user = ensureUser(req)

    if (!roleHasPermission(user.role, permissionKey)) {
      const isFounderOnly = [
        'manage_roles', 'manage_revenue_settings', 'manage_deployment',
        'emergency_system_lock', 'founder_override',
      ].includes(permissionKey)

      await recordAccessDenied(user.id, user.role, req.path, permissionKey)
      return res.status(403).json({
        success: false,
        message: isFounderOnly
          ? 'This action is restricted to Founder Level 0 accounts'
          : `Access denied — missing permission: ${permissionKey}`,
      })
    }
    next()
  }
}

/**
 * Founder Level 0 gate — absolute ceiling.
 * Enforced in ALL environments. No prototype bypass. No dev override.
 * Only a request with role === 'founder_level_0' passes.
 */
export async function requireFounderLevel0(req, res, next) {
  const user = ensureUser(req)

  if (user.role !== 'founder_level_0') {
    await recordAccessDenied(user.id, user.role, req.path, 'founder_level_0')
    return res.status(403).json({
      success: false,
      message: 'Founder Level 0 access required — this action cannot be delegated',
    })
  }

  await recordAccessGranted(user.id, user.role, req.path)
  next()
}

// ── Convenience guards (named exports) ───────────────────────

/** Staff or higher. */
export const requireStaff   = requireRole('staff')

/** Manager or higher. */
export const requireManager = requireRole('manager')

/** Admin or higher. */
export const requireAdmin   = requireRole('admin')

/** Founder Level 0 only (alias for requireFounderLevel0). */
export const founderOnly    = requireFounderLevel0

// ── Route-specific permission guards ─────────────────────────
export const canAccessPOS3          = requirePermission('access_pos3_staff')
export const canAccessEAT           = requirePermission('access_eat_command')
export const canExportData          = requirePermission('export_data')
export const canManageStaff         = requirePermission('manage_staff')
export const canOverrideSession     = requirePermission('founder_override')
export const canChangeMoneySettings = requirePermission('manage_revenue_settings')
export const canViewAuditLogs       = requirePermission('view_audit_logs')
export const canViewCommandCenter   = requirePermission('view_command_center')
