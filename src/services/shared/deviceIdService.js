/**
 * Device ID Service — Phase 6C
 * Stable per-browser device identifier used to tag every sync-queue event
 * with its origin device. Stored in localStorage so it survives refresh
 * and browser close; generated once, reused forever after that.
 */

const STORAGE_KEY = 'novee_device_id'

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `dev-${crypto.randomUUID()}`
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getDeviceId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = generateId()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    // localStorage unavailable (e.g. private mode edge case) — fall back to
    // a per-session id rather than crashing the caller.
    return generateId()
  }
}
