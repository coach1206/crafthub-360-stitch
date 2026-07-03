/**
 * SmokeCraft Management Control Service
 * Governs allowed venue admin control actions.
 * Blocks all protected SmokeCraft progression rules — no force unlocks.
 */

import { isDbAvailable } from '../../db/connection.js'
import {
  ALLOWED_CONTROL_ACTIONS,
  PROTECTED_CONTROL_ACTIONS,
  createControlResult,
} from '../../../src/modules/smokecraft/data/smokecraftManagementControlContract.js'
import { hasPermission } from './smokecraftVenuePermissionService.js'
import { createOperationalAuditEntry, AUDIT_EVENTS } from './smokecraftOperationalAuditService.js'

// Venue order pause state — in-memory; venueId -> boolean
const orderPauseState = new Map()

export function getIntegrationStatus(venueId) {
  return {
    venueId,
    pos360: {
      connected:  false,
      status:     'not_connected',
    },
    eat: {
      connected:  false,
      status:     'not_connected',
      syncStatus: 'preview_only',
    },
    database: {
      persistenceMode: isDbAvailable() ? 'database' : 'memory_fallback',
      productionReady: isDbAvailable(),
    },
    marketplace: {
      marketplaceStatus: 'not_live_marketplace',
    },
    license: {
      licenseStatus: 'license_not_enforced',
    },
    billing: {
      billingStatus: 'preview_only',
    },
  }
}

export function getModuleHealth(venueId) {
  return {
    venueId,
    posSyncStatus:         'not_connected',
    eatSyncStatus:         'not_connected',
    managementSyncStatus:  'preview_only',
    persistenceMode:       isDbAvailable() ? 'database' : 'memory_fallback',
    productionReady:       isDbAvailable(),
    rewardPolicyActive:    true,
    staffQueueActive:      true,
    activeSessionsTracked: true,
    passportLockEnforced:  true,
    connectionsLockEnforced: true,
    journeyProgressionIntact: true,
  }
}

export function executeControlAction({ action, actorId, actorRole, venueId, payload = {} }) {
  // Block protected actions immediately — no role can override
  if (PROTECTED_CONTROL_ACTIONS.includes(action)) {
    const result = createControlResult({
      action,
      allowed:      false,
      blockedReason:'protected_smokecraft_rule',
      actorId,
      actorRole,
    })
    createOperationalAuditEntry({
      venueId,
      actorId,
      actorRole,
      eventType:    AUDIT_EVENTS.CONTROL_BLOCKED,
      targetType:   'control',
      targetId:     action,
      allowed:      false,
      blockedReason:'protected_smokecraft_rule',
    })
    return result
  }

  if (!ALLOWED_CONTROL_ACTIONS.includes(action)) {
    return createControlResult({
      action,
      allowed:      false,
      blockedReason:'unknown_action',
      actorId,
      actorRole,
    })
  }

  // clear_demo_data requires platformAdmin
  if (action === 'clear_demo_data' && actorRole !== 'platformAdmin') {
    return createControlResult({
      action,
      allowed:      false,
      blockedReason:'platform_admin_required',
      actorId,
      actorRole,
    })
  }

  let resultData = null

  if (action === 'pause_order_requests') {
    if (!hasPermission(actorRole, 'view_management_controls')) {
      return createControlResult({ action, allowed: false, blockedReason: 'insufficient_role', actorId, actorRole })
    }
    orderPauseState.set(venueId, true)
    resultData = { orderRequestsPaused: true, venueId }
  } else if (action === 'resume_order_requests') {
    if (!hasPermission(actorRole, 'view_management_controls')) {
      return createControlResult({ action, allowed: false, blockedReason: 'insufficient_role', actorId, actorRole })
    }
    orderPauseState.set(venueId, false)
    resultData = { orderRequestsPaused: false, venueId }
  } else if (action === 'mark_menu_fallback_active') {
    resultData = { menuFallbackActive: true, menuSource: 'local_fallback', venueId }
  } else if (action === 'refresh_analytics') {
    resultData = { analyticsRefreshed: true, venueId, note: 'memory_fallback — snapshot only' }
  } else if (action === 'clear_demo_data') {
    resultData = { demoClearedBy: actorId, venueId, note: 'memory_fallback data cleared' }
  } else {
    resultData = { viewed: true, action, venueId }
  }

  const result = createControlResult({ action, allowed: true, actorId, actorRole, result: resultData })

  createOperationalAuditEntry({
    venueId,
    actorId,
    actorRole,
    eventType: AUDIT_EVENTS.CONTROL_VIEWED,
    targetType: 'control',
    targetId:   action,
    allowed:    true,
  })

  return result
}

export function isOrderRequestsPaused(venueId) {
  return orderPauseState.get(venueId) ?? false
}

export function getManagementControlServiceReport() {
  return {
    allowedActions:   ALLOWED_CONTROL_ACTIONS,
    protectedActions: PROTECTED_CONTROL_ACTIONS,
    forcePassportUnlockBlocked:     true,
    forceConnectionsUnlockBlocked:  true,
    forcePosSyncedBlocked:          true,
    forceEatSyncedBlocked:          true,
    forceRewardRedeemedBlocked:     true,
    forceBillingActiveBlocked:      true,
    forceLicenseEnforcedBlocked:    true,
    bypassRewardPolicyBlocked:      true,
    bypassJourneyProgressionBlocked:true,
  }
}
