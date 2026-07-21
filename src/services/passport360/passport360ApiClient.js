/**
 * Frontend client for the Passport 360 secure sync API (server/routes/passport360SyncRoutes.js).
 * Same conventions as skillTreeApiClient.js / challengeHubApiClient.js /
 * blendFaultApiClient.js.
 */
const BASE = '/api/passport-360/sync'

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

export const getProfile = () => request('/profile')
export const getStamps = () => request('/stamps')
export const getConnections = () => request('/connections')
export const getActivity = () => request('/activity')
export const getDirectory = () => request('/directory')
export const synchronize = () => request('/synchronize', { method: 'POST' })
