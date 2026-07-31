#!/usr/bin/env node
/**
 * Venue Humidor 1B-2B-6 — one complete live vertical-slice closure run
 * against the real running server, zero mocking. Covers the mandate's
 * §24 required live-verification list: full customer flow, full staff
 * flow, cancellation, expiration, blocked/unblocked, no-show,
 * cross-venue denial, cross-customer denial, concurrent completion,
 * duplicate idempotency, stale-inventory recommendation, historical
 * price preservation, Passport exactly-once.
 */
import http from 'http'
import 'dotenv/config'
import fs from 'fs'
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
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b), patch: (p, b) => request('PATCH', p, b) }
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }
const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()

  const admin = makeClient()
  await admin.post('/api/auth/admin-login', { email: 'admin@novee.dev', pin: '9999' })
  const manager = makeClient()
  const managerLogin = await manager.post('/api/auth/admin-login', { email: 'manager@novee.dev', pin: '5678' })
  const managerId = managerLogin.body.data.userId
  const staff = makeClient()
  const staffLogin = await staff.post('/api/auth/staff-pin-login', { pin: '1234' })
  const staffId = staffLogin.body.data.userId

  const venueA = psql(`INSERT INTO venues (venue_id, name, venue_type, status, city) VALUES ('vh1b2b6-closure-a-${Date.now()}', 'VH1B2B6 Closure Venue A', 'cigar_lounge', 'active', 'Testville') RETURNING venue_id`)
  const venueB = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b6-closure-b-${Date.now()}', 'VH1B2B6 Closure Venue B', 'cigar_lounge', 'active') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueA}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${staffId}', '${venueA}', 'staff', 'active') ON CONFLICT DO NOTHING`)

  async function createProduct(venueId, overrides = {}) {
    const sku = `VH1B2B6-${rid()}`
    const created = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/products`, { sku, name: `Closure Cigar ${sku}`, priceCents: 2000, initialQuantity: 25, country: 'Nicaragua', strength: 'medium', body: 'medium', vitola: 'Robusto', ...overrides })
    return created.body.product
  }

  async function orderToReady(venueId, productId) {
    const guest = makeClient()
    await guest.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}`)
    const hold = await guest.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${productId}/stick-hold`, { idempotencyKey: `vh1b2b6-hold-${rid()}` })
    const order = await guest.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold.body.hold.hold_id, fulfillmentMethod: 'counter_pickup', fulfillmentDetails: {}, customerNotes: '', ageVerified: true, idempotencyKey: `vh1b2b6-order-${rid()}` })
    const orderId = order.body.order.order_id
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/claim`, { idempotencyKey: `vh1b2b6-claim-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/confirm`, { idempotencyKey: `vh1b2b6-confirm-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/prepare`, { idempotencyKey: `vh1b2b6-prepare-${rid()}` })
    const detail = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}`)
    for (const item of detail.body.order.items) {
      await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/items/${item.order_item_id}/pick`, { idempotencyKey: `vh1b2b6-pick-${rid()}-${item.order_item_id}` })
    }
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/ready`, { idempotencyKey: `vh1b2b6-ready-${rid()}` })
    return { guest, productId, orderId }
  }

  async function completeReadyOrder(venueId, orderId, idempotencyKey) {
    const gen = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/verification-code`, { idempotencyKey: `vh1b2b6-gen-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/verify`, { code: gen.body.code, idempotencyKey: `vh1b2b6-verify-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/handoff`, { verificationMethod: 'pickup_code', idempotencyKey: `vh1b2b6-handoff-${rid()}` })
    return staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/complete`, { idempotencyKey: idempotencyKey || `vh1b2b6-complete-${rid()}` })
  }

  console.log('\n── 1. Full customer + staff end-to-end flow (browse → recommend → checkout → fulfill → history → receipt → Passport → reorder) ──')
  const cigar1 = await createProduct(venueA, { name: 'E2E Flagship Cigar' })
  const catalog = await makeClient().get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}`)
  assert('Customer can browse real venue catalog', catalog.status === 200)
  const ctx1 = await orderToReady(venueA, cigar1.product_id)
  const rec1 = await ctx1.guest.post(`/api/smokecraft/venue-humidor/customer/recommendations`, { venueId: venueA, preferences: {}, idempotencyKey: `e2e-rec-${rid()}` })
  assert('Recommendations available mid-flow', rec1.status === 200)
  await completeReadyOrder(venueA, ctx1.orderId)
  const history = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders`)
  assert('Completed order appears in customer order history', history.body.orders.some(o => o.order_id === ctx1.orderId))
  const receipt = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}/receipt`)
  assert('Receipt reflects the completed sale', receipt.status === 200 && receipt.body.receipt.isCompletedSale === true)
  const acquisitions = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/passport/acquisitions`)
  assert('Passport acquisition recorded exactly once for the completed order', acquisitions.body.acquisitions.filter(a => a.order_id === ctx1.orderId).length === 1)
  const detail = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}`)
  assert('Reorder eligibility reported honestly on order detail', typeof detail.body.order.items[0].reorderEligible === 'boolean')

  console.log('\n── 2. Cancellation flow ──')
  const cigar2 = await createProduct(venueA, { name: 'Cancel Flow Cigar' })
  const ctx2 = await orderToReady(venueA, cigar2.product_id)
  const cancelRes = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx2.orderId}/cancel`, { reason: 'closure-test', idempotencyKey: `vh1b2b6-cancel-${rid()}` })
  assert('Cancellation succeeds through checkoutService.cancelOrder()', cancelRes.status === 200)
  const acqAfterCancel = await ctx2.guest.get(`/api/smokecraft/venue-humidor/customer/passport/acquisitions`)
  assert('No Passport acquisition created for a cancelled order', !acqAfterCancel.body.acquisitions.some(a => a.order_id === ctx2.orderId))
  const receiptAfterCancel = await ctx2.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx2.orderId}/receipt`)
  assert('Cancelled order receipt does not present as a completed sale', receiptAfterCancel.body.receipt?.isCompletedSale !== true)

  console.log('\n── 3. Expiration flow ──')
  const cigar3 = await createProduct(venueA, { name: 'Expire Flow Cigar' })
  const ctx3 = await orderToReady(venueA, cigar3.product_id)
  const expireRes = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx3.orderId}/expire`, { reason: 'closure-test', idempotencyKey: `vh1b2b6-expire-${rid()}` })
  assert('Manager can expire an eligible ready order', expireRes.status === 200)
  const acqAfterExpire = await ctx3.guest.get(`/api/smokecraft/venue-humidor/customer/passport/acquisitions`)
  assert('No Passport acquisition created for an expired order', !acqAfterExpire.body.acquisitions.some(a => a.order_id === ctx3.orderId))

  console.log('\n── 4. Blocked / unblocked flow ──')
  const cigar4 = await createProduct(venueA, { name: 'Block Flow Cigar' })
  const ctx4 = await orderToReady(venueA, cigar4.product_id)
  const blockRes = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx4.orderId}/block`, { reason: 'closure-test', idempotencyKey: `vh1b2b6-block-${rid()}` })
  assert('Staff can block a ready order', blockRes.status === 200)
  const completeBlocked = await completeReadyOrder(venueA, ctx4.orderId)
  assert('A blocked order cannot be completed', completeBlocked.status !== 200)
  const staffUnblock = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx4.orderId}/unblock`, { idempotencyKey: `vh1b2b6-unblock-staff-${rid()}` })
  assert('Staff (non-full-access) is denied unblocking', staffUnblock.status === 403)
  const managerUnblock = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx4.orderId}/unblock`, { idempotencyKey: `vh1b2b6-unblock-mgr-${rid()}` })
  assert('Manager (full-access) can unblock', managerUnblock.status === 200)

  console.log('\n── 5. No-show flow ──')
  const cigar5 = await createProduct(venueA, { name: 'No-Show Flow Cigar' })
  const ctx5 = await orderToReady(venueA, cigar5.product_id)
  const noShowRes = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx5.orderId}/no-show`, { notes: 'closure-test', idempotencyKey: `vh1b2b6-noshow-${rid()}` })
  assert('Staff can mark a ready order no-show', noShowRes.status === 200)

  console.log('\n── 6. Cross-venue denial ──')
  const otherStaff = makeClient()
  await otherStaff.post('/api/auth/staff-pin-login', { pin: '1234' })
  const crossVenueRead = await otherStaff.get(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders`)
  assert('Staff without membership in venue B is denied reading its order queue', crossVenueRead.status === 403)
  const cigarB = await createProduct(venueB, { name: 'Venue B Cigar' })
  const crossVenueOrderRead = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders/${ctx5.orderId}`)
  assert('A venue A order id cannot be read through venue B\'s admin path', crossVenueOrderRead.status === 403 || crossVenueOrderRead.status === 404)

  console.log('\n── 7. Cross-customer denial ──')
  const stranger = makeClient()
  await stranger.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}`)
  const strangerOrderRead = await stranger.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}`)
  assert('A different customer cannot read this order', strangerOrderRead.status === 403)
  const strangerReceiptRead = await stranger.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}/receipt`)
  assert('A different customer cannot read this receipt', strangerReceiptRead.status === 403)

  console.log('\n── 8. Concurrent completion attempt (exactly-once) ──')
  const cigar6 = await createProduct(venueA, { name: 'Concurrency Cigar', initialQuantity: 5 })
  const ctx6 = await orderToReady(venueA, cigar6.product_id)
  const sharedKey = `vh1b2b6-concurrent-${rid()}`
  const gen6 = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx6.orderId}/verification-code`, { idempotencyKey: `vh1b2b6-gen6-${rid()}` })
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx6.orderId}/verify`, { code: gen6.body.code, idempotencyKey: `vh1b2b6-verify6-${rid()}` })
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx6.orderId}/handoff`, { verificationMethod: 'pickup_code', idempotencyKey: `vh1b2b6-handoff6-${rid()}` })
  const [c1, c2, c3] = await Promise.all([
    staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx6.orderId}/complete`, { idempotencyKey: sharedKey }),
    staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx6.orderId}/complete`, { idempotencyKey: sharedKey }),
    staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx6.orderId}/complete`, { idempotencyKey: sharedKey }),
  ])
  assert('All three concurrent completion calls (shared idempotency key) succeed without error', [c1, c2, c3].every(r => r.status === 200))
  const acqCount6 = psql(`SELECT COUNT(*) FROM venue_cigar_passport_acquisitions WHERE order_id = '${ctx6.orderId}'`)
  assert('Exactly one Passport acquisition exists after 3 concurrent completion calls', acqCount6 === '1')
  const eventCount6 = psql(`SELECT COUNT(*) FROM venue_cigar_inventory_events WHERE reference_id = '${ctx6.orderId}' AND event_type = 'sale_completed'`)
  assert('Inventory was deducted exactly once (single sale_completed event) despite 3 concurrent calls', eventCount6 === '1')

  console.log('\n── 9. Duplicate idempotency attempt (sequential retry) ──')
  const cigar7 = await createProduct(venueA, { name: 'Idempotency Retry Cigar' })
  const ctx7 = await orderToReady(venueA, cigar7.product_id)
  const retryKey = `vh1b2b6-retry-${rid()}`
  const complete7a = await completeReadyOrder(venueA, ctx7.orderId, retryKey)
  const complete7b = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx7.orderId}/complete`, { idempotencyKey: retryKey })
  assert('A retried completion with the same idempotency key is a safe no-op', complete7a.status === 200 && complete7b.status === 200)
  const acqCount7 = psql(`SELECT COUNT(*) FROM venue_cigar_passport_acquisitions WHERE order_id = '${ctx7.orderId}'`)
  assert('Exactly one Passport acquisition after a duplicate completion retry', acqCount7 === '1')

  console.log('\n── 10. Stale-inventory recommendation attempt ──')
  const cigar8 = await createProduct(venueA, { name: 'Stale Rec Cigar', initialQuantity: 1 })
  const guest8 = makeClient()
  await guest8.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}`)
  const rec8a = await guest8.post(`/api/smokecraft/venue-humidor/customer/recommendations`, { venueId: venueA, preferences: {}, idempotencyKey: `rec8a-${rid()}` })
  assert('Product initially appears eligible in recommendations', rec8a.body.results.some(r => r.productId === cigar8.product_id))
  psql(`UPDATE venue_cigar_products SET physical_quantity = 0 WHERE product_id = '${cigar8.product_id}'`)
  const staleHold = await guest8.post(`/api/smokecraft/venue-humidor/customer/venues/${venueA}/products/${cigar8.product_id}/stick-hold`, { idempotencyKey: `stale-hold-${rid()}` })
  assert('The canonical hold endpoint independently rejects the now-out-of-stock product regardless of a stale recommendation result', staleHold.status !== 200 && staleHold.status !== 201)

  console.log('\n── 11. Historical price preservation check ──')
  const originalPriceReceipt = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}/receipt`)
  const originalTotal = originalPriceReceipt.body.receipt.totalCents
  await admin.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${cigar1.product_id}/inventory-events`, { eventType: 'adjustment', quantityDelta: 0, reason: 'closure-price-test', idempotencyKey: `price-noop-${rid()}` }).catch(() => {})
  psql(`UPDATE venue_cigar_products SET price_cents = 999999 WHERE product_id = '${cigar1.product_id}'`)
  const afterPriceChangeReceipt = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}/receipt`)
  assert('Historical receipt total is unchanged after the current catalog price is mutated', afterPriceChangeReceipt.body.receipt.totalCents === originalTotal)

  console.log('\n── 12. Passport exactly-once check (final aggregate) ──')
  const allOrderIds = [ctx1.orderId, ctx6.orderId, ctx7.orderId]
  let allExactlyOne = true
  for (const oid of allOrderIds) {
    const c = psql(`SELECT COUNT(*) FROM venue_cigar_passport_acquisitions WHERE order_id = '${oid}'`)
    if (c !== '1') allExactlyOne = false
  }
  assert('Every completed order in this run has exactly one Passport acquisition row', allExactlyOne)

  console.log('\n── 13. Staff-assisted selling flow (final check) ──')
  const assistedRec = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/assisted-selling/recommendations`, { preferences: {} })
  assert('Staff-assisted selling recommendations succeed', assistedRec.status === 200)
  if (assistedRec.body.results.length) {
    const outcomeRes = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/assisted-selling/outcome`, { productId: assistedRec.body.results[0].productId, outcome: 'accepted', idempotencyKey: `closure-outcome-${rid()}` })
    assert('Assisted-selling outcome recorded', outcomeRes.status === 200)
  }

  console.log('\n── Summary ──')
  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-2b-6', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-2b-6/09-closure-live-verification-results.json', JSON.stringify({ pass, fail, results }, null, 2))
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
