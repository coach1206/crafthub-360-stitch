/**
 * Auth Controller — Phase 8.5
 * Handles staff PIN, admin, and founder login flows.
 * Every login attempt is logged. Every founder action is recorded.
 *
 * SECURITY RULES:
 * - Credential hashes NEVER leave this file
 * - Raw PINs are NEVER logged
 * - Founder challenge must come from env var — never hardcoded check
 * - Founder route requires email + PIN + founder challenge (all three)
 */

import * as authService          from '../services/authService.js'
import * as securityEventService from '../services/securityEventService.js'
import { authConfig }            from '../config/authConfig.js'
import { ok, fail, serverError } from '../utils/response.js'
import { ROLE_MAP }              from '../config/roleMap.js'

// ── Staff PIN Login ───────────────────────────────────────────
/**
 * POST /api/auth/staff-pin-login
 * Body: { pin }
 * Accepts: staff roles only (staff)
 */
export async function staffPinLogin(req, res) {
  try {
    const { pin } = req.body || {}
    if (!pin) return fail(res, 'PIN is required')
    if (String(pin).length < 4) return fail(res, 'PIN must be at least 4 digits')

    // Search all active staff users for a PIN match
    const staffUsers = await authService.getActiveUsersWithCredentials(['staff'])
    let matched = null

    for (const u of staffUsers) {
      if (authService.isLocked(u)) continue
      if (!u.pin_hash) continue
      const ok_ = await authService.verifyPin(pin, u.pin_hash)
      if (ok_) { matched = u; break }
    }

    if (!matched) {
      // Increment failed attempts for all staff users with that pin attempt (best effort)
      if (staffUsers.length > 0) {
        for (const u of staffUsers) {
          await authService.lockUserIfNeeded(u.user_id)
        }
      }
      await authService.recordLoginAttempt({
        roleAttempted: 'staff',
        success:       false,
        failureReason: 'invalid_pin',
        req,
      })
      await securityEventService.recordAccessDenied('unknown', 'guest', '/api/auth/staff-pin-login', 'staff')
      return fail(res, 'Invalid PIN. Please try again.', 401)
    }

    if (authService.isLocked(matched)) {
      await authService.recordLoginAttempt({
        userId:        matched.user_id,
        roleAttempted: 'staff',
        success:       false,
        failureReason: 'account_locked',
        req,
      })
      return fail(res, 'Account temporarily locked. Please contact a manager.', 423)
    }

    await authService.clearFailedAttempts(matched.user_id)

    const { token, tokenId } = authService.createJwtForUser({
      userId:      matched.user_id,
      role:        matched.role,
      email:       matched.email,
      displayName: matched.display_name,
    })

    await authService.createAuthSession({ userId: matched.user_id, role: matched.role }, tokenId, req)
    authService.setAuthCookie(res, token)

    await authService.recordLoginAttempt({
      userId:        matched.user_id,
      roleAttempted: matched.role,
      success:       true,
      req,
    })
    await securityEventService.recordAccessGranted(matched.user_id, matched.role, '/api/auth/staff-pin-login')

    return ok(res, {
      userId:      matched.user_id,
      role:        matched.role,
      displayName: matched.display_name,
      permissions: ROLE_MAP[matched.role] || [],
    })
  } catch (err) {
    serverError(res, err, 'staffPinLogin')
  }
}

// ── Admin Login (email + PIN) ─────────────────────────────────
/**
 * POST /api/auth/admin-login
 * Body: { email, pin }
 * Allowed roles: manager, admin
 * Founder CANNOT use this endpoint.
 */
export async function adminLogin(req, res) {
  try {
    const { email, pin } = req.body || {}
    if (!email || !pin) return fail(res, 'Email and PIN are required')

    const user = await authService.getActiveUserByEmail(email, ['manager', 'admin'])

    if (!user) {
      // Check if this email belongs to a founder — give a helpful redirect instead of a silent fail
      const founderUser = await authService.getActiveUserByEmail(email, ['founder_level_0'])
      await authService.recordLoginAttempt({
        email,
        roleAttempted: 'manager_or_admin',
        success:       false,
        failureReason: founderUser ? 'founder_requires_separate_login' : 'user_not_found',
        req,
      })
      await bcryptDelay()
      if (founderUser) {
        return fail(res,
          'Founder Level 0 accounts require a separate login with three-factor authentication. ' +
          'Please use the Founder Login page (/founder-login) with your email, PIN, and founder challenge.',
          403)
      }
      return fail(res, 'Invalid credentials', 401)
    }

    if (authService.isLocked(user)) {
      await authService.recordLoginAttempt({
        userId:        user.user_id,
        email,
        roleAttempted: user.role,
        success:       false,
        failureReason: 'account_locked',
        req,
      })
      return fail(res, 'Account temporarily locked. Please contact an administrator.', 423)
    }

    const pinOk = await authService.verifyPin(pin, user.pin_hash)
    if (!pinOk) {
      await authService.lockUserIfNeeded(user.user_id)
      await authService.recordLoginAttempt({
        userId:        user.user_id,
        email,
        roleAttempted: user.role,
        success:       false,
        failureReason: 'invalid_pin',
        req,
      })
      await securityEventService.recordAccessDenied(user.user_id, user.role, '/api/auth/admin-login', user.role)
      return fail(res, 'Invalid credentials', 401)
    }

    await authService.clearFailedAttempts(user.user_id)

    const { token, tokenId } = authService.createJwtForUser({
      userId:      user.user_id,
      role:        user.role,
      email:       user.email,
      displayName: user.display_name,
    })

    await authService.createAuthSession({ userId: user.user_id, role: user.role }, tokenId, req)
    authService.setAuthCookie(res, token)

    await authService.recordLoginAttempt({
      userId:        user.user_id,
      email,
      roleAttempted: user.role,
      success:       true,
      req,
    })
    await securityEventService.recordAccessGranted(user.user_id, user.role, '/api/auth/admin-login')

    return ok(res, {
      userId:      user.user_id,
      role:        user.role,
      email:       user.email,
      displayName: user.display_name,
      permissions: ROLE_MAP[user.role] || [],
    })
  } catch (err) {
    serverError(res, err, 'adminLogin')
  }
}

// ── Founder Login (email + PIN + founder challenge) ───────────
/**
 * POST /api/auth/founder-login
 * Body: { email, pin, founderChallenge }
 * Only founder_level_0 may login here.
 * ALL THREE factors required — no partial matches allowed.
 */
export async function founderLogin(req, res) {
  try {
    const { email, pin, founderChallenge } = req.body || {}

    // Reject immediately if any factor is missing
    if (!email || !pin || !founderChallenge) {
      await authService.recordLoginAttempt({
        email,
        roleAttempted: 'founder_level_0',
        success:       false,
        failureReason: 'missing_factors',
        req,
      })
      return fail(res, 'Founder login requires email, PIN, and founder challenge', 400)
    }

    // Verify founder challenge secret is configured
    if (!authConfig.FOUNDER_CHALLENGE_SECRET) {
      console.error('[auth] FOUNDER_CHALLENGE_SECRET is not set — founder login disabled')
      return fail(res, 'Founder authentication is not configured on this system', 503)
    }

    const user = await authService.getActiveUserByEmail(email, ['founder_level_0'])

    if (!user) {
      await authService.recordLoginAttempt({
        email,
        roleAttempted: 'founder_level_0',
        success:       false,
        failureReason: 'user_not_found',
        req,
      })
      await bcryptDelay()
      return fail(res, 'Invalid credentials', 401)
    }

    if (authService.isLocked(user)) {
      await authService.recordLoginAttempt({
        userId:        user.user_id,
        email,
        roleAttempted: 'founder_level_0',
        success:       false,
        failureReason: 'account_locked',
        req,
      })
      await authService.recordFounderAccessEvent({
        founderUserId: user.user_id,
        eventType:     'founder.login.blocked.lockout',
        req,
      })
      return fail(res, 'Founder account temporarily locked.', 423)
    }

    // Verify PIN
    const pinOk = await authService.verifyPin(pin, user.pin_hash)
    if (!pinOk) {
      await authService.lockUserIfNeeded(user.user_id)
      await authService.recordLoginAttempt({
        userId:        user.user_id,
        email,
        roleAttempted: 'founder_level_0',
        success:       false,
        failureReason: 'invalid_pin',
        req,
      })
      await authService.recordFounderAccessEvent({
        founderUserId: user.user_id,
        eventType:     'founder.login.failed.invalid_pin',
        req,
      })
      return fail(res, 'Invalid credentials', 401)
    }

    // Verify founder challenge against env var
    const challengeOk = founderChallenge.trim() === authConfig.FOUNDER_CHALLENGE_SECRET.trim()
    if (!challengeOk) {
      await authService.lockUserIfNeeded(user.user_id)
      await authService.recordLoginAttempt({
        userId:        user.user_id,
        email,
        roleAttempted: 'founder_level_0',
        success:       false,
        failureReason: 'invalid_founder_challenge',
        req,
      })
      await authService.recordFounderAccessEvent({
        founderUserId: user.user_id,
        eventType:     'founder.login.failed.invalid_challenge',
        req,
      })
      await securityEventService.recordSecurityEvent(
        user.user_id, 'founder_level_0',
        'security.founder_challenge_failed', '/api/auth/founder-login',
        { email }
      )
      return fail(res, 'Invalid credentials', 401)
    }

    await authService.clearFailedAttempts(user.user_id)

    const { token, tokenId } = authService.createJwtForUser({
      userId:      user.user_id,
      role:        'founder_level_0',
      email:       user.email,
      displayName: user.display_name,
    })

    await authService.createAuthSession({ userId: user.user_id, role: 'founder_level_0' }, tokenId, req)
    authService.setAuthCookie(res, token)

    await authService.recordLoginAttempt({
      userId:        user.user_id,
      email,
      roleAttempted: 'founder_level_0',
      success:       true,
      req,
    })
    await authService.recordFounderAccessEvent({
      founderUserId: user.user_id,
      eventType:     'founder.login.success',
      metadata:      { sessionTokenId: tokenId },
      req,
    })
    await securityEventService.recordSecurityEvent(
      user.user_id, 'founder_level_0',
      'founder.authenticated', '/api/auth/founder-login'
    )

    return ok(res, {
      userId:      user.user_id,
      role:        'founder_level_0',
      email:       user.email,
      displayName: user.display_name,
      permissions: ROLE_MAP['founder_level_0'],
    })
  } catch (err) {
    serverError(res, err, 'founderLogin')
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────
export async function getMe(req, res) {
  try {
    const user = req.user
    if (!user || user.role === 'guest' || user.mode === 'prototype') {
      return ok(res, { authenticated: false, role: 'guest' })
    }
    ok(res, {
      authenticated: true,
      userId:        user.id,
      role:          user.role,
      email:         user.email,
      displayName:   user.displayName,
      mode:          user.mode,
      permissions:   ROLE_MAP[user.role] || [],
    })
  } catch (err) {
    serverError(res, err, 'getMe')
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────
export async function logout(req, res) {
  try {
    const jti = req.user?.jti
    if (jti) await authService.revokeAuthSession(jti)
    authService.clearAuthCookie(res)
    await securityEventService.recordSecurityEvent(
      req.user?.id, req.user?.role, 'auth.logout', '/api/auth/logout'
    )
    ok(res, { message: 'Logged out successfully' })
  } catch (err) {
    serverError(res, err, 'logout')
  }
}

// ── POST /api/auth/refresh ────────────────────────────────────
export async function refreshSession(req, res) {
  try {
    const user = req.user
    if (!user || !user.id || user.mode === 'prototype') {
      return fail(res, 'No active session to refresh', 401)
    }
    // Revoke old session
    if (user.jti) await authService.revokeAuthSession(user.jti)

    const { token, tokenId } = authService.createJwtForUser({
      userId:      user.id,
      role:        user.role,
      email:       user.email,
      displayName: user.displayName,
    })
    await authService.createAuthSession({ userId: user.id, role: user.role }, tokenId, req)
    authService.setAuthCookie(res, token)
    ok(res, { refreshed: true, role: user.role })
  } catch (err) {
    serverError(res, err, 'refreshSession')
  }
}

// ── POST /api/auth/revoke-session — admin/founder only ─────────
export async function revokeSession(req, res) {
  try {
    const { sessionTokenId } = req.body || {}
    if (!sessionTokenId) return fail(res, 'sessionTokenId required')
    const ok_ = await authService.revokeAuthSession(sessionTokenId)
    await securityEventService.recordSecurityEvent(
      req.user?.id, req.user?.role, 'auth.session_revoked', '/api/auth/revoke-session',
      { sessionTokenId }
    )
    ok(res, { revoked: ok_, sessionTokenId })
  } catch (err) {
    serverError(res, err, 'revokeSession')
  }
}

// ── Timing helper ─────────────────────────────────────────────
// Constant-time delay to prevent user enumeration via response time
function bcryptDelay() {
  return new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100))
}
