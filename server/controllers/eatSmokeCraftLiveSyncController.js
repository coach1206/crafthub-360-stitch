/**
 * E.A.T. SmokeCraft Live Sync Controller — Phase F.7
 */

import {
  getEATSmokeCraftSyncHealth,
  syncSmokeCraftSessionToEAT,
  recordSmokeCraftGuestActivity,
  createSmokeCraftHandoffQueueItem,
  createSmokeCraftManagerAlert,
  createSmokeCraftInventorySignal,
  getSmokeCraftSessionSyncStatus,
  getSmokeCraftGuestActivity,
  getSmokeCraftHandoffQueue,
  getSmokeCraftManagerAlerts,
  getSmokeCraftInventorySignals,
  writeEATSmokeCraftSyncAuditEvent,
  getEATSmokeCraftAuditLog,
} from '../services/eat360/eatSmokeCraftLiveSyncService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

const SAFE_CLAIM = 'eat_smokecraft_live_sync'

function wrap(res, data) {
  return res.json({
    success: data?.ok !== false,
    data,
    backendConnected: data?.backendConnected ?? false,
    syncStatus: data?.syncStatus || 'fallback',
    persistenceMode: data?.persistenceMode || 'local_fallback',
    safeClaim: SAFE_CLAIM,
    timestamp: new Date().toISOString(),
  })
}

export function getHealth(req, res) {
  return ok500(res, async () => wrap(res, await getEATSmokeCraftSyncHealth()))
}

export function syncSession(req, res) {
  return ok500(res, async () => {
    const {
      venueId, guestId, smokecraftSessionId, passportSessionId,
      sessionStatus, completedRoute, completedSteps, xpSummary, stampSummary, tasteProfile, idempotencyKey,
    } = req.body || {}
    const data = await syncSmokeCraftSessionToEAT({
      tenantId: tenantId(req), venueId, guestId, smokecraftSessionId, passportSessionId,
      sessionStatus, completedRoute, completedSteps, xpSummary, stampSummary, tasteProfile, idempotencyKey,
    })
    return wrap(res, data)
  })
}

export function recordGuestActivity(req, res) {
  return ok500(res, async () => {
    const { venueId, guestId, smokecraftSessionId, activityType, activitySummary, flavorTags, loyaltySignal, vipSignal, managerVisibility } = req.body || {}
    const data = await recordSmokeCraftGuestActivity({
      tenantId: tenantId(req), venueId, guestId, smokecraftSessionId,
      activityType, activitySummary, flavorTags, loyaltySignal, vipSignal, managerVisibility,
    })
    return wrap(res, data)
  })
}

export function createHandoff(req, res) {
  return ok500(res, async () => {
    const { venueId, guestId, smokecraftSessionId, handoffType, targetSystem, handoffPayload, staffActionRequired } = req.body || {}
    const data = await createSmokeCraftHandoffQueueItem({
      tenantId: tenantId(req), venueId, guestId, smokecraftSessionId,
      handoffType, targetSystem, handoffPayload, staffActionRequired,
    })
    return wrap(res, data)
  })
}

export function createManagerAlert(req, res) {
  return ok500(res, async () => {
    const { venueId, guestId, smokecraftSessionId, alertType, alertPriority, alertMessage } = req.body || {}
    const data = await createSmokeCraftManagerAlert({
      tenantId: tenantId(req), venueId, guestId, smokecraftSessionId,
      alertType, alertPriority, alertMessage,
    })
    return wrap(res, data)
  })
}

export function createInventorySignal(req, res) {
  return ok500(res, async () => {
    const { venueId, smokecraftSessionId, cigarReference, menuItemReference, inventorySignalType, quantitySignal, reorderSignal } = req.body || {}
    const data = await createSmokeCraftInventorySignal({
      tenantId: tenantId(req), venueId, smokecraftSessionId,
      cigarReference, menuItemReference, inventorySignalType, quantitySignal, reorderSignal,
    })
    return wrap(res, data)
  })
}

export function getSessionSyncStatus(req, res) {
  return ok500(res, async () => {
    const { sessionId } = req.params
    const data = await getSmokeCraftSessionSyncStatus({ sessionId })
    return wrap(res, data)
  })
}

export function getGuestActivity(req, res) {
  return ok500(res, async () => {
    const { guestId } = req.params
    const limit = parseInt(req.query.limit, 10) || 20
    const data = await getSmokeCraftGuestActivity({ guestId, limit })
    return wrap(res, data)
  })
}

export function getHandoffQueue(req, res) {
  return ok500(res, async () => {
    const venueId = req.query.venue_id || tenantId(req) || null
    const status = req.query.status || undefined
    const data = await getSmokeCraftHandoffQueue({ venueId, status })
    return wrap(res, data)
  })
}

export function getManagerAlerts(req, res) {
  return ok500(res, async () => {
    const venueId = req.query.venue_id || null
    const resolved = req.query.resolved !== undefined ? req.query.resolved === 'true' : undefined
    const data = await getSmokeCraftManagerAlerts({ venueId, resolved })
    return wrap(res, data)
  })
}

export function getInventorySignals(req, res) {
  return ok500(res, async () => {
    const venueId = req.query.venue_id || null
    const status = req.query.status || undefined
    const data = await getSmokeCraftInventorySignals({ venueId, status })
    return wrap(res, data)
  })
}

export function getAuditLog(req, res) {
  return ok500(res, async () => {
    const guestId = req.query.guest_id || null
    const venueId = req.query.venue_id || null
    const limit = parseInt(req.query.limit, 10) || 50
    const data = await getEATSmokeCraftAuditLog({ guestId, venueId, limit })
    return wrap(res, data)
  })
}

export function writeSyncAuditEvent(req, res) {
  return ok500(res, async () => {
    const { venueId, guestId, eventType, syncStatus, backendConnected, summary, metadata } = req.body || {}
    const data = await writeEATSmokeCraftSyncAuditEvent({
      tenantId: tenantId(req), venueId, guestId, eventType, syncStatus, backendConnected, summary, metadata,
    })
    return wrap(res, data)
  })
}
