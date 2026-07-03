/**
 * SmokeCraft Final QA Routes
 * Module Build 9 — /api/modules/smokecraft/final-qa/*
 */

import { Router } from 'express'
import {
  getFinalQaStatusHandler,
  getEndToEndHandler,
  getReleaseCandidateHandler,
  getHandoffHandler,
  getProductionBlockersHandler,
  getDocumentationLockHandler,
  getProtectedFilesHandler,
  getHonestStatusHandler,
  getRoadmapHandler,
} from '../controllers/smokecraftFinalQaController.js'

const router = Router()

router.get('/status',             getFinalQaStatusHandler)
router.get('/end-to-end',         getEndToEndHandler)
router.get('/release-candidate',  getReleaseCandidateHandler)
router.get('/handoff',            getHandoffHandler)
router.get('/production-blockers', getProductionBlockersHandler)
router.get('/documentation-lock', getDocumentationLockHandler)
router.get('/protected-files',    getProtectedFilesHandler)
router.get('/honest-status',      getHonestStatusHandler)
router.get('/roadmap',            getRoadmapHandler)

export default router
