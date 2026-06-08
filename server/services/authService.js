/**
 * Auth Service — Phase 8.5
 * Handles PIN/credential hashing, JWT lifecycle, session management,
 * lockout enforcement, and login attempt logging.
 *
 * SECURITY RULES enforced here:
 * - Raw PINs are NEVER logged or stored
 * - Credential hashes are NEVER returned to any caller
 * - Founder login requires email + PIN + founder challenge
 * - bcrypt with cost factor 10 for all hashes
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

// ── JWT ───────────────────────────────────────────────────────

/**
 * Creates a signed JWT and a unique token ID (jti) for session tracking.
 * @param {{ userId, role, email, displayName }} user
 * @returns {{ token: string, tokenId: string, expiresIn: string }}
 */
export function createJwtForUser(user) {
  const tokenId  = crypto.randomUUID()
  const expiresIn = getExpiresIn(user.role)

  const token = jwt.sign(
    {
      sub:         user.userId,
      role:        user.role,
      email:       user.email       || null,
      displayName: user.displayName || null,
      jti:         tokenId,
    },
    authConfig.JWT_SECRET,
    { expiresIn }
  )

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
 * Marks a session as revoked. The JWT itself cannot be un-issued,
 * but /api/auth/me and requireAuth check for revoked sessions.
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
 * Used for PIN-only staff login (no username provided).
 * NEVER includes the hashes in returned "user" objects — only for internal matching.
 */
export async function getActiveUsersWithCredentials(roles) {
  if (!isDbAvailable()) return []
  const roleList = Array.isArray(roles) ? roles : [roles]
  try {
    const result = await query(
      `SELECT su.*, ac.pin_hash, ac.founder_secret_hash, ac.failed_attempts, ac.locked_until
       FROM system_users su
       LEFT JOIN auth_credentials ac ON su.user_id = ac.user_id
       WHERE su.role = ANY($1) AND su.status = 'active'`,
      [roleList]
    )
    return result.rows
  } catch { return [] }
}

/**
 * Returns a single active user by email.
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
      `UPDATE auth_credentials SET failed_attempts=0, locked_until=NULL, updated_at=NOW() WHERE user_id=$1`,
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

export function setAuthCookie(res, token) {
  res.cookie(authConfig.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure:   authConfig.AUTH_COOKIE_SECURE,
    sameSite: authConfig.AUTH_COOKIE_SAMESITE,
    path:     authConfig.AUTH_COOKIE_PATH,
    maxAge:   8 * 60 * 60 * 1000,
  })
}

export function clearAuthCookie(res) {
  res.clearCookie(authConfig.AUTH_COOKIE_NAME, { path: authConfig.AUTH_COOKIE_PATH })
}

// ── PIN Reset ─────────────────────────────────────────────────

/**
 * Resets a user's PIN hash. Never logs or returns the raw PIN.
 * @param {string} userId
 * @param {string} newPin — raw PIN (4–8 digits). Hashed here; never stored raw.
 * @returns {boolean} success
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

// ── Private ───────────────────────────────────────────────────

function getExpiresIn(role) {
  if (role === 'founder_level_0') return authConfig.FOUNDER_SESSION_EXPIRES_IN
  if (['admin', 'manager'].includes(role)) return authConfig.ADMIN_SESSION_EXPIRES_IN
  return authConfig.STAFF_PIN_EXPIRES_IN
}

function getExpiresInMs(role) {
  if (role === 'founder_level_0') return authConfig.FOUNDER_SESSION_EXPIRES_IN_MS
  if (['admin', 'manager'].includes(role)) return authConfig.ADMIN_SESSION_EXPIRES_IN_MS
  return authConfig.STAFF_PIN_EXPIRES_IN_MS
}
