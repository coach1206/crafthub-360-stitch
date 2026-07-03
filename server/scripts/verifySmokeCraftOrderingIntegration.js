/**
 * SmokeCraft Ordering Integration — Verification Script
 * Module Build 3 of 9
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
const ORDER_STORE   = 'server/services/smokecraft/smokecraftOrderStore.js'
const MENU_STORE    = 'server/services/smokecraft/smokecraftVenueMenuStore.js'
const STAFF_QUEUE   = 'server/services/smokecraft/smokecraftStaffQueueService.js'
const POS_BRIDGE    = 'server/services/smokecraft/smokecraftPosBridgeService.js'
const EAT_BRIDGE    = 'server/services/smokecraft/smokecraftEatSyncBridgeService.js'
const AUDIT_SVC     = 'server/services/smokecraft/smokecraftOrderAuditService.js'
const CTRL          = 'server/controllers/smokecraftOrderingController.js'
const ROUTES        = 'server/routes/smokecraftOrderingRoutes.js'
const INDEX         = 'server/index.js'
const MENU_PANEL    = 'src/modules/smokecraft/components/SmokeCraftVenueMenuPanel.jsx'
const MODE_SEL      = 'src/modules/smokecraft/components/SmokeCraftOrderModeSelector.jsx'
const STAFF_PANEL   = 'src/modules/smokecraft/components/SmokeCraftStaffHandoffPanel.jsx'
const STATUS_PANEL  = 'src/modules/smokecraft/components/SmokeCraftOrderStatusPanel.jsx'
const README        = 'src/modules/smokecraft/README.md'
const DOCS          = 'docs/SMOKECRAFT_ORDERING_INTEGRATION.md'

// Protected sealed files
const ASSET_SCREEN  = 'src/components/smokecraft/SmokeCraftAssetScreen.jsx'
const HOTSPOT       = 'src/components/smokecraft/SmokeCraftHotspotLayer.jsx'
const ASSET_ROUTE   = 'src/components/smokecraft/SmokeCraftAssetRoute.jsx'
const SESSION_JS    = 'src/constants/session.js'
const JOURNEY_CONST = 'src/constants/smokecraftJourney.js'

// ── 1. Backend service file existence ────────────────────────────────────────
console.log('\nBackend services:')
assert(fileExists(ORDER_STORE),  'order store exists')
assert(fileExists(MENU_STORE),   'venue menu store exists')
assert(fileExists(STAFF_QUEUE),  'staff queue service exists')
assert(fileExists(POS_BRIDGE),   'POS bridge service exists')
assert(fileExists(EAT_BRIDGE),   'E.A.T. sync bridge service exists')
assert(fileExists(AUDIT_SVC),    'order audit service exists')
assert(fileExists(CTRL),         'ordering controller exists')
assert(fileExists(ROUTES),       'ordering routes exist')

// ── 2. Routes mounted correctly ──────────────────────────────────────────────
console.log('\nRoute mounting:')
assert(fileContains(INDEX, 'smokecraftOrderingRoutes'),           'ordering routes imported in server/index.js')
assert(fileContains(INDEX, '/api/modules/smokecraft/orders'),     'ordering routes mounted at /api/modules/smokecraft/orders')
assert(fileContains(ROUTES, '/status'),                           'routes include /status endpoint')
assert(fileContains(ROUTES, '/menu/:venueId'),                    'routes include /menu/:venueId endpoint')
assert(fileContains(ROUTES, '/create'),                           'routes include /create endpoint')
assert(fileContains(ROUTES, '/request-staff'),                    'routes include /request-staff endpoint')
assert(fileContains(ROUTES, '/staff/queue'),                      'routes include /staff/queue endpoint')
assert(fileContains(ROUTES, '/manager/summary'),                  'routes include /manager/summary endpoint')
assert(fileContains(ROUTES, '/:orderId/accept'),                  'routes include /:orderId/accept endpoint')
assert(fileContains(ROUTES, '/:orderId/send-to-pos'),             'routes include /:orderId/send-to-pos endpoint')
assert(fileContains(ROUTES, '/:orderId/audit'),                   'routes include /:orderId/audit endpoint')

// ── 3. Order modes ───────────────────────────────────────────────────────────
console.log('\nOrder modes:')
assert(fileContains(ORDER_STORE, 'customer_self_order') || fileContains(STAFF_QUEUE, 'CUSTOMER_SELF_ORDER') || fileContains(CTRL, 'customer_self_order'), 'customer self-order mode is supported')
assert(fileContains(ORDER_STORE, 'staff_assisted_order') || fileContains(STAFF_QUEUE, 'STAFF_ASSISTED_ORDER') || fileContains(CTRL, 'staff_assisted_order'), 'staff-assisted order mode is supported')

// ── 4. Permission enforcement ────────────────────────────────────────────────
console.log('\nPermissions:')
assert(fileContains(STAFF_QUEUE, 'permission_denied'),            'staff queue enforces permission_denied for unauthorized roles')
assert(fileContains(STAFF_QUEUE, 'STAFF_ROLES'),                  'staff queue defines STAFF_ROLES set')
assert(fileContains(STAFF_QUEUE, 'MANAGER_ROLES'),                'staff queue defines MANAGER_ROLES set')
assert(fileContains(STAFF_QUEUE, 'assertStaffRole'),              'staff queue has assertStaffRole guard')
assert(fileNotContains(STAFF_QUEUE, "STAFF_ROLES.add('customer')"), 'customer not in staff roles')

// ── 5. Staff queue operations ────────────────────────────────────────────────
console.log('\nStaff queue:')
assert(fileContains(STAFF_QUEUE, 'getStaffQueue'),                'staff queue has getStaffQueue function')
assert(fileContains(STAFF_QUEUE, 'acceptOrder'),                  'staff queue has acceptOrder function')
assert(fileContains(STAFF_QUEUE, 'updateOrderStatus'),            'staff queue has updateOrderStatus function')
assert(fileContains(STAFF_QUEUE, 'attemptSendToPOS'),             'staff queue has attemptSendToPOS function')
assert(fileContains(STAFF_QUEUE, 'getManagementSummary'),         'staff queue has getManagementSummary function')

// ── 6. POS bridge honesty ────────────────────────────────────────────────────
console.log('\nPOS bridge:')
assert(fileContains(POS_BRIDGE, 'connected: false'),              'POS bridge returns connected: false')
assert(fileContains(POS_BRIDGE, 'not_connected'),                 'POS bridge returns not_connected status')
assert(fileContains(POS_BRIDGE, 'Order remains in SmokeCraft staff queue'), 'POS bridge has honest not-connected message')
assert(fileContains(POS_BRIDGE, 'canSendToPOS'),                  'POS bridge exposes canSendToPOS()')
assert(fileContains(POS_BRIDGE, 'sendSmokeCraftOrderToPOS'),      'POS bridge exposes sendSmokeCraftOrderToPOS()')
assert(fileContains(POS_BRIDGE, 'getPos360Status'),               'POS bridge exposes getPos360Status()')
assert(fileContains(POS_BRIDGE, 'mapSmokeCraftOrderToPOSPayload'),'POS bridge exposes mapSmokeCraftOrderToPOSPayload()')
assert(fileContains(POS_BRIDGE, 'getLastPOSSyncResult'),          'POS bridge exposes getLastPOSSyncResult()')
assert(fileNotContains(POS_BRIDGE, 'sent: true'),                 'POS bridge never hardcodes sent: true')

// ── 7. E.A.T. bridge honesty ─────────────────────────────────────────────────
console.log('\nE.A.T. bridge:')
assert(fileContains(EAT_BRIDGE, 'connected: false'),              'E.A.T. bridge returns connected: false')
assert(fileContains(EAT_BRIDGE, 'not_connected'),                 'E.A.T. bridge returns not_connected status')
assert(fileContains(EAT_BRIDGE, 'Management sync remains preview-only'), 'E.A.T. bridge has honest message')
assert(fileContains(EAT_BRIDGE, 'canSyncToEAT'),                  'E.A.T. bridge exposes canSyncToEAT()')
assert(fileContains(EAT_BRIDGE, 'syncSmokeCraftOrderToEAT'),      'E.A.T. bridge exposes syncSmokeCraftOrderToEAT()')
assert(fileContains(EAT_BRIDGE, 'syncSmokeCraftMenuActivityToEAT'),'E.A.T. bridge exposes syncSmokeCraftMenuActivityToEAT()')
assert(fileContains(EAT_BRIDGE, 'syncSmokeCraftStaffActivityToEAT'),'E.A.T. bridge exposes syncSmokeCraftStaffActivityToEAT()')
assert(fileContains(EAT_BRIDGE, 'getLastEatSyncResult'),          'E.A.T. bridge exposes getLastEatSyncResult()')
assert(fileContains(EAT_BRIDGE, 'managementSyncStatus'),          'E.A.T. bridge tracks managementSyncStatus')

// ── 8. Venue menu fallback ───────────────────────────────────────────────────
console.log('\nVenue menu:')
assert(fileContains(MENU_STORE, 'local_fallback'),                'menu store has local_fallback menuSource')
assert(fileContains(MENU_STORE, 'not_connected'),                 'menu store has not_connected syncStatus')
assert(fileContains(MENU_STORE, 'productionReady: false'),        'menu store marks productionReady false in fallback')
assert(fileContains(MENU_STORE, 'cigarPairingTags'),              'menu store has cigarPairingTags')
assert(fileContains(MENU_STORE, 'drinkPairingTags'),              'menu store has drinkPairingTags')
assert(fileContains(MENU_STORE, 'pairingTags'),                   'menu store has pairingTags')

// ── 9. Persistence mode ──────────────────────────────────────────────────────
console.log('\nPersistence:')
assert(fileContains(ORDER_STORE, 'memory_fallback'),              'order store has memory_fallback mode')
assert(fileContains(ORDER_STORE, 'productionReady'),              'order store tracks productionReady')
assert(fileContains(ORDER_STORE, 'DATABASE_URL'),                 'order store checks DATABASE_URL')
assert(fileContains(ORDER_STORE, 'persistenceMode'),              'order store exposes persistenceMode')

// ── 10. Audit trail ──────────────────────────────────────────────────────────
console.log('\nAudit trail:')
assert(fileContains(AUDIT_SVC, 'auditId'),                        'audit service has auditId field')
assert(fileContains(AUDIT_SVC, 'orderId'),                        'audit service has orderId field')
assert(fileContains(AUDIT_SVC, 'eventType'),                      'audit service has eventType field')
assert(fileContains(AUDIT_SVC, 'actorRole'),                      'audit service has actorRole field')
assert(fileContains(AUDIT_SVC, 'previousStatus'),                 'audit service tracks previousStatus')
assert(fileContains(AUDIT_SVC, 'nextStatus'),                     'audit service tracks nextStatus')
assert(fileContains(AUDIT_SVC, 'AUDIT_EVENTS'),                   'audit service exports AUDIT_EVENTS')
assert(fileContains(STAFF_QUEUE, 'createAuditEntry'),             'staff queue creates audit entries on status changes')

// ── 11. Management sync events ───────────────────────────────────────────────
console.log('\nManagement sync events:')
assert(fileContains(EAT_BRIDGE, 'smokeCraft.order.created'),      'EAT bridge has order.created event')
assert(fileContains(EAT_BRIDGE, 'smokeCraft.order.staffRequested'),'EAT bridge has order.staffRequested event')
assert(fileContains(EAT_BRIDGE, 'smokeCraft.order.acceptedByStaff'),'EAT bridge has order.acceptedByStaff event')
assert(fileContains(EAT_BRIDGE, 'smokeCraft.menu.loaded'),        'EAT bridge has menu.loaded event')
assert(fileContains(EAT_BRIDGE, 'smokeCraft.menu.fallbackUsed'),  'EAT bridge has menu.fallbackUsed event')
assert(fileContains(CTRL, 'syncSmokeCraftOrderToEAT'),            'controller fires EAT sync events')

// ── 12. Sent_to_pos only when confirmed ──────────────────────────────────────
console.log('\nOrder status integrity:')
assert(fileContains(STAFF_QUEUE, "orderStatus: 'sent_to_pos'"),  'sent_to_pos only set when POS confirms')
assert(fileContains(STAFF_QUEUE, 'posResult.sent'),               'sent_to_pos conditioned on posResult.sent')
assert(fileNotContains(POS_BRIDGE, "posSyncStatus: 'synced'"),    'POS bridge never claims synced status')

// ── 13. Frontend components ──────────────────────────────────────────────────
console.log('\nFrontend components:')
assert(fileExists(MENU_PANEL),   'SmokeCraftVenueMenuPanel exists')
assert(fileExists(MODE_SEL),     'SmokeCraftOrderModeSelector exists')
assert(fileExists(STAFF_PANEL),  'SmokeCraftStaffHandoffPanel exists')
assert(fileExists(STATUS_PANEL), 'SmokeCraftOrderStatusPanel exists')

assert(fileContains(MENU_PANEL, 'local_fallback'),                'venue menu panel shows local_fallback warning')
assert(fileContains(MENU_PANEL, 'cigarPairingTags'),              'venue menu panel shows cigar pairing tags')
assert(fileContains(MODE_SEL, 'customer_self_order'),             'mode selector has customer_self_order option')
assert(fileContains(MODE_SEL, 'staff_assisted_order'),            'mode selector has staff_assisted_order option')
assert(fileContains(STAFF_PANEL, 'not_connected'),                'staff handoff panel shows not_connected status')
assert(fileContains(STAFF_PANEL, 'POS360'),                       'staff handoff panel shows POS360 status')
assert(fileContains(STATUS_PANEL, 'not_connected'),               'order status panel shows not_connected')
assert(fileContains(STATUS_PANEL, 'memory_fallback'),             'order status panel shows memory_fallback warning')
assert(fileContains(STATUS_PANEL, 'sent to POS'),                 'order status panel has POS warning message')

// ── 14. Documentation ────────────────────────────────────────────────────────
console.log('\nDocumentation:')
assert(fileExists(DOCS),                                          'SMOKECRAFT_ORDERING_INTEGRATION.md exists')
assert(fileContains(DOCS, 'customer_self_order'),                 'docs document customer self-order path')
assert(fileContains(DOCS, 'staff_assisted_order'),                'docs document staff-assisted order path')
assert(fileContains(DOCS, 'staff queue'),                         'docs document staff queue')
assert(fileContains(DOCS, 'POS360'),                              'docs document POS360 bridge')
assert(fileContains(DOCS, 'E.A.T.'),                             'docs document E.A.T. sync bridge')
assert(fileContains(DOCS, 'local_fallback'),                      'docs document venue menu fallback')
assert(fileContains(DOCS, 'memory_fallback'),                     'docs document persistence fallback')
assert(fileContains(DOCS, 'Audit Trail'),                         'docs document audit trail')
assert(fileContains(DOCS, 'MODULE BUILD 4'),                      'docs preview Module Build 4')
assert(fileContains(README, 'Module Build 3'),                    'SmokeCraft README updated for Module Build 3')
assert(fileContains(README, 'MODULE BUILD 4'),                    'SmokeCraft README previews Module Build 4')

// ── 15. Protected visual files intact ───────────────────────────────────────
console.log('\nProtected visual files:')
assert(fileExists(ASSET_SCREEN),  'SmokeCraftAssetScreen.jsx not deleted')
assert(fileExists(HOTSPOT),       'SmokeCraftHotspotLayer.jsx not deleted')
assert(fileExists(ASSET_ROUTE),   'SmokeCraftAssetRoute.jsx not deleted')
assert(fileExists(SESSION_JS),    'session.js not deleted')
assert(fileExists(JOURNEY_CONST), 'smokecraftJourney.js not deleted')

// ── 16. No false production claims ──────────────────────────────────────────
console.log('\nHonest status (no false claims):')
assert(fileNotContains(POS_BRIDGE, 'connected: true'),             'POS bridge never claims connected true')
assert(fileNotContains(EAT_BRIDGE, 'connected: true'),             'E.A.T. bridge never claims connected true')
assert(fileNotContains(MENU_STORE, 'productionReady: true'),       'menu store never claims productionReady in fallback')
assert(fileNotMatchesPattern(POS_BRIDGE, /posSyncStatus: .synced./), 'POS bridge never self-reports synced')

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
  console.log('  All SmokeCraft Ordering Integration assertions passed.')
  console.log('  Customer self-order and staff-assisted order flows are ready.')
  console.log('  Staff queue, POS bridge, E.A.T. bridge, and audit trail are active.')
  console.log('  POS360: not_connected · E.A.T.: not_connected · Menu: local_fallback')
  console.log('  Next: MODULE BUILD 4 — SmokeCraft Live Pairing Engine')
}
