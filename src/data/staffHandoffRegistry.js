/**
 * Staff handoff email + PIN login registry.
 *
 * THREE AUTH PATHS (checked in order):
 *
 * 1. VITE_ env override (production static deployments):
 *    Set VITE_FOUNDER_ADMIN_EMAIL + VITE_FOUNDER_ADMIN_PIN in your hosting
 *    dashboard. The founder can log in from any static deployment without a
 *    live backend. See src/config/founderOverride.js for the security notes.
 *
 * 2. Dev-only hardcoded registry:
 *    Only active when import.meta.env.DEV is true. Never ships in production
 *    bundles — Vite dead-code-eliminates the branch.
 *
 * 3. Demo mode (VITE_STAFF_DEMO_MODE=true):
 *    Unlocks the Staff Handoff modal with no credentials required. Shows a
 *    clear "DEMO MODE" label. Use only for live demos / trade shows.
 *    Never claim real auth or real backend sync when this is active.
 *
 * The raw PIN is never persisted anywhere (not localStorage, not
 * sessionStorage) — it only exists transiently as a function argument.
 */

import { isFounderOverrideConfigured, verifyFounderOverride } from '../config/founderOverride.js'

const DEMO_STAFF = import.meta.env.DEV
  ? [
      { email: 'staff@crafthub360.com',   pin: '2501', role: 'staff',   displayName: 'Staff' },
      { email: 'manager@crafthub360.com', pin: '3600', role: 'manager', displayName: 'Manager' },
    ]
  : []

const FOUNDER_CREDENTIAL = import.meta.env.DEV
  ? {
      email: 'jccollins1206@yahoo.com',
      pin:   '2501',
      role:  'founder_level_0',
      displayName: 'Founder',
    }
  : null

/**
 * True when at least one auth path is available:
 *   - Local dev (hardcoded registry)
 *   - VITE_FOUNDER_ADMIN_EMAIL + VITE_FOUNDER_ADMIN_PIN are both set (production override)
 *   - VITE_STAFF_DEMO_MODE=true (demo/kiosk bypass)
 */
export const STAFF_HANDOFF_AUTH_AVAILABLE =
  import.meta.env.DEV ||
  isFounderOverrideConfigured() ||
  import.meta.env.VITE_STAFF_DEMO_MODE === 'true'

/** True when running in explicit demo/kiosk mode — no credentials required. */
export const STAFF_DEMO_MODE = import.meta.env.VITE_STAFF_DEMO_MODE === 'true'

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

  // 1. VITE_ production override — works on any static deployment where
  //    VITE_FOUNDER_ADMIN_EMAIL + VITE_FOUNDER_ADMIN_PIN are set in the
  //    hosting dashboard (Railway, Vercel, etc.).
  if (isFounderOverrideConfigured()) {
    const overrideEmail = (import.meta.env.VITE_FOUNDER_ADMIN_EMAIL || '').trim().toLowerCase()
    if (normalizedEmail === overrideEmail) {
      if (verifyFounderOverride(email, pin)) {
        return { ok: true, role: 'founder_level_0', displayName: 'Founder', email: normalizedEmail }
      }
      return { ok: false, error: 'Founder PIN not recognized.' }
    }
  }

  // 2. Dev-only hardcoded credential.
  if (!FOUNDER_CREDENTIAL) return { ok: false }

  const emailMatches = normalizedEmail === FOUNDER_CREDENTIAL.email
  if (!emailMatches) return { ok: false }

  if (normalizedPin !== FOUNDER_CREDENTIAL.pin) {
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
