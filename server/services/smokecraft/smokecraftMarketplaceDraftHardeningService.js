/**
 * SmokeCraft Marketplace Draft Hardening Service
 * Module Build 8 — marketplace draft metadata and publish blocking.
 * marketplaceStatus remains not_live_marketplace or marketplace_draft.
 * Publishing is always blocked.
 */

import { createMarketplaceDraftRecord, MARKETPLACE_DRAFT_STATUSES, PUBLISH_BLOCKED_REASONS } from '../../../src/modules/smokecraft/data/smokecraftMarketplaceDraftContract.js'

export function getMarketplaceDraftStatus() {
  const record = createMarketplaceDraftRecord()
  return {
    ...record,
    publishBlocked: true,
    isLive: false,
    noPublicListingActive: true,
    noPriceCharged: true,
    noLicenseEnforced: true,
    noCustomerInstallActive: true,
  }
}

export function getPublishBlockedReasons() {
  return PUBLISH_BLOCKED_REASONS
}

export function validateMarketplacePublish() {
  return {
    canPublish: false,
    blockedReasons: PUBLISH_BLOCKED_REASONS,
    marketplaceStatus: MARKETPLACE_DRAFT_STATUSES.DRAFT,
    isLive: false,
  }
}

export function getMarketplaceDraftReport() {
  return {
    marketplaceStatus:       MARKETPLACE_DRAFT_STATUSES.DRAFT,
    publishBlocked:          true,
    publishBlockedReasons:   PUBLISH_BLOCKED_REASONS,
    securityReviewStatus:    'pending_review',
    governanceReviewStatus:  'pending_review',
    listingComplete:         false,
    productionReady:         false,
    warnings: [
      'Marketplace listing is not live.',
      'Publishing is blocked pending governance review.',
      'No price is charged.',
      'No license is enforced.',
      'No customer install is active.',
    ],
  }
}
