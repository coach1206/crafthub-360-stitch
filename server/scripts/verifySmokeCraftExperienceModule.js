/**
 * SmokeCraft Experience Module — Verification Script
 * Module Build 2 of 9: SmokeCraft Experience Module
 *
 * Verifies the SmokeCraft module foundation is properly registered in NOVEE OS.
 * Does not test visual screens — those are protected and sealed.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(process.cwd())
const pass = []
const fail = []

function assert(condition, label) {
  if (condition) { pass.push(label) }
  else { fail.push(label); console.error(`  FAIL: ${label}`) }
}

function fileExists(rel) { return existsSync(resolve(ROOT, rel)) }

function fileContains(rel, str) {
  if (!existsSync(resolve(ROOT, rel))) return false
  return readFileSync(resolve(ROOT, rel), 'utf8').includes(str)
}

function fileNotContains(rel, str) {
  if (!existsSync(resolve(ROOT, rel))) return true
  return !readFileSync(resolve(ROOT, rel), 'utf8').includes(str)
}

function fileNotMatchesPattern(rel, pattern) {
  if (!existsSync(resolve(ROOT, rel))) return true
  return !pattern.test(readFileSync(resolve(ROOT, rel), 'utf8'))
}

// ── File paths ───────────────────────────────────────────────────────────────
const MANIFEST      = 'src/modules/smokecraft/module.manifest.js'
const JOURNEY       = 'src/modules/smokecraft/data/smokecraftJourneyContract.js'
const ROUTE_C       = 'src/modules/smokecraft/data/smokecraftRouteContract.js'
const ORDER_C       = 'src/modules/smokecraft/data/smokecraftOrderingContract.js'
const PAIRING_C     = 'src/modules/smokecraft/data/smokecraftPairingContract.js'
const MENU_C        = 'src/modules/smokecraft/data/smokecraftMenuContract.js'
const HOOK_C        = 'src/modules/smokecraft/data/smokecraftHookContract.js'
const PERM_C        = 'src/modules/smokecraft/data/smokecraftPermissionContract.js'
const API_SVC       = 'src/modules/smokecraft/services/smokecraftApi.js'
const PROGRESS_SVC  = 'src/modules/smokecraft/services/smokecraftProgressService.js'
const PAIRING_SVC   = 'src/modules/smokecraft/services/smokecraftPairingService.js'
const ORDER_SVC     = 'src/modules/smokecraft/services/smokecraftOrderingService.js'
const MENU_SVC      = 'src/modules/smokecraft/services/smokecraftMenuService.js'
const MGMT_SVC      = 'src/modules/smokecraft/services/smokecraftManagementSyncService.js'
const POS_ADAPTER   = 'src/modules/smokecraft/adapters/pos360Adapter.js'
const EAT_ADAPTER   = 'src/modules/smokecraft/adapters/eatAdapter.js'
const PASS_ADAPTER  = 'src/modules/smokecraft/adapters/passportAdapter.js'
const MODULE_ENTRY  = 'src/modules/smokecraft/SmokeCraftModule.jsx'
const ROUTES_FILE   = 'src/modules/smokecraft/routes.js'
const README        = 'src/modules/smokecraft/README.md'
const SERVER_REG    = 'server/services/modules/smokecraftModuleRegistration.js'
const SERVER_ROUTES = 'server/routes/smokecraftModuleRoutes.js'
const INDEX         = 'server/index.js'

// Protected sealed files
const ASSET_SCREEN  = 'src/components/smokecraft/SmokeCraftAssetScreen.jsx'
const HOTSPOT       = 'src/components/smokecraft/SmokeCraftHotspotLayer.jsx'
const ASSET_ROUTE   = 'src/components/smokecraft/SmokeCraftAssetRoute.jsx'
const SESSION_JS    = 'src/constants/session.js'
const JOURNEY_CONST = 'src/constants/smokecraftJourney.js'

// ── 1. File existence ────────────────────────────────────────────────────────
console.log('\nSmokeCraft module files:')
assert(fileExists(MANIFEST),     'manifest file exists')
assert(fileExists(JOURNEY),      'journey contract exists')
assert(fileExists(ROUTE_C),      'route contract exists')
assert(fileExists(ORDER_C),      'ordering contract exists')
assert(fileExists(PAIRING_C),    'pairing contract exists')
assert(fileExists(MENU_C),       'menu contract exists')
assert(fileExists(HOOK_C),       'hook contract exists')
assert(fileExists(PERM_C),       'permission contract exists')
assert(fileExists(API_SVC),      'smokecraftApi service exists')
assert(fileExists(PROGRESS_SVC), 'progress service exists')
assert(fileExists(PAIRING_SVC),  'pairing service exists')
assert(fileExists(ORDER_SVC),    'ordering service exists')
assert(fileExists(MENU_SVC),     'menu service exists')
assert(fileExists(MGMT_SVC),     'management sync service exists')
assert(fileExists(POS_ADAPTER),  'pos360Adapter exists')
assert(fileExists(EAT_ADAPTER),  'eatAdapter exists')
assert(fileExists(PASS_ADAPTER), 'passportAdapter exists')
assert(fileExists(MODULE_ENTRY), 'SmokeCraftModule.jsx exists')
assert(fileExists(ROUTES_FILE),  'routes.js exists')
assert(fileExists(README),       'SmokeCraft README exists')
assert(fileExists(SERVER_REG),   'server registration file exists')
assert(fileExists(SERVER_ROUTES),'server module routes exist')

// ── 2. Manifest assertions ───────────────────────────────────────────────────
console.log('\nManifest:')
assert(fileContains(MANIFEST, "SMOKECRAFT_MODULE_ID = 'smokecraft-experience'"), 'manifest uses moduleId smokecraft-experience')
assert(fileContains(MANIFEST, "moduleType: 'experience_module'"),      'manifest uses experience_module type')
assert(fileContains(MANIFEST, "SMOKECRAFT_MODULE_VERSION = '0.1.0'"),  'manifest version is 0.1.0')
assert(fileContains(MANIFEST, "module_packaging_status: 'registered_preview'"), 'manifest shows registered_preview')
assert(fileContains(MANIFEST, "physical_package_status: 'not_yet_packaged'"),   'manifest shows not_yet_packaged')
assert(fileContains(MANIFEST, "marketplace_status: 'not_live_marketplace'"),    'manifest shows not_live_marketplace')
assert(fileContains(MANIFEST, "license_status: 'license_not_enforced'"),        'manifest shows license_not_enforced')
assert(fileContains(MANIFEST, "lifecycle_status: 'preview_only'"),              'manifest shows lifecycle preview_only')
assert(fileContains(MANIFEST, "preview_only: true"),                   'manifest sets preview_only true')
assert(fileContains(MANIFEST, 'SmokeCraftAssetScreen'),                'manifest lists required component SmokeCraftAssetScreen')
assert(fileContains(MANIFEST, 'SmokeCraftHotspotLayer'),               'manifest lists required component SmokeCraftHotspotLayer')
assert(fileNotContains(MANIFEST, 'live_marketplace: true'),            'manifest does not claim marketplace live')
assert(fileNotMatchesPattern(MANIFEST, /^\s+enforced: true/m),         'manifest does not claim license enforced')
assert(fileNotContains(MANIFEST, 'physical_package_status: .installed.'), 'manifest does not claim installed')

// ── 3. Journey contract ──────────────────────────────────────────────────────
console.log('\nJourney contract:')
assert(fileContains(JOURNEY, 'flavor-memory'),     'journey contract includes flavor-memory step')
assert(fileContains(JOURNEY, 'second-third'),      'journey contract includes second-third step')
assert(fileContains(JOURNEY, 'final-third'),       'journey contract includes final-third step')
assert(fileContains(JOURNEY, 'scorecard'),         'journey contract includes scorecard step')
assert(fileContains(JOURNEY, 'passport-stamp'),    'journey contract includes passport-stamp step')
assert(fileContains(JOURNEY, 'connections'),       'journey contract includes connections step')
assert(fileContains(JOURNEY, 'management-sync'),   'journey contract includes management-sync step')
assert(fileContains(JOURNEY, 'session-complete'),  'journey contract includes session-complete step')
assert(fileContains(JOURNEY, 'totalVisits: 8'),    'journey contract has 8 visits')
assert(fileContains(JOURNEY, 'totalSessions: 24'), 'journey contract has 24 sessions')
assert(fileContains(JOURNEY, 'flavorMemoryMustFollowSecondThird: true'), 'flavor-memory must follow second-third rule')
assert(fileContains(JOURNEY, 'flavorMemoryMustPrecedeFinalThird: true'), 'flavor-memory must precede final-third rule')
assert(fileContains(JOURNEY, 'passportStampEarlyUnlockAllowed: false'), 'passport stamp early unlock disabled')
assert(fileContains(JOURNEY, 'connectionsEarlyUnlockAllowed: false'),   'connections early unlock disabled')
assert(fileContains(JOURNEY, 'visit8Protected: true'),                  'visit 8 is protected')
assert(fileContains(JOURNEY, 'oneSessionShortcutAllowed: false'),        'one-session shortcut disabled')
assert(fileContains(JOURNEY, 'journeyCompressionAllowed: false'),        'journey compression disabled')
assert(fileContains(JOURNEY, 'flavorMemoryRemovalAllowed: false'),       'flavor memory removal disabled')

// ── 4. Route contract ────────────────────────────────────────────────────────
console.log('\nRoute contract:')
assert(fileContains(ROUTE_C, '/smokecraft/flavor-memory'),    'route contract has flavor-memory route')
assert(fileContains(ROUTE_C, '/smokecraft/second-third'),     'route contract has second-third route')
assert(fileContains(ROUTE_C, '/smokecraft/final-third'),      'route contract has final-third route')
assert(fileContains(ROUTE_C, '/smokecraft/passport-stamp'),   'route contract has passport-stamp route')
assert(fileContains(ROUTE_C, '/smokecraft/connections'),      'route contract has connections route')
assert(fileContains(ROUTE_C, 'existingRoute: true'),          'route contract marks existing routes')
assert(fileContains(ROUTE_C, 'preview_only: true'),           'route contract is preview_only')
assert(fileContains(ROUTE_C, 'does not remount or replace'),  'route contract notes no remount')

// ── 5. Ordering contract ─────────────────────────────────────────────────────
console.log('\nOrdering contract:')
assert(fileContains(ORDER_C, 'customer_self_order'),          'customer self-order mode exists')
assert(fileContains(ORDER_C, 'staff_assisted_order'),         'staff-assisted order mode exists')
assert(fileContains(ORDER_C, "'not_connected'"),              'ordering contract has not_connected status')
assert(fileContains(ORDER_C, 'buildPosUnavailableResponse'),  'POS unavailable response builder exists')
assert(fileContains(ORDER_C, 'POS360 connection is not active'), 'honest POS unavailable message exists')
assert(fileContains(ORDER_C, 'sourceModule'),                 'order has sourceModule field')
assert(fileContains(ORDER_C, 'syncStatus'),                   'order has syncStatus field')
assert(fileContains(ORDER_C, 'demoMode'),                     'order has demoMode field')

// ── 6. Pairing contract ──────────────────────────────────────────────────────
console.log('\nPairing contract:')
assert(fileContains(PAIRING_C, 'demo_only'),                  'pairing fallback returns demo_only')
assert(fileContains(PAIRING_C, 'local_fallback'),             'pairing fallback uses local_fallback source')
assert(fileContains(PAIRING_C, 'aiBacked: false'),            'pairing declares aiBacked false')
assert(fileContains(PAIRING_C, 'posBacked: false'),           'pairing declares posBacked false')
assert(fileContains(PAIRING_C, 'venueMenuBacked: false'),     'pairing declares venueMenuBacked false')
assert(fileContains(PAIRING_C, 'buildPairingFallbackResponse'), 'pairing fallback builder exists')

// ── 7. Venue menu contract ───────────────────────────────────────────────────
console.log('\nVenue menu contract:')
assert(fileContains(MENU_C, 'venueId'),             'menu contract has venueId')
assert(fileContains(MENU_C, 'menuId'),              'menu contract has menuId')
assert(fileContains(MENU_C, 'pairingTags'),         'menu contract has pairingTags')
assert(fileContains(MENU_C, 'cigarPairingTags'),    'menu contract has cigarPairingTags')
assert(fileContains(MENU_C, 'drinkPairingTags'),    'menu contract has drinkPairingTags')
assert(fileContains(MENU_C, 'posItemId'),           'menu contract has posItemId')
assert(fileContains(MENU_C, 'eatItemId'),           'menu contract has eatItemId')
assert(fileContains(MENU_C, 'syncStatus'),          'menu contract has syncStatus')
assert(fileContains(MENU_C, 'NOT_CONNECTED'),       'menu contract has not_connected status')

// ── 8. Hook contract ─────────────────────────────────────────────────────────
console.log('\nHook contract:')
assert(fileContains(HOOK_C, 'smokeCraft.session.started'),          'session.started hook exists')
assert(fileContains(HOOK_C, 'smokeCraft.session.completed'),        'session.completed hook exists')
assert(fileContains(HOOK_C, 'smokeCraft.passportStamp.earned'),     'passportStamp.earned hook exists')
assert(fileContains(HOOK_C, 'smokeCraft.scorecard.completed'),      'scorecard.completed hook exists')
assert(fileContains(HOOK_C, 'smokeCraft.order.requested'),          'order.requested hook exists')
assert(fileContains(HOOK_C, 'smokeCraft.order.sentToStaff'),        'order.sentToStaff hook exists')
assert(fileContains(HOOK_C, 'smokeCraft.order.sentToPOS'),          'order.sentToPOS hook exists')
assert(fileContains(HOOK_C, 'smokeCraft.flavorMemory.completed'),   'flavorMemory.completed hook exists')
assert(fileContains(HOOK_C, 'preview_only: true'),                  'hook contract is preview_only')

// ── 9. Permission contract ───────────────────────────────────────────────────
console.log('\nPermission contract:')
assert(fileContains(PERM_C, 'smokecraft.start_session'),            'customer start_session permission exists')
assert(fileContains(PERM_C, 'smokecraft.request_order'),            'customer request_order permission exists')
assert(fileContains(PERM_C, 'smokecraft.earn_passport_stamp'),      'customer earn_passport_stamp permission exists')
assert(fileContains(PERM_C, 'smokecraft.view_order_requests'),      'staff view_order_requests permission exists')
assert(fileContains(PERM_C, 'smokecraft.accept_order_request'),     'staff accept_order_request permission exists')
assert(fileContains(PERM_C, 'smokecraft.view_management_sync'),     'manager view_management_sync permission exists')
assert(fileContains(PERM_C, 'platformAdmin'),                       'platformAdmin role defined')
assert(fileContains(PERM_C, 'customer roles are blocked'),          'customer role blocking is documented')

// ── 10. Adapters ─────────────────────────────────────────────────────────────
console.log('\nAdapters:')
assert(fileContains(POS_ADAPTER, 'return false'),            'pos360Adapter.isConnected returns false')
assert(fileContains(POS_ADAPTER, 'not_connected'),           'pos360Adapter returns not_connected status')
assert(fileContains(POS_ADAPTER, 'Order was not sent to POS'), 'pos360Adapter honest no-send message')
assert(fileContains(POS_ADAPTER, 'placeholder_only'),        'pos360Adapter is marked placeholder_only')
assert(fileContains(POS_ADAPTER, 'isConnected'),             'pos360Adapter exposes isConnected()')
assert(fileContains(POS_ADAPTER, 'sendOrder'),               'pos360Adapter exposes sendOrder()')

assert(fileContains(EAT_ADAPTER, 'return false'),            'eatAdapter.isConnected returns false')
assert(fileContains(EAT_ADAPTER, 'not_connected'),           'eatAdapter returns not_connected status')
assert(fileContains(EAT_ADAPTER, 'Order was not sent to E.A.T'), 'eatAdapter honest no-send message')
assert(fileContains(EAT_ADAPTER, 'placeholder_only'),        'eatAdapter is marked placeholder_only')

assert(fileContains(PASS_ADAPTER, 'return false'),            'passportAdapter.isConnected returns false')
assert(fileContains(PASS_ADAPTER, 'not_connected'),           'passportAdapter returns not_connected status')
assert(fileContains(PASS_ADAPTER, 'passportStampLockActive: true'), 'passportAdapter keeps stamp lock active')

// ── 11. Services ─────────────────────────────────────────────────────────────
console.log('\nServices:')
assert(fileContains(ORDER_SVC, 'CUSTOMER_SELF_ORDER'),         'ordering service has customer_self_order mode')
assert(fileContains(ORDER_SVC, 'STAFF_ASSISTED_ORDER'),       'ordering service has staff_assisted_order mode')
assert(fileContains(ORDER_SVC, 'NOT_CONNECTED'),              'ordering service returns not_connected for POS')
assert(fileContains(ORDER_SVC, 'pos360Connected: false'),     'ordering service declares pos360 not connected')

assert(fileContains(PAIRING_SVC, 'demo_only'),                'pairing service returns demo_only')
assert(fileContains(PAIRING_SVC, 'aiBacked: false'),          'pairing service declares aiBacked false')
assert(fileContains(PAIRING_SVC, 'posBacked: false'),         'pairing service declares posBacked false')

assert(fileContains(MGMT_SVC, 'demo_only'),                   'management sync returns demo_only')
assert(fileContains(MGMT_SVC, 'eatConnected: false'),         'management sync declares eat not connected')

// ── 12. README ───────────────────────────────────────────────────────────────
console.log('\nREADME:')
assert(fileContains(README, 'registered_preview'),            'README explains registered_preview status')
assert(fileContains(README, 'not_yet_packaged'),              'README explains not_yet_packaged status')
assert(fileContains(README, 'not_live_marketplace'),          'README explains not_live_marketplace status')
assert(fileContains(README, 'license_not_enforced'),          'README explains license_not_enforced status')
assert(fileContains(README, 'customer_self_order'),           'README documents customer self-order')
assert(fileContains(README, 'staff_assisted_order'),          'README documents staff-assisted order')
assert(fileContains(README, 'demo_only'),                     'README documents demo_only pairing status')
assert(fileContains(README, 'MODULE BUILD 3'),                'README previews Module Build 3')
assert(fileContains(README, 'Protected Files'),               'README lists protected files')
assert(fileContains(README, 'SmokeCraftAssetScreen'),         'README names protected SmokeCraftAssetScreen')
assert(fileContains(README, 'VISIT_STRUCTURE'),               'README names protected VISIT_STRUCTURE')
assert(fileContains(README, 'Flavor Memory'),                 'README notes Flavor Memory journey rule')

// ── 13. Server registration ──────────────────────────────────────────────────
console.log('\nServer registration:')
assert(fileContains(SERVER_REG, 'smokecraft-experience'),     'server registration uses correct moduleId')
assert(fileContains(SERVER_REG, 'registered_preview'),        'server registration shows registered_preview')
assert(fileContains(SERVER_REG, 'not_yet_packaged'),          'server registration shows not_yet_packaged')
assert(fileContains(SERVER_REG, 'preview_only: true'),        'server registration is preview_only')
assert(fileContains(SERVER_ROUTES, '/api/modules/smokecraft'),'server routes mount at /api/modules/smokecraft')
assert(fileContains(INDEX, 'smokecraftModuleRoutes'),         'server/index.js mounts smokecraft module routes')

// ── 14. Protected sealed files not compromised ───────────────────────────────
console.log('\nProtected visual files (existence check):')
assert(fileExists(ASSET_SCREEN),  'SmokeCraftAssetScreen.jsx still exists (not deleted)')
assert(fileExists(HOTSPOT),       'SmokeCraftHotspotLayer.jsx still exists (not deleted)')
assert(fileExists(ASSET_ROUTE),   'SmokeCraftAssetRoute.jsx still exists (not deleted)')
assert(fileExists(SESSION_JS),    'session.js (VISIT_STRUCTURE) still exists (not deleted)')
assert(fileExists(JOURNEY_CONST), 'smokecraftJourney.js still exists (not deleted)')

// ── 15. Honest status — no false production claims ───────────────────────────
console.log('\nHonest status (no false claims):')
assert(fileNotContains(MANIFEST,  'marketplace_status: .live.'),         'manifest does not claim marketplace live')
assert(fileNotMatchesPattern(MANIFEST, /^\s+enforced: true/m),           'manifest does not say enforced: true')
assert(fileNotContains(POS_ADAPTER, 'sent: true'),                       'pos adapter never claims sent: true')
assert(fileNotContains(EAT_ADAPTER, 'sent: true'),                       'eat adapter never claims sent: true')
assert(fileNotContains(ORDER_SVC, 'pos360Connected: true'),              'ordering service never claims POS connected')
assert(fileNotContains(PAIRING_SVC, 'aiBacked: true'),                  'pairing service never claims AI backed')

// ── Results ──────────────────────────────────────────────────────────────────
console.log(`
── Results ──
  Passed: ${pass.length}
  Failed: ${fail.length}
`)

if (fail.length > 0) {
  console.error('Failed assertions:')
  fail.forEach(f => console.error(`  - ${f}`))
  process.exit(1)
} else {
  console.log('  All SmokeCraft Experience Module assertions passed.')
  console.log('  SmokeCraft is registered as a NOVEE OS module preview.')
  console.log('  Status: registered_preview · not_yet_packaged · not_live_marketplace · license_not_enforced')
  console.log('  Journey: 8 visits / 24 sessions — Flavor Memory position confirmed.')
  console.log('  Protected files: intact.')
  console.log('  Next: MODULE BUILD 3 — SmokeCraft Ordering, Venue Menu, POS360, and Staff Handoff Integration')
}
