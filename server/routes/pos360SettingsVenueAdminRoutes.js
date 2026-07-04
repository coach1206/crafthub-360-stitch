/**
 * pos360SettingsVenueAdminRoutes.js
 * Mounted at /api/pos360/settings
 */
import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360SettingsVenueAdminController.js'

const router = Router()

// Venue profile
router.post('/venue-profile', canAccessPOS3, ctrl.createVenueProfile)
router.get('/venue-profile', ctrl.getVenueProfile)
router.patch('/venue-profile', canAccessPOS3, ctrl.updateVenueProfile)

// Regional
router.post('/regional', canAccessPOS3, ctrl.createRegionalSettings)
router.get('/regional', ctrl.getRegionalSettings)
router.patch('/regional', canAccessPOS3, ctrl.updateRegionalSettings)

// Operating rules
router.post('/operating-rules', canAccessPOS3, ctrl.createOperatingRule)
router.get('/operating-rules', ctrl.listOperatingRules)
router.patch('/operating-rules/:operatingRuleId', canAccessPOS3, ctrl.updateOperatingRule)

// Financial policies
router.post('/financial-policies', canAccessPOS3, ctrl.createFinancialPolicy)
router.get('/financial-policies', ctrl.listFinancialPolicies)
router.patch('/financial-policies/:financialPolicyId', canAccessPOS3, ctrl.updateFinancialPolicy)

// Compliance settings
router.post('/compliance-settings', canAccessPOS3, ctrl.createComplianceSetting)
router.get('/compliance-settings', ctrl.listComplianceSettings)
router.patch('/compliance-settings/:complianceSettingId', canAccessPOS3, ctrl.updateComplianceSetting)

// Privacy notices
router.post('/privacy-notices', canAccessPOS3, ctrl.createPrivacyNotice)
router.get('/privacy-notices', ctrl.listPrivacyNotices)

// White label
router.post('/white-label', canAccessPOS3, ctrl.createWhiteLabelProfile)
router.get('/white-label', ctrl.getWhiteLabelProfile)
router.patch('/white-label/:whiteLabelProfileId', canAccessPOS3, ctrl.updateWhiteLabelProfile)

// Theme tokens
router.post('/theme-tokens', canAccessPOS3, ctrl.createThemeToken)
router.get('/theme-tokens', ctrl.listThemeTokens)
router.patch('/theme-tokens/:themeTokenId', canAccessPOS3, ctrl.updateThemeToken)

// Modules
router.post('/modules', canAccessPOS3, ctrl.createModuleRegistryEntry)
router.get('/modules', ctrl.listModuleRegistry)
router.patch('/modules/:moduleRegistryId/status', canAccessPOS3, ctrl.updateModuleStatus)

// Module governance
router.post('/module-governance', canAccessPOS3, ctrl.createModuleGovernanceRule)
router.get('/module-governance', ctrl.listModuleGovernanceRules)

// Feature flag overrides
router.post('/feature-flag-overrides', canAccessPOS3, ctrl.createFeatureFlagOverride)
router.get('/feature-flag-overrides', ctrl.listFeatureFlagOverrides)
router.patch('/feature-flag-overrides/:overrideId/status', canAccessPOS3, ctrl.updateFeatureFlagOverrideStatus)

// Integrations
router.post('/integrations', canAccessPOS3, ctrl.createIntegrationStatus)
router.get('/integrations', ctrl.listIntegrationStatuses)
router.patch('/integrations/:integrationStatusId/status', canAccessPOS3, ctrl.updateIntegrationStatus)

// Provider readiness
router.post('/provider-readiness', canAccessPOS3, ctrl.createProviderReadinessCheck)
router.get('/provider-readiness', ctrl.listProviderReadinessChecks)
router.patch('/provider-readiness/:readinessCheckId/status', canAccessPOS3, ctrl.updateProviderReadinessStatus)

// Admin console
router.post('/admin-console-profiles', canAccessPOS3, ctrl.createAdminConsoleProfile)
router.get('/admin-console-profiles', ctrl.listAdminConsoleProfiles)
router.post('/admin-settings-views', canAccessPOS3, ctrl.recordAdminSettingsView)

// Change requests
router.post('/change-requests', canAccessPOS3, ctrl.createSettingsChangeRequest)
router.get('/change-requests', ctrl.listSettingsChangeRequests)
router.post('/change-requests/:changeRequestId/apply', canAccessPOS3, ctrl.applySettingsChangeRequest)

// Approval requests
router.post('/approval-requests', canAccessPOS3, ctrl.createSettingsApprovalRequest)
router.get('/approval-requests', ctrl.listSettingsApprovalRequests)
router.post('/approval-requests/:approvalRequestId/decision', canAccessPOS3, ctrl.decideSettingsApprovalRequest)

// Version history
router.post('/version-history', canAccessPOS3, ctrl.createSettingsVersionHistory)
router.get('/version-history', ctrl.listSettingsVersionHistory)

// Rollback
router.post('/rollback/:versionHistoryId', canAccessPOS3, ctrl.createSettingsRollbackRecord)
router.post('/rollback/:rollbackRecordId/decision', canAccessPOS3, ctrl.decideSettingsRollback)

// Exports
router.post('/exports', canAccessPOS3, ctrl.createSettingsExportRequest)
router.get('/exports', ctrl.listSettingsExportRequests)
router.post('/exports/:exportRequestId/ready-placeholder', canAccessPOS3, ctrl.markSettingsExportReadyPlaceholder)

// Offline queue
router.post('/offline-queue', canAccessPOS3, ctrl.queueOfflineSettingsAction)
router.get('/offline-queue', ctrl.listOfflineSettingsQueue)
router.post('/offline-queue/:offlineActionId/synced', canAccessPOS3, ctrl.markOfflineSettingsActionSynced)

export default router
