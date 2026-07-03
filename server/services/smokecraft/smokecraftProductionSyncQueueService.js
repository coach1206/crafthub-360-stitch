/**
 * SmokeCraft Production Sync Queue Service
 * Queues sync events for POS360, E.A.T., pairing provider, and venue menu.
 * Never marks synced without real connector confirmation.
 * Blocked events stay blocked until connector connects.
 */

import {
  SYNC_STATUSES,
  TARGET_SYSTEMS,
} from '../../../src/modules/smokecraft/data/smokecraftProductionSyncContract.js'
import {
  createSyncEventRecord,
  getSyncEventsByStatus,
  updateSyncEvent,
  blockSyncEvent,
  getAllSyncEvents,
  getSyncEventStoreSummary,
} from './smokecraftSyncEventStore.js'
import { isConnectorConnected } from './smokecraftProviderConnectorRegistry.js'
import { scheduleRetry } from './smokecraftSyncRetryService.js'
import { createConnectorAuditEntry, CONNECTOR_AUDIT_EVENTS } from './smokecraftConnectorAuditService.js'

function queueSyncEvent({ sourceEventType, targetSystem, payloadSummary, payloadRef = null }) {
  const event = createSyncEventRecord({ sourceEventType, targetSystem, payloadSummary, payloadRef })

  // If connector is not connected, immediately block
  if (!isConnectorConnected(targetSystem)) {
    blockSyncEvent(event.syncEventId, 'not_connected')
    createConnectorAuditEntry({
      eventType:     CONNECTOR_AUDIT_EVENTS.SYNC_BLOCKED,
      connectorType: targetSystem,
      syncEventId:   event.syncEventId,
      previousStatus:SYNC_STATUSES.QUEUED,
      nextStatus:    SYNC_STATUSES.BLOCKED_NOT_CONNECTED,
      allowed:       false,
      blockedReason: 'not_connected',
    })
  } else {
    createConnectorAuditEntry({
      eventType:     CONNECTOR_AUDIT_EVENTS.SYNC_EVENT_QUEUED,
      connectorType: targetSystem,
      syncEventId:   event.syncEventId,
      nextStatus:    SYNC_STATUSES.QUEUED,
      allowed:       true,
    })
  }

  return event
}

// POS360
export function queuePOS360SyncEvent(orderPayload) {
  return queueSyncEvent({
    sourceEventType:'smokecraft.order.created',
    targetSystem:    TARGET_SYSTEMS.POS360,
    payloadSummary:  `Order sync: ${orderPayload?.orderId ?? 'unknown'}`,
    payloadRef:      orderPayload?.orderId ?? null,
  })
}

export function canSendSmokeCraftOrderToPOS() {
  return isConnectorConnected(TARGET_SYSTEMS.POS360)
}

export async function attemptPOS360Sync(syncEventId) {
  if (!isConnectorConnected(TARGET_SYSTEMS.POS360)) {
    return {
      success: false,
      syncStatus: SYNC_STATUSES.BLOCKED_NOT_CONNECTED,
      message: 'POS360 connector is not connected. Order cannot be marked sent_to_pos.',
    }
  }
  // Real implementation would call POS360 adapter here
  return { success: false, message: 'POS360 sync not yet live.' }
}

// E.A.T.
export function queueEatSyncEvent(eventPayload) {
  return queueSyncEvent({
    sourceEventType: 'smokecraft.management.event',
    targetSystem:    TARGET_SYSTEMS.EAT,
    payloadSummary:  `E.A.T. sync: ${eventPayload?.eventType ?? 'unknown'}`,
    payloadRef:      eventPayload?.eventId ?? null,
  })
}

export function canSendManagementEventToEAT() {
  return isConnectorConnected(TARGET_SYSTEMS.EAT)
}

export async function attemptEatSync(syncEventId) {
  if (!isConnectorConnected(TARGET_SYSTEMS.EAT)) {
    return {
      success: false,
      syncStatus: SYNC_STATUSES.BLOCKED_NOT_CONNECTED,
      message: 'E.A.T. connector is not connected. Management event cannot be marked synced.',
    }
  }
  return { success: false, message: 'E.A.T. sync not yet live.' }
}

// Pairing Provider
export function queuePairingProviderEvent(payload) {
  return queueSyncEvent({
    sourceEventType: 'smokecraft.pairing.request',
    targetSystem:    TARGET_SYSTEMS.PAIRING_PROVIDER,
    payloadSummary:  `Pairing request: ${payload?.userId ?? 'unknown'}`,
    payloadRef:      payload?.sessionId ?? null,
  })
}

export function canUseLivePairingProvider() {
  return isConnectorConnected(TARGET_SYSTEMS.PAIRING_PROVIDER)
}

export async function attemptPairingProviderRequest(syncEventId) {
  if (!isConnectorConnected(TARGET_SYSTEMS.PAIRING_PROVIDER)) {
    return {
      success:     false,
      aiBacked:    false,
      syncStatus:  SYNC_STATUSES.BLOCKED_NOT_CONNECTED,
      message:     'Pairing provider not connected. Using local_intelligence.',
    }
  }
  return { success: false, aiBacked: false, message: 'Pairing provider not yet live.' }
}

// Venue Menu
export function queueVenueMenuSync(venueId) {
  return queueSyncEvent({
    sourceEventType: 'smokecraft.venue.menu.sync',
    targetSystem:    TARGET_SYSTEMS.VENUE_MENU,
    payloadSummary:  `Venue menu sync: ${venueId}`,
    payloadRef:      venueId,
  })
}

export function canUseLiveVenueMenu() {
  return isConnectorConnected(TARGET_SYSTEMS.VENUE_MENU)
}

export async function attemptVenueMenuSync(syncEventId) {
  if (!isConnectorConnected(TARGET_SYSTEMS.VENUE_MENU)) {
    return {
      success:          false,
      venueMenuBacked:  false,
      menuSource:       'local_fallback',
      syncStatus:       SYNC_STATUSES.BLOCKED_NOT_CONNECTED,
      message:          'Venue menu provider not connected. Using local_fallback.',
    }
  }
  return { success: false, venueMenuBacked: false, message: 'Venue menu sync not yet live.' }
}

export function getSyncQueueStatus() {
  return {
    ...getSyncEventStoreSummary(),
    canSendToPOS360:   canSendSmokeCraftOrderToPOS(),
    canSendToEAT:      canSendManagementEventToEAT(),
    canUsePairing:     canUseLivePairingProvider(),
    canUseVenueMenu:   canUseLiveVenueMenu(),
    syncQueueEnabled:  Boolean(process.env.SMOKECRAFT_SYNC_QUEUE_ENABLED),
    productionMode:    Boolean(process.env.SMOKECRAFT_PRODUCTION_MODE),
    note:              'No sync events are marked synced without real connector confirmation.',
  }
}
