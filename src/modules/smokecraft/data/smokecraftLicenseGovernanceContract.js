/**
 * SmokeCraft License Governance Contract
 * Module Build 8 — license preview states, types, and entitlement shapes.
 */

export const LICENSE_STATES = {
  NOT_ENFORCED:                   'license_not_enforced',
  ENTITLEMENT_PREVIEW_ONLY:       'entitlement_preview_only',
  GOVERNANCE_PREVIEW:             'license_governance_preview',
  REQUIRED_NOT_CONNECTED:         'license_required_not_connected',
  BLOCKED_MISSING_PROVIDER:       'blocked_missing_license_provider',
}

export const LICENSE_TYPES = {
  VENUE_SINGLE_LOCATION_PREVIEW:  'venue_single_location_preview',
  VENUE_MULTI_LOCATION_PREVIEW:   'venue_multi_location_preview',
  WHITE_LABEL_PREVIEW:            'white_label_preview',
  FRANCHISE_PREVIEW:              'franchise_preview',
  ENTERPRISE_PREVIEW:             'enterprise_preview',
  MARKETPLACE_MODULE_PREVIEW:     'marketplace_module_preview',
}

export const ENTITLEMENT_CHECKS = [
  'canUseSmokeCraft',
  'canUseOrdering',
  'canUsePairing',
  'canUseRewards',
  'canUseVenueAdmin',
  'canUseWhiteLabel',
  'canUseMarketplaceListing',
  'canUseProviderConnectors',
  'canUseAnalytics',
]

export function createLicenseGovernanceRecord(overrides = {}) {
  const previewEntitlements = Object.fromEntries(
    ENTITLEMENT_CHECKS.map(k => [k, { allowed: true, previewOnly: true, licenseEnforced: false }])
  )
  previewEntitlements.canUseMarketplaceListing = { allowed: false, previewOnly: true, licenseEnforced: false, blockedReason: 'marketplace_not_live' }
  previewEntitlements.canUseWhiteLabel = { allowed: false, previewOnly: true, licenseEnforced: false, blockedReason: 'license_governance_preview' }

  return {
    licenseId:           null,
    moduleId:            'smokecraft',
    licenseState:        LICENSE_STATES.NOT_ENFORCED,
    licenseType:         LICENSE_TYPES.VENUE_SINGLE_LOCATION_PREVIEW,
    licenseEnforced:     false,
    entitlements:        previewEntitlements,
    entitlementStatus:   'preview_only',
    billingStatus:       'preview_only',
    marketplaceStatus:   'not_live_marketplace',
    providerConnected:   false,
    ...overrides,
  }
}
