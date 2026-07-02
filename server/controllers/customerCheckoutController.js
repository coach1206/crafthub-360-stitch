/**
 * Customer Checkout Controller
 * All endpoints return preview states. No live payment, POS, or KDS claims.
 */

import {
  createCart, getCart, getVenueCarts, addCartItem, updateCartItem,
  removeCartItem, clearCart, buildCartSummary, getCartReadiness,
} from '../services/checkout/customerCartService.js'
import {
  startCheckout, buildCheckoutPreview, buildSelfOrderPreview,
  submitSelfOrderPreview, buildStaffAssistedOrderPreview, requestStaffHandoff,
  getCheckoutSession, cancelCheckoutSession,
} from '../services/checkout/customerCheckoutService.js'
import { buildReceiptPreview, getReceiptPreview, formatReceiptPreviewForCustomer } from '../services/checkout/checkoutReceiptService.js'
import { getCustomerOrderStatus, getCustomerOrderTimeline } from '../services/checkout/customerOrderStatusService.js'
import { getCheckoutReadiness, getSelfOrderReadiness, getStaffAssistedOrderReadiness, getPartnerCheckoutReadiness } from '../services/checkout/checkoutReadinessEngine.js'
import { getCheckoutAuditTrail, logCartEvent } from '../services/checkout/checkoutAuditService.js'

// ── Cart ──────────────────────────────────────────────────────────────────
export async function handleCreateCart(req, res) {
  try {
    const result = createCart(req.body)
    res.status(result.ok ? 201 : 400).json(result)
  } catch (e) { res.status(500).json({ ok: false, error: e.message, cartStatus: 'preview_fallback' }) }
}

export async function handleGetCart(req, res) {
  try {
    res.json(getCart(req.params.cartId))
  } catch (e) { res.status(500).json({ ok: false, error: e.message, cartStatus: 'preview_fallback' }) }
}

export async function handleGetVenueCarts(req, res) {
  try {
    res.json(getVenueCarts(req.params.venueId, req.query))
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}

export async function handleAddCartItem(req, res) {
  try {
    const result = addCartItem(req.params.cartId, req.body)
    if (!result.ok) return res.status(400).json(result)
    logCartEvent(req.params.cartId, { action: 'item_added', details: { item_name: req.body.item_name } })
    res.status(201).json(result)
  } catch (e) { res.status(500).json({ ok: false, error: e.message, cartStatus: 'preview_fallback' }) }
}

export async function handleUpdateCartItem(req, res) {
  try {
    const result = updateCartItem(req.params.cartId, req.params.cartItemId, req.body)
    if (!result.ok) return res.status(400).json(result)
    res.json(result)
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}

export async function handleRemoveCartItem(req, res) {
  try {
    res.json(removeCartItem(req.params.cartId, req.params.cartItemId))
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}

export async function handleClearCart(req, res) {
  try {
    res.json(clearCart(req.params.cartId))
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}

// ── Checkout ──────────────────────────────────────────────────────────────
export async function handleStartCheckout(req, res) {
  try {
    res.json(await startCheckout(req.params.cartId, { ...req.body, ...req.params }))
  } catch (e) { res.status(500).json({ ok: false, error: e.message, checkoutStatus: 'preview_fallback' }) }
}

export async function handleBuildCheckoutPreview(req, res) {
  try {
    const cartResult = getCart(req.params.cartId)
    if (!cartResult.ok) return res.status(404).json(cartResult)
    const cartPayload = { ...cartResult.cart, items: cartResult.cart.items ?? [] }
    res.json(await buildCheckoutPreview(cartPayload, req.body))
  } catch (e) { res.status(500).json({ ok: false, error: e.message, checkoutStatus: 'preview_fallback' }) }
}

export async function handleSelfOrderPreview(req, res) {
  try {
    const cartResult = getCart(req.params.cartId)
    if (!cartResult.ok) return res.status(404).json(cartResult)
    const cartPayload = { ...cartResult.cart, items: cartResult.cart.items ?? [] }
    res.json(await buildSelfOrderPreview(cartPayload, req.body))
  } catch (e) { res.status(500).json({ ok: false, error: e.message, selfOrderStatus: 'preview_fallback' }) }
}

export async function handleSubmitPreview(req, res) {
  try {
    const cartResult = getCart(req.params.cartId)
    if (!cartResult.ok) return res.status(404).json(cartResult)
    const cartPayload = { ...cartResult.cart, items: cartResult.cart.items ?? [] }
    res.json(await submitSelfOrderPreview(cartPayload, req.body))
  } catch (e) { res.status(500).json({ ok: false, error: e.message, submissionStatus: 'preview_fallback' }) }
}

export async function handleStaffAssistedPreview(req, res) {
  try {
    const cartResult = getCart(req.params.cartId)
    if (!cartResult.ok) return res.status(404).json(cartResult)
    const cartPayload = { ...cartResult.cart, items: cartResult.cart.items ?? [] }
    res.json(await buildStaffAssistedOrderPreview(cartPayload, req.body))
  } catch (e) { res.status(500).json({ ok: false, error: e.message, staffHandoffStatus: 'preview_fallback' }) }
}

export async function handleStaffHandoff(req, res) {
  try {
    res.json(await requestStaffHandoff(req.params.cartId, req.body))
  } catch (e) { res.status(500).json({ ok: false, error: e.message, handoffStatus: 'preview_fallback' }) }
}

export async function handleGetCheckoutSession(req, res) {
  try {
    res.json(getCheckoutSession(req.params.checkoutSessionId))
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}

export async function handleCancelCheckoutSession(req, res) {
  try {
    res.json(cancelCheckoutSession(req.params.checkoutSessionId, req.body.reason))
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}

// ── Receipt ────────────────────────────────────────────────────────────────
export async function handleGetReceiptPreview(req, res) {
  try {
    const cartResult = getCart(req.params.cartId)
    if (!cartResult.ok) return res.status(404).json(cartResult)
    const existing = getReceiptPreview(req.params.cartId)
    if (existing.ok) {
      return res.json({ ...existing, formattedReceipt: formatReceiptPreviewForCustomer(existing.receiptPreview) })
    }
    const cartPayload = { ...cartResult.cart, items: cartResult.cart.items ?? [] }
    const checkoutPreview = await buildCheckoutPreview(cartPayload, {})
    const result = buildReceiptPreview(cartPayload, checkoutPreview)
    res.json({ ...result, formattedReceipt: formatReceiptPreviewForCustomer(result.receiptPreview) })
  } catch (e) { res.status(500).json({ ok: false, error: e.message, receiptStatus: 'preview_fallback' }) }
}

// ── Order Status ───────────────────────────────────────────────────────────
export async function handleGetCustomerOrderStatus(req, res) {
  try {
    res.json(await getCustomerOrderStatus(req.params.orderId))
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}

export async function handleGetCustomerOrderTimeline(req, res) {
  try {
    res.json(await getCustomerOrderTimeline(req.params.orderId))
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}

// ── Readiness ──────────────────────────────────────────────────────────────
export async function handleGetCheckoutReadiness(req, res) {
  try {
    res.json(await getCheckoutReadiness(req.body ?? {}))
  } catch (e) { res.status(500).json({ ok: false, error: e.message, checkoutReadiness: 'preview_fallback' }) }
}

export async function handleGetSelfOrderReadiness(req, res) {
  try {
    res.json(await getSelfOrderReadiness(req.params.venueId))
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}

export async function handleGetStaffAssistedReadiness(req, res) {
  try {
    res.json(await getStaffAssistedOrderReadiness(req.params.venueId))
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}

export async function handleGetPartnerReadiness(req, res) {
  try {
    res.json(await getPartnerCheckoutReadiness(req.params.partnerId, req.params.venueId))
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}

// ── Audit ──────────────────────────────────────────────────────────────────
export async function handleGetAuditTrail(req, res) {
  try {
    res.json(getCheckoutAuditTrail(req.params.entityType, req.params.entityId))
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
}
