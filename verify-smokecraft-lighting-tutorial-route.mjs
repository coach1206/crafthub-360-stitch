/**
 * verify-smokecraft-lighting-tutorial-route.mjs
 * Package E — Wire Lighting Tutorial into the live SmokeCraft journey
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
function ok(msg)  { pass++; console.log(`  ✓ ${msg}`) }
function bad(msg) { fail++; console.error(`  ✗ ${msg}`) }

async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(400)
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
}

async function seedGuest(page, completedSteps = [], demoMode = false, activeScreen) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ completedSteps, demoMode, activeScreen }) => {
    localStorage.removeItem('sc_journey_v1')
    if (demoMode) sessionStorage.setItem('novee_demo_mode', '1')
    else sessionStorage.removeItem('novee_demo_mode')
    if (activeScreen) sessionStorage.setItem('sc_active_screen', activeScreen)
    else sessionStorage.removeItem('sc_active_screen')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'lt-test-' + Date.now(), guestId: 'lt-test-guest',
      completedSteps, xp: completedSteps.length * 25, rank: 'Novice', badges: [],
      __version: 4,
    }))
  }, { completedSteps, demoMode, activeScreen })
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page    = await context.newPage()

  // ── 1. Route resolves ──
  console.log('\n── Suite 1: Route resolves ──')
  await seedGuest(page, ['entry', 'enroll', 'golden-box', 'mentor', 'format', 'wrapper-strength',
    'seed-soil', 'pairing-lab', 'humidor-match', 'request-purchase', 'cut-toast-light'], true)
  await nav(page, '/smokecraft/lighting-tutorial')
  const title = await page.textContent('h1')
  title.includes('Toasting') ? ok('/smokecraft/lighting-tutorial resolves and renders Step 1') : bad(`Title: ${title}`)

  // ── 2. Route guard works (non-demo, no progress) ──
  console.log('\n── Suite 2: Route guard enforces progression ──')
  await seedGuest(page, [], false)
  await page.goto(`${BASE}/smokecraft/lighting-tutorial`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const bodyLocked = await page.evaluate(() => document.body.innerText.toLowerCase())
  const blocked = bodyLocked.includes('locked') || bodyLocked.includes('required:') || bodyLocked.includes('back to current session')
  blocked ? ok('Guard blocks lighting-tutorial with no progress (non-demo)') : bad('Guard did not block access')

  // ── 3. Back returns to Choose Your Cut (cut-toast-light) ──
  console.log('\n── Suite 3: Back target ──')
  await seedGuest(page, ['entry', 'enroll', 'golden-box', 'mentor', 'format', 'wrapper-strength',
    'seed-soil', 'pairing-lab', 'humidor-match', 'request-purchase', 'cut-toast-light'], true)
  await nav(page, '/smokecraft/lighting-tutorial')
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/cut-toast-light'
    ? ok('Back on step 1 navigates to /smokecraft/cut-toast-light')
    : bad(`Back landed on ${page.url()}`)

  // ── 4. Continue advances to First Draw (first-third) once gated ──
  console.log('\n── Suite 4: Continue target + gating ──')
  await nav(page, '/smokecraft/lighting-tutorial')
  const continueBtnInitial = await page.$('div[role="navigation"] button:last-of-type')
  const initialText = await continueBtnInitial.textContent()
  initialText.includes('Next Step') ? ok('Continue shows "Next Step" before all steps viewed') : bad(`Initial button text: ${initialText}`)

  for (let i = 0; i < 7; i++) {
    await page.click('div[role="navigation"] button:last-of-type')
    await page.waitForTimeout(150)
  }
  const finalBtn = await page.$('div[role="navigation"] button:last-of-type')
  const finalText = await finalBtn.textContent()
  finalText.includes('Continue to First Draw') ? ok('Final step shows Continue to First Draw') : bad(`Final button text: ${finalText}`)

  const disabledBeforeAllViewed = await finalBtn.evaluate(el => el.disabled)
  !disabledBeforeAllViewed ? ok('Continue enabled once all 8 steps viewed') : bad('Continue still disabled after all steps viewed')

  await finalBtn.click()
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/first-third'
    ? ok('Continue on final step navigates to /smokecraft/first-third')
    : bad(`Continue landed on ${page.url()}`)

  // ── 5. Continue gated until steps complete (fresh visit) ──
  console.log('\n── Suite 5: Continue gated on fresh visit ──')
  await nav(page, '/smokecraft/lighting-tutorial')
  // Jump directly to last step via step-dot without viewing all
  const dots = await page.$$('[role="progressbar"] button')
  await dots[7].click()
  await page.waitForTimeout(200)
  const gatedBtn = await page.$('div[role="navigation"] button:last-of-type')
  const gatedDisabled = await gatedBtn.evaluate(el => el.disabled)
  gatedDisabled ? ok('Continue disabled on last step when earlier steps were skipped') : bad('Continue should be disabled but is not')

  // ── 6. Resume returns to Lighting Tutorial ──
  console.log('\n── Suite 6: Resume routing ──')
  await seedGuest(page, ['entry', 'enroll', 'golden-box', 'mentor', 'format', 'wrapper-strength',
    'seed-soil', 'pairing-lab', 'humidor-match', 'request-purchase', 'cut-toast-light'], false,
    '/smokecraft/lighting-tutorial')
  // Setting sessionStorage in seedGuest already navigates once (page.goto(BASE)); the flag
  // must survive the subsequent goto to the locked screen since sessionStorage is per-tab.
  // Visit a locked screen to trigger the "Back to Current Session" resume button
  await page.goto(`${BASE}/smokecraft/scorecard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const resumeBtn = await page.$('button:has-text("Back to Current Session")')
  if (resumeBtn) {
    await resumeBtn.click()
    await page.waitForTimeout(500)
    new URL(page.url()).pathname === '/smokecraft/lighting-tutorial'
      ? ok('Resume ("Back to Current Session") routes to Lighting Tutorial when it was the last visited route')
      : bad(`Resume landed on ${page.url()}, expected /smokecraft/lighting-tutorial`)
  } else {
    bad('Locked-screen resume button not found')
  }

  // ── 7. Refresh preserves state ──
  console.log('\n── Suite 7: Refresh preserves state ──')
  await seedGuest(page, ['entry', 'enroll', 'golden-box', 'mentor', 'format', 'wrapper-strength',
    'seed-soil', 'pairing-lab', 'humidor-match', 'request-purchase', 'cut-toast-light'], true)
  await nav(page, '/smokecraft/lighting-tutorial')
  await page.click('div[role="navigation"] button:last-of-type') // advance to step 2
  await page.waitForTimeout(200)
  const beforeRefresh = await page.textContent('h1')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const afterRefreshUrl = new URL(page.url()).pathname
  afterRefreshUrl === '/smokecraft/lighting-tutorial'
    ? ok('Refresh keeps the guest on /smokecraft/lighting-tutorial')
    : bad(`After refresh: ${afterRefreshUrl}`)

  // ── 8. No route loop ──
  console.log('\n── Suite 8: No route loop ──')
  await seedGuest(page, ['entry', 'enroll', 'golden-box', 'mentor', 'format', 'wrapper-strength',
    'seed-soil', 'pairing-lab', 'humidor-match', 'request-purchase', 'cut-toast-light'], true)
  await nav(page, '/smokecraft/cut-toast-light')
  await page.click('[aria-label="Straight Cut"]')
  await page.waitForTimeout(200)
  const ctlContinue = await page.$('div[role="navigation"] button:last-of-type')
  await ctlContinue.click()
  await page.waitForTimeout(600)
  new URL(page.url()).pathname === '/smokecraft/lighting-tutorial'
    ? ok('CutToastLight Continue correctly chains into Lighting Tutorial (no loop back)')
    : bad(`CutToastLight Continue landed on ${page.url()}`)

  // ── 9. No dead end — full chain Choose Your Cut → Lighting Tutorial → First Draw ──
  console.log('\n── Suite 9: Full chain, no dead end ──')
  await seedGuest(page, ['entry', 'enroll', 'golden-box', 'mentor', 'format', 'wrapper-strength',
    'seed-soil', 'pairing-lab', 'humidor-match', 'request-purchase'], true)
  await nav(page, '/smokecraft/cut-toast-light')
  await page.click('[aria-label="Straight Cut"]')
  await page.waitForTimeout(200)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(600)
  let chainOk = new URL(page.url()).pathname === '/smokecraft/lighting-tutorial'
  if (chainOk) {
    for (let i = 0; i < 7; i++) {
      await page.click('div[role="navigation"] button:last-of-type')
      await page.waitForTimeout(120)
    }
    await page.click('div[role="navigation"] button:last-of-type')
    await page.waitForTimeout(600)
    chainOk = new URL(page.url()).pathname === '/smokecraft/first-third'
  }
  chainOk
    ? ok('Full chain Choose Your Cut → Lighting Tutorial → First Draw completes with no dead end')
    : bad(`Chain broke, ended on ${page.url()}`)

  await browser.close()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

run().catch(err => { console.error(err); process.exit(1) })
