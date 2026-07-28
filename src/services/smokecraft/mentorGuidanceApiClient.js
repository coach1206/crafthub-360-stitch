/**
 * Holistic Fix 5B-2A — client adapter for the server-authoritative
 * mentor guidance service (/api/smokecraft/mentor-guidance/*). Same
 * conventions as pairingEngineApiClient.js — thin fetch wrapper, the
 * client never computes guidance itself, only requests it.
 */
const BASE = '/api/smokecraft/mentor-guidance'

async function request(path, { method = 'POST', body, timeoutMs = 10000 } = {}) {
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

export const fetchMentorGuidance = (mentorId, screenContext) => request('/guidance', { body: { mentorId, screenContext } })
