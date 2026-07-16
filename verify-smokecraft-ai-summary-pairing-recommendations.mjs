/**
 * verify-smokecraft-ai-summary-pairing-recommendations.mjs
 * Package K — S21 AI Summary + S22 Personalized Pairing Recommendations
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
      sessionId: 'k-test-' + Date.now(), guestId: 'k-test-guest',
      completedSteps, xp: xp ?? completedSteps.length * 25, rank: 'Novice', badges: [],
      __version: 4,
    }))
  }, { completedSteps, demoMode, journeyPatch, activeScreen, xp })
}

async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
}

async function checkNoHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
}

const PREREQS_TO_SCORECARD = [
  'entry', 'enroll', 'golden-box', 'mentor', 'format', 'wrapper-strength', 'seed-soil',
  'humidor-match', 'meet-your-cigar', 'terroir', 'request-purchase', 'cut-toast-light',
  'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third',
  'mentor-commentary', 'knowledge-drop', 'final-third', 'scorecard',
]
const PREREQS_TO_AI_SUMMARY = [...PREREQS_TO_SCORECARD, 'ai-summary']

const FULL_JOURNEY = {
  selectedCigar: { name: 'Oliva Serie V', origin: 'Nicaragua', wrapper: 'Habano Maduro', strength: 'Full', body: 'Full', tastingProfile: 'Dark chocolate, leather, espresso' },
  mentor: [{ id: 'javier', name: 'Javier Estelí', origin: 'Nicaragua', expertise: 'Bold ligero & volcanic soil' }],
  format: { id: 'robusto', label: 'Robusto 5x50' },
  cutToastLight: { cut: 'Straight Cut', toast: 'Even toast', light: 'Slow rotation light' },
  firstThird: { notesSelected: ['Smoky', 'Bold'], notesCount: 2 },
  secondThird: { notesSelected: ['Rich'], notesCount: 1 },
  finalThird: { notesSelected: ['Smoky'], focusSelected: ['aroma-strength'], notesCount: 1 },
  flavorMemory: { selectedFlavors: ['Smoky', 'Bold', 'Rich'] },
  pairing: { primary: 'Whiskey', selections: ['Whiskey'], recommendation: 'Whiskey', compatScore: 88, flavorNotes: ['Smoky', 'Bold', 'Rich'], strength: 'Full', pairingGoal: 'Complement' },
  mentorCommentary: { viewedSections: ['portrait', 'commentary', 'construction', 'flavor', 'action'] },
  knowledgeDrop: { viewedTopics: ['tobacco', 'fermentation'] },
  scorecard: { categories: { appearance: 4, construction: 3, draw: 5, burn: 4, flavor: 5, pairing: 4 }, personalNotes: 'Great session overall.', meta: { durationMinutes: 55 } },
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page    = await context.newPage()

  // ── 1/2. Routes resolve ──
  console.log('\n── Suite 1-2: Routes resolve ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SCORECARD, demoMode: true, journeyPatch: FULL_JOURNEY })
  await nav(page, '/smokecraft/ai-summary')
  let h1 = await page.textContent('h1')
  h1.includes('Session Summary') ? ok('/smokecraft/ai-summary resolves') : bad(`h1: ${h1}`)

  await seedGuest(page, { completedSteps: PREREQS_TO_AI_SUMMARY, demoMode: true, journeyPatch: FULL_JOURNEY })
  await nav(page, '/smokecraft/pairing-recommendations')
  h1 = await page.textContent('h1')
  h1.includes('Pairing Recommendation') ? ok('/smokecraft/pairing-recommendations resolves') : bad(`h1: ${h1}`)

  // ── 3/4. Guards ──
  console.log('\n── Suite 3-4: Guards ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SCORECARD.slice(0, -1), demoMode: false })
  await nav(page, '/smokecraft/ai-summary')
  let body = await page.evaluate(() => document.body.innerText.toLowerCase())
  let blocked = new URL(page.url()).pathname !== '/smokecraft/ai-summary' || body.includes('required:') || body.includes('back to current session')
  blocked ? ok('S21 AI Summary guard blocks when scorecard not complete') : bad('S21 accessible without scorecard complete')

  await seedGuest(page, { completedSteps: PREREQS_TO_AI_SUMMARY.slice(0, -1), demoMode: false })
  await nav(page, '/smokecraft/pairing-recommendations')
  body = await page.evaluate(() => document.body.innerText.toLowerCase())
  blocked = new URL(page.url()).pathname !== '/smokecraft/pairing-recommendations' || body.includes('required:') || body.includes('back to current session')
  blocked ? ok('S22 Pairing Recommendations guard blocks when ai-summary not complete') : bad('S22 accessible without ai-summary complete')

  // ── 5. AI Summary loads canonical journey data ──
  console.log('\n── Suite 5: AI Summary loads canonical data ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SCORECARD, demoMode: true, journeyPatch: FULL_JOURNEY })
  await nav(page, '/smokecraft/ai-summary')
  await page.waitForTimeout(400)
  body = await page.evaluate(() => document.body.innerText)
  body.includes('Oliva Serie V') && body.includes('Javier') ? ok('AI Summary shows real cigar + mentor data') : bad('AI Summary missing expected journey data')

  // ── 6. Data incomplete handled honestly ──
  console.log('\n── Suite 6: Data incomplete ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SCORECARD, demoMode: true, journeyPatch: { stateVersion: 3 } })
  await nav(page, '/smokecraft/ai-summary')
  await page.waitForTimeout(400)
  body = await page.evaluate(() => document.body.innerText.toLowerCase())
  body.includes('not enough journey data') ? ok('AI Summary shows honest data-incomplete state') : bad('No honest incomplete state shown')

  // ── 7. No false AI claims ──
  console.log('\n── Suite 7: No false AI claims ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SCORECARD, demoMode: true, journeyPatch: FULL_JOURNEY })
  await nav(page, '/smokecraft/ai-summary')
  await page.waitForTimeout(400)
  body = await page.evaluate(() => document.body.innerText.toLowerCase())
  ;(body.includes('not ai-generated') && !body.includes('live ai analysis'))
    ? ok('AI Summary honestly labeled as rule-based, not falsely claiming live AI')
    : bad('AI Summary label missing or misleading')

  // ── 8. AI Summary result persists ──
  console.log('\n── Suite 8: AI Summary persists ──')
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  let journeyAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1') || '{}'))
  journeyAfter.aiSummary?.result?.sessionOverview ? ok('AI Summary result persisted to sc_journey_v1.aiSummary') : bad('aiSummary not persisted')

  // ── 9. Refresh restores same result ──
  console.log('\n── Suite 9: Refresh restores same result ──')
  await nav(page, '/smokecraft/ai-summary')
  await page.waitForTimeout(400)
  const firstOverview = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1') || '{}').aiSummary?.result?.sessionOverview)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const secondOverview = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1') || '{}').aiSummary?.result?.sessionOverview)
  firstOverview === secondOverview ? ok('AI Summary refresh restores identical result') : bad('Refresh produced a different result')

  // ── 10/11. Back / Continue ──
  console.log('\n── Suite 10-11: AI Summary Back/Continue ──')
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(400)
  new URL(page.url()).pathname === '/smokecraft/scorecard' ? ok('AI Summary Back navigates to /smokecraft/scorecard') : bad(`Back landed on ${page.url()}`)

  await nav(page, '/smokecraft/ai-summary')
  await page.waitForTimeout(400)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/pairing-recommendations' ? ok('AI Summary Continue navigates to /smokecraft/pairing-recommendations') : bad(`Continue landed on ${page.url()}`)

  // ── 12/13. Pairing engine reused, matches cigar/flavor data ──
  console.log('\n── Suite 12-13: Pairing engine reused + matches data ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_AI_SUMMARY, demoMode: true, journeyPatch: FULL_JOURNEY })
  await nav(page, '/smokecraft/pairing-recommendations')
  await page.waitForTimeout(400)
  body = await page.evaluate(() => document.body.innerText)
  body.includes('not ai-generated') || body.toLowerCase().includes('rule-based recommendation engine')
    ? ok('Pairing Recommendations honestly labeled as reusing the rule-based engine, not AI')
    : bad('Pairing Recommendations missing rule-based labeling')
  body.includes('Whiskey') ? ok('Pairing recommendation reflects prior Pairing Lab selection (Whiskey)') : bad('Recommendation did not reflect selected pairing type')

  // ── 14. Pairing image matches recommendation ──
  console.log('\n── Suite 14: Pairing image matches recommendation ──')
  const iconInitial = await page.evaluate(() => document.querySelector('main div[aria-hidden="true"]')?.textContent?.trim())
  iconInitial === 'W' ? ok('Pairing icon initial matches primary recommendation (Whiskey → W)') : bad(`Icon initial: ${iconInitial}`)

  // ── 15/16/17. Score, Why It Works, Possible Clashes live ──
  console.log('\n── Suite 15-17: Live score / why / clashes ──')
  const scoreText = await page.evaluate(() => document.querySelector('[aria-label^="Compatibility score"]')?.textContent)
  scoreText && /\d+/.test(scoreText) ? ok(`Compatibility score is live (${scoreText})`) : bad('Compatibility score missing/not live')
  const bodyLower = body.toLowerCase()
  bodyLower.includes('why it works') ? ok('Why It Works section present') : bad('Why It Works section missing')
  bodyLower.includes('possible clashes') ? ok('Possible Clashes section present') : bad('Possible Clashes section missing')

  // ── 18. Alternates display ──
  console.log('\n── Suite 18: Alternate recommendations ──')
  bodyLower.includes('alternate recommendations') ? ok('Alternate Recommendations section present') : bad('Alternates missing')

  // ── 19. Missing venue inventory honestly labeled ──
  console.log('\n── Suite 19: Venue inventory honest label ──')
  body.toLowerCase().includes('venue inventory data is not connected')
    ? ok('Venue inventory honestly labeled as unavailable (no fabrication)')
    : bad('Venue inventory not honestly labeled')

  // ── 20. Saved recommendation persists ──
  console.log('\n── Suite 20: Saved recommendation persists ──')
  await page.click('button:has-text("Save Recommendation")')
  await page.waitForTimeout(300)
  journeyAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1') || '{}'))
  journeyAfter.pairingRecommendations?.savedRecommendation?.savedAt
    ? ok('Saved recommendation persisted to sc_journey_v1.pairingRecommendations')
    : bad('Saved recommendation not persisted')

  // ── 21/22. Back / Continue ──
  console.log('\n── Suite 21-22: Pairing Recommendations Back/Continue ──')
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(400)
  new URL(page.url()).pathname === '/smokecraft/ai-summary' ? ok('Pairing Recommendations Back navigates to /smokecraft/ai-summary') : bad(`Back landed on ${page.url()}`)

  await nav(page, '/smokecraft/pairing-recommendations')
  await page.waitForTimeout(400)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/passport-stamp' ? ok('Pairing Recommendations Continue navigates to /smokecraft/passport-stamp') : bad(`Continue landed on ${page.url()}`)

  // ── 23/24. Resume returns to S21/S22 ──
  console.log('\n── Suite 23-24: Resume ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SCORECARD, demoMode: false })
  await page.goto(`${BASE}/smokecraft/session-complete`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  let resumeBtn = await page.$('button:has-text("Back to Current Session")')
  if (resumeBtn) {
    await resumeBtn.click()
    await page.waitForTimeout(500)
    new URL(page.url()).pathname === '/smokecraft/ai-summary' ? ok('Resume routes to AI Summary (S21) when it is the current session') : bad(`Resume landed on ${page.url()}`)
  } else bad('Resume button not found (S21 case)')

  await seedGuest(page, { completedSteps: PREREQS_TO_AI_SUMMARY, demoMode: false })
  await page.goto(`${BASE}/smokecraft/session-complete`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  resumeBtn = await page.$('button:has-text("Back to Current Session")')
  if (resumeBtn) {
    await resumeBtn.click()
    await page.waitForTimeout(500)
    new URL(page.url()).pathname === '/smokecraft/pairing-recommendations' ? ok('Resume routes to Pairing Recommendations (S22) when it is the current session') : bad(`Resume landed on ${page.url()}`)
  } else bad('Resume button not found (S22 case)')

  // ── 25. Refresh preserves both screens ──
  console.log('\n── Suite 25: Refresh preserves both screens ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SCORECARD, demoMode: true, journeyPatch: FULL_JOURNEY })
  await nav(page, '/smokecraft/ai-summary')
  await page.waitForTimeout(400)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  body = await page.evaluate(() => document.body.innerText.toLowerCase())
  body.includes('session overview') ? ok('AI Summary refresh preserves rendered content') : bad('AI Summary refresh lost content')

  await seedGuest(page, { completedSteps: PREREQS_TO_AI_SUMMARY, demoMode: true, journeyPatch: FULL_JOURNEY })
  await nav(page, '/smokecraft/pairing-recommendations')
  await page.waitForTimeout(400)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  body = await page.evaluate(() => document.body.innerText.toLowerCase())
  body.includes('primary recommendation') ? ok('Pairing Recommendations refresh preserves rendered content') : bad('Pairing Recommendations refresh lost content')

  // ── 26. XP not duplicated ──
  console.log('\n── Suite 26: XP not duplicated ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SCORECARD, demoMode: true, journeyPatch: FULL_JOURNEY, xp: 100 })
  await nav(page, '/smokecraft/ai-summary')
  await page.waitForTimeout(400)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(400)
  let gs = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
  const xpAfterFirst = gs.xp
  await nav(page, '/smokecraft/ai-summary')
  await page.waitForTimeout(400)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(400)
  gs = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
  gs.xp === xpAfterFirst ? ok(`XP not duplicated on re-entering completed AI Summary (stayed at ${gs.xp})`) : bad(`XP changed: ${xpAfterFirst} → ${gs.xp}`)

  // ── 27. No route loop ──
  console.log('\n── Suite 27: No route loop ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_AI_SUMMARY, demoMode: true, journeyPatch: FULL_JOURNEY })
  await nav(page, '/smokecraft/pairing-recommendations')
  await page.waitForTimeout(400)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/passport-stamp' ? ok('Pairing Recommendations Continue does not loop back to itself') : bad(`Landed on ${page.url()}`)

  // ── 28. No dead end (full chain) ──
  console.log('\n── Suite 28: No dead end (full chain) ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SCORECARD, demoMode: true, journeyPatch: FULL_JOURNEY })
  await nav(page, '/smokecraft/scorecard')
  await nav(page, '/smokecraft/ai-summary')
  await page.waitForTimeout(400)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  await page.waitForTimeout(400)
  await page.click('div[role="navigation"] button:last-of-type')
  await page.waitForTimeout(500)
  new URL(page.url()).pathname === '/smokecraft/passport-stamp'
    ? ok('Full chain Scorecard → AI Summary → Pairing Recommendations → Passport Stamp completes with no dead end')
    : bad(`Chain broke, ended on ${page.url()}`)

  // ── 29. No horizontal overflow ──
  console.log('\n── Suite 29: No horizontal overflow ──')
  await seedGuest(page, { completedSteps: PREREQS_TO_SCORECARD, demoMode: true, journeyPatch: FULL_JOURNEY })
  await nav(page, '/smokecraft/ai-summary')
  await page.waitForTimeout(400)
  let overflow1 = await checkNoHorizontalOverflow(page)
  overflow1 ? ok('AI Summary has no horizontal overflow (desktop)') : bad('AI Summary has horizontal overflow')
  await seedGuest(page, { completedSteps: PREREQS_TO_AI_SUMMARY, demoMode: true, journeyPatch: FULL_JOURNEY })
  await nav(page, '/smokecraft/pairing-recommendations')
  await page.waitForTimeout(400)
  let overflow2 = await checkNoHorizontalOverflow(page)
  overflow2 ? ok('Pairing Recommendations has no horizontal overflow (desktop)') : bad('Pairing Recommendations has horizontal overflow')

  // ── 30. Tablet / mobile ──
  console.log('\n── Suite 30: Tablet and mobile layout ──')
  const tabletPage = await context.newPage()
  await tabletPage.setViewportSize({ width: 768, height: 1024 })
  await tabletPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await tabletPage.evaluate(({ journeyPatch, completedSteps }) => {
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, ...journeyPatch }))
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'x', guestId: 'y', completedSteps, xp: 0, rank: 'Novice', badges: [], __version: 4 }))
  }, { journeyPatch: FULL_JOURNEY, completedSteps: PREREQS_TO_SCORECARD })
  await tabletPage.goto(`${BASE}/smokecraft/ai-summary`, { waitUntil: 'domcontentloaded' })
  await tabletPage.waitForTimeout(600)
  const tabletOverflow = await checkNoHorizontalOverflow(tabletPage)
  const tabletNav = await tabletPage.$('div[role="navigation"]')
  ;(tabletOverflow && tabletNav) ? ok('AI Summary renders correctly at tablet viewport (768x1024)') : bad('AI Summary tablet layout issue')

  const mobilePage = await context.newPage()
  await mobilePage.setViewportSize({ width: 390, height: 844 })
  await mobilePage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await mobilePage.evaluate(({ journeyPatch, completedSteps }) => {
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, ...journeyPatch }))
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'x', guestId: 'y', completedSteps, xp: 0, rank: 'Novice', badges: [], __version: 4 }))
  }, { journeyPatch: FULL_JOURNEY, completedSteps: PREREQS_TO_AI_SUMMARY })
  await mobilePage.goto(`${BASE}/smokecraft/pairing-recommendations`, { waitUntil: 'domcontentloaded' })
  await mobilePage.waitForTimeout(600)
  const mobileOverflow = await checkNoHorizontalOverflow(mobilePage)
  const mobileNav = await mobilePage.$('div[role="navigation"]')
  ;(mobileOverflow && mobileNav) ? ok('Pairing Recommendations renders correctly at mobile viewport (390x844)') : bad('Pairing Recommendations mobile layout issue')
  await tabletPage.close()
  await mobilePage.close()

  // ── 31. Accessibility labels ──
  console.log('\n── Suite 31: Accessibility labels ──')
  await nav(page, '/smokecraft/ai-summary')
  await page.waitForTimeout(400)
  const navLabel = await page.$('div[role="navigation"][aria-label="Screen navigation"]')
  navLabel ? ok('AI Summary nav bar has aria-label') : bad('AI Summary nav bar aria-label missing')
  await nav(page, '/smokecraft/pairing-recommendations')
  await page.waitForTimeout(400)
  const scoreLabel = await page.$('[aria-label^="Compatibility score"]')
  scoreLabel ? ok('Pairing Recommendations compatibility score has aria-label') : bad('Compatibility score aria-label missing')

  await browser.close()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

run().catch(err => { console.error(err); process.exit(1) })
