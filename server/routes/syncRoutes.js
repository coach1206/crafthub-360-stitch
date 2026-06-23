/**
 * Sync Routes — Phase 6B
 * Internal multi-device event store. NOT the third-party POS provider
 * bridge (pos3IntegrationRoutes.js) — see Phase 6 / 6A reports.
 *
 * Auth model (mirrors existing route patterns, no new policy invented):
 *   - optionalAuth populates req.user when a real JWT session exists,
 *     but never blocks guests at the route layer — per-event authorization
 *     (staff-only vs guest-safe sourceSystem) happens in the controller,
 *     because it depends on each event's sourceSystem, not the route.
 */

import { Router } from 'express'
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js'
import { requireStaff } from '../middleware/roleMiddleware.js'
import {
  postEvents,
  getEvents,
  getEventsSinceTimestamp,
  postRetry,
  getStatus,
} from '../controllers/syncController.js'

const router = Router()

// Writes: optionalAuth only — per-event authorization (staff-only vs
// guest-safe sourceSystem) happens in the controller, since guests writing
// SmokeCraft/Passport events have no JWT (mirrors existing passport/
// smokecraft routes — Phase 4 finding).
router.post('/events', optionalAuth, postEvents)
router.post('/retry',  optionalAuth, postRetry)

// Reads expose cross-venue operational data (all devices' events) —
// staff+ only, consistent with pos3IntegrationRoutes.js's existing tiering.
router.get('/events',                  requireAuth, requireStaff, getEvents)
router.get('/events/since/:timestamp', requireAuth, requireStaff, getEventsSinceTimestamp)
router.get('/status',                  requireAuth, requireStaff, getStatus)

export default router
