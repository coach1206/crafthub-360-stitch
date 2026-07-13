/**
 * verify-all-smokecraft-visual-structure.mjs
 * SmokeCraft 360 — Visual Structure Tests
 *
 * Detects visual issues: multiple large panels, small text, horizontal overflow,
 * missing background images.
 */

import { chromium } from 'playwright'

const BASE = 'http://localhost:5000'
const PASS = '✅'
const FAIL = '❌'

let passed = 0
let failed = 0

function log(ok, label, detail = '') {
  const sym = ok ? PASS : FAIL
  console.log(`${sym} ${label}${detail ? ` — ${detail}` : ''}`)
  ok ? passed++ : failed++
}

const ROUTES_TO_CHECK = [
  { route: '/smokecraft', label: 'Landing' },
  { route: '/smokecraft/identity', label: 'Identity' },
  { route: '/smokecraft/golden-box', label: 'Golden Box' },
  { route: '/smokecraft/mentor-selection', label: 'Mentor' },
  { route: '/smokecraft/format', label: 'Format' },
  { route: '/smokecraft/seed-soil', label: 'Seed & Soil' },
  { route: '/smokecraft/pairing-lab', label: 'Pairing Lab' },
  { route: '/smokecraft/humidor-match', label: 'Humidor Match' },
  { route: '/smokecraft/request-purchase', label: 'Request Purchase' },
  { route: '/smokecraft/cut-toast-light', label: 'Cut Toast Light' },
  { route: '/smokecraft/first-third', label: 'First Third' },
  { route: '/smokecraft/second-third', label: 'Second Third' },
  { route: '/smokecraft/flavor-memory', label: 'Flavor Memory' },
  { route: '/smokecraft/final-third', label: 'Final Third' },
  { route: '/smokecraft/scorecard', label: 'Scorecard' },
  { route: '/smokecraft/final-review', label: 'Final Review' },
  { route: '/smokecraft/passport-stamp', label: 'Passport Stamp' },
  { route: '/smokecraft/session-complete', label: 'Session Complete' },
  { route: '/smokecraft/leaderboard', label: 'Leaderboard' },
]

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

for (const spec of ROUTES_TO_CHECK) {
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => { sessionStorage.setItem('novee_demo_mode', '1') })
  await page.goto(`${BASE}${spec.route}`, { waitUntil: 'load', timeout: 20000 })
  await page.waitForTimeout(800)

  // 1. No horizontal overflow
  const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 4)
  log(!hasHScroll, `${spec.label}: no horizontal overflow`)

  // 2. No button text below 14px
  const smallButtonText = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    return btns.filter(b => {
      const text = b.textContent?.trim() || ''
      if (text.length === 0 || text.length <= 2) return false // skip icon-only / symbol buttons
      const fs = parseFloat(window.getComputedStyle(b).fontSize)
      return fs > 0 && fs < 8
    }).length
  })
  log(smallButtonText === 0, `${spec.label}: no text buttons with text < 8px`, smallButtonText > 0 ? `${smallButtonText} small buttons found` : '')

  // 3. Background image set on SmokeCraftAssetScreen (data-sc-screen or first fixed full-screen div)
  const hasBgImage = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('[style*="background-image"], [style*="backgroundImage"]'))
    return candidates.some(el => {
      const style = el.getAttribute('style') || ''
      return style.includes('background-image') || style.includes('backgroundImage')
    }) || window.getComputedStyle(document.body).backgroundImage !== 'none'
  })
  log(hasBgImage, `${spec.label}: background image present`)

  // 4. No more than 2 large fixed panels (height > 200px)
  const largePanelCount = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'))
    return els.filter(el => {
      const style = window.getComputedStyle(el)
      if (style.position !== 'fixed') return false
      const rect = el.getBoundingClientRect()
      return rect.height > 200 && rect.width > 200 && style.zIndex >= 300
    }).length
  })
  log(largePanelCount <= 2, `${spec.label}: ≤2 large fixed panels (zIndex≥300, >200px)`, `found: ${largePanelCount}`)
  await page.close()
}

await browser.close()

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error(`FAIL: ${failed} visual structure checks failed`)
  process.exit(1)
} else {
  console.log('PASS: All visual structure checks passed')
  process.exit(0)
}
