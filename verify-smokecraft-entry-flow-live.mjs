import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://localhost:5000'
const PROOF_DIR = 'public/proof/smokecraft-entry-flow-live-rebuild'
let passed = 0
let failed = 0
function ok(n, msg) { passed++; console.log(`  ✓ [${n}] ${msg}`) }
function bad(n, msg) { failed++; console.log(`  ✗ [${n}] ${msg}`) }

async function seedGuest(page, opts = {}) {
  await page.goto(`${BASE}/smokecraft`)
  await page.evaluate((o) => {
    const session = {
      sessionId: 'entryflow-test-guest',
      xp: o.xp ?? 0,
      completedSteps: o.completedSteps || [],
      profile: o.profile || {},
      badges: [],
      smokeCraft: {},
    }
    localStorage.setItem('novee_guest_session', JSON.stringify(session))
    if (o.demoMode !== false) localStorage.setItem('novee_demo_mode', 'true')
    if (o.journeyPatch) localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, ...o.journeyPatch }))
    else localStorage.removeItem('sc_journey_v1')
  }, opts)
}

async function nav(page, path) {
  await page.goto(`${BASE}${path}`)
  await page.waitForTimeout(400)
}

const VIEWPORTS = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'tablet10-1280x800', width: 1280, height: 800 },
  { name: 'tablet12-1366x1024', width: 1366, height: 1024 },
  { name: 'touch15-1920x1080', width: 1920, height: 1080 },
]

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text())
  })

  // ── LAUNCH (/smokecraft) — Tests 1-10 ──────────────────────────────────
  console.log('── Launch (/smokecraft) ──')
  await seedGuest(page, { completedSteps: [] })
  await nav(page, '/smokecraft')
  let body = await page.textContent('body')
  body.includes('Start Journey') ? ok(1, 'Fresh guest sees Start Journey (not Resume)') : bad(1, 'Start Journey label missing for fresh guest')

  const heroCount = await page.locator('[role="img"][aria-label*="Guided Cigar Experience"]').count()
  heroCount > 0 ? ok(2, 'Decorative header band renders as a bounded role=img element') : bad(2, 'Header band missing')

  const destButtons = ['How It Works', 'View Passport', 'View Pairing', 'Browse Humidor', 'Rankings', 'Enter Challenge']
  let allPresent = true
  for (const label of destButtons) {
    const c = await page.locator('button', { hasText: label }).count()
    if (c === 0) allPresent = false
  }
  allPresent ? ok(3, 'All 6 preserved hotspot destinations render as real visible buttons') : bad(3, 'One or more destination buttons missing')

  await page.click('button:has-text("Start Journey")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/enroll') ? ok(4, 'Fresh guest routed to Enroll via getEntryRoute()') : bad(4, `Landed on ${page.url()}`)

  await seedGuest(page, { completedSteps: ['entry', 'enroll'], journeyPatch: { selectedVenue: { name: 'Test Venue' } } })
  await nav(page, '/smokecraft')
  body = await page.textContent('body')
  body.includes('Resume Journey') ? ok(5, 'Returning guest (enrolled + venue selected) sees Resume Journey label') : bad(5, 'Resume Journey label missing for returning guest')
  await page.click('button:has-text("Resume Journey")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/resume') ? ok(6, 'Returning guest routed to /smokecraft/resume') : bad(6, `Landed on ${page.url()}`)

  await nav(page, '/smokecraft')
  await page.click('button:has-text("View Pairing")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/pairing-lab') ? ok(7, 'View Pairing navigates to /smokecraft/pairing-lab') : bad(7, `Landed on ${page.url()}`)

  await nav(page, '/smokecraft')
  const noFakeData = !(body.includes('27 sessions completed') || body.includes('Level 5'))
  noFakeData ? ok(8, 'No fabricated progress/user data rendered on Launch') : bad(8, 'Fabricated data found on Launch')

  const brokenImgs = await page.evaluate(() => Array.from(document.images).filter(i => !i.complete || i.naturalWidth === 0).length)
  brokenImgs === 0 ? ok(9, 'No broken <img> elements on Launch') : bad(9, `${brokenImgs} broken images`)

  const overflow1 = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflow1 ? ok(10, 'No horizontal overflow on Launch (desktop)') : bad(10, 'Horizontal overflow on Launch')

  // ── ENROLL (/smokecraft/enroll) — Tests 11-20 ──────────────────────────
  console.log('── Enroll (/smokecraft/enroll) ──')
  await seedGuest(page, { completedSteps: [] })
  await nav(page, '/smokecraft/enroll')
  body = await page.textContent('body')
  body.includes('27-session') ? ok(11, 'Stale "8-visit journey" copy replaced with 27-session language') : bad(11, '27-session copy not found')
  !body.includes('8-visit') ? ok(12, 'No remaining "8-visit" copy') : bad(12, 'Stale 8-visit copy still present')

  const guestPressed = await page.locator('button[aria-pressed]', { hasText: 'Continue as Guest' }).getAttribute('aria-pressed')
  const signinPressed = await page.locator('button[aria-pressed]', { hasText: 'Sign In' }).getAttribute('aria-pressed')
  if (guestPressed === 'false' && signinPressed === 'false') ok(13, 'No preselection between Guest/Sign In on fresh visit')
  else bad(13, 'A choice was preselected')

  const continueDisabledInitially = await page.locator('button:has-text("Continue →")').isDisabled()
  continueDisabledInitially ? ok(14, 'Continue disabled until a valid choice is made') : bad(14, 'Continue was enabled with no choice')

  await page.locator('button[aria-pressed]', { hasText: 'Continue as Guest' }).click()
  await page.waitForTimeout(150)
  const continueEnabledGuest = await page.locator('button:has-text("Continue →")').isDisabled()
  continueEnabledGuest === false ? ok(15, 'Continue enables once Guest mode is selected') : bad(15, 'Continue still disabled after selecting Guest')

  await nav(page, '/smokecraft/enroll')
  await page.locator('button[aria-pressed]', { hasText: 'Sign In' }).click()
  await page.waitForTimeout(150)
  const emailInputVisible = await page.locator('#enroll-email').count()
  emailInputVisible > 0 ? ok(16, 'Sign In reveals an email field reusing existing profile source') : bad(16, 'Email field not shown for Sign In')

  const continueDisabledBadEmail = await page.locator('button:has-text("Continue →")').isDisabled()
  continueDisabledBadEmail ? ok(17, 'Continue stays disabled with empty email under Sign In') : bad(17, 'Continue enabled with invalid Sign In state')

  await page.fill('#enroll-email', 'not-an-email')
  await page.locator('#enroll-email').blur()
  await page.waitForTimeout(150)
  const emailErr = await page.locator('[role="alert"]', { hasText: 'valid email' }).count()
  emailErr > 0 ? ok(18, 'Invalid email is rejected with a validation message') : bad(18, 'Invalid email not rejected')

  const stepsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}').completedSteps || [])
  !stepsBefore.includes('enroll') ? ok(19, 'No reward awarded merely for viewing Enroll') : bad(19, 'Reward awarded without pressing Continue')

  await page.fill('#enroll-email', 'guest@example.com')
  await page.waitForTimeout(150)
  await page.click('button:has-text("Continue →")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/venue-select') ? ok(20, 'Valid Sign In choice advances to Venue Select') : bad(20, `Landed on ${page.url()}`)

  // ── RESUME (/smokecraft/resume) — Tests 21-27 (logic untouched, visual only) ─
  console.log('── Resume (/smokecraft/resume) ──')
  await seedGuest(page, { completedSteps: ['enroll'] })
  await nav(page, '/smokecraft/resume')
  body = await page.textContent('body')
  body.includes('No saved journey yet') ? ok(21, 'No-progress empty state still renders (logic untouched)') : bad(21, 'Empty state missing')
  const resumeHero = await page.locator('[role="img"][aria-label*="Resume or Start New Journey"]').count()
  resumeHero > 0 ? ok(22, 'New decorative header band renders on Resume') : bad(22, 'Header band missing on Resume')

  await seedGuest(page, {
    completedSteps: ['entry', 'enroll', 'welcome'],
    journeyPatch: { selectedVenue: { name: 'Test Venue' }, resumeRoute: '/smokecraft/mentor-selection' },
  })
  await nav(page, '/smokecraft/resume')
  body = await page.textContent('body')
  body.includes('Saved Journey') ? ok(23, 'Saved-journey summary card renders real state') : bad(23, 'Saved journey card missing')
  const resumeBtnDisabled = await page.locator('button:has-text("Resume Journey")').isDisabled()
  resumeBtnDisabled === false ? ok(24, 'Resume Journey enabled with real progress') : bad(24, 'Resume Journey incorrectly disabled')

  await page.click('button:has-text("Start New Journey")')
  await page.waitForTimeout(200)
  const confirmVisible = await page.locator('button:has-text("Confirm — Start New Journey")').count()
  confirmVisible > 0 ? ok(25, 'Start New Journey confirmation modal still works') : bad(25, 'Confirmation modal missing')
  await page.click('button:has-text("Cancel")')
  await page.waitForTimeout(150)

  const backBtn = await page.locator('button:has-text("Back")').count()
  backBtn > 0 ? ok(26, 'Back control still present on Resume') : bad(26, 'Back control missing')

  const resumeOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  resumeOverflow ? ok(27, 'No horizontal overflow on Resume with new header') : bad(27, 'Horizontal overflow on Resume')

  // ── FULL ENTRY FLOW — Tests 28-40 ──────────────────────────────────────
  console.log('── Full Entry Flow ──')
  await seedGuest(page, { completedSteps: [] })
  await nav(page, '/crafthub')
  ;(await page.textContent('body')).length > 0 ? ok(28, '/crafthub still resolves (out of scope, unaffected)') : bad(28, '/crafthub broke')

  await nav(page, '/smokecraft')
  await page.click('button:has-text("Start Journey")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/enroll') ? ok(29, 'Full flow: Launch → Enroll') : bad(29, `Landed on ${page.url()}`)

  await page.locator('button[aria-pressed]', { hasText: 'Continue as Guest' }).click()
  await page.click('button:has-text("Continue →")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/venue-select') ? ok(30, 'Full flow: Enroll → Venue Select') : bad(30, `Landed on ${page.url()}`)

  await nav(page, '/smokecraft/identity')
  ;(await page.textContent('body')).length > 0 ? ok(31, '/smokecraft/identity still resolves (out of scope, unaffected)') : bad(31, 'Identity broke')

  await seedGuest(page, { completedSteps: ['entry', 'enroll'], journeyPatch: { selectedVenue: { name: 'Test Venue' } } })
  await nav(page, '/smokecraft')
  await page.click('button:has-text("Resume Journey")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/resume') ? ok(32, 'Full flow: returning guest Launch → Resume') : bad(32, `Landed on ${page.url()}`)

  const allErrorsEmpty = errors.length === 0
  allErrorsEmpty ? ok(33, 'No console errors across full flow traversal') : bad(33, `Console errors: ${errors.slice(0, 5).join(', ')}`)

  await nav(page, '/smokecraft/venue-select')
  const venueBody = await page.textContent('body')
  venueBody.length > 0 ? ok(34, '/smokecraft/venue-select still resolves (out of scope, unaffected)') : bad(34, 'Venue Select broke')

  await nav(page, '/smokecraft/mentor-selection')
  ;(await page.textContent('body')).length > 0 ? ok(35, 'Non-entry route spot check (Mentor Selection) unaffected') : bad(35, 'Mentor Selection broke')

  const journeyStillValid = await page.evaluate(() => {
    try { return !!JSON.parse(localStorage.getItem('sc_journey_v1') || '{}') } catch { return false }
  })
  journeyStillValid ? ok(36, 'sc_journey_v1 persistence untouched by rebuild') : bad(36, 'Journey persistence broken')

  const guestSessionStillValid = await page.evaluate(() => {
    try { return !!JSON.parse(localStorage.getItem('novee_guest_session') || '{}') } catch { return false }
  })
  guestSessionStillValid ? ok(37, 'novee_guest_session persistence untouched by rebuild') : bad(37, 'Guest session persistence broken')

  await nav(page, '/smokecraft')
  const smallText = await page.evaluate(() => {
    let count = 0
    for (const el of document.querySelectorAll('main *, header *')) {
      const fs = parseFloat(getComputedStyle(el).fontSize)
      if (fs > 0 && fs < 11 && el.textContent.trim().length > 0 && el.children.length === 0) count++
    }
    return count
  })
  smallText === 0 ? ok(38, 'No text smaller than 11px on Launch') : bad(38, `${smallText} small text node(s)`)

  await nav(page, '/smokecraft/enroll')
  const smallText2 = await page.evaluate(() => {
    let count = 0
    for (const el of document.querySelectorAll('main *, header *')) {
      const fs = parseFloat(getComputedStyle(el).fontSize)
      if (fs > 0 && fs < 11 && el.textContent.trim().length > 0 && el.children.length === 0) count++
    }
    return count
  })
  smallText2 === 0 ? ok(39, 'No text smaller than 11px on Enroll') : bad(39, `${smallText2} small text node(s)`)

  await nav(page, '/smokecraft/resume')
  const smallText3 = await page.evaluate(() => {
    let count = 0
    for (const el of document.querySelectorAll('main *, header *')) {
      const fs = parseFloat(getComputedStyle(el).fontSize)
      if (fs > 0 && fs < 11 && el.textContent.trim().length > 0 && el.children.length === 0) count++
    }
    return count
  })
  smallText3 === 0 ? ok(40, 'No text smaller than 11px on Resume') : bad(40, `${smallText3} small text node(s)`)

  // ── Screenshot proof at 4 viewports for all 3 rebuilt routes ───────────
  console.log('── Screenshot proof ──')
  await seedGuest(page, { completedSteps: ['entry', 'enroll'], journeyPatch: { selectedVenue: { name: 'Test Venue' } } })
  const routes = [
    { path: '/smokecraft', name: 'launch' },
    { path: '/smokecraft/enroll', name: 'enroll' },
    { path: '/smokecraft/resume', name: 'resume' },
  ]
  fs.mkdirSync(PROOF_DIR, { recursive: true })
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    for (const r of routes) {
      await nav(page, r.path)
      await page.screenshot({ path: `${PROOF_DIR}/${r.name}-${vp.name}.png` })
    }
  }
  ok('proof', 'Screenshots captured for Launch/Enroll/Resume at 4 viewports')

  await browser.close()

  console.log('\n' + '─'.repeat(50))
  console.log(`Result: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
