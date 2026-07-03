import { Router } from 'express'
import {
  handleEPRLEnvironment,
  handleEPRLDatabase,
  handleEPRLMigrations,
  handleEPRLSchema,
  handleEPRLPersistence,
  handleEPRLInventory,
  handleEPRLReorder,
  handleEPRLEAT,
  handleEPRLPOS360,
  handleEPRLNCIE,
  handleDeploymentReadiness,
} from '../controllers/eprlHealthController.js'

const router = Router()

router.get('/environment', handleEPRLEnvironment)
router.get('/database',    handleEPRLDatabase)
router.get('/migrations',  handleEPRLMigrations)
router.get('/schema',      handleEPRLSchema)
router.get('/persistence', handleEPRLPersistence)
router.get('/inventory',   handleEPRLInventory)
router.get('/reorder',     handleEPRLReorder)
router.get('/eat',         handleEPRLEAT)
router.get('/pos360',      handleEPRLPOS360)
router.get('/ncie',        handleEPRLNCIE)
router.get('/deployment',  handleDeploymentReadiness)

export default router
