import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
let passed = 0
let failed = 0
function ok(msg) { passed++; console.log(`  ✓ ${msg}`) }
function bad(msg) { failed++; console.log(`  ✗ ${msg}`) }

async function seedGuest(page, opts = {}) {
  await page.goto(`${BASE}/smokecraft/enroll`)
  await page.evaluate((o) => {
    const session = {
      sessionId: 'identity-test-guest',
      xp: o.xp ?? 0,
      completedSteps: o.completedSteps || ['entry', 'enroll'],
      profile: {},
      badges: [],
      smokeCraft: {},
    }
    localStorage.setItem('novee_guest_session', JSON.stringify(session))
    if (o.demoMode !== false) localStorage.setItem('novee_demo_mode', 'true')
    if (o.journeyPatch) localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, ...o.journeyPatch }))
    else if (o.freshJourney) localStorage.removeItem('sc_journey_v1')
  }, opts)
}

async function nav(page, path) {
  await page.goto(`${BASE}${path}`)
  await page.waitForTimeout(400)
}

async function checkNoHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  console.log('── Suite 1: Route loads directly, no console errors ──')
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (msg) => {
    // "Failed to load resource" (e.g. /api/auth/me returning 500) happens
    // identically on every route under this static preview server, since no
    // backend is running here — pre-existing, unrelated to this change.
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text())
  })
  await seedGuest(page)
  await nav(page, '/smokecraft/identity')
  const body = await page.textContent('body')
  if (body.includes('Begin Your Journey')) ok('/smokecraft/identity resolves')
  else bad('Identity screen did not render')
  if (errors.length === 0) ok('No console errors on load')
  else bad(`Console errors: ${errors.join(', ')}`)

  console.log('── Suite 2: No baked interface screenshot — inputs are real ──')
  const inputCount = await page.locator('input').count()
  const selectCount = await page.locator('select').count()
  if (inputCount >= 4 && selectCount >= 1) ok(`Real form controls present (${inputCount} inputs, ${selectCount} select)`)
  else bad('Expected form controls not found')

  console.log('── Suite 3: Hero photography still displays ──')
  const heroImg = await page.locator('[role="img"][aria-label*="Begin Your Journey"]').count()
  if (heroImg > 0) ok('Approved hero photography renders as a bounded decorative element')
  else bad('Hero photography missing')
  const heroBox = await page.locator('[role="img"][aria-label*="Begin Your Journey"]').boundingBox()
  if (heroBox && heroBox.width < 1440) ok('Hero photography is bounded, not full-viewport screenshot')
  else bad('Hero photography still spans the full viewport')

  console.log('── Suite 4-5: Inputs editable, experience options clickable ──')
  await page.fill('#id-fullname', 'Test Guest')
  const nameVal = await page.inputValue('#id-fullname')
  nameVal === 'Test Guest' ? ok('Full Name input is editable') : bad('Full Name input not editable')

  const expBtn = page.locator('button[aria-pressed]', { hasText: 'Regular Enthusiast' })
  await expBtn.click()
  const pressed = await expBtn.getAttribute('aria-pressed')
  pressed === 'true' ? ok('Experience level option responds to click and reflects selected state') : bad('Experience level click did not register')

  console.log('── Suite 6-7: Interest multi-select, no preselection ──')
  // Fresh guest — the previous suite's selection was correctly persisted for
  // that same seeded session, so this checks a genuinely new one instead.
  await seedGuest(page, { xp: 0, completedSteps: ['entry', 'enroll'], freshJourney: true })
  await nav(page, '/smokecraft/identity')
  const preselected = await page.locator('button[aria-pressed="true"]').count()
  preselected === 0 ? ok('No options are preselected on a fresh visit') : bad(`${preselected} option(s) incorrectly preselected`)
  const focusBtn = page.locator('button[aria-pressed]', { hasText: 'Flavor Discovery' })
  await focusBtn.click()
  const focusPressed = await focusBtn.getAttribute('aria-pressed')
  focusPressed === 'true' ? ok('Interest option supports real selection') : bad('Interest option selection failed')

  console.log('── Suite 8-9: Required-field validation, invalid email rejected ──')
  await page.click('#id-fullname')
  await page.fill('#id-fullname', '')
  await page.locator('#id-fullname').blur()
  await page.waitForTimeout(150)
  const fullNameError = await page.locator('[role="alert"]', { hasText: 'Full name is required' }).count()
  fullNameError > 0 ? ok('Required-field validation shows an error for empty Full Name') : bad('Required-field validation did not trigger')

  await page.fill('#id-email', 'not-an-email')
  await page.locator('#id-email').blur()
  await page.waitForTimeout(150)
  const emailError = await page.locator('[role="alert"]', { hasText: 'valid email' }).count()
  emailError > 0 ? ok('Invalid email is rejected with a validation message') : bad('Invalid email was not rejected')

  console.log('── Suite 10: Begin My Journey disabled until valid ──')
  const beginBtnDisabled = await page.locator('button:has-text("Begin My Journey")').isDisabled()
  beginBtnDisabled ? ok('Begin My Journey is disabled while the form is invalid') : bad('Begin My Journey was enabled with an invalid form')

  await page.fill('#id-fullname', 'Alex Rivera')
  await page.fill('#id-email', '')
  await page.locator('button[aria-pressed]', { hasText: 'New to Cigars' }).click()
  await page.waitForTimeout(200)
  const beginBtnEnabled = await page.locator('button:has-text("Begin My Journey")').isDisabled()
  beginBtnEnabled === false ? ok('Begin My Journey becomes enabled once required fields are valid') : bad('Begin My Journey did not enable after valid input')

  console.log('── Suite 11: Saved identity data persists ──')
  await page.waitForTimeout(500)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1') || '{}'))
  stored?.identity?.fullName === 'Alex Rivera' ? ok('Identity data persisted to canonical sc_journey_v1') : bad('Identity data did not persist')
  await page.reload()
  await page.waitForTimeout(400)
  const nameAfterReload = await page.inputValue('#id-fullname')
  nameAfterReload === 'Alex Rivera' ? ok('Saved identity restored after refresh') : bad('Identity data not restored after refresh')

  console.log('── Suite 12-13: Back navigation, Begin advances correctly ──')
  const beforeUrl = page.url()
  await page.click('button:has-text("Back")')
  await page.waitForTimeout(300)
  page.url() !== beforeUrl ? ok('Back navigation leaves the Identity screen') : bad('Back did not navigate')

  await nav(page, '/smokecraft/identity')
  await page.fill('#id-fullname', 'Alex Rivera')
  await page.locator('button[aria-pressed]', { hasText: 'New to Cigars' }).click()
  await page.waitForTimeout(200)
  await page.click('button:has-text("Begin My Journey")')
  await page.waitForTimeout(400)
  page.url().includes('/smokecraft/golden-box') ? ok('Begin My Journey advances to the correct next route (/smokecraft/golden-box)') : bad(`Begin My Journey landed on ${page.url()}`)

  console.log('── Suite 14: Stats/analytics show no fabricated values ──')
  await seedGuest(page, { xp: 0, completedSteps: ['entry', 'enroll'] })
  await nav(page, '/smokecraft/identity')
  const statsBody = await page.textContent('body')
  ;(statsBody.includes('Greg Guy') || statsBody.includes('Romeo y Julieta') || statsBody.includes('Maestro Rafael'))
    ? bad('Fabricated sample identity/data found on Identity screen')
    : ok('No fabricated sample identity/data present')
  const xpMatch = statsBody.match(/XP:\s*(\d+)/)
  xpMatch && xpMatch[1] === '0' ? ok('XP shown reflects real (zero) session state, not a fabricated number') : bad('XP display does not match real session state')

  console.log('── Suite 15: Empty states readable ──')
  if (statsBody.includes('No completed journeys yet') && statsBody.includes('Not available')) {
    ok('Insights and Your Journeys panels show honest, readable empty states')
  } else {
    bad('Expected empty-state text missing')
  }

  console.log('── Suite 16-17: No console errors, no broken images ──')
  const brokenImages = await page.evaluate(() =>
    Array.from(document.images).filter(img => !img.complete || img.naturalWidth === 0).length
  )
  brokenImages === 0 ? ok('No broken <img> elements') : bad(`${brokenImages} broken image(s) found`)

  console.log('── Suite 18: No horizontal overflow (desktop) ──')
  if (await checkNoHorizontalOverflow(page)) ok('No horizontal overflow at 1440x900')
  else bad('Horizontal overflow detected at 1440x900')

  console.log('── Suite 19: Text size readable ──')
  const smallText = await page.evaluate(() => {
    const all = document.querySelectorAll('main *')
    let count = 0
    for (const el of all) {
      const fs = parseFloat(getComputedStyle(el).fontSize)
      if (fs > 0 && fs < 11 && el.textContent.trim().length > 0 && el.children.length === 0) count++
    }
    return count
  })
  smallText === 0 ? ok('No text smaller than 11px found') : bad(`${smallText} text node(s) smaller than 11px`)

  console.log('── Suite 20: No other route affected (spot check) ──')
  await nav(page, '/smokecraft/mentor-selection')
  const mentorBody = await page.textContent('body')
  mentorBody.length > 0 ? ok('Mentor Selection route unaffected (still resolves)') : bad('Mentor Selection broke')

  await browser.close()

  console.log('\n' + '─'.repeat(50))
  console.log(`Result: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
