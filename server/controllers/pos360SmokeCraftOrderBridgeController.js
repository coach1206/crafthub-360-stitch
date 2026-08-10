/**
 * POS360 SmokeCraft Order Bridge Controller — Phase F.8
 */

import {
  getPOS360SmokeCraftBridgeHealth,
  createSmokeCraftOrderIntent,
  createSmokeCraftHandoffRequest,
  attachSmokeCraftMenuItemReference,
  recordSmokeCraftStaffAction,
  updateSmokeCraftOrderSyncStatus,
  getSmokeCraftOrderIntent,
  getSmokeCraftOrderIntentsForGuest,
  getSmokeCraftHandoffRequests,
  getSmokeCraftOrderSyncStatus,
  writePOS360SmokeCraftOrderAuditEvent,
  getPOS360SmokeCraftAuditLog,
} from '../services/pos360/pos360SmokeCraftOrderBridgeService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

const SAFE_CLAIM = 'pos360_smokecraft_order_bridge'

function wrap(res, data) {
  return res.json({
    success: data?.ok !== false,
    data,
    backendConnected: data?.backendConnected ?? false,
    orderStatus: data?.orderStatus || 'local_fallback',
    persistenceMode: data?.persistenceMode || 'local_fallback',
    safeClaim: SAFE_CLAIM,
    timestamp: new Date().toISOString(),
  })
}

export function getHealth(req, res) {
  return ok500(res, async () => wrap(res, await getPOS360SmokeCraftBridgeHealth()))
}

export function createOrderIntent(req, res) {
  return ok500(res, async () => {
    const {
      venueId, guestId, smokecraftSessionId, passportSessionId,
      cigarReference, menuItemReference, quantity, modifiers, orderPayload,
      orderSource, orderType, idempotencyKey,
    } = req.body || {}
    const data = await createSmokeCraftOrderIntent({
      tenantId: tenantId(req), venueId, guestId, smokecraftSessionId, passportSessionId,
      cigarReference, menuItemReference, quantity, modifiers, orderPayload, orderSource, orderType, idempotencyKey,
    })
    return wrap(res, data)
  })
}

export function createHandoffRequest(req, res) {
  return ok500(res, async () => {
    const { venueId, guestId, smokecraftSessionId, passportSessionId, source, targetSystem, handoffPayload, staffActionRequired } = req.body || {}
    const data = await createSmokeCraftHandoffRequest({
      tenantId: tenantId(req), venueId, guestId, smokecraftSessionId, passportSessionId,
      source, targetSystem, handoffPayload, staffActionRequired,
    })
    return wrap(res, data)
  })
}

export function attachMenuItemReference(req, res) {
  return ok500(res, async () => {
    const { venueId, smokecraftSessionId, orderIntentId, cigarReference, menuItemReference, pairingReference, quantity, modifiers, pricePointSignal } = req.body || {}
    const data = await attachSmokeCraftMenuItemReference({
      tenantId: tenantId(req), venueId, smokecraftSessionId, orderIntentId,
      cigarReference, menuItemReference, pairingReference, quantity, modifiers, pricePointSignal,
    })
    return wrap(res, data)
  })
}

export function recordStaffAction(req, res) {
  return ok500(res, async () => {
    const { venueId, orderIntentId, handoffId, smokecraftSessionId, staffUserId, actionType, actionNotes, actionPayload } = req.body || {}
    const data = await recordSmokeCraftStaffAction({
      tenantId: tenantId(req), venueId, orderIntentId, handoffId,
      smokecraftSessionId, staffUserId, actionType, actionNotes, actionPayload,
    })
    return wrap(res, data)
  })
}

export function updateOrderSyncStatus(req, res) {
  return ok500(res, async () => {
    const { venueId, orderIntentId, smokecraftSessionId, syncPhase, syncStatus, syncNotes } = req.body || {}
    const data = await updateSmokeCraftOrderSyncStatus({
      tenantId: tenantId(req), venueId, orderIntentId, smokecraftSessionId, syncPhase, syncStatus, syncNotes,
    })
    return wrap(res, data)
  })
}

export function getOrderIntent(req, res) {
  return ok500(res, async () => {
    const { orderIntentId } = req.params
    const data = await getSmokeCraftOrderIntent({ orderIntentId })
    return wrap(res, data)
  })
}

export function getGuestOrderIntents(req, res) {
  return ok500(res, async () => {
    const { guestId } = req.params
    const limit = parseInt(req.query.limit, 10) || 20
    const data = await getSmokeCraftOrderIntentsForGuest({ guestId, limit })
    return wrap(res, data)
  })
}

export function getHandoffRequests(req, res) {
  return ok500(res, async () => {
    const venueId = req.query.venue_id || null
    const status = req.query.status || undefined
    const data = await getSmokeCraftHandoffRequests({ venueId, status })
    return wrap(res, data)
  })
}

export function getOrderSyncStatus(req, res) {
  return ok500(res, async () => {
    const { orderIntentId } = req.params
    const data = await getSmokeCraftOrderSyncStatus({ orderIntentId })
    return wrap(res, data)
  })
}

export function getAuditLog(req, res) {
  return ok500(res, async () => {
    const guestId = req.query.guest_id || null
    const limit = parseInt(req.query.limit, 10) || 50
    const data = await getPOS360SmokeCraftAuditLog({ guestId, limit })
    return wrap(res, data)
  })
}

export function writeSyncAuditEvent(req, res) {
  return ok500(res, async () => {
    const { venueId, guestId, orderIntentId, handoffId, smokecraftSessionId, eventType, syncStatus, backendConnected, summary, metadata } = req.body || {}
    const data = await writePOS360SmokeCraftOrderAuditEvent({
      tenantId: tenantId(req), venueId, guestId, orderIntentId, handoffId,
      smokecraftSessionId, eventType, syncStatus, backendConnected, summary, metadata,
    })
    return wrap(res, data)
  })
}
