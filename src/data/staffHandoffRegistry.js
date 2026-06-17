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
  { email: 'staff@crafthub360.com',   pin: '2501', role: 'staff',           displayName: 'Staff' },
  { email: 'manager@crafthub360.com', pin: '3600', role: 'manager',         displayName: 'Manager' },
  { email: 'founder@crafthub360.com', pin: '1206', role: 'founder_level_0', displayName: 'Founder' },
]

/**
 * Verifies staff email + PIN against the demo registry.
 * Returns { ok: true, role, displayName, email } or { ok: false }.
 */
export function verifyStaffHandoffCredentials(email, pin) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedPin   = String(pin || '').trim()

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
