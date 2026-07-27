// Holistic Fix 2E-10 — deep state/persistence/duplicate-firing verification
// for a representative sample of unique curriculum control implementations,
// covering the behavior patterns shared across the 276 controls discovered
// in Holistic Fix 2E-9 (selection/toggle, rating-toggle, expand/collapse,
// slider/apply, Continue-guard duplicate protection).
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.env.SC_UI || 'http://localhost:5050'
const PROOF = 'public/proof/smokecraft-holistic-fix-2e-10'
fs.mkdirSync(PROOF, { recursive: true })

let pass = 0, fail = 0
const failures = []
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
function section(t) { console.log(`\n── ${t}`) }

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

async function seed(ids) {
  await page.evaluate((v) => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: v, profile: { firstName: 'Test' } }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, identity: { preferredName: 'Test' }, selectedVenue: { id: 'v1', name: 'Test Lounge' } }))
  }, ids)
}
async function go(route) {
  try { await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30000 }) }
  catch { await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 }); await page.waitForTimeout(2000) }
  await page.waitForTimeout(300)
}

const results = []

// ── 1. Selection/toggle state change: HumidorMatch environment zones ──
section('1. Selection/toggle — HumidorMatch environment zones (image-shell hotspot pattern)')
await go('/smokecraft'); await seed(['enroll', 'identity', 'entry'])
await go('/smokecraft/humidor-match')
const zoneBtn = page.getByRole('button', { name: /Virtual Humidor/i }).first()
await zoneBtn.click()
const pressedAfterClick = await zoneBtn.getAttribute('aria-pressed')
assert('HumidorMatch: clicking an environment zone sets aria-pressed=true (real state change)', pressedAfterClick === 'true')
await zoneBtn.click()
const pressedAfterSecondClick = await zoneBtn.getAttribute('aria-pressed')
assert('HumidorMatch: clicking the same zone again toggles it back off (no stuck state)', pressedAfterSecondClick === 'false')
results.push({ implementation: 'selection-toggle (hotspot zone, image-shell)', representativeSession: 2, stateChange: pressedAfterClick === 'true', toggleOff: pressedAfterSecondClick === 'false' })

// ── 2. Rating-toggle + client-persisted state: FirstThird ──
section('2. Rating-toggle with journey-context persistence — FirstThird')
await go('/smokecraft'); await seed(['enroll', 'identity', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial'])
await go('/smokecraft/first-third')
const ratingBtns = page.locator('[aria-pressed]')
const firstRating = ratingBtns.first()
await firstRating.click()
const ratingPressed = await firstRating.getAttribute('aria-pressed')
assert('FirstThird: clicking a rating item sets aria-pressed=true', ratingPressed === 'true')
const journeyBefore = await page.evaluate(() => localStorage.getItem('sc_journey_v1'))
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(500)
const ratingPressedAfterReload = await page.locator('[aria-pressed]').first().getAttribute('aria-pressed')
assert('FirstThird: rating selection survives a page reload (real client-side persistence)', ratingPressedAfterReload === 'true')
results.push({ implementation: 'rating-toggle with journey-context persistence', representativeSession: 8, stateChange: ratingPressed === 'true', reloadPersistence: ratingPressedAfterReload === 'true' })

// ── 3. Expand/collapse: Terroir sections ──
section('3. Expand/collapse — Terroir sections')
await go('/smokecraft'); await seed(['enroll', 'identity', 'entry', 'humidor-match', 'meet-your-cigar'])
await go('/smokecraft/terroir')
const beforeExpandText = await page.evaluate(() => document.body.innerText.length)
const sectionBtn = page.getByRole('tab', { name: /Country/i }).first()
const hasSectionBtn = (await sectionBtn.count()) > 0
if (hasSectionBtn) {
  await sectionBtn.click()
  await page.waitForTimeout(300)
  const afterExpandText = await page.evaluate(() => document.body.innerText.length)
  assert('Terroir: clicking a section reveals additional content (real expand, not decorative)', afterExpandText > beforeExpandText, `before=${beforeExpandText} after=${afterExpandText}`)
  results.push({ implementation: 'expand/collapse section tabs', representativeSession: 4, stateChange: afterExpandText > beforeExpandText })
} else {
  assert('Terroir: a section control exists to test expand/collapse', false, 'no "Country" button found')
}

// ── 4. Duplicate-firing protection: Continue/Complete button ──
section('4. Duplicate-firing protection — Continue button (done-flag guard, source-confirmed in HumidorMatch/FirstThird/etc.)')
await go('/smokecraft'); await seed(['enroll', 'identity', 'entry'])
await go('/smokecraft/humidor-match')
// True simultaneous double-fire, dispatched synchronously in one browser-context
// call so both click events land on the SAME pre-navigation DOM element —
// Promise.all([...click(), ...click()]) from the Node side is not simultaneous
// enough (Playwright's actionability wait lets the first click's navigation
// complete before the second resolves, landing it on the NEXT page's own
// Continue button instead — a test-methodology artifact, not a real double-fire).
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /continue/i.test(b.textContent || ''))
  if (btn) { btn.click(); btn.click() }
})
await page.waitForTimeout(1200)
const urlAfterDoubleClick = page.url()
assert('HumidorMatch: rapid double-click on Continue results in exactly one navigation (not double-advanced past Session 3)',
  urlAfterDoubleClick.endsWith('/smokecraft/meet-your-cigar'), `ended at ${urlAfterDoubleClick}`)
results.push({ implementation: 'Continue button done-flag duplicate-fire guard', representativeSession: 2, duplicateFiring: urlAfterDoubleClick.endsWith('/smokecraft/meet-your-cigar') })

// ── 5. Honest disabled/empty state: MentorCommentary with no mentor selected ──
section('5. Honest disabled/empty state — MentorCommentary (no mentor selected)')
await go('/smokecraft'); await seed(['enroll', 'identity', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third'])
await go('/smokecraft/mentor-commentary')
const bodyText = await page.evaluate(() => document.body.innerText)
const hasHonestEmptyState = /no mentor/i.test(bodyText)
const hasFabricatedCommentary = /"[A-Z][a-z]+ said/i.test(bodyText) // a fabricated quoted mentor line would look like this
assert('MentorCommentary: honestly shows "No Mentor Selected" rather than fabricating commentary', hasHonestEmptyState)
assert('MentorCommentary: does not fabricate a mentor quote when none is selected', !hasFabricatedCommentary)
results.push({ implementation: 'honest empty/disabled state (no fabrication)', representativeSession: 14, honestEmptyState: hasHonestEmptyState, noFabrication: !hasFabricatedCommentary })

// ── 6. Tasting-input: FlavorMemory flavor-wheel toggle (Holistic Fix 2E-11) ──
section('6. Tasting-input — FlavorMemory flavor-wheel selection')
await go('/smokecraft'); await seed(['enroll', 'identity', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third'])
await go('/smokecraft/flavor-memory')
const flavorZone = page.locator('[aria-pressed]').first()
const hasFlavorZone = (await flavorZone.count()) > 0
if (hasFlavorZone) {
  await flavorZone.click()
  const flavorPressed = await flavorZone.getAttribute('aria-pressed')
  assert('FlavorMemory: clicking a flavor-wheel zone sets aria-pressed=true (real tasting-input state change)', flavorPressed === 'true')
  await flavorZone.click()
  const flavorUnpressed = await flavorZone.getAttribute('aria-pressed')
  assert('FlavorMemory: clicking the same flavor zone again toggles it back off', flavorUnpressed === 'false')
  results.push({ implementation: 'tasting-input flavor-wheel toggle', representativeSession: 10, stateChange: flavorPressed === 'true', toggleOff: flavorUnpressed === 'false' })
} else {
  assert('FlavorMemory: a flavor-wheel control exists to test tasting-input', false, 'no [aria-pressed] element found')
}

await browser.close()

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===`)
fs.writeFileSync(`${PROOF}/03-control-state-persistence-results.json`, JSON.stringify({
  commit: execSync('git rev-parse HEAD').toString().trim(),
  pass, fail, failures, results,
}, null, 2))
if (fail > 0) process.exit(1)
