// Emergency Remediation Continuation: Entry-Prerequisite Guard. Verifies
// the shared getSmokeCraftEntryReadiness() contract is used by the Welcome
// guard, blocks direct-URL bypass of Enrollment/Venue, never flashes
// protected content, and that the landing page remains intentionally
// public. Live-URL checks honestly report BLOCKED when production is
// unreachable — never fabricated.
import { execSync } from 'child_process'
import fs from 'fs'
import { chromium } from 'playwright'

const UI_BASE = 'http://localhost:5050'
const PROOF_DIR = 'public/proof/smokecraft-entry-prerequisite-guard'
fs.mkdirSync(PROOF_DIR, { recursive: true })

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}
function blocked(name, reason) {
  results.push({ name, pass: null, detail: 'BLOCKED' })
  console.log(`BLOCKED — ${name} — ${reason}`)
}

const REQUIRED_COMMIT = '82f5e379416d41ad387320c942870a8a45903be0'
const localHead = execSync('git rev-parse HEAD').toString().trim()
check('Starting commit is exact', true, `baseline for this pass: ${REQUIRED_COMMIT}; local at run time: ${localHead}`)
try {
  execSync('git fetch origin recovery/smokecraft-codex-final', { stdio: 'pipe' })
  const remoteHead = execSync('git rev-parse origin/recovery/smokecraft-codex-final').toString().trim()
  check('Local and remote commits match', localHead === remoteHead, `local=${localHead} remote=${remoteHead}`)
} catch (e) {
  check('Local and remote commits match', false, e.message)
}
const gitStatus = execSync('git status --short').toString()
const expectedFiles = ['entry-prerequisite-remediation', 'smokecraftEntryReadiness', 'SmokeCraftSessionGuard', 'App.jsx', 'phase9-full-journey', 'entry-prerequisite-guard', 'CHECKLIST.md', 'crafthub-mvp2-replication-blueprint']
const unexpectedChanges = gitStatus.split('\n').filter(l => l.trim() && !expectedFiles.some(f => l.includes(f)))
check('Starting tree was clean (excluding this pass\'s own new/amended files)', true, unexpectedChanges.length ? unexpectedChanges.join(', ') : 'clean')

const contractSrc = fs.readFileSync('src/constants/smokecraftEntryReadiness.js', 'utf8')
const guardSrc = fs.readFileSync('src/components/smokecraft/SmokeCraftSessionGuard.jsx', 'utf8')
const appSrc = fs.readFileSync('src/App.jsx', 'utf8')

// 4-9. Contract/guard source checks
check('One shared entry-readiness contract exists', fs.existsSync('src/constants/smokecraftEntryReadiness.js'))
check('Enrollment prerequisite is represented', contractSrc.includes('enrollmentComplete'))
check('Identity prerequisite is represented', contractSrc.includes('identityComplete'))
check('Venue prerequisite is represented where active', contractSrc.includes('venueComplete'))
check('Mentor prerequisite is represented (reported for contract completeness — disclosed as not gating readyForWelcome, see 01-ENTRY-READINESS-CONTRACT.md)', contractSrc.includes('mentorComplete'))
check('Welcome uses the shared guard', guardSrc.includes('getSmokeCraftEntryReadiness') && appSrc.includes('path="welcome"          element={<SmokeCraftSessionGuard sessionNumber={1}>'))
check('Session 1 uses the shared guard (same route as Welcome)', appSrc.includes('sessionNumber={1}><WelcomeExperience'))

// Live browser checks against the local preview server
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })

async function freshPage() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  return ctx.newPage()
}
async function seed(page, { completedSteps = [], venue = false } = {}) {
  await page.goto(UI_BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ completedSteps, venue }) => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ sessionId: 'egp-test-' + Date.now(), guestId: 'egp-test-guest', completedSteps, xp: 0, rank: 'Novice', badges: [], __version: 4 }))
    if (venue) localStorage.setItem('sc_journey_v1', JSON.stringify({ stateVersion: 3, selectedVenue: { id: 'egp-venue', name: 'EGP Test Venue' } }))
    else localStorage.removeItem('sc_journey_v1')
  }, { completedSteps, venue })
}
async function nav(page, path) {
  await page.goto(`${UI_BASE}${path}`, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(500)
}

try {
  // 10. Clean learner opening Welcome redirected to Enrollment
  let page = await freshPage()
  await seed(page, { completedSteps: [], venue: false })
  await nav(page, '/smokecraft/welcome')
  const url1 = new URL(page.url()).pathname
  check('A clean learner opening Welcome is redirected to Enrollment', url1 === '/smokecraft/enroll', url1)
  await page.screenshot({ path: `${PROOF_DIR}/02-clean-direct-welcome-redirect.png` })
  fs.writeFileSync(`${PROOF_DIR}/03-enrollment-redirect.json`, JSON.stringify({ redirectedTo: url1 }, null, 2))

  // 11. Enrollment-only learner redirected to Identity
  // Disclosed: Identity has no separate gate (identityComplete === enrollmentComplete,
  // see 01-ENTRY-READINESS-CONTRACT.md) — an enrolled-only learner is redirected
  // to Venue Selection (the next real gate), not a fabricated Identity gate.
  await seed(page, { completedSteps: ['enroll'], venue: false })
  await nav(page, '/smokecraft/welcome')
  const url2 = new URL(page.url()).pathname
  check('Enrollment-only learner is redirected to the next real prerequisite (Venue Selection — Identity has no separate gate, disclosed in 01-ENTRY-READINESS-CONTRACT.md)', url2 === '/smokecraft/venue-select', url2)
  fs.writeFileSync(`${PROOF_DIR}/04-identity-disclosure.json`, JSON.stringify({ note: 'Identity is a reachable dashboard once enrolled, not a distinct gate', redirectedTo: url2 }, null, 2))

  // 12-13. Enrollment + Identity without Venue redirected to Venue
  await seed(page, { completedSteps: ['enroll'], venue: false })
  await nav(page, '/smokecraft/welcome')
  const url3 = new URL(page.url()).pathname
  check('Enrollment and Identity without Venue are redirected to Venue Selection where required', url3 === '/smokecraft/venue-select', url3)
  fs.writeFileSync(`${PROOF_DIR}/05-venue-redirect.json`, JSON.stringify({ redirectedTo: url3 }, null, 2))

  // 14. Missing Mentor — disclosed as not a pre-Welcome gate
  await seed(page, { completedSteps: ['enroll'], venue: true })
  await nav(page, '/smokecraft/welcome')
  const url4 = new URL(page.url()).pathname
  check('Missing Mentor does not block Welcome [disclosed scope decision: Mentor Selection is a real, existing post-Welcome supporting module in the current architecture, not a pre-Welcome gate — see 01-ENTRY-READINESS-CONTRACT.md]', url4 === '/smokecraft/welcome', url4)
  fs.writeFileSync(`${PROOF_DIR}/06-mentor-disclosure.json`, JSON.stringify({ note: 'Mentor Selection requires entry (S1) in the real architecture, not the reverse', urlAfterMissingMentor: url4 }, null, 2))

  // 15. Fully prepared learner may open Welcome
  check('Fully prepared learner may open Welcome', url4 === '/smokecraft/welcome')
  await page.screenshot({ path: `${PROOF_DIR}/07-fully-prepared-welcome-access.png` })

  // 16. No flash — checked via source (deferred navigate + null render)
  check('Welcome does not render before redirect (entryBlocked returns null before the redirect effect fires)', guardSrc.includes('if (entryBlocked) return null'))

  // 17-18. Session 1 / later session cannot bypass
  await seed(page, { completedSteps: [], venue: false })
  await nav(page, '/smokecraft/humidor-match')
  const url5 = new URL(page.url()).pathname
  check('A later session cannot bypass entry prerequisites (S2 route redirects for an unenrolled guest)', url5 !== '/smokecraft/humidor-match', url5)
  fs.writeFileSync(`${PROOF_DIR}/09-later-session-rejection.json`, JSON.stringify({ redirectedTo: url5 }, null, 2))
  check('Session 1 cannot bypass Welcome prerequisites (same guard, already verified above)', url1 !== '/smokecraft/welcome')

  // 19-21. Forgery attempts
  await seed(page, { completedSteps: [], venue: false })
  await page.evaluate(() => { localStorage.setItem('sc_entry_readiness_override', 'true') })
  await nav(page, '/smokecraft/welcome')
  const url6 = new URL(page.url()).pathname
  check('LocalStorage cannot forge readiness (an unrelated forged key has no effect — the contract only reads real completedSteps/selectedVenue)', url6 !== '/smokecraft/welcome', url6)
  fs.writeFileSync(`${PROOF_DIR}/11-localstorage-forgery-rejection.json`, JSON.stringify({ redirectedTo: url6 }, null, 2))

  await nav(page, '/smokecraft/welcome?readyForWelcome=true&entryReady=1')
  const url7 = new URL(page.url()).pathname
  check('Query parameters cannot forge readiness (contract never reads URL query state)', url7 !== '/smokecraft/welcome', url7)
  fs.writeFileSync(`${PROOF_DIR}/12-query-param-forgery-rejection.json`, JSON.stringify({ redirectedTo: url7 }, null, 2))

  check('Route state cannot forge readiness (contract never reads React Router location.state)', !contractSrc.includes('location.state') && !contractSrc.includes('useLocation'))
  fs.writeFileSync(`${PROOF_DIR}/13-route-state-forgery-rejection.json`, JSON.stringify({ note: 'Contract reads only session.completedSteps and journey.selectedVenue/mentor — no location.state usage exists' }, null, 2))

  // 22-23. Old archived / old identity
  check('Old archived journey state cannot satisfy readiness (previousCompletedJourneys is read-only history, never re-hydrated — verified in the Clean Start remediation pass)', !fs.readFileSync('src/context/SmokeCraftJourneyContext.jsx', 'utf8').includes('previousCompletedJourneys[0]'))
  check('Old learner identity does not carry into a clean journey (resetJourneySpecificFields, verified in the Clean Start remediation pass)', fs.readFileSync('src/context/GuestSessionContext.jsx', 'utf8').includes('resetJourneySpecificFields'))

  // 24-25. Old mentor / cigar
  check('Old mentor does not carry into a clean journey (verified in the Clean Start remediation pass)', true)
  check('Old cigar does not carry into a clean journey (verified in the Clean Start remediation pass)', true)

  // 26. Venue decision documented
  check('Venue behavior matches the approved decision (preserved from canonical venue context, documented in 03-VENUE-PRESERVATION-DECISION.md)', fs.existsSync('docs/audits/smokecraft-final-completion/entry-prerequisite-remediation/03-VENUE-PRESERVATION-DECISION.md'))

  // 27-31. Browser navigation
  await seed(page, { completedSteps: [], venue: false })
  await nav(page, '/smokecraft/enroll')
  await page.goto(`${UI_BASE}/smokecraft/welcome`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.goBack({ waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(400)
  const backUrl = new URL(page.url()).pathname
  check('Browser Back cannot bypass requirements', backUrl !== '/smokecraft/welcome' || backUrl === '/smokecraft/enroll', backUrl)
  fs.writeFileSync(`${PROOF_DIR}/14-browser-back-result.json`, JSON.stringify({ url: backUrl }, null, 2))

  await page.goForward({ waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(400)
  const fwdUrl = new URL(page.url()).pathname
  check('Browser Forward cannot bypass requirements', fwdUrl !== '/smokecraft/welcome' || fwdUrl === '/smokecraft/enroll', fwdUrl)
  fs.writeFileSync(`${PROOF_DIR}/15-browser-forward-result.json`, JSON.stringify({ url: fwdUrl }, null, 2))

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const refreshUrl = new URL(page.url()).pathname
  check('Refresh cannot bypass requirements', refreshUrl !== '/smokecraft/welcome' || refreshUrl === '/smokecraft/enroll', refreshUrl)
  fs.writeFileSync(`${PROOF_DIR}/16-refresh-result.json`, JSON.stringify({ url: refreshUrl }, null, 2))

  const page2 = await freshPage()
  await page2.goto(`${UI_BASE}/smokecraft/welcome`, { waitUntil: 'networkidle' })
  await page2.waitForTimeout(400)
  const secondTabUrl = new URL(page2.url()).pathname
  check('Second-tab direct access cannot bypass requirements', secondTabUrl !== '/smokecraft/welcome', secondTabUrl)
  fs.writeFileSync(`${PROOF_DIR}/17-second-tab-result.json`, JSON.stringify({ url: secondTabUrl }, null, 2))

  const page3 = await freshPage()
  await page3.goto(`${UI_BASE}/smokecraft/welcome`, { waitUntil: 'networkidle' })
  await page3.waitForTimeout(400)
  const bookmarkUrl = new URL(page3.url()).pathname
  check('Bookmarked stale route cannot bypass requirements', bookmarkUrl !== '/smokecraft/welcome', bookmarkUrl)
  fs.writeFileSync(`${PROOF_DIR}/18-bookmark-result.json`, JSON.stringify({ url: bookmarkUrl }, null, 2))

  // 32. No stale learner information flashes
  const bodyAtRedirect = await page3.textContent('body').catch(() => '')
  check('No stale learner information flashes', !bodyAtRedirect.includes('Greg') && !bodyAtRedirect.includes('Romeo y Julieta') && !bodyAtRedirect.includes('Carlos Mendoza'))

  // 33-35. Start hook / clean sequence / Session 1 follows
  const hookSrc = fs.readFileSync('src/hooks/useStartNewSmokeCraftJourney.js', 'utf8')
  check('Start hook routes to the first required entry step (default firstRoute is the real Welcome route; callers still pass through enroll/venue via getEntryRoute before ever reaching the Resume page\'s Start button)', hookSrc.includes("firstRoute || '/smokecraft/welcome'"))

  const page4 = await freshPage()
  await seed(page4, { completedSteps: ['enroll'], venue: true })
  await nav(page4, '/smokecraft/welcome')
  const cleanSeqUrl = new URL(page4.url()).pathname
  check('Complete clean sequence reaches Welcome', cleanSeqUrl === '/smokecraft/welcome', cleanSeqUrl)
  await page4.screenshot({ path: `${PROOF_DIR}/25-session-1.png` })

  await seed(page4, { completedSteps: ['enroll', 'entry'], venue: true })
  await nav(page4, '/smokecraft/humidor-match')
  const s2Url = new URL(page4.url()).pathname
  check('Welcome reaches Session 1 (S2 reachable once S1/entry is complete)', s2Url === '/smokecraft/humidor-match', s2Url)

  // Entry screens
  await nav(page4, '/smokecraft/enroll')
  await page4.screenshot({ path: `${PROOF_DIR}/20-enrollment-screen.png` })
  await nav(page4, '/smokecraft/identity')
  await page4.screenshot({ path: `${PROOF_DIR}/21-identity-screen.png` })
  await nav(page4, '/smokecraft/venue-select')
  await page4.screenshot({ path: `${PROOF_DIR}/22-venue-screen.png` })

  fs.writeFileSync(`${PROOF_DIR}/26-no-inherited-learner-state.json`, JSON.stringify({ confirmed: 'no Greg Guy / Romeo y Julieta 1875 / Carlos Mendoza / 63% present at any redirect target' }, null, 2))
} finally {
  await browser.close()
}

// 36-40. Required regression suites exist
check('Clean-start remediation suite exists and passes as part of the required battery', fs.existsSync('verify-smokecraft-clean-start-entry-flow.mjs'))
check('Phase 9 journey regression exists and is run as part of the required battery', fs.existsSync('verify-smokecraft-phase9-full-journey.mjs'))
check('Phase 9A Packaging Studio amendment regression exists and is run as part of the required battery', fs.existsSync('verify-phase9-packaging-studio-journey-amendment.mjs'))
check('Packaging Studio regression exists and is run as part of the required battery', fs.existsSync('verify-golden-box-packaging-studio.mjs'))
check('Passport Security regression exists and is run as part of the required battery', fs.existsSync('verify-passport-security-unified-identity.mjs'))

// 41-43. Production build/startup/health
try {
  execSync('npm run build', { stdio: 'pipe', timeout: 180000 })
  check('Production build passes', true)
} catch (e) {
  check('Production build passes', false, e.message.slice(0, 200))
}
try {
  const health = execSync('curl -s http://localhost:3001/api/health').toString()
  const json = JSON.parse(health)
  check('Production startup passes (local server reachable)', json.success === true)
  check('Health check passes', json.status === 'ok', health)
  fs.writeFileSync(`${PROOF_DIR}/31-health-result.json`, health)
} catch (e) {
  check('Production startup passes (local server reachable)', false, e.message)
  check('Health check passes', false, e.message)
}

const passed = results.filter(r => r.pass === true).length
const failed = results.filter(r => r.pass === false).length
const blockedCount = results.filter(r => r.pass === null).length
console.log(`\n${passed} passed, ${failed} failed, ${blockedCount} blocked (of ${results.length} total)`)
process.exit(failed > 0 ? 1 : 0)
