/**
 * Holistic Fix 5B-1 — client adapter for the server-authoritative pairing
 * engine (/api/smokecraft/pairing-engine/*). Same conventions as
 * skillTreeApiClient.js / collectionsApiClient.js — thin fetch wrapper,
 * server derives identity from the verified guest-identity cookie, the
 * client never computes or submits a compatibility score.
 */
const BASE = '/api/smokecraft/pairing-engine'

async function request(path, { method = 'GET', body, timeoutMs = 10000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method, credentials: 'include', signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    let json = null
    try { json = await res.json() } catch { /* non-JSON */ }
    if (res.status === 409) return { ok: false, status: 409, conflict: true, current: json?.current }
    if (!res.ok) return { ok: false, status: res.status, error: json?.error || 'internal_error' }
    return { ok: true, status: res.status, ...json }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, error: 'timeout' }
    return { ok: false, status: 0, error: 'offline' }
  } finally {
    clearTimeout(timer)
  }
}

export const recommendPairing = (input, sourceRoute) => request('/recommend', { method: 'POST', body: { ...input, sourceRoute } })
export const rankPairings = (input, sourceRoute) => request('/rank', { method: 'POST', body: { ...input, sourceRoute } })
export const savePairing = (input, idempotencyKey, learnerRating, learnerNotes, sourceRoute) =>
  request('/save', { method: 'POST', body: { ...input, idempotencyKey, learnerRating, learnerNotes, sourceRoute } })
export const getSavedPairings = () => request('/saved')
export const getSavedPairing = (id) => request(`/saved/${encodeURIComponent(id)}`)
export const ratePairing = (id, expectedVersion, learnerRating, learnerNotes) =>
  request(`/saved/${encodeURIComponent(id)}/rate`, { method: 'PUT', body: { expectedVersion, learnerRating, learnerNotes } })
