// Browser proof capture — Approved Visual Lock (Prompt 3).
// Opens every active SmokeCraft route against the local production build
// (vite preview :5050) in demo mode, records URL + visual markers + a
// screenshot + console-error status into public/proof/smokecraft-approved-visual-lock/.
import fs from 'fs'
import { chromium } from 'playwright'

const UI = process.env.UI || 'http://localhost:5050'
const OUT = 'public/proof/smokecraft-approved-visual-lock'
fs.mkdirSync(OUT, { recursive: true })

const ROUTES = [
  ['entry-landing',        '/smokecraft'],
  ['entry-enroll',         '/smokecraft/enroll'],
  ['entry-venue',          '/smokecraft/venue-select'],
  ['entry-identity',       '/smokecraft/identity'],
  ['mentor-selection',     '/smokecraft/mentor-selection'],
  ['golden-box',           '/smokecraft/golden-box'],
  ['session-1-welcome',    '/smokecraft/welcome'],
  ['session-2-humidor',    '/smokecraft/humidor-match'],
  ['session-3-meet-cigar', '/smokecraft/meet-your-cigar'],
  ['session-4-terroir',    '/smokecraft/terroir'],
  ['session-5-format',     '/smokecraft/format'],
  ['session-6-cut-toast',  '/smokecraft/cut-toast-light'],
  ['session-7-lighting',   '/smokecraft/lighting-tutorial'],
  ['session-8-first-third','/smokecraft/first-third'],
  ['session-10-flavor-mem','/smokecraft/flavor-memory'],
  ['session-11-pairing-lab','/smokecraft/pairing-lab'],
  ['session-12-second-third','/smokecraft/second-third'],
  ['session-14-mentor-comm','/smokecraft/mentor-commentary'],
  ['session-15-knowledge', '/smokecraft/knowledge-drop'],
  ['session-16-final-third','/smokecraft/final-third'],
  ['session-19-scorecard', '/smokecraft/scorecard'],
  ['session-21-ai-summary','/smokecraft/ai-summary'],
  ['session-22-pairing-rec','/smokecraft/pairing-recommendations'],
  ['session-23-passport',  '/smokecraft/passport-stamp'],
  ['session-24-final-rev', '/smokecraft/final-review'],
  ['session-25-rewards',   '/smokecraft/rewards'],
  ['session-27-complete',  '/smokecraft/session-complete'],
]

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 2200 } })
await ctx.addInitScript(() => {
  sessionStorage.setItem('novee_demo_mode', '1')
  sessionStorage.setItem('demoMode', 'true')
  sessionStorage.setItem('novee_booted', '1')
})
const page = await ctx.newPage()
const results = []

for (const [name, route] of ROUTES) {
  const errors = []
  const onErr = (m) => { if (m.type() === 'error') errors.push(m.text()) }
  page.on('console', onErr)
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(`${UI}${route}`, { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(500)
  const markers = await page.evaluate(() => {
    const el = document.querySelector('[data-smokecraft-screen-id]')
    if (!el) return null
    return {
      screenId: el.getAttribute('data-smokecraft-screen-id'),
      component: el.getAttribute('data-smokecraft-component'),
      assetKey: el.getAttribute('data-smokecraft-asset-key'),
      visualSource: el.getAttribute('data-visual-source'),
      staticOnly: el.getAttribute('data-static-only'),
    }
  })
  const imgSrc = await page.locator('img').first().getAttribute('src').catch(() => null)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }).catch(() => {})
  const finalUrl = page.url()
  results.push({ name, requestedRoute: route, finalUrl, markers, firstImg: imgSrc, consoleErrors: errors })
  page.off('console', onErr)
  console.log(`${name}: url=${finalUrl.replace(UI, '')} markers=${markers ? markers.visualSource + '/' + markers.staticOnly : 'entry-live-shell'} errs=${errors.length}`)
}

fs.writeFileSync(`${OUT}/capture-summary.json`, JSON.stringify(results, null, 2))
await browser.close()
console.log(`\nCaptured ${results.length} routes -> ${OUT}`)
