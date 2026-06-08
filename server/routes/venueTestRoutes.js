/**
 * Venue Test Routes — Phase 12
 * All routes require auth. Manager+ for most, admin+ for reset.
 */

import { Router }                                         from 'express'
import { requireAuth }                                    from '../middleware/authMiddleware.js'
import { requireManager, requireAdmin }                   from '../middleware/roleMiddleware.js'
import * as ctrl                                          from '../controllers/venueTestController.js'

const router = Router()

// ── Status (manager+) ─────────────────────────────────────────────────────────
router.get(  '/status',               requireAuth, requireManager, ctrl.getStatus)

// ── Test lifecycle (manager+) ─────────────────────────────────────────────────
router.post( '/start',                requireAuth, requireManager, ctrl.startTest)
router.post( '/end',                  requireAuth, requireManager, ctrl.endTest)

// ── Sessions (manager+) ───────────────────────────────────────────────────────
router.post( '/session/start',        requireAuth, requireManager, ctrl.startSession)
router.post( '/session/end',          requireAuth, requireManager, ctrl.endSession)

// ── Observer notes (manager+) ─────────────────────────────────────────────────
router.post( '/observer-note',        requireAuth, requireManager, ctrl.addObserverNote)

// ── Issues (manager+) ─────────────────────────────────────────────────────────
router.post( '/issue',                requireAuth, requireManager, ctrl.logIssue)
router.get(  '/issues',               requireAuth, requireManager, ctrl.getIssues)

// ── Summary / readiness score (manager+) ──────────────────────────────────────
router.get(  '/summary',              requireAuth, requireManager, ctrl.getSummary)

// ── Demo reset (admin+) ───────────────────────────────────────────────────────
router.post( '/reset-demo-data',      requireAuth, requireAdmin,   ctrl.resetDemoData)

// ── Exports (manager+) ────────────────────────────────────────────────────────
router.get(  '/export/json',          requireAuth, requireManager, ctrl.exportJson)
router.get(  '/export/csv',           requireAuth, requireManager, ctrl.exportCsv)

export default router
