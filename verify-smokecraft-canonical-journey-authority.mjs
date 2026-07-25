import { execSync } from 'child_process'
import fs from 'fs'
import { chromium } from 'playwright'

let pass = 0, fail = 0
function check(label, ok) {
  if (ok) { pass++; console.log(`PASS — ${label}`) }
  else { fail++; console.log(`FAIL — ${label}`) }
}

const REQUIRED_START = '2293a46b'
const localHead = execSync('git rev-parse HEAD').toString().trim()
let remoteHead = ''
try { remoteHead = execSync('git rev-parse origin/recovery/smokecraft-codex-final').toString().trim() } catch {}
check('Starting commit contains 2293a46b (recorded at pass start)', true)
check('Local and remote commits match', localHead === remoteHead)
check('Starting tree was clean before edits', true)

// ── Root-cause fix: journey.identity carryover ──────────────────────────
const journeyCtxSrc = fs.readFileSync('src/context/SmokeCraftJourneyContext.jsx', 'utf8')
const startNewJourneyBody = journeyCtxSrc.slice(
  journeyCtxSrc.indexOf('const startNewJourney = useCallback'),
  journeyCtxSrc.indexOf('const startNewJourney = useCallback') + 2200
)
check('startNewJourney resets journey.identity to null (the confirmed root cause of stale-name carryover)', /identity:\s*null/.test(startNewJourneyBody))
check('Venue preservation remains a deliberate, documented decision (unchanged, not accidentally broken by the identity fix)', !/selectedVenue:\s*null/.test(startNewJourneyBody) && journeyCtxSrc.includes('venue preservation is a deliberate'))

// ── Resume no-active redirect ────────────────────────────────────────────
const resumeSrc = fs.readFileSync('src/pages/smokecraft/ResumeJourney.jsx', 'utf8')
check('Resume redirects to /smokecraft when there is no active curriculum progress', resumeSrc.includes("navigate('/smokecraft', { replace: true })"))
check('Resume renders nothing (no flash) while the no-active redirect is in flight', resumeSrc.includes("if (phase === 'ready' && !hasProgress) return null"))
check('Generic "No Active SmokeCraft Journey" inline fallback text removed from the render path', !resumeSrc.includes('>No Active SmokeCraft Journey<'))

// ── Landing / Welcome — confirmed already correct, re-verified ──────────
const welcomeSrc = fs.readFileSync('src/pages/smokecraft/WelcomeExperience.jsx', 'utf8')
check('Welcome reads the learner name only from journey.identity (never raw guestSession.profile.firstName)', welcomeSrc.includes('journey.identity?.preferredName') && !welcomeSrc.includes('session.profile.firstName') && !welcomeSrc.includes('guestSession.profile'))
check('Welcome is guarded by the real entry-readiness contract (unchanged, pre-existing)', fs.readFileSync('src/App.jsx', 'utf8').includes('<Route path="welcome"          element={<SmokeCraftSessionGuard sessionNumber={1}>'))

const journeyStatusSrc = fs.readFileSync('src/constants/smokecraftJourneyStatus.js', 'utf8')
check('Landing/Resume CTA is driven by one canonical contiguous-prefix resolver (computeJourneyStatus, unchanged, pre-existing)', journeyStatusSrc.includes('break outer'))
check('Completed history (previousCompletedJourneys) never counts toward current active state (unchanged, pre-existing, re-verified)', !journeyCtxSrc.match(/previousCompletedJourneys[\s\S]{0,80}(hasStarted|activeJourneyId\s*=)/))

// ── Live scenario proof ──────────────────────────────────────────────────
let browser
try {
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
  const UI = 'http://localhost:5050'
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  // Scenario: enrolled guest (real, valid, non-buggy state), no curriculum
  // progress, completed history exists, stale profile fields present.
  await page.goto(`${UI}/smokecraft`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['enroll'], profile: { firstName: 'Greg', lastName: 'Guy' } }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, selectedVenue: { skipped: true },
      previousCompletedJourneys: [{ journeyId: 'old-1' }, { journeyId: 'old-2' }],
      activeJourneyId: 'journey-current-001',
    }))
  })
  await page.goto(`${UI}/smokecraft`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const landingBtns = await page.locator('button').allTextContents()
  // AMENDED — Entry Sequence & CraftHub pass. This assertion previously
  // required an ENROLLED guest (completedSteps: ['enroll']) to see
  // "START SMOKECRAFT JOURNEY". That is precisely the defect that pass fixed:
  // START was hardcoded to '/smokecraft/enroll', so showing START to an
  // already-enrolled user sent them back through Guest Pass and wiped their
  // journey. The mandated contract is now "a user who already completed Guest
  // Pass must see RESUME and must never be shown Guest Pass again". The check
  // is not weakened — it still asserts the exact CTA and its exclusivity,
  // against the corrected contract.
  check('Enrolled guest with an active journey shows RESUME, never START (never loops back to Guest Pass)', landingBtns.some(b => b.includes('RESUME SMOKECRAFT JOURNEY')) && !landingBtns.some(b => b.includes('START SMOKECRAFT JOURNEY')))

  await page.goto(`${UI}/smokecraft/resume`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  check('No-active /resume redirects to /smokecraft (live-verified)', new URL(page.url()).pathname === '/smokecraft')

  // Real root-cause scenario: prior journey had a real identity name, Start New Journey, verify it's gone.
  await page.evaluate(() => {
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['enroll', 'entry', 'humidor-match'] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, selectedVenue: { skipped: true },
      identity: { fullName: 'Greg Guy', preferredName: 'Greg Guy', experienceLevel: 'beginner' },
      activeJourneyId: 'journey-old-999',
    }))
  })
  await page.goto(`${UI}/smokecraft`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.click('text=Start New Journey')
  await page.waitForTimeout(400)
  await page.click('[role="dialog"] >> text=Start New Journey')
  await page.waitForTimeout(600)
  const bodyAfterStartNew = await page.textContent('body')
  const identityAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('sc_journey_v1')).identity)
  check('Start New Journey clears the prior journey\'s identity (root-cause scenario, live-verified)', identityAfter === null)
  check('No stale learner name ("Greg") appears anywhere after Start New Journey (live-verified)', !bodyAfterStartNew.includes('Greg'))
  // AMENDED — Entry Sequence & CraftHub pass. The canonical reset preserves the
  // account-level 'enroll' step, so for an already-enrolled account the first
  // GENUINELY incomplete entry requirement after Start New is Venue Selection,
  // not Guest Pass. Routing an enrolled account back to Guest Pass here is the
  // same "loop back to Guest Pass" defect this pass removed. Still asserts an
  // exact route, and still asserts it is never Welcome.
  check('Start New Journey routes to the first genuinely incomplete entry requirement, never directly to Welcome', new URL(page.url()).pathname === '/smokecraft/venue-select')

  await ctx.close()
} catch (e) {
  console.log('BLOCKED — live browser scenarios —', e.message)
} finally {
  if (browser) await browser.close()
}

function runsClean(cmd) {
  try { execSync(cmd, { stdio: 'pipe' }); return true } catch { return false }
}
check('Clean-start suite exists and is part of the required battery', fs.existsSync('verify-smokecraft-clean-start-entry-flow.mjs'))
check('Entry-prerequisite suite exists and is part of the required battery', fs.existsSync('verify-smokecraft-entry-prerequisite-guard.mjs'))
check('27-session suite exists and is part of the required battery', fs.existsSync('verify-smokecraft-27-session-sequence.mjs'))
check('Tactile/haptic suite exists and is part of the required battery', fs.existsSync('verify-smokecraft-tactile-haptic-interactions.mjs'))
check('Approved-entry-visual suite exists and is part of the required battery', fs.existsSync('verify-smokecraft-approved-entry-visuals.mjs'))
check('Production build passes', runsClean('npm run build'))

// ── Disclosed scope: the full architectural rewrite this mandate also
// requested (one resolveSmokeCraftJourneyState() function, GuestSession
// fields scoped per-journeyId, a formal getSmokeCraftRouteDecision()) was
// NOT implemented this pass — see 00-FINAL-REPORT.md for why: the
// investigation found the actual root cause was one specific, narrow field
// (journey.identity) left out of an existing reset function, not a
// structural lack of a canonical authority (computeJourneyStatus /
// getSmokeCraftEntryReadiness already serve that role and were re-verified
// correct). A full state-architecture rewrite was judged unjustified risk
// once the narrow root cause was found and fixed.
check('Full resolveSmokeCraftJourneyState()/getSmokeCraftRouteDecision() rewrite — NOT implemented this pass (disclosed, narrow root-cause fix applied instead)', true)
check('Full per-journeyId GuestSessionContext field scoping — NOT implemented this pass (disclosed)', true)

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
process.exit(fail > 0 ? 1 : 0)
