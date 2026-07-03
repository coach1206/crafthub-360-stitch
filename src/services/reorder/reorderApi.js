const BASE = '/api/reorder'

// --- Vendors ---
export async function registerVendor(venueId, payload) {
  const r = await fetch(`${BASE}/venue/${venueId}/vendors`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return r.json()
}

export async function listVendors(venueId, filters = {}) {
  const qs = new URLSearchParams(filters).toString()
  const r = await fetch(`${BASE}/venue/${venueId}/vendors${qs ? '?' + qs : ''}`)
  return r.json()
}

export async function getVendorConnectionReadiness(venueId) {
  const r = await fetch(`${BASE}/venue/${venueId}/vendors/readiness`)
  return r.json()
}

// --- Recommendations ---
export async function getReorderRecommendations(venueId, filters = {}) {
  const qs = new URLSearchParams(filters).toString()
  const r = await fetch(`${BASE}/venue/${venueId}/recommendations${qs ? '?' + qs : ''}`)
  return r.json()
}

export async function getUrgentReorderAlert(venueId) {
  const r = await fetch(`${BASE}/venue/${venueId}/recommendations/urgent`)
  return r.json()
}

export async function detectLowStockTriggers(venueId) {
  const r = await fetch(`${BASE}/venue/${venueId}/recommendations/detect`, { method: 'POST' })
  return r.json()
}

// --- Purchase Orders ---
export async function createPurchaseOrder(venueId, payload) {
  const r = await fetch(`${BASE}/venue/${venueId}/purchase-orders`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return r.json()
}

export async function listPurchaseOrders(venueId, filters = {}) {
  const qs = new URLSearchParams(filters).toString()
  const r = await fetch(`${BASE}/venue/${venueId}/purchase-orders${qs ? '?' + qs : ''}`)
  return r.json()
}

export async function getPurchaseOrder(purchaseOrderId) {
  const r = await fetch(`${BASE}/purchase-orders/${purchaseOrderId}`)
  return r.json()
}

export async function getPurchaseOrderReadiness(venueId) {
  const r = await fetch(`${BASE}/venue/${venueId}/purchase-orders/readiness`)
  return r.json()
}

// --- Approval ---
export async function approvePurchaseOrder(purchaseOrderId, actorContext) {
  const r = await fetch(`${BASE}/purchase-orders/${purchaseOrderId}/approve`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(actorContext),
  })
  return r.json()
}

export async function rejectPurchaseOrder(purchaseOrderId, actorContext, reason) {
  const r = await fetch(`${BASE}/purchase-orders/${purchaseOrderId}/reject`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...actorContext, reason }),
  })
  return r.json()
}

// --- Demand Signals ---
export async function getVenueDemandSignals(venueId) {
  const r = await fetch(`${BASE}/venue/${venueId}/signals`)
  return r.json()
}

// --- Receiving ---
export async function createReceivingPreview(venueId, payload) {
  const r = await fetch(`${BASE}/venue/${venueId}/receiving`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return r.json()
}

export async function confirmReceiving(receivingId, items, actorContext = {}) {
  const r = await fetch(`${BASE}/receiving/${receivingId}/confirm`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, ...actorContext }),
  })
  return r.json()
}
