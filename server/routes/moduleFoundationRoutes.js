import { Router } from 'express'
import {
  handleFoundationReadiness,
  handleGetRegistry,
  handleGetModuleById,
  handleRegisterModulePreview,
  handleGetDependencies,
  handleGetActivation,
  handleActivatePreview,
  handleDeactivatePreview,
  handleGetLifecycle,
  handleInstallPreview,
  handleUninstallPreview,
  handleGetVersioning,
  handleGetPermissions,
  handleGetRoutes,
  handleGetServices,
  handleGetComponents,
  handleGetHooks,
  handleGetAudit,
  handleGetMarketplaceDrafts,
  handleGetLicenseReadiness,
  handleGetInitialManifests,
} from '../controllers/moduleFoundationController.js'

const router = Router()

router.get('/foundation/readiness',                    handleFoundationReadiness)
router.get('/registry',                                handleGetRegistry)
router.get('/registry/:moduleId',                      handleGetModuleById)
router.post('/registry/register-preview',              handleRegisterModulePreview)
router.get('/dependencies/:moduleId',                  handleGetDependencies)
router.get('/activation/:moduleId',                    handleGetActivation)
router.post('/activation/:moduleId/activate-preview',  handleActivatePreview)
router.post('/activation/:moduleId/deactivate-preview',handleDeactivatePreview)
router.get('/lifecycle/:moduleId',                     handleGetLifecycle)
router.post('/lifecycle/:moduleId/install-preview',    handleInstallPreview)
router.post('/lifecycle/:moduleId/uninstall-preview',  handleUninstallPreview)
router.get('/versioning/:moduleId',                    handleGetVersioning)
router.get('/permissions/:moduleId',                   handleGetPermissions)
router.get('/routes/:moduleId',                        handleGetRoutes)
router.get('/services/:moduleId',                      handleGetServices)
router.get('/components/:moduleId',                    handleGetComponents)
router.get('/hooks/:moduleId',                         handleGetHooks)
router.get('/audit',                                   handleGetAudit)
router.get('/marketplace-drafts',                      handleGetMarketplaceDrafts)
router.get('/license-readiness',                       handleGetLicenseReadiness)
router.get('/initial-manifests',                       handleGetInitialManifests)

export default router
