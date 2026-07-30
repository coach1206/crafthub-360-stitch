/**
 * Venue Humidor 1B-2A — server-authoritative checkout quote, order
 * creation from a real hold, hold conversion, and completion/
 * cancellation. Never trusts a browser-submitted price, tax, total,
 * or inventory quantity. Reuses inventoryService.js (holds, inventory
 * events), the real tax engine (taxCalculationEngine.js), and
 * venues.settings for fulfillment configuration — no duplicate
 * payment, tax, or order-ownership mechanism created.
 */
import { getDb } from '../../db/connection.js'
import { applyInventoryEvent, releaseHold } from './inventoryService.js'
import { calculateOrderTax } from '../tax/taxCalculationEngine.js'
import { recordVenueHumidorEvent } from './venueHumidorEventService.js'

export class CheckoutError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'

// Honest, real venue-configurable fulfillment support. A venue's real
// `venues.settings.venueHumidorFulfillment` JSONB can override any of
// these; unconfigured venues fall back to this documented default —
// POS360 tab options are unsupported by default (no real POS360
// integration exists for Venue Humidor yet, matching the honest 501
// boundary already established in 1B-1 for "Add to Venue Tab").
const DEFAULT_FULFILLMENT_SUPPORT = {
  counter_pickup: true,
  table_delivery: true,
  lounge_seat_delivery: true,
  pos_tab_existing: false,
  pos_tab_new: false,
}

async function getFulfillmentSupport(venue) {
  const configured = venue.settings?.venueHumidorFulfillment
  return { ...DEFAULT_FULFILLMENT_SUPPORT, ...(configured || {}) }
}

function generateOrderNumber() {
  return `VH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

// Locks the hold row WITHOUT validating its status — the caller must
// recheck idempotency BEFORE calling validateOwnedActiveHold(), since
// a two-tab race's losing request would otherwise see the winner's
// already-'converted' hold and fail with a fabricated stale_hold error
// instead of gracefully deduping on the real idempotency key.
async function lockHold(client, holdId) {
  const { rows } = await client.query(`SELECT * FROM venue_cigar_inventory_holds WHERE hold_id = $1 FOR UPDATE`, [holdId])
  if (!rows[0]) throw new CheckoutError('hold_not_found')
  return rows[0]
}

function validateOwnedActiveHold(hold, venueId, actorRef) {
  if (hold.venue_id !== venueId) throw new CheckoutError('wrong_venue_hold')
  if (hold.held_by !== actorRef) throw new CheckoutError('wrong_user_hold')
  if (hold.status !== 'active') throw new CheckoutError(`stale_hold:${hold.status}`)
  if (new Date(hold.expires_at).getTime() <= Date.now()) throw new CheckoutError('expired_hold')
}

async function loadOwnedActiveHold(client, venueId, holdId, actorRef) {
  const hold = await lockHold(client, holdId)
  validateOwnedActiveHold(hold, venueId, actorRef)
  return hold
}

/**
 * Server-authoritative checkout quote — computes item price, subtotal,
 * tax, service charge, discount, total, hold expiration, available
 * fulfillment options, age-verification requirement, and payment/POS
 * availability. Never trusts any client-submitted price/tax/total.
 */
export async function getCheckoutQuote(venueId, holdId, actorRef, { tipCents = 0 } = {}) {
  const db = getDb()
  const { rows: venueRows } = await db.query(`SELECT * FROM venues WHERE venue_id = $1 AND status = 'active'`, [venueId])
  const venue = venueRows[0]
  if (!venue) throw new CheckoutError('no_active_venue')

  const { rows: holdRows } = await db.query(`SELECT * FROM venue_cigar_inventory_holds WHERE hold_id = $1`, [holdId])
  const hold = holdRows[0]
  if (!hold) throw new CheckoutError('hold_not_found')
  if (hold.venue_id !== venueId) throw new CheckoutError('wrong_venue_hold')
  if (hold.held_by !== actorRef) throw new CheckoutError('wrong_user_hold')
  if (hold.status !== 'active') throw new CheckoutError(`stale_hold:${hold.status}`)
  if (new Date(hold.expires_at).getTime() <= Date.now()) throw new CheckoutError('expired_hold')

  const { rows: productRows } = await db.query(`SELECT * FROM venue_cigar_products WHERE product_id = $1 AND venue_id = $2`, [hold.product_id, venueId])
  const product = productRows[0]
  if (!product) throw new CheckoutError('product_not_found')

  const subtotalCents = product.price_cents * hold.quantity
  const safeTipCents = Number.isInteger(tipCents) && tipCents >= 0 ? Math.min(tipCents, subtotalCents * 2) : 0

  const taxResult = await calculateOrderTax({
    venueId,
    venueItems: [{ productType: 'cigar', price: product.price_cents / 100, quantity: hold.quantity }],
  })
  const taxCents = taxResult.ok ? taxResult.totalTaxCents : 0

  const serviceChargeCents = 0
  const discountCents = 0
  const totalCents = subtotalCents + taxCents + serviceChargeCents - discountCents + safeTipCents

  const fulfillmentSupport = await getFulfillmentSupport(venue)

  const quote = {
    venueId, holdId, productId: product.product_id, quantity: hold.quantity,
    product: { name: product.name, brand: product.brand, primaryImageUrl: product.primary_image_url, vitola: product.vitola },
    unitPriceCents: product.price_cents,
    subtotalCents, taxCents, serviceChargeCents, discountCents, tipCents: safeTipCents, totalCents,
    currency: 'USD',
    taxStatus: taxResult.ok ? taxResult.taxStatus : 'tax_config_required',
    holdExpiresAt: hold.expires_at,
    fulfillmentOptions: fulfillmentSupport,
    ageVerificationRequired: true,
    paymentAvailable: false,
    paymentNote: 'Payment processing not connected',
  }

  await recordVenueHumidorEvent({
    guestReference: actorRef, venueId, sourceScreen: 'VenueHumidorCheckout', sourceRoute: `/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/quote`,
    eventType: 'venue_humidor_checkout_quoted', holdId, productId: product.product_id, quantity: hold.quantity,
    totals: { subtotalCents, taxCents, totalCents }, status: 'quoted',
    idempotencyKey: `venue-humidor-quoted-${holdId}-${Date.now()}`,
  })

  return quote
}

/**
 * Creates a real pending order from a valid, owned, active,
 * unexpired hold. Server recomputes price/tax — the client may only
 * submit fulfillment choice, table/seat/pickup details, notes, and
 * (where policy permits) tip. Idempotent — a repeated call with the
 * same idempotency key returns the original order, never duplicates.
 */
export async function createOrderFromHold(venueId, holdId, actorRef, {
  fulfillmentMethod, fulfillmentDetails, customerNotes, tipCents = 0, ageVerified, idempotencyKey,
} = {}) {
  if (!idempotencyKey) throw new CheckoutError('idempotency_key_required')
  if (!ageVerified) throw new CheckoutError('age_verification_required')

  const db = getDb()
  const { rows: preCheck } = await db.query(`SELECT * FROM venue_cigar_orders WHERE idempotency_key = $1`, [idempotencyKey])
  if (preCheck[0]) return { order: preCheck[0], deduplicated: true }

  const { rows: venueRows } = await db.query(`SELECT * FROM venues WHERE venue_id = $1 AND status = 'active'`, [venueId])
  const venue = venueRows[0]
  if (!venue) throw new CheckoutError('no_active_venue')
  const fulfillmentSupport = await getFulfillmentSupport(venue)
  if (!fulfillmentMethod || !fulfillmentSupport[fulfillmentMethod]) throw new CheckoutError('unsupported_fulfillment_method')

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    // Lock first, THEN recheck idempotency (authoritative, in-lock),
    // and only THEN validate hold status — a two-tab race's losing
    // request must see the winner's real order via idempotency dedupe,
    // never a fabricated stale_hold error from seeing the now-
    // converted hold.
    const hold = await lockHold(client, holdId)
    const { rows: dupCheck } = await client.query(`SELECT * FROM venue_cigar_orders WHERE idempotency_key = $1`, [idempotencyKey])
    if (dupCheck[0]) { await client.query('ROLLBACK'); return { order: dupCheck[0], deduplicated: true } }
    validateOwnedActiveHold(hold, venueId, actorRef)

    const { rows: productRows } = await client.query(`SELECT * FROM venue_cigar_products WHERE product_id = $1 AND venue_id = $2 FOR UPDATE`, [hold.product_id, venueId])
    const product = productRows[0]
    if (!product) throw new CheckoutError('product_not_found')

    const subtotalCents = product.price_cents * hold.quantity
    const taxResult = await calculateOrderTax({ venueId, venueItems: [{ productType: 'cigar', price: product.price_cents / 100, quantity: hold.quantity }] })
    const taxCents = taxResult.ok ? taxResult.totalTaxCents : 0
    const safeTipCents = Number.isInteger(tipCents) && tipCents >= 0 ? Math.min(tipCents, subtotalCents * 2) : 0
    const totalCents = subtotalCents + taxCents + safeTipCents

    const paymentStatus = ['pos_tab_existing', 'pos_tab_new'].includes(fulfillmentMethod) ? 'pending_pos_confirmation' : 'pending_staff_confirmation'

    let orderRow
    try {
      const { rows } = await client.query(
        `INSERT INTO venue_cigar_orders (
           venue_id, customer_reference, order_number, hold_id, status, payment_status,
           fulfillment_method, fulfillment_details, customer_notes, subtotal_cents, tax_cents,
           tip_cents, total_cents, currency, age_verification_required, age_verified,
           product_snapshot, idempotency_key
         ) VALUES ($1,$2,$3,$4,'pending_payment',$5,$6,$7,$8,$9,$10,$11,$12,'USD',true,$13,$14,$15)
         RETURNING *`,
        [
          venueId, actorRef, generateOrderNumber(), holdId, paymentStatus, fulfillmentMethod,
          JSON.stringify(fulfillmentDetails || {}), customerNotes || null, subtotalCents, taxCents,
          safeTipCents, totalCents, ageVerified, JSON.stringify({ name: product.name, brand: product.brand, vitola: product.vitola, priceCents: product.price_cents }),
          idempotencyKey,
        ]
      )
      orderRow = rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        await client.query('ROLLBACK')
        const { rows } = await db.query(`SELECT * FROM venue_cigar_orders WHERE idempotency_key = $1`, [idempotencyKey])
        return { order: rows[0], deduplicated: true }
      }
      throw err
    }

    await client.query(
      `INSERT INTO venue_cigar_order_items (order_id, product_id, quantity, unit_price_cents, line_total_cents, hold_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [orderRow.order_id, product.product_id, hold.quantity, product.price_cents, subtotalCents, holdId]
    )

    // Hold is now linked to a real order — 'converted' marks it as no
    // longer available to expire/release on its own; physical
    // inventory is NOT deducted here (only on real completion).
    await client.query(`UPDATE venue_cigar_inventory_holds SET status = 'converted', updated_at = now() WHERE hold_id = $1`, [holdId])
    await client.query(
      `INSERT INTO venue_cigar_inventory_events (venue_id, product_id, event_type, quantity_delta, physical_quantity_before, physical_quantity_after, actor_id, reference_type, reference_id)
       VALUES ($1,$2,'hold_created',0,$3,$3,$4,'order',$5)`,
      [venueId, product.product_id, product.physical_quantity, actorRef, orderRow.order_id]
    )

    await client.query('COMMIT')

    await recordVenueHumidorEvent({
      guestReference: actorRef, venueId, sourceScreen: 'VenueHumidorCheckout', sourceRoute: `/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`,
      eventType: 'venue_humidor_order_created', orderId: orderRow.order_id, holdId, productId: product.product_id, quantity: hold.quantity,
      totals: { subtotalCents, taxCents, totalCents }, status: 'pending_payment',
      idempotencyKey: `venue-humidor-order-created-canonical-${orderRow.order_id}`,
    })
    await recordVenueHumidorEvent({
      guestReference: actorRef, venueId, sourceScreen: 'VenueHumidorCheckout', sourceRoute: `/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`,
      eventType: 'venue_humidor_payment_pending', orderId: orderRow.order_id, holdId, productId: product.product_id, quantity: hold.quantity,
      totals: { totalCents }, status: paymentStatus,
      idempotencyKey: `venue-humidor-payment-pending-canonical-${orderRow.order_id}`,
    })

    return { order: orderRow, deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Completes an order — the ONLY point where physical inventory is
 * deducted. Requires an existing valid path (staff/POS/payment
 * confirmation — authorization enforced at the route level).
 * Idempotent: an already-completed order returns the original result.
 */
export async function completeOrder(orderId, actorId, actorRole, { idempotencyKey } = {}) {
  if (!idempotencyKey) throw new CheckoutError('idempotency_key_required')
  const db = getDb()
  const { rows: orderRows } = await db.query(`SELECT * FROM venue_cigar_orders WHERE order_id = $1`, [orderId])
  const order = orderRows[0]
  if (!order) throw new CheckoutError('order_not_found')
  if (order.status === 'completed') return { order, deduplicated: true }
  // 'draft' is included: 1A's bare orderService.createOrder() (no
  // linked hold, used by direct staff order entry) never transitions
  // out of its default 'draft' status before completion — this
  // function is the one completion path for every venue_cigar_orders
  // row regardless of which creation path produced it.
  if (order.status !== 'draft' && order.status !== 'pending_payment') throw new CheckoutError('order_not_completable')

  const { rows: items } = await db.query(`SELECT * FROM venue_cigar_order_items WHERE order_id = $1`, [orderId])
  for (const item of items) {
    await applyInventoryEvent(item.product_id, 'sale_completed', -item.quantity, actorId, actorRole || 'staff', {
      idempotencyKey: `${idempotencyKey}-item-${item.order_item_id}`,
      referenceType: 'order', referenceId: orderId,
      metadata: { orderItemId: item.order_item_id, quantity: item.quantity },
    })
  }

  // fulfillment_status (1B-2B-2) is stamped in this SAME authoritative
  // UPDATE — never a second write path — so a completed order is
  // never visible as pending in either dimension.
  const { rows: updatedRows } = await db.query(
    `UPDATE venue_cigar_orders SET status = 'completed', payment_status = 'confirmed', fulfillment_status = 'completed', completed_at = now(), updated_at = now() WHERE order_id = $1 RETURNING *`,
    [orderId]
  )
  const updated = updatedRows[0]

  await recordVenueHumidorEvent({
    guestReference: order.customer_reference, venueId: order.venue_id, sourceScreen: 'StaffCompletion', sourceRoute: `/api/smokecraft/venue-humidor/orders/${orderId}/complete`,
    eventType: 'venue_humidor_hold_converted', orderId, holdId: order.hold_id, quantity: items[0]?.quantity,
    totals: { totalCents: order.total_cents }, status: 'converted',
    idempotencyKey: `venue-humidor-hold-converted-canonical-${orderId}`,
  })
  await recordVenueHumidorEvent({
    guestReference: order.customer_reference, venueId: order.venue_id, sourceScreen: 'StaffCompletion', sourceRoute: `/api/smokecraft/venue-humidor/orders/${orderId}/complete`,
    eventType: 'venue_humidor_order_completed', orderId, holdId: order.hold_id, quantity: items[0]?.quantity,
    totals: { totalCents: order.total_cents }, status: 'completed',
    idempotencyKey: `venue-humidor-order-completed-canonical-${orderId}`,
  })

  // 1B-2B-3 Passport-acquisition boundary: written ONLY here, inside
  // the sole canonical completion path, guarded by a real unique
  // constraint on order_item_id — applies exactly once per completed
  // order item regardless of which caller (fulfillment queue, future
  // paths) reached completion. A cancelled/expired/blocked/unfulfilled
  // order never reaches this line, so it never gets a Passport row.
  for (const item of items) {
    try {
      await db.query(
        `INSERT INTO venue_cigar_passport_acquisitions (
           order_id, order_item_id, venue_id, customer_reference, product_id,
           product_snapshot, quantity, idempotency_key
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (order_item_id) DO NOTHING`,
        [
          orderId, item.order_item_id, order.venue_id, order.customer_reference, item.product_id,
          JSON.stringify(order.product_snapshot || {}), item.quantity,
          `venue-humidor-passport-${item.order_item_id}`,
        ]
      )
      await recordVenueHumidorEvent({
        guestReference: order.customer_reference, venueId: order.venue_id, sourceScreen: 'StaffCompletion', sourceRoute: `/api/smokecraft/venue-humidor/orders/${orderId}/complete`,
        eventType: 'venue_humidor_order_completed', orderId, productId: item.product_id, quantity: item.quantity,
        status: 'passport_save_completed',
        idempotencyKey: `venue-humidor-passport-completed-canonical-${item.order_item_id}`,
      })
    } catch (err) {
      // Passport is a real, defined boundary but its failure must
      // never corrupt the already-committed, authoritative order
      // completion — recorded honestly, never silently swallowed.
      await recordVenueHumidorEvent({
        guestReference: order.customer_reference, venueId: order.venue_id, sourceScreen: 'StaffCompletion', sourceRoute: `/api/smokecraft/venue-humidor/orders/${orderId}/complete`,
        eventType: 'venue_humidor_order_completed', orderId, productId: item.product_id, quantity: item.quantity,
        status: 'passport_save_failed',
        idempotencyKey: `venue-humidor-passport-failed-canonical-${item.order_item_id}-${Date.now()}`,
      })
    }
  }

  return { order: updated, deduplicated: false }
}

/**
 * Cancels an order. If still pending, releases the linked hold (never
 * deducted inventory, nothing to restore). If already completed,
 * restores inventory exactly once (refund path, reusing the same
 * applyInventoryEvent idempotency).
 */
export async function cancelOrder(orderId, actorId, { idempotencyKey, reason } = {}) {
  if (!idempotencyKey) throw new CheckoutError('idempotency_key_required')
  const db = getDb()
  const { rows: orderRows } = await db.query(`SELECT * FROM venue_cigar_orders WHERE order_id = $1`, [orderId])
  const order = orderRows[0]
  if (!order) throw new CheckoutError('order_not_found')
  if (order.status === 'cancelled') return { order, deduplicated: true }
  if (order.status === 'refunded') throw new CheckoutError('order_already_refunded')

  const wasCompleted = order.status === 'completed'
  if (wasCompleted) {
    const { rows: items } = await db.query(`SELECT * FROM venue_cigar_order_items WHERE order_id = $1`, [orderId])
    for (const item of items) {
      await applyInventoryEvent(item.product_id, 'cancellation_restored', item.quantity, actorId, 'staff', {
        idempotencyKey: `${idempotencyKey}-item-${item.order_item_id}`,
        referenceType: 'order', referenceId: orderId,
        metadata: { orderItemId: item.order_item_id, quantity: item.quantity, reason },
      })
    }
  } else if (order.hold_id) {
    await releaseHold(order.hold_id, actorId).catch(() => {})
  }

  // fulfillment_status (1B-2B-2) is stamped in this SAME authoritative
  // UPDATE — a cancelled/refunded order is never visible as active in
  // either dimension. cancellation_reason persists the real reason
  // the caller supplied, if any. fulfillment_status has no distinct
  // 'refunded' value (its CHECK constraint only covers the staff
  // workflow states) — 'refunded' orders (a completed sale later
  // reversed) map onto the same 'cancelled' fulfillment_status, since
  // the financial distinction is owned entirely by `status`.
  const { rows: updatedRows } = await db.query(
    `UPDATE venue_cigar_orders SET status = $2, fulfillment_status = 'cancelled', cancellation_reason = $3, cancelled_at = now(), updated_at = now() WHERE order_id = $1 RETURNING *`,
    [orderId, wasCompleted ? 'refunded' : 'cancelled', reason || null]
  )
  const updated = updatedRows[0]

  await recordVenueHumidorEvent({
    guestReference: order.customer_reference, venueId: order.venue_id, sourceScreen: 'VenueHumidorCheckout', sourceRoute: `/api/smokecraft/venue-humidor/orders/${orderId}/cancel`,
    eventType: 'venue_humidor_order_canceled', orderId, holdId: order.hold_id,
    totals: { totalCents: order.total_cents }, status: updated.status,
    idempotencyKey: `venue-humidor-order-canceled-canonical-${orderId}`,
  })
  if (!wasCompleted && order.hold_id) {
    await recordVenueHumidorEvent({
      guestReference: order.customer_reference, venueId: order.venue_id, sourceScreen: 'VenueHumidorCheckout', sourceRoute: `/api/smokecraft/venue-humidor/orders/${orderId}/cancel`,
      eventType: 'venue_humidor_hold_released', orderId, holdId: order.hold_id, status: 'released',
      idempotencyKey: `venue-humidor-hold-released-canonical-${order.hold_id}`,
    })
  }

  return { order: updated, deduplicated: false, restored: wasCompleted }
}

// Customer-facing read. Redacts staff-internal columns added by
// 1B-2B-3 (pickup-code hash/attempts, staff handoff notes, internal
// block reason, assignment/staff identity) — the customer only ever
// sees whether a pickup code is currently active/expired, never any
// secret material or internal staff detail.
const CUSTOMER_INTERNAL_FIELDS = [
  'pickup_code_hash', 'pickup_code_attempts', 'handoff_notes',
  'assigned_staff_id', 'assigned_staff_role', 'handoff_staff_id', 'handoff_staff_role',
  'blocked_reason',
]

export async function getOrder(venueId, orderId, actorRef) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM venue_cigar_orders WHERE order_id = $1 AND venue_id = $2`, [orderId, venueId])
  const order = rows[0]
  if (!order) return null
  if (order.customer_reference !== actorRef) throw new CheckoutError('order_not_owned')
  const { rows: items } = await db.query(`SELECT * FROM venue_cigar_order_items WHERE order_id = $1`, [orderId])
  const safeOrder = { ...order }
  for (const field of CUSTOMER_INTERNAL_FIELDS) delete safeOrder[field]
  safeOrder.hasActivePickupCode = !!order.pickup_code_hash && (!order.pickup_code_expires_at || new Date(order.pickup_code_expires_at).getTime() > Date.now())
  return { ...safeOrder, items }
}
