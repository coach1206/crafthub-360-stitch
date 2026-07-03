/**
 * Staff Order Routes
 * All routes at /api/staff
 */

import { Router } from 'express'
import * as c from '../controllers/staffOrderController.js'

const router = Router()

// Staff order sessions
router.post  ('/venue/:venueId/sessions',                     c.startSession)
router.get   ('/venue/:venueId/sessions',                     c.listSessions)
router.get   ('/sessions/:sessionId',                         c.getSession)
router.post  ('/sessions/:sessionId/items',                   c.addItem)
router.put   ('/sessions/:sessionId/items/:itemId',           c.updateItem)
router.delete('/sessions/:sessionId/items/:itemId',           c.removeItem)
router.post  ('/sessions/:sessionId/assign-table',            c.assignTable)
router.post  ('/sessions/:sessionId/assign-section',          c.assignSection)
router.post  ('/sessions/:sessionId/submit-preview',          c.submitPreview)
router.post  ('/sessions/:sessionId/cancel',                  c.cancelSession)
router.post  ('/convert-cart/:cartId',                        c.convertCart)
router.get   ('/venue/:venueId/readiness',                    c.staffOrderReadiness)

// Floor sections
router.get   ('/venue/:venueId/sections',                     c.listSections)
router.post  ('/venue/:venueId/sections',                     c.upsertSection)
router.get   ('/venue/:venueId/sections/:sectionId',          c.getOneSec)
router.post  ('/venue/:venueId/sections/:sectionId/archive',  c.archiveSection)
router.get   ('/venue/:venueId/sections-readiness',           c.sectionReadiness)

// Tables
router.get   ('/venue/:venueId/tables',                       c.listTables)
router.post  ('/venue/:venueId/tables',                       c.upsertTable)
router.get   ('/venue/:venueId/tables/:tableId',              c.getOneTable)
router.post  ('/venue/:venueId/tables/:tableId/assign-section/:sectionId', c.assignTableSec)
router.put   ('/venue/:venueId/tables/:tableId/position',     c.updatePosition)
router.get   ('/venue/:venueId/layout',                       c.getLayout)
router.get   ('/venue/:venueId/layout-preview',               c.layoutPreview)
router.get   ('/venue/:venueId/table-layout-readiness',       c.tableLayoutReadiness)

// Manager approval
router.get   ('/venue/:venueId/action-policy',                c.actionPolicy)
router.post  ('/venue/:venueId/validate-action',              c.validateAction)
router.post  ('/venue/:venueId/approvals',                    c.createApproval)
router.get   ('/venue/:venueId/approvals',                    c.listApprovals)
router.post  ('/approvals/:approvalRequestId/approve',        c.approveRequest)
router.post  ('/approvals/:approvalRequestId/reject',         c.rejectRequest)
router.get   ('/venue/:venueId/approval-readiness',           c.approvalReadiness)

// Manual POS360 handoff
router.post  ('/venue/:venueId/pos360-handoff',               c.createHandoff)
router.get   ('/venue/:venueId/pos360-handoffs',              c.listHandoffs)
router.get   ('/pos360-handoff/:handoffId',                   c.getHandoff)
router.post  ('/pos360-handoff/:handoffId/mark-previewed',    c.markHandoffPreviewed)
router.get   ('/venue/:venueId/pos360-readiness',             c.handoffReadiness)

// Table status
router.get   ('/venue/:venueId/table-status-board',           c.statusBoard)
router.get   ('/venue/:venueId/tables/:tableId/status',       c.getStatus)
router.put   ('/venue/:venueId/tables/:tableId/status',       c.updateStatus)
router.get   ('/venue/:venueId/table-status-events',          c.statusEvents)
router.get   ('/venue/:venueId/table-status-readiness',       c.statusReadiness)

// Audit
router.get   ('/venue/:venueId/audit',                        c.auditTrail)

export default router
