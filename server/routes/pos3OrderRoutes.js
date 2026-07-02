/**
 * POS3 Order Routes
 *
 * POST   /api/pos3/orders               — create order (public/guest + staff)
 * GET    /api/pos3/orders/:id           — get order by id
 * PATCH  /api/pos3/orders/:id           — update order status
 * POST   /api/pos3/orders/:id/submit    — submit draft → route to queues
 * POST   /api/pos3/orders/:id/staff-attach — attach verified staff to order
 *
 * GET    /api/pos3/station-queue        — read queue (staff+)
 * PATCH  /api/pos3/station-queue/:id   — update queue item status (staff+)
 *
 * POST   /api/pos3/receipts             — persist receipt (staff+)
 * GET    /api/pos3/receipts/:orderId    — get receipt (staff+)
 *
 * POST   /api/pos3/adjustments          — request void/comp/refund/discount
 * POST   /api/pos3/adjustments/:id/approve — approve adjustment (manager+)
 */

import { Router } from 'express'
import { requireAuth }    from '../middleware/authMiddleware.js'
import { requireStaff, requireManager } from '../middleware/roleMiddleware.js'
import { ok, fail, serverError } from '../utils/response.js'
import * as orderSvc   from '../services/pos3OrderPersistenceService.js'
import * as queueSvc   from '../services/stationQueuePersistenceService.js'
import * as receiptSvc from '../services/pos3ReceiptPersistenceService.js'
import * as adjSvc     from '../services/pos3AdjustmentService.js'
import * as loyaltySvc from '../services/loyaltyLedgerService.js'

const router = Router()

// ── Orders ────────────────────────────────────────────────────

// POST /api/pos3/orders — customer self-order or staff-assisted
router.post('/orders', async (req, res) => {
  try {
    const { venueId = 'novee-grand-lounge', guestSessionId, tableId, tableNumber, source, staffUserId, items, notes } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return fail(res, 'items array is required and cannot be empty')
    }

    // Validate item fields minimally
    for (const item of items) {
      if (!item.name) return fail(res, `Item missing required field: name`)
    }

    const result = await orderSvc.createOrder({ venueId, guestSessionId, tableId, tableNumber, source, staffUserId, items, notes })
    if (!result.ok) return fail(res, result.error || 'Failed to create order')

    return ok(res, {
      order:       result.order,
      items:       result.items,
      totals:      result.totals,
      storageMode: result.storageMode,
      localPreview:result.localPreview || false,
    }, 201)
  } catch (err) {
    return serverError(res, err)
  }
})

// GET /api/pos3/orders/:id
router.get('/orders/:id', requireAuth, requireStaff, async (req, res) => {
  try {
    const result = await orderSvc.getOrder(req.params.id)
    if (!result.ok) return fail(res, result.error, 404)
    return ok(res, { order: result.order, items: result.items, storageMode: result.storageMode })
  } catch (err) {
    return serverError(res, err)
  }
})

// PATCH /api/pos3/orders/:id
router.patch('/orders/:id', requireAuth, requireStaff, async (req, res) => {
  try {
    const { status } = req.body
    if (!status) return fail(res, 'status is required')
    const result = await orderSvc.updateOrderStatus(req.params.id, status)
    if (!result.ok) return fail(res, result.error)
    return ok(res, { order: result.order, storageMode: result.storageMode })
  } catch (err) {
    return serverError(res, err)
  }
})

// POST /api/pos3/orders/:id/submit
router.post('/orders/:id/submit', async (req, res) => {
  try {
    const result = await orderSvc.submitOrder(req.params.id)
    if (!result.ok) return fail(res, result.error)
    return ok(res, { order: result.order, routeResult: result.routeResult, storageMode: result.storageMode })
  } catch (err) {
    return serverError(res, err)
  }
})

// POST /api/pos3/orders/:id/staff-attach
router.post('/orders/:id/staff-attach', async (req, res) => {
  try {
    const { staffUserId, source } = req.body
    if (!staffUserId) return fail(res, 'staffUserId is required')
    const result = await orderSvc.attachStaffToOrder(req.params.id, staffUserId, source)
    if (!result.ok) return fail(res, result.error)
    return ok(res, { order: result.order, storageMode: result.storageMode })
  } catch (err) {
    return serverError(res, err)
  }
})

// ── Station Queue ─────────────────────────────────────────────

// GET /api/pos3/station-queue?venueId=&station=
router.get('/station-queue', requireAuth, requireStaff, async (req, res) => {
  try {
    const { venueId = 'novee-grand-lounge', station } = req.query
    const result = await queueSvc.getStationQueue(venueId, station)
    return ok(res, { entries: result.entries, storageMode: result.storageMode, localPreview: result.localPreview || false })
  } catch (err) {
    return serverError(res, err)
  }
})

// PATCH /api/pos3/station-queue/:id
router.patch('/station-queue/:id', requireAuth, requireStaff, async (req, res) => {
  try {
    const { status } = req.body
    if (!status) return fail(res, 'status is required')
    const result = await queueSvc.updateQueueItemStatus(req.params.id, status)
    if (!result.ok) return fail(res, result.error)
    return ok(res, { entry: result.entry, storageMode: result.storageMode })
  } catch (err) {
    return serverError(res, err)
  }
})

// ── Receipts ──────────────────────────────────────────────────

// POST /api/pos3/receipts
router.post('/receipts', requireAuth, requireStaff, async (req, res) => {
  try {
    const { orderId, venueId = 'novee-grand-lounge', paymentMethod, subtotalCents, taxCents, serviceFeeCents, tipCents, totalCents, receiptPayload } = req.body
    if (!orderId) return fail(res, 'orderId is required')
    const result = await receiptSvc.createReceipt({ orderId, venueId, paymentMethod, subtotalCents, taxCents, serviceFeeCents, tipCents, totalCents, receiptPayload })
    if (!result.ok) return fail(res, result.error)
    return ok(res, { receipt: result.receipt, storageMode: result.storageMode }, 201)
  } catch (err) {
    return serverError(res, err)
  }
})

// GET /api/pos3/receipts/:orderId
router.get('/receipts/:orderId', requireAuth, requireStaff, async (req, res) => {
  try {
    const result = await receiptSvc.getReceiptByOrderId(req.params.orderId)
    if (!result.ok) return fail(res, result.error, 404)
    return ok(res, { receipt: result.receipt, storageMode: result.storageMode })
  } catch (err) {
    return serverError(res, err)
  }
})

// ── Adjustments ───────────────────────────────────────────────

// POST /api/pos3/adjustments
router.post('/adjustments', requireAuth, requireStaff, async (req, res) => {
  try {
    const { orderId, orderItemId, adjustmentType, amountCents, reason } = req.body
    if (!orderId || !adjustmentType) return fail(res, 'orderId and adjustmentType are required')
    const result = await adjSvc.createAdjustment({
      orderId, orderItemId, adjustmentType, amountCents, reason,
      requestedByUserId: req.user?.userId,
    })
    if (!result.ok) return fail(res, result.error)
    return ok(res, { adjustment: result.adjustment, storageMode: result.storageMode }, 201)
  } catch (err) {
    return serverError(res, err)
  }
})

// POST /api/pos3/adjustments/:id/approve — manager only
router.post('/adjustments/:id/approve', requireAuth, requireManager, async (req, res) => {
  try {
    const result = await adjSvc.approveAdjustment(req.params.id, req.user?.userId)
    if (!result.ok) return fail(res, result.error)
    return ok(res, { adjustment: result.adjustment, storageMode: result.storageMode })
  } catch (err) {
    return serverError(res, err)
  }
})

// ── Loyalty Ledger ────────────────────────────────────────────

// POST /api/pos3/loyalty/record
router.post('/loyalty/record', async (req, res) => {
  try {
    const { guestSessionId, orderId, eventType, pointsDelta, metadata } = req.body
    if (!guestSessionId || !eventType) return fail(res, 'guestSessionId and eventType are required')
    const result = await loyaltySvc.recordEvent({ guestSessionId, orderId, eventType, pointsDelta, metadata })
    return ok(res, { entry: result.entry, balanceAfter: result.balanceAfter, storageMode: result.storageMode })
  } catch (err) {
    return serverError(res, err)
  }
})

export default router
