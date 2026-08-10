/**
 * SmokeCraft Analytics Contract
 * Shape for venue analytics summaries.
 */

export const ANALYTICS_STATUS = {
  MEMORY_FALLBACK: 'memory_fallback',
  ACTIVE:          'active',
}

export const ANALYTICS_CONTRACT_VERSION = '0.1.0'

export function createAnalyticsSummary(overrides = {}) {
  return {
    summaryId:                       `analytics_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    venueId:                         null,
    dateRange:                       null,
    analyticsStatus:                 ANALYTICS_STATUS.MEMORY_FALLBACK,
    productionReady:                 false,
    // Sessions
    totalActiveSessions:             0,
    totalCompletedSessions:          0,
    // Orders
    totalOrderRequests:              0,
    customerSelfOrderCount:          0,
    staffAssistedOrderCount:         0,
    pendingOrderCount:               0,
    acceptedOrderCount:              0,
    completedOrderCount:             0,
    cancelledOrderCount:             0,
    // Pairings
    pairingRecommendationCount:      0,
    localIntelligenceCount:          0,
    providerBackedCount:             0,
    // Rewards
    rewardEvaluationCount:           0,
    xpIssued:                        0,
    loyaltyPointsIssued:             0,
    passportEligibleCount:           0,
    passportAwardedCount:            0,
    blockedRewardCount:              0,
    // Pairing insights
    topPairingTags:                  [],
    topMenuPairingCategories:        [],
    // Degraded mode counters
    fallbackUsageCount:              0,
    posNotConnectedCount:            0,
    eatPreviewOnlyCount:             0,
    // Status
    posSyncStatus:                   'not_connected',
    eatSyncStatus:                   'not_connected',
    persistenceMode:                 'memory_fallback',
    generatedAt:                     new Date().toISOString(),
    ...overrides,
  }
}
