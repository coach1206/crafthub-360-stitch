/**
 * Package 6 — frontend client for flavor-stage observations and
 * pairing-builder drafts. Same conventions as seedSoilApiClient.js.
 */
const BASE = '/api/smokecraft/flavor-pairing'

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
    if (!res.ok) return { ok: false, status: res.status, error: json?.error || 'internal_error' }
    return { ok: true, status: res.status, ...json }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, error: 'timeout' }
    return { ok: false, status: 0, error: 'offline' }
  } finally {
    clearTimeout(timer)
  }
}

export const getFlavorStages = () => request('/flavor-stages')
export const saveFlavorStage = (stage, fields) => request(`/flavor-stages/${stage}`, { method: 'POST', body: fields })

export const listPairingDrafts = () => request('/pairing-drafts')
export const getPairingDraft = (id) => request(`/pairing-drafts/${id}`)
export const savePairingDraft = (payload) => request('/pairing-drafts', { method: 'POST', body: payload })
export const reviseDraft = (id, payload) => request(`/pairing-drafts/${id}/revise`, { method: 'POST', body: payload })
export const getDraftRevisions = (id) => request(`/pairing-drafts/${id}/revisions`)

export const getCadenceSession = () => request('/cadence')
export const startCadence = () => request('/cadence/start', { method: 'POST' })
export const recordCadenceEvent = (eventType) => request(`/cadence/event/${eventType}`, { method: 'POST' })
export const stopCadence = () => request('/cadence/stop', { method: 'POST' })

export const getRecommendations = () => request('/recommendations')
