/**
 * Frontend client for Blend Fault Identification Backend Scoring
 * (migration 089). Same conventions as challengeHubApiClient.js.
 */
const BASE = '/api/smokecraft/blend-fault'

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

export const getAssessment = () => request('/')
export const startAttempt = () => request('/attempts', { method: 'POST' })
export const getAttempt = (attemptId) => request(`/attempts/${encodeURIComponent(attemptId)}`)
export const submitAttempt = (attemptId, answers) => request(`/attempts/${encodeURIComponent(attemptId)}/submit`, { method: 'POST', body: { answers } })
export const getHistory = () => request('/history')
