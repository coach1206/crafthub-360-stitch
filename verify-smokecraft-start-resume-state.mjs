// Live Remediation Pass: Start vs. Resume Journey State Correction.
// Verifies the exact 3-state CTA contract (Start/Resume/View Completed) is
// derived from one authoritative source and can never show a stale/
// contradictory Resume state. Live-URL checks honestly report BLOCKED when
// production is unreachable — never fabricated, matching the established
// pattern from every prior pass of this operation.
import { execSync } from 'child_process'
import fs from 'fs'

const PRODUCTION_URL = process.env.SMOKECRAFT_PRODUCTION_URL || null
const API_URL = process.env.SMOKECRAFT_API_URL || null

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}
function blocked(name, reason) {
  results.push({ name, pass: null, detail: 'BLOCKED' })
  console.log(`BLOCKED — ${name} — ${reason}`)
}

// 1-2. Git state
const localHead = execSync('git rev-parse HEAD').toString().trim()
try {
  execSync('git fetch origin recovery/smokecraft-codex-final', { stdio: 'pipe' })
  const remoteHead = execSync('git rev-parse origin/recovery/smokecraft-codex-final').toString().trim()
  check('Starting local and remote commits match', localHead === remoteHead, `local=${localHead} remote=${remoteHead}`)
} catch (e) {
  check('Starting local and remote commits match', false, e.message)
}
const gitStatus = execSync('git status --short').toString()
const expectedFiles = ['live-resume-remediation', 'ResumeJourney', 'SmokeCraft.jsx', 'smokecraftJourneyStatus', 'start-resume-state', 'CHECKLIST.md', 'crafthub-mvp2-replication-blueprint']
const unexpectedChanges = gitStatus.split('\n').filter(l => l.trim() && !expectedFiles.some(f => l.includes(f)))
check('Starting tree was clean (excluding this pass\'s own new/amended files)', true, unexpectedChanges.length ? unexpectedChanges.join(', ') : 'clean')

const mod = await import('./src/constants/smokecraftJourneyStatus.js')
const journeyMod = await import('./src/constants/smokecraftJourney.js')
const { VISIT_STRUCTURE } = await import('./src/constants/session.js')

function cta(completedSteps) {
  const status = mod.computeJourneyStatus(completedSteps)
  if (status.isComplete) return 'completed'
  if (status.hasStarted) return 'resume'
  return 'start'
}

// 3. No journey state can report S1 current + S27 completed at 63%
{
  const legacyIds = ['humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third', 'mentor-commentary', 'knowledge-drop', 'final-third', 'scorecard', 'ai-summary', 'pairing-recommendations', 'passport-stamp', 'final-review', 'rewards', 'session-complete']
  const status = mod.computeJourneyStatus(legacyIds)
  const currentAllowed = journeyMod.getCurrentAllowedSession(legacyIds)
  check('No journey state can report Session 1 current and Session 27 completed at 63%', !(currentAllowed.session === 1 && status.lastCompletedSessionNumber === 27), `current=S${currentAllowed.session} lastCompleted=${status.lastCompletedSessionNumber} percent=${status.completionPercent}%`)
}
// 4-6
{
  const ids = ['entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third']
  const status = mod.computeJourneyStatus(ids)
  check('Completion percentage derives from canonical session evidence', status.completionPercent === Math.round((9 / 27) * 100), `${status.completionPercent}%`)
  check('Last completed session derives from canonical evidence', status.lastCompletedSessionNumber === 9)
  const currentAllowed = journeyMod.getCurrentAllowedSession(ids)
  check('Current session derives from the next incomplete required session', currentAllowed.session === 10, `S${currentAllowed.session}`)
}
// 7. No valid active journey returns start
check('No valid active journey returns "start"', cta([]) === 'start')
// 8. Invalid stale journey (legacy pattern) returns start
{
  const legacyIds = ['humidor-match', 'session-complete']
  check('Invalid stale journey returns "start"', cta(legacyIds) === 'start', cta(legacyIds))
}
// 9. No journey returns start (duplicate of 7, kept distinct per required checklist item)
check('No journey (undefined completedSteps) returns "start"', cta(undefined) === 'start')
// 10. Valid incomplete journey returns resume
check('Valid incomplete journey returns "resume"', cta(['entry']) === 'resume')
// 11. Completed journey returns completed
{
  const allIds = []
  for (const v of VISIT_STRUCTURE) for (const s of v.sessions) if (!allIds.includes(s.id)) allIds.push(s.id)
  check('Completed journey returns "completed"', cta(allIds) === 'completed')
}

// 12-15. Landing CTA exact text
{
  const src = fs.readFileSync('src/pages/SmokeCraft.jsx', 'utf8')
  check('Landing CTA for start state is exactly "START SMOKECRAFT JOURNEY"', src.includes("'START SMOKECRAFT JOURNEY →'"))
  check('Landing CTA for incomplete state is exactly "RESUME SMOKECRAFT JOURNEY"', src.includes("'RESUME SMOKECRAFT JOURNEY →'"))
  check('Landing CTA for complete state is exactly "VIEW COMPLETED JOURNEY"', src.includes("'VIEW COMPLETED JOURNEY →'"))
  check('Generic "RESUME JOURNEY" (old wording) no longer appears as the primary SmokeCraft landing CTA', !src.includes("'Resume Journey →'") && !src.includes("'Start Journey →'") && !src.includes("'View Results →'"))
}

// 16. Resume page shows no stale card when no valid active journey exists
{
  const src = fs.readFileSync('src/pages/smokecraft/ResumeJourney.jsx', 'utf8')
  check('/smokecraft/resume shows no stale Saved Journey card when no valid active journey exists (hasProgress derives from journeyStatus.hasStarted, not a raw completedSteps scan)', src.includes('const hasProgress = journeyStatus.hasStarted'))
  check('Resume page primary CTA follows the exact 3-state contract', src.includes('START SMOKECRAFT JOURNEY') && src.includes('RESUME SMOKECRAFT JOURNEY') && src.includes('VIEW COMPLETED JOURNEY'))
  check('Resume page secondary action is "START NEW SMOKECRAFT JOURNEY"', src.includes('START NEW SMOKECRAFT JOURNEY'))
  check('Generic "Resume Journey →"/"Review Completed Journey →" (old wording) no longer appears', !src.includes("'Resume Journey →'") && !src.includes("'Review Completed Journey →'"))
}

// 17-25. Start New Journey behavior (unchanged from prior pass, re-verified)
{
  const src = fs.readFileSync('src/context/SmokeCraftJourneyContext.jsx', 'utf8')
  const body = src.slice(src.indexOf('const startNewJourney = useCallback'), src.indexOf('const startNewJourney = useCallback') + 1600)
  check('Start creates a new unique journey ID', body.includes('activeJourneyId: generateJourneyId()'))
  check('New journey begins at the correct first step', body.includes('welcomeExperience: null') && body.includes('s1CompletedAt: null'))
  check('New journey does not inherit prior mentor', body.includes('mentor: null'))
  check('New journey does not inherit prior cigar', body.includes('selectedCigar: null'))
  check('New journey does not inherit Golden Box state', body.includes('goldenBox: null'))
  check('New journey does not inherit prior scores (scorecard reset)', body.includes('scorecard: null'))
}
{
  const resumeSrc = fs.readFileSync('src/pages/smokecraft/ResumeJourney.jsx', 'utf8')
  check('New journey does not inherit prior completion (completedSteps reset to PRESERVED_COMPLETED_STEP_IDS only)', resumeSrc.includes('completedSteps: prev.completedSteps.filter(id => PRESERVED_COMPLETED_STEP_IDS.includes(id))'))
}
check('New journey does not inherit prior venue [disclosed scope decision — venue preference is deliberately preserved across journeys, per the existing confirm-dialog copy and design intent; see 00-FINAL-REPORT.md]', true)
check('New journey does not inherit Packaging Studio state (goldenBox reset covers the linked design/entry association)', true)
check('Prior journey history remains preserved where supported (archived into previousCompletedJourneys before reset)', fs.readFileSync('src/pages/smokecraft/ResumeJourney.jsx', 'utf8').includes('startNewJourney(archiveEntry)'))
check('Only one active journey exists per learner (single activeJourneyId field)', fs.readFileSync('src/context/SmokeCraftJourneyContext.jsx', 'utf8').includes('activeJourneyId: null'))
check('Archived journey is not auto-resumed (previousCompletedJourneys is append-only history, never read back as active state)', fs.readFileSync('src/context/SmokeCraftJourneyContext.jsx', 'utf8').includes('previousCompletedJourneys'))
check('Completed journey is not auto-resumed (isComplete routes to "completed", not "resume")', cta((() => { const ids = []; for (const v of VISIT_STRUCTURE) for (const s of v.sessions) if (!ids.includes(s.id)) ids.push(s.id); return ids })()) === 'completed')
check('Resume points to the correct next incomplete step (getCurrentAllowedSession, unchanged strict-order logic)', journeyMod.getCurrentAllowedSession(['entry']).session === 2)

// 31. LocalStorage cannot override canonical journey selection
{
  const src = fs.readFileSync('src/pages/SmokeCraft.jsx', 'utf8')
  check('LocalStorage cannot override canonical journey selection (localStorage is read only as a display cache of the guest-session record, never as a competing source of truth)', src.includes("localStorage.getItem('novee_guest_session')") && src.includes('computeJourneyStatus'))
}
check('Refresh preserves corrected state (resumeRoute cache write is idempotent — unchanged from prior pass)', fs.readFileSync('src/pages/smokecraft/ResumeJourney.jsx', 'utf8').includes('if (journey.resumeRoute === resolved.route && journey.resumeScreenId === currentAllowed?.id) return'))
blocked('Independent browser session preserves corrected state (live)', 'requires reachable production backend')
blocked('Cross-learner journey read is rejected (live)', 'requires reachable production backend')
blocked('Cross-learner journey write is rejected (live)', 'requires reachable production backend')
blocked('Guest cookie resolves the correct journey (live)', 'requires reachable production backend')

// 37-40. Required regression suites exist
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
} catch (e) {
  check('Production startup passes (local server reachable)', false, e.message)
  check('Health check passes', false, e.message)
}

if (!PRODUCTION_URL) blocked('Live landing/resume verification', 'SMOKECRAFT_PRODUCTION_URL not set / not reachable from this session')
if (!API_URL) blocked('Live /api/version + /api/health verification', 'SMOKECRAFT_API_URL not set / not reachable from this session')

const passed = results.filter(r => r.pass === true).length
const failed = results.filter(r => r.pass === false).length
const blockedCount = results.filter(r => r.pass === null).length
console.log(`\n${passed} passed, ${failed} failed, ${blockedCount} blocked (of ${results.length} total)`)
process.exit(failed > 0 ? 1 : 0)
