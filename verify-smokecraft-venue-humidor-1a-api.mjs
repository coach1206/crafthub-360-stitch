#!/usr/bin/env node
/**
 * Venue Humidor 1A — backend foundation tests against the real
 * running server, zero mocking.
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

  const admin = makeClient()
  await admin.post('/api/auth/admin-login', { email: 'admin@novee.dev', pin: '9999' })
  const manager = makeClient()
  const managerLogin = await manager.post('/api/auth/admin-login', { email: 'manager@novee.dev', pin: '5678' })
  const managerId = managerLogin.body.data.userId
  const staff = makeClient()
  const staffLogin = await staff.post('/api/auth/staff-pin-login', { pin: '1234' })
  const staffId = staffLogin.body.data.userId

  const venueA = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1a-test-venue-a-${Date.now()}', 'VH1A Test Venue A', 'cigar_lounge', 'active') RETURNING venue_id`)
  const venueB = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1a-test-venue-b-${Date.now()}', 'VH1A Test Venue B', 'cigar_lounge', 'active') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueA}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${staffId}', '${venueA}', 'staff', 'active') ON CONFLICT DO NOTHING`)
  // staffId is deliberately NOT a member of venueB — used for cross-venue denial.

  console.log('\n── 1. Venue isolation — a stranger with no membership cannot read/write ──')
  const strangerListDenied = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueB}/products`)
  assert('A user with no membership for venueB is denied listing venueB products', strangerListDenied.status === 403 && strangerListDenied.body.error === 'venue_staff_required')

  console.log('\n── 2. Product creation, duplicate SKU/barcode rejection ──')
  const created1 = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products`, {
    sku: 'VH1A-001', barcode: 'BC-VH1A-001', name: 'Test Robusto', brand: 'Test Leaf', vitola: 'robusto', wrapper: 'habano', strength: 'medium', priceCents: 1200, initialQuantity: 20,
  })
  assert('An authorized venue manager can create a product', created1.status === 201)
  const productA = created1.body.product.product_id
  const dupSku = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products`, {
    sku: 'VH1A-001', name: 'Duplicate SKU', priceCents: 1000,
  })
  assert('A duplicate SKU within the same venue is rejected', dupSku.status === 409 && dupSku.body.error === 'duplicate_sku')
  const dupBarcode = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products`, {
    sku: 'VH1A-002', barcode: 'BC-VH1A-001', name: 'Duplicate Barcode', priceCents: 1000,
  })
  assert('A duplicate barcode within the same venue is rejected', dupBarcode.status === 409 && dupBarcode.body.error === 'duplicate_barcode')
  const sameSkuOtherVenue = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueB}/products`, {
    sku: 'VH1A-001', name: 'Same SKU different venue', priceCents: 1000,
  })
  assert('The SAME SKU is allowed in a DIFFERENT venue (per-venue uniqueness, not global)', sameSkuOtherVenue.status === 201)

  console.log('\n── 3. Venue isolation — products never leak across venues ──')
  const listA = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products`)
  assert('Venue A\'s product list contains only Venue A\'s own products', listA.body.products.every(p => p.venue_id === venueA))
  const crossVenueGet = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${sameSkuOtherVenue.body.product.product_id}`)
  assert('A venue A staff member cannot fetch a venue B product even by pairing A\'s venueId with B\'s productId', crossVenueGet.status === 404)

  console.log('\n── 4. Customers cannot call admin/staff mutations ──')
  const customerAttempt = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueB}/products`, { sku: 'X', name: 'X', priceCents: 100 })
  assert('A non-member (customer-equivalent) cannot create a product for a venue they do not staff', customerAttempt.status === 403)

  console.log('\n── 5. Receiving inventory ──')
  const idem1 = `vh1a-receive-${Date.now()}`
  const receive = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/inventory-events`, {
    eventType: 'receiving', quantityDelta: 10, idempotencyKey: idem1,
  })
  assert('Receiving inventory increases physical quantity correctly (20 -> 30)', receive.status === 200 && Number(receive.body.product.physical_quantity) === 30)
  assert('Receiving writes exactly one real inventory event with before/after quantities', Number(receive.body.event.physical_quantity_before) === 20 && Number(receive.body.event.physical_quantity_after) === 30)

  console.log('\n── 6. Box opening (inventory-neutral) ──')
  const boxOpen = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/inventory-events`, {
    eventType: 'box_opened', quantityDelta: 0, idempotencyKey: `vh1a-box-${Date.now()}`, reason: 'opened a sealed box of 10',
  })
  assert('Box opening is a real, recorded, inventory-neutral event', boxOpen.status === 200 && Number(boxOpen.body.product.physical_quantity) === 30)

  console.log('\n── 7. Adjustment (damage, loss, complimentary, return, count correction) ──')
  const damage = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/inventory-events`, { eventType: 'damage', quantityDelta: -2, idempotencyKey: `vh1a-damage-${Date.now()}` })
  assert('Damage adjustment decreases physical quantity (30 -> 28)', Number(damage.body.product.physical_quantity) === 28)
  const comp = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/inventory-events`, { eventType: 'complimentary', quantityDelta: -1, idempotencyKey: `vh1a-comp-${Date.now()}` })
  assert('Complimentary-item adjustment decreases physical quantity (28 -> 27)', Number(comp.body.product.physical_quantity) === 27)
  const countCorrection = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/inventory-events`, { eventType: 'count_correction', quantityDelta: 3, idempotencyKey: `vh1a-count-${Date.now()}` })
  assert('Count correction adjusts physical quantity to the real audited value (27 -> 30)', Number(countCorrection.body.product.physical_quantity) === 30)

  console.log('\n── 8. Negative inventory prevention ──')
  const overDraw = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/inventory-events`, { eventType: 'loss', quantityDelta: -9999, idempotencyKey: `vh1a-overdraw-${Date.now()}` })
  assert('An adjustment that would drive physical quantity negative is rejected with a real 409', overDraw.status === 409 && overDraw.body.error === 'insufficient_inventory')
  const unchangedAfterReject = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}`)
  assert('The rejected mutation left the real physical quantity unchanged (transaction rolled back)', Number(unchangedAfterReject.body.product.physical_quantity) === 30)

  console.log('\n── 9. Duplicate mutation prevention (idempotency) ──')
  const dupKey = `vh1a-dup-${Date.now()}`
  const firstMutation = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/inventory-events`, { eventType: 'stick_added', quantityDelta: 5, idempotencyKey: dupKey })
  const secondMutation = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/inventory-events`, { eventType: 'stick_added', quantityDelta: 5, idempotencyKey: dupKey })
  assert('A repeated mutation with the same idempotency key returns the identical original event, never double-applies', secondMutation.body.event.event_id === firstMutation.body.event.event_id)
  const afterDupCheck = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}`)
  assert('Physical quantity increased exactly once (30 -> 35), not twice', Number(afterDupCheck.body.product.physical_quantity) === 35)

  console.log('\n── 10. Two-tab race on inventory mutation ──')
  const raceKey = `vh1a-race-${Date.now()}`
  const [raceA, raceB] = await Promise.all([
    manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/inventory-events`, { eventType: 'stick_removed', quantityDelta: -3, idempotencyKey: raceKey }),
    manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/inventory-events`, { eventType: 'stick_removed', quantityDelta: -3, idempotencyKey: raceKey }),
  ])
  assert('Both concurrent requests with the same idempotency key resolve to the SAME real event (no crash, no double-apply)', raceA.status === 200 && raceB.status === 200 && raceA.body.event.event_id === raceB.body.event.event_id)
  const afterRace = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}`)
  assert('Physical quantity decreased exactly once (35 -> 32) despite the two-tab race', Number(afterRace.body.product.physical_quantity) === 32)

  console.log('\n── 11. Hold creation and expiration ──')
  const holdKey = `vh1a-hold-${Date.now()}`
  const hold = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/holds`, {
    quantity: 5, expiresAt: new Date(Date.now() - 1000).toISOString(), idempotencyKey: holdKey,
  })
  assert('A hold is created and reduces real available quantity', hold.status === 200 && hold.body.hold.status === 'active')
  const availabilityAfterHold = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/availability`)
  assert('Available quantity reflects the active hold (32 physical - 5 held = 27 available)', Number(availabilityAfterHold.body.availability.availableQuantity) === 27)
  const expireResult = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/holds/${hold.body.hold.hold_id}/expire`, {})
  assert('An already-expired hold can be expired (real expires_at check)', expireResult.status === 200 && expireResult.body.hold.status === 'expired')
  const availabilityAfterExpire = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/availability`)
  assert('Available quantity is restored after hold expiration (back to 32)', Number(availabilityAfterExpire.body.availability.availableQuantity) === 32)

  console.log('\n── 12. Reservation and cancellation restoration ──')
  const reservation = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/reservations`, {
    quantity: 4, reservedFor: 'test-customer', idempotencyKey: `vh1a-reservation-${Date.now()}`,
  })
  assert('A staff-created reservation succeeds and reduces real available quantity', reservation.status === 200 && Number((await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/availability`)).body.availability.availableQuantity) === 28)
  const cancelReservation = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/reservations/${reservation.body.reservation.reservation_id}/cancel`, {})
  assert('Cancelling the reservation succeeds', cancelReservation.status === 200 && cancelReservation.body.reservation.status === 'cancelled')
  const availabilityAfterCancel = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}/availability`)
  assert('Available quantity is restored after reservation cancellation (back to 32)', Number(availabilityAfterCancel.body.availability.availableQuantity) === 32)

  console.log('\n── 13. Sale completion and cancellation restoration (order flow) ──')
  const orderCreate = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/orders`, { idempotencyKey: `vh1a-order-${Date.now()}` })
  const orderId = orderCreate.body.order.order_id
  await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/orders/${orderId}/items`, { productId: productA, quantity: 6, unitPriceCents: 1200 })
  const completeOrder = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/orders/${orderId}/complete`, { idempotencyKey: `vh1a-complete-${Date.now()}` })
  assert('Sale completion succeeds and decrements real physical inventory (32 -> 26)', completeOrder.status === 200 && completeOrder.body.order.status === 'completed')
  const afterSale = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}`)
  assert('Physical quantity genuinely decreased by the sold quantity', Number(afterSale.body.product.physical_quantity) === 26)
  const cancelOrder = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/orders/${orderId}/cancel`, { idempotencyKey: `vh1a-cancel-${Date.now()}` })
  assert('Cancelling a completed order restores real inventory (refund path)', cancelOrder.status === 200 && cancelOrder.body.restored === true)
  const afterCancelSale = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/products/${productA}`)
  assert('Physical quantity is genuinely restored after cancellation (26 -> 32)', Number(afterCancelSale.body.product.physical_quantity) === 32)

  console.log('\n── 14. Cross-user / cross-venue denial ──')
  const crossVenueMutation = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueB}/products/${sameSkuOtherVenue.body.product.product_id}/inventory-events`, { eventType: 'receiving', quantityDelta: 5, idempotencyKey: `vh1a-cross-${Date.now()}` })
  assert('A venue A staff member (not a venue B member) is denied mutating a venue B product', crossVenueMutation.status === 403)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1a', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1a/01-backend-foundation-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
