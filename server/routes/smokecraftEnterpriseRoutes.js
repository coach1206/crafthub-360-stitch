/**
 * SmokeCraft Enterprise Routes
 * Module Build 8 — /api/modules/smokecraft/enterprise/*
 */

import { Router } from 'express'
import {
  getEnterpriseStatus,
  getPackageStatus,
  getWhiteLabelStatusHandler,
  getTenantStatusHandler,
  getLicenseStatusHandler,
  getMarketplaceDraftHandler,
  getUpgradeRollbackHandler,
  getFeatureFlagsHandler,
  getEntitlementsHandler,
  getReadinessHandler,
  getAuditHandler,
} from '../controllers/smokecraftEnterpriseController.js'

const router = Router()

router.get('/status',                  getEnterpriseStatus)
router.get('/package',                 getPackageStatus)
router.get('/white-label',             getWhiteLabelStatusHandler)
router.get('/tenant/:tenantId',        getTenantStatusHandler)
router.get('/license',                 getLicenseStatusHandler)
router.get('/marketplace-draft',       getMarketplaceDraftHandler)
router.get('/upgrade-rollback',        getUpgradeRollbackHandler)
router.get('/feature-flags',           getFeatureFlagsHandler)
router.get('/entitlements/:tenantId',  getEntitlementsHandler)
router.get('/readiness',               getReadinessHandler)
router.get('/audit',                   getAuditHandler)

export default router
