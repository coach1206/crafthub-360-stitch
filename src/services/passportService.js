/**
 * Passport Service — manages 360 Passport stamps, IDs, and ceremony state.
 * Reads/writes via sessionStorageService so it works outside React components.
 */

import { loadSession, saveSession } from './sessionStorageService.js'
import { syncPassportToBackend } from './syncService.js'

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
  // Fire-and-forget passport sync after local save
  syncPassportToBackend(updatedSession).catch(() => {})
  return stamp
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
