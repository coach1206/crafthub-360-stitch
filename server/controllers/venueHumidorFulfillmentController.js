/**
 * Venue Humidor 1B-2B-2 — staff order and fulfillment queue.
 */
import * as fulfillmentService from '../services/venueHumidor/fulfillmentService.js'
import { CheckoutError } from '../services/venueHumidor/checkoutService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    order_not_found: 404, order_item_not_found: 404,
    already_claimed: 409, claim_conflict: 409, stale_version: 409,
    items_not_picked: 409, order_not_blocked: 409, order_already_refunded: 409,
    order_not_completable: 409, insufficient_inventory: 409,
    idempotency_key_required: 400, note_required: 400,
    block_reason_required: 400, cancellation_reason_required: 400,
    age_verification_required: 400,
    no_active_verification_code: 409, verification_code_expired: 409,
    verification_rate_limited: 429, verification_failed: 401, verification_failed_order_blocked: 401,
    verification_required: 409, handoff_required: 409,
    idempotency_replay_no_code_returned: 409, new_promised_at_required: 400,
  }
  const code = err.code || 'internal_error'
  let status = statusByCode[code] || fallback
  if (code.startsWith('invalid_transition')) status = 409
  res.status(status).json({ success: false, error: code })
}

export async function handleListQueue(req, res) {
  try {
    const orders = await fulfillmentService.listQueue(req.params.venueId, req.query)
    res.json({ success: true, orders })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetOrderDetail(req, res) {
  try {
    const order = await fulfillmentService.getOrderDetail(req.params.venueId, req.params.orderId)
    res.json({ success: true, order })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleClaimOrder(req, res) {
  try {
    const result = await fulfillmentService.claimOrder(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAssignOrder(req, res) {
  try {
    const { targetStaffId, expectedVersion, idempotencyKey } = req.body || {}
    const result = await fulfillmentService.assignOrder(req.params.venueId, req.params.orderId, req.user.id, req.user.role, targetStaffId, expectedVersion, idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleConfirmOrder(req, res) {
  try {
    const result = await fulfillmentService.confirmOrder(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleStartPreparation(req, res) {
  try {
    const result = await fulfillmentService.startPreparation(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleMarkItemPicked(req, res) {
  try {
    const result = await fulfillmentService.markItemPicked(req.params.venueId, req.params.orderId, req.params.orderItemId, req.user.id, req.user.role, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleMarkReady(req, res) {
  try {
    const result = await fulfillmentService.markReady(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleBlockOrder(req, res) {
  try {
    const result = await fulfillmentService.blockOrder(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.reason, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleUnblockOrder(req, res) {
  try {
    const result = await fulfillmentService.unblockOrder(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAddNote(req, res) {
  try {
    const result = await fulfillmentService.addFulfillmentNote(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.note, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

// Delegates ONLY to checkoutService.completeOrder()/cancelOrder() —
// see fulfillmentService.completeOrderFromQueue()/cancelOrderFromQueue().
export async function handleCompleteOrder(req, res) {
  try {
    const result = await fulfillmentService.completeOrderFromQueue(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) {
    if (err instanceof CheckoutError) return sendError(res, err, 500)
    sendError(res, err, 500)
  }
}

export async function handleCancelOrder(req, res) {
  try {
    const result = await fulfillmentService.cancelOrderFromQueue(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.reason, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) {
    if (err instanceof CheckoutError) return sendError(res, err, 500)
    sendError(res, err, 500)
  }
}

export async function handleListHistory(req, res) {
  try {
    const events = await fulfillmentService.listFulfillmentHistory(req.params.venueId, req.query)
    res.json({ success: true, events })
  } catch (err) { sendError(res, err, 500) }
}

// ── 1B-2B-3: pickup verification, handoff, no-show, expiration ───────
export async function handleGenerateVerificationCode(req, res) {
  try {
    const result = await fulfillmentService.generateVerificationCode(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleVerifyCode(req, res) {
  try {
    const result = await fulfillmentService.verifyPickupCode(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.code, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleConfirmHandoff(req, res) {
  try {
    const { verificationMethod, location, notes, idempotencyKey } = req.body || {}
    const result = await fulfillmentService.confirmHandoff(req.params.venueId, req.params.orderId, req.user.id, req.user.role, { verificationMethod, location, notes }, idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleMarkNoShow(req, res) {
  try {
    const { notes, nextAction, idempotencyKey } = req.body || {}
    const result = await fulfillmentService.markNoShow(req.params.venueId, req.params.orderId, req.user.id, req.user.role, { notes, nextAction }, idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleExtendPickupWindow(req, res) {
  try {
    const result = await fulfillmentService.extendPickupWindow(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.newPromisedAt, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleExpireOrder(req, res) {
  try {
    const result = await fulfillmentService.expireOrder(req.params.venueId, req.params.orderId, req.user.id, req.user.role, req.body?.reason, req.body?.idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) {
    if (err instanceof CheckoutError) return sendError(res, err, 500)
    sendError(res, err, 500)
  }
}
