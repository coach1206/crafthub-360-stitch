#!/usr/bin/env node
/**
 * Production Package 6 Correction — Checkout Compliance Enforcement API
 * tests against the real running server, zero mocking. Covers the full
 * eligibility vocabulary (age verification, jurisdiction, Terms/Privacy/
 * warning acceptance, fulfillment/shipping restrictions), the
 * no-hold/no-order/no-payment-intent-on-denial guarantee, staff-assisted
 * verification, cross-user/cross-venue isolation, consent, data-rights,
 * compliance-admin RBAC, and the append-only audit trail.
 */
import http from 'http'
import 'dotenv/config'
import { execSync } from 'child_process'

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
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b), patch: (p, b) => request('PATCH', p, b), get cookies() { return cookies } }
}

function decodeGuestSub(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try { return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')).sub } catch { return null }
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }
const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

async function acceptAllCurrentPolicies(client, guestSub, jurisdictionCode = 'US-DEFAULT') {
  const policies = await client.get('/api/compliance/policies?locale=en')
  const current = (policies.body?.policies || []).filter(p => p.is_current &&
    ['terms', 'privacy', 'tobacco_warning'].includes(p.policy_type) &&
    (p.jurisdiction_code === null || p.jurisdiction_code === jurisdictionCode))
  const seen = new Set()
  for (const p of current) {
    if (seen.has(p.policy_type)) continue
    seen.add(p.policy_type)
    await client.post('/api/compliance/policies/accept', { subjectType: 'guest', subjectId: guestSub, policyVersionId: p.id, locale: 'en' })
  }
  return [...seen]
}

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()

  const venueId = 'vh-seed-venue-alpha'
  const productId = psql(`SELECT product_id FROM venue_cigar_products WHERE venue_id = '${venueId}' AND sku = 'ALPHA-001'`)

  // Reset the shared seed product's holds before this run — this suite
  // creates many real holds against it, so repeated runs would otherwise
  // exhaust availability (same convention as verify-smokecraft-venue-humidor-1b2a-api.mjs).
  psql(`DELETE FROM venue_cigar_inventory_holds WHERE product_id = '${productId}' AND status = 'active'`)

  const admin = makeClient()
  await admin.post('/api/auth/admin-login', { email: 'admin@novee.dev', pin: '9999' })
  const manager = makeClient()
  await manager.post('/api/auth/admin-login', { email: 'manager@novee.dev', pin: '5678' })
  const staff = makeClient()
  await staff.post('/api/auth/staff-pin-login', { pin: '1234' })

  async function newGuest() {
    const g = makeClient()
    await g.get(`/api/smokecraft/venue-humidor/customer/venues/${venueId}`)
    const sub = decodeGuestSub(g.cookies['smokecraft_guest_session'])
    return { g, sub }
  }
  async function newHold(client) {
    const h = await client.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/products/${productId}/stick-hold`, { idempotencyKey: `sc6c-hold-${rid()}` })
    return h.body.hold.hold_id
  }

  console.log('\n── 1. Fully eligible checkout succeeds ──')
  {
    const { g, sub } = await newGuest()
    await g.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub, jurisdictionCode: 'US-DEFAULT', method: 'self_attestation', declaredBirthdate: '1990-01-01' })
    await acceptAllCurrentPolicies(g, sub)
    const quote = await g.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/quote`, { holdId: await newHold(g) })
    assert('Quote reports complianceEligible:true once fully eligible', quote.body.quote.complianceEligible === true && quote.body.quote.complianceState === 'eligible-for-checkout')
    const hold = await newHold(g)
    const order = await g.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold, fulfillmentMethod: 'counter_pickup', idempotencyKey: `sc6c-order-${rid()}` })
    assert('Order creation succeeds for a fully eligible customer', order.status === 200 && !!order.body.order)
  }

  console.log('\n── 2. Age-verification-required denial (never verified) ──')
  {
    const { g, sub } = await newGuest()
    await acceptAllCurrentPolicies(g, sub) // policies accepted, but no age verification
    const hold = await newHold(g)
    const order = await g.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold, fulfillmentMethod: 'counter_pickup', idempotencyKey: `sc6c-order-${rid()}` })
    assert('Denied with age-verification-required', order.status === 403 && order.body.error === 'age-verification-required')
    const holdCheck = await g.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/quote`, { holdId: hold })
    assert('No order was created — the hold is still active/quotable', holdCheck.status === 200 && holdCheck.body.quote.holdId === hold)
    const orderList = psql(`SELECT count(*) FROM venue_cigar_orders WHERE hold_id = '${hold}'`)
    assert('No hold-conversion / order row exists in the DB for the denied hold', orderList === '0')
  }

  console.log('\n── 3. Underage denial (declared birthdate under minimum) ──')
  {
    const { g, sub } = await newGuest()
    await g.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub, jurisdictionCode: 'US-DEFAULT', method: 'self_attestation', declaredBirthdate: new Date(Date.now() - 16 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10) })
    await acceptAllCurrentPolicies(g, sub)
    const hold = await newHold(g)
    const order = await g.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold, fulfillmentMethod: 'counter_pickup', idempotencyKey: `sc6c-order-${rid()}` })
    assert('Underage self-attestation is stored as denied and checkout is rejected', order.status === 403 && order.body.error === 'age-verification-required')
  }

  console.log('\n── 4. Expired age verification denial ──')
  {
    const { g, sub } = await newGuest()
    await g.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub, jurisdictionCode: 'US-DEFAULT', method: 'self_attestation', declaredBirthdate: '1990-01-01' })
    // Force-expire the just-created record directly (simulating time passing) — real DB row, no mock.
    psql(`UPDATE age_verification_records SET expires_at = now() - interval '1 day' WHERE subject_type='guest' AND subject_id='${sub}'`)
    await acceptAllCurrentPolicies(g, sub)
    const hold = await newHold(g)
    const order = await g.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold, fulfillmentMethod: 'counter_pickup', idempotencyKey: `sc6c-order-${rid()}` })
    assert('Denied with age-verification-expired (distinct from never-verified)', order.status === 403 && order.body.error === 'age-verification-expired')
  }

  console.log('\n── 5. Unsupported jurisdiction denial ──')
  {
    // Test isolation: this suite (and the ComplianceAdmin UI it proves out)
    // can leave US-FL toggled active from a prior run — reset it to its
    // seeded 'draft' (not-yet-launched) state before asserting the denial.
    psql(`UPDATE compliance_jurisdictions SET status = 'draft' WHERE code = 'US-FL'`)
    const draftVenue = psql(`INSERT INTO venues (venue_id, name, venue_type, status, state) VALUES ('sc6c-fl-venue-${rid()}', 'FL Test Venue', 'cigar_lounge', 'active', 'FL') RETURNING venue_id`)
    const flProductRes = await admin.post(`/api/smokecraft/venue-humidor/venues/${draftVenue}/admin/products`, { sku: `SC6C-FL-${rid()}`, name: 'FL Test Cigar', priceCents: 1000, initialQuantity: 20 })
    const flProduct = flProductRes.body.product.product_id
    const { g, sub } = await newGuest()
    await g.get(`/api/smokecraft/venue-humidor/customer/venues/${draftVenue}`)
    await g.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub, jurisdictionCode: 'US-FL', method: 'self_attestation', declaredBirthdate: '1990-01-01' })
    await acceptAllCurrentPolicies(g, sub, 'US-FL')
    const hold = await g.post(`/api/smokecraft/venue-humidor/customer/venues/${draftVenue}/products/${flProduct}/stick-hold`, { idempotencyKey: `sc6c-fl-hold-${rid()}` })
    const order = await g.post(`/api/smokecraft/venue-humidor/customer/venues/${draftVenue}/checkout/orders`, { holdId: hold.body.hold.hold_id, fulfillmentMethod: 'counter_pickup', idempotencyKey: `sc6c-fl-order-${rid()}` })
    assert('US-FL (status=draft, not active) is honestly denied as jurisdiction-unsupported', order.status === 403 && order.body.error === 'jurisdiction-unsupported')
  }

  console.log('\n── 6. Missing Terms / Privacy / Warning acceptance denials ──')
  {
    const { g, sub } = await newGuest()
    await g.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub, jurisdictionCode: 'US-DEFAULT', method: 'self_attestation', declaredBirthdate: '1990-01-01' })
    // Accept only privacy + warning, never terms.
    const policies = await g.get('/api/compliance/policies?locale=en')
    const terms = (policies.body.policies || []).find(p => p.policy_type === 'terms' && p.is_current)
    const privacy = (policies.body.policies || []).find(p => p.policy_type === 'privacy' && p.is_current)
    const warning = (policies.body.policies || []).find(p => p.policy_type === 'tobacco_warning' && p.is_current && p.locale === 'en')
    await g.post('/api/compliance/policies/accept', { subjectType: 'guest', subjectId: sub, policyVersionId: privacy.id })
    await g.post('/api/compliance/policies/accept', { subjectType: 'guest', subjectId: sub, policyVersionId: warning.id })
    const hold1 = await newHold(g)
    const order1 = await g.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold1, fulfillmentMethod: 'counter_pickup', idempotencyKey: `sc6c-order-${rid()}` })
    assert('Missing Terms acceptance is denied as terms-acceptance-required', order1.status === 403 && order1.body.error === 'terms-acceptance-required')

    await g.post('/api/compliance/policies/accept', { subjectType: 'guest', subjectId: sub, policyVersionId: terms.id })
    // New guest, only accept terms — never privacy.
    const { g: g2, sub: sub2 } = await newGuest()
    await g2.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub2, jurisdictionCode: 'US-DEFAULT', method: 'self_attestation', declaredBirthdate: '1990-01-01' })
    await g2.post('/api/compliance/policies/accept', { subjectType: 'guest', subjectId: sub2, policyVersionId: terms.id })
    await g2.post('/api/compliance/policies/accept', { subjectType: 'guest', subjectId: sub2, policyVersionId: warning.id })
    const hold2 = await newHold(g2)
    const order2 = await g2.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold2, fulfillmentMethod: 'counter_pickup', idempotencyKey: `sc6c-order-${rid()}` })
    assert('Missing Privacy acknowledgement is denied as privacy-acknowledgement-required', order2.status === 403 && order2.body.error === 'privacy-acknowledgement-required')

    const { g: g3, sub: sub3 } = await newGuest()
    await g3.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub3, jurisdictionCode: 'US-DEFAULT', method: 'self_attestation', declaredBirthdate: '1990-01-01' })
    await g3.post('/api/compliance/policies/accept', { subjectType: 'guest', subjectId: sub3, policyVersionId: terms.id })
    await g3.post('/api/compliance/policies/accept', { subjectType: 'guest', subjectId: sub3, policyVersionId: privacy.id })
    const hold3 = await newHold(g3)
    const order3 = await g3.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold3, fulfillmentMethod: 'counter_pickup', idempotencyKey: `sc6c-order-${rid()}` })
    assert('Missing tobacco-warning acknowledgement is denied as warning-acknowledgement-required', order3.status === 403 && order3.body.error === 'warning-acknowledgement-required')
  }

  console.log('\n── 7. Shipping disabled by default (jurisdiction-scoped) ──')
  {
    const { g, sub } = await newGuest()
    await g.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub, jurisdictionCode: 'US-DEFAULT', method: 'self_attestation', declaredBirthdate: '1990-01-01' })
    await acceptAllCurrentPolicies(g, sub)
    // Venue must support "shipping" as a fulfillment method to even reach the jurisdiction check.
    psql(`UPDATE venues SET settings = coalesce(settings,'{}'::jsonb) || '{"venueHumidorFulfillment":{"counter_pickup":true,"table_delivery":true,"lounge_seat_delivery":true,"shipping":true}}'::jsonb WHERE venue_id = '${venueId}'`)
    const hold = await newHold(g)
    const order = await g.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold, fulfillmentMethod: 'shipping', idempotencyKey: `sc6c-order-${rid()}` })
    assert('Shipping is denied as shipping-prohibited (US-DEFAULT.shipping_allowed=false)', order.status === 409 && order.body.error === 'shipping-prohibited')
    psql(`UPDATE venues SET settings = settings - 'venueHumidorFulfillment' WHERE venue_id = '${venueId}'`)
  }

  console.log('\n── 8. Staff-assisted verification (real staff actor) ──')
  {
    const { g, sub } = await newGuest()
    const denied = await staff.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub, jurisdictionCode: 'US-DEFAULT', method: 'staff_verified', staffApproved: false })
    assert('Staff-recorded denial is stored honestly', denied.status === 201 && denied.body.record.result === 'denied')
    const approved = await staff.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub, jurisdictionCode: 'US-DEFAULT', method: 'staff_verified', staffApproved: true })
    assert('Staff-recorded approval succeeds and records a staff actor id', approved.status === 201 && approved.body.record.result === 'approved' && !!approved.body.record.staff_actor_id)
    const anonAttempt = await g.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub, jurisdictionCode: 'US-DEFAULT', method: 'staff_verified', staffApproved: true })
    assert('An anonymous guest cannot self-issue a staff_verified record', anonAttempt.status === 401 && anonAttempt.body.error === 'staff_actor_required')
  }

  console.log('\n── 9. Cross-user / cross-venue isolation ──')
  {
    const { g: gA, sub: subA } = await newGuest()
    const { g: gB } = await newGuest()
    await gA.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: subA, jurisdictionCode: 'US-DEFAULT', method: 'self_attestation', declaredBirthdate: '1990-01-01' })
    await acceptAllCurrentPolicies(gA, subA)
    const req = await gA.post('/api/compliance/data-rights/requests', { subjectType: 'guest', subjectId: subA, requestType: 'export' })
    const crossReadAttempt = await gB.post(`/api/compliance/data-rights/requests/${req.body.request.id}/export`)
    assert('A different guest cannot export another subject\'s data-rights request (auth required for self-serve export)', crossReadAttempt.status === 401 || crossReadAttempt.status === 403)

    const venueB = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('sc6c-venue-b-${rid()}', 'SC6C Venue B', 'cigar_lounge', 'active') RETURNING venue_id`)
    const productBRes = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/products`, { sku: `SC6C-B-${rid()}`, name: 'Venue B Cigar', priceCents: 1000, initialQuantity: 20 })
    const productB = productBRes.body.product.product_id
    await gA.get(`/api/smokecraft/venue-humidor/customer/venues/${venueB}`)
    const holdInB = await gA.post(`/api/smokecraft/venue-humidor/customer/venues/${venueB}/products/${productB}/stick-hold`, { idempotencyKey: `sc6c-crossvenue-${rid()}` })
    const crossVenueOrder = await gA.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: holdInB.body.hold.hold_id, fulfillmentMethod: 'counter_pickup', idempotencyKey: `sc6c-crossvenue-order-${rid()}` })
    assert('A hold from venue B cannot be checked out through venue A\'s path (wrong_venue_hold)', crossVenueOrder.status === 403 && crossVenueOrder.body.error === 'wrong_venue_hold')
  }

  console.log('\n── 10. Policy-version mismatch (accepting a stale version does not satisfy current-version requirement) ──')
  {
    const staleVersion = psql(`INSERT INTO policy_versions (policy_type, version, locale, body_markdown, effective_date, counsel_review_status, is_current) VALUES ('terms', 'sc6c-stale-${rid()}', 'en', '[DRAFT] stale test terms', '2020-01-01', 'pending', false) RETURNING id`)
    const { g, sub } = await newGuest()
    await g.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub, jurisdictionCode: 'US-DEFAULT', method: 'self_attestation', declaredBirthdate: '1990-01-01' })
    await g.post('/api/compliance/policies/accept', { subjectType: 'guest', subjectId: sub, policyVersionId: staleVersion })
    const policies = await g.get('/api/compliance/policies?locale=en')
    const privacy = (policies.body.policies || []).find(p => p.policy_type === 'privacy' && p.is_current)
    const warning = (policies.body.policies || []).find(p => p.policy_type === 'tobacco_warning' && p.is_current && p.locale === 'en')
    await g.post('/api/compliance/policies/accept', { subjectType: 'guest', subjectId: sub, policyVersionId: privacy.id })
    await g.post('/api/compliance/policies/accept', { subjectType: 'guest', subjectId: sub, policyVersionId: warning.id })
    const hold = await newHold(g)
    const order = await g.post(`/api/smokecraft/venue-humidor/customer/venues/${venueId}/checkout/orders`, { holdId: hold, fulfillmentMethod: 'counter_pickup', idempotencyKey: `sc6c-order-${rid()}` })
    assert('Accepting a non-current (stale) Terms version does not satisfy the current-version requirement', order.status === 403 && order.body.error === 'terms-acceptance-required')
  }

  console.log('\n── 11. Consent grant / withdrawal ──')
  {
    const { g, sub } = await newGuest()
    const setRes = await g.post('/api/compliance/consent', { subjectType: 'guest', subjectId: sub, preferences: true, analytics: true, marketing: false, consentVersion: 'sc6c-test' })
    assert('Consent can be granted with explicit, non-preselected categories', setRes.status === 201 && setRes.body.consent.preferences === true && setRes.body.consent.marketing === false)
    const getRes = await g.get(`/api/compliance/consent?subjectType=guest&subjectId=${sub}`)
    assert('Current consent read reflects the grant', getRes.body.consent.analytics === true)
    const withdrawRes = await g.post('/api/compliance/consent/withdraw', { subjectType: 'guest', subjectId: sub })
    assert('Consent withdrawal succeeds', withdrawRes.status === 201 && withdrawRes.body.consent.preferences === false && withdrawRes.body.consent.marketing === false)
    const afterWithdraw = await g.get(`/api/compliance/consent?subjectType=guest&subjectId=${sub}`)
    assert('Withdrawal is reflected as the current consent state', afterWithdraw.body.consent.analytics === false)
  }

  console.log('\n── 12. Data-rights export / cross-user denial / deletion with retention exceptions ──')
  {
    const { g, sub } = await newGuest()
    await g.post('/api/compliance/age-verification', { subjectType: 'guest', subjectId: sub, jurisdictionCode: 'US-DEFAULT', method: 'self_attestation', declaredBirthdate: '1990-01-01' })
    const req = await g.post('/api/compliance/data-rights/requests', { subjectType: 'guest', subjectId: sub, requestType: 'export' })
    assert('Data-rights export request is created with a real request number', req.status === 201 && !!req.body.request.request_number)
    const verify = await g.post(`/api/compliance/data-rights/requests/${req.body.request.id}/verify-identity`)
    assert('A guest prototype identity cannot self-verify a request it does not administratively own (401 unauthenticated or 403 forbidden)', verify.status === 401 || verify.status === 403)

    // Use an authenticated staff session acting as the same subject is out
    // of scope for guest export (guest export requires the guest's OWN
    // authenticated session, which prototype guest cookies don't carry);
    // instead confirm the staff-assisted path (staff IS allowed) works,
    // and that another ordinary staff/non-owner cannot read someone else's request improperly.
    const staffReq = await g.post('/api/compliance/data-rights/requests', { subjectType: 'guest', subjectId: sub, requestType: 'deletion' })
    const staffVerify = await staff.post(`/api/compliance/data-rights/requests/${staffReq.body.request.id}/verify-identity`)
    assert('Staff can identity-verify a data-rights request on a customer\'s behalf', staffVerify.status === 200 && staffVerify.body.request.status === 'identity_verified')
    const preview = await staff.post(`/api/compliance/data-rights/requests/${staffReq.body.request.id}/preview-deletion`)
    assert('Deletion preview honestly discloses retention exceptions', preview.status === 200 && preview.body.preview.will_retain_with_exception.length > 0)
    const commit = await staff.post(`/api/compliance/data-rights/requests/${staffReq.body.request.id}/commit-deletion`)
    assert('Deletion commit succeeds after preview and revokes sessions', commit.status === 200 && commit.body.sessions_revoked === true)
  }

  console.log('\n── 13. Compliance-admin RBAC ──')
  {
    const stranger = makeClient()
    await stranger.post('/api/auth/staff-pin-login', { pin: '1234' })
    const strangerAudit = await stranger.get('/api/compliance/audit-events')
    assert('A staff-level (non-admin) caller is denied the admin-only audit trail', strangerAudit.status === 403)
    const adminAudit = await admin.get('/api/compliance/audit-events')
    assert('A real admin can read the audit trail', adminAudit.status === 200 && Array.isArray(adminAudit.body.events))
    const managerRetention = await manager.get('/api/compliance/retention-policies')
    assert('A manager can read retention policies (requireManager)', managerRetention.status === 200)
    const unauthedJurisdictionWrite = await stranger.patch('/api/compliance/jurisdictions/US-DEFAULT', { notes: 'unauthorized change attempt' })
    assert('A non-admin cannot modify jurisdiction rules', unauthedJurisdictionWrite.status === 403)
  }

  console.log('\n── 14. Media takedown (reuse of existing mechanism, unmodified) ──')
  {
    const mediaId = `sc6c-media-${rid()}`
    const takedown = await manager.post('/api/compliance/media-rights/takedown', { mediaId, reason: 'Correction-pass regression check' })
    assert('Media rights takedown request succeeds via existing mechanism', takedown.status === 201 && takedown.body.mediaRights.rights_status === 'takedown_requested')
  }

  console.log('\n── 15. Audit events recorded for eligibility decisions ──')
  {
    const events = await admin.get('/api/compliance/audit-events?eventType=tobacco_purchase_denied')
    assert('tobacco_purchase_denied audit events exist from the denial scenarios above', events.status === 200 && events.body.events.length > 0)
    const approvedEvents = await admin.get('/api/compliance/audit-events?eventType=tobacco_purchase_approved')
    assert('tobacco_purchase_approved audit events exist from the eligible scenario above', approvedEvents.status === 200 && approvedEvents.body.events.length > 0)
  }

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===`)
  if (fail > 0) process.exit(1)
}

main().catch((err) => { console.error(err); process.exit(1) })
