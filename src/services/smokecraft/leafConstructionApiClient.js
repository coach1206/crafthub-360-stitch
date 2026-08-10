/**
 * Package 5 closure — frontend client for filler-arrangement/rolling-
 * process/quality-control backend. Same conventions as
 * seedSoilApiClient.js.
 */
const BASE = '/api/smokecraft/leaf-construction'

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

export const getArrangement = () => request('/arrangement')
export const saveArrangement = (arrangement) => request('/arrangement', { method: 'POST', body: { arrangement } })

export const getRollingProgress = () => request('/rolling-progress')
export const completeRollingStep = (stepKey) => request(`/rolling-progress/${stepKey}/complete`, { method: 'POST' })

export const getQualityControl = () => request('/quality-control')
export const saveQualityControlDecision = (itemKey, decision, notes) =>
  request(`/quality-control/${itemKey}`, { method: 'POST', body: { decision, notes } })
