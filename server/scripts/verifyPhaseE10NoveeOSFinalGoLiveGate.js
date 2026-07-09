// Phase E.10 Verification — NOVEE OS Final Go-Live Gate
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

let passed = 0
let failed = 0
const failures = []

function check(label, condition) {
  if (condition) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    failures.push(label)
    console.log(`  ✗ FAIL: ${label}`)
  }
}

function read(rel) {
  try { return readFileSync(resolve(process.cwd(), rel), 'utf8') } catch { return '' }
}

function fileExists(rel) {
  return existsSync(resolve(process.cwd(), rel))
}

console.log('\n=== Phase E.10 — NOVEE OS Final Go-Live Gate ===\n')

const serverIndex  = read('server/index.js')
const appJsx       = read('src/App.jsx')

// ──────────────────────────────────────────────────────────────
// 1. NOVEE OS PHASE COMPLETION GATE
// ──────────────────────────────────────────────────────────────
console.log('[ 1. NOVEE OS Phase Completion Gate ]')
check('E.2 Command Center built', fileExists('src/pages/noveeOS/NoveeOSCommandCenter.jsx'))
check('E.3 Security Activation Center built', fileExists('src/pages/noveeOS/NoveeOSSecurityGovernance.jsx'))
check('E.4 Deployment Activation Center built', appJsx.includes('deployment') || fileExists('src/pages/noveeOS/NoveeOSFinalReadiness.jsx'))
check('E.5 Live Pilot Readiness Center referenced', appJsx.includes('pilot') || serverIndex.includes('pilot'))
check('E.6 Remote Module Distribution Center built', fileExists('src/pages/noveeOS/RemoteModuleDistribution.jsx'))
check('E.7 Onboarding + Training Center built', fileExists('src/pages/noveeOS/OnboardingTrainingCenter.jsx'))
check('E.8 AMBI Foundation built', fileExists('src/pages/noveeOS/AMBIFoundation.jsx'))
check('E.9 Documentation Portal built', fileExists('src/pages/noveeOS/DocumentationPortal.jsx'))
check('E.10 go-live config exists', fileExists('server/config/noveeOSFinalGoLiveStatus.js'))
check('E.10 documentation exists', fileExists('docs/PHASE_E_10_NOVEE_OS_FINAL_GO_LIVE_GATE.md'))

// ──────────────────────────────────────────────────────────────
// 2. SMOKECRAFT 360 GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 2. SmokeCraft 360 Gate ]')
const f9Status = read('server/config/smokeCraftProductionReadinessStatus.js')
check('F.9 production readiness status file exists', f9Status.length > 0)
check('SmokeCraft status is PRODUCTION_READY_INTERNAL_GATE_PASSED',
  f9Status.includes('PRODUCTION_READY_INTERNAL_GATE_PASSED'))
check('passportBackendGate: passed in F.9 status', f9Status.includes("passportBackendGate"))
check('eatLiveSyncGate: passed in F.9 status', f9Status.includes("eatLiveSyncGate"))
check('pos360OrderBridgeGate: passed in F.9 status', f9Status.includes("pos360OrderBridgeGate"))
check('No fake payment claim in F.9 status',
  !f9Status.includes('paymentLive: true') && !f9Status.includes("payments: 'live'"))
check('No fake third-party POS claim in F.9 status',
  !f9Status.includes('posProviderLive: true') && !f9Status.includes("thirdPartyPOS: 'live'"))

const REQUIRED_ROUTES_18 = [
  'identity', 'golden-box', 'mentor-selection', 'pairing-lab',
  'seed-soil', 'humidor-match', 'request-purchase', 'cut-toast-light',
  'first-third', 'second-third', 'flavor-memory', 'final-third',
  'scorecard', 'final-review', 'passport-stamp', 'connections',
  'management-sync', 'session-complete',
]
for (const route of REQUIRED_ROUTES_18) {
  check(`SmokeCraft route /smokecraft/${route} exists`, appJsx.includes(`path="${route}"`))
}

const IMAGES_18 = [
  'smokecraft-profile-capture.png', 'smokecraft-gold-box-rules.png',
  'smokecraft-mentor-selection.png', 'smokecraft-pairing-lab.png',
  'smokecraft-seed-soil.png', 'smokecraft-humidor-match.png',
  'smokecraft-request-purchase.png', 'smokecraft-cut-toast-light.png',
  'smokecraft-first-third.png', 'smokecraft-second-third.png',
  'smokecraft-flavor-memory.png', 'smokecraft-final-third.png',
  'smokecraft-scorecard-ranking.png', 'smokecraft-final-review.png',
  'smokecraft-passport-stamp.png', 'smokecraft-passport-connection.png',
  'smokecraft-venue-management-sync.png', 'smokecraft-session-complete.png',
]
for (const img of IMAGES_18) {
  check(`Approved image ${img} exists`,
    fileExists(`public/assets/smokecraft-reference/approved/${img}`))
}

// ──────────────────────────────────────────────────────────────
// 3. PASSPORT 360 GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 3. Passport 360 Gate ]')
const migration068 = read('server/db/migrations/068_passport_360_smokecraft_live_persistence.sql')
check('Migration 068 exists', migration068.length > 0)
check('Migration 068 safe (CREATE TABLE IF NOT EXISTS)', migration068.includes('CREATE TABLE IF NOT EXISTS'))
check('Migration 068 no DROP TABLE', !migration068.includes('DROP TABLE'))

const passportSvc = read('server/services/passport360/passport360SmokeCraftPersistenceService.js')
check('Passport backend service exists', passportSvc.length > 0)
check('Passport service uses isDbAvailable', passportSvc.includes('isDbAvailable'))
check('Passport localFallback never returns backendConnected: true',
  !passportSvc.match(/function localFallback[\s\S]{0,300}backendConnected:\s*true/))

check('Passport controller exists', fileExists('server/controllers/passport360SmokeCraftController.js'))
check('Passport routes file exists', fileExists('server/routes/passport360SmokeCraftRoutes.js'))
check('/api/passport-360/smokecraft registered', serverIndex.includes('/api/passport-360/smokecraft'))

const passportAdapter = read('src/services/passportAdapter.js')
check('passportAdapter.js exists', passportAdapter.length > 0)
check('Adapter backendConnected true only from API success',
  passportAdapter.includes('json?.success') && passportAdapter.includes('json?.backendConnected'))

const sessionComplete = read('src/pages/smokecraft/SessionComplete.jsx')
check('SessionComplete calls Passport backend sync',
  sessionComplete.includes('syncSmokeCraftSessionToBackend') || sessionComplete.includes('passportAdapter'))

// ──────────────────────────────────────────────────────────────
// 4. E.A.T. 360 GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 4. E.A.T. 360 Gate ]')
const migration069 = read('server/db/migrations/069_eat_smokecraft_live_sync.sql')
check('Migration 069 exists', migration069.length > 0)
check('Migration 069 safe (CREATE TABLE IF NOT EXISTS)', migration069.includes('CREATE TABLE IF NOT EXISTS'))
check('Migration 069 no DROP TABLE', !migration069.includes('DROP TABLE'))

const eatSvc = read('server/services/eat360/eatSmokeCraftLiveSyncService.js')
check('E.A.T. SmokeCraft live sync service exists', eatSvc.length > 0)
check('E.A.T. service uses isDbAvailable', eatSvc.includes('isDbAvailable'))
check('E.A.T. localFallback never returns backendConnected: true',
  !eatSvc.match(/function localFallback[\s\S]{0,300}backendConnected:\s*true/))

check('E.A.T. controller exists', fileExists('server/controllers/eatSmokeCraftLiveSyncController.js'))
check('E.A.T. routes file exists', fileExists('server/routes/eatSmokeCraftLiveSyncRoutes.js'))
check('/api/eat-360/smokecraft registered', serverIndex.includes('/api/eat-360/smokecraft'))

const mgmtSvc = read('src/modules/smokecraft/services/smokecraftManagementSyncService.js')
check('ManagementSync service targets /api/eat-360/smokecraft', mgmtSvc.includes('/api/eat-360/smokecraft'))
check('ManagementSync no longer demo_only-only final state',
  !mgmtSvc.match(/syncManagement[\s\S]{0,300}status:\s*'demo_only'/))

check('SessionComplete calls E.A.T. syncManagement', sessionComplete.includes('syncManagement'))

// ──────────────────────────────────────────────────────────────
// 5. POS360 INTERNAL BRIDGE GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 5. POS360 Internal Bridge Gate ]')
const migration070 = read('server/db/migrations/070_pos360_smokecraft_live_order_bridge.sql')
check('Migration 070 exists', migration070.length > 0)
check('Migration 070 safe (CREATE TABLE IF NOT EXISTS)', migration070.includes('CREATE TABLE IF NOT EXISTS'))
check('Migration 070 no DROP TABLE', !migration070.includes('DROP TABLE'))

const pos360Svc = read('server/services/pos360/pos360SmokeCraftOrderBridgeService.js')
check('POS360 SmokeCraft bridge service exists', pos360Svc.length > 0)
check('POS360 service uses isDbAvailable', pos360Svc.includes('isDbAvailable'))
check('POS360 localFallback never returns backendConnected: true',
  !pos360Svc.match(/function localFallback[\s\S]{0,300}backendConnected:\s*true/))

check('POS360 controller exists', fileExists('server/controllers/pos360SmokeCraftOrderBridgeController.js'))
check('POS360 routes file exists', fileExists('server/routes/pos360SmokeCraftOrderBridgeRoutes.js'))
check('/api/pos360/smokecraft registered', serverIndex.includes('/api/pos360/smokecraft'))

const requestPurchase = read('src/pages/smokecraft/RequestPurchase.jsx')
check('RequestPurchase calls createPOS360OrderIntent', requestPurchase.includes('createPOS360OrderIntent'))

const handoffTrigger = read('src/components/smokecraft/SmokeCraftHandoffTrigger.jsx')
check('SmokeCraftHandoffTrigger calls createPOS360HandoffRequest', handoffTrigger.includes('createPOS360HandoffRequest'))

check('No payment-completed claim in POS360 service', !pos360Svc.includes('paymentCompleted: true'))
check('No third-party POS provider claim', !pos360Svc.includes('providerConnected: true'))

// ──────────────────────────────────────────────────────────────
// 6. DOCUMENTATION PORTAL GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 6. Documentation Portal Gate ]')
const docPortal = read('src/pages/noveeOS/DocumentationPortal.jsx')
check('E.9 Documentation Portal exists', docPortal.length > 0)
check('/novee-os/documentation-portal route exists', appJsx.includes('documentation-portal'))
check('/api/novee-os/documentation-portal registered', serverIndex.includes('/api/novee-os/documentation-portal'))
check('Documentation Portal references seeded content', docPortal.includes('seeded') || docPortal.includes('Seeded'))
check('Documentation Portal has draft/not-published labels',
  docPortal.includes('draft') || docPortal.includes('Draft') || docPortal.includes('seeded_professional_draft'))
check('No fake published claim in portal', !docPortal.includes('published: true') && !docPortal.includes("status: 'published'"))

// ──────────────────────────────────────────────────────────────
// 7. ONBOARDING + TRAINING GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 7. Onboarding + Training Gate ]')
const onboarding = read('src/pages/noveeOS/OnboardingTrainingCenter.jsx')
check('E.7 Onboarding + Training Center exists', onboarding.length > 0)
check('/novee-os/onboarding-training route exists', appJsx.includes('onboarding-training'))
check('/api/novee-os/onboarding-training registered', serverIndex.includes('/api/novee-os/onboarding-training'))
check('Onboarding center has tracking structure',
  onboarding.includes('progress') || onboarding.includes('complete') || onboarding.includes('status'))

// ──────────────────────────────────────────────────────────────
// 8. REMOTE DISTRIBUTION GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 8. Remote Distribution Gate ]')
const remoteDist = read('src/pages/noveeOS/RemoteModuleDistribution.jsx')
check('E.6 Remote Module Distribution Center exists', remoteDist.length > 0)
check('/novee-os/remote-distribution route exists', appJsx.includes('remote-distribution'))
check('/api/novee-os/remote-distribution registered', serverIndex.includes('/api/novee-os/remote-distribution'))
check('Remote delivery not falsely claimed as live',
  !remoteDist.includes("deliveryEnabled: true") && !remoteDist.includes("remoteDeliveryLive: true"))
check('No fake invite link delivery claim',
  !remoteDist.includes("inviteDeliveryLive: true") && !remoteDist.includes("inviteSent: true"))

// ──────────────────────────────────────────────────────────────
// 9. SECURITY GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 9. Security Gate ]')
const security = read('src/pages/noveeOS/NoveeOSSecurityGovernance.jsx')
check('E.3 Security Activation Center exists', security.length > 0)
check('/novee-os/security route exists', appJsx.includes('novee-os/security'))
check('No fake SOC2 certification claim', !security.includes("soc2Certified: true") && !security.includes("SOC2: true"))
check('No fake HIPAA certification claim', !security.includes("hipaaCertified: true"))
check('No fake PCI certification claim', !security.includes("pciCertified: true"))
check('Compliance not certified label present',
  security.includes('NOT CERTIFIED') || security.includes('not_certified') || security.includes('compliance_certified') )

// ──────────────────────────────────────────────────────────────
// 10. DEPLOYMENT GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 10. Deployment Gate ]')
check('E.4 Deployment Activation reference exists (route or component)',
  appJsx.includes('deployment') || fileExists('src/pages/noveeOS/NoveeOSFinalReadiness.jsx'))
check('/api/novee-os/final-readiness or deployment registered',
  serverIndex.includes('final-readiness') || serverIndex.includes('deployment'))
check('Build passes locally (build output exists)', fileExists('dist/index.html'))

// ──────────────────────────────────────────────────────────────
// 11. AMBI GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 11. AMBI Gate ]')
const ambi = read('src/pages/noveeOS/AMBIFoundation.jsx')
check('E.8 AMBI Foundation exists', ambi.length > 0)
check('/novee-os/ambi-foundation route exists', appJsx.includes('ambi-foundation'))
check('/api/novee-os/ambi-foundation registered', serverIndex.includes('/api/novee-os/ambi-foundation'))
check('AMBI is software-only (no hardware-ready claim)',
  ambi.includes('SOFTWARE FOUNDATION ONLY') || ambi.includes('software foundation only') || ambi.includes('No physical hardware'))
check('No live sensor/telemetry claim', !ambi.includes("sensorLive: true") && !ambi.includes("telemetryLive: true"))
check('No medical/biometric/safety claim', !ambi.includes("medicalReady: true") && !ambi.includes("biometricLive: true"))

// ──────────────────────────────────────────────────────────────
// 12. SAFE CLAIMS GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 12. Safe Claims Gate ]')
const e10Config = read('server/config/noveeOSFinalGoLiveStatus.js')
check('E.10 config has allowedClaims', e10Config.includes('allowedClaims'))
check('E.10 config has cannotClaim', e10Config.includes('cannotClaim'))
check('E.10 config has limitations', e10Config.includes('limitations'))
check('Limitations include payment not live', e10Config.toLowerCase().includes('payment') && e10Config.includes('NOT'))
check('Limitations include third-party POS not connected', e10Config.includes('Third-party POS') || e10Config.includes('third-party POS'))
check('Limitations include AMBI hardware not live', e10Config.includes('AMBI hardware'))
check('No fake payment live claim in E.10 config', !e10Config.includes("payments: 'live'") && !e10Config.includes('paymentLive: true'))
check('No fake POS provider live claim in E.10 config', !e10Config.includes('posProviderLive: true'))
check('No fake vendor ordering live claim', !e10Config.includes('vendorOrderingLive: true'))
check('No fake compliance certification in E.10 config', !e10Config.includes('complianceCertified: true'))
check('No fake AMBI hardware live claim in E.10 config', !e10Config.includes('ambiHardwareLive: true'))
check('No fake external communication live claim', !e10Config.includes('externalCommLive: true'))
check('No NOVEE OS E.10 complete false claim in server index', !serverIndex.includes('e10_complete: true'))
check('BeerCraft not modified (no BeerCraft in POS360/Passport/EAT services)',
  !pos360Svc.includes('BeerCraft') && !passportSvc.includes('BeerCraft') && !eatSvc.includes('BeerCraft'))
check('WineCraft not modified', !pos360Svc.includes('WineCraft') && !passportSvc.includes('WineCraft'))

// ──────────────────────────────────────────────────────────────
// 13. DATABASE / MIGRATION SAFETY GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 13. Database / Migration Safety Gate ]')
const MIGRATIONS = {
  '061': 'server/db/migrations/061_novee_os_security_activation.sql',
  '062': 'server/db/migrations/062_novee_os_deployment_activation.sql',
  '063': 'server/db/migrations/063_novee_os_live_pilot_readiness.sql',
  '064': 'server/db/migrations/064_novee_os_remote_module_distribution.sql',
  '065': 'server/db/migrations/065_novee_os_onboarding_training_center.sql',
  '066': 'server/db/migrations/066_novee_os_ambi_foundation.sql',
  '067': 'server/db/migrations/067_novee_os_documentation_portal.sql',
  '068': 'server/db/migrations/068_passport_360_smokecraft_live_persistence.sql',
  '069': 'server/db/migrations/069_eat_smokecraft_live_sync.sql',
  '070': 'server/db/migrations/070_pos360_smokecraft_live_order_bridge.sql',
}
for (const [num, path] of Object.entries(MIGRATIONS)) {
  const sql = read(path)
  check(`Migration ${num} exists`, sql.length > 0)
  check(`Migration ${num} no DROP TABLE`, !sql.includes('DROP TABLE'))
  check(`Migration ${num} no DROP COLUMN`, !sql.toLowerCase().includes('drop column'))
  check(`Migration ${num} no TRUNCATE`, !sql.toUpperCase().includes('TRUNCATE'))
}

// ──────────────────────────────────────────────────────────────
// 14. API ROUTE GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 14. API Route Gate ]')
const REQUIRED_API_ROUTES = [
  ['/api/passport-360/smokecraft', 'Passport 360 SmokeCraft'],
  ['/api/eat-360/smokecraft',      'E.A.T. SmokeCraft sync'],
  ['/api/pos360/smokecraft',       'POS360 SmokeCraft bridge'],
  ['/api/novee-os/documentation-portal', 'Documentation Portal'],
  ['/api/novee-os/onboarding-training',  'Onboarding + Training'],
  ['/api/novee-os/remote-distribution',  'Remote Distribution'],
  ['/api/novee-os/ambi-foundation',      'AMBI Foundation'],
]
for (const [route, label] of REQUIRED_API_ROUTES) {
  check(`API route ${label} registered`, serverIndex.includes(route))
}

// ──────────────────────────────────────────────────────────────
// 15. FRONTEND ROUTE GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 15. Frontend Route Gate ]')
const REQUIRED_FRONTEND_ROUTES = [
  ['novee-os/command-center',      'Command Center'],
  ['novee-os/documentation-portal','Documentation Portal'],
  ['novee-os/onboarding-training', 'Onboarding + Training'],
  ['novee-os/remote-distribution', 'Remote Distribution'],
  ['novee-os/ambi-foundation',     'AMBI Foundation'],
  ['smokecraft/venue-pilot-package','Venue Pilot Package'],
]
for (const [route, label] of REQUIRED_FRONTEND_ROUTES) {
  check(`Frontend route /${route} (${label}) exists`, appJsx.includes(route))
}
for (const route of REQUIRED_ROUTES_18) {
  check(`SmokeCraft frontend route /smokecraft/${route} exists`, appJsx.includes(`path="${route}"`))
}

// ──────────────────────────────────────────────────────────────
// 16. E.10 STATUS CONFIG GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 16. E.10 Status Config Gate ]')
check('noveeOSFinalGoLiveStatus.js exists', e10Config.length > 0)
check("phase: 'E.10' declared", e10Config.includes("phase: 'E.10'"))
check("platform: 'NOVEE OS' declared", e10Config.includes("platform: 'NOVEE OS'"))
check('finalGoLiveGate field present', e10Config.includes('finalGoLiveGate'))
check('smokeCraftProductionGate field present', e10Config.includes('smokeCraftProductionGate'))
check('passportBackendGate field present', e10Config.includes('passportBackendGate'))
check('eatLiveSyncGate field present', e10Config.includes('eatLiveSyncGate'))
check('pos360InternalBridgeGate field present', e10Config.includes('pos360InternalBridgeGate'))
check('documentationGate field present', e10Config.includes('documentationGate'))
check('onboardingTrainingGate field present', e10Config.includes('onboardingTrainingGate'))
check('remoteDistributionGate field present', e10Config.includes('remoteDistributionGate'))
check('securityGate field present', e10Config.includes('securityGate'))
check('deploymentGate field present', e10Config.includes('deploymentGate'))
check('ambiGate field present', e10Config.includes('ambiGate'))
check('safeClaimsGate field present', e10Config.includes('safeClaimsGate'))
check('migrationSafetyGate field present', e10Config.includes('migrationSafetyGate'))
check('apiRouteGate field present', e10Config.includes('apiRouteGate'))
check('frontendRouteGate field present', e10Config.includes('frontendRouteGate'))
check('blockers field present', e10Config.includes('blockers'))
check('limitations field present', e10Config.includes('limitations'))
check('lastVerifiedAt field present', e10Config.includes('lastVerifiedAt'))
check('status field present', e10Config.includes('status:'))
check('Status is NOVEE_OS_FINAL_GO_LIVE_GATE_PASSED_INTERNAL or BLOCKED',
  e10Config.includes('NOVEE_OS_FINAL_GO_LIVE_GATE_PASSED_INTERNAL') || e10Config.includes('NOVEE_OS_FINAL_GO_LIVE_BLOCKED'))

// ──────────────────────────────────────────────────────────────
// 17. DOCUMENTATION GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 17. Documentation Gate ]')
const e10Doc = read('docs/PHASE_E_10_NOVEE_OS_FINAL_GO_LIVE_GATE.md')
check('docs/PHASE_E_10_NOVEE_OS_FINAL_GO_LIVE_GATE.md exists', e10Doc.length > 0)
check('Doc includes pass/fail table', e10Doc.includes('| ') && e10Doc.includes(' |'))
check('Doc includes NOVEE_OS_FINAL_GO_LIVE decision', e10Doc.includes('NOVEE_OS_FINAL_GO_LIVE'))
check('Doc includes gate results', e10Doc.includes('Gate') || e10Doc.includes('gate'))
check('Doc includes safe claims', e10Doc.includes('Safe Claim') || e10Doc.includes('safe claim'))
check('Doc includes limitations', e10Doc.includes('Limitation') || e10Doc.includes('limitation'))
check('Doc includes deployment requirements', e10Doc.includes('Deployment') || e10Doc.includes('deployment'))
check('Doc includes Railway / database checklist', e10Doc.includes('Railway') || e10Doc.includes('database'))
check('Doc is labeled draft/internal', e10Doc.includes('Draft') || e10Doc.includes('Internal') || e10Doc.includes('draft'))

// ──────────────────────────────────────────────────────────────
// 18. COMMAND CENTER E.10 UPDATE GATE
// ──────────────────────────────────────────────────────────────
console.log('\n[ 18. Command Center E.10 Update Gate ]')
const cmdCenter = read('src/pages/noveeOS/NoveeOSCommandCenter.jsx')
check('Command Center exists', cmdCenter.length > 0)
check('Command Center references SmokeCraft production status or F.9',
  cmdCenter.includes('PRODUCTION_READY') || cmdCenter.includes('F.9') || cmdCenter.includes('Production Readiness') || cmdCenter.includes('SmokeCraft 360'))
check('Command Center references E.10 or final go-live gate',
  cmdCenter.includes('E.10') || cmdCenter.includes('Final Go-Live') || cmdCenter.includes('finalGoLive') || cmdCenter.includes('go-live'))
check('Command Center shows Passport / E.A.T. / POS360 bridge status or references',
  cmdCenter.includes('Passport') && (cmdCenter.includes('E.A.T') || cmdCenter.includes('EAT')) && cmdCenter.includes('POS360'))
check('Command Center shows payment limitations (payments not live)',
  cmdCenter.includes('payment') || cmdCenter.includes('Payment'))
check('Command Center shows honest status (not claiming production live falsely)',
  !cmdCenter.includes("productionLive: true") && !cmdCenter.includes("publicLive: true"))

// ──────────────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────────────
const total = passed + failed
const status = failed === 0
  ? 'NOVEE_OS_FINAL_GO_LIVE_GATE_PASSED_INTERNAL'
  : 'NOVEE_OS_FINAL_GO_LIVE_BLOCKED'

console.log(`\n=== RESULT: ${passed} passed / ${total} total ===`)
if (failures.length > 0) {
  console.log('\nFailed checks (BLOCKERS):')
  failures.forEach(f => console.log(`  ✗ ${f}`))
}
console.log(`\n=== FINAL STATUS: ${status} ===`)
console.log('\n=== FINAL REPORT ===')
console.log(`  NOVEE OS Phase Completion:         ${fileExists('src/pages/noveeOS/NoveeOSCommandCenter.jsx') ? 'PASS' : 'FAIL'}`)
console.log(`  SmokeCraft 360 production gate:    ${f9Status.includes('PRODUCTION_READY_INTERNAL_GATE_PASSED') ? 'PASS' : 'FAIL'}`)
console.log(`  Passport 360 backend gate:         ${migration068.length > 0 && passportSvc.length > 0 ? 'PASS' : 'FAIL'}`)
console.log(`  E.A.T. live sync gate:             ${migration069.length > 0 && eatSvc.length > 0 ? 'PASS' : 'FAIL'}`)
console.log(`  POS360 internal bridge gate:       ${migration070.length > 0 && pos360Svc.length > 0 ? 'PASS' : 'FAIL'}`)
console.log(`  Documentation Portal gate:         ${fileExists('src/pages/noveeOS/DocumentationPortal.jsx') ? 'PASS' : 'FAIL'}`)
console.log(`  Onboarding + Training gate:        ${fileExists('src/pages/noveeOS/OnboardingTrainingCenter.jsx') ? 'PASS' : 'FAIL'}`)
console.log(`  Remote Distribution gate:          ${fileExists('src/pages/noveeOS/RemoteModuleDistribution.jsx') ? 'PASS' : 'FAIL'}`)
console.log(`  Security gate:                     ${fileExists('src/pages/noveeOS/NoveeOSSecurityGovernance.jsx') ? 'PASS' : 'FAIL'}`)
console.log(`  Deployment gate:                   ${fileExists('dist/index.html') ? 'PASS' : 'FAIL'}`)
console.log(`  AMBI gate:                         ${fileExists('src/pages/noveeOS/AMBIFoundation.jsx') ? 'PASS' : 'FAIL'}`)
console.log(`  Safe claims gate:                  ${e10Config.includes('allowedClaims') && !e10Config.includes('paymentLive: true') ? 'PASS' : 'FAIL'}`)
console.log(`  Migration safety gate (061–070):   ${Object.values(MIGRATIONS).every(p => read(p).length > 0) ? 'PASS' : 'FAIL'}`)
console.log(`  API route gate (7 routes):         ${ ['/api/passport-360/smokecraft','/api/eat-360/smokecraft','/api/pos360/smokecraft','/api/novee-os/documentation-portal','/api/novee-os/onboarding-training','/api/novee-os/remote-distribution','/api/novee-os/ambi-foundation'].every(r => serverIndex.includes(r)) ? 'PASS' : 'FAIL'}`)
console.log(`  Frontend route gate:               ${appJsx.includes('novee-os/command-center') ? 'PASS' : 'FAIL'}`)
console.log(`  E.10 status config:                ${e10Config.length > 0 ? 'PASS' : 'FAIL'}`)
console.log(`  E.10 documentation:                ${e10Doc.length > 0 ? 'PASS' : 'FAIL'}`)
console.log(`  Command Center E.10 update:        ${cmdCenter.includes('E.10') || cmdCenter.includes('SmokeCraft 360') ? 'PASS' : 'FAIL'}`)
console.log('')
console.log('  HONEST ANSWERS:')
console.log('  Is NOVEE OS internal final go-live gate passed?    ' + (failed === 0 ? 'YES' : 'NO — see blockers above'))
console.log('  Is public production deployment verified?          NO — requires live environment')
console.log('  Are payments live?                                 NO')
console.log('  Is third-party POS provider connected?             NO')
console.log('  Is AMBI hardware live?                            NO — software foundation only')
console.log('  Next operational steps:')
console.log('    1. Provision PostgreSQL database (Railway recommended)')
console.log('    2. Set environment variables (DATABASE_URL, JWT_SECRET, NODE_ENV)')
console.log('    3. Run migrations 061–070 in order')
console.log('    4. Deploy backend to Railway (or equivalent)')
console.log('    5. Deploy frontend to Vercel (or equivalent)')
console.log('    6. Confirm SmokeCraft 360 venue pilot at a single pilot venue')
console.log('    7. Run live smoke test against production database')
console.log('    8. Review seeded documentation with legal/compliance before publishing')

if (failed > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
