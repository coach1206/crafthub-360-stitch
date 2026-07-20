// Package A database behavior tests for SmokeCraft Management Sync.
// Runs against DATABASE_URL (a real, isolated local test Postgres this
// pass — see docs/SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_A_TEST_REPORT.md).
// All test rows are cleaned up at the end, including the test venue.
import pg from 'pg'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set — cannot run Package A database tests.')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: DATABASE_URL })
const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

const TEST_VENUE_ID = 'test-pkg-a-venue-' + Date.now()
let journeyId, snapshotId

try {
  // Setup: one throwaway test venue (cleaned up at the end)
  await pool.query(
    `INSERT INTO venues (venue_id, name) VALUES ($1, 'Package A Test Venue')`,
    [TEST_VENUE_ID]
  )

  // 1. Migration 074 discoverable + recorded exactly once
  const migRows = await pool.query(
    `SELECT filename FROM schema_migrations WHERE filename = '074_smokecraft_management_sync.sql'`
  )
  check('Migration 074 recorded exactly once', migRows.rows.length === 1)

  // 4/5. Valid venue-scoped journey insert / invalid venue rejected
  const journeyRes = await pool.query(
    `INSERT INTO smokecraft_management_sync_journeys
       (tenant_id, venue_id, guest_reference, session_number, phase, status, source_version)
     VALUES ('test-tenant', $1, 'test-guest-ref', 5, 'in_progress', 'in_progress', 'pkg-a-test')
     RETURNING journey_id`,
    [TEST_VENUE_ID]
  )
  journeyId = journeyRes.rows[0].journey_id
  check('Valid venue-scoped journey inserted', !!journeyId)

  let invalidVenueRejected = false
  try {
    await pool.query(
      `INSERT INTO smokecraft_management_sync_journeys
         (tenant_id, venue_id, guest_reference, session_number, phase, status, source_version)
       VALUES ('test-tenant', 'nonexistent-venue-id', 'test-guest-ref', 1, 'in_progress', 'in_progress', 'pkg-a-test')`
    )
  } catch (e) {
    invalidVenueRejected = e.code === '23503' // foreign_key_violation
  }
  check('Invalid venue_id rejected (FK violation)', invalidVenueRejected)

  // 6/7. Valid snapshot / duplicate version rejected
  const snapRes = await pool.query(
    `INSERT INTO smokecraft_management_sync_snapshots
       (journey_id, snapshot_version, completion_state, payload_hash)
     VALUES ($1, 1, 'completed', 'hash-v1')
     RETURNING snapshot_id`,
    [journeyId]
  )
  snapshotId = snapRes.rows[0].snapshot_id
  check('Valid snapshot inserted', !!snapshotId)

  let dupSnapshotRejected = false
  try {
    await pool.query(
      `INSERT INTO smokecraft_management_sync_snapshots
         (journey_id, snapshot_version, completion_state, payload_hash)
       VALUES ($1, 1, 'completed', 'hash-different')`,
      [journeyId]
    )
  } catch (e) {
    dupSnapshotRejected = e.code === '23505' // unique_violation
  }
  check('Duplicate snapshot version rejected (unique violation)', dupSnapshotRejected)

  // 8/9. Valid Management Sync event / duplicate idempotency key rejected
  const eventRes = await pool.query(
    `INSERT INTO smokecraft_management_sync_events
       (journey_id, snapshot_id, venue_id, guest_reference, destination, payload_version, idempotency_key)
     VALUES ($1, $2, $3, 'test-guest-ref', 'venue_insights', 1, 'idem-key-1')
     RETURNING event_id`,
    [journeyId, snapshotId, TEST_VENUE_ID]
  )
  const eventId = eventRes.rows[0].event_id
  check('Valid Management Sync event inserted', !!eventId)

  let dupEventRejected = false
  try {
    await pool.query(
      `INSERT INTO smokecraft_management_sync_events
         (journey_id, snapshot_id, venue_id, guest_reference, destination, payload_version, idempotency_key)
       VALUES ($1, $2, $3, 'test-guest-ref', 'venue_insights', 1, 'idem-key-2')`,
      [journeyId, snapshotId, TEST_VENUE_ID]
    )
  } catch (e) {
    dupEventRejected = e.code === '23505'
  }
  check('Duplicate idempotency combination (venue_id, journey_id, destination, payload_version) rejected', dupEventRejected)

  // 10/11. Valid management action / invalid status rejected
  const actionRes = await pool.query(
    `INSERT INTO smokecraft_management_sync_actions
       (venue_id, journey_id, sync_event_id, actor_user_id, action_type, action_status)
     VALUES ($1, $2, $3, 'test-actor', 'sync_requested', 'completed')
     RETURNING action_id`,
    [TEST_VENUE_ID, journeyId, eventId]
  )
  check('Valid management action inserted', !!actionRes.rows[0].action_id)

  let invalidStatusRejected = false
  try {
    await pool.query(
      `INSERT INTO smokecraft_management_sync_actions
         (venue_id, actor_user_id, action_type, action_status)
       VALUES ($1, 'test-actor', 'sync_requested', 'not_a_real_status')`,
      [TEST_VENUE_ID]
    )
  } catch (e) {
    invalidStatusRejected = e.code === '23514' // check_violation
  }
  check('Invalid action_status rejected (check violation)', invalidStatusRejected)

  // 12. Required ownership fields cannot be omitted
  let missingVenueRejected = false
  try {
    await pool.query(
      `INSERT INTO smokecraft_management_sync_journeys
         (tenant_id, guest_reference, session_number, phase, status, source_version)
       VALUES ('test-tenant', 'test-guest-ref', 1, 'in_progress', 'in_progress', 'pkg-a-test')`
    )
  } catch (e) {
    missingVenueRejected = e.code === '23502' // not_null_violation
  }
  check('Missing required venue_id rejected (not-null violation)', missingVenueRejected)

  // 13. Foreign-key deletion behavior: deleting the journey cascades to snapshots/events, sets actions.journey_id null
  await pool.query('DELETE FROM smokecraft_management_sync_journeys WHERE journey_id = $1', [journeyId])
  const snapAfterDelete = await pool.query('SELECT 1 FROM smokecraft_management_sync_snapshots WHERE journey_id = $1', [journeyId])
  const eventAfterDelete = await pool.query('SELECT 1 FROM smokecraft_management_sync_events WHERE journey_id = $1', [journeyId])
  const actionAfterDelete = await pool.query('SELECT journey_id FROM smokecraft_management_sync_actions WHERE actor_user_id = $1', ['test-actor'])
  check('Journey delete cascades to snapshots (ON DELETE CASCADE)', snapAfterDelete.rows.length === 0)
  check('Journey delete cascades to events (ON DELETE CASCADE)', eventAfterDelete.rows.length === 0)
  check('Journey delete sets action.journey_id to NULL (ON DELETE SET NULL)', actionAfterDelete.rows.length === 1 && actionAfterDelete.rows[0].journey_id === null)

  // 14. JSONB fields reject invalid input naturally (driver/Postgres-level)
  let jsonbRejected = false
  try {
    const badJourney = await pool.query(
      `INSERT INTO smokecraft_management_sync_journeys
         (tenant_id, venue_id, guest_reference, session_number, phase, status, source_version)
       VALUES ('test-tenant', $1, 'test-guest-ref-2', 1, 'in_progress', 'in_progress', 'pkg-a-test')
       RETURNING journey_id`,
      [TEST_VENUE_ID]
    )
    await pool.query(
      `INSERT INTO smokecraft_management_sync_snapshots
         (journey_id, snapshot_version, completion_state, payload_hash, cigar_selection)
       VALUES ($1, 1, 'completed', 'hash-bad-json', $2::jsonb)`,
      [badJourney.rows[0].journey_id, 'not valid json {{{']
    )
    await pool.query('DELETE FROM smokecraft_management_sync_journeys WHERE journey_id = $1', [badJourney.rows[0].journey_id])
  } catch (e) {
    jsonbRejected = e.code === '22P02' // invalid_text_representation
  }
  check('Invalid JSONB input rejected naturally by Postgres', jsonbRejected)

  // Cleanup
  await pool.query('DELETE FROM smokecraft_management_sync_actions WHERE venue_id = $1', [TEST_VENUE_ID])
  await pool.query('DELETE FROM smokecraft_management_sync_journeys WHERE tenant_id = $1', ['test-tenant'])
  await pool.query('DELETE FROM venues WHERE venue_id = $1', [TEST_VENUE_ID])

  const remainingTest = await pool.query(
    `SELECT COUNT(*)::int AS c FROM smokecraft_management_sync_journeys WHERE tenant_id = 'test-tenant'`
  )
  check('No test data left behind in journeys table', remainingTest.rows[0].c === 0)

  const remainingVenue = await pool.query('SELECT 1 FROM venues WHERE venue_id = $1', [TEST_VENUE_ID])
  check('Test venue removed', remainingVenue.rows.length === 0)

} catch (err) {
  console.error('Unexpected error:', err)
  results.push({ name: 'unexpected error', pass: false, detail: err.message })
} finally {
  await pool.end()
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
