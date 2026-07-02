/**
 * SmokeCraft Order Service — payment confirmation, failure, POS360 attachment.
 *
 * PAYMENT SAFETY:
 * - Never sends raw card numbers or CVV to any endpoint.
 * - paymentIntentId is required for confirm — never reused (enforced server-side).
 * - posTransactionId dedup enforced server-side via UNIQUE constraint.
 *
 * LOCAL PREVIEW MODE: if backend unavailable, returns honest failure — no fake payment.
 */

const BASE = '/api/venues'

async function safeFetch(url, opts = {}) {
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: body.error || `HTTP ${res.status}`, status: res.status }
    }
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Confirm payment for an order.
 * @param {string} orderId
 * @param {object} opts
 * @param {string} opts.paymentIntentId — required, must be unique
 * @param {string} opts.tenderType — 'card'|'cash'|'tab'|'comp'|'points'
 * @param {string} opts.guestSessionId
 */
export async function confirmPayment(orderId, { paymentIntentId, tenderType, guestSessionId }) {
  if (!paymentIntentId) return { ok: false, error: 'paymentIntentId is required' }

  const data = await safeFetch(`${BASE}/orders/${orderId}/payment-confirmed`, {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId, tenderType, guestSessionId }),
  })
  if (data !== null) return data

  return {
    ok: false,
    localPreview: true,
    error: 'LOCAL PREVIEW MODE: payment processing requires backend. Order not confirmed.',
    notice: 'Backend unavailable. No payment was processed.',
  }
}

export async function failPayment(orderId, reason) {
  const data = await safeFetch(`${BASE}/orders/${orderId}/payment-failed`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  if (data !== null) return data
  return { ok: false, error: 'Backend unavailable', localPreview: true }
}

/**
 * Attach a POS360 real transaction to a SmokeCraft session for loyalty dedup.
 * posTransactionId must be globally unique — server enforces UNIQUE constraint.
 */
export async function attachPOS360Transaction({
  posTransactionId, guestSessionId, venueId, handoffId, orderId,
  itemId, itemName, itemCategory, subtotal, quantity = 1,
  isHouseItem = false, isRecommendedPairing = false, paymentIntentId,
}) {
  if (!posTransactionId || !guestSessionId || !venueId) {
    return { ok: false, error: 'posTransactionId, guestSessionId, venueId required' }
  }

  const data = await safeFetch(`${BASE}/pos360/attach-transaction`, {
    method: 'POST',
    body: JSON.stringify({
      posTransactionId, guestSessionId, venueId, handoffId, orderId,
      itemId, itemName, itemCategory, subtotal, quantity,
      isHouseItem, isRecommendedPairing, paymentIntentId,
    }),
  })
  if (data !== null) return data

  return {
    ok: false,
    localPreview: true,
    error: 'LOCAL PREVIEW MODE: POS360 transaction attachment requires backend.',
  }
}

export async function routeOrderToStations(orderId, venueId) {
  const data = await safeFetch(`${BASE}/orders/route-to-stations`, {
    method: 'POST',
    body: JSON.stringify({ orderId, venueId }),
  })
  if (data !== null) return data
  return { ok: false, error: 'Backend unavailable', localPreview: true }
}
