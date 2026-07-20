// Package D tests: Part 1 (Package C completion — server START/RESUME,
// expanded snapshot mapper, additional checkpoints) via a real browser
// against a real backend, and Part 2 (real venue analytics) via seeded
// DB data + live HTTP requests. See docs/SMOKECRAFT_MANAGEMENT_SYNC_
// PACKAGE_D_TEST_REPORT.md for the disclosed scope of this suite
// relative to the mandate's full 60-item list.
import { chromium } from 'playwright'
import pg from 'pg'

const BASE = 'http://localhost:5000'
const API_BASE = 'http://localhost:3001'
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1) }
const pool = new pg.Pool({ connectionString: DATABASE_URL })

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

const VENUE = 'pkg-d-browser-venue'

async function seed(page) {
  await page.goto(`${BASE}/smokecraft/venue-select`)
  await page.evaluate(({ VENUE }) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    sessionStorage.setItem('demoMode', 'true')
    sessionStorage.setItem('novee_booted', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      completedSteps: ['entry', 'enroll', 'venue-select', 'identity'], xp: 500, badges: [],
    }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: VENUE, name: 'Package D Browser Venue', skipped: false, selectedAt: Date.now() },
      identity: { preferredName: 'Package D Guest' },
      selectedCigar: { name: 'Package D Robusto', origin: 'Nicaragua' },
      pairing: { recommendation: 'Rum' },
      flavorMemory: { selectedFlavors: ['Cocoa'] },
      mentor: { name: 'Marcus Cole' },
    }))
  }, { VENUE })
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

try {
  await pool.query(`INSERT INTO venues (venue_id, name, status) VALUES ($1, 'Package D Browser Venue', 'active') ON CONFLICT DO NOTHING`, [VENUE])

  // ── PART 1: START creates a real server journey ──
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seed(page)
  await page.goto(`${BASE}/smokecraft/welcome`)
  await page.waitForTimeout(1000)
  await page.click('text=Begin Experience')
  await page.waitForTimeout(1500)
  const journeysAfterStart = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_management_sync_journeys WHERE venue_id = $1`, [VENUE])
  check('START (Begin Experience) creates a real server journey', journeysAfterStart.rows[0].c === 1)

  // Double-click / remount protection: re-visit welcome and click again
  await page.goto(`${BASE}/smokecraft/welcome`)
  await page.waitForTimeout(1000)
  const beginBtn = page.locator('text=Begin Experience')
  if (await beginBtn.count() > 0) {
    await beginBtn.click()
    await page.waitForTimeout(1500)
  }
  const journeysAfterSecond = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_management_sync_journeys WHERE venue_id = $1`, [VENUE])
  check('Remount/re-click does not create a duplicate journey (resume path reused)', journeysAfterSecond.rows[0].c === 1)

  // ── Expanded snapshot mapper: trigger a save via Scorecard-equivalent
  // (use the Management Sync explicit sync button, which now uses the
  // shared mapper including mentor/scorecard/etc. fields) ──
  await page.goto(`${BASE}/smokecraft/management-sync`)
  await page.waitForTimeout(1200)
  const syncBtn = page.locator('text=Sync This Journey to Venue')
  if (await syncBtn.count() > 0) {
    await syncBtn.click()
    await page.waitForTimeout(2000)
  }
  const snapRow = await pool.query(
    `SELECT s.mentor_selections FROM smokecraft_management_sync_snapshots s
       JOIN smokecraft_management_sync_journeys j ON j.journey_id = s.journey_id
      WHERE j.venue_id = $1 ORDER BY s.snapshot_version DESC LIMIT 1`, [VENUE]
  )
  check('Expanded snapshot mapper includes mentor field (beyond the original 3-field payload)', !!snapRow.rows[0]?.mentor_selections)

  // ── ARIA live region present ──
  const ariaLive = await page.locator('[role="status"][aria-live="polite"]').count()
  check('ARIA live region present for sync status announcements', ariaLive > 0)

  await page.close()

  // ── PART 2: real venue analytics ──
  // Seed 6 completed journeys with snapshots for pkg-d-venue-a (above the
  // 5-journey minimum sample size), plus 2 for pkg-d-venue-b (below
  // threshold, to test suppression).
  async function seedCompletedJourney(venueId, cigarName, pairingName, flavor, rating) {
    const j = await pool.query(
      `INSERT INTO smokecraft_management_sync_journeys (tenant_id, venue_id, guest_reference, session_number, phase, status, source_version, completed_at)
       VALUES ('pkg-d-analytics-seed', $1, $2, 27, 'complete', 'completed', 'pkg-d-test', NOW()) RETURNING journey_id`,
      [venueId, `guest-${Math.random().toString(36).slice(2, 8)}`]
    )
    const journeyId = j.rows[0].journey_id
    await pool.query(
      `INSERT INTO smokecraft_management_sync_snapshots (journey_id, snapshot_version, cigar_selection, pairing_selection, flavor_notes, rating, completion_state, payload_hash)
       VALUES ($1, 1, $2, $3, $4, $5, 'completed', $6)`,
      [journeyId, JSON.stringify({ name: cigarName }), JSON.stringify({ recommendation: pairingName }), JSON.stringify({ selectedFlavors: [flavor] }), rating, `hash-${journeyId}`]
    )
  }

  for (let i = 0; i < 6; i++) {
    await seedCompletedJourney('pkg-d-venue-a', i < 4 ? 'Robusto Reserve' : 'Torpedo Classic', 'Bourbon', 'Cedar', 4)
  }
  for (let i = 0; i < 2; i++) {
    await seedCompletedJourney('pkg-d-venue-b', 'Churchill', 'Rum', 'Pepper', 5)
  }

  const devHeadersA = { 'x-novee-user-role': 'admin', 'x-novee-user-id': 'pkg-d-admin' } // platform-admin bypass, simplest real auth path
  const today = new Date().toISOString()
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const params = new URLSearchParams({ startDate: weekAgo, endDate: today })

  // Guest cannot access. In this non-production sandbox, requireAuth's
  // documented dev-mode fallback resolves an unauthenticated caller to
  // `{id:'proto-guest', role:'guest'}` rather than rejecting outright
  // (see SMOKECRAFT_MANAGEMENT_SYNC_BACKEND_ARCHITECTURE.md's own
  // documented finding on this) — so denial correctly surfaces as 403
  // (venue_membership_required) here, not 401. In real production
  // (JWT_SECRET set, NODE_ENV=production) the same request would 401
  // before ever reaching the membership check. Either status is a real
  // denial; both are accepted.
  const guestRes = await fetch(`${API_BASE}/api/smokecraft/management-sync/venues/pkg-d-venue-a/insights?${params}`)
  check('Guest cannot access venue analytics (401 in production, 403 via dev-mode proto-guest fallback here)', guestRes.status === 401 || guestRes.status === 403)

  // Unauthorized staff (dev header role that is valid but has no venue membership and isn't admin)
  const staffRes = await fetch(`${API_BASE}/api/smokecraft/management-sync/venues/pkg-d-venue-a/insights?${params}`, {
    headers: { 'x-novee-user-role': 'staff', 'x-novee-user-id': 'pkg-d-random-staff' },
  })
  check('Unauthorized staff (no membership, not admin) cannot access venue analytics (403)', staffRes.status === 403)

  // Authorized (platform-admin bypass) access to Venue A succeeds with real data
  const analyticsA = await fetch(`${API_BASE}/api/smokecraft/management-sync/venues/pkg-d-venue-a/insights?${params}`, { headers: devHeadersA }).then(r => r.json())
  check('Authorized access succeeds for Venue A', analyticsA.success === true)
  check('Completed journey count is accurate (6 seeded)', analyticsA.completedJourneyCount === 6)
  check('Cigar trend meets sample-size threshold and shows real top cigar', analyticsA.cigarTrends.availability === 'ok' && analyticsA.cigarTrends.value[0]?.name === 'Robusto Reserve' && analyticsA.cigarTrends.value[0]?.count === 4)
  check('Pairing trend accurate', analyticsA.pairingTrends.value[0]?.name === 'Bourbon' && analyticsA.pairingTrends.value[0]?.count === 6)
  check('Flavor trend accurate', analyticsA.flavorTrends.value[0]?.name === 'Cedar' && analyticsA.flavorTrends.value[0]?.count === 6)
  check('Scorecard average accurate (rating=4 for all)', analyticsA.scorecardAverage.value === 4)
  check('No guest identity in analytics response', JSON.stringify(analyticsA).match(/guest-[a-z0-9]{6}/) === null)

  // Small sample (Venue B, only 2 journeys) is suppressed
  const analyticsB = await fetch(`${API_BASE}/api/smokecraft/management-sync/venues/pkg-d-venue-b/insights?${params}`, { headers: devHeadersA }).then(r => r.json())
  check('Small sample (2 journeys) suppressed with honest insufficient_data', analyticsB.cigarTrends.availability === 'insufficient_data' && analyticsB.cigarTrends.sampleSize === 2)

  // Cross-venue: Venue A manager (real membership) cannot read Venue B
  const crossVenueRes = await fetch(`${API_BASE}/api/smokecraft/management-sync/venues/pkg-d-venue-b/insights?${params}`, {
    headers: { 'x-novee-user-role': 'staff', 'x-novee-user-id': 'pkg-d-manager-a' },
  })
  check('Venue A manager cannot access Venue B analytics (403)', crossVenueRes.status === 403)

  // Same-venue manager succeeds
  const sameVenueRes = await fetch(`${API_BASE}/api/smokecraft/management-sync/venues/pkg-d-venue-a/insights?${params}`, {
    headers: { 'x-novee-user-role': 'staff', 'x-novee-user-id': 'pkg-d-manager-a' },
  }).then(r => r.json())
  check('Venue A manager (real membership) can access Venue A analytics', sameVenueRes.success === true)

  // Invalid / excessive date range rejected
  const invalidRangeRes = await fetch(`${API_BASE}/api/smokecraft/management-sync/venues/pkg-d-venue-a/insights?startDate=not-a-date&endDate=${today}`, { headers: devHeadersA })
  check('Invalid date range rejected (400)', invalidRangeRes.status === 400)

  const excessiveRangeRes = await fetch(`${API_BASE}/api/smokecraft/management-sync/venues/pkg-d-venue-a/insights?startDate=2020-01-01&endDate=${today}`, { headers: devHeadersA })
  check('Excessive date range (>90 days) rejected (400)', excessiveRangeRes.status === 400)

  // No fabricated external integration
  check('No POS360/EAT/NOVEE OS/inventory success claimed in response', !JSON.stringify(analyticsA).match(/"connected":true|"pos360":"live"|"eat360":"live"/))

  // Cleanup
  await pool.query(`DELETE FROM smokecraft_management_sync_snapshots WHERE journey_id IN (SELECT journey_id FROM smokecraft_management_sync_journeys WHERE tenant_id IN ('pkg-d-analytics-seed', 'pkg-c-test'))`)
  await pool.query(`DELETE FROM smokecraft_management_sync_events WHERE venue_id IN ($1, 'pkg-d-venue-a', 'pkg-d-venue-b')`, [VENUE])
  await pool.query(`DELETE FROM smokecraft_management_sync_journeys WHERE venue_id IN ($1, 'pkg-d-venue-a', 'pkg-d-venue-b')`, [VENUE])
  await pool.query(`DELETE FROM venue_memberships WHERE user_id IN ('pkg-d-manager-a','pkg-d-manager-b')`)
  await pool.query(`DELETE FROM system_users WHERE user_id IN ('pkg-d-manager-a','pkg-d-manager-b')`)
  await pool.query(`DELETE FROM venues WHERE venue_id IN ($1, 'pkg-d-venue-a', 'pkg-d-venue-b')`, [VENUE])

  const remaining = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_management_sync_journeys WHERE venue_id LIKE 'pkg-d%'`)
  check('All Package D test data removed', remaining.rows[0].c === 0)

} catch (err) {
  console.error('Unexpected error:', err)
  results.push({ name: 'unexpected error', pass: false, detail: err.message })
} finally {
  await browser.close()
  await pool.end()
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
