// Package 6: isolated 5-viewport responsive check (fresh guest identities,
// run in its own short server session — same isolation pattern used for
// Package 5's responsive suite, avoiding the documented rate-limiter
// artifact from chaining many suites on one server).
import { chromium } from 'playwright'
import fs from 'fs'

const UI_BASE = 'http://localhost:5000'
const PROOF_DIR = 'public/proof/smokecraft-package-6'
fs.mkdirSync(PROOF_DIR, { recursive: true })

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}
async function overflowCheck(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
}
async function seedJourney(page, venueTag) {
  await page.goto(`${UI_BASE}/smokecraft/venue-select`)
  await page.evaluate((venueTag) => {
    sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: venueTag, name: 'Package 6 Responsive Venue', skipped: false, selectedAt: Date.now() },
      mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'DR', image: '/mentors/don-alejandro.jpg' }],
    }))
  }, venueTag)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

try {
  for (const [name, width, height] of [['390x844', 390, 844], ['360x800', 360, 800], ['tablet10-1280x800', 1280, 800], ['tablet12-1366x1024', 1366, 1024], ['tablet15-1920x1080', 1920, 1080]]) {
    const vp = await browser.newPage({ viewport: { width, height } })
    await seedJourney(vp, `pkg6r-${name}`)
    await vp.goto(`${UI_BASE}/smokecraft/vitola`)
    await vp.waitForTimeout(1200)
    check(`Viewport ${name}: no horizontal overflow`, !(await overflowCheck(vp)))
    const text = await vp.textContent('body')
    check(`Viewport ${name}: all major sections present and reachable`,
      text.includes('Cigar Anatomy') && text.includes('Complete Flavor Wheel') && text.includes('Perfect Pairing Builder'))
    if (name === '390x844') await vp.screenshot({ path: `${PROOF_DIR}/05-handheld.png` })
    if (name === 'tablet12-1366x1024') await vp.screenshot({ path: `${PROOF_DIR}/06-tablet.png` })
    await vp.close()
  }

  const dp = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await seedJourney(dp, 'pkg6r-desktop')
  await dp.goto(`${UI_BASE}/smokecraft/vitola`)
  await dp.waitForTimeout(1200)
  check('Viewport desktop 1920x1080: no horizontal overflow', !(await overflowCheck(dp)))
  await dp.screenshot({ path: `${PROOF_DIR}/07-desktop.png` })
  await dp.close()

  await browser.close()
} catch (err) {
  console.error('Unexpected error:', err)
  results.push({ name: 'unexpected error', pass: false, detail: err.message })
  await browser.close().catch(() => {})
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
fs.writeFileSync(`${PROOF_DIR}/responsive-results.json`, JSON.stringify(results, null, 2))
if (failed.length) process.exit(1)
