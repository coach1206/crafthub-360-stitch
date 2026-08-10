/**
 * Frontend client for Challenge Hub Live State (migration 088). Same
 * conventions as skillTreeApiClient.js / collectionsApiClient.js.
 */
const BASE = '/api/smokecraft/challenge-hub'

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

export const getHub = () => request('/')
export const getChallenge = (challengeKey) => request(`/challenges/${encodeURIComponent(challengeKey)}`)
export const startChallenge = (challengeKey) => request(`/challenges/${encodeURIComponent(challengeKey)}/start`, { method: 'POST' })
export const recalculate = () => request('/recalculate', { method: 'POST' })
