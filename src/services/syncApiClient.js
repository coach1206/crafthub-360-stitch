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

// ── Phase 6D additions ──────────────────────────────────────────
// Additive only — postSyncEvents/getSyncStatus above are unchanged.
// These wrap the same already-built, staff-gated /api/sync/* routes
// (Phase 6B) for the new E.A.T. catch-up consumer / status UI. None of
// them invent new backend behavior; they fail gracefully (return null)
// if a route is unreachable, exactly like apiGet/apiPost already do.

/** Alias kept for callers that prefer an explicit "fetch" verb. */
export async function fetchSyncStatus() {
  return getSyncStatus()
}

/**
 * Fetches confirmed (already-durably-saved) events from the backend's
 * read endpoint. This is the ONLY source of "confirmed" events — it never
 * reads local IndexedDB pending records, since those are not yet backend
 * confirmed by definition.
 */
export async function fetchConfirmedEvents({ sourceSystem = null, limit = 100 } = {}) {
  const params = new URLSearchParams()
  if (sourceSystem) params.set('sourceSystem', sourceSystem)
  if (limit) params.set('limit', String(limit))
  const qs = params.toString()
  return apiGet(`/api/sync/events${qs ? `?${qs}` : ''}`)
}

/**
 * Catch-up pull: confirmed events recorded after `cursor` (an ISO
 * timestamp or epoch ms, per the Phase 6B `/events/since/:timestamp`
 * contract). Returns null on any failure — callers must not infer
 * "no new events" from a null response, only from an empty `events` array
 * on a successful response.
 */
export async function fetchEventsSince(cursor) {
  if (!cursor) return null
  return apiGet(`/api/sync/events/since/${encodeURIComponent(cursor)}`)
}

/**
 * Per-device sync status. The Phase 6B backend has no per-device filter on
 * /api/sync/status — it reports store-wide availability/counts only. This
 * function does NOT pretend otherwise: it calls the existing status route
 * and honestly flags the result as venue-wide, not device-scoped, rather
 * than fabricating device-level data the backend doesn't provide.
 */
export async function fetchDeviceSyncStatus(deviceId) {
  const status = await getSyncStatus()
  if (!status) return null
  return {
    ...status,
    deviceId,
    deviceScoped: false,
    note: 'Backend reports venue-wide sync status only — no per-device filter exists yet.',
  }
}
