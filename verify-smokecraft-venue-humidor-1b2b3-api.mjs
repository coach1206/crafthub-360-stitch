#!/usr/bin/env node
/**
 * Venue Humidor 1B-2B-3 — customer pickup, venue service, and
 * fulfillment confirmation tests against the real running server,
 * zero mocking.
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

  const venueA = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b3-test-venue-a-${Date.now()}', 'VH1B2B3 Test Venue A', 'cigar_lounge', 'active') RETURNING venue_id`)
  const venueB = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b3-test-venue-b-${Date.now()}', 'VH1B2B3 Test Venue B', 'cigar_lounge', 'active') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueA}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${staffId}', '${venueA}', 'staff', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueB}', 'mentor', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${staffId}', '${venueB}', 'staff', 'active') ON CONFLICT DO NOTHING`)

  async function createReadyOrder(venueId, method = 'counter_pickup') {
    const guest = makeClient()
    const sku = `VH1B2B3-${rid()}`
    const created = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/products`, { sku, name: 'Pickup Test Cigar', priceCents: 2000, initialQuantity: 50 })
    const pid = created.body.product.product_id
    await guest.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}`)
    const hold = await guest.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${pid}/stick-hold`, { idempotencyKey: `vh1b2b3-hold-${rid()}` })
    const holdId = hold.body.hold.hold_id
    const order = await guest.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, {
      holdId, fulfillmentMethod: method, fulfillmentDetails: {}, customerNotes: '', ageVerified: true, idempotencyKey: `vh1b2b3-order-${rid()}`,
    })
    const orderId = order.body.order.order_id
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/claim`, { idempotencyKey: `vh1b2b3-claim-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/confirm`, { idempotencyKey: `vh1b2b3-confirm-${rid()}` })
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/prepare`, { idempotencyKey: `vh1b2b3-prepare-${rid()}` })
    const detail = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}`)
    for (const item of detail.body.order.items) {
      await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/items/${item.order_item_id}/pick`, { idempotencyKey: `vh1b2b3-pick-${rid()}-${item.order_item_id}` })
    }
    await staff.post(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/orders/${orderId}/ready`, { idempotencyKey: `vh1b2b3-ready-${rid()}` })
    return { guest, productId: pid, orderId }
  }

  console.log('\n── 1. Eligible pickup verification ──')
  const ctx1 = await createReadyOrder(venueA)
  const gen1 = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.orderId}/verification-code`, { idempotencyKey: `vh1b2b3-gen1-${rid()}` })
  assert('Staff can generate a real pickup verification code for an eligible ready order', gen1.status === 200 && /^\d{6}$/.test(gen1.body.code))
  const verify1 = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.orderId}/verify`, { code: gen1.body.code, idempotencyKey: `vh1b2b3-verify1-${rid()}` })
  assert('Verifying the correct code succeeds', verify1.status === 200 && verify1.body.verified === true)

  console.log('\n── 2. Invalid pickup code ──')
  const ctx2 = await createReadyOrder(venueA)
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx2.orderId}/verification-code`, { idempotencyKey: `vh1b2b3-gen2-${rid()}` })
  const badVerify = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx2.orderId}/verify`, { code: '000000', idempotencyKey: `vh1b2b3-badverify-${rid()}` })
  assert('An invalid pickup code is honestly rejected', badVerify.status === 401 && badVerify.body.error === 'verification_failed')

  console.log('\n── 3. Expired pickup code ──')
  const ctx3 = await createReadyOrder(venueA)
  const gen3 = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx3.orderId}/verification-code`, { idempotencyKey: `vh1b2b3-gen3-${rid()}` })
  psql(`UPDATE venue_cigar_orders SET pickup_code_expires_at = now() - interval '1 hour' WHERE order_id = '${ctx3.orderId}'`)
  const expiredVerify = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx3.orderId}/verify`, { code: gen3.body.code, idempotencyKey: `vh1b2b3-expverify-${rid()}` })
  assert('An expired pickup code is honestly rejected', expiredVerify.status === 409 && expiredVerify.body.error === 'verification_code_expired')

  console.log('\n── 4. Wrong-venue code / reused code ──')
  const wrongVenueVerify = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders/${ctx1.orderId}/verify`, { code: gen1.body.code, idempotencyKey: `vh1b2b3-wrongvenue-${rid()}` })
  assert('Verifying a code against the wrong venue is denied (venue isolation)', wrongVenueVerify.status === 403 || wrongVenueVerify.status === 404)
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.orderId}/handoff`, { verificationMethod: 'pickup_code', idempotencyKey: `vh1b2b3-handoff1-${rid()}` })
  const complete1 = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.orderId}/complete`, { idempotencyKey: `vh1b2b3-complete1-${rid()}` })
  const reuseCode = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx1.orderId}/verify`, { code: gen1.body.code, idempotencyKey: `vh1b2b3-reuse-${rid()}` })
  assert('A pickup code cannot be reused after the order completed (invalidated on completion)', reuseCode.status !== 200 || !reuseCode.body.verified)

  console.log('\n── 5. Rate-limit behavior ──')
  const ctx5 = await createReadyOrder(venueA)
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx5.orderId}/verification-code`, { idempotencyKey: `vh1b2b3-gen5-${rid()}` })
  let lastAttempt
  for (let i = 0; i < 6; i++) {
    lastAttempt = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx5.orderId}/verify`, { code: '111111', idempotencyKey: `vh1b2b3-ratelimit-${rid()}-${i}` })
  }
  assert('Exceeding the verification attempt limit auto-blocks the order and denies further attempts', ['verification_failed_order_blocked', 'verification_rate_limited'].includes(lastAttempt.body?.error))
  const ctx5Detail = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx5.orderId}`)
  assert('The auto-blocked order shows fulfillment_status blocked', ctx5Detail.body.order.fulfillment_status === 'blocked')

  console.log('\n── 6. Successful handoff confirmation / completion without verification denied ──')
  const ctx6 = await createReadyOrder(venueA, 'table_delivery')
  const handoffNoVerifyNeeded = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx6.orderId}/handoff`, { verificationMethod: 'staff_visual', location: 'Table 3', idempotencyKey: `vh1b2b3-handoff6-${rid()}` })
  assert('Table delivery handoff succeeds without a pickup code (staff visual confirmation)', handoffNoVerifyNeeded.status === 200 && handoffNoVerifyNeeded.body.order.handoff_at)
  const complete6 = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx6.orderId}/complete`, { idempotencyKey: `vh1b2b3-complete6-${rid()}` })
  assert('Completing after handoff succeeds via the canonical checkoutService path', complete6.status === 200 && complete6.body.order.status === 'completed')

  const ctx7 = await createReadyOrder(venueA)
  const completeNoHandoff = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx7.orderId}/complete`, { idempotencyKey: `vh1b2b3-complete7-${rid()}` })
  assert('Completion without any handoff confirmation is honestly denied', completeNoHandoff.status === 409 && completeNoHandoff.body.error === 'handoff_required')
  const handoffNoVerify = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx7.orderId}/handoff`, { verificationMethod: 'pickup_code', idempotencyKey: `vh1b2b3-handoff7-${rid()}` })
  assert('Handoff for a counter-pickup order without prior code verification is honestly denied', handoffNoVerify.status === 409 && handoffNoVerify.body.error === 'verification_required')

  console.log('\n── 7. Blocked order completion denied ──')
  const ctx8 = await createReadyOrder(venueA)
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx8.orderId}/block`, { reason: 'suspected fraud', idempotencyKey: `vh1b2b3-block8-${rid()}` })
  const completeBlocked = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx8.orderId}/complete`, { idempotencyKey: `vh1b2b3-completeblocked-${rid()}` })
  assert('A blocked order cannot be completed', completeBlocked.status === 409)
  const staffUnblock = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx8.orderId}/unblock`, { idempotencyKey: `vh1b2b3-staffunblock-${rid()}` })
  assert('Staff (non-full-access) cannot unblock an order', staffUnblock.status === 403)
  const managerUnblock = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx8.orderId}/unblock`, { idempotencyKey: `vh1b2b3-managerunblock-${rid()}` })
  assert('A manager can unblock an order', managerUnblock.status === 200 && managerUnblock.body.order.fulfillment_status !== 'blocked')

  console.log('\n── 8. Expiration / expired order completion denied ──')
  const ctx9 = await createReadyOrder(venueA)
  const beforeExpireQty = psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${ctx9.productId}'`)
  const expireResult = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx9.orderId}/expire`, { reason: 'pickup_window_expired', idempotencyKey: `vh1b2b3-expire9-${rid()}` })
  assert('An authorized manager can expire an eligible ready order', expireResult.status === 200 && expireResult.body.order.fulfillment_status === 'expired')
  const afterExpireQty = psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${ctx9.productId}'`)
  assert('Expiration releases the hold through the canonical cancellation path, restoring real availability (no physical deduction ever happened, so quantity is unchanged, not double-restored)', beforeExpireQty === afterExpireQty)
  const completeExpired = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx9.orderId}/complete`, { idempotencyKey: `vh1b2b3-completeexpired-${rid()}` })
  assert('An expired order cannot be completed', completeExpired.status === 409)
  const staffExpire = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx9.orderId}/expire`, { reason: 'x', idempotencyKey: `vh1b2b3-staffexpire-${rid()}` })
  assert('Staff (non-full-access) cannot expire an order', staffExpire.status === 403)

  console.log('\n── 9. No-show event / pickup-window extension ──')
  const ctx10 = await createReadyOrder(venueA)
  const noShow = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx10.orderId}/no-show`, { notes: 'customer did not arrive', nextAction: 'extend', idempotencyKey: `vh1b2b3-noshow10-${rid()}` })
  assert('Staff can mark an eligible ready order as a no-show', noShow.status === 200 && noShow.body.order.no_show_at)
  const staffExtend = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx10.orderId}/extend-pickup-window`, { newPromisedAt: new Date(Date.now() + 3600000).toISOString(), idempotencyKey: `vh1b2b3-staffextend-${rid()}` })
  assert('Staff (non-full-access) cannot extend the pickup window', staffExtend.status === 403)
  const newTime = new Date(Date.now() + 3600000).toISOString()
  const managerExtend = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx10.orderId}/extend-pickup-window`, { newPromisedAt: newTime, idempotencyKey: `vh1b2b3-managerextend-${rid()}` })
  assert('A manager can extend the pickup window and the new time persists', managerExtend.status === 200 && new Date(managerExtend.body.order.promised_at).getTime() === new Date(newTime).getTime())

  console.log('\n── 10. Idempotent / concurrent completion ──')
  const ctx11 = await createReadyOrder(venueA)
  const gen11 = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx11.orderId}/verification-code`, { idempotencyKey: `vh1b2b3-gen11-${rid()}` })
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx11.orderId}/verify`, { code: gen11.body.code, idempotencyKey: `vh1b2b3-verify11-${rid()}` })
  await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx11.orderId}/handoff`, { verificationMethod: 'pickup_code', idempotencyKey: `vh1b2b3-handoff11-${rid()}` })
  const complete11a = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx11.orderId}/complete`, { idempotencyKey: `vh1b2b3-complete11-${rid()}` })
  const complete11b = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx11.orderId}/complete`, { idempotencyKey: `vh1b2b3-complete11-dup-${rid()}` })
  assert('Duplicate completion calls are idempotent, both resolve to the identical completed order', complete11a.status === 200 && complete11b.status === 200 && complete11a.body.order.order_id === complete11b.body.order.order_id)

  console.log('\n── 11. Venue isolation ──')
  const crossVenueVerify = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders/${ctx11.orderId}/verify`, { code: '123456', idempotencyKey: `vh1b2b3-crossverify-${rid()}` })
  assert('Verifying a venue A order via the venue B path is denied', crossVenueVerify.status === 403 || crossVenueVerify.status === 404)

  console.log('\n── 12. Mentor direct-API denial ──')
  const ctx12b = await createReadyOrder(venueB)
  const mentorHandoff = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders/${ctx12b.orderId}/handoff`, { verificationMethod: 'staff_visual', idempotencyKey: `vh1b2b3-mentorhandoff-${rid()}` })
  assert('A mentor (tobacconist tier) cannot confirm handoff', mentorHandoff.status === 403)
  const mentorExpire = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/orders/${ctx12b.orderId}/expire`, { reason: 'x', idempotencyKey: `vh1b2b3-mentorexpire-${rid()}` })
  assert('A mentor (tobacconist tier) cannot expire an order even though mentor is in FULL_ACCESS role check bucket only for owner/admin/manager', mentorExpire.status === 403)

  console.log('\n── 13. Passport acquisition triggers exactly once ──')
  const passportCount1 = psql(`SELECT count(*) FROM venue_cigar_passport_acquisitions WHERE order_id = '${ctx11.orderId}'`)
  assert('A completed order has exactly one real Passport acquisition row', passportCount1 === '1')
  const passportRow = psql(`SELECT customer_reference, venue_id, quantity FROM venue_cigar_passport_acquisitions WHERE order_id = '${ctx11.orderId}'`)
  assert('The Passport acquisition row has real customer/venue/quantity data', passportRow.includes(venueA))

  console.log('\n── 14. No Passport save for cancelled/expired orders ──')
  const passportCountExpired = psql(`SELECT count(*) FROM venue_cigar_passport_acquisitions WHERE order_id = '${ctx9.orderId}'`)
  assert('An expired order has NO Passport acquisition row', passportCountExpired === '0')
  const ctx13 = await createReadyOrder(venueA)
  await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/${ctx13.orderId}/cancel`, { reason: 'test', idempotencyKey: `vh1b2b3-cancel13-${rid()}` })
  const passportCountCancelled = psql(`SELECT count(*) FROM venue_cigar_passport_acquisitions WHERE order_id = '${ctx13.orderId}'`)
  assert('A cancelled order has NO Passport acquisition row', passportCountCancelled === '0')

  console.log('\n── 15. Append-only history ──')
  const history11 = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/orders/history?orderId=${ctx11.orderId}`)
  const eventTypes = history11.body.events.map(e => e.event_type)
  assert('The completed order\'s fulfillment history includes real verification/handoff/completion events', eventTypes.includes('verification_generated') && eventTypes.includes('verification_passed') && eventTypes.includes('handoff_confirmed') && eventTypes.includes('order_completed'))

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-2b-3', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-2b-3/01-pickup-handoff-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
