/**
 * pos360GuestFeatureFlags.js — Phase B.8 feature flags for Customer, Loyalty & Guest Intelligence
 */

const DEFAULTS = {
  guestProfileEnabled:          true,
  loyaltyEnabled:               true,
  rewardsEnabled:               true,
  tierUpgradesEnabled:          true,
  pointsExpirationEnabled:      true,
  birthdayRewardsEnabled:       true,
  referralRewardsEnabled:       true,
  serviceRecoveryEnabled:       true,
  duplicateDetectionEnabled:    true,
  mergeRequestsEnabled:         true,
  consentTrackingEnabled:       true,
  privacyExportEnabled:         true,
  privacyDeleteEnabled:         true,
  eatInsightsEnabled:           false, // placeholder — not live
  smokecraftLinkEnabled:        false, // placeholder — not live
  memberPricingEnabled:         false,
  offlineGuestQueueEnabled:     true,
  fraudReviewEnabled:           true,
  managerApprovalForAdjustments: true,
  managerApprovalForReversals:  true,
}

export function getGuestFlags(venueOverrides = {}) {
  return { ...DEFAULTS, ...venueOverrides }
}
