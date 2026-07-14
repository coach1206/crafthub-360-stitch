/**
 * Capture Phase 1 (Batch B hotspot correction) and Batch C screenshots
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = 'http://localhost:5000'
const PHASE1_DIR = '/home/user/crafthub-360-stitch/public/proof/smokecraft-exact-visual-repair/batch-b-hotspot-correction'
const BATCH_C_DIR = '/home/user/crafthub-360-stitch/public/proof/smokecraft-exact-visual-repair/batch-c'
mkdirSync(PHASE1_DIR, { recursive: true })
mkdirSync(BATCH_C_DIR, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'mobile-390',   width: 390,  height: 844 },
]

const PHASE1_ROUTES = [
  { name: 'cut-toast-light', path: '/smokecraft/cut-toast-light' },
  { name: 'humidor-match',   path: '/smokecraft/humidor-match' },
  { name: 'request-purchase',path: '/smokecraft/request-purchase' },
]

const BATCH_C_ROUTES = [
  { name: 'final-third',     path: '/smokecraft/final-third' },
  { name: 'scorecard',       path: '/smokecraft/scorecard' },
  { name: 'final-review',    path: '/smokecraft/final-review' },
  { name: 'passport-stamp',  path: '/smokecraft/passport-stamp' },
  { name: 'connections',     path: '/smokecraft/connections' },
  { name: 'management-sync', path: '/smokecraft/management-sync' },
  { name: 'session-complete',path: '/smokecraft/session-complete' },
]

const JOURNEY_STATE = {
  stateVersion: 2,
  identity: { preferredName: 'Investor', fullName: 'Test Investor' },
  selectedCigar: { name: 'Oliva Serie V', origin: 'Nicaragua', wrapper: 'Habano Maduro', strength: 'Full', body: 'Full', tastingProfile: 'Dark chocolate, leather, espresso' },
  pairing: { recommendation: 'Whiskey', primary: 'Whiskey', selections: ['Whiskey'] },
  mentor: [{ id: 'alejandro', name: 'Don Alejandro', origin: 'Dominican Republic' }],
  format: { id: 'robusto', label: 'Robusto' },
  flavorMemory: { selectedFlavors: ['Cedar', 'Leather', 'Earth'] },
  requestPurchase: { orderPath: 'self' },
  cutToastLight: { cut: 'Straight Cut', toast: 'Gentle Toast', light: 'Cedar Spill' },
}

async function seed(page) {
  await page.evaluate((state) => {
    localStorage.setItem('sc_journey_v1', JSON.stringify(state))
    localStorage.setItem('sc_identity_v1', JSON.stringify(state.identity))
    sessionStorage.setItem('novee_demo_mode', '1')
  }, JOURNEY_STATE)
}

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

  for (const vp of VIEWPORTS) {
    console.log(`\n[${vp.name}]`)
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()

    await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded' })
    await seed(page)
    await page.waitForTimeout(300)

    for (const route of PHASE1_ROUTES) {
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded' })
      await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
      await page.waitForTimeout(800)
      const file = `${PHASE1_DIR}/${route.name}--initial--${vp.name}.png`
      await page.screenshot({ path: file, fullPage: false })
      console.log(`  ✓ phase1/${route.name} initial`)
    }

    // Intercept backend API calls so they don't hang screenshot font-wait
    await page.route('**/api/**', route => route.fulfill({ status: 200, body: '{}', contentType: 'application/json' }))

    for (const route of BATCH_C_ROUTES) {
      await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded' })
      await seed(page)
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
      await page.waitForTimeout(1000)
      const file = `${BATCH_C_DIR}/${route.name}--initial--${vp.name}.png`
      await page.screenshot({ path: file, fullPage: false })
      console.log(`  ✓ batch-c/${route.name} initial`)
    }

    await ctx.close()
  }

  await browser.close()
  console.log('\n✅ All screenshots captured.')
})()
