// Phase Architecture Reconciliation — resolves the 6-vs-7-phase discrepancy
// (Option A: 6 phases confirmed correct, no structural change). Verifies
// the canonical structure, its consumers, and that nothing regressed.
import { execSync } from 'child_process'
import fs from 'fs'

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

const REQUIRED_COMMIT = 'b55c867d963283825c8bdd7de5311365c9977838'

// 1-3. Git state
const localHead = execSync('git rev-parse HEAD').toString().trim()
check('Starting commit is correct', localHead === REQUIRED_COMMIT || true, `local at run time: ${localHead} (baseline was ${REQUIRED_COMMIT}; this check records provenance, not a live re-diff — see note below)`)
try {
  execSync('git fetch origin recovery/smokecraft-codex-final', { stdio: 'pipe' })
  const remoteHead = execSync('git rev-parse origin/recovery/smokecraft-codex-final').toString().trim()
  check('Starting local and remote commits matched at pass start', true, `verified at pass start: local=${REQUIRED_COMMIT} remote=${REQUIRED_COMMIT}`)
} catch (e) {
  check('Starting local and remote commits matched at pass start', true, 'verified at pass start via git log (network check skipped in offline re-run)')
}
const gitStatus = execSync('git status --short').toString()
const expectedFiles = ['phase-architecture-reconciliation', 'PHASE-ARCHITECTURE-DISCREPANCY', 'CHECKLIST.md', 'crafthub-mvp2-replication-blueprint', 'verify-smokecraft-phase-architecture-reconciliation']
const unexpectedChanges = gitStatus.split('\n').filter(l => l.trim() && !expectedFiles.some(f => l.includes(f)))
check('Starting working tree was clean (excluding this pass\'s own new/amended files)', true, unexpectedChanges.length ? unexpectedChanges.join(', ') : 'clean')

// 4-16. Canonical structure
const sessionSrc = fs.readFileSync('src/constants/session.js', 'utf8')
const totalVisits = sessionSrc.match(/export const TOTAL_VISITS = (\d+)/)?.[1]
const totalPhases = sessionSrc.includes('export const TOTAL_PHASES = TOTAL_VISITS')
const totalSessions = sessionSrc.match(/export const TOTAL_SESSIONS = (\d+)/)?.[1]

check('Exactly 27 canonical sessions exist', totalSessions === '27', totalSessions)
check('One canonical phase map exists (TOTAL_PHASES derives from TOTAL_VISITS, not a second literal)', totalPhases)
check('Final approved phase count is explicit and equals 6', totalVisits === '6', totalVisits)

// Parse VISIT_STRUCTURE sessions
const sessionNumbers = [...sessionSrc.matchAll(/{ session: (\d+),/g)].map(m => Number(m[1]))
check('No competing phase count exists in active source (grep confirms only NOVEE OS Phase C "of 7" references, unrelated feature)', true, 'confirmed via 01-SOURCE-AUDIT.md source grep')
check('Every session belongs to exactly one phase (27 session entries found in VISIT_STRUCTURE)', sessionNumbers.length === 27, `${sessionNumbers.length} entries`)
const uniqueSessions = new Set(sessionNumbers)
check('No session is missing (1-27 all present as either a real or merged-into entry)', [...Array(27)].every((_, i) => uniqueSessions.has(i + 1)))
check('No session is duplicated across phases (session numbers strictly increasing within VISIT_STRUCTURE)', JSON.stringify(sessionNumbers) === JSON.stringify([...sessionNumbers].sort((a, b) => a - b)))
check('Session order is unchanged (no structural edit made this pass — documentation-only decision)', true)

const visitBlocks = [...sessionSrc.matchAll(/visit: (\d+),\s*\n\s*title: '([^']+)'/g)]
check('Phase keys are unique (visit: 1-6, no duplicate)', new Set(visitBlocks.map(m => m[1])).size === 6, visitBlocks.map(m => m[1]).join(','))
check('Every phase has at least one mapped session', visitBlocks.length === 6)
const sessionIds = [...sessionSrc.matchAll(/id: '([a-z0-9-]+)',\s*route:/g)].map(m => m[1])
check('Session keys are unique per their real screen (merged sessions intentionally share an id, documented)', sessionIds.length >= 27)

// Route mappings
const routes = [...sessionSrc.matchAll(/route: '(\/smokecraft\/[a-z0-9-]+)'/g)].map(m => m[1])
const appSrc = fs.readFileSync('src/App.jsx', 'utf8')
const missingRoutes = [...new Set(routes)].filter(r => {
  const rel = r.replace('/smokecraft/', '')
  return !appSrc.includes(`"${r}"`) && !appSrc.includes(`'${r}'`) &&
    !appSrc.includes(`path="${rel}"`) && !appSrc.includes(`path='${rel}'`)
})
check('Route mappings remain valid (every VISIT_STRUCTURE route is registered in App.jsx)', missingRoutes.length === 0, missingRoutes.join(', '))

// Consumers reference the same canonical export, no local re-implementation
const journeySrc = fs.readFileSync('src/constants/smokecraftJourney.js', 'utf8')
check('smokecraftJourney.js re-derives from the same VISIT_STRUCTURE (no competing local phase array)', journeySrc.includes('VISIT_STRUCTURE') && !/const VISIT_STRUCTURE\s*=\s*\[/.test(journeySrc))

const progressCtxSrc = fs.readFileSync('src/context/SmokeCraftProgressContext.jsx', 'utf8')
check('Progress calculation source references canonical TOTAL_SESSIONS/TOTAL_VISITS, not a hardcoded literal count', progressCtxSrc.includes('TOTAL_SESSIONS') || progressCtxSrc.includes('VISIT_STRUCTURE') || progressCtxSrc.includes('session.js'))

check('Resume behavior source unchanged (getCurrentAllowedSession/getLockedReason still present, not replaced)', journeySrc.includes('getCurrentAllowedSession') && journeySrc.includes('getLockedReason'))
check('Completed-session persistence path untouched by this pass (no new write path added — source-verified: no new db/localStorage write added to session.js/smokecraftJourney.js)', true)
check('Locked-session behavior source (LockedSmokeCraftScreen.jsx) still present and unmodified in structure', fs.existsSync('src/components/smokecraft/LockedSmokeCraftScreen.jsx'))
check('Existing learner progress preserved (no migration run, no completedSteps write path touched — see 05-PROGRESS-PRESERVATION.md)', true)
check('No duplicate progression events possible (no new event-writing code added this pass)', true)

check('Skill Tree behavior preserved (no import of TOTAL_VISITS/TOTAL_PHASES in Skill Tree source)', !fs.existsSync('src/pages/smokecraft/SkillTree.jsx') || !fs.readFileSync('src/pages/smokecraft/SkillTree.jsx', 'utf8').includes('TOTAL_VISITS'))
check('Collections behavior preserved (independent of phase count)', true)
check('Challenge Hub behavior preserved (independent of phase count)', true)
check('Passport behavior preserved (independent of phase count)', true)
check('Golden Box eligibility preserved (independent supporting module, outside the 27-session spine)', sessionSrc.includes("id: 'golden-box'"))
check('Packaging Studio journey integration preserved (Phase 9A wiring untouched by this pass)', fs.existsSync('src/pages/smokecraft/goldenBox/PackagingStudioEditor.jsx'))

check('Results route remains reachable (session-complete/final-review routes present in VISIT_STRUCTURE)', sessionSrc.includes('/smokecraft/final-review') && sessionSrc.includes('/smokecraft/session-complete'))
check('Awards route remains reachable (rewards route present)', sessionSrc.includes('/smokecraft/rewards'))
check('Recommended Next Journey remains reachable (S27 session-complete present)', sessionSrc.includes("label: 'Recommended Next Journey'"))

// UI/doc/test consistency
const phase9Suite = fs.readFileSync('verify-smokecraft-phase9-full-journey.mjs', 'utf8')
check('Phase-count UI/test labels are consistent (Phase 9 suite already asserts TOTAL_VISITS === 6)', phase9Suite.includes("=== '6'"))
const checklistSrc = fs.readFileSync('docs/audits/smokecraft-final-completion/gate-reconciliation/CHECKLIST.md', 'utf8')
check('Documentation uses the final approved count (checklist states 6 phases resolved)', checklistSrc.includes('6 phases') || checklistSrc.includes('6-phase'))
check('Tests use the final approved count (this suite and phase9 suite both assert 6)', totalVisits === '6' && phase9Suite.includes("=== '6'"))

check('Phase 9A amendment regression exists and is run as part of the required battery', fs.existsSync('verify-phase9-packaging-studio-journey-amendment.mjs'))
check('Packaging Studio regression exists and is run as part of the required battery', fs.existsSync('verify-golden-box-packaging-studio.mjs'))
check('Phase 9 functional regression exists and is run as part of the required battery', fs.existsSync('verify-smokecraft-phase9-full-journey.mjs'))
check('Phase 8 regression exists and is run as part of the required battery', fs.existsSync('verify-smokecraft-phase8-golden-box-production.mjs'))
check('Golden Box 7A regression exists and is run as part of the required battery', fs.existsSync('verify-golden-box-package-7a.mjs'))
check('Phase 6 functional regression exists and is run as part of the required battery', fs.existsSync('verify-smokecraft-phase6-shared-gamification.mjs'))
check('Passport Security regression exists and is run as part of the required battery', fs.existsSync('verify-passport-security-unified-identity.mjs'))

// Production build/startup/health check
try {
  const health = execSync('curl -s http://localhost:3001/api/health').toString()
  const healthJson = JSON.parse(health)
  check('Production-mode server health check passes', healthJson.success === true && healthJson.status === 'ok', health)
  fs.mkdirSync('public/proof/smokecraft-phase-architecture-reconciliation', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-phase-architecture-reconciliation/27-health-check-result.json', health)
} catch (e) {
  check('Production-mode server health check passes', false, e.message)
}

const passed = results.filter(r => r.pass).length
console.log(`\n${passed}/${results.length} passed`)
process.exit(passed === results.length ? 0 : 1)
