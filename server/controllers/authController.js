/**
 * Auth Controller — Phase 10 (Auth v2)
 * Handles all login flows: staff PIN, admin, founder, mentor, developer,
 * Passport Member promotion, session management.
 *
 * SECURITY RULES:
 * - Credential hashes NEVER leave this file
 * - Raw PINs are NEVER logged
 * - Founder challenge must come from env var — never hardcoded
 * - Founder route requires email + PIN + founder challenge (all three)
 * - Staff PIN login scopes to Staff ID when provided (prevents lockout amplification)
 * - Developer login requires active dev grant from Founder L0
 * - Cookie maxAge always matches JWT lifetime per role
 */

import * as authService          from '../services/authService.js'
import * as securityEventService from '../services/securityEventService.js'
import { authConfig }            from '../config/authConfig.js'
import { ok, fail, serverError } from '../utils/response.js'
import { getEffectivePermissions } from '../config/roleMap.js'
import { isDbAvailable, query }  from '../db/connection.js'
import crypto                    from 'crypto'

// ── Staff PIN Login ───────────────────────────────────────────
/**
 * POST /api/auth/staff-pin-login
 * Body: { pin, staffId? }
 *
 * When staffId is provided → targeted lookup (prevents lockout amplification).
 * When staffId is absent   → full scan (legacy / prototype mode only).
 *
 * SECURITY FIX: On scan-mode failure, we no longer increment failed_attempts
 * for all staff users. Lockout only applies to targeted (staffId) lookups.
 */
export async function staffPinLogin(req, res) {
  try {
    const { pin, staffId } = req.body || {}
    if (!pin) return fail(res, 'PIN is required')
    if (String(pin).length < 4) return fail(res, 'PIN must be at least 4 digits')

    // ── Targeted login (Staff ID + PIN) ──────────────────────
    if (staffId) {
      const user = await authService.getActiveUserByStaffId(staffId.trim().toUpperCase())

      if (!user) {
        await authService.recordLoginAttempt({
          roleAttempted: 'staff',
          success:       false,
          failureReason: 'staff_id_not_found',
          req,
        })
        await bcryptDelay()
        return fail(res, 'Invalid Staff ID or PIN.', 401)
      }

      if (authService.isLocked(user)) {
        await authService.recordLoginAttempt({
          userId:        user.user_id,
          roleAttempted: 'staff',
          success:       false,
          failureReason: 'account_locked',
          req,
        })
        return fail(res, 'Account temporarily locked. Contact a manager.', 423)
      }

      const pinOk = await authService.verifyPin(pin, user.pin_hash)
      if (!pinOk) {
        await authService.lockUserIfNeeded(user.user_id)
        await authService.recordLoginAttempt({
          userId:        user.user_id,
          roleAttempted: user.role,
          success:       false,
          failureReason: 'invalid_pin',
          req,
        })
        await securityEventService.recordAccessDenied(user.user_id, user.role, '/api/auth/staff-pin-login', 'staff')
        return fail(res, 'Invalid Staff ID or PIN.', 401)
      }

      return await completeStaffLogin(res, user, req)
    }

    // ── Scan-mode login (PIN only — legacy / prototype) ──────
    const staffUsers = await authService.getActiveUsersWithCredentials(['staff'])
    let matched = null

    for (const u of staffUsers) {
      if (authService.isLocked(u)) continue
      if (!u.pin_hash) continue
      const pinOk = await authService.verifyPin(pin, u.pin_hash)
      if (pinOk) { matched = u; break }
    }

    if (!matched) {
      // SECURITY FIX: No lockout increments on scan failure — we don't know
      // which user was targeted. Only log the attempt.
      await authService.recordLoginAttempt({
        roleAttempted: 'staff',
        success:       false,
        failureReason: 'invalid_pin_scan',
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

    return await completeStaffLogin(res, matched, req)
  } catch (err) {
    serverError(res, err, 'staffPinLogin')
  }
}

async function completeStaffLogin(res, user, req) {
  await authService.clearFailedAttempts(user.user_id)

  const { token, tokenId } = authService.createJwtForUser({
    userId:      user.user_id,
    role:        user.role,
    email:       user.email,
    displayName: user.display_name,
    staffId:     user.staff_id || null,
  })

  await authService.createAuthSession({ userId: user.user_id, role: user.role }, tokenId, req)
  authService.setAuthCookie(res, token, user.role)

  await authService.recordLoginAttempt({
    userId:        user.user_id,
    roleAttempted: user.role,
    success:       true,
    req,
  })
  await securityEventService.recordAccessGranted(user.user_id, user.role, '/api/auth/staff-pin-login')

  return ok(res, {
    userId:      user.user_id,
    role:        user.role,
    displayName: user.display_name,
    staffId:     user.staff_id || null,
    permissions: getEffectivePermissions(user.role),
  })
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
          'Founder Level 0 accounts require three-factor authentication. ' +
          'Please use the Founder Login page.',
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
    authService.setAuthCookie(res, token, user.role)

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
      permissions: getEffectivePermissions(user.role),
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
    authService.setAuthCookie(res, token, 'founder_level_0')

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
      permissions: getEffectivePermissions('founder_level_0'),
    })
  } catch (err) {
    serverError(res, err, 'founderLogin')
  }
}

// ── Human Mentor Login (email + PIN) ─────────────────────────
/**
 * POST /api/auth/mentor-login
 * Body: { email, pin }
 * Allowed roles: human_mentor only.
 * Created by Admin only. Mentor cannot self-register.
 */
export async function mentorLogin(req, res) {
  try {
    const { email, pin } = req.body || {}
    if (!email || !pin) return fail(res, 'Email and PIN are required')

    const user = await authService.getActiveUserByEmail(email, ['human_mentor'])

    if (!user) {
      await authService.recordLoginAttempt({
        email,
        roleAttempted: 'human_mentor',
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
        roleAttempted: 'human_mentor',
        success:       false,
        failureReason: 'account_locked',
        req,
      })
      return fail(res, 'Account temporarily locked. Contact an administrator.', 423)
    }

    const pinOk = await authService.verifyPin(pin, user.pin_hash)
    if (!pinOk) {
      await authService.lockUserIfNeeded(user.user_id)
      await authService.recordLoginAttempt({
        userId:        user.user_id,
        email,
        roleAttempted: 'human_mentor',
        success:       false,
        failureReason: 'invalid_pin',
        req,
      })
      await securityEventService.recordAccessDenied(user.user_id, 'human_mentor', '/api/auth/mentor-login', 'human_mentor')
      return fail(res, 'Invalid credentials', 401)
    }

    await authService.clearFailedAttempts(user.user_id)

    const { token, tokenId } = authService.createJwtForUser({
      userId:      user.user_id,
      role:        'human_mentor',
      email:       user.email,
      displayName: user.display_name,
    })

    await authService.createAuthSession({ userId: user.user_id, role: 'human_mentor' }, tokenId, req)
    authService.setAuthCookie(res, token, 'human_mentor')

    await authService.recordLoginAttempt({
      userId:        user.user_id,
      email,
      roleAttempted: 'human_mentor',
      success:       true,
      req,
    })
    await securityEventService.recordAccessGranted(user.user_id, 'human_mentor', '/api/auth/mentor-login')

    return ok(res, {
      userId:           user.user_id,
      role:             'human_mentor',
      email:            user.email,
      displayName:      user.display_name,
      mentorSpecialties: user.mentor_specialties || [],
      permissions:      getEffectivePermissions('human_mentor'),
    })
  } catch (err) {
    serverError(res, err, 'mentorLogin')
  }
}

// ── Developer Login (email + PIN + active grant) ──────────────
/**
 * POST /api/auth/dev-login
 * Body: { email, pin }
 * Allowed roles: developer only.
 * Requires an active, non-expired dev_access_grant issued by Founder L0.
 * Developer login is ONLY available on /dev-login — never on /admin-login.
 */
export async function devLogin(req, res) {
  try {
    const { email, pin } = req.body || {}
    if (!email || !pin) return fail(res, 'Email and PIN are required')

    const user = await authService.getActiveUserByEmail(email, ['developer'])

    if (!user) {
      await authService.recordLoginAttempt({
        email,
        roleAttempted: 'developer',
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
        roleAttempted: 'developer',
        success:       false,
        failureReason: 'account_locked',
        req,
      })
      return fail(res, 'Account temporarily locked. Contact Founder Level 0.', 423)
    }

    // Verify active dev access grant — required for every dev login
    const grant = await authService.getActiveDevGrant(user.user_id)
    if (!grant) {
      await authService.recordLoginAttempt({
        userId:        user.user_id,
        email,
        roleAttempted: 'developer',
        success:       false,
        failureReason: 'no_active_dev_grant',
        req,
      })
      await securityEventService.recordSecurityEvent(
        user.user_id, 'developer',
        'security.dev_login_no_grant', '/api/auth/dev-login',
        { email, ip: req?.ip }
      )
      return fail(res,
        'No active developer access grant found. Contact Founder Level 0 to request access.',
        403)
    }

    const pinOk = await authService.verifyPin(pin, user.pin_hash)
    if (!pinOk) {
      await authService.lockUserIfNeeded(user.user_id)
      await authService.recordLoginAttempt({
        userId:        user.user_id,
        email,
        roleAttempted: 'developer',
        success:       false,
        failureReason: 'invalid_pin',
        req,
      })
      await securityEventService.recordAccessDenied(user.user_id, 'developer', '/api/auth/dev-login', 'developer')
      return fail(res, 'Invalid credentials', 401)
    }

    await authService.clearFailedAttempts(user.user_id)

    const { token, tokenId } = authService.createJwtForUser({
      userId:      user.user_id,
      role:        'developer',
      email:       user.email,
      displayName: user.display_name,
    })

    await authService.createAuthSession({ userId: user.user_id, role: 'developer' }, tokenId, req)
    authService.setAuthCookie(res, token, 'developer')

    await authService.recordLoginAttempt({
      userId:        user.user_id,
      email,
      roleAttempted: 'developer',
      success:       true,
      req,
    })
    await securityEventService.recordSecurityEvent(
      user.user_id, 'developer',
      'developer.authenticated', '/api/auth/dev-login',
      { grantId: grant.grant_id }
    )

    return ok(res, {
      userId:      user.user_id,
      role:        'developer',
      email:       user.email,
      displayName: user.display_name,
      grantId:     grant.grant_id,
      grantExpires: grant.expires_at,
      permissions: getEffectivePermissions('developer'),
    })
  } catch (err) {
    serverError(res, err, 'devLogin')
  }
}

// ── Promote Guest → Passport Member ──────────────────────────
/**
 * POST /api/auth/promote-member
 * Body: { passportId, email?, phone?, displayName?, verificationCode? }
 *
 * Converts a guest session + passport into a verified Passport Member account.
 * Issues a 14-day JWT + refresh token.
 */
export async function promoteGuestToMember(req, res) {
  try {
    const { passportId, email, phone, displayName, verificationCode } = req.body || {}

    if (!passportId) return fail(res, 'passportId is required')
    if (!email && !phone) return fail(res, 'Email or phone is required for verification')

    // Check for existing profile
    if (email) {
      const existing = await authService.getPassportMemberByContact(email)
      if (existing) return fail(res, 'A Passport Member account already exists with this email', 409)
    }
    if (phone) {
      const existing = await authService.getPassportMemberByContact(phone)
      if (existing) return fail(res, 'A Passport Member account already exists with this phone number', 409)
    }

    if (!isDbAvailable()) {
      return fail(res, 'Database unavailable — cannot create member profile', 503)
    }

    // Verify passport record exists
    const passportResult = await query(
      `SELECT passport_id FROM passport_records WHERE passport_id=$1 LIMIT 1`,
      [passportId]
    )
    if (!passportResult.rows.length) return fail(res, 'Passport record not found', 404)

    // Create system_users record for the passport member
    const userId  = crypto.randomUUID()
    const profileId = crypto.randomUUID()

    await query(
      `INSERT INTO system_users
         (user_id, email, display_name, role, status)
       VALUES ($1,$2,$3,'passport_member','active')`,
      [userId, email || null, displayName || 'Passport Member']
    )

    // Create auth_credentials record (no PIN for passport members — they use JWT + refresh)
    await query(
      `INSERT INTO auth_credentials (user_id, credential_type) VALUES ($1,'email_pin')`,
      [userId]
    )

    // Create passport_member_profiles record
    const verifiedMethod = email ? 'email' : 'phone'
    await query(
      `INSERT INTO passport_member_profiles
         (profile_id, user_id, passport_id, email, phone, display_name, is_verified, verified_at, verified_method)
       VALUES ($1,$2,$3,$4,$5,$6,true,NOW(),$7)`,
      [
        profileId,
        userId,
        passportId,
        email   || null,
        phone   || null,
        displayName || 'Passport Member',
        verifiedMethod,
      ]
    )

    // Issue 14-day JWT + refresh token rotation
    const { token, tokenId } = authService.createJwtForUser({
      userId,
      role:      'passport_member',
      email:     email || null,
      displayName: displayName || 'Passport Member',
      profileId,
    })

    await authService.createAuthSession({ userId, role: 'passport_member' }, tokenId, req)
    authService.setAuthCookie(res, token, 'passport_member')

    // Issue refresh token (rotation architecture)
    const refreshToken = await authService.createPassportRefreshToken(profileId, req)
    if (refreshToken) {
      authService.setRefreshCookie(res, refreshToken)
    }

    await authService.recordLoginAttempt({
      userId,
      email,
      roleAttempted: 'passport_member',
      success:       true,
      req,
    })
    await securityEventService.recordSecurityEvent(
      userId, 'passport_member',
      'auth.passport_member_promoted', '/api/auth/promote-member',
      { passportId, profileId, verifiedMethod }
    )

    return ok(res, {
      userId,
      profileId,
      role:        'passport_member',
      email:       email || null,
      phone:       phone || null,
      displayName: displayName || 'Passport Member',
      passportId,
      permissions: getEffectivePermissions('passport_member'),
    })
  } catch (err) {
    serverError(res, err, 'promoteGuestToMember')
  }
}

// ── Passport Member Refresh ───────────────────────────────────
/**
 * POST /api/auth/passport-refresh
 * Uses the refresh token from the cookie to issue a new 14-day JWT.
 * Rotates the refresh token on every use.
 */
export async function passportRefresh(req, res) {
  try {
    const rawRefreshToken = req.cookies?.[authConfig.REFRESH_COOKIE_NAME]
    if (!rawRefreshToken) return fail(res, 'No refresh token found', 401)

    // We need the profileId — try to get it from the (possibly expired) JWT
    const expiredCookie = req.cookies?.[authConfig.AUTH_COOKIE_NAME]
    let profileId = null
    if (expiredCookie) {
      try {
        // Decode without verification to get the profileId
        const decoded = JSON.parse(
          Buffer.from(expiredCookie.split('.')[1], 'base64').toString()
        )
        profileId = decoded?.profileId || null
      } catch {}
    }

    if (!profileId) return fail(res, 'Cannot identify member session — please log in again', 401)

    // Rotate the refresh token
    const newRefreshToken = await authService.rotatePassportRefreshToken(rawRefreshToken, profileId, req)
    if (!newRefreshToken) {
      authService.clearAuthCookie(res)
      authService.clearRefreshCookie(res)
      return fail(res, 'Refresh token is invalid, expired, or already used. Please log in again.', 401)
    }

    // Fetch the member profile to issue a new JWT
    const profileResult = await query(
      `SELECT pmp.*, su.display_name, su.email
       FROM passport_member_profiles pmp
       LEFT JOIN system_users su ON pmp.user_id = su.user_id
       WHERE pmp.profile_id=$1 LIMIT 1`,
      [profileId]
    )
    const profile = profileResult?.rows[0]
    if (!profile) return fail(res, 'Profile not found — please log in again', 401)

    // Revoke old JWT session
    const oldJti = req.user?.jti
    if (oldJti) await authService.revokeAuthSession(oldJti)

    const { token, tokenId } = authService.createJwtForUser({
      userId:      profile.user_id,
      role:        'passport_member',
      email:       profile.email || null,
      displayName: profile.display_name || null,
      profileId,
    })

    await authService.createAuthSession({ userId: profile.user_id, role: 'passport_member' }, tokenId, req)
    authService.setAuthCookie(res, token, 'passport_member')
    authService.setRefreshCookie(res, newRefreshToken)

    return ok(res, { refreshed: true, role: 'passport_member' })
  } catch (err) {
    serverError(res, err, 'passportRefresh')
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
      staffId:       user.staffId   || null,
      profileId:     user.profileId || null,
      mode:          user.mode,
      permissions:   getEffectivePermissions(user.role),
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

    // Revoke refresh tokens if passport member
    if (req.user?.role === 'passport_member' && req.user?.profileId) {
      await authService.revokeAllPassportRefreshTokens(req.user.profileId, 'logout')
    }

    authService.clearAuthCookie(res)
    authService.clearRefreshCookie(res)

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

    // Passport Member uses the dedicated passport-refresh endpoint
    if (user.role === 'passport_member') {
      return fail(res, 'Passport Members must use /api/auth/passport-refresh with a refresh token', 400)
    }

    if (user.jti) await authService.revokeAuthSession(user.jti)

    const { token, tokenId } = authService.createJwtForUser({
      userId:      user.id,
      role:        user.role,
      email:       user.email,
      displayName: user.displayName,
      staffId:     user.staffId || null,
    })
    await authService.createAuthSession({ userId: user.id, role: user.role }, tokenId, req)
    authService.setAuthCookie(res, token, user.role)
    ok(res, { refreshed: true, role: user.role })
  } catch (err) {
    serverError(res, err, 'refreshSession')
  }
}

// ── POST /api/auth/revoke-session — admin/founder only ────────
export async function revokeSession(req, res) {
  try {
    const { sessionTokenId } = req.body || {}
    if (!sessionTokenId) return fail(res, 'sessionTokenId required')
    const revoked = await authService.revokeAuthSession(sessionTokenId)
    await securityEventService.recordSecurityEvent(
      req.user?.id, req.user?.role, 'auth.session_revoked', '/api/auth/revoke-session',
      { sessionTokenId }
    )
    ok(res, { revoked, sessionTokenId })
  } catch (err) {
    serverError(res, err, 'revokeSession')
  }
}

// ── Timing helper ─────────────────────────────────────────────
function bcryptDelay() {
  return new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100))
}
