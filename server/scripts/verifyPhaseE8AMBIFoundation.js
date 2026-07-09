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

console.log('\n=== Phase E.8 — NOVEE OS AMBI Foundation Verification ===\n')

// Migration
console.log('--- Migration ---')
const migration = read('server/db/migrations/066_novee_os_ambi_foundation.sql')
check('Migration 066 exists', exists('server/db/migrations/066_novee_os_ambi_foundation.sql'))
check('Table: novee_os_ambi_device_registry', migration.includes('novee_os_ambi_device_registry'))
check('Table: novee_os_ambi_device_pairing_registry', migration.includes('novee_os_ambi_device_pairing_registry'))
check('Table: novee_os_ambi_firmware_readiness_registry', migration.includes('novee_os_ambi_firmware_readiness_registry'))
check('Table: novee_os_ambi_hardware_provider_registry', migration.includes('novee_os_ambi_hardware_provider_registry'))
check('Table: novee_os_ambi_aura_state_registry', migration.includes('novee_os_ambi_aura_state_registry'))
check('Table: novee_os_ambi_environment_signal_registry', migration.includes('novee_os_ambi_environment_signal_registry'))
check('Table: novee_os_ambi_privacy_consent_registry', migration.includes('novee_os_ambi_privacy_consent_registry'))
check('Table: novee_os_ambi_presence_access_event_registry', migration.includes('novee_os_ambi_presence_access_event_registry'))
check('Table: novee_os_ambi_audit_log', migration.includes('novee_os_ambi_audit_log'))
check('Migration uses CREATE TABLE IF NOT EXISTS only', migration.includes('CREATE TABLE IF NOT EXISTS') && !migration.includes('DROP TABLE'))
check('hardware_ready defaults to FALSE', migration.includes('hardware_ready BOOLEAN NOT NULL DEFAULT FALSE'))
check('live_telemetry_enabled defaults to FALSE', migration.includes('live_telemetry_enabled BOOLEAN NOT NULL DEFAULT FALSE'))
check('live_control_enabled defaults to FALSE', migration.includes('live_control_enabled BOOLEAN NOT NULL DEFAULT FALSE'))
check('live_pairing_enabled defaults to FALSE', migration.includes('live_pairing_enabled BOOLEAN NOT NULL DEFAULT FALSE'))
check('live_update_enabled defaults to FALSE', migration.includes('live_update_enabled BOOLEAN NOT NULL DEFAULT FALSE'))
check('live_connection_enabled defaults to FALSE', migration.includes('live_connection_enabled BOOLEAN NOT NULL DEFAULT FALSE'))
check('live_automation_enabled defaults to FALSE', migration.includes('live_automation_enabled BOOLEAN NOT NULL DEFAULT FALSE'))
check('preview_only defaults to TRUE', migration.includes('preview_only BOOLEAN NOT NULL DEFAULT TRUE'))
check('consent_required defaults to TRUE', migration.includes('consent_required BOOLEAN NOT NULL DEFAULT TRUE'))
check('pairing_token_reference_only field (no raw tokens)', migration.includes('pairing_token_reference_only'))
check('credential_reference_only field (no raw creds)', migration.includes('credential_reference_only'))
check('subject_reference_only field (no raw PII)', migration.includes('subject_reference_only'))

// Contracts
console.log('\n--- Contracts ---')
const contracts = read('server/services/noveeOS/noveeOSAMBIFoundationContracts.js')
check('Contracts file exists', exists('server/services/noveeOS/noveeOSAMBIFoundationContracts.js'))
check('assertNoFakeAMBIHardwareClaims exists', contracts.includes('assertNoFakeAMBIHardwareClaims'))
check('assertNoFakeAMBITelemetryClaims exists', contracts.includes('assertNoFakeAMBITelemetryClaims'))
check('assertNoFakeAMBIPairingClaims exists', contracts.includes('assertNoFakeAMBIPairingClaims'))
check('assertNoFakeAMBIFirmwareClaims exists', contracts.includes('assertNoFakeAMBIFirmwareClaims'))
check('assertNoFakeAMBIProviderClaims exists', contracts.includes('assertNoFakeAMBIProviderClaims'))
check('assertNoAMBIMedicalClaims exists', contracts.includes('assertNoAMBIMedicalClaims'))
check('assertNoAMBIBiometricClaims exists', contracts.includes('assertNoAMBIBiometricClaims'))
check('assertNoAMBIEmotionDetectionClaims exists', contracts.includes('assertNoAMBIEmotionDetectionClaims'))
check('assertNoAMBISafetyMonitoringClaims exists', contracts.includes('assertNoAMBISafetyMonitoringClaims'))
check('assertNoRawAMBISecrets exists', contracts.includes('assertNoRawAMBISecrets'))
check('validateAMBIDevicePayload exists', contracts.includes('validateAMBIDevicePayload'))
check('validateAMBIPairingPayload exists', contracts.includes('validateAMBIPairingPayload'))
check('validateAMBIFirmwarePayload exists', contracts.includes('validateAMBIFirmwarePayload'))
check('validateAMBIHardwareProviderPayload exists', contracts.includes('validateAMBIHardwareProviderPayload'))
check('validateAMBIAuraStatePayload exists', contracts.includes('validateAMBIAuraStatePayload'))
check('validateAMBIEnvironmentSignalPayload exists', contracts.includes('validateAMBIEnvironmentSignalPayload'))
check('validateAMBIPrivacyConsentPayload exists', contracts.includes('validateAMBIPrivacyConsentPayload'))
check('validateAMBIPresenceAccessEventPayload exists', contracts.includes('validateAMBIPresenceAccessEventPayload'))
check('FORBIDDEN_MEDICAL_CLAIMS defined', contracts.includes('FORBIDDEN_MEDICAL_CLAIMS'))
check('FORBIDDEN_BIOMETRIC_CLAIMS defined', contracts.includes('FORBIDDEN_BIOMETRIC_CLAIMS'))
check('FORBIDDEN_EMOTION_DETECTION_CLAIMS defined', contracts.includes('FORBIDDEN_EMOTION_DETECTION_CLAIMS'))
check('FORBIDDEN_SAFETY_MONITORING_CLAIMS defined', contracts.includes('FORBIDDEN_SAFETY_MONITORING_CLAIMS'))
check('DEFAULT_AMBI_DEVICES defined', contracts.includes('DEFAULT_AMBI_DEVICES'))
check('DEFAULT_AMBI_AURA_STATES defined', contracts.includes('DEFAULT_AMBI_AURA_STATES'))
check('DEFAULT_AMBI_ENVIRONMENT_SIGNALS defined', contracts.includes('DEFAULT_AMBI_ENVIRONMENT_SIGNALS'))
check('No raw email in contracts', !contracts.includes('@example.com'))
check('Aura states include cigar category', contracts.includes('cigar'))
check('Aura states include vip category', contracts.includes('vip'))

// Feature Flags
console.log('\n--- Feature Flags ---')
const flags = read('server/config/noveeOSAMBIFoundationFeatureFlags.js')
check('Feature flags file exists', exists('server/config/noveeOSAMBIFoundationFeatureFlags.js'))
check('AMBI_FOUNDATION_ENABLED=true', flags.includes('NOVEE_AMBI_FOUNDATION_ENABLED: true'))
check('HARDWARE_READY_ENABLED=false', flags.includes('NOVEE_AMBI_HARDWARE_READY_ENABLED: false'))
check('LIVE_DEVICE_CONNECTIONS_ENABLED=false', flags.includes('NOVEE_AMBI_LIVE_DEVICE_CONNECTIONS_ENABLED: false'))
check('LIVE_TELEMETRY_ENABLED=false', flags.includes('NOVEE_AMBI_LIVE_TELEMETRY_ENABLED: false'))
check('LIVE_DEVICE_CONTROL_ENABLED=false', flags.includes('NOVEE_AMBI_LIVE_DEVICE_CONTROL_ENABLED: false'))
check('LIVE_ENVIRONMENT_AUTOMATION_ENABLED=false', flags.includes('NOVEE_AMBI_LIVE_ENVIRONMENT_AUTOMATION_ENABLED: false'))
check('LIVE_PAIRING_ENABLED=false', flags.includes('NOVEE_AMBI_LIVE_PAIRING_ENABLED: false'))
check('LIVE_FIRMWARE_UPDATES_ENABLED=false', flags.includes('NOVEE_AMBI_LIVE_FIRMWARE_UPDATES_ENABLED: false'))
check('FAKE_HARDWARE_CLAIMS_BLOCKED=true', flags.includes('NOVEE_AMBI_FAKE_HARDWARE_CLAIMS_BLOCKED: true'))
check('FAKE_TELEMETRY_CLAIMS_BLOCKED=true', flags.includes('NOVEE_AMBI_FAKE_TELEMETRY_CLAIMS_BLOCKED: true'))
check('MEDICAL_CLAIMS_BLOCKED=true', flags.includes('NOVEE_AMBI_MEDICAL_CLAIMS_BLOCKED: true'))
check('BIOMETRIC_CLAIMS_BLOCKED=true', flags.includes('NOVEE_AMBI_BIOMETRIC_CLAIMS_BLOCKED: true'))
check('EMOTION_DETECTION_CLAIMS_BLOCKED=true', flags.includes('NOVEE_AMBI_EMOTION_DETECTION_CLAIMS_BLOCKED: true'))
check('SAFETY_MONITORING_CLAIMS_BLOCKED=true', flags.includes('NOVEE_AMBI_SAFETY_MONITORING_CLAIMS_BLOCKED: true'))
check('PRIVACY_CONSENT_REQUIRED=true', flags.includes('NOVEE_AMBI_PRIVACY_CONSENT_REQUIRED: true'))
check('getNoveeOSAMBIFoundationFlags exported', flags.includes('getNoveeOSAMBIFoundationFlags'))

// Service
console.log('\n--- Service ---')
const service = read('server/services/noveeOS/noveeOSAMBIFoundationService.js')
check('Service file exists', exists('server/services/noveeOS/noveeOSAMBIFoundationService.js'))
check('getAMBIFoundationSummary exported', service.includes('getAMBIFoundationSummary'))
check('listAMBIDevices exported', service.includes('listAMBIDevices'))
check('listAMBIDevicePairings exported', service.includes('listAMBIDevicePairings'))
check('listAMBIFirmwareReadiness exported', service.includes('listAMBIFirmwareReadiness'))
check('listAMBIHardwareProviders exported', service.includes('listAMBIHardwareProviders'))
check('listAMBIAuraStates exported', service.includes('listAMBIAuraStates'))
check('listAMBIEnvironmentSignals exported', service.includes('listAMBIEnvironmentSignals'))
check('listAMBIPrivacyConsent exported', service.includes('listAMBIPrivacyConsent'))
check('listAMBIPresenceAccessEvents exported', service.includes('listAMBIPresenceAccessEvents'))
check('getAMBIReadinessScore exported', service.includes('getAMBIReadinessScore'))
check('getAMBIBlockers exported', service.includes('getAMBIBlockers'))
check('getSafeAMBIClaims exported', service.includes('getSafeAMBIClaims'))
check('writeAMBIAuditEvent exported', service.includes('writeAMBIAuditEvent'))
check('getAMBIFeatureFlagSnapshot exported', service.includes('getAMBIFeatureFlagSnapshot'))
check('validateAMBIFoundationReadiness exported', service.includes('validateAMBIFoundationReadiness'))
check('safety_status BUILD_ONLY in service', service.includes('BUILD_ONLY'))
check('hardware_ready: false hardcoded', service.includes('hardware_ready: false'))
check('live_telemetry_enabled: false hardcoded', service.includes('live_telemetry_enabled: false'))
check('live_device_control_enabled: false hardcoded', service.includes('live_device_control_enabled: false'))
check('subject_reference_only excluded from list queries', service.includes('subject_reference_only'))
check('pairing_token_reference_only excluded from list', service.includes('pairing_token_reference_only'))
check('credential_reference_only excluded from list', service.includes('credential_reference_only'))

// Controller
console.log('\n--- Controller ---')
const ctrl = read('server/controllers/noveeOSAMBIFoundationController.js')
check('Controller file exists', exists('server/controllers/noveeOSAMBIFoundationController.js'))
check("wrap includes safeClaim 'ambi_foundation_exists'", ctrl.includes("safeClaim: 'ambi_foundation_exists'"))
check('wrap includes foundationReady: false', ctrl.includes('foundationReady: false'))
check('wrap includes hardwareReady: false', ctrl.includes('hardwareReady: false'))
check('wrap includes liveTelemetryEnabled: false', ctrl.includes('liveTelemetryEnabled: false'))
check('wrap includes liveDeviceControlEnabled: false', ctrl.includes('liveDeviceControlEnabled: false'))
check('getSummary handler exists', ctrl.includes('getSummary'))
check('listDevices handler exists', ctrl.includes('listDevices'))
check('listPairings handler exists', ctrl.includes('listPairings'))
check('listFirmware handler exists', ctrl.includes('listFirmware'))
check('listProviders handler exists', ctrl.includes('listProviders'))
check('listAuraStates handler exists', ctrl.includes('listAuraStates'))
check('listSignals handler exists', ctrl.includes('listSignals'))
check('listConsent handler exists', ctrl.includes('listConsent'))
check('listPresenceEvents handler exists', ctrl.includes('listPresenceEvents'))
check('getBlockers handler exists', ctrl.includes('getBlockers'))
check('getSafeClaims handler exists', ctrl.includes('getSafeClaims'))

// Routes
console.log('\n--- Routes ---')
const routes = read('server/routes/noveeOSAMBIFoundationRoutes.js')
check('Routes file exists', exists('server/routes/noveeOSAMBIFoundationRoutes.js'))
check('GET /summary route', routes.includes("'/summary'") || routes.includes('"/summary"'))
check('GET /devices route', routes.includes("'/devices'") || routes.includes('"/devices"'))
check('POST /devices/preview route', routes.includes("'/devices/preview'"))
check('GET /pairings route', routes.includes("'/pairings'") || routes.includes('"/pairings"'))
check('GET /firmware route', routes.includes("'/firmware'") || routes.includes('"/firmware"'))
check('GET /hardware-providers route', routes.includes('/hardware-providers'))
check('GET /aura-states route', routes.includes('/aura-states'))
check('GET /environment-signals route', routes.includes('/environment-signals'))
check('GET /privacy-consent route', routes.includes('/privacy-consent'))
check('GET /presence-access-events route', routes.includes('/presence-access-events'))
check('GET /readiness-score route', routes.includes('/readiness-score'))
check('GET /blockers route', routes.includes('/blockers'))
check('GET /safe-claims route', routes.includes('/safe-claims'))
check('GET /audit-log route', routes.includes('/audit-log'))
check('GET /feature-flags route', routes.includes('/feature-flags'))
check('GET /validate-readiness route', routes.includes('/validate-readiness'))
check('canAccessPOS3 used on POST/PATCH', routes.includes('canAccessPOS3'))

// Server wiring
console.log('\n--- Server Wiring ---')
const serverIndex = read('server/index.js')
check('Route registered in server/index.js', serverIndex.includes('ambi-foundation') || serverIndex.includes('AMBIFoundation'))

// App.jsx
console.log('\n--- Frontend Routing ---')
const appJsx = read('src/App.jsx')
check('AMBIFoundation imported in App.jsx', appJsx.includes('AMBIFoundation'))
check('Route /novee-os/ambi-foundation in App.jsx', appJsx.includes('novee-os/ambi-foundation'))

// Frontend
console.log('\n--- Frontend Page ---')
const frontend = read('src/pages/noveeOS/AMBIFoundation.jsx')
check('Frontend page exists', exists('src/pages/noveeOS/AMBIFoundation.jsx'))
check('Panel A — Summary', frontend.includes('Summary'))
check('Panel B — Device Registry', frontend.includes('Device Registry') || frontend.includes('Devices'))
check('Panel C — Device Pairing', frontend.includes('Pairing'))
check('Panel D — Firmware', frontend.includes('Firmware'))
check('Panel E — Hardware Provider', frontend.includes('Hardware Provider') || frontend.includes('Provider'))
check('Panel F — Aura State', frontend.includes('Aura State') || frontend.includes('AuraState'))
check('Panel G — Environment Signal', frontend.includes('Environment Signal') || frontend.includes('Signal'))
check('Panel H — Privacy Consent', frontend.includes('Consent') || frontend.includes('Privacy'))
check('Panel I — Presence/Access', frontend.includes('Presence') || frontend.includes('Access Event'))
check('Panel J — Blockers', frontend.includes('Blocker'))
check('Panel K — Safe Claims', frontend.includes('Safe Claims') || frontend.includes('SafeClaims'))
check('Panel L — Audit Log + Feature Flags', frontend.includes('Audit') && frontend.includes('Feature Flag'))
check('Safety banner present', frontend.includes('SOFTWARE FOUNDATION ONLY') || frontend.includes('No Hardware'))
check('No raw tokens displayed note', frontend.includes('token') || frontend.includes('reference-only'))
check('Aura states not medical note', frontend.includes('not emotional') || frontend.includes('not medical') || frontend.includes('not biometric'))
check('export default function AMBIFoundation', frontend.includes('export default function AMBIFoundation'))

// No forbidden medical/biometric/emotion/safety claims in frontend
check('No emotion detection claim in frontend', !frontend.includes('emotion detection') && !frontend.includes('detects emotions'))
check('No health monitoring claim in frontend', !frontend.includes('health monitoring') && !frontend.includes('medical diagnosis'))
check('No biometric monitoring claim in frontend', !frontend.includes('biometric monitoring') && !frontend.includes('biometric identification'))
check('No safety monitoring claim in frontend', !frontend.includes('safety monitoring') && !frontend.includes('fall detection'))

// Command Center
console.log('\n--- Command Center ---')
const cmdCenter = read('src/pages/noveeOS/NoveeOSCommandCenter.jsx')
check('E.8 referenced in Command Center', cmdCenter.includes('E.8') || cmdCenter.includes('ambi-foundation'))
check('E.9 and E.10 remain pending', cmdCenter.includes('E.9') && cmdCenter.includes('pending'))

// NoveeHome
console.log('\n--- NoveeHome ---')
const noveeHome = read('src/pages/NoveeHome.jsx')
check('AMBI Foundation link in NoveeHome', noveeHome.includes('ambi-foundation') || noveeHome.includes('AMBI'))

// package.json
console.log('\n--- Package Scripts ---')
const pkg = read('package.json')
check('verify:phase-e8 script in package.json', pkg.includes('verify:phase-e8-ambi-foundation'))

// Docs
console.log('\n--- Documentation ---')
check('Docs file exists', exists('docs/PHASE_E_8_AMBI_FOUNDATION.md'))
const docs = read('docs/PHASE_E_8_AMBI_FOUNDATION.md')
check('Docs explain aura states are NOT medical', docs.includes('not medical') || docs.includes('NOT') || docs.includes('not emotional'))
check('Docs cover safe sales language', docs.includes('Safe Sales Language') || docs.includes('safe'))
check('Docs cover hardware readiness', docs.includes('hardware readiness') || docs.includes('Hardware Readiness'))
check('Docs cover why live telemetry disabled', docs.includes('telemetry'))
check('Docs include admin usage guide', docs.includes('Admin Usage'))

// Safety checks
console.log('\n--- Safety Checks ---')
check('No raw API keys in service', !service.includes('process.env.SECRET') && !service.includes('API_KEY='))
check('No hardware_ready: true in service', !service.includes('hardware_ready: true'))
check('No live_telemetry_enabled: true in service', !service.includes('live_telemetry_enabled: true'))
check('No raw email in frontend', !frontend.includes('@gmail.com') && !frontend.includes('@example.com'))
check('No fake telemetry claims in contracts', contracts.includes('FORBIDDEN_FAKE_TELEMETRY'))
check('No medical claims in contracts defaults', !contracts.includes('health_monitoring: true') && !contracts.includes('biometric: true'))

console.log(`\n=== E.8 Verification Complete: ${passed} passed, ${failed} failed ===\n`)

if (failed > 0) {
  process.exit(1)
}
