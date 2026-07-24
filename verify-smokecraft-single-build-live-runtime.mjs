// Single Build & Live Runtime verification — Single Build & Live Runtime pass.
//
// SCOPE DISCLOSURE (read this before interpreting any result below):
// This suite runs against the LOCAL production build served by the real
// Express production server (server/index.js on :3001), which is the same
// topology Railway runs — one process serving dist/ AND /api. It CANNOT and
// does not verify the live Railway deployment: outbound access to the
// production URL is blocked in this sandbox (see
// public/proof/smokecraft-single-build-live-runtime/RAILWAY-ACCESS-BLOCKED.md
// for the real, recorded error). Every "one build" assertion below is
// therefore a statement about this build, not about production.
//
// Every journey step is a REAL visible-control click. localStorage seeding
// is used only to establish a STARTING scenario before a flow begins (the
// established pattern from prior passes), never to bypass a click under test.
import { chromium } from 'playwright'

const BASE = process.env.SC_BASE || 'http://localhost:3001'
const EXEC = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
const results = []
function check(name, cond, detail = '') {
  if (cond) { pass++; results.push(`PASS  ${name}`) }
  else { fail++; results.push(`FAIL  ${name}${detail ? ' :: ' + detail : ''}`) }
}

const browser = await chromium.launch({ executablePath: EXEC })

async function freshPage() {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  return { ctx, page }
}

async function probe(route) {
  const { ctx, page } = await freshPage()
  await page.goto(BASE + route, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const data = await page.evaluate(async () => ({
    path:    location.pathname,
    build:   (window.__SMOKECRAFT_BUILD__ || {}).commit || null,
    swCtrl:  !!(navigator.serviceWorker && navigator.serviceWorker.controller),
    swRegs:  ('serviceWorker' in navigator) ? (await navigator.serviceWorker.getRegistrations()).length : 0,
    caches:  (typeof caches !== 'undefined' && caches.keys) ? await caches.keys() : [],
    text:    document.body.innerText,
    scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src')),
  }))
  await ctx.close()
  return data
}

// ── Reference build identity from the API ─────────────────────────────────
const apiVersion = await (await fetch(BASE + '/api/version')).json()
const API_COMMIT = apiVersion.backendCommit

// The routes the mandate names.
const ROUTES = [
  '/smokecraft',
  '/smokecraft/how-it-works',
  '/smokecraft/enroll',
  '/smokecraft/identity',
  '/smokecraft/welcome',
  '/smokecraft/humidor-match',
  '/smokecraft/rewards-center',
  '/smokecraft/leaderboard',
  '/smokecraft/passport-stamp',
  '/smokecraft/meet-your-cigar',
  '/smokecraft/results',
  '/smokecraft/awards',
]

const probes = {}
for (const r of ROUTES) probes[r] = await probe(r)

// ── (1) Every tested route reports the same build ID ──────────────────────
{
  const builds = [...new Set(Object.values(probes).map(p => p.build))]
  check('(1) every tested route reports exactly one build ID',
    builds.length === 1 && !!builds[0], JSON.stringify(builds))
}

// ── (2) /api/version matches the frontend build ───────────────────────────
check('(2) /api/version backendCommit matches the frontend build',
  API_COMMIT && API_COMMIT === probes['/smokecraft'].build,
  `${API_COMMIT} vs ${probes['/smokecraft'].build}`)

// ── (3) /system/build-info matches the frontend build ─────────────────────
{
  const p = await probe('/system/build-info')
  check('(3) /system/build-info reports the same build as the frontend',
    p.build === probes['/smokecraft'].build, `${p.build} vs ${probes['/smokecraft'].build}`)
}

// ── (4) No old JS chunk filename referenced anywhere unexpected ───────────
{
  const fs = await import('fs')
  const onDisk = new Set(fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')))
  const referenced = new Set()
  for (const p of Object.values(probes)) {
    for (const s of p.scripts) {
      const m = s.match(/\/assets\/([^/?#]+\.js)/)
      if (m) referenced.add(m[1])
    }
  }
  const orphans = [...referenced].filter(f => !onDisk.has(f))
  check('(4) every referenced JS chunk exists in the current dist manifest',
    orphans.length === 0, JSON.stringify(orphans))
  check('(4b) at least one chunk was actually referenced (probe is meaningful)',
    referenced.size > 0, String(referenced.size))
}

// ── (5) No service worker controls the page ───────────────────────────────
{
  const controlled = Object.entries(probes).filter(([, p]) => p.swCtrl).map(([r]) => r)
  check('(5) no service worker controls any tested route',
    controlled.length === 0, JSON.stringify(controlled))
  const registered = Object.entries(probes).filter(([, p]) => p.swRegs > 0).map(([r]) => r)
  check('(5b) no service worker registration survives page load',
    registered.length === 0, JSON.stringify(registered))
}

// ── (6) Cache Storage contains no retired SmokeCraft cache ────────────────
{
  const RETIRED = ['novee-os', 'smokecraft', 'workbox', 'crafthub']
  const bad = []
  for (const [r, p] of Object.entries(probes)) {
    for (const k of p.caches) if (RETIRED.some(x => k.toLowerCase().startsWith(x))) bad.push(`${r}:${k}`)
  }
  check('(6) Cache Storage holds no retired SmokeCraft/NOVEE cache',
    bad.length === 0, JSON.stringify(bad))
}

// ── (7) How It Works shows no storyboard artwork / internal labels ────────
{
  const p = probes['/smokecraft/how-it-works']
  const banned = [/storyboard/i, /\bS1\.\d/, /\bS2\.\d/, /\bS3\.\d/, /\bS4\.\d/, /S\d GOAL/i]
  const hits = banned.filter(re => re.test(p.text)).map(String)
  check('(7) How It Works shows no storyboard / internal design labels',
    hits.length === 0, JSON.stringify(hits))
  check('(7b) How It Works uses no design-reference artwork asset',
    !/smokecraft-how-it-works\.png/.test(JSON.stringify(p)), 'reference png still referenced')
  // Approved-Asset Control Plane pass — RETARGETED, not weakened.
  //
  // This previously asserted the prose "27 sessions" / "6 phases", which only
  // existed because the prior pass hand-wrote the screen as body copy. The
  // screen is now the approved user-facing HOW IT WORKS image, whose explainer
  // is baked pixels. The real requirement behind this check — "How It Works
  // must not contradict the locked 27-session architecture" — is preserved and
  // made sharper: the live overlay must report the real total (27), and the
  // image's baked placeholder "6 of 16" must be occluded rather than shown.
  check('(7c) How It Works reports the real 27-session architecture',
    /of 27/.test(p.text) && !/of 16/.test(p.text), p.text.slice(0, 160))
}

// ── (8)(9) Welcome shows no stale learner identity or default ─────────────
{
  const p = probes['/smokecraft/welcome']
  check('(8) Welcome shows no "Greg Guy"', !/Greg Guy/i.test(p.text))
  check('(9) Welcome shows no stale "beginner" default', !/\bbeginner\b/i.test(p.text))
  check('(9b) Welcome without prerequisites redirects to the earliest entry screen',
    p.path === '/smokecraft/enroll', p.path)
}

// ── (10) Humidor Match shows no FUTURE VISIT LOCKED artwork ───────────────
{
  const p = probes['/smokecraft/humidor-match']
  check('(10) Humidor Match shows no "FUTURE VISIT LOCKED"', !/FUTURE VISIT LOCKED/i.test(p.text))
  check('(10b) Humidor Match shows no "MANAGEMENT SYNC LOCKED"', !/MANAGEMENT SYNC LOCKED/i.test(p.text))
  check('(10c) Humidor Match gates via a live redirect, not a baked lock screen',
    p.path === '/smokecraft/enroll', p.path)
}

// ── (11)(12) Leaderboard has no fabricated competitors ────────────────────
{
  const p = probes['/smokecraft/leaderboard']
  check('(11) Leaderboard shows no "James Carter"', !/James Carter/i.test(p.text))
  check('(12) Leaderboard shows no "18,750 XP"', !/18[,.]?750/.test(p.text))
  check('(12b) Leaderboard shows no stale "4435 XP"', !/4[,.]?435/.test(p.text))
  check('(12c) Leaderboard is honest about unavailable shared rankings',
    /requires a backend|Only your own session/i.test(p.text), p.text.slice(0, 160))
}

// ── (13) Rewards Center renders Reward Center.png with no overlap defect ──
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE + '/smokecraft/rewards-center', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  // Approved-Asset Control Plane pass — RETARGETED, not weakened.
  //
  // These six checks were written against the previous pass's layout, in which
  // the approved visual was a CSS background on a capped div and a hand-built
  // <main> stack of glass cards sat BELOW it. The repo owner rejected that
  // approach: the approved image must be the screen, with live controls placed
  // into its own blank zones. The old assertions therefore encoded the wrong
  // target (a `backgroundSize: contain` div, a `<main>` below the image, and a
  // separate React nav bar) and would fail by construction once the screen was
  // corrected. Each is re-pointed at the equivalent correct property of the
  // approved-image-shell pattern. (13f) is made STRICTER, not looser: hotspots
  // over an approved image are intentionally text-free, so "no empty buttons"
  // is replaced by "every button exposes an accessible name".
  const vis = await page.evaluate(() => {
    const img = document.querySelector('img[src*="Reward"]')
    if (!img) return null
    const r = img.getBoundingClientRect()
    const buttons = Array.from(document.querySelectorAll('button'))
    const named = b => (b.textContent.trim() || b.getAttribute('aria-label') || '').length > 0
    return {
      src: img.getAttribute('src'),
      natRatio: img.naturalWidth / img.naturalHeight,
      renderedRatio: r.width / r.height,
      docOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      docOverflowY: document.documentElement.scrollHeight > window.innerHeight + 2,
      navTiles: document.querySelectorAll('[data-testid^="rc-nav-"]').length,
      unnamed: buttons.filter(b => !named(b)).length,
    }
  })
  check('(13) Rewards Center renders the approved Reward Center.png',
    !!vis && /Reward%20Center\.png|Reward Center\.png/.test(vis.src), vis ? vis.src : 'approved <img> missing')
  check('(13b) approved visual is not cropped (rendered at true aspect ratio)',
    !!vis && Math.abs(vis.renderedRatio - vis.natRatio) < 0.02,
    vis ? `natural=${vis.natRatio?.toFixed(3)} rendered=${vis.renderedRatio?.toFixed(3)}` : '')
  check('(13c) no hand-built content block stacked below the approved visual',
    !!vis && vis.docOverflowY === false, vis ? `pageScrollsVertically=${vis.docOverflowY}` : '')
  check('(13d) Rewards Center does not overflow the viewport horizontally',
    !!vis && vis.docOverflowX === false)
  check('(13e) the approved image\'s own bottom nav bar is touch-enabled',
    !!vis && vis.navTiles >= 5, vis ? `liveNavTiles=${vis.navTiles}` : '')
  check('(13f) every Rewards Center control exposes an accessible name',
    !!vis && vis.unnamed === 0, vis ? `unnamed=${vis.unnamed}` : '')
  await ctx.close()
}

// ── (14)(15)(16) Real click-through: Start → Enroll → Welcome → Session 1 ──
let journeyPage = null, journeyCtx = null
{
  const { ctx, page } = await freshPage()
  journeyCtx = ctx; journeyPage = page
  await page.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const start = page.getByRole('button', { name: /START SMOKECRAFT JOURNEY/i })
  check('(14a) Landing shows the START control for a clean visitor', (await start.count()) >= 1)
  if (await start.count()) {
    await start.first().click()
    await page.waitForTimeout(1300)
  }
  check('(14) Start reaches Enrollment', page.url().includes('/smokecraft/enroll'), page.url())
}

// ── (15) Entry reaches Welcome (real visible-control clicks only) ────────
{
  const page = journeyPage
  // Enrollment is a multi-step in-place flow: choose Guest Pass, then supply
  // a real email. Both are real clicks/typing on visible controls.
  const guest = page.getByRole('button', { name: /Activate My Guest Pass/i })
  check('(15a) Enrollment offers the Guest Pass control', (await guest.count()) >= 1)
  await guest.first().click()
  await page.waitForTimeout(1200)
  await page.locator('input').first().fill('guest.tester@example.com')
  await page.locator('button').filter({ hasText: /^→$/ }).first().click()
  await page.waitForTimeout(2200)
  check('(15b) Guest Pass reaches Venue Selection', page.url().includes('/smokecraft/venue-select'), page.url())

  // Venue selection is honest-empty in this build (no venue directory), so
  // the real user path is the explicit "continue without venue" control.
  await page.locator('button').filter({ hasText: /Continue without venue/i }).first().click()
  await page.waitForTimeout(900)
  await page.locator('button').filter({ hasText: /Continue to Identity/i }).first().click()
  await page.waitForTimeout(2200)
  check('(15c) Venue step reaches Identity', page.url().includes('/smokecraft/identity'), page.url())

  await page.locator('input[placeholder="First and Last Name"]').fill('Tester')
  await page.locator('input[placeholder="your@email.com"]').fill('guest.tester@example.com')
  const cont = page.locator('button:not([disabled])').filter({ hasText: /continue|begin|→/i })
  await cont.last().click()
  await page.waitForTimeout(2200)
  check('(15) Entry reaches Welcome', page.url().includes('/smokecraft/welcome'), page.url())
}

// ── (16) Welcome is clean and reaches Session 1, then Session 2 ───────────
{
  const page = journeyPage
  const text = await page.evaluate(() => document.body.innerText)
  check('(16a) Welcome shows no "Greg Guy"', !/Greg Guy/i.test(text))
  check('(16b) Welcome shows no stale "beginner" default', !/\bbeginner\b/i.test(text))
  check('(16c) Welcome shows the identity just entered by this user',
    /Tester/.test(text), text.slice(0, 120))

  const begin = page.getByRole('button', { name: /Begin Experience/i })
  check('(16d) Welcome offers the Begin Experience control', (await begin.count()) >= 1)
  await begin.first().click()
  await page.waitForTimeout(2000)
  const s1 = page.url()
  check('(16) Welcome reaches Session 1 via a real click',
    !s1.includes('/smokecraft/welcome') && !s1.includes('/enroll'), s1)
  check('(16e) Session 1 did not redirect to an old lock screen',
    !/FUTURE VISIT LOCKED/i.test(await page.evaluate(() => document.body.innerText)))

  // Session 1 -> Session 2 via the visible forward control.
  const next = page.locator('button:not([disabled])').filter({ hasText: /continue|next|→|confirm|select/i })
  if (await next.count()) { await next.last().click(); await page.waitForTimeout(2000) }
  check('(16f) Session 1 advances toward Session 2 without a lock screen',
    !/FUTURE VISIT LOCKED|MANAGEMENT SYNC LOCKED/i.test(await page.evaluate(() => document.body.innerText)),
    page.url())
  await journeyCtx.close()
}

// ── (17) Resume works ─────────────────────────────────────────────────────
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
  // Set-up only (established pattern): give this visitor real prior history
  // BEFORE the flow under test begins. The Resume activation itself is a
  // real visible-control click.
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('novee_guest_session') || '{}')
    raw.completedSteps = ['enroll', 'entry', 'humidor-match', 'meet-your-cigar']
    localStorage.setItem('novee_guest_session', JSON.stringify(raw))
    const j = JSON.parse(localStorage.getItem('sc_journey_v1') || '{}')
    j.selectedVenue = 'novee-grand-lounge'; j.venueSelectionCompleted = true
    localStorage.setItem('sc_journey_v1', JSON.stringify(j))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const resume = page.getByRole('button', { name: /RESUME SMOKECRAFT JOURNEY/i })
  check('(17a) Landing offers RESUME for a visitor with real progress', (await resume.count()) >= 1)
  if (await resume.count()) {
    await resume.first().click()
    await page.waitForTimeout(1400)
    check('(17) Resume click leaves the landing screen', !page.url().endsWith('/smokecraft'), page.url())
  } else {
    check('(17) Resume click leaves the landing screen', false, 'no resume control')
  }
  await ctx.close()
}

// ── (18) All routes remain on one build after navigation and refresh ──────
{
  const { ctx, page } = await freshPage()
  const seen = []
  for (const r of ['/smokecraft', '/smokecraft/how-it-works', '/smokecraft/leaderboard', '/smokecraft/rewards-center']) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    seen.push(await page.evaluate(() => (window.__SMOKECRAFT_BUILD__ || {}).commit))
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    seen.push(await page.evaluate(() => (window.__SMOKECRAFT_BUILD__ || {}).commit))
  }
  const uniq = [...new Set(seen)]
  check('(18) build stays identical across navigation and refresh',
    uniq.length === 1 && uniq[0] === API_COMMIT, JSON.stringify(uniq))
  await ctx.close()
}

// ── Cache-header hygiene (supports the mixed-build root cause) ────────────
{
  const idx = await fetch(BASE + '/smokecraft/leaderboard')
  check('(H1) HTML routes are served no-store',
    /no-store/.test(idx.headers.get('cache-control') || ''), idx.headers.get('cache-control'))
  check('(H2) SPA entry route /smokecraft is 200, not a cacheable 301',
    idx.status === 200, String(idx.status))
  const sc = await fetch(BASE + '/smokecraft', { redirect: 'manual' })
  check('(H3) /smokecraft does not emit a permanent redirect',
    sc.status !== 301, String(sc.status))
  const ver = await fetch(BASE + '/api/version')
  check('(H4) /api/version is served no-store',
    /no-store/.test(ver.headers.get('cache-control') || ''), ver.headers.get('cache-control'))
}

await browser.close()

console.log(results.join('\n'))
console.log(`\nPASS ${pass} / ${pass + fail}`)
console.log('NOTE: local production build only — live Railway verification is network-blocked in this sandbox.')
process.exit(fail === 0 ? 0 : 1)
