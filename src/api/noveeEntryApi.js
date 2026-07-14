/**
 * NOVEE OS — Entry API Client
 * Calls /api/novee/* endpoints.
 * All authorization decisions are made server-side.
 * This client only sends requests and surfaces results.
 */

const BASE = '/api/novee'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => ({ success: false, message: 'Invalid server response.' }))
  return { ok: res.ok, status: res.status, data }
}

/**
 * Load root entry status — authorized modules, demo mode, session state.
 * Safe to call for any visitor including unauthenticated guests.
 */
export async function getEntryStatus() {
  return apiFetch('/entry/status')
}

/**
 * Request access to a module. Returns the authorized route.
 * @param {'novee'|'crafthub'|'smokecraft'} moduleId
 */
export async function openModule(moduleId) {
  return apiFetch('/entry/open', {
    method: 'POST',
    body: JSON.stringify({ module: moduleId }),
  })
}

/** Start a guest demo session. Returns { demoSessionId, expiresAt, mode }. */
export async function startDemoSession() {
  return apiFetch('/demo/start', { method: 'POST' })
}

/** End the current demo session. */
export async function endDemoSession() {
  return apiFetch('/demo/end', { method: 'POST' })
}

/** Get current demo session status. */
export async function getDemoStatus() {
  return apiFetch('/demo/status')
}
