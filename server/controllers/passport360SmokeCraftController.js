/**
 * Passport 360 SmokeCraft Controller — Phase F.5
 */

import {
  getPassportBackendHealth,
  createOrResolveGuestProfile,
  saveSmokeCraftSessionToPassport,
  awardPassportStampLive,
  awardPassportXP,
  saveSmokeCraftFlavorMemory,
  getGuestPassportProgress,
  getGuestEarnedStamps,
  getGuestBadges,
  getReturnVisitProgress,
  writePassportSyncAuditEvent,
  getPassportAuditLog,
} from '../services/passport360/passport360SmokeCraftPersistenceService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

const SAFE_CLAIM = 'passport_360_smokecraft_persistence'

function wrap(res, data) {
  return res.json({
    success: data?.ok !== false,
    data,
    backendConnected: data?.backendConnected ?? false,
    persistenceMode: data?.persistenceMode || 'local_fallback',
    safeClaim: SAFE_CLAIM,
    timestamp: new Date().toISOString(),
  })
}

export function getHealth(req, res) {
  return ok500(res, async () => {
    const data = await getPassportBackendHealth()
    return wrap(res, data)
  })
}

export function resolveGuest(req, res) {
  return ok500(res, async () => {
    const { venueId, guestReference, displayName, emailHash, phoneHash } = req.body || {}
    const data = await createOrResolveGuestProfile({
      tenantId: tenantId(req),
      venueId,
      guestReference,
      displayName,
      emailHash,
      phoneHash,
    })
    return wrap(res, data)
  })
}

export function completeSmokeCraftSession(req, res) {
  return ok500(res, async () => {
    const {
      venueId, guestId, smokecraftSessionId, sessionStatus,
      completedRoute, completedSteps, tasteProfile, xpSummary,
      stampSummary, startedAt, completedAt,
    } = req.body || {}
    const data = await saveSmokeCraftSessionToPassport({
      tenantId: tenantId(req),
      venueId,
      guestId,
      smokecraftSessionId,
      sessionStatus,
      completedRoute,
      completedSteps,
      tasteProfile,
      xpSummary,
      stampSummary,
      startedAt,
      completedAt,
    })
    return wrap(res, data)
  })
}

export function awardStamp(req, res) {
  return ok500(res, async () => {
    const { venueId, guestId, stampId, moduleKey, sourceSessionId, sourceRoute, xpAwarded } = req.body || {}
    const data = await awardPassportStampLive({
      tenantId: tenantId(req),
      venueId,
      guestId,
      stampId,
      moduleKey,
      sourceSessionId,
      sourceRoute,
      xpAwarded,
    })
    return wrap(res, data)
  })
}

export function awardXP(req, res) {
  return ok500(res, async () => {
    const { venueId, guestId, moduleKey, xpAmount, lastSessionKey, lastCompletedRoute } = req.body || {}
    const data = await awardPassportXP({
      tenantId: tenantId(req),
      venueId,
      guestId,
      moduleKey,
      xpAmount,
      lastSessionKey,
      lastCompletedRoute,
    })
    return wrap(res, data)
  })
}

export function saveFlavorMemory(req, res) {
  return ok500(res, async () => {
    const { venueId, guestId, sourceSessionId, tasteTags, tastingNotes, flavorProfileSource, dataQualityStatus } = req.body || {}
    const data = await saveSmokeCraftFlavorMemory({
      tenantId: tenantId(req),
      venueId,
      guestId,
      sourceSessionId,
      tasteTags,
      tastingNotes,
      flavorProfileSource,
      dataQualityStatus,
    })
    return wrap(res, data)
  })
}

export function getGuestProgress(req, res) {
  return ok500(res, async () => {
    const { guestId } = req.params
    const moduleKey = req.query.module_key || 'smokecraft-360'
    const data = await getGuestPassportProgress({ guestId, moduleKey })
    return wrap(res, data)
  })
}

export function getGuestStamps(req, res) {
  return ok500(res, async () => {
    const { guestId } = req.params
    const moduleKey = req.query.module_key || 'smokecraft-360'
    const data = await getGuestEarnedStamps({ guestId, moduleKey })
    return wrap(res, data)
  })
}

export function getGuestBadgesHandler(req, res) {
  return ok500(res, async () => {
    const { guestId } = req.params
    const moduleKey = req.query.module_key || 'smokecraft-360'
    const data = await getGuestBadges({ guestId, moduleKey })
    return wrap(res, data)
  })
}

export function getGuestReturnVisits(req, res) {
  return ok500(res, async () => {
    const { guestId } = req.params
    const moduleKey = req.query.module_key || 'smokecraft-360'
    const data = await getReturnVisitProgress({ guestId, moduleKey })
    return wrap(res, data)
  })
}

export function getAuditLog(req, res) {
  return ok500(res, async () => {
    const { guestId } = req.params
    const limit = parseInt(req.query.limit, 10) || 50
    const data = await getPassportAuditLog({ guestId, tenantId: tenantId(req), limit })
    return wrap(res, data)
  })
}

export function writeSyncAuditEvent(req, res) {
  return ok500(res, async () => {
    const { venueId, guestId, eventType, syncStatus, backendConnected, summary, metadata } = req.body || {}
    const data = await writePassportSyncAuditEvent({
      tenantId: tenantId(req),
      venueId,
      guestId,
      eventType,
      syncStatus,
      backendConnected,
      summary,
      metadata,
    })
    return wrap(res, data)
  })
}
