#!/usr/bin/env node
/**
 * Real Payment Gateway Integration — Production Package 2 of 7.
 * API tests against the real running server (order/hold/checkout
 * surfaces, zero mocking) PLUS direct paymentService.js business-logic
 * tests with the Stripe network call mocked ONLY at the adapter
 * boundary (server/services/payments/stripeAdapter.js) — per mandate
 * section 2/20/18, no live Stripe credentials exist in this
 * environment, so createStripeAdapter({ stripeClient: fake }) is used
 * to exercise the full server-authoritative business logic
 * deterministically. No business-logic function is mocked.
 */
import http from 'http'
import 'dotenv/config'
import { execSync } from 'child_process'
import { createStripeAdapter } from './server/services/payments/stripeAdapter.js'
import * as paymentService from './server/services/venueHumidor/paymentService.js'
import { getDb } from './server/db/connection.js'

const HOST = 'localhost'
const PORT = 3001
let pass = 0, fail = 0
function assert(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

function makeClient() {
  let cookies = {}
  function request(method, path, body) {
    return new Promise((resolve, reject) => {
      const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      const data = body ? JSON.stringify(body) : null
      const req = http.request({
        host: HOST, port: PORT, path, method,
        headers: { 'Content-Type': 'application/json', ...(cookieHeader ? { Cookie: cookieHeader } : {}), ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
      }, res => {
        const setCookie = res.headers['set-cookie']
        if (setCookie) for (const c of setCookie) { const [pair] = c.split(';'); const [k, v] = pair.split('='); cookies[k] = v }
        let chunks = ''
        res.on('data', d => chunks += d)
        res.on('end', () => { let parsed = null; try { parsed = JSON.parse(chunks) } catch {}; resolve({ status: res.statusCode, body: parsed }) })
      })
      req.on('error', reject)
      if (data) req.write(data)
      req.end()
    })
  }
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b), reset: () => { cookies = {} } }
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }

// ── Fake Stripe network client — the ONLY thing mocked. Deterministic,
// stateful across calls within this test run so idempotency/duplicate
// scenarios are real.
function makeFakeStripeClient() {
  const intents = new Map()
  let seq = 0
  return {
    paymentIntents: {
      async create(params, opts) {
        seq++
        const id = `pi_fake_${seq}`
        const pi = { id, client_secret: `${id}_secret_fake`, amount: params.amount, currency: params.currency, status: 'requires_payment_method', amount_received: 0 }
        intents.set(id, pi)
        return pi
      },
      async retrieve(id) { return intents.get(id) },
      async cancel(id) { const pi = intents.get(id); pi.status = 'canceled'; return pi },
    },
    refunds: {
      async create(params, opts) {
        seq++
        return { id: `re_fake_${seq}`, payment_intent: params.payment_intent, amount: params.amount, status: 'succeeded' }
      },
    },
    webhooks: {
      constructEvent(rawBody, sig, secret) {
        if (sig !== 'valid-test-signature') throw new Error('signature verification failed')
        return JSON.parse(rawBody.toString())
      },
    },
    __intents: intents,
  }
}

function fakeEvent(type, obj, id) {
  return { id: id || `evt_${type}_${Math.random().toString(36).slice(2)}`, type, data: { object: obj } }
}

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()

  const venueId = 'vh-seed-venue-alpha'
  const otherVenueId = 'vh-seed-venue-bravo'
  const productId = psql(`SELECT product_id FROM venue_cigar_products WHERE venue_id = '${venueId}' AND sku = 'ALPHA-001'`)

  // Clean slate for this suite's own test data.
  psql(`UPDATE venue_cigar_orders SET active_payment_intent_id = NULL WHERE venue_id = '${venueId}' AND product_snapshot->>'name' = 'ALPHA Robusto'`)
  psql(`DELETE FROM venue_cigar_payment_refunds WHERE order_id IN (SELECT order_id FROM venue_cigar_orders WHERE venue_id = '${venueId}' AND product_snapshot->>'name' = 'ALPHA Robusto')`)
  psql(`DELETE FROM venue_cigar_payment_disputes WHERE venue_id = '${venueId}'`)
  psql(`DELETE FROM venue_cigar_payment_webhook_events`)
  psql(`DELETE FROM venue_cigar_payment_intents WHERE venue_id = '${venueId}'`)
  psql(`DELETE FROM venue_cigar_order_items WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_orders WHERE venue_id = '${venueId}' AND product_snapshot->>'name' = 'ALPHA Robusto'`)
  psql(`UPDATE venue_cigar_products SET physical_quantity = 40 WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_inventory_holds WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_inventory_events WHERE product_id = '${productId}'`)

  console.log('\n=== Real Payment Gateway Integration — API Tests ===\n')

  // ── Helper: create a real hold + order via HTTP (server-authoritative) ──
  async function createRealOrder(client, qty = 1) {
    await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}`)
    const hold = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${productId}/stick-hold`, {
      quantity: qty, idempotencyKey: `hold-${Math.random()}`,
    })
    const order = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, {
      holdId: hold.body.hold.hold_id, fulfillmentMethod: 'counter_pickup', ageVerified: true, idempotencyKey: `order-${Math.random()}`,
    })
    return order.body.order
  }

  const client1 = makeClient()
  const order1 = await createRealOrder(client1)
  assert('order created pending_payment', order1.status === 'pending_payment')
  assert('order total server-computed (subtotal+tax)', order1.total_cents === order1.subtotal_cents + order1.tax_cents)

  // ── Invalid venue / invalid product ──
  const badVenue = await client1.post(`/api/smokecraft/venue-humidor/customer/venues/does-not-exist/checkout/quote`, { holdId: 'x' })
  assert('invalid venue rejected', badVenue.status === 404 || badVenue.status === 400)

  // ── Stripe not configured → honest 503, never a fabricated success ──
  const noKeyResult = await client1.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/orders/${order1.order_id}/payment-intent`, { idempotencyKey: `pi-${Math.random()}` })
  assert('payment-intent creation honestly 503s with no Stripe keys configured', noKeyResult.status === 503 && noKeyResult.body.error === 'stripe_not_configured')

  // ── Publishable-key status route is honest ──
  const keyStatus = await client1.get('/api/smokecraft/venue-humidor/customer/stripe/publishable-key-status')
  assert('publishable key status reports not configured', keyStatus.body.ready === false)

  // ══════════════════ Adapter-boundary-mocked business logic ══════════════
  console.log('\n--- Business logic (Stripe network mocked at adapter boundary only) ---\n')
  const fakeStripe = makeFakeStripeClient()
  const adapter = createStripeAdapter({ stripeClient: fakeStripe })
  assert('adapter reports mocked_adapter_boundary mode (honest, never claims live)', adapter.mode === 'mocked_adapter_boundary')

  const custRef1 = order1.customer_reference

  // ── create payment intent (real order, real amount, mocked network) ──
  const pi1 = await paymentService.createPaymentIntentForOrder(venueId, order1.order_id, custRef1, { idempotencyKey: `pi-real-${Math.random()}`, adapter })
  assert('payment intent created with server-authoritative amount', pi1.paymentIntent.amount_authorized_cents === order1.total_cents)
  assert('payment intent starts requires_customer_action', pi1.paymentIntent.payment_state === 'requires_customer_action')
  assert('client secret returned to client (never a secret key)', pi1.clientSecret && pi1.clientSecret.includes('_secret_'))

  // ── duplicate payment-intent request (same idempotency key) ──
  const dupKey = `pi-dup-${Math.random()}`
  const dupA = await paymentService.createPaymentIntentForOrder(venueId, order1.order_id, custRef1, { idempotencyKey: dupKey, adapter })
  assert('first dup-key call returns real intent (dedup by order re-use)', !!dupA.paymentIntent)
  const dupB = await paymentService.createPaymentIntentForOrder(venueId, order1.order_id, custRef1, { idempotencyKey: dupKey, adapter })
  assert('duplicate payment-intent request deduplicated, not a second PaymentIntent', dupB.deduplicated === true && dupB.paymentIntent.payment_intent_id === dupA.paymentIntent.payment_intent_id)

  // ── cross-customer denial ──
  let crossCustomerDenied = false
  try { await paymentService.createPaymentIntentForOrder(venueId, order1.order_id, 'user:someone-else', { idempotencyKey: `pi-x-${Math.random()}`, adapter }) }
  catch (err) { crossCustomerDenied = err.code === 'order_not_owned' }
  assert('cross-customer payment-intent creation denied', crossCustomerDenied)

  // ── cross-venue denial ──
  let crossVenueDenied = false
  try { await paymentService.createPaymentIntentForOrder(otherVenueId, order1.order_id, custRef1, { idempotencyKey: `pi-xv-${Math.random()}`, adapter }) }
  catch (err) { crossVenueDenied = err.code === 'order_not_found' }
  assert('cross-venue payment-intent creation denied', crossVenueDenied)

  // ── webhook: invalid signature rejected ──
  let invalidSigRejected = false
  try { await paymentService.handleStripeWebhook(Buffer.from('{}'), 'wrong-signature', { adapter }) }
  catch (err) { invalidSigRejected = err.code === 'invalid_webhook_signature' }
  assert('invalid webhook signature rejected, never processed', invalidSigRejected)

  // ── webhook: payment succeeded → order completed, inventory decremented ──
  const providerPi = pi1.paymentIntent.provider_payment_intent_id
  const beforeQty = Number(psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${productId}'`))
  const succeededEvent = fakeEvent('payment_intent.succeeded', { id: providerPi, amount_received: order1.total_cents })
  const webhookResult1 = await paymentService.handleStripeWebhook(Buffer.from(JSON.stringify(succeededEvent)), 'valid-test-signature', { adapter })
  assert('payment_intent.succeeded webhook processed', webhookResult1.deduplicated === false)
  const afterOrder = psql(`SELECT status FROM venue_cigar_orders WHERE order_id = '${order1.order_id}'`)
  assert('order transitioned to completed by verified webhook (never client-declared)', afterOrder === 'completed')
  const afterQty = Number(psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${productId}'`))
  assert('inventory decremented via canonical inventoryService exactly once', afterQty === beforeQty - 1)
  const piState = psql(`SELECT payment_state FROM venue_cigar_payment_intents WHERE provider_payment_intent_id = '${providerPi}'`)
  assert('payment_state transitioned to paid', piState === 'paid')

  // ── duplicate webhook (same event id) → safe no-op, no double decrement ──
  const dupWebhook = await paymentService.handleStripeWebhook(Buffer.from(JSON.stringify(succeededEvent)), 'valid-test-signature', { adapter })
  assert('duplicate webhook (same event id) deduplicated', dupWebhook.deduplicated === true)
  const afterQty2 = Number(psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${productId}'`))
  assert('inventory NOT decremented twice by duplicate webhook', afterQty2 === afterQty)

  // ── out-of-order webhook (a "processing" event arriving after "succeeded") ──
  const outOfOrderEvent = fakeEvent('payment_intent.processing', { id: providerPi })
  const oooResult = await paymentService.handleStripeWebhook(Buffer.from(JSON.stringify(outOfOrderEvent)), 'valid-test-signature', { adapter })
  assert('out-of-order webhook safely ignored (already paid)', oooResult.result.ignored === true)
  const piStateAfterOoo = psql(`SELECT payment_state FROM venue_cigar_payment_intents WHERE provider_payment_intent_id = '${providerPi}'`)
  assert('payment_state not regressed by out-of-order webhook', piStateAfterOoo === 'paid')

  // ══════════════════ Payment failure → hold release ═══════════════════
  const order2 = await createRealOrder(client1)
  const pi2 = await paymentService.createPaymentIntentForOrder(venueId, order2.order_id, order2.customer_reference, { idempotencyKey: `pi2-${Math.random()}`, adapter })
  const failedEvent = fakeEvent('payment_intent.payment_failed', { id: pi2.paymentIntent.provider_payment_intent_id, last_payment_error: { code: 'card_declined', message: 'Your card was declined.' } })
  await paymentService.handleStripeWebhook(Buffer.from(JSON.stringify(failedEvent)), 'valid-test-signature', { adapter })
  const order2Status = psql(`SELECT status FROM venue_cigar_orders WHERE order_id = '${order2.order_id}'`)
  assert('failed payment cancels order and releases hold', order2Status === 'cancelled')
  const pi2State = psql(`SELECT payment_state FROM venue_cigar_payment_intents WHERE payment_intent_id = '${pi2.paymentIntent.payment_intent_id}'`)
  assert('payment_state transitioned to failed', pi2State === 'failed')
  const holdStatus = psql(`SELECT status FROM venue_cigar_inventory_holds WHERE hold_id = '${order2.hold_id}'`)
  assert('hold released after payment failure (available again)', holdStatus === 'released')

  // ══════════════════ Oversell prevention ═══════════════════
  const availBefore = Number(psql(`SELECT physical_quantity - unavailable_quantity - COALESCE((SELECT SUM(quantity) FROM venue_cigar_inventory_holds WHERE product_id='${productId}' AND status IN ('active','converted')),0) FROM venue_cigar_products WHERE product_id = '${productId}'`))
  // box-hold (unlike stick-hold, always 1) accepts a real client-supplied
  // quantity — the correct real-world oversell-prevention surface.
  const overHold = await client1.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${productId}/box-hold`, { quantity: availBefore + 1000, idempotencyKey: `over-${Math.random()}` })
  assert('oversell prevented at hold creation (insufficient_inventory)', overHold.status !== 200 || overHold.body.success === false)

  // ══════════════════ Refunds ═══════════════════
  const refundIdemKey = `refund-${Math.random()}`
  const refund1 = await paymentService.refundPayment(venueId, order1.order_id, 'staff-test-1', { idempotencyKey: refundIdemKey, reason: 'requested_by_customer', adapter })
  assert('full refund succeeds', refund1.refund.status === 'succeeded')
  const refundedPiState = psql(`SELECT payment_state FROM venue_cigar_payment_intents WHERE order_id = '${order1.order_id}'`)
  assert('payment_state transitioned to refunded', refundedPiState === 'refunded')

  // duplicate refund (same idempotency key) → no second refund
  const refund1dup = await paymentService.refundPayment(venueId, order1.order_id, 'staff-test-1', { idempotencyKey: refundIdemKey, reason: 'requested_by_customer', adapter })
  assert('duplicate refund request deduplicated', refund1dup.deduplicated === true)

  // refund exceeding remaining amount rejected
  let overRefundRejected = false
  try { await paymentService.refundPayment(venueId, order1.order_id, 'staff-test-1', { idempotencyKey: `refund-over-${Math.random()}`, amountCents: 999999, adapter }) }
  catch (err) { overRefundRejected = err.code === 'refund_amount_exceeds_remaining' || err.code === 'payment_not_refundable' }
  assert('refund exceeding remaining amount rejected', overRefundRejected)

  // ── partial refund on a fresh paid order ──
  const order3 = await createRealOrder(client1)
  const pi3 = await paymentService.createPaymentIntentForOrder(venueId, order3.order_id, order3.customer_reference, { idempotencyKey: `pi3-${Math.random()}`, adapter })
  await paymentService.handleStripeWebhook(Buffer.from(JSON.stringify(fakeEvent('payment_intent.succeeded', { id: pi3.paymentIntent.provider_payment_intent_id, amount_received: order3.total_cents }))), 'valid-test-signature', { adapter })
  const partialAmount = Math.floor(order3.total_cents / 2)
  const partialRefund = await paymentService.refundPayment(venueId, order3.order_id, 'staff-test-1', { idempotencyKey: `refund-partial-${Math.random()}`, amountCents: partialAmount, adapter })
  assert('partial refund succeeds with correct amount', partialRefund.refund.amount_cents === partialAmount)
  const partialState = psql(`SELECT payment_state FROM venue_cigar_payment_intents WHERE order_id = '${order3.order_id}'`)
  assert('payment_state transitioned to partially_refunded', partialState === 'partially_refunded')

  // ══════════════════ Cancellation (before payment) ═══════════════════
  const order4 = await createRealOrder(client1)
  const cancelResp = await client1.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/orders/${order4.order_id}/cancel`, { idempotencyKey: `cancel-${Math.random()}`, reason: 'customer_requested' })
  assert('cancel-before-payment succeeds', cancelResp.status === 200 && cancelResp.body.order.status === 'cancelled')

  // ══════════════════ Reconciliation ═══════════════════
  const order5 = await createRealOrder(client1)
  const pi5 = await paymentService.createPaymentIntentForOrder(venueId, order5.order_id, order5.customer_reference, { idempotencyKey: `pi5-${Math.random()}`, adapter })
  // Simulate the provider having actually succeeded without a webhook
  // ever arriving (the exact scenario reconciliation exists for).
  fakeStripe.__intents.get(pi5.paymentIntent.provider_payment_intent_id).status = 'succeeded'
  fakeStripe.__intents.get(pi5.paymentIntent.provider_payment_intent_id).amount_received = order5.total_cents
  psql(`UPDATE venue_cigar_payment_intents SET created_at = now() - interval '10 minutes' WHERE payment_intent_id = '${pi5.paymentIntent.payment_intent_id}'`)
  const reconRun = await paymentService.runReconciliation({ triggeredBy: 'manual_admin', staffId: 'staff-test-1', adapter })
  assert('reconciliation finds and repairs stale local state', reconRun.discrepancies_repaired >= 1)
  const order5StatusAfter = psql(`SELECT status FROM venue_cigar_orders WHERE order_id = '${order5.order_id}'`)
  assert('reconciliation repair completes the order via the same canonical path', order5StatusAfter === 'completed')
  // Re-run reconciliation — must be a safe no-op (no duplicate inventory effect)
  const qtyAfterRecon = Number(psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${productId}'`))
  await paymentService.runReconciliation({ triggeredBy: 'manual_admin', staffId: 'staff-test-1', adapter })
  const qtyAfterReconAgain = Number(psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${productId}'`))
  assert('repeated reconciliation has no duplicate inventory effect', qtyAfterRecon === qtyAfterReconAgain)

  // ══════════════════ Dispute recording ═══════════════════
  const disputeEvent = fakeEvent('charge.dispute.created', { id: 'dp_fake_1', payment_intent: providerPi, amount: 1302, reason: 'fraudulent' })
  await paymentService.handleStripeWebhook(Buffer.from(JSON.stringify(disputeEvent)), 'valid-test-signature', { adapter })
  const disputeRow = psql(`SELECT status FROM venue_cigar_payment_disputes WHERE provider_dispute_id = 'dp_fake_1'`)
  assert('dispute recorded on webhook', disputeRow === 'opened')
  const piDisputedState = psql(`SELECT payment_state FROM venue_cigar_payment_intents WHERE provider_payment_intent_id = '${providerPi}'`)
  assert('payment_state reflects disputed', piDisputedState === 'disputed')

  // ══════════════════ Receipt / audit ═══════════════════
  const receipt = await client1.get(`/api/smokecraft/venue-humidor/customer/orders/${order3.order_id}/receipt`)
  assert('receipt available after paid+completed order', receipt.status === 200 && receipt.body.success !== false)
  const auditCount = Number(psql(`SELECT COUNT(*) FROM smokecraft_progression_events WHERE event_type LIKE 'venue_humidor_payment%' AND payload->>'orderId' = '${order1.order_id}'`))
  assert('payment audit events recorded', auditCount >= 1)

  console.log(`\n=== ${pass} passed, ${fail} failed ===\n`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error('FATAL', err); process.exit(1) })
