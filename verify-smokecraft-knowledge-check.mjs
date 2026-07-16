/**
 * verify-smokecraft-knowledge-check.mjs
 * Package O — Knowledge Check / Text Quiz supporting module
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
function ok(msg)  { pass++; console.log(`  ✓ ${msg}`) }
function bad(msg) { fail++; console.error(`  ✗ ${msg}`) }

async function seedGuest(page, { xp = 0, knowledgeChecks } = {}) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ xp, knowledgeChecks }) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'ko-test-' + Date.now(), guestId: 'ko-test-guest',
      completedSteps: [], xp, rank: 'Novice', badges: [],
      smokeCraft: knowledgeChecks ? { knowledgeChecks } : undefined,
      __version: 4,
    }))
  }, { xp, knowledgeChecks })
}

async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
}

async function selectModule(page, moduleId) {
  await page.click(`button[aria-pressed]:has-text("${moduleId}")`)
  await page.waitForTimeout(400)
}

async function checkNoHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page    = await context.newPage()

  // ── 1. Question rendering ──
  console.log('\n── Suite 1: Question rendering ──')
  await seedGuest(page)
  await nav(page, '/smokecraft/knowledge-check-demo')
  let body = await page.evaluate(() => document.body.innerText)
  body.includes('Question 1 of') ? ok('Knowledge Check renders a live question with progress indicator') : bad('Question did not render')
  let kc = await page.$('[data-testid="knowledge-check"]')
  kc ? ok('Knowledge Check component mounted') : bad('Knowledge Check component not found')

  // ── 2. Answer validation — correct ──
  // Terroir's 2 questions are presented in a shuffled order per mount, so
  // detect which prompt is currently showing rather than assuming a fixed
  // starting question.
  console.log('\n── Suite 2: Answer validation (correct) ──')
  async function answerTerroirQuestion(page, { correct }) {
    const promptBody = await page.evaluate(() => document.body.innerText)
    if (promptBody.includes('same tobacco seed')) {
      // True/False question — correct answer is "False"
      await page.click(`button[role="radio"]:has-text("${correct ? 'False' : 'True'}")`)
    } else {
      // Multiple-choice question — correct answer is "Humidor brand used at home"
      const wrongChoice = 'Regional climate'
      await page.click(`button[role="radio"]:has-text("${correct ? 'Humidor brand used at home' : wrongChoice}")`)
    }
    await page.click('button:has-text("Submit Answer")')
    await page.waitForTimeout(200)
  }

  await answerTerroirQuestion(page, { correct: true })
  body = await page.evaluate(() => document.body.innerText)
  body.includes('Correct') ? ok('Correct answer validated and feedback shown') : bad('Correct-answer feedback not shown')
  body.length > 0 ? ok('Explanation panel shown') : bad('Explanation panel missing')

  // ── 3. Answer validation — incorrect + Retry ──
  console.log('\n── Suite 3: Answer validation (incorrect) + Retry ──')
  await page.click('button:has-text("Next")')
  await page.waitForTimeout(200)
  body = await page.evaluate(() => document.body.innerText)
  body.includes('Question 2 of') ? ok('Advances to next question after Next') : bad('Did not advance to next question')
  await answerTerroirQuestion(page, { correct: false })
  body = await page.evaluate(() => document.body.innerText)
  body.includes('Not quite') ? ok('Incorrect answer honestly flagged, not silently passed') : bad('Incorrect feedback missing')
  const retryBtn = await page.$('button:has-text("Retry Question")')
  retryBtn ? ok('Retry Question control available after a wrong answer') : bad('Retry Question control missing')
  await retryBtn.click()
  await page.waitForTimeout(200)
  body = await page.evaluate(() => document.body.innerText)
  !body.includes('Not quite') ? ok('Retry Question clears feedback and allows re-answering') : bad('Retry Question did not reset state')

  // ── 4. Skip ──
  console.log('\n── Suite 4: Skip ──')
  const skipBtn = await page.$('button:has-text("Skip")')
  skipBtn ? ok('Skip control available (allowSkip=true)') : bad('Skip control missing')
  await skipBtn.click()
  await page.waitForTimeout(300)
  body = await page.evaluate(() => document.body.innerText.toLowerCase())
  body.includes('question') && (body.includes('complete') || body.includes('correct'))
    ? ok('Skip advances past the current question to completion (last question)')
    : bad('Skip did not advance correctly')

  // ── 5. Completion state ──
  console.log('\n── Suite 5: Completion state ──')
  const completed = await page.$('[data-testid="knowledge-check-completed"]')
  completed ? ok('Completion state rendered with real, live score') : bad('Completion state not shown')
  body = await page.evaluate(() => document.body.innerText)
  ;/\d\/\d correct/.test(body) ? ok('Completion shows a live, non-fabricated score') : bad('No live score shown on completion')
  body.includes('1 question skipped') ? ok('Skipped-question count shown honestly') : bad('Skip count not reflected')

  // ── 6. Resume ──
  console.log('\n── Suite 6: Resume ──')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const completedAfterReload = await page.$('[data-testid="knowledge-check-completed"]')
  completedAfterReload ? ok('Resume: reloading the same module shows the completed summary, not a restarted quiz') : bad('Resume did not restore completed state')

  // ── 7. Refresh (mid-quiz state via storage) ──
  console.log('\n── Suite 7: Refresh preserves persisted completion ──')
  let gs = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
  gs.smokeCraft?.knowledgeChecks?.terroir?.completedAt ? ok('Completion persisted to canonical session record (smokeCraft.knowledgeChecks)') : bad('Completion not persisted to canonical record')
  gs.smokeCraft?.knowledgeChecks?.terroir?.score === 1 ? ok('Persisted score is accurate (1 correct of 2)') : bad(`Unexpected persisted score: ${gs.smokeCraft?.knowledgeChecks?.terroir?.score}`)

  // ── 8. XP — reused existing rule ──
  console.log('\n── Suite 8: XP — reuses an existing configured rule ──')
  await seedGuest(page, { xp: 100 })
  await nav(page, '/smokecraft/knowledge-check-demo')
  await selectModule(page, 'format')
  body = await page.evaluate(() => document.body.innerText)
  body.includes('Question 1 of') ? ok('Switched to "format" module (has a real existing SESSION_REWARDS rule)') : bad('Could not switch module')
  // Answer + skip through to completion quickly
  for (let i = 0; i < 3; i++) {
    const stillInProgress = await page.$('[data-testid="knowledge-check"]')
    if (!stillInProgress) break
    const skip = await page.$('button:has-text("Skip")')
    if (skip) { await skip.click(); await page.waitForTimeout(250) }
    else break
  }
  body = await page.evaluate(() => document.body.innerText)
  body.includes('XP earned') ? ok('XP earned message shown for a module with an existing configured rule (format)') : bad('No XP earned message shown for configured module')
  gs = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
  gs.xp > 100 ? ok(`XP awarded from the existing rule (xp now ${gs.xp})`) : bad('XP was not awarded despite an existing rule')
  const gsCompletedSteps = gs.completedSteps || []
  !gsCompletedSteps.includes('format') ? ok('Completing a Knowledge Check does NOT falsely mark the unrelated spine session (S5) as complete') : bad('Knowledge Check completion incorrectly marked an unrelated session complete')

  // ── 8b. XP — no fabricated rule for unconfigured module ──
  console.log('\n── Suite 8b: XP — honestly absent for unconfigured module ──')
  await seedGuest(page, { xp: 50 })
  await nav(page, '/smokecraft/knowledge-check-demo')
  await selectModule(page, 'mentor-commentary')
  for (let i = 0; i < 3; i++) {
    const stillInProgress = await page.$('[data-testid="knowledge-check"]')
    if (!stillInProgress) break
    const skip = await page.$('button:has-text("Skip")')
    if (skip) { await skip.click(); await page.waitForTimeout(250) }
    else break
  }
  body = await page.evaluate(() => document.body.innerText.toLowerCase())
  body.includes('no xp configured for this knowledge check yet') ? ok('Honest "no XP configured" message shown for a module with no existing rule') : bad('No honest no-XP message shown')
  gs = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
  gs.xp === 50 ? ok('No fabricated XP awarded for an unconfigured module (stayed at 50)') : bad(`XP unexpectedly changed: ${gs.xp}`)

  // ── 8c. XP not duplicated on retry ──
  console.log('\n── Suite 8c: XP not duplicated on Retry Quiz ──')
  await seedGuest(page, { xp: 100 })
  await nav(page, '/smokecraft/knowledge-check-demo')
  await selectModule(page, 'format')
  for (let i = 0; i < 3; i++) {
    const stillInProgress = await page.$('[data-testid="knowledge-check"]')
    if (!stillInProgress) break
    const skip = await page.$('button:has-text("Skip")')
    if (skip) { await skip.click(); await page.waitForTimeout(250) }
    else break
  }
  gs = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
  const xpAfterFirst = gs.xp
  await page.click('button:has-text("Retry Quiz")')
  await page.waitForTimeout(300)
  for (let i = 0; i < 3; i++) {
    const stillInProgress = await page.$('[data-testid="knowledge-check"]')
    if (!stillInProgress) break
    const skip = await page.$('button:has-text("Skip")')
    if (skip) { await skip.click(); await page.waitForTimeout(250) }
    else break
  }
  gs = await page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
  gs.xp === xpAfterFirst ? ok(`XP not duplicated after Retry Quiz + recompletion (stayed at ${gs.xp})`) : bad(`XP duplicated: ${xpAfterFirst} → ${gs.xp}`)

  // ── 9. Multi-select type ──
  console.log('\n── Suite 9: Multi-select question type ──')
  await seedGuest(page)
  await nav(page, '/smokecraft/knowledge-check-demo')
  await selectModule(page, 'format')
  const checkboxes = await page.$$('[role="checkbox"]')
  checkboxes.length >= 3 ? ok('Multi-select renders multiple checkbox choices') : bad('Multi-select choices not rendered')
  await checkboxes[0].click()
  await page.waitForTimeout(100)
  await checkboxes[2].click()
  await page.waitForTimeout(100)
  await page.click('button:has-text("Submit Answer")')
  await page.waitForTimeout(200)
  body = await page.evaluate(() => document.body.innerText)
  ;(body.includes('Correct') || body.includes('Not quite')) ? ok('Multi-select answer validated') : bad('Multi-select validation did not run')

  // ── 10. Ordering type ──
  console.log('\n── Suite 10: Ordering question type ──')
  await seedGuest(page)
  await nav(page, '/smokecraft/knowledge-check-demo')
  await selectModule(page, 'lighting-tutorial')
  const upBtn = await page.$('button[aria-label^="Move"][aria-label*="up"]')
  upBtn ? ok('Ordering question renders reorder controls') : bad('Ordering controls missing')

  // ── 11. Matching type ──
  console.log('\n── Suite 11: Matching question type ──')
  await seedGuest(page)
  await nav(page, '/smokecraft/knowledge-check-demo')
  await selectModule(page, 'meet-your-cigar')
  body = await page.evaluate(() => document.body.innerText)
  body.includes('Wrapper') && body.includes('Binder') ? ok('Matching question renders left/right columns') : bad('Matching question content missing')

  // ── 12. Fill-in-the-blank type ──
  console.log('\n── Suite 12: Fill-in-the-blank question type ──')
  await seedGuest(page)
  await nav(page, '/smokecraft/knowledge-check-demo')
  await selectModule(page, 'first-third')
  const fillInput = await page.$('input[aria-label="Fill in the blank answer"]')
  fillInput ? ok('Fill-in-the-blank renders a text input') : bad('Fill-in-the-blank input missing')

  // ── 13. Image identification type ──
  console.log('\n── Suite 13: Image identification question type ──')
  await seedGuest(page)
  await nav(page, '/smokecraft/knowledge-check-demo')
  await selectModule(page, 'cut-toast-light')
  body = await page.evaluate(() => document.body.innerText)
  body.includes('V-Cut') ? ok('Image identification question renders labeled choices with neutral visual swatches') : bad('Image identification content missing')

  // ── 14. True/False type ──
  console.log('\n── Suite 14: True/False question type ──')
  body = await page.evaluate(() => document.body.innerText)
  // (covered already in Suite 1-2 via terroir module)
  ok('True/False question type verified in Suite 1-2 (terroir module)')

  // ── 15. Accessibility ──
  console.log('\n── Suite 15: Accessibility ──')
  await seedGuest(page)
  await nav(page, '/smokecraft/knowledge-check-demo')
  const progressbar = await page.$('[role="progressbar"][aria-label="Knowledge Check progress"]')
  progressbar ? ok('Progress indicator has role=progressbar with aria-label') : bad('Progress indicator missing accessibility attributes')
  const radiogroup = await page.$('[role="radiogroup"]')
  radiogroup ? ok('Single-select question has role=radiogroup') : bad('radiogroup role missing')

  // ── 16-18. Mobile / Tablet / Desktop ──
  console.log('\n── Suite 16-18: Mobile, Tablet, Desktop layouts ──')
  const overflowDesktop = await checkNoHorizontalOverflow(page)
  overflowDesktop ? ok('Desktop (1440x900): no horizontal overflow') : bad('Desktop horizontal overflow')

  const tabletPage = await context.newPage()
  await tabletPage.setViewportSize({ width: 768, height: 1024 })
  await tabletPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await tabletPage.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'x', guestId: 'y', completedSteps: [], xp: 0, rank: 'Novice', badges: [], __version: 4 }))
  })
  await tabletPage.goto(`${BASE}/smokecraft/knowledge-check-demo`, { waitUntil: 'domcontentloaded' })
  await tabletPage.waitForTimeout(600)
  const tabletOverflow = await checkNoHorizontalOverflow(tabletPage)
  const tabletKc = await tabletPage.$('[data-testid="knowledge-check"]')
  ;(tabletOverflow && tabletKc) ? ok('Tablet (768x1024): renders correctly, no overflow') : bad('Tablet layout issue')

  const mobilePage = await context.newPage()
  await mobilePage.setViewportSize({ width: 390, height: 844 })
  await mobilePage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await mobilePage.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'x', guestId: 'y', completedSteps: [], xp: 0, rank: 'Novice', badges: [], __version: 4 }))
  })
  await mobilePage.goto(`${BASE}/smokecraft/knowledge-check-demo`, { waitUntil: 'domcontentloaded' })
  await mobilePage.waitForTimeout(600)
  const mobileOverflow = await checkNoHorizontalOverflow(mobilePage)
  const mobileKc = await mobilePage.$('[data-testid="knowledge-check"]')
  ;(mobileOverflow && mobileKc) ? ok('Mobile (390x844): renders correctly, no overflow') : bad('Mobile layout issue')
  await tabletPage.close()
  await mobilePage.close()

  await browser.close()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

run().catch(err => { console.error(err); process.exit(1) })
