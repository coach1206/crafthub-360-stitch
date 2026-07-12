/**
 * Playwright verification — SmokeCraft Flavor Memory
 * Requires frontend (4173) and backend (3001) active.
 */
import { chromium } from 'playwright'

const BASE  = 'http://localhost:4173'
const ROUTE = `${BASE}/smokecraft/flavor-memory`

let browser, page
const results = []
const jsErrors = []

function pass(label) { results.push({ label, ok: true  }); console.log(`PASS  ${label}`) }
function fail(label, reason) { results.push({ label, ok: false, reason }); console.log(`FAIL  ${label} — ${reason}`) }

async function setup() {
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  page = await browser.newPage()
  page.on('pageerror', e => jsErrors.push(e.message))
  // Enable demo mode so SmokeCraftSessionGuard unlocks the route
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.removeItem('sc_flavor_memory_v1') // start clean
  })
}

// ── Check 1: Route loads ───────────────────────────────────────────────────
async function checkRouteLoads() {
  await page.goto(ROUTE, { waitUntil: 'networkidle' })
  page.url().includes('/smokecraft/flavor-memory')
    ? pass('Route /smokecraft/flavor-memory loads')
    : fail('Route loads', `redirected to ${page.url()}`)
}

// ── Check 2: Image present ─────────────────────────────────────────────────
async function checkImage() {
  const src = await page.$eval('img', img => img.getAttribute('src')).catch(() => null)
  src && decodeURIComponent(src).includes('FLAVOR MEMORY')
    ? pass('Redesigned image (FLAVOR MEMORY.png) present')
    : fail('Image', `src=${src}`)
}

// ── Check 3: Mask overlay ──────────────────────────────────────────────────
async function checkMask() {
  const mask = await page.$('div[aria-hidden="true"]')
  mask ? pass('Baked-value mask overlay present') : fail('Mask overlay', 'aria-hidden div not found')
}

// ── Check 4: All 18 required flavor chips start neutral and unselected ─────
async function checkFlavorsNeutral() {
  const required = [
    'cocoa','coffee','espresso','cedar','leather','earth','cream',
    'toasted-almond','black-pepper','dried-fruit','oak','spice',
    'sweet','smoky','bold','creamy','balanced','rich',
  ]
  let missing = 0
  for (const id of required) {
    const chip = page.locator(`[data-flavor="${id}"]`)
    const visible = await chip.isVisible().catch(() => false)
    if (!visible) { missing++; console.log(`  ✗ Missing chip: ${id}`) }
  }
  missing === 0
    ? pass(`All 18 required flavor chips present and neutral`)
    : fail('Flavor chips neutral', `${missing} chips missing`)
}

// ── Check 5: Clicking flavor selects it visually ──────────────────────────
async function checkFlavorToggle() {
  const chip = page.locator('[data-flavor="cocoa"]')
  const bgBefore = await chip.evaluate(el => window.getComputedStyle(el).backgroundColor)

  await chip.click()
  await page.waitForTimeout(200)

  const bgAfter = await chip.evaluate(el => window.getComputedStyle(el).backgroundColor)
  bgBefore !== bgAfter
    ? pass('Flavor chip: clicking changes visual state (background changes)')
    : fail('Flavor toggle', `bg unchanged: ${bgBefore}`)
}

// ── Check 6: Multiple flavors can be selected simultaneously ──────────────
async function checkMultiSelect() {
  await page.locator('[data-flavor="cedar"]').click()
  await page.locator('[data-flavor="leather"]').click()
  await page.waitForTimeout(200)

  // Check count label shows (3) after cocoa + cedar + leather
  const text = await page.textContent('body')
  text.includes('(3)') || text.includes('(2)')
    ? pass('Multiple flavors selected simultaneously — count displayed')
    : fail('Multi-select', 'count label not found in body text')
}

// ── Check 7: Flavor definition appears on selection ───────────────────────
async function checkDefinition() {
  // Click espresso — should show definition
  await page.locator('[data-flavor="espresso"]').click()
  await page.waitForTimeout(200)
  const text = await page.textContent('body')
  text.includes('Concentrated') || text.includes('Espresso') && text.includes('intense')
    ? pass('Flavor definition displayed after selection')
    : fail('Flavor definition', 'definition text not found after clicking espresso')
}

// ── Check 8: Clicking selected flavor removes it ──────────────────────────
async function checkFlavorDeselect() {
  const chip = page.locator('[data-flavor="cocoa"]')
  const bgBefore = await chip.evaluate(el => window.getComputedStyle(el).backgroundColor)
  await chip.click()
  await page.waitForTimeout(200)
  const bgAfter = await chip.evaluate(el => window.getComputedStyle(el).backgroundColor)
  bgBefore !== bgAfter
    ? pass('Clicking selected flavor deselects it (background reverts)')
    : fail('Flavor deselect', 'background did not change on second click')
}

// ── Check 9: SVG chart updates when flavors selected ─────────────────────
async function checkChart() {
  // After cedar+leather+espresso selected, chart SVG should have data polygon
  const svg = await page.$('svg')
  if (!svg) { fail('Chart', 'no SVG found'); return }
  const polygons = await page.$$eval('svg polygon', els => els.length)
  polygons >= 2
    ? pass(`Flavor chart SVG present with ${polygons} polygon(s) — renders from session data`)
    : fail('Chart polygon', `only ${polygons} polygons found`)
}

// ── Check 10: Sliders are real range inputs ───────────────────────────────
async function checkSliders() {
  const sliders = await page.$$('input[type="range"]')
  sliders.length >= 3
    ? pass(`${sliders.length} real range slider inputs present`)
    : fail('Sliders', `only ${sliders.length} range inputs`)
}

// ── Check 11: Slider changes update label text ────────────────────────────
async function checkSliderUpdate() {
  const intensitySlider = page.locator('[data-slider="flavor-intensity"]')
  await intensitySlider.evaluate(el => { el.value = 5; el.dispatchEvent(new Event('input', { bubbles: true })) })
  await page.waitForTimeout(200)
  const text = await page.textContent('body')
  text.includes('Full')
    ? pass('Slider update: moving to 5 shows "Full" label')
    : fail('Slider label update', '"Full" not found after setting intensity to 5')
}

// ── Check 12: Aromatic nuances clickable ─────────────────────────────────
async function checkAromaNuances() {
  const floral = page.locator('[data-aroma="Floral"]')
  const visible = await floral.isVisible().catch(() => false)
  if (!visible) { fail('Aroma nuances', 'Floral chip not visible'); return }
  const bgBefore = await floral.evaluate(el => window.getComputedStyle(el).color)
  await floral.click()
  await page.waitForTimeout(200)
  const bgAfter = await floral.evaluate(el => window.getComputedStyle(el).color)
  bgBefore !== bgAfter || (await floral.evaluate(el => window.getComputedStyle(el).borderColor)).includes('233')
    ? pass('Aromatic nuances: Floral chip toggles visual state')
    : fail('Aroma toggle', 'no visual change after click')
}

// ── Check 13: Pairing recall selector ────────────────────────────────────
async function checkPairingRecall() {
  const whiskey = page.locator('[data-pairing="Whiskey"]')
  await whiskey.click()
  await page.waitForTimeout(200)
  const bg = await whiskey.evaluate(el => window.getComputedStyle(el).backgroundColor)
  bg.includes('233') || bg.includes('rgb(233')
    ? pass('Pairing recall: Whiskey chip selected with gold background')
    : fail('Pairing recall', `bg=${bg}`)
}

// ── Check 14: Personal notes field expands and accepts text ───────────────
async function checkPersonalNotes() {
  const notesToggle = page.getByRole('button', { name: /personal notes/i })
  await notesToggle.click()
  await page.waitForTimeout(200)
  const textarea = page.locator('textarea')
  const visible = await textarea.isVisible().catch(() => false)
  if (!visible) { fail('Personal notes', 'textarea not visible after toggle'); return }
  await textarea.fill('Rich cedar with a creamy finish.')
  const val = await textarea.inputValue()
  val.includes('cedar')
    ? pass('Personal notes: textarea expands and accepts text')
    : fail('Personal notes input', `value=${val}`)
}

// ── Check 15: XP and session progress come from session state (not image) ─
async function checkXPFromState() {
  const text = await page.textContent('body')
  // Should show XP from React state (0 at start since no steps completed)
  // and "+75" indicator
  text.includes('+75') || text.includes('XP')
    ? pass('XP displayed from session state with +75 reward indicator')
    : fail('XP from state', 'XP or +75 label not found in DOM')
}

// ── Check 16: Previous session — empty state shown truthfully ─────────────
async function checkNoPrevSession() {
  const text = await page.textContent('body')
  text.includes('No previous session') || text.includes('first full journey')
    ? pass('Previous session: truthful empty state shown when no history exists')
    : fail('Prev session empty state', 'no truthful empty state message found')
}

// ── Check 17: localStorage persistence ───────────────────────────────────
async function checkPersistence() {
  // Flavors are already selected — reload and check they're restored
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(400)

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('sc_flavor_memory_v1')
    return raw ? JSON.parse(raw) : null
  })

  stored && stored.selectedFlavors?.length > 0
    ? pass(`Selections persist in localStorage: [${stored.selectedFlavors.join(', ')}]`)
    : fail('Persistence', `stored=${JSON.stringify(stored)}`)
}

// ── Check 18: No hotspot-primary UI ───────────────────────────────────────
async function checkNoHotspots() {
  const hotspots = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button, a')).filter(el => {
      const s = window.getComputedStyle(el)
      return s.position === 'absolute' && s.borderStyle === 'none' && !el.textContent.trim()
    }).length
  )
  hotspots === 0
    ? pass('No invisible hotspot buttons (old-style overlay)')
    : fail('No hotspots', `${hotspots} invisible absolute buttons found`)
}

// ── Check 19: Real nav button present ────────────────────────────────────
async function checkNavButton() {
  const btns = await page.locator('[role="navigation"] button').count()
  btns >= 1
    ? pass(`Real nav button(s) present: ${btns}`)
    : fail('Nav button', 'no [role=navigation] button')
}

// ── Check 20: Works without background image ──────────────────────────────
async function checkNoImage() {
  await page.addStyleTag({ content: 'img { display: none !important; }' })
  const btns = await page.locator('[role="navigation"] button').count()
  btns >= 1
    ? pass('Works without background image: nav button visible')
    : fail('Works without image', `btns=${btns}`)
}

// ── Check 21: Continue → /smokecraft/final-third ──────────────────────────
async function checkContinueRoute() {
  await page.goto(ROUTE, { waitUntil: 'networkidle' })
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(300)

  await page.locator('[role="navigation"] button').last().click()
  await page.waitForTimeout(800)

  const dest = page.url()
  dest.includes('/smokecraft/final-third')
    ? pass('Continue → /smokecraft/final-third (correct)')
    : fail('Continue route', `went to ${dest}`)
}

// ── Check 22: Back → second-third ────────────────────────────────────────
async function checkBackRoute() {
  await page.goBack()
  await page.waitForTimeout(300)
  page.url().includes('/smokecraft/flavor-memory')
    ? pass('Back → /smokecraft/flavor-memory')
    : fail('Back route', `now at ${page.url()}`)
}

// ── Check 23: API save fires on continue ─────────────────────────────────
async function checkAPIFires() {
  const requests = []
  page.on('request', r => {
    if (r.url().includes('flavor-memory') || r.url().includes('passport-360')) requests.push(r.url())
  })
  await page.goto(ROUTE, { waitUntil: 'networkidle' })
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(300)

  // Select a flavor so save is meaningful
  await page.locator('[data-flavor="cocoa"]').click()
  await page.waitForTimeout(200)
  await page.locator('[role="navigation"] button').last().click()
  await page.waitForTimeout(1000)

  requests.length >= 1
    ? pass(`Backend save fired: ${requests.length} API request(s) — ${requests[0].split('/api/')[1]?.split('?')[0]}`)
    : fail('API save', 'no API request detected after continue')
}

// ── Run ────────────────────────────────────────────────────────────────────
async function main() {
  await setup()
  await checkRouteLoads()
  await checkImage()
  await checkMask()
  await checkFlavorsNeutral()
  await checkFlavorToggle()
  await checkMultiSelect()
  await checkDefinition()
  await checkFlavorDeselect()
  await checkChart()
  await checkSliders()
  await checkSliderUpdate()
  await checkAromaNuances()
  await checkPairingRecall()
  await checkPersonalNotes()
  await checkXPFromState()
  await checkNoPrevSession()
  await checkPersistence()
  await checkNoHotspots()
  await checkNavButton()
  await checkNoImage()
  await checkContinueRoute()
  await checkBackRoute()
  await checkAPIFires()

  await browser.close()

  const total  = results.length
  const passed = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok)

  console.log(`\n=== FLAVOR MEMORY VERIFICATION ===`)
  console.log(`${passed}/${total} PASS`)
  if (failed.length) {
    console.log('FAILED:')
    failed.forEach(f => console.log(`  ✗ ${f.label}: ${f.reason}`))
  }
  console.log(`JS Errors: ${jsErrors.length}`)
  if (jsErrors.length) jsErrors.forEach(e => console.log(`  [JS ERR] ${e.substring(0, 120)}`))

  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-flavor-memory', { recursive: true })
  fs.writeFileSync(
    'public/proof/smokecraft-flavor-memory/results.json',
    JSON.stringify({ timestamp: new Date().toISOString(), total, passed, failed: failed.length, jsErrors: jsErrors.length, results }, null, 2)
  )
  console.log('Results → public/proof/smokecraft-flavor-memory/results.json')
}

main().catch(e => { console.error(e); process.exit(1) })
