/**
 * Collections Ownership and Persistence routes. Mounted at
 * /api/smokecraft/collections in server/index.js. Same guest-identity
 * middleware pattern as Skill Tree / Filler Arrangement / Seed & Soil.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/collectionsController.js'

const router = Router()
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 90 })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 })

router.use(optionalAuth, attachSmokeCraftIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'guest' || req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.get('/', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetCollections)
router.get('/items/:itemKey', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetItem)
router.post('/recalculate', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRecalculate)

export default router
