import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = 'http://localhost:5000'
const DIR  = '/home/user/crafthub-360-stitch/public/proof/smokecraft-exact-visual-repair/batch-d'
mkdirSync(DIR, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'tablet-768',   width: 768,  height: 1024 },
  { name: 'mobile-390',   width: 390,  height: 844 },
]

const ROUTES = [
  { name: 'landing',              path: '/smokecraft' },
  { name: 'enroll',               path: '/smokecraft/enroll' },
  { name: 'leaderboard',          path: '/smokecraft/leaderboard' },
  { name: 'event-challenge',      path: '/smokecraft/event-challenge' },
  { name: 'how-it-works',         path: '/smokecraft/how-it-works' },
  { name: 'smokecraft-challenge', path: '/smokecraft/smokecraft-challenge' },
  { name: 'second-humidor-match', path: '/smokecraft/second-humidor-match' },
  { name: 'mini-tasting',         path: '/smokecraft/mini-tasting' },
  { name: 'visit-complete',       path: '/smokecraft/visit-complete' },
]

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

  for (const vp of VIEWPORTS) {
    console.log(`\n[${vp.name}]`)
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()

    await page.route(/^http:\/\/localhost:5000\/api\//, r => r.fulfill({ status: 200, body: '{}', contentType: 'application/json' }))

    for (const route of ROUTES) {
      await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded' })
      await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
      await page.waitForTimeout(800)
      const file = `${DIR}/${route.name}--initial--${vp.name}.png`
      await page.screenshot({ path: file, fullPage: false })
      console.log(`  ✓ ${route.name}`)
    }

    await ctx.close()
  }

  await browser.close()
  console.log('\n✅ All screenshots captured.')
})()
