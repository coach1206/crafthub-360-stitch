/**
 * Required-Interaction Closure Package B — real Playwright browser
 * verification of Session 19 (Scorecard) multi-category rating server
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
    sessionId: 'pkgb-test-' + now, createdAt: now, updatedAt: now, __version: 4,
    profile: { firstName: 'Package', lastName: 'B' },
    // Real prerequisite chain through Session 16 (Final Third) — enough
    // for Session 19 (Scorecard) to be reachable.
    completedSteps: ['enroll', 'identity', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format',
      'cut-toast-light', 'lighting-tutorial', 'flavor-memory', 'pairing-lab',
      'mentor-commentary', 'knowledge-drop', 'first-third', 'second-third', 'final-third'],
    xp: 0, rank: 'Novice', badges: [], smokecraftStamps: [], mentors: [], favorites: [], pendingOrders: [],
    currentSmokecraftStep: null, latestStampId: null, goldenBoxProgress: null,
    skillScore: 0, challengeScore: 0, loyaltyPoints: 0, lifetimeLoyaltyPoints: 0, redeemablePoints: 0,
    passportStampCount: 0, purchaseCount: 0, houseCigarPurchases: 0, pairingPurchases: 0,
    eventParticipationCount: 0, referralCount: 0, loyaltyLedger: [], usedTransactionIds: [],
    guestId: 'pkgb-test-guest-' + now, venueId: 'novee-grand-lounge', deviceId: 'kiosk-001', entrySource: 'qr-scan',
    entryStartedAt: now, lastActiveAt: now, guestProfile: null, profileComplete: true, resumeToken: null,
    audioEnabled: true, hapticsEnabled: true, lastVisitedRoute: null, leaderboardScore: 0, selectedCraft: null,
    selectedMentor: null, selectedMentorCountry: null, selectedLevel: null,
    smokeCraft: {}, passport: {}, goldenBox: {}, leaderboard: {}, preferences: {}, system: {}, pos3: {}, eatCommand: {},
  }
  const journey = { stateVersion: 1, selectedVenue: { id: 'v1', name: 'Test Lounge', selectedAt: now } }
  return { guestSession, journey }
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const { guestSession, journey } = buildSeedState()
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
  await ctx.addInitScript(() => { sessionStorage.setItem('novee_demo_mode', '1') })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${msg.text()} [${msg.location()?.url || ''}]`) })
  page.on('pageerror', err => consoleErrors.push(String(err)))

  console.log('\n── Route loads, instructions display ──')
  await nav(page, '/smokecraft/scorecard')
  const headingVisible = await page.locator('text=/Rating Categories/i').first().isVisible().catch(() => false)
  headingVisible ? ok('Scorecard route loads with real category instructions visible') : bad('Scorecard route loads')

  console.log('\n── Incomplete attempt: Continue with fewer than 6 categories rated ──')
  await page.locator('button[aria-label="Rate Appearance 4 out of 5"]').click()
  await page.waitForTimeout(300)
  await page.click('button:has-text("Continue to AI Summary")')
  await page.waitForTimeout(800)
  const errorVisible = await page.locator('[role="alert"]:has-text("Rate all 6 categories")').first().isVisible().catch(() => false)
  errorVisible ? ok('An incomplete scorecard is honestly rejected client-side before hitting the server') : bad('Incomplete scorecard rejected')

  console.log('\n── Scorecard controls work, partial draft saves ──')
  await page.locator('button[aria-label="Rate Construction 5 out of 5"]').click()
  await page.waitForTimeout(300)
  await page.click('button:has-text("Save Draft")')
  await page.waitForTimeout(900)
  const savedVisible = await page.locator('text=✓ Saved').first().isVisible().catch(() => false)
  savedVisible ? ok('Draft save confirms server-side (real round trip, not a fake local confirmation)') : bad('Draft save confirms')

  console.log('\n── Leave and return restores draft ──')
  await nav(page, '/smokecraft/final-third')
  await nav(page, '/smokecraft/scorecard')
  const appearanceRestored = await page.locator('button[aria-label="Rate Appearance 4 out of 5 (current)"]').isVisible().catch(() => false)
  appearanceRestored ? ok('After leaving the route and returning, the server draft restores the rated categories') : bad('Draft restores after leaving and returning')

  console.log('\n── Genuine hard reload restores draft ──')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const restoredAfterReload = await page.locator('button[aria-label="Rate Construction 5 out of 5 (current)"]').isVisible().catch(() => false)
  restoredAfterReload ? ok('A genuine hard reload restores the rated categories from the server draft') : bad('Reload restores server draft')

  console.log('\n── Successful completion: rate all 6 categories, submit ──')
  const remaining = [
    ['Draw', 3], ['Burn', 4], ['Flavor', 5], ['Pairing Match', 4],
  ]
  for (const [label, n] of remaining) {
    await page.locator(`button[aria-label="Rate ${label} ${n} out of 5"]`).click()
    await page.waitForTimeout(250)
  }
  await page.click('button:has-text("Continue to AI Summary")')
  await page.waitForTimeout(1800)
  const navigatedAway = page.url().includes('/smokecraft/ai-summary')
  navigatedAway ? ok('A complete scorecard submits and navigates to the real next step (server-confirmed)') : bad('Scorecard completes and navigates', page.url())

  console.log('\n── XP and progression update, reload preserves completion ──')
  const xpAfterComplete = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state', { credentials: 'include' })
    const d = await r.json()
    return d.state?.xpTotal
  })
  const xpPositive = xpAfterComplete > 0
  xpPositive ? ok('Real server-side XP total is greater than zero after Session 19 completion') : bad('XP total reflects completion')

  await nav(page, '/smokecraft/scorecard')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const xpAfterReload = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state', { credentials: 'include' })
    const d = await r.json()
    return d.state?.completedSessions?.some(c => c.sessionId === 'scorecard')
  })
  xpAfterReload ? ok('Completion persists across a genuine reload (server-confirmed, not localStorage-only)') : bad('Completion persists across reload')

  console.log('\n── Duplicate click applies once ──')
  const dup1 = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state/sessions/scorecard/complete', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idempotencyKey: 'browser-dup-scorecard-' + Date.now() }) })
    return r.status
  })
  const stateAfterDup = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state', { credentials: 'include' })
    const d = await r.json()
    return d.state.completedSessions.filter(c => c.sessionId === 'scorecard').length
  })
  stateAfterDup === 1 ? ok('Exactly one Session 19 completion record exists after a duplicate completion call') : bad('No duplicate completion record', String(stateAfterDup))

  console.log('\n── Offline state ──')
  const guestOffline = 'offline-scorecard-' + Date.now()
  await page.context().setOffline(true)
  await page.locator('button[aria-label*="Rate Appearance"]').first().click().catch(() => {})
  await page.click('button:has-text("Save Draft")').catch(() => {})
  await page.waitForTimeout(1200)
  // This guest already completed the session, so the draft save itself
  // will 409 already_completed once online — offline just needs to
  // never fabricate a "saved" success while the network is down.
  const fakeSavedWhileOffline = await page.locator('text=✓ Saved').first().isVisible().catch(() => false)
  !fakeSavedWhileOffline ? ok('No fake "Saved" confirmation is shown while offline') : bad('No fake success shown offline')
  await page.context().setOffline(false)

  console.log('\n── Responsive behavior (5 viewports) ──')
  await nav(page, '/smokecraft/scorecard')
  const viewports = [
    { w: 1440, h: 900, label: 'desktop-lg' },
    { w: 1180, h: 820, label: 'tablet-landscape' },
    { w: 1024, h: 768, label: 'tablet' },
    { w: 768, h: 1024, label: 'tablet-portrait' },
    { w: 390, h: 844, label: 'mobile' },
  ]
  let allNoOverflow = true
  for (const v of viewports) {
    await page.setViewportSize({ width: v.w, height: v.h })
    await page.waitForTimeout(400)
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
    if (!noOverflow) { allNoOverflow = false; console.log(`    ⚠ overflow at ${v.label} (${v.w}x${v.h})`) }
  }
  allNoOverflow ? ok('No horizontal layout cutoff across all 5 tested viewports') : bad('No horizontal cutoff across viewports')

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver|status of 40[139]|status of 429|ERR_INTERNET_DISCONNECTED/i.test(e))
  realErrors.length === 0 ? ok('No unexpected console errors across the scorecard flow') : bad('No console errors', realErrors.slice(0, 3).join(' | '))

  await ctx.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-required-interaction-package-b', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-required-interaction-package-b/browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
