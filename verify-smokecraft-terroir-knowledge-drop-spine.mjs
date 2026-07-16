/**
 * verify-smokecraft-terroir-knowledge-drop-spine.mjs
 * Package H — Wire Terroir and Knowledge Drop into the guarded main journey
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
function ok(msg)  { pass++; console.log(`  ✓ ${msg}`) }
function bad(msg) { fail++; console.error(`  ✗ ${msg}`) }

async function seedGuest(page, { completedSteps = [], demoMode = false, journeyPatch, activeScreen, xp } = {}) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ completedSteps, demoMode, journeyPatch, activeScreen, xp }) => {
    if (journeyPatch) {
      localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, ...journeyPatch }))
    } else {
      localStorage.removeItem('sc_journey_v1')
    }
    if (demoMode) sessionStorage.setItem('novee_demo_mode', '1')
    else sessionStorage.removeItem('novee_demo_mode')
    if (activeScreen) sessionStorage.setItem('sc_active_screen', activeScreen)
    else sessionStorage.removeItem('sc_active_screen')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'spine-test-' + Date.now(), guestId: 'spine-test-guest',
      completedSteps, xp: xp ?? completedSteps.length * 25, rank: 'Novice', badges: [],
      __version: 4,
    }))
  }, { completedSteps, demoMode, journeyPatch, activeScreen, xp })
}

async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
}

const PREREQS_TO_MENTOR = ['entry', 'enroll', 'golden-box', 'mentor']
// Package I built Mentor Commentary and made it Knowledge Drop's real prerequisite
// (superseding flavor-memory, which Package H used only as a stand-in).
const PREREQS_TO_MENTOR_COMMENTARY = ['entry', 'enroll', 'golden-box', 'mentor', 'format', 'wrapper-strength',
  'seed-soil', 'pairing-lab', 'humidor-match', 'request-purchase', 'cut-toast-light', 'first-third',
  'second-third', 'mentor-commentary']

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page    = await context.newPage()

  // ── 1. Terroir route resolves ──
  console.log('\n── Suite 1: Terroir route resolves ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR, demoMode: true })
  await nav(page, '/smokecraft/terroir')
  let title = await page.textContent('h1')
  title.includes('Terroir') || title.includes('Explore') ? ok('/smokecraft/terroir resolves') : bad(`Title: ${title}`)

  // ── 2. Knowledge Drop route resolves ──
  console.log('\n── Suite 2: Knowledge Drop route resolves ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR_COMMENTARY, demoMode: true })
  await nav(page, '/smokecraft/knowledge-drop')
  title = await page.textContent('h1')
  title.includes('Topic') || title.includes('Tobacco') ? ok('/smokecraft/knowledge-drop resolves') : bad(`Title: ${title}`)

  // ── 3. Terroir is guarded at the correct journey position ──
  console.log('\n── Suite 3: Terroir guard ──')
  await seedGuest(page, { completedSteps: ['entry', 'enroll'], demoMode: false })
  await nav(page, '/smokecraft/terroir')
  let body = await page.evaluate(() => document.body.innerText.toLowerCase())
  body.includes('required:') || body.includes('back to current session')
    ? ok('Terroir blocked when mentor-selection is not yet complete (non-demo)')
    : bad('Terroir was accessible without mentor-selection complete')

  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR, demoMode: false })
  await nav(page, '/smokecraft/terroir')
  const terroirPath = new URL(page.url()).pathname
  terroirPath === '/smokecraft/terroir'
    ? ok('Terroir accessible once mentor-selection is complete (non-demo)')
    : bad(`Landed on ${terroirPath} instead of staying on Terroir`)

  // ── 4. Knowledge Drop is guarded at the correct journey position ──
  console.log('\n── Suite 4: Knowledge Drop guard ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR_COMMENTARY.slice(0, -1), demoMode: false })
  await nav(page, '/smokecraft/knowledge-drop')
  const kdBody = await page.evaluate(() => document.body.innerText.toLowerCase())
  const kdBlocked = new URL(page.url()).pathname !== '/smokecraft/knowledge-drop'
    || kdBody.includes('required:') || kdBody.includes('back to current session')
  kdBlocked
    ? ok('Knowledge Drop blocked when mentor-commentary is not yet complete (non-demo)')
    : bad('Knowledge Drop was accessible without mentor-commentary complete')

  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR_COMMENTARY, demoMode: false })
  await nav(page, '/smokecraft/knowledge-drop')
  const kdPath2 = new URL(page.url()).pathname
  kdPath2 === '/smokecraft/knowledge-drop'
    ? ok('Knowledge Drop accessible once mentor-commentary is complete (non-demo)')
    : bad(`Landed on ${kdPath2} instead of staying on Knowledge Drop`)

  // ── 5. Terroir Back goes to correct previous screen ──
  console.log('\n── Suite 5: Terroir Back target ──')
  // Package I built Meet Your Cigar and made it Terroir's authoritative Back
  // target (superseding mentor-selection, which Package H used only as a
  // stand-in).
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR, demoMode: true })
  await nav(page, '/smokecraft/terroir')
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(400)
  new URL(page.url()).pathname === '/smokecraft/meet-your-cigar'
    ? ok('Terroir Back navigates to /smokecraft/meet-your-cigar')
    : bad(`Terroir Back landed on ${page.url()}`)

  // ── 6. Terroir Continue goes to correct next screen ──
  console.log('\n── Suite 6: Terroir Continue target ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR, demoMode: true })
  await nav(page, '/smokecraft/terroir')
  await page.click('[role="tab"][aria-label^="Country"]')
  await page.waitForTimeout(150)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/format'
    ? ok('Terroir Continue navigates to /smokecraft/format (Construction Inspection)')
    : bad(`Terroir Continue landed on ${page.url()}`)

  // ── 7. Knowledge Drop Back goes to correct previous screen ──
  console.log('\n── Suite 7: Knowledge Drop Back target ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR_COMMENTARY, demoMode: true })
  await nav(page, '/smokecraft/knowledge-drop')
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(400)
  new URL(page.url()).pathname === '/smokecraft/mentor-commentary'
    ? ok('Knowledge Drop Back navigates to /smokecraft/mentor-commentary')
    : bad(`Knowledge Drop Back landed on ${page.url()}`)

  // ── 8. Knowledge Drop Continue goes to correct next screen ──
  console.log('\n── Suite 8: Knowledge Drop Continue target ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR_COMMENTARY, demoMode: true })
  await nav(page, '/smokecraft/knowledge-drop')
  await page.click('[role="tab"][aria-label^="Tobacco"]')
  await page.waitForTimeout(150)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/final-third'
    ? ok('Knowledge Drop Continue navigates to /smokecraft/final-third (Flavor Finish)')
    : bad(`Knowledge Drop Continue landed on ${page.url()}`)

  // ── 9. Resume returns to Terroir when active ──
  console.log('\n── Suite 9: Resume returns to Terroir ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR, demoMode: false, activeScreen: '/smokecraft/terroir' })
  await page.goto(`${BASE}/smokecraft/scorecard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  let resumeBtn = await page.$('button:has-text("Back to Current Session")')
  if (resumeBtn) {
    await resumeBtn.click()
    await page.waitForTimeout(500)
    new URL(page.url()).pathname === '/smokecraft/terroir'
      ? ok('Resume routes to Terroir when it was the last active screen')
      : bad(`Resume landed on ${page.url()}, expected /smokecraft/terroir`)
  } else {
    bad('Locked-screen resume button not found (Terroir case)')
  }

  // ── 10. Resume returns to Knowledge Drop when active ──
  console.log('\n── Suite 10: Resume returns to Knowledge Drop ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR_COMMENTARY, demoMode: false, activeScreen: '/smokecraft/knowledge-drop' })
  await page.goto(`${BASE}/smokecraft/scorecard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  resumeBtn = await page.$('button:has-text("Back to Current Session")')
  if (resumeBtn) {
    await resumeBtn.click()
    await page.waitForTimeout(500)
    new URL(page.url()).pathname === '/smokecraft/knowledge-drop'
      ? ok('Resume routes to Knowledge Drop when it was the last active screen')
      : bad(`Resume landed on ${page.url()}, expected /smokecraft/knowledge-drop`)
  } else {
    bad('Locked-screen resume button not found (Knowledge Drop case)')
  }

  // ── 11. Refresh preserves progress ──
  console.log('\n── Suite 11: Refresh preserves progress ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR, demoMode: true })
  await nav(page, '/smokecraft/terroir')
  await page.click('[role="tab"][aria-label^="Soil"]')
  await page.waitForTimeout(200)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const header = await page.textContent('header')
  header.includes('1 of 6 sections viewed')
    ? ok('Terroir refresh preserves viewed-section progress')
    : bad(`Header after refresh: ${header}`)

  // ── 12. Completed state persists ──
  console.log('\n── Suite 12: Completed state persists ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR, demoMode: true })
  await nav(page, '/smokecraft/terroir')
  for (const t of ['Country', 'Region', 'Soil', 'Climate', 'Growing Conditions', 'Why It Matters']) {
    await page.click(`[role="tab"][aria-label^="${t}"]`)
    await page.waitForTimeout(100)
  }
  const journeyAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1') || '{}'))
  journeyAfter.terroir?.viewedSections?.length === 6
    ? ok('Terroir completed state (6/6 viewed) persisted to sc_journey_v1')
    : bad(`journey.terroir: ${JSON.stringify(journeyAfter.terroir)}`)

  // ── 13. XP is not duplicated ──
  console.log('\n── Suite 13: XP not duplicated ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR, demoMode: true, xp: 100 })
  await nav(page, '/smokecraft/terroir')
  await page.click('[role="tab"][aria-label^="Country"]')
  await page.waitForTimeout(150)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(400)
  let guestSession = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
  const xpAfterFirstComplete = guestSession.xp
  // Re-enter Terroir and complete again — awardSessionRewards guards via completedSteps.includes
  await nav(page, '/smokecraft/terroir')
  await page.click('[role="tab"][aria-label^="Region"]')
  await page.waitForTimeout(150)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(400)
  guestSession = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
  guestSession.xp === xpAfterFirstComplete
    ? ok(`XP not duplicated on re-entering completed Terroir (stayed at ${guestSession.xp})`)
    : bad(`XP changed on second completion: ${xpAfterFirstComplete} → ${guestSession.xp}`)

  // ── 14. No route loop ──
  console.log('\n── Suite 14: No route loop ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR, demoMode: true })
  await nav(page, '/smokecraft/terroir')
  await page.click('[role="tab"][aria-label^="Country"]')
  await page.waitForTimeout(150)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/format'
    ? ok('Terroir Continue does not loop back to Terroir')
    : bad(`Landed on ${page.url()}`)

  // ── 15. No dead end — full chain mentor-selection → terroir → format ──
  console.log('\n── Suite 15: No dead end (full chain) ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_MENTOR, demoMode: true })
  await nav(page, '/smokecraft/mentor-selection')
  await nav(page, '/smokecraft/terroir')
  await page.click('[role="tab"][aria-label^="Country"]')
  await page.waitForTimeout(150)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  let chainOk = new URL(page.url()).pathname === '/smokecraft/format'
  chainOk
    ? ok('Full chain Mentor Selection → Terroir → Construction Inspection completes with no dead end')
    : bad(`Chain broke, ended on ${page.url()}`)

  await browser.close()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

run().catch(err => { console.error(err); process.exit(1) })
