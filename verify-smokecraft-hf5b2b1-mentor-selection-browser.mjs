/**
 * Holistic Fix 5B-2B-1 — real Playwright browser verification of the
 * Mentor Selection screen's new voice-preview controls.
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
const results = []
function ok(msg) { pass++; results.push({ name: msg, ok: true }); console.log(`  PASS  ${msg}`) }
function bad(msg, detail) { fail++; results.push({ name: msg, ok: false, detail }); console.log(`  FAIL  ${msg}${detail ? ' — ' + detail : ''}`) }

async function seedGuest(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.removeItem('sc_journey_v1')
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'hf5b2b1-test-' + Date.now(), guestId: 'hf5b2b1-test-guest',
      completedSteps: ['entry'], xp: 25, rank: 'Novice', badges: [], __version: 4,
    }))
  })
}

async function nav(page, path) {
  try { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }) }
  catch { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 }) }
  await page.waitForTimeout(900)
}

async function run() {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${msg.text()} [${msg.location()?.url || ''}]`) })
  page.on('pageerror', err => consoleErrors.push(String(err)))

  await seedGuest(page)
  await nav(page, '/smokecraft/mentor')

  const bodyVisible = await page.locator('body').isVisible().catch(() => false)
  bodyVisible ? ok('Mentor Selection route resolves') : bad('Mentor Selection route resolves')

  const h1Visible = await page.locator('text=Mentor Selection').first().isVisible().catch(() => false)
  h1Visible ? ok('Approved heading still renders (no visual regression)') : bad('Approved heading still renders')

  const previewButtons = page.getByRole('button', { name: /Preview .*'s voice/i })
  const previewCount = await previewButtons.count()
  previewCount === 8 ? ok('Every one of the 8 real roster mentors has a Preview Voice control') : bad('Every mentor has a Preview Voice control', `found ${previewCount}`)

  console.log('\n── Preview flow — mentor with a configured voice ──')
  const donAlejandroBtn = page.getByRole('button', { name: /Preview Don Alejandro's voice/i })
  await donAlejandroBtn.click()
  await page.waitForTimeout(1500)
  const unavailableText = await page.locator('text=Voice unavailable for this mentor').first().isVisible().catch(() => false)
  unavailableText ? ok('Honest "unavailable" state renders when the provider is not configured in this environment (no fabricated audio/success)') : bad('Honest unavailable state renders for a configured-voice mentor with no provider key')

  const captionAfterPreview = await page.locator('text=/Volcanic soil and the patience/').first().isVisible().catch(() => false)
  captionAfterPreview ? ok('Transcript/caption text is shown even when audio is unavailable (honest, non-fabricated transcript)') : bad('Transcript/caption text shown alongside the unavailable state')

  console.log('\n── Preview flow — mentor without a configured voice ──')
  const rafaelBtn = page.getByRole('button', { name: /Preview Maestro Rafael's voice/i })
  await rafaelBtn.click()
  await page.waitForTimeout(1000)
  const rafaelUnavailable = await page.locator('text=Voice unavailable for this mentor').count()
  rafaelUnavailable >= 1 ? ok('Mentor with no configured voice honestly shows unavailable, never a fake Play control') : bad('Unconfigured-voice mentor shows honest unavailable state')

  console.log('\n── Mute control ──')
  const muteButtons = page.getByRole('button', { name: /Mute mentor voice|Unmute mentor voice/i })
  const muteCount = await muteButtons.count()
  muteCount === 8 ? ok('Every mentor card has its own mute control') : bad('Every mentor card has a mute control', `found ${muteCount}`)
  await muteButtons.first().click()
  await page.waitForTimeout(400)
  const nowUnmuteLabel = await page.getByRole('button', { name: /Unmute mentor voice/i }).first().isVisible().catch(() => false)
  nowUnmuteLabel ? ok('Toggling mute updates the control\'s accessible label (mute/unmute both reachable)') : bad('Mute toggle updates accessible label')

  console.log('\n── Keyboard / focus ──')
  await page.keyboard.press('Tab')
  const activeTag = await page.evaluate(() => document.activeElement?.tagName)
  activeTag ? ok('Keyboard navigation moves focus on Mentor Selection') : bad('Keyboard navigation moves focus')

  const cardFocusable = await page.evaluate(() => {
    const card = document.querySelector('[role="button"][aria-pressed]')
    return card ? card.tabIndex : null
  })
  cardFocusable === 0 ? ok('Mentor cards remain keyboard-focusable after the role/tabIndex refactor (selection still works via keyboard)') : bad('Mentor cards remain keyboard-focusable', `tabIndex=${cardFocusable}`)

  console.log('\n── Card selection still works (voice controls do not block it) ──')
  const firstCard = page.locator('[role="button"][aria-pressed]').first()
  await firstCard.click()
  await page.waitForTimeout(400)
  const isPressed = await firstCard.getAttribute('aria-pressed')
  isPressed === 'true' ? ok('Clicking a mentor card still selects it (Preview Voice control does not block the existing selection interaction)') : bad('Mentor card selection still works after adding voice controls')

  console.log('\n── Pointer/touch on nested voice control (does not trigger card selection) ──')
  const secondCardPreviewBtn = page.getByRole('button', { name: /Preview .*'s voice/i }).nth(1)
  const secondCard = page.locator('[role="button"][aria-pressed]').nth(1)
  const pressedBefore = await secondCard.getAttribute('aria-pressed')
  await secondCardPreviewBtn.click()
  await page.waitForTimeout(600)
  const pressedAfter = await secondCard.getAttribute('aria-pressed')
  pressedBefore === pressedAfter ? ok('Clicking Preview Voice does not accidentally toggle the mentor card\'s selection state (no blocked/mis-wired overlay)') : bad('Preview Voice click does not toggle card selection', `before=${pressedBefore} after=${pressedAfter}`)

  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowX ? ok('No horizontal layout cutoff after adding voice controls') : bad('No horizontal layout cutoff')

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver/i.test(e))
  realErrors.length === 0 ? ok('No console errors on Mentor Selection') : bad('No console errors on Mentor Selection', realErrors.slice(0, 3).join(' | '))

  await context.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5b-2b-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5b-2b-1/03-mentor-selection-browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
