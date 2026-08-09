#!/usr/bin/env node
// One-off retry: reach and screenshot the real Mentor Commentary screen
// (entry 21) using only real interaction — the generic advance heuristic
// missed the Second Third observation textarea + save-then-continue timing.
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const OUT = 'public/proof/smokecraft-owner-visual-audit'

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'networkidle', timeout: 25000 })
  await page.click('text=Explore as Guest')
  await page.waitForURL('**/smokecraft/identity', { timeout: 10000 })
  await page.fill('input[aria-label="Full Name"]', 'Mentor Commentary Recapture')
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

  // Fast-forward through the rest of the opening chain + sessions up to
  // Second Third using the same generic advance helper.
  const { genericAdvance } = await import('./proveSmokecraftFullRealBrowserJourney.mjs')
  const stops = [
    'mentor-selection', 'seed-soil', 'humidor-match', 'meet-your-cigar', 'terroir',
    'format', 'request-purchase', 'cut-toast-light', 'lighting-tutorial',
    'first-third', 'flavor-memory', 'pairing-lab', 'second-third',
  ]
  for (const stop of stops) {
    await genericAdvance(page, { screenshotName: `recapture-advance-${stop}`, label: stop })
  }
  await page.waitForURL('**/smokecraft/second-third', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(500)
  console.log('at second-third:', page.url())

  // Real interaction: fill the Second Third observations textarea, wait
  // for the real autosave to settle, then click the real Continue control.
  const textarea = page.locator('textarea').first()
  if (await textarea.count()) {
    await textarea.fill('Body deepened, burn stayed even, aromas grew richer through the second third.')
    await page.waitForTimeout(1500) // let real autosave ("Saving...") settle
  }

  // Try the real primary continue action, scrolling it into view first.
  const continueCandidates = [
    'button:has-text("Continue")',
    '[data-testid*="continue"]',
    'button:has-text("Next")',
  ]
  let advanced = false
  for (const sel of continueCandidates) {
    const btn = page.locator(sel).first()
    if (await btn.count()) {
      await btn.scrollIntoViewIfNeeded().catch(() => {})
      const disabled = await btn.isDisabled().catch(() => false)
      if (!disabled) {
        await btn.click({ timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(1000)
        if (page.url() !== `${BASE}/smokecraft/second-third`) { advanced = true; break }
      }
    }
  }
  console.log('after continue attempt:', page.url(), 'advanced:', advanced)

  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/021-mentor-commentary.png` })
  console.log('final url at screenshot:', page.url())

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
