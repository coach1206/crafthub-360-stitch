/**
 * Package 5 closure — filler-arrangement / rolling-process / quality-
 * control routes. Mounted at /api/smokecraft/leaf-construction. Reuses
 * the same SmokeCraft guest-identity middleware as seed-soil/golden-box.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/leafConstructionController.js'

const router = Router()
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 90 })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 40 })

router.use(optionalAuth, attachSmokeCraftIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'guest' || req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.get('/arrangement', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetArrangement)
router.post('/arrangement', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSaveArrangement)

router.get('/rolling-progress', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetRollingProgress)
router.post('/rolling-progress/:stepKey/complete', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleAdvanceRollingStep)

router.get('/quality-control', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetQualityControl)
router.post('/quality-control/:itemKey', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSaveQualityControl)

export default router
