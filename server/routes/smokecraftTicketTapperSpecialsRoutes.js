/**
 * SmokeCraft Ticket Tapper Specials Routes — mounted at /api/smokecraft/ticket-tapper
 */
import { Router } from 'express'
import * as ctrl from '../controllers/smokecraftTicketTapperSpecialsController.js'
// Approval workflow endpoints added in Phase 8 add-on

const router = Router()

// GET  /api/smokecraft/ticket-tapper/specials/:venueId
router.get('/specials/:venueId', ctrl.getSpecials)

// POST /api/smokecraft/ticket-tapper/specials
router.post('/specials', ctrl.createSpecial)

// PATCH /api/smokecraft/ticket-tapper/specials/:specialId
router.patch('/specials/:specialId', ctrl.updateSpecial)

// POST /api/smokecraft/ticket-tapper/specials/:specialId/tap
router.post('/specials/:specialId/tap', ctrl.trackTap)

// POST /api/smokecraft/ticket-tapper/specials/:specialId/add
router.post('/specials/:specialId/add', ctrl.trackAdd)

// POST /api/smokecraft/ticket-tapper/specials/:specialId/end
router.post('/specials/:specialId/end', ctrl.endSpecial)

// GET  /api/smokecraft/ticket-tapper/inventory/:venueId
router.get('/inventory/:venueId', ctrl.getInventory)

// PATCH /api/smokecraft/ticket-tapper/inventory/:itemId
router.patch('/inventory/:itemId', ctrl.updateInventory)

// GET  /api/smokecraft/ticket-tapper/specials-report/:venueId
router.get('/specials-report/:venueId', ctrl.getSpecialsReport)

// ── Approval workflow ─────────────────────────────────────────────────────────
// POST /api/smokecraft/ticket-tapper/specials/:specialId/submit-approval
router.post('/specials/:specialId/submit-approval', ctrl.submitForApproval)

// POST /api/smokecraft/ticket-tapper/specials/:specialId/approve
router.post('/specials/:specialId/approve', ctrl.approveSpecial)

// POST /api/smokecraft/ticket-tapper/specials/:specialId/reject
router.post('/specials/:specialId/reject', ctrl.rejectSpecial)

// POST /api/smokecraft/ticket-tapper/specials/:specialId/publish
router.post('/specials/:specialId/publish', ctrl.publishSpecial)

// GET  /api/smokecraft/ticket-tapper/specials-approval-queue/:venueId
router.get('/specials-approval-queue/:venueId', ctrl.getApprovalQueue)

export default router
