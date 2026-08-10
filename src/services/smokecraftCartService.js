/**
 * SmokeCraft Cart Service — manages the guest cart lifecycle.
 * All calls go to /api/venues/cart/*. Falls back gracefully if backend unavailable.
 *
 * LOCAL PREVIEW MODE: when backend is unavailable, an in-memory cart is used.
 * Labeled clearly in every response as localPreview:true.
 */

const BASE_CART = '/api/venues/cart'
const BASE_VENUES = '/api/venues'

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

// ── In-memory fallback ────────────────────────────────────────
const _mem = {
  carts: new Map(),
  cartItems: new Map(),
}

function _memCart(cartId) {
  return _mem.carts.get(cartId) || null
}

function _memCartItems(cartId) {
  return [..._mem.cartItems.values()].filter(i => i.cart_id === cartId)
}

export async function createCart({ guestSessionId, venueId, tabletId, tableId, seatNumber }) {
  const data = await safeFetch(`${BASE_VENUES}/cart/create`, {
    method: 'POST',
    body: JSON.stringify({ guestSessionId, venueId, tabletId, tableId, seatNumber }),
  })
  if (data?.ok) return data

  // Local fallback
  const cartId = `local-cart-${Date.now()}`
  const cart = { cart_id: cartId, guest_session_id: guestSessionId, venue_id: venueId,
                  table_id: tableId, seat_number: seatNumber, status: 'open',
                  subtotal: 0, tax: 0, tip: 0, service_charge: 0, discount: 0, total: 0 }
  _mem.carts.set(cartId, cart)
  return { ok: true, cart, storageMode: 'local_preview', localPreview: true,
           notice: 'LOCAL PREVIEW MODE: cart is in-memory only. Backend unavailable.' }
}

export async function getCart(cartId) {
  const data = await safeFetch(`${BASE_CART}/${cartId}`)
  if (data?.ok) return data

  const cart = _memCart(cartId)
  const items = _memCartItems(cartId)
  return { ok: !!cart, cart, items, storageMode: 'local_preview', localPreview: true }
}

export async function addItemToCart(cartId, { itemId, quantity = 1, modifiers = [], notes = '' }) {
  const data = await safeFetch(`${BASE_CART}/${cartId}/add-item`, {
    method: 'POST',
    body: JSON.stringify({ itemId, quantity, modifiers, notes }),
  })
  if (data?.ok) return data

  // Local fallback — add to mem cart
  const cartItemId = `local-ci-${Date.now()}`
  const item = { cart_item_id: cartItemId, cart_id: cartId, item_id: itemId,
                  item_name: itemId, item_category: 'unknown', price: 0,
                  quantity, modifiers, notes, added_at: new Date().toISOString() }
  _mem.cartItems.set(cartItemId, item)
  return { ok: true, cartItem: item, storageMode: 'local_preview', localPreview: true,
           notice: 'LOCAL PREVIEW MODE: item added to local cart. Backend unavailable.' }
}

export async function removeItemFromCart(cartId, cartItemId) {
  const data = await safeFetch(`${BASE_CART}/${cartId}/items/${cartItemId}`, { method: 'DELETE' })
  if (data?.ok) return data

  _mem.cartItems.delete(cartItemId)
  return { ok: true, storageMode: 'local_preview', localPreview: true }
}

export async function checkoutCart(cartId, { tip = 0, serviceCharge = 0, ageVerified = false } = {}) {
  const data = await safeFetch(`${BASE_CART}/${cartId}/checkout`, {
    method: 'POST',
    body: JSON.stringify({ tip, serviceCharge, ageVerified }),
  })
  if (data !== null) return data

  return { ok: false, error: 'Backend unavailable. Cannot complete checkout in local preview mode.',
           localPreview: true, storageMode: 'local_preview' }
}
