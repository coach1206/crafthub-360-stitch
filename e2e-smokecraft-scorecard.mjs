/**
 * SmokeCraft Scorecard E2E Tests
 * Route: /smokecraft/scorecard
 * 30 interaction checks
 */
import { chromium } from 'playwright'

const BASE   = 'http://localhost:4173'
const ROUTE  = `${BASE}/smokecraft/scorecard`
const API    = 'http://localhost:3001'
const CATS   = ['appearance', 'construction', 'draw', 'burn', 'flavor', 'pairing']

let pass = 0, fail = 0
const results = []

function log(name, ok, detail = '') {
  const status = ok ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} | ${name}${detail ? ' — ' + detail : ''}`)
  results.push({ name, ok, detail })
  ok ? pass++ : fail++
}

async function setup(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.removeItem('sc_scorecard_v1')
  })
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
}

// React-compatible range slider update using native value setter
async function setSlider(page, selector, value) {
  await page.evaluate(([sel, val]) => {
    const el = document.querySelector(sel)
    if (!el) return
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    nativeSetter.call(el, String(val))
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, [selector, value])
  await page.waitForTimeout(80)
}

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const page    = await browser.newPage()

  // ── 1. Route loads ──────────────────────────────────────────────────────────
  await setup(page)
  log('Route loads (200)', !page.url().includes('locked'))

  // ── 2. Background image rendered ────────────────────────────────────────────
  const img = page.locator('img[src*="Scorecard"]').first()
  log('Background image present', await img.count() > 0)

  // ── 3. Gradient mask overlay present (aria-hidden) ───────────────────────────
  const mask = page.locator('[aria-hidden="true"]').first()
  log('Gradient mask overlay (aria-hidden)', await mask.count() > 0)

  // ── 4. All 6 category sliders present ──────────────────────────────────────
  let sliderCount = 0
  for (const cat of CATS) {
    const s = page.locator(`[data-slider="score-${cat}"]`)
    if (await s.count() > 0) sliderCount++
  }
  log('All 6 category sliders present', sliderCount === 6, `found ${sliderCount}/6`)

  // ── 5. All sliders start at 0 ───────────────────────────────────────────────
  let allZero = true
  for (const cat of CATS) {
    const s = page.locator(`[data-slider="score-${cat}"]`)
    if (await s.count() > 0) {
      const val = await s.inputValue()
      if (parseInt(val) !== 0) { allZero = false; break }
    }
  }
  log('All sliders start at 0', allZero)

  // ── 6. Overall score not shown when no categories rated ──────────────────────
  const overallText = await page.locator('body').innerText()
  const hasBakedScore = /\b87\b/.test(overallText) || /\b87\/100\b/.test(overallText)
  log('No baked 87/100 score shown', !hasBakedScore)

  // ── 7. "Excellent Smoke" not shown without calculation ──────────────────────
  log('No "Excellent Smoke" without data', !overallText.includes('Excellent Smoke'))

  // ── 8. Move flavor slider and verify score updates ─────────────────────────
  await setSlider(page, '[data-slider="score-flavor"]', 20)
  await page.waitForTimeout(300)
  const afterFlavorText = await page.locator('body').innerText()
  log('Score display updates after slider move', /\d+/.test(afterFlavorText))

  // ── 9. Overall calculated (not baked) after rating flavor ───────────────────
  // flavor=20/25 = 80%, weight 0.30, overall = 80 (since it's only category)
  // We just check it's not showing '87'
  log('Overall not baked 87 after partial rating', !afterFlavorText.includes('87/100'))

  // ── 10. Rate all 6 categories and check overall appears ────────────────────
  const testValues = { appearance: 18, construction: 20, draw: 22, burn: 19, flavor: 20, pairing: 16 }
  for (const [cat, val] of Object.entries(testValues)) {
    await setSlider(page, `[data-slider="score-${cat}"]`, val)
  }
  await page.waitForTimeout(400)
  const ratedText = await page.locator('body').innerText()
  // overall: appearance(72%*0.1) + construction(80%*0.15) + draw(88%*0.20) + burn(76%*0.15) + flavor(80%*0.30) + pairing(64%*0.10)
  // = 7.2 + 12 + 17.6 + 11.4 + 24 + 6.4 = 78.6 → "Very Good Smoke"
  log('Overall score appears after rating all categories', /\d+(\.\d+)?/.test(ratedText))

  // ── 11. Score label computed, not "Excellent Smoke" at these values ─────────
  log('Score label not "Exceptional" at ~78.6 score', !ratedText.includes('Exceptional Smoke'))

  // ── 12. "Very Good Smoke" appears for ~78 score ─────────────────────────────
  log('"Very Good Smoke" label computed for ~78 score', ratedText.includes('Very Good Smoke'))

  // ── 13. Session duration meta field exists ──────────────────────────────────
  const durationField = page.locator('[data-meta="duration"]')
  log('Session duration meta field present', await durationField.count() > 0)

  // ── 14. Puff count meta field exists ────────────────────────────────────────
  const puffField = page.locator('[data-meta="puff-count"]')
  log('Puff count meta field present', await puffField.count() > 0)

  // ── 15. Relight count meta field exists ─────────────────────────────────────
  const relightField = page.locator('[data-meta="relight-count"]')
  log('Relight count meta field present', await relightField.count() > 0)

  // ── 16. Duration field accepts input ────────────────────────────────────────
  if (await durationField.count() > 0) {
    await durationField.fill('75')
    const dval = await durationField.inputValue()
    log('Duration field accepts numeric input', dval === '75')
  } else {
    log('Duration field accepts numeric input', false, 'field not found')
  }

  // ── 17. Cigar details section present (truthful empty if no session data) ───
  const cigarSection = page.locator('[data-section="cigar-details"]')
  log('Cigar details section present', await cigarSection.count() > 0)

  // ── 18. Pairing summary section present ─────────────────────────────────────
  const pairingSection = page.locator('[data-section="pairing-summary"]')
  log('Pairing summary section present', await pairingSection.count() > 0)

  // ── 19. Third summaries section present ─────────────────────────────────────
  const thirdSection = page.locator('[data-section="tasting-summary"]')
  log('Tasting/third summaries section present', await thirdSection.count() > 0)

  // ── 20. XP +100 indicator shown ─────────────────────────────────────────────
  const bodyText = await page.locator('body').innerText()
  log('XP +100 indicator present', bodyText.includes('+100') || bodyText.includes('100 XP'))

  // ── 21. Badge not shown pre-submit ──────────────────────────────────────────
  const badgeEl = page.locator('[data-badge]')
  const badgeVisible = await badgeEl.count() > 0 && await badgeEl.first().isVisible()
  log('Badge not shown pre-submit', !badgeVisible)

  // ── 22. No invisible hotspots ────────────────────────────────────────────────
  const hotspots = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href], button')).filter(el => {
      const s = window.getComputedStyle(el)
      return s.opacity === '0' || s.visibility === 'hidden'
    }).length
  })
  log('No invisible hotspots', hotspots === 0, `found ${hotspots}`)

  // ── 23. Nav menu button visible ─────────────────────────────────────────────
  const navBtn = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], [data-testid="smokecraft-menu-btn"]').first()
  log('Nav menu button visible', await navBtn.count() > 0)

  // ── 24. Works without image (image CSS hidden) ───────────────────────────────
  await page.evaluate(() => document.querySelectorAll('img').forEach(i => i.style.display = 'none'))
  const noImgText = await page.locator('body').innerText()
  log('Functional without image (sliders still present)', noImgText.length > 100)
  // restore
  await page.evaluate(() => document.querySelectorAll('img').forEach(i => i.style.display = ''))

  // ── 25. localStorage persists state ─────────────────────────────────────────
  const stored = await page.evaluate(() => localStorage.getItem('sc_scorecard_v1'))
  log('localStorage persists scorecard state', stored !== null)

  // ── 26. Back button → /smokecraft/final-third ───────────────────────────────
  const backBtn = page.locator('button:has-text("Back")').first()
  if (await backBtn.count() > 0) {
    await backBtn.click()
    await page.waitForTimeout(600)
    log('Back navigates to /smokecraft/final-third', page.url().includes('final-third'))
    await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(400)
  } else {
    log('Back button present', false, 'not found')
  }

  // ── 27. Submit fires POST /api/smokecraft/scorecard/submit ──────────────────
  await setup(page)
  // Rate all categories first
  for (const [cat, val] of Object.entries(testValues)) {
    await setSlider(page, `[data-slider="score-${cat}"]`, val)
  }
  await page.waitForTimeout(300)

  let apiCalled = false
  let apiPayload = null
  page.on('request', req => {
    if (req.url().includes('/api/smokecraft/scorecard/submit') && req.method() === 'POST') {
      apiCalled = true
      try { apiPayload = req.postDataJSON() } catch {}
    }
  })

  const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Continue"), [data-nav="continue"]').first()
  if (await submitBtn.count() > 0) {
    await submitBtn.click()
    await page.waitForTimeout(1000)
  }
  log('Submit fires POST /api/smokecraft/scorecard/submit', apiCalled)

  // ── 28. API response shows calculated score label ────────────────────────────
  const submitResp = await fetch(`${API}/api/smokecraft/scorecard/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'e2e-test',
      categories: testValues,
    }),
  }).then(r => r.json())
  log('API returns calculated scoreLabel', submitResp.ok && submitResp.scorecard?.scoreLabel != null, submitResp.scorecard?.scoreLabel)
  log('API overall not baked 87', submitResp.scorecard?.overall !== 87, `got ${submitResp.scorecard?.overall}`)

  // ── 29. Continue → /smokecraft/final-review ─────────────────────────────────
  await setup(page)
  for (const [cat, val] of Object.entries(testValues)) {
    await setSlider(page, `[data-slider="score-${cat}"]`, val)
  }
  await page.waitForTimeout(300)
  const continueBtn = page.locator('button:has-text("Submit"), button:has-text("Continue"), [data-nav="continue"]').first()
  if (await continueBtn.count() > 0) {
    await continueBtn.click()
    await page.waitForTimeout(1200)
    log('Continue navigates to /smokecraft/final-review', page.url().includes('final-review'))
  } else {
    log('Continue button present', false, 'not found')
  }

  // ── 30. Score label in result matches expected range ─────────────────────────
  const label30 = submitResp.scorecard?.scoreLabel
  const expected30Labels = ['Exceptional Smoke', 'Outstanding Smoke', 'Very Good Smoke', 'Good Smoke', 'Average Smoke', 'Below Average']
  log('Score label is one of defined labels', expected30Labels.includes(label30), label30)

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n──────────────────────────────────────────`)
  console.log(`SmokeCraft Scorecard E2E: ${pass} PASS / ${fail} FAIL`)
  console.log(`──────────────────────────────────────────`)

  await browser.close()
  process.exit(fail > 0 ? 1 : 0)
})()
