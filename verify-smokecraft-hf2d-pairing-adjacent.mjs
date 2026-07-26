#!/usr/bin/env node
// Holistic Fix 2D — Pairing-adjacent family verification: 5-viewport
// sweep + connected-flow test across Pairing, Available, Assistant,
// PairingMastery, Vitola.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SC_UI || 'http://localhost:5050'
const OUT_DIR = 'public/proof/smokecraft-holistic-fix-2d'
mkdirSync(`${OUT_DIR}/screenshots`, { recursive: true })

const VIEWPORTS = [
  { name: 'handheld-portrait', width: 390, height: 844 },
  { name: 'tablet-10in', width: 810, height: 1080 },
  { name: 'tablet-12in', width: 1024, height: 1366 },
  { name: 'display-15in', width: 1440, height: 900 },
  { name: 'desktop', width: 1920, height: 1080 },
]

const ROUTES = [
  { key: 'pairing', route: '/smokecraft/pairing' },
  { key: 'available', route: '/smokecraft/available' },
  { key: 'assistant', route: '/smokecraft/assistant' },
  { key: 'pairing-mastery', route: '/smokecraft/pairing-mastery' },
  { key: 'vitola', route: '/smokecraft/vitola' },
]

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const results = []

async function seedPage(page) {
  await page.addInitScript(() => {
    const now = Date.now()
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 's_hf2d_audit', createdAt: now, updatedAt: now, __version: 4,
      profile: { firstName: 'Audit', lastName: 'Tester' },
      completedSteps: ['enroll', 'identity', 'entry'], xp: 1000, rank: 'Journeyman',
      guestId: 'g_hf2d_audit', venueId: 'novee-grand-lounge', deviceId: 'kiosk-001', entrySource: 'qr-scan',
      entryStartedAt: now, lastActiveAt: now, profileComplete: true,
      audioEnabled: true, hapticsEnabled: true, leaderboardScore: 0,
      smokeCraft: {}, passport: {}, goldenBox: {}, leaderboard: {}, preferences: {}, system: {}, pos3: {}, eatCommand: {},
    }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 1, selectedVenue: { id: 'v1', name: 'Test Lounge', selectedAt: now },
    }))
  })
}

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  await seedPage(page)
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(async () => { await fetch('/api/smokecraft/management-sync/guest-session', { method: 'POST', credentials: 'include' }) }).catch(() => {})

  for (const r of ROUTES) {
    const consoleErrors = []
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
    await page.goto(`${BASE}${r.route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    const scrollInfo = await page.evaluate(() => {
      const doc = document.scrollingElement || document.documentElement
      return { hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth + 1 }
    })
    await page.keyboard.press('Tab')
    const keyboardOk = await page.evaluate(() => document.activeElement !== document.body)

    const shotPath = `${OUT_DIR}/screenshots/${r.key}-${vp.name}.png`
    await page.screenshot({ path: shotPath })
    results.push({
      screen: r.key, viewport: vp.name, route: r.route,
      noHorizontalOverflow: !scrollInfo.hasHorizontalOverflow,
      keyboardFocusReachesControl: keyboardOk,
      consoleErrors: consoleErrors.length,
      screenshot: shotPath,
    })
  }
  await page.close()
}

// ---------- Connected flow ----------
const flow = []
const page = await browser.newPage({ viewport: { width: 1024, height: 1366 } })
await seedPage(page)

await page.goto(`${BASE}/smokecraft/pairing`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const pairingBack = page.locator('[data-testid="pairing-back"]')
const pairingContinue = page.locator('[data-testid="pairing-continue"]')
flow.push(`Pairing: back control present: ${await pairingBack.count() > 0}, continue control present: ${await pairingContinue.count() > 0}`)
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-01-pairing.png` })

await page.goto(`${BASE}/smokecraft/available`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
const selectButtons = page.locator('button:has-text("Select Cigar")')
const cigarCount = await selectButtons.count()
flow.push(`Available: ${cigarCount} cigar cards found`)
if (cigarCount > 0) {
  const firstBtn = selectButtons.first()
  await firstBtn.click()
  await page.waitForTimeout(300)
  const selectedText = await page.locator('button:has-text("Selected")').first().innerText().catch(() => 'n/a')
  flow.push(`Available: after selecting first cigar, button text: ${selectedText}`)
}
const drinkPairingBtn = page.locator('button[title*="Drink pairing"]')
flow.push(`Available: honestly-disabled drink-pairing button present: ${await drinkPairingBtn.count() > 0}, disabled: ${await drinkPairingBtn.count() > 0 ? await drinkPairingBtn.first().isDisabled() : 'n/a'}`)
const continueBtn = page.locator('button:has-text("Continue to Session Summary")')
flow.push(`Available: Continue button present after selection: ${await continueBtn.count() > 0}`)
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-02-available.png` })

await page.goto(`${BASE}/smokecraft/assistant`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
flow.push(`Assistant: rendered: ${(await page.locator('body').innerText()).slice(0, 150).replace(/\n/g, ' ')}`)
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-03-assistant.png` })

await page.goto(`${BASE}/smokecraft/pairing-mastery`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
flow.push(`Pairing Mastery: rendered: ${(await page.locator('body').innerText()).slice(0, 150).replace(/\n/g, ' ')}`)
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-04-pairing-mastery.png` })

await page.goto(`${BASE}/smokecraft/vitola`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
flow.push(`Vitola: rendered: ${(await page.locator('body').innerText()).slice(0, 150).replace(/\n/g, ' ')}`)
const vitolaChips = page.locator('button, [role="button"]')
flow.push(`Vitola: ${await vitolaChips.count()} interactive elements found`)
const vitolaContinue = page.locator('text=Continue').first()
if (await vitolaContinue.count() > 0) {
  flow.push(`Vitola: Continue control present`)
}
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-05-vitola.png` })

await page.close()
await browser.close()

console.log(JSON.stringify(results, null, 2))
console.log('\n--- Connected flow ---')
console.log(flow.join('\n'))
const failed = results.filter(r => !r.noHorizontalOverflow || r.consoleErrors > 0)
console.log(`\n${results.length - failed.length}/${results.length} viewport x screen checks passed (no h-overflow, no console error)`)
console.log(`Keyboard-focus reached a real control in ${results.filter(r => r.keyboardFocusReachesControl).length}/${results.length} checks`)
process.exit(failed.length > 0 ? 1 : 0)
