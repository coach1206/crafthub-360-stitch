/**
 * SmokeCraft Monetization Contract
 * Defines preview monetization models. No billing is active.
 * All models remain preview_only until a real billing provider is connected.
 * Marketplace status: not_live_marketplace.
 * License status: license_not_enforced.
 */

export const MONETIZATION_TYPES = {
  VENUE_SUBSCRIPTION_PREVIEW:       'venue_subscription_preview',
  PER_EXPERIENCE_FEE_PREVIEW:       'per_experience_fee_preview',
  PREMIUM_PAIRING_UPGRADE_PREVIEW:  'premium_pairing_upgrade_preview',
  PASSPORT_MEMBERSHIP_PREVIEW:      'passport_membership_preview',
  STAFF_ASSISTED_SERVICE_FEE_PREVIEW: 'staff_assisted_service_fee_preview',
  LOYALTY_SPONSOR_REWARD_PREVIEW:   'loyalty_sponsor_reward_preview',
  WHITE_LABEL_VENUE_LICENSE_PREVIEW:'white_label_venue_license_preview',
  DATA_INSIGHT_DASHBOARD_PREVIEW:   'data_insight_dashboard_preview',
}

export const BILLING_STATUS = {
  PREVIEW_ONLY: 'preview_only',
  CONNECTED:    'connected',
  SUSPENDED:    'suspended',
}

export function createMonetizationRecord(overrides = {}) {
  const now = new Date().toISOString()
  return {
    monetizationId: null,
    venueId: null,
    userId: null,
    sourceEventType: null,
    monetizationType: null,
    amount: 0,
    currency: 'usd',
    billingStatus: BILLING_STATUS.PREVIEW_ONLY,
    licenseStatus: 'license_not_enforced',
    marketplaceStatus: 'not_live_marketplace',
    posVerified: false,
    previewOnly: true,
    createdAt: now,
    ...overrides,
  }
}

export const MONETIZATION_CONTRACT_VERSION = '0.1.0'
