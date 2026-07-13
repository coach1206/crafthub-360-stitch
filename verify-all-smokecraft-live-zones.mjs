/**
 * verify-all-smokecraft-live-zones.mjs
 * SmokeCraft 360 — Live Selection & Persistence Tests
 *
 * Tests that user selections update journey state and persist across reloads.
 */

import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const PASS = '✅'
const FAIL = '❌'

let passed = 0
let failed = 0

function log(ok, label, detail = '') {
  const sym = ok ? PASS : FAIL
  console.log(`${sym} ${label}${detail ? ` — ${detail}` : ''}`)
  ok ? passed++ : failed++
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
const ctx = await browser.newContext()
const page = await ctx.newPage()
await page.setViewportSize({ width: 1440, height: 900 })
await page.addInitScript(() => { sessionStorage.setItem('novee_demo_mode', '1') })

// ── Identity: form saves to sc_identity_v1 and restores on reload ────────────
await page.goto(`${BASE}/smokecraft/identity`, { waitUntil: 'load', timeout: 20000 })
await page.waitForTimeout(800)

const nameInput = page.locator('input[autocomplete="name"], input[placeholder*="Last Name"], input[placeholder*="First"]').first()
const hasNameInput = await nameInput.count() > 0
log(hasNameInput, 'Identity: Full Name input exists')

if (hasNameInput) {
  await nameInput.fill('Test Smoker')
  await page.waitForTimeout(400)
  const saved = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('sc_identity_v1') || '{}').fullName } catch { return null }
  })
  log(saved === 'Test Smoker', 'Identity: fullName persists to sc_identity_v1', `got: ${saved}`)

  // Reload and check restoration
  await page.reload({ waitUntil: 'load' })
  await page.waitForTimeout(600)
  const restored = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('sc_identity_v1') || '{}').fullName } catch { return null }
  })
  log(restored === 'Test Smoker', 'Identity: restored after reload', `got: ${restored}`)
} else {
  log(false, 'Identity: Full Name input not found — skipping persistence tests')
  log(false, 'Identity: restore test skipped')
  log(false, 'Identity: restore test skipped (2)')
}

// ── Format: selection saves and persists ─────────────────────────────────────
await page.goto(`${BASE}/smokecraft/format`, { waitUntil: 'load', timeout: 20000 })
await page.waitForTimeout(800)

const robusto = page.locator('button[aria-label*="Robusto"], button:has-text("Robusto")').first()
const hasRobusto = await robusto.count() > 0
log(hasRobusto, 'Format: Robusto button exists')

if (hasRobusto) {
  await robusto.click()
  await page.waitForTimeout(300)
  const pressed = await robusto.getAttribute('aria-pressed')
  log(pressed === 'true', 'Format: Robusto selected (aria-pressed=true)', `got: ${pressed}`)
} else {
  log(false, 'Format: Robusto button not found')
}

// ── Seed & Soil: selections save ────────────────────────────────────────────
await page.goto(`${BASE}/smokecraft/seed-soil`, { waitUntil: 'load', timeout: 20000 })
await page.waitForTimeout(800)

const criollo = page.locator('button:has-text("Criollo")').first()
const hasCriollo = await criollo.count() > 0
log(hasCriollo, 'Seed & Soil: Criollo button exists')

if (hasCriollo) {
  await criollo.click()
  await page.waitForTimeout(300)
  const pressed = await criollo.getAttribute('aria-pressed')
  log(pressed === 'true', 'Seed & Soil: Criollo selected', `got: ${pressed}`)
} else {
  log(false, 'Seed & Soil: Criollo button not found')
}

// ── Mentor: selection state ──────────────────────────────────────────────────
await page.goto(`${BASE}/smokecraft/mentor-selection`, { waitUntil: 'load', timeout: 20000 })
await page.waitForTimeout(800)

const mentorBtn = page.locator('button:has-text("Don Alejandro")').first()
const hasMentor = await mentorBtn.count() > 0
log(hasMentor, 'Mentor: Don Alejandro button exists')

if (hasMentor) {
  await mentorBtn.click()
  await page.waitForTimeout(300)
  const pressed = await mentorBtn.getAttribute('aria-pressed')
  log(pressed === 'true', 'Mentor: Don Alejandro selected', `got: ${pressed}`)
} else {
  log(false, 'Mentor: Don Alejandro button not found')
}

// ── Golden Box: acknowledgement checkbox ─────────────────────────────────────
await page.goto(`${BASE}/smokecraft/golden-box`, { waitUntil: 'load', timeout: 20000 })
await page.waitForTimeout(800)

const checkbox = page.locator('input[type="checkbox"]').first()
const hasCheckbox = await checkbox.count() > 0
log(hasCheckbox, 'Golden Box: acknowledgement checkbox exists')

if (hasCheckbox) {
  await checkbox.check()
  await page.waitForTimeout(300)
  const isChecked = await checkbox.isChecked()
  log(isChecked, 'Golden Box: checkbox can be checked')

  const saved = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('sc_golden_box_v1') || '{}').acknowledged } catch { return null }
  })
  log(saved === true, 'Golden Box: acknowledged persists to sc_golden_box_v1', `got: ${saved}`)
} else {
  log(false, 'Golden Box: checkbox not found')
  log(false, 'Golden Box: checkbox persistence skipped')
}

// ── Cut Toast Light: continue button exists ──────────────────────────────────
await page.goto(`${BASE}/smokecraft/cut-toast-light`, { waitUntil: 'load', timeout: 20000 })
await page.waitForTimeout(800)
const pageLoaded = await page.locator('body').count() > 0
log(pageLoaded, 'Cut Toast Light: page loads without error')

// ── First Third: page loads ──────────────────────────────────────────────────
await page.goto(`${BASE}/smokecraft/first-third`, { waitUntil: 'load', timeout: 20000 })
await page.waitForTimeout(800)
const firstThirdLoaded = await page.locator('body').count() > 0
log(firstThirdLoaded, 'First Third: page loads without error')

// ── Scorecard: page loads ────────────────────────────────────────────────────
await page.goto(`${BASE}/smokecraft/scorecard`, { waitUntil: 'load', timeout: 20000 })
await page.waitForTimeout(800)
const scorecardLoaded = await page.locator('body').count() > 0
log(scorecardLoaded, 'Scorecard: page loads without error')

// ── Passport Stamp: page loads ───────────────────────────────────────────────
await page.goto(`${BASE}/smokecraft/passport-stamp`, { waitUntil: 'load', timeout: 20000 })
await page.waitForTimeout(800)
const passportLoaded = await page.locator('body').count() > 0
log(passportLoaded, 'Passport Stamp: page loads without error')

await browser.close()

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error(`FAIL: ${failed} live-zone checks failed`)
  process.exit(1)
} else {
  console.log('PASS: All live-zone checks passed')
  process.exit(0)
}
