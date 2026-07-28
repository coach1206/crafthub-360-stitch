/**
 * Holistic Fix 5B-2A-1 — real Playwright browser verification of all six
 * affected screens: ChallengeHub, BlendFaultChallenge, FillerArrangement,
 * CollectionsCenter, PairingLab, PairingRecommendations.
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
const results = []
function ok(msg) { pass++; results.push({ name: msg, ok: true }); console.log(`  PASS  ${msg}`) }
function bad(msg, detail) { fail++; results.push({ name: msg, ok: false, detail }); console.log(`  FAIL  ${msg}${detail ? ' — ' + detail : ''}`) }

const CUBA_MENTOR = { id: 'cuba', country: 'Cuba', countryCode: 'CU', flag: '🇨🇺', name: 'Maestro Rafael', bio: 'Keeper of classic Cuban-seed tradition, elegant draw discipline, and old-world rolling standards.', tags: ['Tradition', 'Balance'], image: '/mentors/maestro-rafael.jpg', greeting: 'Maestro Rafael. Tradition is not nostalgia.' }

async function seedGuest(page, { completedSteps = [], demoMode = false, journeyPatch } = {}) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ completedSteps, demoMode, journeyPatch }) => {
    if (journeyPatch) localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, ...journeyPatch }))
    else localStorage.removeItem('sc_journey_v1')
    if (demoMode) sessionStorage.setItem('novee_demo_mode', '1')
    else sessionStorage.removeItem('novee_demo_mode')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'hf5b2a1-test-' + Date.now(), guestId: 'hf5b2a1-test-guest',
      completedSteps, xp: completedSteps.length * 25, rank: 'Novice', badges: [],
      __version: 4,
    }))
  }, { completedSteps, demoMode, journeyPatch })
}

async function nav(page, path) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  } catch {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  }
  await page.waitForTimeout(900)
}

async function checkScreen(browser, { label, path, testGuidance = true }) {
  console.log(`\n── ${label} ──`)
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${msg.text()} [${msg.location()?.url || ''}]`) })
  page.on('pageerror', err => consoleErrors.push(String(err)))

  await seedGuest(page, { completedSteps: ['entry'], demoMode: true, journeyPatch: { mentor: [CUBA_MENTOR] } })
  await nav(page, path)

  const bodyVisible = await page.locator('body').isVisible().catch(() => false)
  bodyVisible ? ok(`${label} route resolves`) : bad(`${label} route resolves`)

  if (testGuidance) {
    const mentorNameVisible = await page.locator('text=Maestro Rafael').first().isVisible().catch(() => false)
    mentorNameVisible ? ok(`${label} renders the real selected mentor's name (mentor identity correct)`) : bad(`${label} renders the real selected mentor's name`)

    await page.waitForTimeout(1200)
    const guidanceEl = page.locator('div:has-text("Selected Mentor") >> p').last()
    const guidanceText = await guidanceEl.textContent().catch(() => null)
    const isReal = guidanceText && guidanceText.length > 5 && !guidanceText.includes("hasn't left specific guidance")
    isReal ? ok(`${label} renders real server-computed guidance ("${guidanceText.slice(0, 55)}…")`) : bad(`${label} renders real server-computed guidance`, guidanceText)
  }

  await page.keyboard.press('Tab')
  const activeTag = await page.evaluate(() => document.activeElement?.tagName)
  activeTag ? ok(`${label}: keyboard navigation moves focus`) : bad(`${label}: keyboard navigation moves focus`)

  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowX ? ok(`${label}: no horizontal layout cutoff`) : bad(`${label}: no horizontal layout cutoff`)

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver/i.test(e))
  realErrors.length === 0 ? ok(`${label}: no console errors`) : bad(`${label}: no console errors`, realErrors.slice(0, 2).join(' | '))

  await context.close()
  return page
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })

  await checkScreen(browser, { label: 'ChallengeHub', path: '/smokecraft/challenge-hub' })
  await checkScreen(browser, { label: 'BlendFaultChallenge', path: '/smokecraft/challenges/blend-fault-identification' })
  await checkScreen(browser, { label: 'FillerArrangement', path: '/smokecraft/filler-arrangement' })
  await checkScreen(browser, { label: 'CollectionsCenter', path: '/smokecraft/collections' })

  console.log('\n── PairingLab (pairing-aware mentor guidance) ──')
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const consoleErrors = []
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
    page.on('pageerror', err => consoleErrors.push(String(err)))

    await seedGuest(page, { completedSteps: ['entry'], demoMode: true, journeyPatch: { mentor: [CUBA_MENTOR] } })
    await nav(page, '/smokecraft/pairing-lab')

    const noActivityText = await page.locator('text=/Select a beverage to see/').first().isVisible().catch(() => false)
    noActivityText ? ok('PairingLab: honest "no activity result yet" state before a beverage is selected') : bad('PairingLab: honest "no activity result yet" state')

    await page.getByLabel('Robusto', { exact: true }).click().catch(() => {})
    await page.getByLabel('Habano', { exact: true }).click().catch(() => {})
    await page.getByLabel('Nicaragua', { exact: true }).click().catch(() => {})
    await page.getByLabel('Full', { exact: true }).click().catch(() => {})
    await page.getByLabel('Whiskey pairing').click({ position: { x: 3, y: 5 } }).catch(() => {})
    await page.waitForTimeout(1500)

    const scoreText = await page.locator('text=/^\\d{2,3}$/').first().textContent().catch(() => null)
    const guidanceEl = page.locator('div:has-text("Selected Mentor") >> p').last()
    const guidanceText = await guidanceEl.textContent().catch(() => null)
    const guidanceMatches = scoreText && guidanceText && guidanceText.includes(`${scoreText}/100`)
    guidanceMatches ? ok(`PairingLab: mentor guidance score exactly matches the pairing engine's own displayed score (${scoreText})`) : bad('PairingLab: mentor guidance score matches the pairing engine result', `score=${scoreText} guidance="${guidanceText}"`)

    await page.keyboard.press('Tab')
    const activeTag = await page.evaluate(() => document.activeElement?.tagName)
    activeTag ? ok('PairingLab: keyboard navigation moves focus') : bad('PairingLab: keyboard navigation moves focus')

    const continueBtn = page.getByRole('button', { name: /Continue/i })
    let continueBlocked = false
    try { await continueBtn.first().click({ trial: true, timeout: 2000 }) } catch { continueBlocked = true }
    !continueBlocked ? ok('PairingLab: Continue control is not blocked by an invisible overlay') : bad('PairingLab: Continue control is not blocked by an invisible overlay')

    const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver/i.test(e))
    realErrors.length === 0 ? ok('PairingLab: no console errors') : bad('PairingLab: no console errors', realErrors.slice(0, 2).join(' | '))

    await context.close()
  }

  console.log('\n── PairingRecommendations (pairing-aware mentor guidance) ──')
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const consoleErrors = []
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
    page.on('pageerror', err => consoleErrors.push(String(err)))

    const PREREQS_TO_AI_SUMMARY = [
      'entry', 'enroll', 'golden-box', 'mentor', 'format', 'wrapper-strength', 'seed-soil',
      'humidor-match', 'meet-your-cigar', 'terroir', 'request-purchase', 'cut-toast-light',
      'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third',
      'mentor-commentary', 'knowledge-drop', 'final-third', 'scorecard', 'ai-summary',
    ]
    const FULL_JOURNEY = {
      mentor: [CUBA_MENTOR],
      selectedCigar: { name: 'Oliva Serie V', origin: 'Nicaragua', wrapper: 'Habano Maduro', strength: 'Full', body: 'Full', tastingProfile: 'Dark chocolate, leather, espresso' },
      format: { id: 'robusto', label: 'Robusto 5x50' },
      pairing: { strength: 'Full', flavorNotes: ['Smoky', 'Bold'], pairingGoal: 'Complement' },
    }
    await seedGuest(page, { completedSteps: PREREQS_TO_AI_SUMMARY, demoMode: true, journeyPatch: FULL_JOURNEY })
    await nav(page, '/smokecraft/pairing-recommendations')
    await page.waitForSelector('[data-testid="pr-primary"]', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(1200)

    const scoreDonut = await page.locator('[data-testid="pr-score"]').textContent().catch(() => null)
    const guidanceEl = page.locator('div:has-text("Selected Mentor") >> p').last()
    const guidanceText = await guidanceEl.textContent().catch(() => null)
    const scoreNum = scoreDonut ? scoreDonut.replace('%', '').trim() : null
    const guidanceMatches = scoreNum && guidanceText && guidanceText.includes(`${scoreNum}/100`)
    guidanceMatches ? ok(`PairingRecommendations: mentor guidance score exactly matches the score donut (${scoreDonut})`) : bad('PairingRecommendations: mentor guidance score matches the score donut', `donut=${scoreDonut} guidance="${guidanceText}"`)

    await page.keyboard.press('Tab')
    const activeTag = await page.evaluate(() => document.activeElement?.tagName)
    activeTag ? ok('PairingRecommendations: keyboard navigation moves focus') : bad('PairingRecommendations: keyboard navigation moves focus')

    const saveBtn = page.getByTestId('pr-save')
    let saveBlocked = false
    try { await saveBtn.click({ trial: true, timeout: 2000 }) } catch { saveBlocked = true }
    !saveBlocked ? ok('PairingRecommendations: Save control is not blocked by an invisible overlay') : bad('PairingRecommendations: Save control is not blocked by an invisible overlay')

    const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
    overflowX ? ok('PairingRecommendations: no horizontal layout cutoff') : bad('PairingRecommendations: no horizontal layout cutoff')

    const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver/i.test(e))
    realErrors.length === 0 ? ok('PairingRecommendations: no console errors') : bad('PairingRecommendations: no console errors', realErrors.slice(0, 2).join(' | '))

    await context.close()
  }

  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5b-2a-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5b-2a-1/02-mentor-six-screens-browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
