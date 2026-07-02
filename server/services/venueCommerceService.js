/**
 * Venue Commerce Service — SmokeCraft venue inventory, cart, order, and
 * loyalty logic. Dual-mode: PostgreSQL when available, in-memory otherwise.
 *
 * LOCAL PREVIEW NOTE: When DATABASE_URL is not set or the venue_menu_items
 * table does not yet exist, all inventory reads fall back to
 * server/data/venueInventory.js sample data. All cart/order writes fall
 * back to in-memory Maps that reset on server restart.
 *
 * No production data is faked — every response includes a storageMode
 * field ('postgres' | 'memory_fallback') so the caller always knows.
 */

import { isDbAvailable, query } from '../db/connection.js'
import { log } from './auditService.js'
import {
  VENUE_SAMPLE_INVENTORY,
  getSampleInventory,
  getSampleItem,
  CIGAR_CATEGORIES,
  BAR_CATEGORIES,
  FOOD_CATEGORIES,
  AGE_RESTRICTED_CATEGORIES,
} from '../data/venueInventory.js'

// ── In-memory fallback stores ─────────────────────────────────────────────────
const mem = {
  inventory:    new Map(),   // item_id → { ...item, stock_quantity }
  reservations: new Map(),   // reservation_id → { item_id, qty, cart_id, status, expires_at }
  carts:        new Map(),   // cart_id → cart
  cartItems:    new Map(),   // cart_id → item[]
  orders:       new Map(),   // order_id → order
  orderItems:   new Map(),   // order_id → item[]
  attachments:  new Map(),   // pos_transaction_id → attachment (dedup)
  handoffs:     new Map(),   // handoff_id → handoff
  eatEvents:    [],
  auditLog:     [],
  guestSessions: new Map(),  // guest_session_id → extended session
}

// Seed in-memory inventory from sample data on first use
function ensureMemoryInventory() {
  if (mem.inventory.size > 0) return
  for (const item of VENUE_SAMPLE_INVENTORY) {
    mem.inventory.set(item.item_id, { ...item })
  }
}

function now() { return new Date().toISOString() }
function uid(prefix = 'id') { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` }

function storageMode(usedDb) { return usedDb ? 'postgres' : 'memory_fallback' }

// ── Audit helper ──────────────────────────────────────────────────────────────

async function auditEvent(venueId, guestSessionId, staffUserId, actionType, source, before, after, meta = {}) {
  const entry = {
    event_id:         uid('audit'),
    venue_id:         venueId || 'unknown',
    guest_session_id: guestSessionId || null,
    staff_user_id:    staffUserId || null,
    action_type:      actionType,
    source:           source || 'system',
    before_state:     before || {},
    after_state:      after  || {},
    metadata:         meta,
    created_at:       now(),
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_commerce_audit
           (venue_id, guest_session_id, staff_user_id, action_type, source,
            before_state, after_state, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [entry.venue_id, entry.guest_session_id, entry.staff_user_id,
         entry.action_type, entry.source,
         JSON.stringify(entry.before_state), JSON.stringify(entry.after_state),
         JSON.stringify(entry.metadata)]
      )
    } catch { /* fallback */ }
  }

  mem.auditLog.push(entry)
  if (mem.auditLog.length > 500) mem.auditLog.shift()

  await log('system', guestSessionId || 'system', `commerce.${actionType}`, 'venue', venueId, meta).catch(() => {})
}

// ── INVENTORY ─────────────────────────────────────────────────────────────────

/**
 * List all menu items for a venue, optionally filtered by category.
 * Returns { items, storageMode, localPreview }.
 */
export async function getVenueMenu(venueId, category = null) {
  if (isDbAvailable()) {
    try {
      const params = [venueId]
      let sql = `SELECT * FROM venue_menu_items WHERE venue_id=$1`
      if (category) { sql += ' AND item_category=$2'; params.push(category) }
      sql += ' ORDER BY sort_order, item_name'
      const result = await query(sql, params)
      if (result.rows.length > 0) {
        return { items: result.rows, storageMode: 'postgres', localPreview: false }
      }
    } catch { /* table may not exist yet, fall through */ }
  }

  ensureMemoryInventory()
  const items = getSampleInventory(venueId, category)
  return {
    items,
    storageMode: 'memory_fallback',
    localPreview: true,
    notice: 'Local Preview Mode: venue menu and bar inventory are sample data only.',
  }
}

/**
 * Check availability of an item by item_id.
 * Returns { available, stockQuantity, lowStock, outOfStock, storageMode }.
 */
export async function checkAvailability(venueId, itemId, qty = 1) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        `SELECT available, stock_quantity, low_stock_threshold
           FROM venue_menu_items WHERE venue_id=$1 AND item_id=$2`,
        [venueId, itemId]
      )
      if (result.rows[0]) {
        const row = result.rows[0]
        const available = row.available && row.stock_quantity >= qty
        return {
          available,
          stockQuantity: row.stock_quantity,
          lowStock: row.stock_quantity <= row.low_stock_threshold,
          outOfStock: row.stock_quantity < qty,
          storageMode: 'postgres',
        }
      }
    } catch { /* fallthrough */ }
  }

  ensureMemoryInventory()
  const item = mem.inventory.get(itemId)
  if (!item || item.venue_id !== venueId) {
    return { available: false, stockQuantity: 0, lowStock: true, outOfStock: true, storageMode: 'memory_fallback' }
  }
  const available = item.available && item.stock_quantity >= qty
  return {
    available,
    stockQuantity: item.stock_quantity,
    lowStock: item.stock_quantity <= item.low_stock_threshold,
    outOfStock: item.stock_quantity < qty,
    storageMode: 'memory_fallback',
    localPreview: true,
  }
}

/**
 * Reserve stock for qty units of itemId during checkout.
 * Returns { reservationId, storageMode } or throws if unavailable.
 */
export async function reserveInventory(venueId, itemId, qty, cartId) {
  const avail = await checkAvailability(venueId, itemId, qty)
  if (!avail.available) {
    throw new Error(`Item ${itemId} is out of stock or unavailable (qty requested: ${qty}, on hand: ${avail.stockQuantity})`)
  }

  const reservationId = uid('rsv')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO inventory_reservations (reservation_id, venue_id, item_id, quantity, cart_id, status, expires_at)
         VALUES ($1,$2,$3,$4,$5,'held',$6)`,
        [reservationId, venueId, itemId, qty, cartId, expiresAt]
      )
      // Decrement available quantity
      await query(
        `UPDATE venue_menu_items SET stock_quantity = stock_quantity - $1, updated_at=NOW()
           WHERE venue_id=$2 AND item_id=$3`,
        [qty, venueId, itemId]
      )
      await auditEvent(venueId, null, null, 'inventory.reserved', 'checkout',
        { stock_quantity: avail.stockQuantity }, { reserved: qty, reservation_id: reservationId }, { itemId, cartId })
      return { reservationId, storageMode: 'postgres' }
    } catch { /* fallthrough */ }
  }

  // Memory fallback
  const item = mem.inventory.get(itemId)
  if (item) {
    item.stock_quantity -= qty
    mem.inventory.set(itemId, item)
  }
  mem.reservations.set(reservationId, { reservationId, venueId, itemId, qty, cartId, status: 'held', expiresAt })
  await auditEvent(venueId, null, null, 'inventory.reserved', 'checkout',
    { stock_quantity: avail.stockQuantity }, { reserved: qty, reservation_id: reservationId }, { itemId, cartId })
  return { reservationId, storageMode: 'memory_fallback' }
}

/**
 * Release a held reservation (cancel / payment failure).
 */
export async function releaseInventory(venueId, reservationId, reason = 'cancelled') {
  if (isDbAvailable()) {
    try {
      const res = await query(
        `UPDATE inventory_reservations SET status='released' WHERE reservation_id=$1 RETURNING *`,
        [reservationId]
      )
      if (res.rows[0]) {
        const r = res.rows[0]
        await query(
          `UPDATE venue_menu_items SET stock_quantity = stock_quantity + $1, updated_at=NOW()
             WHERE venue_id=$2 AND item_id=$3`,
          [r.quantity, venueId, r.item_id]
        )
        await auditEvent(venueId, null, null, 'inventory.released', reason,
          { status: 'held' }, { status: 'released', reservation_id: reservationId }, {})
        return { released: true, storageMode: 'postgres' }
      }
    } catch { /* fallthrough */ }
  }

  const rsv = mem.reservations.get(reservationId)
  if (rsv && rsv.status === 'held') {
    rsv.status = 'released'
    mem.reservations.set(reservationId, rsv)
    const item = mem.inventory.get(rsv.itemId)
    if (item) {
      item.stock_quantity += rsv.qty
      mem.inventory.set(rsv.itemId, item)
    }
    await auditEvent(venueId, null, null, 'inventory.released', reason,
      { status: 'held' }, { status: 'released', reservation_id: reservationId }, {})
  }
  return { released: true, storageMode: 'memory_fallback' }
}

/**
 * Commit a reservation to a sale (payment confirmed, inventory permanently deducted).
 * Idempotent: same reservationId committed twice is a no-op on the second call.
 */
export async function commitInventorySale(venueId, reservationId, orderId) {
  if (isDbAvailable()) {
    try {
      const res = await query(
        `UPDATE inventory_reservations SET status='committed', order_id=$1
           WHERE reservation_id=$2 AND status='held' RETURNING *`,
        [orderId, reservationId]
      )
      if (res.rows[0]) {
        await auditEvent(venueId, null, null, 'inventory.committed', 'payment_confirmed',
          { status: 'held' }, { status: 'committed', order_id: orderId }, { reservationId })
        return { committed: true, storageMode: 'postgres' }
      }
      return { committed: false, note: 'Already committed or not found', storageMode: 'postgres' }
    } catch { /* fallthrough */ }
  }

  const rsv = mem.reservations.get(reservationId)
  if (rsv && rsv.status === 'held') {
    rsv.status = 'committed'
    rsv.orderId = orderId
    mem.reservations.set(reservationId, rsv)
    await auditEvent(venueId, null, null, 'inventory.committed', 'payment_confirmed',
      { status: 'held' }, { status: 'committed', order_id: orderId }, { reservationId })
  }
  return { committed: true, storageMode: 'memory_fallback' }
}

// ── CART ──────────────────────────────────────────────────────────────────────

const TAX_RATE = 0.085

function calcCartTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const tax = items.filter(i => i.taxable !== false).reduce((s, i) => s + i.price * i.quantity * TAX_RATE, 0)
  return {
    subtotal: +subtotal.toFixed(2),
    tax:      +tax.toFixed(2),
    total:    +(subtotal + tax).toFixed(2),
  }
}

export async function createCart({ guestSessionId, venueId, tabletId, tableId, seatNumber }) {
  const cartId = uid('cart')
  const cart = {
    cart_id:          cartId,
    guest_session_id: guestSessionId,
    venue_id:         venueId,
    tablet_id:        tabletId || null,
    table_id:         tableId  || null,
    seat_number:      seatNumber || null,
    subtotal:         0, tax: 0, tip: 0, service_charge: 0, discount: 0, comp_amount: 0, total: 0,
    status:           'open',
    created_at:       now(),
    updated_at:       now(),
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_carts
           (cart_id, guest_session_id, venue_id, tablet_id, table_id, seat_number, status)
         VALUES ($1,$2,$3,$4,$5,$6,'open')`,
        [cartId, guestSessionId, venueId, tabletId, tableId, seatNumber]
      )
      await auditEvent(venueId, guestSessionId, null, 'cart.created', 'guest', {}, { cart_id: cartId }, {})
      return { cart, storageMode: 'postgres' }
    } catch { /* fallthrough */ }
  }

  mem.carts.set(cartId, cart)
  mem.cartItems.set(cartId, [])
  await auditEvent(venueId, guestSessionId, null, 'cart.created', 'guest', {}, { cart_id: cartId }, {})
  return { cart, storageMode: 'memory_fallback' }
}

export async function addItemToCart(cartId, { itemId, quantity = 1, modifiers = [], notes = '' }) {
  // 1. Load cart
  let cart, dbCart = false
  if (isDbAvailable()) {
    try {
      const r = await query(`SELECT * FROM smokecraft_carts WHERE cart_id=$1`, [cartId])
      if (r.rows[0]) { cart = r.rows[0]; dbCart = true }
    } catch { /* fallthrough */ }
  }
  if (!cart) cart = mem.carts.get(cartId)
  if (!cart) return { ok: false, error: 'Cart not found' }
  if (cart.status !== 'open') return { ok: false, error: `Cart is ${cart.status}` }

  // 2. Check availability
  const avail = await checkAvailability(cart.venue_id, itemId, quantity)
  if (!avail.available) return { ok: false, error: `Item unavailable (${avail.outOfStock ? 'out of stock' : 'not available'})` }

  // 3. Load item details
  let itemData
  if (isDbAvailable() && dbCart) {
    try {
      const r = await query(`SELECT * FROM venue_menu_items WHERE item_id=$1`, [itemId])
      itemData = r.rows[0]
    } catch { /* fallthrough */ }
  }
  if (!itemData) {
    ensureMemoryInventory()
    itemData = getSampleItem(itemId)
  }
  if (!itemData) return { ok: false, error: 'Item not found in menu' }

  const destination =
    CIGAR_CATEGORIES.has(itemData.item_category) ? 'humidor' :
    BAR_CATEGORIES.has(itemData.item_category)   ? 'bar' :
    FOOD_CATEGORIES.has(itemData.item_category)  ? 'kitchen' :
    itemData.item_category === 'pairing_bundle' || itemData.item_category === 'full_pairing_bundle' ? 'server' :
    'retail'

  const cartItemId = uid('ci')
  const cartItem = {
    cart_item_id:           cartItemId,
    cart_id:                cartId,
    item_id:                itemId,
    item_name:              itemData.item_name,
    item_category:          itemData.item_category,
    price:                  Number(itemData.price),
    quantity,
    modifiers,
    notes:                  notes || '',
    destination,
    is_house_item:          itemData.is_house_item || false,
    is_recommended_pairing: itemData.is_recommended_pairing || false,
    loyalty_action_type:    itemData.loyalty_action_type || null,
    age_restricted:         itemData.age_restricted || AGE_RESTRICTED_CATEGORIES.has(itemData.item_category),
    reservation_id:         null,
    added_at:               now(),
    taxable:                itemData.taxable !== false,
  }

  if (isDbAvailable() && dbCart) {
    try {
      await query(
        `INSERT INTO smokecraft_cart_items
           (cart_item_id, cart_id, item_id, item_name, item_category, price, quantity,
            modifiers, notes, destination, is_house_item, is_recommended_pairing,
            loyalty_action_type, age_restricted)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [cartItemId, cartId, itemId, cartItem.item_name, cartItem.item_category,
         cartItem.price, quantity, JSON.stringify(modifiers), notes || '',
         destination, cartItem.is_house_item, cartItem.is_recommended_pairing,
         cartItem.loyalty_action_type, cartItem.age_restricted]
      )
      // Recalculate totals
      const itemsRes = await query(`SELECT * FROM smokecraft_cart_items WHERE cart_id=$1`, [cartId])
      const totals = calcCartTotals(itemsRes.rows.map(i => ({ ...i, taxable: i.taxable !== false })))
      await query(`UPDATE smokecraft_carts SET subtotal=$1,tax=$2,total=$3,updated_at=NOW() WHERE cart_id=$4`,
        [totals.subtotal, totals.tax, totals.total, cartId])
      await auditEvent(cart.venue_id, cart.guest_session_id, null, 'cart.item_added', 'guest',
        {}, { cart_id: cartId, item_id: itemId, qty: quantity }, {})
      return { ok: true, cartItemId, storageMode: 'postgres' }
    } catch { /* fallthrough */ }
  }

  // Memory path
  const items = mem.cartItems.get(cartId) || []
  items.push(cartItem)
  mem.cartItems.set(cartId, items)
  const totals = calcCartTotals(items)
  Object.assign(cart, totals, { updated_at: now() })
  mem.carts.set(cartId, cart)
  await auditEvent(cart.venue_id, cart.guest_session_id, null, 'cart.item_added', 'guest',
    {}, { cart_id: cartId, item_id: itemId, qty: quantity }, {})
  return { ok: true, cartItemId, storageMode: 'memory_fallback' }
}

export async function removeItemFromCart(cartId, cartItemId) {
  if (isDbAvailable()) {
    try {
      const cart = (await query(`SELECT * FROM smokecraft_carts WHERE cart_id=$1`, [cartId])).rows[0]
      if (!cart) return { ok: false, error: 'Cart not found' }
      await query(`DELETE FROM smokecraft_cart_items WHERE cart_item_id=$1 AND cart_id=$2`, [cartItemId, cartId])
      const itemsRes = await query(`SELECT * FROM smokecraft_cart_items WHERE cart_id=$1`, [cartId])
      const totals = calcCartTotals(itemsRes.rows)
      await query(`UPDATE smokecraft_carts SET subtotal=$1,tax=$2,total=$3,updated_at=NOW() WHERE cart_id=$4`,
        [totals.subtotal, totals.tax, totals.total, cartId])
      return { ok: true, storageMode: 'postgres' }
    } catch { /* fallthrough */ }
  }

  const items = (mem.cartItems.get(cartId) || []).filter(i => i.cart_item_id !== cartItemId)
  mem.cartItems.set(cartId, items)
  const cart = mem.carts.get(cartId)
  if (cart) { Object.assign(cart, calcCartTotals(items), { updated_at: now() }); mem.carts.set(cartId, cart) }
  return { ok: true, storageMode: 'memory_fallback' }
}

export async function getCart(cartId) {
  if (isDbAvailable()) {
    try {
      const cartRes  = await query(`SELECT * FROM smokecraft_carts WHERE cart_id=$1`, [cartId])
      const itemsRes = await query(`SELECT * FROM smokecraft_cart_items WHERE cart_id=$1 ORDER BY added_at`, [cartId])
      if (cartRes.rows[0]) return { cart: cartRes.rows[0], items: itemsRes.rows, storageMode: 'postgres' }
    } catch { /* fallthrough */ }
  }
  return {
    cart:  mem.carts.get(cartId)     || null,
    items: mem.cartItems.get(cartId) || [],
    storageMode: 'memory_fallback',
  }
}

// ── ORDER ─────────────────────────────────────────────────────────────────────

export async function checkoutCart(cartId, { tip = 0, serviceCharge = 0, ageVerified = false } = {}) {
  const { cart, items } = await getCart(cartId)
  if (!cart) return { ok: false, error: 'Cart not found' }
  if (cart.status !== 'open') return { ok: false, error: `Cart already ${cart.status}` }

  // Age verification gate — must be true before checkout can proceed
  const hasAgeRestricted = items.some(i => i.age_restricted)
  if (hasAgeRestricted && !ageVerified) {
    return {
      ok: false,
      error: 'Age verification required. A staff member must verify guest is 21+ before checkout.',
      requiresAgeVerification: true,
    }
  }

  // Reserve all items
  const reservations = []
  for (const item of items) {
    try {
      const rsv = await reserveInventory(cart.venue_id, item.item_id, item.quantity, cartId)
      reservations.push({ cartItemId: item.cart_item_id, ...rsv })
    } catch (err) {
      // Roll back reservations made so far
      for (const r of reservations) await releaseInventory(cart.venue_id, r.reservationId, 'checkout_failed').catch(() => {})
      return { ok: false, error: err.message }
    }
  }

  const totals = calcCartTotals(items)
  const total  = +(totals.total + Number(tip) + Number(serviceCharge)).toFixed(2)
  const orderId = uid('order')

  const order = {
    order_id:          orderId,
    guest_session_id:  cart.guest_session_id,
    cart_id:           cartId,
    venue_id:          cart.venue_id,
    tablet_id:         cart.tablet_id,
    table_id:          cart.table_id,
    seat_number:       cart.seat_number,
    payment_intent_id: null,
    payment_status:    'pending',
    subtotal:          totals.subtotal,
    tax:               totals.tax,
    tip:               +Number(tip).toFixed(2),
    service_charge:    +Number(serviceCharge).toFixed(2),
    discount:          0,
    comp_amount:       0,
    total,
    loyalty_points_awarded: 0,
    age_verified:      ageVerified,
    status:            'pending_payment',
    created_at:        now(),
    updated_at:        now(),
    reservations,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_orders
           (order_id, guest_session_id, cart_id, venue_id, tablet_id, table_id, seat_number,
            payment_status, subtotal, tax, tip, service_charge, total, age_verified, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9,$10,$11,$12,$13,'pending_payment')`,
        [orderId, cart.guest_session_id, cartId, cart.venue_id, cart.tablet_id,
         cart.table_id, cart.seat_number, totals.subtotal, totals.tax,
         order.tip, order.service_charge, total, ageVerified]
      )
      for (const item of items) {
        await query(
          `INSERT INTO smokecraft_order_items
             (order_id, item_id, item_name, item_category, price, quantity,
              modifiers, notes, destination, is_house_item, is_recommended_pairing, loyalty_action_type)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [orderId, item.item_id, item.item_name, item.item_category, item.price,
           item.quantity, JSON.stringify(item.modifiers || []), item.notes || '',
           item.destination || 'retail', item.is_house_item, item.is_recommended_pairing,
           item.loyalty_action_type]
        )
      }
      await query(`UPDATE smokecraft_carts SET status='checkout',updated_at=NOW() WHERE cart_id=$1`, [cartId])
      await auditEvent(cart.venue_id, cart.guest_session_id, null, 'order.created', 'checkout',
        { cart_id: cartId }, { order_id: orderId, total }, {})
      return { ok: true, orderId, total, order, storageMode: 'postgres' }
    } catch { /* fallthrough */ }
  }

  mem.orders.set(orderId, order)
  mem.orderItems.set(orderId, items.map(i => ({ ...i, order_id: orderId })))
  const cartObj = mem.carts.get(cartId)
  if (cartObj) { cartObj.status = 'checkout'; cartObj.updated_at = now(); mem.carts.set(cartId, cartObj) }
  await auditEvent(cart.venue_id, cart.guest_session_id, null, 'order.created', 'checkout',
    { cart_id: cartId }, { order_id: orderId, total }, {})
  return { ok: true, orderId, total, order, storageMode: 'memory_fallback' }
}

/**
 * Confirm payment for an order.
 * paymentIntentId is used for dedup — same intent cannot award loyalty twice.
 * mode: 'simulated' | 'real' (real requires external processor integration)
 */
export async function confirmPayment(orderId, { paymentIntentId, tenderType = 'simulated', guestSessionId } = {}) {
  // Dedup: same paymentIntentId must not process twice
  if (paymentIntentId) {
    if (isDbAvailable()) {
      try {
        const dup = await query(
          `SELECT order_id FROM smokecraft_orders
             WHERE payment_intent_id=$1 AND payment_status='paid'`,
          [paymentIntentId]
        )
        if (dup.rows.length > 0) {
          return { ok: false, error: 'Duplicate paymentIntentId — already paid', duplicate: true }
        }
      } catch { /* fallthrough */ }
    }
  }

  let order
  if (isDbAvailable()) {
    try {
      const r = await query(`SELECT * FROM smokecraft_orders WHERE order_id=$1`, [orderId])
      order = r.rows[0]
    } catch { /* fallthrough */ }
  }
  if (!order) order = mem.orders.get(orderId)
  if (!order) return { ok: false, error: 'Order not found' }
  if (order.payment_status === 'paid') return { ok: false, error: 'Order already paid', duplicate: true }

  // Calculate loyalty points for this order
  let loyaltyPointsAwarded = 0
  const orderItemsList = isDbAvailable()
    ? (await query(`SELECT * FROM smokecraft_order_items WHERE order_id=$1`, [orderId]).catch(() => ({ rows: [] }))).rows
    : mem.orderItems.get(orderId) || []

  // Award loyalty based on each item's loyalty_action_type
  // (This is additive — the actual loyalty award still goes through awardPurchasePoints
  //  on the frontend with dedup enforcement; here we just tally expected points)
  const { LOYALTY_POINT_RULES } = await import('../data/loyaltyPointRules.js').catch(() => ({ LOYALTY_POINT_RULES: {} }))
  for (const item of orderItemsList) {
    if (item.loyalty_action_type && LOYALTY_POINT_RULES[item.loyalty_action_type]) {
      loyaltyPointsAwarded += LOYALTY_POINT_RULES[item.loyalty_action_type] * (item.quantity || 1)
    }
  }

  // Commit inventory for all reservations
  if (order.reservations) {
    for (const r of order.reservations) {
      await commitInventorySale(order.venue_id, r.reservationId, orderId).catch(() => {})
    }
  }

  // Update order status
  if (isDbAvailable()) {
    try {
      await query(
        `UPDATE smokecraft_orders SET
           payment_status='paid', payment_intent_id=$1,
           loyalty_points_awarded=$2, status='paid', updated_at=NOW()
         WHERE order_id=$3`,
        [paymentIntentId || null, loyaltyPointsAwarded, orderId]
      )
      await query(`UPDATE smokecraft_carts SET status='paid',updated_at=NOW() WHERE cart_id=$1`,
        [order.cart_id])
    } catch { /* fallthrough */ }
  } else {
    const o = mem.orders.get(orderId) || order
    o.payment_status = 'paid'
    o.payment_intent_id = paymentIntentId || null
    o.loyalty_points_awarded = loyaltyPointsAwarded
    o.status = 'paid'
    o.updated_at = now()
    mem.orders.set(orderId, o)
    const cart = mem.carts.get(order.cart_id)
    if (cart) { cart.status = 'paid'; cart.updated_at = now(); mem.carts.set(order.cart_id, cart) }
  }

  await auditEvent(order.venue_id, guestSessionId || order.guest_session_id, null,
    'payment.confirmed', tenderType,
    { payment_status: 'pending' },
    { payment_status: 'paid', payment_intent_id: paymentIntentId, loyalty_points_awarded: loyaltyPointsAwarded },
    { orderId, total: order.total }
  )

  return {
    ok: true,
    orderId,
    loyaltyPointsAwarded,
    paymentStatus: 'paid',
    notice: tenderType === 'simulated'
      ? 'Local Preview Mode: payment simulated. No real processor connected.'
      : null,
    storageMode: isDbAvailable() ? 'postgres' : 'memory_fallback',
  }
}

/**
 * Fail a payment — release all inventory reservations, no loyalty awarded.
 */
export async function failPayment(orderId, reason = 'payment_failed') {
  let order
  if (isDbAvailable()) {
    try {
      const r = await query(`SELECT * FROM smokecraft_orders WHERE order_id=$1`, [orderId])
      order = r.rows[0]
      if (order) {
        await query(`UPDATE smokecraft_orders SET payment_status='failed',status='failed',updated_at=NOW() WHERE order_id=$1`, [orderId])
        await query(`UPDATE smokecraft_carts SET status='open',updated_at=NOW() WHERE cart_id=$1`, [order.cart_id])
      }
    } catch { /* fallthrough */ }
  } else {
    order = mem.orders.get(orderId)
    if (order) {
      order.payment_status = 'failed'; order.status = 'failed'; order.updated_at = now()
      mem.orders.set(orderId, order)
      const cart = mem.carts.get(order.cart_id)
      if (cart) { cart.status = 'open'; cart.updated_at = now(); mem.carts.set(order.cart_id, cart) }
    }
  }

  if (order?.reservations) {
    for (const r of order.reservations) {
      await releaseInventory(order.venue_id, r.reservationId, reason).catch(() => {})
    }
  }

  await auditEvent(order?.venue_id || 'unknown', order?.guest_session_id || null, null,
    'payment.failed', reason, { payment_status: 'pending' }, { payment_status: 'failed' }, { orderId })

  return { ok: true, released: true, storageMode: isDbAvailable() ? 'postgres' : 'memory_fallback' }
}

// ── POS360 TRANSACTION ATTACHMENT ─────────────────────────────────────────────

/**
 * Attach a real POS360 transaction to a SmokeCraft guest session.
 * Deduplicates by posTransactionId — same transaction cannot award loyalty twice.
 */
export async function attachPOS360Transaction({
  guestSessionId, handoffId, orderId, posTransactionId, paymentIntentId,
  venueId, itemId, itemName, itemCategory, subtotal, quantity,
  isHouseItem, isRecommendedPairing, loyaltyPointsAwarded,
}) {
  if (!posTransactionId) return { ok: false, error: 'posTransactionId required' }

  // Dedup check
  if (isDbAvailable()) {
    try {
      const dup = await query(
        `SELECT attachment_id FROM pos360_transaction_attachments WHERE pos_transaction_id=$1`,
        [posTransactionId]
      )
      if (dup.rows.length > 0) return { ok: false, error: 'Duplicate posTransactionId', duplicate: true }

      const r = await query(
        `INSERT INTO pos360_transaction_attachments
           (guest_session_id, handoff_id, order_id, pos_transaction_id, payment_intent_id,
            venue_id, item_id, item_name, item_category, subtotal, quantity,
            is_house_item, is_recommended_pairing, loyalty_points_awarded)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [guestSessionId, handoffId || null, orderId || null, posTransactionId,
         paymentIntentId || null, venueId, itemId || null, itemName || null,
         itemCategory || null, subtotal || 0, quantity || 1,
         isHouseItem || false, isRecommendedPairing || false, loyaltyPointsAwarded || 0]
      )
      await auditEvent(venueId, guestSessionId, null, 'pos360.transaction_attached', 'pos360',
        {}, { pos_transaction_id: posTransactionId, loyalty_points_awarded: loyaltyPointsAwarded }, {})
      return { ok: true, attachment: r.rows[0], storageMode: 'postgres' }
    } catch { /* fallthrough */ }
  }

  if (mem.attachments.has(posTransactionId)) {
    return { ok: false, error: 'Duplicate posTransactionId', duplicate: true }
  }
  const attachment = { attachment_id: uid('att'), guestSessionId, posTransactionId,
    venueId, itemId, itemName, itemCategory, subtotal, quantity,
    isHouseItem, isRecommendedPairing, loyaltyPointsAwarded, created_at: now() }
  mem.attachments.set(posTransactionId, attachment)
  await auditEvent(venueId, guestSessionId, null, 'pos360.transaction_attached', 'pos360',
    {}, { pos_transaction_id: posTransactionId, loyalty_points_awarded: loyaltyPointsAwarded }, {})
  return { ok: true, attachment, storageMode: 'memory_fallback' }
}

// ── STAFF HANDOFF ─────────────────────────────────────────────────────────────

/**
 * Start a staff handoff from a SmokeCraft guest session.
 * Saves resume state so the guest can return to their exact route.
 */
export async function startHandoff({
  guestSessionId, venueId, tabletId, target, startRoute, returnRoute,
  currentVisit, currentSession,
}) {
  const handoffId = uid('hoff')
  const handoff = {
    handoff_id:       handoffId,
    guest_session_id: guestSessionId,
    venue_id:         venueId || 'novee-grand-lounge',
    tablet_id:        tabletId || null,
    source:           'smokecraft',
    target:           target || 'pos360',
    start_route:      startRoute,
    return_route:     returnRoute,
    current_visit:    currentVisit || 1,
    current_session:  currentSession || 1,
    staff_user_id:    null,
    pin_verified:     false,
    status:           'started',
    started_at:       now(),
    pin_verified_at:  null,
    returned_at:      null,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO staff_handoff_events
           (handoff_id, guest_session_id, venue_id, tablet_id, source, target,
            start_route, return_route, current_visit, current_session, status)
         VALUES ($1,$2,$3,$4,'smokecraft',$5,$6,$7,$8,$9,'started')`,
        [handoffId, guestSessionId, venueId, tabletId, target,
         startRoute, returnRoute, currentVisit, currentSession]
      )
    } catch { /* fallthrough */ }
  }

  mem.handoffs.set(handoffId, handoff)
  await auditEvent(venueId, guestSessionId, null, 'handoff.started', 'smokecraft',
    {}, { handoff_id: handoffId, target, start_route: startRoute }, {})
  return { ok: true, handoffId, handoff, storageMode: isDbAvailable() ? 'postgres' : 'memory_fallback' }
}

/**
 * Return from staff mode back to guest session.
 * Returns the saved returnRoute so the frontend can navigate.
 */
export async function returnFromHandoff(handoffId) {
  let handoff
  if (isDbAvailable()) {
    try {
      const r = await query(
        `UPDATE staff_handoff_events SET status='returned_to_guest', returned_at=NOW()
           WHERE handoff_id=$1 RETURNING *`,
        [handoffId]
      )
      handoff = r.rows[0]
    } catch { /* fallthrough */ }
  }
  if (!handoff) {
    handoff = mem.handoffs.get(handoffId)
    if (handoff) {
      handoff.status = 'returned_to_guest'
      handoff.returned_at = now()
      mem.handoffs.set(handoffId, handoff)
    }
  }

  if (!handoff) return { ok: false, error: 'Handoff not found' }

  await auditEvent(handoff.venue_id, handoff.guest_session_id, handoff.staff_user_id,
    'handoff.returned', 'smokecraft', { status: 'in_staff_mode' },
    { status: 'returned_to_guest', return_route: handoff.return_route }, {})

  return {
    ok: true,
    returnRoute: handoff.return_route,
    guestSessionId: handoff.guest_session_id,
    storageMode: isDbAvailable() ? 'postgres' : 'memory_fallback',
  }
}

// ── E.A.T. SYNC ───────────────────────────────────────────────────────────────

export async function syncToEAT({
  guestSessionId, handoffId, venueId, staffUserId, syncType, notes,
  vipCandidateSignal, recommendedFollowUp, inventoryDemandSignal,
}) {
  const syncId = uid('eat')
  const event = {
    sync_id:                   syncId,
    guest_session_id:          guestSessionId,
    handoff_id:                handoffId || null,
    venue_id:                  venueId || 'novee-grand-lounge',
    staff_user_id:             staffUserId || null,
    sync_type:                 syncType,
    notes:                     notes || null,
    vip_candidate_signal:      vipCandidateSignal || false,
    recommended_follow_up:     recommendedFollowUp || null,
    inventory_demand_signal:   inventoryDemandSignal || [],
    status:                    'sent',
    created_at:                now(),
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO eat_management_sync_events
           (sync_id, guest_session_id, handoff_id, venue_id, staff_user_id, sync_type,
            notes, vip_candidate_signal, recommended_follow_up, inventory_demand_signal, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'sent')`,
        [syncId, guestSessionId, handoffId, venueId, staffUserId, syncType,
         notes, vipCandidateSignal || false, recommendedFollowUp,
         JSON.stringify(inventoryDemandSignal || [])]
      )
      return { ok: true, syncId, storageMode: 'postgres', localPreview: false }
    } catch { /* fallthrough */ }
  }

  mem.eatEvents.push(event)
  if (mem.eatEvents.length > 200) mem.eatEvents.shift()
  return {
    ok: true,
    syncId,
    storageMode: 'memory_fallback',
    localPreview: true,
    notice: 'Local Preview Mode: E.A.T. sync event stored locally only.',
  }
}

// ── GUEST SESSION PROGRESS ────────────────────────────────────────────────────

export async function saveGuestSessionProgress(guestSessionId, data) {
  const { venueId, currentRoute, currentVisit, currentSession, currentSessionId,
    completedSteps, badges, journeyXP, skillScore, challengeScore, loyaltyPoints,
    passportStampCount, currentMode, lastHandoffId, activeCartId, activeOrderId,
    tableId, seatNumber, sectionName, patioZone, loungeZone, barSeat, serverId, tabletId } = data

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_guest_sessions
           (guest_session_id, venue_id, tablet_id, current_route, current_visit,
            current_session_num, current_session_id, completed_steps, badges,
            journey_xp, skill_score, challenge_score, loyalty_points,
            passport_stamp_count, current_mode, last_handoff_id, active_cart_id,
            active_order_id, table_id, seat_number, section_name, patio_zone,
            lounge_zone, bar_seat, server_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
         ON CONFLICT (guest_session_id) DO UPDATE SET
           current_route=$4, current_visit=$5, current_session_num=$6,
           current_session_id=$7, completed_steps=$8, badges=$9,
           journey_xp=$10, skill_score=$11, challenge_score=$12,
           loyalty_points=$13, passport_stamp_count=$14, current_mode=$15,
           last_handoff_id=$16, active_cart_id=$17, active_order_id=$18,
           table_id=$19, seat_number=$20, section_name=$21, patio_zone=$22,
           lounge_zone=$23, bar_seat=$24, server_id=$25, updated_at=NOW()`,
        [guestSessionId, venueId || 'novee-grand-lounge', tabletId || null,
         currentRoute, currentVisit || 1, currentSession || 1, currentSessionId || null,
         JSON.stringify(completedSteps || []), JSON.stringify(badges || []),
         journeyXP || 0, skillScore || 0, challengeScore || 0, loyaltyPoints || 0,
         passportStampCount || 0, currentMode || 'guest',
         lastHandoffId || null, activeCartId || null, activeOrderId || null,
         tableId || null, seatNumber || null, sectionName || null,
         patioZone || null, loungeZone || null, barSeat || null, serverId || null]
      )
      return { ok: true, storageMode: 'postgres' }
    } catch { /* fallthrough */ }
  }

  mem.guestSessions.set(guestSessionId, { guest_session_id: guestSessionId, ...data, updated_at: now() })
  return { ok: true, storageMode: 'memory_fallback' }
}

export async function getGuestSessionResume(guestSessionId) {
  if (isDbAvailable()) {
    try {
      const r = await query(
        `SELECT * FROM smokecraft_guest_sessions WHERE guest_session_id=$1`, [guestSessionId]
      )
      if (r.rows[0]) return { ok: true, session: r.rows[0], storageMode: 'postgres' }
    } catch { /* fallthrough */ }
  }

  const session = mem.guestSessions.get(guestSessionId)
  return session
    ? { ok: true, session, storageMode: 'memory_fallback' }
    : { ok: false, error: 'Session not found', storageMode: 'memory_fallback' }
}

// ── ORDER TICKET ROUTING ──────────────────────────────────────────────────────

/**
 * Route a confirmed order's items into station tickets.
 * Returns { tickets: { kitchen, bar, humidor, server } }
 */
export async function routeOrderToStations(orderId, venueId) {
  let items
  if (isDbAvailable()) {
    try {
      const r = await query(`SELECT * FROM smokecraft_order_items WHERE order_id=$1 AND voided=false`, [orderId])
      items = r.rows
    } catch { /* fallthrough */ }
  }
  if (!items) items = (mem.orderItems.get(orderId) || []).filter(i => !i.voided)

  const routes = { kitchen: [], bar: [], humidor: [], server: [], management: [] }
  const tickets = []

  for (const item of items) {
    const dest = item.destination || 'retail'
    if (!routes[dest]) continue

    const ticketId = uid('tkt')
    const ticket = {
      ticket_id:         ticketId,
      order_id:          orderId,
      venue_id:          venueId,
      table_id:          null,
      seat_number:       null,
      items:             [{ item_id: item.item_id, name: item.item_name, qty: item.quantity,
                           modifiers: item.modifiers || [], notes: item.notes || '' }],
      destination_queue: dest,
      status:            'queued',
      priority:          5,
      notes:             '',
      created_at:        now(),
      updated_at:        now(),
    }

    routes[dest].push(ticket)
    tickets.push(ticket)

    if (isDbAvailable()) {
      try {
        await query(
          `INSERT INTO order_tickets (ticket_id, order_id, venue_id, items, destination_queue, status, priority)
           VALUES ($1,$2,$3,$4,$5,'queued',5)`,
          [ticketId, orderId, venueId, JSON.stringify(ticket.items), dest]
        )
      } catch { /* ignore — mem fallback is fine */ }
    }
  }

  await auditEvent(venueId, null, null, 'order.routed', 'station_routing',
    {}, { order_id: orderId, ticket_count: tickets.length }, { routes: Object.fromEntries(Object.entries(routes).map(([k,v]) => [k, v.length])) })

  return { ok: true, tickets: routes, ticketCount: tickets.length,
    storageMode: isDbAvailable() ? 'postgres' : 'memory_fallback' }
}

// ── AUDIT READ ────────────────────────────────────────────────────────────────

export async function getCommerceAuditLog(venueId, limit = 50) {
  if (isDbAvailable()) {
    try {
      const r = await query(
        `SELECT * FROM smokecraft_commerce_audit WHERE venue_id=$1 ORDER BY created_at DESC LIMIT $2`,
        [venueId, limit]
      )
      return { entries: r.rows, storageMode: 'postgres' }
    } catch { /* fallthrough */ }
  }

  const entries = mem.auditLog
    .filter(e => e.venue_id === venueId)
    .slice(-limit)
    .reverse()
  return { entries, storageMode: 'memory_fallback' }
}
