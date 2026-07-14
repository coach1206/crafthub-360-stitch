import { chromium } from 'playwright'
import { mkdirSync, existsSync } from 'fs'

const BASE = 'http://localhost:5000'
const DIR  = '/home/user/crafthub-360-stitch/public/proof/smokecraft-final-live-founder-review'
mkdirSync(DIR, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'tablet-768',   width: 768,  height: 1024 },
  { name: 'mobile-390',   width: 390,  height: 844 },
]

const JOURNEY_STATE = {
  stateVersion: 2,
  identity: { preferredName: 'Founder', fullName: 'Test Founder' },
  selectedCigar: { name: 'Oliva Serie V', origin: 'Nicaragua', wrapper: 'Habano Maduro', strength: 'Full', body: 'Full', tastingProfile: 'Dark chocolate, leather, espresso' },
  pairing: { recommendation: 'Whiskey', primary: 'Whiskey', selections: ['Whiskey'] },
  mentor: [{ id: 'alejandro', name: 'Don Alejandro', origin: 'Dominican Republic' }],
  format: { id: 'robusto', label: 'Robusto' },
  flavorMemory: { selectedFlavors: ['Cedar', 'Leather', 'Earth'] },
  requestPurchase: { orderPath: 'self' },
  cutToastLight: { cut: 'Straight Cut', toast: 'Gentle Toast', light: 'Cedar Spill' },
}

const ALL_ROUTES = [
  { name: '01-landing',           path: '/smokecraft' },
  { name: '02-enroll',            path: '/smokecraft/enroll' },
  { name: '03-identity',          path: '/smokecraft/identity' },
  { name: '04-golden-box',        path: '/smokecraft/golden-box' },
  { name: '05-mentor-selection',  path: '/smokecraft/mentor-selection' },
  { name: '06-format',            path: '/smokecraft/format' },
  { name: '07-seed-soil',         path: '/smokecraft/seed-soil' },
  { name: '08-pairing-lab',       path: '/smokecraft/pairing-lab' },
  { name: '09-humidor-match',     path: '/smokecraft/humidor-match' },
  { name: '10-request-purchase',  path: '/smokecraft/request-purchase' },
  { name: '11-cut-toast-light',   path: '/smokecraft/cut-toast-light' },
  { name: '12-first-third',       path: '/smokecraft/first-third' },
  { name: '13-second-third',      path: '/smokecraft/second-third' },
  { name: '14-flavor-memory',     path: '/smokecraft/flavor-memory' },
  { name: '15-final-third',       path: '/smokecraft/final-third' },
  { name: '16-scorecard',         path: '/smokecraft/scorecard' },
  { name: '17-final-review',      path: '/smokecraft/final-review' },
  { name: '18-passport-stamp',    path: '/smokecraft/passport-stamp' },
  { name: '19-connections',       path: '/smokecraft/connections' },
  { name: '20-management-sync',   path: '/smokecraft/management-sync' },
  { name: '21-session-complete',  path: '/smokecraft/session-complete' },
  { name: '22-leaderboard',       path: '/smokecraft/leaderboard' },
  { name: '23-event-challenge',   path: '/smokecraft/event-challenge' },
  { name: '24-how-it-works',      path: '/smokecraft/how-it-works' },
  { name: '25-smokecraft-challenge', path: '/smokecraft/smokecraft-challenge' },
  { name: '26-second-humidor-match', path: '/smokecraft/second-humidor-match' },
  { name: '27-mini-tasting',      path: '/smokecraft/mini-tasting' },
  { name: '28-visit-complete',    path: '/smokecraft/visit-complete' },
]

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

  for (const vp of VIEWPORTS) {
    console.log(`\n[${vp.name}]`)
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()
    await page.route(/^http:\/\/localhost:5000\/api\//, r => r.fulfill({ status: 200, body: '{}', contentType: 'application/json' }))

    for (const route of ALL_ROUTES) {
      const file = `${DIR}/${route.name}--${vp.name}.png`
      if (existsSync(file)) { console.log(`  skip ${route.name} (exists)`); continue }
      await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded' })
      await page.evaluate((state) => {
        localStorage.setItem('sc_journey_v1', JSON.stringify(state))
        localStorage.setItem('sc_identity_v1', JSON.stringify(state.identity))
        sessionStorage.setItem('novee_demo_mode', '1')
      }, JOURNEY_STATE)
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
      await page.waitForTimeout(800)
      await page.screenshot({ path: file, fullPage: false })
      console.log(`  ✓ ${route.name}`)
    }

    const wFile = `${DIR}/wrapper-strength-redirect--${vp.name}.png`
    if (!existsSync(wFile)) {
      await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded' })
      await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
      await page.goto(`${BASE}/smokecraft/wrapper-strength`, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
      await page.waitForTimeout(1200)
      const finalUrl = page.url()
      console.log(`  ${finalUrl.includes('/smokecraft/seed-soil') ? '✓' : '✗'} wrapper-strength → ${finalUrl}`)
      await page.screenshot({ path: wFile, fullPage: false })
    }

    await ctx.close()
  }

  await browser.close()
  console.log('\n✅ Done.')
})()
