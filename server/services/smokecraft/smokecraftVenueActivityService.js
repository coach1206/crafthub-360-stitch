/**
 * SmokeCraft Venue Activity Service
 * Aggregates real-time activity from sessions, orders, pairings, and rewards.
 * Reports honest status — memory_fallback without DATABASE_URL.
 */

import { isDbAvailable } from '../../db/connection.js'
import { getRewardStoreReport } from './smokecraftRewardStore.js'
import { getStaffOperationsStatus } from './smokecraftStaffOperationsService.js'
import { createOperationalAuditEntry, AUDIT_EVENTS } from './smokecraftOperationalAuditService.js'

// In-memory activity snapshot per venue
const activitySnapshots = new Map()

export function recordSessionActivity(venueId, eventData = {}) {
  const snap = getOrCreateSnapshot(venueId)
  if (eventData.type === 'session_started') snap.activeSessions++
  if (eventData.type === 'session_completed') {
    snap.activeSessions = Math.max(0, snap.activeSessions - 1)
    snap.completedSessions++
  }
  snap.updatedAt = new Date().toISOString()
}

export function recordOrderActivity(venueId, eventData = {}) {
  const snap = getOrCreateSnapshot(venueId)
  if (eventData.type === 'order_created') snap.totalOrderRequests++
  if (eventData.orderMode === 'customer_self_order') snap.customerSelfOrders++
  if (eventData.orderMode === 'staff_assisted_order') snap.staffAssistedOrders++
  snap.updatedAt = new Date().toISOString()
}

export function recordPairingActivity(venueId, eventData = {}) {
  const snap = getOrCreateSnapshot(venueId)
  snap.pairingEvents++
  if (eventData.source === 'local_intelligence') snap.localIntelligenceCount++
  if (eventData.providerConnected) snap.providerBackedCount++
  snap.updatedAt = new Date().toISOString()
}

export function recordRewardActivity(venueId, eventData = {}) {
  const snap = getOrCreateSnapshot(venueId)
  snap.rewardEvents++
  if (eventData.xpAwarded) snap.xpIssued += eventData.xpAwarded
  if (eventData.loyaltyPointsAwarded) snap.loyaltyPointsIssued += eventData.loyaltyPointsAwarded
  if (eventData.passportStampAwarded) snap.passportAwardedCount++
  if (eventData.rewardStatus === 'blocked') snap.blockedRewardCount++
  snap.updatedAt = new Date().toISOString()
}

export function getVenueActivitySummary(venueId, actorId = null, actorRole = null) {
  const snap = getOrCreateSnapshot(venueId)
  const staffOps = getStaffOperationsStatus(venueId)
  const rewardReport = getRewardStoreReport()

  if (actorId) {
    createOperationalAuditEntry({
      venueId, actorId, actorRole,
      eventType: AUDIT_EVENTS.DASHBOARD_VIEWED,
      targetType: 'venue_overview',
      allowed: true,
    })
  }

  return {
    venueId,
    activeSessions:      snap.activeSessions,
    completedSessions:   snap.completedSessions,
    totalOrderRequests:  snap.totalOrderRequests,
    customerSelfOrders:  snap.customerSelfOrders,
    staffAssistedOrders: snap.staffAssistedOrders,
    pairingEvents:       snap.pairingEvents,
    localIntelligenceCount: snap.localIntelligenceCount,
    providerBackedCount: snap.providerBackedCount,
    rewardEvents:        snap.rewardEvents,
    xpIssued:            snap.xpIssued,
    loyaltyPointsIssued: snap.loyaltyPointsIssued,
    passportAwardedCount:snap.passportAwardedCount,
    blockedRewardCount:  snap.blockedRewardCount,
    staffQueue:          staffOps,
    rewardStore:         rewardReport,
    integrations: {
      pos360:      { connected: false, status: 'not_connected' },
      eat:         { connected: false, status: 'not_connected', syncStatus: 'preview_only' },
      database:    { persistenceMode: isDbAvailable() ? 'database' : 'memory_fallback', productionReady: isDbAvailable() },
      marketplace: { marketplaceStatus: 'not_live_marketplace' },
      license:     { licenseStatus: 'license_not_enforced' },
      billing:     { billingStatus: 'preview_only' },
    },
    persistenceMode: isDbAvailable() ? 'database' : 'memory_fallback',
    productionReady: isDbAvailable(),
    updatedAt: snap.updatedAt,
  }
}

function getOrCreateSnapshot(venueId) {
  if (!activitySnapshots.has(venueId)) {
    activitySnapshots.set(venueId, {
      activeSessions: 0, completedSessions: 0,
      totalOrderRequests: 0, customerSelfOrders: 0, staffAssistedOrders: 0,
      pairingEvents: 0, localIntelligenceCount: 0, providerBackedCount: 0,
      rewardEvents: 0, xpIssued: 0, loyaltyPointsIssued: 0,
      passportAwardedCount: 0, blockedRewardCount: 0,
      updatedAt: new Date().toISOString(),
    })
  }
  return activitySnapshots.get(venueId)
}

export function getVenueActivityServiceReport() {
  return {
    venuesTracked:   activitySnapshots.size,
    persistenceMode: isDbAvailable() ? 'database' : 'memory_fallback',
    productionReady: isDbAvailable(),
  }
}
