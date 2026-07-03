/**
 * SmokeCraft Persistence Routes
 * Mounted at /api/modules/smokecraft/persistence
 */

import { Router } from 'express'
import {
  getPersistenceStatus,
  getPersistenceHealth,
  getPersistenceRegistry,
  getPersistenceArea,
  getDatabaseStatus,
  getMigrationPlanStatus,
  createMigrationPlan,
  getPersistenceAudit,
} from '../controllers/smokecraftPersistenceController.js'

const router = Router()

router.get('/status',                 getPersistenceStatus)
router.get('/health',                 getPersistenceHealth)
router.get('/registry',               getPersistenceRegistry)
router.get('/area/:areaId',           getPersistenceArea)
router.get('/database',               getDatabaseStatus)
router.get('/migration-plan',         getMigrationPlanStatus)
router.post('/migration-plan/create', createMigrationPlan)
router.get('/audit',                  getPersistenceAudit)

export default router
