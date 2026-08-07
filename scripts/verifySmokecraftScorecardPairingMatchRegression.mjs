#!/usr/bin/env node
// Focused regression for the Scorecard "Pairing Match" click-interception
// defect (found during the full real-browser journey pass). Proves, via
// a real Playwright browser against a live server, that all 6 rating
// categories — specifically the 6th, "Pairing Match" — can be selected
// by a plain, non-forced, real click at every supported viewport, and
// that the fix (Scorecard.jsx's Rating Categories panel now has a hard
// maxHeight + internal scroll so it can never visually overlap the
// Personal Notes panel) did not regress the other 5 categories, the
// overall layout, or progression.
//
// Reuses the same real per-screen advance logic already proven reliable
// by scripts/proveSmokecraftFullRealBrowserJourney.mjs (genericAdvance)
// rather than a second, hand-duplicated walkthrough that could drift out
// of sync with real screen requirements.
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { genericAdvance } from './proveSmokecraftFullRealBrowserJourney.mjs'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const OUT = 'public/proof/smokecraft-scorecard-pairing-match-regression'
mkdirSync(OUT, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, hasTouch: false },
  { name: 'tablet-landscape', width: 1024, height: 768, hasTouch: true },
  { name: 'tablet-portrait', width: 768, height: 1024, hasTouch: true },
  { name: 'kiosk', width: 1920, height: 1080, hasTouch: false },
]

const CATEGORY_LABELS = ['Appearance', 'Construction', 'Draw', 'Burn', 'Flavor', 'Pairing Match']
const ROUTES_TO_SCORECARD = [
  'golden-box', 'mentor-selection', 'seed-soil', 'humidor-match', 'meet-your-cigar', 'terroir',
  'format', 'request-purchase', 'cut-toast-light', 'lighting-tutorial', 'first-third',
  'flavor-memory', 'pairing-lab', 'second-third', 'mentor-commentary', 'knowledge-drop', 'final-third',
]

let pass = 0, fail = 0
function assert(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

async function reachScorecard(page) {
  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'networkidle', timeout: 25000 })
  await page.click('text=Explore as Guest')
  await page.waitForURL('**/smokecraft/identity', { timeout: 10000 })
  await page.fill('input[aria-label="Full Name"]', 'Scorecard Regression')
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

  for (const routeSlug of ROUTES_TO_SCORECARD) {
    await genericAdvance(page, { screenshotName: `advance-${routeSlug}`, label: routeSlug })
  }
  await page.waitForURL('**/smokecraft/scorecard', { timeout: 15000 })
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

  for (const vp of VIEWPORTS) {
    console.log(`── ${vp.name} (${vp.width}x${vp.height}) ──`)
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.hasTouch })
    const page = await context.newPage()
    await reachScorecard(page)
    await page.waitForTimeout(500)

    for (const label of CATEGORY_LABELS) {
      const dot = page.locator(`button[aria-label^="Rate ${label} 4 out of 5"]`).first()
      const foundCount = await dot.count().catch(() => 0)
      assert(`[${vp.name}] "${label}" rating control exists`, foundCount > 0)
      if (foundCount === 0) continue

      // A plain, real, non-forced click — exactly what a real mouse or
      // touch tap delivers. No force:true, no in-page dispatch fallback.
      await dot.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(120)
      const pressed = await dot.getAttribute('aria-pressed').catch(() => 'false')
      assert(`[${vp.name}] "${label}" registers a real, unforced click (no pointer-event interception)`, pressed === 'true')
    }

    const errorGone = await page.locator('text=Rate all 6 categories before continuing.').count().catch(() => 0)
    assert(`[${vp.name}] no "Rate all 6 categories" blocking message remains once all 6 are rated`, errorGone === 0)

    const continueBtn = page.locator('button:visible:not([disabled])').filter({ hasText: 'Continue' }).first()
    assert(`[${vp.name}] Continue is enabled once all 6 categories are rated (progression preserved)`, await continueBtn.count() > 0)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
    assert(`[${vp.name}] no horizontal overflow introduced by the fix`, !overflow)

    await page.screenshot({ path: `${OUT}/scorecard-all-rated--${vp.name}.png`, fullPage: true })
    await context.close()
  }

  await browser.close()
  console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
  if (fail > 0) process.exit(1)
}

main().catch(e => { console.error(e); process.exit(1) })
