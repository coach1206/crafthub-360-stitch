/**
 * Venue Humidor 1A — minimal, transactional order/sale-completion
 * foundation. No checkout UI exists yet (1B) — this is the server-
 * authoritative backend only, exercised directly via API/tests.
 */
import { getDb } from '../../db/connection.js'
import { applyInventoryEvent } from './inventoryService.js'

export class OrderError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'

export async function createOrder(venueId, customerReference, { idempotencyKey } = {}) {
  const db = getDb()
  if (idempotencyKey) {
    const { rows: existing } = await db.query(`SELECT * FROM venue_cigar_orders WHERE idempotency_key = $1`, [idempotencyKey])
    if (existing[0]) return { order: existing[0], deduplicated: true }
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO venue_cigar_orders (venue_id, customer_reference, idempotency_key) VALUES ($1,$2,$3) RETURNING *`,
      [venueId, customerReference, idempotencyKey || null]
    )
    return { order: rows[0], deduplicated: false }
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      const { rows } = await db.query(`SELECT * FROM venue_cigar_orders WHERE idempotency_key = $1`, [idempotencyKey])
      return { order: rows[0], deduplicated: true }
    }
    throw err
  }
}

export async function addOrderItem(orderId, productId, quantity, unitPriceCents) {
  const db = getDb()
  const { rows: orderRows } = await db.query(`SELECT * FROM venue_cigar_orders WHERE order_id = $1`, [orderId])
  const order = orderRows[0]
  if (!order) throw new OrderError('order_not_found')
  if (order.status !== 'draft') throw new OrderError('order_not_editable')
  const lineTotal = quantity * unitPriceCents
  const { rows } = await db.query(
    `INSERT INTO venue_cigar_order_items (order_id, product_id, quantity, unit_price_cents, line_total_cents)
     VALUES ($1,$2,$3,$4,$5) ON CONFLICT (order_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity, line_total_cents = EXCLUDED.line_total_cents
     RETURNING *`,
    [orderId, productId, quantity, unitPriceCents, lineTotal]
  )
  const { rows: totalRows } = await db.query(
    `SELECT COALESCE(SUM(line_total_cents), 0) AS total FROM venue_cigar_order_items WHERE order_id = $1`, [orderId]
  )
  await db.query(`UPDATE venue_cigar_orders SET subtotal_cents = $2, total_cents = $2, updated_at = now() WHERE order_id = $1`, [orderId, Number(totalRows[0].total)])
  return rows[0]
}

/**
 * Completes a sale: for every real order item, decrements the
 * product's physical inventory transactionally (one inventory event
 * per item) and marks the order completed. Idempotent — a repeated
 * completion request for an already-completed order returns the
 * original order, never double-decrements.
 */
export async function completeOrder(orderId, actorId, { idempotencyKey } = {}) {
  if (!idempotencyKey) throw new OrderError('idempotency_key_required')
  const db = getDb()
  const { rows: orderRows } = await db.query(`SELECT * FROM venue_cigar_orders WHERE order_id = $1`, [orderId])
  const order = orderRows[0]
  if (!order) throw new OrderError('order_not_found')
  if (order.status === 'completed') return { order, deduplicated: true }
  if (order.status !== 'draft' && order.status !== 'pending_payment') throw new OrderError('order_not_completable')

  const { rows: items } = await db.query(`SELECT * FROM venue_cigar_order_items WHERE order_id = $1`, [orderId])
  if (items.length === 0) throw new OrderError('order_has_no_items')

  for (const item of items) {
    await applyInventoryEvent(item.product_id, 'sale_completed', -item.quantity, actorId, 'staff', {
      idempotencyKey: `${idempotencyKey}-item-${item.order_item_id}`,
      referenceType: 'order', referenceId: orderId,
      metadata: { orderItemId: item.order_item_id, quantity: item.quantity },
    })
  }

  const { rows: updatedRows } = await db.query(
    `UPDATE venue_cigar_orders SET status = 'completed', completed_at = now(), updated_at = now() WHERE order_id = $1 RETURNING *`,
    [orderId]
  )
  return { order: updatedRows[0], deduplicated: false }
}

/**
 * Cancels an order. If it was already completed, restores inventory
 * for every item (one cancellation_restored event per item); if it
 * was still draft/pending, no physical stock was ever decremented so
 * only the order status changes.
 */
export async function cancelOrder(orderId, actorId, { idempotencyKey } = {}) {
  if (!idempotencyKey) throw new OrderError('idempotency_key_required')
  const db = getDb()
  const { rows: orderRows } = await db.query(`SELECT * FROM venue_cigar_orders WHERE order_id = $1`, [orderId])
  const order = orderRows[0]
  if (!order) throw new OrderError('order_not_found')
  if (order.status === 'cancelled') return { order, deduplicated: true }
  if (order.status === 'refunded') throw new OrderError('order_already_refunded')

  const wasCompleted = order.status === 'completed'
  if (wasCompleted) {
    const { rows: items } = await db.query(`SELECT * FROM venue_cigar_order_items WHERE order_id = $1`, [orderId])
    for (const item of items) {
      await applyInventoryEvent(item.product_id, 'cancellation_restored', item.quantity, actorId, 'staff', {
        idempotencyKey: `${idempotencyKey}-item-${item.order_item_id}`,
        referenceType: 'order', referenceId: orderId,
        metadata: { orderItemId: item.order_item_id, quantity: item.quantity },
      })
    }
  }

  const { rows: updatedRows } = await db.query(
    `UPDATE venue_cigar_orders SET status = $2, cancelled_at = now(), updated_at = now() WHERE order_id = $1 RETURNING *`,
    [orderId, wasCompleted ? 'refunded' : 'cancelled']
  )
  return { order: updatedRows[0], deduplicated: false, restored: wasCompleted }
}
