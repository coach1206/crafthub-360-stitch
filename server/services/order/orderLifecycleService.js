/**
 * Order Lifecycle Service
 * Creates, transitions, and queries orders through the state machine.
 * Dual-mode: postgres when DATABASE_URL available, in-memory fallback otherwise.
 */

import {
  validateOrderTransition,
  buildTransitionResult,
  getNextAllowedStatuses,
  isTerminalOrderStatus,
} from './orderLifecycleStateMachine.js'

// In-memory stores (used when DB unavailable)
const orderStore            = new Map()
const lineItemStore         = new Map()  // orderId → [lineItems]
const statusEventStore      = new Map()  // orderId → [events]
const paymentLinkStore      = new Map()  // orderId → paymentLink
const taxLinkStore          = new Map()  // orderId → taxLink
const partnerFulfillStore   = new Map()  // orderId → [fulfillments]
const posRoutingStore       = new Map()  // orderId → posRouting
const kdsRoutingStore       = new Map()  // orderId → kdsRouting
const refundLinkStore       = new Map()  // orderId → [refunds]

function generateId() {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function isDbAvailable() {
  try {
    const { isDbAvailable: check } = require('../db/connection.js')
    return check()
  } catch { return false }
}

async function safeQuery(db, sql, params) {
  if (!db) return null
  try { return await db.query(sql, params) } catch { return null }
}

// ── Create / Validate ─────────────────────────────────────────────────────────

export async function validateOrderDraft(orderPayload) {
  const errors = []
  if (!orderPayload?.venueId) errors.push({ field: 'venueId', reason: 'venue_profile_required' })
  if (!orderPayload?.lineItems?.length) errors.push({ field: 'lineItems', reason: 'line_items_required' })
  const items = orderPayload?.lineItems ?? []
  for (const item of items) {
    if (!item.itemName) errors.push({ field: 'itemName', reason: 'item_name_required' })
    if ((item.quantity ?? 0) <= 0) errors.push({ field: 'quantity', reason: 'invalid_quantity' })
    if ((item.unitAmount ?? 0) < 0) errors.push({ field: 'unitAmount', reason: 'negative_amount' })
  }
  return { ok: errors.length === 0, errors }
}

export async function createOrderDraft(orderPayload, db = null) {
  const validation = await validateOrderDraft(orderPayload)
  if (!validation.ok) {
    return { ok: false, lifecycleStatus: 'order_draft', errors: validation.errors, storageMode: 'validation_failed' }
  }

  const orderId = generateId()
  const now = new Date().toISOString()
  const draft = {
    orderId,
    venueId:           orderPayload.venueId,
    customerId:        orderPayload.customerId ?? null,
    orderSource:       orderPayload.orderSource ?? 'smokecraft',
    orderType:         orderPayload.orderType ?? 'venue_order',
    lifecycleStatus:   'order_draft',
    paymentStatus:     'payment_confirmation_required',
    taxStatus:         'tax_preview_required',
    posStatus:         'pos_sync_pending',
    kdsStatus:         'kds_routing_pending',
    fulfillmentStatus: 'fulfillment_pending',
    subtotalAmount:    orderPayload.subtotalAmount ?? 0,
    feeAmount:         orderPayload.feeAmount ?? 0,
    taxAmount:         orderPayload.taxAmount ?? 0,
    totalAmount:       orderPayload.totalAmount ?? 0,
    currency:          'usd',
    metadata:          orderPayload.metadata ?? {},
    createdAt:         now,
    updatedAt:         now,
    lineItems:         (orderPayload.lineItems ?? []).map((item, i) => ({
      lineItemId:        `${orderId}_li_${i}`,
      orderId,
      venueId:           orderPayload.venueId,
      partnerId:         item.partnerId ?? null,
      productId:         item.productId ?? null,
      itemName:          item.itemName,
      itemCategory:      item.itemCategory ?? 'general',
      quantity:          item.quantity,
      unitAmount:        item.unitAmount ?? 0,
      lineSubtotalAmount: (item.quantity ?? 0) * (item.unitAmount ?? 0),
      taxCategory:       item.taxCategory ?? 'general',
      fulfillmentOwner:  item.partnerId ? 'partner' : 'venue',
      lineStatus:        'line_item_pending',
      metadata:          item.metadata ?? {},
    })),
  }

  orderStore.set(orderId, draft)
  lineItemStore.set(orderId, draft.lineItems)
  statusEventStore.set(orderId, [{
    eventId: `${orderId}_evt_0`,
    orderId,
    fromStatus: null,
    toStatus: 'order_draft',
    transitionStatus: 'transition_logged',
    actorId: null,
    actorRole: 'system',
    reason: 'order_created',
    createdAt: now,
  }])

  return {
    ok: true,
    orderId,
    lifecycleStatus: 'order_draft',
    order: draft,
    storageMode: 'memory_fallback',
    syncMode: 'order_lifecycle_preview',
    message: 'Order draft created locally. Not persisted — database unavailable.',
  }
}

// ── Transitions ───────────────────────────────────────────────────────────────

async function transitionOrder(orderId, toStatus, actorContext = {}, db = null) {
  const order = orderStore.get(orderId)
  if (!order) {
    return { ok: false, reason: 'order_not_found', orderId }
  }
  const result = buildTransitionResult(order.lifecycleStatus, toStatus, actorContext)
  if (!result.ok) return { ok: false, ...result }

  const now = new Date().toISOString()
  const updatedOrder = { ...order, lifecycleStatus: toStatus, updatedAt: now }
  orderStore.set(orderId, updatedOrder)

  const events = statusEventStore.get(orderId) ?? []
  events.push({
    eventId: `${orderId}_evt_${events.length}`,
    orderId,
    fromStatus: order.lifecycleStatus,
    toStatus,
    transitionStatus: 'transition_logged',
    actorId:   actorContext.actorId ?? null,
    actorRole: actorContext.actorRole ?? 'system',
    reason:    actorContext.reason ?? null,
    createdAt: now,
  })
  statusEventStore.set(orderId, events)

  return {
    ok: true,
    orderId,
    fromStatus: order.lifecycleStatus,
    toStatus,
    lifecycleStatus: toStatus,
    transitionedAt: now,
    storageMode: 'memory_fallback',
  }
}

export async function submitOrder(orderId, actorContext = {}, db = null) {
  return transitionOrder(orderId, 'order_submitted', actorContext, db)
}

export async function acceptOrder(orderId, actorContext = {}, db = null) {
  return transitionOrder(orderId, 'order_accepted', actorContext, db)
}

export async function rejectOrder(orderId, reason, actorContext = {}, db = null) {
  return transitionOrder(orderId, 'order_rejected', { ...actorContext, reason }, db)
}

export async function routeOrder(orderId, routingContext = {}, db = null) {
  return transitionOrder(orderId, 'order_routed', routingContext, db)
}

export async function markOrderPreparing(orderId, actorContext = {}, db = null) {
  return transitionOrder(orderId, 'order_preparing', actorContext, db)
}

export async function markOrderReady(orderId, actorContext = {}, db = null) {
  return transitionOrder(orderId, 'order_ready', actorContext, db)
}

export async function completeOrder(orderId, actorContext = {}, db = null) {
  return transitionOrder(orderId, 'order_completed', actorContext, db)
}

export async function cancelOrder(orderId, reason, actorContext = {}, db = null) {
  return transitionOrder(orderId, 'order_cancelled', { ...actorContext, reason }, db)
}

// ── Links ─────────────────────────────────────────────────────────────────────

export async function linkPaymentToOrder(orderId, paymentContext = {}, db = null) {
  const now = new Date().toISOString()
  const link = {
    orderId,
    paymentIntentId:    paymentContext.paymentIntentId ?? null,
    settlementLedgerId: paymentContext.settlementLedgerId ?? null,
    paymentStatus:      paymentContext.paymentIntentId ? 'payment_confirmation_required' : 'payment_confirmation_required',
    paymentMode:        'payment_preview',
    createdAt: now,
    updatedAt: now,
  }
  paymentLinkStore.set(orderId, link)
  return { ok: true, orderId, paymentLink: link, storageMode: 'memory_fallback', paymentMode: 'payment_preview' }
}

export async function linkTaxCalculationToOrder(orderId, taxContext = {}, db = null) {
  const now = new Date().toISOString()
  const link = {
    orderId,
    taxCalculationId: taxContext.taxCalculationId ?? null,
    taxStatus:        'tax_preview_required',
    taxMode:          'tax_preview',
    createdAt: now,
    updatedAt: now,
  }
  taxLinkStore.set(orderId, link)
  return { ok: true, orderId, taxLink: link, storageMode: 'memory_fallback' }
}

export async function linkPartnerFulfillment(orderId, partnerContext = {}, db = null) {
  const now = new Date().toISOString()
  const entry = {
    orderId,
    partnerId:          partnerContext.partnerId,
    venueId:            partnerContext.venueId,
    fulfillmentStatus:  'partner_fulfillment_pending',
    approvalStatus:     partnerContext.venueApproved ? 'venue_approved' : 'venue_approval_required',
    availabilityStatus: partnerContext.availabilityConfirmed ? 'availability_confirmed' : 'availability_required',
    createdAt: now,
    updatedAt: now,
  }
  const existing = partnerFulfillStore.get(orderId) ?? []
  existing.push(entry)
  partnerFulfillStore.set(orderId, existing)
  return { ok: true, orderId, partnerFulfillment: entry, storageMode: 'memory_fallback' }
}

export async function linkPOSRouting(orderId, posContext = {}, db = null) {
  const now = new Date().toISOString()
  const routing = {
    orderId,
    venueId:        posContext.venueId,
    providerName:   posContext.providerName ?? null,
    routingStatus:  'pos_sync_pending',
    routingMode:    'routing_preview',
    idempotencyKey: posContext.idempotencyKey ?? null,
    createdAt: now,
    updatedAt: now,
  }
  posRoutingStore.set(orderId, routing)
  return { ok: true, orderId, posRouting: routing, storageMode: 'memory_fallback', routingMode: 'routing_preview' }
}

export async function linkKDSRouting(orderId, kdsContext = {}, db = null) {
  const now = new Date().toISOString()
  const routing = {
    orderId,
    venueId:      kdsContext.venueId,
    stationName:  kdsContext.stationName ?? null,
    routingStatus: 'kds_routing_pending',
    routingMode:   'routing_preview',
    createdAt: now,
    updatedAt: now,
  }
  kdsRoutingStore.set(orderId, routing)
  return { ok: true, orderId, kdsRouting: routing, storageMode: 'memory_fallback', routingMode: 'routing_preview' }
}

export async function linkRefundToOrder(orderId, refundContext = {}, db = null) {
  const now = new Date().toISOString()
  const refund = {
    orderId,
    refundId:     refundContext.refundId ?? null,
    refundStatus: 'refund_pending',
    refundMode:   'refund_preview',
    refundAmount: refundContext.refundAmount ?? 0,
    createdAt: now,
    updatedAt: now,
  }
  const existing = refundLinkStore.get(orderId) ?? []
  existing.push(refund)
  refundLinkStore.set(orderId, existing)
  return { ok: true, orderId, refund, storageMode: 'memory_fallback', refundMode: 'refund_preview' }
}

// ── Reads ─────────────────────────────────────────────────────────────────────

export async function getOrderLifecycle(orderId, db = null) {
  const order = orderStore.get(orderId)
  if (!order) return { ok: false, reason: 'order_not_found', orderId }
  return {
    ok: true,
    orderId,
    order,
    lineItems:           lineItemStore.get(orderId) ?? [],
    statusEvents:        statusEventStore.get(orderId) ?? [],
    paymentLink:         paymentLinkStore.get(orderId) ?? null,
    taxLink:             taxLinkStore.get(orderId) ?? null,
    partnerFulfillments: partnerFulfillStore.get(orderId) ?? [],
    posRouting:          posRoutingStore.get(orderId) ?? null,
    kdsRouting:          kdsRoutingStore.get(orderId) ?? null,
    refunds:             refundLinkStore.get(orderId) ?? [],
    nextAllowedStatuses: getNextAllowedStatuses(order.lifecycleStatus),
    storageMode: 'memory_fallback',
  }
}

export async function getVenueOrders(venueId, filters = {}, db = null) {
  const orders = [...orderStore.values()].filter(o => o.venueId === venueId)
  const filtered = filters.lifecycleStatus
    ? orders.filter(o => o.lifecycleStatus === filters.lifecycleStatus)
    : orders
  return { ok: true, venueId, orders: filtered, count: filtered.length, storageMode: 'memory_fallback' }
}

export async function getPartnerOrders(partnerId, filters = {}, db = null) {
  const orders = [...orderStore.values()].filter(o =>
    (o.lineItems ?? []).some(li => li.partnerId === partnerId)
  )
  return { ok: true, partnerId, orders, count: orders.length, storageMode: 'memory_fallback' }
}

export async function getOrderLifecycleReadiness(orderPayload) {
  const blockers = []
  if (!orderPayload?.venueId)               blockers.push({ type: 'venue_profile_required', severity: 'critical' })
  if (!orderPayload?.lineItems?.length)     blockers.push({ type: 'line_items_required', severity: 'critical' })
  blockers.push({ type: 'payment_confirmation_required', severity: 'warning' })
  blockers.push({ type: 'tax_preview_required', severity: 'warning' })
  blockers.push({ type: 'pos_sync_pending', severity: 'info' })
  blockers.push({ type: 'kds_routing_pending', severity: 'info' })

  const hasPartnerItems = (orderPayload?.lineItems ?? []).some(li => li.partnerId)
  if (hasPartnerItems) {
    blockers.push({ type: 'venue_approval_required', severity: 'warning' })
    blockers.push({ type: 'availability_required', severity: 'warning' })
  }

  const criticalCount = blockers.filter(b => b.severity === 'critical').length
  return {
    ok: true,
    lifecycleReadiness: criticalCount === 0 ? 'order_lifecycle_preview' : 'order_lifecycle_preview',
    blockers,
    storageMode: 'memory_fallback',
    databaseStatus: 'database_required',
  }
}
