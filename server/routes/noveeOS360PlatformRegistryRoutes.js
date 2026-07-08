/**
 * NOVEE OS — 360 Platform Registry Routes
 * contains_secrets: false
 * Mounted at: /api/novee-os/360-platforms
 */

import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/noveeOS360PlatformRegistryController.js'

const router = Router()

router.get('/registry',                          ctrl.getRegistry)
router.get('/registry/:platformKey',             ctrl.getPlatformByKey)
router.get('/registry/:platformKey/readiness',   ctrl.getPlatformReadiness)
router.post('/registry/preview-register',        canAccessPOS3, ctrl.registerPreview)
router.patch('/registry/:platformKey/preview-update', canAccessPOS3, ctrl.updatePreview)
router.get('/reserved',                          ctrl.getReserved)
router.get('/active',                            ctrl.getActive)
router.get('/production-ready',                  ctrl.getProductionReady)
router.get('/registry/:platformKey/blockers',    ctrl.getPlatformBlockers)
router.get('/ecosystem-snapshot',                ctrl.getEcosystemSnapshot)

export default router
