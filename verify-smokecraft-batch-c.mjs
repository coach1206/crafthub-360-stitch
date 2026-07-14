/**
 * verify-smokecraft-batch-c.mjs
 * SmokeCraft 360 — Controlled Batch C Verification
 */

import { chromium } from 'playwright'

const BASE  = 'http://localhost:5000'
const PASS  = '✅'
const FAIL  = '❌'

let passed = 0
let failed = 0
let browser

function log(ok, label, detail = '') {
  const sym = ok ? PASS : FAIL
  console.log(`${sym} ${label}${detail ? ` — ${detail}` : ''}`)
  ok ? passed++ : failed++
}

const JOURNEY_STATE = {
  stateVersion: 2,
  identity: { preferredName: 'Investor', fullName: 'Test Investor' },
  selectedCigar: { name: 'Oliva Serie V', origin: 'Nicaragua', wrapper: 'Habano Maduro', strength: 'Full', body: 'Full', tastingProfile: 'Dark chocolate, leather, espresso' },
  pairing: { recommendation: 'Whiskey', primary: 'Whiskey', selections: ['Whiskey'] },
  mentor: [{ id: 'alejandro', name: 'Don Alejandro', origin: 'Dominican Republic' }],
  format: { id: 'robusto', label: 'Robusto' },
  flavorMemory: { selectedFlavors: ['Cedar', 'Leather', 'Earth'] },
  requestPurchase: { orderPath: 'self' },
  cutToastLight: { cut: 'Straight Cut', toast: 'Gentle Toast', light: 'Cedar Spill' },
}

async function openPage(withApiMock = false) {
  const page = await browser.newPage()
  if (withApiMock) {
    // Match only fetch/XHR to /api/ endpoints — not src/api/ JS modules
    await page.route(/^http:\/\/localhost:5000\/api\//, r => r.fulfill({ status: 200, body: '{}', contentType: 'application/json' }))
  }
  return page
}

async function goTo(page, path) {
  await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate((state) => {
    localStorage.setItem('sc_journey_v1', JSON.stringify(state))
    localStorage.setItem('sc_identity_v1', JSON.stringify(state.identity))
    sessionStorage.setItem('novee_demo_mode', '1')
  }, JOURNEY_STATE)
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.waitForTimeout(700)
}

async function imageLoaded(page, fragment) {
  return page.evaluate((s) => {
    const imgs = [...document.querySelectorAll('img')]
    return imgs.some(img => img.src.includes(s) && img.naturalWidth > 0)
  }, fragment)
}

// ── FinalThird ────────────────────────────────────────────────────────────────
async function verifyFinalThird() {
  console.log('\n── FinalThird ─────────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/final-third')

    log(await imageLoaded(p, 'FINAL%20THIRD'), 'Approved asset loaded (FINAL THIRD.png)')

    const allBtns = await p.locator('button[aria-pressed]').count()
    log(allBtns >= 10, 'Focus + flavor zone buttons present', `${allBtns} found`)

    await p.locator('button[aria-pressed]').first().click()
    await p.waitForTimeout(300)
    const pressed = await p.locator('button[aria-pressed="true"]').count()
    log(pressed >= 1, 'Zone toggles to selected state')
  } finally { await p.close() }
}

// ── Scorecard ─────────────────────────────────────────────────────────────────
async function verifyScorecard() {
  console.log('\n── Scorecard ──────────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/scorecard')

    log(await imageLoaded(p, 'Scorecard'), 'Approved asset loaded (Scorecard.png)')

    const continueBtn = await p.locator('button').filter({ hasText: /Continue to Final Review/ }).count()
    log(continueBtn > 0, 'Continue to Final Review button present')
  } finally { await p.close() }
}

// ── FinalReview ───────────────────────────────────────────────────────────────
async function verifyFinalReview() {
  console.log('\n── FinalReview ────────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/final-review')

    log(await imageLoaded(p, 'FINAL%20REVIEW'), 'Approved asset loaded (FINAL REVIEW.png)')

    const readinessBtns = await p.locator('button[aria-pressed]').count()
    log(readinessBtns >= 6, 'Readiness check buttons present', `${readinessBtns} found`)

    await p.locator('button[aria-pressed]').first().click()
    await p.waitForTimeout(300)
    const pressed = await p.locator('button[aria-pressed="true"]').count()
    log(pressed >= 1, 'Readiness row toggles to checked state')
  } finally { await p.close() }
}

// ── PassportStamp ─────────────────────────────────────────────────────────────
async function verifyPassportStamp() {
  console.log('\n── PassportStamp ──────────────────────────────────────────')
  const p = await openPage(true)
  try {
    await goTo(p, '/smokecraft/passport-stamp')

    log(await imageLoaded(p, 'PASSPORT'), 'Approved asset loaded (PASSPORT STAMP.png)')

    const btns = await p.locator('button').count()
    log(btns > 0, 'NavBar button present', `${btns} buttons`)

    const continueBtn = await p.locator('button').filter({ hasText: /Continue to Connections/ }).count()
    log(continueBtn > 0, 'Continue to Connections button present')
  } finally { await p.close() }
}

// ── Connections ───────────────────────────────────────────────────────────────
async function verifyConnections() {
  console.log('\n── Connections ────────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/connections')

    log(await imageLoaded(p, 'connections-hero'), 'Approved asset loaded (connections-hero.jpg)')

    const connBtns = await p.locator('button[aria-pressed]').count()
    log(connBtns >= 7, 'Seven connection option buttons present', `${connBtns} found`)

    await p.locator('button[aria-pressed]').first().click()
    await p.waitForTimeout(300)
    const pressed = await p.locator('button[aria-pressed="true"]').count()
    log(pressed >= 1, 'Connection option toggles to selected state')

    const saved = await p.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('sc_connections_v1') || 'null') } catch { return null }
    })
    log(Array.isArray(saved) && saved.length > 0, 'Connection selection persisted to localStorage')
  } finally { await p.close() }
}

// ── ManagementSync ────────────────────────────────────────────────────────────
async function verifyManagementSync() {
  console.log('\n── ManagementSync ─────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/management-sync')

    log(await imageLoaded(p, 'MANAGEMENT%20SYNC'), 'Approved asset loaded (MANAGEMENT SYNC.png)')

    const continueBtn = await p.locator('button').filter({ hasText: /Complete SmokeCraft Journey/ }).count()
    log(continueBtn > 0, 'Complete Journey button present')

    const cigarVisible = await p.locator('text=Oliva Serie V').count()
    log(cigarVisible > 0, 'Cigar name from journey visible on ManagementSync')
  } finally { await p.close() }
}

// ── SessionComplete ───────────────────────────────────────────────────────────
async function verifySessionComplete() {
  console.log('\n── SessionComplete ────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/session-complete')

    log(await imageLoaded(p, 'SESSION%20COMPLETE'), 'Approved asset loaded (SESSION COMPLETE.png)')

    log(await p.locator('text=Oliva Serie V').count() > 0, 'Cigar name from journey visible')
    log(await p.locator('text=Whiskey').count() > 0, 'Pairing recommendation visible')
    log(await p.locator('text=Don Alejandro').count() > 0, 'Mentor name visible')

    const returnBtn = await p.locator('button').filter({ hasText: /Return to SmokeCraft/ }).count()
    log(returnBtn > 0, 'Return to SmokeCraft button present')
  } finally { await p.close() }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
;(async () => {
  console.log('SmokeCraft 360 — Batch C Verification')
  console.log('='.repeat(55))

  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

  try {
    const p = await browser.newPage()
    const resp = await p.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null)
    await p.close()
    if (!resp || resp.status() >= 500) {
      console.log('❌ Dev server not responding at', BASE)
      process.exit(1)
    }
    console.log('Dev server OK at', BASE)

    await verifyFinalThird()
    await verifyScorecard()
    await verifyFinalReview()
    await verifyPassportStamp()
    await verifyConnections()
    await verifyManagementSync()
    await verifySessionComplete()

  } finally {
    await browser.close()
  }

  console.log('\n' + '='.repeat(55))
  console.log(`Results: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
})()
