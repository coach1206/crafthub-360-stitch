// POS360 Production Readiness — Final Phase Feature Flags

export const DEFAULT_POS360_PRODUCTION_READINESS_FLAGS = {
  productionReadinessEnabled: true,
  finalAuditEnabled: true,
  launchLockEnabled: true,
  routeRegistryAuditEnabled: true,
  frontendRouteAuditEnabled: true,
  apiMountAuditEnabled: true,
  canAccessPOS3AuditEnabled: true,
  noFakeAuditEnabled: true,
  secretStorageAuditEnabled: true,
  piiFinancialAuditEnabled: true,
  idempotencyAuditEnabled: true,
  venueScopeAuditEnabled: true,
  managerApprovalAuditEnabled: true,
  offlineQueueAuditEnabled: true,
  featureFlagAuditEnabled: true,
  localeAuditEnabled: true,
  localPreviewTruthAuditEnabled: true,
  demoModeControlsEnabled: true,
  launchDisclosureEnabled: true,
  venueSalesClaimsGuardEnabled: true,
  productionLockFileEnabled: true,
  finalReadinessDashboardEnabled: true,
  finalVerificationScriptEnabled: true,
  futurePhaseCRecommendationsEnabled: true,
  noFakePaymentClaimsEnforced: true,
  noFakeProviderClaimsEnforced: true,
  noFakeExternalPOSClaimsEnforced: true,
  noFakeKDSClaimsEnforced: true,
  noFakePrinterClaimsEnforced: true,
  noFakeInventoryClaimsEnforced: true,
  noFakeAgeVerificationClaimsEnforced: true,
  noFakeEATAIClaimsEnforced: true,
  noFakeSmokeCraftSyncClaimsEnforced: true,
  noSecretsStorageEnforced: true,
  canAccessPOS3ProtectionRequired: true,
};

export function getProductionReadinessFlags(venueOverrides = {}) {
  return { ...DEFAULT_POS360_PRODUCTION_READINESS_FLAGS, ...venueOverrides };
}
