/**
 * Required-Interaction Closure Package C — real Playwright browser
 * verification of Sessions 2, 5, 6, 10 selection/sequencing/matching/
 * hotspot server authority.
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
    sessionId: 'pkgc-test-' + now, createdAt: now, updatedAt: now, __version: 4,
    profile: { firstName: 'Package', lastName: 'C' },
    // Real prerequisite chain (src/constants/session.js VISIT_STRUCTURE):
    // Session 2's prereq is 'entry'; Session 5 (format)'s prereq is
    // session 4 ('terroir'); Session 6 (cut-toast-light)'s prereq is
    // session 5 ('format' — completed live during this test); Session 10
    // (flavor-memory)'s prereq is session 9 (merged into session 8,
    // completionKey 'first-third'). Sessions 3/4/8/9 are not under test
    // here, so their completionKeys are pre-seeded; 'humidor-match' and
    // 'format' are deliberately NOT pre-seeded — they are completed live
    // by this test, which is what actually extends completedSteps for
    // the next session's prerequisite (verified real client behavior,
    // not a seeding shortcut).
    completedSteps: ['enroll', 'identity', 'entry', 'meet-your-cigar', 'terroir', 'first-third'],
    xp: 0, rank: 'Novice', badges: [], smokecraftStamps: [], mentors: [], favorites: [], pendingOrders: [],
    currentSmokecraftStep: null, latestStampId: null, goldenBoxProgress: null,
    skillScore: 0, challengeScore: 0, loyaltyPoints: 0, lifetimeLoyaltyPoints: 0, redeemablePoints: 0,
    passportStampCount: 0, purchaseCount: 0, houseCigarPurchases: 0, pairingPurchases: 0,
    eventParticipationCount: 0, referralCount: 0, loyaltyLedger: [], usedTransactionIds: [],
    guestId: 'pkgc-test-guest-' + now, venueId: 'novee-grand-lounge', deviceId: 'kiosk-001', entrySource: 'qr-scan',
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

  // ═══════════════ SESSION 2 — Humidor Match ═══════════════
  console.log('\n── Session 2 (Humidor Match) — route loads, incorrect flow, correct flow ──')
  await nav(page, '/smokecraft/humidor-match')
  const zonesVisible = await page.locator('button[aria-label*="Dry Box"]').first().isVisible().catch(() => false)
  zonesVisible ? ok('Session 2 route loads with real environment zones visible') : bad('Session 2 route loads')

  await page.locator('button[aria-label*="Dry Box"]').first().click()
  await page.waitForTimeout(300)
  await page.click('button:has-text("Continue to Meet Your Cigar")')
  await page.waitForTimeout(1200)
  const incorrectFeedback = await page.locator('[role="alert"]:has-text("climate control")').first().isVisible().catch(() => false)
  incorrectFeedback ? ok('An incorrect environment selection shows real, honest feedback (no fake success)') : bad('Incorrect selection feedback shown')
  const stillOnRoute2 = page.url().includes('/smokecraft/humidor-match')
  stillOnRoute2 ? ok('Incorrect selection does not navigate away / complete the session') : bad('Incorrect selection does not complete', page.url())

  await page.locator('button[aria-label*="Virtual Humidor"]').first().click()
  await page.waitForTimeout(300)
  await page.click('button:has-text("Continue to Meet Your Cigar")')
  await page.waitForTimeout(1500)
  const navigated2 = page.url().includes('/smokecraft/meet-your-cigar')
  navigated2 ? ok('The correct selection completes and navigates to the real next step') : bad('Correct selection completes', page.url())

  const xp2 = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state', { credentials: 'include' })
    const d = await r.json()
    return d.state?.xpTotal
  })
  ;(xp2 > 0) ? ok('XP total increased after Session 2 completion') : bad('XP reflects Session 2 completion')

  await nav(page, '/smokecraft/humidor-match')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const stateAfterReload2 = await page.evaluate(async () => {
    const r = await fetch('/api/smokecraft/player-state', { credentials: 'include' })
    const d = await r.json()
    return d.state?.completedSessions?.some(c => c.sessionId === 'humidor-match')
  })
  stateAfterReload2 ? ok('Session 2 completion persists after a genuine reload') : bad('Session 2 completion persists after reload')

  // ═══════════════ SESSION 5 — Format ═══════════════
  console.log('\n── Session 5 (Format) — sequencing, incorrect flow, correct flow ──')
  await nav(page, '/smokecraft/format')
  const seqVisible = await page.locator('text=/Order these shapes/i').first().isVisible().catch(() => false)
  seqVisible ? ok('Session 5 route loads with the required sequencing panel visible') : bad('Session 5 sequencing panel visible')

  // Keyboard/click move controls — move the first item down a few times.
  const upButtons = page.locator('button[aria-label^="Move"][aria-label$="earlier"]')
  await upButtons.first().click().catch(() => {})
  await page.waitForTimeout(300)
  await page.click('button:has-text("Continue to Request / Purchase")')
  await page.waitForTimeout(1200)
  const seqIncorrectFeedback = await page.locator('[role="alert"]:has-text("burn time")').first().isVisible().catch(() => false)
  seqIncorrectFeedback ? ok('An incorrect sequence shows real, honest feedback') : bad('Incorrect sequence feedback shown')

  // Force the correct order via the move buttons: keep clicking "move
  // earlier" on the last mismatched item until the known-correct order
  // is reached, verified by reading the rendered order text.
  async function readOrder() {
    return page.locator('ol li').evaluateAll(items =>
      items.map(li => li.querySelectorAll('span')[1]?.textContent)
    )
  }
  const correctLabels = ['Corona', 'Robusto', 'Toro', 'Torpedo', 'Churchill', 'Gordo']
  for (let target = 0; target < correctLabels.length; target++) {
    for (let guard = 0; guard < 10; guard++) {
      const current = await readOrder()
      if (current[target] === correctLabels[target]) break
      const idx = current.indexOf(correctLabels[target])
      const items = page.locator('ol li')
      if (idx > target) {
        await items.nth(idx).locator('button[aria-label$="earlier"]').click()
      } else {
        await items.nth(idx).locator('button[aria-label$="later"]').click()
      }
      await page.waitForTimeout(80)
    }
  }
  await page.waitForTimeout(300)
  await page.click('button:has-text("Continue to Request / Purchase")')
  await page.waitForTimeout(1500)
  const navigated5 = page.url().includes('/smokecraft/request-purchase')
  navigated5 ? ok('The correct sequence completes and navigates to the real next step') : bad('Correct sequence completes', page.url())

  // ═══════════════ SESSION 6 — Cut-Toast-Light ═══════════════
  console.log('\n── Session 6 (Cut-Toast-Light) — matching, incorrect flow, correct flow ──')
  await nav(page, '/smokecraft/cut-toast-light')
  const matchVisible = await page.locator('text=/Match each cut method/i').first().isVisible().catch(() => false)
  matchVisible ? ok('Session 6 route loads with the required matching panel visible') : bad('Session 6 matching panel visible')

  await page.selectOption('#match-straight-cut', 'wedge-channel')
  await page.selectOption('#match-v-cut', 'full-cap-removal')
  await page.selectOption('#match-punch-cut', 'circular-plug')
  await page.locator('button[aria-label="Straight Cut"]').click()
  await page.waitForTimeout(300)
  await page.click('button:has-text("Continue to Lighting Tutorial")')
  await page.waitForTimeout(1200)
  const matchIncorrectFeedback = await page.locator('[role="alert"]:has-text("incorrect")').first().isVisible().catch(() => false)
  matchIncorrectFeedback ? ok('An incorrect matching shows real, honest feedback') : bad('Incorrect matching feedback shown')

  await page.selectOption('#match-straight-cut', 'full-cap-removal')
  await page.selectOption('#match-v-cut', 'wedge-channel')
  await page.selectOption('#match-punch-cut', 'circular-plug')
  await page.waitForTimeout(300)
  await page.click('button:has-text("Continue to Lighting Tutorial")')
  await page.waitForTimeout(1500)
  const navigated6 = page.url().includes('/smokecraft/lighting-tutorial')
  navigated6 ? ok('The correct matching completes and navigates to the real next step') : bad('Correct matching completes', page.url())

  // ═══════════════ SESSION 10 — Flavor Memory ═══════════════
  console.log('\n── Session 10 (Flavor Memory) — hotspot identification ──')
  await nav(page, '/smokecraft/flavor-memory')
  const hotspotVisible = await page.locator('button[aria-label*="Earth flavor"]').first().isVisible().catch(() => false)
  hotspotVisible ? ok('Session 10 route loads with real flavor hotspots visible') : bad('Session 10 hotspots visible')

  await page.click('button:has-text("Continue to Suggested Pairings")')
  await page.waitForTimeout(800)
  const fewFeedback = await page.locator('[role="alert"]:has-text("at least 2")').first().isVisible().catch(() => false)
  fewFeedback ? ok('Fewer than 2 flavor selections is honestly rejected client-side') : bad('Fewer than 2 selections rejected')

  await page.locator('button[aria-label*="Earth flavor"]').first().click()
  await page.waitForTimeout(200)
  await page.locator('button[aria-label*="Cocoa flavor"]').first().click()
  await page.waitForTimeout(200)
  await page.click('button:has-text("Continue to Suggested Pairings")')
  await page.waitForTimeout(1800)
  const navigated10 = page.url().includes('/smokecraft/pairing-lab')
  navigated10 ? ok('A valid hotspot selection completes and navigates to the real next step') : bad('Valid selection completes', page.url())

  // ═══════════════ Responsive / accessibility ═══════════════
  console.log('\n── Responsive (5 viewports) ──')
  await nav(page, '/smokecraft/format')
  const viewports = [
    { w: 1440, h: 900 }, { w: 1180, h: 820 }, { w: 1024, h: 768 }, { w: 768, h: 1024 }, { w: 390, h: 844 },
  ]
  let allNoOverflow = true
  for (const v of viewports) {
    await page.setViewportSize({ width: v.w, height: v.h })
    await page.waitForTimeout(300)
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
    if (!noOverflow) allNoOverflow = false
  }
  allNoOverflow ? ok('No horizontal layout cutoff across 5 tested viewports on Session 5') : bad('No horizontal cutoff across viewports')

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver|status of 40[139]|status of 429|ERR_INTERNET_DISCONNECTED/i.test(e))
  realErrors.length === 0 ? ok('No unexpected console errors across the full Package C flow') : bad('No console errors', realErrors.slice(0, 3).join(' | '))

  await ctx.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-required-interaction-package-c', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-required-interaction-package-c/browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
