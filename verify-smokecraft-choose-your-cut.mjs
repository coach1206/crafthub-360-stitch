/**
 * verify-smokecraft-choose-your-cut.mjs
 * Package F — Complete Choose Your Cut
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

async function seedGuest(page, completedSteps = [], demoMode = true, journeyCut) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ completedSteps, demoMode, journeyCut }) => {
    if (journeyCut) {
      localStorage.setItem('sc_journey_v1', JSON.stringify({
        stateVersion: 3, cutToastLight: { cut: journeyCut },
      }))
    } else {
      localStorage.removeItem('sc_journey_v1')
    }
    if (demoMode) sessionStorage.setItem('novee_demo_mode', '1')
    else sessionStorage.removeItem('novee_demo_mode')
    sessionStorage.removeItem('sc_active_screen')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'cyc-test-' + Date.now(), guestId: 'cyc-test-guest',
      completedSteps, xp: completedSteps.length * 25, rank: 'Novice', badges: [],
      __version: 4,
    }))
  }, { completedSteps, demoMode, journeyCut })
}

const PREREQS = ['entry', 'enroll', 'golden-box', 'mentor', 'format', 'wrapper-strength',
  'seed-soil', 'pairing-lab', 'humidor-match', 'request-purchase']

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page    = await context.newPage()

  console.log('\n── Suite 1: Route resolves ──')
  await seedGuest(page, PREREQS, true)
  await nav(page, '/smokecraft/cut-toast-light')
  const hasCutBtns = await page.$('[aria-label="Straight Cut"]')
  hasCutBtns ? ok('/smokecraft/cut-toast-light resolves and renders cut options') : bad('Cut options not found')

  console.log('\n── Suite 2: Straight Cut selectable ──')
  await page.click('[aria-label="Straight Cut"]')
  await page.waitForTimeout(150)
  let pressed = await page.getAttribute('[aria-label="Straight Cut"]', 'aria-pressed')
  pressed === 'true' ? ok('Straight Cut selectable') : bad('Straight Cut not selected')

  console.log('\n── Suite 3: V-Cut selectable ──')
  await page.click('[aria-label="V-Cut"]')
  await page.waitForTimeout(150)
  pressed = await page.getAttribute('[aria-label="V-Cut"]', 'aria-pressed')
  pressed === 'true' ? ok('V-Cut selectable') : bad('V-Cut not selected')

  console.log('\n── Suite 4: Punch Cut selectable ──')
  await page.click('[aria-label="Punch Cut"]')
  await page.waitForTimeout(150)
  pressed = await page.getAttribute('[aria-label="Punch Cut"]', 'aria-pressed')
  pressed === 'true' ? ok('Punch Cut selectable') : bad('Punch Cut not selected')

  console.log('\n── Suite 5: Only one cut selected at a time ──')
  const straightPressed = await page.getAttribute('[aria-label="Straight Cut"]', 'aria-pressed')
  const vCutPressed = await page.getAttribute('[aria-label="V-Cut"]', 'aria-pressed')
  ;(straightPressed === 'false' && vCutPressed === 'false')
    ? ok('Only Punch Cut remains selected; others deselected')
    : bad(`Straight=${straightPressed} V=${vCutPressed}`)

  console.log('\n── Suite 6: Learn Why content matches selected cut ──')
  await page.click('button:has-text("Learn Why")')
  await page.waitForTimeout(150)
  let bodyText = await page.evaluate(() => document.body.innerText)
  bodyText.includes('Punch Cut is chosen')
    ? ok('Learn Why content reflects Punch Cut')
    : bad('Learn Why content did not match Punch Cut')

  await page.click('[aria-label="Straight Cut"]')
  await page.waitForTimeout(150)
  bodyText = await page.evaluate(() => document.body.innerText)
  bodyText.includes('Straight Cut is the traditional choice')
    ? ok('Learn Why content updates to Straight Cut')
    : bad('Learn Why content did not update')

  console.log('\n── Suite 7: Continue blocked until a cut is selected ──')
  await seedGuest(page, PREREQS, true)
  await nav(page, '/smokecraft/cut-toast-light')
  const continueBtn = await page.$('div[role="navigation"] button:last-of-type')
  let disabled = await continueBtn.evaluate(el => el.disabled)
  disabled ? ok('Continue disabled with no cut selected') : bad('Continue should be disabled')

  console.log('\n── Suite 8: Continue routes to Lighting Tutorial ──')
  await page.click('[aria-label="Straight Cut"]')
  await page.waitForTimeout(150)
  disabled = await continueBtn.evaluate(el => el.disabled)
  !disabled ? ok('Continue enabled once a cut is selected') : bad('Continue still disabled')
  await continueBtn.click()
  await page.waitForTimeout(600)
  new URL(page.url()).pathname === '/smokecraft/lighting-tutorial'
    ? ok('Continue navigates to /smokecraft/lighting-tutorial')
    : bad(`Continue landed on ${page.url()}`)

  console.log('\n── Suite 9: Back routes correctly ──')
  await seedGuest(page, PREREQS, true)
  await nav(page, '/smokecraft/cut-toast-light')
  const beforeUrl = page.url()
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(400)
  page.url() !== beforeUrl ? ok('Back navigates away from Choose Your Cut') : bad('Back did not navigate')

  console.log('\n── Suite 10: Selection survives refresh ──')
  await seedGuest(page, PREREQS, true)
  await nav(page, '/smokecraft/cut-toast-light')
  await page.click('[aria-label="V-Cut"]')
  await page.waitForTimeout(300)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  pressed = await page.getAttribute('[aria-label="V-Cut"]', 'aria-pressed')
  pressed === 'true' ? ok('Selection survives refresh') : bad('Selection lost after refresh')

  console.log('\n── Suite 11: Selection survives Back and Continue ──')
  await seedGuest(page, PREREQS, true)
  await nav(page, '/smokecraft/cut-toast-light')
  await page.click('[aria-label="Punch Cut"]')
  await page.waitForTimeout(200)
  await page.click('div[role="navigation"] button:first-of-type')
  await page.waitForTimeout(400)
  await page.goto(`${BASE}/smokecraft/cut-toast-light`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  pressed = await page.getAttribute('[aria-label="Punch Cut"]', 'aria-pressed')
  pressed === 'true' ? ok('Selection survives Back/re-visit') : bad('Selection lost after Back')
  const cont2 = await page.$('div[role="navigation"] button:last-of-type')
  await cont2.click()
  await page.waitForTimeout(600)
  new URL(page.url()).pathname === '/smokecraft/lighting-tutorial'
    ? ok('Selection carries through Continue')
    : bad(`Landed on ${page.url()}`)

  console.log('\n── Suite 12: Resume restores the selected cut ──')
  await seedGuest(page, PREREQS, true, 'V-Cut')
  await nav(page, '/smokecraft/cut-toast-light')
  pressed = await page.getAttribute('[aria-label="V-Cut"]', 'aria-pressed')
  pressed === 'true' ? ok('Resume restores previously saved cut (V-Cut)') : bad('Resume did not restore selection')

  console.log('\n── Suite 13: Lighting Tutorial remains fully functional ──')
  await seedGuest(page, [...PREREQS, 'cut-toast-light'], true)
  await nav(page, '/smokecraft/lighting-tutorial')
  const ltTitle = await page.textContent('h1')
  ltTitle.includes('Toasting') ? ok('Lighting Tutorial still resolves and renders Step 1') : bad(`Title: ${ltTitle}`)

  await browser.close()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

run().catch(err => { console.error(err); process.exit(1) })
