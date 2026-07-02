/**
 * Venue Commerce Controller — thin HTTP adapter over venueCommerceService.
 */
import * as svc from '../services/venueCommerceService.js'

// ── Menu / Inventory ──────────────────────────────────────────

export async function getVenueMenu(req, res) {
  const { venueId } = req.params
  const { category } = req.query
  const result = await svc.getVenueMenu(venueId, category)
  res.json({ ok: true, ...result })
}

export async function checkAvailability(req, res) {
  const { venueId } = req.params
  const { itemId, quantity = 1 } = req.body
  if (!itemId) return res.status(400).json({ ok: false, error: 'itemId required' })
  const result = await svc.checkAvailability(venueId, itemId, Number(quantity))
  res.json({ ok: true, ...result })
}

export async function reserveInventory(req, res) {
  const { venueId } = req.params
  const { itemId, quantity = 1, cartId } = req.body
  if (!itemId || !cartId) return res.status(400).json({ ok: false, error: 'itemId and cartId required' })
  try {
    const result = await svc.reserveInventory(venueId, itemId, Number(quantity), cartId)
    res.json({ ok: true, ...result })
  } catch (err) {
    res.status(409).json({ ok: false, error: err.message })
  }
}

export async function releaseInventory(req, res) {
  const { venueId } = req.params
  const { reservationId, reason } = req.body
  if (!reservationId) return res.status(400).json({ ok: false, error: 'reservationId required' })
  const result = await svc.releaseInventory(venueId, reservationId, reason)
  res.json({ ok: true, ...result })
}

export async function commitSale(req, res) {
  const { venueId } = req.params
  const { reservationId, orderId } = req.body
  if (!reservationId || !orderId) return res.status(400).json({ ok: false, error: 'reservationId and orderId required' })
  const result = await svc.commitInventorySale(venueId, reservationId, orderId)
  res.json({ ok: true, ...result })
}

// ── Cart ──────────────────────────────────────────────────────

export async function createCart(req, res) {
  const { guestSessionId, venueId, tabletId, tableId, seatNumber } = req.body
  if (!guestSessionId || !venueId) return res.status(400).json({ ok: false, error: 'guestSessionId and venueId required' })
  const result = await svc.createCart({ guestSessionId, venueId, tabletId, tableId, seatNumber })
  res.json({ ok: true, ...result })
}

export async function getCart(req, res) {
  const { cartId } = req.params
  const result = await svc.getCart(cartId)
  if (!result.cart) return res.status(404).json({ ok: false, error: 'cart not found' })
  res.json({ ok: true, ...result })
}

export async function addItemToCart(req, res) {
  const { cartId } = req.params
  const { itemId, quantity, modifiers, notes } = req.body
  if (!itemId) return res.status(400).json({ ok: false, error: 'itemId required' })
  try {
    const result = await svc.addItemToCart(cartId, { itemId, quantity, modifiers, notes })
    res.json({ ok: true, ...result })
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 409
    res.status(status).json({ ok: false, error: err.message })
  }
}

export async function removeItemFromCart(req, res) {
  const { cartId, cartItemId } = req.params
  const result = await svc.removeItemFromCart(cartId, cartItemId)
  res.json({ ok: true, ...result })
}

export async function checkoutCart(req, res) {
  const { cartId } = req.params
  const { tip = 0, serviceCharge = 0, ageVerified = false } = req.body
  const result = await svc.checkoutCart(cartId, { tip: Number(tip), serviceCharge: Number(serviceCharge), ageVerified })
  if (!result.ok) return res.status(result.requiresAgeVerification ? 403 : 409).json(result)
  res.json(result)
}

// ── Orders / Payment ──────────────────────────────────────────

export async function confirmPayment(req, res) {
  const { orderId } = req.params
  const { paymentIntentId, tenderType, guestSessionId } = req.body
  if (!paymentIntentId) return res.status(400).json({ ok: false, error: 'paymentIntentId required' })
  try {
    const result = await svc.confirmPayment(orderId, { paymentIntentId, tenderType, guestSessionId })
    res.json({ ok: true, ...result })
  } catch (err) {
    res.status(409).json({ ok: false, error: err.message })
  }
}

export async function failPayment(req, res) {
  const { orderId } = req.params
  const { reason } = req.body
  const result = await svc.failPayment(orderId, reason)
  res.json({ ok: true, ...result })
}

export async function attachPOS360Transaction(req, res) {
  const { posTransactionId, guestSessionId, venueId, handoffId, orderId, itemId, itemName,
          itemCategory, subtotal, quantity, isHouseItem, isRecommendedPairing, paymentIntentId } = req.body
  if (!posTransactionId || !guestSessionId || !venueId) {
    return res.status(400).json({ ok: false, error: 'posTransactionId, guestSessionId, venueId required' })
  }
  try {
    const result = await svc.attachPOS360Transaction({
      posTransactionId, guestSessionId, venueId, handoffId, orderId,
      itemId, itemName, itemCategory, subtotal, quantity,
      isHouseItem, isRecommendedPairing, paymentIntentId,
    })
    res.json({ ok: true, ...result })
  } catch (err) {
    res.status(409).json({ ok: false, error: err.message })
  }
}

// ── Staff Handoff ─────────────────────────────────────────────

export async function startHandoff(req, res) {
  const { guestSessionId, venueId, tabletId, target, startRoute, returnRoute, currentVisit, currentSession } = req.body
  if (!guestSessionId || !venueId || !target) {
    return res.status(400).json({ ok: false, error: 'guestSessionId, venueId, target required' })
  }
  const result = await svc.startHandoff({ guestSessionId, venueId, tabletId, target, startRoute, returnRoute, currentVisit, currentSession })
  res.json(result)
}

export async function returnFromHandoff(req, res) {
  const { handoffId } = req.params
  const result = await svc.returnFromHandoff(handoffId)
  res.json(result)
}

// ── E.A.T. Sync ───────────────────────────────────────────────

export async function syncToEAT(req, res) {
  const { guestSessionId, venueId, handoffId, staffUserId, syncType, notes,
          vipCandidateSignal, recommendedFollowUp, inventoryDemandSignal } = req.body
  if (!guestSessionId || !venueId || !syncType) {
    return res.status(400).json({ ok: false, error: 'guestSessionId, venueId, syncType required' })
  }
  const result = await svc.syncToEAT({
    guestSessionId, venueId, handoffId, staffUserId, syncType, notes,
    vipCandidateSignal, recommendedFollowUp, inventoryDemandSignal,
  })
  res.json(result)
}

// ── Guest Session Progress ────────────────────────────────────

export async function saveGuestProgress(req, res) {
  const { guestSessionId, ...data } = req.body
  if (!guestSessionId) return res.status(400).json({ ok: false, error: 'guestSessionId required' })
  const result = await svc.saveGuestSessionProgress(guestSessionId, data)
  res.json({ ok: true, ...result })
}

export async function resumeGuestSession(req, res) {
  const { guestSessionId } = req.params
  const result = await svc.getGuestSessionResume(guestSessionId)
  if (!result.ok) return res.status(404).json(result)
  res.json(result)
}

// ── Order Tickets / Audit ─────────────────────────────────────

export async function routeOrderToStations(req, res) {
  const { orderId, venueId } = req.body
  if (!orderId || !venueId) return res.status(400).json({ ok: false, error: 'orderId and venueId required' })
  const result = await svc.routeOrderToStations(orderId, venueId)
  res.json(result)
}

export async function getAuditLog(req, res) {
  const { venueId } = req.params
  const limit = Number(req.query.limit) || 50
  const result = await svc.getCommerceAuditLog(venueId, limit)
  res.json({ ok: true, ...result })
}
