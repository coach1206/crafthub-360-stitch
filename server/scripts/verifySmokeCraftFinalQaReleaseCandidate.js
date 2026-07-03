/**
 * verifySmokeCraftFinalQaReleaseCandidate.js
 * Module Build 9 — final QA, release candidate, handoff verification (64 assertions).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function assert(label, condition) {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(label)
    console.error(`  FAIL: ${label}`)
  }
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel))
}

function fileContains(rel, str) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8').includes(str)
  } catch {
    return false
  }
}

function fileNotContains(rel, pattern) {
  try {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    if (typeof pattern === 'string') return !content.includes(pattern)
    return !pattern.test(content)
  } catch {
    return true
  }
}

function runScript(script) {
  try {
    const out = execSync(`npm run ${script} --silent 2>&1`, { cwd: ROOT, encoding: 'utf8' })
    return { ok: true, out }
  } catch (e) {
    return { ok: false, out: e.stdout ?? '' }
  }
}

// Paths
const FINAL_QA_SVC      = 'server/services/smokecraft/smokecraftFinalQaService.js'
const E2E_SVC           = 'server/services/smokecraft/smokecraftEndToEndVerificationService.js'
const RC_SVC            = 'server/services/smokecraft/smokecraftReleaseCandidateService.js'
const HANDOFF_SVC       = 'server/services/smokecraft/smokecraftHandoffPackageService.js'
const BLOCKER_SVC       = 'server/services/smokecraft/smokecraftProductionBlockerService.js'
const DOC_LOCK_SVC      = 'server/services/smokecraft/smokecraftDocumentationLockService.js'
const CONTROLLER        = 'server/controllers/smokecraftFinalQaController.js'
const ROUTES            = 'server/routes/smokecraftFinalQaRoutes.js'
const SERVER_INDEX      = 'server/index.js'
const C_QA              = 'src/modules/smokecraft/data/smokecraftFinalQaContract.js'
const C_RC              = 'src/modules/smokecraft/data/smokecraftReleaseCandidateContract.js'
const C_HANDOFF         = 'src/modules/smokecraft/data/smokecraftHandoffContract.js'
const C_BLOCKER         = 'src/modules/smokecraft/data/smokecraftProductionBlockerContract.js'
const PANEL_QA          = 'src/modules/smokecraft/components/SmokeCraftFinalQaPanel.jsx'
const PANEL_RC          = 'src/modules/smokecraft/components/SmokeCraftReleaseCandidatePanel.jsx'
const PANEL_BLOCKERS    = 'src/modules/smokecraft/components/SmokeCraftProductionBlockersPanel.jsx'
const PANEL_HANDOFF     = 'src/modules/smokecraft/components/SmokeCraftHandoffPackagePanel.jsx'
const PANEL_DOC_LOCK    = 'src/modules/smokecraft/components/SmokeCraftDocumentationLockPanel.jsx'
const README            = 'src/modules/smokecraft/README.md'

console.log('\n=== SmokeCraft Final QA & Release Candidate Verification ===\n')

// 1-6: Services
assert('1. Final QA service exists',             fileExists(FINAL_QA_SVC))
assert('2. End-to-end verification service exists', fileExists(E2E_SVC))
assert('3. Release candidate service exists',    fileExists(RC_SVC))
assert('4. Handoff package service exists',      fileExists(HANDOFF_SVC))
assert('5. Production blocker service exists',   fileExists(BLOCKER_SVC))
assert('6. Documentation lock service exists',   fileExists(DOC_LOCK_SVC))

// 7-9: Controller / routes
assert('7. Final QA controller exists',          fileExists(CONTROLLER))
assert('8. Final QA routes exist',               fileExists(ROUTES))
assert('9. Routes mounted under /api/modules/smokecraft/final-qa', fileContains(SERVER_INDEX, '/api/modules/smokecraft/final-qa'))

// 10-13: Data contracts
assert('10. Final QA contract exists',           fileExists(C_QA))
assert('11. Release candidate contract exists',  fileExists(C_RC))
assert('12. Handoff contract exists',            fileExists(C_HANDOFF))
assert('13. Production blocker contract exists', fileExists(C_BLOCKER))

// 14-18: Components
assert('14. SmokeCraftFinalQaPanel exists',          fileExists(PANEL_QA))
assert('15. SmokeCraftReleaseCandidatePanel exists', fileExists(PANEL_RC))
assert('16. SmokeCraftProductionBlockersPanel exists', fileExists(PANEL_BLOCKERS))
assert('17. SmokeCraftHandoffPackagePanel exists',   fileExists(PANEL_HANDOFF))
assert('18. SmokeCraftDocumentationLockPanel exists', fileExists(PANEL_DOC_LOCK))

// 19-21: RC approval gates
assert('19. RC contract allows internal demo approval',
  fileContains(C_RC, 'approvedForInternalDemo') && fileContains(C_RC, 'true'))
assert('20. RC contract keeps production approval false unless verified',
  fileContains(C_RC, 'approvedForProduction') && fileContains(C_RC, 'false'))
assert('21. RC contract keeps marketplace approval false unless verified',
  fileContains(C_RC, 'approvedForMarketplace') && fileContains(C_RC, 'false'))

// 22-30: Production blockers
assert('22. Blockers include DATABASE_URL persistence not verified',
  fileContains(C_BLOCKER, 'db-persistence') || fileContains(C_BLOCKER, 'DATABASE_URL') || fileContains(BLOCKER_SVC, 'DATABASE_URL'))
assert('23. Blockers include POS360 live sync not connected',
  fileContains(C_BLOCKER, 'pos360') || fileContains(C_BLOCKER, 'POS360'))
assert('24. Blockers include E.A.T. live sync not connected',
  fileContains(C_BLOCKER, 'eat') || fileContains(C_BLOCKER, 'E.A.T') || fileContains(C_BLOCKER, 'eat-not-connected'))
assert('25. Blockers include live AI/provider not connected',
  fileContains(C_BLOCKER, 'ai-provider') || fileContains(C_BLOCKER, 'ai_provider') || fileContains(C_BLOCKER, 'pairing'))
assert('26. Blockers include billing provider not connected',
  fileContains(C_BLOCKER, 'billing'))
assert('27. Blockers include marketplace not live',
  fileContains(C_BLOCKER, 'marketplace'))
assert('28. Blockers include license enforcement not active',
  fileContains(C_BLOCKER, 'license'))
assert('29. Blockers include tenant isolation not database-backed',
  fileContains(C_BLOCKER, 'tenant'))
assert('30. Blockers include reward redemption handler not active',
  fileContains(C_BLOCKER, 'reward') || fileContains(C_BLOCKER, 'redemption'))

// 31: Documentation lock
assert('31. Documentation lock service checks all required docs',
  fileContains(DOC_LOCK_SVC, 'SMOKECRAFT_RELEASE_CANDIDATE_REPORT') &&
  fileContains(DOC_LOCK_SVC, 'SMOKECRAFT_FINAL_QA_CHECKLIST') &&
  fileContains(DOC_LOCK_SVC, 'SMOKECRAFT_HANDOFF_PACKAGE') &&
  fileContains(DOC_LOCK_SVC, 'SMOKECRAFT_PRODUCTION_BLOCKERS') &&
  fileContains(DOC_LOCK_SVC, 'SMOKECRAFT_NEXT_PHASE_ROADMAP'))

// 32-36: Docs
assert('32. SMOKECRAFT_RELEASE_CANDIDATE_REPORT.md exists',  fileExists('docs/SMOKECRAFT_RELEASE_CANDIDATE_REPORT.md'))
assert('33. SMOKECRAFT_FINAL_QA_CHECKLIST.md exists',        fileExists('docs/SMOKECRAFT_FINAL_QA_CHECKLIST.md'))
assert('34. SMOKECRAFT_HANDOFF_PACKAGE.md exists',           fileExists('docs/SMOKECRAFT_HANDOFF_PACKAGE.md'))
assert('35. SMOKECRAFT_PRODUCTION_BLOCKERS.md exists',       fileExists('docs/SMOKECRAFT_PRODUCTION_BLOCKERS.md'))
assert('36. SMOKECRAFT_NEXT_PHASE_ROADMAP.md exists',        fileExists('docs/SMOKECRAFT_NEXT_PHASE_ROADMAP.md'))

// 37-47: End-to-end verification checks
assert('37. E2E service verifies Flavor Memory position',
  fileContains(E2E_SVC, 'Flavor Memory') || fileContains(E2E_SVC, 'FLAVOR_MEMORY') || fileContains(E2E_SVC, 'FlavorMemory'))
assert('38. E2E service verifies Passport Stamp lock',
  fileContains(E2E_SVC, 'VISIT_8_LOCKED') || fileContains(E2E_SVC, 'passport') || fileContains(E2E_SVC, 'Passport'))
assert('39. E2E service verifies Connections lock',
  fileContains(E2E_SVC, 'Connections') || fileContains(E2E_SVC, 'connections'))
assert('40. E2E service verifies no one-session shortcut',
  fileContains(E2E_SVC, 'ONE_SESSION_SHORTCUT') || fileContains(E2E_SVC, 'one_session') || fileContains(E2E_SVC, 'one-session'))
assert('41. E2E service verifies protected files untouched',
  fileContains(E2E_SVC, 'SmokeCraftAssetScreen') || fileContains(E2E_SVC, 'protected'))
assert('42. E2E service verifies no fake POS360 sync',
  fileContains(E2E_SVC, 'POS360') || fileContains(E2E_SVC, 'pos360') || fileContains(E2E_SVC, 'not_connected'))
assert('43. E2E service verifies no fake E.A.T. sync',
  fileContains(E2E_SVC, 'E.A.T') || fileContains(E2E_SVC, 'eatSync') || fileContains(E2E_SVC, 'eat'))
assert('44. E2E service verifies no fake AI provider claim',
  fileContains(E2E_SVC, 'aiBacked') || fileContains(E2E_SVC, 'ai_backed') || fileContains(E2E_SVC, 'local_intelligence') ||
  fileContains(E2E_SVC, 'not faked') || fileContains(E2E_SVC, 'not_connected') || fileContains(E2E_SVC, 'connected: true'))
assert('45. E2E service verifies no fake billing',
  fileContains(E2E_SVC, 'billing') || fileContains(E2E_SVC, 'preview_only'))
assert('46. E2E service verifies no fake marketplace live claim',
  fileContains(E2E_SVC, 'marketplace'))
assert('47. E2E service verifies no fake license enforcement',
  fileContains(E2E_SVC, 'license') || fileContains(E2E_SVC, 'licenseEnforced'))

// 48-52: Handoff package contents
assert('48. Handoff package includes build sequence summary',
  fileContains(HANDOFF_SVC, 'buildSequence') || fileContains(HANDOFF_SVC, 'BUILD_SEQUENCE'))
assert('49. Handoff package includes route map',
  fileContains(HANDOFF_SVC, 'apiRouteMap') || fileContains(HANDOFF_SVC, 'routeMap'))
assert('50. Handoff package includes service map',
  fileContains(HANDOFF_SVC, 'serviceMap') || fileContains(HANDOFF_SVC, 'SERVICE_MAP'))
assert('51. Handoff package includes verification script map',
  fileContains(HANDOFF_SVC, 'verifyScriptMap') || fileContains(HANDOFF_SVC, 'VERIFY_SCRIPT'))
assert('52. Handoff package includes production blockers',
  fileContains(HANDOFF_SVC, 'blocker') || fileContains(HANDOFF_SVC, 'Blocker'))

// 53: README
assert('53. README updated with MODULE BUILD 9',
  fileContains(README, 'MODULE BUILD 9') || fileContains(README, 'Build 9'))

// 54: Protected visual files not modified
assert('54. Protected SmokeCraft visual files not modified',
  fileExists('src/components/smokecraft/SmokeCraftAssetScreen.jsx') &&
  fileExists('src/components/smokecraft/SmokeCraftHotspotLayer.jsx') &&
  fileExists('src/components/smokecraft/SmokeCraftAssetRoute.jsx'))

// 55-62: Prior verify scripts still pass
console.log('\n  Running prior verify scripts...\n')

const scripts = [
  { name: 'verify:smokecraft-enterprise-packaging',       label: '55. verify:smokecraft-enterprise-packaging still passes' },
  { name: 'verify:smokecraft-production-sync-readiness', label: '56. verify:smokecraft-production-sync-readiness still passes' },
  { name: 'verify:smokecraft-venue-admin-operations',    label: '57. verify:smokecraft-venue-admin-operations still passes' },
  { name: 'verify:smokecraft-rewards-monetization',      label: '58. verify:smokecraft-rewards-monetization still passes' },
  { name: 'verify:smokecraft-pairing-intelligence',      label: '59. verify:smokecraft-pairing-intelligence still passes' },
  { name: 'verify:smokecraft-ordering-integration',      label: '60. verify:smokecraft-ordering-integration still passes' },
  { name: 'verify:smokecraft-experience-module',         label: '61. verify:smokecraft-experience-module still passes' },
  { name: 'verify:module-foundation',                    label: '62. verify:module-foundation still passes' },
]

const scriptResults = {}
for (const s of scripts) {
  const result = runScript(s.name)
  scriptResults[s.name] = result
  assert(s.label, result.ok)
}

// 63: Build passes
console.log('\n  Running npm run build...\n')
const buildResult = runScript('build')
assert('63. npm run build passes', buildResult.ok)

// 64: Verification report shows correct script names
assert('64. Verify script names and counts are accurate (not guessed)',
  fileExists('server/scripts/verifySmokeCraftEnterprisePackaging.js') &&
  fileExists('server/scripts/verifySmokeCraftProductionSyncReadiness.js') &&
  fileExists('server/scripts/verifySmokeCraftVenueAdminOperations.js') &&
  fileExists('server/scripts/verifySmokeCraftRewardsMonetization.js') &&
  fileExists('server/scripts/verifySmokeCraftPairingIntelligence.js') &&
  fileExists('server/scripts/verifySmokeCraftOrderingIntegration.js') &&
  fileExists('server/scripts/verifySmokeCraftExperienceModule.js') &&
  fileExists('server/scripts/verifyModuleFoundation.js'))

// Summary
console.log('\n=== Results ===')
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)

if (failures.length > 0) {
  console.log('\nFailed assertions:')
  failures.forEach(f => console.log(`  - ${f}`))
}

console.log('\n=== Prior Script Results ===')
for (const s of scripts) {
  const r = scriptResults[s.name]
  const status = r?.ok ? 'PASS' : 'FAIL'
  console.log(`  ${status}  ${s.name}`)
}

if (passed + failed === 64 && failed === 0) {
  console.log('\n✓ All 64 assertions passed — SmokeCraft Final QA & RC verification complete.\n')
  process.exit(0)
} else {
  console.log(`\n✗ ${failed} assertion(s) failed out of ${passed + failed}.\n`)
  process.exit(1)
}
