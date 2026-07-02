/**
 * NCIE Passport Mastery Engine
 * Tracks craft XP, global XP, mastery percent, and certification levels.
 * CRITICAL: This engine adds XP metadata but does NOT override, replace, or bypass
 * SmokeCraft Passport lock rules defined in src/constants/session.js.
 * Stamp unlock gates are enforced by SmokeCraft's own session/visit logic.
 */

import {
  getXPThresholds,
  getLevelFromXP,
  getGlobalLevelFromXP,
  getXPAward,
  calculateMasteryPercent,
  XP_AWARD_TYPES,
} from '../../data/ncie/passportMasteryRules.js'

const craftXPStore   = new Map()
const globalXPStore  = new Map()

export function getCraftXP(guestId, moduleId) {
  if (!guestId || !moduleId) return { ok: false, error: 'missing_required_fields' }
  const key = `${guestId}:${moduleId}`
  return craftXPStore.get(key) ?? 0
}

export function getGlobalXP(guestId) {
  if (!guestId) return { ok: false, error: 'guest_id_required' }
  return globalXPStore.get(guestId) ?? 0
}

export function awardXP(guestId, moduleId, awardType, options = {}) {
  if (!guestId || !moduleId || !awardType) {
    return { ok: false, error: 'missing_required_fields' }
  }

  const xpAmount = options.xpOverride ?? getXPAward(awardType)
  if (xpAmount <= 0) return { ok: false, error: 'invalid_xp_amount', awardType }

  const craftKey   = `${guestId}:${moduleId}`
  const prevCraft  = craftXPStore.get(craftKey) ?? 0
  const newCraft   = prevCraft + xpAmount
  craftXPStore.set(craftKey, newCraft)

  const prevGlobal = globalXPStore.get(guestId) ?? 0
  const newGlobal  = prevGlobal + xpAmount
  globalXPStore.set(guestId, newGlobal)

  const prevLevel  = getLevelFromXP(moduleId, prevCraft)
  const newLevel   = getLevelFromXP(moduleId, newCraft)
  const leveledUp  = newLevel.level !== prevLevel.level

  return {
    ok:           true,
    guestId,
    moduleId,
    awardType,
    xpAwarded:    xpAmount,
    craftXP:      newCraft,
    globalXP:     newGlobal,
    craftLevel:   newLevel.level,
    leveledUp,
    previousLevel: prevLevel.level,
    storageMode:  'memory_fallback',
  }
}

export function getPassportMasteryProfile(guestId, moduleId, options = {}) {
  if (!guestId || !moduleId) return { ok: false, error: 'missing_required_fields' }

  const craftXP    = getCraftXP(guestId, moduleId)
  const globalXP   = getGlobalXP(guestId)
  const craftLevel = getLevelFromXP(moduleId, craftXP)
  const globalLevel = getGlobalLevelFromXP(globalXP)

  const completedTopics = options.completedTopics ?? 0
  const visitCount      = options.visitCount ?? 0
  const certLevel       = options.certificationLevel ?? null

  const masteryPercent = calculateMasteryPercent(moduleId, {
    completedTopics,
    visitCount,
    certificationLevel: certLevel,
  })

  return {
    ok:              true,
    guestId,
    moduleId,
    craftXP,
    globalXP,
    craftLevel:      craftLevel.level,
    craftLevelThreshold: craftLevel,
    globalLevel:     globalLevel.level,
    masteryPercent,
    completedTopics,
    visitCount,
    certificationLevel: certLevel,
    passportNote:    'SmokeCraft Passport stamp locks are enforced by session.js visit and unlock rules. This engine provides XP and mastery data only.',
    storageMode:     'memory_fallback',
    masteryMode:     'mastery_preview',
    message:         'Passport mastery profile generated from in-memory XP store.',
  }
}

export function getMasteryReadiness(moduleId) {
  return {
    ok:            true,
    moduleId,
    masteryMode:   'mastery_preview',
    xpTrackingStatus: 'xp_tracking_preview',
    certificationStatus: 'certification_preview',
    blockers: [
      { type: 'mastery_preview', severity: 'info', message: 'Mastery tracking is preview-only without verified database persistence.' },
    ],
    passportNote:  'Stamp unlock gates remain under SmokeCraft session.js control and are not affected by this engine.',
    message:       'Mastery readiness is preview-only.',
  }
}

export function resetGuestXP(guestId, moduleId = null) {
  if (!guestId) return { ok: false, error: 'guest_id_required' }
  if (moduleId) {
    craftXPStore.delete(`${guestId}:${moduleId}`)
  } else {
    for (const key of craftXPStore.keys()) {
      if (key.startsWith(`${guestId}:`)) craftXPStore.delete(key)
    }
    globalXPStore.delete(guestId)
  }
  return { ok: true, guestId, moduleId, reset: true, storageMode: 'memory_fallback' }
}
