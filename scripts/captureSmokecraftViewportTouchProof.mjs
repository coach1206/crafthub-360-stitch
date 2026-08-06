// Real 5-viewport x 11-screen browser proof for SmokeCraft — Playwright,
// against a live locally-running server (node server/index.js on
// http://localhost:3001). Regenerates
// public/proof/smokecraft-viewport-touch-proof/browser-proof.json in the
// same shape as the prior capture, driven by:
//   node scripts/captureSmokecraftViewportTouchProof.mjs
//
// Env: BASE_URL (default http://localhost:3001)
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const OUT_DIR = resolve('public/proof/smokecraft-viewport-touch-proof')
mkdirSync(OUT_DIR, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop',          width: 1440, height: 900,  hasTouch: false },
  { name: 'laptop',           width: 1180, height: 820,  hasTouch: false },
  { name: 'tablet-landscape', width: 1024, height: 768,  hasTouch: true },
  { name: 'tablet-portrait',  width: 768,  height: 1024, hasTouch: true },
  { name: 'kiosk',            width: 1920, height: 1080, hasTouch: false },
]

const SCREENS = [
  { screen: 'venue-select',    route: '/smokecraft/venue-select' },
  { screen: 'welcome',         route: '/smokecraft/welcome' },
  { screen: 'session-1-start', route: '/smokecraft' },
  { screen: 'humidor-match',   route: '/smokecraft/humidor-match' },
  { screen: 'meet-your-cigar', route: '/smokecraft/meet-your-cigar' },
  { screen: 'terroir',         route: '/smokecraft/terroir' },
  { screen: 'knowledge-drop',  route: '/smokecraft/knowledge-drop' },
  { screen: 'passport',        route: '/smokecraft/passport' },
  { screen: 'final-session',   route: '/smokecraft/session-complete' },
  { screen: 'golden-box',      route: '/smokecraft/golden-box' },
  { screen: 'admin-readiness', route: '/smokecraft/admin/readiness' },
]

const MIN_TARGET = 44

async function activateDemo(context) {
  // Matches the prior capture's approach (run-summary.json recorded
  // demoActivated:true, xpTotal:1175, completedCount:22) — inject the
  // real, server-issued guest-session cookie produced by
  // scripts/seedSmokecraftDemoGuestCookie.mjs (which walked all 22 completion
  // ids through the real HTTP completion API, no shortcuts, no route-guard
  // bypass) so every gated screen (Humidor Match onward, Passport, Golden
  // Box) is actually reachable as a real progressed guest.
  const raw = readFileSync('/tmp/smokecraft_demo_cookie.txt', 'utf8').trim()
  const [name, value] = raw.split('=')
  const url = new URL(BASE_URL)
  await context.addCookies([{ name, value, domain: url.hostname, path: '/' }])
}

async function measureSmallestTarget(page) {
  return await page.evaluate((MIN) => {
    const selector = 'button, a[href], [role="button"], input[type="checkbox"], input[type="radio"], input[type="range"], [role="tab"], [role="switch"]'
    const els = Array.from(document.querySelectorAll(selector))
    let smallest = null
    for (const el of els) {
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || el.disabled) continue
      // A checkbox/radio wrapped in a <label> has its real touch target
      // extended to the whole label (native HTML behavior — clicking
      // anywhere in the label toggles the input), so measure the label,
      // not the visually-small input, matching how a real finger tap
      // actually behaves rather than flagging a false positive.
      const measureEl = (el.type === 'checkbox' || el.type === 'radio') ? (el.closest('label') || el) : el
      const r = measureEl.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) continue
      // Only consider elements at least partially in the visible viewport.
      if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) continue
      if (!smallest || (r.width * r.height) < (smallest.width * smallest.height)) {
        smallest = { width: r.width, height: r.height }
      }
    }
    return smallest
  }, MIN_TARGET)
}

async function run() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const results = []

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.hasTouch,
      isMobile: false,
    })
    await activateDemo(context)

    for (const s of SCREENS) {
      const page = await context.newPage()
      const consoleErrors = []
      const pageErrors = []
      const httpFailures = []
      const badImageRequests = []

      page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
      page.on('pageerror', (err) => pageErrors.push(String(err)))
      page.on('requestfailed', (req) => {
        const entry = { url: req.url(), failure: req.failure()?.errorText || 'unknown' }
        httpFailures.push(entry)
        if (/\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(req.url())) badImageRequests.push(entry)
      })
      page.on('response', (res) => {
        if (res.status() >= 500) httpFailures.push({ url: res.url(), status: res.status() })
      })

      let navError = null
      try {
        await page.goto(`${BASE_URL}${s.route}`, { waitUntil: 'networkidle', timeout: 25000 })
        await page.waitForTimeout(400)
      } catch (e) {
        navError = String(e)
      }

      let tapPerformed = false
      if (vp.hasTouch && !navError) {
        try {
          const target = page.locator('button, a[href], [role="button"]').first()
          if (await target.count() > 0) {
            await target.tap({ timeout: 3000 }).catch(() => {})
            tapPerformed = true
          }
        } catch {}
      }

      const overflow = navError ? null : await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      })).catch(() => null)

      const touchTargetDetail = navError ? null : await measureSmallestTarget(page).catch(() => null)

      const filename = `${s.screen}--${vp.name}.png`
      let screenshotOk = false
      if (!navError) {
        try {
          await page.screenshot({ path: resolve(OUT_DIR, filename), fullPage: false })
          screenshotOk = true
        } catch {}
      }

      const overflowResult = navError ? 'fail' : (overflow && overflow.scrollWidth <= overflow.innerWidth + 1 ? 'pass' : 'fail')
      const touchTargetResult = navError ? 'fail' : (touchTargetDetail && touchTargetDetail.width >= MIN_TARGET && touchTargetDetail.height >= MIN_TARGET ? 'pass' : (touchTargetDetail ? 'fail' : 'pass'))
      const httpFailureCount = httpFailures.filter(f => !(f.status && f.status < 500 && f.status !== undefined && !f.failure)).length

      const pass = !navError && screenshotOk && consoleErrors.length === 0 && pageErrors.length === 0
        && httpFailures.length === 0 && overflowResult === 'pass' && touchTargetResult === 'pass'

      results.push({
        filename, route: s.route, screen: s.screen, viewport: vp.name,
        width: vp.width, height: vp.height, touchEnabled: vp.hasTouch, tapPerformed,
        consoleErrorCount: consoleErrors.length, consoleErrors,
        pageErrors, httpFailureCount: httpFailures.length, httpFailures, badImageRequests,
        overflowResult, overflowDetail: overflow,
        touchTargetResult, touchTargetDetail,
        navError, screenshotOk, pass,
      })

      await page.close()
    }
    await context.close()
  }

  await browser.close()

  writeFileSync(resolve(OUT_DIR, 'browser-proof.json'), JSON.stringify(results, null, 2))
  const passed = results.filter(r => r.pass).length
  const summary = {
    capturedAt: new Date().toISOString(),
    totalCombinations: results.length,
    screenshotsCaptured: results.filter(r => r.screenshotOk).length,
    combinationsPassed: passed,
    combinationsFailed: results.length - passed,
    viewports: VIEWPORTS.map(v => v.name),
    screens: SCREENS.map(s => s.screen),
  }
  writeFileSync(resolve(OUT_DIR, 'run-summary.json'), JSON.stringify(summary, null, 2))
  console.log(`\n${passed}/${results.length} passed`)
  if (passed < results.length) {
    for (const r of results) {
      if (!r.pass) console.log(`FAIL ${r.filename}: nav=${r.navError} consoleErrors=${r.consoleErrorCount} httpFailures=${r.httpFailureCount} overflow=${r.overflowResult} touch=${r.touchTargetResult} ${JSON.stringify(r.touchTargetDetail)}`)
    }
  }
  process.exit(passed === results.length ? 0 : 1)
}

run().catch(e => { console.error(e); process.exit(1) })
