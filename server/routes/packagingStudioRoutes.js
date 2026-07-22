/**
 * Golden Box Packaging Studio API routes.
 * Mounted at /api/smokecraft/golden-box/packaging-studio in server/index.js.
 * Reuses the same guest-identity middleware and rate-limit pattern as
 * goldenBoxRoutes.js — no new identity/authorization primitives invented.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/packagingStudioController.js'

const router = Router()
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 })

router.use(optionalAuth, attachSmokeCraftIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'guest' || req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.get('/designs', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleListDesigns)
router.post('/designs', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleCreateDesign)
router.get('/designs/:designId', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetDesign)
router.patch('/designs/:designId/draft', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSaveDraft)
router.post('/designs/:designId/duplicate', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleDuplicateDesign)
router.post('/designs/:designId/archive', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleArchiveDesign)
router.post('/designs/:designId/restore', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRestoreDesign)
router.delete('/designs/:designId', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSoftDeleteDesign)

router.get('/designs/:designId/versions', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleListVersions)
router.get('/designs/:designId/versions/:versionNumber', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetVersion)
router.post('/designs/:designId/versions/:versionNumber/restore', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRestoreVersion)

router.post('/designs/:designId/assets', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleUploadAsset)
router.get('/designs/:designId/assets/:assetId/file', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetAssetFile)
router.delete('/assets/:assetId', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRemoveAsset)
router.put('/assets/:assetId/placement', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSetPlacement)

router.post('/designs/:designId/shares', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleCreateShare)
router.get('/designs/:designId/shares', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleListShares)
router.post('/shares/:shareId/revoke', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRevokeShare)

router.get('/designs/:designId/comments', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleListComments)
router.post('/designs/:designId/comments', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleAddComment)
router.post('/comments/:commentId/resolve', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleResolveComment)

router.post('/designs/:designId/submit', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSubmitFinal)
router.get('/entries/:entryId/final-submission', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetFinalSubmission)

// Shared-review — token-scoped, not identity-scoped (view-only/comment-enabled).
router.get('/shares/token/:shareToken', readLimiter, ctrl.handleReadShared)
router.post('/shares/token/:shareToken/comments', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleAddSharedComment)

export default router
