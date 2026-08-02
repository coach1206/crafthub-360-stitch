import * as checkoutService from '../services/venueHumidor/checkoutService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    no_active_venue: 404, hold_not_found: 404, product_not_found: 404, order_not_found: 404,
    wrong_venue_hold: 403, wrong_user_hold: 403, order_not_owned: 403,
    unsupported_fulfillment_method: 409, order_not_completable: 409, order_already_refunded: 409,
    idempotency_key_required: 400,
    // Server-authoritative compliance denial reasons (Production Package 6
    // Correction) — specific, safe (no PII/verification internals leaked).
    'age-verification-required': 403, 'age-verification-expired': 403,
    'jurisdiction-unsupported': 403, 'terms-acceptance-required': 403,
    'privacy-acknowledgement-required': 403, 'warning-acknowledgement-required': 403,
    'fulfillment-method-prohibited': 409, 'shipping-prohibited': 409,
    'staff-verification-required': 403,
  }
  const code = err.code || 'internal_error'
  let status = statusByCode[code] || fallback
  if (code.startsWith('stale_hold') || code === 'expired_hold') status = 409
  res.status(status).json({ success: false, error: code })
}

function guestRef(req) {
  if (!req.smokecraftIdentity) return null
  return req.smokecraftIdentity.type === 'user' ? `user:${req.smokecraftIdentity.id}` : req.smokecraftIdentity.id
}

export async function handleGetCheckoutQuote(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { holdId, tipCents } = req.body
    const quote = await checkoutService.getCheckoutQuote(req.params.venueId, holdId, ref, { tipCents: Number(tipCents) || 0 })
    res.json({ success: true, quote })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCreateOrder(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    // NOTE: any client-submitted "ageVerified"/eligibility field is
    // intentionally ignored — eligibility is re-derived server-side from
    // age_verification_records/policy_acceptances/jurisdiction rules inside
    // checkoutService.createOrderFromHold (Production Package 6 Correction).
    const { holdId, fulfillmentMethod, fulfillmentDetails, customerNotes, tipCents, idempotencyKey, locale } = req.body
    const result = await checkoutService.createOrderFromHold(req.params.venueId, holdId, ref, {
      fulfillmentMethod, fulfillmentDetails, customerNotes, tipCents: Number(tipCents) || 0, idempotencyKey, locale,
    })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetOrder(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const order = await checkoutService.getOrder(req.params.venueId, req.params.orderId, ref)
    if (!order) return res.status(404).json({ success: false, error: 'order_not_found' })
    res.json({ success: true, order })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCustomerCancelOrder(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const order = await checkoutService.getOrder(req.params.venueId, req.params.orderId, ref)
    if (!order) return res.status(404).json({ success: false, error: 'order_not_found' })
    const result = await checkoutService.cancelOrder(req.params.orderId, ref, { idempotencyKey: req.body?.idempotencyKey, reason: req.body?.reason || 'customer_requested' })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

// Staff-authorized completion/cancellation — mounted behind
// requireVenueStaff in venueHumidorRoutes.js, the same authorization
// gate used for every other staff mutation.
export async function handleStaffCompleteOrder(req, res) {
  try {
    const result = await checkoutService.completeOrder(req.params.orderId, req.user.id, req.user.role, { idempotencyKey: req.body?.idempotencyKey })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleStaffCancelOrder(req, res) {
  try {
    const result = await checkoutService.cancelOrder(req.params.orderId, req.user.id, { idempotencyKey: req.body?.idempotencyKey, reason: req.body?.reason || 'staff_cancelled' })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}
