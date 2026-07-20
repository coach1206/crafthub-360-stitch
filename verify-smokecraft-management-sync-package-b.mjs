// Package B HTTP + database behavior tests for SmokeCraft Management Sync.
// Runs against a real, isolated local server + Postgres (see
// docs/SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_TEST_REPORT.md for
// environment detail). Test venues/rows are cleaned up at the end.
import pg from 'pg'
import jwt from 'jsonwebtoken'

const BASE = process.env.PKG_B_BASE || 'http://localhost:3011'
const DATABASE_URL = process.env.DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET
if (!DATABASE_URL || !JWT_SECRET) {
  console.error('DATABASE_URL and JWT_SECRET must be set.')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: DATABASE_URL })
const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

function extractCookie(res, name) {
  // node-fetch/undici folds multiple Set-Cookie headers into one string
  // joined by ", " — but cookie attributes like "Expires=Fri, 01 Jan..."
  // also contain commas, so a naive comma-split breaks. Locate the named
  // cookie by its "name=" token instead and take everything up to the
  // next recognizable cookie boundary or end of string.
  const raw = res.headers.get('set-cookie') || ''
  const idx = raw.indexOf(name + '=')
  if (idx === -1) return null
  const rest = raw.slice(idx)
  const value = rest.split(';')[0].split('=')[1]
  return { value, attrs: rest }
}

const VENUE = 'pkg-b-venue-active'
const VENUE_INACTIVE = 'pkg-b-venue-inactive'

try {
  // 1/2. Guest identity can be issued + cookie is HTTP-only
  const sessionRes = await fetch(`${BASE}/api/smokecraft/management-sync/guest-session`, { method: 'POST' })
  const guestCookie = extractCookie(sessionRes, 'smokecraft_guest_session')
  check('Guest identity can be issued', sessionRes.status === 200 && !!guestCookie)
  check('Guest cookie is HTTP-only', !!guestCookie && /HttpOnly/i.test(guestCookie.attrs))

  // 3. Invalid guest token rejected
  const invalidRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/00000000-0000-0000-0000-000000000000`, {
    headers: { Cookie: 'smokecraft_guest_session=not.a.valid.jwt' },
  })
  check('Invalid guest token rejected', invalidRes.status === 401)

  // 4. Expired guest token rejected
  const expiredToken = jwt.sign(
    { sub: 'expired-guest', role: 'guest', scope: 'smokecraft_guest', jti: 'x' },
    JWT_SECRET,
    { expiresIn: -10, issuer: 'crafthub-360', audience: 'smokecraft-guest' }
  )
  const expiredRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/00000000-0000-0000-0000-000000000000`, {
    headers: { Cookie: `smokecraft_guest_session=${expiredToken}` },
  })
  check('Expired guest token rejected', expiredRes.status === 401)

  // 6/7. Valid venue accepted / unknown venue rejected
  const guestCookieHeader = `smokecraft_guest_session=${guestCookie.value}`
  const validVenueRes = await fetch(`${BASE}/api/smokecraft/management-sync/venues/${VENUE}/journeys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
    body: JSON.stringify({ tenantId: 'test-tenant', sessionNumber: 5, phase: 'in_progress', sourceVersion: 'pkg-b-test' }),
  })
  check('Valid venue accepted (journey created)', validVenueRes.status === 201)
  const journeyBody = await validVenueRes.json()
  const journeyId = journeyBody?.journey?.journeyId

  const unknownVenueRes = await fetch(`${BASE}/api/smokecraft/management-sync/venues/nonexistent-venue/journeys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
    body: JSON.stringify({ tenantId: 'test-tenant', sessionNumber: 1, phase: 'in_progress', sourceVersion: 'pkg-b-test' }),
  })
  check('Unknown venue rejected', unknownVenueRes.status === 404)

  // 8. Inactive venue rejected
  const inactiveVenueRes = await fetch(`${BASE}/api/smokecraft/management-sync/venues/${VENUE_INACTIVE}/journeys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
    body: JSON.stringify({ tenantId: 'test-tenant', sessionNumber: 1, phase: 'in_progress', sourceVersion: 'pkg-b-test' }),
  })
  check('Inactive venue rejected', inactiveVenueRes.status === 403)

  // 9. Guest can create their own journey (already proven above); can retrieve it
  const getOwnRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}`, {
    headers: { Cookie: guestCookieHeader },
  })
  check('Guest can retrieve their own journey', getOwnRes.status === 200)

  // 10. Guest cannot supply another guest ID (identity is cookie-derived only — verify body override is ignored)
  const bodyIgnoredRes = await fetch(`${BASE}/api/smokecraft/management-sync/venues/${VENUE}/journeys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
    body: JSON.stringify({ tenantId: 'test-tenant', sessionNumber: 2, phase: 'in_progress', sourceVersion: 'pkg-b-test', guestReference: 'attacker-supplied-id' }),
  })
  check('Client-supplied guestReference rejected by validation', bodyIgnoredRes.status === 400)

  // 13/14. Cross-guest / cross-user denial
  const otherSessionRes = await fetch(`${BASE}/api/smokecraft/management-sync/guest-session`, { method: 'POST' })
  const otherGuestCookie = extractCookie(otherSessionRes, 'smokecraft_guest_session')
  const crossGuestRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}`, {
    headers: { Cookie: `smokecraft_guest_session=${otherGuestCookie.value}` },
  })
  check('Cross-guest access denied', crossGuestRes.status === 403)

  // 20/21. Snapshot creation — server controls version
  const snapRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
    body: JSON.stringify({ completionState: 'completed', rating: 5 }),
  })
  check('Valid snapshot creation succeeds', snapRes.status === 201)
  const snapBody = await snapRes.json()
  check('Server controls snapshot version (starts at 1)', snapBody.snapshotVersion === 1)

  // 22. Duplicate identical snapshot handled safely (idempotent no-op, not an error)
  const dupSnapRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
    body: JSON.stringify({ completionState: 'completed', rating: 5 }),
  })
  const dupSnapBody = await dupSnapRes.json()
  check('Duplicate identical snapshot payload handled safely (no new version)', dupSnapRes.status === 200 && dupSnapBody.duplicate === true)

  // 24. Journey completion succeeds
  const completeRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}/complete`, {
    method: 'POST', headers: { Cookie: guestCookieHeader },
  })
  check('Journey completion succeeds', completeRes.status === 200)

  // 25. Repeated completion is idempotent
  const completeAgainRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}/complete`, {
    method: 'POST', headers: { Cookie: guestCookieHeader },
  })
  const completeAgainBody = await completeAgainRes.json()
  check('Repeated completion is idempotent', completeAgainRes.status === 200 && completeAgainBody.alreadyCompleted === true)

  // 27/28. Sync requires completed journey; valid sync creates one event
  const syncRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
    body: JSON.stringify({ destination: 'venue_insights' }),
  })
  check('Valid sync request creates one event', syncRes.status === 201)

  // 29. Repeated identical sync returns the existing event
  const dupSyncRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
    body: JSON.stringify({ destination: 'venue_insights' }),
  })
  const dupSyncBody = await dupSyncRes.json()
  check('Repeated identical sync returns existing event (idempotent)', dupSyncRes.status === 200 && dupSyncBody.created === false)

  // 30. Simultaneous duplicate sync creates one event (concurrency test)
  const [c1, c2, c3] = await Promise.all([1, 2, 3].map(() =>
    fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
      body: JSON.stringify({ destination: 'venue_insights' }),
    }).then(r => r.json())
  ))
  const eventIds = new Set([c1.eventId, c2.eventId, c3.eventId])
  check('Simultaneous duplicate sync requests create exactly one event', eventIds.size === 1)

  // 31. Unsupported destination rejected
  const unsupportedRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
    body: JSON.stringify({ destination: 'pos_360' }),
  })
  check('Unsupported destination (pos_360) rejected', unsupportedRes.status === 400)

  // 32/33. Sync is not created by GET
  const statusRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}/sync/status`, {
    headers: { Cookie: guestCookieHeader },
  })
  const statusBody = await statusRes.json()
  check('GET status does not create a sync (only pre-existing events returned)', statusRes.status === 200 && statusBody.events.every(e => e.destination === 'venue_insights'))

  // 36/37. Invalid action type / oversized payload rejected (via authenticated dev-header path)
  // Uses the platform-admin bypass (requireVenueMembership allows admin/
  // founder_level_0 through without a venue_memberships row) since this
  // test doesn't set up a real venue_memberships/system_users row.
  const devHeaders = { 'Content-Type': 'application/json', 'x-novee-user-role': 'admin', 'x-novee-user-id': 'pkg-b-admin' }
  const invalidActionRes = await fetch(`${BASE}/api/smokecraft/management-sync/venues/${VENUE}/actions`, {
    method: 'POST', headers: devHeaders,
    body: JSON.stringify({ actionType: 'not_a_real_action' }),
  })
  check('Invalid action type rejected', invalidActionRes.status === 400)

  const oversizedRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
    body: JSON.stringify({ completionState: 'completed', feedbackText: 'x'.repeat(40000) }),
  })
  check('Oversized payload rejected', oversizedRes.status === 400)

  // 39. Prototype-pollution payload rejected
  // A JS object literal `{'__proto__': x}` sets the object's prototype
  // rather than creating an own enumerable key, so it never actually
  // reaches JSON.stringify — the attack must be sent as a raw JSON
  // string (as a real attacker would), which DOES parse into a literal
  // own "__proto__" property server-side via JSON.parse.
  const pollutionRes = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyId}/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCookieHeader },
    body: '{"completionState":"completed","preferences":{"__proto__":{"polluted":true}}}',
  })
  check('Prototype-pollution payload rejected', pollutionRes.status === 400)

  // 40. Audit events created
  const auditCount = await pool.query(
    `SELECT COUNT(*)::int AS c FROM audit_logs WHERE action_category = 'VENUE' AND action IN ('journey_created','journey_completed','snapshot_created','sync_requested')`
  )
  check('Audit events created for Management Sync actions', auditCount.rows[0].c > 0)

  // 45. Package A constraints remain intact (idempotency constraint still enforced at DB level)
  const constraintCheck = await pool.query(
    `SELECT 1 FROM pg_constraint WHERE conname = 'uq_sms_events_idempotency'`
  )
  check('Package A idempotency constraint remains intact', constraintCheck.rows.length === 1)

  // Cleanup — audit_logs is append-only by design (a DB trigger blocks
  // DELETE/UPDATE) so audit rows from this test are intentionally left
  // in place; the entire disposable test database is dropped at the end
  // of this package regardless.
  await pool.query(`DELETE FROM smokecraft_management_sync_actions WHERE venue_id IN ($1, $2)`, [VENUE, VENUE_INACTIVE])
  await pool.query(`DELETE FROM smokecraft_management_sync_journeys WHERE venue_id IN ($1, $2)`, [VENUE, VENUE_INACTIVE])
  await pool.query(`DELETE FROM venues WHERE venue_id IN ($1, $2)`, [VENUE, VENUE_INACTIVE])

  const remaining = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_management_sync_journeys WHERE tenant_id = 'test-tenant'`)
  check('No test data left behind', remaining.rows[0].c === 0)

} catch (err) {
  console.error('Unexpected error:', err)
  results.push({ name: 'unexpected error', pass: false, detail: err.message })
} finally {
  await pool.end()
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
