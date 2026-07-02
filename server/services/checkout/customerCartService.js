/**
 * Customer Cart Service
 * Manages customer cart lifecycle in preview-safe mode.
 * Does not claim inventory reservation or database persistence without proof.
 */

import { v4 as uuidv4 } from 'uuid'

const CART_STORE = new Map()
const ITEM_STORE = new Map()

function now() { return new Date().toISOString() }

export function validateCart(cartPayload = {}) {
  const errors = []
  if (!cartPayload.venue_id) errors.push({ field: 'venue_id', message: 'venue_id is required' })
  if (cartPayload.subtotal_amount != null && cartPayload.subtotal_amount < 0)
    errors.push({ field: 'subtotal_amount', message: 'negative amounts are rejected' })
  return { ok: errors.length === 0, errors, cartValidationStatus: errors.length === 0 ? 'cart_valid' : 'cart_invalid' }
}

export function createCart(cartPayload = {}) {
  const validation = validateCart(cartPayload)
  if (!validation.ok) return { ok: false, ...validation, cartStatus: 'cart_preview' }

  const dbAvailable = !!process.env.DATABASE_URL
  const cartId = uuidv4()
  const cart = {
    cart_id:          cartId,
    venue_id:         cartPayload.venue_id,
    customer_id:      cartPayload.customer_id ?? null,
    session_id:       cartPayload.session_id ?? null,
    cart_status:      'cart_preview',
    order_mode:       cartPayload.order_mode ?? 'self_order_preview',
    order_type:       cartPayload.order_type ?? 'venue_order',
    subtotal_amount:  0,
    fee_amount:       0,
    tax_amount:       0,
    total_amount:     0,
    currency:         cartPayload.currency ?? 'usd',
    metadata:         cartPayload.metadata ?? {},
    created_at:       now(),
    updated_at:       now(),
  }
  CART_STORE.set(cartId, { ...cart, items: [] })
  return {
    ok:               true,
    cart,
    cartStatus:       'cart_preview',
    storageMode:      dbAvailable ? 'database_pending' : 'preview_fallback',
    persistenceStatus: dbAvailable ? 'database_required' : 'not_persisted',
  }
}

export function getCart(cartId) {
  const cart = CART_STORE.get(cartId)
  if (!cart) return { ok: false, cartStatus: 'cart_not_found', cartId }
  return { ok: true, cart, cartStatus: cart.cart_status }
}

export function getVenueCarts(venueId, filters = {}) {
  const carts = []
  for (const cart of CART_STORE.values()) {
    if (cart.venue_id !== venueId) continue
    if (filters.order_mode && cart.order_mode !== filters.order_mode) continue
    if (filters.cart_status && cart.cart_status !== filters.cart_status) continue
    carts.push(cart)
  }
  return { ok: true, carts, count: carts.length, venueId, cartListStatus: 'cart_preview' }
}

export function addCartItem(cartId, itemPayload = {}) {
  const cartEntry = CART_STORE.get(cartId)
  if (!cartEntry) return { ok: false, cartStatus: 'cart_not_found' }

  if (!itemPayload.item_name) return { ok: false, error: 'item_name is required' }
  if (itemPayload.quantity != null && itemPayload.quantity <= 0)
    return { ok: false, error: 'zero quantity is rejected' }
  if (itemPayload.unit_amount != null && itemPayload.unit_amount < 0)
    return { ok: false, error: 'negative amounts are rejected' }

  const qty = itemPayload.quantity ?? 1
  const unitAmount = itemPayload.unit_amount ?? 0
  const lineSubtotal = qty * unitAmount

  const item = {
    cart_item_id:         uuidv4(),
    cart_id:              cartId,
    venue_id:             cartEntry.venue_id,
    partner_id:           itemPayload.partner_id ?? null,
    product_id:           itemPayload.product_id ?? null,
    item_name:            itemPayload.item_name,
    item_category:        itemPayload.item_category ?? 'general',
    quantity:             qty,
    unit_amount:          unitAmount,
    line_subtotal_amount: lineSubtotal,
    tax_category:         itemPayload.tax_category ?? null,
    fulfillment_owner:    itemPayload.fulfillment_owner ?? 'venue',
    availability_status:  'availability_required',
    approval_status:      itemPayload.partner_id ? 'approval_required' : 'venue_item',
    metadata:             itemPayload.metadata ?? {},
    created_at:           now(),
    updated_at:           now(),
  }
  cartEntry.items.push(item)
  ITEM_STORE.set(item.cart_item_id, item)
  _recalcCart(cartEntry)
  return { ok: true, item, cartStatus: 'cart_preview', inventoryStatus: 'inventory_unavailable' }
}

export function updateCartItem(cartId, cartItemId, itemPayload = {}) {
  const cartEntry = CART_STORE.get(cartId)
  if (!cartEntry) return { ok: false, cartStatus: 'cart_not_found' }

  if (itemPayload.quantity != null && itemPayload.quantity <= 0)
    return { ok: false, error: 'zero quantity is rejected' }
  if (itemPayload.unit_amount != null && itemPayload.unit_amount < 0)
    return { ok: false, error: 'negative amounts are rejected' }

  const item = cartEntry.items.find(i => i.cart_item_id === cartItemId)
  if (!item) return { ok: false, error: 'cart_item_not_found' }

  if (itemPayload.quantity != null) item.quantity = itemPayload.quantity
  if (itemPayload.unit_amount != null) item.unit_amount = itemPayload.unit_amount
  if (itemPayload.item_name != null) item.item_name = itemPayload.item_name
  item.line_subtotal_amount = item.quantity * item.unit_amount
  item.updated_at = now()
  _recalcCart(cartEntry)
  return { ok: true, item, cartStatus: 'cart_preview' }
}

export function removeCartItem(cartId, cartItemId) {
  const cartEntry = CART_STORE.get(cartId)
  if (!cartEntry) return { ok: false, cartStatus: 'cart_not_found' }
  const idx = cartEntry.items.findIndex(i => i.cart_item_id === cartItemId)
  if (idx === -1) return { ok: false, error: 'cart_item_not_found' }
  cartEntry.items.splice(idx, 1)
  ITEM_STORE.delete(cartItemId)
  _recalcCart(cartEntry)
  return { ok: true, cartStatus: 'cart_preview', cartItemId }
}

export function clearCart(cartId) {
  const cartEntry = CART_STORE.get(cartId)
  if (!cartEntry) return { ok: false, cartStatus: 'cart_not_found' }
  for (const item of cartEntry.items) ITEM_STORE.delete(item.cart_item_id)
  cartEntry.items = []
  _recalcCart(cartEntry)
  return { ok: true, cartStatus: 'cart_preview', cartId }
}

export function buildCartSummary(cartPayload = {}) {
  const items = cartPayload.items ?? []
  const subtotal = items.reduce((s, i) => s + (i.line_subtotal_amount ?? 0), 0)
  if (subtotal < 0) return { ok: false, error: 'negative amounts are rejected' }
  return {
    ok:               true,
    subtotalCents:    subtotal,
    itemCount:        items.length,
    lineItems:        items.map(i => ({ item_name: i.item_name, quantity: i.quantity, line_subtotal_amount: i.line_subtotal_amount })),
    cartSummaryStatus: 'cart_preview',
    inventoryStatus:  'inventory_unavailable',
  }
}

export function getCartReadiness(cartPayload = {}) {
  const blockers = []
  if (!cartPayload.venue_id) blockers.push({ type: 'venue_profile_required', severity: 'critical' })
  if (!cartPayload.items?.length) blockers.push({ type: 'cart_empty', severity: 'critical' })
  if (cartPayload.items?.some(i => i.availability_status === 'availability_required'))
    blockers.push({ type: 'availability_required', severity: 'warning' })
  if (cartPayload.items?.some(i => i.approval_status === 'approval_required'))
    blockers.push({ type: 'partner_approved_required', severity: 'warning' })
  const score = Math.max(0, 100 - blockers.filter(b => b.severity === 'critical').length * 40 - blockers.filter(b => b.severity === 'warning').length * 10)
  return {
    ok:             blockers.filter(b => b.severity === 'critical').length === 0,
    cartReadiness:  score >= 60 ? 'cart_ready_for_checkout' : 'cart_preview',
    readinessScore: score,
    blockers,
    inventoryStatus: 'inventory_unavailable',
    persistenceStatus: process.env.DATABASE_URL ? 'database_required' : 'not_persisted',
  }
}

function _recalcCart(cartEntry) {
  const subtotal = cartEntry.items.reduce((s, i) => s + (i.line_subtotal_amount ?? 0), 0)
  cartEntry.subtotal_amount = subtotal
  cartEntry.total_amount = subtotal + cartEntry.fee_amount + cartEntry.tax_amount
  cartEntry.updated_at = now()
}
