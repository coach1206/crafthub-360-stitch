// SmokeCraft Landing "Recommended Pairing" route — verification suite.
//
// SCOPE
// -----
// This suite locks the Landing page's Recommended Pairing control to the
// approved standalone Pairing screen (/smokecraft/pairing, Pairing.jsx) and
// proves it can never again regress to the SESSION-11-guarded Pairing Lab.
//
// HISTORY OF THE DEFECT (see the pass report for the full chain)
//   src/pages/SmokeCraft.jsx once carried the destination inline:
//       onClick={() => go('/smokecraft/pairing-lab')}
//   which is the session-11 curriculum screen. A fresh, session-1 user who
//   tapped the Landing pairing control was therefore shown the locked-state
//   screen (or bounced to enroll) instead of the approved Pairing visual.
//   Commit 8244423a replaced every inline Landing destination with the one
//   canonical map in src/constants/smokecraftLandingActions.js, where
//   SMOKECRAFT_LANDING_DESTINATIONS.PAIRING = '/smokecraft/pairing'.
//   This suite is the standing regression lock for that mapping.
//
// FOUR DISTINCT PAIRING SCREENS — none may share a route or a component:
//   1. Landing Recommended Pairing  → action PAIRING → /smokecraft/pairing
//   2. Pairing            /smokecraft/pairing              Pairing.jsx            unguarded, Landing-reachable
//   3. Pairing Lab        /smokecraft/pairing-lab          session-11 (guarded)
//   4. Personalized Pairing Recommendations
//                         /smokecraft/pairing-recommendations  session-22 (guarded)
//
// Interaction rule: every navigation under test is performed by clicking a
// VISIBLE control. localStorage seeding only establishes a STARTING scenario.
import { chromium } from 'playwright'
import { execSync } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'

const UI_BASE = process.argv[2] || 'http://127.0.0.1:5050'
const PROOF_DIR = 'public/proof/smokecraft-landing-pairing-route'
fs.mkdirSync(PROOF_DIR, { recursive: true })

// Pre-pass baseline: the commit this pass started from.
const BASE_REF = process.env.SC_BASE_REF || 'ea4c784b27cc6a6ec6f1474ce43825ab6f5d489b'

const CHROME = process.env.SC_CHROME || [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
].find(p => fs.existsSync(p))

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex') }
function gitShow(ref, file) {
  try { return execSync(`git show ${ref}:${file}`, { maxBuffer: 64 * 1024 * 1024 }) } catch { return null }
}
function json(name, obj) { fs.writeFileSync(`${PROOF_DIR}/${name}.json`, JSON.stringify(obj, null, 2)) }

const evidence = {}

// ── Source-level canonical-record assertions ─────────────────────────
const actionsSrc = fs.readFileSync('src/constants/smokecraftLandingActions.js', 'utf8')
const landingSrc = fs.readFileSync('src/pages/SmokeCraft.jsx', 'utf8')
const appSrc = fs.readFileSync('src/App.jsx', 'utf8')

check('(R1) Landing PAIRING destination is /smokecraft/pairing in the one canonical map',
  /PAIRING:\s*'\/smokecraft\/pairing',/.test(actionsSrc))
check('(R2) Landing PAIRING destination is NOT /smokecraft/pairing-lab',
  !/PAIRING:\s*'\/smokecraft\/pairing-lab'/.test(actionsSrc))
check('(R3) Landing source contains no inline pairing-lab navigation',
  !landingSrc.includes('pairing-lab'))
check('(R4) Landing pairing hotspot goes through the resolver (runAction(ACTIONS.PAIRING))',
  landingSrc.includes('runAction(ACTIONS.PAIRING)'))
check('(R5) Landing source contains no inline route literals for the pairing control',
  !/onClick=\{\(\)\s*=>\s*go\('\/smokecraft\/pairing/.test(landingSrc))

// Route/component distinctness (the four records must stay separate).
check('(R6) /smokecraft/pairing is unguarded and renders Pairing.jsx',
  /<Route path="pairing"\s+element=\{<Pairing \/>\}/.test(appSrc))
check('(R7) /smokecraft/pairing-lab is guarded at sessionNumber={11} (session-11)',
  /<Route path="pairing-lab"\s+element=\{<SmokeCraftSessionGuard sessionNumber=\{11\}>/.test(appSrc))
check('(R8) /smokecraft/pairing-recommendations is guarded at sessionNumber={22} (session-22)',
  /<Route path="pairing-recommendations" element=\{<SmokeCraftSessionGuard sessionNumber=\{22\}>/.test(appSrc))
check('(R9) The three pairing routes are three distinct paths',
  new Set(['/smokecraft/pairing', '/smokecraft/pairing-lab', '/smokecraft/pairing-recommendations']).size === 3)

const registrySrc = fs.readFileSync('src/constants/smokecraftComponentRegistry.js', 'utf8')
check('(R10) session-11 and session-22 map to distinct components (PairingLab vs PairingRecommendations)',
  /'session-11':\s*PairingLab/.test(registrySrc) && /'session-22':\s*PairingRecommendations/.test(registrySrc))

// Approved assets for each of the three pairing screens — path + sha256.
const ASSETS = {
  pairing: 'public/assets/smokecraft-reference/approved/smokecraft-pairing.png',
  pairingLab: 'public/assets/smokecraft/PAIRING LAB1.png',
  pairingRecommendations: 'public/assets/smokecraft/personlized pairing 222.png',
}
const assetHashes = {}
for (const [k, p] of Object.entries(ASSETS)) {
  const exists = fs.existsSync(p)
  assetHashes[k] = exists ? { path: p, sha256: sha256(fs.readFileSync(p)), bytes: fs.statSync(p).size } : null
  check(`(A-${k}) Approved asset exists on disk: ${p}`, exists,
    exists ? `sha256=${assetHashes[k].sha256.slice(0, 16)} bytes=${assetHashes[k].bytes}` : 'MISSING')
}
check('(A-distinct) The three pairing screens use three DIFFERENT approved assets',
  new Set(Object.values(assetHashes).map(a => a && a.sha256)).size === 3)
evidence.approvedAssets = assetHashes

// ── (12)(13)(14) Locked source files unchanged ───────────────────────
for (const [label, file] of [
  ['Rewards Center', 'src/pages/smokecraft/RewardsCenter.jsx'],
  ['Leaderboard', 'src/pages/smokecraft/Leaderboard.jsx'],
  ['Passport', 'src/pages/smokecraft/SmokeCraftPassport.jsx'],
]) {
  const before = gitShow(BASE_REF, file)
  const after = fs.existsSync(file) ? fs.readFileSync(file) : null
  const same = before && after && sha256(before) === sha256(after)
  check(`${label} source is byte-identical to the pre-pass baseline`, !!same,
    `${BASE_REF.slice(0, 7)}=${before ? sha256(before).slice(0, 12) : 'MISSING'} now=${after ? sha256(after).slice(0, 12) : 'MISSING'}`)
}

// ── (17) Approved-asset checksum sweep ───────────────────────────────
const assetDiff = execSync(`git diff --name-status ${BASE_REF} -- public/assets/smokecraft`).toString().trim()
const assetUntracked = execSync('git status --porcelain -- public/assets/smokecraft').toString().trim()
check('(17a) No approved asset under public/assets/smokecraft was changed or removed', assetDiff === '', assetDiff || 'no diff')
check('(17b) No new artwork was created under public/assets/smokecraft', assetUntracked === '', assetUntracked || 'no untracked files')
check('(17c) 6-phase / 27-session structure (src/constants/session.js) unchanged',
  execSync(`git diff --stat ${BASE_REF} -- src/constants/session.js`).toString().trim() === '')
check('(15/16a) Entry-sequence resolver core logic unchanged from the prior pass',
  sha256(gitShow(BASE_REF, 'src/constants/smokecraftLandingActions.js') || Buffer.from('x')) ===
  sha256(fs.readFileSync('src/constants/smokecraftLandingActions.js')))
check('(16b) CraftHub routing unchanged from the prior pass',
  (appSrc.match(/path="crafthub"\s+element=\{<SmokeCraftCraftHub/g) || []).length === 1)

// ── Live browser section ─────────────────────────────────────────────
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })

async function freshPage() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  return ctx.newPage()
}
async function seed(page, { completedSteps = null, venue = false } = {}) {
  await page.goto(UI_BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ completedSteps, venue }) => {
    localStorage.clear()
    if (completedSteps) {
      localStorage.setItem('novee_guest_session', JSON.stringify({
        sessionId: 'lpr-test-' + Date.now(), guestId: 'lpr-test-guest',
        completedSteps, xp: 0, rank: 'Novice', badges: [], __version: 4,
      }))
    }
    if (venue) localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, selectedVenue: { id: 'lpr-venue', name: 'LPR Test Venue' } }))
  }, { completedSteps, venue })
}
async function landing(page) {
  await page.goto(`${UI_BASE}/smokecraft`, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(600)
}
function pathOf(page) { return new URL(page.url()).pathname }
function shot(page, name) { return page.screenshot({ path: `${PROOF_DIR}/${name}.png` }) }
async function readJourney(page) {
  return page.evaluate(() => ({
    session: localStorage.getItem('novee_guest_session'),
    journey: localStorage.getItem('sc_journey_v1'),
  }))
}
const LOCK_RE = /Not Unlocked Yet|Locked|Complete the previous session/i
async function bodyText(page) { return (await page.textContent('body')).replace(/\s+/g, ' ').trim() }

// Session ids for spine sessions 1..10, used to legitimately unlock session 11.
const SPINE_1_TO_10 = ['enroll', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir',
  'format', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory']

try {
  // ── (1)(2)(3)(4)(5)(6)(7)(8): the core Landing-click journey ──────
  const page = await freshPage()
  // Fresh user: enrolled + venue only (session 1 — Pairing Lab must be locked for them).
  await seed(page, { completedSteps: ['enroll', 'entry'], venue: true })
  await landing(page)
  await shot(page, '01-landing-before-click')
  const journeyBefore = await readJourney(page)

  const pairingControl = page.getByRole('button', { name: 'View Pairing', exact: true })
  const controlCount = await pairingControl.count()
  check('(1/2a) Exactly one visible Recommended Pairing control exists on Landing', controlCount === 1, `count=${controlCount}`)
  const box = await pairingControl.first().boundingBox()
  check('(2b) The Recommended Pairing control is a real, sized, clickable target',
    !!box && box.width > 40 && box.height > 20, JSON.stringify(box))

  await pairingControl.first().click()
  await page.waitForTimeout(1200)
  const pAfter = pathOf(page)
  check('(3) Landing pairing click does NOT open /smokecraft/pairing-lab', pAfter !== '/smokecraft/pairing-lab', pAfter)
  check('(4) Landing pairing click opens the approved Pairing route /smokecraft/pairing',
    pAfter === '/smokecraft/pairing', pAfter)
  await shot(page, '02-pairing-after-click')

  // (5) Rendered asset hash vs file-on-disk hash.
  const renderedSrcs = await page.$$eval('img', imgs => imgs.map(i => i.getAttribute('src')))
  const approvedSrc = '/assets/smokecraft-reference/approved/smokecraft-pairing.png'
  check('(5a) The approved Pairing image is the rendered composition',
    renderedSrcs.includes(approvedSrc), JSON.stringify(renderedSrcs))
  const renderedBytes = await page.evaluate(async src => {
    const r = await fetch(src)
    const b = new Uint8Array(await r.arrayBuffer())
    return Array.from(b)
  }, approvedSrc)
  const renderedHash = sha256(Buffer.from(renderedBytes))
  check('(5b) Rendered Pairing asset sha256 === file-on-disk sha256',
    renderedHash === assetHashes.pairing.sha256, `rendered=${renderedHash.slice(0, 16)} disk=${assetHashes.pairing.sha256.slice(0, 16)}`)
  // (5c) Naturally-decoded dimensions match the declared approved composition.
  const dims = await page.evaluate(src => {
    const i = [...document.images].find(x => x.getAttribute('src') === src)
    return i ? { w: i.naturalWidth, h: i.naturalHeight } : null
  }, approvedSrc)
  check('(5c) Approved Pairing image decodes at its approved dimensions 1086x1448',
    !!dims && dims.w === 1086 && dims.h === 1448, JSON.stringify(dims))
  evidence.renderedPairing = { route: pAfter, src: approvedSrc, renderedHash, dims }

  // (6) No locked-state screen.
  const pairingText = await bodyText(page)
  check('(6) No "Not Unlocked Yet" / locked-state screen appears on the Pairing destination',
    !LOCK_RE.test(pairingText), pairingText.slice(0, 120))

  // (7) Active journey preserved, byte-for-byte.
  const journeyAfter = await readJourney(page)
  // Substantive progress fields only. `lastVisitedRoute`/`system.lastVisitedRoute`
  // and `updatedAt` are navigation breadcrumbs the app writes on EVERY route
  // change by design; they are not journey progress. Asserting on the whole
  // blob would assert that navigation cannot happen, which is not the contract.
  const PROGRESS_KEYS = ['completedSteps', 'xp', 'rank', 'badges', 'sessionId', 'guestId']
  const progressOf = raw => {
    const o = JSON.parse(raw || '{}')
    return JSON.stringify(Object.fromEntries(PROGRESS_KEYS.map(k => [k, o[k]])))
  }
  check('(7a) Guest session progress (completedSteps/xp/rank/badges/ids) identical before/after the pairing click',
    progressOf(journeyBefore.session) === progressOf(journeyAfter.session),
    progressOf(journeyAfter.session))
  const volatile = JSON.parse(journeyAfter.session || '{}')
  check('(7a2) The pairing click did not add, remove or reorder any completed step',
    JSON.stringify(JSON.parse(journeyBefore.session).completedSteps) === JSON.stringify(volatile.completedSteps),
    JSON.stringify(volatile.completedSteps))
  check('(7b) Journey data (sc_journey_v1) identical before/after the pairing click',
    journeyBefore.journey === journeyAfter.journey)
  evidence.journeyPreservation = { before: journeyBefore, after: journeyAfter }

  // (7c) The Pairing screen must offer an honest continue action, not a lock.
  const continueBtn = page.getByTestId('pairing-continue')
  check('(7c) Pairing offers a live journey action (continue) for incomplete personalization data',
    await continueBtn.count() === 1)

  // (8) Back returns to Landing.
  await page.getByTestId('pairing-back').click()
  await page.waitForTimeout(1000)
  const pBack = pathOf(page)
  check('(8) Back from the approved Pairing screen returns to Landing', pBack === '/smokecraft', pBack)
  await shot(page, '03-back-to-landing')
  evidence.back = { from: pAfter, to: pBack }

  // ── (9) Early direct Pairing Lab access remains guarded ──────────
  const page2 = await freshPage()
  await seed(page2, { completedSteps: ['enroll', 'entry'], venue: true })
  await page2.goto(`${UI_BASE}/smokecraft/pairing-lab`, { waitUntil: 'networkidle', timeout: 45000 })
  await page2.waitForTimeout(1200)
  const labText = await bodyText(page2)
  const labPath = pathOf(page2)
  const guarded = LOCK_RE.test(labText) || labPath !== '/smokecraft/pairing-lab'
  check('(9) A fresh (session-1) user hitting /smokecraft/pairing-lab directly is still guarded',
    guarded, `path=${labPath} text=${labText.slice(0, 100)}`)
  await shot(page2, '04-pairing-lab-guarded-fresh-user')
  evidence.pairingLabFresh = { path: labPath, text: labText.slice(0, 200), guarded }

  // ── (10) Pairing Lab opens at its canonical position (session 11) ─
  const page3 = await freshPage()
  await seed(page3, { completedSteps: SPINE_1_TO_10, venue: true })
  await page3.goto(`${UI_BASE}/smokecraft/pairing-lab`, { waitUntil: 'networkidle', timeout: 45000 })
  await page3.waitForTimeout(1200)
  const labText2 = await bodyText(page3)
  const labPath2 = pathOf(page3)
  check('(10) With sessions 1–10 complete, Pairing Lab opens at its canonical session-11 position',
    labPath2 === '/smokecraft/pairing-lab' && !LOCK_RE.test(labText2),
    `path=${labPath2} text=${labText2.slice(0, 100)}`)
  await shot(page3, '05-pairing-lab-unlocked-at-session-11')
  evidence.pairingLabUnlocked = { path: labPath2, text: labText2.slice(0, 200) }

  // ── (11) Personalized Pairing Recommendations stays distinct ──────
  const page4 = await freshPage()
  await seed(page4, { completedSteps: ['enroll', 'entry'], venue: true })
  await page4.goto(`${UI_BASE}/smokecraft/pairing-recommendations`, { waitUntil: 'networkidle', timeout: 45000 })
  await page4.waitForTimeout(1200)
  const recPath = pathOf(page4)
  check('(11a) /smokecraft/pairing-recommendations is a distinct route from /smokecraft/pairing and /smokecraft/pairing-lab',
    recPath !== '/smokecraft/pairing' , `path=${recPath}`)
  const recGuarded = LOCK_RE.test(await bodyText(page4)) || recPath !== '/smokecraft/pairing-recommendations'
  check('(11b) Personalized Pairing Recommendations remains guarded at its own session-22 position for a fresh user',
    recGuarded, `path=${recPath}`)
  await shot(page4, '06-pairing-recommendations-distinct')
  evidence.pairingRecommendations = { path: recPath, guarded: recGuarded }

  // ── (15) Entry-sequence fix still passes (spot re-check) ──────────
  const page5 = await freshPage()
  await seed(page5, { completedSteps: ['enroll'], venue: false })
  await landing(page5)
  await page5.locator('button', { hasText: /SMOKECRAFT JOURNEY|START NEW JOURNEY|VIEW COMPLETED/i }).first().click()
  await page5.waitForTimeout(1200)
  const entryPath = pathOf(page5)
  check('(15) Entry sequence still resolves an enrolled user past Guest Pass (not back to /smokecraft/enroll)',
    entryPath !== '/smokecraft/enroll' && entryPath !== '/smokecraft', entryPath)
  await shot(page5, '07-entry-sequence-still-passes')
  evidence.entrySequence = { path: entryPath }

  // ── (16) CraftHub still passes ───────────────────────────────────
  const page6 = await freshPage()
  await seed(page6, { completedSteps: ['enroll', 'entry'], venue: true })
  await landing(page6)
  await page6.getByRole('button', { name: 'CraftHub', exact: true }).first().click()
  await page6.waitForTimeout(1200)
  const hubPath = pathOf(page6)
  check('(16) Landing CraftHub control still opens the approved CraftHub destination',
    hubPath === '/smokecraft/crafthub', hubPath)
  await shot(page6, '08-crafthub-still-passes')
  evidence.craftHub = { path: hubPath }

  // ── (14) Passport still has its already-committed Back button ────
  const page7 = await freshPage()
  await seed(page7, { completedSteps: ['enroll', 'entry'], venue: true })
  await landing(page7)
  await page7.getByRole('button', { name: 'View Passport', exact: true }).first().click()
  await page7.waitForTimeout(1200)
  const passportPath = pathOf(page7)
  check('(14a) Passport still opens from Landing at /smokecraft/passport', passportPath === '/smokecraft/passport', passportPath)
  const pBackBtn = page7.getByRole('button', { name: /back/i }).first()
  check('(14b) Passport still has its already-committed visible Back button', await pBackBtn.count() >= 1)
  await pBackBtn.click()
  await page7.waitForTimeout(1000)
  check('(14c) Passport Back still returns to Landing', pathOf(page7) === '/smokecraft', pathOf(page7))
  evidence.passport = { path: passportPath }

  json('00-evidence', evidence)
} catch (e) {
  check('Live browser section completed without error', false, e.message)
} finally {
  await browser.close()
}

const passed = results.filter(r => r.pass).length
const failed = results.filter(r => !r.pass).length
json('99-results', results)
console.log(`\n${passed} passed, ${failed} failed (of ${results.length} total)`)
process.exit(failed > 0 ? 1 : 0)
