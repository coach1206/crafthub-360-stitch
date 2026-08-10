/**
 * SmokeCraft Feature Flag Contract
 * Module Build 8 — feature flag definitions, defaults, and protection rules.
 */

export const FEATURE_FLAGS = {
  'smokecraft.ordering.enabled':                { default: true,  description: 'Customer and staff ordering flows' },
  'smokecraft.staffQueue.enabled':              { default: true,  description: 'Staff order queue management' },
  'smokecraft.pairing.localIntelligence.enabled': { default: true, description: 'Local pairing intelligence fallback' },
  'smokecraft.pairing.provider.enabled':        { default: false, description: 'Live AI pairing provider (requires SMOKECRAFT_PAIRING_API_KEY)' },
  'smokecraft.rewards.enabled':                 { default: true,  description: 'Rewards and loyalty program' },
  'smokecraft.passport.enabled':                { default: true,  description: 'Passport stamp and visit progression' },
  'smokecraft.venueAdmin.enabled':              { default: true,  description: 'Venue admin dashboard and controls' },
  'smokecraft.whiteLabel.enabled':              { default: false, description: 'White-label brand overrides (requires license)' },
  'smokecraft.marketplaceListing.enabled':      { default: false, description: 'Marketplace listing (blocked until live)' },
  'smokecraft.licenseEnforcement.enabled':      { default: false, description: 'License enforcement (inactive in this build)' },
  'smokecraft.billing.enabled':                 { default: false, description: 'Billing provider (preview_only)' },
  'smokecraft.productionSync.enabled':          { default: false, description: 'Production sync to live connectors' },
}

export const PROTECTED_FLAGS = [
  'smokecraft.passport.enabled',
]

export const FLAGS_CANNOT_BYPASS_PROGRESSION = [
  'smokecraft.marketplaceListing.enabled',
  'smokecraft.licenseEnforcement.enabled',
  'smokecraft.billing.enabled',
  'smokecraft.whiteLabel.enabled',
]

export function getDefaultFlags() {
  return Object.fromEntries(
    Object.entries(FEATURE_FLAGS).map(([key, meta]) => [key, meta.default])
  )
}

export function createFeatureFlagRecord(overrides = {}) {
  return {
    moduleId:                        'smokecraft',
    flags:                           getDefaultFlags(),
    protectedFlags:                  PROTECTED_FLAGS,
    flagsCannotBypassProgression:    FLAGS_CANNOT_BYPASS_PROGRESSION,
    canBypassProtectedProgression:   false,
    canFakeIntegrationConnection:    false,
    ...overrides,
  }
}
