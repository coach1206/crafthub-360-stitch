/**
 * Venue Humidor 1B-2B-4 — customer order history, receipts, and
 * Passport acquisition read surface.
 */
import * as orderHistoryService from '../services/venueHumidor/customerOrderHistoryService.js'
import * as passportService from '../services/venueHumidor/passportAcquisitionService.js'

function guestRef(req) {
  if (!req.smokecraftIdentity) return null
  return req.smokecraftIdentity.type === 'user' ? `user:${req.smokecraftIdentity.id}` : req.smokecraftIdentity.id
}

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    order_not_owned: 403, acquisition_not_owned: 403,
    order_not_found: 404, acquisition_not_found: 404,
    receipt_not_available: 409, invalid_rating: 400, idempotency_key_required: 400,
  }
  const code = err.code || 'internal_error'
  res.status(statusByCode[code] || fallback).json({ success: false, error: code })
}

export async function handleListOrders(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const orders = await orderHistoryService.listOrders(ref, req.query)
    res.json({ success: true, orders })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetOrderDetail(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const order = await orderHistoryService.getOrderDetail(ref, req.params.orderId)
    if (!order) return res.status(404).json({ success: false, error: 'order_not_found' })
    res.json({ success: true, order })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetReceipt(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const receipt = await orderHistoryService.getReceipt(ref, req.params.orderId)
    if (!receipt) return res.status(404).json({ success: false, error: 'order_not_found' })
    res.json({ success: true, receipt })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleListAcquisitions(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const acquisitions = await passportService.listAcquisitions(ref)
    res.json({ success: true, acquisitions })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetAcquisitionDetail(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const acquisition = await passportService.getAcquisitionDetail(ref, req.params.acquisitionId)
    if (!acquisition) return res.status(404).json({ success: false, error: 'acquisition_not_found' })
    res.json({ success: true, acquisition })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSaveAcquisitionNote(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { rating, tastingNote, isSmoked, idempotencyKey } = req.body || {}
    const result = await passportService.saveAcquisitionNote(ref, req.params.acquisitionId, { rating, tastingNote, isSmoked }, idempotencyKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}
