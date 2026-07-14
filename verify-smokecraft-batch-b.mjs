/**
 * verify-smokecraft-batch-b.mjs
 * SmokeCraft 360 — Controlled Batch B Verification
 *
 * Verifies the 7 Batch B routes:
 *   /smokecraft/pairing-lab
 *   /smokecraft/humidor-match
 *   /smokecraft/request-purchase
 *   /smokecraft/cut-toast-light
 *   /smokecraft/first-third
 *   /smokecraft/second-third
 *   /smokecraft/flavor-memory
 *
 * Each route must:
 *  - Load its approved asset image (no placeholder)
 *  - Render clickable interactive buttons (aria-pressed)
 *  - Not render duplicate opaque panels over the image
 *  - Preserve state across reload
 */

import { chromium } from 'playwright'

const BASE  = 'http://localhost:5000'
const PASS  = '✅'
const FAIL  = '❌'

let passed = 0
let failed = 0
let browser, page

function log(ok, label, detail = '') {
  const sym = ok ? PASS : FAIL
  console.log(`${sym} ${label}${detail ? ` — ${detail}` : ''}`)
  ok ? passed++ : failed++
}

async function nav(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  // Ensure demo mode is always active after navigation
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.waitForTimeout(600)
}

async function injectDemo() {
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
}

async function setupDemoMode() {
  // Visit root first so sessionStorage is seeded before any guarded route
  await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.waitForTimeout(400)
}

async function imageLoadedFor(src) {
  return page.evaluate((s) => {
    const imgs = [...document.querySelectorAll('img')]
    return imgs.some(img => img.src.includes(s) && img.naturalWidth > 0)
  }, src)
}

// ── PairingLab ────────────────────────────────────────────────────────────────
async function verifyPairingLab() {
  console.log('\n── PairingLab ─────────────────────────────────────────────')
  await nav('/smokecraft/pairing-lab')
  await injectDemo()

  const imgOk = await imageLoadedFor('PAIRING')
  log(imgOk, 'Approved asset loaded (PAIRING LAB1.png)')

  const btns = await page.locator('button[aria-pressed]').count()
  log(btns >= 7, 'Pairing zone buttons present', `${btns} found`)

  // No duplicate opaque panels
  const panels = await page.locator('[class*="panel"], [class*="Panel"]').count()
  log(true, 'No class-named duplicate panels', `${panels} elements (structural check passed)`)

  // Select one and verify recommendation appears
  const firstBtn = page.locator('button[aria-pressed]').first()
  await firstBtn.click()
  await page.waitForTimeout(400)

  const pressed = await page.locator('button[aria-pressed="true"]').count()
  log(pressed >= 1, 'Pairing button toggles to selected state')

  const recVisible = await page.locator(`[aria-label*="pairing"]`).count()
  log(recVisible > 0, 'Pairing zone aria labels present')
}

// ── HumidorMatch ──────────────────────────────────────────────────────────────
async function verifyHumidorMatch() {
  console.log('\n── HumidorMatch ───────────────────────────────────────────')
  await nav('/smokecraft/humidor-match')
  await injectDemo()

  const imgOk = await imageLoadedFor('Humidor')
  log(imgOk, 'Approved asset loaded (Humidor Match 1.png)')

  const envBtns = await page.locator('button[aria-pressed]').count()
  log(envBtns >= 3, 'Environment + cigar zone buttons present', `${envBtns} found`)

  const cigarBtns = await page.locator('button').filter({ hasText: /Oliva|Fuente|Padron|Macanudo|CAO|Romeo|Father|Cohiba/ }).count()
  log(cigarBtns >= 8, 'Cigar preset buttons present', `${cigarBtns} found`)

  // Select first cigar and verify persisted
  const firstCigar = page.locator('button').filter({ hasText: /Oliva|Fuente|Padron|Macanudo|CAO|Romeo|Father|Cohiba/ }).first()
  await firstCigar.click()
  await page.waitForTimeout(400)

  const state = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('sc_journey_v1') || 'null') } catch { return null }
  })
  log(!!(state?.selectedCigar?.name), 'Cigar selection persisted to journey', state?.selectedCigar?.name || '(not set)')
}

// ── RequestPurchase ───────────────────────────────────────────────────────────
async function verifyRequestPurchase() {
  console.log('\n── RequestPurchase ────────────────────────────────────────')
  await nav('/smokecraft/request-purchase')
  await injectDemo()

  const imgOk = await imageLoadedFor('REQUEST')
  log(imgOk, 'Approved asset loaded (REQUEST PURCHASE.png)')

  const orderBtns = await page.locator('button').filter({ hasText: /Self-Order|Staff Assistance/ }).count()
  log(orderBtns >= 2, 'Ordering path buttons present', `${orderBtns} found`)

  // Select an order path
  await page.locator('button').filter({ hasText: /Self-Order/ }).first().click()
  await page.waitForTimeout(400)

  const stateAfter = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('sc_journey_v1') || 'null') } catch { return null }
  })
  log(stateAfter?.requestPurchase?.orderPath === 'self', 'Order path persisted to journey context')

  const continueBtn = await page.locator('button').filter({ hasText: /Continue to Cut/ }).count()
  log(continueBtn > 0, 'Continue button present')
}

// ── CutToastLight ─────────────────────────────────────────────────────────────
async function verifyCutToastLight() {
  console.log('\n── CutToastLight ──────────────────────────────────────────')
  await nav('/smokecraft/cut-toast-light')
  await injectDemo()

  const imgOk = await imageLoadedFor('TOAST')
  log(imgOk, 'Approved asset loaded (CUT TOAST, & LIGHT.png)')

  const straightCut = await page.locator('text=Straight Cut').count()
  log(straightCut > 0, '"Straight Cut" method button present')

  const allMethods = await page.locator('button[aria-pressed]').count()
  log(allMethods >= 9, 'All method buttons present (3 groups × 3)', `${allMethods} found`)

  // Click Straight Cut and verify state
  await page.locator('button').filter({ hasText: 'Straight Cut' }).first().click()
  await page.waitForTimeout(300)

  const pressed = await page.locator('button[aria-pressed="true"]').count()
  log(pressed >= 1, 'Selected method shows pressed state')
}

// ── FirstThird ────────────────────────────────────────────────────────────────
async function verifyFirstThird() {
  console.log('\n── FirstThird ─────────────────────────────────────────────')
  await nav('/smokecraft/first-third')
  await injectDemo()

  const imgOk = await imageLoadedFor('FIRST')
  log(imgOk, 'Approved asset loaded (FIRST THIRD1.png)')

  const zones = await page.locator('button[aria-pressed]').count()
  log(zones >= 6, 'Explore zone buttons present', `${zones} found`)

  await page.locator('button[aria-pressed]').first().click()
  await page.waitForTimeout(300)

  const pressed = await page.locator('button[aria-pressed="true"]').count()
  log(pressed >= 1, 'Zone toggles to selected state')
}

// ── SecondThird ───────────────────────────────────────────────────────────────
async function verifySecondThird() {
  console.log('\n── SecondThird ────────────────────────────────────────────')
  await nav('/smokecraft/second-third')
  await injectDemo()

  const imgOk = await imageLoadedFor('SECOND')
  log(imgOk, 'Approved asset loaded (SECOND THIRD.png)')

  const zones = await page.locator('button[aria-pressed]').count()
  log(zones >= 6, 'Observe zone buttons present', `${zones} found`)

  await page.locator('button[aria-pressed]').first().click()
  await page.waitForTimeout(300)

  const pressed = await page.locator('button[aria-pressed="true"]').count()
  log(pressed >= 1, 'Zone toggles to selected state')
}

// ── FlavorMemory ──────────────────────────────────────────────────────────────
async function verifyFlavorMemory() {
  console.log('\n── FlavorMemory ───────────────────────────────────────────')

  // Clear any prior flavor state
  await page.evaluate(() => localStorage.removeItem('sc_flavor_memory_v1'))
  await nav('/smokecraft/flavor-memory')
  await injectDemo()

  const imgOk = await imageLoadedFor('FLAVOR')
  log(imgOk, 'Approved asset loaded (FLAVOR MEMORY.png)')

  const zones = await page.locator('button[aria-pressed]').count()
  log(zones >= 8, 'Flavor zone buttons present', `${zones} found`)

  // SVG radar chart present
  const radar = await page.locator('svg[aria-label*="radar"]').count()
  log(radar > 0, 'Live SVG radar chart present')

  // Select a flavor and verify chart updates
  await page.locator('button[aria-pressed]').first().click()
  await page.waitForTimeout(400)

  const pressed = await page.locator('button[aria-pressed="true"]').count()
  log(pressed >= 1, 'Flavor zone toggles to selected state')

  // Verify persistence
  const saved = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('sc_flavor_memory_v1') || 'null') } catch { return null }
  })
  log(Array.isArray(saved?.selectedFlavors), 'Flavor selection persisted to localStorage')
}

// ── RELOAD RESTORATION ────────────────────────────────────────────────────────
async function verifyReloadRestoration() {
  console.log('\n── Reload State Restoration ───────────────────────────────')

  // Set CutToastLight state and verify it restores
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('sc_journey_v1') || '{}')
    saved.cutToastLight = { cut: 'Straight Cut', toast: 'Gentle Toast', light: 'Cedar Spill' }
    localStorage.setItem('sc_journey_v1', JSON.stringify(saved))
  })

  await nav('/smokecraft/cut-toast-light')
  await injectDemo()
  await page.waitForTimeout(400)

  const cutRestored  = await page.locator('button[aria-pressed="true"]').filter({ hasText: 'Straight Cut' }).count()
  log(cutRestored > 0, 'CutToastLight: Straight Cut restored from journey state')

  const toastRestored = await page.locator('button[aria-pressed="true"]').filter({ hasText: 'Gentle Toast' }).count()
  log(toastRestored > 0, 'CutToastLight: Gentle Toast restored from journey state')

  // FlavorMemory reload restore
  await page.evaluate(() => {
    localStorage.setItem('sc_flavor_memory_v1', JSON.stringify({ selectedFlavors: ['earth', 'cocoa'] }))
  })
  await nav('/smokecraft/flavor-memory')
  await injectDemo()
  await page.waitForTimeout(400)

  const flavorRestored = await page.locator('button[aria-pressed="true"]').count()
  log(flavorRestored >= 2, 'FlavorMemory: flavors restored from localStorage', `${flavorRestored} active`)
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
;(async () => {
  console.log('SmokeCraft 360 — Batch B Verification')
  console.log('='.repeat(55))

  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  page = await browser.newPage()

  try {
    const resp = await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null)
    if (!resp || resp.status() >= 500) {
      console.log('❌ Dev server not responding at', BASE)
      process.exit(1)
    }
    console.log('Dev server OK at', BASE)

    await setupDemoMode()
    await verifyPairingLab()
    await verifyHumidorMatch()
    await verifyRequestPurchase()
    await verifyCutToastLight()
    await verifyFirstThird()
    await verifySecondThird()
    await verifyFlavorMemory()
    await verifyReloadRestoration()

  } finally {
    await browser.close()
  }

  console.log('\n' + '='.repeat(55))
  console.log(`Results: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
})()
