/**
 * Sync Reconciliation Routes — Phase 6F
 * Mounted under /api/sync (additively, alongside the existing Phase 6B
 * syncRoutes.js). All routes are staff/admin-only — the same
 * requireAuth + requireStaff chain used by the existing /api/sync routes.
 */

import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireStaff } from '../middleware/roleMiddleware.js'
import {
  getSyncEventById, getSyncEventByFingerprint, getSyncConflicts, postConflictDecision,
  previewReplayRoute, postReplay, postReconciliationNote, postReconciliationResolve,
  getReconciliationSummaryRoute,
} from '../controllers/syncReconciliationController.js'

const router = Router()

router.get('/events/:eventId',              requireAuth, requireStaff, getSyncEventById)
router.get('/events/fingerprint/:fingerprint', requireAuth, requireStaff, getSyncEventByFingerprint)
router.get('/conflicts',                     requireAuth, requireStaff, getSyncConflicts)
router.post('/conflicts/decision',           requireAuth, requireStaff, postConflictDecision)
router.post('/replay/preview',               requireAuth, requireStaff, previewReplayRoute)
router.post('/replay',                       requireAuth, requireStaff, postReplay)
router.post('/reconciliation/:eventId/note', requireAuth, requireStaff, postReconciliationNote)
router.post('/reconciliation/:eventId/resolve', requireAuth, requireStaff, postReconciliationResolve)
router.get('/reconciliation/summary',        requireAuth, requireStaff, getReconciliationSummaryRoute)

export default router
