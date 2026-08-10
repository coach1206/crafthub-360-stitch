/**
 * SmokeCraft → POS360 Order Bridge — frontend API client (Block 4A).
 *
 * Thin wrapper around the already-built, already-mounted
 * /api/pos360/smokecraft/* bridge (server/routes/pos360SmokeCraftOrderBridgeRoutes.js,
 * server/services/pos360/pos360SmokeCraftOrderBridgeService.js) — this
 * client was the missing piece; the backend bridge already existed and
 * was real/DB-backed, it was simply never called from any SmokeCraft
 * screen.
 */
const BASE = '/api/pos360/smokecraft'

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
 * Creates a real POS360 order intent from a SmokeCraft Request/Purchase
 * selection. idempotencyKey MUST be stable across retries of the same
 * user action (e.g. derived from sessionId + route + a submission
 * nonce persisted in journey state) so a retried/duplicated click never
 * creates a second order intent.
 */
export function createOrderIntent(payload) {
  return request('/order-intent', { method: 'POST', body: payload })
}

export function createHandoffRequest(payload) {
  return request('/handoff-request', { method: 'POST', body: payload })
}

export function getOrderIntent(orderIntentId) {
  return request(`/order-intent/${encodeURIComponent(orderIntentId)}`)
}

export function getGuestOrderIntents(guestId, limit = 20) {
  return request(`/guest/${encodeURIComponent(guestId)}/order-intents?limit=${limit}`)
}
