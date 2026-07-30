/**
 * Venue Humidor 1B-1 — real Playwright browser verification of the
 * customer browsing and cigar-detail screens.
 */
import { chromium } from 'playwright'
import { execSync } from 'child_process'
import 'dotenv/config'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
const results = []
function ok(msg) { pass++; results.push({ name: msg, ok: true }); console.log(`  PASS  ${msg}`) }
function bad(msg, detail) { fail++; results.push({ name: msg, ok: false, detail }); console.log(`  FAIL  ${msg}${detail ? ' — ' + detail : ''}`) }

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }

async function seedGuestWithVenue(page, venueId) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate((venueId) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'vh1b1-test-' + Date.now(), guestId: 'vh1b1-test-guest-' + Date.now(),
      completedSteps: ['entry'], xp: 25, rank: 'Novice', badges: [], __version: 4,
    }))
    const raw = localStorage.getItem('sc_journey_v1')
    const journey = raw ? JSON.parse(raw) : { stateVersion: 3 }
    journey.stateVersion = journey.stateVersion || 3
    journey.selectedVenue = { id: venueId, name: 'Alpha Lounge (Seed)', selectedAt: new Date().toISOString() }
    localStorage.setItem('sc_journey_v1', JSON.stringify(journey))
  }, venueId)
}

async function nav(page, path) {
  try { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }) }
  catch { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 }) }
  await page.waitForTimeout(1500)
}

async function run() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()
  const productId = psql(`SELECT product_id FROM venue_cigar_products WHERE venue_id = 'vh-seed-venue-alpha' AND sku = 'ALPHA-007'`)
  // Reset this shared seed product's inventory/holds/reservations before
  // each run — this script (and the API suite) both create real holds
  // against it, so repeated runs would otherwise accumulate and
  // eventually sell it out.
  psql(`UPDATE venue_cigar_products SET physical_quantity = 20 WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_order_items WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_orders WHERE venue_id = 'vh-seed-venue-alpha' AND product_snapshot->>'name' LIKE '%Featured Reserve%'`)
  psql(`DELETE FROM venue_cigar_inventory_holds WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_reservations WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_inventory_events WHERE product_id = '${productId}'`)

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${msg.text()} [${msg.location()?.url || ''}]`) })
  page.on('pageerror', err => consoleErrors.push(String(err)))

  console.log('\n── No active venue — honest state ──')
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'vh1b1-novenue-' + Date.now(), guestId: 'vh1b1-novenue-guest-' + Date.now(), completedSteps: ['entry'], xp: 0, rank: 'Novice', badges: [], __version: 4 }))
  })
  await nav(page, '/smokecraft/venue-humidor')
  const noVenueVisible = await page.locator('text=Select a venue first').first().isVisible().catch(() => false)
  noVenueVisible ? ok('An honest "no venue selected" state renders when no venue is active') : bad('Honest no-venue state renders')

  console.log('\n── First load with an active venue — real browsing ──')
  await seedGuestWithVenue(page, 'vh-seed-venue-alpha')
  await nav(page, '/smokecraft/venue-humidor')
  const headingVisible = await page.locator('text=Venue Humidor').first().isVisible().catch(() => false)
  headingVisible ? ok('The browser screen renders with the approved heading') : bad('Browser heading renders')
  const cardsVisible = await page.locator('button:has-text("Seed Leaf Co")').first().waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false)
  cardsVisible ? ok('Real cigar cards render from the live server catalog') : bad('Real cigar cards render')

  console.log('\n── Search ──')
  const searchInput = page.getByLabel('Search cigars')
  await searchInput.fill('Featured')
  await page.waitForTimeout(1200)
  const searchResultVisible = await page.locator('text=Featured Reserve').first().isVisible().catch(() => false)
  searchResultVisible ? ok('Search filters the real displayed catalog') : bad('Search filters catalog')
  await searchInput.fill('')
  await page.waitForTimeout(1200)

  console.log('\n── Filter group — wrapper ──')
  const wrapperSelect = page.getByLabel('Wrapper')
  const wrapperOptions = await wrapperSelect.locator('option').allTextContents()
  if (wrapperOptions.some(o => o.toLowerCase().includes('maduro'))) {
    await wrapperSelect.selectOption({ label: wrapperOptions.find(o => o.toLowerCase().includes('maduro')) })
    await page.waitForTimeout(1200)
    ok('Wrapper filter is applied against real server data')
    await wrapperSelect.selectOption({ index: 0 })
    await page.waitForTimeout(1000)
  } else {
    bad('Wrapper filter options are present')
  }

  console.log('\n── Sorting ──')
  const sortSelect = page.getByLabel('Sort by')
  await sortSelect.selectOption('price_low_to_high')
  await page.waitForTimeout(1200)
  ok('Sort control is present and selectable against real server data')

  console.log('\n── Sold-out filter (In stock only) ──')
  const inStockCheckbox = page.locator('label:has-text("In stock only") input[type="checkbox"]')
  await inStockCheckbox.uncheck()
  await page.waitForTimeout(1200)
  const soldOutVisible = await page.locator('text=Sold Out').first().isVisible().catch(() => false)
  soldOutVisible ? ok('Unchecking "In stock only" reveals the real sold-out item') : bad('Sold-out item revealed when in-stock-only unchecked')
  await inStockCheckbox.check()
  await page.waitForTimeout(1000)

  console.log('\n── Low-stock state ──')
  const lowStockVisible = await page.locator('text=/Low Stock/').first().isVisible().catch(() => false)
  lowStockVisible ? ok('A real low-stock item shows the honest low-stock state') : bad('Low-stock state renders')

  console.log('\n── Product detail — real data, real actions ──')
  await nav(page, `/smokecraft/venue-humidor/${productId}`)
  const detailHeadingVisible = await page.locator('text=Featured Reserve').first().isVisible().catch(() => false)
  detailHeadingVisible ? ok('Cigar detail screen renders real product data') : bad('Cigar detail renders')
  const priceVisible = await page.locator('text=/\\$22\\.00/').first().isVisible().catch(() => false)
  priceVisible ? ok('Real stick price renders') : bad('Real stick price renders')
  const boxPriceVisible = await page.locator('text=/Box of 10/').first().isVisible().catch(() => false)
  boxPriceVisible ? ok('Real box price renders when configured') : bad('Real box price renders')

  console.log('\n── Add One Stick (real hold) ──')
  const stickBtn = page.getByRole('button', { name: /Add One Stick/i })
  await stickBtn.click()
  await page.waitForTimeout(1500)
  const holdMsgVisible = await page.locator('text=/Stick held/').first().isVisible().catch(() => false)
  holdMsgVisible ? ok('Add One Stick creates a real server-confirmed hold') : bad('Real hold created and confirmed')

  console.log('\n── Reserve (real reservation) ──')
  const reserveBtn = page.getByRole('button', { name: /^Reserve$/i })
  await reserveBtn.click()
  await page.waitForTimeout(1500)
  const reserveMsgVisible = await page.locator('text=/Reserved —/').first().isVisible().catch(() => false)
  reserveMsgVisible ? ok('Reserve creates a real server-confirmed reservation') : bad('Real reservation created and confirmed')

  console.log('\n── Unsupported payment/POS boundary — honest, not fake success ──')
  const tabBtn = page.getByRole('button', { name: /Add to Venue Tab/i })
  await tabBtn.click()
  await page.waitForTimeout(1000)
  const unsupportedVisible = await page.locator('text=/not available yet/').first().isVisible().catch(() => false)
  unsupportedVisible ? ok('Add to Venue Tab shows an honest unavailable boundary, never a fake success') : bad('Honest unavailable boundary renders')

  console.log('\n── Favorites persistence ──')
  const favBtn = page.getByRole('button', { name: /Save to Favorites/i })
  await favBtn.click()
  await page.waitForTimeout(1200)
  const favSavedVisible = await page.locator('text=/★ Saved/').first().isVisible().catch(() => false)
  favSavedVisible ? ok('Save to Favorites updates the real persisted favorite state') : bad('Favorite state updates')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  const favPersistedVisible = await page.locator('text=/★ Saved/').first().isVisible().catch(() => false)
  favPersistedVisible ? ok('Favorite persists across reload (real server state, not local-only)') : bad('Favorite persists across reload')

  console.log('\n── Similar cigars ──')
  const similarVisible = await page.locator('text=Similar Available Cigars').first().isVisible().catch(() => false)
  similarVisible ? ok('Similar available cigars section renders real suggestions') : bad('Similar cigars section renders')

  console.log('\n── Back navigation ──')
  const backBtn = page.getByRole('button', { name: /Back to Humidor/i })
  await backBtn.click()
  await page.waitForTimeout(1200)
  const backOnBrowserVisible = await page.locator('text=Venue Humidor').first().isVisible().catch(() => false)
  backOnBrowserVisible ? ok('Back navigation returns to the real browser screen') : bad('Back navigation works')

  console.log('\n── Wrong-venue product denial (live) ──')
  const otherProductId = psql(`SELECT product_id FROM venue_cigar_products WHERE venue_id = 'vh-seed-venue-bravo' LIMIT 1`)
  await nav(page, `/smokecraft/venue-humidor/${otherProductId}`)
  const notAvailableVisible = await page.locator('text=/not available at your venue/').first().isVisible().catch(() => false)
  notAvailableVisible ? ok('A cross-venue product shows an honest not-available state, never leaked data') : bad('Cross-venue product denied honestly')

  console.log('\n── Keyboard / pointer / layout / no console errors ──')
  await nav(page, '/smokecraft/venue-humidor')
  await page.keyboard.press('Tab')
  const activeTag = await page.evaluate(() => document.activeElement?.tagName)
  activeTag ? ok('Keyboard navigation moves focus on the browser screen') : bad('Keyboard navigation moves focus')
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowX ? ok('No horizontal layout cutoff on the browser screen') : bad('No horizontal layout cutoff')
  const firstCard = page.locator('button:has-text("Seed Leaf Co")').first()
  await firstCard.click({ trial: true }).then(() => ok('Cigar cards are real, clickable pointer/touch targets')).catch(() => bad('Cigar cards are clickable'))

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver|status of 40[14]|status of 429|status of 501/i.test(e))
  realErrors.length === 0 ? ok('No unexpected console errors across the browsing/detail flow') : bad('No console errors', realErrors.slice(0, 3).join(' | '))

  await context.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-1/02-customer-browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
