/**
 * SmokeCraft License Governance Service
 * Module Build 8 — license preview states and entitlement checks.
 * License enforcement is not active. Entitlements are preview_only.
 */

import { createLicenseGovernanceRecord, LICENSE_STATES, ENTITLEMENT_CHECKS } from '../../../src/modules/smokecraft/data/smokecraftLicenseGovernanceContract.js'

export function getLicenseGovernanceStatus() {
  return createLicenseGovernanceRecord()
}

export function checkEntitlement(entitlementKey) {
  if (!ENTITLEMENT_CHECKS.includes(entitlementKey)) {
    return { allowed: false, reason: 'unknown_entitlement', previewOnly: true }
  }
  if (entitlementKey === 'canUseMarketplaceListing') {
    return { allowed: false, previewOnly: true, blockedReason: 'marketplace_not_live', licenseEnforced: false }
  }
  if (entitlementKey === 'canUseWhiteLabel') {
    return { allowed: false, previewOnly: true, blockedReason: 'license_governance_preview', licenseEnforced: false }
  }
  return { allowed: true, previewOnly: true, licenseEnforced: false }
}

export function getLicenseGovernanceReport() {
  return {
    licenseState:        LICENSE_STATES.NOT_ENFORCED,
    licenseEnforced:     false,
    entitlementStatus:   'preview_only',
    billingStatus:       'preview_only',
    marketplaceStatus:   'not_live_marketplace',
    providerConnected:   false,
    productionReady:     false,
    warnings: [
      'License enforcement is not active.',
      'All entitlements are preview_only.',
      'Billing is preview_only — no charges are created.',
      'Marketplace listing is not live.',
    ],
  }
}
