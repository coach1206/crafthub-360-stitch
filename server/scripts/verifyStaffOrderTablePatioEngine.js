/**
 * Verify Staff Order Management and Table/Patio Layout Engine
 * 133 checks across 16 sections
 */

import { readFileSync, existsSync } from 'fs'

let passed = 0
let failed = 0
const failures = []

function check(label, condition) {
  if (condition) { passed++; process.stdout.write('.') }
  else { failed++; failures.push(label); process.stdout.write('F') }
}

function readFile(path) {
  try { return existsSync(path) ? readFileSync(path, 'utf8') : '' } catch { return '' }
}

// SECTION 1: Migration file
const mig = readFile('server/db/migrations/026_staff_order_table_patio_engine.sql')
check('Migration file exists', mig.length > 0)
check('venue_floor_sections table', mig.includes('venue_floor_sections'))
check('venue_tables table', mig.includes('venue_tables'))
check('venue_table_layout_positions table', mig.includes('venue_table_layout_positions'))
check('staff_order_sessions table', mig.includes('staff_order_sessions'))
check('staff_order_assignments table', mig.includes('staff_order_assignments'))
check('staff_order_actions table', mig.includes('staff_order_actions'))
check('manager_approval_requests table', mig.includes('manager_approval_requests'))
check('manual_pos360_handoff_logs table', mig.includes('manual_pos360_handoff_logs'))
check('table_status_events table', mig.includes('table_status_events'))
check('staff_order_audit_logs table', mig.includes('staff_order_audit_logs'))
check('migration has preview-only comment', mig.includes('Preview-only'))
check('section_layout_preview default', mig.includes('section_layout_preview'))
check('floor_layout_preview default', mig.includes('floor_layout_preview'))
check('pos_sync_pending default', mig.includes('pos_sync_pending'))
check('manager_approval_required default', mig.includes('manager_approval_required'))

// SECTION 2: Floor section service
const fss = readFile('server/services/staff/floorSectionService.js')
check('floorSectionService exists', fss.length > 0)
check('buildDefaultSections export', fss.includes('export function buildDefaultSections'))
check('getVenueSections export', fss.includes('export function getVenueSections'))
check('createOrUpdateSection export', fss.includes('export function createOrUpdateSection'))
check('archiveSectionPreview export', fss.includes('export function archiveSectionPreview'))
check('getSectionReadiness export', fss.includes('export function getSectionReadiness'))
check('section_layout_preview status', fss.includes('section_layout_preview'))
check('default sections lounge', fss.includes('lounge'))
check('default sections patio', fss.includes('patio'))
check('default sections bar', fss.includes('bar'))
check('default sections humidor', fss.includes('humidor'))
check('default sections vip', fss.includes('vip'))
check('no fake persistence claim', !fss.includes("'persisted'"))

// SECTION 3: Table layout service
const tls = readFile('server/services/staff/tableLayoutService.js')
check('tableLayoutService exists', tls.length > 0)
check('getVenueTables export', tls.includes('export function getVenueTables'))
check('createOrUpdateTable export', tls.includes('export function createOrUpdateTable'))
check('updateTableLayoutPosition export', tls.includes('export function updateTableLayoutPosition'))
check('getTableLayout export', tls.includes('export function getTableLayout'))
check('buildLayoutPreview export', tls.includes('export function buildLayoutPreview'))
check('getTableLayoutReadiness export', tls.includes('export function getTableLayoutReadiness'))
check('x_position field', tls.includes('x_position'))
check('y_position field', tls.includes('y_position'))
check('width field', tls.includes('width'))
check('height field', tls.includes('height'))
check('rotation field', tls.includes('rotation'))
check('floor_layout_preview status', tls.includes('floor_layout_preview'))
check('patio_layout_preview status', tls.includes('patio_layout_preview'))
check('table_layout_preview status', tls.includes('table_layout_preview'))
check('device_mode field', tls.includes('device_mode'))

// SECTION 4: Staff order service
const sos = readFile('server/services/staff/staffOrderService.js')
check('staffOrderService exists', sos.length > 0)
check('startStaffOrderSession export', sos.includes('export function startStaffOrderSession'))
check('addItemToStaffOrder export', sos.includes('export function addItemToStaffOrder'))
check('updateStaffOrderItem export', sos.includes('export function updateStaffOrderItem'))
check('removeStaffOrderItem export', sos.includes('export function removeStaffOrderItem'))
check('assignStaffOrderToTable export', sos.includes('export function assignStaffOrderToTable'))
check('submitStaffOrderPreview export', sos.includes('export async function submitStaffOrderPreview'))
check('convertCustomerCartToStaffOrder export', sos.includes('export function convertCustomerCartToStaffOrder'))
check('cancelStaffOrderSession export', sos.includes('export function cancelStaffOrderSession'))
check('staff_order_preview status', sos.includes('staff_order_preview'))
check('staff_assisted_preview status', sos.includes('staff_assisted_preview'))
check('payment_confirmation_required', sos.includes('payment_confirmation_required'))
check('tax_preview_required', sos.includes('tax_preview_required'))
check('kds_routing_pending', sos.includes('kds_routing_pending'))
check('pos_sync_pending', sos.includes('pos_sync_pending'))
check('inventory_unavailable', sos.includes('inventory_unavailable'))
check('rejects zero quantity', sos.includes("'zero quantity is rejected'"))
check('rejects negative amounts', sos.includes("'negative amounts are rejected'"))
check('submissionNote set', sos.includes('submissionNote'))
check('does not claim POS synced', !sos.includes("'pos_synced'"))
check('does not claim payment_captured', !sos.includes("'payment_captured'"))
check('does not claim kds_notified', !sos.includes("'kds_notified'"))
check('checkout_cart_id linkage', sos.includes('checkout_cart_id'))
check('dynamic order import', sos.includes("import('../order/orderLifecycleService.js')"))
check('dynamic tax import', sos.includes("import('../tax/taxCalculationEngine.js')"))
check('dynamic payment import', sos.includes("import('../payments/moneyBridgePaymentEngine.js')"))
check('dynamic kds import', sos.includes("import('../kds/kdsRoutingEngine.js')"))

// SECTION 5: Staff approval engine
const sae = readFile('server/services/staff/staffApprovalEngine.js')
check('staffApprovalEngine exists', sae.length > 0)
check('getStaffActionPolicy export', sae.includes('export async function getStaffActionPolicy'))
check('validateStaffAction export', sae.includes('export async function validateStaffAction'))
check('requiresManagerApproval export', sae.includes('export function requiresManagerApproval'))
check('createManagerApprovalRequest export', sae.includes('export function createManagerApprovalRequest'))
check('getManagerApprovalRequests export', sae.includes('export function getManagerApprovalRequests'))
check('approveManagerRequest export', sae.includes('export function approveManagerRequest'))
check('rejectManagerRequest export', sae.includes('export function rejectManagerRequest'))
check('request_comp in MANAGER_REQUIRED', sae.includes('request_comp'))
check('request_void in MANAGER_REQUIRED', sae.includes('request_void'))
check('request_refund in MANAGER_REQUIRED', sae.includes('request_refund'))
check('request_discount in MANAGER_REQUIRED', sae.includes('request_discount'))
check('force_close_table in MANAGER_REQUIRED', sae.includes('force_close_table'))
check('manager role permissions', sae.includes("manager:"))
check('server role permissions', sae.includes("server:"))
check('bartender role permissions', sae.includes("bartender:"))
check('host role permissions', sae.includes("host:"))
check('cashier role permissions', sae.includes("cashier:"))
check('discountPercent threshold', sae.includes('discountPercent > 15'))
check('discountAmount threshold', sae.includes('discountAmount > 2000'))
check('manager_approval_required status', sae.includes('manager_approval_required'))
check('manager_approved_preview not live', sae.includes('manager_approved_preview'))
check('manager_rejected_preview status', sae.includes('manager_rejected_preview'))
check('no live approval claim', !sae.includes("'manager_approved_live'"))

// SECTION 6: Manual POS360 handoff service
const pos = readFile('server/services/staff/manualPos360HandoffService.js')
check('manualPos360HandoffService exists', pos.length > 0)
check('buildManualPOS360Handoff export', pos.includes('export function buildManualPOS360Handoff'))
check('createManualPOS360Handoff export', pos.includes('export function createManualPOS360Handoff'))
check('getManualPOS360Handoff export', pos.includes('export function getManualPOS360Handoff'))
check('getVenueManualPOS360Handoffs export', pos.includes('export function getVenueManualPOS360Handoffs'))
check('markManualHandoffPreviewed export', pos.includes('export function markManualHandoffPreviewed'))
check('getManualPOS360Readiness export', pos.includes('export function getManualPOS360Readiness'))
check('manual_pos360_handoff status', pos.includes('manual_pos360_handoff'))
check('pos_sync_pending in handoff', pos.includes('pos_sync_pending'))
check('does not claim pos_synced', !pos.includes("'pos_synced'"))
check('handoff note present', pos.includes('handoffNote'))

// SECTION 7: Table status engine
const tse = readFile('server/services/staff/tableStatusEngine.js')
check('tableStatusEngine exists', tse.length > 0)
check('getTableStatus export', tse.includes('export function getTableStatus'))
check('updateTableStatusPreview export', tse.includes('export function updateTableStatusPreview'))
check('getVenueTableStatusBoard export', tse.includes('export function getVenueTableStatusBoard'))
check('buildTableStatusEvent export', tse.includes('export function buildTableStatusEvent'))
check('getTableStatusReadiness export', tse.includes('export function getTableStatusReadiness'))
check('open status valid', tse.includes("'open'"))
check('seated status valid', tse.includes("'seated'"))
check('check_requested status valid', tse.includes('check_requested'))
check('reserved_preview status valid', tse.includes('reserved_preview'))
check('table_assignment_pending default', tse.includes('table_assignment_pending'))
check('status_preview event status', tse.includes('status_preview'))
check('validates status', tse.includes('invalid_table_status'))

// SECTION 8: Audit service
const audit = readFile('server/services/staff/staffOrderAuditService.js')
check('staffOrderAuditService exists', audit.length > 0)
check('logStaffOrderAuditEvent export', audit.includes('export function logStaffOrderAuditEvent'))
check('buildStaffOrderAuditEvent export', audit.includes('export function buildStaffOrderAuditEvent'))
check('getStaffOrderAuditTrail export', audit.includes('export function getStaffOrderAuditTrail'))
check('logStaffOrderAction export', audit.includes('export function logStaffOrderAction'))
check('logTableLayoutEvent export', audit.includes('export function logTableLayoutEvent'))
check('logManagerApprovalEvent export', audit.includes('export function logManagerApprovalEvent'))
check('logManualPOS360HandoffEvent export', audit.includes('export function logManualPOS360HandoffEvent'))
check('audit_logged status', audit.includes('audit_logged'))
check('MAX_BUFFER limit', audit.includes('MAX_BUFFER'))

// SECTION 9: Controller
const ctrl = readFile('server/controllers/staffOrderController.js')
check('staffOrderController exists', ctrl.length > 0)
check('startSession handler', ctrl.includes('startSession'))
check('addItem handler', ctrl.includes('addItem'))
check('submitPreview handler', ctrl.includes('submitPreview'))
check('createApproval handler', ctrl.includes('createApproval'))
check('approveRequest handler', ctrl.includes('approveRequest'))
check('createHandoff handler', ctrl.includes('createHandoff'))
check('statusBoard handler', ctrl.includes('statusBoard'))
check('safe error wrapper', ctrl.includes("'server_error'"))
check('preview_fallback on error', ctrl.includes('preview_fallback'))

// SECTION 10: Routes
const routes = readFile('server/routes/staffOrderRoutes.js')
check('staffOrderRoutes exists', routes.length > 0)
check('POST sessions route', routes.includes("'/venue/:venueId/sessions'"))
check('GET layout route', routes.includes("'/venue/:venueId/layout'"))
check('POST approvals route', routes.includes("'/venue/:venueId/approvals'"))
check('PUT table status route', routes.includes("'/venue/:venueId/tables/:tableId/status'"))
check('POST pos360-handoff route', routes.includes("'/venue/:venueId/pos360-handoff'"))

// SECTION 11: server/index.js mounting
const idx = readFile('server/index.js')
check('staffOrderRoutes imported', idx.includes('staffOrderRoutes'))
check('/api/staff mounted', idx.includes("'/api/staff'"))

// SECTION 12: Frontend API client
const api = readFile('src/services/staff/staffOrderApi.js')
check('staffOrderApi exists', api.length > 0)
check('startStaffOrderSession export', api.includes('export const startStaffOrderSession'))
check('addItemToSession export', api.includes('export const addItemToSession'))
check('convertCartToStaffOrder export', api.includes('export const convertCartToStaffOrder'))
check('createManagerApproval export', api.includes('export const createManagerApproval'))
check('createPOS360Handoff export', api.includes('export const createPOS360Handoff'))
check('getTableStatusBoard export', api.includes('export const getTableStatusBoard'))
check('safeFetch wrapper', api.includes('async function safeFetch'))
check('preview_fallback on error', api.includes('preview_fallback'))
check('no payment secrets client-side', !api.includes('stripe_secret'))

// SECTION 13: UI components
const comps = [
  'src/components/staff/StaffOrderPanel.jsx',
  'src/components/staff/StaffOrderItemRow.jsx',
  'src/components/staff/TableLayoutBoard.jsx',
  'src/components/staff/TableCard.jsx',
  'src/components/staff/SectionSelector.jsx',
  'src/components/staff/PatioLayoutPanel.jsx',
  'src/components/staff/ManagerApprovalPanel.jsx',
  'src/components/staff/ManualPOS360HandoffPanel.jsx',
  'src/components/staff/TableStatusBoard.jsx',
  'src/components/staff/StaffReadinessPanel.jsx',
  'src/components/staff/StaffStatusBadge.jsx',
]
comps.forEach(p => check(`${p.split('/').pop()} exists`, existsSync(p)))
const panel = readFile('src/components/staff/StaffOrderPanel.jsx')
check('StaffOrderPanel has 44px touch target', panel.includes('min-h-[44px]'))
check('StaffOrderPanel shows session_status', panel.includes('session_status'))
const badge = readFile('src/components/staff/StaffStatusBadge.jsx')
check('StaffStatusBadge has status map', badge.includes('STATUS_COLORS'))
check('badge shows manager_approval_required', badge.includes('manager_approval_required'))
check('badge shows manual_pos360_handoff', badge.includes('manual_pos360_handoff'))

// SECTION 14: Demo page
const demo = readFile('src/pages/staff/StaffOperationsDemo.jsx')
check('StaffOperationsDemo exists', demo.length > 0)
check('demo imports StaffOrderPanel', demo.includes('StaffOrderPanel'))
check('demo imports TableLayoutBoard', demo.includes('TableLayoutBoard'))
check('demo imports ManagerApprovalPanel', demo.includes('ManagerApprovalPanel'))
check('demo imports ManualPOS360HandoffPanel', demo.includes('ManualPOS360HandoffPanel'))
check('demo shows preview warning', demo.includes('preview only'))
check('demo has event log', demo.includes('EventLog'))

// SECTION 15: E.A.T. hooks
const eat = readFile('server/services/eatCommandHubContract.js')
check('getStaffOperationsReadinessHooks', eat.includes('getStaffOperationsReadinessHooks'))
check('getTableLayoutReadinessHooks', eat.includes('getTableLayoutReadinessHooks'))
check('getStaffOrderReadinessHooks', eat.includes('getStaffOrderReadinessHooks'))
check('getManagerApprovalReadinessHooks', eat.includes('getManagerApprovalReadinessHooks'))
check('getManualPOS360HandoffHooks', eat.includes('getManualPOS360HandoffHooks'))

// SECTION 16: Documentation
const doc = readFile('docs/STAFF_ORDER_TABLE_PATIO_ENGINE.md')
check('docs file exists', doc.length > 0)
check('docs has staff_order_preview', doc.includes('staff_order_preview'))
check('docs has manager_approval_required', doc.includes('manager_approval_required'))
check('docs has manual_pos360_handoff', doc.includes('manual_pos360_handoff'))
check('docs has floor_layout_preview', doc.includes('floor_layout_preview'))
check('docs has patio_layout_preview', doc.includes('patio_layout_preview'))
check('docs has role table', doc.includes('manager'))
check('docs has API endpoints', doc.includes('/api/staff'))

console.log(`\n\n${passed + failed} checks: ${passed} passed, ${failed} failed`)
if (failures.length) { console.log('FAILED:'); failures.forEach(f => console.log(`  - ${f}`)) }
process.exit(failed > 0 ? 1 : 0)
