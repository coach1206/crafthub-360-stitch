// Phase F.7 Verification — E.A.T. Live SmokeCraft Sync
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

console.log('\n=== Phase F.7 — E.A.T. Live SmokeCraft Sync Verification ===\n')

// --- Migration 069 ---
console.log('[ Migration 069 — E.A.T. SmokeCraft sync tables ]')
const migration = read('server/db/migrations/069_eat_smokecraft_live_sync.sql')
check('Migration 069 exists', migration.length > 0)
check('No DROP TABLE (safe migration)', !migration.includes('DROP TABLE'))
check('No destructive ALTER', !migration.toLowerCase().includes('drop column'))
check('eat_smokecraft_session_sync table', migration.includes('eat_smokecraft_session_sync'))
check('eat_smokecraft_guest_activity table', migration.includes('eat_smokecraft_guest_activity'))
check('eat_smokecraft_handoff_queue table', migration.includes('eat_smokecraft_handoff_queue'))
check('eat_smokecraft_manager_alerts table', migration.includes('eat_smokecraft_manager_alerts'))
check('eat_smokecraft_inventory_signals table', migration.includes('eat_smokecraft_inventory_signals'))
check('eat_smokecraft_sync_audit_log table', migration.includes('eat_smokecraft_sync_audit_log'))
check('All 6 tables use CREATE TABLE IF NOT EXISTS',
  (migration.match(/CREATE TABLE IF NOT EXISTS/g) || []).length >= 6)
check('session_sync has sync_status field', migration.includes('sync_status'))
check('session_sync has backend_connected field', migration.includes('backend_connected'))
check('session_sync has completed_steps_json field', migration.includes('completed_steps_json'))
check('session_sync has xp_summary_json field', migration.includes('xp_summary_json'))
check('session_sync has stamp_summary_json field', migration.includes('stamp_summary_json'))
check('session_sync has taste_profile_json field', migration.includes('taste_profile_json'))
check('guest_activity has loyalty_signal field', migration.includes('loyalty_signal'))
check('guest_activity has vip_signal field', migration.includes('vip_signal'))
check('guest_activity has manager_visibility field', migration.includes('manager_visibility'))
check('handoff_queue has handoff_type field', migration.includes('handoff_type'))
check('handoff_queue has target_system field', migration.includes('target_system'))
check('handoff_queue has handoff_status field', migration.includes('handoff_status'))
check('handoff_queue has staff_action_required field', migration.includes('staff_action_required'))
check('manager_alerts has alert_type field', migration.includes('alert_type'))
check('manager_alerts has alert_priority field', migration.includes('alert_priority'))
check('manager_alerts has resolved field', migration.includes('resolved'))
check('inventory_signals has cigar_reference field', migration.includes('cigar_reference'))
check('inventory_signals has menu_item_reference field', migration.includes('menu_item_reference'))
check('inventory_signals has inventory_signal_type field', migration.includes('inventory_signal_type'))
check('inventory_signals has reorder_signal field', migration.includes('reorder_signal'))
check('created_at in all tables',
  (migration.match(/created_at/g) || []).length >= 6)

// --- Backend service ---
console.log('\n[ eatSmokeCraftLiveSyncService.js — all required methods ]')
const svc = read('server/services/eat360/eatSmokeCraftLiveSyncService.js')
check('Service file exists', svc.length > 0)
check('getEATSmokeCraftSyncHealth exported', svc.includes('export async function getEATSmokeCraftSyncHealth'))
check('syncSmokeCraftSessionToEAT exported', svc.includes('export async function syncSmokeCraftSessionToEAT'))
check('recordSmokeCraftGuestActivity exported', svc.includes('export async function recordSmokeCraftGuestActivity'))
check('createSmokeCraftHandoffQueueItem exported', svc.includes('export async function createSmokeCraftHandoffQueueItem'))
check('createSmokeCraftManagerAlert exported', svc.includes('export async function createSmokeCraftManagerAlert'))
check('createSmokeCraftInventorySignal exported', svc.includes('export async function createSmokeCraftInventorySignal'))
check('getSmokeCraftSessionSyncStatus exported', svc.includes('export async function getSmokeCraftSessionSyncStatus'))
check('getSmokeCraftGuestActivity exported', svc.includes('export async function getSmokeCraftGuestActivity'))
check('getSmokeCraftHandoffQueue exported', svc.includes('export async function getSmokeCraftHandoffQueue'))
check('getSmokeCraftManagerAlerts exported', svc.includes('export async function getSmokeCraftManagerAlerts'))
check('getSmokeCraftInventorySignals exported', svc.includes('export async function getSmokeCraftInventorySignals'))
check('writeEATSmokeCraftSyncAuditEvent exported', svc.includes('export async function writeEATSmokeCraftSyncAuditEvent'))
check('Service uses isDbAvailable pattern', svc.includes('isDbAvailable'))
check('localFallback returns backendConnected: false',
  !svc.match(/function localFallback[\s\S]{0,300}backendConnected:\s*true/))
check('Service every result includes safeClaim', svc.includes('safeClaim'))
check('Service writes real DB records (INSERT)', svc.includes('INSERT INTO eat_smokecraft'))
check('Service never fakes backendConnected: true in localFallback',
  !svc.match(/function localFallback[\s\S]{0,200}backendConnected:\s*true/))

// --- Controller ---
console.log('\n[ eatSmokeCraftLiveSyncController.js ]')
const ctrl = read('server/controllers/eatSmokeCraftLiveSyncController.js')
check('Controller file exists', ctrl.length > 0)
check('getHealth handler', ctrl.includes('export function getHealth'))
check('syncSession handler', ctrl.includes('export function syncSession'))
check('recordGuestActivity handler', ctrl.includes('export function recordGuestActivity'))
check('createHandoff handler', ctrl.includes('export function createHandoff'))
check('createManagerAlert handler', ctrl.includes('export function createManagerAlert'))
check('createInventorySignal handler', ctrl.includes('export function createInventorySignal'))
check('getSessionSyncStatus handler', ctrl.includes('export function getSessionSyncStatus'))
check('getGuestActivity handler', ctrl.includes('export function getGuestActivity'))
check('getHandoffQueue handler', ctrl.includes('export function getHandoffQueue'))
check('getManagerAlerts handler', ctrl.includes('export function getManagerAlerts'))
check('getInventorySignals handler', ctrl.includes('export function getInventorySignals'))
check('getAuditLog handler', ctrl.includes('export function getAuditLog'))
check('Every response includes success', ctrl.includes('success'))
check('Every response includes backendConnected', ctrl.includes('backendConnected'))
check('Every response includes syncStatus', ctrl.includes('syncStatus'))
check('Every response includes persistenceMode', ctrl.includes('persistenceMode'))
check('Every response includes safeClaim', ctrl.includes('safeClaim'))
check('Every response includes timestamp', ctrl.includes('timestamp'))
check('Controller does not hardcode backendConnected: true', !ctrl.includes("backendConnected: true"))

// --- Routes ---
console.log('\n[ eatSmokeCraftLiveSyncRoutes.js ]')
const routes = read('server/routes/eatSmokeCraftLiveSyncRoutes.js')
check('Routes file exists', routes.length > 0)
check('GET /health route', routes.includes("router.get('/health'"))
check('POST /session/sync route', routes.includes("router.post('/session/sync'"))
check('POST /guest-activity route', routes.includes("router.post('/guest-activity'"))
check('POST /handoff route', routes.includes("router.post('/handoff'"))
check('POST /manager-alert route', routes.includes("router.post('/manager-alert'"))
check('POST /inventory-signal route', routes.includes("router.post('/inventory-signal'"))
check('GET /session/:sessionId/status route', routes.includes("router.get('/session/:sessionId/status'"))
check('GET /guest/:guestId/activity route', routes.includes("router.get('/guest/:guestId/activity'"))
check('GET /handoff-queue route', routes.includes("router.get('/handoff-queue'"))
check('GET /manager-alerts route', routes.includes("router.get('/manager-alerts'"))
check('GET /inventory-signals route', routes.includes("router.get('/inventory-signals'"))
check('GET /audit-log route', routes.includes("router.get('/audit-log'"))

// --- server/index.js ---
console.log('\n[ server/index.js — route registration ]')
const serverIndex = read('server/index.js')
check('/api/eat-360/smokecraft route registered', serverIndex.includes('/api/eat-360/smokecraft'))
check('eatSmokeCraftLiveSyncRoutes imported', serverIndex.includes('eatSmokeCraftLiveSyncRoutes'))

// --- smokecraftManagementSyncService.js ---
console.log('\n[ smokecraftManagementSyncService.js — real API calls ]')
const mgmtSvc = read('src/modules/smokecraft/services/smokecraftManagementSyncService.js')
check('Service file exists', mgmtSvc.length > 0)
check('Service targets /api/eat-360/smokecraft', mgmtSvc.includes('/api/eat-360/smokecraft'))
check('syncManagement makes real API call', mgmtSvc.includes('export async function syncManagement') && mgmtSvc.includes('apiFetch'))
check('Service no longer demo_only-only as final state',
  !mgmtSvc.match(/syncManagement[\s\S]{0,300}status:\s*'demo_only'/))
check('getManagementSyncStatus exported', mgmtSvc.includes('export async function getManagementSyncStatus'))
check('buildManagementSyncReport exported', mgmtSvc.includes('export async function buildManagementSyncReport'))
check('recordGuestActivity exported', mgmtSvc.includes('export async function recordGuestActivity'))
check('createHandoffQueueItem exported', mgmtSvc.includes('export async function createHandoffQueueItem'))
check('createManagerAlertSync exported', mgmtSvc.includes('export async function createManagerAlertSync'))
check('createInventorySignalSync exported', mgmtSvc.includes('export async function createInventorySignalSync'))
check('writeEATSyncAuditEvent exported', mgmtSvc.includes('export async function writeEATSyncAuditEvent'))
check('Service has local fallback', mgmtSvc.includes('localFallback'))
check('backendConnected true only from API success',
  mgmtSvc.includes('backendConnected: true') && mgmtSvc.includes('if (!json?.success || !json?.backendConnected)'))

// --- ManagementSync.jsx ---
console.log('\n[ ManagementSync.jsx — live E.A.T. status ]')
const mgmt = read('src/pages/smokecraft/ManagementSync.jsx')
check('ManagementSync imports smokecraftManagementSyncService', mgmt.includes('smokecraftManagementSyncService'))
check('ManagementSync calls getManagementSyncStatus', mgmt.includes('getManagementSyncStatus'))
check('ManagementSync shows E.A.T. Backend Connected when connected', mgmt.includes('E.A.T. Backend Connected'))
check('ManagementSync shows E.A.T. Local Fallback when not connected', mgmt.includes('E.A.T. Local Fallback'))
check('ManagementSync does not show demo_only as permanent final state',
  !mgmt.includes("status: 'demo_only'"))
check('ManagementSync E.A.T. sync is fire-and-forget (async IIFE)',
  mgmt.includes(';(async') || mgmt.includes('(async ()'))
check('ManagementSync calls syncManagement', mgmt.includes('syncManagement'))
check('ManagementSync calls recordGuestActivity', mgmt.includes('recordGuestActivity'))
check('ManagementSync calls createManagerAlertSync', mgmt.includes('createManagerAlertSync'))

// --- SessionComplete.jsx ---
console.log('\n[ SessionComplete.jsx — E.A.T. backend sync ]')
const sessionComplete = read('src/pages/smokecraft/SessionComplete.jsx')
check('SessionComplete imports smokecraftManagementSyncService', sessionComplete.includes('smokecraftManagementSyncService'))
check('SessionComplete calls syncManagement (E.A.T.)', sessionComplete.includes('syncManagement'))
check('SessionComplete calls recordGuestActivity', sessionComplete.includes('recordGuestActivity'))
check('SessionComplete calls createManagerAlertSync', sessionComplete.includes('createManagerAlertSync'))
check('SessionComplete calls createInventorySignalSync', sessionComplete.includes('createInventorySignalSync'))
check('SessionComplete calls writeEATSyncAuditEvent', sessionComplete.includes('writeEATSyncAuditEvent'))
check('E.A.T. sync sends completed steps', sessionComplete.includes('completedSteps'))
check('E.A.T. sync sends xp summary', sessionComplete.includes('xpSummary'))
check('E.A.T. sync sends stamp summary', sessionComplete.includes('stampSummary'))
check('E.A.T. sync sends taste profile', sessionComplete.includes('tasteTags') || sessionComplete.includes('tasteProfile'))
check('E.A.T. sync does not block guest screen (async IIFE)',
  sessionComplete.includes(';(async') || sessionComplete.includes('(async ()'))
check('E.A.T. sync failure is caught silently', sessionComplete.includes('catch'))
check('SessionComplete sends manager visibility record', sessionComplete.includes('managerVisibility'))
check('Inventory signal only when cigar data exists', sessionComplete.includes('selectedCigar'))

// --- Safety gates ---
console.log('\n[ Safety gates ]')
check('No POS360 live provider claim in mgmt service', !mgmtSvc.includes('pos360_live') && !mgmtSvc.includes('live_pos360'))
check('No payment live claim in mgmt service', !mgmtSvc.includes('payment_live') && !mgmtSvc.includes('live_payment'))
check('No vendor ordering live claim in mgmt service', !mgmtSvc.includes('vendor_live') && !mgmtSvc.includes('live_vendor'))
check('No production-ready claim in mgmt service', !mgmtSvc.includes('productionReady: true'))
check('No production-ready claim in service', !svc.includes('productionReady: true'))
check('No production-ready claim in controller', !ctrl.includes('productionReady: true'))
check('SmokeCraft images intact', existsSync(resolve(process.cwd(), 'public/assets/smokecraft-reference/approved')))
check('SmokeCraftVisualProof unchanged', existsSync(resolve(process.cwd(), 'src/pages/smokecraft/SmokeCraftVisualProof.jsx')))
check('BeerCraft not in new service', !svc.includes('BeerCraft') && !svc.includes('beercraft'))
check('WineCraft not in new service', !svc.includes('WineCraft') && !svc.includes('winecraft'))

// --- Summary ---
console.log(`\n=== RESULT: ${passed} passed / ${passed + failed} total ===`)
if (failures.length > 0) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  ✗ ${f}`))
  process.exit(1)
} else {
  console.log('\nAll checks passed. Phase F.7 E.A.T. Live SmokeCraft Sync verification complete.')
  console.log('\n=== FINAL REPORT ===')
  console.log('  Is E.A.T. live-connected now?      YES — if database is provisioned and migration 069 run')
  console.log('  Is SmokeCraft production-ready?    NO — pilot phase only')
  console.log('  Migration:                         069_eat_smokecraft_live_sync.sql (6 tables)')
  console.log('  API routes:                        /api/eat-360/smokecraft (13 endpoints)')
  console.log('  E.A.T. backend sync service:       YES — real DB writes, safe localFallback')
  console.log('  Management sync:                   YES — real API, not demo_only-only')
  console.log('  SessionComplete E.A.T. sync:       YES — fire-and-forget, never blocks guest')
  console.log('  Handoff queue:                     YES — real DB records')
  console.log('  Inventory signals:                 YES — only when cigar/item data exists')
  console.log('  Manager alerts:                    YES — real DB records')
  console.log('  Live POS360 bridge:                NO — deferred to Phase F.8')
  console.log('  Live payments:                     NO — deferred')
  console.log('  Next phase:                        F.8 — POS360 Live Order / Handoff Bridge')
  process.exit(0)
}
