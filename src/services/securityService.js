/**
 * Security Service — thin client-side helper for reading the current
 * prototype role and querying backend permission state.
 *
 * Prototype mode: role is stored in localStorage under `novee_admin_session`.
 * Production: this should be replaced with real JWT/session validation.
 *
 * Use SecurityContext (useSecuiry hook) in React components instead of
 * calling this directly — this is for non-component utilities.
 */

import { ROLE_MAP, ROLE_LEVELS, roleHasPermission } from '../config/roleMap.js'

const SESSION_KEY = 'novee_admin_session'

/** Returns the stored admin session object, or null. */
export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !ROLE_MAP[parsed.role]) return null
    return parsed
  } catch { return null }
}

/** Returns the current prototype role. Falls back to 'guest'. */
export function getCurrentRole() {
  return getStoredSession()?.role || 'guest'
}

/** Returns the current prototype user object. */
export function getCurrentUser() {
  return getStoredSession() || { role: 'guest', userId: null, email: null }
}

/** Returns true if the stored role has the given permission key. */
export function checkPermission(permKey) {
  return roleHasPermission(getCurrentRole(), permKey)
}

/** Returns true if the stored role meets the minimum level. */
export function meetsMinLevel(minRole) {
  const current = getCurrentRole()
  return (ROLE_LEVELS[current] ?? -1) >= (ROLE_LEVELS[minRole] ?? 999)
}

/** Returns true if the current role is founder_level_0. */
export function isFounderLevel0() {
  return getCurrentRole() === 'founder_level_0'
}

/** Sets the prototype session role. Dev/testing only. */
export function setPrototypeRole(role, meta = {}) {
  if (!ROLE_MAP[role]) throw new Error(`Unknown role: ${role}`)
  const session = { role, ...meta, grantedAt: Date.now() }
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch {}
  return session
}

/** Clears the admin session. */
export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch {}
}

/** Returns all permissions the current role holds. */
export function getEffectivePermissions() {
  return ROLE_MAP[getCurrentRole()] || []
}
