/**
 * Auth Service — Phase 10 (Auth v2)
 * Handles PIN/credential hashing, JWT lifecycle, session management,
 * lockout enforcement, login attempt logging, and refresh token rotation.
 *
 * SECURITY RULES enforced here:
 * - Raw PINs are NEVER logged or stored
 * - Credential hashes are NEVER returned to any caller
 * - Founder login requires email + PIN + founder challenge
 * - bcrypt with cost factor 10 for all hashes
 * - Cookie maxAge always matches JWT lifetime per role
 * - Refresh tokens use secure random bytes, stored as bcrypt hashes
 */

import bcrypt from 'bcrypt'
import jwt    from 'jsonwebtoken'
import crypto from 'crypto'

import { isDbAvailable, query } from '../db/connection.js'
import { authConfig }           from '../config/authConfig.js'

const SALT_ROUNDS = 10

// ── Hashing ───────────────────────────────────────────────────

export const hashPin = (pin) =>
  bcrypt.hash(String(pin).trim(), SALT_ROUNDS)

export const verifyPin = (pin, hash) =>
  hash ? bcrypt.compare(String(pin).trim(), hash) : Promise.resolve(false)

export const hashFounderSecret = (secret) =>
  bcrypt.hash(String(secret).trim(), SALT_ROUNDS)

export const verifyFounderSecret = (secret, hash) =>
  hash ? bcrypt.compare(String(secret).trim(), hash) : Promise.resolve(false)

export const hashToken = (token) =>
  bcrypt.hash(token, SALT_ROUNDS)

export const verifyToken = (token, hash) =>
  hash ? bcrypt.compare(token, hash) : Promise.resolve(false)

// ── JWT ───────────────────────────────────────────────────────

/**
 * Creates a signed JWT and a unique token ID (jti) for session tracking.
 * @param {{ userId, role, email, displayName, staffId?, profileId? }} user
 * @returns {{ token: string, tokenId: string, expiresIn: string }}
 */
export function createJwtForUser(user) {
  const tokenId  = crypto.randomUUID()
  const expiresIn = getExpiresIn(user.role)

  const payload = {
    sub:         user.userId,
    role:        user.role,
    email:       user.email       || null,
    displayName: user.displayName || null,
    jti:         tokenId,
  }
  if (user.staffId)   payload.staffId   = user.staffId
  if (user.profileId) payload.profileId = user.profileId

  const token = jwt.sign(payload, authConfig.JWT_SECRET, { expiresIn })

  return { token, tokenId, expiresIn }
}

/**
 * Verifies a JWT and returns the decoded payload, or null if invalid/expired.
 */
export function verifyJwtToken(token) {
  try {
    return jwt.verify(token, authConfig.JWT_SECRET)
  } catch { return null }
}

// ── Session management ────────────────────────────────────────

/**
 * Persists a new auth session record tied to the JWT's tokenId.
 */
export async function createAuthSession(user, tokenId, req) {
  if (!isDbAvailable()) return tokenId
  const expiresAt = new Date(Date.now() + getExpiresInMs(user.role))
  try {
    await query(
      `INSERT INTO auth_sessions
         (session_token_id, user_id, role, expires_at, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (session_token_id) DO NOTHING`,
      [
        tokenId,
        user.userId,
        user.role,
        expiresAt,
        req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
        req?.headers?.['user-agent'] || 'unknown',
      ]
    )
  } catch (err) {
    console.warn('[authService] createAuthSession:', err.message)
  }
  return tokenId
}

/**
 * Marks a session as revoked.
 */
export async function revokeAuthSession(sessionTokenId) {
  if (!isDbAvailable() || !sessionTokenId) return false
  try {
    await query(
      `UPDATE auth_sessions SET revoked=true, revoked_at=NOW() WHERE session_token_id=$1`,
      [sessionTokenId]
    )
    return true
  } catch { return false }
}

/**
 * Returns true if the session has been revoked or has expired.
 */
export async function isSessionRevoked(sessionTokenId) {
  if (!isDbAvailable() || !sessionTokenId) return false
  try {
    const result = await query(
      `SELECT revoked, expires_at FROM auth_sessions WHERE session_token_id=$1`,
      [sessionTokenId]
    )
    const row = result.rows[0]
    if (!row) return false
    if (row.revoked) return true
    if (new Date(row.expires_at) < new Date()) return true
    return false
  } catch { return false }
}

// ── Passport Member Refresh Token Rotation ────────────────────

/**
 * Issues a new refresh token for a Passport Member profile.
 * Returns the raw token (only time it is visible — must be stored by caller).
 */
export async function createPassportRefreshToken(profileId, req) {
  if (!isDbAvailable()) return null
  const rawToken   = crypto.randomBytes(48).toString('hex')
  const tokenHash  = await hashToken(rawToken)
  const expiresAt  = new Date(Date.now() + authConfig.PASSPORT_MEMBER_REFRESH_EXPIRES_IN_MS)

  try {
    await query(
      `INSERT INTO passport_member_refresh_tokens
         (profile_id, token_hash, device_label, ip_address, user_agent, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        profileId,
        tokenHash,
        req?.headers?.['x-device-label'] || 'default',
        req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
        req?.headers?.['user-agent'] || 'unknown',
        expiresAt,
      ]
    )
    return rawToken
  } catch (err) {
    console.warn('[authService] createPassportRefreshToken:', err.message)
    return null
  }
}

/**
 * Rotates a Passport Member refresh token.
 * Old token is revoked; a new one is issued and returned.
 * Returns null if the token is invalid, expired, or already revoked.
 */
export async function rotatePassportRefreshToken(rawOldToken, profileId, req) {
  if (!isDbAvailable()) return null

  // Fetch all active (non-revoked, non-expired) tokens for this profile
  try {
    const result = await query(
      `SELECT id, token_id, token_hash, expires_at
       FROM passport_member_refresh_tokens
       WHERE profile_id=$1 AND revoked=false AND expires_at > NOW()`,
      [profileId]
    )

    let matched = null
    for (const row of result.rows) {
      const ok = await verifyToken(rawOldToken, row.token_hash)
      if (ok) { matched = row; break }
    }

    if (!matched) return null

    // Revoke the old token
    await query(
      `UPDATE passport_member_refresh_tokens
       SET revoked=true, revoked_at=NOW(), revoke_reason='rotated'
       WHERE id=$1`,
      [matched.id]
    )

    // Issue a new token
    return createPassportRefreshToken(profileId, req)
  } catch (err) {
    console.warn('[authService] rotatePassportRefreshToken:', err.message)
    return null
  }
}

/**
 * Revokes all refresh tokens for a Passport Member profile (logout all devices).
 */
export async function revokeAllPassportRefreshTokens(profileId, reason = 'logout') {
  if (!isDbAvailable()) return false
  try {
    await query(
      `UPDATE passport_member_refresh_tokens
       SET revoked=true, revoked_at=NOW(), revoke_reason=$2
       WHERE profile_id=$1 AND revoked=false`,
      [profileId, reason]
    )
    return true
  } catch { return false }
}

// ── Credential lookup ─────────────────────────────────────────

/**
 * Returns raw credentials row for a user (hashes only — never returned to frontend).
 */
export async function getCredentials(userId) {
  if (!isDbAvailable()) return null
  try {
    const result = await query(
      `SELECT * FROM auth_credentials WHERE user_id=$1 LIMIT 1`,
      [userId]
    )
    return result.rows[0] || null
  } catch { return null }
}

/**
 * Returns all active users of the given role(s) with their credentials.
 * Used for PIN-only fallback scan (legacy / no staff ID).
 */
export async function getActiveUsersWithCredentials(roles) {
  if (!isDbAvailable()) return []
  const roleList = Array.isArray(roles) ? roles : [roles]
  try {
    const result = await query(
      `SELECT su.*, ac.pin_hash, ac.failed_attempts, ac.locked_until, ac.staff_id
       FROM system_users su
       LEFT JOIN auth_credentials ac ON su.user_id = ac.user_id
       WHERE su.role = ANY($1) AND su.status = 'active'`,
      [roleList]
    )
    return result.rows
  } catch { return [] }
}

/**
 * Looks up a single active staff user by Staff ID (ATL-001 format).
 * Used for targeted Staff ID + PIN login — prevents lockout amplification.
 */
export async function getActiveUserByStaffId(staffId) {
  if (!isDbAvailable()) return null
  try {
    const result = await query(
      `SELECT su.*, ac.pin_hash, ac.failed_attempts, ac.locked_until, ac.staff_id AS cred_staff_id
       FROM system_users su
       LEFT JOIN auth_credentials ac ON su.user_id = ac.user_id
       WHERE (su.staff_id = $1 OR ac.staff_id = $1)
         AND su.status = 'active'
       LIMIT 1`,
      [staffId.toUpperCase()]
    )
    return result.rows[0] || null
  } catch { return null }
}

/**
 * Returns a single active user by email with optional role filter.
 */
export async function getActiveUserByEmail(email, roles) {
  if (!isDbAvailable()) return null
  const roleList = Array.isArray(roles) ? roles : roles ? [roles] : null
  try {
    const sql = roleList
      ? `SELECT su.*, ac.pin_hash, ac.founder_secret_hash, ac.failed_attempts, ac.locked_until
         FROM system_users su
         LEFT JOIN auth_credentials ac ON su.user_id = ac.user_id
         WHERE LOWER(su.email)=LOWER($1) AND su.role = ANY($2) AND su.status='active'`
      : `SELECT su.*, ac.pin_hash, ac.founder_secret_hash, ac.failed_attempts, ac.locked_until
         FROM system_users su
         LEFT JOIN auth_credentials ac ON su.user_id = ac.user_id
         WHERE LOWER(su.email)=LOWER($1) AND su.status='active'`
    const params = roleList ? [email, roleList] : [email]
    const result = await query(sql, params)
    return result.rows[0] || null
  } catch { return null }
}

/**
 * Returns a single active Passport Member profile by email or phone.
 */
export async function getPassportMemberByContact(contact) {
  if (!isDbAvailable()) return null
  try {
    const result = await query(
      `SELECT pmp.*, su.display_name, su.status as user_status
       FROM passport_member_profiles pmp
       LEFT JOIN system_users su ON pmp.user_id = su.user_id
       WHERE (LOWER(pmp.email)=LOWER($1) OR pmp.phone=$1)
         AND pmp.is_verified=true
       LIMIT 1`,
      [contact]
    )
    return result.rows[0] || null
  } catch { return null }
}

// ── Lockout ───────────────────────────────────────────────────

export async function lockUserIfNeeded(userId) {
  if (!isDbAvailable()) return null
  try {
    const result = await query(
      `UPDATE auth_credentials
       SET
         failed_attempts = failed_attempts + 1,
         locked_until    = CASE
           WHEN failed_attempts + 1 >= $2
           THEN NOW() + ($3 || ' minutes')::INTERVAL
           ELSE locked_until
         END,
         updated_at = NOW()
       WHERE user_id=$1
       RETURNING failed_attempts, locked_until`,
      [userId, authConfig.MAX_FAILED_ATTEMPTS, authConfig.LOCKOUT_MINUTES]
    )
    return result.rows[0] || null
  } catch { return null }
}

export async function clearFailedAttempts(userId) {
  if (!isDbAvailable()) return
  try {
    await query(
      `UPDATE auth_credentials
       SET failed_attempts=0, locked_until=NULL, updated_at=NOW()
       WHERE user_id=$1`,
      [userId]
    )
  } catch {}
}

export function isLocked(creds) {
  if (!creds?.locked_until) return false
  return new Date(creds.locked_until) > new Date()
}

// ── Login attempt logging ─────────────────────────────────────

export async function recordLoginAttempt({ userId, email, roleAttempted, success, failureReason, req }) {
  if (!isDbAvailable()) return
  try {
    await query(
      `INSERT INTO pin_login_attempts
         (user_id, email, role_attempted, success, failure_reason, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        userId        || null,
        email         || null,
        roleAttempted || null,
        success,
        failureReason || null,
        req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
        req?.headers?.['user-agent'] || 'unknown',
      ]
    )
  } catch (err) {
    console.warn('[authService] recordLoginAttempt:', err.message)
  }
}

export async function recordFounderAccessEvent({ founderUserId, eventType, metadata, req }) {
  if (!isDbAvailable()) return
  try {
    await query(
      `INSERT INTO founder_access_events
         (founder_user_id, event_type, metadata, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        founderUserId,
        eventType,
        JSON.stringify(metadata || {}),
        req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
        req?.headers?.['user-agent'] || 'unknown',
      ]
    )
  } catch (err) {
    console.warn('[authService] recordFounderAccessEvent:', err.message)
  }
}

// ── Cookie helpers ────────────────────────────────────────────

/**
 * Sets the HttpOnly auth cookie.
 * maxAge is matched to the JWT lifetime for the given role.
 * @param {import('express').Response} res
 * @param {string} token — signed JWT
 * @param {string} role  — user role (determines maxAge)
 */
export function setAuthCookie(res, token, role) {
  res.cookie(authConfig.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure:   authConfig.AUTH_COOKIE_SECURE,
    sameSite: authConfig.AUTH_COOKIE_SAMESITE,
    path:     authConfig.AUTH_COOKIE_PATH,
    maxAge:   getExpiresInMs(role),
  })
}

/**
 * Sets a separate refresh token cookie for Passport Members.
 * Long-lived (90 days), HttpOnly, secure.
 */
export function setRefreshCookie(res, refreshToken) {
  res.cookie(authConfig.REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure:   authConfig.AUTH_COOKIE_SECURE,
    sameSite: authConfig.AUTH_COOKIE_SAMESITE,
    path:     '/api/auth',
    maxAge:   authConfig.PASSPORT_MEMBER_REFRESH_EXPIRES_IN_MS,
  })
}

export function clearAuthCookie(res) {
  res.clearCookie(authConfig.AUTH_COOKIE_NAME, { path: authConfig.AUTH_COOKIE_PATH })
}

export function clearRefreshCookie(res) {
  res.clearCookie(authConfig.REFRESH_COOKIE_NAME, { path: '/api/auth' })
}

// ── PIN Reset ─────────────────────────────────────────────────

/**
 * Resets a user's PIN hash. Never logs or returns the raw PIN.
 */
export async function resetUserPin(userId, newPin) {
  if (!isDbAvailable()) return false
  const hashed = await hashPin(newPin)
  try {
    await query(
      `UPDATE auth_credentials
       SET pin_hash = $1, failed_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE user_id = $2`,
      [hashed, userId]
    )
    return true
  } catch (err) {
    console.error('[authService] resetUserPin failed:', err.message)
    return false
  }
}

// ── Developer grant validation ────────────────────────────────

/**
 * Returns a valid, active dev access grant for a user, or null.
 */
export async function getActiveDevGrant(userId) {
  if (!isDbAvailable()) return null
  try {
    const result = await query(
      `SELECT * FROM dev_access_grants
       WHERE user_id=$1 AND revoked=false AND expires_at > NOW()
       LIMIT 1`,
      [userId]
    )
    return result.rows[0] || null
  } catch { return null }
}

// ── Private helpers ───────────────────────────────────────────

function getExpiresIn(role) {
  switch (role) {
    case 'founder_level_0': return authConfig.FOUNDER_JWT_EXPIRES_IN
    case 'admin':           return authConfig.ADMIN_JWT_EXPIRES_IN
    case 'manager':         return authConfig.ADMIN_JWT_EXPIRES_IN
    case 'human_mentor':    return authConfig.HUMAN_MENTOR_JWT_EXPIRES_IN
    case 'developer':       return authConfig.DEVELOPER_JWT_EXPIRES_IN
    case 'passport_member': return authConfig.PASSPORT_MEMBER_JWT_EXPIRES_IN
    default:                return authConfig.STAFF_JWT_EXPIRES_IN
  }
}

function getExpiresInMs(role) {
  switch (role) {
    case 'founder_level_0': return authConfig.FOUNDER_JWT_EXPIRES_IN_MS
    case 'admin':           return authConfig.ADMIN_JWT_EXPIRES_IN_MS
    case 'manager':         return authConfig.ADMIN_JWT_EXPIRES_IN_MS
    case 'human_mentor':    return authConfig.HUMAN_MENTOR_JWT_EXPIRES_IN_MS
    case 'developer':       return authConfig.DEVELOPER_JWT_EXPIRES_IN_MS
    case 'passport_member': return authConfig.PASSPORT_MEMBER_JWT_EXPIRES_IN_MS
    default:                return authConfig.STAFF_JWT_EXPIRES_IN_MS
  }
}
