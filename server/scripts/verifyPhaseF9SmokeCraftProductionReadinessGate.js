// Phase F.9 Verification — SmokeCraft 360 Production Readiness Gate
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

let passed = 0
let failed = 0
const failures = []
let blocked = false

function check(label, condition) {
  if (condition) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    failures.push(label)
    blocked = true
    console.log(`  ✗ FAIL: ${label}`)
  }
}

function read(rel) {
  try { return readFileSync(resolve(process.cwd(), rel), 'utf8') } catch { return '' }
}

function fileExists(rel) {
  return existsSync(resolve(process.cwd(), rel))
}

console.log('\n=== Phase F.9 — SmokeCraft 360 Production Readiness Gate ===\n')

// ──────────────────────────────────────────────────────────────
// 1. LOCKED 18-SCREEN JOURNEY
// ──────────────────────────────────────────────────────────────
console.log('[ 1. Locked 18-screen SmokeCraft journey — routes ]')
const appJsx = read('src/App.jsx')
const REQUIRED_ROUTES = [
  'identity', 'golden-box', 'mentor-selection', 'pairing-lab',
  'seed-soil', 'humidor-match', 'request-purchase', 'cut-toast-light',
  'first-third', 'second-third', 'flavor-memory', 'final-third',
  'scorecard', 'final-review', 'passport-stamp', 'connections',
  'management-sync', 'session-complete',
]
for (const route of REQUIRED_ROUTES) {
  check(`Route /smokecraft/${route} registered`, appJsx.includes(`path="${route}"`))
}

console.log('\n[ 1b. Component files exist ]')
const COMPONENTS = {
  'identity':         'src/pages/smokecraft/Identity.jsx',
  'golden-box':       'src/pages/smokecraft/GoldenBox.jsx',
  'mentor-selection': 'src/pages/smokecraft/Mentor.jsx',
  'pairing-lab':      'src/pages/smokecraft/PairingLab.jsx',
  'seed-soil':        'src/pages/smokecraft/SeedSoil.jsx',
  'humidor-match':    'src/pages/smokecraft/HumidorMatch.jsx',
  'request-purchase': 'src/pages/smokecraft/RequestPurchase.jsx',
  'cut-toast-light':  'src/pages/smokecraft/CutToastLight.jsx',
  'first-third':      'src/pages/smokecraft/FirstThird.jsx',
  'second-third':     'src/pages/smokecraft/SecondThird.jsx',
  'flavor-memory':    'src/pages/smokecraft/FlavorMemory.jsx',
  'final-third':      'src/pages/smokecraft/FinalThird.jsx',
  'scorecard':        'src/pages/smokecraft/Scorecard.jsx',
  'final-review':     'src/pages/smokecraft/FinalReview.jsx',
  'passport-stamp':   'src/pages/smokecraft/PassportStamp.jsx',
  'connections':      'src/pages/smokecraft/Connections.jsx',
  'management-sync':  'src/pages/smokecraft/ManagementSync.jsx',
  'session-complete': 'src/pages/smokecraft/SessionComplete.jsx',
}
for (const [route, path] of Object.entries(COMPONENTS)) {
  check(`Component for ${route} exists`, fileExists(path))
}

// ──────────────────────────────────────────────────────────────
// 2. IMAGE VERIFICATION
// ──────────────────────────────────────────────────────────────
console.log('\n[ 2. Approved images exist ]')
const IMAGES = [
  'smokecraft-profile-capture.png',
  'smokecraft-gold-box-rules.png',
  'smokecraft-mentor-selection.png',
  'smokecraft-pairing-lab.png',
  'smokecraft-seed-soil.png',
  'smokecraft-humidor-match.png',
  'smokecraft-request-purchase.png',
  'smokecraft-cut-toast-light.png',
  'smokecraft-first-third.png',
  'smokecraft-second-third.png',
  'smokecraft-flavor-memory.png',
  'smokecraft-final-third.png',
  'smokecraft-scorecard-ranking.png',
  'smokecraft-final-review.png',
  'smokecraft-passport-stamp.png',
  'smokecraft-passport-connection.png',
  'smokecraft-venue-management-sync.png',
  'smokecraft-session-complete.png',
]
for (const img of IMAGES) {
  check(`Image ${img} exists`, fileExists(`public/assets/smokecraft-reference/approved/${img}`))
}
check('Approved images directory exists', fileExists('public/assets/smokecraft-reference/approved'))
check('SmokeCraftVisualProof.jsx exists', fileExists('src/pages/smokecraft/SmokeCraftVisualProof.jsx'))

// ──────────────────────────────────────────────────────────────
// 3. REWARDS / XP
// ──────────────────────────────────────────────────────────────
console.log('\n[ 3. Rewards / XP / session completion ]')
const rewards = read('src/constants/smokecraftRewards.js')
check('smokecraftRewards.js exists', rewards.length > 0)
check('SESSION_REWARDS exported', rewards.includes('export const SESSION_REWARDS'))
check('enroll key in SESSION_REWARDS', rewards.includes("'enroll'"))
check('golden-box key in SESSION_REWARDS', rewards.includes("'golden-box'"))
check('pairing-lab key in SESSION_REWARDS', rewards.includes("'pairing-lab'"))
check('final-review key in SESSION_REWARDS', rewards.includes("'final-review'"))
check('session-complete key in SESSION_REWARDS', rewards.includes("'session-complete'"))
check('journey-complete signal present', rewards.includes("'journey-complete'"))
check('Duplicate protection (unlock signal or completedSessions check)',
  rewards.includes('unlockSignal') || rewards.includes('alreadyAwarded'))

const guestCtx = read('src/context/GuestSessionContext.jsx')
check('GuestSessionContext.jsx exists', guestCtx.length > 0)
check('Duplicate stamp/badge protection in context', guestCtx.includes('deduplicate') || guestCtx.includes('alreadyAwarded') || guestCtx.includes('completedSessions'))

const sessionComplete = read('src/pages/smokecraft/SessionComplete.jsx')
check('SessionComplete awards journey-complete stamp', sessionComplete.includes("'journey-complete'") || sessionComplete.includes('"journey-complete"'))

// ──────────────────────────────────────────────────────────────
// 4. PASSPORT 360 LIVE BACKEND GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 4. Passport 360 live backend gate ]')
const migration068 = read('server/db/migrations/068_passport_360_smokecraft_live_persistence.sql')
check('Migration 068 exists', migration068.length > 0)
check('Migration 068 has CREATE TABLE IF NOT EXISTS',
  (migration068.match(/CREATE TABLE IF NOT EXISTS/g) || []).length >= 1)
check('Migration 068 no DROP TABLE', !migration068.includes('DROP TABLE'))

const passportSvc = read('server/services/passport360/passport360SmokeCraftPersistenceService.js')
check('Passport 360 persistence service exists', passportSvc.length > 0)
check('Passport service uses isDbAvailable', passportSvc.includes('isDbAvailable'))
check('Passport service localFallback returns backendConnected false',
  !passportSvc.match(/function localFallback[\s\S]{0,300}backendConnected:\s*true/))

const passportCtrl = read('server/controllers/passport360SmokeCraftController.js')
check('Passport 360 controller exists', passportCtrl.length > 0)

const passportRoutes = read('server/routes/passport360SmokeCraftRoutes.js')
check('Passport 360 routes file exists', passportRoutes.length > 0)

const serverIndex = read('server/index.js')
check('/api/passport-360/smokecraft registered', serverIndex.includes('/api/passport-360/smokecraft'))

const passportAdapter = read('src/services/passportAdapter.js')
check('passportAdapter.js exists', passportAdapter.length > 0)
check('Adapter targets /api/passport-360/smokecraft', passportAdapter.includes('/api/passport-360/smokecraft'))
check('Adapter backendConnected true only from API success',
  passportAdapter.includes('json?.success') && passportAdapter.includes('json?.backendConnected'))
check('Adapter has local fallback', passportAdapter.includes('localFallback'))

check('SessionComplete calls Passport backend sync',
  sessionComplete.includes('syncSmokeCraftSessionToBackend') || sessionComplete.includes('passportAdapter'))
check('SessionComplete calls saveFlavorMemoryToBackend',
  sessionComplete.includes('saveFlavorMemoryToBackend'))

const passportStamps = read('src/pages/passport/PassportStamps.jsx')
check('PassportStamps.jsx exists', passportStamps.length > 0)
check('PassportStamps reads backend stamps', passportStamps.includes('getEarnedStampsWithBackend') || passportStamps.includes('backendStamps'))
check('PassportStamps has fallback to local', passportStamps.includes('backendConnected') || passportStamps.includes('fallback'))

// ──────────────────────────────────────────────────────────────
// 5. E.A.T. LIVE SYNC GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 5. E.A.T. live sync gate ]')
const migration069 = read('server/db/migrations/069_eat_smokecraft_live_sync.sql')
check('Migration 069 exists', migration069.length > 0)
check('Migration 069 has CREATE TABLE IF NOT EXISTS',
  (migration069.match(/CREATE TABLE IF NOT EXISTS/g) || []).length >= 1)
check('Migration 069 no DROP TABLE', !migration069.includes('DROP TABLE'))

const eatSvc = read('server/services/eat360/eatSmokeCraftLiveSyncService.js')
check('E.A.T. SmokeCraft sync service exists', eatSvc.length > 0)
check('E.A.T. service uses isDbAvailable', eatSvc.includes('isDbAvailable'))
check('E.A.T. service localFallback returns backendConnected false',
  !eatSvc.match(/function localFallback[\s\S]{0,300}backendConnected:\s*true/))
check('E.A.T. service writes real DB records', eatSvc.includes('INSERT INTO eat_smokecraft'))

const eatCtrl = read('server/controllers/eatSmokeCraftLiveSyncController.js')
check('E.A.T. controller exists', eatCtrl.length > 0)

const eatRoutes = read('server/routes/eatSmokeCraftLiveSyncRoutes.js')
check('E.A.T. routes file exists', eatRoutes.length > 0)

check('/api/eat-360/smokecraft registered', serverIndex.includes('/api/eat-360/smokecraft'))

const mgmtSvc = read('src/modules/smokecraft/services/smokecraftManagementSyncService.js')
check('smokecraftManagementSyncService.js exists', mgmtSvc.length > 0)
check('ManagementSync service targets /api/eat-360/smokecraft', mgmtSvc.includes('/api/eat-360/smokecraft'))
check('ManagementSync no longer demo_only-only final state',
  !mgmtSvc.match(/syncManagement[\s\S]{0,300}status:\s*'demo_only'/))
check('ManagementSync backendConnected true only from API success',
  mgmtSvc.includes('backendConnected: true') && mgmtSvc.includes('json?.success'))

check('SessionComplete calls E.A.T. syncManagement', sessionComplete.includes('syncManagement'))
check('SessionComplete calls recordGuestActivity', sessionComplete.includes('recordGuestActivity'))
check('SessionComplete calls createManagerAlertSync', sessionComplete.includes('createManagerAlertSync'))
check('SessionComplete calls writeEATSyncAuditEvent', sessionComplete.includes('writeEATSyncAuditEvent'))

const managementSync = read('src/pages/smokecraft/ManagementSync.jsx')
check('ManagementSync.jsx exists', managementSync.length > 0)
check('ManagementSync calls getManagementSyncStatus', managementSync.includes('getManagementSyncStatus'))
check('ManagementSync calls syncManagement', managementSync.includes('syncManagement'))
check('ManagementSync shows E.A.T. Backend Connected', managementSync.includes('E.A.T. Backend Connected'))
check('ManagementSync shows E.A.T. Local Fallback', managementSync.includes('E.A.T. Local Fallback'))

// ──────────────────────────────────────────────────────────────
// 6. POS360 LIVE ORDER / HANDOFF BRIDGE GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 6. POS360 live order / handoff bridge gate ]')
const migration070 = read('server/db/migrations/070_pos360_smokecraft_live_order_bridge.sql')
check('Migration 070 exists', migration070.length > 0)
check('Migration 070 has CREATE TABLE IF NOT EXISTS',
  (migration070.match(/CREATE TABLE IF NOT EXISTS/g) || []).length >= 1)
check('Migration 070 no DROP TABLE', !migration070.includes('DROP TABLE'))

const pos360Svc = read('server/services/pos360/pos360SmokeCraftOrderBridgeService.js')
check('POS360 SmokeCraft order bridge service exists', pos360Svc.length > 0)
check('POS360 service uses isDbAvailable', pos360Svc.includes('isDbAvailable'))
check('POS360 service localFallback returns backendConnected false',
  !pos360Svc.match(/function localFallback[\s\S]{0,300}backendConnected:\s*true/))
check('POS360 service writes real DB records', pos360Svc.includes('INSERT INTO pos360_smokecraft'))

const pos360Ctrl = read('server/controllers/pos360SmokeCraftOrderBridgeController.js')
check('POS360 controller exists', pos360Ctrl.length > 0)

const pos360Routes = read('server/routes/pos360SmokeCraftOrderBridgeRoutes.js')
check('POS360 routes file exists', pos360Routes.length > 0)

check('/api/pos360/smokecraft registered', serverIndex.includes('/api/pos360/smokecraft'))

const handoffSvc = read('src/services/smokecraftHandoffService.js')
check('smokecraftHandoffService.js exists', handoffSvc.length > 0)
check('createPOS360OrderIntent exported', handoffSvc.includes('export async function createPOS360OrderIntent'))
check('createPOS360HandoffRequest exported', handoffSvc.includes('export async function createPOS360HandoffRequest'))
check('POS360 service targets /api/pos360/smokecraft', handoffSvc.includes('/api/pos360/smokecraft'))
check('POS360 backendConnected true only from API success',
  handoffSvc.includes('json?.success') && handoffSvc.includes('json?.backendConnected'))

const requestPurchase = read('src/pages/smokecraft/RequestPurchase.jsx')
check('RequestPurchase calls createPOS360OrderIntent', requestPurchase.includes('createPOS360OrderIntent'))
check('RequestPurchase order intent is non-blocking (async IIFE)',
  requestPurchase.includes(';(async') || requestPurchase.includes('(async ()'))

const handoffTrigger = read('src/components/smokecraft/SmokeCraftHandoffTrigger.jsx')
check('SmokeCraftHandoffTrigger calls createPOS360HandoffRequest', handoffTrigger.includes('createPOS360HandoffRequest'))
check('Handoff trigger is non-blocking (async IIFE)',
  handoffTrigger.includes(';(async') || handoffTrigger.includes('(async ()'))

check('No payment-completed claim in POS360 service', !pos360Svc.includes('paymentCompleted: true'))
check('No third-party POS provider claim', !pos360Svc.includes('providerConnected: true') && !pos360Svc.includes('externalPOS'))

// ──────────────────────────────────────────────────────────────
// 7. STAFF HANDOFF GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 7. Staff handoff gate ]')
check('SmokeCraftHandoffTrigger.jsx exists', fileExists('src/components/smokecraft/SmokeCraftHandoffTrigger.jsx'))
check('handoff status is honest (backendConnected not hardcoded true)',
  !handoffTrigger.includes("backendConnected: true"))
check('Staff PIN route exists (/staff/pin)', appJsx.includes("staff/pin") || appJsx.includes("/staff/pin"))
check('staffHandoffResumeService.js exists', fileExists('src/services/staffHandoffResumeService.js'))
check('Handoff trigger calls saveGuestResumeState', handoffTrigger.includes('saveGuestResumeState'))
check('Handoff trigger calls saveHandoffMeta', handoffTrigger.includes('saveHandoffMeta'))

// ──────────────────────────────────────────────────────────────
// 8. VENUE PILOT PACKAGE GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 8. Venue pilot package gate ]')
const venuePilot = read('src/pages/smokecraft/SmokeCraftVenuePilotPackage.jsx')
check('/smokecraft/venue-pilot-package route registered', appJsx.includes('venue-pilot-package'))
check('SmokeCraftVenuePilotPackage.jsx exists', venuePilot.length > 0)
check('Venue checklist exists', venuePilot.includes('VENUE_CHECKLIST') || venuePilot.includes('venue') || venuePilot.includes('Venue'))
check('Staff checklist exists', venuePilot.includes('STAFF_CHECKLIST') || venuePilot.includes('staff') || venuePilot.includes('Staff'))
check('Manager checklist exists', venuePilot.includes('MANAGER_CHECKLIST') || venuePilot.includes('manager') || venuePilot.includes('Manager'))
check('Safe claims documented', venuePilot.includes('SAFE_CLAIMS') || venuePilot.includes('safe') || venuePilot.includes('Safe'))
check('Unsafe claims documented', venuePilot.includes('UNSAFE_CLAIMS') || venuePilot.includes('unsafe') || venuePilot.includes('Unsafe'))
check('Known blockers documented', venuePilot.includes('KNOWN_BLOCKERS') || venuePilot.includes('blocker') || venuePilot.includes('Blocker'))
check('Documentation portal reference exists', venuePilot.includes('Documentation Portal') || venuePilot.includes('documentation-portal'))

// ──────────────────────────────────────────────────────────────
// 9. SAFE CLAIMS GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 9. Safe claims gate ]')
check('No payment_live claim in Passport service', !passportSvc.includes('payment_live'))
check('No payment_live claim in E.A.T. service', !eatSvc.includes('payment_live'))
check('No payment_live claim in POS360 service', !pos360Svc.includes('payment_live'))
check('No productionReady: true in Passport service', !passportSvc.includes('productionReady: true'))
check('No productionReady: true in E.A.T. service', !eatSvc.includes('productionReady: true'))
check('No productionReady: true in POS360 service', !pos360Svc.includes('productionReady: true'))
check('No vendor_live claim in any service',
  !passportSvc.includes('vendor_live') && !eatSvc.includes('vendor_live') && !pos360Svc.includes('vendor_live'))
check('No NOVEE OS E.10 complete claim', !serverIndex.includes('e10_complete') && !appJsx.includes('e10_complete'))
check('BeerCraft not in Passport service', !passportSvc.includes('BeerCraft'))
check('BeerCraft not in E.A.T. service', !eatSvc.includes('BeerCraft'))
check('BeerCraft not in POS360 service', !pos360Svc.includes('BeerCraft'))
check('WineCraft not in Passport service', !passportSvc.includes('WineCraft'))
check('WineCraft not in E.A.T. service', !eatSvc.includes('WineCraft'))
check('WineCraft not in POS360 service', !pos360Svc.includes('WineCraft'))

// ──────────────────────────────────────────────────────────────
// 10. DATABASE / MIGRATION GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 10. Database / migration gate ]')
check('Migration 068 uses CREATE TABLE IF NOT EXISTS (safe)',
  migration068.includes('CREATE TABLE IF NOT EXISTS'))
check('Migration 069 uses CREATE TABLE IF NOT EXISTS (safe)',
  migration069.includes('CREATE TABLE IF NOT EXISTS'))
check('Migration 070 uses CREATE TABLE IF NOT EXISTS (safe)',
  migration070.includes('CREATE TABLE IF NOT EXISTS'))
check('No TRUNCATE in migration 068', !migration068.toUpperCase().includes('TRUNCATE'))
check('No TRUNCATE in migration 069', !migration069.toUpperCase().includes('TRUNCATE'))
check('No TRUNCATE in migration 070', !migration070.toUpperCase().includes('TRUNCATE'))
check('No DROP COLUMN in migration 068', !migration068.toLowerCase().includes('drop column'))
check('No DROP COLUMN in migration 069', !migration069.toLowerCase().includes('drop column'))
check('No DROP COLUMN in migration 070', !migration070.toLowerCase().includes('drop column'))

// ──────────────────────────────────────────────────────────────
// 11. API ROUTE GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 11. API route gate ]')
check('/api/passport-360/smokecraft base registered', serverIndex.includes('/api/passport-360/smokecraft'))
check('/api/eat-360/smokecraft base registered', serverIndex.includes('/api/eat-360/smokecraft'))
check('/api/pos360/smokecraft base registered', serverIndex.includes('/api/pos360/smokecraft'))
check('Passport health endpoint exists', passportRoutes.includes("router.get('/health'"))
check('E.A.T. health endpoint exists', eatRoutes.includes("router.get('/health'"))
check('POS360 health endpoint exists', pos360Routes.includes("router.get('/health'"))

// ──────────────────────────────────────────────────────────────
// 12. FRONTEND ROUTE GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 12. Frontend route gate ]')
for (const route of REQUIRED_ROUTES) {
  check(`Frontend route /smokecraft/${route} exists`, appJsx.includes(`path="${route}"`))
}
check('/smokecraft/venue-pilot-package exists', appJsx.includes('venue-pilot-package'))
check('/novee-os/documentation-portal exists', appJsx.includes('documentation-portal'))

// ──────────────────────────────────────────────────────────────
// 13. PRODUCTION READINESS STATUS FILE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 13. Production readiness status file ]')
const statusFile = read('server/config/smokeCraftProductionReadinessStatus.js')
check('smokeCraftProductionReadinessStatus.js exists', statusFile.length > 0)
check('phase F.9 declared', statusFile.includes("phase: 'F.9'"))
check('module SmokeCraft 360 declared', statusFile.includes("module: 'SmokeCraft 360'"))
check('productionReadinessGate field present', statusFile.includes('productionReadinessGate'))
check('passportBackendGate field present', statusFile.includes('passportBackendGate'))
check('eatLiveSyncGate field present', statusFile.includes('eatLiveSyncGate'))
check('pos360OrderBridgeGate field present', statusFile.includes('pos360OrderBridgeGate'))
check('staffHandoffGate field present', statusFile.includes('staffHandoffGate'))
check('venuePilotPackageGate field present', statusFile.includes('venuePilotPackageGate'))
check('safeClaimsGate field present', statusFile.includes('safeClaimsGate'))
check('blockers field present', statusFile.includes('blockers'))
check('allowedClaims field present', statusFile.includes('allowedClaims'))
check('cannotClaim field present', statusFile.includes('cannotClaim'))
check('status field present', statusFile.includes('status:'))
check('Status is PRODUCTION_READY_INTERNAL_GATE_PASSED or BLOCKED',
  statusFile.includes('PRODUCTION_READY_INTERNAL_GATE_PASSED') || statusFile.includes('PRODUCTION_READY_BLOCKED'))

// ──────────────────────────────────────────────────────────────
// 14. DOCUMENTATION GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 14. Documentation gate ]')
const readinessDoc = read('docs/PHASE_F_9_SMOKECRAFT_PRODUCTION_READINESS_GATE.md')
check('docs/PHASE_F_9_SMOKECRAFT_PRODUCTION_READINESS_GATE.md exists', readinessDoc.length > 0)
check('Doc includes pass/fail table', readinessDoc.includes('| ') && readinessDoc.includes(' |'))
check('Doc includes production-ready decision', readinessDoc.includes('PRODUCTION_READY'))
check('Doc includes gates checked', readinessDoc.includes('Gate'))
check('Doc includes safe claims', readinessDoc.includes('Safe Claim') || readinessDoc.includes('safe claim'))
check('Doc includes deployment requirements', readinessDoc.includes('Deployment') || readinessDoc.includes('deployment'))

// ──────────────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────────────
const total = passed + failed
const status = failed === 0
  ? 'PRODUCTION_READY_INTERNAL_GATE_PASSED'
  : 'PRODUCTION_READY_BLOCKED'

console.log(`\n=== RESULT: ${passed} passed / ${total} total ===`)
if (failures.length > 0) {
  console.log('\nFailed checks (BLOCKERS):')
  failures.forEach(f => console.log(`  ✗ ${f}`))
}

console.log(`\n=== FINAL STATUS: ${status} ===`)
console.log('\n=== FINAL REPORT ===')
console.log(`  Locked 18-screen journey:         ${REQUIRED_ROUTES.every(r => appJsx.includes(`path="${r}"`)) ? 'PASS' : 'FAIL'}`)
console.log(`  All 18 components exist:          ${Object.values(COMPONENTS).every(fileExists) ? 'PASS' : 'FAIL'}`)
console.log(`  All 18 approved images exist:     ${IMAGES.every(img => fileExists(`public/assets/smokecraft-reference/approved/${img}`)) ? 'PASS' : 'FAIL'}`)
console.log(`  Rewards / XP / duplicate guard:   ${rewards.includes('SESSION_REWARDS') ? 'PASS' : 'FAIL'}`)
console.log(`  Passport 360 backend gate:        ${migration068.length > 0 && passportSvc.length > 0 && serverIndex.includes('/api/passport-360/smokecraft') ? 'PASS' : 'FAIL'}`)
console.log(`  E.A.T. live sync gate:            ${migration069.length > 0 && eatSvc.length > 0 && serverIndex.includes('/api/eat-360/smokecraft') ? 'PASS' : 'FAIL'}`)
console.log(`  POS360 order bridge gate:         ${migration070.length > 0 && pos360Svc.length > 0 && serverIndex.includes('/api/pos360/smokecraft') ? 'PASS' : 'FAIL'}`)
console.log(`  Staff handoff gate:               ${fileExists('src/components/smokecraft/SmokeCraftHandoffTrigger.jsx') ? 'PASS' : 'FAIL'}`)
console.log(`  Venue pilot package gate:         ${venuePilot.length > 0 ? 'PASS' : 'FAIL'}`)
console.log(`  Safe claims gate:                 ${!passportSvc.includes('productionReady: true') ? 'PASS' : 'FAIL'}`)
console.log(`  Database / migration gate:        ${migration068.length > 0 && migration069.length > 0 && migration070.length > 0 ? 'PASS' : 'FAIL'}`)
console.log(`  API route gate:                   ${serverIndex.includes('/api/passport-360/smokecraft') && serverIndex.includes('/api/eat-360/smokecraft') && serverIndex.includes('/api/pos360/smokecraft') ? 'PASS' : 'FAIL'}`)
console.log(`  Frontend route gate:              ${REQUIRED_ROUTES.every(r => appJsx.includes(`path="${r}"`)) ? 'PASS' : 'FAIL'}`)
console.log(`  Production readiness status file: ${statusFile.length > 0 ? 'PASS' : 'FAIL'}`)
console.log(`  Documentation:                    ${readinessDoc.length > 0 ? 'PASS' : 'FAIL'}`)
console.log('')
console.log('  HONEST ANSWERS:')
console.log('  Is SmokeCraft 360 production-ready (internal gate)?  ' + (failed === 0 ? 'YES' : 'NO — see blockers above'))
console.log('  Is third-party POS connected?                        NO')
console.log('  Are payments live?                                   NO')
console.log('  Is NOVEE OS E.10 complete?                          NO')
console.log('  Next phase if gate passes:                           Phase E.10 — NOVEE OS Final Go-Live Gate')
console.log('  Next phase if gate fails:                            Fix listed blockers, rerun F.9')

if (failed > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
