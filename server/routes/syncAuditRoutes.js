/**
 * Sync Audit Routes — Phase 6G
 * Mounted under /api/sync/audit (additively, alongside the existing
 * Phase 6B/6F /api/sync routes). All routes are staff/admin-only — the same
 * requireAuth + requireStaff chain used by syncReconciliationRoutes.js.
 */

import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireStaff } from '../middleware/roleMiddleware.js'
import {
  getAuditLogsRoute, getEventTimeline, getBusinessActionTimelineRoute,
  getActorAuditLogs, getAuditSummaryRoute,
} from '../controllers/syncAuditController.js'

const router = Router()

router.get('/logs',                              requireAuth, requireStaff, getAuditLogsRoute)
router.get('/events/:eventId/timeline',           requireAuth, requireStaff, getEventTimeline)
router.get('/fingerprints/:fingerprint/timeline', requireAuth, requireStaff, getBusinessActionTimelineRoute)
router.get('/actors/:actorId/logs',               requireAuth, requireStaff, getActorAuditLogs)
router.get('/summary',                            requireAuth, requireStaff, getAuditSummaryRoute)

export default router
