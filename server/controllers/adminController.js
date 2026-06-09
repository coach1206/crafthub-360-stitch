/**
 * Admin Controller — system-level endpoints for admin and founder roles.
 */

import * as adminService from '../services/adminService.js'
import * as securityEventService from '../services/securityEventService.js'
import { buildPermissionMatrix, getEffectivePermissions, ROLE_LEVELS } from '../config/permissions.js'
import { PERMISSION_GROUPS, PERMISSION_DESCRIPTIONS } from '../config/permissions.js'
import { ok, created, fail, notFound, serverError } from '../utils/response.js'
import { getResetAuditLog, getResetAuditTotal } from '../utils/resetAudit.js'
import { resetXpCore, resetActivityCore, resetMembersCore } from './rankingController.js'
import { resetConciergeCore, resetStampsCore } from './travelController.js'
import { resetFeedCore } from './tickerController.js'
import { resetBadgesCore } from './badgeController.js'

const ROLE_LEVELS_MAP = { guest: 0, staff: 1, manager: 2, admin: 3, founder_level_0: 4 }

/** GET /api/admin/me — current user identity + permissions. */
export function getMe(req, res) {
  try {
    const user = req.user || { role: 'guest' }
    ok(res, {
      userId:      user.id,
      role:        user.role,
      email:       user.email,
      mode:        user.mode,
      permissions: getEffectivePermissions(user.role),
    })
  } catch (err) {
    serverError(res, err, 'getMe')
  }
}

/** GET /api/admin/permissions — full permission matrix (admin+). */
export function getPermissionMatrix(_req, res) {
  try {
    ok(res, {
      roles:       buildPermissionMatrix(),
      groups:      PERMISSION_GROUPS,
      descriptions: PERMISSION_DESCRIPTIONS,
    })
  } catch (err) {
    serverError(res, err, 'getPermissionMatrix')
  }
}

/** GET /api/admin/roles — role level definitions. */
export function getRoles(_req, res) {
  try {
    const roles = Object.entries(ROLE_LEVELS).map(([name, level]) => ({
      name,
      level,
      permissions: getEffectivePermissions(name),
    }))
    ok(res, roles)
  } catch (err) {
    serverError(res, err, 'getRoles')
  }
}

/** GET /api/admin/my-permissions — accessible to any auth'd user. */
export function getMyPermissions(req, res) {
  try {
    const role = req.user?.role || 'guest'
    ok(res, { role, permissions: getEffectivePermissions(role) })
  } catch (err) {
    serverError(res, err, 'getMyPermissions')
  }
}

/** GET /api/admin/users — list system users. */
export async function getUsers(req, res) {
  try {
    await securityEventService.recordSecurityEvent(
      req.user?.id, req.user?.role, 'admin.users.viewed', req.path
    )
    const users = await adminService.getAdminUsers()
    ok(res, users)
  } catch (err) {
    serverError(res, err, 'getUsers')
  }
}

/** POST /api/admin/users — create a system user. */
export async function createUser(req, res) {
  try {
    if (!req.body?.role) return fail(res, 'role is required')

    // No one can create a founder_level_0 user via API (must be done at DB level)
    if (req.body.role === 'founder_level_0' && req.user?.role !== 'founder_level_0') {
      return res.status(403).json({
        success: false,
        message: 'Only a Founder Level 0 account can grant Founder Level 0 access',
      })
    }

    const user = await adminService.createAdminUser(req.body, req.user?.id)
    created(res, user)
  } catch (err) {
    serverError(res, err, 'createUser')
  }
}

/** PUT /api/admin/users/:userId — update a system user. */
export async function updateUser(req, res) {
  try {
    const { userId } = req.params
    if (!userId) return fail(res, 'userId required')

    // Block role elevation to founder via API unless caller is founder
    if (req.body.role === 'founder_level_0' && req.user?.role !== 'founder_level_0') {
      return res.status(403).json({
        success: false,
        message: 'Only a Founder Level 0 account can grant Founder Level 0 access',
      })
    }

    const updated = await adminService.updateAdminUser(
      userId, req.body, req.user?.id, req.user?.role
    )
    if (!updated) return notFound(res, 'User')
    ok(res, updated)
  } catch (err) {
    serverError(res, err, 'updateUser')
  }
}

/** GET /api/admin/security-events — recent security event log. */
export async function getSecurityEvents(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
    const actor  = req.query.actorId || null
    await securityEventService.recordSecurityEvent(
      req.user?.id, req.user?.role, 'admin.security-events.viewed', req.path
    )
    const events = await securityEventService.getSecurityEvents(actor, limit)
    ok(res, events)
  } catch (err) {
    serverError(res, err, 'getSecurityEvents')
  }
}

/**
 * POST /api/admin/users/:userId/reset-pin
 * Manager+ resets a lower-role user's PIN.
 * Permission matrix enforced in adminService.resetUserPinWithPermissionCheck.
 */
export async function resetUserPin(req, res) {
  try {
    const { userId }              = req.params
    const { newPin, confirmPin }  = req.body || {}
    const actorRole               = req.user?.role

    if (!userId) return fail(res, 'userId is required')
    if (!newPin || !confirmPin) return fail(res, 'newPin and confirmPin are required')
    if (newPin !== confirmPin)  return fail(res, 'newPin and confirmPin do not match')

    const raw = String(newPin).trim()
    if (!/^\d{4,8}$/.test(raw)) return fail(res, 'PIN must be 4–8 digits (numbers only)')

    const result = await adminService.resetUserPinWithPermissionCheck(actorRole, userId, raw)

    if (!result.success) {
      return res.status(403).json({ success: false, message: result.message })
    }

    // Security event: PIN reset
    await securityEventService.recordSecurityEvent(
      req.user?.id, actorRole,
      'admin.pin-reset',
      `user:${userId} role:${(await adminService.getUserById(userId))?.role || 'unknown'}`
    ).catch(() => {})

    return ok(res, { message: result.message })
  } catch (err) {
    serverError(res, err, 'resetUserPin')
  }
}

/** GET /api/admin/staff — list staff accounts (manager+). */
export async function listStaff(_req, res) {
  try {
    ok(res, {
      message:   'Staff management — full roster in Phase 9',
      prototype: true,
      roles:     Object.keys(ROLE_LEVELS).filter(r => r !== 'guest'),
    })
  } catch (err) {
    serverError(res, err, 'listStaff')
  }
}

/** POST /api/admin/money-settings — FOUNDER ONLY. */
export function updateMoneySettings(req, res) {
  try {
    const { pricingTier, commissionRate, billingCycle } = req.body
    if (!pricingTier && commissionRate == null && !billingCycle) {
      return fail(res, 'At least one money setting field is required')
    }
    ok(res, {
      acknowledged: true,
      message:      'Money settings received — live integration wired in Phase 9',
      received:     { pricingTier, commissionRate, billingCycle },
    })
  } catch (err) {
    serverError(res, err, 'updateMoneySettings')
  }
}

/** DELETE /api/admin/data-wipe — FOUNDER ONLY. Requires confirm header. */
export function dataWipe(req, res) {
  try {
    if (req.headers['x-confirm-wipe'] !== 'CONFIRM') {
      return fail(res, 'Data wipe requires header X-Confirm-Wipe: CONFIRM', 400)
    }
    ok(res, { acknowledged: true, message: 'Wipe acknowledged — not executed in prototype mode', prototype: true })
  } catch (err) {
    serverError(res, err, 'dataWipe')
  }
}

/** GET /api/admin/reset-audit — last N reset events, admin+. */
export function getResetAudit(req, res) {
  try {
    const limit       = Math.min(Number(req.query.limit) || 50, 200)
    const log         = getResetAuditLog(limit)
    const totalStored = getResetAuditTotal()
    ok(res, { log, returned: log.length, totalStored })
  } catch (err) {
    serverError(res, err, 'getResetAudit')
  }
}

/** DELETE /api/admin/reset-all — FOUNDER ONLY. Chains all 7 store resets and returns a per-store breakdown. */
export function resetAll(req, res) {
  try {
    const user = req.user
    const STORES = [
      { key: 'ranking-xp',       label: 'Leaderboard XP',        fn: () => resetXpCore(user) },
      { key: 'ranking-activity', label: 'Activity Log',           fn: () => resetActivityCore(user) },
      { key: 'ranking-members',  label: 'Member Roster',          fn: () => resetMembersCore(user) },
      { key: 'travel-concierge', label: 'Concierge Requests',     fn: () => resetConciergeCore(user) },
      { key: 'travel-stamps',    label: 'Travel Stamps',          fn: () => resetStampsCore(user) },
      { key: 'ticker-feed',      label: 'Ticker Feed',            fn: () => resetFeedCore(user) },
      { key: 'badges',           label: 'Badge Progress',         fn: () => resetBadgesCore(user) },
    ]

    const results = []
    for (const store of STORES) {
      try {
        const data = store.fn()
        results.push({ store: store.key, label: store.label, success: true, data })
      } catch (err) {
        results.push({ store: store.key, label: store.label, success: false, error: err.message || 'Unknown error' })
      }
    }

    const failed    = results.filter(r => !r.success)
    const succeeded = results.filter(r => r.success)
    ok(res, {
      results,
      summary: { total: results.length, succeeded: succeeded.length, failed: failed.length },
      message: failed.length === 0
        ? 'All stores reset successfully'
        : `${succeeded.length} of ${results.length} stores reset — ${failed.length} failed`,
    })
  } catch (err) {
    serverError(res, err, 'resetAll')
  }
}
