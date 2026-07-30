import * as productService from '../services/venueHumidor/productService.js'
import * as inventoryService from '../services/venueHumidor/inventoryService.js'
import * as orderService from '../services/venueHumidor/orderService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    product_not_found: 404, order_not_found: 404, hold_not_found: 404, reservation_not_found: 404,
    duplicate_sku: 409, duplicate_barcode: 409, insufficient_inventory: 409,
    order_not_editable: 409, order_not_completable: 409, order_has_no_items: 409,
    order_already_refunded: 409, hold_not_yet_expired: 409,
    idempotency_key_required: 400, actor_id_required: 400, invalid_quantity: 400,
    sku_required: 400, name_required: 400, valid_price_required: 400,
  }
  const code = err.code || 'internal_error'
  let status = statusByCode[code] || fallback
  if (code.startsWith('invalid_event_type')) status = 400
  res.status(status).json({ success: false, error: code })
}

export async function handleCreateProduct(req, res) {
  try {
    const product = await productService.createProduct(req.params.venueId, req.user.id, req.body)
    res.status(201).json({ success: true, product })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleListProducts(req, res) {
  try {
    const products = await productService.listProducts(req.params.venueId, req.query)
    res.json({ success: true, products })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetProduct(req, res) {
  try {
    const product = await productService.getProduct(req.params.venueId, req.params.productId)
    if (!product) return res.status(404).json({ success: false, error: 'product_not_found' })
    res.json({ success: true, product })
  } catch (err) { sendError(res, err, 500) }
}

// Server-authoritative only: quantityDelta/eventType come from the
// authenticated staff caller's own request, but the resulting
// quantities are always server-computed and returned — the client
// never supplies (and this handler never reads) a final quantity.
export async function handleApplyInventoryEvent(req, res) {
  try {
    const { eventType, quantityDelta, reason, idempotencyKey, metadata } = req.body
    const result = await inventoryService.applyInventoryEvent(
      req.params.productId, eventType, Number(quantityDelta), req.user.id, req.user.role,
      { idempotencyKey, reason, metadata }
    )
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetAvailability(req, res) {
  try {
    const availability = await inventoryService.getProductAvailability(req.params.productId)
    res.json({ success: true, availability })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCreateHold(req, res) {
  try {
    const { quantity, expiresAt, idempotencyKey } = req.body
    const result = await inventoryService.createHold(req.params.productId, Number(quantity), req.user.id, expiresAt, { idempotencyKey })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleReleaseHold(req, res) {
  try {
    const result = await inventoryService.releaseHold(req.params.holdId, req.user.id)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleExpireHold(req, res) {
  try {
    const result = await inventoryService.expireHold(req.params.holdId)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCreateReservation(req, res) {
  try {
    const { quantity, reservedFor, expiresAt, idempotencyKey } = req.body
    const result = await inventoryService.createReservation(req.params.productId, Number(quantity), reservedFor, req.user.id, expiresAt, { idempotencyKey })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCancelReservation(req, res) {
  try {
    const result = await inventoryService.cancelReservation(req.params.reservationId, req.user.id)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleFulfillReservation(req, res) {
  try {
    const result = await inventoryService.fulfillReservation(req.params.reservationId, req.user.id)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCreateOrder(req, res) {
  try {
    const result = await orderService.createOrder(req.params.venueId, req.user.id, { idempotencyKey: req.body?.idempotencyKey })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAddOrderItem(req, res) {
  try {
    const { productId, quantity, unitPriceCents } = req.body
    const item = await orderService.addOrderItem(req.params.orderId, productId, Number(quantity), Number(unitPriceCents))
    res.json({ success: true, item })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCompleteOrder(req, res) {
  try {
    const result = await orderService.completeOrder(req.params.orderId, req.user.id, { idempotencyKey: req.body?.idempotencyKey })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCancelOrder(req, res) {
  try {
    const result = await orderService.cancelOrder(req.params.orderId, req.user.id, { idempotencyKey: req.body?.idempotencyKey })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}
