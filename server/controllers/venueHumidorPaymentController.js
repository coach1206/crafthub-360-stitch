/**
 * Venue Humidor Real Payment Gateway — customer payment-intent
 * creation and staff/admin payment views, refunds, and manual
 * reconciliation. Reuses the same guest-identity (customer routes)
 * and venue-staff RBAC (admin routes) already established elsewhere
 * in Venue Humidor — no parallel identity/authorization scheme.
 */
import * as paymentService from '../services/venueHumidor/paymentService.js'
import { getPaymentProviderConfig } from '../config/paymentProviderConfig.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    order_not_found: 404, payment_intent_not_found: 404,
    order_not_payable: 409, payment_not_refundable: 409, refund_amount_exceeds_remaining: 409,
    idempotency_key_required: 400, stripe_not_configured: 503, webhook_secret_not_configured: 503,
    invalid_webhook_signature: 400, staff_id_required: 400, order_not_owned: 403,
  }
  const code = err.code || 'internal_error'
  const status = statusByCode[code] || (code.startsWith('provider_create_failed') ? 502 : fallback)
  res.status(status).json({ success: false, error: code })
}

function guestRef(req) {
  if (!req.smokecraftIdentity) return null
  return req.smokecraftIdentity.type === 'user' ? `user:${req.smokecraftIdentity.id}` : req.smokecraftIdentity.id
}

// ── Customer surface ─────────────────────────────────────────────
export async function handleCreatePaymentIntent(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { idempotencyKey } = req.body
    const result = await paymentService.createPaymentIntentForOrder(req.params.venueId, req.params.orderId, ref, { idempotencyKey })
    res.json({
      success: true,
      paymentIntentId: result.paymentIntent.payment_intent_id,
      paymentState: result.paymentIntent.payment_state,
      clientSecret: result.clientSecret || null, // only present on first creation; never a secret key
      deduplicated: result.deduplicated,
    })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetPaymentStatus(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const pi = await paymentService.getPaymentIntentForOrder(req.params.venueId, req.params.orderId)
    if (!pi) return res.status(404).json({ success: false, error: 'payment_intent_not_found' })
    if (pi.customer_reference !== ref) return res.status(403).json({ success: false, error: 'order_not_owned' })
    res.json({
      success: true,
      paymentState: pi.payment_state,
      amountAuthorizedCents: pi.amount_authorized_cents,
      amountCapturedCents: pi.amount_captured_cents,
      amountRefundedCents: pi.amount_refunded_cents,
      currency: pi.currency,
      failureMessage: pi.payment_state === 'failed' ? pi.failure_message : null,
    })
  } catch (err) { sendError(res, err, 500) }
}

export function handleGetPublishableKeyStatus(req, res) {
  res.json({ success: true, ...getPaymentProviderConfig('stripe') })
}

// ── Webhook — raw body required, mounted with express.raw() ─────
export async function handleStripeWebhook(req, res) {
  try {
    const signature = req.headers['stripe-signature']
    const result = await paymentService.handleStripeWebhook(req.body, signature)
    res.json({ received: true, ...result })
  } catch (err) {
    if (err.code === 'invalid_webhook_signature') return res.status(400).json({ received: false, error: 'invalid_signature' })
    // Safe failure response — never a 5xx that would make Stripe stop
    // retrying a legitimately-processed-but-later-erroring event isn't
    // desired either, so genuine processing errors DO return 500 to
    // trigger provider retry, while signature errors return 400 (no
    // retry — the payload will never verify).
    res.status(500).json({ received: false, error: 'processing_error' })
  }
}

// ── Staff/admin surface ──────────────────────────────────────────
export async function handleAdminListPayments(req, res) {
  try {
    const payments = await paymentService.listPaymentsForVenue(req.params.venueId, { status: req.query.status })
    res.json({ success: true, payments })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAdminGetOrderPayment(req, res) {
  try {
    const pi = await paymentService.getPaymentIntentForOrder(req.params.venueId, req.params.orderId)
    if (!pi) return res.status(404).json({ success: false, error: 'payment_intent_not_found' })
    res.json({ success: true, payment: pi })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAdminRefund(req, res) {
  try {
    const staffId = req.user?.id
    const { amountCents, reason, idempotencyKey } = req.body
    const result = await paymentService.refundPayment(req.params.venueId, req.params.orderId, staffId, {
      amountCents: Number.isInteger(amountCents) ? amountCents : undefined, reason, idempotencyKey,
    })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAdminListWebhookEvents(req, res) {
  try {
    const events = await paymentService.listWebhookEventsForVenue()
    res.json({ success: true, events })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAdminListDisputes(req, res) {
  try {
    const disputes = await paymentService.listDisputesForVenue(req.params.venueId)
    res.json({ success: true, disputes })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAdminRunReconciliation(req, res) {
  try {
    const run = await paymentService.runReconciliation({ triggeredBy: 'manual_admin', staffId: req.user?.id })
    res.json({ success: true, run })
  } catch (err) { sendError(res, err, 500) }
}
