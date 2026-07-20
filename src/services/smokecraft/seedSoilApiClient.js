/**
 * Package 4 — frontend client for the Seed and Soil learning experience
 * backend (notes, progress, quiz). Same conventions as
 * goldenBoxContentApiClient.js.
 */
const BASE = '/api/smokecraft/seed-soil'

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

export const listSeedSoilComponents = (category) => request(`/components${category ? `?category=${category}` : ''}`)
export const getNotes = () => request('/notes')
export const saveNote = (payload) => request('/notes', { method: 'POST', body: payload })
export const getProgress = () => request('/progress')
export const recordProgress = (componentId) => request('/progress', { method: 'POST', body: { componentId } })
export const submitQuizAnswer = (questionId, selectedAnswer) =>
  request(`/quiz/${questionId}/answer`, { method: 'POST', body: { selectedAnswer } })
