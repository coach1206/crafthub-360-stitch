#!/usr/bin/env node
/**
 * Venue Humidor 1B-1 — customer browsing/detail API tests against the
 * real running server, zero mocking.
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

  // This suite creates real holds/reservations against the shared seed
  // catalog — reset before each run so repeated runs never accumulate
  // toward sold-out.
  psql(`UPDATE venue_cigar_products SET physical_quantity = 20 WHERE venue_id = 'vh-seed-venue-alpha' AND sku = 'ALPHA-007'`)
  psql(`DELETE FROM venue_cigar_order_items WHERE order_id IN (SELECT order_id FROM venue_cigar_orders WHERE venue_id = 'vh-seed-venue-alpha')`)
  psql(`DELETE FROM venue_cigar_orders WHERE venue_id = 'vh-seed-venue-alpha'`)
  psql(`DELETE FROM venue_cigar_inventory_holds WHERE venue_id = 'vh-seed-venue-alpha'`)
  psql(`DELETE FROM venue_cigar_reservations WHERE venue_id = 'vh-seed-venue-alpha'`)
  psql(`DELETE FROM venue_cigar_inventory_events WHERE venue_id = 'vh-seed-venue-alpha'`)

  console.log('\n── 1. First load / no-venue honesty ──')
  const fakeVenueCheck = await makeClient().get(`/api/smokecraft/venue-humidor/customer/venues/nonexistent-venue-xyz/catalog`)
  assert('A nonexistent/inactive venue returns an honest 404 (never fabricated inventory)', fakeVenueCheck.status === 404 && fakeVenueCheck.body.error === 'no_active_venue')

  const client = makeClient()
  const catalogFirstLoad = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog`)
  assert('First load of a real active venue returns real catalog data', catalogFirstLoad.status === 200 && catalogFirstLoad.body.products.length > 0)
  assert('Every returned product genuinely belongs to the requested venue', catalogFirstLoad.body.products.every(p => p.venue_id === venueId))

  console.log('\n── 2. Sold-out hidden by default, shown when requested ──')
  const defaultView = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog`)
  assert('Sold-out products are hidden by default', !defaultView.body.products.some(p => p.status === 'sold_out'))
  const explicitAllStock = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog?inStockOnly=false`)
  assert('Sold-out products appear when the caller explicitly requests inStockOnly=false', explicitAllStock.body.products.some(p => p.status === 'sold_out'))

  console.log('\n── 3. Archived and non-customer-visible products excluded ──')
  const archivedProduct = await psql(`SELECT product_id FROM venue_cigar_products WHERE venue_id = '${venueId}' LIMIT 1`)
  psql(`UPDATE venue_cigar_products SET is_archived = true WHERE product_id = '${archivedProduct}'`)
  const afterArchive = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog?inStockOnly=false`)
  assert('An archived product never appears in the customer catalog', !afterArchive.body.products.some(p => p.product_id === archivedProduct))
  const archivedDetail = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog/${archivedProduct}`)
  assert('An archived product\'s detail page returns an honest 404, never leaked data', archivedDetail.status === 404)
  psql(`UPDATE venue_cigar_products SET is_archived = false WHERE product_id = '${archivedProduct}'`)

  console.log('\n── 4. Search and filters (real server-backed) ──')
  const searchResult = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog?search=Featured`)
  assert('Search filters real products by name/brand server-side', searchResult.body.products.length > 0 && searchResult.body.products.every(p => /Featured/i.test(p.name) || /Featured/i.test(p.brand)))
  const wrapperFilter = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog?wrapper=maduro`)
  assert('Wrapper filter returns only real matching products', wrapperFilter.body.products.length > 0 && wrapperFilter.body.products.every(p => p.wrapper === 'maduro'))
  const strengthFilter = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog?strength=full`)
  assert('Strength filter returns only real matching products', strengthFilter.body.products.every(p => p.strength === 'full'))
  const priceFilter = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog?priceMinCents=2000`)
  assert('Price filter returns only real matching products', priceFilter.body.products.every(p => p.price_cents >= 2000))
  const featuredFilter = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog?featured=true`)
  assert('Featured filter returns only real featured products', featuredFilter.body.products.every(p => p.is_featured === true))
  const staffPickFilter = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog?staffPick=true`)
  assert('Staff pick filter returns only real staff-picked products', staffPickFilter.body.products.every(p => p.is_staff_pick === true))
  const limitedFilter = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog?limitedRelease=true`)
  assert('Limited release filter returns only real limited-release products', limitedFilter.body.products.every(p => p.is_limited_release === true))

  console.log('\n── 5. Sorting (real server-backed) ──')
  const priceAsc = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog?sort=price_low_to_high`)
  const pricesAsc = priceAsc.body.products.map(p => p.price_cents)
  assert('Sort price_low_to_high is genuinely ascending', pricesAsc.every((p, i) => i === 0 || p >= pricesAsc[i - 1]))
  const priceDesc = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog?sort=price_high_to_low`)
  const pricesDesc = priceDesc.body.products.map(p => p.price_cents)
  assert('Sort price_high_to_low is genuinely descending', pricesDesc.every((p, i) => i === 0 || p <= pricesDesc[i - 1]))

  console.log('\n── 6. Low-stock state ──')
  const lowStockProduct = catalogFirstLoad.body.products.find(p => p.sku.endsWith('-005'))
  assert('The low-stock seed item reports a real low-stock availability state', lowStockProduct && lowStockProduct.availability.availableQuantity <= lowStockProduct.reorder_threshold)

  console.log('\n── 7. Product detail ──')
  const detailTarget = catalogFirstLoad.body.products[0]
  const detail = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog/${detailTarget.product_id}`)
  assert('Product detail loads full real data including live availability', detail.status === 200 && detail.body.product.availability.availableQuantity != null)
  assert('Product detail includes real similar-cigar suggestions', Array.isArray(detail.body.product.similarCigars))

  console.log('\n── 8. Wrong-venue product denial (venue isolation) ──')
  const otherVenueProduct = await psql(`SELECT product_id FROM venue_cigar_products WHERE venue_id = '${otherVenueId}' LIMIT 1`)
  const crossVenueDetail = await client.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/catalog/${otherVenueProduct}`)
  assert('A venue B product requested under venue A\'s path returns an honest 404, never cross-venue data', crossVenueDetail.status === 404)

  console.log('\n── 9. Hold creation (Add One Stick) ──')
  const stickKey = `vh1b1-stick-${Date.now()}`
  const holdRes = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${detailTarget.product_id}/stick-hold`, { idempotencyKey: stickKey })
  assert('A customer can create a real one-stick hold', holdRes.status === 200 && holdRes.body.hold.quantity === 1)

  console.log('\n── 10. Reservation creation ──')
  const reserveKey = `vh1b1-reserve-${Date.now()}`
  const reserveRes = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${detailTarget.product_id}/reservation`, { quantity: 1, idempotencyKey: reserveKey })
  assert('A customer can create a real reservation', reserveRes.status === 200 && reserveRes.body.reservation.status === 'active')

  console.log('\n── 11. Duplicate action protection ──')
  const dupHold = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${detailTarget.product_id}/stick-hold`, { idempotencyKey: stickKey })
  assert('A repeated stick-hold request with the same idempotency key returns the identical original hold', dupHold.body.hold.hold_id === holdRes.body.hold.hold_id)

  console.log('\n── 12. Unsupported payment/POS boundary ──')
  const tabAttempt = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${detailTarget.product_id}/venue-tab`, {})
  assert('Add to Venue Tab is honestly unavailable (501), never a fake success', tabAttempt.status === 501 && tabAttempt.body.error === 'action_not_yet_available')
  const tableAttempt = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${detailTarget.product_id}/table-delivery`, {})
  assert('Request Table/Seat Delivery is honestly unavailable (501), never a fake success', tableAttempt.status === 501)

  console.log('\n── 13. Box purchase (present vs unavailable) ──')
  const boxCapableProduct = catalogFirstLoad.body.products.find(p => p.box_price_cents)
  if (boxCapableProduct) {
    const boxHold = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${boxCapableProduct.product_id}/box-hold`, { idempotencyKey: `vh1b1-box-${Date.now()}` })
    assert('Purchase Box creates a real hold for the real box quantity when the venue supports it', boxHold.status === 200 && boxHold.body.hold.quantity === boxCapableProduct.box_quantity)
  }
  const noBoxProduct = catalogFirstLoad.body.products.find(p => !p.box_price_cents)
  const boxUnavailable = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${noBoxProduct.product_id}/box-hold`, { idempotencyKey: `vh1b1-nobox-${Date.now()}` })
  assert('Purchase Box is honestly rejected (409) for a cigar with no configured box price', boxUnavailable.status === 409 && boxUnavailable.body.error === 'box_purchase_unavailable')

  console.log('\n── 14. Favorites persistence ──')
  const favAdd = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${detailTarget.product_id}/favorite`, {})
  assert('Adding a favorite succeeds', favAdd.status === 200)
  const favList = await client.get(`/api/smokecraft/venue-humidor/customer/favorites`)
  assert('The favorite persists and is retrievable by the same identity', favList.body.favorites.some(f => f.product_id === detailTarget.product_id))
  const favDup = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${detailTarget.product_id}/favorite`, {})
  assert('Re-favoriting the same cigar is a real no-op, never a duplicate row', favDup.body.deduplicated === true)
  const favRemove = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${detailTarget.product_id}/unfavorite`, {})
  assert('Removing a favorite succeeds', favRemove.status === 200)
  const favListAfterRemove = await client.get(`/api/smokecraft/venue-humidor/customer/favorites`)
  assert('The favorite is genuinely removed', !favListAfterRemove.body.favorites.some(f => f.product_id === detailTarget.product_id))

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-1/01-customer-browser-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
