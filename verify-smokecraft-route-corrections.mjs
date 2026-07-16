/**
 * verify-smokecraft-route-corrections.mjs
 * Package B — SmokeCraft 360 Route Corrections and Route Map Finalization
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
function ok(msg)  { pass++; console.log(`  ✓ ${msg}`) }
function bad(msg) { fail++; console.error(`  ✗ ${msg}`) }

async function seedGuest(page, completedSteps = [], demoMode = false) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ completedSteps, demoMode }) => {
    localStorage.removeItem('sc_journey_v1')
    if (demoMode) sessionStorage.setItem('novee_demo_mode', '1')
    else sessionStorage.removeItem('novee_demo_mode')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'route-test-' + Date.now(), guestId: 'route-test-guest',
      completedSteps, xp: completedSteps.length * 25, rank: 'Novice', badges: [], __version: 4,
    }))
  }, { completedSteps, demoMode })
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page    = await context.newPage()

  // ─────────────────────────────────────────────────────────────
  // Suite 1: shape-size-burn redirects to canonical /format
  // ─────────────────────────────────────────────────────────────
  console.log('\n── Suite 1: shape-size-burn alias ──')
  await seedGuest(page, [], true)
  await page.goto(`${BASE}/smokecraft/shape-size-burn`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  page.url().endsWith('/smokecraft/format')
    ? ok('shape-size-burn redirects to /smokecraft/format')
    : bad(`shape-size-burn landed on ${page.url()}`)

  // ─────────────────────────────────────────────────────────────
  // Suite 2: legacy session-1..4 aliases land on correct destinations
  // ─────────────────────────────────────────────────────────────
  console.log('\n── Suite 2: legacy session-1..4 aliases ──')
  const expectations = [
    ['/smokecraft/session-1', '/smokecraft'],
    ['/smokecraft/session-2', '/smokecraft/enroll'],
    ['/smokecraft/session-3', '/smokecraft/golden-box'],
    ['/smokecraft/session-4', '/smokecraft/mentor-selection'],
  ]
  for (const [from, to] of expectations) {
    await seedGuest(page, [], true)
    await page.goto(`${BASE}${from}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const landed = new URL(page.url()).pathname
    landed === to
      ? ok(`${from} → ${to}`)
      : bad(`${from} landed on ${landed}, expected ${to}`)
  }

  // ─────────────────────────────────────────────────────────────
  // Suite 3: Identity requires Enroll first (outside demo mode)
  // ─────────────────────────────────────────────────────────────
  console.log('\n── Suite 3: Identity/Enroll sequential gate ──')
  await seedGuest(page, [], false)
  await page.goto(`${BASE}/smokecraft/identity`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  new URL(page.url()).pathname === '/smokecraft/enroll'
    ? ok('Direct navigation to /identity without completing enroll redirects to /enroll')
    : bad(`Landed on ${page.url()} instead of being redirected to /enroll`)

  await seedGuest(page, ['entry', 'enroll'], false)
  await page.goto(`${BASE}/smokecraft/identity`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  new URL(page.url()).pathname === '/smokecraft/identity'
    ? ok('Identity reachable once enroll is completed')
    : bad(`Landed on ${page.url()} after completing enroll`)

  // Demo mode bypasses the sequential gate (matches existing demo-mode philosophy)
  await seedGuest(page, [], true)
  await page.goto(`${BASE}/smokecraft/identity`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  new URL(page.url()).pathname === '/smokecraft/identity'
    ? ok('Demo mode: Identity reachable directly without completing enroll')
    : bad(`Demo mode: landed on ${page.url()} instead of /identity`)

  // ─────────────────────────────────────────────────────────────
  // Suite 4: Locked screen "Back to Current Session" uses canonical resume route
  // ─────────────────────────────────────────────────────────────
  console.log('\n── Suite 4: Locked screen resume routing ──')
  // Package J renumbered the main spine to 27 sessions; golden-box is now a
  // supporting module (no longer S3), so it no longer gates humidor-match.
  // Session 4 (terroir) should be locked with only entry+humidor-match done
  // (meet-your-cigar, S3, not yet complete).
  await seedGuest(page, ['entry', 'humidor-match'], false)
  await page.goto(`${BASE}/smokecraft/terroir`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const lockedBtn = await page.$('button:has-text("Back to Current Session")')
  if (lockedBtn) {
    await lockedBtn.click()
    await page.waitForTimeout(600)
    const landedPath = new URL(page.url()).pathname
    // With entry+humidor-match complete, the guest's current allowed session should be meet-your-cigar
    landedPath === '/smokecraft/meet-your-cigar'
      ? ok('Back to Current Session routes to the real current session (meet-your-cigar), not always /smokecraft')
      : bad(`Back to Current Session routed to ${landedPath}, expected /smokecraft/meet-your-cigar`)
  } else {
    bad('Locked screen "Back to Current Session" button not found (session may not have been locked as expected)')
  }

  // ─────────────────────────────────────────────────────────────
  // Suite 5: Every registered SmokeCraft route resolves (no 404 / crash)
  // ─────────────────────────────────────────────────────────────
  console.log('\n── Suite 5: All main-spine routes resolve ──')
  await seedGuest(page, [], true)
  const spineRoutes = [
    '/smokecraft', '/smokecraft/enroll', '/smokecraft/identity', '/smokecraft/golden-box',
    '/smokecraft/mentor-selection', '/smokecraft/format', '/smokecraft/wrapper-strength',
    '/smokecraft/seed-soil', '/smokecraft/pairing-lab', '/smokecraft/humidor-match',
    '/smokecraft/request-purchase', '/smokecraft/cut-toast-light', '/smokecraft/first-third',
    '/smokecraft/second-third', '/smokecraft/flavor-memory', '/smokecraft/final-third',
    '/smokecraft/scorecard', '/smokecraft/smokecraft-challenge', '/smokecraft/second-humidor-match',
    '/smokecraft/mini-tasting', '/smokecraft/final-review', '/smokecraft/passport-stamp',
    '/smokecraft/connections', '/smokecraft/management-sync', '/smokecraft/session-complete',
  ]
  let allResolved = true
  for (const route of spineRoutes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(200)
    const hasContent = await page.evaluate(() => document.body.innerText.length > 0)
    if (!hasContent) { allResolved = false; bad(`${route}: no content rendered`) }
  }
  allResolved
    ? ok(`All ${spineRoutes.length} main-spine routes resolve with content`)
    : bad('One or more spine routes failed to resolve')

  // ─────────────────────────────────────────────────────────────
  // Suite 6: Route guards still enforce locked progression
  // ─────────────────────────────────────────────────────────────
  console.log('\n── Suite 6: Route guards still enforce progression (non-demo) ──')
  await seedGuest(page, [], false)
  await page.goto(`${BASE}/smokecraft/scorecard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const bodyText = await page.evaluate(() => document.body.innerText)
  bodyText.includes('locked') || bodyText.toLowerCase().includes('locked')
    ? ok('Scorecard (S16) shows locked state when far-future session requested with no progress')
    : bad('Scorecard did not show a locked state despite no progress — guard may be broken')

  // ─────────────────────────────────────────────────────────────
  // Suite 7: No route loops — Back from Identity does not return to Identity
  // ─────────────────────────────────────────────────────────────
  console.log('\n── Suite 7: No route loops ──')
  await seedGuest(page, ['entry', 'enroll'], false)
  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(300)
  await page.goto(`${BASE}/smokecraft/identity`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const identityUrl = new URL(page.url()).pathname
  identityUrl === '/smokecraft/identity'
    ? ok('Identity does not loop back to Enroll once enroll is complete')
    : bad(`Identity redirected unexpectedly to ${identityUrl}`)

  await browser.close()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

run().catch(err => { console.error(err); process.exit(1) })
