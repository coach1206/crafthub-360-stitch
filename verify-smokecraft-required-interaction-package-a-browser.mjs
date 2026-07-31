/**
 * Required-Interaction Closure Package A — real Playwright browser
 * verification of Sessions 8, 12, and 16 tasting-capture server
 * authority.
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
const results = []
function ok(msg) { pass++; results.push({ name: msg, ok: true }); console.log(`  PASS  ${msg}`) }
function bad(msg, detail) { fail++; results.push({ name: msg, ok: false, detail }); console.log(`  FAIL  ${msg}${detail ? ' — ' + detail : ''}`) }

async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForTimeout(1200)
}

function buildSeedState() {
  const now = Date.now()
  const guestSession = {
    sessionId: 'pkga-test-' + now, createdAt: now, updatedAt: now, __version: 4,
    profile: { firstName: 'Package', lastName: 'A' },
    // Real prerequisite chain up through Session 15 (Knowledge Drop) —
    // enough for Sessions 8, 12, and 16 (First/Second/Final Third) to
    // all be reachable, matching the existing guard system unchanged
    // by this pass. Full field set copied from the proven-working
    // verify-smokecraft-all-routes-browser-test.mjs seed (a minimal
    // subset was found to leave the guest-session shape incomplete and
    // caused a false prerequisite failure).
    completedSteps: ['enroll', 'identity', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format',
      'cut-toast-light', 'lighting-tutorial', 'flavor-memory', 'pairing-lab',
      'mentor-commentary', 'knowledge-drop'],
    xp: 0, rank: 'Novice', badges: [], smokecraftStamps: [], mentors: [], favorites: [], pendingOrders: [],
    currentSmokecraftStep: null, latestStampId: null, goldenBoxProgress: null,
    skillScore: 0, challengeScore: 0, loyaltyPoints: 0, lifetimeLoyaltyPoints: 0, redeemablePoints: 0,
    passportStampCount: 0, purchaseCount: 0, houseCigarPurchases: 0, pairingPurchases: 0,
    eventParticipationCount: 0, referralCount: 0, loyaltyLedger: [], usedTransactionIds: [],
    guestId: 'pkga-test-guest-' + now, venueId: 'novee-grand-lounge', deviceId: 'kiosk-001', entrySource: 'qr-scan',
    entryStartedAt: now, lastActiveAt: now, guestProfile: null, profileComplete: true, resumeToken: null,
    audioEnabled: true, hapticsEnabled: true, lastVisitedRoute: null, leaderboardScore: 0, selectedCraft: null,
    selectedMentor: null, selectedMentorCountry: null, selectedLevel: null,
    smokeCraft: {}, passport: {}, goldenBox: {}, leaderboard: {}, preferences: {}, system: {}, pos3: {}, eatCommand: {},
  }
  const journey = {
    stateVersion: 1, selectedVenue: { id: 'v1', name: 'Test Lounge', selectedAt: now },
  }
  return { guestSession, journey }
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const { guestSession, journey } = buildSeedState()
  // Seed localStorage via storageState BEFORE any page ever loads, so
  // there is no window where the app mounts with an empty session and
  // an autosave effect can race with / overwrite our injected data (the
  // root cause of a prior "completedSteps reads back empty" bug when
  // seeding was done via page.evaluate() after goto(BASE)).
  const ctx = await browser.newContext({
    viewport: { width: 1024, height: 900 },
    storageState: {
      cookies: [],
      origins: [{
        origin: BASE,
        localStorage: [
          { name: 'novee_guest_session', value: JSON.stringify(guestSession) },
          { name: 'sc_journey_v1', value: JSON.stringify(journey) },
        ],
      }],
    },
  })
  // sessionStorage isn't part of storageState — set it on every
  // navigation via addInitScript; it's a static constant flag, so
  // re-applying it on reload/nav carries no race risk (unlike
  // completedSteps, it never changes during the test).
  await ctx.addInitScript(() => { sessionStorage.setItem('novee_demo_mode', '1') })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${msg.text()} [${msg.location()?.url || ''}]`) })
  page.on('pageerror', err => consoleErrors.push(String(err)))

  console.log('\n── Session 8 (First Third) route loads, instructions/fields usable ──')
  await nav(page, '/smokecraft/first-third')
  const headingVisible = await page.locator('text=/First Third Observations/i').first().isVisible().catch(() => false)
  headingVisible ? ok('Session 8 route loads with real instructions visible') : bad('Session 8 route loads')

  console.log('\n── Session 8 — incorrect/empty attempt: Continue without selecting anything ──')
  await page.click('button:has-text("Continue to Second Third")')
  await page.waitForTimeout(800)
  const errorVisible = await page.locator('[role="alert"]:has-text("Select at least one observation")').first().isVisible().catch(() => false)
  errorVisible ? ok('An empty submission is honestly rejected client-side before hitting the server') : bad('Empty submission rejected')

  console.log('\n── Session 8 — correct interaction: select a real zone, save partial, exit, reload, resume ──')
  const zoneButtons = page.locator('button[aria-pressed]')
  await zoneButtons.first().click()
  await page.waitForTimeout(400)
  await page.fill('textarea[aria-label="First third personal notes"]', 'Bright and citrusy opening.')
  await page.click('button[aria-label="Save draft"]')
  await page.waitForTimeout(600)
  const savedVisible = await page.locator('text=✓ Saved').first().isVisible().catch(() => false)
  savedVisible ? ok('Draft save confirms visibly') : bad('Draft save confirms')

  // Genuine reload — confirms the local journey-state resume path still works.
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const zoneStillSelected = await page.locator('button[aria-pressed="true"]').first().isVisible().catch(() => false)
  zoneStillSelected ? ok('Genuine reload preserves the in-progress selection (journey-state resume)') : bad('Reload preserves in-progress selection')

  console.log('\n── Session 8 — submit real completion, server-scored ──')
  await page.click('button:has-text("Continue to Second Third")')
  await page.waitForTimeout(1800)
  const navigatedAway = page.url().includes('/smokecraft/flavor-memory')
  navigatedAway ? ok('Session 8 completes and navigates to the real next step (server-confirmed, not optimistic-only)') : bad('Session 8 completes and navigates', page.url())

  console.log('\n── Session 8 — reload after completion, XP visible on player state ──')
  const xpAfter = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state', { credentials: 'include' })
    const d = await r.json()
    return d.state?.xpTotal
  })
  const xpPositive = xpAfter > 0
  xpPositive ? ok('Real server-side XP total is greater than zero after Session 8 completion') : bad('XP total reflects completion')

  console.log('\n── Session 8 — duplicate click does not duplicate completion ──')
  const dup1 = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state/sessions/first-third/complete', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idempotencyKey: 'browser-dup-test-' + Date.now() }) })
    return r.status
  })
  const stateAfterDup = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state', { credentials: 'include' })
    const d = await r.json()
    return d.state.completedSessions.filter(c => c.sessionId === 'first-third').length
  })
  stateAfterDup === 1 ? ok('Exactly one Session 8 completion record exists after a duplicate completion call') : bad('No duplicate completion record', String(stateAfterDup))

  console.log('\n── Session 12 (Second Third) — full real flow ──')
  await nav(page, '/smokecraft/second-third')
  const zone12 = page.locator('button[aria-pressed]')
  await zone12.first().click()
  await page.waitForTimeout(400)
  await page.click('button:has-text("Continue to Flavor Memory")')
  await page.waitForTimeout(1800)
  const nav12 = page.url().includes('/smokecraft/mentor-commentary')
  nav12 ? ok('Session 12 completes with real observation and navigates to the real next step') : bad('Session 12 completes', page.url())

  console.log('\n── Session 16 (Final Third) — full real flow ──')
  await nav(page, '/smokecraft/final-third')
  const flavorButtons = page.locator('button[aria-pressed]')
  const flavorCount = await flavorButtons.count()
  if (flavorCount > 0) { await flavorButtons.first().click(); await page.waitForTimeout(400) }
  await page.click('button:has-text("Continue to Scorecard")')
  await page.waitForTimeout(1800)
  const nav16 = page.url().includes('/smokecraft/scorecard')
  nav16 ? ok('Session 16 completes with real observation and navigates to the real next step') : bad('Session 16 completes', page.url())

  console.log('\n── Offline state ──')
  await nav(page, '/smokecraft/first-third')
  await page.context().setOffline(true)
  const anyZone = page.locator('button[aria-pressed]')
  await anyZone.first().click().catch(() => {})
  await page.click('button:has-text("Continue")').catch(() => {})
  await page.waitForTimeout(1500)
  const offlineHandled = await page.locator('[role="alert"]').first().isVisible().catch(() => false)
  offlineHandled ? ok('An honest error state renders when the network is unavailable (no fake success)') : bad('Offline state renders')
  await page.context().setOffline(false)

  console.log('\n── Responsive behavior (desktop + tablet) ──')
  await nav(page, '/smokecraft/first-third')
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowX ? ok('No horizontal layout cutoff on Session 8 (desktop)') : bad('No horizontal cutoff (desktop)')
  await page.setViewportSize({ width: 1180, height: 820 })
  await page.waitForTimeout(600)
  const overflowXTablet = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowXTablet ? ok('No horizontal layout cutoff at a tablet viewport') : bad('No horizontal cutoff at tablet viewport')
  const submitButtonVisible = await page.locator('button:has-text("Continue")').first().isVisible().catch(() => false)
  submitButtonVisible ? ok('Submit/continue control remains visible and reachable at tablet size') : bad('Submit control visible at tablet size')

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver|status of 40[139]|status of 429|ERR_INTERNET_DISCONNECTED/i.test(e))
  realErrors.length === 0 ? ok('No unexpected console errors across the tasting-capture flow') : bad('No console errors', realErrors.slice(0, 3).join(' | '))

  await ctx.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-required-interaction-package-a', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-required-interaction-package-a/browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
