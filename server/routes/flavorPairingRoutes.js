/**
 * Package 6 — flavor-progression + pairing-builder routes. Mounted at
 * /api/smokecraft/flavor-pairing. Reuses the same SmokeCraft guest-
 * identity middleware as seed-soil/leaf-construction/golden-box.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/flavorPairingController.js'

const router = Router()
const IS_PROD = process.env.NODE_ENV === 'production'
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 90, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 40, skip: () => !IS_PROD })

router.use(optionalAuth, attachSmokeCraftIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'guest' || req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.get('/flavor-stages', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetFlavorStages)
router.post('/flavor-stages/:stage', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSaveFlavorStage)

router.get('/pairing-drafts', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleListPairingDrafts)
router.get('/pairing-drafts/:id', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetPairingDraft)
router.post('/pairing-drafts', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSavePairingDraft)
router.post('/pairing-drafts/:id/revise', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleReviseDraft)
router.get('/pairing-drafts/:id/revisions', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetDraftRevisions)

router.get('/cadence', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetCadenceSession)
router.post('/cadence/start', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleStartCadence)
router.post('/cadence/event/:eventType', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRecordCadenceEvent)
router.post('/cadence/stop', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleStopCadence)

router.get('/recommendations', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetRecommendations)

export default router
