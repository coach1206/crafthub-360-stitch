/**
 * DEMO / LOCAL-PREVIEW STAFF REGISTRY — staff handoff email + PIN login.
 *
 * There is no backend endpoint yet for "staff email + PIN" handoff auth
 * (the existing /api/auth/staff-pin-login is PIN-only, no email). Until
 * that endpoint exists, this in-memory table is used to verify the
 * handoff login screen. It is for demo/local preview only.
 *
 * The raw PIN is never persisted anywhere (not localStorage, not
 * sessionStorage) — it only exists transiently as a function argument
 * during verification.
 */

const DEMO_STAFF = [
  { email: 'staff@crafthub360.com',   pin: '2501', role: 'staff',   displayName: 'Staff' },
  { email: 'manager@crafthub360.com', pin: '3600', role: 'manager', displayName: 'Manager' },
]

/**
 * Master founder credential. Supersedes all other access checks.
 * Role maps to 'founder_level_0' — the role key used throughout
 * SecurityContext / ProtectedRoute / roleMap.js for the founder bypass.
 */
const FOUNDER_CREDENTIAL = {
  email: 'jccollins1206@yahoo.com',
  pin:   '2501',
  role:  'founder_level_0',
  displayName: 'Founder',
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizePin(pin) {
  return String(pin || '').trim()
}

/**
 * Verifies the founder email + PIN. Always checked first by the handoff
 * login screen, since founder access must supersede all other roles.
 *
 * Returns one of:
 *   { ok: true, role: 'founder_level_0', displayName, email }
 *   { ok: false, error: 'Founder email not recognized.' }
 *   { ok: false, error: 'Founder PIN not recognized.' }
 *   { ok: false, error: 'Founder credentials not recognized.' }
 *   { ok: false } — email doesn't match the founder account at all
 *                    (caller should fall through to staff/manager check)
 */
export function verifyFounderCredentials(email, pin) {
  const normalizedEmail = normalizeEmail(email)
  const normalizedPin   = normalizePin(pin)

  const emailMatches = normalizedEmail === FOUNDER_CREDENTIAL.email
  if (!emailMatches) return { ok: false }

  const pinMatches = normalizedPin === FOUNDER_CREDENTIAL.pin

  if (!pinMatches) {
    return { ok: false, error: 'Founder PIN not recognized.' }
  }

  return {
    ok:          true,
    role:        FOUNDER_CREDENTIAL.role,
    displayName: FOUNDER_CREDENTIAL.displayName,
    email:       FOUNDER_CREDENTIAL.email,
  }
}

/**
 * Verifies staff/manager email + PIN against the demo registry.
 * Returns { ok: true, role, displayName, email } or { ok: false }.
 */
export function verifyStaffHandoffCredentials(email, pin) {
  const normalizedEmail = normalizeEmail(email)
  const normalizedPin   = normalizePin(pin)

  const match = DEMO_STAFF.find(
    s => s.email === normalizedEmail && s.pin === normalizedPin
  )

  if (!match) return { ok: false }

  return {
    ok:          true,
    role:        match.role,
    displayName: match.displayName,
    email:       match.email,
  }
}
