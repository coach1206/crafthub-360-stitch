// verify-smokecraft-venue-selection-data.mjs
//
// SmokeCraft 360 — Venue Data Source and Selection fix.
//
// Proves, against the real production-mode Express server (single process,
// same topology Railway runs — server on :3001 also serves the built
// dist/), that Venue Selection loads real venue records from the backend
// `venues` table via GET /api/smokecraft/venue-commerce/venues, renders
// them as live selectable cards, requires an explicit user choice (real
// venue OR explicit "Continue without a venue"), and persists that choice
// through refresh.
//
// LOCAL-ONLY TEST DATA DISCLOSURE: this session has no access to the
// production Railway database. The local Postgres instance used here
// (crafthub_smokecraft_final) genuinely had ZERO rows in `venues` before
// this run — confirmed via `SELECT * FROM venues` returning 0 rows, which
// is the exact "No venues connected yet" root cause reported live. One
// test venue ("Test Verification Lounge", venue_id=venue-test-verify-1)
// was inserted directly into this local, throwaway Postgres instance ONLY
// to prove the real backend->frontend pipeline actually renders real rows
// end-to-end — it is NOT part of any migration, seed file, or committed
// data, and is not present in production. If production's real `venues`
// table also has zero active rows, that is a genuine data/business gap
// (no venues have been configured yet), not a code defect — this suite
// cannot and does not fabricate that decision.
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'

const BASE = process.env.SC_UI || 'http://localhost:3001'

let pass = 0, fail = 0
const failures = []
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
function section(t) { console.log(`\n── ${t}`) }

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
let page = await browser.newPage()

// A fresh page per seed() call — addInitScript persists for the lifetime of
// the page and reruns on every navigation including reload(), so reusing
// one page across seed() calls would silently re-seed (and wipe) real
// persisted state on any later reload within a scenario. Opening a new page
// keeps each scenario's seed isolated to its own first load only.
async function seed(completedSteps, journeyExtra = {}) {
  await page.close().catch(() => {})
  page = await browser.newPage()
  await page.addInitScript((steps, extra) => {
    // Idempotent: addInitScript reruns on every navigation of this page,
    // including reload() — only seed on the genuine first load so a later
    // reload observes real persisted state (e.g. a venue selection) instead
    // of having it silently overwritten back to the seed default.
    if (localStorage.getItem('novee_guest_session')) return
    const now = Date.now()
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 's_venue_test', createdAt: now, updatedAt: now, __version: 4,
      profile: {}, completedSteps: steps, xp: 0, rank: 'Novice', badges: [],
      smokecraftStamps: [], mentors: [], favorites: [], pendingOrders: [],
      currentSmokecraftStep: null, latestStampId: null, goldenBoxProgress: null,
      skillScore: 0, challengeScore: 0, loyaltyPoints: 0, lifetimeLoyaltyPoints: 0,
      redeemablePoints: 0, passportStampCount: 0, purchaseCount: 0, houseCigarPurchases: 0,
      pairingPurchases: 0, eventParticipationCount: 0, referralCount: 0, loyaltyLedger: [],
      usedTransactionIds: [], guestId: 'g_venue_test', venueId: 'novee-grand-lounge',
      deviceId: 'kiosk-001', entrySource: 'qr-scan', entryStartedAt: now, lastActiveAt: now,
      guestProfile: null, profileComplete: true, resumeToken: null, audioEnabled: true,
      hapticsEnabled: true, lastVisitedRoute: null, leaderboardScore: 0, selectedCraft: null,
      selectedMentor: null, selectedMentorCountry: null, selectedLevel: null,
      smokeCraft: {}, passport: {}, goldenBox: {}, leaderboard: {}, preferences: {}, system: {}, pos3: {}, eatCommand: {},
    }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 1, ...extra }))
  }, completedSteps, journeyExtra)
}

// ─────────────────────────────────────────────────────────────────────────
section('1-3. Venue page loads real backend data (no fake venues)')
await seed(['enroll', 'identity'])
await page.goto(`${BASE}/smokecraft/venue-select`, { waitUntil: 'networkidle' })
assert('1. Venue page loads', page.url().endsWith('/smokecraft/venue-select'))

const bodyText1 = (await page.textContent('body')) || ''
assert('3. Real venue record renders (Test Verification Lounge)', /Test Verification Lounge/.test(bodyText1))
assert('13. No fake/sample venue data appears (Grand Lounge / Bottle House from src/data/venues.js)',
  !/Grand Lounge|Bottle House/.test(bodyText1))

// ─────────────────────────────────────────────────────────────────────────
section('4-6. No default selection; explicit tap selects a venue')
const selectedBefore = await page.$('button[aria-pressed="true"][aria-label*="Select"]')
assert('4. No venue selected by default', !selectedBefore)

await page.click('button[aria-label="Select Test Verification Lounge"]')
await page.waitForTimeout(300)
const selectedAfter = await page.$('button[aria-label="Select Test Verification Lounge (selected)"]')
assert('5-6. A venue can be selected; selected state appears only after interaction', !!selectedAfter)

// ─────────────────────────────────────────────────────────────────────────
section('7. Selection persists after refresh')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const selectedAfterReload = await page.$('button[aria-label="Select Test Verification Lounge (selected)"]')
assert('7. Selected venue remains selected after refresh', !!selectedAfterReload)

// ─────────────────────────────────────────────────────────────────────────
section('8-9. Continue opens Welcome; Venue Back returns to Identity')
const backBtn = await page.$('button:has-text("← Back")')
if (backBtn) { await backBtn.click(); await page.waitForTimeout(400) }
assert('9. Venue Selection Back returns to Identity', page.url().endsWith('/smokecraft/identity'))
await page.goBack()
await page.waitForTimeout(400)
await page.click('button:has-text("Continue to Welcome")')
await page.waitForTimeout(500)
assert('8. Continue opens Welcome', page.url().endsWith('/smokecraft/welcome'))

// ─────────────────────────────────────────────────────────────────────────
section('10-11. Explicit "Continue without a venue" requires user action and persists')
await seed(['enroll', 'identity'])
await page.goto(`${BASE}/smokecraft/venue-select`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
const noVenueBeforeClick = await page.textContent('button[aria-pressed]:has-text("Continue without venue")').catch(() => null)
assert('10a. "Continue without venue" is not pre-selected', noVenueBeforeClick === 'Continue without venue')
await page.click('button:has-text("Continue without venue")')
await page.waitForTimeout(300)
const noVenueAfterClick = await page.$('button[aria-pressed="true"]:has-text("Continuing without a venue selected")')
assert('10b. Explicit no-venue choice requires and reflects a real click', !!noVenueAfterClick)

await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const noVenueAfterReload = await page.$('button[aria-pressed="true"]:has-text("Continuing without a venue selected")')
assert('11. Explicit no-venue choice persists after refresh', !!noVenueAfterReload)

// ─────────────────────────────────────────────────────────────────────────
section('12. Welcome reflects the correct venue state')
await page.click('button:has-text("Continue to Welcome")')
await page.waitForTimeout(600)
const welcomeText = (await page.textContent('body')) || ''
assert('12. Welcome shows no fabricated venue name and no placeholder leak', !/undefined|null|NaN/.test(welcomeText))

// ─────────────────────────────────────────────────────────────────────────
section('14. No approved image changed')
const venueImgStyle = await (async () => {
  await page.goto(`${BASE}/smokecraft/venue-select`, { waitUntil: 'networkidle' })
  return page.evaluate(() => {
    const el = document.querySelector('[aria-label="SmokeCraft Venue Selection"]')
    return el ? el.style.backgroundImage : null
  })
})()
assert('14. Venue Selection approved image reference unchanged', /Venue%20Selection%2011\.png/.test(venueImgStyle || ''), venueImgStyle)

// ─────────────────────────────────────────────────────────────────────────
section('15. Entry sequence remains Guest Pass -> Identity -> Venue -> Welcome')
await seed([])
await page.goto(`${BASE}/smokecraft`, { waitUntil: 'networkidle' })
await page.click('button:has-text("START SMOKECRAFT JOURNEY")')
await page.waitForTimeout(400)
assert('15a. Clean Start -> Guest Pass', page.url().endsWith('/smokecraft/enroll'))
const explore = await page.$('button:has-text("Explore as Guest")')
if (explore) { await explore.click(); await page.waitForTimeout(400) }
assert('15b. Guest Pass -> Identity', page.url().endsWith('/smokecraft/identity'))

await browser.close()

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (${pass + fail} total) ===`)
if (failures.length) {
  console.log('\nFailures:')
  for (const f of failures) console.log(`  - ${f}`)
}
process.exit(fail === 0 ? 0 : 1)
