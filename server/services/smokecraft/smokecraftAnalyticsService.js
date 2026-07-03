/**
 * SmokeCraft Analytics Service
 * Aggregates SmokeCraft session, order, pairing, and reward data.
 * Returns memory_fallback status when no database is available.
 */

import { isDbAvailable } from '../../db/connection.js'
import { createAnalyticsSummary } from '../../../src/modules/smokecraft/data/smokecraftAnalyticsContract.js'
import { getRewardStoreReport } from './smokecraftRewardStore.js'
import { createOperationalAuditEntry, AUDIT_EVENTS } from './smokecraftOperationalAuditService.js'

// In-memory counters — accumulated from event calls
const venueCounters = new Map()

function getCounters(venueId) {
  if (!venueCounters.has(venueId)) {
    venueCounters.set(venueId, {
      activeSessions: 0, completedSessions: 0,
      orderRequests: 0, customerSelfOrders: 0, staffAssistedOrders: 0,
      pendingOrders: 0, acceptedOrders: 0, completedOrders: 0, cancelledOrders: 0,
      pairingRecommendations: 0, localIntelligence: 0, providerBacked: 0,
      rewardEvaluations: 0, xpIssued: 0, loyaltyPointsIssued: 0,
      passportEligible: 0, passportAwarded: 0, blockedRewards: 0,
      topPairingTags: [], topMenuPairingCategories: [],
      fallbackUsage: 0, posNotConnected: 0, eatPreviewOnly: 0,
    })
  }
  return venueCounters.get(venueId)
}

export function recordAnalyticsEvent(venueId, eventKey, increment = 1) {
  const c = getCounters(venueId)
  if (eventKey in c && typeof c[eventKey] === 'number') {
    c[eventKey] += increment
  }
}

export function getVenueAnalyticsSummary(venueId, dateRange = null, actorId = null, actorRole = null) {
  const c = getCounters(venueId)
  const rewardReport = getRewardStoreReport()

  const summary = createAnalyticsSummary({
    venueId,
    dateRange,
    analyticsStatus:           isDbAvailable() ? 'active' : 'memory_fallback',
    productionReady:           isDbAvailable(),
    totalActiveSessions:       c.activeSessions,
    totalCompletedSessions:    c.completedSessions,
    totalOrderRequests:        c.orderRequests,
    customerSelfOrderCount:    c.customerSelfOrders,
    staffAssistedOrderCount:   c.staffAssistedOrders,
    pendingOrderCount:         c.pendingOrders,
    acceptedOrderCount:        c.acceptedOrders,
    completedOrderCount:       c.completedOrders,
    cancelledOrderCount:       c.cancelledOrders,
    pairingRecommendationCount:c.pairingRecommendations,
    localIntelligenceCount:    c.localIntelligence,
    providerBackedCount:       c.providerBacked,
    rewardEvaluationCount:     c.rewardEvaluations,
    xpIssued:                  c.xpIssued,
    loyaltyPointsIssued:       c.loyaltyPointsIssued,
    passportEligibleCount:     c.passportEligible,
    passportAwardedCount:      c.passportAwarded,
    blockedRewardCount:        c.blockedRewards,
    topPairingTags:            c.topPairingTags,
    topMenuPairingCategories:  c.topMenuPairingCategories,
    fallbackUsageCount:        c.fallbackUsage,
    posNotConnectedCount:      c.posNotConnected,
    eatPreviewOnlyCount:       c.eatPreviewOnly,
    posSyncStatus:             'not_connected',
    eatSyncStatus:             'not_connected',
    persistenceMode:           isDbAvailable() ? 'database' : 'memory_fallback',
    rewardRecordCount:         rewardReport?.recordCount ?? 0,
  })

  if (actorId) {
    createOperationalAuditEntry({
      venueId, actorId, actorRole,
      eventType: AUDIT_EVENTS.ANALYTICS_GENERATED,
      targetType: 'analytics',
      allowed: true,
    })
  }

  return summary
}

export function getAnalyticsServiceReport() {
  return {
    persistenceMode: isDbAvailable() ? 'database' : 'memory_fallback',
    productionReady: isDbAvailable(),
    venuesTracked:   venueCounters.size,
    analyticsNote:   'memory_fallback — counters are in-process only. DATABASE_URL required for production analytics.',
  }
}
