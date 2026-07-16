/**
 * verify-smokecraft-meet-your-cigar-mentor-commentary.mjs
 * Package I — Meet Your Cigar + Mentor Commentary
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
      sessionId: 'myc-test-' + Date.now(), guestId: 'myc-test-guest',
      completedSteps, xp: xp ?? completedSteps.length * 25, rank: 'Novice', badges: [],
      __version: 4,
    }))
  }, { completedSteps, demoMode, journeyPatch, activeScreen, xp })
}

async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
}

async function checkNoHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
}

const PREREQS_TO_HUMIDOR = ['entry', 'enroll', 'golden-box', 'mentor', 'format', 'wrapper-strength', 'seed-soil', 'pairing-lab', 'humidor-match']
const PREREQS_TO_SECOND_THIRD = [...PREREQS_TO_HUMIDOR, 'request-purchase', 'cut-toast-light', 'first-third', 'second-third']
const CIGAR_JOURNEY = { selectedCigar: { name: 'Oliva Serie V', origin: 'Nicaragua', wrapper: 'Habano Maduro', strength: 'Full', body: 'Full', tastingProfile: 'Dark chocolate, leather, espresso' } }
const MENTOR_JOURNEY = { mentor: [{ id: 'javier', name: 'Javier Estelí', origin: 'Nicaragua', expertise: 'Bold ligero & volcanic soil' }] }

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page    = await context.newPage()

  // ── 1. Meet Your Cigar route resolves ──
  console.log('\n── Suite 1: Meet Your Cigar route resolves ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_HUMIDOR, demoMode: true, journeyPatch: CIGAR_JOURNEY })
  await nav(page, '/smokecraft/meet-your-cigar')
  let title = await page.textContent('h1')
  title.includes('Oliva') ? ok('/smokecraft/meet-your-cigar resolves and shows selected cigar name') : bad(`Title: ${title}`)

  // ── 2. Mentor Commentary route resolves ──
  console.log('\n── Suite 2: Mentor Commentary route resolves ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SECOND_THIRD, demoMode: true, journeyPatch: MENTOR_JOURNEY })
  await nav(page, '/smokecraft/mentor-commentary')
  title = await page.textContent('h1')
  title.includes('Javier') ? ok('/smokecraft/mentor-commentary resolves and shows selected mentor name') : bad(`Title: ${title}`)

  // ── 3. Correct guards applied ──
  console.log('\n── Suite 3: Guards ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_HUMIDOR.slice(0, -1), demoMode: false })
  await nav(page, '/smokecraft/meet-your-cigar')
  let body = await page.evaluate(() => document.body.innerText.toLowerCase())
  const guard1Blocked = new URL(page.url()).pathname !== '/smokecraft/meet-your-cigar'
    || body.includes('required:') || body.includes('back to current session')
  guard1Blocked
    ? ok('Meet Your Cigar blocked when humidor-match is not yet complete (non-demo)')
    : bad('Meet Your Cigar was accessible without humidor-match complete')

  await seedGuest(page, { completedSteps: PREREQS_TO_SECOND_THIRD.slice(0, -1), demoMode: false })
  await nav(page, '/smokecraft/mentor-commentary')
  body = await page.evaluate(() => document.body.innerText.toLowerCase())
  const guard2Blocked = new URL(page.url()).pathname !== '/smokecraft/mentor-commentary'
    || body.includes('required:') || body.includes('back to current session')
  guard2Blocked
    ? ok('Mentor Commentary blocked when second-third is not yet complete (non-demo)')
    : bad('Mentor Commentary was accessible without second-third complete')

  // ── 4. Meet Your Cigar loads selected cigar data ──
  console.log('\n── Suite 4: Meet Your Cigar loads cigar data ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_HUMIDOR, demoMode: true, journeyPatch: CIGAR_JOURNEY })
  await nav(page, '/smokecraft/meet-your-cigar')
  await page.click('[role="tab"][aria-label^="Brand"]')
  await page.waitForTimeout(150)
  body = await page.evaluate(() => document.body.innerText)
  body.includes('Oliva') ? ok('Meet Your Cigar Brand section shows real selected-cigar data') : bad('Brand section did not show cigar data')

  // ── 5. All required cigar sections display ──
  console.log('\n── Suite 5: All cigar sections present ──')
  const cigarSections = ['Brand', 'Blend', 'Wrapper', 'Binder', 'Filler', 'Factory', 'Master Blender']
  let allPresent = true
  for (const s of cigarSections) {
    const btn = await page.$(`[role="tab"][aria-label^="${s}"]`)
    if (!btn) { allPresent = false; break }
  }
  allPresent ? ok('All 7 required Meet Your Cigar sections present') : bad('A required cigar section is missing')

  // ── 6. Missing cigar data uses honest fallback ──
  console.log('\n── Suite 6: Honest fallback for missing cigar data ──')
  await page.click('[role="tab"][aria-label^="Binder"]')
  await page.waitForTimeout(150)
  body = await page.evaluate(() => document.body.innerText)
  body.includes('Not available for this cigar')
    ? ok('Binder section shows honest fallback (no fabricated data)')
    : bad('Binder section did not show honest fallback')

  // ── 7. Meet Your Cigar Back is correct ──
  console.log('\n── Suite 7: Meet Your Cigar Back target ──')
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(400)
  new URL(page.url()).pathname === '/smokecraft/humidor-match'
    ? ok('Meet Your Cigar Back navigates to /smokecraft/humidor-match (Choose Your Cigar)')
    : bad(`Back landed on ${page.url()}`)

  // ── 8. Meet Your Cigar Continue goes to Terroir ──
  console.log('\n── Suite 8: Meet Your Cigar Continue target ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_HUMIDOR, demoMode: true, journeyPatch: CIGAR_JOURNEY })
  await nav(page, '/smokecraft/meet-your-cigar')
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/terroir'
    ? ok('Meet Your Cigar Continue navigates to /smokecraft/terroir')
    : bad(`Continue landed on ${page.url()}`)

  // ── 9. Terroir Back returns to Meet Your Cigar ──
  console.log('\n── Suite 9: Terroir Back returns to Meet Your Cigar ──')
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(400)
  new URL(page.url()).pathname === '/smokecraft/meet-your-cigar'
    ? ok('Terroir Back navigates to /smokecraft/meet-your-cigar')
    : bad(`Terroir Back landed on ${page.url()}`)

  // ── 10. Mentor Commentary loads selected mentor data ──
  console.log('\n── Suite 10: Mentor Commentary loads mentor data ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SECOND_THIRD, demoMode: true, journeyPatch: MENTOR_JOURNEY })
  await nav(page, '/smokecraft/mentor-commentary')
  body = await page.evaluate(() => document.body.innerText)
  body.includes('Javier Estelí') && body.includes('Nicaragua') && body.includes('Bold ligero')
    ? ok('Mentor Commentary shows real selected-mentor data (name, origin, expertise)')
    : bad('Mentor Commentary did not show real mentor data')

  // ── 11. Mentor portrait changes with mentor selection ──
  console.log('\n── Suite 11: Mentor portrait changes with selection ──')
  const initialInitial = await page.evaluate(() => document.querySelector('[aria-label$="portrait"]')?.textContent?.trim().charAt(0))
  await seedGuest(page, { completedSteps: PREREQS_TO_SECOND_THIRD, demoMode: true, journeyPatch: { mentor: [{ id: 'rafael', name: 'Maestro Rafael', origin: 'Cuba', expertise: 'Classic Vuelta Abajo traditions' }] } })
  await nav(page, '/smokecraft/mentor-commentary')
  const secondInitial = await page.evaluate(() => document.querySelector('[aria-label$="portrait"]')?.textContent?.trim().charAt(0))
  initialInitial !== secondInitial
    ? ok(`Mentor portrait avatar changes with selection (${initialInitial} → ${secondInitial})`)
    : bad('Mentor portrait did not change with a different mentor selection')

  // ── 12. Missing mentor data uses honest fallback ──
  console.log('\n── Suite 12: Honest fallback for missing mentor ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SECOND_THIRD, demoMode: true })
  await nav(page, '/smokecraft/mentor-commentary')
  body = await page.evaluate(() => document.body.innerText)
  body.includes('No mentor has been selected yet')
    ? ok('Mentor Commentary shows honest empty-state fallback when no mentor selected')
    : bad('No honest fallback shown for missing mentor')

  // ── 13. Commentary not falsely labeled as AI ──
  console.log('\n── Suite 13: Commentary honestly labeled (not AI) ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SECOND_THIRD, demoMode: true, journeyPatch: MENTOR_JOURNEY })
  await nav(page, '/smokecraft/mentor-commentary')
  body = await page.evaluate(() => document.body.innerText.toLowerCase())
  body.includes('not ai-generated') || body.includes('curated mentor notes')
    ? ok('Commentary explicitly labeled as curated, not AI')
    : bad('Commentary was not honestly labeled')
  body.includes('coming soon')
    ? ok('Ask Mentor control honestly labeled as a future-AI placeholder')
    : bad('Ask Mentor control missing honest future-state label')

  // ── 14. Mentor Commentary Back is correct ──
  console.log('\n── Suite 14: Mentor Commentary Back target ──')
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(400)
  new URL(page.url()).pathname === '/smokecraft/second-third'
    ? ok('Mentor Commentary Back navigates to /smokecraft/second-third')
    : bad(`Back landed on ${page.url()}`)

  // ── 15. Mentor Commentary Continue goes to Knowledge Drop ──
  console.log('\n── Suite 15: Mentor Commentary Continue target ──')
  await nav(page, '/smokecraft/mentor-commentary')
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/knowledge-drop'
    ? ok('Mentor Commentary Continue navigates to /smokecraft/knowledge-drop')
    : bad(`Continue landed on ${page.url()}`)

  // ── 16. Knowledge Drop Back returns to Mentor Commentary ──
  console.log('\n── Suite 16: Knowledge Drop Back returns to Mentor Commentary ──')
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(400)
  new URL(page.url()).pathname === '/smokecraft/mentor-commentary'
    ? ok('Knowledge Drop Back navigates to /smokecraft/mentor-commentary')
    : bad(`Knowledge Drop Back landed on ${page.url()}`)

  // ── 17. Completion persists ──
  console.log('\n── Suite 17: Completion persists ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_HUMIDOR, demoMode: true, journeyPatch: CIGAR_JOURNEY })
  await nav(page, '/smokecraft/meet-your-cigar')
  for (const s of ['Brand', 'Blend', 'Wrapper', 'Binder', 'Filler', 'Factory', 'Master Blender']) {
    await page.click(`[role="tab"][aria-label^="${s}"]`)
    await page.waitForTimeout(80)
  }
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(400)
  const journeyAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1') || '{}'))
  journeyAfter.meetYourCigar?.completedAt && journeyAfter.meetYourCigar?.viewedSections?.length === 7
    ? ok('Meet Your Cigar completion (7/7 sections + completedAt) persisted to sc_journey_v1')
    : bad(`journey.meetYourCigar: ${JSON.stringify(journeyAfter.meetYourCigar)}`)

  // ── 18. Refresh restores state ──
  console.log('\n── Suite 18: Refresh restores state ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_HUMIDOR, demoMode: true, journeyPatch: CIGAR_JOURNEY })
  await nav(page, '/smokecraft/meet-your-cigar')
  await page.click('[role="tab"][aria-label^="Wrapper"]')
  await page.waitForTimeout(200)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const header = await page.textContent('header')
  header.includes('1 of 7 sections viewed')
    ? ok('Meet Your Cigar refresh preserves viewed-section progress')
    : bad(`Header after refresh: ${header}`)

  // ── 19. Resume returns to either screen when active ──
  console.log('\n── Suite 19: Resume returns to Meet Your Cigar / Mentor Commentary ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_HUMIDOR, demoMode: false, activeScreen: '/smokecraft/meet-your-cigar' })
  await page.goto(`${BASE}/smokecraft/scorecard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  let resumeBtn = await page.$('button:has-text("Back to Current Session")')
  if (resumeBtn) {
    await resumeBtn.click()
    await page.waitForTimeout(500)
    new URL(page.url()).pathname === '/smokecraft/meet-your-cigar'
      ? ok('Resume routes to Meet Your Cigar when it was the last active screen')
      : bad(`Resume landed on ${page.url()}`)
  } else {
    bad('Locked-screen resume button not found (Meet Your Cigar case)')
  }

  await seedGuest(page, { completedSteps: PREREQS_TO_SECOND_THIRD, demoMode: false, activeScreen: '/smokecraft/mentor-commentary' })
  await page.goto(`${BASE}/smokecraft/scorecard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  resumeBtn = await page.$('button:has-text("Back to Current Session")')
  if (resumeBtn) {
    await resumeBtn.click()
    await page.waitForTimeout(500)
    new URL(page.url()).pathname === '/smokecraft/mentor-commentary'
      ? ok('Resume routes to Mentor Commentary when it was the last active screen')
      : bad(`Resume landed on ${page.url()}`)
  } else {
    bad('Locked-screen resume button not found (Mentor Commentary case)')
  }

  // ── 20. XP not duplicated ──
  console.log('\n── Suite 20: XP not duplicated ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_HUMIDOR, demoMode: true, journeyPatch: CIGAR_JOURNEY, xp: 100 })
  await nav(page, '/smokecraft/meet-your-cigar')
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(400)
  let guestSession = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
  const xpAfterFirst = guestSession.xp
  await nav(page, '/smokecraft/meet-your-cigar')
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(400)
  guestSession = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
  guestSession.xp === xpAfterFirst
    ? ok(`XP not duplicated on re-entering completed Meet Your Cigar (stayed at ${guestSession.xp})`)
    : bad(`XP changed on second completion: ${xpAfterFirst} → ${guestSession.xp}`)

  // ── 21. No route loop ──
  console.log('\n── Suite 21: No route loop ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SECOND_THIRD, demoMode: true, journeyPatch: MENTOR_JOURNEY })
  await nav(page, '/smokecraft/mentor-commentary')
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/knowledge-drop'
    ? ok('Mentor Commentary Continue does not loop back to itself')
    : bad(`Landed on ${page.url()}`)

  // ── 22. No dead end — full chain ──
  console.log('\n── Suite 22: No dead end (full chain) ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SECOND_THIRD, demoMode: true, journeyPatch: MENTOR_JOURNEY })
  await nav(page, '/smokecraft/second-third')
  await nav(page, '/smokecraft/mentor-commentary')
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  let chainOk = new URL(page.url()).pathname === '/smokecraft/knowledge-drop'
  chainOk
    ? ok('Full chain Second Third → Mentor Commentary → Knowledge Drop completes with no dead end')
    : bad(`Chain broke, ended on ${page.url()}`)

  // ── 23. No horizontal overflow ──
  console.log('\n── Suite 23: No horizontal overflow ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_HUMIDOR, demoMode: true, journeyPatch: CIGAR_JOURNEY })
  await nav(page, '/smokecraft/meet-your-cigar')
  const overflow1 = await checkNoHorizontalOverflow(page)
  overflow1 ? ok('Meet Your Cigar has no horizontal overflow (desktop)') : bad('Meet Your Cigar has horizontal overflow')
  await seedGuest(page, { completedSteps: PREREQS_TO_SECOND_THIRD, demoMode: true, journeyPatch: MENTOR_JOURNEY })
  await nav(page, '/smokecraft/mentor-commentary')
  const overflow2 = await checkNoHorizontalOverflow(page)
  overflow2 ? ok('Mentor Commentary has no horizontal overflow (desktop)') : bad('Mentor Commentary has horizontal overflow')

  // ── 24. Tablet and mobile layout work ──
  console.log('\n── Suite 24: Tablet and mobile layout ──')
  const tabletPage = await context.newPage()
  await tabletPage.setViewportSize({ width: 768, height: 1024 })
  await tabletPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await tabletPage.evaluate(({ journeyPatch, completedSteps }) => {
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, ...journeyPatch }))
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'x', guestId: 'y', completedSteps, xp: 0, rank: 'Novice', badges: [], __version: 4 }))
  }, { journeyPatch: CIGAR_JOURNEY, completedSteps: PREREQS_TO_HUMIDOR })
  await tabletPage.goto(`${BASE}/smokecraft/meet-your-cigar`, { waitUntil: 'domcontentloaded' })
  await tabletPage.waitForTimeout(500)
  const tabletOverflow = await checkNoHorizontalOverflow(tabletPage)
  const tabletNav = await tabletPage.$('div[role="navigation"]')
  ;(tabletOverflow && tabletNav) ? ok('Meet Your Cigar renders correctly at tablet viewport (768x1024)') : bad('Meet Your Cigar tablet layout issue')

  const mobilePage = await context.newPage()
  await mobilePage.setViewportSize({ width: 390, height: 844 })
  await mobilePage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await mobilePage.evaluate(({ journeyPatch, completedSteps }) => {
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, ...journeyPatch }))
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'x', guestId: 'y', completedSteps, xp: 0, rank: 'Novice', badges: [], __version: 4 }))
  }, { journeyPatch: MENTOR_JOURNEY, completedSteps: PREREQS_TO_SECOND_THIRD })
  await mobilePage.goto(`${BASE}/smokecraft/mentor-commentary`, { waitUntil: 'domcontentloaded' })
  await mobilePage.waitForTimeout(500)
  const mobileOverflow = await checkNoHorizontalOverflow(mobilePage)
  const mobileNav = await mobilePage.$('div[role="navigation"]')
  ;(mobileOverflow && mobileNav) ? ok('Mentor Commentary renders correctly at mobile viewport (390x844)') : bad('Mentor Commentary mobile layout issue')
  await tabletPage.close()
  await mobilePage.close()

  // ── 25. Accessibility labels exist ──
  console.log('\n── Suite 25: Accessibility labels ──')
  await nav(page, '/smokecraft/meet-your-cigar')
  const mycTablist = await page.$('[role="tablist"][aria-label="Meet Your Cigar sections"]')
  mycTablist ? ok('Meet Your Cigar section selector has aria-label') : bad('Meet Your Cigar tablist aria-label missing')
  const portraitLabel = await page.$('[aria-label$="portrait"]')
  // portrait only exists on mentor commentary; check there instead
  await nav(page, '/smokecraft/mentor-commentary')
  const mentorPortrait = await page.$('[aria-label$="portrait"]')
  mentorPortrait ? ok('Mentor Commentary portrait zone has aria-label') : bad('Mentor Commentary portrait aria-label missing')

  await browser.close()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

run().catch(err => { console.error(err); process.exit(1) })
