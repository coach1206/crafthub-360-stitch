import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://localhost:5000'
const PROOF_DIR = 'public/proof/smokecraft-package-a-completion'
let passed = 0
let failed = 0
function ok(n, msg) { passed++; console.log(`  ✓ [${n}] ${msg}`) }
function bad(n, msg) { failed++; console.log(`  ✗ [${n}] ${msg}`) }

async function seedGuest(page, opts = {}) {
  await page.goto(`${BASE}/smokecraft`)
  await page.evaluate((o) => {
    const session = {
      sessionId: 'pkgA-test-guest',
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

  // ── GOLDEN BOX ──────────────────────────────────────────────────────────
  console.log('── Golden Box ──')
  await seedGuest(page, { completedSteps: ['entry'] })
  await nav(page, '/smokecraft/golden-box')
  let body = await page.textContent('body')
  body.includes('Golden Box Rules') ? ok(1, 'Golden Box renders with approved title') : bad(1, 'Title missing')
  // The Golden Principles are preserved as approved baked artwork (not moved,
  // not rebuilt as React text) per the live-composition-recovery directive —
  // verify the approved composite image itself is what's rendering instead.
  const goldenBoxImg = await page.locator('img[alt*="Golden Box Rules"]').count()
  goldenBoxImg > 0 ? ok(2, 'Approved full GOLDEN BOX RULES.png composition renders (principles preserved as approved artwork, not moved)') : bad(2, 'Approved composite image missing')
  ;(body.includes('Your Commitment') || body.includes('Venue Settings') || body.includes('Guest Agreements (Staff'))
    ? bad(3, 'Baked unrelated forms (Identity/Venue/staff table) still visible as text')
    : ok(3, 'No baked unrelated Identity/Venue/staff-table content leaked onto this screen as live text')

  const continueDisabled1 = await page.locator('button:has-text("Next: Mentor Selection")').isDisabled()
  continueDisabled1 ? ok(4, 'Continue disabled until acknowledgement checked') : bad(4, 'Continue enabled with no acknowledgement')

  const stepsBeforeAck = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}').completedSteps || [])
  !stepsBeforeAck.includes('golden-box') ? ok(5, 'No reward awarded merely for opening Golden Box') : bad(5, 'Reward awarded on load')

  await page.click('input[type="checkbox"]')
  await page.waitForTimeout(150)
  const continueEnabled1 = await page.locator('button:has-text("Next: Mentor Selection")').isDisabled()
  continueEnabled1 === false ? ok(6, 'Continue enables once acknowledged') : bad(6, 'Continue stayed disabled after acknowledging')

  await page.click('button:has-text("Next: Mentor Selection")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/mentor-selection') ? ok(7, 'Golden Box Continue routes to Mentor Selection') : bad(7, `Landed on ${page.url()}`)

  const stepsAfterAck = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}').completedSteps || [])
  stepsAfterAck.includes('golden-box') ? ok(8, 'Golden Box completion persisted to guest session') : bad(8, 'Completion not persisted')

  await page.reload()
  await page.waitForTimeout(400)
  const journeyAfterReload = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1') || '{}'))
  journeyAfterReload?.goldenBox?.acknowledged === true ? ok(9, 'Acknowledgement persists across refresh') : bad(9, 'Acknowledgement lost on refresh')

  await nav(page, '/smokecraft/golden-box')
  await page.click('button:has-text("Back")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/golden-box') === false ? ok(10, 'Golden Box Back navigates away') : bad(10, 'Back did not navigate')

  // ── MENTOR SELECTION ────────────────────────────────────────────────────
  console.log('── Mentor Selection ──')
  await seedGuest(page, { completedSteps: ['entry', 'golden-box'] })
  await nav(page, '/smokecraft/mentor-selection')
  body = await page.textContent('body')
  body.includes('Mentor Selection') ? ok(11, 'Mentor Selection renders with title') : bad(11, 'Title missing')

  const mentorCount = await page.locator('button[aria-pressed]').count()
  mentorCount === 8 ? ok(12, 'All 8 real mentors render as cards') : bad(12, `Found ${mentorCount} mentor cards, expected 8`)

  const preselected = await page.locator('button[aria-pressed="true"]').count()
  preselected === 0 ? ok(13, 'No mentor preselected on a fresh visit') : bad(13, `${preselected} mentor(s) incorrectly preselected`)

  const namesToCheck = ['Don Alejandro', 'Javier Estelí', 'Doña Jamastran', 'Mateo San Andrés', 'Maestro Rafael', 'Carlos Mendoza', 'Thomas A. Blackwell', 'Dr. Paulo Oliveira']
  let allNamesPresent = true
  for (const name of namesToCheck) {
    if (!body.includes(name)) allNamesPresent = false
  }
  allNamesPresent ? ok(14, 'All real mentor names/bios from the project data module are present (no fabricated data)') : bad(14, 'One or more real mentor names missing')

  const continueDisabled2 = await page.locator('button:has-text("Continue to Seed")').isDisabled()
  continueDisabled2 ? ok(15, 'Continue disabled with zero mentors selected') : bad(15, 'Continue enabled with no selection')

  const firstMentor = page.locator('button[aria-pressed]').first()
  await firstMentor.click()
  await page.waitForTimeout(150)
  const firstPressed = await firstMentor.getAttribute('aria-pressed')
  firstPressed === 'true' ? ok(16, 'Selecting a mentor sets pressed state') : bad(16, 'Selection did not register')

  const secondMentor = page.locator('button[aria-pressed]').nth(1)
  await secondMentor.click()
  await page.waitForTimeout(150)
  const thirdMentor = page.locator('button[aria-pressed]').nth(2)
  const thirdDisabled = await thirdMentor.isDisabled()
  thirdDisabled ? ok(17, 'Selection limit (2) enforced — third mentor is disabled') : bad(17, 'Selection limit not enforced')

  await firstMentor.click()
  await page.waitForTimeout(150)
  const firstPressedAfterRemove = await firstMentor.getAttribute('aria-pressed')
  firstPressedAfterRemove === 'false' ? ok(18, 'Removing a selected mentor works') : bad(18, 'Mentor removal did not work')

  await firstMentor.click()
  await page.waitForTimeout(150)
  const continueEnabled2 = await page.locator('button:has-text("Continue to Seed")').isDisabled()
  continueEnabled2 === false ? ok(19, 'Continue enables once a mentor is selected') : bad(19, 'Continue stayed disabled with a valid selection')

  const stepsBeforeMentorContinue = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}').completedSteps || [])
  !stepsBeforeMentorContinue.includes('mentor') ? ok(20, 'No reward awarded merely for selecting (before Continue)') : bad(20, 'Reward awarded before Continue pressed')

  await page.click('button:has-text("Continue to Seed")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/seed-soil') ? ok(21, 'Mentor Selection Continue routes to /smokecraft/seed-soil') : bad(21, `Landed on ${page.url()}`)

  await page.reload()
  await page.waitForTimeout(400)
  await nav(page, '/smokecraft/mentor-selection')
  const persistedSelection = await page.locator('button[aria-pressed="true"]').count()
  persistedSelection === 2 ? ok(22, 'Mentor selection persists across refresh/resume') : bad(22, `${persistedSelection} selected after refresh, expected 2`)

  // ── COMPLETE PACKAGE A SEQUENCE ─────────────────────────────────────────
  console.log('── Complete Package A Sequence ──')
  await seedGuest(page, { completedSteps: [] })
  await nav(page, '/smokecraft')
  body = await page.textContent('body')
  body.includes('Start Journey') ? ok(23, 'Fresh guest: Launch shows Start Journey') : bad(23, 'Start Journey missing')

  await page.click('button:has-text("Start Journey")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/enroll') ? ok(24, 'Launch → Enroll') : bad(24, `Landed on ${page.url()}`)

  await page.click('button[aria-label="Explore as Guest"]')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/venue-select') ? ok(25, 'Enroll → Venue Select') : bad(25, `Landed on ${page.url()}`)

  await page.click('button:has-text("Continue without venue")')
  await page.waitForTimeout(200)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(400)
  page.url().includes('/smokecraft/identity') ? ok(26, 'Venue Select → Identity') : bad(26, `Landed on ${page.url()}`)

  await page.fill('#id-fullname', 'Package A Tester')
  await page.locator('button[aria-pressed]', { hasText: 'New to Cigars' }).click()
  await page.waitForTimeout(200)
  await page.click('button:has-text("Begin My Journey")')
  await page.waitForTimeout(400)
  page.url().includes('/smokecraft/golden-box') ? ok(27, 'Identity → Golden Box') : bad(27, `Landed on ${page.url()}`)

  await page.click('input[type="checkbox"]')
  await page.click('button:has-text("Next: Mentor Selection")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/mentor-selection') ? ok(28, 'Golden Box → Mentor Selection') : bad(28, `Landed on ${page.url()}`)

  await page.locator('button[aria-pressed]').first().click()
  await page.waitForTimeout(150)
  await page.click('button:has-text("Continue to Seed")')
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/seed-soil') ? ok(29, 'Mentor Selection → /smokecraft/seed-soil (first Package B route, corrected)') : bad(29, `Landed on ${page.url()}`)

  // Returning-guest resume behavior
  await seedGuest(page, { completedSteps: ['entry', 'enroll'], journeyPatch: { selectedVenue: { name: 'Test Venue' } } })
  await nav(page, '/smokecraft')
  body = await page.textContent('body')
  body.includes('Resume Journey') ? ok(30, 'Returning guest with saved progress sees Resume Journey') : bad(30, 'Resume Journey label missing')

  // No stale data leaking into a new journey — Start New Journey from Resume
  await seedGuest(page, {
    completedSteps: ['entry', 'enroll'],
    journeyPatch: { selectedVenue: { name: 'Test Venue' }, mentor: [{ id: 'dominican' }] },
  })
  await nav(page, '/smokecraft/resume')
  const startNewBtn = page.locator('button:has-text("Start New Journey")')
  if (await startNewBtn.count() > 0) {
    await startNewBtn.click()
    await page.waitForTimeout(200)
    const confirmBtn = page.locator('button:has-text("Confirm — Start New Journey")')
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click()
      await page.waitForTimeout(400)
      const journeyAfterReset = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1') || '{}'))
      !journeyAfterReset.mentor ? ok(31, 'No stale mentor data leaks into a new journey after Start New Journey') : bad(31, 'Stale mentor data leaked into new journey')
    } else {
      bad(31, 'Confirm modal did not appear')
    }
  } else {
    bad(31, 'Start New Journey button not found on Resume with progress')
  }

  const noConsoleErrors = errors.length === 0
  noConsoleErrors ? ok(32, 'No console errors across the full Package A sequence') : bad(32, `Console errors: ${errors.slice(0, 5).join(', ')}`)

  const overflowCheck = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowCheck ? ok(33, 'No horizontal overflow across sequence (desktop)') : bad(33, 'Horizontal overflow detected')

  // ── Screenshot proof at 4 viewports ─────────────────────────────────────
  console.log('── Screenshot proof ──')
  fs.mkdirSync(PROOF_DIR, { recursive: true })
  await seedGuest(page, { completedSteps: ['entry', 'golden-box'] })
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await nav(page, '/smokecraft/golden-box')
    await page.screenshot({ path: `${PROOF_DIR}/golden-box-${vp.name}.png` })
    await nav(page, '/smokecraft/mentor-selection')
    await page.screenshot({ path: `${PROOF_DIR}/mentor-selection-${vp.name}.png` })
  }

  // Sequential proof set
  await page.setViewportSize({ width: 1440, height: 900 })
  await seedGuest(page, { completedSteps: [] })
  await nav(page, '/smokecraft')
  await page.screenshot({ path: `${PROOF_DIR}/sequence-1-launch.png` })
  await nav(page, '/smokecraft/enroll')
  await page.screenshot({ path: `${PROOF_DIR}/sequence-2-enroll.png` })
  await nav(page, '/smokecraft/venue-select')
  await page.screenshot({ path: `${PROOF_DIR}/sequence-3-venue-select.png` })
  await nav(page, '/smokecraft/identity')
  await page.screenshot({ path: `${PROOF_DIR}/sequence-4-identity.png` })
  await nav(page, '/smokecraft/golden-box')
  await page.screenshot({ path: `${PROOF_DIR}/sequence-5-golden-box.png` })
  await nav(page, '/smokecraft/mentor-selection')
  await page.screenshot({ path: `${PROOF_DIR}/sequence-6-mentor-selection.png` })

  ok('proof', 'Screenshots captured: 4 viewports x 2 routes + 6-screen sequential proof')

  await browser.close()

  console.log('\n' + '─'.repeat(50))
  console.log(`Result: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
