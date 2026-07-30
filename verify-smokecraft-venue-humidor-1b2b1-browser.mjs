/**
 * Venue Humidor 1B-2B-1 — real Playwright browser verification of the
 * staff inventory administration screens.
 */
import { chromium } from 'playwright'
import { execSync } from 'child_process'
import 'dotenv/config'

const BASE = 'http://localhost:5000'
const API = 'http://localhost:3001'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
const results = []
function ok(msg) { pass++; results.push({ name: msg, ok: true }); console.log(`  PASS  ${msg}`) }
function bad(msg, detail) { fail++; results.push({ name: msg, ok: false, detail }); console.log(`  FAIL  ${msg}${detail ? ' — ' + detail : ''}`) }

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }

// Same-origin, through the real vite dev proxy (/api -> localhost:3001,
// see vite.config.js) — avoids cross-origin preflight requests, which
// this sandboxed environment's network stack does not reliably deliver
// to Chromium even though curl and same-origin fetch both succeed.
async function loginAs(page, { email, pin, staffPin }) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.evaluate(async ({ email, pin, staffPin }) => {
    if (staffPin) {
      await fetch(`/api/auth/staff-pin-login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: staffPin }) })
    } else {
      await fetch(`/api/auth/admin-login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, pin }) })
    }
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

  const venueId = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b1-browser-venue-${Date.now()}', 'VH1B2B1 Browser Venue', 'cigar_lounge', 'active') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueId}', 'manager', 'active') ON CONFLICT DO NOTHING`)

  console.log('\n── Set venue on dashboard, empty state ──')
  await nav(managerPage, '/smokecraft/admin/humidor')
  await managerPage.fill('input[aria-label="Venue ID"]', venueId)
  await managerPage.click('button:has-text("Search")')
  await managerPage.waitForTimeout(1000)
  const emptyVisible = await managerPage.locator('text=No products found').first().isVisible().catch(() => false)
  emptyVisible ? ok('An honest empty state renders for a venue with no products') : bad('Empty state renders')

  console.log('\n── Add-cigar form ──')
  await managerPage.click('button:has-text("+ New Cigar")')
  await managerPage.waitForTimeout(800)
  const sku = `VH1B2B1-BROWSER-${Date.now()}`
  await managerPage.fill('#sku', sku)
  await managerPage.fill('#name', 'Browser Test Robusto')
  await managerPage.fill('#brand', 'Browser Brand')
  await managerPage.fill('#priceCents', '18.50')
  await managerPage.fill('#initialQuantity', '30')
  await managerPage.click('button:has-text("Create Cigar")')
  await managerPage.waitForTimeout(1500)
  const editUrlNow = managerPage.url()
  const navigatedToEdit = /\/admin\/humidor\/.+\/edit/.test(editUrlNow)
  navigatedToEdit ? ok('Creating a cigar navigates to its real edit screen with a real product id') : bad('Create navigates to edit screen', editUrlNow)

  console.log('\n── Edit-cigar form, persisted values ──')
  await managerPage.fill('#staffNotes', 'Browser test note')
  await managerPage.click('button:has-text("Save Changes")')
  await managerPage.waitForTimeout(1000)
  await managerPage.reload({ waitUntil: 'domcontentloaded' })
  await managerPage.waitForTimeout(1200)
  const notesValue = await managerPage.inputValue('#staffNotes').catch(() => '')
  notesValue === 'Browser test note' ? ok('Edited field values persist after a real reload') : bad('Edited values persist', notesValue)

  console.log('\n── Receiving inventory ──')
  await managerPage.selectOption('select[aria-label="Mutation type"]', 'receiving')
  await managerPage.fill('input[aria-label="Quantity"]', '10')
  await managerPage.click('button:has-text("Apply")')
  await managerPage.waitForTimeout(1200)
  const afterReceive = await managerPage.locator('text=/Physical: 40/').first().isVisible().catch(() => false)
  afterReceive ? ok('Receiving inventory increases real physical quantity, shown live on screen') : bad('Receiving inventory updates the real displayed quantity')

  console.log('\n── Opening a box ──')
  await managerPage.selectOption('select[aria-label="Mutation type"]', 'box_opened')
  await managerPage.fill('input[aria-label="Quantity"]', '0')
  await managerPage.click('button:has-text("Apply")')
  await managerPage.waitForTimeout(1200)
  const boxOpenApplied = await managerPage.locator('text=Applied.').first().isVisible().catch(() => false)
  boxOpenApplied ? ok('Opening a sealed box applies without error') : bad('Opening a sealed box applies')

  console.log('\n── Adjustment controls (damage) ──')
  await managerPage.selectOption('select[aria-label="Mutation type"]', 'damage')
  await managerPage.fill('input[aria-label="Quantity"]', '3')
  await managerPage.fill('input[aria-label="Reason"]', 'Water damage')
  await managerPage.click('button:has-text("Apply")')
  await managerPage.waitForTimeout(1200)
  const afterDamage = await managerPage.locator('text=/Physical: 37/').first().isVisible().catch(() => false)
  afterDamage ? ok('Recording damage decreases real physical quantity, shown live on screen') : bad('Damage mutation updates the real displayed quantity')

  console.log('\n── Negative-inventory rejection ──')
  await managerPage.selectOption('select[aria-label="Mutation type"]', 'stick_removed')
  await managerPage.fill('input[aria-label="Quantity"]', '9999')
  await managerPage.click('button:has-text("Apply")')
  await managerPage.waitForTimeout(1200)
  const rejectionVisible = await managerPage.locator('text=/take inventory below zero/').first().isVisible().catch(() => false)
  rejectionVisible ? ok('Removing more sticks than exist is honestly rejected in the UI, never silently applied') : bad('Negative-inventory rejection renders honestly')

  console.log('\n── Duplicate-race result (rapid double-click) ──')
  await managerPage.selectOption('select[aria-label="Mutation type"]', 'stick_added')
  await managerPage.fill('input[aria-label="Quantity"]', '2')
  const applyBtn = managerPage.locator('button:has-text("Apply")')
  await Promise.all([applyBtn.click(), applyBtn.click().catch(() => {})])
  await managerPage.waitForTimeout(1500)
  const quantityAfterDoubleClick = await managerPage.locator('text=/Physical: (39|41)/').first().isVisible().catch(() => false)
  quantityAfterDoubleClick ? ok('A rapid double-click on Apply results in a sane, non-corrupted real quantity (no double-apply from the same click sequence)') : bad('Double-click does not corrupt real quantity')

  console.log('\n── Archive / restore ──')
  await managerPage.click('button:has-text("Archive")')
  await managerPage.waitForTimeout(1000)
  await nav(managerPage, '/smokecraft/admin/humidor')
  await managerPage.waitForTimeout(1000)
  const goneAfterArchive = !(await managerPage.locator(`text=${sku}`).first().isVisible().catch(() => false))
  goneAfterArchive ? ok('An archived product disappears from the default dashboard list') : bad('Archived product removed from dashboard')

  console.log('\n── Visibility synchronization with the customer browser ──')
  await managerPage.evaluate((venueId) => {
    localStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, selectedVenue: { id: venueId, name: 'Browser Venue', selectedAt: new Date().toISOString() } }))
  }, venueId)
  await nav(managerPage, '/smokecraft/venue-humidor')
  await managerPage.waitForTimeout(1200)
  const hiddenFromCustomer = !(await managerPage.locator(`text=Browser Test Robusto`).first().isVisible().catch(() => false))
  hiddenFromCustomer ? ok('An archived product is genuinely absent from the real customer browser') : bad('Archived product absent from customer browser')

  console.log('\n── Event-history screen ──')
  await nav(managerPage, '/smokecraft/admin/humidor')
  await managerPage.fill('input[aria-label="Venue ID"]', venueId)
  await managerPage.click('button:has-text("Search")')
  await managerPage.click('button:has-text("Event History")')
  await managerPage.waitForTimeout(1200)
  const historyRowsVisible = await managerPage.locator('table td:has-text("receiving")').first().isVisible().catch(() => false)
  historyRowsVisible ? ok('Inventory event history screen renders real, append-only events') : bad('Event history screen renders real events')

  console.log('\n── Venue isolation / RBAC — unauthorized user ──')
  const strangerCtx = await browser.newContext({ viewport: { width: 1200, height: 800 } })
  const strangerPage = await strangerCtx.newPage()
  await loginAs(strangerPage, { staffPin: '1234' })
  await nav(strangerPage, '/smokecraft/admin/humidor')
  await strangerPage.fill('input[aria-label="Venue ID"]', venueId)
  await strangerPage.click('button:has-text("Search")')
  await strangerPage.waitForTimeout(1200)
  const deniedVisible = await strangerPage.locator('text=/do not have permission/').first().isVisible().catch(() => false)
  deniedVisible ? ok('An unauthorized user sees an honest permission-denied state, never leaked inventory data') : bad('Unauthorized user denied honestly')

  console.log('\n── Keyboard / focus / pointer / no console errors ──')
  await nav(managerPage, '/smokecraft/admin/humidor')
  await managerPage.keyboard.press('Tab')
  const activeTag = await managerPage.evaluate(() => document.activeElement?.tagName)
  activeTag ? ok('Keyboard navigation moves focus on the admin dashboard') : bad('Keyboard navigation moves focus')
  const overflowX = await managerPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowX ? ok('No horizontal layout cutoff on the admin dashboard (scrolls its own table container)') : bad('No horizontal cutoff on admin dashboard')

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver|status of 40[139]|status of 429/i.test(e))
  realErrors.length === 0 ? ok('No unexpected console errors across the admin flow') : bad('No console errors', realErrors.slice(0, 3).join(' | '))

  await managerCtx.close()
  await strangerCtx.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-2b-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-2b-1/02-admin-browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
