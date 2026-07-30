#!/usr/bin/env node
/**
 * Venue Humidor 1B-2B-2 — staff order and fulfillment queue tests
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
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b) }
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }
const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// counter_pickup requires real code verification before handoff.
async function verifyAndHandoff(client, venueId, orderId) {
  const gen = await client.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/verification-code`, { idempotencyKey: `vh1b2b2-gencode-${rid()}` })
  await client.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/verify`, { code: gen.body.code, idempotencyKey: `vh1b2b2-verify-${rid()}` })
  return client.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/handoff`, { verificationMethod: 'pickup_code', idempotencyKey: `vh1b2b2-handoff-${rid()}` })
}

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

  const venueA = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b2-test-venue-a-${Date.now()}', 'VH1B2B2 Test Venue A', 'cigar_lounge', 'active') RETURNING venue_id`)
  const venueB = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b2-test-venue-b-${Date.now()}', 'VH1B2B2 Test Venue B', 'cigar_lounge', 'active') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueA}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${staffId}', '${venueA}', 'staff', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueB}', 'mentor', 'active') ON CONFLICT DO NOTHING`)

  // Helper: create a full real checkout order (product -> hold -> order) via the real customer API.
  async function createRealOrder(venueId, priceCents = 1500, qty = 1) {
    const guest = makeClient()
    const sku = `VH1B2B2-${rid()}`
    const productId = admin
    const created = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/products`, { sku, name: 'Fulfillment Test Cigar', priceCents, initialQuantity: 50 })
    const pid = created.body.product.product_id
    // guest identity via /api/auth/me bootstrap (guest cookie auto-issued by smokecraftGuestIdentity middleware)
    await guest.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}`)
    const hold = await guest.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${pid}/stick-hold`, { idempotencyKey: `vh1b2b2-hold-${rid()}` })
    if (!hold.body?.hold) return null
    const holdId = hold.body.hold.hold_id
    const order = await guest.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, {
      holdId, fulfillmentMethod: 'counter_pickup', fulfillmentDetails: {}, customerNotes: '', ageVerified: true, idempotencyKey: `vh1b2b2-order-${rid()}`,
    })
    return { guest, productId: pid, order: order.body.order }
  }

  console.log('\n── 1. Authorized queue access / unauthorized denial / venue isolation ──')
  const ctx1 = await createRealOrder(venueA)
  const authorizedQueue = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders`)
  assert('An authorized manager can load the real order queue', authorizedQueue.status === 200 && Array.isArray(authorizedQueue.body.orders))
  assert('The real order created via checkout appears in the queue', authorizedQueue.body.orders.some(o => o.order_id === ctx1.order.order_id))

  const stranger = makeClient()
  await stranger.post('/api/auth/staff-pin-login', { pin: '1234' })
  const venueC = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b2-test-venue-c-${Date.now()}', 'VH1B2B2 Test Venue C', 'cigar_lounge', 'active') RETURNING venue_id`)
  const unauthorizedQueue = await stranger.get(`/api/smokecraft/venue-humidor/venues/${venueC}/admin/orders`)
  assert('A user with no membership is denied the queue', unauthorizedQueue.status === 403)

  const crossVenueQueue = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders`)
  assert('A venue A staff member cannot list venue B queue (venue isolation)', crossVenueQueue.status === 403)

  console.log('\n── 2. Order detail access ──')
  const detail = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.order.order_id}`)
  assert('Order detail loads real items with real availability', detail.status === 200 && detail.body.order.items.length === 1 && detail.body.order.items[0].availability)
  const crossVenueDetail = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders/${ctx1.order.order_id}`)
  assert('A staff member cannot fetch venue A order detail via venue B path (cross-venue denial)', crossVenueDetail.status === 404 || crossVenueDetail.status === 403)

  console.log('\n── 3. Order claim ──')
  const claim = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.order.order_id}/claim`, { idempotencyKey: `vh1b2b2-claim-${rid()}` })
  assert('Staff can claim an unassigned order', claim.status === 200 && claim.body.order.assigned_staff_id === staffId)

  console.log('\n── 4. Concurrent claim conflict ──')
  const ctx2 = await createRealOrder(venueA)
  const [claimA, claimB] = await Promise.all([
    staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx2.order.order_id}/claim`, { idempotencyKey: `vh1b2b2-race-a-${rid()}` }),
    manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx2.order.order_id}/claim`, { idempotencyKey: `vh1b2b2-race-b-${rid()}` }),
  ])
  const oneSucceeded = [claimA, claimB].filter(r => r.status === 200).length === 1
  const oneConflicted = [claimA, claimB].filter(r => r.status === 409).length === 1
  assert('Two simultaneous claim attempts: exactly one succeeds, one is honestly rejected (409)', oneSucceeded && oneConflicted)

  console.log('\n── 5. Assignment (reassign) ──')
  const currentDetail = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx2.order.order_id}`)
  const reassign = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx2.order.order_id}/assign`, {
    targetStaffId: managerId, expectedVersion: currentDetail.body.order.assignment_version, idempotencyKey: `vh1b2b2-assign-${rid()}`,
  })
  assert('A manager can reassign an order', reassign.status === 200 && reassign.body.order.assigned_staff_id === managerId)
  const staffCannotReassign = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx2.order.order_id}/assign`, { targetStaffId: staffId, expectedVersion: reassign.body.order.assignment_version, idempotencyKey: `vh1b2b2-assign2-${rid()}` })
  assert('A staff (non-full-access) member cannot reassign an order', staffCannotReassign.status === 403)

  console.log('\n── 6. Invalid assignment (stale version) ──')
  const staleAssign = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx2.order.order_id}/assign`, { targetStaffId: staffId, expectedVersion: 0, idempotencyKey: `vh1b2b2-assign-stale-${rid()}` })
  assert('Reassigning with a stale expectedVersion is honestly rejected (409)', staleAssign.status === 409)

  console.log('\n── 7. Valid status transitions ──')
  const confirm = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.order.order_id}/confirm`, { idempotencyKey: `vh1b2b2-confirm-${rid()}` })
  assert('Confirming a claimed order succeeds', confirm.status === 200 && confirm.body.order.fulfillment_status === 'confirmed')
  const prepare = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.order.order_id}/prepare`, { idempotencyKey: `vh1b2b2-prepare-${rid()}` })
  assert('Starting preparation succeeds', prepare.status === 200 && prepare.body.order.fulfillment_status === 'in_preparation')

  const readyBeforePick = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.order.order_id}/ready`, { idempotencyKey: `vh1b2b2-ready-early-${rid()}` })
  assert('Marking ready before items are picked is honestly rejected (409 items_not_picked)', readyBeforePick.status === 409 && readyBeforePick.body.error === 'items_not_picked')

  const itemId = detail.body.order.items[0].order_item_id
  const pick = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.order.order_id}/items/${itemId}/pick`, { idempotencyKey: `vh1b2b2-pick-${rid()}` })
  assert('Marking an item picked succeeds', pick.status === 200 && pick.body.item.is_picked === true)

  const ready = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.order.order_id}/ready`, { idempotencyKey: `vh1b2b2-ready-${rid()}` })
  assert('Marking ready succeeds once all items are picked', ready.status === 200 && ready.body.order.fulfillment_status === 'ready')

  console.log('\n── 8. Invalid status jumps ──')
  const badJump = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx2.order.order_id}/ready`, { idempotencyKey: `vh1b2b2-badjump-${rid()}` })
  assert('Jumping straight to ready from new/claimed (no confirm/prepare) is honestly rejected (409)', badJump.status === 409)

  console.log('\n── 9. Complete order through checkoutService.completeOrder() ──')
  // 1B-2B-3 requires a real handoff confirmation before a ready order
  // may complete — the locked 1B-2B-2 flow now includes that step.
  await verifyAndHandoff(staff, venueA, ctx1.order.order_id)
  const beforeComplete = psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${ctx1.productId}'`)
  const complete = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.order.order_id}/complete`, { idempotencyKey: `vh1b2b2-complete-${rid()}` })
  assert('Completing a ready order succeeds via the canonical checkoutService path', complete.status === 200 && complete.body.order.status === 'completed' && complete.body.order.fulfillment_status === 'completed')
  const afterComplete = psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${ctx1.productId}'`)
  assert('Inventory decreased by exactly the ordered quantity on completion', Number(beforeComplete) - Number(afterComplete) === 1)

  console.log('\n── 10. Duplicate completion idempotency ──')
  const dupComplete = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.order.order_id}/complete`, { idempotencyKey: `vh1b2b2-complete-dup-${rid()}` })
  assert('Re-completing an already-completed order is idempotent, never re-deducts', dupComplete.status === 200 && dupComplete.body.order.status === 'completed')
  const afterDupComplete = psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${ctx1.productId}'`)
  assert('Inventory did not change on the duplicate completion attempt', afterDupComplete === afterComplete)

  console.log('\n── 11. Already completed / cannot re-enter preparation ──')
  const reprepAfterComplete = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.order.order_id}/prepare`, { idempotencyKey: `vh1b2b2-reprep-${rid()}` })
  assert('A completed order cannot re-enter preparation', reprepAfterComplete.status === 409)
  const cancelAfterComplete = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.order.order_id}/cancel`, { reason: 'test', idempotencyKey: `vh1b2b2-cancel-completed-${rid()}` })
  assert('A completed order cannot be cancelled through the pre-completion cancel path (already terminal, honestly rejected)', cancelAfterComplete.status === 409)

  console.log('\n── 12. Cancel order through checkoutService.cancelOrder() ──')
  const ctx3 = await createRealOrder(venueA)
  const claim3 = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx3.order.order_id}/claim`, { idempotencyKey: `vh1b2b2-claim3-${rid()}` })
  const cancelNoReason = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx3.order.order_id}/cancel`, { idempotencyKey: `vh1b2b2-cancel-noreason-${rid()}` })
  assert('Cancelling without a reason is honestly rejected', cancelNoReason.status === 400)
  const cancel = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx3.order.order_id}/cancel`, { reason: 'customer no-show', idempotencyKey: `vh1b2b2-cancel-${rid()}` })
  assert('Cancelling a pre-completion order succeeds via the canonical checkoutService path', cancel.status === 200 && cancel.body.order.status === 'cancelled' && cancel.body.order.fulfillment_status === 'cancelled')
  assert('The real cancellation reason persists on the order', cancel.body.order.cancellation_reason === 'customer no-show')

  console.log('\n── 13. Duplicate cancellation idempotency ──')
  const dupCancel = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx3.order.order_id}/cancel`, { reason: 'customer no-show', idempotencyKey: `vh1b2b2-cancel-dup-${rid()}` })
  assert('Re-cancelling an already-cancelled order is idempotent', dupCancel.status === 200 && dupCancel.body.order.status === 'cancelled')

  console.log('\n── 14. Already cancelled cannot complete ──')
  const completeAfterCancel = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx3.order.order_id}/complete`, { idempotencyKey: `vh1b2b2-complete-after-cancel-${rid()}` })
  assert('A cancelled order cannot later be completed', completeAfterCancel.status === 409)

  console.log('\n── 15. Concurrent completion / cancellation protection ──')
  const ctx4 = await createRealOrder(venueA)
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx4.order.order_id}/claim`, { idempotencyKey: `vh1b2b2-claim4-${rid()}` })
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx4.order.order_id}/confirm`, { idempotencyKey: `vh1b2b2-confirm4-${rid()}` })
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx4.order.order_id}/prepare`, { idempotencyKey: `vh1b2b2-prepare4-${rid()}` })
  const detail4 = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx4.order.order_id}`)
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx4.order.order_id}/items/${detail4.body.order.items[0].order_item_id}/pick`, { idempotencyKey: `vh1b2b2-pick4-${rid()}` })
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx4.order.order_id}/ready`, { idempotencyKey: `vh1b2b2-ready4-${rid()}` })
  await verifyAndHandoff(staff, venueA, ctx4.order.order_id)
  const beforeConcurrentComplete = psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${ctx4.productId}'`)
  const sharedCompleteKey = `vh1b2b2-concurrent-complete-${rid()}`
  const [cc1, cc2] = await Promise.all([
    staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx4.order.order_id}/complete`, { idempotencyKey: sharedCompleteKey }),
    manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx4.order.order_id}/complete`, { idempotencyKey: sharedCompleteKey }),
  ])
  const afterConcurrentComplete = psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${ctx4.productId}'`)
  assert('Concurrent identical completion requests (shared idempotency key) deduct inventory exactly once', Number(beforeConcurrentComplete) - Number(afterConcurrentComplete) === 1)
  assert('Both concurrent completion requests resolve to the same completed order, no crash', cc1.status === 200 && cc2.status === 200 && cc1.body.order.order_id === cc2.body.order.order_id)

  console.log('\n── 16. Negative inventory protection ──')
  const ctx5 = await createRealOrder(venueA)
  const otherProduct = admin
  psql(`UPDATE venue_cigar_products SET physical_quantity = 0 WHERE product_id = '${ctx5.productId}'`)
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx5.order.order_id}/claim`, { idempotencyKey: `vh1b2b2-claim5-${rid()}` })
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx5.order.order_id}/confirm`, { idempotencyKey: `vh1b2b2-confirm5-${rid()}` })
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx5.order.order_id}/prepare`, { idempotencyKey: `vh1b2b2-prepare5-${rid()}` })
  const detail5 = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx5.order.order_id}`)
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx5.order.order_id}/items/${detail5.body.order.items[0].order_item_id}/pick`, { idempotencyKey: `vh1b2b2-pick5-${rid()}` })
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx5.order.order_id}/ready`, { idempotencyKey: `vh1b2b2-ready5-${rid()}` })
  await verifyAndHandoff(staff, venueA, ctx5.order.order_id)
  const negComplete = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx5.order.order_id}/complete`, { idempotencyKey: `vh1b2b2-complete5-${rid()}` })
  assert('Completing an order whose product now has zero real inventory is honestly rejected (409 insufficient_inventory)', negComplete.status === 409 && negComplete.body.error === 'insufficient_inventory')

  console.log('\n── 17. Append-only history and filtering ──')
  const history = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/history?orderId=${ctx1.order.order_id}`)
  assert('Fulfillment history loads real, append-only events for the order', history.status === 200 && history.body.events.length > 0)
  const historyByType = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/history?eventType=order_completed`)
  assert('Filtering history by event type returns only matching real events', historyByType.body.events.length > 0 && historyByType.body.events.every(e => e.event_type === 'order_completed'))
  const historyByActor = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/history?actorId=${staffId}`)
  assert('Filtering history by actor returns only matching real events', historyByActor.body.events.every(e => e.actor_id === staffId))

  console.log('\n── 18. Cross-venue direct API denial ──')
  const crossVenueClaim = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders/${ctx1.order.order_id}/claim`, { idempotencyKey: `vh1b2b2-crossclaim-${rid()}` })
  assert('Direct API claim attempt on a venue A order via venue B path is denied', crossVenueClaim.status === 403 || crossVenueClaim.status === 404)

  console.log('\n── 19. Mentor read-only enforcement ──')
  const ctx6 = await createRealOrder(venueB)
  const mentorRead = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders`)
  assert('A mentor (tobacconist tier) can read the venue B queue', mentorRead.status === 200)
  const mentorClaim = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders/${ctx6.order.order_id}/claim`, { idempotencyKey: `vh1b2b2-mentorclaim-${rid()}` })
  assert('A mentor cannot claim an order', mentorClaim.status === 403)
  const mentorComplete = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders/${ctx6.order.order_id}/complete`, { idempotencyKey: `vh1b2b2-mentorcomplete-${rid()}` })
  assert('A mentor cannot complete an order', mentorComplete.status === 403)
  const mentorCancel = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders/${ctx6.order.order_id}/cancel`, { reason: 'x', idempotencyKey: `vh1b2b2-mentorcancel-${rid()}` })
  assert('A mentor cannot cancel an order', mentorCancel.status === 403)

  console.log('\n── 20. Direct API bypass attempts (non-staff) ──')
  const nonStaffBypass = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders/${ctx6.order.order_id}/complete`, { idempotencyKey: `vh1b2b2-bypass-${rid()}` })
  assert('A user with no venue membership at all for venue B cannot complete an order via direct API call', nonStaffBypass.status === 403)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-2b-2', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-2b-2/01-fulfillment-queue-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
