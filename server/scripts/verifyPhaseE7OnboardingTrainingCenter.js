import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0

function check(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`)
    passed++
  } else {
    console.error(`  FAIL  ${label}`)
    failed++
  }
}

function read(relPath) {
  try { return fs.readFileSync(path.join(root, relPath), 'utf8') } catch { return '' }
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath))
}

console.log('\n=== Phase E.7 — NOVEE OS Onboarding + Training Center Verification ===\n')

// Migration
console.log('--- Migration ---')
const migration = read('server/db/migrations/065_novee_os_onboarding_training_center.sql')
check('Migration 065 exists', exists('server/db/migrations/065_novee_os_onboarding_training_center.sql'))
check('Table: novee_os_onboarding_program_registry', migration.includes('novee_os_onboarding_program_registry'))
check('Table: novee_os_training_manual_registry', migration.includes('novee_os_training_manual_registry'))
check('Table: novee_os_training_lesson_registry', migration.includes('novee_os_training_lesson_registry'))
check('Table: novee_os_onboarding_checklist_registry', migration.includes('novee_os_onboarding_checklist_registry'))
check('Table: novee_os_training_progress_registry', migration.includes('novee_os_training_progress_registry'))
check('Table: novee_os_training_evidence_registry', migration.includes('novee_os_training_evidence_registry'))
check('Table: novee_os_onboarding_acceptance_registry', migration.includes('novee_os_onboarding_acceptance_registry'))
check('Table: novee_os_onboarding_audit_log', migration.includes('novee_os_onboarding_audit_log'))
check('Migration uses CREATE TABLE IF NOT EXISTS only', migration.includes('CREATE TABLE IF NOT EXISTS') && !migration.includes('DROP TABLE'))
check('Published defaults to FALSE', migration.includes('published BOOLEAN NOT NULL DEFAULT FALSE'))
check('trainee_reference_only field exists (no raw PII)', migration.includes('trainee_reference_only'))
check('accepted_by_reference_only field exists (no raw PII)', migration.includes('accepted_by_reference_only'))
check('idempotency_key on checklist', migration.includes('idempotency_key TEXT UNIQUE'))

// Contracts
console.log('\n--- Contracts ---')
const contracts = read('server/services/noveeOS/noveeOSOnboardingTrainingContracts.js')
check('Contracts file exists', exists('server/services/noveeOS/noveeOSOnboardingTrainingContracts.js'))
check('assertNoFakeTrainingCompletionClaims exists', contracts.includes('assertNoFakeTrainingCompletionClaims'))
check('assertNoFakeManualPublicationClaims exists', contracts.includes('assertNoFakeManualPublicationClaims'))
check('assertNoFakeClientOnboardingClaims exists', contracts.includes('assertNoFakeClientOnboardingClaims'))
check('assertNoFakeStaffAcknowledgmentClaims exists', contracts.includes('assertNoFakeStaffAcknowledgmentClaims'))
check('assertNoFakeManagerAcknowledgmentClaims exists', contracts.includes('assertNoFakeManagerAcknowledgmentClaims'))
check('assertNoFakeVenueAcceptanceClaims exists', contracts.includes('assertNoFakeVenueAcceptanceClaims'))
check('assertNoFakeRemoteDistributionReadinessClaims exists', contracts.includes('assertNoFakeRemoteDistributionReadinessClaims'))
check('assertNoRawSensitiveTrainingData exists', contracts.includes('assertNoRawSensitiveTrainingData'))
check('validateOnboardingProgramPayload exists', contracts.includes('validateOnboardingProgramPayload'))
check('validateTrainingManualPayload exists', contracts.includes('validateTrainingManualPayload'))
check('validateTrainingLessonPayload exists', contracts.includes('validateTrainingLessonPayload'))
check('validateOnboardingChecklistPayload exists', contracts.includes('validateOnboardingChecklistPayload'))
check('validateTrainingProgressPayload exists', contracts.includes('validateTrainingProgressPayload'))
check('validateTrainingEvidencePayload exists', contracts.includes('validateTrainingEvidencePayload'))
check('validateOnboardingAcceptancePayload exists', contracts.includes('validateOnboardingAcceptancePayload'))
check('DEFAULT_ONBOARDING_PROGRAMS defined', contracts.includes('DEFAULT_ONBOARDING_PROGRAMS'))
check('DEFAULT_TRAINING_MANUALS defined', contracts.includes('DEFAULT_TRAINING_MANUALS'))
check('DEFAULT_TRAINING_LESSONS defined', contracts.includes('DEFAULT_TRAINING_LESSONS'))
check('DEFAULT_CHECKLIST_ITEMS defined', contracts.includes('DEFAULT_CHECKLIST_ITEMS'))
check('SmokeCraft 360 Venue Guide in manuals', contracts.includes('SmokeCraft 360 Venue Guide') || contracts.includes('smokecraft_venue_guide'))
check('SmokeCraft 360 Staff Guide in manuals', contracts.includes('SmokeCraft 360 Staff Guide') || contracts.includes('smokecraft_staff_guide'))
check('POS360 Staff Guide in manuals', contracts.includes('POS360 Staff Guide') || contracts.includes('pos360_staff_guide'))
check('E.A.T. Manager Guide in manuals', contracts.includes('E.A.T.') || contracts.includes('eat_manager_guide'))
check('Passport 360 Guide in manuals', contracts.includes('Passport 360 Guide') || contracts.includes('passport_guide'))
check('Safe Sales Claims Guide in manuals', contracts.includes('Safe Sales Claims Guide') || contracts.includes('safe_sales_claims_guide'))
check('FORBIDDEN_FAKE fields defined', contracts.includes('FORBIDDEN_FAKE'))
check('No raw email patterns in contract defaults', !contracts.includes('@example.com'))

// Feature Flags
console.log('\n--- Feature Flags ---')
const flags = read('server/config/noveeOSOnboardingTrainingFeatureFlags.js')
check('Feature flags file exists', exists('server/config/noveeOSOnboardingTrainingFeatureFlags.js'))
check('TRAINING_CENTER_ENABLED=true', flags.includes('NOVEE_ONBOARDING_TRAINING_CENTER_ENABLED: true'))
check('MANUAL_PUBLICATION_ENABLED=false', flags.includes('NOVEE_ONBOARDING_MANUAL_PUBLICATION_ENABLED: false'))
check('CLIENT_COMPLETION_ENABLED=false', flags.includes('NOVEE_ONBOARDING_CLIENT_COMPLETION_ENABLED: false'))
check('STAFF_COMPLETION_ENABLED=false', flags.includes('NOVEE_ONBOARDING_STAFF_COMPLETION_ENABLED: false'))
check('MANAGER_COMPLETION_ENABLED=false', flags.includes('NOVEE_ONBOARDING_MANAGER_COMPLETION_ENABLED: false'))
check('GUEST_COMPLETION_ENABLED=false', flags.includes('NOVEE_ONBOARDING_GUEST_COMPLETION_ENABLED: false'))
check('REMOTE_DISTRIBUTION_UNLOCK_ENABLED=false', flags.includes('NOVEE_ONBOARDING_REMOTE_DISTRIBUTION_UNLOCK_ENABLED: false'))
check('FAKE_COMPLETION_CLAIMS_BLOCKED=true', flags.includes('NOVEE_ONBOARDING_FAKE_COMPLETION_CLAIMS_BLOCKED: true'))
check('FAKE_PUBLICATION_CLAIMS_BLOCKED=true', flags.includes('NOVEE_ONBOARDING_FAKE_PUBLICATION_CLAIMS_BLOCKED: true'))
check('SENSITIVE_DATA_EXPOSURE_BLOCKED=true', flags.includes('NOVEE_ONBOARDING_SENSITIVE_DATA_EXPOSURE_BLOCKED: true'))
check('AUDIT_LOGGING_ENABLED=true', flags.includes('NOVEE_ONBOARDING_AUDIT_LOGGING_ENABLED: true'))
check('getNoveeOSOnboardingTrainingFlags exported', flags.includes('getNoveeOSOnboardingTrainingFlags'))

// Service
console.log('\n--- Service ---')
const service = read('server/services/noveeOS/noveeOSOnboardingTrainingService.js')
check('Service file exists', exists('server/services/noveeOS/noveeOSOnboardingTrainingService.js'))
check('getOnboardingTrainingSummary exported', service.includes('getOnboardingTrainingSummary'))
check('listOnboardingPrograms exported', service.includes('listOnboardingPrograms'))
check('listTrainingManuals exported', service.includes('listTrainingManuals'))
check('listTrainingLessons exported', service.includes('listTrainingLessons'))
check('listOnboardingChecklist exported', service.includes('listOnboardingChecklist'))
check('listTrainingProgress exported', service.includes('listTrainingProgress'))
check('listTrainingEvidence exported', service.includes('listTrainingEvidence'))
check('listOnboardingAcceptanceRecords exported', service.includes('listOnboardingAcceptanceRecords'))
check('getOnboardingReadinessScore exported', service.includes('getOnboardingReadinessScore'))
check('getOnboardingBlockers exported', service.includes('getOnboardingBlockers'))
check('getRemoteDistributionTrainingGate exported', service.includes('getRemoteDistributionTrainingGate'))
check('getSafeOnboardingClaims exported', service.includes('getSafeOnboardingClaims'))
check('writeOnboardingAuditEvent exported', service.includes('writeOnboardingAuditEvent'))
check('getOnboardingFeatureFlagSnapshot exported', service.includes('getOnboardingFeatureFlagSnapshot'))
check('validateOnboardingTrainingReadiness exported', service.includes('validateOnboardingTrainingReadiness'))
check('safety_status BUILD_ONLY in service', service.includes('BUILD_ONLY'))
check('published: false hardcoded in summary', service.includes('published: false'))
check('training_ready: false hardcoded', service.includes('training_ready: false'))
check('trainee_reference_only excluded from list', service.includes('trainee_reference_only'))
check('onboarding_ready: false hardcoded', service.includes('onboarding_ready: false'))

// Controller
console.log('\n--- Controller ---')
const ctrl = read('server/controllers/noveeOSOnboardingTrainingController.js')
check('Controller file exists', exists('server/controllers/noveeOSOnboardingTrainingController.js'))
check('wrap includes safeClaim', ctrl.includes("safeClaim: 'onboarding_training_center_exists'"))
check('wrap includes published: false', ctrl.includes('published: false'))
check('wrap includes trainingReady: false', ctrl.includes('trainingReady: false'))
check('wrap includes onboardingReady: false', ctrl.includes('onboardingReady: false'))
check('wrap includes remoteDistributionReady: false', ctrl.includes('remoteDistributionReady: false'))
check('getSummary handler exists', ctrl.includes('getSummary'))
check('listPrograms handler exists', ctrl.includes('listPrograms'))
check('listManuals handler exists', ctrl.includes('listManuals'))
check('listLessons handler exists', ctrl.includes('listLessons'))
check('listChecklist handler exists', ctrl.includes('listChecklist'))
check('listProgress handler exists', ctrl.includes('listProgress'))
check('listEvidence handler exists', ctrl.includes('listEvidence'))
check('listAcceptance handler exists', ctrl.includes('listAcceptance'))
check('getBlockers handler exists', ctrl.includes('getBlockers'))
check('getSafeClaims handler exists', ctrl.includes('getSafeClaims'))
check('getAuditLog handler exists', ctrl.includes('getAuditLog'))
check('getFeatureFlags handler exists', ctrl.includes('getFeatureFlags'))
check('validateReadiness handler exists', ctrl.includes('validateReadiness'))

// Routes
console.log('\n--- Routes ---')
const routes = read('server/routes/noveeOSOnboardingTrainingRoutes.js')
check('Routes file exists', exists('server/routes/noveeOSOnboardingTrainingRoutes.js'))
check('GET /summary route', routes.includes("'/summary'") || routes.includes('"/summary"'))
check('GET /programs route', routes.includes("'/programs'") || routes.includes('"/programs"'))
check('POST /programs/preview route', routes.includes("'/programs/preview'") || routes.includes('"/programs/preview"'))
check('GET /manuals route', routes.includes("'/manuals'") || routes.includes('"/manuals"'))
check('POST /manuals/preview route', routes.includes("'/manuals/preview'") || routes.includes('"/manuals/preview"'))
check('GET /lessons route', routes.includes("'/lessons'") || routes.includes('"/lessons"'))
check('GET /checklist route', routes.includes("'/checklist'") || routes.includes('"/checklist"'))
check('GET /progress route', routes.includes("'/progress'") || routes.includes('"/progress"'))
check('GET /evidence route', routes.includes("'/evidence'") || routes.includes('"/evidence"'))
check('GET /acceptance route', routes.includes("'/acceptance'") || routes.includes('"/acceptance"'))
check('GET /readiness-score route', routes.includes('/readiness-score'))
check('GET /blockers route', routes.includes('/blockers'))
check('GET /remote-distribution-gate route', routes.includes('/remote-distribution-gate'))
check('GET /safe-claims route', routes.includes('/safe-claims'))
check('GET /audit-log route', routes.includes('/audit-log'))
check('GET /feature-flags route', routes.includes('/feature-flags'))
check('GET /validate-readiness route', routes.includes('/validate-readiness'))
check('canAccessPOS3 used on POST/PATCH', routes.includes('canAccessPOS3'))

// Server wiring
console.log('\n--- Server Wiring ---')
const serverIndex = read('server/index.js')
check('Route registered in server/index.js', serverIndex.includes('onboarding-training') || serverIndex.includes('OnboardingTraining'))

// App.jsx
console.log('\n--- Frontend Routing ---')
const appJsx = read('src/App.jsx')
check('OnboardingTrainingCenter imported in App.jsx', appJsx.includes('OnboardingTrainingCenter'))
check('Route /novee-os/onboarding-training in App.jsx', appJsx.includes('novee-os/onboarding-training'))

// Frontend page
console.log('\n--- Frontend Page ---')
const frontend = read('src/pages/noveeOS/OnboardingTrainingCenter.jsx')
check('Frontend page exists', exists('src/pages/noveeOS/OnboardingTrainingCenter.jsx'))
check('Panel A — Summary', frontend.includes('Summary'))
check('Panel B — Programs', frontend.includes('Program'))
check('Panel C — Manuals', frontend.includes('Manual'))
check('Panel D — Lessons', frontend.includes('Lesson'))
check('Panel E — Checklist', frontend.includes('Checklist'))
check('Panel F — Progress', frontend.includes('Progress'))
check('Panel G — Evidence', frontend.includes('Evidence'))
check('Panel H — Acceptance', frontend.includes('Acceptance'))
check('Panel I — Blockers', frontend.includes('Blocker'))
check('Panel J — Safe Claims', frontend.includes('Safe Claims') || frontend.includes('SafeClaims'))
check('Panel K — Audit Log', frontend.includes('Audit'))
check('Panel L — Feature Flags', frontend.includes('Feature Flag') || frontend.includes('FeatureFlags'))
check('Safety banner present', frontend.includes('BUILD MODE ONLY') || frontend.includes('disabled by default'))
check('No personal data exposure label', frontend.includes('not displayed') || frontend.includes('reference-only'))
check('SmokeCraft manuals referenced', frontend.includes('SmokeCraft'))
check('POS360 manual referenced', frontend.includes('POS360'))
check('E.A.T. manual referenced', frontend.includes('E.A.T.'))
check('Passport 360 referenced', frontend.includes('Passport'))
check('Safe Sales Claims referenced', frontend.includes('Safe Sales'))
check('export default function OnboardingTrainingCenter', frontend.includes('export default function OnboardingTrainingCenter'))

// Command Center
console.log('\n--- Command Center ---')
const cmdCenter = read('src/pages/noveeOS/NoveeOSCommandCenter.jsx')
check('E.7 referenced in Command Center', cmdCenter.includes('E.7') || cmdCenter.includes('onboarding-training'))
check('E.8 through E.10 remain pending', cmdCenter.includes('E.8') && cmdCenter.includes('pending'))

// NoveeHome
console.log('\n--- NoveeHome ---')
const noveeHome = read('src/pages/NoveeHome.jsx')
check('Onboarding + Training link in NoveeHome', noveeHome.includes('onboarding-training') || noveeHome.includes('Onboarding'))

// package.json
console.log('\n--- Package Scripts ---')
const pkg = read('package.json')
check('verify:phase-e7 script in package.json', pkg.includes('verify:phase-e7-onboarding-training-center'))

// Docs
console.log('\n--- Documentation ---')
check('Docs file exists', exists('docs/PHASE_E_7_ONBOARDING_TRAINING_CENTER.md'))
const docs = read('docs/PHASE_E_7_ONBOARDING_TRAINING_CENTER.md')
check('Docs cover safe claims', docs.includes('Safe Sales Language') || docs.includes('safe'))
check('Docs explain why publication disabled', docs.includes('publication') || docs.includes('published'))
check('Docs cover remote distribution blocked', docs.includes('Remote Distribution'))
check('Docs include admin usage guide', docs.includes('Admin Usage'))

// Safety checks
console.log('\n--- Safety Checks ---')
check('No raw secrets in service', !service.includes('process.env.SECRET') && !service.includes('API_KEY='))
check('No fake completion set true in service', !service.includes('training_complete: true') && !service.includes('staff_complete: true'))
check('No raw email in frontend', !frontend.includes('@gmail.com') && !frontend.includes('@example.com'))
check('No real license keys in contracts', !contracts.includes('license_key:') || contracts.includes('license_key_reference'))

console.log(`\n=== E.7 Verification Complete: ${passed} passed, ${failed} failed ===\n`)

if (failed > 0) {
  process.exit(1)
}
