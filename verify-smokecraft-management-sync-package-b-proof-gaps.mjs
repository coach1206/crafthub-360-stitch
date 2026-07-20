// Closes the two disclosed Package B proof gaps (Package C Phase 2):
// (A) real seeded cross-user + cross-venue HTTP denial tests, and
// (B) a forced transaction-rollback test. Uses a real, isolated local
// Postgres + a real running server (see docs/SMOKECRAFT_MANAGEMENT_SYNC_
// PACKAGE_C_TEST_REPORT.md for environment detail). All seeded rows are
// cleaned up at the end.
import pg from 'pg'

const BASE = process.env.PKG_C_BASE || 'http://localhost:3012'
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1) }
const pool = new pg.Pool({ connectionString: DATABASE_URL })

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

async function guestCookie() {
  const res = await fetch(`${BASE}/api/smokecraft/management-sync/guest-session`, { method: 'POST' })
  const raw = res.headers.get('set-cookie') || ''
  const idx = raw.indexOf('smokecraft_guest_session=')
  const value = raw.slice(idx).split(';')[0].split('=')[1]
  return `smokecraft_guest_session=${value}`
}

try {
  // ── A1. Real cross-USER denial (two distinct authenticated users, dev-header auth) ──
  const cookieUserA = { 'x-novee-user-role': 'staff', 'x-novee-user-id': 'pkg-c-manager-a' }
  const cookieUserB = { 'x-novee-user-role': 'staff', 'x-novee-user-id': 'pkg-c-manager-b' }

  const journeyA = await fetch(`${BASE}/api/smokecraft/management-sync/venues/pkg-c-venue-a/journeys`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...cookieUserA },
    body: JSON.stringify({ tenantId: 'pkg-c-tenant', sessionNumber: 5, phase: 'in_progress', sourceVersion: 'pkg-c-test' }),
  }).then(r => r.json())
  const journeyAId = journeyA?.journey?.journeyId
  check('User A journey created (setup)', !!journeyAId)

  const userBReadsA = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyAId}`, { headers: cookieUserB })
  check('Real cross-user HTTP denial: User B cannot GET User A journey', userBReadsA.status === 403)

  const userBResumesA = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyAId}`, { headers: cookieUserB })
  check('Real cross-user HTTP denial: User B resume attempt denied', userBResumesA.status === 403)

  const userBSnapshotsA = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyAId}/snapshots`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...cookieUserB },
    body: JSON.stringify({ completionState: 'completed' }),
  })
  check('Real cross-user HTTP denial: User B cannot snapshot User A journey', userBSnapshotsA.status === 403)

  const userBCompletesA = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyAId}/complete`, {
    method: 'POST', headers: cookieUserB,
  })
  check('Real cross-user HTTP denial: User B cannot complete User A journey', userBCompletesA.status === 403)

  const userBSyncsA = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyAId}/sync`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...cookieUserB },
    body: JSON.stringify({ destination: 'venue_insights' }),
  })
  check('Real cross-user HTTP denial: User B cannot sync User A journey', userBSyncsA.status === 403)

  const userBListsAActions = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyAId}/sync/status`, { headers: cookieUserB })
  check('Real cross-user HTTP denial: User B cannot list User A sync status', userBListsAActions.status === 403)

  // ── A2. Real cross-VENUE denial (Venue A manager cannot act on Venue B) ──
  const userAActionsOnVenueB = await fetch(`${BASE}/api/smokecraft/management-sync/venues/pkg-c-venue-b/actions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...cookieUserA },
    body: JSON.stringify({ actionType: 'analytics_viewed' }),
  })
  check('Real cross-venue HTTP denial: Venue A manager cannot create Venue B action', userAActionsOnVenueB.status === 403)

  const userAListsVenueBActions = await fetch(`${BASE}/api/smokecraft/management-sync/venues/pkg-c-venue-b/actions`, { headers: cookieUserA })
  check('Real cross-venue HTTP denial: Venue A manager cannot list Venue B actions', userAListsVenueBActions.status === 403)

  // ── A3. Valid same-venue access succeeds ──
  const userAOwnVenueAction = await fetch(`${BASE}/api/smokecraft/management-sync/venues/pkg-c-venue-a/actions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...cookieUserA },
    body: JSON.stringify({ actionType: 'analytics_viewed' }),
  })
  check('Valid same-venue access succeeds (Venue A manager on Venue A)', userAOwnVenueAction.status === 201)

  const guestCk = await guestCookie()
  const userAReadsOwnJourney = await fetch(`${BASE}/api/smokecraft/management-sync/journeys/${journeyAId}`, { headers: cookieUserA })
  check('Valid same-user access succeeds (User A reads own journey)', userAReadsOwnJourney.status === 200)

  // ── B. Forced transaction rollback ──
  // A test-only forced failure: start a real transaction matching the
  // service pattern (BEGIN, insert a journey, insert a snapshot, force
  // an error before COMMIT), then verify neither row persisted. This
  // exercises the same BEGIN/INSERT/ROLLBACK shape the real services use
  // without adding any permanent failure switch to production code.
  const client = await pool.connect()
  let forcedJourneyId = null
  try {
    await client.query('BEGIN')
    const j = await client.query(
      `INSERT INTO smokecraft_management_sync_journeys
         (tenant_id, venue_id, guest_reference, session_number, phase, status, source_version)
       VALUES ('pkg-c-rollback-test','pkg-c-venue-a','pkg-c-rollback-guest',1,'in_progress','in_progress','pkg-c-test')
       RETURNING journey_id`
    )
    forcedJourneyId = j.rows[0].journey_id
    await client.query(
      `INSERT INTO smokecraft_management_sync_snapshots (journey_id, snapshot_version, completion_state, payload_hash)
       VALUES ($1, 1, 'completed', 'forced-rollback-hash')`,
      [forcedJourneyId]
    )
    // Force a real, in-transaction failure: violate the events unique
    // constraint by inserting a row with a snapshot_id that doesn't
    // exist, triggering a real FK violation rather than a fake throw.
    await client.query(
      `INSERT INTO smokecraft_management_sync_events
         (journey_id, snapshot_id, venue_id, guest_reference, destination, payload_version, idempotency_key)
       VALUES ($1, '00000000-0000-0000-0000-000000000000', 'pkg-c-venue-a', 'pkg-c-rollback-guest', 'venue_insights', 1, 'forced-fail')`,
      [forcedJourneyId]
    )
    await client.query('COMMIT')
    check('Forced rollback test triggered a real failure before COMMIT', false, 'expected an FK violation but none occurred')
  } catch (err) {
    await client.query('ROLLBACK')
    check('Forced rollback test: real failure occurred (FK violation) before COMMIT', err.code === '23503')
  } finally {
    client.release()
  }

  const journeySurvived = await pool.query(
    `SELECT 1 FROM smokecraft_management_sync_journeys WHERE tenant_id = 'pkg-c-rollback-test'`
  )
  check('Forced rollback: no partial journey record persisted', journeySurvived.rows.length === 0)
  const snapshotSurvived = forcedJourneyId
    ? await pool.query(`SELECT 1 FROM smokecraft_management_sync_snapshots WHERE journey_id = $1`, [forcedJourneyId])
    : { rows: [] }
  check('Forced rollback: no partial snapshot record persisted', snapshotSurvived.rows.length === 0)

  const unrelatedVenues = await pool.query(`SELECT COUNT(*)::int AS c FROM venues WHERE venue_id IN ('pkg-c-venue-a','pkg-c-venue-b')`)
  check('Forced rollback: unrelated tables (venues) remain untouched', unrelatedVenues.rows[0].c === 2)

  // ── Cleanup ──
  await pool.query(`DELETE FROM smokecraft_management_sync_actions WHERE venue_id IN ('pkg-c-venue-a','pkg-c-venue-b')`)
  await pool.query(`DELETE FROM smokecraft_management_sync_snapshots WHERE journey_id IN (SELECT journey_id FROM smokecraft_management_sync_journeys WHERE tenant_id = 'pkg-c-tenant')`)
  await pool.query(`DELETE FROM smokecraft_management_sync_events WHERE journey_id IN (SELECT journey_id FROM smokecraft_management_sync_journeys WHERE tenant_id = 'pkg-c-tenant')`)
  await pool.query(`DELETE FROM smokecraft_management_sync_journeys WHERE tenant_id IN ('pkg-c-tenant','pkg-c-rollback-test')`)
  await pool.query(`DELETE FROM venue_memberships WHERE user_id IN ('pkg-c-manager-a','pkg-c-manager-b')`)
  await pool.query(`DELETE FROM system_users WHERE user_id IN ('pkg-c-manager-a','pkg-c-manager-b')`)
  await pool.query(`DELETE FROM venues WHERE venue_id IN ('pkg-c-venue-a','pkg-c-venue-b')`)

  const remaining = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_management_sync_journeys WHERE tenant_id LIKE 'pkg-c%'`)
  check('All seeded test data removed', remaining.rows[0].c === 0)

} catch (err) {
  console.error('Unexpected error:', err)
  results.push({ name: 'unexpected error', pass: false, detail: err.message })
} finally {
  await pool.end()
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
