const BASE = '/api/inventory'

export async function setInventory(venueId, payload) {
  const r = await fetch(`${BASE}/venue/${venueId}/set`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return r.json()
}

export async function getInventory(venueId, productId) {
  const r = await fetch(`${BASE}/venue/${venueId}/product/${productId}`)
  return r.json()
}

export async function getVenueInventory(venueId, filters = {}) {
  const qs = new URLSearchParams(filters).toString()
  const r = await fetch(`${BASE}/venue/${venueId}${qs ? '?' + qs : ''}`)
  return r.json()
}

export async function adjustInventory(venueId, productId, delta, actorContext = {}) {
  const r = await fetch(`${BASE}/venue/${venueId}/product/${productId}/adjust`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta, ...actorContext }),
  })
  return r.json()
}

export async function checkProductAvailability(venueId, productId, quantity = 1) {
  const r = await fetch(`${BASE}/venue/${venueId}/product/${productId}/check?quantity=${quantity}`)
  return r.json()
}

export async function getLowStockItems(venueId) {
  const r = await fetch(`${BASE}/venue/${venueId}/low-stock`)
  return r.json()
}

export async function getInventoryReadiness(venueId) {
  const r = await fetch(`${BASE}/venue/${venueId}/readiness`)
  return r.json()
}

export async function validateCheckout(venueId, items) {
  const r = await fetch(`${BASE}/venue/${venueId}/validate-checkout`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  return r.json()
}

export async function buildAvailabilityMap(venueId, productIds) {
  const r = await fetch(`${BASE}/venue/${venueId}/availability-map`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_ids: productIds }),
  })
  return r.json()
}

export async function getProductAvailabilityReadiness(venueId) {
  const r = await fetch(`${BASE}/venue/${venueId}/availability/readiness`)
  return r.json()
}
