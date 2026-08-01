/**
 * Venue Humidor Real Payment Gateway — Production Package 2 of 7.
 *
 * Server-authoritative payment-intent creation, verified-webhook
 * processing, refunds, cancellation, and reconciliation for real-money
 * Stripe payments on Venue Humidor orders. Reuses checkoutService.js
 * (order/hold state machine) and inventoryService.applyInventoryEvent
 * (the sole inventory ledger) — never a second inventory or order
 * ledger. Canonical payment state lives ONLY in
 * venue_cigar_payment_intents.payment_state (migration 115), kept
 * deliberately separate from venue_cigar_orders.status/payment_status.
 *
 * The client never declares an order paid — only a verified webhook
 * (processed here) transitions payment_state to 'paid' and only then
 * is checkoutService.completeOrder() (the sole inventory-mutation
 * entry point) invoked.
 */
import { getDb } from '../../db/connection.js'
import { createStripeAdapter, isStripeConfigured } from '../payments/stripeAdapter.js'
import * as checkoutService from './checkoutService.js'
import { recordVenueHumidorEvent } from './venueHumidorEventService.js'

export class PaymentError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'

function getAdapter(injected) {
  if (injected) return injected
  if (!isStripeConfigured()) throw new PaymentError('stripe_not_configured')
  return createStripeAdapter()
}

/**
 * Creates (or idempotently reuses) a real Stripe PaymentIntent for a
 * pending-payment order the caller owns. Amount/currency are read
 * from the ALREADY server-computed order row (checkoutService), never
 * recomputed from client input and never trusted from the client at
 * this step either — this function takes no price/amount argument at
 * all.
 */
export async function createPaymentIntentForOrder(venueId, orderId, actorRef, { idempotencyKey, adapter: injectedAdapter } = {}) {
  if (!idempotencyKey) throw new PaymentError('idempotency_key_required')
  const db = getDb()

  const order = await checkoutService.getOrder(venueId, orderId, actorRef)
  if (!order) throw new PaymentError('order_not_found')
  if (order.status !== 'pending_payment' && order.status !== 'draft') throw new PaymentError('order_not_payable')

  // Idempotent reuse: a still-open intent on this order is returned
  // as-is rather than creating a second PaymentIntent (mandate
  // section 7 — duplicate checkout / rapid double-click / retry).
  if (order.active_payment_intent_id) {
    const { rows } = await db.query(`SELECT * FROM venue_cigar_payment_intents WHERE payment_intent_id = $1`, [order.active_payment_intent_id])
    const existing = rows[0]
    if (existing && !['failed', 'canceled', 'expired'].includes(existing.payment_state)) {
      return { paymentIntent: existing, deduplicated: true }
    }
  }

  const { rows: preCheck } = await db.query(`SELECT * FROM venue_cigar_payment_intents WHERE idempotency_key = $1`, [idempotencyKey])
  if (preCheck[0]) return { paymentIntent: preCheck[0], deduplicated: true }

  const adapter = getAdapter(injectedAdapter)

  let providerIntent
  try {
    providerIntent = await adapter.createPaymentIntent({
      amountCents: order.total_cents,
      currency: order.currency || 'USD',
      orderId,
      venueId,
      customerReference: actorRef,
      idempotencyKey,
    })
  } catch (err) {
    throw new PaymentError(`provider_create_failed:${err.code || err.message || 'unknown'}`)
  }

  let row
  try {
    const { rows } = await db.query(
      `INSERT INTO venue_cigar_payment_intents (
         order_id, venue_id, customer_reference, provider, provider_mode,
         provider_payment_intent_id, provider_client_secret_issued, currency,
         amount_authorized_cents, payment_state, idempotency_key, hold_id, metadata
       ) VALUES ($1,$2,$3,'stripe',$4,$5,true,$6,$7,'requires_customer_action',$8,$9,$10)
       RETURNING *`,
      [
        orderId, venueId, actorRef, adapter.mode, providerIntent.id, order.currency || 'USD',
        order.total_cents, idempotencyKey, order.hold_id || null, JSON.stringify({}),
      ]
    )
    row = rows[0]
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      const { rows } = await db.query(`SELECT * FROM venue_cigar_payment_intents WHERE idempotency_key = $1`, [idempotencyKey])
      return { paymentIntent: rows[0], deduplicated: true }
    }
    throw err
  }

  await db.query(`UPDATE venue_cigar_orders SET active_payment_intent_id = $2, updated_at = now() WHERE order_id = $1`, [orderId, row.payment_intent_id])

  await recordVenueHumidorEvent({
    guestReference: actorRef, venueId, sourceScreen: 'VenueHumidorCheckout',
    sourceRoute: `/api/smokecraft/venue-humidor/customer/venues/${venueId}/orders/${orderId}/payment-intent`,
    eventType: 'venue_humidor_payment_intent_created', orderId, status: 'requires_customer_action',
    totals: { totalCents: order.total_cents },
    idempotencyKey: `venue-humidor-payment-intent-created-${row.payment_intent_id}`,
  })

  return {
    paymentIntent: row,
    deduplicated: false,
    // Only the client secret (never a secret key) crosses to the
    // browser — required for Stripe.js/Elements to confirm payment.
    clientSecret: providerIntent.client_secret,
  }
}

async function loadPaymentIntentByProviderId(db, providerPaymentIntentId) {
  const { rows } = await db.query(`SELECT * FROM venue_cigar_payment_intents WHERE provider_payment_intent_id = $1`, [providerPaymentIntentId])
  return rows[0] || null
}

async function transitionPaymentIntent(db, paymentIntentId, patch) {
  const fields = Object.keys(patch)
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')
  const { rows } = await db.query(
    `UPDATE venue_cigar_payment_intents SET ${setClause}, updated_at = now() WHERE payment_intent_id = $1 RETURNING *`,
    [paymentIntentId, ...fields.map(f => patch[f])]
  )
  return rows[0]
}

/**
 * Verified-webhook entry point. Signature verification happens inside
 * the adapter against the RAW body (never a client-forwarded/parsed
 * payload). Every event is recorded append-only, exactly once
 * (unique provider event id), BEFORE any side effect — a duplicate or
 * out-of-order redelivery is a safe no-op.
 */
export async function handleStripeWebhook(rawBody, signatureHeader, { adapter: injectedAdapter } = {}) {
  const db = getDb()
  const adapter = getAdapter(injectedAdapter)
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!injectedAdapter && !webhookSecret) throw new PaymentError('webhook_secret_not_configured')

  let event
  try {
    event = adapter.constructWebhookEvent(rawBody, signatureHeader, webhookSecret || 'mocked_webhook_secret_for_test_adapter_boundary')
  } catch (err) {
    // Safe failure — never process an unsigned/unverifiable payload.
    throw new PaymentError('invalid_webhook_signature')
  }

  // Append-only dedup insert — ON CONFLICT means this exact provider
  // event was already recorded; return immediately, no reprocessing,
  // no error (webhook must respond 2xx to a legitimate provider retry
  // of an already-handled event).
  const { rows: inserted } = await db.query(
    `INSERT INTO venue_cigar_payment_webhook_events (provider, provider_event_id, provider_event_type, provider_payment_intent_id, signature_verified, processing_status, payload_snapshot)
     VALUES ('stripe', $1, $2, $3, true, 'received', $4)
     ON CONFLICT (provider, provider_event_id) DO NOTHING
     RETURNING *`,
    [event.id, event.type, event.data?.object?.id || null, JSON.stringify(event)]
  )
  if (!inserted[0]) {
    return { deduplicated: true, eventType: event.type }
  }
  const webhookRow = inserted[0]

  try {
    const result = await processStripeEvent(db, event)
    await db.query(`UPDATE venue_cigar_payment_webhook_events SET processing_status = 'processed', processed_at = now() WHERE webhook_event_id = $1`, [webhookRow.webhook_event_id])
    return { deduplicated: false, eventType: event.type, result }
  } catch (err) {
    await db.query(`UPDATE venue_cigar_payment_webhook_events SET processing_status = 'error', error_message = $2, processed_at = now() WHERE webhook_event_id = $1`, [webhookRow.webhook_event_id, err.message || 'unknown_error'])
    throw err
  }
}

async function processStripeEvent(db, event) {
  const obj = event.data?.object || {}

  switch (event.type) {
    case 'payment_intent.processing': {
      const pi = await loadPaymentIntentByProviderId(db, obj.id)
      if (!pi) return { ignored: true, reason: 'unknown_payment_intent' }
      if (pi.payment_state === 'paid') return { ignored: true, reason: 'already_paid' } // out-of-order guard
      await transitionPaymentIntent(db, pi.payment_intent_id, { payment_state: 'processing' })
      return { orderId: pi.order_id, transitionedTo: 'processing' }
    }

    case 'payment_intent.succeeded': {
      const pi = await loadPaymentIntentByProviderId(db, obj.id)
      if (!pi) return { ignored: true, reason: 'unknown_payment_intent' }
      if (['paid', 'refunded', 'partially_refunded'].includes(pi.payment_state)) {
        return { ignored: true, reason: 'already_settled' } // idempotent/out-of-order guard
      }
      await transitionPaymentIntent(db, pi.payment_intent_id, {
        payment_state: 'paid', amount_captured_cents: obj.amount_received ?? pi.amount_authorized_cents,
      })
      // The ONLY place canonical inventory mutation happens — reused,
      // never duplicated (mandate section 3/6).
      await checkoutService.completeOrder(pi.order_id, 'system:stripe-webhook', 'system', {
        idempotencyKey: `stripe-webhook-complete-${pi.order_id}`,
      })
      await recordVenueHumidorEvent({
        guestReference: pi.customer_reference, venueId: pi.venue_id, sourceScreen: 'StripeWebhook',
        sourceRoute: '/api/smokecraft/venue-humidor/payments/webhook', eventType: 'venue_humidor_payment_succeeded',
        orderId: pi.order_id, status: 'paid', totals: { totalCents: pi.amount_authorized_cents },
        idempotencyKey: `venue-humidor-payment-succeeded-${pi.payment_intent_id}`,
      })
      return { orderId: pi.order_id, transitionedTo: 'paid' }
    }

    case 'payment_intent.payment_failed': {
      const pi = await loadPaymentIntentByProviderId(db, obj.id)
      if (!pi) return { ignored: true, reason: 'unknown_payment_intent' }
      if (['paid', 'failed', 'canceled'].includes(pi.payment_state)) return { ignored: true, reason: 'already_terminal' }
      await transitionPaymentIntent(db, pi.payment_intent_id, {
        payment_state: 'failed',
        failure_code: obj.last_payment_error?.code || null,
        failure_message: obj.last_payment_error?.message || null,
      })
      // Failed payment releases the eligible hold safely (mandate
      // section 3/6) via the existing cancelOrder path — never a
      // second hold-release mechanism.
      await checkoutService.cancelOrder(pi.order_id, 'system:stripe-webhook', {
        idempotencyKey: `stripe-webhook-cancel-failed-${pi.order_id}`, reason: 'payment_failed',
      }).catch(() => {}) // order may already be in a terminal state — safe no-op
      await recordVenueHumidorEvent({
        guestReference: pi.customer_reference, venueId: pi.venue_id, sourceScreen: 'StripeWebhook',
        sourceRoute: '/api/smokecraft/venue-humidor/payments/webhook', eventType: 'venue_humidor_payment_failed',
        orderId: pi.order_id, status: 'failed',
        idempotencyKey: `venue-humidor-payment-failed-${pi.payment_intent_id}`,
      })
      return { orderId: pi.order_id, transitionedTo: 'failed' }
    }

    case 'payment_intent.canceled': {
      const pi = await loadPaymentIntentByProviderId(db, obj.id)
      if (!pi) return { ignored: true, reason: 'unknown_payment_intent' }
      if (['paid', 'failed', 'canceled'].includes(pi.payment_state)) return { ignored: true, reason: 'already_terminal' }
      await transitionPaymentIntent(db, pi.payment_intent_id, { payment_state: 'canceled' })
      await checkoutService.cancelOrder(pi.order_id, 'system:stripe-webhook', {
        idempotencyKey: `stripe-webhook-cancel-canceled-${pi.order_id}`, reason: 'payment_canceled',
      }).catch(() => {})
      return { orderId: pi.order_id, transitionedTo: 'canceled' }
    }

    case 'charge.dispute.created':
    case 'charge.dispute.updated':
    case 'charge.dispute.closed': {
      const providerPaymentIntentId = obj.payment_intent
      const pi = providerPaymentIntentId ? await loadPaymentIntentByProviderId(db, providerPaymentIntentId) : null
      if (!pi) return { ignored: true, reason: 'unknown_payment_intent' }
      const status = event.type === 'charge.dispute.created' ? 'opened'
        : obj.status === 'won' ? 'won' : obj.status === 'lost' ? 'lost' : 'updated'
      await db.query(
        `INSERT INTO venue_cigar_payment_disputes (payment_intent_id, order_id, venue_id, provider_dispute_id, amount_disputed_cents, status, reason, closed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (provider_dispute_id) DO UPDATE SET status = EXCLUDED.status, updated_at = now(), closed_at = EXCLUDED.closed_at`,
        [pi.payment_intent_id, pi.order_id, pi.venue_id, obj.id, obj.amount || 0, status, obj.reason || null, ['won', 'lost'].includes(status) ? new Date() : null]
      )
      if (status === 'opened' || status === 'updated') {
        await transitionPaymentIntent(db, pi.payment_intent_id, { payment_state: 'disputed' })
      }
      await recordVenueHumidorEvent({
        guestReference: pi.customer_reference, venueId: pi.venue_id, sourceScreen: 'StripeWebhook',
        sourceRoute: '/api/smokecraft/venue-humidor/payments/webhook', eventType: 'venue_humidor_payment_disputed',
        orderId: pi.order_id, status,
        idempotencyKey: `venue-humidor-payment-disputed-${obj.id}-${status}`,
      })
      return { orderId: pi.order_id, disputeStatus: status }
    }

    default:
      return { ignored: true, reason: 'unhandled_event_type' }
  }
}

/**
 * Staff-initiated refund (full or partial). Requires the payment to
 * be paid/partially-refunded and requires an explicit staff actor —
 * RBAC is enforced at the route/controller level, reusing the
 * existing Venue Humidor staff-membership model.
 */
export async function refundPayment(venueId, orderId, staffId, { amountCents, reason, idempotencyKey, adapter: injectedAdapter } = {}) {
  if (!idempotencyKey) throw new PaymentError('idempotency_key_required')
  if (!staffId) throw new PaymentError('staff_id_required')
  const db = getDb()

  const { rows: preCheck } = await db.query(`SELECT * FROM venue_cigar_payment_refunds WHERE idempotency_key = $1`, [idempotencyKey])
  if (preCheck[0]) return { refund: preCheck[0], deduplicated: true }

  const { rows: piRows } = await db.query(`SELECT * FROM venue_cigar_payment_intents WHERE order_id = $1 AND venue_id = $2 ORDER BY created_at DESC LIMIT 1`, [orderId, venueId])
  const pi = piRows[0]
  if (!pi) throw new PaymentError('payment_intent_not_found')
  if (!['paid', 'partially_refunded'].includes(pi.payment_state)) throw new PaymentError('payment_not_refundable')

  const remaining = pi.amount_captured_cents - pi.amount_refunded_cents
  const requested = Number.isInteger(amountCents) && amountCents > 0 ? amountCents : remaining
  if (requested > remaining) throw new PaymentError('refund_amount_exceeds_remaining')

  const adapter = getAdapter(injectedAdapter)
  let providerRefund
  try {
    providerRefund = await adapter.createRefund({
      providerPaymentIntentId: pi.provider_payment_intent_id, amountCents: requested, reason, idempotencyKey,
    })
  } catch (err) {
    const { rows } = await db.query(
      `INSERT INTO venue_cigar_payment_refunds (payment_intent_id, order_id, amount_cents, reason, status, failure_message, requested_by_staff_id, idempotency_key)
       VALUES ($1,$2,$3,$4,'failed',$5,$6,$7) RETURNING *`,
      [pi.payment_intent_id, orderId, requested, reason || null, err.message || 'provider_error', staffId, idempotencyKey]
    )
    return { refund: rows[0], deduplicated: false, failed: true }
  }

  let refundRow
  try {
    const { rows } = await db.query(
      `INSERT INTO venue_cigar_payment_refunds (payment_intent_id, order_id, provider_refund_id, amount_cents, reason, status, requested_by_staff_id, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,'succeeded',$6,$7) RETURNING *`,
      [pi.payment_intent_id, orderId, providerRefund.id, requested, reason || null, staffId, idempotencyKey]
    )
    refundRow = rows[0]
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      const { rows } = await db.query(`SELECT * FROM venue_cigar_payment_refunds WHERE idempotency_key = $1`, [idempotencyKey])
      return { refund: rows[0], deduplicated: true }
    }
    throw err
  }

  const newRefundedTotal = pi.amount_refunded_cents + requested
  const newState = newRefundedTotal >= pi.amount_captured_cents ? 'refunded' : 'partially_refunded'
  await transitionPaymentIntent(db, pi.payment_intent_id, { amount_refunded_cents: newRefundedTotal, payment_state: newState })

  await recordVenueHumidorEvent({
    guestReference: `staff:${staffId}`, venueId, sourceScreen: 'StaffPaymentAdmin',
    sourceRoute: `/api/smokecraft/venue-humidor/orders/${orderId}/refund`, eventType: 'venue_humidor_payment_refunded',
    orderId, status: newState, totals: { totalCents: requested },
    idempotencyKey: `venue-humidor-payment-refunded-${refundRow.refund_id}`,
  })

  return { refund: refundRow, deduplicated: false, paymentState: newState }
}

/**
 * Manual/scheduled reconciliation pass (mandate section 9). Compares
 * local payment_state against the real provider PaymentIntent status
 * for every non-terminal local intent and repairs safe, narrow
 * discrepancies (a stale 'processing'/'requires_customer_action' row
 * whose provider status is actually terminal). Never invents a
 * duplicate inventory/refund effect — repair only ever re-runs the
 * SAME idempotent completion/cancellation path used by the webhook
 * handler, so a repeat reconciliation of the same discrepancy is a
 * safe no-op.
 */
export async function runReconciliation({ triggeredBy = 'manual_admin', staffId, adapter: injectedAdapter } = {}) {
  const db = getDb()
  const adapter = getAdapter(injectedAdapter)

  const { rows: intents } = await db.query(
    `SELECT * FROM venue_cigar_payment_intents WHERE payment_state IN ('payment_pending','requires_customer_action','processing') AND created_at < now() - interval '2 minutes'`
  )

  const discrepancies = []
  let repaired = 0
  for (const pi of intents) {
    let providerIntent
    try {
      providerIntent = await adapter.retrievePaymentIntent(pi.provider_payment_intent_id)
    } catch (err) {
      discrepancies.push({ paymentIntentId: pi.payment_intent_id, orderId: pi.order_id, issue: 'provider_lookup_failed', detail: err.message })
      continue
    }
    const providerStatus = providerIntent.status
    if (providerStatus === 'succeeded' && pi.payment_state !== 'paid') {
      discrepancies.push({ paymentIntentId: pi.payment_intent_id, orderId: pi.order_id, issue: 'local_stale_provider_succeeded' })
      await transitionPaymentIntent(db, pi.payment_intent_id, { payment_state: 'paid', amount_captured_cents: providerIntent.amount_received })
      await checkoutService.completeOrder(pi.order_id, 'system:reconciliation', 'system', { idempotencyKey: `stripe-webhook-complete-${pi.order_id}` }).catch(() => {})
      repaired++
    } else if (['canceled'].includes(providerStatus) && pi.payment_state !== 'canceled') {
      discrepancies.push({ paymentIntentId: pi.payment_intent_id, orderId: pi.order_id, issue: 'local_stale_provider_canceled' })
      await transitionPaymentIntent(db, pi.payment_intent_id, { payment_state: 'canceled' })
      await checkoutService.cancelOrder(pi.order_id, 'system:reconciliation', { idempotencyKey: `stripe-webhook-cancel-canceled-${pi.order_id}`, reason: 'reconciliation_provider_canceled' }).catch(() => {})
      repaired++
    }
  }

  const { rows } = await db.query(
    `INSERT INTO venue_cigar_payment_reconciliation_runs (triggered_by, triggered_by_staff_id, orders_checked, discrepancies_found, discrepancies_repaired, discrepancy_detail, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6, now()) RETURNING *`,
    [triggeredBy, staffId || null, intents.length, discrepancies.length, repaired, JSON.stringify(discrepancies)]
  )
  return rows[0]
}

export async function getPaymentIntentForOrder(venueId, orderId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM venue_cigar_payment_intents WHERE order_id = $1 AND venue_id = $2 ORDER BY created_at DESC LIMIT 1`, [orderId, venueId])
  return rows[0] || null
}

export async function listPaymentsForVenue(venueId, { status } = {}) {
  const db = getDb()
  const params = [venueId]
  let where = `venue_id = $1`
  if (status) { params.push(status); where += ` AND payment_state = $${params.length}` }
  const { rows } = await db.query(`SELECT * FROM venue_cigar_payment_intents WHERE ${where} ORDER BY created_at DESC LIMIT 200`, params)
  return rows
}

export async function listWebhookEventsForVenue() {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM venue_cigar_payment_webhook_events ORDER BY received_at DESC LIMIT 200`)
  return rows
}

export async function listDisputesForVenue(venueId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM venue_cigar_payment_disputes WHERE venue_id = $1 ORDER BY opened_at DESC`, [venueId])
  return rows
}
