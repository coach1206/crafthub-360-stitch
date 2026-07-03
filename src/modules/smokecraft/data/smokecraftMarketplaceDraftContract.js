/**
 * SmokeCraft Marketplace Draft Contract
 * Module Build 8 — marketplace draft listing metadata and publish blockers.
 */

export const MARKETPLACE_DRAFT_STATUSES = {
  NOT_LIVE:        'not_live_marketplace',
  DRAFT:           'marketplace_draft',
  REVIEW_PREVIEW:  'marketplace_review_preview',
  BLOCKED:         'blocked',
}

export const PUBLISH_BLOCKED_REASONS = [
  'marketplace_not_live',
  'license_enforcement_not_active',
  'physical_package_not_created',
  'production_persistence_not_verified',
  'billing_not_connected',
  'final_governance_review_required',
]

export const PRICING_MODELS = {
  PREVIEW_ONLY:   'preview_only',
  SUBSCRIPTION:   'subscription_preview',
  ONE_TIME:       'one_time_preview',
  USAGE_BASED:    'usage_based_preview',
  ENTERPRISE:     'enterprise_preview',
}

export function createMarketplaceDraftRecord(overrides = {}) {
  return {
    listingId:               null,
    moduleId:                'smokecraft',
    title:                   'SmokeCraft Experience Module',
    subtitle:                'Premium cigar journey and pairing intelligence for NOVEE OS venues',
    description:             'SmokeCraft delivers a full 8-visit / 24-session cigar experience journey with ordering, pairing intelligence, rewards, passport tracking, and venue admin.',
    category:                'hospitality_experience',
    features: [
      'Cigar journey with 8 visits and 24 sessions',
      'Local pairing intelligence',
      'Rewards and loyalty',
      'Passport stamp progression',
      'Venue admin and staff queue',
      'Integration readiness for POS360 and E.A.T.',
    ],
    screenshotsRequired:     true,
    documentationRequired:   true,
    supportRequired:         true,
    licenseRequired:         true,
    pricingModel:            PRICING_MODELS.PREVIEW_ONLY,
    installRequirements:     ['NOVEE OS', 'DATABASE_URL', 'POS360 connector (optional)'],
    dependencies:            ['novee-os-module-foundation'],
    optionalDependencies:    ['pos360-connector', 'eat-connector', 'pairing-provider'],
    securityReviewStatus:    'pending_review',
    governanceReviewStatus:  'pending_review',
    marketplaceStatus:       MARKETPLACE_DRAFT_STATUSES.DRAFT,
    publishBlockedReasons:   PUBLISH_BLOCKED_REASONS,
    publishBlocked:          true,
    ...overrides,
  }
}
