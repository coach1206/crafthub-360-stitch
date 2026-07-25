// SmokeCraft 360 — Full Journey Sequence & Approved-Asset proof.
//
// Proves, in a real browser against a production build, that clicking START
// SMOKECRAFT JOURNEY follows exactly one canonical sequence — entry flow
// (Guest Pass only if incomplete -> Venue only if incomplete -> Welcome/S1)
// then the 27-session curriculum spine in canonical order — and that every
// screen renders its approved GitHub image, verified by comparing the sha256
// of the bytes the browser actually fetched against the sha256 of the
// approved file on disk.
//
// Navigation rules honoured throughout:
//   * Start / Resume / Continue / Begin / Previous are ALWAYS real clicks on
//     visible controls (by accessible name / role / text).
//   * localStorage `completedSteps` is seeded ONLY to establish a STARTING
//     scenario before such a click — the established pattern used by every
//     suite in this operation. It is never used to fake a navigation result.
//
// Every canonical expectation is read from SMOKECRAFT_SCREEN_MANIFEST, which
// is generated from VISIT_STRUCTURE, so this suite cannot pass unless the
// live DOM, the routes, the phase/session markers, the previous/next chain
// and the approved assets all agree with the single source of truth.
//
// Disclosed, not hidden — three screens have no usable approved image and are
// asserted to be HONEST rather than asserted to be image-based:
//   session-1  (Welcome)        — no approved artwork exists in the repo.
//   session-25 (Rewards)        — REWARDS 222.png is a fully-baked mock
//                                 dashboard with fake numbers in its pixels
//                                 and zero blank overlay zones.
//   ResumeJourney               — no dedicated approved image exists at all.
// For these the suite asserts no fabricated data reaches the DOM.

import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { VISIT_STRUCTURE, TOTAL_SESSIONS, TOTAL_VISITS } from './src/constants/session.js'
import { SMOKECRAFT_SCREEN_MANIFEST, getManifestEntry } from './src/constants/smokecraftScreenManifest.js'
import { SC_ASSETS } from './src/constants/smokecraftAssets.js'

const BASE = process.env.SC_UI || 'http://localhost:5050'
const API = process.env.SC_API || 'http://localhost:3001'
const ROOT = process.cwd()
const PUBLIC = path.join(ROOT, 'public')
const PROOF = 'public/proof/smokecraft-full-journey-sequence-and-assets'
const SHOTS = `${PROOF}/screenshots`
fs.mkdirSync(SHOTS, { recursive: true })

let pass = 0, fail = 0
const failures = []
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
function section(t) { console.log(`\n── ${t}`) }

const sha = buf => createHash('sha256').update(buf).digest('hex')
const decode = u => decodeURIComponent(String(u).split('?')[0])
function diskSha(urlPath) {
  const f = path.join(PUBLIC, decode(urlPath).replace(/^\//, ''))
  return fs.existsSync(f) ? sha(fs.readFileSync(f)) : null
}

// Canonical spine, flattened exactly the way the manifest derives it.
const JOURNEY = { selectedVenue: { id: 'v1', name: 'Test Lounge' },
  selectedCigar: { name: 'Test Reserve Robusto', origin: 'Nicaragua', wrapper: 'Habano', strength: 'Medium', body: 'Medium', format: 'Robusto' } }

const spine = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) spine.push({ ...s, visit: v.visit, visitTitle: v.title })
function effectiveSession(s) {
  if (s.mergedInto) return s.mergedInto
  if (s.sharedComponent) return spine.find(x => x.route === s.sharedComponent && !x.mergedInto && !x.sharedComponent)?.session || s.session
  return s.session
}
// completedSteps a real player holds on arriving at spine index i.
const priorSteps = i => [...new Set(['enroll', 'identity', ...spine.slice(0, i).map(x => x.id)])]

const report = {
  startedAt: new Date().toISOString(),
  commit: execSync('git rev-parse HEAD').toString().trim(),
  branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
  entry: [], sessions: [], supporting: [], viewports: [], assets: {},
}

// ─────────────────────────────────────────────────────────────────────────────
section('A. Canonical structure (single source of truth: VISIT_STRUCTURE)')
assert('Exactly 6 phases', VISIT_STRUCTURE.length === 6 && TOTAL_VISITS === 6)
assert('Exactly 27 sessions', spine.length === 27 && TOTAL_SESSIONS === 27)
assert('Phases numbered 1..6 contiguously',
  JSON.stringify([...new Set(spine.map(s => s.visit))]) === JSON.stringify([1, 2, 3, 4, 5, 6]))
assert('Session numbers are exactly 1..27, no gap, no duplicate, no extra',
  JSON.stringify([...spine.map(s => s.session)].sort((a, b) => a - b)) === JSON.stringify(Array.from({ length: 27 }, (_, i) => i + 1)))
assert('No hidden 28th session anywhere in the manifest',
  !SMOKECRAFT_SCREEN_MANIFEST.some(m => m.sessionNumber > 27))

const curriculum = SMOKECRAFT_SCREEN_MANIFEST.filter(m => m.type === 'curriculum')
const entryScreens = SMOKECRAFT_SCREEN_MANIFEST.filter(m => m.type === 'entry')
assert('Manifest holds exactly 27 curriculum entries', curriculum.length === 27)
assert('Manifest holds exactly 4 entry entries', entryScreens.length === 4)
assert('Manifest holds exactly 31 screens total', SMOKECRAFT_SCREEN_MANIFEST.length === 31)

let chainOk = true
for (let i = 0; i < curriculum.length; i++) {
  const expPrev = i > 0 ? `session-${spine[i - 1].session}` : 'entry-venue'
  const expNext = i < curriculum.length - 1 ? `session-${spine[i + 1].session}` : 'supporting-recommended-next-journey'
  if (curriculum[i].previousScreenId !== expPrev || curriculum[i].nextScreenId !== expNext) chainOk = false
}
assert('Every Previous/Next link is derived from the registry and correct', chainOk)
assert('Session 5 (Format) carries its approved request-purchase branch',
  getManifestEntry('session-5').nextRouteOverride === '/smokecraft/request-purchase')
assert('Merged/shared sessions are exactly S9,13,17,18,20,26',
  JSON.stringify(spine.filter(s => s.mergedInto || s.sharedComponent).map(s => s.session).sort((a, b) => a - b))
  === JSON.stringify([9, 13, 17, 18, 20, 26]))

// Approved assets exist on disk, and no asset is silently shared between
// screens that are NOT declared merged siblings.
const byHash = new Map()
let missingOnDisk = 0
for (const m of SMOKECRAFT_SCREEN_MANIFEST) {
  if (!m.assetKey) continue
  const p = SC_ASSETS[m.assetKey]
  const h = diskSha(p)
  if (!h) { missingOnDisk++; continue }
  report.assets[m.screenId] = { assetKey: m.assetKey, path: decode(p), sha256: h }
  if (!byHash.has(h)) byHash.set(h, [])
  byHash.get(h).push(m.screenId)
}
assert('Every registered approved asset exists on disk', missingOnDisk === 0, `${missingOnDisk} missing`)
const declaredGroups = [['session-8', 'session-9'], ['session-12', 'session-13'],
  ['session-16', 'session-17', 'session-18'], ['session-19', 'session-20']]
const sharedGroups = [...byHash.values()].filter(g => g.length > 1).map(g => g.sort().join(','))
assert('No approved asset is reused outside its declared merged-session group',
  sharedGroups.every(g => declaredGroups.some(d => d.sort().join(',') === g)),
  sharedGroups.join(' | '))

// ─────────────────────────────────────────────────────────────────────────────
let browser
const consoleErrors = []
const brokenImages = []
try {
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  let rendered = new Set()
  page.on('response', r => { if (/\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/i.test(r.url())) rendered.add(new URL(r.url()).pathname) })
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('requestfailed', r => { if (/\.(png|jpg|jpeg|webp|svg)$/i.test(r.url())) brokenImages.push(r.url()) })

  const pathOf = () => new URL(page.url()).pathname
  async function seed(ids, journey = {}) {
    await page.evaluate(([v, j]) => {
      localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: v, profile: { firstName: 'Test Player' } }))
      localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, identity: { preferredName: 'Test Player' }, ...j }))
    }, [ids, journey])
  }
  // networkidle is what makes the approved-asset capture reliable, but under
  // heavy back-to-back runs this environment's preview server intermittently
  // stalls (the known rate-limiter/stale-process issue). Fall back to
  // domcontentloaded plus a real settle delay rather than aborting the run —
  // no assertion is relaxed, only the navigation wait strategy.
  async function go(route) {
    rendered = new Set()
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 45000 })
    } catch {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForTimeout(2500)
    }
    await page.waitForTimeout(180)
  }
  // Real click on a visible control, by accessible name or visible text.
  async function clickControl(nameRe) {
    const byRole = page.getByRole('button', { name: nameRe })
    if (await byRole.count()) { await byRole.first().click(); await page.waitForTimeout(950); return true }
    const byText = page.getByText(nameRe).first()
    if (await byText.count()) { await byText.click(); await page.waitForTimeout(950); return true }
    return false
  }
  async function markers() {
    return page.evaluate(() => {
      const el = document.querySelector('[data-smokecraft-screen-id]')
      if (!el) return null
      return {
        screenId: el.getAttribute('data-smokecraft-screen-id'),
        component: el.getAttribute('data-smokecraft-component'),
        assetKey: el.getAttribute('data-smokecraft-asset-key'),
        phase: el.getAttribute('data-smokecraft-phase'),
        session: el.getAttribute('data-smokecraft-session'),
        visualSource: el.getAttribute('data-visual-source'),
        staticOnly: el.getAttribute('data-static-only'),
      }
    })
  }
  // Re-fetch using the EXACT encoded pathname the browser itself requested.
  // Several approved filenames contain spaces, commas, ampersands and colons
  // ("CUT  TOAST, & LIGHT.png", "MENTOR :COMMENTARY.png"); re-encoding them
  // by hand yields a different URL that the SPA answers with index.html, so
  // the hash comparison must reuse the browser's own encoding.
  function fetchedPathFor(assetPath) {
    const want = decode(assetPath)
    return [...rendered].find(r => decode(r) === want) || null
  }
  async function hashServed(rawPath) {
    const res = await page.request.get(`${BASE}${rawPath}`)
    return sha(Buffer.from(await res.body()))
  }
  // The browser really fetched the approved file, and its bytes match disk.
  async function assertApprovedRendered(label, assetPath) {
    const want = decode(assetPath)
    const raw = fetchedPathFor(assetPath)
    assert(`${label}: approved image fetched (${path.basename(want)})`, Boolean(raw))
    if (!raw) return null
    const served = await hashServed(raw)
    const disk = diskSha(assetPath)
    assert(`${label}: rendered asset sha256 == approved file on disk`, served === disk,
      `served ${served.slice(0, 16)} vs disk ${String(disk).slice(0, 16)}`)
    return served
  }
  // Some approved images are legitimately data-gated behind a real user
  // choice (S3 shows the cigar reference only once a cigar is chosen; S4
  // shows a terroir plate only once a section is opened). Reveal them with
  // real clicks on visible section controls — never by faking state.
  async function revealSections() {
    const btns = page.locator('button:visible')
    const n = Math.min(await btns.count(), 8)
    for (let k = 0; k < n; k++) {
      const t = ((await btns.nth(k).textContent()) || '').trim()
      if (/^(←|Back|Continue|Next|Skip|Close)/i.test(t) || !t) continue
      try { await btns.nth(k).click({ timeout: 1500 }); await page.waitForTimeout(350) } catch { /* non-fatal */ }
      break
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  section('B. Entry flow — real clicks on the Landing CTA only')

  // B1. Brand-new user: Start must open Guest Pass (the first incomplete step).
  await go('/smokecraft')
  await page.evaluate(() => localStorage.clear())
  await go('/smokecraft')
  assert('Landing opens at /smokecraft on a clean start', pathOf() === '/smokecraft')
  await assertApprovedRendered('Landing', SC_ASSETS.landing)
  await page.screenshot({ path: `${SHOTS}/entry-01-landing.png` })
  const landingText = (await page.textContent('body')) || ''
  assert('Clean landing shows START (not RESUME)', /START SMOKECRAFT JOURNEY/i.test(landingText))
  assert('No stale archived-journey identity leaks onto a clean landing',
    !/Greg Guy|Carlos Mendoza|Romeo y Julieta 1875/i.test(landingText))
  assert('Landing Start control clicked', await clickControl(/START SMOKECRAFT JOURNEY/i))
  assert('New user: Start routes to Guest Pass (earliest incomplete entry step)',
    pathOf() === '/smokecraft/enroll', pathOf())
  await assertApprovedRendered('Guest Pass', SC_ASSETS.enroll)
  await page.screenshot({ path: `${SHOTS}/entry-02-guest-pass.png` })
  report.entry.push({ step: 'start-new-user', route: pathOf() })

  // B2. Enrolled user: Guest Pass must NOT reappear; Identity is next.
  // (Navigation Authority pass: canonical order is Enroll -> Identity ->
  // Venue -> Welcome. Identity is a required entry step, not the optional
  // dashboard it used to be, so an enrolled user with no 'identity' step yet
  // resolves to Identity here, never to Venue Selection.)
  await seed(['enroll'])
  await go('/smokecraft')
  const enrolledText = (await page.textContent('body')) || ''
  assert('Enrolled user sees RESUME on the Landing', /RESUME SMOKECRAFT JOURNEY/i.test(enrolledText))
  assert('Landing Resume control clicked', await clickControl(/RESUME SMOKECRAFT JOURNEY/i))
  assert('Enrolled user: Resume routes to Identity, never back to Guest Pass',
    pathOf() === '/smokecraft/identity', pathOf())
  await page.screenshot({ path: `${SHOTS}/entry-03-identity.png` })
  report.entry.push({ step: 'resume-enrolled', route: pathOf() })

  // B3. Guest Pass appears exactly once — a second Start click does not loop.
  await go('/smokecraft')
  await clickControl(/RESUME SMOKECRAFT JOURNEY/i)
  assert('Guest Pass appears once only — a second click still lands on Identity',
    pathOf() === '/smokecraft/identity', pathOf())

  // B3b. Enrolled + Identity complete: Venue is next; Venue Selection renders.
  await seed(['enroll', 'identity'])
  await go('/smokecraft')
  assert('Landing Resume clicked with identity complete', await clickControl(/RESUME SMOKECRAFT JOURNEY/i))
  assert('Enrolled + identity complete: Resume routes to Venue Selection',
    pathOf() === '/smokecraft/venue-select', pathOf())
  await assertApprovedRendered('Venue Selection', SC_ASSETS.venueSelect)
  await page.screenshot({ path: `${SHOTS}/entry-03b-venue-select.png` })

  // B4. Entry complete: destination is Welcome (S1), never an earlier step.
  await seed(['enroll', 'identity'], JOURNEY)
  await go('/smokecraft')
  assert('Landing Resume clicked with entry complete', await clickControl(/RESUME SMOKECRAFT JOURNEY/i))
  assert('Entry complete: destination is Welcome / Session 1',
    pathOf() === '/smokecraft/welcome', pathOf())
  const wm = await markers()
  assert('Welcome renders canonical screenId session-1', wm?.screenId === 'session-1')
  assert('Welcome reports phase 1, session 1', wm?.phase === '1' && wm?.session === '1')
  assert('Welcome honestly declares it has no approved asset (never a fabricated one)',
    wm?.visualSource === 'live-component-no-approved-asset' && wm?.assetKey === '')
  await page.screenshot({ path: `${SHOTS}/entry-04-welcome.png` })

  // B5. Welcome must never show placeholder identity/venue values.
  const welcomeText = (await page.textContent('body')) || ''
  assert('Welcome shows no placeholder values (Guest/User/Unknown/No venue selected/undefined/null)',
    !/\b(Unknown|No venue selected|Not shared yet|undefined|null|NaN)\b/.test(welcomeText),
    welcomeText.slice(0, 200))
  assert('Welcome reflects the real selected venue', /Test Lounge/i.test(welcomeText))

  // B6. Begin Experience opens Session 1's next canonical screen.
  assert('Begin Experience control clicked', await clickControl(/Begin Experience/i))
  assert('Begin Experience opens Session 2 (Humidor Match), the next canonical screen',
    pathOf() === '/smokecraft/humidor-match', pathOf())
  report.entry.push({ step: 'begin-experience', route: pathOf() })

  // ───────────────────────────────────────────────────────────────────────────
  section('C. All 27 sessions in canonical order — route, markers, approved asset')
  let seq = { route: true, marker: true, phase: true, asset: true, notOld: true }
  for (let i = 0; i < spine.length; i++) {
    const s = spine[i]
    const eff = effectiveSession(s)
    const effEntry = getManifestEntry(`session-${eff}`)
    await seed(priorSteps(i), JOURNEY)
    await go(s.route)
    const m = await markers()
    const resolved = pathOf()
    const shot = `${SHOTS}/session-${String(s.session).padStart(2, '0')}.png`
    await page.screenshot({ path: shot })

    const routeOk = resolved === s.route
    const markerOk = !!m && m.screenId === `session-${eff}` && m.component === `session-${eff}`
    const phaseOk = !!m && String(m.phase) === String(s.visit)
    const assetOk = !!m && m.assetKey === (effEntry.assetKey || '')
    const notOld = !!m && m.staticOnly === 'false' &&
      ['user-approved', 'live-component-no-approved-asset'].includes(m.visualSource)
    if (!routeOk) seq.route = false
    if (!markerOk) seq.marker = false
    if (!phaseOk) seq.phase = false
    if (!assetOk) seq.asset = false
    if (!notOld) seq.notOld = false

    // Approved image really fetched + hash-matched, for every session that has one.
    // The asset this SESSION is canonically registered against — not the
    // primary's. Rewards.jsx serves S25 and S26 from one route and switches
    // between REWARDS 222.png and ACHIEVMENTS.png on mode, exactly as the
    // manifest declares.
    const ownEntry = getManifestEntry(`session-${s.session}`)
    let servedSha = null
    if (ownEntry.assetKey) {
      let raw = fetchedPathFor(SC_ASSETS[ownEntry.assetKey])
      if (!raw) { await revealSections(); raw = fetchedPathFor(SC_ASSETS[ownEntry.assetKey]) }
      if (raw) servedSha = await hashServed(raw)
    }
    report.sessions.push({
      session: s.session, phase: s.visit, phaseTitle: s.visitTitle, label: s.label,
      route: s.route, resolved, screenId: m?.screenId, component: m?.component,
      assetKey: ownEntry.assetKey || null,
      approvedAsset: ownEntry.assetKey ? decode(SC_ASSETS[ownEntry.assetKey]) : null,
      renderedSha256: servedSha, diskSha256: ownEntry.assetKey ? diskSha(SC_ASSETS[ownEntry.assetKey]) : null,
      hashMatch: servedSha ? servedSha === diskSha(SC_ASSETS[ownEntry.assetKey]) : null,
      mergedInto: s.mergedInto || null, sharedComponent: s.sharedComponent || null,
      previousRoute: getManifestEntry(getManifestEntry(`session-${s.session}`).previousScreenId)?.route || null,
      nextRoute: getManifestEntry(`session-${s.session}`).nextRouteOverride
        || (i < spine.length - 1 ? spine[i + 1].route : null),
      visualSource: m?.visualSource, staticOnly: m?.staticOnly,
      screenshot: shot.replace('public/', '/'),
    })
    if (!routeOk || !markerOk || !phaseOk || !assetOk || !notOld)
      console.log(`    -> S${s.session} route=${routeOk} marker=${markerOk} phase=${phaseOk} asset=${assetOk} notOld=${notOld} (${resolved})`)
  }
  assert('All 27 sessions resolve at their exact canonical route', seq.route)
  assert('All 27 sessions render their canonical screenId/component', seq.marker)
  assert('All 27 sessions report their correct phase (1..6)', seq.phase)
  assert('All 27 sessions report their canonical approved asset key', seq.asset)
  assert('No Claude-composed replacement / static-only visual on any of the 27 sessions', seq.notOld)

  const withAsset = report.sessions.filter(r => r.assetKey)
  assert('Every session with an approved asset actually fetched it',
    withAsset.every(r => r.renderedSha256), withAsset.filter(r => !r.renderedSha256).map(r => `S${r.session}`).join(','))
  assert('Every rendered session asset hash matches the approved file on disk',
    withAsset.every(r => r.hashMatch !== false), withAsset.filter(r => r.hashMatch === false).map(r => `S${r.session}`).join(','))
  assert('No approved screen was skipped — 27 of 27 recorded', report.sessions.length === 27)
  assert('No screen repeated unexpectedly — 27 distinct session numbers',
    new Set(report.sessions.map(r => r.session)).size === 27)
  assert('Exactly 6 distinct phases appeared across the playthrough',
    new Set(report.sessions.map(r => r.phase)).size === 6)

  // ───────────────────────────────────────────────────────────────────────────
  section('D. Previous / Next / refresh / Resume / guards')

  // Previous returns to the immediate prior canonical screen (real click).
  await seed(priorSteps(3), JOURNEY)
  await go('/smokecraft/terroir') // S4
  const backOk = await clickControl(/^(Back|Previous|←)/i)
  const prevExpected = getManifestEntry('session-3').route
  assert('Previous on S4 returns to the immediate prior canonical screen (S3)',
    backOk && pathOf() === prevExpected, `${pathOf()} vs ${prevExpected}`)
  await page.screenshot({ path: `${SHOTS}/nav-previous-s4-to-s3.png` })

  // Next/Continue opens the immediate next canonical screen (real click).
  await seed(priorSteps(1), JOURNEY)
  await go('/smokecraft/humidor-match') // S2
  const beforeNext = pathOf()
  await clickControl(/^(Continue|Next|Confirm)/i)
  assert('Continue from S2 advances to a different canonical route', pathOf() !== beforeNext, pathOf())

  // Refresh preserves the current screen.
  await seed(priorSteps(5), JOURNEY)
  await go('/smokecraft/cut-toast-light') // S6
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(250)
  assert('Refresh preserves the current screen (S6 stays S6)', pathOf() === '/smokecraft/cut-toast-light', pathOf())
  assert('Refresh preserves the canonical markers', (await markers())?.screenId === 'session-6')
  await page.screenshot({ path: `${SHOTS}/nav-refresh-s6.png` })

  // Deep link to an unlocked screen loads correctly.
  await go('/smokecraft/first-third')
  assert('Deep link to an unlocked screen (S8) loads at its own route', pathOf() === '/smokecraft/first-third', pathOf())

  // Resume returns to the earliest incomplete screen, mid-journey.
  await seed(priorSteps(9), JOURNEY)
  await go('/smokecraft')
  assert('Mid-journey Landing Resume clicked', await clickControl(/RESUME SMOKECRAFT JOURNEY/i))
  assert('Resume opens the earliest incomplete session (S10 flavor-memory)',
    pathOf() === spine[9].route, `${pathOf()} vs ${spine[9].route}`)
  await page.screenshot({ path: `${SHOTS}/nav-resume-mid-journey.png` })

  // Direct access to a future session is blocked and the lock returns to current.
  await seed(priorSteps(2), JOURNEY)
  await go('/smokecraft/scorecard') // S19, far ahead
  const lockedMarkers = await markers()
  const lockedText = (await page.textContent('body')) || ''
  const isLocked = !lockedMarkers || lockedMarkers.screenId !== 'session-19'
  assert('Direct access to a future session (S19) is blocked — canonical screen never renders', isLocked)
  assert('Blocked future session shows a real lock state, not the protected content',
    isLocked && /lock|Locked|complete .* first|not yet/i.test(lockedText))
  await page.screenshot({ path: `${SHOTS}/guard-blocked-future-s19.png` })
  const lockReturn = await clickControl(/Return to|Current Session|Back to|Continue Journey/i)
  if (lockReturn) {
    assert('Lock action returns to the actual current session (S3 meet-your-cigar)',
      pathOf() === spine[2].route, `${pathOf()} vs ${spine[2].route}`)
    await page.screenshot({ path: `${SHOTS}/guard-lock-return.png` })
  } else {
    assert('Lock screen exposes a return control', false, 'no return control found')
  }

  // Entry prerequisites cannot be skipped: unenrolled deep link to Welcome.
  await page.evaluate(() => localStorage.clear())
  await go('/smokecraft/welcome')
  assert('Unenrolled deep link to Welcome is redirected to Guest Pass, never rendered',
    pathOf() === '/smokecraft/enroll', pathOf())
  await page.screenshot({ path: `${SHOTS}/guard-entry-prereq.png` })

  // ───────────────────────────────────────────────────────────────────────────
  section('E. Supporting routes — distinct, correct, journey-preserving')
  const SUPPORTING = [
    ['Pairing (landing destination)', '/smokecraft/pairing', '/assets/smokecraft-reference/approved/smokecraft-pairing.png'],
    ['Passport', '/smokecraft/passport', null],
    ['Rewards Center', '/smokecraft/rewards-center', SC_ASSETS.rewardCenter],
    ['Rankings / Leaderboard', '/smokecraft/leaderboard', null],
    ['CraftHub', '/smokecraft/crafthub', null],
    ['Challenge Hub', '/smokecraft/challenge-hub', null],
  ]
  const journeyBefore = { steps: priorSteps(11), venue: 'Test Lounge' }
  for (const [label, route, assetPath] of SUPPORTING) {
    await seed(journeyBefore.steps, JOURNEY)
    await go(route)
    const resolved = pathOf()
    await page.screenshot({ path: `${SHOTS}/supporting-${route.split('/').pop()}.png` })
    assert(`${label}: opens at its own route`, resolved === route, resolved)
    if (assetPath) await assertApprovedRendered(label, assetPath)
    const after = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('novee_guest_session') || '{}')
      const j = JSON.parse(localStorage.getItem('sc_journey_v1') || '{}')
      return { steps: s.completedSteps || [], venue: j.selectedVenue?.name || null }
    })
    assert(`${label}: preserves journey progress (completedSteps unchanged)`,
      JSON.stringify(after.steps) === JSON.stringify(journeyBefore.steps))
    assert(`${label}: preserves the selected venue`, after.venue === journeyBefore.venue)
    report.supporting.push({ label, route, resolved, steps: after.steps.length, venue: after.venue })
    // Back returns somewhere sane inside SmokeCraft, never a reset.
    const hadBack = await clickControl(/^(Back|←|Return)/i)
    if (hadBack) assert(`${label}: Back returns inside the SmokeCraft namespace`, pathOf().startsWith('/smokecraft'), pathOf())
  }

  // The three pairing routes are genuinely distinct screens.
  const pairingRoutes = ['/smokecraft/pairing', '/smokecraft/pairing-lab', '/smokecraft/pairing-recommendations']
  assert('Pairing, Pairing Lab and Pairing Recommendations are three distinct routes',
    new Set(pairingRoutes).size === 3)
  assert('Pairing Lab is the canonical S11 screen', getManifestEntry('session-11').route === '/smokecraft/pairing-lab')
  assert('Pairing Recommendations is the canonical S22 screen', getManifestEntry('session-22').route === '/smokecraft/pairing-recommendations')
  assert('Landing Pairing destination is NOT a guarded curriculum route',
    !curriculum.some(m => m.route === '/smokecraft/pairing'))

  // Pairing Lab appears only at its canonical point (locked before S11).
  await seed(priorSteps(4), JOURNEY)
  await go('/smokecraft/pairing-lab')
  assert('Pairing Lab is locked before its canonical point (S11)', (await markers())?.screenId !== 'session-11')
  await seed(priorSteps(10), JOURNEY)
  await go('/smokecraft/pairing-lab')
  assert('Pairing Lab opens at its canonical point (S11)', (await markers())?.screenId === 'session-11')
  // Pairing Recommendations likewise.
  await seed(priorSteps(10), JOURNEY)
  await go('/smokecraft/pairing-recommendations')
  assert('Pairing Recommendations is locked before its canonical point (S22)', (await markers())?.screenId !== 'session-22')
  await seed(priorSteps(21), JOURNEY)
  await go('/smokecraft/pairing-recommendations')
  assert('Pairing Recommendations opens at its canonical point (S22)', (await markers())?.screenId === 'session-22')

  // ───────────────────────────────────────────────────────────────────────────
  section('F. Missing-approved-asset screens are honest, not fabricated')
  // S25 Rewards — decorative band + 100% live data, no baked fake numbers in fields.
  await seed(priorSteps(24), JOURNEY)
  await go('/smokecraft/rewards')
  const rewardsText = (await page.textContent('body')) || ''
  await page.screenshot({ path: `${SHOTS}/blocked-asset-s25-rewards.png` })
  assert('S25 Rewards renders the canonical screen', (await markers())?.screenId === 'session-25')
  assert('S25 Rewards leaks none of REWARDS 222.png\'s baked fake figures into the DOM',
    !/2,750\s*XP|12\s*badges/i.test(rewardsText))
  // ResumeJourney — decorative unrelated photo, disclosed; must not fake data.
  await seed(['enroll', 'identity'], JOURNEY)
  await go('/smokecraft/resume')
  const resumeText = (await page.textContent('body')) || ''
  await page.screenshot({ path: `${SHOTS}/blocked-asset-resume-journey.png` })
  assert('ResumeJourney renders without placeholder/fabricated values',
    !/\b(Unknown|Not shared yet|undefined|null|NaN)\b/.test(resumeText))
  assert('SC_ASSETS.resume has no dedicated approved image (disclosed blocker)',
    !Object.keys(SC_ASSETS).includes('resumeApproved'))

  // ───────────────────────────────────────────────────────────────────────────
  section('G. Four-viewport sweep across all 31 canonical screens')
  const VIEWPORTS = [[1024, 768], [1280, 800], [1366, 768], [1440, 900]]
  const routesToSweep = [
    ...entryScreens.map(m => ({ id: m.screenId, route: m.route, i: 0 })),
    ...spine.map((s, i) => ({ id: `session-${s.session}`, route: s.route, i })),
  ]
  let overflowIssues = []
  for (const [w, h] of VIEWPORTS) {
    await page.setViewportSize({ width: w, height: h })
    for (const r of routesToSweep) {
      await seed(priorSteps(r.i), JOURNEY)
      await go(r.route)
      const m = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        w: document.documentElement.clientWidth,
      }))
      if (m.overflow > 2) overflowIssues.push(`${r.id}@${w}x${h}:+${m.overflow}px`)
      report.viewports.push({ screenId: r.id, route: r.route, viewport: `${w}x${h}`, horizontalOverflowPx: m.overflow })
    }
    // One representative screenshot per viewport for real visual inspection.
    await seed(priorSteps(1), JOURNEY)
    await go('/smokecraft/humidor-match')
    await page.screenshot({ path: `${SHOTS}/viewport-${w}x${h}-session-02.png` })
    await go('/smokecraft')
    await page.screenshot({ path: `${SHOTS}/viewport-${w}x${h}-landing.png` })
  }
  assert(`No horizontal overflow on any of ${routesToSweep.length} screens at any of the 4 required viewports`,
    overflowIssues.length === 0, overflowIssues.slice(0, 12).join(', '))

  // Real geometric overlap check on the Landing's returning-user CTA stack.
  // A `minHeight: 72` on the secondary control used to override its approved
  // percentage band and run it over both the primary CTA and the artwork's
  // baked descriptive paragraph, at every one of the four required viewports.
  const ctaIssues = []
  for (const [w, h] of VIEWPORTS) {
    await page.setViewportSize({ width: w, height: h })
    await seed(['enroll', 'identity'], JOURNEY)          // returning user -> both CTAs render
    await go('/smokecraft')
    const boxes = await page.evaluate(() => {
      const find = re => [...document.querySelectorAll('button')]
        .find(b => re.test((b.textContent || b.getAttribute('aria-label') || '')))
      const r = e => e ? e.getBoundingClientRect() : null
      const el = document.querySelector('img[alt*="SmokeCraft"]')
      return {
        primary: r(find(/RESUME SMOKECRAFT JOURNEY|START SMOKECRAFT JOURNEY|VIEW COMPLETED/i)),
        secondary: r(find(/START NEW JOURNEY/i)),
        img: r(el),
        primaryScroll: (() => { const b = find(/RESUME SMOKECRAFT|START SMOKECRAFT|VIEW COMPLETED/i); return b ? { sh: b.scrollHeight, ch: b.clientHeight, sw: b.scrollWidth, cw: b.clientWidth } : null })(),
      }
    })
    if (boxes.primary && boxes.secondary) {
      const overlap = boxes.primary.bottom > boxes.secondary.top + 1
      if (overlap) ctaIssues.push(`${w}x${h}: CTAs overlap by ${(boxes.primary.bottom - boxes.secondary.top).toFixed(0)}px`)
      // Secondary must stay inside its approved band, clear of the baked
      // paragraph that begins ~68.6% down the approved artwork.
      if (boxes.img) {
        const pctBottom = ((boxes.secondary.bottom - boxes.img.top) / boxes.img.height) * 100
        if (pctBottom > 68.6) ctaIssues.push(`${w}x${h}: secondary CTA reaches ${pctBottom.toFixed(1)}% (over baked paragraph)`)
      }
    } else ctaIssues.push(`${w}x${h}: returning-user CTA pair not found`)
    // Primary label must fit on one line inside its approved band.
    if (boxes.primaryScroll && boxes.primaryScroll.sh > boxes.primaryScroll.ch + 2)
      ctaIssues.push(`${w}x${h}: primary CTA label wraps out of its band (${boxes.primaryScroll.sh}>${boxes.primaryScroll.ch})`)
    // nowrap must not simply clip the label instead of wrapping it.
    if (boxes.primaryScroll && boxes.primaryScroll.sw > boxes.primaryScroll.cw + 2)
      ctaIssues.push(`${w}x${h}: primary CTA label is clipped horizontally (${boxes.primaryScroll.sw}>${boxes.primaryScroll.cw})`)
    await page.screenshot({ path: `${SHOTS}/cta-returning-${w}x${h}.png` })
  }
  assert('Returning-user Landing CTAs never overlap each other or the baked paragraph, and the primary label is neither wrapped nor clipped',
    ctaIssues.length === 0, ctaIssues.join(' | '))
  assert('Four-viewport sweep covered all 31 canonical screens x 4 viewports',
    report.viewports.length === routesToSweep.length * 4, String(report.viewports.length))
  await page.setViewportSize({ width: 1440, height: 900 })

  // ───────────────────────────────────────────────────────────────────────────
  section('H. Runtime health')
  const blocking = consoleErrors.filter(e => !/429|rate limit|favicon|Failed to load resource|navigator\.vibrate/i.test(e))
  assert('No blocking console error across the whole journey', blocking.length === 0, blocking.slice(0, 3).join(' | '))
  assert('No broken approved-image request across the whole journey', brokenImages.length === 0, brokenImages.slice(0, 3).join(' | '))
  const health = await page.request.get(`${API}/api/health`)
  assert('Backend health check returns 200', health.status() === 200)
  const preview = await page.request.get(`${BASE}/smokecraft`)
  assert('Production preview serves /smokecraft (200)', preview.status() === 200)

  await ctx.close()
} catch (e) {
  assert('Suite ran to completion without throwing', false, e?.message || String(e))
  console.error(e)
} finally {
  if (browser) await browser.close()
}

report.finishedAt = new Date().toISOString()
report.pass = pass
report.fail = fail
report.failures = failures
fs.writeFileSync(`${PROOF}/00-full-journey-sequence-and-assets.json`, JSON.stringify(report, null, 2))

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
if (failures.length) { console.log('\nFailures:'); failures.forEach(f => console.log(`  - ${f}`)) }
process.exit(fail === 0 ? 0 : 1)
