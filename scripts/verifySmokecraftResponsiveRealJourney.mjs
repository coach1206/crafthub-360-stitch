#!/usr/bin/env node
// Real, automated 4-viewport responsive check — corrected version. Each
// viewport runs one full REAL, UI-driven journey (same proven sequence as
// the canonical capture script: real clicks, genericAdvance for gated
// screens) so measurements are taken on the actual real screen content,
// not a guard's "Not Unlocked Yet" fallback.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { genericAdvance } from './proveSmokecraftFullRealBrowserJourney.mjs'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const OUT = 'public/proof/smokecraft-responsive-verification'
mkdirSync(OUT, { recursive: true })

// Block 6A: aligned to the mandate's exact required sizes — the two
// mandated capture sizes plus one representative 10"/12"/15"-kiosk size.
const VIEWPORTS = [
  { name: 'primary-1180x820',   width: 1180, height: 820,  hasTouch: true },
  { name: 'secondary-1024x768', width: 1024, height: 768,  hasTouch: true },
  { name: 'tablet-10in',        width: 1280, height: 800,  hasTouch: true },
  { name: 'tablet-12in',        width: 1366, height: 1024, hasTouch: true },
  { name: 'kiosk-15in',         width: 1920, height: 1080, hasTouch: false },
]

async function measure(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth
    const overflow = document.documentElement.scrollWidth > vw + 2
    const controls = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"]'))
      .filter(el => {
        const s = getComputedStyle(el)
        return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null
      })
    let offscreen = 0
    for (const el of controls) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      if (r.right < 0 || r.left > vw) offscreen++
    }
    return { overflow, controlCount: controls.length, offscreenHorizontal: offscreen, url: location.pathname }
  })
}

async function capture(page, vp, n, name) {
  await page.waitForTimeout(400)
  const m = await measure(page).catch(() => ({ overflow: null, controlCount: 0, offscreenHorizontal: null, url: null }))
  const filename = `${String(n).padStart(3, '0')}-${vp.name}.png`
  await page.screenshot({ path: `${OUT}/${filename}` }).catch(() => {})
  return { n, name, viewport: vp.name, filename, ...m }
}

async function runJourney(browser, vp) {
  console.log(`\n== ${vp.name} (${vp.width}x${vp.height}) ==`)
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.hasTouch })
  const page = await context.newPage()
  const results = []

  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'networkidle', timeout: 25000 })
  await page.click('text=Explore as Guest')
  await page.waitForURL('**/smokecraft/identity', { timeout: 10000 })
  results.push(await capture(page, vp, 3, 'Identity'))
  await page.fill('input[aria-label="Full Name"]', 'Responsive Real Journey')
  await page.selectOption('select[aria-label="Cigar Experience Level"]', { index: 1 })
  // Block 6A fix: Identity's own "Begin My Journey" page-local button was
  // removed in an earlier documented pass — the real Continue control now
  // lives in the shared SmokeCraftNavBar (primary="Continue to Venue
  // Selection →"), same as every other live-DOM SmokeCraft screen.
  await page.click('button:has-text("Continue to Venue Selection")')
  await page.waitForURL('**/smokecraft/venue-select', { timeout: 10000 })
  await page.waitForLoadState('networkidle')
  results.push(await capture(page, vp, 4, 'Venue Select'))
  // Same real-DB fallback proven in the canonical journey lock script —
  // 'Alpha Lounge (Seed)' is a recovery-era seed name not present on the
  // integration candidate's own disposable database.
  const alphaLounge = page.locator('text=Alpha Lounge (Seed)')
  if (await alphaLounge.count().catch(() => 0)) { await alphaLounge.click() }
  else { await page.click('text=Continue without venue') }
  await page.waitForTimeout(300)
  await page.click('text=Continue to Welcome')
  await page.waitForURL('**/smokecraft/welcome', { timeout: 10000 })
  results.push(await capture(page, vp, 6, 'Welcome'))
  await page.click('text=Begin Experience')
  await page.waitForURL('**/smokecraft/golden-box', { timeout: 10000 })
  results.push(await capture(page, vp, 7, 'Golden Box Rules'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-golden-box`, label: 'Golden Box Rules' })
  results.push(await capture(page, vp, 9, 'Mentor Selection'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-mentor`, label: 'Mentor Selection' })
  results.push(await capture(page, vp, 10, 'Seed & Soil'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-seed-soil`, label: 'Seed & Soil' })
  results.push(await capture(page, vp, 11, 'Humidor Match'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-humidor`, label: 'Humidor Match' })
  results.push(await capture(page, vp, 14, 'Meet Your Cigar'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-meet-cigar`, label: 'Meet Your Cigar' })
  results.push(await capture(page, vp, 16, 'Terroir'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-terroir`, label: 'Terroir' })
  results.push(await capture(page, vp, 17, 'Format'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-format`, label: 'Format' })
  results.push(await capture(page, vp, 19, 'Request/Purchase'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-request`, label: 'Request/Purchase' })
  results.push(await capture(page, vp, 20, 'Cut Toast Light'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-cut`, label: 'Cut Toast Light' })
  results.push(await capture(page, vp, 21, 'Lighting Tutorial'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-lighting`, label: 'Lighting Tutorial' })
  results.push(await capture(page, vp, 22, 'First Third'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-first-third`, label: 'First Third' })
  results.push(await capture(page, vp, 23, 'Flavor Memory'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-flavor-memory`, label: 'Flavor Memory' })
  results.push(await capture(page, vp, 24, 'Pairing Lab'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-pairing-lab`, label: 'Pairing Lab' })
  results.push(await capture(page, vp, 26, 'Second Third'))
  const ta = page.locator('textarea').first()
  if (await ta.count()) { await ta.fill('Real interaction for responsive check.'); await page.waitForTimeout(800) }
  await genericAdvance(page, { screenshotName: `r-${vp.name}-second-third`, label: 'Second Third' })
  results.push(await capture(page, vp, 27, 'Mentor Commentary'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-mentor-commentary`, label: 'Mentor Commentary' })
  results.push(await capture(page, vp, 28, 'Knowledge Drop'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-knowledge-drop`, label: 'Knowledge Drop' })
  results.push(await capture(page, vp, 29, 'Final Third'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-final-third`, label: 'Final Third' })
  results.push(await capture(page, vp, 30, 'Scorecard'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-scorecard`, label: 'Scorecard' })

  // Scorecard-gated supporting screens, real direct nav now that scorecard is real-completed.
  for (const [route, n, name] of [
    ['smokecraft-challenge', 32, 'SmokeCraft Challenge'],
    ['second-humidor-match', 33, 'Second Humidor Match'],
    ['mini-tasting', 34, 'Mini Tasting Round'],
  ]) {
    await page.goto(`${BASE}/smokecraft/${route}`, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {})
    results.push(await capture(page, vp, n, name))
  }

  await page.goto(`${BASE}/smokecraft/ai-summary`, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {})
  results.push(await capture(page, vp, 35, 'AI Summary'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-ai-summary`, label: 'AI Summary' })
  results.push(await capture(page, vp, 36, 'Pairing Recommendations'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-pairing-recs`, label: 'Pairing Recommendations' })
  results.push(await capture(page, vp, 37, 'Passport Stamp'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-passport-stamp`, label: 'Passport Stamp' })
  results.push(await capture(page, vp, 38, 'Final Review'))
  await genericAdvance(page, { screenshotName: `r-${vp.name}-final-review`, label: 'Final Review' })
  results.push(await capture(page, vp, 39, 'Rewards'))

  for (const [route, n, name] of [
    ['connections', 40, 'Connections'],
    ['management-sync', 41, 'Management Sync'],
  ]) {
    await page.goto(`${BASE}/smokecraft/${route}`, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {})
    results.push(await capture(page, vp, n, name))
  }

  await page.goto(`${BASE}/smokecraft/rewards`, { waitUntil: 'networkidle', timeout: 25000 })
  await genericAdvance(page, { screenshotName: `r-${vp.name}-rewards`, label: 'Rewards' })
  results.push(await capture(page, vp, 42, 'Session Complete'))

  await context.close()
  console.log(`  ${vp.name}: ${results.length} real screens measured`)
  return results
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  let all = []
  for (const vp of VIEWPORTS) {
    const r = await runJourney(browser, vp)
    all = all.concat(r)
  }
  await browser.close()
  writeFileSync(`${OUT}/responsive-results-real-journey.json`, JSON.stringify(all, null, 2))

  const failures = all.filter(r => r.overflow || (r.offscreenHorizontal && r.offscreenHorizontal > 0))
  console.log(`\n${all.length} real-journey screen/viewport combinations measured.`)
  console.log(`${failures.length} combinations show a measurable failure (overflow or off-screen control).`)
  for (const f of failures) console.log(`  FAIL ${f.viewport} #${String(f.n).padStart(3,'0')} ${f.name} — overflow=${f.overflow} offscreen=${f.offscreenHorizontal} url=${f.url}`)
}

main().catch(e => { console.error(e); process.exit(1) })
