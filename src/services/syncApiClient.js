/**
 * Sync API Client — Phase 6C
 * Thin frontend client for the Phase 6B backend event store
 * (/api/sync/events, /api/sync/status). Built on the existing apiClient.js
 * safe-fetch wrapper — no new fetch/timeout/offline logic invented here.
 */

import { apiGet, apiPost } from './apiClient.js'
import { getDeviceId } from './shared/deviceIdService.js'

/**
 * Posts a batch of outbox events to /api/sync/events.
 * `events` are syncQueueService records — mapped here to the backend's
 * exact SyncEvent shape (Phase 6A/6B): eventId, sourceSystem, eventType,
 * entityId, payload, clientCreatedAt.
 * Returns the raw apiPost response (or null on offline/network failure —
 * apiClient never throws). Callers must check `success` and per-event
 * `success`/`degraded` fields before treating anything as synced.
 */
export async function postSyncEvents(events) {
  const body = {
    sourceDeviceId: getDeviceId(),
    events: events.map((e) => ({
      eventId:         e.eventId,
      sourceSystem:    e.sourceSystem,
      eventType:       e.eventType,
      entityId:        e.entityId,
      payload:         e.payload,
      clientCreatedAt: e.timestamp,
    })),
  }
  return apiPost('/api/sync/events', body)
}

/** Reads backend sync status (staff-gated — returns null for guests, which apiClient already handles). */
export async function getSyncStatus() {
  return apiGet('/api/sync/status')
}
