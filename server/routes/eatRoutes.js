import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { canAccessEAT } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/eatController.js'
import { eatSources } from '../data/eatSources.js'
import { success } from '../utils/responseHelpers.js'

const router = Router()

// ── Public — venue-facing specials display ────────────────────────────────────
router.get('/sources', (_req, res) => {
  success(res, { sources: eatSources })
})

router.get('/sources/:stationId', (req, res) => {
  const station = eatSources[req.params.stationId]
  if (!station) return res.status(404).json({ success: false, message: 'Station not found' })
  success(res, { station })
})

// ── Manager-gated — E.A.T. Command dashboard ─────────────────────────────────
// requireAuth must precede canAccessEAT to populate req.user from the JWT cookie.
router.post( '/analytics',                  requireAuth, canAccessEAT, ctrl.saveAnalytics)
router.get(  '/session/:sessionId/payload', requireAuth, canAccessEAT, ctrl.getSessionPayload)
router.get(  '/dashboard',                  requireAuth, canAccessEAT, ctrl.getDashboard)

export default router
