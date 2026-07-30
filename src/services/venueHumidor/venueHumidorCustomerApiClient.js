/**
 * Venue Humidor 1B-1 — customer API client. Same conventions as
 * goldenBoxApiClient.js: credentials included, abort-controller
 * timeout, normalized {ok,status,error}.
 */
const BASE = '/api/smokecraft/venue-humidor/customer'

function normalizeError(status, body) {
  return { ok: false, status, error: body?.error || 'internal_error' }
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

export const validateVenue = (venueId) => request(`/venues/${venueId}`)
export const browseCatalog = (venueId, filters) => request(`/venues/${venueId}/catalog${toQuery(filters)}`)
export const getCigarDetail = (venueId, productId) => request(`/venues/${venueId}/catalog/${productId}`)

export const createStickHold = (venueId, productId, idempotencyKey) => request(`/venues/${venueId}/products/${productId}/stick-hold`, { method: 'POST', body: { idempotencyKey } })
export const createBoxHold = (venueId, productId, idempotencyKey) => request(`/venues/${venueId}/products/${productId}/box-hold`, { method: 'POST', body: { idempotencyKey } })
export const createReservation = (venueId, productId, quantity, idempotencyKey) => request(`/venues/${venueId}/products/${productId}/reservation`, { method: 'POST', body: { quantity, idempotencyKey } })

export const addFavorite = (venueId, productId) => request(`/venues/${venueId}/products/${productId}/favorite`, { method: 'POST' })
export const removeFavorite = (venueId, productId) => request(`/venues/${venueId}/products/${productId}/unfavorite`, { method: 'POST' })
export const listFavorites = () => request(`/favorites`)

export const requestVenueTab = (venueId, productId) => request(`/venues/${venueId}/products/${productId}/venue-tab`, { method: 'POST' })
export const requestTableDelivery = (venueId, productId) => request(`/venues/${venueId}/products/${productId}/table-delivery`, { method: 'POST' })
