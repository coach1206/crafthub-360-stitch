/**
 * SmokeCraft Admin Dashboard Service
 * Composes venue overview, staff ops, analytics, integrations, and module health.
 * honest degraded mode reporting throughout.
 */

import { isDbAvailable } from '../../db/connection.js'
import { getVenueActivitySummary } from './smokecraftVenueActivityService.js'
import { getStaffOperationsStatus, getStaffQueueSummary, getStaffOperationalWarnings, getStaffAssignedOrders } from './smokecraftStaffOperationsService.js'
import { getVenueAnalyticsSummary } from './smokecraftAnalyticsService.js'
import { getIntegrationStatus, getModuleHealth } from './smokecraftManagementControlService.js'
import { getOperationalAuditLog, getOperationalAuditReport } from './smokecraftOperationalAuditService.js'
import { assertAdminAccess } from './smokecraftVenuePermissionService.js'
import { createOperationalAuditEntry, AUDIT_EVENTS } from './smokecraftOperationalAuditService.js'

export function getAdminDashboardStatus() {
  return {
    module:           'SmokeCraft Venue Admin',
    moduleBuild:      6,
    status:           'active',
    persistenceMode:  isDbAvailable() ? 'database' : 'memory_fallback',
    productionReady:  isDbAvailable(),
    posSyncStatus:    'not_connected',
    eatSyncStatus:    'not_connected',
    managementSyncStatus: 'preview_only',
    marketplaceStatus: 'not_live_marketplace',
    licenseStatus:    'license_not_enforced',
    billingStatus:    'preview_only',
    venueAdminActive: true,
    staffOpsActive:   true,
    analyticsActive:  true,
    managementControlsActive: true,
    operationalAuditActive: true,
    permissionServiceActive: true,
  }
}

export function getVenueAdminOverview(venueId, actor = {}) {
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return { allowed: false, blockedReason: access.blockedReason }

  const activity  = getVenueActivitySummary(venueId, actor.actorId, actor.role)
  const staffOps  = getStaffOperationsStatus(venueId)
  const analytics = getVenueAnalyticsSummary(venueId, null, actor.actorId, actor.role)
  const integrations = getIntegrationStatus(venueId)
  const moduleHealth = getModuleHealth(venueId)
  const warnings  = getStaffOperationalWarnings(venueId)

  return {
    venueId,
    overview: activity,
    staffOperations: staffOps,
    analytics,
    integrations,
    moduleHealth,
    warnings: warnings.warnings,
    persistenceMode: isDbAvailable() ? 'database' : 'memory_fallback',
    productionReady: isDbAvailable(),
  }
}

export function getVenueStaffQueueView(venueId, actor = {}) {
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return { allowed: false, blockedReason: access.blockedReason }
  return getStaffQueueSummary(venueId, actor.actorId, actor.role)
}

export function getVenueAnalyticsView(venueId, actor = {}, dateRange = null) {
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return { allowed: false, blockedReason: access.blockedReason }
  return getVenueAnalyticsSummary(venueId, dateRange, actor.actorId, actor.role)
}

export function getVenueIntegrationsView(venueId, actor = {}) {
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return { allowed: false, blockedReason: access.blockedReason }

  createOperationalAuditEntry({
    venueId,
    actorId: actor.actorId,
    actorRole: actor.role,
    eventType: AUDIT_EVENTS.INTEGRATION_VIEWED,
    targetType: 'integrations',
    allowed: true,
  })

  return getIntegrationStatus(venueId)
}

export function getVenueAuditView(venueId, actor = {}) {
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return { allowed: false, blockedReason: access.blockedReason }

  createOperationalAuditEntry({
    venueId,
    actorId: actor.actorId,
    actorRole: actor.role,
    eventType: AUDIT_EVENTS.DASHBOARD_VIEWED,
    targetType: 'audit_log',
    allowed: true,
  })

  return {
    venueId,
    auditLog:    getOperationalAuditLog(venueId),
    auditReport: getOperationalAuditReport(),
  }
}

export function getVenueRewardsSummaryView(venueId, actor = {}) {
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return { allowed: false, blockedReason: access.blockedReason }
  const activity = getVenueActivitySummary(venueId)
  return {
    venueId,
    rewardEvents:        activity.rewardEvents,
    xpIssued:            activity.xpIssued,
    loyaltyPointsIssued: activity.loyaltyPointsIssued,
    passportAwardedCount:activity.passportAwardedCount,
    blockedRewardCount:  activity.blockedRewardCount,
    persistenceMode:     isDbAvailable() ? 'database' : 'memory_fallback',
  }
}

export function getVenuePairingsSummaryView(venueId, actor = {}) {
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return { allowed: false, blockedReason: access.blockedReason }
  const activity = getVenueActivitySummary(venueId)
  return {
    venueId,
    pairingEvents:       activity.pairingEvents,
    localIntelligenceCount: activity.localIntelligenceCount,
    providerBackedCount: activity.providerBackedCount,
    providerConnected:   false,
    aiBacked:            false,
    recommendationStatus:'local_intelligence',
  }
}

export function getVenueOrdersSummaryView(venueId, actor = {}) {
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return { allowed: false, blockedReason: access.blockedReason }
  const staffOps = getStaffOperationsStatus(venueId)
  const activity = getVenueActivitySummary(venueId)
  return {
    venueId,
    totalOrderRequests:  activity.totalOrderRequests,
    customerSelfOrders:  activity.customerSelfOrders,
    staffAssistedOrders: activity.staffAssistedOrders,
    staffQueue:          staffOps,
    posSyncStatus:       'not_connected',
  }
}

export function getStaffAssignedOrdersView(staffId, actor = {}) {
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return { allowed: false, blockedReason: access.blockedReason }
  return { staffId, orders: getStaffAssignedOrders(staffId) }
}
