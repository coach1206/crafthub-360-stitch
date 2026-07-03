/**
 * pos3OrderPersistenceService — dual-mode POS3 order persistence.
 *
 * Handles: order creation, item persistence, server-side total calculation,
 * status transitions, staff attachment.
 *
 * ALL totals are calculated server-side — frontend totals are never trusted.
 *
 * storageMode: 'postgres' | 'memory_fallback'
 */

import { isDbAvailable, query } from '../db/connection.js'
import { enqueueItems } from './stationQueuePersistenceService.js'
import * as auditService from './auditService.js'

const TAX_RATE = 0.085     // 8.5%
const SERVICE_FEE_RATE = 0 // configurable per venue; 0 for now

// ── In-memory fallback ────────────────────────────────────────
const memOrders = new Map()
const memOrderItems = new Map() // orderId → item[]

function makeOrderId() { return `ord_${Date.now()}_${Math.random().toString(36).slice(2,6)}` }
function makeItemId()  { return `oitm_${Date.now()}_${Math.random().toString(36).slice(2,6)}` }

// ── Total calculation (server-side, never trust client) ───────
export function calculateTotals(items) {
  let subtotalCents = 0
  for (const item of items) {
    if (item.status === 'voided' || item.status === 'comped') continue
    const unitPrice = typeof item.unit_price_cents === 'number' ? item.unit_price_cents : Math.round((item.unit_price || 0) * 100)
    const qty = Math.max(1, item.quantity || 1)
    let modDelta = 0
    if (Array.isArray(item.modifiers)) {
      for (const mod of item.modifiers) {
        modDelta += Math.round((mod.price_delta || mod.priceDelta || 0) * 100)
      }
    }
    subtotalCents += (unitPrice + modDelta) * qty
  }
  const taxCents = Math.round(subtotalCents * TAX_RATE)
  const serviceFeeCents = Math.round(subtotalCents * SERVICE_FEE_RATE)
  const totalCents = subtotalCents + taxCents + serviceFeeCents
  return { subtotalCents, taxCents, serviceFeeCents, discountCents: 0, totalCents }
}

// ── createOrder ───────────────────────────────────────────────
export async function createOrder({ venueId, guestSessionId, tableId, tableNumber, source, staffUserId, items, notes }) {
  if (!venueId) return { ok: false, error: 'venueId is required' }
  if (!items || items.length === 0) return { ok: false, error: 'Order must contain at least one item' }

  const totals = calculateTotals(items)

  if (isDbAvailable()) {
    try {
      // Create order
      const { rows: orderRows } = await query(
        `INSERT INTO pos3_orders
           (venue_id, guest_session_id, table_id, table_number, staff_user_id, source,
            status, subtotal_cents, tax_cents, service_fee_cents, discount_cents, total_cents, notes)
         VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
          venueId,
          guestSessionId || null,
          tableId || null,
          tableNumber || null,
          staffUserId || null,
          source || 'customer_self_order',
          totals.subtotalCents,
          totals.taxCents,
          totals.serviceFeeCents,
          totals.discountCents,
          totals.totalCents,
          notes || null,
        ]
      )
      const order = orderRows[0]

      // Insert order items
      const savedItems = []
      for (const item of items) {
        const unitPrice = typeof item.unit_price_cents === 'number'
          ? item.unit_price_cents
          : Math.round((item.unitPrice || item.price || 0) * 100)
        const { rows: itemRows } = await query(
          `INSERT INTO pos3_order_items
             (order_id, menu_item_id, sku, name, category, destination_station,
              quantity, unit_price_cents, modifiers, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           RETURNING *`,
          [
            order.order_id,
            item.menu_item_id || item.id || null,
            item.sku || null,
            item.name,
            item.category || 'general',
            item.destination_station || item.destination || 'staff',
            item.quantity || 1,
            unitPrice,
            JSON.stringify(item.modifiers || []),
            item.notes || null,
          ]
        )
        savedItems.push(itemRows[0])
      }

      await auditService.log({
        action: 'pos3_order_created',
        entityType: 'pos3_order',
        entityId: order.order_id,
        userId: staffUserId || guestSessionId || 'guest',
        details: { source, itemCount: items.length, totalCents: totals.totalCents },
      })

      return {
        ok: true,
        order: normalizeOrder(order),
        items: savedItems.map(normalizeItem),
        totals,
        storageMode: 'postgres',
      }
    } catch (err) {
      console.error('[pos3OrderPersistence] createOrder DB error:', err.message)
    }
  }

  // Memory fallback
  const orderId = makeOrderId()
  const orderRecord = {
    order_id: orderId,
    venue_id: venueId,
    guest_session_id: guestSessionId || null,
    table_id: tableId || null,
    table_number: tableNumber || null,
    staff_user_id: staffUserId || null,
    source: source || 'customer_self_order',
    status: 'draft',
    ...totals,
    notes: notes || null,
    created_at: new Date().toISOString(),
  }

  const itemRecords = items.map((item, idx) => ({
    order_item_id: makeItemId(),
    order_id: orderId,
    menu_item_id: item.menu_item_id || item.id || null,
    sku: item.sku || null,
    name: item.name,
    category: item.category || 'general',
    destination_station: item.destination_station || item.destination || 'staff',
    quantity: item.quantity || 1,
    unit_price_cents: typeof item.unit_price_cents === 'number' ? item.unit_price_cents : Math.round((item.price || 0) * 100),
    modifiers: item.modifiers || [],
    notes: item.notes || null,
    status: 'pending',
  }))

  memOrders.set(orderId, orderRecord)
  memOrderItems.set(orderId, itemRecords)

  return {
    ok: true,
    order: normalizeOrder(orderRecord),
    items: itemRecords.map(normalizeItem),
    totals,
    storageMode: 'memory_fallback',
    localPreview: true,
  }
}

// ── submitOrder ───────────────────────────────────────────────
export async function submitOrder(orderId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `UPDATE pos3_orders SET status = 'submitted', updated_at = NOW() WHERE order_id = $1 RETURNING *`,
        [orderId]
      )
      if (!rows[0]) return { ok: false, error: 'Order not found' }

      // Load items and route them to station queue
      const { rows: items } = await query(
        `SELECT * FROM pos3_order_items WHERE order_id = $1 AND status != 'voided'`,
        [orderId]
      )
      const routeResult = await enqueueItems(orderId, rows[0].venue_id, items.map(normalizeItem), rows[0].table_number)

      // Update order status to routed
      await query(`UPDATE pos3_orders SET status = 'routed', updated_at = NOW() WHERE order_id = $1`, [orderId])

      await auditService.log({
        action: 'pos3_order_submitted',
        entityType: 'pos3_order',
        entityId: orderId,
        details: { queueEntries: routeResult.entries?.length },
      })

      return { ok: true, order: normalizeOrder({...rows[0], status:'routed'}), routeResult, storageMode: 'postgres' }
    } catch (err) {
      console.error('[pos3OrderPersistence] submitOrder error:', err.message)
    }
  }

  // Memory fallback
  const order = memOrders.get(orderId)
  if (!order) return { ok: false, error: 'Order not found', localPreview: true }
  order.status = 'routed'
  const items = memOrderItems.get(orderId) || []
  const routeResult = await enqueueItems(orderId, order.venue_id, items.map(normalizeItem), order.table_number)

  return { ok: true, order: normalizeOrder(order), routeResult, storageMode: 'memory_fallback', localPreview: true }
}

// ── attachStaff ───────────────────────────────────────────────
export async function attachStaffToOrder(orderId, staffUserId, newSource = 'staff_assisted_order') {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `UPDATE pos3_orders SET staff_user_id=$1, source=$2, updated_at=NOW() WHERE order_id=$3 RETURNING *`,
        [staffUserId, newSource, orderId]
      )
      if (!rows[0]) return { ok: false, error: 'Order not found' }
      await auditService.log({
        action: 'pos3_staff_attached',
        entityType: 'pos3_order',
        entityId: orderId,
        userId: staffUserId,
        details: { source: newSource },
      })
      return { ok: true, order: normalizeOrder(rows[0]), storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }
  const order = memOrders.get(orderId)
  if (!order) return { ok: false, error: 'Order not found', localPreview: true }
  order.staff_user_id = staffUserId
  order.source = newSource
  return { ok: true, order: normalizeOrder(order), storageMode: 'memory_fallback', localPreview: true }
}

// ── getOrder ──────────────────────────────────────────────────
export async function getOrder(orderId) {
  if (isDbAvailable()) {
    try {
      const { rows: orderRows } = await query(`SELECT * FROM pos3_orders WHERE order_id=$1`, [orderId])
      if (!orderRows[0]) return { ok: false, error: 'Order not found' }
      const { rows: itemRows } = await query(`SELECT * FROM pos3_order_items WHERE order_id=$1`, [orderId])
      return { ok: true, order: normalizeOrder(orderRows[0]), items: itemRows.map(normalizeItem), storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }
  const order = memOrders.get(orderId)
  if (!order) return { ok: false, error: 'Order not found', localPreview: true }
  return { ok: true, order: normalizeOrder(order), items: (memOrderItems.get(orderId)||[]).map(normalizeItem), storageMode: 'memory_fallback', localPreview: true }
}

// ── updateOrderStatus ─────────────────────────────────────────
export async function updateOrderStatus(orderId, status) {
  const VALID = ['draft','pending_staff_confirmation','submitted','routed','in_progress','ready','completed','cancelled']
  if (!VALID.includes(status)) return { ok: false, error: `Invalid status: ${status}` }

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `UPDATE pos3_orders SET status=$1, updated_at=NOW() WHERE order_id=$2 RETURNING *`,
        [status, orderId]
      )
      if (!rows[0]) return { ok: false, error: 'Order not found' }
      return { ok: true, order: normalizeOrder(rows[0]), storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }
  const order = memOrders.get(orderId)
  if (!order) return { ok: false, error: 'Order not found', localPreview: true }
  order.status = status
  return { ok: true, order: normalizeOrder(order), storageMode: 'memory_fallback', localPreview: true }
}

// ── getActiveOrdersForVenue ───────────────────────────────────
export async function getActiveOrdersForVenue(venueId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT o.*, json_agg(i.*) as items
         FROM pos3_orders o
         LEFT JOIN pos3_order_items i ON i.order_id = o.order_id
         WHERE o.venue_id=$1 AND o.status NOT IN ('completed','cancelled')
         GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT 50`,
        [venueId]
      )
      return { ok: true, orders: rows.map(r => ({ ...normalizeOrder(r), items: r.items ? r.items.filter(Boolean).map(normalizeItem) : [] })), storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }
  const orders = [...memOrders.values()].filter(o => o.venue_id === venueId && !['completed','cancelled'].includes(o.status))
  return { ok: true, orders: orders.map(o => ({ ...normalizeOrder(o), items: (memOrderItems.get(o.order_id)||[]).map(normalizeItem) })), storageMode: 'memory_fallback', localPreview: true }
}

// ── Normalizers ───────────────────────────────────────────────
function normalizeOrder(row) {
  return {
    order_id:          row.order_id,
    venue_id:          row.venue_id,
    guest_session_id:  row.guest_session_id,
    table_id:          row.table_id,
    table_number:      row.table_number,
    staff_user_id:     row.staff_user_id,
    source:            row.source,
    status:            row.status,
    subtotal_cents:    row.subtotal_cents || row.subtotalCents || 0,
    tax_cents:         row.tax_cents || row.taxCents || 0,
    service_fee_cents: row.service_fee_cents || row.serviceFeeCents || 0,
    discount_cents:    row.discount_cents || row.discountCents || 0,
    total_cents:       row.total_cents || row.totalCents || 0,
    payment_status:    row.payment_status || 'unpaid',
    notes:             row.notes,
    created_at:        row.created_at,
  }
}

function normalizeItem(row) {
  return {
    order_item_id:      row.order_item_id,
    order_id:           row.order_id,
    menu_item_id:       row.menu_item_id,
    sku:                row.sku,
    name:               row.name,
    category:           row.category,
    destination_station:row.destination_station,
    quantity:           row.quantity || 1,
    unit_price_cents:   row.unit_price_cents || 0,
    modifiers:          row.modifiers || [],
    notes:              row.notes,
    status:             row.status || 'pending',
  }
}
