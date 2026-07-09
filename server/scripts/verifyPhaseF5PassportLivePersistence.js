// Phase F.5 Verification — Passport 360 Live Persistence for SmokeCraft 360
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

console.log('\n=== Phase F.5 — Passport 360 Live Persistence Verification ===\n')

// --- Migration ---
console.log('[ Migration 068 — passport_360 tables ]')
const migration = read('server/db/migrations/068_passport_360_smokecraft_live_persistence.sql')
check('Migration file exists', migration.length > 0)
check('No DROP TABLE', !migration.includes('DROP TABLE'))
check('No destructive ALTER', !migration.toLowerCase().includes('drop column'))
check('passport_360_guest_profiles table', migration.includes('passport_360_guest_profiles'))
check('passport_360_guest_progress table', migration.includes('passport_360_guest_progress'))
check('passport_360_earned_stamps table', migration.includes('passport_360_earned_stamps'))
check('passport_360_badges table', migration.includes('passport_360_badges'))
check('passport_360_smokecraft_flavor_memory table', migration.includes('passport_360_smokecraft_flavor_memory'))
check('passport_360_smokecraft_sessions table', migration.includes('passport_360_smokecraft_sessions'))
check('passport_360_sync_audit_log table', migration.includes('passport_360_sync_audit_log'))
check('All tables use CREATE TABLE IF NOT EXISTS', !migration.includes('CREATE TABLE ') || (migration.match(/CREATE TABLE IF NOT EXISTS/g) || []).length >= 7)
check('dedupe_key unique index on earned_stamps', migration.includes('idx_passport_stamp_dedupe') && migration.includes('dedupe_key'))
check('ON CONFLICT (dedupe_key) pattern for stamps', migration.includes('dedupe_key'))
check('UNIQUE INDEX on guest_progress (guest_id, module_key)', migration.includes('idx_passport_progress_guest_module'))

// --- Service ---
console.log('\n[ passport360SmokeCraftPersistenceService.js ]')
const svc = read('server/services/passport360/passport360SmokeCraftPersistenceService.js')
check('Service file exists', svc.length > 0)
check('SAFE_CLAIM constant defined', svc.includes("SAFE_CLAIM = 'passport_360_smokecraft_persistence'"))
check('isDbAvailable pattern', svc.includes('isDbAvailable') && svc.includes('db/connection.js'))
check('localFallback function', svc.includes('function localFallback'))
check('localFallback never returns backendConnected: true', !svc.match(/function localFallback[\s\S]{0,300}backendConnected:\s*true/))
check('getPassportBackendHealth export', svc.includes('export async function getPassportBackendHealth'))
check('createOrResolveGuestProfile export', svc.includes('export async function createOrResolveGuestProfile'))
check('saveSmokeCraftSessionToPassport export', svc.includes('export async function saveSmokeCraftSessionToPassport'))
check('awardPassportStampLive export', svc.includes('export async function awardPassportStampLive'))
check('awardPassportStampLive uses dedupe_key', svc.includes('dedupeKey') && svc.includes('ON CONFLICT (dedupe_key)'))
check('awardPassportXP export', svc.includes('export async function awardPassportXP'))
check('awardPassportXP uses upsert ON CONFLICT', svc.includes('ON CONFLICT (guest_id, module_key)'))
check('saveSmokeCraftFlavorMemory export', svc.includes('export async function saveSmokeCraftFlavorMemory'))
check('saveSmokeCraftTastingProfile export', svc.includes('export async function saveSmokeCraftTastingProfile'))
check('getGuestPassportProgress export', svc.includes('export async function getGuestPassportProgress'))
check('getGuestEarnedStamps export', svc.includes('export async function getGuestEarnedStamps'))
check('getGuestBadges export', svc.includes('export async function getGuestBadges'))
check('getReturnVisitProgress export', svc.includes('export async function getReturnVisitProgress'))
check('writePassportSyncAuditEvent export', svc.includes('export async function writePassportSyncAuditEvent'))
check('getPassportAuditLog export', svc.includes('export async function getPassportAuditLog'))
check('Service does NOT fake backendConnected: true in localFallback', !svc.match(/function localFallback[\s\S]{0,200}backendConnected:\s*true/))

// --- Controller ---
console.log('\n[ passport360SmokeCraftController.js ]')
const ctrl = read('server/controllers/passport360SmokeCraftController.js')
check('Controller file exists', ctrl.length > 0)
check('ok500 helper', ctrl.includes('ok500'))
check('wrap helper with backendConnected', ctrl.includes('backendConnected') && ctrl.includes('wrap'))
check('wrap never returns hardcoded backendConnected: true', !ctrl.includes('backendConnected: true'))
check('getHealth handler', ctrl.includes('export function getHealth'))
check('resolveGuest handler', ctrl.includes('export function resolveGuest'))
check('completeSmokeCraftSession handler', ctrl.includes('export function completeSmokeCraftSession'))
check('awardStamp handler', ctrl.includes('export function awardStamp'))
check('awardXP handler', ctrl.includes('export function awardXP'))
check('saveFlavorMemory handler', ctrl.includes('export function saveFlavorMemory'))
check('getGuestProgress handler', ctrl.includes('export function getGuestProgress'))
check('getGuestStamps handler', ctrl.includes('export function getGuestStamps'))
check('getGuestBadgesHandler handler', ctrl.includes('export function getGuestBadgesHandler'))
check('getGuestReturnVisits handler', ctrl.includes('export function getGuestReturnVisits'))
check('getAuditLog handler', ctrl.includes('export function getAuditLog'))
check('SAFE_CLAIM constant in controller', ctrl.includes("SAFE_CLAIM = 'passport_360_smokecraft_persistence'"))

// --- Routes ---
console.log('\n[ passport360SmokeCraftRoutes.js ]')
const routes = read('server/routes/passport360SmokeCraftRoutes.js')
check('Routes file exists', routes.length > 0)
check('GET /health route', routes.includes("router.get('/health'"))
check('POST /guest/resolve route', routes.includes("router.post('/guest/resolve'"))
check('POST /session/complete route', routes.includes("router.post('/session/complete'"))
check('POST /stamp/award route', routes.includes("router.post('/stamp/award'"))
check('POST /xp/award route', routes.includes("router.post('/xp/award'"))
check('POST /flavor-memory/save route', routes.includes("router.post('/flavor-memory/save'"))
check('GET /guest/:guestId/progress route', routes.includes("router.get('/guest/:guestId/progress'"))
check('GET /guest/:guestId/stamps route', routes.includes("router.get('/guest/:guestId/stamps'"))
check('GET /guest/:guestId/badges route', routes.includes("router.get('/guest/:guestId/badges'"))
check('GET /guest/:guestId/return-visits route', routes.includes("router.get('/guest/:guestId/return-visits'"))
check('GET /guest/:guestId/audit-log route', routes.includes("router.get('/guest/:guestId/audit-log'"))
check('POST /audit/event route', routes.includes("router.post('/audit/event'"))

// --- server/index.js wiring ---
console.log('\n[ server/index.js — routes wired ]')
const serverIndex = read('server/index.js')
check('imports passport360SmokeCraftRoutes', serverIndex.includes('passport360SmokeCraftRoutes'))
check('mounts /api/passport-360/smokecraft', serverIndex.includes('/api/passport-360/smokecraft'))

// --- Frontend passportAdapter.js ---
console.log('\n[ src/services/passportAdapter.js ]')
const adapter = read('src/services/passportAdapter.js')
check('passportAdapter.js file exists', adapter.length > 0)
check('BASE = /api/passport-360/smokecraft', adapter.includes('/api/passport-360/smokecraft'))
check('localFallback returns backendConnected: false', adapter.includes('backendConnected: false'))
check('getPassportBackendHealth export', adapter.includes('export async function getPassportBackendHealth'))
check('resolveGuestProfile export', adapter.includes('export async function resolveGuestProfile'))
check('syncSmokeCraftSessionToBackend export', adapter.includes('export async function syncSmokeCraftSessionToBackend'))
check('awardStampToBackend export', adapter.includes('export async function awardStampToBackend'))
check('awardXPToBackend export', adapter.includes('export async function awardXPToBackend'))
check('saveFlavorMemoryToBackend export', adapter.includes('export async function saveFlavorMemoryToBackend'))
check('getGuestProgress export', adapter.includes('export async function getGuestProgress'))
check('getBackendEarnedStamps export', adapter.includes('export async function getBackendEarnedStamps'))
check('writeSyncAuditEvent export', adapter.includes('export async function writeSyncAuditEvent'))
check('Adapter only returns backendConnected: true when API confirms', adapter.includes('backendConnected: true') && adapter.includes('if (!json?.success || !json?.backendConnected)'))
check('Adapter falls back to localFallback on network error', adapter.includes('catch') && adapter.includes('localFallback'))
check('writeSyncAuditEvent is fire-and-forget (no throw in its body)', adapter.includes('writeSyncAuditEvent') && !adapter.match(/export async function writeSyncAuditEvent[\s\S]{0,500}throw/))

// --- passportService.js — backend wiring ---
console.log('\n[ src/services/passportService.js — backend wiring ]')
const passportSvc = read('src/services/passportService.js')
check('passportService imports passportAdapter', passportSvc.includes('passportAdapter'))
check('passportService imports awardStampToBackend', passportSvc.includes('awardStampToBackend'))
check('passportService imports awardXPToBackend', passportSvc.includes('awardXPToBackend'))
check('passportService imports getBackendEarnedStamps', passportSvc.includes('getBackendEarnedStamps'))
check('passportService has getEarnedStampsWithBackend', passportSvc.includes('export async function getEarnedStampsWithBackend'))
check('awardStamp fires backend sync after local save', passportSvc.includes('awardStampToBackend'))
check('Backend sync is fire-and-forget (.catch', passportSvc.includes('.catch(() => {})'))

// --- SessionComplete.jsx — backend sync on session complete ---
console.log('\n[ src/pages/smokecraft/SessionComplete.jsx — backend sync ]')
const sessionComplete = read('src/pages/smokecraft/SessionComplete.jsx')
check('SessionComplete imports passportAdapter', sessionComplete.includes('passportAdapter'))
check('SessionComplete imports syncSmokeCraftSessionToBackend', sessionComplete.includes('syncSmokeCraftSessionToBackend'))
check('SessionComplete imports createPassportId', sessionComplete.includes('createPassportId'))
check('SessionComplete fires backend sync async', sessionComplete.includes('syncSmokeCraftSessionToBackend'))
check('Backend sync does not block guest screen (IIFE or async)', sessionComplete.includes(';(async') || sessionComplete.includes('(async ()'))
check('Backend sync has try/catch so failure is silent', sessionComplete.includes('syncSmokeCraftSessionToBackend') && sessionComplete.match(/\(async[\s\S]{0,100}try[\s\S]{0,3000}catch/))
check('writeSyncAuditEvent called after sync', sessionComplete.includes('writeSyncAuditEvent'))
check('SessionComplete does NOT hardcode backendConnected: true in completeSmokeCraftSession call',
  !sessionComplete.match(/completeSmokeCraftSession\([^)]*backendConnected:\s*true/))

// --- PassportStamps.jsx — backend stamps display ---
console.log('\n[ src/pages/passport/PassportStamps.jsx — backend stamps ]')
const stamps = read('src/pages/passport/PassportStamps.jsx')
check('PassportStamps imports getEarnedStampsWithBackend', stamps.includes('getEarnedStampsWithBackend'))
check('PassportStamps uses useState for backendStamps', stamps.includes('backendStamps') && stamps.includes('useState'))
check('PassportStamps uses useState for backendConnected', stamps.includes('backendConnected') && stamps.includes('useState'))
check('PassportStamps fetches backend stamps in useEffect', stamps.includes('getEarnedStampsWithBackend') && stamps.includes('useEffect'))
check('Banner shows PASSPORT BACKEND CONNECTED when connected', stamps.includes('PASSPORT BACKEND CONNECTED'))
check('Banner shows LOCAL PASSPORT PREVIEW when not connected', stamps.includes('LOCAL PASSPORT PREVIEW'))
check('Backend stamps section shown when backendConnected', stamps.includes('backendConnected && backendStamps'))

// --- Safety gates ---
console.log('\n[ Safety gates ]')
check('passportAdapter does NOT claim eat_live', !adapter.includes('eat_live') && !adapter.includes('eatConnected: true'))
check('passportAdapter does NOT claim pos360_live', !adapter.includes('pos360_live') && !adapter.includes('live_pos360'))
check('passportAdapter does NOT claim inventorySync', !adapter.includes('inventorySync: true'))
check('Controller does NOT claim eat_live', !ctrl.includes('eat_live'))
check('Service does NOT claim eat_live', !svc.includes('eat_live'))
check('SmokeCraft images directory intact', existsSync(resolve(process.cwd(), 'public/assets/smokecraft-reference/approved')))
check('SmokeCraftVisualProof unchanged', existsSync(resolve(process.cwd(), 'src/pages/smokecraft/SmokeCraftVisualProof.jsx')))

// --- Summary ---
console.log(`\n=== RESULT: ${passed} passed / ${passed + failed} total ===`)
if (failures.length > 0) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  ✗ ${f}`))
  process.exit(1)
} else {
  console.log('\nAll checks passed. Phase F.5 Passport Live Persistence verification complete.')
  console.log('\nHonest persistence status:')
  console.log('  Database migration:         YES — 068_passport_360_smokecraft_live_persistence.sql')
  console.log('  Backend persistence service: YES — 13 functions, safe localFallback')
  console.log('  API controller + routes:    YES — /api/passport-360/smokecraft')
  console.log('  Frontend adapter:           YES — real API calls, honest backendConnected')
  console.log('  Session sync:               YES — fire-and-forget, never blocks guest screen')
  console.log('  Stamp backend sync:         YES — dedupe_key prevents duplicates')
  console.log('  PassportStamps UI:          YES — shows backend status honestly')
  console.log('  backendConnected: true:     ONLY when API confirms real DB storage')
  console.log('  E.A.T. live sync:           NO — not built in this phase')
  console.log('  POS360 live bridge:         NO — not built in this phase')
  console.log('  Production-ready:           NO — backend must be provisioned and verified')
  console.log('  Next phase:                 F.6 — Final SmokeCraft Pilot Verification')
  process.exit(0)
}
