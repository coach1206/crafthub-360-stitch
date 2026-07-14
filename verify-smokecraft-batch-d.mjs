/**
 * verify-smokecraft-batch-d.mjs
 * SmokeCraft 360 — Controlled Batch D Verification
 *
 * Routes:
 *   /smokecraft              (landing)
 *   /smokecraft/enroll
 *   /smokecraft/leaderboard
 *   /smokecraft/event-challenge
 *   /smokecraft/how-it-works
 *   /smokecraft/smokecraft-challenge
 *   /smokecraft/second-humidor-match
 *   /smokecraft/mini-tasting
 *   /smokecraft/visit-complete
 *   /smokecraft/wrapper-strength  → must redirect to /smokecraft/seed-soil
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

async function openPage() {
  const page = await browser.newPage()
  return page
}

async function goTo(page, path) {
  // Seed demo mode on the landing page first so sessionStorage is set before we navigate
  await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
  await page.waitForTimeout(700)
}

async function imageInDom(page, fragment) {
  return page.evaluate((s) => {
    // Check background-image CSS
    const bgEls = [...document.querySelectorAll('*')].filter(el => {
      const bg = getComputedStyle(el).backgroundImage
      return bg && bg.includes(s)
    })
    if (bgEls.length > 0) return true
    // Check <img> tags
    const imgs = [...document.querySelectorAll('img')]
    return imgs.some(img => img.src.includes(s) && img.naturalWidth > 0)
  }, fragment)
}

// ── Landing ───────────────────────────────────────────────────────────────────
async function verifyLanding() {
  console.log('\n── Landing (/smokecraft) ──────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft')

    const imgOk = await imageInDom(p, 'smokecraft-landing')
    log(imgOk, 'Approved landing asset visible')

    const startBtn = await p.locator('button').filter({ hasText: /Start SmokeCraft/i }).count()
    log(startBtn > 0, 'Start SmokeCraft button present')

    const howItWorks = await p.locator('button, a').filter({ hasText: /How It Works/i }).count()
    log(howItWorks > 0, 'How It Works navigation present')
  } finally { await p.close() }
}

// ── Enroll ────────────────────────────────────────────────────────────────────
async function verifyEnroll() {
  console.log('\n── Enroll ──────────────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/enroll')

    const imgOk = await imageInDom(p, 'discover-profile-bg')
    log(imgOk, 'Approved enroll background visible')

    const cta = await p.locator('button').filter({ hasText: /Begin Your Journey|Continue|Get Started/i }).count()
    log(cta > 0, 'Primary CTA button present')

    const back = await p.locator('button, a').filter({ hasText: /Back/i }).count()
    log(back > 0, 'Back navigation present')
  } finally { await p.close() }
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
async function verifyLeaderboard() {
  console.log('\n── Leaderboard ─────────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/leaderboard')

    const imgOk = await imageInDom(p, 'NEW%20DEMO%20LOUNG%20RANKING') ||
                  await imageInDom(p, 'NEW DEMO LOUNG RANKING')
    log(imgOk, 'Approved leaderboard asset (NEW DEMO LOUNG RANKING.png) visible')

    const back = await p.locator('button, a').filter({ hasText: /Back/i }).count()
    log(back > 0, 'Back navigation present')
  } finally { await p.close() }
}

// ── Event Challenge ───────────────────────────────────────────────────────────
async function verifyEventChallenge() {
  console.log('\n── Event Challenge ─────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/event-challenge')

    const imgOk = await imageInDom(p, 'smokecraft-event-challenge')
    log(imgOk, 'Approved event-challenge asset visible')

    const back = await p.locator('button, a').filter({ hasText: /Back/i }).count()
    log(back > 0, 'Back navigation present')
  } finally { await p.close() }
}

// ── How It Works ──────────────────────────────────────────────────────────────
async function verifyHowItWorks() {
  console.log('\n── How It Works ────────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/how-it-works')

    const imgOk = await imageInDom(p, 'smokecraft-how-it-works')
    log(imgOk, 'Approved how-it-works asset visible')

    const getStarted = await p.locator('button').filter({ hasText: /Get Started/i }).count()
    log(getStarted > 0, 'Get Started button present')

    const back = await p.locator('button, a').filter({ hasText: /Back/i }).count()
    log(back > 0, 'Back navigation present')
  } finally { await p.close() }
}

// ── SmokeCraft Challenge ──────────────────────────────────────────────────────
async function verifySmokeCraftChallenge() {
  console.log('\n── SmokeCraft Challenge ────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/smokecraft-challenge')

    const imgOk = await imageInDom(p, 'smokecraft-challenge')
    log(imgOk, 'Approved smokecraft-challenge asset visible')

    const accept = await p.locator('button').filter({ hasText: /Accept the Challenge|Challenge/i }).count()
    log(accept > 0, 'Challenge action button present')

    const back = await p.locator('button, a').filter({ hasText: /Back/i }).count()
    log(back > 0, 'Back navigation present')
  } finally { await p.close() }
}

// ── Second Humidor Match ──────────────────────────────────────────────────────
async function verifySecondHumidorMatch() {
  console.log('\n── Second Humidor Match ────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/second-humidor-match')

    const imgOk = await imageInDom(p, 'smokecraft-second-humidor-match')
    log(imgOk, 'Approved second-humidor-match asset visible')

    const cigarBtn = await p.locator('button').filter({ hasText: /Select Your Cigar|Continue/i }).count()
    log(cigarBtn > 0, 'Cigar selection CTA present')

    const back = await p.locator('button, a').filter({ hasText: /Back/i }).count()
    log(back > 0, 'Back navigation present')
  } finally { await p.close() }
}

// ── Mini Tasting ──────────────────────────────────────────────────────────────
async function verifyMiniTasting() {
  console.log('\n── Mini Tasting ────────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/mini-tasting')

    const imgOk = await imageInDom(p, 'smokecraft-mini-tasting-round')
    log(imgOk, 'Approved mini-tasting asset visible')

    const completeBtn = await p.locator('button').filter({ hasText: /Complete Tasting Round|Continue/i }).count()
    log(completeBtn > 0, 'Tasting complete CTA present')

    const back = await p.locator('button, a').filter({ hasText: /Back/i }).count()
    log(back > 0, 'Back navigation present')
  } finally { await p.close() }
}

// ── Visit Complete ────────────────────────────────────────────────────────────
async function verifyVisitComplete() {
  console.log('\n── Visit Complete ──────────────────────────────────────────')
  const p = await openPage()
  try {
    await goTo(p, '/smokecraft/visit-complete')

    const imgOk = await imageInDom(p, 'smokecraft-visit-complete') ||
                  await imageInDom(p, 'visit-complete')
    log(imgOk, 'Approved visit-complete asset visible')

    const returnBtn = await p.locator('button').filter({ hasText: /Return to SmokeCraft/i }).count()
    log(returnBtn > 0, 'Return to SmokeCraft Hub button present')

    // Visit status label
    const visitLabel = await p.locator('text=Complete').count()
    log(visitLabel > 0, 'Visit completion label visible')
  } finally { await p.close() }
}

// ── Wrapper Strength Redirect ─────────────────────────────────────────────────
async function verifyWrapperStrengthRedirect() {
  console.log('\n── Wrapper Strength Redirect ───────────────────────────────')
  const p = await openPage()
  try {
    await p.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await p.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
    await p.goto(`${BASE}/smokecraft/wrapper-strength`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await p.evaluate(() => sessionStorage.setItem('novee_demo_mode', '1'))
    await p.waitForTimeout(1200)

    const url = p.url()
    log(url.includes('/smokecraft/seed-soil'), 'Wrapper-strength redirects to /smokecraft/seed-soil', url)
  } finally { await p.close() }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
;(async () => {
  console.log('SmokeCraft 360 — Batch D Verification')
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

    await verifyLanding()
    await verifyEnroll()
    await verifyLeaderboard()
    await verifyEventChallenge()
    await verifyHowItWorks()
    await verifySmokeCraftChallenge()
    await verifySecondHumidorMatch()
    await verifyMiniTasting()
    await verifyVisitComplete()
    await verifyWrapperStrengthRedirect()

  } finally {
    await browser.close()
  }

  console.log('\n' + '='.repeat(55))
  console.log(`Results: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
})()
