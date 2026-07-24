// SmokeCraft 360 — Prompt 4 viewport proof (Step 10 of the mandate).
//
// Screenshots the mandate's 17 required screens at all 5 required
// viewports and checks for horizontal overflow (document.scrollWidth vs
// window.innerWidth) — the cheapest, most reliable automated signal for
// "no clipped content / no overflow" across a static-screenshot sweep.
import fs from 'fs'
import { chromium } from 'playwright'

const UI = process.env.SC_UI || 'http://localhost:5050'
const PROOF = 'public/proof/smokecraft-complete-game-playthrough/viewport-matrix'
fs.mkdirSync(PROOF, { recursive: true })

const VIEWPORTS = [
  { name: 'handheld',    width: 390,  height: 844 },
  { name: 'tablet-10in', width: 810,  height: 1080 },
  { name: 'tablet-12in', width: 1024, height: 1366 },
  { name: 'tablet-15in', width: 1194, height: 834 },
  { name: 'desktop',     width: 1440, height: 900 },
]

const SCREENS = [
  ['landing',           '/smokecraft',                     []],
  ['enrollment',        '/smokecraft/enroll',               []],
  ['identity',          '/smokecraft/identity',              ['enroll']],
  ['venue',             '/smokecraft/venue-select',          ['enroll']],
  ['welcome',           '/smokecraft/welcome',               ['enroll']],
  ['session-1',         '/smokecraft/welcome',               ['enroll']],
  ['humidor-match',     '/smokecraft/humidor-match',         ['enroll', 'entry']],
  ['mentor-selection',  '/smokecraft/mentor-selection',      ['enroll', 'entry']],
  ['lighting-tutorial', '/smokecraft/lighting-tutorial',     ['enroll', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light']],
  ['ring-gauge',        '/smokecraft/vitola',                ['enroll', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third', 'mentor-commentary', 'knowledge-drop', 'final-third', 'scorecard', 'ai-summary', 'pairing-recommendations', 'passport-stamp', 'final-review']],
  ['flavor-wheel',      '/smokecraft/vitola',                ['enroll', 'entry']],
  ['golden-box',        '/smokecraft/golden-box',            ['enroll', 'entry']],
  ['packaging-studio',  '/smokecraft/packaging-studio',      ['enroll', 'entry']],
  ['scorecard',         '/smokecraft/scorecard',             ['enroll', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third', 'mentor-commentary', 'knowledge-drop', 'final-third']],
  ['session-27',        '/smokecraft/session-complete',      ['enroll', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third', 'mentor-commentary', 'knowledge-drop', 'final-third', 'scorecard', 'ai-summary', 'pairing-recommendations', 'passport-stamp', 'final-review', 'rewards']],
  ['results',           '/smokecraft/session-complete',      ['enroll', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third', 'mentor-commentary', 'knowledge-drop', 'final-third', 'scorecard', 'ai-summary', 'pairing-recommendations', 'passport-stamp', 'final-review', 'rewards']],
  ['awards',            '/smokecraft/rewards',               ['enroll', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third', 'mentor-commentary', 'knowledge-drop', 'final-third', 'scorecard', 'ai-summary', 'pairing-recommendations', 'passport-stamp', 'final-review']],
]

let pass = 0, fail = 0
const results = []
function check(label, ok) {
  if (ok) { pass++; console.log(`PASS — ${label}`) }
  else { fail++; console.log(`FAIL — ${label}`) }
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  const page = await ctx.newPage()
  for (const [name, route, ids] of SCREENS) {
    await page.goto(`${UI}/smokecraft`, { waitUntil: 'networkidle' })
    await page.evaluate((v) => {
      localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: v, profile: { firstName: 'Test Player' } }))
      localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, selectedVenue: { skipped: true }, identity: { name: 'Test Player' } }))
    }, ids)
    await page.goto(`${UI}${route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(150)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    const shot = `${PROOF}/${vp.name}-${name}.png`
    await page.screenshot({ path: shot })
    const noOverflow = overflow <= 2 // sub-pixel tolerance
    results.push({ viewport: vp.name, screen: name, route, width: vp.width, overflowPx: overflow, noOverflow, screenshot: shot.replace('public/', '/') })
    if (!noOverflow) console.log(`  -> ${vp.name}/${name} overflow=${overflow}px`)
  }
  await ctx.close()
}
await browser.close()

const overflowFails = results.filter(r => !r.noOverflow)
check(`No horizontal overflow across ${results.length} viewport/screen combinations (${VIEWPORTS.length} viewports x ${SCREENS.length} screens)`, overflowFails.length === 0)

fs.writeFileSync(`${PROOF}/results.json`, JSON.stringify({ pass, fail, total: results.length, overflowFails, results }, null, 2))
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
