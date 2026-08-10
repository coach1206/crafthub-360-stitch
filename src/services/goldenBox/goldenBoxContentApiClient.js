/**
 * Package 3 — frontend client for the real educational content API.
 * Same conventions as goldenBoxApiClient.js.
 */
const BASE = '/api/smokecraft/golden-box-content'

async function request(path, { timeoutMs = 10000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, { credentials: 'include', signal: controller.signal })
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

export const listComponents = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return request(`/components${qs ? `?${qs}` : ''}`)
}
export const getComponent = (id) => request(`/components/${id}`)
export const listFlavorNotes = (group) => request(`/flavor-notes${group ? `?group=${group}` : ''}`)
