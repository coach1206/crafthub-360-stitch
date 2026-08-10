import { chromium } from 'playwright'
import { genericAdvance } from './scripts/proveSmokecraftFullRealBrowserJourney.mjs'

const BASE = 'http://localhost:3002'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
const page = await (await browser.newContext({ viewport: { width: 1180, height: 820 } })).newPage()
page.on('request', r => {
  if (r.url().includes('pairing-engine')) {
    console.log('[request]', r.method(), r.url())
    console.log('  postData:', r.postData())
  }
})
page.on('response', async r => {
  if (r.url().includes('pairing-engine')) {
    console.log('[response]', r.status(), r.url())
    try { console.log('  body:', (await r.text()).slice(0,300)) } catch {}
  }
})

await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'load', timeout: 40000 })
await page.click('text=Explore as Guest')
await page.waitForURL('**/smokecraft/identity', { timeout: 25000 })
await page.fill('[data-testid="identity-fullName"]', 'Debug Pairing 2')
await page.selectOption('[data-testid="identity-experienceLevel"]', { index: 1 })
await page.click('button:has-text("Continue to Venue Selection")')
await page.waitForURL('**/smokecraft/venue-select', { timeout: 25000 })
await page.waitForTimeout(500)
const alpha = page.locator('text=Alpha Lounge (Seed)')
if (await alpha.count().catch(() => 0)) { await alpha.click() }
else { await page.click('text=Continue without venue') }
await page.waitForTimeout(300)
await page.click('button:has-text("Continue to Welcome")')
await page.waitForURL('**/smokecraft/welcome', { timeout: 25000 })
await page.click('text=Begin Experience')
await page.waitForURL('**/smokecraft/golden-box', { timeout: 25000 })

async function advanceUntil(urlPattern, screenshotName, label, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    await genericAdvance(page, { screenshotName: `${screenshotName}-a${attempt}`, label })
    const reached = await page.waitForURL(urlPattern, { timeout: 12000 }).then(() => true).catch(() => false)
    if (reached) return true
  }
  return false
}

await advanceUntil('**/smokecraft/mentor-selection', 'd2-golden', 'Golden Box Rules')
await advanceUntil('**/smokecraft/seed-soil', 'd2-mentor', 'Mentor Selection')
await advanceUntil('**/smokecraft/humidor-match', 'd2-seed', 'Seed & Soil')
const hmContinue = page.locator('button:has-text("Continue to Meet Your Cigar")').first()
if (await hmContinue.count()) await hmContinue.click().catch(() => {})
await page.waitForURL('**/smokecraft/meet-your-cigar', { timeout: 25000 }).catch(() => {})
await advanceUntil('**/smokecraft/terroir', 'd2-meet', 'Meet Your Cigar')
await advanceUntil('**/smokecraft/format', 'd2-terroir', 'Terroir')
await advanceUntil('**/smokecraft/request-purchase', 'd2-format', 'Format')
await advanceUntil('**/smokecraft/cut-toast-light', 'd2-request', 'Request')
await advanceUntil('**/smokecraft/lighting-tutorial', 'd2-cut', 'Cut')
await advanceUntil('**/smokecraft/first-third', 'd2-lighting', 'Lighting')
await advanceUntil('**/smokecraft/flavor-memory', 'd2-first-third', 'First Third')
await advanceUntil('**/smokecraft/pairing-lab', 'd2-flavor-memory', 'Flavor Memory')
const pairingType = page.locator('button, [role="button"]').filter({ hasText: /^Whiskey$/ }).first()
if (await pairingType.count()) await pairingType.click().catch(() => {})
await advanceUntil('**/smokecraft/second-third', 'd2-pairing-lab', 'Pairing Lab')
const std = page.locator('textarea').first()
if (await std.count()) { await std.fill('test note'); await page.waitForTimeout(500) }
await advanceUntil('**/smokecraft/mentor-commentary', 'd2-second-third', 'Second Third')
await advanceUntil('**/smokecraft/knowledge-drop', 'd2-mentor-commentary', 'Mentor Commentary')
await advanceUntil('**/smokecraft/final-third', 'd2-knowledge-drop', 'Knowledge Drop')
const flavorChip = page.locator('button[aria-label="Earth flavor"]').first()
if (await flavorChip.count()) await flavorChip.click({ timeout: 5000 }).catch(() => {})
const ftBtn = page.locator('button:has-text("Continue to Scorecard")').first()
if (await ftBtn.count()) { await ftBtn.scrollIntoViewIfNeeded(); await ftBtn.click({ timeout: 5000 }).catch(() => {}) }
await page.waitForURL('**/smokecraft/scorecard', { timeout: 25000 }).catch(() => {})
for (const cat of ['Appearance', 'Construction', 'Draw', 'Burn', 'Flavor', 'Pairing Match']) {
  const btn = page.locator(`button[aria-label*="Rate ${cat} 4"]`).first()
  if (await btn.count()) await btn.click({ timeout: 3000 }).catch(() => {})
}
await advanceUntil('**/smokecraft/ai-summary', 'd2-scorecard', 'Scorecard')
await advanceUntil('**/smokecraft/pairing-recommendations', 'd2-ai-summary', 'AI Summary')

console.log('=== AT PAIRING RECOMMENDATIONS ===')
await page.waitForTimeout(3000)
const bodyText = await page.locator('body').innerText().catch(() => '')
console.log('BODY:', bodyText.slice(0, 600))
await browser.close()
