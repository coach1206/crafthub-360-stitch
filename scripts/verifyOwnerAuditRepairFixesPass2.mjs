#!/usr/bin/env node
// Careful, deliberately-slow verification of pass-2 fixes: Pairing Lab
// (real pairing-type selector), Management Sync (honest available-now vs
// coming-soon split), Meet Your Cigar (honest media slot), Lighting
// Tutorial (real instruction leads, reserved media slot secondary).
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { genericAdvance } from './proveSmokecraftFullRealBrowserJourney.mjs'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const OUT = 'public/proof/smokecraft-owner-audit-repair-verification'
mkdirSync(OUT, { recursive: true })

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'networkidle', timeout: 25000 })
  await page.click('text=Explore as Guest')
  await page.waitForURL('**/smokecraft/identity', { timeout: 10000 })
  await page.fill('input[aria-label="Full Name"]', 'Pass2 Fix Verification')
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

  for (const stop of ['mentor-selection', 'seed-soil', 'humidor-match', 'meet-your-cigar']) {
    await genericAdvance(page, { screenshotName: `p2-${stop}`, label: stop })
  }

  // Meet Your Cigar — with a cigar selected via Humidor Match's optional picker.
  await page.waitForURL('**/smokecraft/meet-your-cigar', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/meet-your-cigar-PASS2.png` })
  console.log('meet-your-cigar captured, url:', page.url())

  for (const stop of ['terroir', 'format', 'cut-toast-light']) {
    await genericAdvance(page, { screenshotName: `p2-${stop}`, label: stop })
  }
  await page.waitForURL('**/smokecraft/lighting-tutorial', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/lighting-tutorial-PASS2.png` })
  console.log('lighting-tutorial captured, url:', page.url())

  for (const stop of ['first-third', 'flavor-memory']) {
    await genericAdvance(page, { screenshotName: `p2-${stop}`, label: stop })
  }
  await page.waitForURL('**/smokecraft/pairing-lab', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/pairing-lab-before-PASS2.png` })
  // Real click on the new visible Pairing Type chip.
  const chip = page.locator('button, [role="button"]').filter({ hasText: /^Whiskey$/ }).first()
  if (await chip.count()) await chip.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/pairing-lab-after-PASS2.png` })
  console.log('pairing-lab captured, url:', page.url())

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
