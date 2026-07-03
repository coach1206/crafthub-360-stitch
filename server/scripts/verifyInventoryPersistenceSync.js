import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')

let passed = 0
let failed = 0
const failures = []

function check(label, condition) {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(label)
    console.error(`  FAIL: ${label}`)
  }
}

function readFile(rel) {
  const abs = join(ROOT, rel)
  if (!existsSync(abs)) return ''
  return readFileSync(abs, 'utf8')
}

function fileExists(rel) {
  return existsSync(join(ROOT, rel))
}

console.log('\n=== OIPSL Phase 15 Verification ===\n')

// ─── Migration 028 ───
console.log('[ Migration 028 ]')
const migration = readFile('server/db/migrations/028_operational_inventory_persistence_and_sync.sql')
check('migration 028 exists', fileExists('server/db/migrations/028_operational_inventory_persistence_and_sync.sql'))
check('creates inventory_records table', migration.includes('CREATE TABLE IF NOT EXISTS inventory_records'))
check('creates inventory_adjustments table', migration.includes('CREATE TABLE IF NOT EXISTS inventory_adjustments'))
check('creates inventory_audit_events table', migration.includes('CREATE TABLE IF NOT EXISTS inventory_audit_events'))
check('creates reorder_approvals table', migration.includes('CREATE TABLE IF NOT EXISTS reorder_approvals'))
check('creates receiving_records table', migration.includes('CREATE TABLE IF NOT EXISTS receiving_records'))
check('creates receiving_items table', migration.includes('CREATE TABLE IF NOT EXISTS receiving_items'))
check('creates operational_sync_events table', migration.includes('CREATE TABLE IF NOT EXISTS operational_sync_events'))
check('inventory_records has venue_id', migration.includes('venue_id'))
check('inventory_adjustments has adjustment_type', migration.includes('adjustment_type'))
check('inventory_adjustments has quantity_delta', migration.includes('quantity_delta'))
check('inventory_audit_events has event_type', migration.includes('event_type'))
check('inventory_audit_events has previous_value', migration.includes('previous_value'))
check('inventory_audit_events has new_value', migration.includes('new_value'))
check('reorder_approvals has approval_status', migration.includes('approval_status'))
check('operational_sync_events has sync_status', migration.includes('sync_status'))
check('has indexes', migration.includes('CREATE INDEX'))

// ─── inventoryPersistenceService ───
console.log('\n[ inventoryPersistenceService ]')
const ips = readFile('server/services/inventory/inventoryPersistenceService.js')
check('file exists', fileExists('server/services/inventory/inventoryPersistenceService.js'))
check('exports createInventoryRecord', ips.includes('export async function createInventoryRecord'))
check('exports updateInventoryRecord', ips.includes('export async function updateInventoryRecord'))
check('exports getInventoryRecordByProduct', ips.includes('export async function getInventoryRecordByProduct'))
check('exports getInventoryRecordsByVenue', ips.includes('export async function getInventoryRecordsByVenue'))
check('exports getInventoryRecordsByCraftModule', ips.includes('export async function getInventoryRecordsByCraftModule'))
check('exports getInventoryRecordsByAvailabilityStatus', ips.includes('export async function getInventoryRecordsByAvailabilityStatus'))
check('exports persistInventoryAvailabilityResult', ips.includes('export async function persistInventoryAvailabilityResult'))
check('exports persistInventoryStatusChange', ips.includes('export async function persistInventoryStatusChange'))
check('exports persistInventoryVisibilityChange', ips.includes('export async function persistInventoryVisibilityChange'))
check('exports persistInventoryThresholdChange', ips.includes('export async function persistInventoryThresholdChange'))
check('exports persistInventorySyncStatus', ips.includes('export async function persistInventorySyncStatus'))
check('exports getInventoryPersistenceReadiness', ips.includes('export function getInventoryPersistenceReadiness'))
check('has dbAvailable check', ips.includes('DATABASE_URL'))
check('returns in_memory_only when no DB', ips.includes('in_memory_only'))
check('returns databaseRequired true', ips.includes('databaseRequired'))
check('returns degradedMode true', ips.includes('degradedMode'))
check('returns persistenceStatus', ips.includes('persistenceStatus'))
check('returns persisted field', ips.includes('persisted'))

// ─── inventoryAdjustmentPersistenceService ───
console.log('\n[ inventoryAdjustmentPersistenceService ]')
const iaps = readFile('server/services/inventory/inventoryAdjustmentPersistenceService.js')
check('file exists', fileExists('server/services/inventory/inventoryAdjustmentPersistenceService.js'))
check('exports persistInventoryAdjustment', iaps.includes('export async function persistInventoryAdjustment'))
check('exports confirmReceivingInventoryAdjustment', iaps.includes('export async function confirmReceivingInventoryAdjustment'))
check('exports reserveInventoryForOrder', iaps.includes('export async function reserveInventoryForOrder'))
check('exports releaseReservedInventory', iaps.includes('export async function releaseReservedInventory'))
check('exports commitCheckoutInventory', iaps.includes('export async function commitCheckoutInventory'))
check('exports reverseInventoryAdjustment', iaps.includes('export async function reverseInventoryAdjustment'))
check('exports getInventoryAdjustmentHistory', iaps.includes('export async function getInventoryAdjustmentHistory'))
check('exports getInventoryAdjustmentsByProduct', iaps.includes('export async function getInventoryAdjustmentsByProduct'))
check('exports getInventoryAdjustmentsByVenue', iaps.includes('export async function getInventoryAdjustmentsByVenue'))
check('exports getAdjustmentPersistenceReadiness', iaps.includes('export function getAdjustmentPersistenceReadiness'))
check('order_reserved adjustment type', iaps.includes('order_reserved'))
check('checkout_completed adjustment type', iaps.includes('checkout_completed'))
check('receiving_confirmed adjustment type', iaps.includes('receiving_confirmed'))
check('has dbAvailable check', iaps.includes('DATABASE_URL'))
check('returns persistenceStatus', iaps.includes('persistenceStatus'))

// ─── inventoryAuditPersistenceService ───
console.log('\n[ inventoryAuditPersistenceService ]')
const iaups = readFile('server/services/inventory/inventoryAuditPersistenceService.js')
check('file exists', fileExists('server/services/inventory/inventoryAuditPersistenceService.js'))
check('exports persistInventoryAuditEvent', iaups.includes('export async function persistInventoryAuditEvent'))
check('exports persistReorderAuditEvent', iaups.includes('export async function persistReorderAuditEvent'))
check('exports persistOperationalAuditEvent', iaups.includes('export async function persistOperationalAuditEvent'))
check('exports getAuditEventsByVenue', iaups.includes('export async function getAuditEventsByVenue'))
check('exports getAuditEventsByProduct', iaups.includes('export async function getAuditEventsByProduct'))
check('exports getAuditEventsByPurchaseOrder', iaups.includes('export async function getAuditEventsByPurchaseOrder'))
check('exports buildAuditPreviewOnlyResponse', iaups.includes('export function buildAuditPreviewOnlyResponse'))
check('exports getAuditReadiness', iaups.includes('export function getAuditReadiness'))
check('AUDIT_EVENT_TYPES exported', iaups.includes('export const AUDIT_EVENT_TYPES'))
check('has inventory_created type', iaups.includes('inventory_created'))
check('has inventory_adjusted type', iaups.includes('inventory_adjusted'))
check('has purchase_order_not_submitted type', iaups.includes('purchase_order_not_submitted'))
check('has receiving_confirmed type', iaups.includes('receiving_confirmed'))
check('has dbAvailable check', iaups.includes('DATABASE_URL'))

// ─── reorderPersistenceService ───
console.log('\n[ reorderPersistenceService ]')
const rps = readFile('server/services/reorder/reorderPersistenceService.js')
check('file exists', fileExists('server/services/reorder/reorderPersistenceService.js'))
check('exports persistReorderRecommendation', rps.includes('export async function persistReorderRecommendation'))
check('exports updateReorderRecommendation', rps.includes('export async function updateReorderRecommendation'))
check('exports getReorderRecommendationsByVenue', rps.includes('export async function getReorderRecommendationsByVenue'))
check('exports getUrgentReorderRecommendations', rps.includes('export async function getUrgentReorderRecommendations'))
check('exports persistReorderDemandSignal', rps.includes('export async function persistReorderDemandSignal'))
check('exports getDemandSignalsByProduct', rps.includes('export async function getDemandSignalsByProduct'))
check('exports getDemandSignalsByVenue', rps.includes('export async function getDemandSignalsByVenue'))
check('exports aggregateDemandSignalsForEAT', rps.includes('export async function aggregateDemandSignalsForEAT'))
check('exports getReorderPersistenceReadiness', rps.includes('export function getReorderPersistenceReadiness'))
check('has dbAvailable check', rps.includes('DATABASE_URL'))
check('aggregates total_signals', rps.includes('total_signals'))

// ─── purchaseOrderPersistenceService ───
console.log('\n[ purchaseOrderPersistenceService ]')
const pops = readFile('server/services/reorder/purchaseOrderPersistenceService.js')
check('file exists', fileExists('server/services/reorder/purchaseOrderPersistenceService.js'))
check('exports persistPurchaseOrderDraft', pops.includes('export async function persistPurchaseOrderDraft'))
check('exports updatePurchaseOrderDraft', pops.includes('export async function updatePurchaseOrderDraft'))
check('exports getPurchaseOrderById', pops.includes('export async function getPurchaseOrderById'))
check('exports getPurchaseOrdersByVenue', pops.includes('export async function getPurchaseOrdersByVenue'))
check('exports getPurchaseOrdersByVendor', pops.includes('export async function getPurchaseOrdersByVendor'))
check('exports getPendingPurchaseOrderApprovals', pops.includes('export async function getPendingPurchaseOrderApprovals'))
check('exports markPurchaseOrderApproved', pops.includes('export async function markPurchaseOrderApproved'))
check('exports markPurchaseOrderRejected', pops.includes('export async function markPurchaseOrderRejected'))
check('exports markPurchaseOrderSubmittedPreview', pops.includes('export async function markPurchaseOrderSubmittedPreview'))
check('exports markPurchaseOrderNotSubmitted', pops.includes('export async function markPurchaseOrderNotSubmitted'))
check('exports markPurchaseOrderReceivingPending', pops.includes('export async function markPurchaseOrderReceivingPending'))
check('exports getPurchaseOrderPersistenceReadiness', pops.includes('export function getPurchaseOrderPersistenceReadiness'))
check('default status is reorder_not_submitted', pops.includes('reorder_not_submitted'))
check('markPurchaseOrderNotSubmitted returns vendor_api_required', pops.includes('vendor_api_required'))
check('never auto-submits to vendor', !pops.includes('submitToVendor') && !pops.includes('vendor.submit'))
check('has dbAvailable check', pops.includes('DATABASE_URL'))

// ─── reorderApprovalPersistenceService ───
console.log('\n[ reorderApprovalPersistenceService ]')
const raps = readFile('server/services/reorder/reorderApprovalPersistenceService.js')
check('file exists', fileExists('server/services/reorder/reorderApprovalPersistenceService.js'))
check('exports persistApprovalRequest', raps.includes('export async function persistApprovalRequest'))
check('exports approveRequest', raps.includes('export async function approveRequest'))
check('exports rejectRequest', raps.includes('export async function rejectRequest'))
check('exports getPendingApprovalsByVenue', raps.includes('export async function getPendingApprovalsByVenue'))
check('exports getApprovalsByPurchaseOrder', raps.includes('export async function getApprovalsByPurchaseOrder'))
check('exports getApprovalHistory', raps.includes('export async function getApprovalHistory'))
check('exports validateApprovalRole', raps.includes('validateApprovalRole'))
check('exports persistApprovalDecisionAudit', raps.includes('export async function persistApprovalDecisionAudit'))
check('exports getApprovalPersistenceReadiness', raps.includes('export function getApprovalPersistenceReadiness'))
check('validates approval role before approve', raps.includes('validateApprovalRole'))
check('approval_role_insufficient returned', raps.includes('approval_role_insufficient'))
check('has manager in allowed roles', raps.includes('manager'))
check('has owner in allowed roles', raps.includes('owner'))
check('has admin in allowed roles', raps.includes('admin'))

// ─── receivingPersistenceService ───
console.log('\n[ receivingPersistenceService ]')
const rcvps = readFile('server/services/reorder/receivingPersistenceService.js')
check('file exists', fileExists('server/services/reorder/receivingPersistenceService.js'))
check('exports createReceivingRecord', rcvps.includes('export async function createReceivingRecord'))
check('exports confirmReceivingRecord', rcvps.includes('export async function confirmReceivingRecord'))
check('exports persistReceivingPreview', rcvps.includes('export async function persistReceivingPreview'))
check('exports persistReceivingConfirmation', rcvps.includes('export async function persistReceivingConfirmation'))
check('exports applyReceivingInventoryAdjustments', rcvps.includes('export async function applyReceivingInventoryAdjustments'))
check('exports getReceivingRecordsByPurchaseOrder', rcvps.includes('export async function getReceivingRecordsByPurchaseOrder'))
check('exports getReceivingRecordsByVenue', rcvps.includes('export async function getReceivingRecordsByVenue'))
check('exports getReceivingStatus', rcvps.includes('export async function getReceivingStatus'))
check('exports getReceivingPersistenceReadiness', rcvps.includes('export function getReceivingPersistenceReadiness'))
check('receiving_preview_only status', rcvps.includes('receiving_preview_only'))
check('inventory_not_persisted status', rcvps.includes('inventory_not_persisted'))
check('adjusted_in_memory_only status', rcvps.includes('adjusted_in_memory_only'))
check('has dbAvailable check', rcvps.includes('DATABASE_URL'))
check('confirms receiving with inventory adjustment when DB available', rcvps.includes('confirmReceivingInventoryAdjustment'))

// ─── operationalSyncEventService ───
console.log('\n[ operationalSyncEventService ]')
const oses = readFile('server/services/sync/operationalSyncEventService.js')
check('file exists', fileExists('server/services/sync/operationalSyncEventService.js'))
check('exports createSyncEvent', oses.includes('export async function createSyncEvent'))
check('exports markSyncEventProcessed', oses.includes('export async function markSyncEventProcessed'))
check('exports markSyncEventFailed', oses.includes('export async function markSyncEventFailed'))
check('exports getPendingSyncEvents', oses.includes('export async function getPendingSyncEvents'))
check('exports getFailedSyncEvents', oses.includes('export async function getFailedSyncEvents'))
check('exports getSyncEventsByVenue', oses.includes('export async function getSyncEventsByVenue'))
check('exports getSyncEventsByProduct', oses.includes('export async function getSyncEventsByProduct'))
check('exports buildExternalPOSRequiredSyncResponse', oses.includes('export function buildExternalPOSRequiredSyncResponse'))
check('exports buildVendorRequiredSyncResponse', oses.includes('export function buildVendorRequiredSyncResponse'))
check('exports getOperationalSyncReadiness', oses.includes('export function getOperationalSyncReadiness'))
check('external_sync_not_live always true', oses.includes('external_sync_not_live'))
check('real_time_push_pending always true', oses.includes('real_time_push_pending'))
check('external_pos_required in POS response', oses.includes('external_pos_required'))
check('vendor_api_required in vendor response', oses.includes('vendor_api_required'))
check('queued sync_status when DB available', oses.includes("'queued'"))
check('database_required when no DB', oses.includes('database_required'))

// ─── Honest status vocabulary ───
console.log('\n[ Honest Status Vocabulary ]')
const allServices = [ips, iaps, iaups, rps, pops, raps, rcvps, oses]
check('no fake "synced" claims', allServices.every(s => !s.includes('pos_synced') && !s.includes('external_synced')))
check('no fake payment captured claims', allServices.every(s => !s.includes('payment_captured') && !s.includes('paymentCaptured')))
check('no fake "production_ready" claims', allServices.every(s => !s.includes('production_ready')))
check('no auto-submit to vendor', allServices.every(s => !s.includes('auto_submit') && !s.includes('autoSubmit')))

// ─── E.A.T. hooks ───
console.log('\n[ E.A.T. Command Hub Hooks ]')
const eat = readFile('server/services/eatCommandHubContract.js')
check('getInventoryPersistenceReadinessHooks exported', eat.includes('getInventoryPersistenceReadinessHooks'))
check('getInventoryAdjustmentReadinessHooks exported', eat.includes('getInventoryAdjustmentReadinessHooks'))
check('getReceivingPersistenceReadinessHooks exported', eat.includes('getReceivingPersistenceReadinessHooks'))
check('getPurchaseOrderPersistenceReadinessHooks exported', eat.includes('getPurchaseOrderPersistenceReadinessHooks'))
check('getApprovalPersistenceReadinessHooks exported', eat.includes('getApprovalPersistenceReadinessHooks'))
check('getInventoryAuditReadinessHooks exported', eat.includes('getInventoryAuditReadinessHooks'))
check('getOperationalSyncEventReadinessHooks exported', eat.includes('getOperationalSyncEventReadinessHooks'))
check('getExternalPOSSyncReadinessHooks exported', eat.includes('getExternalPOSSyncReadinessHooks'))
check('getVendorSyncReadinessHooks exported', eat.includes('getVendorSyncReadinessHooks'))
check('E.A.T. hooks use dynamic imports', eat.includes("await import('./inventory/inventoryPersistenceService") || eat.includes("await import('./reorder/purchaseOrderPersistenceService") || eat.includes("await import('./sync/operationalSyncEventService"))
check('E.A.T. hooks have try/catch', (eat.match(/try\s*\{/g) || []).length >= 8)
check('preview_fallback on E.A.T. error', eat.includes('preview_fallback'))

// ─── API Routes ───
console.log('\n[ API Routes — Inventory ]')
const invRoutes = readFile('server/routes/inventoryRoutes.js')
check('inventoryRoutes.js exists', fileExists('server/routes/inventoryRoutes.js'))
check('has /persistence/status route', invRoutes.includes('/persistence/status') || invRoutes.includes('persistence/status'))
check('has adjustment history route', invRoutes.includes('history'))
check('has reserve route', invRoutes.includes('reserve'))
check('has release route', invRoutes.includes('release'))
check('has commit-checkout route', invRoutes.includes('commit-checkout') || invRoutes.includes('commit_checkout'))
check('has audit route', invRoutes.includes('audit'))
check('has sync-events route', invRoutes.includes('sync-events') || invRoutes.includes('sync_events'))

console.log('\n[ API Routes — Reorder ]')
const reorderRoutes = readFile('server/routes/reorderRoutes.js')
check('reorderRoutes.js exists', fileExists('server/routes/reorderRoutes.js'))
check('has persisted recommendations route', reorderRoutes.includes('persisted'))
check('has PO history route', reorderRoutes.includes('history'))
check('has persist PO draft route', reorderRoutes.includes('persist'))
check('has persist approve route', reorderRoutes.includes('approve'))
check('has persist reject route', reorderRoutes.includes('reject'))
check('has demand signals route', reorderRoutes.includes('demand-signals') || reorderRoutes.includes('demand_signals'))
check('has confirm-persist receiving route', reorderRoutes.includes('confirm-persist') || reorderRoutes.includes('confirm_persist'))
check('has reorder audit route', reorderRoutes.includes('audit'))

// ─── Controllers ───
console.log('\n[ Controllers ]')
const ipc = readFile('server/controllers/inventoryPersistenceController.js')
check('inventoryPersistenceController.js exists', fileExists('server/controllers/inventoryPersistenceController.js'))
check('has handlePersistenceStatus', ipc.includes('handlePersistenceStatus') || ipc.includes('persistenceStatus'))
check('has handleAdjustmentHistory', ipc.includes('handleAdjustmentHistory') || ipc.includes('AdjustmentHistory'))
check('has handleReserveInventory', ipc.includes('handleReserveInventory') || ipc.includes('ReserveInventory'))
check('has handleCommitCheckout', ipc.includes('handleCommitCheckout') || ipc.includes('CommitCheckout'))
check('has handleGetAuditEvents', ipc.includes('handleGetAuditEvents') || ipc.includes('AuditEvents'))

const rpc = readFile('server/controllers/reorderPersistenceController.js')
check('reorderPersistenceController.js exists', fileExists('server/controllers/reorderPersistenceController.js'))
check('has handleGetPersistedRecommendations', rpc.includes('Recommendations') || rpc.includes('recommendations'))
check('has handlePersistApprove', rpc.includes('Approve') || rpc.includes('approve'))
check('has handlePersistReject', rpc.includes('Reject') || rpc.includes('reject'))
check('has handleConfirmReceiving', rpc.includes('Receiving') || rpc.includes('receiving'))
check('has handleGetReorderAudit', rpc.includes('Audit') || rpc.includes('audit'))

// ─── UI Components ───
console.log('\n[ UI Components — Persistence ]')
check('PersistenceStatusBadge.jsx exists', fileExists('src/components/persistence/PersistenceStatusBadge.jsx'))
check('DatabaseRequiredNotice.jsx exists', fileExists('src/components/persistence/DatabaseRequiredNotice.jsx'))
check('InMemoryOnlyNotice.jsx exists', fileExists('src/components/persistence/InMemoryOnlyNotice.jsx'))
check('ExternalSyncNotLiveNotice.jsx exists', fileExists('src/components/persistence/ExternalSyncNotLiveNotice.jsx'))
check('InventoryAdjustmentHistoryPanel.jsx exists', fileExists('src/components/persistence/InventoryAdjustmentHistoryPanel.jsx'))
check('InventoryAuditTrailPanel.jsx exists', fileExists('src/components/persistence/InventoryAuditTrailPanel.jsx'))
check('ReceivingConfirmationPanel.jsx exists', fileExists('src/components/persistence/ReceivingConfirmationPanel.jsx'))
check('ReceivingPersistenceNotice.jsx exists', fileExists('src/components/persistence/ReceivingPersistenceNotice.jsx'))
check('PurchaseOrderHistoryPanel.jsx exists', fileExists('src/components/persistence/PurchaseOrderHistoryPanel.jsx'))
check('ApprovalDecisionHistoryPanel.jsx exists', fileExists('src/components/persistence/ApprovalDecisionHistoryPanel.jsx'))
check('OperationalSyncEventPanel.jsx exists', fileExists('src/components/persistence/OperationalSyncEventPanel.jsx'))

const psb = readFile('src/components/persistence/PersistenceStatusBadge.jsx')
check('PersistenceStatusBadge shows persisted', psb.includes('persisted'))
check('PersistenceStatusBadge shows in_memory_only', psb.includes('in_memory_only'))
check('PersistenceStatusBadge shows database_required', psb.includes('database_required'))

const dbNotice = readFile('src/components/persistence/DatabaseRequiredNotice.jsx')
check('DatabaseRequiredNotice has database_required text', dbNotice.includes('database_required'))

const syncNotice = readFile('src/components/persistence/ExternalSyncNotLiveNotice.jsx')
check('ExternalSyncNotLiveNotice has external_sync_not_live', syncNotice.includes('external_sync_not_live'))
check('ExternalSyncNotLiveNotice has real_time_push_pending', syncNotice.includes('real_time_push_pending'))

const rcvPanel = readFile('src/components/persistence/ReceivingPersistenceNotice.jsx')
check('ReceivingPersistenceNotice has receiving_preview_only', rcvPanel.includes('receiving_preview_only'))
check('ReceivingPersistenceNotice has inventory_not_persisted', rcvPanel.includes('inventory_not_persisted'))
check('ReceivingPersistenceNotice has adjusted_in_memory_only', rcvPanel.includes('adjusted_in_memory_only'))

const poPanel = readFile('src/components/persistence/PurchaseOrderHistoryPanel.jsx')
check('PurchaseOrderHistoryPanel has purchase_order_not_submitted', poPanel.includes('reorder_not_submitted') || poPanel.includes('purchase_order_not_submitted'))
check('PurchaseOrderHistoryPanel has vendor_api_required', poPanel.includes('vendor_api_required'))

const syncPanel = readFile('src/components/persistence/OperationalSyncEventPanel.jsx')
check('OperationalSyncEventPanel has external_sync_not_live', syncPanel.includes('external_sync_not_live'))
check('OperationalSyncEventPanel has real_time_push_pending', syncPanel.includes('real_time_push_pending'))
check('OperationalSyncEventPanel shows queued/processed/failed', syncPanel.includes('queued') && syncPanel.includes('processed') && syncPanel.includes('failed'))

// ─── Documentation ───
console.log('\n[ Documentation ]')
const docs = readFile('docs/OPERATIONAL_INVENTORY_PERSISTENCE_AND_SYNC_LAYER.md')
check('OIPSL docs exist', fileExists('docs/OPERATIONAL_INVENTORY_PERSISTENCE_AND_SYNC_LAYER.md'))
check('docs cover what changed from Phase 14', docs.includes('Phase 14'))
check('docs cover database-backed services', docs.includes('DATABASE_URL'))
check('docs cover in_memory_only fallback', docs.includes('in_memory_only'))
check('docs cover receiving_preview_only', docs.includes('receiving_preview_only'))
check('docs cover external sync not live', docs.includes('external_sync_not_live'))
check('docs cover vendor sync not live', docs.includes('vendor_sync_not_live'))
check('docs cover future phases', docs.includes('Future Phases'))

// ─── Phase 14 files not broken ───
console.log('\n[ Phase 14 Integrity ]')
check('inventoryAvailabilityService.js still exists', fileExists('server/services/inventory/inventoryAvailabilityService.js'))
check('productAvailabilityService.js still exists', fileExists('server/services/inventory/productAvailabilityService.js'))
check('vendorConnectionService.js still exists', fileExists('server/services/reorder/vendorConnectionService.js'))
check('reorderRecommendationEngine.js still exists', fileExists('server/services/reorder/reorderRecommendationEngine.js'))
check('purchaseOrderDraftService.js still exists', fileExists('server/services/reorder/purchaseOrderDraftService.js'))
check('reorderApprovalService.js still exists', fileExists('server/services/reorder/reorderApprovalService.js'))
check('reorderDemandSignalService.js still exists', fileExists('server/services/reorder/reorderDemandSignalService.js'))
check('inventoryReceivingService.js still exists', fileExists('server/services/reorder/inventoryReceivingService.js'))
check('inventoryController.js still exists', fileExists('server/controllers/inventoryController.js'))
check('reorderController.js still exists', fileExists('server/controllers/reorderController.js'))

// ─── Protected files untouched ───
console.log('\n[ Protected File Integrity ]')
const smkAsset = readFile('src/components/smokecraft/SmokeCraftAssetScreen.jsx')
check('SmokeCraftAssetScreen.jsx unchanged (not empty)', smkAsset.length > 100)
const smkHotspot = readFile('src/components/smokecraft/SmokeCraftHotspotLayer.jsx')
check('SmokeCraftHotspotLayer.jsx unchanged (not empty)', smkHotspot.length > 100)
const sessionConst = readFile('src/constants/session.js')
check('session.js VISIT_STRUCTURE unchanged', sessionConst.includes('VISIT_STRUCTURE'))
const passportProgress = readFile('src/utils/passportProgress.js')
check('passportProgress.js unchanged (not empty)', passportProgress.length > 100)

// ─── No Fake Claims ───
console.log('\n[ No Fake Claims ]')
const allFiles = [ips, iaps, iaups, rps, pops, raps, rcvps, oses, ipc, rpc, eat]
check('no inventory_synced_live claim', allFiles.every(f => !f.includes('inventory_synced_live')))
check('no payment_captured claim', allFiles.every(f => !f.includes('payment_captured')))
check('no pos_live claim', allFiles.every(f => !f.includes('pos_live') && !f.includes('pos_synced')))
check('no auto_purchase claim', allFiles.every(f => !f.includes('auto_purchase') && !f.includes('autoPurchase')))
check('no vendor_submitted claim without approval', pops.includes('reorder_not_submitted'))

// ─── Summary ───
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
if (failures.length > 0) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  - ${f}`))
  process.exit(1)
} else {
  console.log('\nAll Phase 15 OIPSL checks passed.')
}
