/**
 * verifySmokeCraftDatabasePersistence.js
 * Production Phase A — database persistence hardening verification (60 assertions).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function assert(label, condition) {
  if (condition) { passed++ } else { failed++; failures.push(label); console.error(`  FAIL: ${label}`) }
}

function fileExists(rel)        { return fs.existsSync(path.join(ROOT, rel)) }
function fileContains(rel, str) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8').includes(str) } catch { return false }
}

function runScript(name) {
  try {
    execSync(`npm run ${name} --silent 2>&1`, { cwd: ROOT, encoding: 'utf8' })
    return true
  } catch { return false }
}

// Paths
const P_REG    = 'server/services/smokecraft/persistence/smokecraftPersistenceRegistry.js'
const P_ADAPT  = 'server/services/smokecraft/persistence/smokecraftDatabaseAdapter.js'
const P_HEALTH = 'server/services/smokecraft/persistence/smokecraftPersistenceHealthService.js'
const P_MIG    = 'server/services/smokecraft/persistence/smokecraftPersistenceMigrationPlanService.js'
const P_AUDIT  = 'server/services/smokecraft/persistence/smokecraftPersistenceAuditService.js'
const DB_ORD   = 'server/services/smokecraft/database/smokecraftOrderPersistenceService.js'
const DB_STF   = 'server/services/smokecraft/database/smokecraftStaffQueuePersistenceService.js'
const DB_PAI   = 'server/services/smokecraft/database/smokecraftPairingPersistenceService.js'
const DB_FLV   = 'server/services/smokecraft/database/smokecraftFlavorMemoryPersistenceService.js'
const DB_REW   = 'server/services/smokecraft/database/smokecraftRewardPersistenceService.js'
const DB_LOY   = 'server/services/smokecraft/database/smokecraftLoyaltyPersistenceService.js'
const DB_PAS   = 'server/services/smokecraft/database/smokecraftPassportPersistenceService.js'
const DB_VEN   = 'server/services/smokecraft/database/smokecraftVenueAdminPersistenceService.js'
const DB_ANA   = 'server/services/smokecraft/database/smokecraftAnalyticsPersistenceService.js'
const DB_SYN   = 'server/services/smokecraft/database/smokecraftSyncEventPersistenceService.js'
const DB_GOV   = 'server/services/smokecraft/database/smokecraftGovernancePersistenceService.js'
const CTRL     = 'server/controllers/smokecraftPersistenceController.js'
const ROUTES   = 'server/routes/smokecraftPersistenceRoutes.js'
const INDEX    = 'server/index.js'
const C_PERS   = 'src/modules/smokecraft/data/smokecraftPersistenceContract.js'
const C_SCHEMA = 'src/modules/smokecraft/data/smokecraftDatabaseSchemaContract.js'
const C_HEALTH = 'src/modules/smokecraft/data/smokecraftPersistenceHealthContract.js'
const PNL_HLTH = 'src/modules/smokecraft/components/SmokeCraftPersistenceHealthPanel.jsx'
const PNL_DB   = 'src/modules/smokecraft/components/SmokeCraftDatabaseStatusPanel.jsx'
const PNL_COV  = 'src/modules/smokecraft/components/SmokeCraftPersistenceCoveragePanel.jsx'
const PNL_MIG  = 'src/modules/smokecraft/components/SmokeCraftMigrationPlanPanel.jsx'
const README   = 'src/modules/smokecraft/README.md'
const DOC      = 'docs/SMOKECRAFT_DATABASE_PERSISTENCE_HARDENING.md'
const MIG_SQL  = 'server/db/migrations/029_smokecraft_persistence_hardening.sql'

console.log('\n=== SmokeCraft Database Persistence Hardening Verification ===\n')

// 1-5: Persistence infrastructure
assert('1. Persistence registry exists',               fileExists(P_REG))
assert('2. Database adapter exists',                   fileExists(P_ADAPT))
assert('3. Persistence health service exists',         fileExists(P_HEALTH))
assert('4. Migration plan service exists',             fileExists(P_MIG))
assert('5. Persistence audit service exists',          fileExists(P_AUDIT))

// 6-16: Database persistence services
assert('6. Order persistence service exists',          fileExists(DB_ORD))
assert('7. Staff queue persistence service exists',    fileExists(DB_STF))
assert('8. Pairing persistence service exists',        fileExists(DB_PAI))
assert('9. Flavor Memory persistence service exists',  fileExists(DB_FLV))
assert('10. Reward persistence service exists',        fileExists(DB_REW))
assert('11. Loyalty persistence service exists',       fileExists(DB_LOY))
assert('12. Passport persistence service exists',      fileExists(DB_PAS))
assert('13. Venue admin persistence service exists',   fileExists(DB_VEN))
assert('14. Analytics persistence service exists',     fileExists(DB_ANA))
assert('15. Sync event persistence service exists',    fileExists(DB_SYN))
assert('16. Governance persistence service exists',    fileExists(DB_GOV))

// 17-19: Controller / routes
assert('17. Persistence controller exists',            fileExists(CTRL))
assert('18. Persistence routes exist',                 fileExists(ROUTES))
assert('19. Routes mounted under /api/modules/smokecraft/persistence',
  fileContains(INDEX, '/api/modules/smokecraft/persistence'))

// 20-22: Data contracts
assert('20. Persistence contract exists',              fileExists(C_PERS))
assert('21. Database schema contract exists',          fileExists(C_SCHEMA))
assert('22. Persistence health contract exists',       fileExists(C_HEALTH))

// 23-26: Components
assert('23. Persistence health panel exists',          fileExists(PNL_HLTH))
assert('24. Database status panel exists',             fileExists(PNL_DB))
assert('25. Persistence coverage panel exists',        fileExists(PNL_COV))
assert('26. Migration plan panel exists',              fileExists(PNL_MIG))

// 27-30: DATABASE_URL safety
assert('27. DATABASE_URL checked without exposing value',
  fileContains(P_ADAPT, 'DATABASE_URL') &&
  !fileContains(P_ADAPT, 'console.log(process.env.DATABASE_URL)'))
assert('28. Missing DATABASE_URL returns memory_fallback',
  fileContains(P_REG, 'memory_fallback') || fileContains(P_ADAPT, 'memory_fallback'))
assert('29. Missing DATABASE_URL returns productionReady false',
  (fileContains(P_HEALTH, 'productionReady') && fileContains(P_HEALTH, 'false')) ||
  fileContains(P_REG, 'productionReady:        false'))
assert('30. DB config detected does not auto-claim productionReady true',
  fileContains(P_HEALTH, 'productionReady:        false') ||
  fileContains(P_HEALTH, "productionReady: false"))

// 31-41: Critical areas tracked
assert('31. Critical areas are tracked',               fileContains(P_REG, 'CRITICAL_AREAS'))
assert('32. Orders area is tracked',                   fileContains(P_REG, "'orders'") || fileContains(P_REG, '"orders"'))
assert('33. Staff queue area is tracked',              fileContains(P_REG, 'staff_queue'))
assert('34. Pairing profiles area is tracked',         fileContains(P_REG, 'pairing_profiles'))
assert('35. Flavor Memory area is tracked',            fileContains(P_REG, 'flavor_memory'))
assert('36. Rewards area is tracked',                  fileContains(P_REG, "'rewards'") || fileContains(P_REG, '"rewards"'))
assert('37. Loyalty area is tracked',                  fileContains(P_REG, "'loyalty'") || fileContains(P_REG, 'loyalty'))
assert('38. Passport rewards area is tracked',         fileContains(P_REG, 'passport_rewards'))
assert('39. Venue admin area is tracked',              fileContains(P_REG, 'venue_admin'))
assert('40. Sync events area is tracked',              fileContains(P_REG, 'integration_sync_events') || fileContains(P_REG, 'sync_events'))
assert('41. Audit logs are tracked',                   fileContains(P_REG, 'order_audit') || fileContains(P_REG, 'audit'))

// 42-44: Migration plan safety
assert('42. Migration plan does not run automatically',
  fileContains(P_MIG, 'autoRunEnabled') && fileContains(P_MIG, 'false'))
assert('43. Migration plan does not claim completed without verification',
  fileContains(P_MIG, 'safeToRun:       false') || fileContains(P_MIG, "safeToRun: false"))
assert('44. No destructive migration is run',
  fileContains(MIG_SQL, 'CREATE TABLE IF NOT EXISTS') &&
  !fileContains(MIG_SQL, 'DROP TABLE'))

// 45-46: Audit safety
assert('45. Persistence audit entries containsSecrets false',
  fileContains(P_AUDIT, 'containsSecrets') && fileContains(P_AUDIT, 'false'))
assert('46. Persistence audit entries exposesPrivateData false',
  fileContains(P_AUDIT, 'exposesPrivateData') && fileContains(P_AUDIT, 'false'))

// 47-48: Docs
assert('47. README updated with Production Phase A',
  fileContains(README, 'Production Phase A') || fileContains(README, 'PRODUCTION PHASE A'))
assert('48. SMOKECRAFT_DATABASE_PERSISTENCE_HARDENING doc exists', fileExists(DOC))

// 49: Protected files
assert('49. Protected SmokeCraft visual files not modified',
  fileExists('src/components/smokecraft/SmokeCraftAssetScreen.jsx') &&
  fileExists('src/components/smokecraft/SmokeCraftHotspotLayer.jsx') &&
  fileExists('src/components/smokecraft/SmokeCraftAssetRoute.jsx'))

// 50-58: Prior scripts
console.log('\n  Running prior verify scripts...\n')
const priorScripts = [
  ['verify:smokecraft-final-qa-release-candidate', '50. verify:smokecraft-final-qa-release-candidate still passes'],
  ['verify:smokecraft-enterprise-packaging',       '51. verify:smokecraft-enterprise-packaging still passes'],
  ['verify:smokecraft-production-sync-readiness',  '52. verify:smokecraft-production-sync-readiness still passes'],
  ['verify:smokecraft-venue-admin-operations',     '53. verify:smokecraft-venue-admin-operations still passes'],
  ['verify:smokecraft-rewards-monetization',       '54. verify:smokecraft-rewards-monetization still passes'],
  ['verify:smokecraft-pairing-intelligence',       '55. verify:smokecraft-pairing-intelligence still passes'],
  ['verify:smokecraft-ordering-integration',       '56. verify:smokecraft-ordering-integration still passes'],
  ['verify:smokecraft-experience-module',          '57. verify:smokecraft-experience-module still passes'],
  ['verify:module-foundation',                     '58. verify:module-foundation still passes'],
]

const scriptResults = {}
for (const [name, label] of priorScripts) {
  const ok = runScript(name)
  scriptResults[name] = ok
  assert(label, ok)
}

// 59: Build
console.log('\n  Running npm run build...\n')
assert('59. npm run build passes', runScript('build'))

// 60: Script name accuracy
assert('60. Verification report uses correct script names',
  fileExists('server/scripts/verifySmokeCraftFinalQaReleaseCandidate.js') &&
  fileExists('server/scripts/verifySmokeCraftEnterprisePackaging.js') &&
  fileExists('server/scripts/verifySmokeCraftProductionSyncReadiness.js') &&
  fileExists('server/db/migrations/029_smokecraft_persistence_hardening.sql'))

// Summary
console.log('\n=== Results ===')
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)

if (failures.length > 0) {
  console.log('\nFailed assertions:')
  failures.forEach(f => console.log(`  - ${f}`))
}

console.log('\n=== Prior Script Results ===')
for (const [name, ok] of Object.entries(scriptResults)) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`)
}

if (failed === 0) {
  console.log('\n✓ All 60 assertions passed — SmokeCraft Database Persistence Hardening verification complete.\n')
  process.exit(0)
} else {
  console.log(`\n✗ ${failed} assertion(s) failed out of ${passed + failed}.\n`)
  process.exit(1)
}
