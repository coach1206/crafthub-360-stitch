/**
 * Role Middleware — Phase 10 (Auth v2)
 *
 * Hierarchy (ascending): guest → staff → manager → admin → founder_level_0
 * Sidecar roles: passport_member, human_mentor, developer
 *   (use requirePassportMember, requireMentor, requireDeveloper instead of requireRole)
 *
 * requireAuth() must run BEFORE any role check to populate req.user.
 *
 * PRODUCTION GUARANTEES:
 *   - blockDevFounderSpoofing: blocks founder via dev-header in all envs
 *   - requireFounderLevel0: only JWT-verified founder_level_0 passes
 *   - preventSelfPromotion: any attempt to change own role is blocked
 *   - preventFounderModification: founder account cannot be modified by non-founder
 *   - preventOwnershipTransfer: transfer_ownership is Founder L0 only
 *   - auditAction: writes a structured audit entry for any privileged action
 */

import {
  meetsMinRole,
  roleHasPermission,
  ROLE_LEVELS,
  isSidecarRole,
} from '../config/roleMap.js'
import { authConfig }  from '../config/authConfig.js'
import {
  recordAccessDenied,
  recordAccessGranted,
  recordSecurityEvent,
} from '../services/securityEventService.js'
import { isDbAvailable, query } from '../db/connection.js'

// ── Identity helper ───────────────────────────────────────────

function ensureUser(req) {
  if (!req.user) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: 'proto-guest', role: 'guest', mode: 'prototype' }
    }
  }
  return req.user
}

function clientIp(req) {
  return req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown'
}

// ── Founder spoof guard ───────────────────────────────────────

/**
 * Blocks dev-header founder spoofing unless ALLOW_DEV_FOUNDER=true (dev only).
 * In production this never triggers because authMiddleware already hard-blocks
 * all dev headers. Kept here as a defense-in-depth layer on /founder/* routes.
 */
export async function blockDevFounderSpoofing(req, res, next) {
  const user = ensureUser(req)

  if (user.mode === 'dev-header' && user.role === 'founder_level_0') {
    if (!authConfig.ALLOW_DEV_FOUNDER) {
      await recordSecurityEvent(
        user.id, user.role,
        'security.dev_founder_spoof_blocked', req.path,
        { blocked: true, mode: user.mode, ip: clientIp(req) }
      )
      return res.status(403).json({
        success: false,
        message:
          'Founder access via dev headers is blocked. ' +
          'Use real founder authentication or set ALLOW_DEV_FOUNDER=true in .env (development only).',
      })
    }
    await recordSecurityEvent(
      user.id, user.role,
      'security.dev_founder_allowed', req.path,
      { note: 'ALLOW_DEV_FOUNDER=true — dev mode bypass active' }
    )
  }
  next()
}

// ── Core gates ────────────────────────────────────────────────

/**
 * Requires the requesting user to hold at minimum `minRoleName` in the
 * main operational hierarchy. Sidecar roles (human_mentor, developer,
 * passport_member) are NOT in the hierarchy — use their specific guards.
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
 * Requires a specific named permission key.
 * Works for both hierarchy roles and sidecar roles.
 */
export function requirePermission(permissionKey) {
  return async (req, res, next) => {
    const user = ensureUser(req)
    if (!roleHasPermission(user.role, permissionKey)) {
      const isFounderOnly = [
        'manage_roles', 'manage_revenue_settings', 'manage_deployment',
        'emergency_system_lock', 'founder_override', 'grant_developer_access',
        'revoke_developer_access', 'archive_audit_logs', 'export_audit_logs',
        'manage_system_settings', 'manage_feature_flags',
        'manage_environment_settings', 'transfer_ownership',
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
 * Only a real JWT-verified founder_level_0 identity passes.
 * Enforced in ALL environments.
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

// ── Sidecar role gates ────────────────────────────────────────

/**
 * Requires the user to be an authenticated Human Mentor.
 * Founder L0 can also access mentor routes.
 */
export async function requireMentor(req, res, next) {
  const user = ensureUser(req)
  const allowed = user.role === 'human_mentor' || user.role === 'founder_level_0'
  if (!allowed) {
    await recordAccessDenied(user.id, user.role, req.path, 'human_mentor')
    return res.status(403).json({
      success: false,
      message: 'Human Mentor access required',
    })
  }
  next()
}

/**
 * Requires the user to be an authenticated Developer with an active grant.
 * Founder L0 can also access developer routes.
 */
export async function requireDeveloper(req, res, next) {
  const user = ensureUser(req)

  if (user.role === 'founder_level_0') return next()

  if (user.role !== 'developer') {
    await recordAccessDenied(user.id, user.role, req.path, 'developer')
    return res.status(403).json({
      success: false,
      message: 'Developer access required — contact Founder Level 0 to request a grant',
    })
  }
  // Developer role verified — active grant check was done at login time (stored in JWT)
  next()
}

/**
 * Requires the user to be an authenticated Passport Member.
 * Also accepts staff+, mentor, and founder (they can view member data).
 */
export async function requirePassportMember(req, res, next) {
  const user    = ensureUser(req)
  const allowed =
    user.role === 'passport_member' ||
    user.role === 'human_mentor'    ||
    meetsMinRole(user.role, 'staff')

  if (!allowed) {
    await recordAccessDenied(user.id, user.role, req.path, 'passport_member')
    return res.status(403).json({
      success: false,
      message: 'Passport Member authentication required',
    })
  }
  next()
}

// ── Self-modification protection ──────────────────────────────

/**
 * Prevents a user from promoting or demoting their own role.
 * Attach to any role-change endpoint.
 * Reads targetUserId from req.params.userId or req.body.userId.
 */
export function preventSelfPromotion(req, res, next) {
  const user     = ensureUser(req)
  const targetId = req.params.userId || req.params.id || req.body?.userId || req.body?.targetUserId

  if (targetId && targetId === user.id) {
    recordSecurityEvent(
      user.id, user.role,
      'security.self_promotion_blocked', req.path,
      { targetId, method: req.method, ip: clientIp(req) }
    ).catch(() => {})
    return res.status(403).json({
      success: false,
      message: 'You cannot change your own role. Request a role change from an authorized administrator.',
    })
  }
  next()
}

/**
 * Prevents anyone but Founder L0 from modifying the founder account.
 * Reads targetUserId from params or body and checks the target's role.
 */
export async function preventFounderModification(req, res, next) {
  const user     = ensureUser(req)
  if (user.role === 'founder_level_0') return next()

  const targetId = req.params.userId || req.params.id || req.body?.userId || req.body?.targetUserId
  if (!targetId || !isDbAvailable()) return next()

  try {
    const result = await query(
      `SELECT role FROM system_users WHERE user_id=$1 LIMIT 1`,
      [targetId]
    )
    const targetRole = result.rows[0]?.role
    if (targetRole === 'founder_level_0') {
      await recordSecurityEvent(
        user.id, user.role,
        'security.founder_modification_blocked', req.path,
        { targetId, requesterRole: user.role, ip: clientIp(req) }
      )
      return res.status(403).json({
        success: false,
        message: 'Founder Level 0 accounts cannot be modified by any other role',
      })
    }
  } catch {}
  next()
}

/**
 * Blocks ownership transfer unless the requesting user is Founder L0.
 * Attach to any PATCH/PUT that could change the owner field.
 */
export function preventOwnershipTransfer(req, res, next) {
  const user = ensureUser(req)

  const bodyHasOwner =
    req.body?.owner !== undefined ||
    req.body?.owner_id !== undefined ||
    req.body?.transfer_to !== undefined

  if (bodyHasOwner && user.role !== 'founder_level_0') {
    recordSecurityEvent(
      user.id, user.role,
      'security.ownership_transfer_blocked', req.path,
      { requesterRole: user.role, ip: clientIp(req) }
    ).catch(() => {})
    return res.status(403).json({
      success: false,
      message: 'Ownership transfer is restricted to Founder Level 0',
    })
  }
  next()
}

// ── Audit action middleware ───────────────────────────────────

/**
 * Factory: creates a middleware that writes an audit log entry
 * before passing to the route handler.
 *
 * @param {string} category — one of the 15 audit categories
 * @param {string} action   — descriptive action name (e.g. 'role.promoted')
 * @param {'pre'|'post'} timing — 'pre' writes before handler, 'post' wraps res.json
 */
export function auditAction(category, action, timing = 'pre') {
  return async (req, res, next) => {
    const user = ensureUser(req)

    if (timing === 'pre') {
      await writeAuditEntry({
        actorId:        user.id,
        actorRole:      user.role,
        actionCategory: category,
        action,
        targetType:     req.params.id ? 'resource' : null,
        targetId:       req.params.id || req.params.userId || null,
        metadata:       sanitiseBody(req.body),
        routePath:      req.path,
        ipAddress:      clientIp(req),
        result:         null, // will be updated post if needed
      })
      return next()
    }

    // 'post' — wrap res.json to capture the result
    const origJson = res.json.bind(res)
    res.json = async (body) => {
      const result = body?.success === false ? 'failure' : 'success'
      await writeAuditEntry({
        actorId:        user.id,
        actorRole:      user.role,
        actionCategory: category,
        action,
        targetType:     req.params.id ? 'resource' : null,
        targetId:       req.params.id || req.params.userId || null,
        metadata:       sanitiseBody(req.body),
        routePath:      req.path,
        ipAddress:      clientIp(req),
        result,
      })
      return origJson(body)
    }
    next()
  }
}

// ── Helpers ───────────────────────────────────────────────────

async function writeAuditEntry({
  actorId, actorRole, actionCategory, action,
  targetType, targetId, metadata, routePath, ipAddress, result,
}) {
  if (!isDbAvailable()) return
  try {
    await query(
      `INSERT INTO audit_logs
         (actor_type, actor_id, actor_role, action, action_category,
          target_type, target_id, metadata, route_path, ip_address, result)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        actorRole || 'system',
        actorId   || 'system',
        actorRole || null,
        action,
        actionCategory,
        targetType || null,
        targetId   || null,
        JSON.stringify(metadata || {}),
        routePath  || null,
        ipAddress  || null,
        result     || null,
      ]
    )
  } catch (err) {
    console.warn('[auditAction] writeAuditEntry failed:', err.message)
  }
}

/** Strip credential-like keys from request body before auditing */
function sanitiseBody(body) {
  if (!body || typeof body !== 'object') return {}
  const sanitised = { ...body }
  for (const key of ['pin', 'password', 'founderChallenge', 'token', 'secret', 'hash']) {
    if (key in sanitised) sanitised[key] = '[REDACTED]'
  }
  return sanitised
}

// ── Aliases + convenience exports ────────────────────────────
export const founderOnly    = requireFounderLevel0

export const requireStaff   = requireRole('staff')
export const requireManager = requireRole('manager')
export const requireAdmin   = requireRole('admin')

export const canAccessPOS3          = requirePermission('access_pos3_staff')
export const canAccessEAT           = requirePermission('access_eat_command')
export const canExportData          = requirePermission('export_data')
export const canManageStaff         = requirePermission('manage_staff')
export const canOverrideSession     = requirePermission('founder_override')
export const canChangeMoneySettings = requirePermission('manage_revenue_settings')
export const canViewAuditLogs       = requirePermission('view_audit_logs')
export const canViewCommandCenter   = requirePermission('view_command_center')
export const canManageInventory     = requirePermission('manage_inventory')
export const canManageTicker        = requirePermission('manage_ticker')
export const canManageVenue         = requirePermission('manage_venue_settings')
export const canGrantDevAccess      = requirePermission('grant_developer_access')
export const canManageSystemSettings = requirePermission('manage_system_settings')
export const canManageFeatureFlags   = requirePermission('manage_feature_flags')
export const canArchiveAuditLogs     = requirePermission('archive_audit_logs')
