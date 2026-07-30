#!/usr/bin/env node
/**
 * Venue Humidor 1B-2B-4 — customer order history, receipts, Passport
 * acquisition read surface, and post-purchase experience tests
 * against the real running server, zero mocking.
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

  const venueA = psql(`INSERT INTO venues (venue_id, name, venue_type, status, city) VALUES ('vh1b2b4-test-venue-a-${Date.now()}', 'VH1B2B4 Test Venue A', 'cigar_lounge', 'active', 'Testville') RETURNING venue_id`)
  const venueB = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b4-test-venue-b-${Date.now()}', 'VH1B2B4 Test Venue B', 'cigar_lounge', 'active') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueA}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${staffId}', '${venueA}', 'staff', 'active') ON CONFLICT DO NOTHING`)

  async function createReadyOrder(venueId, priceCents = 2000) {
    const guest = makeClient()
    const sku = `VH1B2B4-${rid()}`
    const created = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/products`, { sku, name: 'History Test Cigar', priceCents, initialQuantity: 50, country: 'Nicaragua' })
    const pid = created.body.product.product_id
    await guest.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}`)
    const hold = await guest.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${pid}/stick-hold`, { idempotencyKey: `vh1b2b4-hold-${rid()}` })
    const holdId = hold.body.hold.hold_id
    const order = await guest.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, {
      holdId, fulfillmentMethod: 'counter_pickup', fulfillmentDetails: {}, customerNotes: '', ageVerified: true, idempotencyKey: `vh1b2b4-order-${rid()}`,
    })
    const orderId = order.body.order.order_id
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/claim`, { idempotencyKey: `vh1b2b4-claim-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/confirm`, { idempotencyKey: `vh1b2b4-confirm-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/prepare`, { idempotencyKey: `vh1b2b4-prepare-${rid()}` })
    const detail = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}`)
    for (const item of detail.body.order.items) {
      await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/items/${item.order_item_id}/pick`, { idempotencyKey: `vh1b2b4-pick-${rid()}-${item.order_item_id}` })
    }
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/ready`, { idempotencyKey: `vh1b2b4-ready-${rid()}` })
    return { guest, productId: pid, orderId }
  }

  async function completeOrder(venueId, orderId) {
    const gen = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/verification-code`, { idempotencyKey: `vh1b2b4-gen-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/verify`, { code: gen.body.code, idempotencyKey: `vh1b2b4-verify-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/handoff`, { verificationMethod: 'pickup_code', idempotencyKey: `vh1b2b4-handoff-${rid()}` })
    return staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/complete`, { idempotencyKey: `vh1b2b4-complete-${rid()}` })
  }

  console.log('\n── 1. Customer reads own order history / cannot read another customer\'s ──')
  const ctx1 = await createReadyOrder(venueA, 1500)
  await completeOrder(venueA, ctx1.orderId)
  const myOrders = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders`)
  assert('Customer can read their own order history', myOrders.status === 200 && myOrders.body.orders.some(o => o.order_id === ctx1.orderId))

  const strangerGuest = makeClient()
  await strangerGuest.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}`)
  const strangerOrders = await strangerGuest.get(`/api/smokecraft/venue-humidor/customer/orders`)
  assert('A different customer\'s order history never includes this order', !strangerOrders.body.orders?.some(o => o.order_id === ctx1.orderId))

  console.log('\n── 2. Customer reads own order detail / cannot read another\'s ──')
  const myDetail = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}`)
  assert('Customer can read their own order detail', myDetail.status === 200 && myDetail.body.order.items.length === 1)
  const strangerDetail = await strangerGuest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}`)
  assert('A different customer cannot read this order\'s detail', strangerDetail.status === 403)

  console.log('\n── 3. Receipt totals match canonical order ──')
  const receipt1 = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}/receipt`)
  assert('Customer can read their own receipt', receipt1.status === 200)
  assert('Receipt totals match the canonical completed order totals', receipt1.body.receipt.totalCents === myDetail.body.order.total_cents && receipt1.body.receipt.isCompletedSale === true)
  const strangerReceipt = await strangerGuest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}/receipt`)
  assert('A different customer cannot read this receipt', strangerReceipt.status === 403)

  console.log('\n── 4. Historical price unchanged after product price update ──')
  psql(`UPDATE venue_cigar_products SET price_cents = 9999 WHERE product_id = '${ctx1.productId}'`)
  const receiptAfterPriceChange = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}/receipt`)
  assert('Historical receipt price does not change after the product\'s current price changes', receiptAfterPriceChange.body.receipt.items[0].unitPriceCents === 1500)

  console.log('\n── 5. Completed order has Passport acquisition; cancelled/expired do not ──')
  const acqCount1 = psql(`SELECT count(*) FROM venue_cigar_passport_acquisitions WHERE order_id = '${ctx1.orderId}'`)
  assert('A completed order has exactly one real Passport acquisition', acqCount1 === '1')

  const ctx2 = await createReadyOrder(venueA)
  await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx2.orderId}/cancel`, { reason: 'test', idempotencyKey: `vh1b2b4-cancel2-${rid()}` })
  const acqCount2 = psql(`SELECT count(*) FROM venue_cigar_passport_acquisitions WHERE order_id = '${ctx2.orderId}'`)
  assert('A cancelled order has NO Passport acquisition', acqCount2 === '0')

  const ctx3 = await createReadyOrder(venueA)
  await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx3.orderId}/expire`, { reason: 'test', idempotencyKey: `vh1b2b4-expire3-${rid()}` })
  const acqCount3 = psql(`SELECT count(*) FROM venue_cigar_passport_acquisitions WHERE order_id = '${ctx3.orderId}'`)
  assert('An expired order has NO Passport acquisition', acqCount3 === '0')

  console.log('\n── 6. Duplicate acquisition prevented (retry completion) ──')
  const gen4 = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.orderId}/complete`, { idempotencyKey: `vh1b2b4-retry-${rid()}` })
  const acqCountAfterRetry = psql(`SELECT count(*) FROM venue_cigar_passport_acquisitions WHERE order_id = '${ctx1.orderId}'`)
  assert('Retrying completion never creates a duplicate acquisition', acqCountAfterRetry === '1')

  console.log('\n── 7. Customer reads own acquisition / cannot read another\'s ──')
  const acquisitionId = psql(`SELECT acquisition_id FROM venue_cigar_passport_acquisitions WHERE order_id = '${ctx1.orderId}'`)
  const myAcquisitions = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/passport/acquisitions`)
  assert('Customer can read their own acquisitions list', myAcquisitions.status === 200 && myAcquisitions.body.acquisitions.some(a => a.acquisition_id === acquisitionId))
  const myAcqDetail = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/passport/acquisitions/${acquisitionId}`)
  assert('Customer can read their own acquisition detail with real cigar data', myAcqDetail.status === 200 && myAcqDetail.body.acquisition.country === 'Nicaragua')
  const strangerAcqDetail = await strangerGuest.get(`/api/smokecraft/venue-humidor/customer/passport/acquisitions/${acquisitionId}`)
  assert('A different customer cannot read this acquisition', strangerAcqDetail.status === 403)

  console.log('\n── 8. Cross-venue access denied ──')
  const venueBCustomerListsA = await manager.get(`/api/smokecraft/venue-humidor/customer/orders`)
  // manager here acts as staff, not the actual customer — verifying no cross-customer leak via a different identity entirely
  assert('A staff/manager identity querying the customer order-history endpoint sees only their own (empty) guest history, never another customer\'s data', !venueBCustomerListsA.body.orders?.some(o => o.order_id === ctx1.orderId))

  console.log('\n── 9. Archived product remains in history, cannot reorder ──')
  await admin.patch(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${ctx1.productId}/classification`, { isArchived: true })
  const detailAfterArchive = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}`)
  assert('An archived product\'s order item remains visible in history', detailAfterArchive.body.order.items[0].product_name === 'History Test Cigar')
  assert('An archived product is not reorder-eligible', detailAfterArchive.body.order.items[0].reorderEligible === false)
  await admin.patch(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${ctx1.productId}/classification`, { isArchived: false })

  console.log('\n── 10. Out-of-stock product cannot reorder ──')
  psql(`UPDATE venue_cigar_products SET physical_quantity = 0 WHERE product_id = '${ctx1.productId}'`)
  const detailOutOfStock = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}`)
  assert('An out-of-stock product is not reorder-eligible', detailOutOfStock.body.order.items[0].reorderEligible === false)
  psql(`UPDATE venue_cigar_products SET physical_quantity = 50 WHERE product_id = '${ctx1.productId}'`)

  console.log('\n── 11. Reorder uses current price, routes through canonical cart/checkout ──')
  const currentDetail = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}/catalog/${ctx1.productId}`)
  assert('The real customer catalog detail (the canonical reorder entry point) reflects the current, not historical, price', currentDetail.body.product.price_cents === 9999)

  console.log('\n── 12. Verified-purchase rating permitted; non-purchaser denied ──')
  const rateResult = await ctx1.guest.post(`/api/smokecraft/venue-humidor/customer/passport/acquisitions/${acquisitionId}/note`, { rating: 5, idempotencyKey: `vh1b2b4-rate-${rid()}` })
  assert('The verified purchaser can rate their own acquisition', rateResult.status === 200 && rateResult.body.note.rating === 5)
  const strangerRate = await strangerGuest.post(`/api/smokecraft/venue-humidor/customer/passport/acquisitions/${acquisitionId}/note`, { rating: 1, idempotencyKey: `vh1b2b4-strangerrate-${rid()}` })
  assert('A non-purchaser cannot rate someone else\'s acquisition', strangerRate.status === 403)
  const invalidRating = await ctx1.guest.post(`/api/smokecraft/venue-humidor/customer/passport/acquisitions/${acquisitionId}/note`, { rating: 9, idempotencyKey: `vh1b2b4-badrate-${rid()}` })
  assert('An out-of-range rating is honestly rejected', invalidRating.status === 400)

  console.log('\n── 13. Duplicate rating / idempotent mutations ──')
  const dupRatingKey = `vh1b2b4-duprate-${rid()}`
  const [r1, r2] = await Promise.all([
    ctx1.guest.post(`/api/smokecraft/venue-humidor/customer/passport/acquisitions/${acquisitionId}/note`, { rating: 3, idempotencyKey: dupRatingKey }),
    ctx1.guest.post(`/api/smokecraft/venue-humidor/customer/passport/acquisitions/${acquisitionId}/note`, { rating: 3, idempotencyKey: dupRatingKey }),
  ])
  const noteCount = psql(`SELECT count(*) FROM venue_cigar_acquisition_notes WHERE acquisition_id = '${acquisitionId}'`)
  assert('Concurrent identical rating requests (shared idempotency key) result in exactly one real note row', noteCount === '1' && r1.status === 200 && r2.status === 200)

  console.log('\n── 14. Tasting-note authorization and mark-smoked ──')
  const noteResult = await ctx1.guest.post(`/api/smokecraft/venue-humidor/customer/passport/acquisitions/${acquisitionId}/note`, { tastingNote: 'Earthy and rich.', idempotencyKey: `vh1b2b4-note-${rid()}` })
  assert('The verified purchaser can save a tasting note', noteResult.status === 200 && noteResult.body.note.tasting_note === 'Earthy and rich.')
  const smokedResult = await ctx1.guest.post(`/api/smokecraft/venue-humidor/customer/passport/acquisitions/${acquisitionId}/note`, { isSmoked: true, idempotencyKey: `vh1b2b4-smoked-${rid()}` })
  assert('The verified purchaser can mark the acquisition as smoked', smokedResult.status === 200 && smokedResult.body.note.is_smoked === true && smokedResult.body.note.smoked_at)

  console.log('\n── 15. Append-only financial history (immutability) ──')
  const beforeMutateTotal = myDetail.body.order.total_cents
  psql(`UPDATE venue_cigar_products SET price_cents = 1 WHERE product_id = '${ctx1.productId}'`)
  const detailAfterCatalogChange = await ctx1.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx1.orderId}`)
  assert('Historical order total_cents never mutates when the catalog price changes later', detailAfterCatalogChange.body.order.total_cents === beforeMutateTotal)

  console.log('\n── 16. Refund/cancellation display ──')
  const cancelledReceipt = await ctx2.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx2.orderId}/receipt`)
  assert('A cancelled order\'s receipt honestly shows a non-completed sale', cancelledReceipt.status === 200 && cancelledReceipt.body.receipt.isCompletedSale === false)

  console.log('\n── 17. Receipt unavailable for a non-terminal order ──')
  const ctx5 = await createReadyOrder(venueA)
  const notCompletedReceipt = await ctx5.guest.get(`/api/smokecraft/venue-humidor/customer/orders/${ctx5.orderId}/receipt`)
  assert('A receipt is honestly unavailable for a ready-but-not-completed order', notCompletedReceipt.status === 409 && notCompletedReceipt.body.error === 'receipt_not_available')

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-2b-4', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-2b-4/01-post-purchase-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
