/**
 * Venue Humidor 1B-2B-6 — investor-demo script. Walks the real, live
 * system end-to-end and captures real screenshots (no mocking, no
 * fabricated data) into public/proof/smokecraft-venue-humidor-1b-2b-6/investor-demo/.
 */
import { chromium } from 'playwright'
import { execSync } from 'child_process'
import fs from 'fs'
import 'dotenv/config'

const BASE = 'http://localhost:5000'
const EXEC = '/opt/pw-browsers/chromium'
const OUT = 'public/proof/smokecraft-venue-humidor-1b-2b-6/investor-demo'
fs.mkdirSync(OUT, { recursive: true })

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }
let step = 0
async function shot(page, label) {
  step++
  const file = `${OUT}/${String(step).padStart(2, '0')}-${label}.png`
  await page.screenshot({ path: file, fullPage: false })
  console.log(`  [${step}] ${label} -> ${file}`)
}

async function loginAs(page, { email, pin, staffPin }) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await page.evaluate(async ({ email, pin, staffPin }) => {
    if (staffPin) await fetch(`/api/auth/staff-pin-login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: staffPin }) })
    else await fetch(`/api/auth/admin-login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, pin }) })
  }, { email, pin, staffPin })
}
async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
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

  const venueId = psql(`INSERT INTO venues (venue_id, name, venue_type, status, city) VALUES ('vh1b2b6-demo-${Date.now()}', 'Investor Demo Lounge', 'cigar_lounge', 'active', 'Demo City') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueId}', 'manager', 'active') ON CONFLICT DO NOTHING`)

  const sku = `VH1B2B6-DEMO-${Date.now()}`
  const created = await managerPage.evaluate(async ({ venueId, sku }) => {
    const r = await fetch(`/api/smokecraft/venue-humidor/venues/${venueId}/admin/products`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, name: 'Investor Demo Reserve', priceCents: 3200, initialQuantity: 40, country: 'Dominican Republic', strength: 'medium_full', body: 'full', vitola: 'Toro', flavorNotes: ['cocoa', 'spice'], smokeTimeMinutes: 55 }),
    })
    return (await r.json()).product
  }, { venueId, sku })

  const guestCtx = await browser.newContext({ viewport: { width: 1200, height: 900 } })
  const guestPage = await guestCtx.newPage()
  await guestPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await guestPage.evaluate((venueId) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'vh1b2b6-demo-' + Date.now(), guestId: 'vh1b2b6-demo-guest-' + Date.now(), completedSteps: ['entry'], xp: 25, rank: 'Novice', badges: [], __version: 4 }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, selectedVenue: { id: venueId, name: 'Investor Demo Lounge', selectedAt: new Date().toISOString() } }))
  }, venueId)

  console.log('\n1-2. Venue customer browsing live inventory + product details/availability')
  await nav(guestPage, '/smokecraft/venue-humidor')
  await shot(guestPage, 'customer-browse-inventory')
  await nav(guestPage, `/smokecraft/venue-humidor/${created.product_id}`)
  await shot(guestPage, 'product-detail-availability')

  console.log('3. Inventory-aware recommendation')
  await nav(guestPage, '/smokecraft/humidor/recommendations')
  await guestPage.click('button:has-text("Get Recommendations")')
  await guestPage.waitForTimeout(1500)
  await shot(guestPage, 'recommendations')

  console.log('4. Beverage pairing')
  await nav(guestPage, '/smokecraft/humidor/pairing')
  await shot(guestPage, 'pairing')

  console.log('5. Add to cart and checkout boundary')
  await nav(guestPage, `/smokecraft/venue-humidor/${created.product_id}`)
  await guestPage.getByRole('button', { name: /Add One Stick/i }).click()
  await guestPage.waitForTimeout(1000)
  await guestPage.getByRole('button', { name: /Proceed to Checkout/i }).click()
  await guestPage.waitForTimeout(1000)
  await shot(guestPage, 'checkout')
  await guestPage.locator('input[type="checkbox"]').check()
  await guestPage.getByRole('button', { name: /Place Order/i }).click()
  await guestPage.waitForTimeout(1800)
  const orderId = guestPage.url().split('/order/')[1]
  await shot(guestPage, 'order-confirmation')

  console.log('6-9. Staff order queue, preparation/ready, verification/handoff, completion')
  await nav(managerPage, `/smokecraft/admin/humidor/orders`)
  await managerPage.evaluate((venueId) => localStorage.setItem('sc_admin_venue_id', venueId), venueId)
  await managerPage.reload({ waitUntil: 'domcontentloaded' })
  await managerPage.waitForTimeout(1200)
  await shot(managerPage, 'staff-order-queue')
  await nav(managerPage, `/smokecraft/admin/humidor/orders/${orderId}`)
  await managerPage.locator('button:has-text("Claim Order")').first().click(); await managerPage.waitForTimeout(600)
  await managerPage.locator('button:has-text("Confirm Order")').first().click(); await managerPage.waitForTimeout(600)
  await managerPage.locator('button:has-text("Start Preparation")').first().click(); await managerPage.waitForTimeout(600)
  const pickButtons = managerPage.locator('button:has-text("Mark Picked")')
  const pickCount = await pickButtons.count()
  for (let i = 0; i < pickCount; i++) { await pickButtons.first().click(); await managerPage.waitForTimeout(500) }
  await managerPage.locator('button:has-text("Mark Ready")').first().click(); await managerPage.waitForTimeout(800)
  await shot(managerPage, 'staff-order-ready')
  await managerPage.locator('button:has-text("Verify & Handoff")').first().click(); await managerPage.waitForTimeout(1000)
  await managerPage.click('button:has-text("Generate Pickup Code")'); await managerPage.waitForTimeout(800)
  const codeText = await managerPage.locator('text=/Code: \\d{6}/').first().textContent().catch(() => '')
  const code = (codeText.match(/\d{6}/) || [])[0]
  await managerPage.fill('input[aria-label="Pickup verification code"]', code || '')
  await managerPage.click('button:has-text("Verify Code")'); await managerPage.waitForTimeout(800)
  await managerPage.click('button:has-text("Confirm Handoff")'); await managerPage.waitForTimeout(800)
  await shot(managerPage, 'staff-handoff-verified')
  await managerPage.click('button:has-text("Complete Order")'); await managerPage.waitForTimeout(1200)
  await shot(managerPage, 'staff-order-completed')

  console.log('10. Inventory update')
  const avail = await managerPage.evaluate(async ({ venueId, productId }) => {
    const r = await fetch(`/api/smokecraft/venue-humidor/venues/${venueId}/products/${productId}/availability`, { credentials: 'include' })
    return (await r.json()).availability
  }, { venueId, productId: created.product_id })
  console.log('  Live availability after sale:', JSON.stringify(avail))

  console.log('11-15. Customer order history, receipt, Passport, education, reorder')
  await nav(guestPage, '/smokecraft/orders')
  await shot(guestPage, 'customer-order-history')
  await nav(guestPage, `/smokecraft/orders/${orderId}/receipt`)
  await shot(guestPage, 'customer-receipt')
  await nav(guestPage, '/smokecraft/passport/acquisitions')
  await shot(guestPage, 'customer-passport-acquisitions')
  await guestPage.locator('[role="button"]').first().click()
  await guestPage.waitForTimeout(1000)
  await shot(guestPage, 'customer-post-purchase-education')

  console.log('16. Staff assisted selling')
  await nav(managerPage, '/smokecraft/admin/humidor/assisted-selling')
  await managerPage.click('button:has-text("Get Recommendations")')
  await managerPage.waitForTimeout(1500)
  await shot(managerPage, 'staff-assisted-selling')

  console.log('17. Admin inventory controls')
  await nav(managerPage, '/smokecraft/admin/humidor')
  await shot(managerPage, 'admin-inventory-dashboard')

  console.log('18. Audit trail')
  await nav(managerPage, '/smokecraft/admin/humidor/inventory-events')
  await shot(managerPage, 'admin-audit-trail')

  console.log('19. Venue isolation proof')
  const venueIdB = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b6-demo-b-${Date.now()}', 'Investor Demo Lounge B', 'cigar_lounge', 'active') RETURNING venue_id`)
  const isolationCheck = await managerPage.evaluate(async (venueIdB) => {
    const r = await fetch(`/api/smokecraft/venue-humidor/venues/${venueIdB}/admin/orders`, { credentials: 'include' })
    return r.status
  }, venueIdB)
  console.log('  Manager (no membership in venue B) admin-orders read status:', isolationCheck, '(expected 403)')

  console.log('20. Responsive tablet presentation')
  await guestCtx.close()
  const tabletCtx = await browser.newContext({ viewport: { width: 1180, height: 820 } })
  const tabletPage = await tabletCtx.newPage()
  await tabletPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await tabletPage.evaluate((venueId) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'vh1b2b6-tablet-' + Date.now(), guestId: 'vh1b2b6-tablet-guest-' + Date.now(), completedSteps: ['entry'], xp: 25, rank: 'Novice', badges: [], __version: 4 }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, selectedVenue: { id: venueId, name: 'Investor Demo Lounge', selectedAt: new Date().toISOString() } }))
  }, venueId)
  await tabletPage.goto(`${BASE}/smokecraft/venue-humidor`, { waitUntil: 'domcontentloaded' })
  await tabletPage.waitForTimeout(1200)
  await shot(tabletPage, 'tablet-presentation-customer')
  await tabletCtx.close()

  await managerCtx.close()
  await browser.close()

  console.log(`\n=== Investor demo script completed — ${step} real screenshots captured ===\n`)
}

run().catch(err => { console.error(err); process.exit(1) })
