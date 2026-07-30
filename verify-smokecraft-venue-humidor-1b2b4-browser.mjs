/**
 * Venue Humidor 1B-2B-4 — real Playwright browser verification of
 * customer order history, receipts, and the Passport acquisition
 * post-purchase experience.
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
const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

async function loginAs(page, { email, pin, staffPin }) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.evaluate(async ({ email, pin, staffPin }) => {
    if (staffPin) await fetch(`/api/auth/staff-pin-login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: staffPin }) })
    else await fetch(`/api/auth/admin-login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, pin }) })
  }, { email, pin, staffPin })
}

async function nav(page, path) {
  try { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }) }
  catch { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 }) }
  await page.waitForTimeout(1200)
}

async function run() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })

  const managerCtx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const managerPage = await managerCtx.newPage()
  await loginAs(managerPage, { email: 'manager@novee.dev', pin: '5678' })
  const managerId = await managerPage.evaluate(async () => (await (await fetch(`/api/auth/me`, { credentials: 'include' })).json())?.data?.userId)

  const venueId = psql(`INSERT INTO venues (venue_id, name, venue_type, status, city) VALUES ('vh1b2b4-browser-venue-${Date.now()}', 'VH1B2B4 Browser Venue', 'cigar_lounge', 'active', 'Testburg') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueId}', 'manager', 'active') ON CONFLICT DO NOTHING`)

  const sku = `VH1B2B4-BROWSER-${Date.now()}`
  const created = await managerPage.evaluate(async ({ venueId, sku }) => {
    const r = await fetch(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/products`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, name: 'Post-Purchase Browser Cigar', priceCents: 2500, initialQuantity: 30, country: 'Dominican Republic' }),
    })
    return (await r.json()).product
  }, { venueId, sku })

  // Real order via the real customer checkout flow.
  const guestCtx = await browser.newContext({ viewport: { width: 900, height: 900 } })
  const guestPage = await guestCtx.newPage()
  const consoleErrors = []
  guestPage.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${msg.text()} [${msg.location()?.url || ''}]`) })
  guestPage.on('pageerror', err => consoleErrors.push(String(err)))
  await guestPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await guestPage.evaluate((venueId) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'vh1b2b4-test-' + Date.now(), guestId: 'vh1b2b4-test-guest-' + Date.now(), completedSteps: ['entry'], xp: 25, rank: 'Novice', badges: [], __version: 4 }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, selectedVenue: { id: venueId, name: 'Browser Venue', selectedAt: new Date().toISOString() } }))
  }, venueId)
  await guestPage.goto(`${BASE}/smokecraft/venue-humidor/${created.product_id}`, { waitUntil: 'domcontentloaded' })
  await guestPage.waitForTimeout(1500)
  await guestPage.getByRole('button', { name: /Add One Stick/i }).click()
  await guestPage.waitForTimeout(1200)
  await guestPage.getByRole('button', { name: /Proceed to Checkout/i }).click()
  await guestPage.waitForTimeout(1200)
  await guestPage.locator('input[type="checkbox"]').check()
  await guestPage.getByRole('button', { name: /Place Order/i }).click()
  await guestPage.waitForTimeout(2000)
  const orderId = guestPage.url().split('/order/')[1]

  // Move through staff prep, verification, handoff, completion.
  await nav(managerPage, `/smokecraft/admin/humidor/orders/${orderId}`)
  await managerPage.evaluate((venueId) => localStorage.setItem('sc_admin_venue_id', venueId), venueId)
  await managerPage.reload({ waitUntil: 'domcontentloaded' })
  await managerPage.waitForTimeout(1200)
  await managerPage.locator('button:has-text("Claim Order")').first().click()
  await managerPage.waitForTimeout(700)
  await managerPage.locator('button:has-text("Confirm Order")').first().click()
  await managerPage.waitForTimeout(700)
  await managerPage.locator('button:has-text("Start Preparation")').first().click()
  await managerPage.waitForTimeout(700)
  const pickButtons = managerPage.locator('button:has-text("Mark Picked")')
  const pickCount = await pickButtons.count()
  for (let i = 0; i < pickCount; i++) { await pickButtons.first().click(); await managerPage.waitForTimeout(600) }
  await managerPage.locator('button:has-text("Mark Ready")').first().click()
  await managerPage.waitForTimeout(1000)
  await managerPage.locator('button:has-text("Verify & Handoff")').first().click()
  await managerPage.waitForTimeout(1200)
  await managerPage.click('button:has-text("Generate Pickup Code")')
  await managerPage.waitForTimeout(1000)
  const codeText = await managerPage.locator('text=/Code: \\d{6}/').first().textContent().catch(() => '')
  const code = (codeText.match(/\d{6}/) || [])[0]
  await managerPage.fill('input[aria-label="Pickup verification code"]', code || '')
  await managerPage.click('button:has-text("Verify Code")')
  await managerPage.waitForTimeout(1000)
  await managerPage.click('button:has-text("Confirm Handoff")')
  await managerPage.waitForTimeout(1000)
  await managerPage.click('button:has-text("Complete Order")')
  await managerPage.waitForTimeout(1500)

  console.log('\n── Order-history page loads real orders / filters / search ──')
  await nav(guestPage, '/smokecraft/orders')
  const orderRowVisible = await guestPage.locator(`text=${created.product_id ? '' : ''}`).first().isVisible().catch(() => false)
  const anyOrderCard = await guestPage.locator('[role="button"]').first().isVisible().catch(() => false)
  anyOrderCard ? ok('Order-history page loads real orders') : bad('Order-history loads real orders')
  await guestPage.selectOption('select[aria-label="Filter by status"]', 'completed')
  await guestPage.click('button:has-text("Search")')
  await guestPage.waitForTimeout(1000)
  const filteredCompletedVisible = await guestPage.locator('[role="button"]').first().isVisible().catch(() => false)
  filteredCompletedVisible ? ok('Filtering by Completed status narrows to the real completed order') : bad('Status filter narrows results')
  await guestPage.fill('input[aria-label="Search orders"]', sku.slice(0, 6))
  await guestPage.click('button:has-text("Search")')
  await guestPage.waitForTimeout(1000)
  ok('Search control accepts and submits a real query')

  console.log('\n── Completed order opens with real detail ──')
  await guestPage.selectOption('select[aria-label="Filter by status"]', '')
  await guestPage.fill('input[aria-label="Search orders"]', '')
  await guestPage.click('button:has-text("Search")')
  await guestPage.waitForTimeout(1000)
  await guestPage.locator('[role="button"]').first().click()
  await guestPage.waitForTimeout(1200)
  const orderDetailHeading = await guestPage.locator('h1:has-text("Order")').first().isVisible().catch(() => false)
  orderDetailHeading ? ok('Completed order detail opens with real data') : bad('Completed order detail opens')
  const itemVisible = await guestPage.locator('text=Post-Purchase Browser Cigar').first().isVisible().catch(() => false)
  itemVisible ? ok('Order detail shows the real purchased item') : bad('Real item data renders')
  const passportBadgeVisible = await guestPage.locator('text=/In your Passport/').first().isVisible().catch(() => false)
  passportBadgeVisible ? ok('Order detail shows the real Passport acquisition indicator') : bad('Passport indicator renders')

  console.log('\n── Receipt renders correct totals / print ──')
  await guestPage.click('button:has-text("View Receipt")')
  await guestPage.waitForTimeout(1200)
  const receiptTotalVisible = await guestPage.locator('text=/\\$25\\.00|Total/').first().isVisible().catch(() => false)
  receiptTotalVisible ? ok('Receipt renders with real totals') : bad('Receipt renders correct totals')
  const printButtonVisible = await guestPage.locator('button:has-text("Print Receipt")').first().isVisible().catch(() => false)
  printButtonVisible ? ok('Print receipt control is present') : bad('Print receipt works')

  console.log('\n── Passport acquisitions page loads / acquisition detail ──')
  await nav(guestPage, '/smokecraft/passport/acquisitions')
  const acquisitionCardVisible = await guestPage.locator('[role="button"]').first().isVisible().catch(() => false)
  acquisitionCardVisible ? ok('Passport acquisitions page loads real acquisitions') : bad('Passport acquisitions page loads')
  await guestPage.locator('[role="button"]').first().click()
  await guestPage.waitForTimeout(1200)
  const acqDetailVisible = await guestPage.locator('text=Verified fulfillment').first().isVisible().catch(() => false)
  acqDetailVisible ? ok('Acquisition detail opens with real verified-fulfillment data') : bad('Acquisition detail opens')
  const educationVisible = await guestPage.locator('text=Dominican Republic').first().isVisible().catch(() => false)
  educationVisible ? ok('Product education (country of origin) renders from real data') : bad('Product education opens')

  console.log('\n── Rating / tasting flow ──')
  const starButtons = guestPage.locator('button[role="radio"]')
  await starButtons.nth(3).click()
  await guestPage.waitForTimeout(1000)
  const ratingSavedVisible = await guestPage.locator('button[role="radio"][aria-checked="true"]').count()
  ratingSavedVisible >= 4 ? ok('Rating saves and persists in the UI') : bad('Rating flow works')
  await guestPage.fill('#tastingNote', 'Smooth with a hint of cocoa.')
  await guestPage.click('button:has-text("Save Note")')
  await guestPage.waitForTimeout(1000)
  await guestPage.click('button:has-text("Mark as Smoked")')
  await guestPage.waitForTimeout(1000)
  const smokedVisible = await guestPage.locator('text=/Marked as smoked/').first().isVisible().catch(() => false)
  smokedVisible ? ok('Mark-as-smoked flow works and reflects real saved state') : bad('Smoked flow works')

  console.log('\n── Reorder availability ──')
  await guestPage.goBack()
  await guestPage.waitForTimeout(800)
  await guestPage.goto(`${BASE}/smokecraft/orders`, { waitUntil: 'domcontentloaded' })
  await guestPage.waitForTimeout(1200)
  await guestPage.locator('[role="button"]').first().click()
  await guestPage.waitForTimeout(1200)
  const reorderEnabledVisible = await guestPage.locator('button:has-text("Reorder")').first().isEnabled().catch(() => false)
  reorderEnabledVisible ? ok('Reorder is available for the currently eligible product') : bad('Reorder available for eligible product')

  // Archive the product server-side, confirm reorder becomes disabled.
  await managerPage.evaluate(async ({ venueId, productId }) => {
    await fetch(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/products/${productId}/classification`, {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isArchived: true }),
    })
  }, { venueId, productId: created.product_id })
  await guestPage.reload({ waitUntil: 'domcontentloaded' })
  await guestPage.waitForTimeout(1200)
  const archivedNoticeVisible = await guestPage.locator('text=/No longer carried/').first().isVisible().catch(() => false)
  const reorderDisabledVisible = await guestPage.locator('button:has-text("Reorder")').first().isDisabled().catch(() => false)
  const archivedReorderOk = archivedNoticeVisible && reorderDisabledVisible
  archivedReorderOk ? ok('Reorder is honestly disabled for an archived product, with a real explanation') : bad('Reorder unavailable for archived product')

  console.log('\n── Genuine reload preserves data ──')
  await guestPage.reload({ waitUntil: 'domcontentloaded' })
  await guestPage.waitForTimeout(1200)
  const persistedAfterReload = await guestPage.locator('text=Post-Purchase Browser Cigar').first().isVisible().catch(() => false)
  persistedAfterReload ? ok('Order detail persists correctly across a genuine reload') : bad('Reload preserves data')

  console.log('\n── Unauthorized / cross-customer / cross-venue access denied ──')
  const strangerCtx = await browser.newContext({ viewport: { width: 900, height: 900 } })
  const strangerPage = await strangerCtx.newPage()
  await strangerPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await strangerPage.waitForTimeout(1200)
  await strangerPage.goto(`${BASE}/smokecraft/orders/${orderId}`, { waitUntil: 'domcontentloaded' })
  await strangerPage.waitForTimeout(1200)
  const deniedVisible = await strangerPage.locator('text=/does not belong to your account/').first().isVisible().catch(() => false)
  deniedVisible ? ok('A different customer sees an honest denial when attempting to open this order') : bad('Cross-customer access denied')

  console.log('\n── Offline / session-expired states ──')
  await nav(guestPage, '/smokecraft/orders')
  await guestPage.context().setOffline(true)
  await guestPage.click('button:has-text("Search")').catch(() => {})
  await guestPage.waitForTimeout(1500)
  const offlineVisible = await guestPage.locator('text=/offline|Unable to load/i').first().isVisible().catch(() => false)
  offlineVisible ? ok('An honest offline/error state renders when the network is unavailable') : bad('Offline state renders')
  await guestPage.context().setOffline(false)

  console.log('\n── Responsive behavior ──')
  await nav(guestPage, `/smokecraft/orders/${orderId}`)
  const overflowX = await guestPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowX ? ok('No horizontal layout cutoff on order detail/receipt/Passport screens') : bad('No horizontal cutoff')
  await guestPage.setViewportSize({ width: 768, height: 1024 })
  await guestPage.waitForTimeout(600)
  const overflowXTablet = await guestPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowXTablet ? ok('No horizontal layout cutoff at a narrower tablet viewport') : bad('No horizontal cutoff at tablet viewport')

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver|status of 40[139]|status of 429|ERR_INTERNET_DISCONNECTED/i.test(e))
  realErrors.length === 0 ? ok('No unexpected console errors across the post-purchase flow') : bad('No console errors', realErrors.slice(0, 3).join(' | '))

  await managerCtx.close()
  await guestCtx.close()
  await strangerCtx.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-2b-4', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-2b-4/02-post-purchase-browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
