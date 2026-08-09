#!/usr/bin/env node
// Recapture just the screens touched by the owner-audit repair pass
// (014/015 Meet Your Cigar wrong-image fix, 016 Terroir default-tab fix,
// 028 Knowledge Drop default-tab fix) to verify the real fix, using the
// same real-navigation approach as the complete inspection capture.
import { chromium } from 'playwright'
import { genericAdvance } from './proveSmokecraftFullRealBrowserJourney.mjs'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const OUT = 'public/proof/smokecraft-owner-complete-visual-inspection'

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'networkidle', timeout: 25000 })
  await page.click('text=Explore as Guest')
  await page.waitForURL('**/smokecraft/identity', { timeout: 10000 })
  await page.fill('input[aria-label="Full Name"]', 'Repair Verification')
  await page.selectOption('select[aria-label="Cigar Experience Level"]', { index: 1 })
  await page.click('[data-testid="identity-begin"]')
  await page.waitForURL('**/smokecraft/venue-select', { timeout: 10000 })
  await page.waitForLoadState('networkidle')
  await page.click('text=Alpha Lounge (Seed)')
  await page.click('text=Continue to Welcome')
  await page.waitForURL('**/smokecraft/welcome', { timeout: 10000 })
  await page.waitForTimeout(500)
  await page.click('text=Begin Experience')
  await page.waitForURL('**/smokecraft/golden-box', { timeout: 10000 })

  for (const stop of ['mentor-selection', 'seed-soil', 'humidor-match']) {
    await genericAdvance(page, { screenshotName: `verify-${stop}`, label: stop })
  }
  await page.waitForURL('**/smokecraft/meet-your-cigar', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/014-meet-your-cigar.png` })
  console.log('014 recaptured, url:', page.url())
  const tab = page.locator('text=Brand').first()
  if (await tab.count()) await tab.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/015-meet-your-cigar.png` })
  console.log('015 recaptured')

  await genericAdvance(page, { screenshotName: 'verify-meet-cigar', label: 'Meet Your Cigar' })
  await page.waitForURL('**/smokecraft/terroir', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/016-terroir.png` })
  console.log('016 recaptured, url:', page.url())

  await genericAdvance(page, { screenshotName: 'verify-terroir', label: 'Terroir' })
  for (const stop of ['format', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third']) {
    await genericAdvance(page, { screenshotName: `verify-${stop}`, label: stop })
  }
  await page.waitForURL('**/smokecraft/mentor-commentary', { timeout: 15000 }).catch(() => {})
  await genericAdvance(page, { screenshotName: 'verify-mentor-commentary', label: 'Mentor Commentary' })
  await page.waitForURL('**/smokecraft/knowledge-drop', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/028-knowledge-drop.png` })
  console.log('028 recaptured, url:', page.url())

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
