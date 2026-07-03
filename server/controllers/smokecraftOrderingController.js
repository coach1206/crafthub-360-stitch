/**
 * SmokeCraft Ordering Controller
 * Module Build 3 — SmokeCraft Ordering, Venue Menu, POS360, and Staff Handoff
 */

import { createOrder, getOrder, updateOrder, buildOrderStoreReport } from '../services/smokecraft/smokecraftOrderStore.js'
import { getVenueMenu, buildVenueMenuStoreReport } from '../services/smokecraft/smokecraftVenueMenuStore.js'
import {
  getStaffQueue, getAllOrders, acceptOrder, updateOrderStatus,
  attemptSendToPOS, getManagementSummary,
} from '../services/smokecraft/smokecraftStaffQueueService.js'
import { getAuditTrailForOrder, buildAuditServiceReport, createAuditEntry, AUDIT_EVENTS } from '../services/smokecraft/smokecraftOrderAuditService.js'
import { buildPosBridgeReport } from '../services/smokecraft/smokecraftPosBridgeService.js'
import { buildEatSyncBridgeReport, syncSmokeCraftOrderToEAT, EAT_SYNC_EVENTS } from '../services/smokecraft/smokecraftEatSyncBridgeService.js'

const ts = () => new Date().toISOString()
function ok(res, data) { res.json({ ...data, timestamp: ts() }) }
function fail(res, status, data) { res.status(status).json({ ...data, timestamp: ts() }) }
function err(res, e) { res.status(500).json({ status: 'error', message: e.message, timestamp: ts() }) }

// GET /api/modules/smokecraft/orders/status
export function getOrderingStatus(req, res) {
  try {
    ok(res, {
      module: 'smokecraft-experience',
      build: 'module_build_3',
      orderStore: buildOrderStoreReport(),
      venueMenu: buildVenueMenuStoreReport(),
      posBridge: buildPosBridgeReport(),
      eatBridge: buildEatSyncBridgeReport(),
      audit: buildAuditServiceReport(),
      preview_only: true,
    })
  } catch (e) { err(res, e) }
}

// GET /api/modules/smokecraft/orders/menu/:venueId
export function getVenueMenuHandler(req, res) {
  try {
    const menu = getVenueMenu(req.params.venueId)
    ok(res, { menu })
  } catch (e) { err(res, e) }
}

// POST /api/modules/smokecraft/orders/create
export async function createOrderHandler(req, res) {
  try {
    const {
      venueId, userId, sessionId, visitId, tableId, serverId,
      orderMode, items, pairingRecommendations, customerNotes,
    } = req.body

    if (!orderMode || !['customer_self_order', 'staff_assisted_order'].includes(orderMode)) {
      return fail(res, 400, { error: 'invalid_order_mode', message: 'orderMode must be customer_self_order or staff_assisted_order' })
    }
    if (!venueId) return fail(res, 400, { error: 'missing_venueId' })

    const order = await createOrder({
      venueId, userId, sessionId, visitId, tableId, serverId,
      orderMode,
      orderStatus: orderMode === 'staff_assisted_order' ? 'sent_to_staff' : 'requested',
      items: items ?? [],
      pairingRecommendations: pairingRecommendations ?? [],
      customerNotes: customerNotes ?? '',
    })

    createAuditEntry({
      orderId: order.orderId, eventType: AUDIT_EVENTS.ORDER_CREATED,
      actorRole: 'customer', actorId: userId,
      nextStatus: order.orderStatus,
      message: `Order created via ${orderMode}`,
    })

    await syncSmokeCraftOrderToEAT(order, EAT_SYNC_EVENTS.ORDER_CREATED)

    ok(res, { order, preview_only: true })
  } catch (e) { err(res, e) }
}

// POST /api/modules/smokecraft/orders/request-staff
export async function requestStaffHandler(req, res) {
  try {
    const { orderId, userId, customerNotes } = req.body
    if (!orderId) return fail(res, 400, { error: 'missing_orderId' })

    const order = await getOrder(orderId)
    if (!order) return fail(res, 404, { error: 'order_not_found', orderId })

    const updated = await updateOrder(orderId, {
      orderStatus: 'sent_to_staff',
      customerNotes: customerNotes ?? order.customerNotes,
    })

    createAuditEntry({
      orderId, eventType: AUDIT_EVENTS.STAFF_REQUESTED,
      actorRole: 'customer', actorId: userId,
      previousStatus: order.orderStatus, nextStatus: 'sent_to_staff',
      message: 'Customer requested staff assistance',
    })

    await syncSmokeCraftOrderToEAT(updated, EAT_SYNC_EVENTS.STAFF_REQUESTED)

    ok(res, { order: updated })
  } catch (e) { err(res, e) }
}

// GET /api/modules/smokecraft/orders/:orderId
export async function getOrderHandler(req, res) {
  try {
    const order = await getOrder(req.params.orderId)
    if (!order) return fail(res, 404, { error: 'order_not_found' })
    ok(res, { order })
  } catch (e) { err(res, e) }
}

// PATCH /api/modules/smokecraft/orders/:orderId/status
export async function updateOrderStatusHandler(req, res) {
  try {
    const { status, staffId, role, staffNotes } = req.body
    const result = await updateOrderStatus(req.params.orderId, status, staffId, role ?? 'staff', staffNotes)
    ok(res, { order: result })
  } catch (e) {
    if (e.message.startsWith('permission_denied')) return fail(res, 403, { error: e.message })
    err(res, e)
  }
}

// POST /api/modules/smokecraft/orders/:orderId/accept
export async function acceptOrderHandler(req, res) {
  try {
    const { staffId, role } = req.body
    const result = await acceptOrder(req.params.orderId, staffId, role ?? 'staff')
    ok(res, { order: result })
  } catch (e) {
    if (e.message.startsWith('permission_denied')) return fail(res, 403, { error: e.message })
    err(res, e)
  }
}

// POST /api/modules/smokecraft/orders/:orderId/send-to-pos
export async function sendToPOSHandler(req, res) {
  try {
    const { staffId, role } = req.body
    const result = await attemptSendToPOS(req.params.orderId, staffId, role ?? 'staff')
    ok(res, { result })
  } catch (e) {
    if (e.message.startsWith('permission_denied')) return fail(res, 403, { error: e.message })
    err(res, e)
  }
}

// GET /api/modules/smokecraft/orders/staff/queue
export function getStaffQueueHandler(req, res) {
  try {
    const role = req.query.role ?? 'staff'
    const queue = getStaffQueue(role)
    ok(res, { queue, pos360Connected: false, eatSyncStatus: 'not_connected' })
  } catch (e) {
    if (e.message.startsWith('permission_denied')) return fail(res, 403, { error: e.message })
    err(res, e)
  }
}

// GET /api/modules/smokecraft/orders/manager/summary
export function getManagerSummaryHandler(req, res) {
  try {
    const role = req.query.role ?? 'manager'
    const summary = getManagementSummary(role)
    ok(res, { summary })
  } catch (e) {
    if (e.message.startsWith('permission_denied')) return fail(res, 403, { error: e.message })
    err(res, e)
  }
}

// GET /api/modules/smokecraft/orders/:orderId/audit
export async function getOrderAuditHandler(req, res) {
  try {
    const trail = getAuditTrailForOrder(req.params.orderId)
    ok(res, { orderId: req.params.orderId, auditTrail: trail })
  } catch (e) { err(res, e) }
}
