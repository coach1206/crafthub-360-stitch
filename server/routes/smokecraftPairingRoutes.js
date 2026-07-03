/**
 * SmokeCraft Pairing Routes
 * Mounted at /api/modules/smokecraft/pairing
 */

import { Router } from 'express'
import {
  getPairingStatus,
  getProviderStatus,
  getPairingProfile,
  updatePairingProfile,
  generateRecommendation,
  generateMenuRecommendations,
  captureFlavorMemoryHandler,
  getRecommendationById,
  getPairingAudit,
} from '../controllers/smokecraftPairingController.js'

const router = Router()

router.get('/status',                               getPairingStatus)
router.get('/provider/status',                      getProviderStatus)
router.get('/profile/:userId',                      getPairingProfile)
router.post('/profile/update',                      updatePairingProfile)
router.post('/recommend',                           generateRecommendation)
router.post('/menu-recommendations',                generateMenuRecommendations)
router.post('/flavor-memory',                       captureFlavorMemoryHandler)
router.get('/recommendation/:recommendationId',     getRecommendationById)
router.get('/audit/:recommendationId',              getPairingAudit)

export default router
