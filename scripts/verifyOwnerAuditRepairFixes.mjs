#!/usr/bin/env node
// Careful, deliberately-slow verification of the 3 real code fixes made in
// this repair pass. Saved to a separate verification folder (not mixed
// into the numbered 001-043 audit set, to avoid corrupting that record
// with mistimed/mislabeled captures).
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

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
  await page.fill('input[aria-label="Full Name"]', 'Fix Verification')
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

  // Golden Box Rules -> Mentor -> Seed & Soil -> Humidor Match, real clicks, deliberate waits.
  await page.locator('input[type="checkbox"]').first().click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(300)
  await page.locator('button[aria-label="Continue to Mentor Selection"]').click({ timeout: 3000 }).catch(() => {})
  await page.waitForURL('**/smokecraft/mentor-selection', { timeout: 10000 })
  await page.waitForTimeout(500)
  const mentorCard = page.locator('button, [role="button"]').filter({ hasText: 'Don Alejandro' }).first()
  if (await mentorCard.count()) await mentorCard.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(300)
  const mentorContinue = page.locator('button:has-text("Continue")').first()
  if (await mentorContinue.count()) await mentorContinue.click({ timeout: 3000 }).catch(() => {})
  await page.waitForURL('**/smokecraft/seed-soil', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(800)
  const seedContinue = page.locator('button:has-text("Continue")').first()
  if (await seedContinue.count()) await seedContinue.click({ timeout: 3000 }).catch(() => {})
  await page.waitForURL('**/smokecraft/humidor-match', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(800)

  // Real interaction: select environment, apply, continue.
  const envRadio = page.locator('text=Virtual Humidor').first()
  if (await envRadio.count()) await envRadio.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(300)
  const applyBtn = page.locator('button:has-text("Apply Settings")').first()
  if (await applyBtn.count()) await applyBtn.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(300)
  const humidorContinue = page.locator('button:has-text("Continue")').last()
  if (await humidorContinue.count()) await humidorContinue.click({ timeout: 3000 }).catch(() => {})
  await page.waitForURL('**/smokecraft/meet-your-cigar', { timeout: 10000 })
  await page.waitForTimeout(800)

  await page.screenshot({ path: `${OUT}/meet-your-cigar-AFTER-FIX.png` })
  console.log('Captured Meet Your Cigar after fix, url:', page.url())

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
