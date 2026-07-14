import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = 'http://localhost:5000'
const DIR  = '/home/user/crafthub-360-stitch/public/proof/smokecraft-landing-visual-correction'
mkdirSync(DIR, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'tablet-768',   width: 768,  height: 1024 },
  { name: 'mobile-390',   width: 390,  height: 844 },
]

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

  for (const vp of VIEWPORTS) {
    console.log(`\n[${vp.name}]`)
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()
    await page.route(/^http:\/\/localhost:5000\/api\//, r => r.fulfill({ status: 200, body: '{}', contentType: 'application/json' }))

    // New session state
    await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      localStorage.removeItem('smokecraft_progress')
      sessionStorage.setItem('novee_demo_mode', '1')
    })
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${DIR}/landing-new-session--${vp.name}.png`, fullPage: false })
    console.log(`  ✓ new session`)

    // Saved session state
    await page.evaluate(() => {
      localStorage.setItem('smokecraft_progress', JSON.stringify({ completedSessions: ['session-1'] }))
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${DIR}/landing-saved-session--${vp.name}.png`, fullPage: false })
    console.log(`  ✓ saved session`)

    await ctx.close()
  }

  await browser.close()
  console.log('\n✅ Done.')
})()
