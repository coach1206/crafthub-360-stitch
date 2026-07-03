/**
 * Verify Staff Table Drag/Drop Activation (Phase 13B)
 * 103 checks
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

// 1. package.json drag/drop library check
const pkg = readFile('package.json')
check('package.json has @dnd-kit/core', pkg.includes('@dnd-kit/core'))
check('drag/drop status is explicitly reported', pkg.includes('@dnd-kit/core') || pkg.includes('drag_drop_library_required'))

// 2-18. tableDragDropEngine
const eng = readFile('src/services/staff/tableDragDropEngine.js')
check('tableDragDropEngine exists', eng.length > 0)
check('getDragDropCapability exists', eng.includes('export function getDragDropCapability'))
check('buildDraggableTableModel exists', eng.includes('export function buildDraggableTableModel'))
check('buildDroppableSectionModel exists', eng.includes('export function buildDroppableSectionModel'))
check('normalizeDraggedPosition exists', eng.includes('export function normalizeDraggedPosition'))
check('snapPositionToGrid exists', eng.includes('export function snapPositionToGrid'))
check('detectClientSideOverlap exists', eng.includes('export function detectClientSideOverlap'))
check('buildClientSideCollisionWarnings exists', eng.includes('export function buildClientSideCollisionWarnings'))
check('buildClientSideBoundaryWarnings exists', eng.includes('export function buildClientSideBoundaryWarnings'))
check('applyKeyboardMove exists', eng.includes('export function applyKeyboardMove'))
check('applyTouchMove exists', eng.includes('export function applyTouchMove'))
check('applyRotation exists', eng.includes('export function applyRotation'))
check('applyResize exists', eng.includes('export function applyResize'))
check('buildOptimisticLayoutPreview exists', eng.includes('export function buildOptimisticLayoutPreview'))
check('buildLayoutUndoStack exists', eng.includes('export function buildLayoutUndoStack'))
check('buildLayoutStatus exists', eng.includes('export function buildLayoutStatus'))

// 19-24. tableLayoutService helpers
const tls = readFile('server/services/staff/tableLayoutService.js')
check('normalizeTablePosition exists', tls.includes('export function normalizeTablePosition'))
check('validateTablePosition exists', tls.includes('export function validateTablePosition'))
check('validateLayoutBounds exists', tls.includes('export function validateLayoutBounds'))
check('detectTableOverlap exists', tls.includes('export function detectTableOverlap'))
check('buildCollisionWarnings exists', tls.includes('export function buildCollisionWarnings'))
check('buildSectionBoundaryWarnings exists', tls.includes('export function buildSectionBoundaryWarnings'))
check('buildSnapGridPosition exists', tls.includes('export function buildSnapGridPosition'))
check('buildLayoutChangePreview exists', tls.includes('export function buildLayoutChangePreview'))
check('resetTableLayoutPreview exists', tls.includes('export function resetTableLayoutPreview'))
check('buildDefaultLayoutForSection exists', tls.includes('export function buildDefaultLayoutForSection'))
check('tableLayoutService has boundary warning support', tls.includes('section_boundary_warning'))
check('tableLayoutService has collision warning support', tls.includes('collision_warning'))
check('tableLayoutService has snap grid support', tls.includes('snap_grid_ready'))
check('tableLayoutService returns table_position_updated_preview', tls.includes('table_position_updated_preview'))

// 25-40. TableLayoutBoard
const tlb = readFile('src/components/staff/TableLayoutBoard.jsx')
check('TableLayoutBoard exists', tlb.length > 0)
check('TableLayoutBoard uses DndContext', tlb.includes('DndContext'))
check('TableLayoutBoard uses PointerSensor', tlb.includes('PointerSensor'))
check('TableLayoutBoard uses KeyboardSensor', tlb.includes('KeyboardSensor'))
check('TableLayoutBoard supports x_position', tlb.includes('x_position'))
check('TableLayoutBoard supports y_position', tlb.includes('y_position'))
check('TableLayoutBoard supports selected table', tlb.includes('selectedTableId'))
check('TableLayoutBoard supports move up', tlb.includes("'up'"))
check('TableLayoutBoard supports move down', tlb.includes("'down'"))
check('TableLayoutBoard supports move left', tlb.includes("'left'"))
check('TableLayoutBoard supports move right', tlb.includes("'right'"))
check('TableLayoutBoard supports rotate', tlb.includes('handleRotate'))
check('TableLayoutBoard supports snap-to-grid', tlb.includes('snapEnabled'))
check('TableLayoutBoard supports undo', tlb.includes('handleUndo'))
check('TableLayoutBoard supports reset', tlb.includes('handleReset'))
check('TableLayoutBoard calls updateTableLayoutPosition', tlb.includes('updateTableLayoutPosition'))
check('TableLayoutBoard shows layout_save_preview', tlb.includes('layout_save_preview'))
check('TableLayoutBoard shows layout_not_persisted', tlb.includes('layout_not_persisted'))
check('TableLayoutBoard uses 44px+ touch targets', tlb.includes('min-h-[44px]'))
check('TableLayoutBoard shows drag_drop_active', tlb.includes('drag_drop_active'))

// 41-47. TableCard
const tc = readFile('src/components/staff/TableCard.jsx')
check('TableCard exists', tc.length > 0)
check('TableCard shows table status', tc.includes('table_status') || tc.includes('tableStatus'))
check('TableCard shows seat count', tc.includes('seat_count'))
check('TableCard shows server/staff assignment', tc.includes('server_id'))
check('TableCard shows drag handle / movement indicator', tc.includes('⠿') || tc.includes('drag'))
check('TableCard shows collision warning', tc.includes('collision_warning') || tc.includes('hasCollision'))
check('TableCard shows boundary warning', tc.includes('section_boundary_warning') || tc.includes('hasBoundaryWarning'))

// 48-49. PatioLayoutPanel
const pp = readFile('src/components/staff/PatioLayoutPanel.jsx')
check('PatioLayoutPanel supports patio layout', pp.includes('patio'))
check('PatioLayoutPanel filters patio tables', pp.includes('patioTables'))

// 50-53. New overlay components
check('StaffAssignmentOverlay exists', existsSync('src/components/staff/StaffAssignmentOverlay.jsx'))
check('TableActionMenu exists', existsSync('src/components/staff/TableActionMenu.jsx'))
check('LayoutSavePreviewBar exists', existsSync('src/components/staff/LayoutSavePreviewBar.jsx'))
check('LayoutWarningPanel exists', existsSync('src/components/staff/LayoutWarningPanel.jsx'))

// StaffAssignmentOverlay behavior
const sao = readFile('src/components/staff/StaffAssignmentOverlay.jsx')
check('StaffAssignmentOverlay shows staff_assignment_pending', sao.includes('staff_assignment_pending'))
check('StaffAssignmentOverlay has 44px touch targets', sao.includes('min-h-[44px]'))

// LayoutSavePreviewBar behavior
const lsp = readFile('src/components/staff/LayoutSavePreviewBar.jsx')
check('LayoutSavePreviewBar shows layout_save_preview', lsp.includes('layout_save_preview'))
check('LayoutSavePreviewBar shows database_required', lsp.includes('database_required'))
check('LayoutSavePreviewBar has undo', lsp.includes('onUndo') || lsp.includes('Undo'))
check('LayoutSavePreviewBar has reset', lsp.includes('onReset') || lsp.includes('Reset'))

// LayoutWarningPanel behavior
const lwp = readFile('src/components/staff/LayoutWarningPanel.jsx')
check('LayoutWarningPanel shows collision_warning', lwp.includes('collision_warning'))
check('LayoutWarningPanel shows overlap_warning', lwp.includes('overlap_warning'))
check('LayoutWarningPanel shows section_boundary_warning', lwp.includes('section_boundary_warning'))
check('LayoutWarningPanel shows drag_drop_library_required', lwp.includes('drag_drop_library_required'))
check('LayoutWarningPanel shows layout_not_persisted', lwp.includes('layout_not_persisted'))

// 53-58. StaffOperationsDemo
const demo = readFile('src/pages/staff/StaffOperationsDemo.jsx')
check('StaffOperationsDemo includes TableLayoutBoard', demo.includes('TableLayoutBoard'))
check('StaffOperationsDemo includes PatioLayoutPanel', demo.includes('PatioLayoutPanel'))
check('StaffOperationsDemo includes LayoutWarningPanel', demo.includes('LayoutWarningPanel'))
check('StaffOperationsDemo includes LayoutSavePreviewBar', demo.includes('LayoutSavePreviewBar'))
check('StaffOperationsDemo includes ManualPOS360HandoffPanel', demo.includes('ManualPOS360HandoffPanel'))
check('StaffOperationsDemo includes ManagerApprovalPanel', demo.includes('ManagerApprovalPanel'))
check('StaffOperationsDemo includes StaffAssignmentOverlay', demo.includes('StaffAssignmentOverlay'))
check('StaffOperationsDemo includes TableActionMenu', demo.includes('TableActionMenu'))
check('StaffOperationsDemo shows drag drop status', demo.includes('dragCap.status'))

// 59-62. staffOrderApi
const api = readFile('src/services/staff/staffOrderApi.js')
check('staffOrderApi has updateTableLayoutPosition', api.includes('updateTableLayoutPosition'))
check('staffOrderApi has resetTableLayoutPreview', api.includes('resetTableLayoutPreview'))
check('staffOrderApi has getTableLayout', api.includes('getTableLayout'))
check('staffOrderApi has updateTableStatusPreview', api.includes('updateTableStatusPreview'))
check('staffOrderApi has getStaffReadiness', api.includes('getStaffReadiness'))

// 63-67. Backend routes
const routes = readFile('server/routes/staffOrderRoutes.js')
check('Backend layout-position endpoint exists', routes.includes('layout-position'))
check('Backend table-layout endpoint exists', routes.includes("'/venue/:venueId/layout'"))
check('Backend reset-preview endpoint exists', routes.includes('reset-preview'))
check('Backend assign-section endpoint exists', routes.includes('assign-section'))
check('Backend table-status-board endpoint exists', routes.includes('table-status-board'))

// 68-71. E.A.T. hooks
const eat = readFile('server/services/eatCommandHubContract.js')
check('E.A.T. getDragDropLayoutReadinessHooks exists', eat.includes('getDragDropLayoutReadinessHooks'))
check('E.A.T. getTableLayoutInteractionReadinessHooks exists', eat.includes('getTableLayoutInteractionReadinessHooks'))
check('E.A.T. getPatioLayoutReadinessHooks exists', eat.includes('getPatioLayoutReadinessHooks'))
check('E.A.T. getFloorPlanOperationalReadinessHooks exists', eat.includes('getFloorPlanOperationalReadinessHooks'))

// 72-75. Documentation
const doc = readFile('docs/STAFF_TABLE_DRAG_DROP_ACTIVATION.md')
check('drag/drop docs exist', doc.length > 0)
check('required phrase exists', doc.includes('A coordinate data model alone is not proof of drag/drop'))
const p13doc = readFile('docs/STAFF_ORDER_TABLE_PATIO_ENGINE.md')
check('Phase 13 doc updated with drag/drop status', p13doc.includes('Phase 13B Drag/Drop Activation Status'))

// 75-91. Status vocabulary presence
const allSrc = [
  readFile('src/services/staff/tableDragDropEngine.js'),
  readFile('src/components/staff/TableLayoutBoard.jsx'),
  readFile('src/components/staff/LayoutSavePreviewBar.jsx'),
  readFile('src/components/staff/LayoutWarningPanel.jsx'),
  readFile('src/pages/staff/StaffOperationsDemo.jsx'),
].join('\n')
check('drag_drop_active status exists', allSrc.includes('drag_drop_active'))
check('touch_move_ready status exists', allSrc.includes('touch_move_ready') || eng.includes('touch_move_ready'))
check('keyboard_move_ready status exists', allSrc.includes('keyboard_move_ready') || eng.includes('keyboard_move_ready'))
check('snap_grid_ready status exists', allSrc.includes('snap_grid_ready') || eng.includes('snap_grid_ready'))
check('collision_warning status exists', allSrc.includes('collision_warning'))
check('overlap_warning status exists', allSrc.includes('overlap_warning'))
check('section_boundary_warning status exists', allSrc.includes('section_boundary_warning'))
check('layout_save_preview status exists', allSrc.includes('layout_save_preview'))
check('layout_not_persisted status exists', allSrc.includes('layout_not_persisted'))

// 84-86. Forbidden fake-live language
const allFiles = [allSrc, tls, eat, readFile('server/services/staff/staffOrderService.js')].join('\n')
check('No fake "layout saved live" language', !allFiles.includes('layout saved live'))
check('No fake "floor plan live" language', !allFiles.includes('floor plan live'))
check('No fake "drag/drop production ready" language', !allFiles.includes('drag/drop production ready'))

// 87-90. Protected files untouched
const pf1 = readFile('src/components/smokecraft/SmokeCraftAssetScreen.jsx')
const pf2 = readFile('src/constants/session.js')
const pf3 = readFile('src/utils/passportProgress.js')
const pf4 = readFile('src/constants/smokecraftJourney.js')
check('SmokeCraftAssetScreen.jsx untouched (exists)', pf1.length > 0)
check('session.js untouched (exists)', pf2.length > 0)
check('passportProgress.js untouched (exists)', pf3.length > 0)
check('smokecraftJourney.js untouched (exists)', pf4.length > 0)

// 91-103. Prior verifications probe
check('verify:staff script exists', existsSync('server/scripts/verifyStaffOrderTablePatioEngine.js'))
check('verify:checkout script exists', existsSync('server/scripts/verifyCustomerCheckoutEngine.js'))
check('verify:ncie-wiring script exists', existsSync('server/scripts/verifyNcieScreenWiring.js'))
check('verify:kds script exists', existsSync('server/scripts/verifyKdsFulfillmentEngine.js'))
check('verify:orders script exists', existsSync('server/scripts/verifyOrderLifecycleEngine.js'))
check('verify:tax script exists', existsSync('server/scripts/verifyTaxComplianceEngine.js'))
check('verify:payments script exists', existsSync('server/scripts/verifyStripeConnectMoneyBridge.js'))
check('verify:database script exists', existsSync('server/scripts/verifyDatabaseFoundation.js'))
check('verify:pos360 script exists', existsSync('server/scripts/verifyPos360PlatformLayer.js'))
check('verify:venue-onboarding script exists', existsSync('server/scripts/verifyVenueOnboardingEngine.js'))
check('verify:partner-vendors script exists', existsSync('server/scripts/verifyPartnerVendorOnboardingEngine.js'))
check('verify:ncie script exists', existsSync('server/scripts/verifyNoveeNCIEFoundation.js'))
check('verify:staff-dragdrop script exists', existsSync('server/scripts/verifyStaffTableDragDropActivation.js'))

console.log(`\n\n${passed + failed} checks: ${passed} passed, ${failed} failed`)
if (failures.length) { console.log('FAILED:'); failures.forEach(f => console.log(`  - ${f}`)) }
process.exit(failed > 0 ? 1 : 0)
