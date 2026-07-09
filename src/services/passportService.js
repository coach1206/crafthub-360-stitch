/**
 * Passport Service — manages 360 Passport stamps, IDs, and ceremony state.
 * Reads/writes via sessionStorageService so it works outside React components.
 */

import { loadSession, saveSession } from './sessionStorageService.js'
import { syncPassportToBackend } from './syncService.js'
import { saveEvent } from './syncQueueService.js'
import { awardStampToBackend, awardXPToBackend, getBackendEarnedStamps, getReturnVisitProgress, writeSyncAuditEvent } from './passportAdapter.js'

function genPassportId() {
  return `PP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

/**
 * Returns the guest's passportId, creating one if it doesn't exist yet.
 */
export function createPassportId() {
  const session = loadSession()
  if (session?.passport?.passportId) return session.passport.passportId
  const id = genPassportId()
  if (session) {
    saveSession({ ...session, passport: { ...session.passport, passportId: id } })
  }
  return id
}

/**
 * Awards a Passport stamp.
 * Prevents duplicates. Sets passport.latestStampId.
 *
 * stampData shape:
 *   { stampId, title, craft, sessionNumber, eventName, visualTheme, points, sourceModule }
 */
export function awardStamp(stampData) {
  const session = loadSession()
  if (!session) return null

  const stamp = {
    stampId:       stampData.stampId       || `stamp_${Date.now().toString(36)}`,
    title:         stampData.title         || 'Passport Stamp',
    craft:         stampData.craft         || 'SmokeCraft 360',
    sessionNumber: stampData.sessionNumber || 1,
    eventName:     stampData.eventName     || session.passport?.eventName || 'The Grand Lounge',
    earnedAt:      Date.now(),
    visualTheme:   stampData.visualTheme   || 'gold',
    points:        stampData.points        || 100,
    sourceModule:  stampData.sourceModule  || 'smokecraft-session-1',
  }

  const earned = session.passport?.earnedStamps || []
  if (earned.find(s => s.stampId === stamp.stampId)) {
    return earned.find(s => s.stampId === stamp.stampId)
  }

  const updatedSession = {
    ...session,
    passport: {
      ...session.passport,
      earnedStamps:  [...earned, stamp],
      latestStampId: stamp.stampId,
      passportId:    session.passport?.passportId || genPassportId(),
    },
    latestStampId: stamp.stampId,
  }
  saveSession(updatedSession)
  // Fire-and-forget backend persistence — local stamp is already saved above.
  // backendConnected is set only if the API confirms real database storage.
  const passportId = updatedSession.passport?.passportId
  awardStampToBackend({
    guestId: passportId,
    stampId: stamp.stampId,
    moduleKey: stamp.sourceModule || 'smokecraft-360',
    xpAwarded: stamp.points || 0,
  }).then(result => {
    if (result?.backendConnected) {
      awardXPToBackend({
        guestId: passportId,
        moduleKey: stamp.sourceModule || 'smokecraft-360',
        xpAmount: stamp.points || 0,
        lastSessionKey: stamp.sourceModule,
      }).catch(() => {})
      writeSyncAuditEvent({
        guestId: passportId,
        eventType: 'stamp_awarded',
        syncStatus: 'ok',
        backendConnected: true,
        summary: `Stamp ${stamp.stampId} awarded and synced to backend`,
        metadata: { stampId: stamp.stampId },
      }).catch(() => {})
    }
  }).catch(() => {})
  syncPassportToBackend(updatedSession).catch(() => {})
  // Durable outbox entry — separate from the existing fire-and-forget sync above.
  if (passportId) {
    saveEvent({
      sourceSystem: 'PASSPORT',
      eventType: 'PassportStampAwarded',
      entityId: passportId,
      payload: { stamp, sessionId: updatedSession.sessionId },
    }).catch(() => {})
  }
  return stamp
}

/**
 * Fetches earned stamps from backend when available, falls back to local.
 * Returns { stamps, backendConnected, persistenceMode }.
 */
export async function getEarnedStampsWithBackend() {
  const session = loadSession()
  const passportId = session?.passport?.passportId
  if (passportId) {
    const result = await getBackendEarnedStamps({ guestId: passportId }).catch(() => null)
    if (result?.backendConnected && Array.isArray(result.stamps)) {
      return { stamps: result.stamps, backendConnected: true, persistenceMode: 'database' }
    }
  }
  return { stamps: getEarnedStamps(), backendConnected: false, persistenceMode: 'local_fallback' }
}

/** Returns all earned stamps from the passport (new model) + legacy smokecraftStamps. */
export function getEarnedStamps() {
  const session = loadSession()
  if (!session) return []
  const rich   = session.passport?.earnedStamps || []
  const legacy = (session.smokecraftStamps || []).filter(s =>
    !rich.find(r => r.stampId === s.id)
  ).map(s => ({
    stampId:  s.id,
    title:    s.id,
    craft:    'SmokeCraft 360',
    earnedAt: s.earnedAt || Date.now(),
    points:   100,
  }))
  return [...rich, ...legacy]
}

/** Returns the most recently earned stamp object. */
export function getLatestStamp() {
  const session = loadSession()
  if (!session) return null
  const stamps  = session.passport?.earnedStamps || []
  const id      = session.passport?.latestStampId || session.latestStampId
  return stamps.find(s => s.stampId === id) || stamps[stamps.length - 1] || null
}

/** Marks the passport ceremony as seen so it won't replay. */
export function markCeremonySeen() {
  const session = loadSession()
  if (!session) return
  saveSession({
    ...session,
    passport: { ...session.passport, ceremonySeen: true },
  })
}

/**
 * Returns return visit progress from backend when available.
 * Falls back to local session count (smokeCraft.completedSessions).
 * Returns { returnVisitCount, lastSessionKey, backendConnected, persistenceMode }.
 */
export async function getReturnVisitProgressWithBackend() {
  const session = loadSession()
  const passportId = session?.passport?.passportId
  const localCount = (session?.smokeCraft?.completedSessions || []).length

  if (passportId) {
    const result = await getReturnVisitProgress({ guestId: passportId }).catch(() => null)
    if (result?.backendConnected) {
      return {
        returnVisitCount: result.returnVisitCount ?? localCount,
        lastSessionKey: result.lastSessionKey || null,
        backendConnected: true,
        persistenceMode: 'database',
        safeClaim: 'return_visit_progress_from_backend',
      }
    }
  }

  return {
    returnVisitCount: localCount,
    lastSessionKey: null,
    backendConnected: false,
    persistenceMode: 'local_fallback',
    safeClaim: 'return_visit_count_from_local_session_only',
  }
}

/**
 * Migrates legacy smokecraftStamps into passport.earnedStamps.
 * Safe to call multiple times — skips duplicates.
 */
export function syncCraftStampToPassport(session) {
  const rich   = session.passport?.earnedStamps || []
  const legacy = session.smokecraftStamps || []
  const merged = [...rich]
  for (const s of legacy) {
    if (!merged.find(e => e.stampId === s.id)) {
      merged.push({
        stampId:      s.id,
        title:        s.id,
        craft:        'SmokeCraft 360',
        sessionNumber: 1,
        earnedAt:     s.earnedAt || Date.now(),
        visualTheme:  'gold',
        points:       100,
        sourceModule: 'smokecraft',
      })
    }
  }
  return merged
}
