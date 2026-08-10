/**
 * Frontend client for the Filler Arrangement standalone lesson backend
 * (migration 085). Same conventions as seedSoilApiClient.js.
 */
const BASE = '/api/smokecraft/filler-arrangement'

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

export const getNote = () => request('/note')
export const saveNote = (noteText) => request('/note', { method: 'POST', body: { noteText } })
export const getProgress = () => request('/progress')
export const recordZoneViewed = (zoneKey) => request('/progress', { method: 'POST', body: { zoneKey } })
export const submitQuizAnswer = (questionKey, isCorrect) => request('/quiz/answer', { method: 'POST', body: { questionKey, isCorrect } })
export const completeLesson = () => request('/complete', { method: 'POST' })
