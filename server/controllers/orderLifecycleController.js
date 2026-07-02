/**
 * Order Lifecycle Controller
 */

import {
  createOrderDraft, validateOrderDraft,
  submitOrder, acceptOrder, rejectOrder, routeOrder,
  markOrderPreparing, markOrderReady, completeOrder, cancelOrder,
  linkPaymentToOrder, linkTaxCalculationToOrder, linkPartnerFulfillment,
  linkPOSRouting, linkKDSRouting, linkRefundToOrder,
  getOrderLifecycle, getVenueOrders, getPartnerOrders, getOrderLifecycleReadiness,
} from '../services/order/orderLifecycleService.js'
import { getOrderReadiness } from '../services/order/orderReadinessEngine.js'
import { getOrderAuditTrail } from '../services/order/orderAuditService.js'

export async function handleCreateOrderDraft(req, res) {
  try { return res.status(201).json(await createOrderDraft(req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleSubmitOrder(req, res) {
  try { return res.json(await submitOrder(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleAcceptOrder(req, res) {
  try { return res.json(await acceptOrder(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleRejectOrder(req, res) {
  try { return res.json(await rejectOrder(req.params.orderId, req.body.reason, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleRouteOrder(req, res) {
  try { return res.json(await routeOrder(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleMarkOrderPreparing(req, res) {
  try { return res.json(await markOrderPreparing(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleMarkOrderReady(req, res) {
  try { return res.json(await markOrderReady(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCompleteOrder(req, res) {
  try { return res.json(await completeOrder(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCancelOrder(req, res) {
  try { return res.json(await cancelOrder(req.params.orderId, req.body.reason, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleLinkPayment(req, res) {
  try { return res.json(await linkPaymentToOrder(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleLinkTax(req, res) {
  try { return res.json(await linkTaxCalculationToOrder(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleLinkPartnerFulfillment(req, res) {
  try { return res.json(await linkPartnerFulfillment(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleLinkPOSRouting(req, res) {
  try { return res.json(await linkPOSRouting(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleLinkKDSRouting(req, res) {
  try { return res.json(await linkKDSRouting(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleLinkRefund(req, res) {
  try { return res.json(await linkRefundToOrder(req.params.orderId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetOrder(req, res) {
  try {
    const result = await getOrderLifecycle(req.params.orderId)
    if (!result.ok) return res.status(404).json(result)
    return res.json(result)
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetVenueOrders(req, res) {
  try { return res.json(await getVenueOrders(req.params.venueId, req.query)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetPartnerOrders(req, res) {
  try { return res.json(await getPartnerOrders(req.params.partnerId, req.query)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetOrderReadiness(req, res) {
  try { return res.json(getOrderReadiness(req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetOrderAudit(req, res) {
  try { return res.json(await getOrderAuditTrail(req.params.orderId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}
