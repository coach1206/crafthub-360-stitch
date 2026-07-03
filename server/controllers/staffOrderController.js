/**
 * Staff Order Controller
 * Route handlers for staff order management and table/patio layout engine.
 */

import {
  startStaffOrderSession, getStaffOrderSession, getVenueStaffOrderSessions,
  addItemToStaffOrder, updateStaffOrderItem, removeStaffOrderItem,
  assignStaffOrderToTable, assignStaffOrderToSection, submitStaffOrderPreview,
  convertCustomerCartToStaffOrder, cancelStaffOrderSession, getStaffOrderReadiness,
} from '../services/staff/staffOrderService.js'

import {
  getVenueSections, getSection, createOrUpdateSection, archiveSectionPreview, getSectionReadiness,
} from '../services/staff/floorSectionService.js'

import {
  getVenueTables, getTable, createOrUpdateTable, assignTableToSection,
  updateTableLayoutPosition, getTableLayout, buildLayoutPreview, getTableLayoutReadiness,
} from '../services/staff/tableLayoutService.js'

import {
  getStaffActionPolicy, validateStaffAction, requiresManagerApproval,
  createManagerApprovalRequest, getManagerApprovalRequests, approveManagerRequest,
  rejectManagerRequest, getApprovalReadiness,
} from '../services/staff/staffApprovalEngine.js'

import {
  createManualPOS360Handoff, getManualPOS360Handoff, getVenueManualPOS360Handoffs,
  markManualHandoffPreviewed, getManualPOS360Readiness,
} from '../services/staff/manualPos360HandoffService.js'

import {
  getTableStatus, updateTableStatusPreview, getVenueTableStatusBoard,
  getTableStatusEvents, getTableStatusReadiness,
} from '../services/staff/tableStatusEngine.js'

import {
  getStaffOrderAuditTrail,
} from '../services/staff/staffOrderAuditService.js'

const safe = fn => async (req, res) => {
  try { res.json(await fn(req, res)) }
  catch (e) { res.status(500).json({ ok: false, error: 'server_error', sessionStatus: 'preview_fallback' }) }
}

// Staff order sessions
export const startSession       = safe(req => startStaffOrderSession({ venue_id: req.params.venueId, ...req.body }))
export const getSession         = safe(req => getStaffOrderSession(req.params.sessionId))
export const listSessions       = safe(req => getVenueStaffOrderSessions(req.params.venueId, req.query))
export const addItem            = safe(req => addItemToStaffOrder(req.params.sessionId, req.body))
export const updateItem         = safe(req => updateStaffOrderItem(req.params.sessionId, req.params.itemId, req.body))
export const removeItem         = safe(req => removeStaffOrderItem(req.params.sessionId, req.params.itemId))
export const assignTable        = safe(req => assignStaffOrderToTable(req.params.sessionId, req.body))
export const assignSection      = safe(req => assignStaffOrderToSection(req.params.sessionId, req.body))
export const submitPreview      = safe(req => submitStaffOrderPreview(req.params.sessionId, req.body))
export const convertCart        = safe(req => convertCustomerCartToStaffOrder(req.params.cartId, req.body))
export const cancelSession      = safe(req => cancelStaffOrderSession(req.params.sessionId, req.body.reason, req.body))
export const staffOrderReadiness= safe(req => getStaffOrderReadiness({ venue_id: req.params.venueId }))

// Floor sections
export const listSections       = safe(req => getVenueSections(req.params.venueId))
export const getOneSec          = safe(req => getSection(req.params.venueId, req.params.sectionId))
export const upsertSection      = safe(req => createOrUpdateSection(req.params.venueId, req.body))
export const archiveSection     = safe(req => archiveSectionPreview(req.params.venueId, req.params.sectionId, req.body))
export const sectionReadiness   = safe(req => getSectionReadiness(req.params.venueId))

// Tables
export const listTables         = safe(req => getVenueTables(req.params.venueId))
export const getOneTable        = safe(req => getTable(req.params.venueId, req.params.tableId))
export const upsertTable        = safe(req => createOrUpdateTable(req.params.venueId, req.body))
export const assignTableSec     = safe(req => assignTableToSection(req.params.venueId, req.params.tableId, req.params.sectionId, req.body))
export const updatePosition     = safe(req => updateTableLayoutPosition(req.params.venueId, req.params.tableId, req.body))
export const getLayout          = safe(req => getTableLayout(req.params.venueId, req.query))
export const layoutPreview      = safe(req => buildLayoutPreview(req.params.venueId))
export const tableLayoutReadiness = safe(req => getTableLayoutReadiness(req.params.venueId))

// Approval engine
export const actionPolicy       = safe(req => getStaffActionPolicy(req.params.venueId, req.query.staffRole, req.query.actionType))
export const validateAction     = safe(req => validateStaffAction(req.params.venueId, req.body.staffContext, req.body.actionType, req.body.payload))
export const createApproval     = safe(req => createManagerApprovalRequest({ venue_id: req.params.venueId, ...req.body }))
export const listApprovals      = safe(req => getManagerApprovalRequests(req.params.venueId, req.query))
export const approveRequest     = safe(req => approveManagerRequest(req.params.approvalRequestId, req.body))
export const rejectRequest      = safe(req => rejectManagerRequest(req.params.approvalRequestId, req.body))
export const approvalReadiness  = safe(req => getApprovalReadiness(req.params.venueId))

// Manual POS360 handoff
export const createHandoff      = safe(req => createManualPOS360Handoff({ venue_id: req.params.venueId, ...req.body }))
export const getHandoff         = safe(req => getManualPOS360Handoff(req.params.handoffId))
export const listHandoffs       = safe(req => getVenueManualPOS360Handoffs(req.params.venueId, req.query))
export const markHandoffPreviewed = safe(req => markManualHandoffPreviewed(req.params.handoffId, req.body))
export const handoffReadiness   = safe(req => getManualPOS360Readiness(req.params.venueId))

// Table status
export const getStatus          = safe(req => getTableStatus(req.params.venueId, req.params.tableId))
export const updateStatus       = safe(req => updateTableStatusPreview(req.params.venueId, req.params.tableId, req.body.table_status, req.body))
export const statusBoard        = safe(req => getVenueTableStatusBoard(req.params.venueId, req.query))
export const statusEvents       = safe(req => getTableStatusEvents(req.params.venueId, req.query.tableId))
export const statusReadiness    = safe(req => getTableStatusReadiness(req.params.venueId))

// Audit
export const auditTrail         = safe(req => getStaffOrderAuditTrail(req.params.venueId, req.query))
