/**
 * Verify Reorder Connectors (Phase 14 — DMRC)
 * 130 checks
 */

import { readFileSync, existsSync } from 'fs'

let passed = 0, failed = 0
const failures = []

function check(label, condition) {
  if (condition) { passed++; process.stdout.write('.') }
  else { failed++; failures.push(label); process.stdout.write('F') }
}

function readFile(path) {
  try { return existsSync(path) ? readFileSync(path, 'utf8') : '' } catch { return '' }
}

// 1-20. vendorConnectionService
const vcs = readFile('server/services/reorder/vendorConnectionService.js')
check('vendorConnectionService exists', vcs.length > 0)
check('registerVendor exists', vcs.includes('export function registerVendor'))
check('getVendor exists', vcs.includes('export function getVendor'))
check('listVenueVendors exists', vcs.includes('export function listVenueVendors'))
check('getPreferredVendorsForProduct exists', vcs.includes('export function getPreferredVendorsForProduct'))
check('getVendorConnectionReadiness exists', vcs.includes('export function getVendorConnectionReadiness'))
check('VENDOR_TYPES exported', vcs.includes('export const VENDOR_TYPES'))
check('REORDER_METHODS exported', vcs.includes('export const REORDER_METHODS'))
check('VENDOR_CONNECTION_STATUSES exported', vcs.includes('export const VENDOR_CONNECTION_STATUSES'))
check('distributor type exists', vcs.includes("'distributor'"))
check('manufacturer type exists', vcs.includes("'manufacturer'"))
check('pending_setup status exists', vcs.includes("'pending_setup'"))
check('api_required status exists', vcs.includes("'api_required'"))
check('distributor_connection_required in readiness', vcs.includes('distributor_connection_required'))
check('manufacturer_connection_required in readiness', vcs.includes('manufacturer_connection_required'))
check('preview_only reorder method exists', vcs.includes("'preview_only'"))
check('preferred_vendor field exists', vcs.includes('preferred_vendor'))
check('backup_vendor field exists', vcs.includes('backup_vendor'))
check('lead_time_days field exists', vcs.includes('lead_time_days'))
check('persistenceStatus present', vcs.includes('persistenceStatus'))

// 21-35. reorderRecommendationEngine
const rre = readFile('server/services/reorder/reorderRecommendationEngine.js')
check('reorderRecommendationEngine exists', rre.length > 0)
check('buildReorderRecommendation exists', rre.includes('export function buildReorderRecommendation'))
check('getVenueReorderRecommendations exists', rre.includes('export function getVenueReorderRecommendations'))
check('buildUrgentReorderAlert exists', rre.includes('export function buildUrgentReorderAlert'))
check('detectLowStockTriggers exists', rre.includes('export function detectLowStockTriggers'))
check('updateRecommendationStatus exists', rre.includes('export function updateRecommendationStatus'))
check('REORDER_STATUSES exported', rre.includes('export const REORDER_STATUSES'))
check('reorder_recommended status', rre.includes("'reorder_recommended'"))
check('reorder_not_needed status', rre.includes("'reorder_not_needed'"))
check('critical urgency exists', rre.includes("'critical'"))
check('urgent urgency exists', rre.includes("'urgent'"))
check('sold_out triggers critical', rre.includes("'sold_out'") && rre.includes("'critical'"))
check('urgentCount in alert response', rre.includes('urgentCount'))
check('sortedBy urgency', rre.includes('urgencyOrder'))
check('persistenceStatus in recommendations', rre.includes('persistenceStatus'))

// 36-50. purchaseOrderDraftService
const pods = readFile('server/services/reorder/purchaseOrderDraftService.js')
check('purchaseOrderDraftService exists', pods.length > 0)
check('createPurchaseOrderDraft exists', pods.includes('export function createPurchaseOrderDraft'))
check('getPurchaseOrderDraft exists', pods.includes('export function getPurchaseOrderDraft'))
check('listVenuePurchaseOrders exists', pods.includes('export function listVenuePurchaseOrders'))
check('addItemToPurchaseOrder exists', pods.includes('export function addItemToPurchaseOrder'))
check('updatePurchaseOrderStatus exists', pods.includes('export function updatePurchaseOrderStatus'))
check('getPurchaseOrderReadiness exists', pods.includes('export function getPurchaseOrderReadiness'))
check('approval_required: true in PO', pods.includes('approval_required:        true'))
check('reorder_not_submitted default', pods.includes("'reorder_not_submitted'"))
check('preview_only: true in PO', pods.includes('preview_only:             true'))
check('pending_manager_approval default', pods.includes("'pending_manager_approval'"))
check('estimated_total tracked', pods.includes('estimated_total'))
check('estimated_line_total in items', pods.includes('estimated_line_total'))
check('Math.max in quantity', pods.includes('Math.max(1'))
check('approval note in response', pods.includes('Manager approval required'))

// 51-60. reorderApprovalService
const ras = readFile('server/services/reorder/reorderApprovalService.js')
check('reorderApprovalService exists', ras.length > 0)
check('validateApprovalRole exists', ras.includes('export function validateApprovalRole'))
check('approvePurchaseOrder exists', ras.includes('export function approvePurchaseOrder'))
check('rejectPurchaseOrder exists', ras.includes('export function rejectPurchaseOrder'))
check('getApprovalReadiness exists', ras.includes('export function getApprovalReadiness'))
check('APPROVAL_ROLES has manager', ras.includes("'manager'"))
check('APPROVAL_ROLES has owner', ras.includes("'owner'"))
check('APPROVAL_ROLES has admin', ras.includes("'admin'"))
check('approval_role_insufficient returned on bad role', ras.includes('approval_role_insufficient'))
check('reorder_not_submitted on approval', ras.includes("'reorder_not_submitted'"))

// 61-70. reorderDemandSignalService
const rdss = readFile('server/services/reorder/reorderDemandSignalService.js')
check('reorderDemandSignalService exists', rdss.length > 0)
check('createDemandSignal exists', rdss.includes('export function createDemandSignal'))
check('getVenueDemandSignals exists', rdss.includes('export function getVenueDemandSignals'))
check('buildNcieDemandSignal exists', rdss.includes('export function buildNcieDemandSignal'))
check('buildCheckoutDemandSignal exists', rdss.includes('export function buildCheckoutDemandSignal'))
check('buildPos360DemandSignal exists', rdss.includes('export function buildPos360DemandSignal'))
check('getDemandSignalReadiness exists', rdss.includes('export function getDemandSignalReadiness'))
check('SIGNAL_TYPES exported', rdss.includes('export const SIGNAL_TYPES'))
check('times_blocked tracked', rdss.includes('times_blocked'))
check('ncie signal source exists', rdss.includes("'ncie'"))

// 71-80. inventoryReceivingService
const irs = readFile('server/services/reorder/inventoryReceivingService.js')
check('inventoryReceivingService exists', irs.length > 0)
check('createReceivingPreview exists', irs.includes('export function createReceivingPreview'))
check('addReceivingItem exists', irs.includes('export function addReceivingItem'))
check('markItemsReceived exists', irs.includes('export function markItemsReceived'))
check('buildInventoryAdjustmentFromReceiving exists', irs.includes('export function buildInventoryAdjustmentFromReceiving'))
check('getReceivingReadiness exists', irs.includes('export function getReceivingReadiness'))
check('receiving_pending status', irs.includes("'receiving_pending'"))
check('receiving_complete status', irs.includes("'receiving_complete'"))
check('adjustInventory called on receipt', irs.includes('adjustInventory'))
check('database_required in receiving', irs.includes('database_required'))

// 81-90. reorderController
const rc = readFile('server/controllers/reorderController.js')
check('reorderController exists', rc.length > 0)
check('handleRegisterVendor exists', rc.includes('handleRegisterVendor'))
check('handleGetRecommendations exists', rc.includes('handleGetRecommendations'))
check('handleCreatePO exists', rc.includes('handleCreatePO'))
check('handleApprovePO exists', rc.includes('handleApprovePO'))
check('handleRejectPO exists', rc.includes('handleRejectPO'))
check('handleCreateSignal exists', rc.includes('handleCreateSignal'))
check('handleCreateReceiving exists', rc.includes('handleCreateReceiving'))
check('handleMarkReceived exists', rc.includes('handleMarkReceived'))
check('handleDetectTriggers exists', rc.includes('handleDetectTriggers'))

// 91-100. reorderRoutes
const rr = readFile('server/routes/reorderRoutes.js')
check('reorderRoutes exists', rr.length > 0)
check('/venue/:venueId/vendors route', rr.includes('/venue/:venueId/vendors'))
check('/recommendations route', rr.includes('/recommendations'))
check('/purchase-orders route', rr.includes('/purchase-orders'))
check('/approve route', rr.includes('/approve'))
check('/reject route', rr.includes('/reject'))
check('/signals route', rr.includes('/signals'))
check('/receiving route', rr.includes('/receiving'))
check('/confirm route', rr.includes('/confirm'))
check('/readiness routes', rr.includes('/readiness'))

// 101-110. E.A.T. hooks
const eat = readFile('server/services/eatCommandHubContract.js')
check('getInventoryAvailabilityReadinessHooks exists', eat.includes('getInventoryAvailabilityReadinessHooks'))
check('getProductAvailabilityReadinessHooks exists', eat.includes('getProductAvailabilityReadinessHooks'))
check('getDistributorReorderReadinessHooks exists', eat.includes('getDistributorReorderReadinessHooks'))
check('getManufacturerReorderReadinessHooks exists', eat.includes('getManufacturerReorderReadinessHooks'))
check('getVendorConnectionReadinessHooks exists', eat.includes('getVendorConnectionReadinessHooks'))
check('getPurchaseOrderDraftReadinessHooks exists', eat.includes('getPurchaseOrderDraftReadinessHooks'))
check('getReorderApprovalReadinessHooks exists', eat.includes('getReorderApprovalReadinessHooks'))
check('getInventoryReceivingReadinessHooks exists', eat.includes('getInventoryReceivingReadinessHooks'))
check('EAT uses dynamic imports for reorder', eat.includes("import('./reorder/") || eat.includes('import("./reorder/'))
check('EAT uses dynamic imports for inventory', eat.includes("import('./inventory/") || eat.includes('import("./inventory/'))

// 111-120. Frontend reorderApi + components
const rapi = readFile('src/services/reorder/reorderApi.js')
check('reorderApi exists', rapi.length > 0)
check('registerVendor in reorderApi', rapi.includes('export async function registerVendor'))
check('getReorderRecommendations in reorderApi', rapi.includes('export async function getReorderRecommendations'))
check('createPurchaseOrder in reorderApi', rapi.includes('export async function createPurchaseOrder'))
check('approvePurchaseOrder in reorderApi', rapi.includes('export async function approvePurchaseOrder'))
check('VendorConnectionStatusPanel exists', existsSync('src/components/reorder/VendorConnectionStatusPanel.jsx'))
check('ReorderRecommendationCard exists', existsSync('src/components/reorder/ReorderRecommendationCard.jsx'))
check('PurchaseOrderDraftPanel exists', existsSync('src/components/reorder/PurchaseOrderDraftPanel.jsx'))
check('ReorderApprovalPanel exists', existsSync('src/components/reorder/ReorderApprovalPanel.jsx'))
check('EATReorderCommandPanel exists', existsSync('src/components/reorder/EATReorderCommandPanel.jsx'))

// 121-127. Demo page
const demo = readFile('src/pages/inventory/InventoryAndReorderDemo.jsx')
check('InventoryAndReorderDemo exists', demo.length > 0)
check('Demo shows reorder_not_submitted', demo.includes('reorder_not_submitted'))
check('Demo shows pending_manager_approval', demo.includes('pending_manager_approval'))
check('Demo shows distributor_connection_required', demo.includes('distributor_connection_required'))
check('Demo shows preview_only', demo.includes('preview_only'))
check('Demo shows 44px targets', demo.includes('min-h-[44px]'))
check('Demo has actor role selector', demo.includes('actorRole'))

// 128-130. Documentation + migration
const dmrcDoc = readFile('docs/DISTRIBUTOR_MANUFACTURER_REORDER_CONNECTOR.md')
check('DMRC doc exists', dmrcDoc.length > 0)
check('DMRC doc mentions reorder_not_submitted', dmrcDoc.includes('reorder_not_submitted'))
check('Migration 027 exists', existsSync('server/db/migrations/027_inventory_availability_reorder_engine.sql'))

console.log(`\n\n${passed + failed} checks: ${passed} passed, ${failed} failed`)
if (failures.length) { console.log('FAILED:'); failures.forEach(f => console.log(`  - ${f}`)) }
process.exit(failed > 0 ? 1 : 0)
