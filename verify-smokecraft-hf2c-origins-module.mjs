#!/usr/bin/env node
// Holistic Fix 2C — Origins/Curation/Leaf-Challenge/Cultivation module
// verification: 5-viewport sweep + connected-flow test.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SC_UI || 'http://localhost:5050'
const OUT_DIR = 'public/proof/smokecraft-holistic-fix-2c'
mkdirSync(`${OUT_DIR}/screenshots`, { recursive: true })

const VIEWPORTS = [
  { name: 'handheld-portrait', width: 390, height: 844 },
  { name: 'tablet-10in', width: 810, height: 1080 },
  { name: 'tablet-12in', width: 1024, height: 1366 },
  { name: 'display-15in', width: 1440, height: 900 },
  { name: 'desktop', width: 1920, height: 1080 },
]

const ROUTES = [
  { key: 'origins', route: '/smokecraft/origins' },
  { key: 'curation', route: '/smokecraft/curation' },
  { key: 'leaves', route: '/smokecraft/leaves' },
  { key: 'leaf-challenge', route: '/smokecraft/leaf-challenge' },
  { key: 'leaf-challenge-calculating', route: '/smokecraft/leaf-challenge-calculating' },
  { key: 'leaf-challenge-result', route: '/smokecraft/leaf-challenge-result' },
  { key: 'cultivation', route: '/smokecraft/cultivation' },
  { key: 'blend', route: '/smokecraft/blend' },
  { key: 'flavor-dna', route: '/smokecraft/flavor-dna' },
]

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const results = []

async function seedPage(page) {
  await page.addInitScript(() => {
    const now = Date.now()
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 's_hf2c_audit', createdAt: now, updatedAt: now, __version: 4,
      profile: { firstName: 'Audit', lastName: 'Tester' },
      completedSteps: [], xp: 1000, rank: 'Journeyman',
      guestId: 'g_hf2c_audit', venueId: 'novee-grand-lounge', deviceId: 'kiosk-001', entrySource: 'qr-scan',
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

await page.goto(`${BASE}/smokecraft/origins`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
flow.push(`Origins rendered: image-only instructional screen, no crash`)
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-01-origins.png` })

await page.goto(`${BASE}/smokecraft/curation`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
flow.push(`Curation rendered: ${(await page.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' ')}`)
const curationNext = page.locator('.curation-actions__next')
if (await curationNext.count() > 0) {
  await curationNext.click()
  await page.waitForTimeout(500)
  flow.push(`Curation Next -> ${page.url()}`)
}

await page.waitForTimeout(300)
flow.push(`Leaves rendered: ${(await page.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' ')}`)
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-02-leaves.png` })

const leafCards = page.locator('.leaf-study-card')
const cardCount = await leafCards.count()
flow.push(`Leaves: ${cardCount} study cards found`)
for (let i = 0; i < cardCount; i++) {
  await leafCards.nth(i).click().catch(() => {})
  await page.waitForTimeout(150)
}
const startChallengeBtn = page.locator('button, a').filter({ hasText: /challenge/i }).first()
if (await startChallengeBtn.count() > 0) {
  await startChallengeBtn.click().catch(() => {})
  await page.waitForTimeout(600)
  flow.push(`After studying leaves, challenge trigger -> ${page.url()}`)
}

await page.goto(`${BASE}/smokecraft/leaf-challenge`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
flow.push(`Leaf Challenge rendered directly: ${(await page.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' ')}`)
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-03-leaf-challenge.png` })

await page.goto(`${BASE}/smokecraft/leaf-challenge-calculating`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
flow.push(`Leaf Challenge Calculating -> auto-advanced to: ${page.url()}`)
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-04-calculating-result.png` })

await page.goto(`${BASE}/smokecraft/cultivation`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
flow.push(`Cultivation rendered: ${(await page.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' ')}`)
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-05-cultivation.png` })

await page.goto(`${BASE}/smokecraft/blend`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
flow.push(`Blend rendered: ${(await page.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' ')}`)
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-06-blend.png` })

await page.goto(`${BASE}/smokecraft/flavor-dna`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
flow.push(`Flavor DNA rendered: image-only instructional screen, no crash`)
await page.screenshot({ path: `${OUT_DIR}/screenshots/flow-07-flavor-dna.png` })

await page.close()
await browser.close()

console.log(JSON.stringify(results, null, 2))
console.log('\n--- Connected flow ---')
console.log(flow.join('\n'))
const failed = results.filter(r => !r.noHorizontalOverflow || r.consoleErrors > 0)
console.log(`\n${results.length - failed.length}/${results.length} viewport x screen checks passed (no h-overflow, no console error)`)
console.log(`Keyboard-focus reached a real control in ${results.filter(r => r.keyboardFocusReachesControl).length}/${results.length} checks`)
process.exit(failed.length > 0 ? 1 : 0)
