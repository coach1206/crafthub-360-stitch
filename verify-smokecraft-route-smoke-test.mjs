// SmokeCraft 360 Final Closeout — full route smoke test. Loads every
// active SmokeCraft learner-facing route with a seeded, journey-eligible
// session and checks for: HTTP 200, no white screen (real DOM content),
// no uncaught JS error, no missing lazy-import failure.
import { chromium } from 'playwright'

const UI_BASE = 'http://localhost:5000'
const API_BASE = 'http://localhost:3001'

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

// Every active SmokeCraft learner-facing route registered in src/App.jsx
// under the /smokecraft parent (excludes bare redirect-only aliases,
// which have no independent component to smoke test).
const ROUTES = [
  '/smokecraft', '/smokecraft/enroll', '/smokecraft/venue-select', '/smokecraft/identity',
  '/smokecraft/resume', '/smokecraft/welcome', '/smokecraft/mentor-selection',
  '/smokecraft/humidor-match', '/smokecraft/meet-your-cigar', '/smokecraft/terroir',
  '/smokecraft/format', '/smokecraft/cigar-gauge-guide', '/smokecraft/wrapper-strength',
  '/smokecraft/seed-soil', '/smokecraft/cut-toast-light', '/smokecraft/lighting-tutorial',
  '/smokecraft/first-third', '/smokecraft/flavor-memory', '/smokecraft/pairing-lab',
  '/smokecraft/request-purchase', '/smokecraft/second-third', '/smokecraft/mentor-commentary',
  '/smokecraft/knowledge-drop', '/smokecraft/knowledge-check-demo', '/smokecraft/mini-tasting-module',
  '/smokecraft/final-third', '/smokecraft/scorecard', '/smokecraft/smokecraft-challenge',
  '/smokecraft/second-humidor-match', '/smokecraft/mini-tasting', '/smokecraft/ai-summary',
  '/smokecraft/pairing-recommendations', '/smokecraft/passport-stamp', '/smokecraft/connections',
  '/smokecraft/management-sync', '/smokecraft/final-review', '/smokecraft/rewards',
  '/smokecraft/skill-tree', '/smokecraft/collections', '/smokecraft/challenge-hub',
  '/smokecraft/challenges/blend-fault-identification', '/smokecraft/filler-arrangement',
  '/smokecraft/session-complete', '/smokecraft/golden-box', '/smokecraft/golden-box/status',
  '/smokecraft/golden-box/competitions', '/smokecraft/golden-box/judge',
  '/smokecraft/menu', '/smokecraft/cart',
]

async function guestCookie() {
  const res = await fetch(`${API_BASE}/api/smokecraft/management-sync/guest-session`, { method: 'POST' })
  const raw = res.headers.get('set-cookie') || ''
  const idx = raw.indexOf('smokecraft_guest_session=')
  return raw.slice(idx).split(';')[0].split('=')[1]
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
try {
  const cookieVal = await guestCookie()

  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const jsErrors = []
    page.on('pageerror', e => jsErrors.push(e.message))
    page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('favicon')) jsErrors.push(msg.text()) })

    await page.context().addCookies([{ name: 'smokecraft_guest_session', value: cookieVal, domain: 'localhost', path: '/' }])
    await page.addInitScript(() => {
      sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
      localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry', 'enroll', 'identity', 'venue-select', 'mentor', 'humidor-match', 'format', 'wrapper-strength', 'seed-soil', 'scorecard', 'passport-stamp'], xp: 50, badges: [] }))
      localStorage.setItem('sc_journey_v1', JSON.stringify({
        stateVersion: 3, spineVersion: 1,
        selectedVenue: { id: 'gs-venue', name: 'GS Venue', skipped: false, selectedAt: Date.now() },
        mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'Dominican Republic', flag: '🇩🇴', bio: 'Master of volcanic soil nutrients.', image: '/mentors/don-alejandro.jpg' }],
      }))
    })

    let status = null
    try {
      const resp = await page.goto(`${UI_BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
      status = resp ? resp.status() : null
      await page.waitForTimeout(700)
    } catch (err) {
      check(`Route loads: ${route}`, false, `navigation error: ${err.message}`)
      await page.close()
      continue
    }

    const bodyText = (await page.textContent('body').catch(() => '')) || ''
    const imgCount = await page.locator('img').count().catch(() => 0)
    // A few approved routes are intentionally minimal asset screens
    // (SmokeCraftAssetScreen — a documented pattern rendering the
    // approved image as a CSS background-image on a fixed, aria-labeled
    // div, not an <img> tag). A real aria-labeled screen root counts as
    // real content there, not a white screen.
    const hasAssetScreenRoot = await page.locator('div[aria-label]').count().catch(() => 0)
    const hasContent = bodyText.trim().length > 20 || imgCount > 0 || hasAssetScreenRoot > 0
    const criticalErrors = jsErrors.filter(e => !/ResizeObserver|Warning:|DevTools|navigator\.vibrate|chromestatus\.com|429 \(Too Many Requests\)/i.test(e))

    check(`Route loads: ${route}`, status === 200 && hasContent, `status=${status}, contentLen=${bodyText.trim().length}, imgs=${imgCount}`)
    check(`No uncaught JS error: ${route}`, criticalErrors.length === 0, criticalErrors.slice(0, 2).join(' | '))

    await page.close()
  }

  await browser.close()
} catch (err) {
  console.error('Unexpected error:', err)
  await browser.close()
  process.exit(1)
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
console.log(`Routes tested: ${ROUTES.length}`)
if (failed.length) process.exit(1)
