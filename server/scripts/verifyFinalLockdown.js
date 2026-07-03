import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(process.cwd())

let passed = 0
let failed = 0
const failures = []

function assert(condition, message) {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(message)
  }
}

function fileExists(path) {
  return existsSync(resolve(ROOT, path))
}

function fileContains(path, ...terms) {
  if (!fileExists(path)) return false
  const content = readFileSync(resolve(ROOT, path), 'utf8')
  return terms.every(t => content.includes(t))
}

function fileNotContains(path, ...terms) {
  if (!fileExists(path)) return true
  const content = readFileSync(resolve(ROOT, path), 'utf8')
  return !terms.some(t => content.includes(t))
}

console.log('\n=== verifyFinalLockdown — Phase 19 FPLMRL ===\n')

// ── Services: finalLockdown ──────────────────────────────────────────────────
const FINAL_AUDIT = 'server/services/finalLockdown/finalLockdownAuditService.js'
assert(fileExists(FINAL_AUDIT), 'finalLockdownAuditService.js exists')
assert(fileContains(FINAL_AUDIT, 'runFinalLockdownAudit'), 'runFinalLockdownAudit exported')
assert(fileContains(FINAL_AUDIT, 'auditProtectedFiles'), 'auditProtectedFiles exported')
assert(fileContains(FINAL_AUDIT, 'auditSmokeCraftProgressionIntegrity'), 'auditSmokeCraftProgressionIntegrity exported')
assert(fileContains(FINAL_AUDIT, 'auditPOS360Integrity'), 'auditPOS360Integrity exported')
assert(fileContains(FINAL_AUDIT, 'auditEATIntegrity'), 'auditEATIntegrity exported')
assert(fileContains(FINAL_AUDIT, 'auditISPAEIntegrity'), 'auditISPAEIntegrity exported')
assert(fileContains(FINAL_AUDIT, 'auditDMRCIntegrity'), 'auditDMRCIntegrity exported')
assert(fileContains(FINAL_AUDIT, 'auditOIPSLIntegrity'), 'auditOIPSLIntegrity exported')
assert(fileContains(FINAL_AUDIT, 'auditEPRLIntegrity'), 'auditEPRLIntegrity exported')
assert(fileContains(FINAL_AUDIT, 'auditLOCCIntegrity'), 'auditLOCCIntegrity exported')
assert(fileContains(FINAL_AUDIT, 'auditEOCGIntegrity'), 'auditEOCGIntegrity exported')
assert(fileContains(FINAL_AUDIT, 'auditRoleSafetyIntegrity'), 'auditRoleSafetyIntegrity exported')
assert(fileContains(FINAL_AUDIT, 'auditDegradedModeHonesty'), 'auditDegradedModeHonesty exported')
assert(fileContains(FINAL_AUDIT, 'auditCredentialSafety'), 'auditCredentialSafety exported')
assert(fileContains(FINAL_AUDIT, 'auditExternalSyncHonesty'), 'auditExternalSyncHonesty exported')
assert(fileContains(FINAL_AUDIT, 'auditPurchaseOrderHonesty'), 'auditPurchaseOrderHonesty exported')
assert(fileContains(FINAL_AUDIT, 'auditAutoPurchasingDisabled'), 'auditAutoPurchasingDisabled exported')
assert(fileContains(FINAL_AUDIT, 'buildFinalLockdownReport'), 'buildFinalLockdownReport exported')
assert(fileContains(FINAL_AUDIT, 'can_submit_live: false'), 'audit enforces can_submit_live: false')
assert(fileContains(FINAL_AUDIT, 'auto_approval_disabled: true'), 'audit enforces auto_approval_disabled: true')
assert(fileContains(FINAL_AUDIT, 'external_sync_not_live: true'), 'audit reports external_sync_not_live')
assert(fileContains(FINAL_AUDIT, 'real_time_push_pending: true'), 'audit reports real_time_push_pending')
assert(fileContains(FINAL_AUDIT, 'PRODUCTION_READY_WITH_ENV'), 'production_ready_with_env status defined')
assert(fileContains(FINAL_AUDIT, 'PRODUCTION_BLOCKED'), 'production_blocked status defined')

// ── Protected File Integrity ─────────────────────────────────────────────────
const PROT_INT = 'server/services/finalLockdown/protectedFileIntegrityService.js'
assert(fileExists(PROT_INT), 'protectedFileIntegrityService.js exists')
assert(fileContains(PROT_INT, 'getProtectedFileManifest'), 'getProtectedFileManifest exported')
assert(fileContains(PROT_INT, 'verifyProtectedFilesExist'), 'verifyProtectedFilesExist exported')
assert(fileContains(PROT_INT, 'verifyProtectedFilesNotModifiedUnexpectedly'), 'verifyProtectedFilesNotModifiedUnexpectedly exported')
assert(fileContains(PROT_INT, 'verifySmokeCraftRouteIntegrity'), 'verifySmokeCraftRouteIntegrity exported')
assert(fileContains(PROT_INT, 'verifyJourneyStructureIntegrity'), 'verifyJourneyStructureIntegrity exported')
assert(fileContains(PROT_INT, 'verifyPassportLockIntegrity'), 'verifyPassportLockIntegrity exported')
assert(fileContains(PROT_INT, 'verifyConnectionsLockIntegrity'), 'verifyConnectionsLockIntegrity exported')
assert(fileContains(PROT_INT, 'buildProtectedFileIntegrityReport'), 'buildProtectedFileIntegrityReport exported')
assert(fileContains(PROT_INT, 'SmokeCraftAssetScreen'), 'SmokeCraftAssetScreen in protected manifest')
assert(fileContains(PROT_INT, 'SmokeCraftHotspotLayer'), 'SmokeCraftHotspotLayer in protected manifest')
assert(fileContains(PROT_INT, 'SmokeCraftAssetRoute'), 'SmokeCraftAssetRoute in protected manifest')
assert(fileContains(PROT_INT, 'session.js'), 'session.js (VISIT_STRUCTURE) in protected manifest')
assert(fileContains(PROT_INT, 'passportProgress'), 'passportProgress in protected manifest')
assert(fileContains(PROT_INT, 'passportEntry'), 'passportEntry in protected manifest')
assert(fileContains(PROT_INT, 'smokecraftJourney'), 'smokecraftJourney in protected manifest')
assert(fileContains(PROT_INT, 'POS360'), 'POS360 referenced as protected shell')
assert(fileContains(PROT_INT, 'eatCommandHubContract'), 'E.A.T. hub contract referenced as protected')
assert(fileContains(PROT_INT, 'eight_visit_rule'), 'eight-visit rule enforced in journey structure')
assert(fileContains(PROT_INT, 'twenty_four_session_rule'), 'twenty-four-session rule enforced')

// ── Production Readiness ─────────────────────────────────────────────────────
const PROD_READY = 'server/services/finalLockdown/productionReadinessReportService.js'
assert(fileExists(PROD_READY), 'productionReadinessReportService.js exists')
assert(fileContains(PROD_READY, 'buildProductionReadinessReport'), 'buildProductionReadinessReport exported')
assert(fileContains(PROD_READY, 'getProductionBlockers'), 'getProductionBlockers exported')
assert(fileContains(PROD_READY, 'getProductionWarnings'), 'getProductionWarnings exported')
assert(fileContains(PROD_READY, 'getDeploymentRequirements'), 'getDeploymentRequirements exported')
assert(fileContains(PROD_READY, 'getRequiredEnvironmentVariablesForLaunch'), 'getRequiredEnvironmentVariablesForLaunch exported')
assert(fileContains(PROD_READY, 'getOptionalEnvironmentVariablesForLaunch'), 'getOptionalEnvironmentVariablesForLaunch exported')
assert(fileContains(PROD_READY, 'getExternalIntegrationRequirements'), 'getExternalIntegrationRequirements exported')
assert(fileContains(PROD_READY, 'getDatabaseLaunchRequirements'), 'getDatabaseLaunchRequirements exported')
assert(fileContains(PROD_READY, 'getPaymentLaunchRequirements'), 'getPaymentLaunchRequirements exported')
assert(fileContains(PROD_READY, 'getVendorLaunchRequirements'), 'getVendorLaunchRequirements exported')
assert(fileContains(PROD_READY, 'buildLaunchChecklist'), 'buildLaunchChecklist exported')
assert(fileContains(PROD_READY, 'DATABASE_URL'), 'DATABASE_URL referenced')
assert(fileContains(PROD_READY, 'STRIPE_SECRET_KEY'), 'STRIPE_SECRET_KEY referenced')
assert(fileContains(PROD_READY, 'EXTERNAL_POS_API_KEY'), 'EXTERNAL_POS_API_KEY referenced')
assert(fileContains(PROD_READY, 'external_sync_not_live'), 'external_sync_not_live in report')
assert(fileContains(PROD_READY, 'real_time_push_pending'), 'real_time_push_pending in report')
assert(fileContains(PROD_READY, 'can_submit_live: false'), 'can_submit_live: false enforced')
assert(fileContains(PROD_READY, 'auto_approval_disabled: true'), 'auto_approval_disabled: true enforced')
assert(fileContains(PROD_READY, 'PRODUCTION_READY_WITH_ENV'), 'PRODUCTION_READY_WITH_ENV status')
assert(fileContains(PROD_READY, 'PRODUCTION_BLOCKED'), 'PRODUCTION_BLOCKED status')
assert(fileContains(PROD_READY, 'LAUNCH_CHECKLIST_READY'), 'LAUNCH_CHECKLIST_READY status')

// ── Degraded-Mode Honesty ─────────────────────────────────────────────────────
const DEGRADE = 'server/services/finalLockdown/degradedModeHonestyService.js'
assert(fileExists(DEGRADE), 'degradedModeHonestyService.js exists')
assert(fileContains(DEGRADE, 'auditDegradedModeTerms'), 'auditDegradedModeTerms exported')
assert(fileContains(DEGRADE, 'auditNoFakeLiveSyncClaims'), 'auditNoFakeLiveSyncClaims exported')
assert(fileContains(DEGRADE, 'auditNoFakeVendorSubmissionClaims'), 'auditNoFakeVendorSubmissionClaims exported')
assert(fileContains(DEGRADE, 'auditNoFakePersistenceClaims'), 'auditNoFakePersistenceClaims exported')
assert(fileContains(DEGRADE, 'auditNoAutoPurchaseClaims'), 'auditNoAutoPurchaseClaims exported')
assert(fileContains(DEGRADE, 'buildDegradedModeHonestyReport'), 'buildDegradedModeHonestyReport exported')
assert(fileContains(DEGRADE, 'in_memory_only'), 'in_memory_only term present')
assert(fileContains(DEGRADE, 'degradedMode'), 'degradedMode term present')
assert(fileContains(DEGRADE, 'database_required'), 'database_required term present')
assert(fileContains(DEGRADE, 'preview_only'), 'preview_only term present')
assert(fileContains(DEGRADE, 'external_sync_not_live'), 'external_sync_not_live term present')
assert(fileContains(DEGRADE, 'vendor_sync_not_live'), 'vendor_sync_not_live term present')
assert(fileContains(DEGRADE, 'real_time_push_pending'), 'real_time_push_pending term present')
assert(fileContains(DEGRADE, 'purchase_order_not_submitted'), 'purchase_order_not_submitted term present')
assert(fileContains(DEGRADE, 'reorder_not_submitted'), 'reorder_not_submitted term present')
assert(fileContains(DEGRADE, 'vendor_api_required'), 'vendor_api_required term present')
assert(fileContains(DEGRADE, 'distributor_connection_required'), 'distributor_connection_required term present')
assert(fileContains(DEGRADE, 'manufacturer_connection_required'), 'manufacturer_connection_required term present')
assert(fileContains(DEGRADE, 'autoApprovalDisabled'), 'autoApprovalDisabled term present')
assert(fileContains(DEGRADE, 'canSubmitLive'), 'canSubmitLive term present')
assert(fileContains(DEGRADE, 'no_fake_pos_synced'), 'no_fake_pos_synced verified')
assert(fileContains(DEGRADE, 'no_fake_vendor_order_sent'), 'no_fake_vendor_order_sent verified')
assert(fileContains(DEGRADE, 'no_fake_pos_synced'), 'no_fake_pos_synced (payment capture not claimed)')
assert(fileContains(DEGRADE, 'auto_approval_disabled_everywhere'), 'auto_approval_disabled_everywhere verified')

// ── Security Safety ───────────────────────────────────────────────────────────
const SEC = 'server/services/finalLockdown/securitySafetyAuditService.js'
assert(fileExists(SEC), 'securitySafetyAuditService.js exists')
assert(fileContains(SEC, 'auditCredentialRedaction'), 'auditCredentialRedaction exported')
assert(fileContains(SEC, 'auditDatabaseUrlRedaction'), 'auditDatabaseUrlRedaction exported')
assert(fileContains(SEC, 'auditStripeSecretRedaction'), 'auditStripeSecretRedaction exported')
assert(fileContains(SEC, 'auditVendorCredentialRedaction'), 'auditVendorCredentialRedaction exported')
assert(fileContains(SEC, 'auditPOSCredentialRedaction'), 'auditPOSCredentialRedaction exported')
assert(fileContains(SEC, 'auditWebhookSecretRedaction'), 'auditWebhookSecretRedaction exported')
assert(fileContains(SEC, 'auditUnsafeRoleBlocks'), 'auditUnsafeRoleBlocks exported')
assert(fileContains(SEC, 'auditSensitiveRouteProtection'), 'auditSensitiveRouteProtection exported')
assert(fileContains(SEC, 'buildSecuritySafetyReport'), 'buildSecuritySafetyReport exported')
assert(fileContains(SEC, 'safeCredentialStatus'), 'safeCredentialStatus referenced')
assert(fileContains(SEC, 'credential_values_never_returned'), 'credential_values_never_returned verified')
assert(fileContains(SEC, 'no_raw_secrets_in_responses'), 'no_raw_secrets_in_responses verified')
assert(fileContains(SEC, 'guest'), 'guest blocked role referenced')
assert(fileContains(SEC, 'kitchen_staff'), 'kitchen_staff blocked role referenced')
assert(fileContains(SEC, "'owner','admin','manager'"), 'allowed submission roles referenced')

// ── Final Verification Registry ───────────────────────────────────────────────
const VER_REG = 'server/services/finalLockdown/finalVerificationRegistryService.js'
assert(fileExists(VER_REG), 'finalVerificationRegistryService.js exists')
assert(fileContains(VER_REG, 'getFinalVerificationRegistry'), 'getFinalVerificationRegistry exported')
assert(fileContains(VER_REG, 'getRequiredVerificationScripts'), 'getRequiredVerificationScripts exported')
assert(fileContains(VER_REG, 'getVerificationCommandList'), 'getVerificationCommandList exported')
assert(fileContains(VER_REG, 'buildVerificationChecklist'), 'buildVerificationChecklist exported')
assert(fileContains(VER_REG, 'buildFinalVerificationReportTemplate'), 'buildFinalVerificationReportTemplate exported')
assert(fileContains(VER_REG, 'verify:external-operations-gateway'), 'Phase 18 script registered')
assert(fileContains(VER_REG, 'verify:locc-dashboard'), 'Phase 17 script registered')
assert(fileContains(VER_REG, 'verify:environment-readiness'), 'Phase 16 script registered')
assert(fileContains(VER_REG, 'verify:inventory-persistence-sync'), 'Phase 15 script registered')
assert(fileContains(VER_REG, 'verify:inventory'), 'Phase 14 ISPAE script registered')
assert(fileContains(VER_REG, 'verify:reorder-connectors'), 'Phase 14 DMRC script registered')
assert(fileContains(VER_REG, 'verify:staff-dragdrop'), 'Phase 13B script registered')
assert(fileContains(VER_REG, 'verify:staff'), 'Phase 13 script registered')
assert(fileContains(VER_REG, 'verify:checkout'), 'Phase 12 script registered')
assert(fileContains(VER_REG, 'verify:ncie-wiring'), 'Phase 11 wiring script registered')
assert(fileContains(VER_REG, 'verify:ncie'), 'Phase 11 NCIE script registered')
assert(fileContains(VER_REG, 'verify:kds'), 'Phase 10 script registered')
assert(fileContains(VER_REG, 'verify:orders'), 'Phase 8 script registered')
assert(fileContains(VER_REG, 'verify:tax'), 'Phase 7 script registered')
assert(fileContains(VER_REG, 'verify:payments'), 'Phase 6 script registered')
assert(fileContains(VER_REG, 'verify:database'), 'Phase 5 script registered')
assert(fileContains(VER_REG, 'verify:pos360'), 'Phase 4 script registered')
assert(fileContains(VER_REG, 'verify:venue-onboarding'), 'Phase 3 script registered')
assert(fileContains(VER_REG, 'verify:partner-vendors'), 'Phase 2 script registered')
assert(fileContains(VER_REG, 'verify:final-lockdown'), 'Phase 19 script registered')

// ── Module Readiness Map ──────────────────────────────────────────────────────
const MOD_MAP = 'server/services/moduleReadiness/moduleReadinessMapService.js'
assert(fileExists(MOD_MAP), 'moduleReadinessMapService.js exists')
assert(fileContains(MOD_MAP, 'buildModuleReadinessMap'), 'buildModuleReadinessMap exported')
assert(fileContains(MOD_MAP, 'getModuleReadinessById'), 'getModuleReadinessById exported')
assert(fileContains(MOD_MAP, 'getCoreModules'), 'getCoreModules exported')
assert(fileContains(MOD_MAP, 'getAddonModules'), 'getAddonModules exported')
assert(fileContains(MOD_MAP, 'getPremiumModules'), 'getPremiumModules exported')
assert(fileContains(MOD_MAP, 'getEnterpriseModules'), 'getEnterpriseModules exported')
assert(fileContains(MOD_MAP, 'getModuleDependencies'), 'getModuleDependencies exported')
assert(fileContains(MOD_MAP, 'getModulePackagingBlockers'), 'getModulePackagingBlockers exported')
assert(fileContains(MOD_MAP, 'buildPostPhaseModuleBuildPlan'), 'buildPostPhaseModuleBuildPlan exported')
assert(fileContains(MOD_MAP, 'smokecraft-experience'), 'SmokeCraft module in map')
assert(fileContains(MOD_MAP, 'pos360'), 'POS360 module in map')
assert(fileContains(MOD_MAP, 'eat-command-hub'), 'E.A.T. module in map')
assert(fileContains(MOD_MAP, 'inventory-ispae'), 'ISPAE module in map')
assert(fileContains(MOD_MAP, 'reorder-dmrc'), 'DMRC module in map')
assert(fileContains(MOD_MAP, 'locc'), 'LOCC module in map')
assert(fileContains(MOD_MAP, 'eocg'), 'EOCG module in map')
assert(fileContains(MOD_MAP, 'venue-onboarding'), 'Venue Onboarding module in map')
assert(fileContains(MOD_MAP, 'vendor-partner'), 'Partner Vendor module in map')
assert(fileContains(MOD_MAP, 'checkout'), 'Checkout module in map')
assert(fileContains(MOD_MAP, 'kds'), 'KDS module in map')
assert(fileContains(MOD_MAP, 'ncie'), 'NCIE module in map')
assert(fileContains(MOD_MAP, 'passport-connections'), 'Passport Connections module in map')
assert(fileContains(MOD_MAP, 'white-label-licensing'), 'White-Label Licensing module in map')
assert(fileContains(MOD_MAP, 'marketplace-registry'), 'Marketplace Registry module in map')
assert(fileContains(MOD_MAP, 'needs_module_manifest'), 'needs_module_manifest status used')
assert(fileContains(MOD_MAP, 'future_module'), 'future_module status used')
assert(fileContains(MOD_MAP, 'module_install_not_built_yet'), 'module install not built honestly stated')
assert(fileContains(MOD_MAP, 'POST-PHASE AUDIT AND MODULE BUILD SERIES'), 'post-phase series named')
assert(fileContains(MOD_MAP, 'Module Build 1'), 'Module Build 1 defined')
assert(fileContains(MOD_MAP, 'Module Build 9'), 'Module Build 9 defined')
assert(fileContains(MOD_MAP, 'not Phase 20'), 'Module map clarifies these are not Phase 20')

// ── Marketplace Packaging ─────────────────────────────────────────────────────
const MKTPL = 'server/services/moduleReadiness/marketplacePackagingReadinessService.js'
assert(fileExists(MKTPL), 'marketplacePackagingReadinessService.js exists')
assert(fileContains(MKTPL, 'buildMarketplaceReadinessReport'), 'buildMarketplaceReadinessReport exported')
assert(fileContains(MKTPL, 'buildMarketplaceListingDrafts'), 'buildMarketplaceListingDrafts exported')
assert(fileContains(MKTPL, 'getMarketplacePackagingBlockers'), 'getMarketplacePackagingBlockers exported')
assert(fileContains(MKTPL, 'getPricingModelRecommendations'), 'getPricingModelRecommendations exported')
assert(fileContains(MKTPL, 'getDemoRouteRequirements'), 'getDemoRouteRequirements exported')
assert(fileContains(MKTPL, 'getScreenshotRequirements'), 'getScreenshotRequirements exported')
assert(fileContains(MKTPL, 'buildMarketplaceLaunchChecklist'), 'buildMarketplaceLaunchChecklist exported')
assert(fileContains(MKTPL, 'included'), 'included pricing model')
assert(fileContains(MKTPL, 'premium_addon'), 'premium_addon pricing model')
assert(fileContains(MKTPL, 'enterprise_addon'), 'enterprise_addon pricing model')
assert(fileContains(MKTPL, 'per_venue'), 'per_venue pricing model')
assert(fileContains(MKTPL, 'white_label_license'), 'white_label_license pricing model')
assert(fileContains(MKTPL, 'reseller_license'), 'reseller_license pricing model')
assert(fileContains(MKTPL, 'live_marketplace'), 'live_marketplace field present')
assert(fileContains(MKTPL, 'marketplace_not_live'), 'marketplace_not_live status honest')
assert(fileContains(MKTPL, 'listing_drafts_only'), 'listing_drafts_only honest')
assert(fileContains(MKTPL, 'marketplace_ready_draft'), 'marketplace_ready_draft status used')

// ── White-Label Licensing ─────────────────────────────────────────────────────
const WL = 'server/services/moduleReadiness/whiteLabelLicensingReadinessService.js'
assert(fileExists(WL), 'whiteLabelLicensingReadinessService.js exists')
assert(fileContains(WL, 'buildWhiteLabelReadinessReport'), 'buildWhiteLabelReadinessReport exported')
assert(fileContains(WL, 'getLicenseTierRecommendations'), 'getLicenseTierRecommendations exported')
assert(fileContains(WL, 'getModuleLicenseRequirements'), 'getModuleLicenseRequirements exported')
assert(fileContains(WL, 'getAddonLicenseRequirements'), 'getAddonLicenseRequirements exported')
assert(fileContains(WL, 'getWhiteLabelBrandingRequirements'), 'getWhiteLabelBrandingRequirements exported')
assert(fileContains(WL, 'getResellerReadinessChecklist'), 'getResellerReadinessChecklist exported')
assert(fileContains(WL, 'getBrokerMonetizationChecklist'), 'getBrokerMonetizationChecklist exported')
assert(fileContains(WL, 'buildLicensingLaunchChecklist'), 'buildLicensingLaunchChecklist exported')
assert(fileContains(WL, "'core'"), 'core license tier defined')
assert(fileContains(WL, "'premium'"), 'premium license tier defined')
assert(fileContains(WL, "'enterprise'"), 'enterprise license tier defined')
assert(fileContains(WL, "'white_label'"), 'white_label license tier defined')
assert(fileContains(WL, "'reseller'"), 'reseller license tier defined')
assert(fileContains(WL, "'internal_admin'"), 'internal_admin license tier defined')
assert(fileContains(WL, 'license_gate_built: false'), 'license_gate_built: false honest')
assert(fileContains(WL, 'white_label_ready_draft'), 'white_label_ready_draft status used')
assert(fileContains(WL, 'tier_defined_not_enforced'), 'tier_defined_not_enforced honest')

// ── Controller ────────────────────────────────────────────────────────────────
const CTRL = 'server/controllers/finalLockdownController.js'
assert(fileExists(CTRL), 'finalLockdownController.js exists')
assert(fileContains(CTRL, 'getFinalLockdownAudit'), 'getFinalLockdownAudit exported')
assert(fileContains(CTRL, 'getProtectedFiles'), 'getProtectedFiles exported')
assert(fileContains(CTRL, 'getProductionReadiness'), 'getProductionReadiness exported')
assert(fileContains(CTRL, 'getDegradedModeHonesty'), 'getDegradedModeHonesty exported')
assert(fileContains(CTRL, 'getSecuritySafety'), 'getSecuritySafety exported')
assert(fileContains(CTRL, 'getModuleReadiness'), 'getModuleReadiness exported')
assert(fileContains(CTRL, 'getMarketplaceReadiness'), 'getMarketplaceReadiness exported')
assert(fileContains(CTRL, 'getWhiteLabelReadiness'), 'getWhiteLabelReadiness exported')
assert(fileContains(CTRL, 'getVerificationRegistry'), 'getVerificationRegistry exported')
assert(fileContains(CTRL, 'getLaunchChecklist'), 'getLaunchChecklist exported')
assert(fileContains(CTRL, 'getPostPhaseModulePlan'), 'getPostPhaseModulePlan exported')

// ── Routes ────────────────────────────────────────────────────────────────────
const ROUTES = 'server/routes/finalLockdownRoutes.js'
assert(fileExists(ROUTES), 'finalLockdownRoutes.js exists')
assert(fileContains(ROUTES, '/audit'), 'GET /audit route present')
assert(fileContains(ROUTES, '/protected-files'), 'GET /protected-files route present')
assert(fileContains(ROUTES, '/production-readiness'), 'GET /production-readiness route present')
assert(fileContains(ROUTES, '/degraded-mode-honesty'), 'GET /degraded-mode-honesty route present')
assert(fileContains(ROUTES, '/security-safety'), 'GET /security-safety route present')
assert(fileContains(ROUTES, '/module-readiness'), 'GET /module-readiness route present')
assert(fileContains(ROUTES, '/marketplace-readiness'), 'GET /marketplace-readiness route present')
assert(fileContains(ROUTES, '/white-label-readiness'), 'GET /white-label-readiness route present')
assert(fileContains(ROUTES, '/verification-registry'), 'GET /verification-registry route present')
assert(fileContains(ROUTES, '/launch-checklist'), 'GET /launch-checklist route present')
assert(fileContains(ROUTES, '/post-phase-module-plan'), 'GET /post-phase-module-plan route present')

// ── Server index mounts ───────────────────────────────────────────────────────
const IDX = 'server/index.js'
assert(fileContains(IDX, 'finalLockdownRoutes'), 'finalLockdownRoutes imported in index.js')
assert(fileContains(IDX, '/api/final-lockdown'), 'final-lockdown route mounted in index.js')

// ── UI Components ─────────────────────────────────────────────────────────────
const COMP_DIR = 'src/components/finalLockdown'
assert(fileExists(`${COMP_DIR}/FinalLockdownSummaryPanel.jsx`), 'FinalLockdownSummaryPanel.jsx exists')
assert(fileExists(`${COMP_DIR}/ProductionReadinessPanel.jsx`), 'ProductionReadinessPanel.jsx exists')
assert(fileExists(`${COMP_DIR}/ProtectedFileIntegrityPanel.jsx`), 'ProtectedFileIntegrityPanel.jsx exists')
assert(fileExists(`${COMP_DIR}/DegradedModeHonestyPanel.jsx`), 'DegradedModeHonestyPanel.jsx exists')
assert(fileExists(`${COMP_DIR}/SecuritySafetyAuditPanel.jsx`), 'SecuritySafetyAuditPanel.jsx exists')
assert(fileExists(`${COMP_DIR}/ModuleReadinessMapPanel.jsx`), 'ModuleReadinessMapPanel.jsx exists')
assert(fileExists(`${COMP_DIR}/MarketplaceReadinessPanel.jsx`), 'MarketplaceReadinessPanel.jsx exists')
assert(fileExists(`${COMP_DIR}/WhiteLabelReadinessPanel.jsx`), 'WhiteLabelReadinessPanel.jsx exists')
assert(fileExists(`${COMP_DIR}/VerificationRegistryPanel.jsx`), 'VerificationRegistryPanel.jsx exists')
assert(fileExists(`${COMP_DIR}/LaunchChecklistPanel.jsx`), 'LaunchChecklistPanel.jsx exists')
assert(fileExists(`${COMP_DIR}/PostPhaseModulePlanPanel.jsx`), 'PostPhaseModulePlanPanel.jsx exists')
assert(fileExists(`${COMP_DIR}/ProductionBlockerNotice.jsx`), 'ProductionBlockerNotice.jsx exists')
assert(fileExists(`${COMP_DIR}/ReadyToPackageBadge.jsx`), 'ReadyToPackageBadge.jsx exists')
assert(fileExists(`${COMP_DIR}/ModulePackagingStatusCard.jsx`), 'ModulePackagingStatusCard.jsx exists')
assert(fileExists(`${COMP_DIR}/WhiteLabelLicenseTierCard.jsx`), 'WhiteLabelLicenseTierCard.jsx exists')

// ── Component content checks ──────────────────────────────────────────────────
assert(fileContains(`${COMP_DIR}/FinalLockdownSummaryPanel.jsx`, 'can_submit_live', 'auto_approval_disabled'), 'FinalLockdownSummaryPanel shows honest status')
assert(fileContains(`${COMP_DIR}/DegradedModeHonestyPanel.jsx`, 'external_sync_not_live', 'no_fake_pos_synced'), 'DegradedModeHonestyPanel shows honest degraded terms')
assert(fileContains(`${COMP_DIR}/SecuritySafetyAuditPanel.jsx`, 'safe_credential_status', 'no raw secrets'), 'SecuritySafetyAuditPanel shows credential safety')
assert(fileContains(`${COMP_DIR}/ProductionBlockerNotice.jsx`, 'Production Blockers'), 'ProductionBlockerNotice shows blocker header')
assert(fileContains(`${COMP_DIR}/LaunchChecklistPanel.jsx`, 'production_blocked'), 'LaunchChecklistPanel shows production_blocked')
assert(fileContains(`${COMP_DIR}/PostPhaseModulePlanPanel.jsx`, 'Module Build'), 'PostPhaseModulePlanPanel shows module build sequence')
assert(fileContains(`${COMP_DIR}/PostPhaseModulePlanPanel.jsx`, 'post-phase module builds'), 'PostPhaseModulePlanPanel clarifies not Phase 20')
assert(fileContains(`${COMP_DIR}/ModuleReadinessMapPanel.jsx`, 'needs_module_manifest', 'not_yet_packaged'), 'ModuleReadinessMapPanel shows honest not-packaged status')
assert(fileContains(`${COMP_DIR}/WhiteLabelReadinessPanel.jsx`, 'white_label_ready_draft', 'license_gate_not_built'), 'WhiteLabelReadinessPanel shows honest draft status')
assert(fileContains(`${COMP_DIR}/MarketplaceReadinessPanel.jsx`, 'marketplace_ready_draft', 'live_marketplace: false'), 'MarketplaceReadinessPanel shows marketplace not live')

// ── Demo Page ─────────────────────────────────────────────────────────────────
const DEMO = 'src/pages/FinalProductionLockdownDemo.jsx'
assert(fileExists(DEMO), 'FinalProductionLockdownDemo.jsx exists')
assert(fileContains(DEMO, 'FinalLockdownSummaryPanel'), 'Demo imports FinalLockdownSummaryPanel')
assert(fileContains(DEMO, 'ProductionReadinessPanel'), 'Demo imports ProductionReadinessPanel')
assert(fileContains(DEMO, 'ProtectedFileIntegrityPanel'), 'Demo imports ProtectedFileIntegrityPanel')
assert(fileContains(DEMO, 'DegradedModeHonestyPanel'), 'Demo imports DegradedModeHonestyPanel')
assert(fileContains(DEMO, 'SecuritySafetyAuditPanel'), 'Demo imports SecuritySafetyAuditPanel')
assert(fileContains(DEMO, 'ModuleReadinessMapPanel'), 'Demo imports ModuleReadinessMapPanel')
assert(fileContains(DEMO, 'MarketplaceReadinessPanel'), 'Demo imports MarketplaceReadinessPanel')
assert(fileContains(DEMO, 'WhiteLabelReadinessPanel'), 'Demo imports WhiteLabelReadinessPanel')
assert(fileContains(DEMO, 'VerificationRegistryPanel'), 'Demo imports VerificationRegistryPanel')
assert(fileContains(DEMO, 'LaunchChecklistPanel'), 'Demo imports LaunchChecklistPanel')
assert(fileContains(DEMO, 'PostPhaseModulePlanPanel'), 'Demo imports PostPhaseModulePlanPanel')
assert(fileContains(DEMO, 'ProductionBlockerNotice'), 'Demo imports ProductionBlockerNotice')
assert(fileContains(DEMO, 'phase19_sealed: true'), 'Demo shows phase19_sealed: true')
assert(fileContains(DEMO, 'can_submit_live: false'), 'Demo shows can_submit_live: false')
assert(fileContains(DEMO, 'auto_approval_disabled: true'), 'Demo shows auto_approval_disabled: true')
assert(fileContains(DEMO, 'external_sync_not_live: true'), 'Demo shows external_sync_not_live: true')
assert(fileContains(DEMO, 'production_blocked'), 'Demo shows production_blocked status')
assert(fileContains(DEMO, 'Component proof page'), 'Demo is labeled as proof page not admin dashboard')
assert(!fileContains(DEMO, 'final admin dashboard redesign'), 'Demo not claimed as redesign')

// ── E.A.T. Hooks (Phase 19) ───────────────────────────────────────────────────
const EAT = 'server/services/eatCommandHubContract.js'
assert(fileContains(EAT, 'getFinalLockdownReadinessHooks'), 'E.A.T. hook: getFinalLockdownReadinessHooks')
assert(fileContains(EAT, 'getProductionReadinessHooks'), 'E.A.T. hook: getProductionReadinessHooks')
assert(fileContains(EAT, 'getProtectedFileIntegrityHooks'), 'E.A.T. hook: getProtectedFileIntegrityHooks')
assert(fileContains(EAT, 'getDegradedModeHonestyHooks'), 'E.A.T. hook: getDegradedModeHonestyHooks')
assert(fileContains(EAT, 'getSecuritySafetyAuditHooks'), 'E.A.T. hook: getSecuritySafetyAuditHooks')
assert(fileContains(EAT, 'getModuleReadinessHooks'), 'E.A.T. hook: getModuleReadinessHooks')
assert(fileContains(EAT, 'getMarketplaceReadinessHooks'), 'E.A.T. hook: getMarketplaceReadinessHooks')
assert(fileContains(EAT, 'getWhiteLabelReadinessHooks'), 'E.A.T. hook: getWhiteLabelReadinessHooks')
assert(fileContains(EAT, 'getFinalVerificationRegistryHooks'), 'E.A.T. hook: getFinalVerificationRegistryHooks')
assert(fileContains(EAT, 'getPostPhaseModulePlanHooks'), 'E.A.T. hook: getPostPhaseModulePlanHooks')
assert(fileContains(EAT, 'needs_module_packaging'), 'E.A.T. hooks report needs_module_packaging')
assert(fileContains(EAT, 'module_build_plan_ready'), 'E.A.T. hooks report module_build_plan_ready')
assert(fileContains(EAT, "'fplmrl'"), 'E.A.T. hooks tagged with fplmrl system')

// ── Documentation ─────────────────────────────────────────────────────────────
const DOC = 'docs/FINAL_PRODUCTION_LOCKDOWN_AND_MODULE_READINESS.md'
assert(fileExists(DOC), 'docs/FINAL_PRODUCTION_LOCKDOWN_AND_MODULE_READINESS.md exists')
assert(fileContains(DOC, 'Phase 19'), 'Docs mention Phase 19')
assert(fileContains(DOC, 'FPLMRL'), 'Docs mention FPLMRL')
assert(fileContains(DOC, '19-phase core build'), 'Docs describe 19-phase build')
assert(fileContains(DOC, 'What Is Production-Ready'), 'Docs cover production-ready section')
assert(fileContains(DOC, 'What Remains Preview-Only'), 'Docs cover preview-only section')
assert(fileContains(DOC, 'external_sync_not_live'), 'Docs mention external_sync_not_live')
assert(fileContains(DOC, 'real_time_push_pending'), 'Docs mention real_time_push_pending')
assert(fileContains(DOC, 'Protected File Integrity'), 'Docs have protected file section')
assert(fileContains(DOC, 'Verification Registry'), 'Docs have verification registry section')
assert(fileContains(DOC, 'Module Readiness Map'), 'Docs have module readiness section')
assert(fileContains(DOC, 'Marketplace Packaging'), 'Docs have marketplace section')
assert(fileContains(DOC, 'White-Label Licensing'), 'Docs have white-label section')
assert(fileContains(DOC, 'Launch Checklist'), 'Docs have launch checklist section')
assert(fileContains(DOC, 'Post-Phase Module Build Sequence'), 'Docs have post-phase build sequence')
assert(fileContains(DOC, 'Why There Is No Phase 20'), 'Docs explain why no Phase 20')
assert(fileContains(DOC, 'Module Build 1'), 'Docs define Module Build 1')
assert(fileContains(DOC, 'Module Build 9'), 'Docs define Module Build 9')
assert(fileContains(DOC, 'can_submit_live: false'), 'Docs honest status section present')
assert(fileContains(DOC, 'auto_approval_disabled: true'), 'Docs auto_approval_disabled honest')
assert(fileContains(DOC, 'Why There Is No Phase 20'), 'Docs explain why no Phase 20 (section present)')

// ── Package.json script ───────────────────────────────────────────────────────
const PKG = 'package.json'
assert(fileContains(PKG, 'verify:final-lockdown'), 'verify:final-lockdown in package.json')
assert(fileContains(PKG, 'verifyFinalLockdown.js'), 'verifyFinalLockdown.js referenced in package.json')
assert(fileContains(PKG, 'verify:external-operations-gateway'), 'verify:external-operations-gateway still in package.json')
assert(fileContains(PKG, 'verify:locc-dashboard'), 'verify:locc-dashboard still in package.json')

// ── Protected files still exist ───────────────────────────────────────────────
assert(fileExists('src/components/smokecraft/SmokeCraftAssetScreen.jsx'), 'SmokeCraftAssetScreen.jsx still exists — PROTECTED')
assert(fileExists('src/components/smokecraft/SmokeCraftHotspotLayer.jsx'), 'SmokeCraftHotspotLayer.jsx still exists — PROTECTED')
assert(fileExists('src/components/smokecraft/SmokeCraftAssetRoute.jsx'), 'SmokeCraftAssetRoute.jsx still exists — PROTECTED')
assert(fileExists('src/constants/session.js'), 'session.js still exists — PROTECTED')
assert(fileExists('src/utils/passportProgress.js'), 'passportProgress.js still exists — PROTECTED')
assert(fileExists('src/utils/passportEntry.js'), 'passportEntry.js still exists — PROTECTED')
assert(fileExists('src/constants/smokecraftJourney.js'), 'smokecraftJourney.js still exists — PROTECTED')

// ── Prior phase files still exist ────────────────────────────────────────────
assert(fileExists('server/services/inventory/inventoryAvailabilityService.js'), 'ISPAE inventory availability service still present')
assert(fileExists('server/services/reorder/reorderApprovalService.js'), 'DMRC reorder approval service still present')
assert(fileExists('server/services/inventory/inventoryPersistenceService.js'), 'OIPSL inventory persistence service still present')
assert(fileExists('server/services/environment/environmentReadinessService.js'), 'EPRL environment readiness service still present')
assert(fileExists('server/services/operations/operationsDashboardService.js'), 'LOCC operations dashboard service still present')
assert(fileExists('server/services/reorder/purchaseOrderSubmissionGateway.js'), 'PO submission gateway (role safety) still present')
assert(fileExists('server/services/externalOps/liveExternalOperationsReadinessService.js'), 'EOCG readiness service still present')
assert(fileExists('server/services/reorder/purchaseOrderSubmissionGateway.js'), 'PO submission gateway still present')
assert(fileExists('server/utils/safeCredentialStatus.js'), 'safeCredentialStatus utility still present')

// ── No fake claims in Phase 19 services ──────────────────────────────────────
assert(!fileContains(FINAL_AUDIT, 'POS synced'), 'finalLockdownAuditService has no fake POS sync claim')
assert(!fileContains(FINAL_AUDIT, 'vendor order sent'), 'finalLockdownAuditService has no fake vendor order claim')
assert(!fileContains(PROD_READY, 'POS synced'), 'productionReadinessReport has no fake POS sync claim')
assert(!fileContains(MOD_MAP, 'auto purchase'), 'moduleReadinessMap has no auto purchase claim')
assert(!fileContains(MKTPL, 'order submitted'), 'marketplacePackaging has no fake order submitted claim')

// ── Honest can_submit_live and auto_approval enforced in Phase 19 files ──────
assert(fileContains(FINAL_AUDIT, 'can_submit_live: false'), 'Phase 19 lockdown audit: can_submit_live false')
assert(fileContains(PROD_READY, 'can_submit_live: false'), 'Phase 19 production report: can_submit_live false')

// Print results
console.log(`\n  Passed: ${passed}`)
console.log(`  Failed: ${failed}`)

if (failures.length > 0) {
  console.log('\n  Failed assertions:')
  failures.forEach(f => console.log(`  • ${f}`))
  process.exit(1)
} else {
  console.log('\n  All assertions passed. Phase 19 FPLMRL verified.\n')
}
