/**
 * Role Middleware — Phase 8.5
 *
 * Roles (ascending): guest → staff → manager → admin → founder_level_0
 *
 * requireAuth() must run BEFORE any role check to populate req.user.
 *
 * requireFounderLevel0 / founderOnly:
 *   - Checks real role from req.user (set by JWT-verified requireAuth)
 *   - In dev: BLOCKS founder via dev headers unless ALLOW_DEV_FOUNDER=true
 *   - Enforced in ALL environments — no exceptions
 *
 * blockDevFounderSpoofing:
 *   - Specifically blocks x-novee-user-role: founder_level_0 in dev headers
 *   - Logs every attempt as a security event
 *   - Add to any route group that requires extra hardening
 */

import { meetsMinRole, roleHasPermission, ROLE_LEVELS } from '../config/roleMap.js'
import { authConfig }                                    from '../config/authConfig.js'
import {
  recordAccessDenied,
  recordAccessGranted,
  recordSecurityEvent,
} from '../services/securityEventService.js'

// ── Identity helper ───────────────────────────────────────────

function ensureUser(req) {
  if (!req.user) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: 'proto-guest', role: 'guest', mode: 'prototype' }
    }
  }
  return req.user
}

// ── blockDevFounderSpoofing ───────────────────────────────────

/**
 * Blocks requests where a dev header has set role to founder_level_0
 * unless ALLOW_DEV_FOUNDER=true in development.
 *
 * Use on any route group that must prevent casual founder spoofing.
 */
export async function blockDevFounderSpoofing(req, res, next) {
  const user = ensureUser(req)

  if (user.mode === 'dev-header' && user.role === 'founder_level_0') {
    if (!authConfig.ALLOW_DEV_FOUNDER) {
      await recordSecurityEvent(
        user.id, user.role,
        'security.dev_founder_spoof_blocked', req.path,
        { blocked: true, mode: user.mode }
      )
      return res.status(403).json({
        success: false,
        message: 'Founder access via dev headers is blocked. ' +
                 'Use real founder authentication or set ALLOW_DEV_FOUNDER=true in .env (development only).',
      })
    }
    // Allow but log it
    await recordSecurityEvent(
      user.id, user.role,
      'security.dev_founder_allowed', req.path,
      { note: 'ALLOW_DEV_FOUNDER=true is set — dev mode founder bypass active' }
    )
  }
  next()
}

// ── Core gates ────────────────────────────────────────────────

/**
 * Requires the requesting user to hold at minimum `minRoleName`.
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
 * Enforced in ALL environments.
 * Dev headers are blocked by blockDevFounderSpoofing (applied before this).
 * Only a real JWT-verified founder_level_0 identity passes.
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

// ── Aliases ───────────────────────────────────────────────────
export const founderOnly    = requireFounderLevel0

// ── Convenience role guards ───────────────────────────────────
export const requireStaff   = requireRole('staff')
export const requireManager = requireRole('manager')
export const requireAdmin   = requireRole('admin')

// ── Route-specific permission guards ─────────────────────────
export const canAccessPOS3          = requirePermission('access_pos3_staff')
export const canAccessEAT           = requirePermission('access_eat_command')
export const canExportData          = requirePermission('export_data')
export const canManageStaff         = requirePermission('manage_staff')
export const canOverrideSession     = requirePermission('founder_override')
export const canChangeMoneySettings = requirePermission('manage_revenue_settings')
export const canViewAuditLogs       = requirePermission('view_audit_logs')
export const canViewCommandCenter   = requirePermission('view_command_center')
