/**
 * SmokeCraft Passport Stamp E2E Tests
 * Route: /smokecraft/passport-stamp
 * 32 interaction checks
 */
import { chromium } from 'playwright'

const BASE   = 'http://localhost:4173'
const ROUTE  = `${BASE}/smokecraft/passport-stamp`
const API    = 'http://localhost:3001'

let pass = 0, fail = 0

function log(name, ok, detail = '') {
  const status = ok ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} | ${name}${detail ? ' — ' + detail : ''}`)
  ok ? pass++ : fail++
}

async function setup(page, { clearStamp = true } = {}) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate((clear) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    if (clear) {
      localStorage.removeItem('sc_passport_stamp_v1')
    }
  }, clearStamp)
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
}

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const page    = await browser.newPage()

  // ── 1. Route loads ────────────────────────────────────────────────────────
  await setup(page)
  log('Route loads (200)', !page.url().includes('locked'))

  // ── 2. Background image present ───────────────────────────────────────────
  const img = page.locator('img[src*="PASSPORT"]').first()
  log('Background image present', await img.count() > 0)

  // ── 3. Gradient mask overlay ──────────────────────────────────────────────
  const mask = page.locator('[aria-hidden="true"]').first()
  log('Gradient mask overlay (aria-hidden)', await mask.count() > 0)

  // ── 4. Stamp seal SVG rendered ────────────────────────────────────────────
  const seal = page.locator('[data-testid="stamp-seal"]')
  log('Stamp seal SVG present', await seal.count() > 0)

  // ── 5. No baked "3 cigars" in body ────────────────────────────────────────
  const bodyText = await page.locator('body').innerText()
  log('No baked "3 cigars" in body', !bodyText.includes('3 cigars'))

  // ── 6. No baked "+150 XP" ─────────────────────────────────────────────────
  log('No baked "+150 XP" value', !bodyText.includes('+150 XP') && !bodyText.includes('+150'))

  // ── 7. No baked "87%" ─────────────────────────────────────────────────────
  log('No baked "87%" or "87/100" shown', !bodyText.includes('87%') && !bodyText.includes('87/100'))

  // ── 8. No baked "13/16 stamps" ───────────────────────────────────────────
  log('No baked "13/16 stamps"', !bodyText.includes('13/16'))

  // ── 9. No baked "EXPLORER" level ─────────────────────────────────────────
  log('No baked "EXPLORER" level', !bodyText.includes('EXPLORER'))

  // ── 10. Session summary section present ───────────────────────────────────
  const sessionSummary = page.locator('[data-section="session-summary"]')
  log('Session summary section present', await sessionSummary.count() > 0)

  // ── 11. Cigar/pairing section present ────────────────────────────────────
  const cigarPairing = page.locator('[data-section="cigar-pairing"]')
  log('Cigar/pairing section present', await cigarPairing.count() > 0)

  // ── 12. Score/rewards section present ────────────────────────────────────
  const scoreRewards = page.locator('[data-section="score-rewards"]')
  log('Score/rewards section present', await scoreRewards.count() > 0)

  // ── 13. Eligibility section present ──────────────────────────────────────
  const eligSection = page.locator('[data-section="eligibility"]')
  log('Eligibility section present', await eligSection.count() > 0)

  // ── 14. Eligibility checklist shows required steps ────────────────────────
  const reqs = ['humidor-match', 'first-third', 'second-third', 'flavor-memory', 'final-third', 'scorecard', 'final-review']
  let reqCount = 0
  for (const step of reqs) {
    const el = page.locator(`[data-req="${step}"]`)
    if (await el.count() > 0) reqCount++
  }
  log(`All ${reqs.length} required steps listed in eligibility`, reqCount === reqs.length, `found ${reqCount}/${reqs.length}`)

  // ── 15. XP +75 indicator present ─────────────────────────────────────────
  const bodyText2 = await page.locator('body').innerText()
  log('XP +75 indicator present', bodyText2.includes('+75'))

  // ── 16. Progress bar present ──────────────────────────────────────────────
  const progressBar = page.locator('[data-testid="progress-bar"]')
  log('Progress bar present', await progressBar.count() > 0)

  // ── 17. Next unlock section present ──────────────────────────────────────
  const nextUnlock = page.locator('[data-section="next-unlock"]')
  log('Next unlock section present', await nextUnlock.count() > 0)

  // ── 18. "Connections" mentioned in next unlock ────────────────────────────
  const nextText = await nextUnlock.innerText().catch(() => '')
  log('"Connections" mentioned in next unlock', nextText.toLowerCase().includes('connections'))

  // ── 19. No invisible hotspots ─────────────────────────────────────────────
  const hotspots = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href], button')).filter(el => {
      const s = window.getComputedStyle(el)
      return s.opacity === '0' || s.visibility === 'hidden'
    }).length
  })
  log('No invisible hotspots', hotspots === 0, `found ${hotspots}`)

  // ── 20. Nav menu button visible ───────────────────────────────────────────
  const navBtn = page.locator('button[aria-label*="Menu"], button[aria-label*="menu"]').first()
  log('Nav menu button visible', await navBtn.count() > 0)

  // ── 21. Functional without image ─────────────────────────────────────────
  await page.evaluate(() => document.querySelectorAll('img').forEach(i => i.style.display = 'none'))
  const noImgText = await page.locator('body').innerText()
  log('Functional without image', noImgText.length > 100)
  await page.evaluate(() => document.querySelectorAll('img').forEach(i => i.style.display = ''))

  // ── 22. Claim stamp button absent when not eligible (empty steps) ──────────
  // In demo mode with no completedSteps, stamp should not be eligible
  const claimBtn = page.locator('[data-action="claim-stamp"]')
  // We expect button is absent (not eligible) or disabled (not eligible)
  const claimCount = await claimBtn.count()
  const noEligibleClaim = claimCount === 0
  log('Claim button absent when steps not completed', noEligibleClaim)

  // ── 23. localStorage cleared — no saved stamp on fresh load ──────────────
  const storedBeforeClaim = await page.evaluate(() => localStorage.getItem('sc_passport_stamp_v1'))
  log('No persisted stamp on fresh load', storedBeforeClaim === null)

  // ── 24. API eligibility endpoint returns correct structure ────────────────
  const eligResp = await fetch(`${API}/api/smokecraft/passport-stamp/eligibility?sessionId=e2e-test&completedSteps=&scorecardId=`)
    .then(r => r.json())
  log('API /eligibility returns eligible:false with empty steps', eligResp.ok && eligResp.eligible === false)

  // ── 25. Eligibility with all steps returns eligible:true ──────────────────
  const STEPS = 'humidor-match,first-third,second-third,flavor-memory,final-third,scorecard,final-review'
  const eligFull = await fetch(`${API}/api/smokecraft/passport-stamp/eligibility?sessionId=e2e-full&completedSteps=${STEPS}&scorecardId=SC-123`)
    .then(r => r.json())
  log('API /eligibility returns eligible:true with all steps + scorecardId', eligFull.ok && eligFull.eligible === true)

  // ── 26. Claim API creates a stamp record ─────────────────────────────────
  const claimResp = await fetch(`${API}/api/smokecraft/passport-stamp/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'e2e-claim-test',
      guestId: 'e2e-guest',
      completedSteps: STEPS.split(','),
      scorecardId: 'SC-123',
      finalScore: 78.6,
      xpEarned: 75,
      totalXP: 350,
      currentLevel: 'Enthusiast',
    }),
  }).then(r => r.json())
  log('API /claim creates stamp record', claimResp.ok && claimResp.claimed && claimResp.stamp?.stampId?.startsWith('STAMP-'))

  // ── 27. Claim API prevents duplicate (same sessionId) ────────────────────
  const dupResp = await fetch(`${API}/api/smokecraft/passport-stamp/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'e2e-claim-test',
      guestId: 'e2e-guest',
      completedSteps: STEPS.split(','),
      scorecardId: 'SC-123',
    }),
  })
  const dupData = await dupResp.json()
  log('API /claim returns 409 on duplicate', dupResp.status === 409 && dupData.duplicate === true)

  // ── 28. Status endpoint returns claimed:true after claim ─────────────────
  const statusResp = await fetch(`${API}/api/smokecraft/passport-stamp/status/e2e-claim-test`)
    .then(r => r.json())
  log('API /status returns claimed:true after claim', statusResp.ok && statusResp.claimed === true)

  // ── 29. Ineligible claim returns 422 with reasons ─────────────────────────
  const ineligResp = await fetch(`${API}/api/smokecraft/passport-stamp/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 'e2e-inelig', completedSteps: [], scorecardId: null }),
  })
  const ineligData = await ineligResp.json()
  log('API /claim returns 422 with reasons when ineligible', ineligResp.status === 422 && Array.isArray(ineligData.reasons))

  // ── 30. Back button → /smokecraft/final-review ────────────────────────────
  await setup(page)
  const backBtn = page.locator('button:has-text("Back")').first()
  if (await backBtn.count() > 0) {
    await backBtn.click()
    await page.waitForTimeout(600)
    log('Back navigates to /smokecraft/final-review', page.url().includes('final-review'))
    await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
  } else {
    log('Back button present', false, 'not found')
  }

  // ── 31. Continue → /smokecraft/connections ────────────────────────────────
  await setup(page)
  const continueBtn = page.locator('button:has-text("Continue")').first()
  if (await continueBtn.count() > 0) {
    await continueBtn.click()
    await page.waitForTimeout(800)
    log('Continue navigates to /smokecraft/connections', page.url().includes('connections'))
  } else {
    log('Continue button present', false, 'not found')
  }

  // ── 32. localStorage persists claimed state after claim ───────────────────
  // Simulate a claimed state via localStorage
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  const fakeStamp = { stampId: 'STAMP-E2E-TEST', claimedAt: new Date().toISOString(), sessionId: 'e2e-local' }
  await page.evaluate((stamp) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('sc_passport_stamp_v1', JSON.stringify({ claimed: true, stamp }))
  }, fakeStamp)
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const afterRestoreText = await page.locator('body').innerText()
  log('Claimed stamp restored from localStorage', afterRestoreText.includes('STAMP-E2E-TEST'))

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n──────────────────────────────────────────`)
  console.log(`SmokeCraft Passport Stamp E2E: ${pass} PASS / ${fail} FAIL`)
  console.log(`──────────────────────────────────────────`)

  await browser.close()
  process.exit(fail > 0 ? 1 : 0)
})()
