/**
 * Venue Humidor 1B-2B-1 — staff admin API client. Same conventions as
 * venueHumidorCustomerApiClient.js: cookie-based session
 * (credentials included), abort-controller timeout, normalized
 * {ok,status,error}.
 */
const BASE = '/api/smokecraft/venue-humidor'

function normalizeError(status, body) {
  return { ok: false, status, error: body?.error || 'internal_error', fieldErrors: body?.fieldErrors }
}

async function request(path, { method = 'GET', body, timeoutMs = 12000 } = {}) {
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
    try { json = await res.json() } catch { /* non-JSON */ }
    if (!res.ok) return normalizeError(res.status, json)
    return { ok: true, status: res.status, ...json }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, error: 'timeout' }
    return { ok: false, status: 0, error: 'offline' }
  } finally {
    clearTimeout(timer)
  }
}

function toQuery(filters = {}) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue
    params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const listAdminProducts = (venueId, filters) => request(`/venues/${venueId}/admin/products${toQuery(filters)}`)
export const getAdminProduct = (venueId, productId) => request(`/venues/${venueId}/admin/products/${productId}`)
export const createAdminProduct = (venueId, payload) => request(`/venues/${venueId}/admin/products`, { method: 'POST', body: payload })
export const updateAdminProduct = (venueId, productId, payload) => request(`/venues/${venueId}/admin/products/${productId}`, { method: 'PATCH', body: payload })
export const updateClassification = (venueId, productId, payload) => request(`/venues/${venueId}/admin/products/${productId}/classification`, { method: 'PATCH', body: payload })
export const applyInventoryMutation = (venueId, productId, payload) => request(`/venues/${venueId}/admin/products/${productId}/inventory-mutations`, { method: 'POST', body: payload })
export const listInventoryEvents = (venueId, filters) => request(`/venues/${venueId}/admin/inventory-events${toQuery(filters)}`)

// Venue Humidor 1B-2B-2 — staff order and fulfillment queue.
export const listOrderQueue = (venueId, filters) => request(`/venues/${venueId}/admin/orders${toQuery(filters)}`)
export const listFulfillmentHistory = (venueId, filters) => request(`/venues/${venueId}/admin/orders/history${toQuery(filters)}`)
export const getOrderDetail = (venueId, orderId) => request(`/venues/${venueId}/admin/orders/${orderId}`)
export const claimOrder = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/claim`, { method: 'POST', body: { idempotencyKey } })
export const assignOrder = (venueId, orderId, targetStaffId, expectedVersion, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/assign`, { method: 'POST', body: { targetStaffId, expectedVersion, idempotencyKey } })
export const confirmOrder = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/confirm`, { method: 'POST', body: { idempotencyKey } })
export const startPreparation = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/prepare`, { method: 'POST', body: { idempotencyKey } })
export const markItemPicked = (venueId, orderId, orderItemId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/items/${orderItemId}/pick`, { method: 'POST', body: { idempotencyKey } })
export const markReady = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/ready`, { method: 'POST', body: { idempotencyKey } })
export const blockOrder = (venueId, orderId, reason, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/block`, { method: 'POST', body: { reason, idempotencyKey } })
export const unblockOrder = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/unblock`, { method: 'POST', body: { idempotencyKey } })
export const addFulfillmentNote = (venueId, orderId, note, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/notes`, { method: 'POST', body: { note, idempotencyKey } })
export const completeFulfillmentOrder = (venueId, orderId, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/complete`, { method: 'POST', body: { idempotencyKey } })
export const cancelFulfillmentOrder = (venueId, orderId, reason, idempotencyKey) => request(`/venues/${venueId}/admin/orders/${orderId}/cancel`, { method: 'POST', body: { reason, idempotencyKey } })
