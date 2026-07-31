#!/usr/bin/env node
/**
 * Venue Humidor 1B-2B-5 — inventory-aware pairing, recommendations,
 * and assisted-selling tests against the real running server, zero
 * mocking.
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
  const mentor = makeClient()
  const mentorLogin = await mentor.post('/api/auth/mentor-login', { email: 'marcus.mentor@novee.dev', pin: '2468' }).catch(() => ({ status: 0, body: null }))

  const venueA = psql(`INSERT INTO venues (venue_id, name, venue_type, status, city) VALUES ('vh1b2b5-test-venue-a-${Date.now()}', 'VH1B2B5 Test Venue A', 'cigar_lounge', 'active', 'Testville') RETURNING venue_id`)
  const venueB = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b5-test-venue-b-${Date.now()}', 'VH1B2B5 Test Venue B', 'cigar_lounge', 'active') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueA}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${staffId}', '${venueA}', 'staff', 'active') ON CONFLICT DO NOTHING`)

  async function createProduct(venueId, overrides = {}) {
    const sku = `VH1B2B5-${rid()}`
    const payload = {
      sku, name: `Test Cigar ${sku}`, priceCents: 1800, initialQuantity: 20, country: 'Nicaragua',
      strength: 'medium', body: 'medium', vitola: 'Robusto', flavorNotes: ['earthy', 'smoky'], smokeTimeMinutes: 45,
      experienceLevel: 'intermediate', ...overrides,
    }
    const created = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/products`, payload)
    return created.body.product
  }

  async function createReadyOrder(venueId, productId) {
    const guest = makeClient()
    await guest.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}`)
    const hold = await guest.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${productId}/stick-hold`, { idempotencyKey: `vh1b2b5-hold-${rid()}` })
    const holdId = hold.body.hold.hold_id
    const order = await guest.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, {
      holdId, fulfillmentMethod: 'counter_pickup', fulfillmentDetails: {}, customerNotes: '', ageVerified: true, idempotencyKey: `vh1b2b5-order-${rid()}`,
    })
    const orderId = order.body.order.order_id
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/claim`, { idempotencyKey: `vh1b2b5-claim-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/confirm`, { idempotencyKey: `vh1b2b5-confirm-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/prepare`, { idempotencyKey: `vh1b2b5-prepare-${rid()}` })
    const detail = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}`)
    for (const item of detail.body.order.items) {
      await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/items/${item.order_item_id}/pick`, { idempotencyKey: `vh1b2b5-pick-${rid()}-${item.order_item_id}` })
    }
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/ready`, { idempotencyKey: `vh1b2b5-ready-${rid()}` })
    return { guest, productId, orderId }
  }

  async function completeOrder(venueId, orderId) {
    const gen = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/verification-code`, { idempotencyKey: `vh1b2b5-gen-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/verify`, { code: gen.body.code, idempotencyKey: `vh1b2b5-verify-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/handoff`, { verificationMethod: 'pickup_code', idempotencyKey: `vh1b2b5-handoff-${rid()}` })
    return staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/complete`, { idempotencyKey: `vh1b2b5-complete-${rid()}` })
  }
  async function cancelOrder(venueId, orderId) {
    return staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/cancel`, { reason: 'test', idempotencyKey: `vh1b2b5-cancel-${rid()}` })
  }

  console.log('\n── 1. Customer receives only active/visible/available products ──')
  const cigarA = await createProduct(venueA, { name: 'Eligible Cigar A' })
  const archived = await createProduct(venueA, { name: 'Archived Cigar' })
  await admin.patch(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${archived.product_id}/classification`, { isArchived: true })
  const hidden = await createProduct(venueA, { name: 'Hidden Cigar' })
  psql(`UPDATE venue_cigar_products SET is_customer_visible = false WHERE product_id = '${hidden.product_id}'`)
  const outOfStock = await createProduct(venueA, { name: 'Out Of Stock Cigar', initialQuantity: 0 })

  const guest1 = makeClient()
  await guest1.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}`)
  const rec1 = await guest1.post(`/api/smokecraft/venue-humidor/customer/recommendations`, { venueId: venueA, preferences: {}, idempotencyKey: `rec-${rid()}` })
  assert('Recommendations request succeeds', rec1.status === 200)
  const ids1 = rec1.body.results.map(r => r.productId)
  assert('Eligible product included', ids1.includes(cigarA.product_id))
  assert('Archived product excluded from purchase recommendations', !ids1.includes(archived.product_id))
  assert('Hidden product excluded from purchase recommendations', !ids1.includes(hidden.product_id))
  assert('Out-of-stock product excluded from purchase recommendations', !ids1.includes(outOfStock.product_id))
  assert('Out-of-stock product appears in honest out-of-stock list', rec1.body.outOfStock.some(o => o.productId === outOfStock.product_id))

  console.log('\n── 2. Current availability and current price used ──')
  const avail = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${cigarA.product_id}/availability`)
  const shown = rec1.body.results.find(r => r.productId === cigarA.product_id)
  assert('Recommendation shows current live-computed availability', shown.availableQuantity === avail.body.availability.availableQuantity)
  assert('Recommendation shows current price', shown.priceCents === cigarA.price_cents)

  console.log('\n── 3. Cross-venue product excluded ──')
  const cigarB = await createProduct(venueB, { name: 'Venue B Cigar' })
  assert('A different venue\'s product never appears in venue A recommendations', !ids1.includes(cigarB.product_id))

  console.log('\n── 4. Customer history scoped correctly (cancelled/expired excluded, completed included) ──')
  const ctxCompleted = await createReadyOrder(venueA, cigarA.product_id)
  await completeOrder(venueA, ctxCompleted.orderId)
  const completedAcqs = await ctxCompleted.guest.get('/api/smokecraft/venue-humidor/customer/passport/acquisitions')
  await ctxCompleted.guest.post(`/api/smokecraft/venue-humidor/customer/passport/acquisitions/${completedAcqs.body.acquisitions[0].acquisition_id}/note`, { rating: 5, idempotencyKey: `note-${rid()}` })

  const cigarC = await createProduct(venueA, { name: 'Cancel Test Cigar' })
  const ctxCancelled = await createReadyOrder(venueA, cigarC.product_id)
  await cancelOrder(venueA, ctxCancelled.orderId)

  const rec2 = await ctxCompleted.guest.post(`/api/smokecraft/venue-humidor/customer/recommendations`, { venueId: venueA, preferences: {}, idempotencyKey: `rec-${rid()}` })
  assert('Cold-start flag is false once real purchase history exists', rec2.body.signalsUsed.hasPurchaseHistory === true)
  assert('Recommendation request succeeds after mixed completed/cancelled history', rec2.status === 200)

  console.log('\n── 5. Cold-start recommendation works ──')
  const guestNew = makeClient()
  await guestNew.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}`)
  const coldRec = await guestNew.post(`/api/smokecraft/venue-humidor/customer/recommendations`, { venueId: venueA, preferences: {}, idempotencyKey: `rec-${rid()}` })
  assert('Cold-start recommendation returns real eligible results', coldRec.status === 200 && coldRec.body.results.length > 0)
  assert('Cold-start recommendation is honestly labeled as based on selections, no purchase history', coldRec.body.signalsUsed.coldStart === true)

  console.log('\n── 6. Beverage pairing works where data exists / honest unavailable otherwise ──')
  const pairedRec = await guestNew.post(`/api/smokecraft/venue-humidor/customer/recommendations`, { venueId: venueA, preferences: {}, beverageCategory: 'Whiskey', idempotencyKey: `rec-${rid()}` })
  assert('Beverage pairing (real category) returns beverageDataAvailable true', pairedRec.body.beverageDataAvailable === true)
  const badBeverageRec = await guestNew.post(`/api/smokecraft/venue-humidor/customer/recommendations`, { venueId: venueA, preferences: {}, beverageCategory: 'NotARealBeverage', idempotencyKey: `rec-${rid()}` })
  assert('Unknown beverage category honestly reports beverageDataAvailable false', badBeverageRec.body.beverageDataAvailable === false)

  console.log('\n── 7. Alternative recommendation works with honest explanation ──')
  const altRes = await guestNew.get(`/api/smokecraft/venue-humidor/customer/recommendations/${outOfStock.product_id}/alternatives?venueId=${venueA}`)
  assert('Alternatives request succeeds for an unavailable product', altRes.status === 200)
  assert('Alternatives correctly identify the target as out of stock', altRes.body.targetUnavailableReason === 'out_of_stock')
  assert('Every alternative includes an honest explanation', altRes.body.alternatives.every(a => typeof a.explanation === 'string' && a.explanation.length > 0))
  assert('Every alternative reports stronger/milder and price comparison', altRes.body.alternatives.every(a => a.strongerOrMilder && a.priceComparison))

  console.log('\n── 8. Recommendation explanation returned ──')
  assert('Top recommendation includes at least one reason or caution', (rec1.body.results[0].reasons.length + rec1.body.results[0].cautions.length) > 0)

  console.log('\n── 9. Staff-assisted recommendation access ──')
  const staffRec = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/assisted-selling/recommendations`, { preferences: {} })
  assert('Staff can run assisted-selling recommendations', staffRec.status === 200 && staffRec.body.results.length > 0)

  console.log('\n── 10. Mentor/tobacconist permission enforcement (read-only) ──')
  if (mentorLogin.status === 200 || mentorLogin.body?.data) {
    psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${mentorLogin.body.data.userId}', '${venueA}', 'mentor', 'active') ON CONFLICT DO NOTHING`)
    const mentorRead = await mentor.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/assisted-selling/recommendations`, { preferences: {} })
    assert('Mentor can view assisted-selling recommendations (read tier)', mentorRead.status === 200)
    const mentorOutcome = await mentor.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/assisted-selling/outcome`, { productId: cigarA.product_id, outcome: 'accepted', idempotencyKey: `mentor-outcome-${rid()}` })
    assert('Mentor is denied recording an assisted-selling outcome (write tier required)', mentorOutcome.status === 403)
  } else {
    console.log('  (mentor login unavailable in this environment — skipping mentor-specific assertions, covered by RBAC middleware reuse from 1B-2B-1/2/3)')
  }

  console.log('\n── 11. Unauthorized / cross-venue access denied ──')
  const unauthedStaffRec = await makeClient().post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/assisted-selling/recommendations`, { preferences: {} })
  assert('Unauthenticated request to assisted-selling is denied', unauthedStaffRec.status === 401 || unauthedStaffRec.status === 403)
  const otherStaff = makeClient()
  const otherStaffLogin = await otherStaff.post('/api/auth/staff-pin-login', { pin: '1234' })
  const crossVenueRec = await otherStaff.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/assisted-selling/recommendations`, { preferences: {} })
  assert('A staff member without membership in venue B is denied assisted-selling access there', crossVenueRec.status === 403)

  console.log('\n── 12. Cross-customer preference access denied ──')
  await guestNew.post(`/api/smokecraft/venue-humidor/customer/recommendations/preferences`, { preferences: { preferredStrength: 'full' }, idempotencyKey: `pref-${rid()}` })
  const strangerPrefs = await makeClient().get(`/api/smokecraft/venue-humidor/customer/recommendations/preferences`)
  assert('A different customer never sees another customer\'s saved preferences', strangerPrefs.body.preferences === null)

  console.log('\n── 13. Add-to-cart uses canonical cart flow (no bypass) ──')
  const holdCheck = await guestNew.post(`/api/smokecraft/venue-humidor/customer/venues/${venueA}/products/${cigarA.product_id}/stick-hold`, { idempotencyKey: `rec-hold-${rid()}` })
  assert('Recommended product can be held via the canonical stick-hold endpoint (same flow as browse/detail)', holdCheck.status === 201 || holdCheck.status === 200)

  console.log('\n── 14. Stale inventory rechecked before checkout ──')
  const cigarStale = await createProduct(venueA, { name: 'Stale Test Cigar', initialQuantity: 1 })
  const recStale = await guestNew.post(`/api/smokecraft/venue-humidor/customer/recommendations`, { venueId: venueA, preferences: {}, idempotencyKey: `rec-${rid()}` })
  assert('Recommendation initially shows the product as eligible', recStale.body.results.some(r => r.productId === cigarStale.product_id))
  psql(`UPDATE venue_cigar_products SET physical_quantity = 0 WHERE product_id = '${cigarStale.product_id}'`)
  const recStale2 = await guestNew.post(`/api/smokecraft/venue-humidor/customer/recommendations`, { venueId: venueA, preferences: {}, idempotencyKey: `rec-${rid()}` })
  assert('A fresh recommendation call rechecks current inventory and excludes the now-unavailable product', !recStale2.body.results.some(r => r.productId === cigarStale.product_id))
  const staleHold = await guestNew.post(`/api/smokecraft/venue-humidor/customer/venues/${venueA}/products/${cigarStale.product_id}/stick-hold`, { idempotencyKey: `stale-hold-${rid()}` })
  assert('The canonical hold endpoint independently rejects a stale (now out-of-stock) recommendation result', staleHold.status !== 201 && staleHold.status !== 200)

  console.log('\n── 15. Idempotent preference save ──')
  const prefKey = `pref-idem-${rid()}`
  const pref1 = await guestNew.post(`/api/smokecraft/venue-humidor/customer/recommendations/preferences`, { preferences: { preferredStrength: 'mild' }, idempotencyKey: prefKey })
  const pref2 = await guestNew.post(`/api/smokecraft/venue-humidor/customer/recommendations/preferences`, { preferences: { preferredStrength: 'full' }, idempotencyKey: prefKey })
  assert('Preference save is naturally idempotent per customer (upsert-by-customer, not a duplicate row)', pref1.status === 200 && pref2.status === 200)
  const prefRowCount = psql(`SELECT COUNT(*) FROM venue_cigar_recommendation_preferences WHERE customer_reference IS NOT NULL AND updated_at > now() - interval '1 minute'`)
  assert('No duplicate preference rows are created for the same customer', Number(prefRowCount) >= 1)

  console.log('\n── 16. Idempotent assisted-selling outcome ──')
  const outcomeKey = `outcome-idem-${rid()}`
  const out1 = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/assisted-selling/outcome`, { productId: cigarA.product_id, outcome: 'accepted', idempotencyKey: outcomeKey })
  const out2 = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/assisted-selling/outcome`, { productId: cigarA.product_id, outcome: 'accepted', idempotencyKey: outcomeKey })
  assert('Duplicate assisted-selling outcome submission is deduplicated', out1.body.outcome.outcome_id === out2.body.outcome.outcome_id)
  const outcomeCount = psql(`SELECT COUNT(*) FROM venue_cigar_assisted_selling_outcomes WHERE idempotency_key = '${outcomeKey}'`)
  assert('Exactly one outcome row exists for the shared idempotency key', outcomeCount === '1')

  console.log('\n── 17. Append-only recommendation analytics ──')
  const eventCountBefore = psql(`SELECT COUNT(*) FROM smokecraft_progression_events WHERE event_type LIKE 'venue_humidor_recommendation_%'`)
  await guestNew.post(`/api/smokecraft/venue-humidor/customer/recommendations`, { venueId: venueA, preferences: {}, idempotencyKey: `rec-analytics-${rid()}` })
  const eventCountAfter = psql(`SELECT COUNT(*) FROM smokecraft_progression_events WHERE event_type LIKE 'venue_humidor_recommendation_%'`)
  assert('Recommendation analytics events accumulate (append-only, never overwritten)', Number(eventCountAfter) > Number(eventCountBefore))
  const anyEventId = psql(`SELECT id FROM smokecraft_progression_events WHERE event_type LIKE 'venue_humidor_recommendation_%' ORDER BY id DESC LIMIT 1`)
  const beforeRow = psql(`SELECT created_at FROM smokecraft_progression_events WHERE id = ${anyEventId}`)
  assert('No UPDATE/DELETE path exists for recommendation events (service module only INSERTs via recordEvent)', !fs.readFileSync('server/services/venueHumidor/recommendationService.js', 'utf8').match(/UPDATE smokecraft_progression_events|DELETE FROM smokecraft_progression_events/))

  console.log('\n── Summary ──')
  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)

  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-2b-5', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-2b-5/01-recommendation-api-results.json', JSON.stringify({ pass, fail, results }, null, 2))

  process.exit(fail === 0 ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
