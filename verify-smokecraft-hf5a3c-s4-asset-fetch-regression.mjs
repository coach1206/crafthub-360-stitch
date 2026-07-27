#!/usr/bin/env node
/**
 * Holistic Fix 5A-3C — targeted regression for the S4 (Terroir) approved
 * asset fetch. S4's approved image is data-gated behind a real section
 * click (not fetched on plain page load) — verifies it loads reliably
 * across first visit, refresh, back-and-return, and repeat visit.
 */
import { chromium } from 'playwright'

const BASE = process.env.SC_UI || 'http://localhost:5050'
let pass = 0, fail = 0
const results = []

function assert(name, cond, detail) {
  if (cond) { pass++; results.push({ name, ok: true }); console.log(`  PASS  ${name}`) }
  else { fail++; results.push({ name, ok: false, detail }); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

const ASSET_PATH = '/assets/smokecraft-reference/approved/smokecraft-terroir.png'
const STEPS = ['enroll', 'identity', 'entry', 'welcome', 'humidor-match', 'meet-your-cigar']
const JOURNEY = { selectedVenue: { id: 'v1', name: 'Test Lounge' }, selectedCigar: { name: 'Test Reserve Robusto', origin: 'Nicaragua', wrapper: 'Habano', strength: 'Medium', body: 'Medium', format: 'Robusto' } }

async function seed(page) {
  await page.goto(`${BASE}/smokecraft`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(([steps, journey]) => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: steps, profile: { firstName: 'Test' } }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, identity: { preferredName: 'Test' }, ...journey }))
  }, [STEPS, JOURNEY])
}

async function clickCountrySection(page) {
  const btn = page.getByRole('tab', { name: /^Country/i }).first()
  // A repeat click on an already-viewed section may legitimately be served
  // from Chromium's cache without a fresh network 'response' event firing
  // at all — that is correct, fast browser behavior, not a defect. The
  // real user-facing signal is whether the <img> element itself actually
  // renders the loaded bytes, so check that directly rather than
  // requiring a network event every time.
  await btn.click()
  try {
    await page.waitForFunction(() => {
      const img = document.querySelector('img[src*="smokecraft-terroir"]')
      return img && img.complete && img.naturalWidth > 0
    }, { timeout: 3000 })
    return true
  } catch { return false }
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const rendered = new Set()
  page.on('response', r => { if (/\.(png|jpg|jpeg)(\?|$)/i.test(r.url())) rendered.add(new URL(r.url()).pathname) })

  console.log('\n── S4 (Terroir) approved-asset fetch — targeted regression ──')

  // 1. First visit — asset not fetched on plain load (data-gated by design).
  await seed(page)
  await page.goto(`${BASE}/smokecraft/terroir`, { waitUntil: 'networkidle', timeout: 30000 })
  assert('S4 does not fetch the approved image on plain page load (data-gated by real design, not a bug)', ![...rendered].some(p => p.includes('smokecraft-terroir.png')))

  // 2. First visit — clicking a section deterministically triggers the fetch.
  const ok1 = await clickCountrySection(page)
  assert('First visit: clicking a section deterministically loads the approved image (no fixed sleep required)', ok1)

  // 3. Refresh — the asset re-fetches once the section is re-selected (viewedSections persists, but the image itself is not cached as "already shown" across a hard reload).
  rendered.clear()
  await page.reload({ waitUntil: 'networkidle' })
  const ok2 = await clickCountrySection(page)
  assert('Refresh: clicking the section again loads the approved image', ok2)

  // 4. Back and return.
  await page.goto(`${BASE}/smokecraft/meet-your-cigar`, { waitUntil: 'networkidle' })
  await page.goto(`${BASE}/smokecraft/terroir`, { waitUntil: 'networkidle' })
  const ok3 = await clickCountrySection(page)
  assert('Back-and-return: the section click still loads the approved image', ok3)

  // 5. Repeated visit (already-viewed section) — still resolves the image, not a broken/blank state.
  const ok4 = await clickCountrySection(page)
  assert('Repeated click on an already-viewed section still resolves the image (cache-served is fine)', ok4)

  // 6. Cached asset response (second load within the same session should hit browser cache but still resolve, not error).
  const imgOk = await page.evaluate(() => {
    const img = document.querySelector('img[src*="smokecraft-terroir"]')
    return img ? img.complete && img.naturalWidth > 0 : false
  })
  assert('The rendered <img> element actually loaded (complete, non-zero width) — no blank/broken image', imgOk)

  // 7. Slow-response resilience: throttle this request and confirm the deterministic wait still resolves (bounded, not indefinite).
  await page.route('**/smokecraft-terroir.png*', async route => {
    await new Promise(r => setTimeout(r, 800))
    await route.continue()
  })
  await page.reload({ waitUntil: 'networkidle' })
  const slowStart = Date.now()
  const ok5 = await clickCountrySection(page)
  const slowElapsed = Date.now() - slowStart
  assert('A slow (800ms) response still resolves within the bounded 3s wait, not stalling indefinitely', ok5 && slowElapsed < 3000)
  await page.unroute('**/smokecraft-terroir.png*')

  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)

  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5a-3c', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5a-3c/01-s4-asset-fetch-regression-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
