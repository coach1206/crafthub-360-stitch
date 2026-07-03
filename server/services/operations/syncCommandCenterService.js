/**
 * LOCC — Sync Command Center Service
 * Provides visibility and control over operational sync events.
 */

import { v4 as uuidv4 } from 'uuid'
import { assertManagerRole } from './roleSafetyGateway.js'

const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

const SYNC_COMMAND_STORE = new Map()

export const SYNC_COMMAND_TYPES = [
  'retry_failed','block_event','unblock_event','mark_processed',
  'clear_failed','export_events','inspect_event','escalate_to_owner',
]

export function getSyncCommandCenterReadiness(venueId) {
  return {
    ok:                  true,
    venueId,
    syncCenterActive:    true,
    persistenceMode:     dbAvailable() ? 'real_database' : 'in_memory_only',
    degradedMode:        !dbAvailable(),
    databaseRequired:    !dbAvailable(),
    externalSyncNotLive: true,
    realTimePushPending: true,
    externalPOSRequired: true,
    vendorApiRequired:   true,
    canRetryFailed:      true,
    canBlockEvents:      true,
    canExportEvents:     true,
    timestamp:           now(),
  }
}

export async function getSyncEventQueue(venueId, filters = {}, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'view_sync_queue')
  if (blocked) return blocked
  try {
    const { getSyncEventsByVenue } = await import('../sync/operationalSyncEventService.js')
    const result = await getSyncEventsByVenue(venueId, filters)
    return {
      ok:           true,
      venueId,
      events:       result.events ?? [],
      count:        result.count  ?? 0,
      persistenceMode: dbAvailable() ? 'real_database' : 'in_memory_only',
      degradedMode: !dbAvailable(),
      note:         dbAvailable() ? 'sync_events_from_database' : 'sync_events_from_memory',
      timestamp:    now(),
    }
  } catch {
    return { ok: false, status: 'sync_service_unavailable', events: [], degradedMode: true }
  }
}

export async function getFailedSyncEvents(venueId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'view_failed_sync_events')
  if (blocked) return blocked
  try {
    const { getFailedSyncEvents: getEvents } = await import('../sync/operationalSyncEventService.js')
    const result = await getEvents(venueId)
    return {
      ok:           true,
      venueId,
      failedEvents: result.events ?? [],
      count:        result.count  ?? 0,
      degradedMode: !dbAvailable(),
      note:         'failed_sync_events_listed',
      timestamp:    now(),
    }
  } catch {
    return { ok: false, status: 'sync_service_unavailable', failedEvents: [], degradedMode: true }
  }
}

export async function retrySyncEvent(syncEventId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'retry_sync_event')
  if (blocked) return blocked
  const commandId = uuidv4()
  const command = {
    commandId, syncEventId, commandType: 'retry_failed',
    actorId: actorContext.actorId, actorRole: actorContext.role,
    status: 'retry_queued', externalSyncNotLive: true,
    note: 'retry_queued — external sync not live. Retry will re-queue event; requires live integration to process.',
    createdAt: now(),
  }
  SYNC_COMMAND_STORE.set(commandId, command)
  return {
    ok:               true,
    commandId,
    syncEventId,
    status:           'retry_queued',
    externalSyncNotLive: true,
    realTimePushPending: true,
    note:             'Sync event queued for retry. No live external sync is active — requires Phase 18+ integration.',
    degradedMode:     !dbAvailable(),
    timestamp:        now(),
  }
}

export async function blockSyncEvent(syncEventId, reason, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'block_sync_event')
  if (blocked) return blocked
  const commandId = uuidv4()
  SYNC_COMMAND_STORE.set(commandId, {
    commandId, syncEventId, commandType: 'block_event', reason,
    actorRole: actorContext.role, status: 'blocked', createdAt: now(),
  })
  return {
    ok: true, commandId, syncEventId,
    status: 'event_blocked', reason,
    timestamp: now(),
  }
}

export async function exportSyncEvents(venueId, format = 'json', actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'export_sync_events')
  if (blocked) return blocked
  try {
    const { getSyncEventsByVenue } = await import('../sync/operationalSyncEventService.js')
    const result = await getSyncEventsByVenue(venueId)
    return {
      ok:          true,
      venueId,
      format,
      eventCount:  result.count ?? 0,
      events:      result.events ?? [],
      exportedAt:  now(),
      note:        'sync_events_export',
      degradedMode: !dbAvailable(),
    }
  } catch {
    return { ok: false, status: 'export_failed', degradedMode: true }
  }
}

export function getSyncCommandHistory(venueId) {
  const commands = [...SYNC_COMMAND_STORE.values()]
  return { ok: true, venueId, commands, count: commands.length }
}

export function buildSyncNotLiveResponse(venueId) {
  return {
    ok:                  true,
    venueId,
    syncStatus:          'external_sync_not_live',
    externalSyncNotLive: true,
    realTimePushPending: true,
    externalPOSRequired: true,
    vendorSyncNotLive:   true,
    vendorApiRequired:   true,
    note:                'No live external sync active. Sync events are queued for future integration.',
    nextPhaseRequired:   'Phase 18+ for live external POS or vendor push integration',
  }
}
