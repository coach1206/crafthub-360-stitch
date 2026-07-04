/**
 * pos360EventPackageFeatureFlags.js — Phase B.10 Prompt W
 * Venue-configurable feature flags for event packages and monetization.
 */

export const DEFAULT_POS360_EVENT_PACKAGE_FLAGS = {
  eventPackagesEnabled:                   true,
  kitchenPackagesEnabled:                 true,
  barPackagesEnabled:                     true,
  humidorPackagesEnabled:                 true,
  cigarPackagesEnabled:                   true,
  patioPackagesEnabled:                   true,
  roomPackagesEnabled:                    true,
  servicePackagesEnabled:                 true,
  entertainmentPackagesEnabled:           true,
  customPackagesEnabled:                  true,
  packagePricingRulesEnabled:             true,
  depositTrackingEnabled:                 true,
  depositWaiverApprovalEnabled:           true,
  depositRefundApprovalEnabled:           true,
  minimumSpendEnabled:                    true,
  minimumSpendOverrideApprovalEnabled:    true,
  contractTrackingEnabled:                true,
  contractSnapshotEnabled:                true,
  cancellationPoliciesEnabled:            true,
  packageApprovalWorkflowEnabled:         true,
  inventoryForecastHooksEnabled:          false,
  posOrderLinkHooksEnabled:               false,
  eatMonetizationInsightsEnabled:         false,
  offlineEventPackageQueueEnabled:        true,
  multilingualEventPackagesEnabled:       true,
  honestPaymentProviderStatesEnabled:     true,
  externalContractProviderContractsEnabled: false,
  externalPaymentProviderContractsEnabled:  false,
}

export function getEventPackageFlags(venueOverrides = {}) {
  return { ...DEFAULT_POS360_EVENT_PACKAGE_FLAGS, ...venueOverrides }
}
