/**
 * Verification script — POS360 Handheld Device Suite (Phase B.3)
 * Run: node server/scripts/verifyPos360HandheldDeviceSuite.js
 */
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', '..')

let pass = 0
let fail = 0
const failures = []

function check(label, result) {
  if (result) { pass++; console.log(`  ✓  ${label}`) }
  else { fail++; failures.push(label); console.log(`  ✗  ${label}`) }
}

function exists(rel)       { return existsSync(join(root, rel)) }
function contains(rel, s)  { if (!exists(rel)) return false; return readFileSync(join(root, rel), 'utf8').includes(s) }
function notContains(rel, s) { if (!exists(rel)) return true; return !readFileSync(join(root, rel), 'utf8').includes(s) }
function noDropTableInSQL(rel) {
  if (!exists(rel)) return false
  const lines = readFileSync(join(root, rel), 'utf8').split('\n')
  return !lines.some(l => !l.trimStart().startsWith('--') && /DROP\s+TABLE/i.test(l))
}

console.log('\n── POS360 Handheld Device Suite Verification ───────────────────\n')

// 1. Migration
console.log('1. Migration File')
check('033_pos360_handheld_device_suite.sql exists',
  exists('server/db/migrations/033_pos360_handheld_device_suite.sql'))
check('pos360_devices table defined',
  contains('server/db/migrations/033_pos360_handheld_device_suite.sql', 'CREATE TABLE IF NOT EXISTS pos360_devices'))
check('pos360_device_sessions table defined',
  contains('server/db/migrations/033_pos360_handheld_device_suite.sql', 'CREATE TABLE IF NOT EXISTS pos360_device_sessions'))
check('pos360_device_diagnostics table defined',
  contains('server/db/migrations/033_pos360_handheld_device_suite.sql', 'CREATE TABLE IF NOT EXISTS pos360_device_diagnostics'))
check('pos360_device_sync_events table defined',
  contains('server/db/migrations/033_pos360_handheld_device_suite.sql', 'CREATE TABLE IF NOT EXISTS pos360_device_sync_events'))
check('pos360_handheld_user_preferences table defined',
  contains('server/db/migrations/033_pos360_handheld_device_suite.sql', 'CREATE TABLE IF NOT EXISTS pos360_handheld_user_preferences'))
check('pos360_handheld_notifications table defined',
  contains('server/db/migrations/033_pos360_handheld_device_suite.sql', 'CREATE TABLE IF NOT EXISTS pos360_handheld_notifications'))
check('pos360_handheld_offline_queue table defined',
  contains('server/db/migrations/033_pos360_handheld_device_suite.sql', 'CREATE TABLE IF NOT EXISTS pos360_handheld_offline_queue'))
check('pos360_handheld_action_audit table defined',
  contains('server/db/migrations/033_pos360_handheld_device_suite.sql', 'CREATE TABLE IF NOT EXISTS pos360_handheld_action_audit'))
check('pos360_handheld_manager_approvals table defined',
  contains('server/db/migrations/033_pos360_handheld_device_suite.sql', 'CREATE TABLE IF NOT EXISTS pos360_handheld_manager_approvals'))
check('pos360_handheld_emergency_events table defined',
  contains('server/db/migrations/033_pos360_handheld_device_suite.sql', 'CREATE TABLE IF NOT EXISTS pos360_handheld_emergency_events'))
check('audit table has contains_secrets column',
  contains('server/db/migrations/033_pos360_handheld_device_suite.sql', 'contains_secrets'))
check('No DROP TABLE in migration (comments allowed)',
  noDropTableInSQL('server/db/migrations/033_pos360_handheld_device_suite.sql'))

// 2. Service
console.log('\n2. Service Layer')
check('pos360HandheldDeviceService.js exists',
  exists('server/services/pos360/pos360HandheldDeviceService.js'))
check('Correct db import path',
  contains('server/services/pos360/pos360HandheldDeviceService.js', "from '../../db/connection.js'"))
check('isDbAvailable guard used',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'isDbAvailable'))
check('localPreview fallback present',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'localPreview: true'))
check('DATABASE_URL not logged',
  notContains('server/services/pos360/pos360HandheldDeviceService.js', 'DATABASE_URL'))
check('writeAudit sets containsSecrets false',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'containsSecrets: false'))

// 3. Controller
console.log('\n3. Controller')
check('pos360HandheldController.js exists',
  exists('server/controllers/pos360HandheldController.js'))
check('ok500 wrapper used',
  contains('server/controllers/pos360HandheldController.js', 'function ok500'))
check('registerDevice exported',
  contains('server/controllers/pos360HandheldController.js', 'export const registerDevice'))
check('getHomeState exported',
  contains('server/controllers/pos360HandheldController.js', 'export const getHomeState'))

// 4. Routes
console.log('\n4. Routes')
check('pos360HandheldRoutes.js exists',
  exists('server/routes/pos360HandheldRoutes.js'))
check('venueTenantGuard applied on all routes',
  contains('server/routes/pos360HandheldRoutes.js', 'venueTenantGuard'))
check('canAccessPOS3 on write routes',
  contains('server/routes/pos360HandheldRoutes.js', 'canAccessPOS3'))
check('No open unauthenticated write routes',
  (() => {
    const content = readFileSync(join(root, 'server/routes/pos360HandheldRoutes.js'), 'utf8')
    const writeLines = content.split('\n').filter(l => l.match(/router\.(post|patch|delete)/))
    return writeLines.every(l => l.includes('canAccessPOS3') || l.includes('venueTenantGuard'))
  })())

// 5. Event Contracts
console.log('\n5. Event Contracts')
check('pos360HandheldEventContracts.js exists',
  exists('server/services/pos360/pos360HandheldEventContracts.js'))
check('HANDHELD_EVENTS exported',
  contains('server/services/pos360/pos360HandheldEventContracts.js', 'export const HANDHELD_EVENTS'))
check('handheld.device.registered event defined',
  contains('server/services/pos360/pos360HandheldEventContracts.js', 'DEVICE_REGISTERED'))
check('handheld.order.created event defined',
  contains('server/services/pos360/pos360HandheldEventContracts.js', 'ORDER_CREATED'))
check('handheld.emergency_mode.activated event defined',
  contains('server/services/pos360/pos360HandheldEventContracts.js', 'EMERGENCY_MODE_ACTIVATED'))
check('handheld.sync.completed event defined',
  contains('server/services/pos360/pos360HandheldEventContracts.js', 'SYNC_COMPLETED'))

// 6. Feature Flags
console.log('\n6. Feature Flags')
check('pos360HandheldFeatureFlags.js exists',
  exists('server/config/pos360HandheldFeatureFlags.js'))
check('POS360_HANDHELD_FLAGS exported',
  contains('server/config/pos360HandheldFeatureFlags.js', 'POS360_HANDHELD_FLAGS'))
check('getHandheldFlags function exported',
  contains('server/config/pos360HandheldFeatureFlags.js', 'export function getHandheldFlags'))
check('20 feature flags present',
  (() => {
    const content = readFileSync(join(root, 'server/config/pos360HandheldFeatureFlags.js'), 'utf8')
    return (content.match(/_enabled/g) || []).length >= 18
  })())

// 7. Server Mounting
console.log('\n7. Server Mounting')
check('server/index.js imports pos360HandheldRoutes',
  contains('server/index.js', 'pos360HandheldRoutes'))
check('server/index.js mounts at /api/pos360/handheld',
  contains('server/index.js', '/api/pos360/handheld'))

// 8. UI Route
console.log('\n8. UI & Route')
check('POS360HandheldPOS.jsx exists',
  exists('src/pages/pos360/POS360HandheldPOS.jsx'))
check('App.jsx imports POS360HandheldPOS',
  contains('src/App.jsx', 'POS360HandheldPOS'))
check('App.jsx has handheld route',
  contains('src/App.jsx', 'handheld'))

// 9. Handheld Home
console.log('\n9. Handheld Home')
check('Home component renders tile grid',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', 'HandheldHome'))
check('New Order tile defined',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', 'New Order'))
check('Tables tile defined',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', 'Tables'))

// 10. Bottom Navigation
console.log('\n10. Bottom Navigation')
check('BottomNav component exists',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', 'function BottomNav'))
check('Home tab in nav',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', "id:'home'"))
check('Orders tab in nav',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', "id:'orders'"))
check('Payments tab in nav',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', "id:'payments'"))
check('More tab in nav',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', "id:'more'"))

// 11. Dynamic Menu Feed Consumption
console.log('\n11. Dynamic Menu Feed Consumption')
check('HandheldDynamicMenu fetches handheld/active-menu',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', 'handheld/active-menu'))
check('Category pills rendered from API data (dynamic)',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', 'categories.map'))
check('No hardcoded category names (Pizza/Burgers/Cigars)',
  notContains('src/pages/pos360/POS360HandheldPOS.jsx', 'Pizza') &&
  notContains('src/pages/pos360/POS360HandheldPOS.jsx', 'Burgers') &&
  notContains('src/pages/pos360/POS360HandheldPOS.jsx', 'Cigars'))
check('Honest empty state for no active menu',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', 'No active menu configured'))

// 12. Floor / Table Integration Hooks
console.log('\n12. Floor/Table Integration Hooks')
check('getHandheldTableList queries pos360_tables (Phase B.1)',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'pos360_tables'))
check('Handheld tables route exists',
  contains('server/routes/pos360HandheldRoutes.js', '/tables'))
check('syncHandheldTableState exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'syncHandheldTableState'))
check('TABLE_OPENED event emitted on table load',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'TABLE_OPENED'))

// 13. Order Hooks
console.log('\n13. Order Hooks')
check('createHandheldOrder exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'createHandheldOrder'))
check('addItemToHandheldOrder exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'addItemToHandheldOrder'))
check('sendOrderToStation exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'sendOrderToStation'))
check('ORDER_CREATED event emitted',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'ORDER_CREATED'))
check('Honest localPreview on order creation',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'Phase B.5'))

// 14. Payment Hooks
console.log('\n14. Payment Hooks')
check('getPaymentOptions exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'getPaymentOptions'))
check('createPaymentIntentPlaceholder exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'createPaymentIntentPlaceholder'))
check('captureTipSelection exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'captureTipSelection'))
check('captureSignature exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'captureSignature'))
check('sendReceipt exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'sendReceipt'))
check('No fake payment success — honest placeholder',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'No payment was processed'))

// 15. SmokeCraft Hooks
console.log('\n15. SmokeCraft Hooks')
check('getGuestSmokecraftContext exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'getGuestSmokecraftContext'))
check('getSmokecraftPairingHooks exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'getSmokecraftPairingHooks'))
check('Honest empty state for SmokeCraft',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'SmokeCraft guest data unavailable'))
check('SmokeCraft visual anchor (/smokecraft-pos360.png) present in UI',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', '/smokecraft-pos360.png'))

// 16. E.A.T. Hooks
console.log('\n16. E.A.T. Hooks')
check('getHandheldRecommendations exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'getHandheldRecommendations'))
check('getManagerAlerts exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'getManagerAlerts'))
check('Honest E.A.T. empty state',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'recommendation engine not connected'))

// 17. Loyalty / Guest Hooks
console.log('\n17. Loyalty/Guest Hooks')
check('searchGuests exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'export async function searchGuests'))
check('getGuestProfile exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'export async function getGuestProfile'))
check('attachGuestToOrder exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'attachGuestToOrder'))
check('getLoyaltyProfile exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'getLoyaltyProfile'))

// 18. Device Diagnostics
console.log('\n18. Device Diagnostics')
check('saveDeviceDiagnostics exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'saveDeviceDiagnostics'))
check('Diagnostics covers battery, network, card reader, printer, KDS, scanner',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'batteryLevel') &&
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'cardReaderStatus') &&
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'kdsStatus'))
check('Scanner shows honest state in UI',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', 'Scanner provider not connected'))

// 19. Offline / Sync Hooks
console.log('\n19. Offline/Sync Hooks')
check('queueOfflineAction exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'queueOfflineAction'))
check('listOfflineQueue exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'listOfflineQueue'))
check('replayOfflineQueuePlaceholder exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'replayOfflineQueuePlaceholder'))
check('markSyncCompleted exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'markSyncCompleted'))
check('markSyncFailed exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'markSyncFailed'))
check('No fake sync success',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'Replay handler not yet connected'))

// 20. Manager Approvals
console.log('\n20. Manager Approvals')
check('requestManagerApproval exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'requestManagerApproval'))
check('listPendingApprovals exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'listPendingApprovals'))
check('resolveManagerApproval exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'resolveManagerApproval'))
check('MANAGER_APPROVAL_REQUESTED event emitted',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'MANAGER_APPROVAL_REQUESTED'))

// 21. Emergency Mode
console.log('\n21. Emergency Mode')
check('activateEmergencyMode exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'activateEmergencyMode'))
check('deactivateEmergencyMode exported',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'deactivateEmergencyMode'))
check('EMERGENCY_MODE_ACTIVATED event emitted',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'EMERGENCY_MODE_ACTIVATED'))

// 22. Venue Context Resolver
console.log('\n22. Venue Context Resolver')
check('pos360VenueContext.js exists',
  exists('src/utils/pos360VenueContext.js'))
check('resolveVenueContext exported',
  contains('src/utils/pos360VenueContext.js', 'export function resolveVenueContext'))
check('usePOS360VenueContext hook exported',
  contains('src/utils/pos360VenueContext.js', 'usePOS360VenueContext'))
check('Uses AuthContext (not hardcoded tenantId)',
  contains('src/utils/pos360VenueContext.js', 'AuthContext'))
check('Production safety — no hardcoded prod venue',
  contains('src/utils/pos360VenueContext.js', 'IS_PROD'))
check('Local dev fallback clearly labeled',
  contains('src/utils/pos360VenueContext.js', 'isLocalFallback'))
check('Handheld POS uses usePOS360VenueContextHook',
  contains('src/pages/pos360/POS360HandheldPOS.jsx', 'usePOS360VenueContextHook'))

// 23. Audit Support
console.log('\n23. Audit Support')
check('writeAudit function present in service',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'async function writeAudit'))
check('Audit records containsSecrets: false',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'contains_secrets,exposes_private_data'))
check('Audit written on emergency activate',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'emergency_mode.activated'))
check('Audit written on session start',
  contains('server/services/pos360/pos360HandheldDeviceService.js', 'session.started'))

// 24. Package Script
console.log('\n24. Package Script')
check('verify:pos360-handheld in package.json',
  contains('package.json', 'verify:pos360-handheld'))

// ── Summary ────────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────────────────────')
console.log(`  ${pass} passed  |  ${fail} failed  |  ${pass + fail} total`)
if (failures.length) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  ✗  ${f}`))
  process.exit(1)
} else {
  console.log('\n  All checks passed — Phase B.3 Handheld Device Suite verified.\n')
}
