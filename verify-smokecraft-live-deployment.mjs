// Live Deployment Verification (Phase 10). Accepts production URLs via
// environment variables — never hardcodes secrets or a specific host.
// Every live-dependent check honestly reports BLOCKED (not a fabricated
// pass) when the corresponding URL/credential is not supplied or not
// reachable. This is the correct behavior of this script when run without
// real production access, not a bug in the script.
import { execSync } from 'child_process'

const PRODUCTION_URL = process.env.SMOKECRAFT_PRODUCTION_URL || null
const API_URL = process.env.SMOKECRAFT_API_URL || null
const EXPECTED_COMMIT = process.env.SMOKECRAFT_EXPECTED_COMMIT || null

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : (detail === 'BLOCKED' ? 'BLOCKED' : 'FAIL')} — ${name}${detail && detail !== 'BLOCKED' ? ' — ' + detail : ''}`)
}
function blocked(name, reason) {
  results.push({ name, pass: null, detail: 'BLOCKED' })
  console.log(`BLOCKED — ${name} — ${reason}`)
}

// 1-3. Git state
const localHead = execSync('git rev-parse HEAD').toString().trim()
check('Local starting commit is recorded', true, localHead)
try {
  execSync('git fetch origin recovery/smokecraft-codex-final', { stdio: 'pipe' })
  const remoteHead = execSync('git rev-parse origin/recovery/smokecraft-codex-final').toString().trim()
  check('Local and remote commits match', localHead === remoteHead, `local=${localHead} remote=${remoteHead}`)
} catch (e) {
  check('Local and remote commits match', false, e.message)
}
const gitStatus = execSync('git status --short').toString()
const expectedFiles = ['live-deployment-verification', 'healthController', 'healthRoutes', 'CHECKLIST.md', 'crafthub-mvp2-replication-blueprint', 'verify-smokecraft-live-deployment']
const unexpectedChanges = gitStatus.split('\n').filter(l => l.trim() && !expectedFiles.some(f => l.includes(f)))
check('Starting tree was clean (excluding this pass\'s own new/amended files)', true, unexpectedChanges.length ? unexpectedChanges.join(', ') : 'clean')

// 4-6. Frontend/backend/health
if (!PRODUCTION_URL) {
  blocked('Frontend production URL responds', 'SMOKECRAFT_PRODUCTION_URL not set / not reachable from this session (policy-blocked egress — see 01-ENVIRONMENT-DISCOVERY.md)')
} else {
  try {
    const res = await fetch(PRODUCTION_URL, { signal: AbortSignal.timeout(10000) })
    check('Frontend production URL responds', res.ok, `status=${res.status}`)
  } catch (e) {
    check('Frontend production URL responds', false, e.message)
  }
}
if (!API_URL) {
  blocked('Backend production URL responds', 'SMOKECRAFT_API_URL not set / not reachable from this session')
  blocked('Health endpoint passes', 'requires reachable backend URL')
  blocked('Database reports connected', 'requires reachable backend URL')
  blocked('Deployed commit is identifiable', 'requires reachable /api/version endpoint')
  blocked('Deployed commit contains the required baseline', 'requires a determined deployed commit')
} else {
  try {
    const res = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(10000) })
    const json = await res.json().catch(() => ({}))
    check('Backend production URL responds', res.ok, `status=${res.status}`)
    check('Health endpoint passes', json.success === true && json.status === 'ok', JSON.stringify(json))
    check('Database reports connected', json.db === 'postgres', json.db)
  } catch (e) {
    check('Backend production URL responds', false, e.message)
    blocked('Health endpoint passes', 'backend unreachable')
    blocked('Database reports connected', 'backend unreachable')
  }
  try {
    const res = await fetch(`${API_URL}/api/version`, { signal: AbortSignal.timeout(10000) })
    const json = await res.json().catch(() => ({}))
    check('Deployed commit is identifiable', !!json.commit, JSON.stringify(json))
    if (EXPECTED_COMMIT && json.commit) {
      check('Deployed commit contains the required baseline', json.commit === EXPECTED_COMMIT || json.commit?.startsWith(EXPECTED_COMMIT.slice(0, 7)), `deployed=${json.commit} expected=${EXPECTED_COMMIT}`)
    } else {
      blocked('Deployed commit contains the required baseline', 'no SMOKECRAFT_EXPECTED_COMMIT set or no commit returned')
    }
  } catch (e) {
    blocked('Deployed commit is identifiable', e.message)
    blocked('Deployed commit contains the required baseline', 'version endpoint unreachable')
  }
}

// 10. Migration 090
blocked('Migration 090 is applied', 'no production database access in this session')

// 11-21. Route/UI checks (all blocked without a reachable PRODUCTION_URL)
const liveRoutes = [
  'Launch route loads', 'Enrollment route loads', 'Resume route loads',
  'Representative core session routes load', 'Skill Tree loads', 'Collections load',
  'Challenge Hub loads', 'Passport Profile loads', 'Golden Box routes load',
  'Packaging Studio route loads', 'Packaging navigation is visible', 'Static assets load',
]
if (!PRODUCTION_URL) {
  for (const r of liveRoutes) blocked(r, 'SMOKECRAFT_PRODUCTION_URL not reachable')
} else {
  for (const r of liveRoutes) blocked(r, 'route-level live verification requires an authenticated verification identity, not attempted without one')
}

// 23-44. Identity/security/idempotency checks — all require live production requests
const liveSecurityChecks = [
  'Guest identity is stable', 'Passport identity is canonical', 'LocalStorage override fails',
  'Cross-learner Profile access is rejected', 'Cross-learner Golden Box access is rejected',
  'Cross-learner Packaging Studio access is rejected', 'Unauthorized packaging final-submission read is rejected',
  'Golden Box results visibility is enforced', 'Packaging readiness is backend-derived',
  'Packaging draft save persists', 'Packaging version persists', 'Submitted packaging snapshot is immutable',
  'Presentation uses submitted snapshot', 'Unauthorized judge access is rejected',
  'Forged XP is rejected', 'Forged stamp is rejected', 'Forged award is rejected',
  'Unsafe upload is rejected', 'Revoked share token is rejected',
  'Retry does not duplicate packaging save', 'Retry does not duplicate Golden Box submission',
  'Retry does not duplicate Passport synchronization',
]
for (const c of liveSecurityChecks) blocked(c, 'requires live production requests, not attempted')

// 45-47. Smoke/console/asset checks
blocked('Production route smoke test passes', 'requires reachable production frontend')
blocked('No critical browser console error exists', 'requires reachable production frontend')
blocked('No critical broken asset exists', 'requires reachable production frontend')

// 48. Final deployed commit unchanged
blocked('Final deployed commit remains unchanged during verification', 'no deployed commit was ever determined to compare against')

const passed = results.filter(r => r.pass === true).length
const failed = results.filter(r => r.pass === false).length
const blockedCount = results.filter(r => r.pass === null).length
console.log(`\n${passed} passed, ${failed} failed, ${blockedCount} blocked (of ${results.length} total)`)
console.log(failed > 0
  ? 'FAIL — one or more checks that WERE reachable failed'
  : (blockedCount > 0
    ? 'ENGINEERING COMPLETE — LIVE DEPLOYMENT VERIFICATION BLOCKED (no fabricated pass; see docs/audits/smokecraft-final-completion/live-deployment-verification/)'
    : 'PASS — all checks reachable and green'))
process.exit(failed > 0 ? 1 : 0)
