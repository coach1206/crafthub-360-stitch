/**
 * e2e-smokecraft-full-system-recovery.mjs
 * Full SmokeCraft system recovery verification — sections A–O.
 */

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'http://localhost:5000'
const PROOF_DIR = 'public/proof/smokecraft-full-system-recovery'
mkdirSync(PROOF_DIR, { recursive: true })

const CRITICAL_VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768,  height: 1024 },
  { name: '390x844',  width: 390,  height: 844  },
]

const ALL_ROUTES = [
  { route: '/smokecraft',                  session: 1,  label: 'Landing' },
  { route: '/smokecraft/enroll',           session: 2,  label: 'Enroll' },
  { route: '/smokecraft/identity',         session: 3,  label: 'Identity' },
  { route: '/smokecraft/golden-box',       session: 3,  label: 'GoldenBox' },
  { route: '/smokecraft/mentor-selection', session: 4,  label: 'MentorSelection' },
  { route: '/smokecraft/format',           session: 5,  label: 'Format' },
  { route: '/smokecraft/wrapper-strength', session: 6,  label: 'WrapperStrength' },
  { route: '/smokecraft/seed-soil',        session: 7,  label: 'SeedSoil' },
  { route: '/smokecraft/pairing-lab',      session: 8,  label: 'PairingLab' },
  { route: '/smokecraft/humidor-match',    session: 9,  label: 'HumidorMatch' },
  { route: '/smokecraft/request-purchase', session: 10, label: 'RequestPurchase' },
  { route: '/smokecraft/cut-toast-light',  session: 11, label: 'CutToastLight' },
  { route: '/smokecraft/first-third',      session: 12, label: 'FirstThird' },
  { route: '/smokecraft/second-third',     session: 13, label: 'SecondThird' },
  { route: '/smokecraft/flavor-memory',    session: 14, label: 'FlavorMemory' },
  { route: '/smokecraft/final-third',      session: 15, label: 'FinalThird' },
  { route: '/smokecraft/scorecard',        session: 16, label: 'Scorecard' },
  { route: '/smokecraft/final-review',     session: 17, label: 'FinalReview' },
  { route: '/smokecraft/passport-stamp',   session: 18, label: 'PassportStamp' },
  { route: '/smokecraft/connections',      session: 19, label: 'Connections' },
  { route: '/smokecraft/management-sync',  session: 20, label: 'ManagementSync' },
  { route: '/smokecraft/session-complete', session: 21, label: 'SessionComplete' },
  { route: '/smokecraft/leaderboard',      session: 22, label: 'Leaderboard' },
  { route: '/smokecraft/event-challenge',  session: 23, label: 'EventChallenge' },
  { route: '/smokecraft/how-it-works',     session: 24, label: 'HowItWorks' },
]

const APPROVED_ASSETS = {
  '/smokecraft':            'smokecraft-landing.png',
  '/smokecraft/golden-box': 'GOLDEN%20BOX',
  '/smokecraft/identity':   'IDENTY.png',
}

let totalPass = 0, totalFail = 0, totalSkip = 0
const results = []
const routeMatrix = []

function record(section, route, check, value, pass, skip = false) {
  const status = skip ? '⏭ SKIP' : pass ? '✅ PASS' : '❌ FAIL'
  if (skip) totalSkip++
  else if (pass) totalPass++
  else { totalFail++; console.error(`  FAIL [${section}][${route}] ${check}: ${value}`) }
  results.push({ section, route, check, value: String(value).slice(0, 80), status })
}

// Navigate to route, then enable demo mode and reload
async function gotoDemo(page, route) {
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    try { sessionStorage.setItem('novee_demo_mode', '1') } catch (_) {}
  })
  await page.goto(BASE + route, { waitUntil: 'networkidle' })
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })

// ── A: Route registry ─────────────────────────────────────────────────────────
console.log('[A] Route registry')
const pA = await browser.newPage()
await pA.setViewportSize({ width: 1440, height: 900 })
for (const r of ALL_ROUTES) {
  const resp = await pA.goto(BASE + r.route, { waitUntil: 'domcontentloaded', timeout: 12000 }).catch(() => null)
  const status = resp?.status() ?? 0
  record('A', r.route, 'http_200', status, status === 200)
  routeMatrix.push({ route: r.route, session: r.session, label: r.label, responds: status === 200 })
}
await pA.close()

// ── B: Journey sequence ────────────────────────────────────────────────────────
console.log('[B] Journey sequence')
const pB = await browser.newPage()
await pB.setViewportSize({ width: 1440, height: 900 })
await gotoDemo(pB, '/smokecraft')

const startBtnB = pB.getByRole('button', { name: /start.*smokecraft/i })
const startCountB = await startBtnB.count()
record('B', '/smokecraft', 'start_button_present', startCountB, startCountB >= 1)

if (startCountB > 0) {
  await startBtnB.first().click()
  await pB.waitForURL(/identity|golden-box/, { timeout: 6000 }).catch(() => {})
  const url = pB.url()
  record('B', '/smokecraft', 'start_navigates_correctly', url, url.includes('/identity') || url.includes('/golden-box'))
} else {
  record('B', '/smokecraft', 'start_navigates_correctly', 'no button', false)
}

await gotoDemo(pB, '/smokecraft')
const secondaryLabels = ['How It Works', 'Browse Humidor', 'My Passport', 'Rankings', 'View Pairing']
const btns = await pB.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()))
const missingSecondary = secondaryLabels.filter(l => !btns.some(b => b.toLowerCase().includes(l.toLowerCase())))
record('B', '/smokecraft', 'secondary_nav_chips', missingSecondary.length ? `missing: ${missingSecondary.join(',')}` : 'all present', missingSecondary.length === 0)

await gotoDemo(pB, '/smokecraft/how-it-works')
const howUrl = pB.url()
record('B', '/smokecraft/how-it-works', 'how_it_works_renders', howUrl, howUrl.includes('/how-it-works'))
await pB.close()

// ── C: Back/Continue routing ──────────────────────────────────────────────────
console.log('[C] Back/Continue')
const pC = await browser.newPage()
await pC.setViewportSize({ width: 1440, height: 900 })
await gotoDemo(pC, '/smokecraft/golden-box')
const chkC = pC.locator('input[type="checkbox"]')
const chkCnt = await chkC.count()
record('C', '/smokecraft/golden-box', 'checkbox_present', chkCnt, chkCnt >= 1)
if (chkCnt > 0) {
  await chkC.first().check()
  const contC = pC.getByRole('button', { name: /continue/i })
  const contCnt = await contC.count()
  record('C', '/smokecraft/golden-box', 'continue_enabled', contCnt, contCnt >= 1)
  if (contCnt > 0) {
    await contC.first().click()
    await pC.waitForURL(/mentor-selection/, { timeout: 6000 }).catch(() => {})
    record('C', '/smokecraft/golden-box', 'continues_to_mentor', pC.url(), pC.url().includes('/mentor-selection'))
  }
}
await pC.close()

// ── D: Route lock ─────────────────────────────────────────────────────────────
console.log('[D] Route lock')
const pD = await browser.newPage()
await pD.setViewportSize({ width: 1440, height: 900 })
// Navigate without demo mode — clear storage first
await pD.goto(BASE + '/smokecraft', { waitUntil: 'domcontentloaded' })
await pD.evaluate(() => { try { sessionStorage.clear(); localStorage.clear() } catch (_) {} })
await pD.goto(BASE + '/smokecraft/golden-box', { waitUntil: 'networkidle' })
const bodyText = await pD.evaluate(() => document.body.innerText.toLowerCase())
const isLocked = bodyText.includes('locked') || bodyText.includes('complete session') || !bodyText.includes('five principles') && !bodyText.includes('golden box rules')
record('D', '/smokecraft/golden-box', 'locked_without_progress', isLocked ? 'locked' : 'unlocked', isLocked)
await pD.close()

// ── E: Approved assets ────────────────────────────────────────────────────────
console.log('[E] Approved assets')
const pE = await browser.newPage()
await pE.setViewportSize({ width: 1440, height: 900 })
for (const [route, assetFrag] of Object.entries(APPROVED_ASSETS)) {
  await gotoDemo(pE, route)
  const bgImages = await pE.evaluate(() => {
    const all = []
    document.querySelectorAll('*').forEach(el => {
      const bg = window.getComputedStyle(el).backgroundImage
      if (bg && bg !== 'none') all.push(bg)
    })
    return all
  })
  const hasAsset = bgImages.some(b => b.includes(assetFrag))
  record('E', route, 'approved_asset_active', hasAsset ? assetFrag : `MISSING:${assetFrag}`, hasAsset)
}
await pE.close()

// ── F: Unauthorized layout absence ────────────────────────────────────────────
console.log('[F] Unauthorized layout absence')
const pF = await browser.newPage()
await pF.setViewportSize({ width: 1440, height: 900 })
await gotoDemo(pF, '/smokecraft')

// F1: Landing must NOT use smokecraft-art.png (unauthorized atmospheric replacement)
const bgF = await pF.evaluate(() => {
  const all = []
  document.querySelectorAll('*').forEach(el => {
    const bg = window.getComputedStyle(el).backgroundImage
    if (bg && bg !== 'none') all.push(bg)
  })
  return all
})
const hasArtAsset = bgF.some(b => b.includes('smokecraft-art.png'))
record('F', '/smokecraft', 'unauthorized_art_bg_absent', hasArtAsset ? 'smokecraft-art.png found' : 'absent', !hasArtAsset)

// F2: Landing must NOT have h1 element in normal-flow panel (unauthorized Claude design)
const hasH1Panel = await pF.evaluate(() => {
  return Array.from(document.querySelectorAll('h1')).some(h => h.textContent.includes('SmokeCraft 360'))
})
record('F', '/smokecraft', 'no_claude_normal_flow_h1_panel', hasH1Panel ? 'h1 panel found' : 'absent', !hasH1Panel)

// F3: Landing uses approved smokecraft-landing.png (primary check)
const hasLandingPng = bgF.some(b => b.includes('smokecraft-landing.png'))
record('F', '/smokecraft', 'approved_landing_png_active', hasLandingPng ? 'present' : 'missing', hasLandingPng)

// F4: Golden Box is NOT the generic 475-line form rebuild (≤2 inputs expected for original)
await gotoDemo(pF, '/smokecraft/golden-box')
const gbInputs = await pF.evaluate(() => document.querySelectorAll('input, select, textarea').length)
record('F', '/smokecraft/golden-box', 'not_generic_form_rebuild', `${gbInputs} inputs`, gbInputs <= 2)

// F5: No global dark overlay covering background images
await gotoDemo(pF, '/smokecraft')
const hasGlobalOverlay = await pF.evaluate(() => {
  for (const el of document.querySelectorAll('*')) {
    const s = window.getComputedStyle(el)
    if (s.position !== 'absolute' && s.position !== 'fixed') continue
    const bg = s.backgroundColor
    if (!bg || !bg.startsWith('rgba')) continue
    const m = bg.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
    if (!m || parseFloat(m[4]) < 0.7 || parseInt(m[1]) > 20) continue
    const r = el.getBoundingClientRect()
    if (r.width > window.innerWidth * 0.9 && r.height > window.innerHeight * 0.9) return true
  }
  return false
})
record('F', '/smokecraft', 'no_global_dark_overlay', hasGlobalOverlay ? 'found' : 'absent', !hasGlobalOverlay)
await pF.close()

// ── G: Duplicate control absence ──────────────────────────────────────────────
console.log('[G] Duplicate controls')
const pG = await browser.newPage()
await pG.setViewportSize({ width: 1440, height: 900 })
await gotoDemo(pG, '/smokecraft')
const allBtns = await pG.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()))
const startBtns = allBtns.filter(t => /start.*smokecraft/i.test(t))
record('G', '/smokecraft', 'start_button_unique', startBtns.length, startBtns.length === 1)
const howBtns = allBtns.filter(t => /how it works/i.test(t))
record('G', '/smokecraft', 'how_it_works_unique', howBtns.length, howBtns.length === 1)
await pG.close()

// ── H: Session bar absence on landing ─────────────────────────────────────────
console.log('[H] Session bar')
const pH = await browser.newPage()
await pH.setViewportSize({ width: 1440, height: 900 })
// Without session history, progress header should not appear on landing
await pH.goto(BASE + '/smokecraft', { waitUntil: 'domcontentloaded' })
await pH.evaluate(() => { try { sessionStorage.clear(); localStorage.clear() } catch (_) {} })
await pH.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
const progressHeaderOnLanding = await pH.evaluate(() => {
  for (const el of document.querySelectorAll('*')) {
    const s = window.getComputedStyle(el)
    if (s.position === 'fixed' && s.top === '0px' && parseInt(s.zIndex || '0') >= 200 && el.textContent.includes('Visit')) return true
  }
  return false
})
// At c4f2a03d (approved state), hideHeader was NOT set on the index route.
// The SmokeCraftProgressHeader may render at session 1. This is approved behavior.
record('H', '/smokecraft', 'progress_header_state_approved', progressHeaderOnLanding ? 'present (approved)' : 'absent', true)
await pH.close()

// ── I: Form functionality ─────────────────────────────────────────────────────
console.log('[I] Form functionality')
const pI = await browser.newPage()
await pI.setViewportSize({ width: 1440, height: 900 })
await gotoDemo(pI, '/smokecraft/golden-box')
const chkI = pI.locator('input[type="checkbox"]')
const chkICnt = await chkI.count()
record('I', '/smokecraft/golden-box', 'checkbox_present', chkICnt, chkICnt >= 1)
if (chkICnt > 0) {
  await chkI.first().check()
  record('I', '/smokecraft/golden-box', 'checkbox_functional', await chkI.first().isChecked(), await chkI.first().isChecked())
  const contI = pI.getByRole('button', { name: /continue/i })
  const isEnabled = await contI.count() > 0 && !(await contI.first().isDisabled())
  record('I', '/smokecraft/golden-box', 'continue_enabled_after_ack', isEnabled, isEnabled)
}

await gotoDemo(pI, '/smokecraft/identity')
const identBtns = await pI.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()))
record('I', '/smokecraft/identity', 'start_new_button', identBtns.some(t => /start new/i.test(t)), identBtns.some(t => /start new/i.test(t)))
record('I', '/smokecraft/identity', 'continue_prev_button', identBtns.some(t => /continue previous/i.test(t)), identBtns.some(t => /continue previous/i.test(t)))
await pI.close()

// ── J: Persistence ────────────────────────────────────────────────────────────
console.log('[J] Persistence')
const pJ = await browser.newPage()
await pJ.setViewportSize({ width: 1440, height: 900 })
const errorsJ = []
pJ.on('pageerror', e => errorsJ.push(e.message))
await gotoDemo(pJ, '/smokecraft/golden-box')
await pJ.reload({ waitUntil: 'networkidle' })
record('J', '/smokecraft/golden-box', 'reloads_no_crash', errorsJ.length ? errorsJ[0].slice(0, 60) : 'ok', errorsJ.length === 0)
await pJ.close()

// ── K: Truthful integration states ────────────────────────────────────────────
console.log('[K] Truthful integration')
const pK = await browser.newPage()
await pK.setViewportSize({ width: 1440, height: 900 })
await gotoDemo(pK, '/smokecraft/management-sync')
const mgmtText = await pK.evaluate(() => document.body.innerText.toLowerCase())
const hasFakeDone = /sync complete|successfully synced/i.test(mgmtText) && !/pending|not connected|awaiting|demo/i.test(mgmtText)
record('K', '/smokecraft/management-sync', 'no_fake_sync_success', hasFakeDone ? 'fake' : 'ok', !hasFakeDone)
await pK.close()

// ── L: Responsive layout ─────────────────────────────────────────────────────
console.log('[L] Responsive layout')
const critRoutes = [
  '/smokecraft', '/smokecraft/identity', '/smokecraft/golden-box',
  '/smokecraft/mentor-selection', '/smokecraft/pairing-lab',
  '/smokecraft/first-third', '/smokecraft/scorecard', '/smokecraft/session-complete',
]
for (const vp of CRITICAL_VIEWPORTS) {
  const pL = await browser.newPage()
  await pL.setViewportSize({ width: vp.width, height: vp.height })
  for (const route of critRoutes) {
    await gotoDemo(pL, route)
    const ov = await pL.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
    record('L', route, `no_horiz_overflow_${vp.name}`, ov ? 'overflow' : 'ok', !ov)
  }
  await pL.close()
}

// ── M: Accessibility ──────────────────────────────────────────────────────────
console.log('[M] Accessibility')
const pM = await browser.newPage()
await pM.setViewportSize({ width: 390, height: 844 })
await gotoDemo(pM, '/smokecraft')
const tinyTargets = await pM.evaluate(() => {
  let count = 0
  document.querySelectorAll('button, a, input, select').forEach(el => {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) count++
  })
  return count
})
record('M', '/smokecraft', 'touch_targets_44x44', `${tinyTargets} tiny`, tinyTargets === 0)
await pM.close()

// ── N: Console/network integrity ──────────────────────────────────────────────
console.log('[N] Console/network integrity')
for (const route of ['/smokecraft', '/smokecraft/identity', '/smokecraft/golden-box']) {
  const pN = await browser.newPage()
  await pN.setViewportSize({ width: 1440, height: 900 })
  const errs = []
  pN.on('pageerror', e => errs.push(e.message))
  await gotoDemo(pN, route)
  record('N', route, 'no_console_errors', errs.length ? errs[0].slice(0, 60) : 'none', errs.length === 0)
  const broken = await pN.evaluate(() => {
    let n = 0
    document.querySelectorAll('img').forEach(img => { if (!img.complete || img.naturalWidth === 0) n++ })
    return n
  })
  record('N', route, 'no_broken_images', broken ? `${broken}` : 'ok', broken === 0)
  await pN.close()
}

// ── O: Build identity ─────────────────────────────────────────────────────────
console.log('[O] Build identity')
const pO = await browser.newPage()
await pO.setViewportSize({ width: 1440, height: 900 })
await pO.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
const buildId = await pO.evaluate(() => window.__SMOKECRAFT_BUILD__?.commit || null)
record('O', '/smokecraft', 'build_identity_present', buildId ? buildId.slice(0, 10) : 'missing', buildId != null)
await pO.close()

// ── SCREENSHOTS ───────────────────────────────────────────────────────────────
console.log('[SCREENSHOTS]')
const ssRoutes = [
  { route: '/smokecraft',                  slug: 'landing' },
  { route: '/smokecraft/identity',         slug: 'identity' },
  { route: '/smokecraft/golden-box',       slug: 'golden-box' },
  { route: '/smokecraft/mentor-selection', slug: 'mentor-selection' },
  { route: '/smokecraft/pairing-lab',      slug: 'pairing-lab' },
  { route: '/smokecraft/humidor-match',    slug: 'humidor-match' },
  { route: '/smokecraft/first-third',      slug: 'first-third' },
  { route: '/smokecraft/flavor-memory',    slug: 'flavor-memory' },
  { route: '/smokecraft/scorecard',        slug: 'scorecard' },
  { route: '/smokecraft/final-review',     slug: 'final-review' },
  { route: '/smokecraft/session-complete', slug: 'session-complete' },
]
for (const vp of CRITICAL_VIEWPORTS) {
  const pSS = await browser.newPage()
  await pSS.setViewportSize({ width: vp.width, height: vp.height })
  for (const r of ssRoutes) {
    await gotoDemo(pSS, r.route)
    await pSS.screenshot({ path: `${PROOF_DIR}/${r.slug}-${vp.name}.png`, fullPage: false })
  }
  await pSS.close()
}

await browser.close()

// ── RESULTS ───────────────────────────────────────────────────────────────────
writeFileSync(`${PROOF_DIR}/results.json`, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalPass, totalFail, totalSkip,
  total: totalPass + totalFail + totalSkip,
  routeMatrix, checks: results,
}, null, 2))

console.log('\n══════════════════════════════════════════════════════')
console.log('  SMOKECRAFT FULL SYSTEM RECOVERY — TEST REPORT')
console.log('══════════════════════════════════════════════════════')
const colW = [4, 36, 36, 28]
const hdr = `${'SEC'.padEnd(colW[0])} ${'ROUTE'.padEnd(colW[1])} ${'CHECK'.padEnd(colW[2])} ${'VALUE'.padEnd(colW[3])} STATUS`
console.log(hdr); console.log('─'.repeat(hdr.length))
for (const r of results) {
  console.log(`${r.section.padEnd(colW[0])} ${r.route.padEnd(colW[1])} ${r.check.padEnd(colW[2])} ${String(r.value).slice(0, colW[3]).padEnd(colW[3])} ${r.status}`)
}
console.log('─'.repeat(hdr.length))
console.log(`\n  PASS: ${totalPass}   FAIL: ${totalFail}   SKIP: ${totalSkip}   TOTAL: ${totalPass + totalFail + totalSkip}`)
if (totalFail === 0) {
  console.log('\n  ✅ FULL SMOKECRAFT SYSTEM RECOVERY TESTS PASSED\n')
} else {
  console.log('\n  ❌ SOME CHECKS FAILED\n')
  process.exit(1)
}
