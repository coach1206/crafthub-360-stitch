// Phase D.1 — Provider Activation Feature Flags
// contains_secrets: false, stores_secrets: false — hardcoded; no secrets ever stored here

export const DEFAULT_PHASE_D_PROVIDER_ACTIVATION_FLAGS = {
  phaseDProviderActivationEnabled:          false,
  providerRoadmapEnabled:                   false,
  providerCategoriesEnabled:                false,
  providerCandidatesEnabled:                false,
  providerActivationOrderEnabled:           false,
  providerDependenciesEnabled:              false,
  credentialPlaceholdersEnabled:            false,
  providerPrerequisitesEnabled:             false,
  providerBlockersEnabled:                  false,
  legalRequirementsEnabled:                 false,
  billingRequirementsEnabled:               false,
  securityRequirementsEnabled:              false,
  activationStatusesEnabled:                false,
  testStatusesEnabled:                      false,
  verificationStatusesEnabled:              false,
  rollbackRecordsEnabled:                   false,
  failureRecordsEnabled:                    false,
  readinessMatrixEnabled:                   false,
  safeActivationClaimsEnabled:              false,
  unsafeActivationClaimsEnabled:            false,
  activationSnapshotsEnabled:               false,
  activationAuditEnabled:                   false,
  paymentsProviderPlanningEnabled:          false,
  billingProviderPlanningEnabled:           false,
  externalPOSProviderPlanningEnabled:       false,
  inventoryProviderPlanningEnabled:         false,
  notificationProviderPlanningEnabled:      false,
  securityProviderPlanningEnabled:          false,
  deploymentProviderPlanningEnabled:        false,
  marketplaceProviderPlanningEnabled:       false,
  manualFallbackPlanningEnabled:            false,
  // Enforcement flags — default TRUE: these cannot be disabled without audit
  noFakeProviderActivationEnforced:         true,
  noFakePaymentProcessingEnforced:          true,
  noFakeBillingConnectionEnforced:          true,
  noFakeExternalPOSSyncEnforced:            true,
  noFakeInventorySyncEnforced:              true,
  noFakeNotificationDeliveryEnforced:       true,
  noFakeSecurityProviderConnectionEnforced: true,
  noFakeDeploymentCompletionEnforced:       true,
  noFakeMarketplaceTransactionEnforced:     true,
  noFakeLiveModeEnforced:                   true,
  noSecretsStorageEnforced:                 true,
  platformAdminGuardRequired:               true,
};

export function getPhaseDProviderActivationFlags(overrides = {}) {
  return { ...DEFAULT_PHASE_D_PROVIDER_ACTIVATION_FLAGS, ...overrides };
}
