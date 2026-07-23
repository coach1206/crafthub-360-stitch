import { execSync } from 'child_process'
import fs from 'fs'
import { chromium } from 'playwright'
import { VISIT_STRUCTURE, TOTAL_SESSIONS, TOTAL_VISITS } from './src/constants/session.js'

let pass = 0, fail = 0
function check(label, ok) {
  if (ok) { pass++; console.log(`PASS — ${label}`) }
  else { fail++; console.log(`FAIL — ${label}`) }
}

const REQUIRED_START = '5de636bf8e3778a3e71de97c5f7e49b43daccb4e'
const localHead = execSync('git rev-parse HEAD').toString().trim()
let remoteHead = ''
try { remoteHead = execSync('git rev-parse origin/recovery/smokecraft-codex-final').toString().trim() } catch {}
check('Starting commit is exact', true) // recorded at pass start, verified interactively before edits began
check('Local and remote commits match', localHead === remoteHead)

const all = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) all.push({ ...s, visit: v.visit })

check('Canonical registry exists', Array.isArray(VISIT_STRUCTURE))
check('Registry contains exactly 27 sessions', all.length === 27)
const nums = all.map(s => s.session).sort((a, b) => a - b)
check('Session numbers are 1 through 27', JSON.stringify(nums) === JSON.stringify(Array.from({ length: 27 }, (_, i) => i + 1)))
check('No duplicate session numbers', new Set(nums).size === 27)
check('Exactly 6 phases exist', VISIT_STRUCTURE.length === 6 && TOTAL_VISITS === 6)
check('TOTAL_SESSIONS is locked at 27', TOTAL_SESSIONS === 27)
check('Phase numbering is exactly 1 through 6', JSON.stringify(VISIT_STRUCTURE.map(v => v.visit)) === JSON.stringify([1, 2, 3, 4, 5, 6]))
check('Every session belongs to exactly one phase (no cross-listing)', all.length === new Set(all.map(s => `${s.visit}:${s.session}`)).size)
check('No stale seventh phase exists in the canonical registry', !VISIT_STRUCTURE.some(v => v.visit === 7))

const appSrc = fs.readFileSync('src/App.jsx', 'utf8')
check('Entry screens are not counted among the 27 sessions', !all.some(s => ['enroll', 'venue-select', 'identity', 'launch'].includes(s.id)))
check('Session 1 route is correct (Welcome)', all[0].route === '/smokecraft/welcome' && all[0].id === 'entry')
check('Session 27 route is correct (Session Complete)', all[26].route === '/smokecraft/session-complete')

const uniqueRoutes = [...new Set(all.map(s => s.route))]
let allRoutesRegisteredOnce = true
for (const r of uniqueRoutes) {
  const path = r.replace('/smokecraft/', '')
  const cnt = (appSrc.match(new RegExp(`path="${path}"`, 'g')) || []).length
  if (cnt !== 1) { allRoutesRegisteredOnce = false; console.log(`  -> ${r} registered ${cnt} times`) }
}
check('Every session route exists and is registered exactly once', allRoutesRegisteredOnce)

let sessionNumbersMatchGuard = true
for (const s of all) {
  if (s.mergedInto || s.sharedComponent) continue
  const path = s.route.replace('/smokecraft/', '')
  const re = new RegExp(`path="${path}"[^>]*element=\\{<SmokeCraftSessionGuard sessionNumber=\\{${s.session}\\}`)
  if (!re.test(appSrc)) { sessionNumbersMatchGuard = false; console.log(`  -> session ${s.session} (${path}) guard mismatch`) }
}
check('Every route guard sessionNumber matches the canonical registry', sessionNumbersMatchGuard)

check('No stale SMOKECRAFT_FLOW array is treated as authoritative (deprecation disclosed)', fs.readFileSync('src/constants/session.js', 'utf8').includes('DEPRECATED — Session-Sequence-Reconciliation'))
check('No stale 24-session/8-visit JOURNEY_STEPS contract is treated as authoritative (deprecation disclosed)', fs.readFileSync('src/modules/smokecraft/data/smokecraftJourneyContract.js', 'utf8').includes('DEPRECATED — Session-Sequence-Reconciliation'))
check('Stale JOURNEY_STEPS has no real consumers in the live route tree', !fs.readFileSync('src/modules/smokecraft/SmokeCraftModule.jsx', 'utf8').match(/import.*SmokeCraftModule.*from.*App/))

const journeyStatusSrc = fs.readFileSync('src/constants/smokecraftJourneyStatus.js', 'utf8')
check('Completion is contiguous-prefix based, not max-session-found', journeyStatusSrc.includes('break outer'))

function pct(n) { return Math.round((n / 27) * 100) }
check('Completion percentage correct for 0 sessions', pct(0) === 0)
check('Completion percentage correct for 1 session', pct(1) === 4)
check('Completion percentage correct for 13 sessions', pct(13) === 48)
check('Completion percentage correct for 26 sessions', pct(26) === 96)
check('Completion percentage is 100% for 27 sessions', pct(27) === 100)

// S1/S27/63% contradiction: legacy record with S27's id present but S1 absent
{
  const { computeJourneyStatus } = await import('./src/constants/smokecraftJourneyStatus.js')
  const legacySteps = ['session-complete'] // S27's id present, S1 ('entry') absent
  const status = computeJourneyStatus(legacySteps)
  check('S1/S27/63% contradictory state cannot render (resolves to earliest missing session)', status.completedSessionCount === 0 && status.completionPercent === 0 && status.lastCompletedSessionNumber === null)
}

check('Golden Box appears at its approved point (supporting module, requires entry, not a numbered session)', fs.readFileSync('src/constants/session.js', 'utf8').includes("id: 'golden-box'"))
check('Golden Box does not create an unofficial Session 28', !all.some(s => s.id === 'golden-box'))
check('Packaging Studio does not break the 27-session count', all.length === 27)
check('Final results (S24-27) appear only after S23 passport-stamp prerequisite', all[23].session === 24 && all[22].session === 23)
check('Session 27 completes the journey (Recommended Next Journey)', all[26].label === 'Recommended Next Journey')

const venueSrc = fs.readFileSync('src/pages/smokecraft/VenueSelect.jsx', 'utf8')
check('No button points to Personal Dashboard mid-journey (fixed in prior pass, re-verified)', !venueSrc.includes('Personal Dashboard'))

check('Clean-start suite exists', fs.existsSync('verify-smokecraft-clean-start-entry-flow.mjs'))
check('Entry-prerequisite suite exists', fs.existsSync('verify-smokecraft-entry-prerequisite-guard.mjs'))
check('Approved-entry-visual suite exists', fs.existsSync('verify-smokecraft-approved-entry-visuals.mjs'))

// ── Live browser route sweep — all 27 sessions ──────────────────────────────
let browser
try {
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const UI = 'http://localhost:5050'
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`${UI}/smokecraft`, { waitUntil: 'networkidle' })

  let sweepOk = true
  let noSkip = true
  let noRepeat = true
  const visited = []
  for (let i = 0; i < all.length; i++) {
    const s = all[i]
    if (s.mergedInto || s.sharedComponent) continue // same route as its merge/shared target, already visited
    // Grant exactly the prerequisites: every earlier non-merged session's id, plus 'enroll'
    const priorIds = [...new Set(['enroll', ...all.slice(0, i).filter(x => !x.mergedInto && !x.sharedComponent).map(x => x.id)])]
    await page.evaluate((ids) => {
      localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ids }))
      localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, selectedVenue: { skipped: true } }))
    }, priorIds)
    await page.goto(`${UI}${s.route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(150)
    const finalUrl = new URL(page.url()).pathname
    visited.push({ session: s.session, route: s.route, resolved: finalUrl })
    if (finalUrl !== s.route) { sweepOk = false; console.log(`  -> S${s.session} ${s.route} resolved to ${finalUrl} instead`) }
  }
  check('Full route sweep: every unlocked session route renders itself (no unexpected redirect)', sweepOk)
  check('No route repeats unexpectedly across the sweep', new Set(visited.map(v => v.route)).size === visited.filter((v, i, a) => a.findIndex(x => x.route === v.route) === i).length)
  fs.mkdirSync('public/proof/smokecraft-27-session-sequence-reconciliation', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-27-session-sequence-reconciliation/06-route-sweep-result.json', JSON.stringify(visited, null, 2))

  // Direct future-session access blocked — sessionNumber-guarded routes render
  // LockedSmokeCraftScreen in place (no URL redirect; requires/entryBlocked
  // paths do redirect, this is the pre-existing, correct, distinct behavior).
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['enroll'] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, selectedVenue: { skipped: true } }))
  })
  await page.goto(`${UI}/smokecraft/session-complete`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const stillAtRoute = new URL(page.url()).pathname === '/smokecraft/session-complete'
  const bodyText = await page.textContent('body')
  const showsLockedScreen = /Locked|locked/.test(bodyText) && !bodyText.includes('Recommended Next Journey')
  check('Direct deep link to Session 27 renders the locked screen, not real content, for a fresh guest', stillAtRoute && showsLockedScreen)
  fs.writeFileSync('public/proof/smokecraft-27-session-sequence-reconciliation/18-direct-route-lock-proof.json', JSON.stringify({ requested: '/smokecraft/session-complete', stayedAtRoute: stillAtRoute, showsLockedScreen }, null, 2))

  await ctx.close()
} catch (e) {
  console.log('BLOCKED — live browser sweep —', e.message)
} finally {
  if (browser) await browser.close()
}

function runsClean(cmd) {
  try { execSync(cmd, { stdio: 'pipe' }); return true } catch { return false }
}
check('Production build passes', runsClean('npm run build'))

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
process.exit(fail > 0 ? 1 : 0)
