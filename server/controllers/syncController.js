/**
 * Sync Controller — Phase 6B
 * HTTP layer for /api/sync/* — the internal multi-device event store.
 * Auth/ownership decisions (staff-only vs guest-safe) are enforced here,
 * since they depend on the event's sourceSystem, not just the route.
 */

import { ok, fail, serverError } from '../utils/response.js'
import { meetsMinRole } from '../config/roleMap.js'
import {
  recordEvent,
  retryEvents,
  getEventsSince,
  listEvents,
  getSyncStatus,
  validateEventShape,
  DbUnavailableError,
  STAFF_SOURCE_SYSTEMS,
  GUEST_SOURCE_SYSTEMS,
} from '../services/syncEventService.js'

const DEGRADED_MESSAGE =
  'Sync store is unavailable (no database connection). This event was NOT durably saved — ' +
  'keep it pending in your local outbox and retry later. The server will never report "synced" without a real write.'

/**
 * One event is authorized to write if:
 *  - its sourceSystem is staff/operational (POS3/EAT/KITCHEN/BAR/HUMIDOR/INVENTORY)
 *    AND the requester is authenticated staff+ (mirrors pos3IntegrationRoutes.js's
 *    existing requireStaff tier — Phase 6 finding), OR
 *  - its sourceSystem is guest-facing (SMOKECRAFT/PASSPORT), which mirrors the
 *    existing passportRoutes.js / smokecraftOrders.js design: these routes are
 *    capability-scoped by passportId/sessionId already present in the payload,
 *    not by backend identity, because guests have no JWT (Phase 4 finding).
 *    This is NOT a new guest-write capability — it matches what those existing
 *    routes already allow today.
 */
function authorizeEvent(evt, user) {
  if (STAFF_SOURCE_SYSTEMS.includes(evt.sourceSystem)) {
    if (!user || !meetsMinRole(user.role, 'staff')) {
      return `sourceSystem ${evt.sourceSystem} requires staff authentication`
    }
    return null
  }
  if (GUEST_SOURCE_SYSTEMS.includes(evt.sourceSystem)) {
    // Guest-safe — same scope as existing passport/smokecraft routes.
    return null
  }
  return `Unknown sourceSystem: ${evt.sourceSystem}`
}

export async function postEvents(req, res) {
  try {
    const events = Array.isArray(req.body?.events) ? req.body.events : [req.body]
    const sourceDeviceId = req.body?.sourceDeviceId || req.headers['x-device-id'] || 'unknown-device'
    const user = req.user || null

    const results = []
    for (const evt of events) {
      const shapeError = validateEventShape(evt)
      if (shapeError) {
        results.push({ eventId: evt?.eventId || null, success: false, error: shapeError })
        continue
      }
      const authError = authorizeEvent(evt, user)
      if (authError) {
        results.push({ eventId: evt.eventId, success: false, error: authError, status: 403 })
        continue
      }
      try {
        const { event, duplicate } = await recordEvent(evt, {
          sourceDeviceId,
          userId: user?.id || null,
          userRole: user?.role || null,
        })
        results.push({ eventId: event.event_id, success: true, duplicate, syncStatus: event.sync_status })
      } catch (err) {
        if (err instanceof DbUnavailableError) {
          results.push({ eventId: evt.eventId, success: false, degraded: true, error: DEGRADED_MESSAGE })
        } else {
          results.push({ eventId: evt.eventId, success: false, error: err.message })
        }
      }
    }

    const anyDegraded = results.some((r) => r.degraded)
    const allFailed = results.every((r) => !r.success)
    const status = anyDegraded ? 503 : allFailed ? 400 : 200
    return ok(res, { results }, status)
  } catch (err) {
    return serverError(res, err, 'postEvents')
  }
}

export async function getEvents(req, res) {
  try {
    const { sourceSystem, limit } = req.query
    const events = await listEvents({ sourceSystem: sourceSystem || null, limit: Number(limit) || 100 })
    return ok(res, { events, count: events.length })
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      return fail(res, DEGRADED_MESSAGE, 503)
    }
    return serverError(res, err, 'getEvents')
  }
}

export async function getEventsSinceTimestamp(req, res) {
  try {
    const { timestamp } = req.params
    const events = await getEventsSince(timestamp)
    return ok(res, { events, count: events.length })
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      return fail(res, DEGRADED_MESSAGE, 503)
    }
    return serverError(res, err, 'getEventsSinceTimestamp')
  }
}

export async function postRetry(req, res) {
  try {
    const events = Array.isArray(req.body?.events) ? req.body.events : []
    if (events.length === 0) return fail(res, 'events array is required', 400)
    const sourceDeviceId = req.body?.sourceDeviceId || req.headers['x-device-id'] || 'unknown-device'
    const user = req.user || null

    for (const evt of events) {
      const authError = authorizeEvent(evt, user)
      if (authError) return fail(res, authError, 403)
    }

    const results = await retryEvents(events, {
      sourceDeviceId,
      userId: user?.id || null,
      userRole: user?.role || null,
    })
    const anyDegraded = results.some((r) => r.error === 'Database unavailable — sync degraded')
    return ok(res, { results }, anyDegraded ? 503 : 200)
  } catch (err) {
    return serverError(res, err, 'postRetry')
  }
}

export async function getStatus(req, res) {
  try {
    const status = await getSyncStatus()
    return ok(res, status, status.degraded ? 503 : 200)
  } catch (err) {
    return serverError(res, err, 'getStatus')
  }
}
