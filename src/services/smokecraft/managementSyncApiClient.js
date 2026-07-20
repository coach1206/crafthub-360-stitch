/**
 * SmokeCraft Management Sync — centralized frontend API client (Package C).
 * One client for all 8 guest-facing Package B endpoints. Always sends
 * credentials so the HTTP-only guest cookie is included; never reads or
 * stores the guest token itself (the cookie is opaque to JS by design).
 */
const BASE = '/api/smokecraft/management-sync'

function normalizeError(status, body) {
  return { ok: false, status, error: body?.error || 'internal_error', details: body?.details }
}

async function request(path, { method = 'GET', body, timeoutMs = 8000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    let json = null
    try { json = await res.json() } catch { /* non-JSON response */ }
    if (!res.ok) return normalizeError(res.status, json)
    return { ok: true, status: res.status, ...json }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, error: 'timeout' }
    return { ok: false, status: 0, error: 'offline' }
  } finally {
    clearTimeout(timer)
  }
}

export function establishGuestSession() {
  return request('/guest-session', { method: 'POST' })
}

export function createJourney(venueId, payload) {
  return request(`/venues/${encodeURIComponent(venueId)}/journeys`, { method: 'POST', body: payload })
}

export function getJourney(journeyId) {
  return request(`/journeys/${encodeURIComponent(journeyId)}`)
}

// Resume uses the same GET — a "resume" is just re-fetching the
// authoritative record for a previously-known journeyId (see Package C
// Frontend Architecture doc).
export const resumeJourney = getJourney

export function completeJourney(journeyId) {
  return request(`/journeys/${encodeURIComponent(journeyId)}/complete`, { method: 'POST' })
}

export function createSnapshot(journeyId, payload) {
  return request(`/journeys/${encodeURIComponent(journeyId)}/snapshots`, { method: 'POST', body: payload })
}

export function getLatestSnapshot(journeyId) {
  return request(`/journeys/${encodeURIComponent(journeyId)}/snapshots/latest`)
}

export function requestManagementSync(journeyId, destination = 'venue_insights') {
  return request(`/journeys/${encodeURIComponent(journeyId)}/sync`, { method: 'POST', body: { destination } })
}

export function getManagementSyncStatus(journeyId) {
  return request(`/journeys/${encodeURIComponent(journeyId)}/sync/status`)
}

// Management actions (venue-manager scope) — not used by the guest-facing
// Package C flow, included for completeness/future use per the handoff.
export function createManagementAction(venueId, payload) {
  return request(`/venues/${encodeURIComponent(venueId)}/actions`, { method: 'POST', body: payload })
}

export function listAuthorizedActions(venueId) {
  return request(`/venues/${encodeURIComponent(venueId)}/actions`)
}

// Venue-manager scope only (requires requireAuth + venue membership on
// the server) — never callable by a guest.
export function getVenueAnalytics(venueId, { startDate, endDate }) {
  const params = new URLSearchParams({ startDate, endDate })
  return request(`/venues/${encodeURIComponent(venueId)}/insights?${params}`)
}

// Venue-manager scope only — real, server-checked connection states,
// never client-overridable.
export function getIntegrationStatuses(venueId) {
  return request(`/venues/${encodeURIComponent(venueId)}/integrations`)
}
