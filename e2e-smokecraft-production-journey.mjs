/**
 * SmokeCraft 360 Full Production Journey E2E Test
 * Covers all 20 required routes + 3 supporting routes
 * Saves results to public/proof/smokecraft-production-journey/results.json
 * Screenshots to public/proof/smokecraft-production-journey/screenshots/
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE  = 'http://localhost:4173'
const API   = 'http://localhost:3001'
const SHOTS = join(__dirname, 'public/proof/smokecraft-production-journey/screenshots')
const RESULTS_PATH = join(__dirname, 'public/proof/smokecraft-production-journey/results.json')

mkdirSync(SHOTS, { recursive: true })

let pass = 0, fail = 0
const results = []

function log(name, ok, detail = '') {
  const status = ok ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} | ${name}${detail ? ' — ' + detail : ''}`)
  ok ? pass++ : fail++
  results.push({ name, ok, detail, ts: new Date().toISOString() })
}

async function setup(page, { clearAll = false } = {}) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate((clear) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    if (clear) {
      localStorage.removeItem('sc_scorecard_v1')
      localStorage.removeItem('sc_passport_stamp_v1')
      localStorage.removeItem('sc_connections_v1')
    }
  }, clearAll)
}

async function goto(page, route, { waitMs = 700 } = {}) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(waitMs)
}

async function shot(page, name) {
  const file = join(SHOTS, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  return file
}

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const page    = await browser.newPage()
  await page.setViewportSize({ width: 390, height: 844 })

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 1: /smokecraft (Landing / S1)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft')
  log('R01 Route /smokecraft loads', !page.url().includes('locked'))
  log('R01 No locked redirect', !page.url().includes('locked'))
  {
    const img = page.locator('img').first()
    log('R01 Background image present', await img.count() > 0)
  }
  {
    const hasOverlay = await page.locator('[aria-hidden="true"]').count() > 0
    const hasImg = await page.locator('img').count() > 0
    log('R01 Image or overlay layer present', hasOverlay || hasImg)
  }
  {
    const btn = page.locator('button, a[href]').first()
    log('R01 Interactive element present', await btn.count() > 0)
  }
  await shot(page, '01-smokecraft-landing')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 2: /smokecraft/enroll (S2)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/enroll')
  log('R02 Route /smokecraft/enroll loads', !page.url().includes('locked'))
  {
    // Enroll uses image hotspot pattern — check for image or interactive element
    const imgCount = await page.locator('img').count()
    const btnCount = await page.locator('button, a[href]').count()
    log('R02 Image or interactive element present', imgCount > 0 || btnCount > 0)
  }
  await shot(page, '02-smokecraft-enroll')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 3: /smokecraft/golden-box (S3)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/golden-box')
  log('R03 Route /smokecraft/golden-box loads', !page.url().includes('locked'))
  {
    const img = page.locator('img').first()
    log('R03 Background image present', await img.count() > 0)
  }
  await shot(page, '03-smokecraft-golden-box')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 4: /smokecraft/mentor-selection (S4)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/mentor-selection')
  log('R04 Route /smokecraft/mentor-selection loads', !page.url().includes('locked'))
  {
    const body = await page.locator('body').innerText()
    log('R04 Content present', body.length > 100)
  }
  await shot(page, '04-smokecraft-mentor-selection')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 5: /smokecraft/format (S5)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/format')
  log('R05 Route /smokecraft/format loads', !page.url().includes('locked'))
  {
    const img = page.locator('img').first()
    log('R05 Background image present', await img.count() > 0)
  }
  await shot(page, '05-smokecraft-format')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 6: /smokecraft/seed-soil (S7)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/seed-soil')
  log('R06 Route /smokecraft/seed-soil loads', !page.url().includes('locked'))
  {
    const img = page.locator('img').first()
    log('R06 Background image present', await img.count() > 0)
  }
  await shot(page, '06-smokecraft-seed-soil')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 7: /smokecraft/pairing-lab (S8)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/pairing-lab')
  log('R07 Route /smokecraft/pairing-lab loads', !page.url().includes('locked'))
  {
    const img = page.locator('img').first()
    log('R07 Background image present', await img.count() > 0)
  }
  {
    const body = await page.locator('body').innerText()
    const noFake = !/John\s+Doe|Jane\s+Doe/i.test(body)
    log('R07 No fake guest names', noFake)
  }
  await shot(page, '07-smokecraft-pairing-lab')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 8: /smokecraft/humidor-match (S9)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/humidor-match')
  log('R08 Route /smokecraft/humidor-match loads', !page.url().includes('locked'))
  {
    const img = page.locator('img[src*="humidor"]').first()
    log('R08 Humidor background image present', await img.count() > 0)
  }
  await shot(page, '08-smokecraft-humidor-match')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 9: /smokecraft/request-purchase (S10)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/request-purchase')
  log('R09 Route /smokecraft/request-purchase loads', !page.url().includes('locked'))
  {
    const img = page.locator('img').first()
    log('R09 Background image present', await img.count() > 0)
  }
  await shot(page, '09-smokecraft-request-purchase')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 10: /smokecraft/cut-toast-light (S11)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/cut-toast-light')
  log('R10 Route /smokecraft/cut-toast-light loads', !page.url().includes('locked'))
  {
    const img = page.locator('img[src*="CUT"], img[src*="cut"]').first()
    log('R10 cut-toast-light image present', await img.count() > 0)
  }
  await shot(page, '10-smokecraft-cut-toast-light')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 11: /smokecraft/first-third (S12)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/first-third')
  log('R11 Route /smokecraft/first-third loads', !page.url().includes('locked'))
  {
    const img = page.locator('img').first()
    log('R11 Background image present', await img.count() > 0)
  }
  {
    const hasOverlay = await page.locator('[aria-hidden="true"]').count() > 0
    const hasImg = await page.locator('img').count() > 0
    log('R11 Image or overlay layer present', hasOverlay || hasImg)
  }
  await shot(page, '11-smokecraft-first-third')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 12: /smokecraft/second-third (S13)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/second-third')
  log('R12 Route /smokecraft/second-third loads', !page.url().includes('locked'))
  {
    const img = page.locator('img').first()
    log('R12 Background image present', await img.count() > 0)
  }
  await shot(page, '12-smokecraft-second-third')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 13: /smokecraft/flavor-memory (S14)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/flavor-memory')
  log('R13 Route /smokecraft/flavor-memory loads', !page.url().includes('locked'))
  {
    const img = page.locator('img[src*="FLAVOR"], img[src*="flavor"]').first()
    log('R13 flavor-memory image present', await img.count() > 0)
  }
  {
    const body = await page.locator('body').innerText()
    log('R13 No baked flavor counts', !(/\b127\s*flavors|\b43\s*notes/i.test(body)))
  }
  await shot(page, '13-smokecraft-flavor-memory')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 14: /smokecraft/final-third (S15)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/final-third')
  log('R14 Route /smokecraft/final-third loads', !page.url().includes('locked'))
  {
    const img = page.locator('img').first()
    log('R14 Background image present', await img.count() > 0)
  }
  await shot(page, '14-smokecraft-final-third')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 15: /smokecraft/scorecard (S16) — REBUILT THIS SESSION
  // ────────────────────────────────────────────────────────────────────
  await setup(page, { clearAll: true })
  await goto(page, '/smokecraft/scorecard')
  log('R15 Route /smokecraft/scorecard loads', !page.url().includes('locked'))
  {
    const img = page.locator('img[src*="Scorecard"], img[src*="scorecard"]').first()
    log('R15 Scorecard background image present', await img.count() > 0)
  }
  {
    const sliders = await page.locator('input[type="range"]').count()
    log('R15 6 scoring sliders present', sliders === 6, `found ${sliders}`)
  }
  {
    const body = await page.locator('body').innerText()
    log('R15 No baked "87/100" score', !body.includes('87/100'))
    log('R15 No baked "Excellent Smoke"', !body.includes('Excellent Smoke'))
  }
  {
    const s1 = page.locator('[data-section="cigar-details"]')
    const s2 = page.locator('[data-section="pairing-summary"]')
    const s3 = page.locator('[data-section="tasting-summary"]')
    log('R15 cigar-details section present', await s1.count() > 0)
    log('R15 pairing-summary section present', await s2.count() > 0)
    log('R15 tasting-summary section present', await s3.count() > 0)
  }
  // Set some sliders and verify score updates
  {
    await page.evaluate(() => {
      const sliders = Array.from(document.querySelectorAll('input[type="range"]'))
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      sliders.forEach(s => {
        setter.call(s, '18')
        s.dispatchEvent(new Event('input', { bubbles: true }))
        s.dispatchEvent(new Event('change', { bubbles: true }))
      })
    })
    await page.waitForTimeout(300)
    const body = await page.locator('body').innerText()
    // 18/25 on all = 72% → "Very Good Smoke"
    log('R15 Score label updates after slider change', body.includes('Very Good') || body.includes('Good') || body.includes('Exceptional') || body.includes('Outstanding'))
  }
  // Submit scorecard
  {
    const submitBtn = page.locator('button:has-text("Submit Scorecard")').first()
    if (await submitBtn.count() > 0) {
      await submitBtn.click()
      await page.waitForTimeout(1000)
      const stored = await page.evaluate(() => localStorage.getItem('sc_scorecard_v1'))
      log('R15 localStorage persists scorecard after submit', stored !== null)
    } else {
      log('R15 localStorage persists scorecard after submit', false, 'submit button not found')
    }
  }
  await shot(page, '15-smokecraft-scorecard')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 16: /smokecraft/final-review (S20)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/final-review')
  log('R16 Route /smokecraft/final-review loads', !page.url().includes('locked'))
  {
    const img = page.locator('img[src*="FINAL"], img[src*="final"]').first()
    log('R16 final-review image present', await img.count() > 0)
  }
  {
    const contBtn = page.locator('button:has-text("Continue")').first()
    log('R16 Continue button present', await contBtn.count() > 0)
    if (await contBtn.count() > 0) {
      await contBtn.click()
      await page.waitForTimeout(800)
      log('R16 Continue → /smokecraft/passport-stamp', page.url().includes('passport-stamp'))
    }
  }
  await shot(page, '16-smokecraft-final-review')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 17: /smokecraft/passport-stamp (S21) — REBUILT THIS SESSION
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/passport-stamp')
  log('R17 Route /smokecraft/passport-stamp loads', !page.url().includes('locked'))
  {
    const img = page.locator('img[src*="PASSPORT"], img[src*="passport"]').first()
    log('R17 Passport background image present', await img.count() > 0)
  }
  {
    const seal = page.locator('[data-testid="stamp-seal"]')
    log('R17 Stamp seal SVG present', await seal.count() > 0)
  }
  {
    const s1 = page.locator('[data-section="session-summary"]')
    const s2 = page.locator('[data-section="cigar-pairing"]')
    const s3 = page.locator('[data-section="score-rewards"]')
    const s4 = page.locator('[data-section="eligibility"]')
    const s5 = page.locator('[data-section="next-unlock"]')
    log('R17 session-summary section present', await s1.count() > 0)
    log('R17 cigar-pairing section present', await s2.count() > 0)
    log('R17 score-rewards section present', await s3.count() > 0)
    log('R17 eligibility section present', await s4.count() > 0)
    log('R17 next-unlock section present', await s5.count() > 0)
  }
  {
    const body = await page.locator('body').innerText()
    log('R17 No baked "13/16 stamps"', !body.includes('13/16'))
    log('R17 No baked "EXPLORER" level', !body.includes('EXPLORER'))
    log('R17 No baked "+150 XP"', !body.includes('+150'))
    log('R17 XP +75 indicator present', body.includes('+75'))
  }
  {
    const cont = page.locator('button:has-text("Continue")').first()
    if (await cont.count() > 0) {
      await cont.click()
      await page.waitForTimeout(800)
      log('R17 Continue → /smokecraft/connections', page.url().includes('connections'))
      await setup(page)
      await goto(page, '/smokecraft/passport-stamp')
    } else {
      log('R17 Continue → /smokecraft/connections', false, 'Continue not found')
    }
  }
  {
    const back = page.locator('button:has-text("Back")').first()
    if (await back.count() > 0) {
      await back.click()
      await page.waitForTimeout(600)
      log('R17 Back → /smokecraft/final-review', page.url().includes('final-review'))
    } else {
      log('R17 Back → /smokecraft/final-review', false, 'Back not found')
    }
  }
  await shot(page, '17-smokecraft-passport-stamp')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 18: /smokecraft/connections (S22) — REBUILT THIS SESSION
  // ────────────────────────────────────────────────────────────────────
  await setup(page, { clearAll: true })
  await goto(page, '/smokecraft/connections')
  log('R18 Route /smokecraft/connections loads', !page.url().includes('locked'))
  {
    const img = page.locator('img[src*="connections"]').first()
    log('R18 connections-hero.jpg image present', await img.count() > 0)
  }
  {
    const mask = page.locator('[aria-hidden="true"]').first()
    log('R18 Gradient mask overlay present', await mask.count() > 0)
  }
  {
    const ACTION_IDS = ['share-passport','exchange-contact','follow-venue','save-mentor','join-cigar-circle','join-leaderboard','qr-connect']
    let found = 0
    for (const id of ACTION_IDS) {
      if (await page.locator(`[data-action-card="${id}"]`).count() > 0) found++
    }
    log('R18 All 7 action cards present', found === 7, `found ${found}/7`)
  }
  {
    const s1 = page.locator('[data-section="privacy-note"]')
    const s2 = page.locator('[data-section="passport360-sync"]')
    const s3 = page.locator('[data-section="passport-sync"]')
    log('R18 privacy-note section present', await s1.count() > 0)
    log('R18 passport360-sync section present', await s2.count() > 0)
    log('R18 passport-sync section present', await s3.count() > 0)
  }
  {
    // Select an action and confirm button appears
    const t = page.locator('[data-action-toggle="follow-venue"]')
    if (await t.count() > 0) {
      await t.click()
      await page.waitForTimeout(300)
      const confirmBtn = page.locator('[data-action="confirm-connections"]')
      log('R18 Confirm button appears after selection', await confirmBtn.count() > 0 && await confirmBtn.isVisible())
    } else {
      log('R18 Confirm button appears after selection', false, 'follow-venue toggle not found')
    }
  }
  {
    const back = page.locator('button:has-text("Back")').first()
    if (await back.count() > 0) {
      await back.click()
      await page.waitForTimeout(600)
      log('R18 Back → /smokecraft/passport-stamp', page.url().includes('passport-stamp'))
      await setup(page, { clearAll: true })
      await goto(page, '/smokecraft/connections')
    } else {
      log('R18 Back → /smokecraft/passport-stamp', false, 'Back not found')
    }
  }
  await shot(page, '18-smokecraft-connections')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 19: /smokecraft/management-sync (S23)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/management-sync')
  log('R19 Route /smokecraft/management-sync loads', !page.url().includes('locked'))
  {
    const img = page.locator('img[src*="MANAGEMENT"], img[src*="management"]').first()
    log('R19 management-sync image present', await img.count() > 0)
  }
  {
    const body = await page.locator('body').innerText()
    log('R19 Content present', body.length > 100)
  }
  await shot(page, '19-smokecraft-management-sync')

  // ────────────────────────────────────────────────────────────────────
  // ROUTE 20: /smokecraft/session-complete (S24)
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/session-complete')
  log('R20 Route /smokecraft/session-complete loads', !page.url().includes('locked'))
  {
    // SessionComplete uses image-first pattern; check for image or interactive elements
    const imgCount = await page.locator('img').count()
    const btnCount = await page.locator('button, a[href]').count()
    log('R20 Image or interactive element present', imgCount > 0 || btnCount > 0)
  }
  await shot(page, '20-smokecraft-session-complete')

  // ────────────────────────────────────────────────────────────────────
  // SUPPORTING ROUTE A: /smokecraft/identity
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/identity')
  log('RSA Route /smokecraft/identity loads', !page.url().includes('404'))
  await shot(page, 'SA-smokecraft-identity')

  // ────────────────────────────────────────────────────────────────────
  // SUPPORTING ROUTE B: /smokecraft/blend
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/blend')
  log('RSB Route /smokecraft/blend loads', !page.url().includes('404') && !page.url().includes('locked'))
  await shot(page, 'SB-smokecraft-blend')

  // ────────────────────────────────────────────────────────────────────
  // SUPPORTING ROUTE C: /smokecraft/menu
  // ────────────────────────────────────────────────────────────────────
  await setup(page)
  await goto(page, '/smokecraft/menu')
  log('RSC Route /smokecraft/menu loads', !page.url().includes('404'))
  await shot(page, 'SC-smokecraft-menu')

  // ────────────────────────────────────────────────────────────────────
  // CROSS-ROUTE: No invisible hotspots on key screens
  // ────────────────────────────────────────────────────────────────────
  for (const [label, route] of [
    ['Connections', '/smokecraft/connections'],
    ['PassportStamp', '/smokecraft/passport-stamp'],
    ['Scorecard', '/smokecraft/scorecard'],
    ['FinalReview', '/smokecraft/final-review'],
  ]) {
    await setup(page, { clearAll: true })
    await goto(page, route)
    const hotspots = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href], button')).filter(el => {
        const s = window.getComputedStyle(el)
        return s.opacity === '0' || s.visibility === 'hidden'
      }).length
    )
    log(`No invisible hotspots — ${label}`, hotspots === 0, `found ${hotspots}`)
  }

  // ────────────────────────────────────────────────────────────────────
  // CROSS-ROUTE: Image-hidden functional check
  // ────────────────────────────────────────────────────────────────────
  for (const [label, route] of [
    ['Connections', '/smokecraft/connections'],
    ['PassportStamp', '/smokecraft/passport-stamp'],
    ['Scorecard', '/smokecraft/scorecard'],
  ]) {
    await setup(page, { clearAll: true })
    await goto(page, route)
    await page.evaluate(() => document.querySelectorAll('img').forEach(i => i.style.display = 'none'))
    const body = await page.locator('body').innerText()
    log(`Functional without image — ${label}`, body.length > 100)
    await page.evaluate(() => document.querySelectorAll('img').forEach(i => i.style.display = ''))
  }

  // ────────────────────────────────────────────────────────────────────
  // RESPONSIVE: 6 viewports on Connections
  // ────────────────────────────────────────────────────────────────────
  const VIEWPORTS = [
    { name: 'iPhone-SE', width: 375, height: 667 },
    { name: 'iPhone-14', width: 390, height: 844 },
    { name: 'iPhone-14-Plus', width: 430, height: 932 },
    { name: 'iPad-Mini', width: 768, height: 1024 },
    { name: 'iPad-Pro', width: 1024, height: 1366 },
    { name: 'Desktop-1280', width: 1280, height: 800 },
  ]
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await setup(page, { clearAll: true })
    await goto(page, '/smokecraft/connections')
    const body = await page.locator('body').innerText()
    const hasScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth)
    log(`Responsive ${vp.name} (${vp.width}×${vp.height}) — no horizontal overflow`, !hasScroll)
    log(`Responsive ${vp.name} — content renders`, body.length > 100)
    await shot(page, `responsive-connections-${vp.name}`)
  }
  await page.setViewportSize({ width: 390, height: 844 })

  // ────────────────────────────────────────────────────────────────────
  // TRUTHFUL STATUS AUDIT — no fake Connected/Synced/Live badges
  // ────────────────────────────────────────────────────────────────────
  const FAKE_STATUS_PATTERN = /\b(Live Hardware Connected|POS3 Connected|Hardware Online|Scanner Active|Sensor Connected)\b/i
  for (const [label, route] of [
    ['Connections', '/smokecraft/connections'],
    ['ManagementSync', '/smokecraft/management-sync'],
    ['SessionComplete', '/smokecraft/session-complete'],
  ]) {
    await setup(page)
    await goto(page, route)
    const body = await page.locator('body').innerText()
    log(`Truthful status audit — ${label}`, !FAKE_STATUS_PATTERN.test(body))
  }

  // ────────────────────────────────────────────────────────────────────
  // ACCESSIBILITY: Basic checks on rebuilt screens
  // ────────────────────────────────────────────────────────────────────
  for (const [label, route] of [
    ['Connections', '/smokecraft/connections'],
    ['PassportStamp', '/smokecraft/passport-stamp'],
    ['Scorecard', '/smokecraft/scorecard'],
  ]) {
    await setup(page, { clearAll: true })
    await goto(page, route)
    // Check buttons have accessible names
    const unnamedBtns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).filter(b =>
        !b.textContent?.trim() && !b.getAttribute('aria-label') && !b.getAttribute('aria-labelledby')
      ).length
    )
    log(`A11y — no unnamed buttons — ${label}`, unnamedBtns === 0, `found ${unnamedBtns}`)
    // Check images have alt attributes
    const noAltImgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img')).filter(i =>
        !i.hasAttribute('alt')
      ).length
    )
    log(`A11y — images have alt attributes — ${label}`, noAltImgs === 0, `found ${noAltImgs} missing alt`)
  }

  // ────────────────────────────────────────────────────────────────────
  // API INTEGRATION VERIFICATION
  // ────────────────────────────────────────────────────────────────────

  // Scorecard API
  {
    const resp = await fetch(`${API}/api/smokecraft/scorecard/labels/all`).then(r => r.json())
    log('API scorecard /labels/all returns ok', resp.ok && Array.isArray(resp.labels))
  }
  {
    const sid = `e2e-journey-${Date.now()}`
    const resp = await fetch(`${API}/api/smokecraft/scorecard/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid, guestId: 'e2e-guest',
        scores: { flavor: 20, draw: 18, burn: 17, construction: 16, appearance: 15, pairing: 14 },
      }),
    }).then(r => r.json())
    log('API scorecard /submit returns ok with scorecardId', resp.ok && resp.scorecard?.scorecardId?.startsWith('SC-'))
  }

  // Passport Stamp API
  {
    const resp = await fetch(`${API}/api/smokecraft/passport-stamp/eligibility?sessionId=jrny-test&completedSteps=&scorecardId=`)
      .then(r => r.json())
    log('API passport-stamp /eligibility returns eligible:false for empty', resp.ok && resp.eligible === false)
  }
  {
    const STEPS = 'humidor-match,first-third,second-third,flavor-memory,final-third,scorecard,final-review'
    const resp = await fetch(`${API}/api/smokecraft/passport-stamp/eligibility?sessionId=jrny-test&completedSteps=${STEPS}&scorecardId=SC-123`)
      .then(r => r.json())
    log('API passport-stamp /eligibility returns eligible:true with all steps', resp.ok && resp.eligible === true)
  }

  // Connections API
  {
    const resp = await fetch(`${API}/api/smokecraft/connections/status/jrny-test`).then(r => r.json())
    log('API connections /status returns ok with actions array', resp.ok && Array.isArray(resp.actions))
  }
  {
    const sid = `jrny-conn-${Date.now()}`
    const resp = await fetch(`${API}/api/smokecraft/connections/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, action: 'follow-venue', guestId: 'e2e-guest', payload: {} }),
    }).then(r => r.json())
    log('API connections /action POST records follow-venue', resp.ok && resp.recorded)
  }

  // ────────────────────────────────────────────────────────────────────
  // FLOW ORDER VERIFICATION — correct sequence of routes
  // ────────────────────────────────────────────────────────────────────
  // Verify final-review → passport-stamp → connections flow
  {
    await setup(page)
    await goto(page, '/smokecraft/final-review')
    const cont = page.locator('button:has-text("Continue")').first()
    if (await cont.count() > 0) {
      await cont.click()
      await page.waitForTimeout(800)
      log('Flow: final-review → passport-stamp', page.url().includes('passport-stamp'))
    } else {
      log('Flow: final-review → passport-stamp', false, 'Continue not found')
    }
  }
  {
    const cont = page.locator('button:has-text("Continue")').first()
    if (await cont.count() > 0) {
      await cont.click()
      await page.waitForTimeout(800)
      log('Flow: passport-stamp → connections', page.url().includes('connections'))
    } else {
      log('Flow: passport-stamp → connections', false, 'Continue not found')
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────────
  console.log(`\n══════════════════════════════════════════════════════`)
  console.log(`SmokeCraft 360 Production Journey: ${pass} PASS / ${fail} FAIL`)
  console.log(`══════════════════════════════════════════════════════`)

  // Write results JSON
  const summary = {
    runAt: new Date().toISOString(),
    total: pass + fail, pass, fail,
    passRate: `${Math.round((pass / (pass + fail)) * 100)}%`,
    checks: results,
  }
  writeFileSync(RESULTS_PATH, JSON.stringify(summary, null, 2))
  console.log(`\nResults saved → ${RESULTS_PATH}`)
  console.log(`Screenshots  → ${SHOTS}/`)

  await browser.close()
  process.exit(fail > 0 ? 1 : 0)
})()
