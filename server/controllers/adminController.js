/**
 * Admin Controller — system-level and founder-only endpoints.
 * All routes here require admin or founder role.
 */

import { buildPermissionMatrix, getPermissionsForRole, ROLES } from '../config/permissions.js'
import { ok, fail, serverError } from '../utils/response.js'

/** GET /api/admin/permissions — full permission matrix (admin+). */
export function getPermissionMatrix(_req, res) {
  try {
    ok(res, buildPermissionMatrix())
  } catch (err) {
    serverError(res, err, 'getPermissionMatrix')
  }
}

/** GET /api/admin/roles — role definitions and level numbers (admin+). */
export function getRoles(_req, res) {
  try {
    const roles = Object.entries(ROLES).map(([name, level]) => ({
      name,
      level,
      permissions: getPermissionsForRole(name),
    }))
    ok(res, roles)
  } catch (err) {
    serverError(res, err, 'getRoles')
  }
}

/** GET /api/admin/my-permissions — what the current user can do (any auth'd user). */
export function getMyPermissions(req, res) {
  try {
    const role = req.user?.role || 'guest'
    ok(res, {
      role,
      permissions: getPermissionsForRole(role),
    })
  } catch (err) {
    serverError(res, err, 'getMyPermissions')
  }
}

/**
 * POST /api/admin/money-settings — FOUNDER ONLY.
 * Placeholder for Phase 8+ monetization wiring.
 */
export function updateMoneySettings(req, res) {
  try {
    // Founder-only — roleMiddleware enforces this before we reach here
    const { pricingTier, commissionRate, billingCycle } = req.body
    if (!pricingTier && commissionRate == null && !billingCycle) {
      return fail(res, 'At least one money setting field is required')
    }
    // Prototype: acknowledge receipt, no-op until Phase 8
    ok(res, {
      acknowledged: true,
      message:      'Money settings received — integration wired in Phase 8',
      received:     { pricingTier, commissionRate, billingCycle },
    })
  } catch (err) {
    serverError(res, err, 'updateMoneySettings')
  }
}

/**
 * GET /api/admin/staff — list staff accounts (manager+).
 * Placeholder until Phase 8 auth system.
 */
export function listStaff(_req, res) {
  try {
    ok(res, {
      message: 'Staff management — full roster available in Phase 8',
      prototype: true,
      roles: Object.keys(ROLES).filter(r => r !== 'guest'),
    })
  } catch (err) {
    serverError(res, err, 'listStaff')
  }
}

/**
 * DELETE /api/admin/data-wipe — FOUNDER ONLY.
 * Requires double confirmation via header X-Confirm-Wipe: CONFIRM.
 */
export function dataWipe(req, res) {
  try {
    const confirm = req.headers['x-confirm-wipe']
    if (confirm !== 'CONFIRM') {
      return fail(res, 'Data wipe requires header X-Confirm-Wipe: CONFIRM', 400)
    }
    // Prototype: log intent but do not execute
    ok(res, {
      acknowledged: true,
      message:      'Data wipe acknowledged — not executed in prototype mode',
      prototype:    true,
    })
  } catch (err) {
    serverError(res, err, 'dataWipe')
  }
}
