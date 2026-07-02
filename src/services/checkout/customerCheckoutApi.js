/**
 * Customer Checkout API Client
 * Safe fetch wrapper for checkout endpoints.
 * Does not store payment secrets client-side.
 */

const BASE = '/api/checkout'

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      ...options,
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, status: res.status, ...data, checkoutStatus: data.checkoutStatus ?? 'preview_fallback' }
    return { ok: true, ...data }
  } catch (err) {
    return { ok: false, error: err.message, checkoutStatus: 'preview_fallback', persistenceStatus: 'not_persisted' }
  }
}

export function createCart(cartPayload) {
  return safeFetch(`${BASE}/carts`, { method: 'POST', body: JSON.stringify(cartPayload) })
}

export function getCart(cartId) {
  return safeFetch(`${BASE}/carts/${cartId}`)
}

export function addCartItem(cartId, itemPayload) {
  return safeFetch(`${BASE}/carts/${cartId}/items`, { method: 'POST', body: JSON.stringify(itemPayload) })
}

export function updateCartItem(cartId, cartItemId, itemPayload) {
  return safeFetch(`${BASE}/carts/${cartId}/items/${cartItemId}`, { method: 'PATCH', body: JSON.stringify(itemPayload) })
}

export function removeCartItem(cartId, cartItemId) {
  return safeFetch(`${BASE}/carts/${cartId}/items/${cartItemId}`, { method: 'DELETE' })
}

export function clearCart(cartId) {
  return safeFetch(`${BASE}/carts/${cartId}/clear`, { method: 'POST' })
}

export function startCheckout(cartId, checkoutContext = {}) {
  return safeFetch(`${BASE}/carts/${cartId}/start`, { method: 'POST', body: JSON.stringify(checkoutContext) })
}

export function buildCheckoutPreview(cartId, context = {}) {
  return safeFetch(`${BASE}/carts/${cartId}/preview`, { method: 'POST', body: JSON.stringify(context) })
}

export function submitSelfOrderPreview(cartId, context = {}) {
  return safeFetch(`${BASE}/carts/${cartId}/submit-preview`, { method: 'POST', body: JSON.stringify(context) })
}

export function buildStaffAssistedOrderPreview(cartId, staffContext = {}) {
  return safeFetch(`${BASE}/carts/${cartId}/staff-assisted-preview`, { method: 'POST', body: JSON.stringify(staffContext) })
}

export function requestStaffHandoff(cartId, handoffPayload = {}) {
  return safeFetch(`${BASE}/carts/${cartId}/staff-handoff`, { method: 'POST', body: JSON.stringify(handoffPayload) })
}

export function getReceiptPreview(cartId) {
  return safeFetch(`${BASE}/carts/${cartId}/receipt-preview`)
}

export function getCustomerOrderStatus(orderId) {
  return safeFetch(`${BASE}/orders/${orderId}/status`)
}

export function getCustomerOrderTimeline(orderId) {
  return safeFetch(`${BASE}/orders/${orderId}/timeline`)
}

export function getCheckoutReadiness(cartPayload = {}) {
  return safeFetch(`${BASE}/readiness`, { method: 'POST', body: JSON.stringify(cartPayload) })
}

export function getSelfOrderReadiness(venueId) {
  return safeFetch(`${BASE}/venues/${venueId}/self-order-readiness`)
}

export function getStaffAssistedReadiness(venueId) {
  return safeFetch(`${BASE}/venues/${venueId}/staff-assisted-readiness`)
}
