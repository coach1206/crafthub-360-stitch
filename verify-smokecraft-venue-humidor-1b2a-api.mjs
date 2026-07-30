#!/usr/bin/env node
/**
 * Venue Humidor 1B-2A — checkout, order creation, and hold conversion
 * tests against the real running server, zero mocking.
 */
import http from 'http'
import 'dotenv/config'
import { execSync } from 'child_process'

const HOST = 'localhost'
const PORT = 3001
let pass = 0, fail = 0
const results = []
function assert(name, cond, detail) {
  if (cond) { pass++; results.push({ name, ok: true }); console.log(`  PASS  ${name}`) }
  else { fail++; results.push({ name, ok: false, detail }); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
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
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b) }
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()

  const venueId = 'vh-seed-venue-alpha'
  const otherVenueId = 'vh-seed-venue-bravo'
  const productId = psql(`SELECT product_id FROM venue_cigar_products WHERE venue_id = '${venueId}' AND sku = 'ALPHA-001'`)

  // Reset the shared seed product's inventory/holds/orders before this
  // run — this suite creates real holds/orders against it, so
  // repeated runs would otherwise accumulate.
  psql(`DELETE FROM venue_cigar_order_items WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_orders WHERE venue_id = '${venueId}' AND product_snapshot->>'name' = 'ALPHA Robusto'`)
  psql(`UPDATE venue_cigar_products SET physical_quantity = 40 WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_inventory_holds WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_inventory_events WHERE product_id = '${productId}'`)

  const customer = makeClient()
  await customer.get('/api/smokecraft/venue-humidor/customer/venues/' + venueId) // establishes guest identity
  const admin = makeClient()
  await admin.post('/api/auth/admin-login', { email: 'admin@novee.dev', pin: '9999' })

  async function newHold() {
    const h = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${productId}/stick-hold`, { idempotencyKey: `vh1b2a-hold-${Date.now()}-${Math.random()}` })
    return h.body.hold.hold_id
  }

  console.log('\n── 1. Valid checkout quote (server-authoritative) ──')
  const hold1 = await newHold()
  const quote1 = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/quote`, { holdId: hold1 })
  assert('Quote succeeds for a valid, owned, active hold', quote1.status === 200)
  assert('Quote subtotal is the real server-computed price × quantity (1200 cents)', quote1.body.quote.subtotalCents === 1200)
  assert('Quote reports the real hold expiration', !!quote1.body.quote.holdExpiresAt)
  assert('Quote reports honest payment unavailability', quote1.body.quote.paymentAvailable === false && quote1.body.quote.paymentNote === 'Payment processing not connected')
  assert('Quote reports age-verification requirement honestly', quote1.body.quote.ageVerificationRequired === true)
  assert('Quote reports real fulfillment options from venue config', quote1.body.quote.fulfillmentOptions.counter_pickup === true && quote1.body.quote.fulfillmentOptions.pos_tab_existing === false)

  console.log('\n── 2. Fabricated client price/tax ignored ──')
  const fabricatedOrder = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, {
    holdId: hold1, fulfillmentMethod: 'counter_pickup', ageVerified: true, idempotencyKey: `vh1b2a-order-fab-${Date.now()}`,
    subtotalCents: 1, taxCents: 0, totalCents: 1, price: 0.01,
  })
  assert('Order creation succeeds despite the fabricated price fields (they are ignored)', fabricatedOrder.status === 200)
  assert('The real server-computed subtotal (1200) is persisted, never the fabricated value (1)', Number(fabricatedOrder.body.order.subtotal_cents) === 1200)

  console.log('\n── 3. Stale/expired/wrong-user/wrong-venue hold rejected ──')
  const staleHold = await newHold()
  await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/holds/${staleHold}/nonexistent`, {}) // no-op, just ensures hold exists
  psql(`UPDATE venue_cigar_inventory_holds SET status = 'released' WHERE hold_id = '${staleHold}'`)
  const staleQuote = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/quote`, { holdId: staleHold })
  assert('A stale (non-active) hold is rejected with a real 409', staleQuote.status === 409 && staleQuote.body.error.startsWith('stale_hold'))

  const expiredHold = await newHold()
  psql(`UPDATE venue_cigar_inventory_holds SET expires_at = now() - interval '1 minute' WHERE hold_id = '${expiredHold}'`)
  const expiredQuote = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/quote`, { holdId: expiredHold })
  assert('An expired hold is rejected with a real 409', expiredQuote.status === 409 && expiredQuote.body.error === 'expired_hold')

  const stranger = makeClient()
  await stranger.get('/api/smokecraft/venue-humidor/customer/venues/' + venueId)
  const hold2 = await newHold()
  const wrongUserQuote = await stranger.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/quote`, { holdId: hold2 })
  assert('A hold owned by a different guest is denied with a real 403', wrongUserQuote.status === 403 && wrongUserQuote.body.error === 'wrong_user_hold')

  const hold3 = await newHold()
  const wrongVenueQuote = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${otherVenueId}/checkout/quote`, { holdId: hold3 })
  assert('A hold requested under the wrong venue is denied with a real 403', wrongVenueQuote.status === 403 && wrongVenueQuote.body.error === 'wrong_venue_hold')

  console.log('\n── 4. Duplicate order creation / rapid double-click / two-tab race ──')
  const hold4 = await newHold()
  const dupKey = `vh1b2a-dup-${Date.now()}`
  const firstOrder = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold4, fulfillmentMethod: 'counter_pickup', ageVerified: true, idempotencyKey: dupKey })
  const secondOrder = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold4, fulfillmentMethod: 'counter_pickup', ageVerified: true, idempotencyKey: dupKey })
  assert('A repeated order-creation call with the same idempotency key returns the identical original order, never a duplicate', secondOrder.body.order.order_id === firstOrder.body.order.order_id)

  const hold5 = await newHold()
  const raceKey = `vh1b2a-race-${Date.now()}`
  const [raceA, raceB] = await Promise.all([
    customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold5, fulfillmentMethod: 'counter_pickup', ageVerified: true, idempotencyKey: raceKey }),
    customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold5, fulfillmentMethod: 'counter_pickup', ageVerified: true, idempotencyKey: raceKey }),
  ])
  assert('Both concurrent order-creation requests resolve to the SAME real order (no crash, no duplicate)', raceA.status === 200 && raceB.status === 200 && raceA.body.order.order_id === raceB.body.order.order_id)
  const raceOrderCount = psql(`SELECT count(*) FROM venue_cigar_orders WHERE hold_id = '${hold5}'`)
  assert('Exactly one real order row exists despite the two-tab race', raceOrderCount === '1')

  console.log('\n── 5. Pending-payment order state ──')
  assert('A freshly created order starts in pending_payment / pending_staff_confirmation, never marked paid', firstOrder.body.order.status === 'pending_payment' && firstOrder.body.order.payment_status === 'pending_staff_confirmation')

  console.log('\n── 6. Unsupported payment/POS boundary ──')
  const hold6 = await newHold()
  const posOrder = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold6, fulfillmentMethod: 'pos_tab_new', ageVerified: true, idempotencyKey: `vh1b2a-pos-${Date.now()}` })
  assert('Creating an order with an unsupported fulfillment method (new POS tab) is honestly rejected, never fabricated', posOrder.status === 409 && posOrder.body.error === 'unsupported_fulfillment_method')

  console.log('\n── 7. Age verification required ──')
  const hold7 = await newHold()
  const noAgeOrder = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold7, fulfillmentMethod: 'counter_pickup', ageVerified: false, idempotencyKey: `vh1b2a-noage-${Date.now()}` })
  assert('Order creation without age verification is honestly rejected', noAgeOrder.status === 400 && noAgeOrder.body.error === 'age_verification_required')

  console.log('\n── 8. Staff-confirmed completion, inventory deducted exactly once ──')
  const beforeComplete = await customer.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog/${productId}`)
  const qtyBefore = beforeComplete.body.product.availability.availableQuantity
  const completeKey = `vh1b2a-complete-${Date.now()}`
  const complete1 = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueId}/orders/${firstOrder.body.order.order_id}/complete`, { idempotencyKey: completeKey })
  assert('Staff-authorized completion succeeds', complete1.status === 200 && complete1.body.order.status === 'completed')
  const complete2 = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueId}/orders/${firstOrder.body.order.order_id}/complete`, { idempotencyKey: `vh1b2a-complete-different-${Date.now()}` })
  assert('A repeated completion call returns the identical original completed order, never re-deducts', complete2.body.order.completed_at === complete1.body.order.completed_at)
  const afterComplete = await customer.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog/${productId}`)
  const qtyAfter = afterComplete.body.product.availability.availableQuantity
  assert('Physical inventory decreased by exactly the ordered quantity (1), not zero and not twice', qtyBefore - qtyAfter === 1)

  console.log('\n── 9. Unauthorized (non-staff) completion denied ──')
  const hold8 = await newHold()
  const order8 = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold8, fulfillmentMethod: 'counter_pickup', ageVerified: true, idempotencyKey: `vh1b2a-order8-${Date.now()}` })
  const unauthorizedComplete = await customer.post(`/api/smokecraft/venue-humidor/venues/${venueId}/orders/${order8.body.order.order_id}/complete`, { idempotencyKey: `vh1b2a-unauth-${Date.now()}` })
  assert('A customer (non-staff) cannot complete an order themselves', unauthorizedComplete.status === 403)

  console.log('\n── 10. Failed completion preserves inventory ──')
  const preFailQty = (await customer.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog/${productId}`)).body.product.availability.availableQuantity
  const doubleCompleteAttempt = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueId}/orders/${complete1.body.order.order_id}/complete`, { idempotencyKey: `vh1b2a-doublecomplete-${Date.now()}` })
  assert('Attempting to complete an already-completed order is idempotent, never double-deducts', doubleCompleteAttempt.body.deduplicated === true)
  const postFailQty = (await customer.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog/${productId}`)).body.product.availability.availableQuantity
  assert('Inventory is unchanged after the idempotent re-completion attempt', preFailQty === postFailQty)

  console.log('\n── 11. Cancellation releases hold (pending order, never deducted) ──')
  const hold9 = await newHold()
  const order9 = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold9, fulfillmentMethod: 'counter_pickup', ageVerified: true, idempotencyKey: `vh1b2a-order9-${Date.now()}` })
  const qtyBeforeCancel = (await customer.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog/${productId}`)).body.product.availability.availableQuantity
  const cancel9 = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/orders/${order9.body.order.order_id}/cancel`, { idempotencyKey: `vh1b2a-cancel9-${Date.now()}` })
  assert('Customer cancellation of a pending order succeeds', cancel9.status === 200 && cancel9.body.order.status === 'cancelled')
  const qtyAfterCancel = (await customer.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog/${productId}`)).body.product.availability.availableQuantity
  assert('Available quantity is restored (hold released) after cancelling a pending order', qtyAfterCancel === qtyBeforeCancel + 1)

  console.log('\n── 12. Duplicate cancellation ──')
  const dupCancel = await customer.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/orders/${order9.body.order.order_id}/cancel`, { idempotencyKey: `vh1b2a-cancel9-dup-${Date.now()}` })
  assert('A repeated cancellation of an already-cancelled order is idempotent, never errors or double-restores', dupCancel.body.deduplicated === true)

  console.log('\n── 13. Order confirmation / cross-device consistency ──')
  const orderView1 = await customer.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/orders/${complete1.body.order.order_id}`)
  assert('Order confirmation loads real server data including real total and status', orderView1.body.order.status === 'completed' && Number(orderView1.body.order.total_cents) === firstOrder.body.order.total_cents)
  const orderView2 = await customer.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/orders/${complete1.body.order.order_id}`)
  assert('A second independent read returns identical order state (cross-device consistency)', orderView2.body.order.order_id === orderView1.body.order.order_id && orderView2.body.order.status === orderView1.body.order.status)

  console.log('\n── 14. Canonical events ──')
  const eventsJson = psql(`SELECT json_agg(json_build_object('event_type', event_type) ORDER BY created_at) FROM smokecraft_progression_events WHERE payload->>'orderId' = '${firstOrder.body.order.order_id}'`)
  const events = JSON.parse(eventsJson) || []
  const types = events.map(e => e.event_type)
  assert('venue_humidor_order_created, _payment_pending, _hold_converted, and _order_completed were all emitted for the completed order', ['venue_humidor_order_created', 'venue_humidor_payment_pending', 'venue_humidor_hold_converted', 'venue_humidor_order_completed'].every(t => types.includes(t)))

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-2a', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-2a/01-checkout-order-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
