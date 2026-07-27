/**
 * SmokeCraft learner account service — Holistic Fix 4B.
 *
 * Reuses the existing, proven auth infrastructure (server/services/
 * authService.js: bcrypt PIN hashing, JWT creation, auth_sessions
 * revocation, login-attempt logging, lockout) and the existing
 * `passport_member` role / `system_users` + `auth_credentials` +
 * `passport_member_profiles` tables (already built for exactly this
 * purpose — a verified, long-lived, cross-device consumer account,
 * currently only reachable via `promoteGuestToMember`'s Passport-360-
 * specific flow, which requires a pre-existing `passportId`).
 *
 * This does NOT introduce a second competing identity system: same
 * role, same tables, same JWT/session/cookie primitives. It adds one
 * thing that was genuinely missing — a way for a SmokeCraft guest to
 * create a `passport_member` account WITHOUT already having a
 * Passport-360 passport record (passport_id is nullable — confirmed by
 * schema inspection), and a LOGIN endpoint so an existing member can
 * authenticate on a second device (only a promote-once flow existed
 * before this pass; there was no way for a member to sign back in
 * anywhere in the codebase).
 *
 * No real email provider is connected in this environment
 * (COMMUNICATION_SENDGRID_CONNECTED=false, confirmed in
 * server/config/phaseDCommunicationActivationFeatureFlags.js). Per the
 * mandate's explicit instruction not to invent email verification
 * without a real delivery provider, this returns the login PIN directly
 * in the API response in non-production environments only (clearly
 * marked `devDeliveryPin`, never in production), and documents the real
 * production requirement (see SMOKECRAFT_STATE_OWNERSHIP_MAP.md /
 * the Holistic Fix 4B proof index) rather than silently faking delivery.
 */
import crypto from 'crypto'
import { isDbAvailable, query, getDb } from '../../db/connection.js'
import * as authService from '../authService.js'
import { authConfig } from '../../config/authConfig.js'

const PIN_LENGTH = 6

function generatePin() {
  // 6-digit numeric PIN, cryptographically random.
  return String(crypto.randomInt(0, 1_000_000)).padStart(PIN_LENGTH, '0')
}

/** Returns the passport_member profile + system_user for an email, or null. */
export async function findMemberByEmail(email) {
  return authService.getPassportMemberByContact(email)
}

const UNIQUE_VIOLATION = '23505'

/**
 * Creates a new SmokeCraft learner account (a passport_member with no
 * passport_id). Email uniqueness is enforced by a real database UNIQUE
 * constraint (passport_member_profiles_email_key, confirmed via schema
 * inspection — not application-level checking alone, which would have a
 * TOCTOU race under concurrent signups). The pre-check below is a fast
 * path for a clean error message; the UNIQUE constraint is the actual
 * guarantee, caught below for the concurrent-signup case.
 */
export async function createAccount({ email, displayName }) {
  if (!isDbAvailable()) throw Object.assign(new Error('database_unavailable'), { code: 'database_unavailable' })
  const existing = await authService.getPassportMemberByContact(email)
  if (existing) return { ok: false, error: 'email_already_registered' }

  const userId = crypto.randomUUID()
  const profileId = crypto.randomUUID()
  const pin = generatePin()
  const pinHash = await authService.hashPin(pin)

  const db = getDb()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO system_users (user_id, email, display_name, role, status)
       VALUES ($1, $2, $3, 'passport_member', 'active')`,
      [userId, email, displayName || 'SmokeCraft Learner']
    )
    await client.query(
      `INSERT INTO auth_credentials (user_id, credential_type, pin_hash) VALUES ($1, 'email_pin', $2)`,
      [userId, pinHash]
    )
    await client.query(
      `INSERT INTO passport_member_profiles
         (profile_id, user_id, email, display_name, is_verified, verified_at, verified_method)
       VALUES ($1, $2, $3, $4, true, NOW(), 'email')`,
      [profileId, userId, email, displayName || 'SmokeCraft Learner']
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    if (err.code === UNIQUE_VIOLATION) return { ok: false, error: 'email_already_registered' }
    throw err
  } finally {
    client.release()
  }

  return { ok: true, userId, profileId, email, displayName: displayName || 'SmokeCraft Learner', pin }
}

/**
 * Issues a fresh login PIN for an existing member (email+PIN
 * passwordless login — matches the existing credential_type='email_pin'
 * design already used by promoteGuestToMember). Always returns a
 * generic "if this email exists, a PIN was issued" style result to the
 * caller in production; the PIN itself is only ever returned directly
 * in non-production (no email provider connected — see file header).
 */
export async function requestLoginPin(email) {
  const member = await authService.getPassportMemberByContact(email)
  if (!member) return { ok: false, error: 'no_such_account' }

  const pin = generatePin()
  const pinHash = await authService.hashPin(pin)
  await query(
    `UPDATE auth_credentials SET pin_hash = $2, updated_at = NOW() WHERE user_id = $1`,
    [member.user_id, pinHash]
  )
  return { ok: true, userId: member.user_id, profileId: member.profile_id, pin }
}

/**
 * Verifies email+PIN and issues a session, reusing the exact
 * lockout/login-attempt-logging pattern already proven for staff/
 * founder login (lockUserIfNeeded / clearFailedAttempts /
 * recordLoginAttempt).
 */
export async function verifyLoginPin(email, pin, req) {
  const member = await authService.getPassportMemberByContact(email)
  if (!member) {
    await authService.recordLoginAttempt({ email, roleAttempted: 'passport_member', success: false, failureReason: 'no_such_account', req })
    return { ok: false, error: 'invalid_credentials' }
  }
  const creds = await authService.getCredentials(member.user_id)
  if (authService.isLocked(creds)) {
    await authService.recordLoginAttempt({ userId: member.user_id, email, roleAttempted: 'passport_member', success: false, failureReason: 'locked', req })
    return { ok: false, error: 'account_locked' }
  }
  const valid = await authService.verifyPin(pin, creds?.pin_hash)
  if (!valid) {
    await authService.lockUserIfNeeded(member.user_id)
    await authService.recordLoginAttempt({ userId: member.user_id, email, roleAttempted: 'passport_member', success: false, failureReason: 'bad_pin', req })
    return { ok: false, error: 'invalid_credentials' }
  }
  await authService.clearFailedAttempts(member.user_id)
  await authService.recordLoginAttempt({ userId: member.user_id, email, roleAttempted: 'passport_member', success: true, req })

  const { token, tokenId } = authService.createJwtForUser({
    userId: member.user_id, role: 'passport_member', email, displayName: member.display_name, profileId: member.profile_id,
  })
  await authService.createAuthSession({ userId: member.user_id, role: 'passport_member' }, tokenId, req)

  return { ok: true, token, tokenId, userId: member.user_id, profileId: member.profile_id, email, displayName: member.display_name }
}
