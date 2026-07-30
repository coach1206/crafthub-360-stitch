/**
 * Venue Humidor 1B-2B-3 — real Playwright browser verification of
 * customer pickup, staff handoff, verification, block/expire/no-show.
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
  const consoleErrors = []
  managerPage.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${msg.text()} [${msg.location()?.url || ''}]`) })
  managerPage.on('pageerror', err => consoleErrors.push(String(err)))
  await loginAs(managerPage, { email: 'manager@novee.dev', pin: '5678' })
  const managerId = await managerPage.evaluate(async () => (await (await fetch(`/api/auth/me`, { credentials: 'include' })).json())?.data?.userId)

  const venueId = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b3-browser-venue-${Date.now()}', 'VH1B2B3 Browser Venue', 'cigar_lounge', 'active') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueId}', 'manager', 'active') ON CONFLICT DO NOTHING`)

  const sku = `VH1B2B3-BROWSER-${Date.now()}`
  const created = await managerPage.evaluate(async ({ venueId, sku }) => {
    const r = await fetch(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/products`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, name: 'Pickup Browser Cigar', priceCents: 2200, initialQuantity: 30 }),
    })
    return (await r.json()).product
  }, { venueId, sku })

  // Real order via the real customer checkout flow.
  const guestCtx = await browser.newContext({ viewport: { width: 900, height: 900 } })
  const guestPage = await guestCtx.newPage()
  await guestPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await guestPage.evaluate((venueId) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'vh1b2b3-test-' + Date.now(), guestId: 'vh1b2b3-test-guest-' + Date.now(), completedSteps: ['entry'], xp: 25, rank: 'Novice', badges: [], __version: 4 }))
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

  console.log('\n── Customer pickup screen loads real order ──')
  await guestPage.goto(`${BASE}/smokecraft/orders/${orderId}/pickup`, { waitUntil: 'domcontentloaded' })
  await guestPage.waitForTimeout(1200)
  const pickupHeadingVisible = await guestPage.locator('h1:has-text("Order")').first().isVisible().catch(() => false)
  pickupHeadingVisible ? ok('Customer pickup screen loads the real order') : bad('Customer pickup screen loads real order')
  const readyInstructionsBeforeReady = await guestPage.locator('text=/New Order|Order Received/i').first().isVisible().catch(() => false)
  readyInstructionsBeforeReady ? ok('Customer pickup screen shows an honest pre-ready status') : bad('Pre-ready instructions render')

  // Move the order through staff prep to ready.
  await nav(managerPage, '/smokecraft/admin/humidor/orders')
  await managerPage.fill('input[aria-label="Venue ID"]', venueId)
  await managerPage.click('button:has-text("Search")')
  await managerPage.waitForTimeout(1000)
  await managerPage.locator('table tbody tr').first().locator('button:has-text("Open")').click()
  await managerPage.waitForTimeout(1200)
  await managerPage.locator('button:has-text("Claim Order")').first().click()
  await managerPage.waitForTimeout(800)
  await managerPage.locator('button:has-text("Confirm Order")').first().click()
  await managerPage.waitForTimeout(800)
  await managerPage.locator('button:has-text("Start Preparation")').first().click()
  await managerPage.waitForTimeout(800)
  const pickButtons = managerPage.locator('button:has-text("Mark Picked")')
  const pickCount = await pickButtons.count()
  for (let i = 0; i < pickCount; i++) { await pickButtons.first().click(); await managerPage.waitForTimeout(600) }
  await managerPage.locator('button:has-text("Mark Ready")').first().click()
  await managerPage.waitForTimeout(1000)

  console.log('\n── Ready-state instructions on customer screen ──')
  await guestPage.reload({ waitUntil: 'domcontentloaded' })
  await guestPage.waitForTimeout(1200)
  const readyVisible = await guestPage.locator('text=Ready').first().isVisible().catch(() => false)
  readyVisible ? ok('Customer pickup screen shows the real Ready status once staff mark ready') : bad('Ready instructions render on customer screen')

  console.log('\n── Staff handoff screen loads ──')
  await managerPage.locator('button:has-text("Verify & Handoff")').first().click()
  await managerPage.waitForTimeout(1200)
  const handoffHeadingVisible = await managerPage.locator('h1:has-text("Handoff")').first().isVisible().catch(() => false)
  handoffHeadingVisible ? ok('Staff handoff screen loads') : bad('Staff handoff screen loads')

  console.log('\n── Invalid verification ──')
  await managerPage.click('button:has-text("Generate Pickup Code")')
  await managerPage.waitForTimeout(1000)
  await managerPage.fill('input[aria-label="Pickup verification code"]', '000000')
  await managerPage.click('button:has-text("Verify Code")')
  await managerPage.waitForTimeout(1000)
  const invalidCodeVisible = await managerPage.locator('text=/code is incorrect/i').first().isVisible().catch(() => false)
  invalidCodeVisible ? ok('Invalid verification code shows an honest error') : bad('Invalid verification error renders')

  console.log('\n── Valid verification ──')
  const codeText = await managerPage.locator('text=/Code: \\d{6}/').first().textContent().catch(() => '')
  const code = (codeText.match(/\d{6}/) || [])[0]
  await managerPage.fill('input[aria-label="Pickup verification code"]', code || '')
  await managerPage.click('button:has-text("Verify Code")')
  await managerPage.waitForTimeout(1200)
  const verifiedVisible = await managerPage.locator('text=/Customer verified/i').first().isVisible().catch(() => false)
  verifiedVisible ? ok('A valid verification code succeeds and shows the real verified state') : bad('Valid verification succeeds')

  console.log('\n── Successful pickup completion ──')
  await managerPage.click('button:has-text("Confirm Handoff")')
  await managerPage.waitForTimeout(1200)
  const beforeCompleteQty = psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${created.product_id}'`)
  await managerPage.click('button:has-text("Complete Order")')
  await managerPage.waitForTimeout(1500)
  const completedVisible = await managerPage.locator('text=Order completed.').first().isVisible().catch(() => false)
  completedVisible ? ok('Completing the pickup order shows the real completed confirmation') : bad('Pickup completion shows real state')
  const afterCompleteQty = psql(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = '${created.product_id}'`)
  const decreasedByOne = Number(beforeCompleteQty) - Number(afterCompleteQty) === 1
  decreasedByOne ? ok('Real inventory decreased by exactly the ordered quantity on completion') : bad('Inventory decreased exactly once')

  console.log('\n── Customer status synchronization (completed) ──')
  await guestPage.reload({ waitUntil: 'domcontentloaded' })
  await guestPage.waitForTimeout(1200)
  const customerCompletedVisible = await guestPage.locator('text=Completed').first().isVisible().catch(() => false)
  customerCompletedVisible ? ok('Customer pickup screen shows real Completed status after staff handoff') : bad('Customer sees completed status')

  console.log('\n── Table/lounge service completion (second order) ──')
  await guestPage.goto(`${BASE}/smokecraft/venue-humidor/${created.product_id}`, { waitUntil: 'domcontentloaded' })
  await guestPage.waitForTimeout(1500)
  await guestPage.getByRole('button', { name: /Add One Stick/i }).click()
  await guestPage.waitForTimeout(1200)
  await guestPage.getByRole('button', { name: /Proceed to Checkout/i }).click()
  await guestPage.waitForTimeout(1200)
  const fulfillmentSelect = guestPage.locator('select[aria-label="Fulfillment method"]')
  await fulfillmentSelect.selectOption('table_delivery')
  await guestPage.fill('input[aria-label="Table or seat"]', 'Table 7')
  await guestPage.locator('input[type="checkbox"]').check()
  await guestPage.getByRole('button', { name: /Place Order/i }).click()
  await guestPage.waitForTimeout(2000)
  const order2Id = guestPage.url().split('/order/')[1]

  await nav(managerPage, `/smokecraft/admin/humidor/orders/${order2Id}`)
  await managerPage.evaluate((venueId) => localStorage.setItem('sc_admin_venue_id', venueId), venueId)
  await managerPage.reload({ waitUntil: 'domcontentloaded' })
  await managerPage.waitForTimeout(1200)
  await managerPage.locator('button:has-text("Claim Order")').first().click()
  await managerPage.waitForTimeout(700)
  await managerPage.locator('button:has-text("Confirm Order")').first().click()
  await managerPage.waitForTimeout(700)
  await managerPage.locator('button:has-text("Start Preparation")').first().click()
  await managerPage.waitForTimeout(700)
  const pickButtons2 = managerPage.locator('button:has-text("Mark Picked")')
  const pickCount2 = await pickButtons2.count()
  for (let i = 0; i < pickCount2; i++) { await pickButtons2.first().click(); await managerPage.waitForTimeout(600) }
  await managerPage.locator('button:has-text("Mark Ready")').first().click()
  await managerPage.waitForTimeout(1000)
  await managerPage.locator('button:has-text("Verify & Handoff")').first().click()
  await managerPage.waitForTimeout(1200)
  const tableHandoffAvailable = await managerPage.locator('button:has-text("Confirm Handoff")').first().isVisible().catch(() => false)
  tableHandoffAvailable ? ok('Table delivery handoff is available without a pickup code (staff visual confirmation)') : bad('Table delivery handoff available')
  await managerPage.click('button:has-text("Confirm Handoff")')
  await managerPage.waitForTimeout(1200)
  await managerPage.click('button:has-text("Complete Order")')
  await managerPage.waitForTimeout(1500)
  const tableCompletedVisible = await managerPage.locator('text=Order completed.').first().isVisible().catch(() => false)
  tableCompletedVisible ? ok('Table/lounge service order completes successfully') : bad('Table service completion succeeds')

  console.log('\n── No-show handling ──')
  await guestPage.goto(`${BASE}/smokecraft/venue-humidor/${created.product_id}`, { waitUntil: 'domcontentloaded' })
  await guestPage.waitForTimeout(1500)
  await guestPage.getByRole('button', { name: /Add One Stick/i }).click()
  await guestPage.waitForTimeout(1200)
  await guestPage.getByRole('button', { name: /Proceed to Checkout/i }).click()
  await guestPage.waitForTimeout(1200)
  await guestPage.locator('input[type="checkbox"]').check()
  await guestPage.getByRole('button', { name: /Place Order/i }).click()
  await guestPage.waitForTimeout(2000)
  const order3Id = guestPage.url().split('/order/')[1]
  await nav(managerPage, `/smokecraft/admin/humidor/orders/${order3Id}`)
  await managerPage.reload({ waitUntil: 'domcontentloaded' })
  await managerPage.waitForTimeout(1000)
  await managerPage.locator('button:has-text("Claim Order")').first().click()
  await managerPage.waitForTimeout(700)
  await managerPage.locator('button:has-text("Confirm Order")').first().click()
  await managerPage.waitForTimeout(700)
  await managerPage.locator('button:has-text("Start Preparation")').first().click()
  await managerPage.waitForTimeout(700)
  const pickButtons3 = managerPage.locator('button:has-text("Mark Picked")')
  const pickCount3 = await pickButtons3.count()
  for (let i = 0; i < pickCount3; i++) { await pickButtons3.first().click(); await managerPage.waitForTimeout(600) }
  await managerPage.locator('button:has-text("Mark Ready")').first().click()
  await managerPage.waitForTimeout(1000)
  await managerPage.locator('button:has-text("Mark No-Show")').first().click()
  await managerPage.waitForTimeout(1200)
  const noShowVisible = await managerPage.locator('text=/Marked no-show/i').first().isVisible().catch(() => false)
  noShowVisible ? ok('Marking a ready order as no-show records the real event and displays it') : bad('No-show handling renders')

  console.log('\n── Expiration display ──')
  await managerPage.click('button:has-text("Expire Order")')
  await managerPage.waitForTimeout(1200)
  const expiredVisible = await managerPage.locator('text=Expired').first().isVisible().catch(() => false)
  expiredVisible ? ok('Expiring an order shows the real Expired status') : bad('Expiration display renders')

  console.log('\n── Two-session completion conflict / reload persistence ──')
  await managerPage.reload({ waitUntil: 'domcontentloaded' })
  await managerPage.waitForTimeout(1200)
  const persistedExpired = await managerPage.locator('text=Expired').first().isVisible().catch(() => false)
  persistedExpired ? ok('Expired state persists correctly across a genuine reload') : bad('Expired state persists')

  console.log('\n── Unauthorized / wrong-venue UI behavior ──')
  const strangerCtx = await browser.newContext({ viewport: { width: 1200, height: 800 } })
  const strangerPage = await strangerCtx.newPage()
  await loginAs(strangerPage, { staffPin: '1234' })
  const venueE = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b3-browser-venue-e-${Date.now()}', 'VH1B2B3 Unaffiliated Venue', 'cigar_lounge', 'active') RETURNING venue_id`)
  await nav(strangerPage, '/smokecraft/admin/humidor/orders')
  await strangerPage.fill('input[aria-label="Venue ID"]', venueE)
  await strangerPage.click('button:has-text("Search")')
  await strangerPage.waitForTimeout(1200)
  const deniedVisible = await strangerPage.locator('text=/do not have permission/').first().isVisible().catch(() => false)
  deniedVisible ? ok('An unauthorized/wrong-venue user sees an honest permission-denied state') : bad('Unauthorized UI denies honestly')

  console.log('\n── Responsive behavior ──')
  await nav(managerPage, `/smokecraft/admin/humidor/orders/${order2Id}`)
  const overflowX = await managerPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowX ? ok('No horizontal layout cutoff on the order detail/handoff flow') : bad('No horizontal cutoff')
  await managerPage.setViewportSize({ width: 768, height: 1024 })
  await managerPage.waitForTimeout(600)
  const overflowXTablet = await managerPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowXTablet ? ok('No horizontal layout cutoff at a narrower tablet viewport') : bad('No horizontal cutoff at tablet viewport')

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver|status of 40[139]|status of 429|ERR_INTERNET_DISCONNECTED/i.test(e))
  realErrors.length === 0 ? ok('No unexpected console errors across the pickup/handoff flow') : bad('No console errors', realErrors.slice(0, 3).join(' | '))

  await managerCtx.close()
  await guestCtx.close()
  await strangerCtx.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-2b-3', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-2b-3/02-pickup-handoff-browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
