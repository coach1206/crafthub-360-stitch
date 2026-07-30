/**
 * Venue Humidor 1B-2B-4 — customer order history, order detail, and
 * receipts. Reads only the existing canonical
 * venue_cigar_orders/venue_cigar_order_items/venues/venue_cigar_products
 * records — never a duplicate order-history table, never a second
 * completion timestamp, never recomputed historical totals.
 */
import { getDb } from '../../db/connection.js'
import { getProductAvailability } from './inventoryService.js'

export class OrderHistoryError extends Error {
  constructor(code) { super(code); this.code = code }
}

// Customer-safe order columns — mirrors checkoutService.getOrder()'s
// redaction list so history/detail/receipt never leak staff-internal
// fields (pickup-code hash/attempts, staff identity/notes, block
// reason) to the customer, regardless of read path.
const CUSTOMER_INTERNAL_FIELDS = [
  'pickup_code_hash', 'pickup_code_attempts', 'handoff_notes',
  'assigned_staff_id', 'assigned_staff_role', 'handoff_staff_id', 'handoff_staff_role',
  'blocked_reason', 'idempotency_key',
]

function redact(order) {
  const safe = { ...order }
  for (const field of CUSTOMER_INTERNAL_FIELDS) delete safe[field]
  return safe
}

export async function listOrders(customerReference, filters = {}) {
  const db = getDb()
  const conditions = ['o.customer_reference = $1']
  const params = [customerReference]
  if (filters.status === 'active') {
    conditions.push(`o.fulfillment_status IN ('new','awaiting_confirmation','confirmed','in_preparation','ready','blocked')`)
  } else if (filters.status && ['ready', 'completed', 'cancelled', 'expired', 'blocked'].includes(filters.status)) {
    params.push(filters.status)
    conditions.push(`o.fulfillment_status = $${params.length}`)
  }
  if (filters.venueId) { params.push(filters.venueId); conditions.push(`o.venue_id = $${params.length}`) }
  if (filters.fulfillmentMethod) { params.push(filters.fulfillmentMethod); conditions.push(`o.fulfillment_method = $${params.length}`) }
  if (filters.from) { params.push(filters.from); conditions.push(`o.created_at >= $${params.length}`) }
  if (filters.to) { params.push(filters.to); conditions.push(`o.created_at <= $${params.length}`) }
  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(o.order_number ILIKE $${params.length} OR v.name ILIKE $${params.length} OR o.product_snapshot->>'name' ILIKE $${params.length} OR o.product_snapshot->>'brand' ILIKE $${params.length})`)
  }
  const { rows } = await db.query(
    `SELECT o.*, v.name AS venue_name, v.city AS venue_city, v.state AS venue_state,
       (SELECT COALESCE(SUM(quantity), 0) FROM venue_cigar_order_items WHERE order_id = o.order_id) AS total_quantity,
       (SELECT COUNT(*) FROM venue_cigar_order_items WHERE order_id = o.order_id) AS item_count,
       EXISTS(SELECT 1 FROM venue_cigar_passport_acquisitions WHERE order_id = o.order_id) AS has_passport_acquisition
     FROM venue_cigar_orders o
     JOIN venues v ON v.venue_id = o.venue_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY o.created_at DESC
     LIMIT 300`,
    params
  )
  return rows.map(redact)
}

export async function getOrderDetail(customerReference, orderId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT o.*, v.name AS venue_name, v.city AS venue_city, v.state AS venue_state, v.address AS venue_address
     FROM venue_cigar_orders o JOIN venues v ON v.venue_id = o.venue_id
     WHERE o.order_id = $1`,
    [orderId]
  )
  const order = rows[0]
  if (!order) return null
  if (order.customer_reference !== customerReference) throw new OrderHistoryError('order_not_owned')

  const { rows: items } = await db.query(
    `SELECT oi.*, p.name AS product_name, p.brand, p.country, p.vitola, p.strength, p.primary_image_url,
       p.is_archived, p.is_customer_visible, p.status AS product_status, p.venue_id AS product_venue_id
     FROM venue_cigar_order_items oi
     JOIN venue_cigar_products p ON p.product_id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  )
  const itemsWithEligibility = []
  for (const item of items) {
    let reorderEligible = false
    let availableQuantity = 0
    if (!item.is_archived && item.is_customer_visible && item.product_status !== 'discontinued') {
      const availability = await getProductAvailability(item.product_id).catch(() => null)
      availableQuantity = availability?.availableQuantity || 0
      reorderEligible = availableQuantity > 0 && item.product_status !== 'sold_out'
    }
    const { rows: acqRows } = await db.query(
      `SELECT acquisition_id FROM venue_cigar_passport_acquisitions WHERE order_item_id = $1`,
      [item.order_item_id]
    )
    itemsWithEligibility.push({
      ...item,
      passportAcquisitionId: acqRows[0]?.acquisition_id || null,
      reorderEligible,
      availableQuantity,
    })
  }

  return { ...redact(order), items: itemsWithEligibility }
}

// Receipt is derived ONLY from the authoritative completed/cancelled/
// refunded order row — never recomputed from current product prices.
export async function getReceipt(customerReference, orderId) {
  const order = await getOrderDetail(customerReference, orderId)
  if (!order) return null
  if (!['completed', 'cancelled', 'refunded'].includes(order.status)) {
    throw new OrderHistoryError('receipt_not_available')
  }
  return {
    orderNumber: order.order_number,
    venueName: order.venue_name,
    venueAddress: order.venue_address,
    venueCity: order.venue_city,
    venueState: order.venue_state,
    orderDate: order.created_at,
    completedDate: order.completed_at,
    cancelledDate: order.cancelled_at,
    status: order.status,
    fulfillmentMethod: order.fulfillment_method,
    items: order.items.map(i => ({
      name: i.product_name, brand: i.brand, quantity: i.quantity,
      unitPriceCents: i.unit_price_cents, lineTotalCents: i.line_total_cents,
    })),
    subtotalCents: order.subtotal_cents,
    taxCents: order.tax_cents,
    serviceChargeCents: order.service_charge_cents,
    discountCents: order.discount_cents,
    tipCents: order.tip_cents,
    totalCents: order.total_cents,
    currency: order.currency,
    paymentStatus: order.payment_status,
    isCompletedSale: order.status === 'completed',
    cancellationReason: order.cancellation_reason,
  }
}
