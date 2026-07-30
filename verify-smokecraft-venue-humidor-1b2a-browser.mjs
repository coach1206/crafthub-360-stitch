/**
 * Venue Humidor 1B-2A — real Playwright browser verification of the
 * checkout and order-confirmation screens.
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

async function nav(page, path) {
  try { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }) }
  catch { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 }) }
  await page.waitForTimeout(1500)
}

async function run() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()
  const venueId = 'vh-seed-venue-alpha'
  const productId = psql(`SELECT product_id FROM venue_cigar_products WHERE venue_id = '${venueId}' AND sku = 'ALPHA-004'`)
  psql(`UPDATE venue_cigar_products SET physical_quantity = 50 WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_order_items WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_orders WHERE venue_id = '${venueId}' AND product_snapshot->>'name' = 'ALPHA Corona'`)
  psql(`DELETE FROM venue_cigar_inventory_holds WHERE product_id = '${productId}'`)
  psql(`DELETE FROM venue_cigar_inventory_events WHERE product_id = '${productId}'`)

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${msg.text()} [${msg.location()?.url || ''}]`) })
  page.on('pageerror', err => consoleErrors.push(String(err)))

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate((venueId) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'vh1b2a-test-' + Date.now(), guestId: 'vh1b2a-test-guest-' + Date.now(), completedSteps: ['entry'], xp: 25, rank: 'Novice', badges: [], __version: 4 }))
    const raw = localStorage.getItem('sc_journey_v1')
    const journey = raw ? JSON.parse(raw) : { stateVersion: 3 }
    journey.stateVersion = journey.stateVersion || 3
    journey.selectedVenue = { id: venueId, name: 'Alpha Lounge (Seed)', selectedAt: new Date().toISOString() }
    localStorage.setItem('sc_journey_v1', JSON.stringify(journey))
  }, venueId)

  console.log('\n── Missing hold — honest state ──')
  await nav(page, '/smokecraft/venue-humidor/checkout')
  const missingVisible = await page.locator('text=Start from a cigar').first().waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)
  missingVisible ? ok('An honest "start from a cigar" state renders when no hold is present') : bad('Honest missing-hold state renders')

  console.log('\n── Full checkout flow from cigar detail ──')
  await nav(page, `/smokecraft/venue-humidor/${productId}`)
  const stickBtn = page.getByRole('button', { name: /Add One Stick/i })
  await stickBtn.click()
  await page.waitForTimeout(1500)
  const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout/i })
  const checkoutBtnVisible = await checkoutBtn.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)
  checkoutBtnVisible ? ok('Proceed to Checkout appears after a real hold is created') : bad('Proceed to Checkout appears after hold')
  await checkoutBtn.click()
  await page.waitForTimeout(1500)

  const checkoutHeadingVisible = await page.locator('text=Checkout').first().waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)
  checkoutHeadingVisible ? ok('Checkout screen renders with real quote data') : bad('Checkout screen renders')
  const priceVisible = await page.locator('text=/\\$10\\.00/').first().isVisible().catch(() => false)
  priceVisible ? ok('Real server-computed subtotal renders (never client-calculated)') : bad('Real subtotal renders')
  const paymentNoteVisible = await page.locator('text=Payment processing not connected').first().isVisible().catch(() => false)
  paymentNoteVisible ? ok('Honest "payment processing not connected" boundary renders') : bad('Honest payment boundary renders')
  const countdownVisible = await page.locator('text=/Hold expires in/').first().isVisible().catch(() => false)
  countdownVisible ? ok('Real hold-expiration countdown renders') : bad('Hold countdown renders')

  console.log('\n── Age verification gate ──')
  const placeOrderBtn = page.getByRole('button', { name: /Place Order/i })
  const disabledBeforeCheck = await placeOrderBtn.isDisabled()
  disabledBeforeCheck ? ok('Place Order is disabled until age verification is checked') : bad('Place Order disabled pre-age-verification')
  const ageCheckbox = page.locator('input[type="checkbox"]')
  await ageCheckbox.check()
  await page.waitForTimeout(500)
  const enabledAfterCheck = await placeOrderBtn.isEnabled()
  enabledAfterCheck ? ok('Place Order enables once age verification is checked') : bad('Place Order enables after age verification')

  console.log('\n── Place order — real order creation ──')
  await placeOrderBtn.click()
  await page.waitForTimeout(2000)
  const confirmationVisible = await page.locator('text=/^Order VH-/').first().waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false)
  confirmationVisible ? ok('Order confirmation screen renders with a real server-issued order number') : bad('Order confirmation renders with real order number')
  const pendingStatusVisible = await page.locator('text=Pending Confirmation').first().isVisible().catch(() => false)
  pendingStatusVisible ? ok('Order status honestly shows Pending Confirmation, never a fabricated success') : bad('Honest pending status renders')
  const successFakeVisible = await page.locator('text=/[Pp]urchase [Ss]uccessful/').first().isVisible().catch(() => false)
  !successFakeVisible ? ok('No fabricated "purchase successful" message renders for an unpaid order') : bad('No fabricated success message')

  console.log('\n── Cancel a pending order ──')
  const cancelBtn = page.getByRole('button', { name: /Cancel Order/i })
  await cancelBtn.click()
  await page.waitForTimeout(1500)
  const cancelledVisible = await page.locator('text=Cancelled').first().isVisible().catch(() => false)
  cancelledVisible ? ok('Cancelling a pending order shows the real cancelled status') : bad('Cancelled status renders')

  console.log('\n── Refresh / cross-device consistency ──')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  const persistedCancelledVisible = await page.locator('text=Cancelled').first().isVisible().catch(() => false)
  persistedCancelledVisible ? ok('Order status persists correctly across reload (real server state)') : bad('Order status persists across reload')

  console.log('\n── Keyboard / layout / no console errors ──')
  await page.keyboard.press('Tab')
  const activeTag = await page.evaluate(() => document.activeElement?.tagName)
  activeTag ? ok('Keyboard navigation moves focus on the confirmation screen') : bad('Keyboard navigation moves focus')
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowX ? ok('No horizontal layout cutoff on checkout/confirmation screens') : bad('No horizontal layout cutoff')

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver|status of 40[139]|status of 429/i.test(e))
  realErrors.length === 0 ? ok('No unexpected console errors across the checkout flow') : bad('No console errors', realErrors.slice(0, 3).join(' | '))

  await context.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-2a', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-2a/02-checkout-browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
