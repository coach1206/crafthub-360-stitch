/**
 * SmokeCraft → E.A.T. 360 Live Sync — frontend API client (Block 4A).
 *
 * Thin wrapper around the already-built, already-mounted
 * /api/eat-360/smokecraft/* bridge (server/routes/eatSmokeCraftLiveSyncRoutes.js,
 * server/services/eat360/eatSmokeCraftLiveSyncService.js) — this client
 * was the missing piece; the backend bridge already existed and was
 * real/DB-backed, it was simply never called from any SmokeCraft screen.
 */
const BASE = '/api/eat-360/smokecraft'

async function request(path, { method = 'GET', body, timeoutMs = 8000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    let json = null
    try { json = await res.json() } catch { /* non-JSON response */ }
    if (!res.ok) return { ok: false, status: res.status, error: json?.error || 'internal_error' }
    return { ok: true, status: res.status, ...json }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, error: 'timeout' }
    return { ok: false, status: 0, error: 'offline' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Syncs the current SmokeCraft session/journey state to E.A.T. 360.
 * idempotencyKey MUST be stable per real completion event (e.g. derived
 * from the server journeyId when one exists) so a retried sync call
 * never appends a duplicate sync record.
 */
export function syncSession(payload) {
  return request('/session/sync', { method: 'POST', body: payload })
}

export function getSessionSyncStatus(sessionId) {
  return request(`/session/${encodeURIComponent(sessionId)}/status`)
}
