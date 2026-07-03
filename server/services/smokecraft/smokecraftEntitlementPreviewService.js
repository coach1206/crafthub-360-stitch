/**
 * SmokeCraft Entitlement Preview Service
 * Module Build 8 — entitlement preview checks and tenant entitlement records.
 * entitlementStatus is preview_only. License not enforced.
 */

import { checkEntitlement } from './smokecraftLicenseGovernanceService.js'

export function getEntitlementPreview(tenantId = null, venueId = null) {
  return {
    entitlementId:     `entitlement-preview-${tenantId ?? 'default'}`,
    tenantId,
    venueId,
    moduleId:          'smokecraft',
    entitlementType:   'venue_single_location_preview',
    entitlementStatus: 'preview_only',
    previewOnly:       true,
    licenseStatus:     'license_not_enforced',
    marketplaceStatus: 'not_live_marketplace',
    billingStatus:     'preview_only',
    allowedFeatures: [
      'ordering', 'pairing_local_intelligence', 'rewards', 'passport',
      'venue_admin', 'staff_queue', 'analytics_preview',
    ],
    blockedFeatures: [
      'marketplace_listing', 'white_label', 'live_ai_pairing', 'production_sync',
    ],
    blockedReasons: [
      'marketplace_not_live',
      'license_governance_preview',
      'physical_package_not_created',
      'billing_not_connected',
    ],
    createdAt: new Date().toISOString(),
  }
}

export function checkTenantEntitlement(tenantId, featureKey) {
  const result = checkEntitlement(featureKey)
  return { ...result, tenantId, previewOnly: true }
}

export function getEntitlementPreviewReport(tenantId = null) {
  return {
    tenantId,
    entitlementStatus: 'preview_only',
    licenseEnforced:   false,
    billingActive:     false,
    productionReady:   false,
    warnings: [
      'All entitlements are preview_only — no license is enforced.',
      'Billing is preview_only — no charges are created.',
    ],
  }
}
