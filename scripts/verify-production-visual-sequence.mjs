// Production-readiness pass — scoped route crawler. Visits the real
// 27-session sequence plus key gamification/Golden Box/POS360/E.A.T. 360
// entry routes, in a real browser, and records reachability, console
// errors, and horizontal overflow. This is a real, executed check — not
// a full exhaustive interaction crawl (out of scope for this pass, see
// docs/audits/production-readiness-consolidated/07-PRODUCTION-GATE.md).
import { chromium } from 'playwright'
import fs from 'fs'

const UI_BASE = process.env.UI_BASE || 'http://localhost:5000'

const ROUTES = [
  // Locked 27-session sequence
  '/smokecraft/welcome', '/smokecraft/humidor-match', '/smokecraft/meet-your-cigar',
  '/smokecraft/terroir', '/smokecraft/format', '/smokecraft/cut-toast-light',
  '/smokecraft/lighting-tutorial', '/smokecraft/first-third', '/smokecraft/flavor-memory',
  '/smokecraft/pairing-lab', '/smokecraft/second-third', '/smokecraft/mentor-commentary',
  '/smokecraft/knowledge-drop', '/smokecraft/final-third', '/smokecraft/scorecard',
  '/smokecraft/ai-summary', '/smokecraft/pairing-recommendations', '/smokecraft/passport-stamp',
  '/smokecraft/final-review', '/smokecraft/rewards', '/smokecraft/session-complete',
  // Entry layer / gamification
  '/smokecraft/golden-box', '/smokecraft/mentor-selection', '/smokecraft/seed-soil',
  '/smokecraft/leaderboard',
  // POS360 / E.A.T. 360 entry points
  '/pos3', '/eat', '/venue-management',
]

const results = []

async function seed(page) {
  await page.goto(`${UI_BASE}/smokecraft/venue-select`)
  await page.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: 'crawler-venue', name: 'Crawler Venue', skipped: false, selectedAt: Date.now() },
      mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'DR', image: '/mentors/don-alejandro.jpg' }],
    }))
  })
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

for (const route of ROUTES) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  let httpStatus = null
  let error = null
  try {
    await seed(page)
    const resp = await page.goto(`${UI_BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 12000 })
    httpStatus = resp ? resp.status() : null
    await page.waitForTimeout(500)
  } catch (e) {
    error = e.message
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2).catch(() => null)
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200)).catch(() => '')
  results.push({ route, httpStatus, error, overflow, consoleErrorCount: consoleErrors.length, consoleErrors: consoleErrors.slice(0, 3), bodyPreview: bodyText })
  await context.close().catch(() => {})
}
await browser.close()

fs.mkdirSync('docs/audits/production-readiness-consolidated', { recursive: true })
fs.writeFileSync('docs/audits/production-readiness-consolidated/04-ROUTE-CRAWLER-RESULTS.json', JSON.stringify(results, null, 2))

const reachable = results.filter(r => r.httpStatus && r.httpStatus < 400 && !r.error)
const blank = results.filter(r => r.bodyPreview.trim().length < 5)
const withOverflow = results.filter(r => r.overflow === true)
const withErrors = results.filter(r => r.consoleErrorCount > 0)

console.log(`Reachable: ${reachable.length}/${results.length}`)
console.log(`Blank body: ${blank.length}`)
console.log(`Horizontal overflow: ${withOverflow.length}`)
console.log(`Console errors: ${withErrors.length}`)
for (const r of results) {
  if (!(r.httpStatus && r.httpStatus < 400 && !r.error) || r.overflow || r.consoleErrorCount > 0) {
    console.log(`FLAG ${r.route} — status=${r.httpStatus} error=${r.error} overflow=${r.overflow} consoleErrors=${r.consoleErrorCount}`)
  }
}
