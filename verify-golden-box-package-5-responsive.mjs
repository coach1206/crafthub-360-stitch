// Package 5 closure: isolated keyboard + 5-viewport responsive check
// (split out from the main closure suite to avoid rate-limiter
// contention from the many prior API calls in that longer run).
import { chromium } from 'playwright'
import fs from 'fs'

const UI_BASE = 'http://localhost:5000'
const PROOF_DIR = 'public/proof/smokecraft-package-5'
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
      selectedVenue: { id: venueTag, name: 'Package 5 Responsive Venue', skipped: false, selectedAt: Date.now() },
      mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'DR', image: '/mentors/don-alejandro.jpg' }],
    }))
  }, venueTag)
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

try {
  const kbPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await seedJourney(kbPage, 'pkg5r-kb')
  await kbPage.goto(`${UI_BASE}/smokecraft/wrapper-strength`)
  await kbPage.waitForTimeout(1500)
  await kbPage.locator('button[aria-label="Place Ligero into the arrangement"]').focus()
  await kbPage.keyboard.press('Enter')
  await kbPage.waitForTimeout(400)
  check('Keyboard: Enter places a leaf into the arrangement', (await kbPage.textContent('body')).includes('Position 1'))
  await kbPage.close()

  for (const [name, width, height] of [['390x844', 390, 844], ['360x800', 360, 800], ['tablet10-1280x800', 1280, 800], ['tablet12-1366x1024', 1366, 1024], ['tablet15-1920x1080', 1920, 1080]]) {
    const vp = await browser.newPage({ viewport: { width, height } })
    await seedJourney(vp, `pkg5r-${name}`)
    await vp.goto(`${UI_BASE}/smokecraft/wrapper-strength`)
    await vp.waitForTimeout(1200)
    check(`Viewport ${name}: no horizontal overflow with new closure sections`, !(await overflowCheck(vp)))
    // Confirm filler-arrangement + rolling-process + QC sections all reachable, not clipped
    const text = await vp.textContent('body')
    check(`Viewport ${name}: filler arrangement, rolling process, and QC sections all present`,
      text.includes('Filler Arrangement Practice') && text.includes('The Rolling Process') && text.includes('Quality Control Checklist'))
    if (name === '390x844') await vp.screenshot({ path: `${PROOF_DIR}/10-handheld-closure.png` })
    if (name === 'tablet12-1366x1024') await vp.screenshot({ path: `${PROOF_DIR}/11-tablet-closure.png` })
    await vp.close()
  }

  const dp = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await seedJourney(dp, 'pkg5r-desktop')
  await dp.goto(`${UI_BASE}/smokecraft/wrapper-strength`)
  await dp.waitForTimeout(1200)
  check('Viewport desktop 1920x1080: no horizontal overflow', !(await overflowCheck(dp)))
  await dp.screenshot({ path: `${PROOF_DIR}/12-desktop-closure.png` })
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
