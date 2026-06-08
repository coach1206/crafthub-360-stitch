/**
 * Passport Progress Engine — pure utility functions.
 * No React, no hooks. All functions are safe against missing/null session data.
 * Import and call from GuestSessionContext or page components.
 */

import { STAMP_CATALOG } from '../data/passportCatalog.js'
import { getRankFromXP } from '../constants/session.js'

// ─── Stamp Queries ──────────────────────────────────────────────────────────

/**
 * Returns true if stampId has already been awarded in this session.
 */
export function hasPassportStamp(session, stampId) {
  if (!session || !Array.isArray(session.smokecraftStamps)) return false
  return session.smokecraftStamps.some(s => s.id === stampId)
}

/**
 * Returns all earned stamps that exist in STAMP_CATALOG.
 * Filters out any orphaned / unknown IDs (data-safety).
 */
export function getEarnedPassportStamps(session) {
  if (!session || !Array.isArray(session.smokecraftStamps)) return []
  const catalogIds = new Set(STAMP_CATALOG.map(c => c.id))
  return session.smokecraftStamps.filter(s => catalogIds.has(s.id))
}

/**
 * Returns a progress summary object.
 * { earned[], total, count, pct, missing[] }
 */
export function getPassportProgress(session) {
  const earned    = getEarnedPassportStamps(session)
  const total     = STAMP_CATALOG.length
  const pct       = total > 0 ? Math.min(100, Math.round((earned.length / total) * 100)) : 0
  const earnedIds = new Set(earned.map(s => s.id))
  const missing   = STAMP_CATALOG.filter(c => !earnedIds.has(c.id))
  return { earned, total, count: earned.length, pct, missing }
}

// ─── Rank / XP ──────────────────────────────────────────────────────────────

/** Returns the rank object for the session's current XP. */
export function calculatePassportRank(session) {
  return getRankFromXP(session?.xp ?? 0)
}

/** Returns the current XP safely. */
export function calculatePassportXP(session) {
  return session?.xp ?? 0
}

// ─── State Mutations (pure — return new session objects) ────────────────────

/**
 * Awards a stamp by catalog ID. Returns an updated session object.
 * Safe: no duplicates, unknown IDs logged + ignored, missing arrays handled.
 * Sets `latestStampId` so ceremony pages know which stamp triggered the visit.
 */
export function awardPassportStamp(session, stampId, source = 'unknown') {
  if (!session) return session ?? {}
  const catalogEntry = STAMP_CATALOG.find(c => c.id === stampId)
  if (!catalogEntry) {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.warn(`[passportProgress] Unknown stamp ID: "${stampId}" from source: "${source}"`)
    }
    return session
  }
  const stamps = Array.isArray(session.smokecraftStamps) ? session.smokecraftStamps : []
  if (stamps.some(s => s.id === stampId)) return session  // already earned — no-op
  const newStamp = {
    id:       catalogEntry.id,
    name:     catalogEntry.name,
    icon:     catalogEntry.icon,
    source,
    earnedAt: Date.now(),
  }
  return {
    ...session,
    smokecraftStamps: [...stamps, newStamp],
    latestStampId:    stampId,
  }
}

/**
 * Sets latestStampId without awarding a stamp (ceremony pointer only).
 */
export function unlockPassportCeremony(session, stampId) {
  if (!session) return session ?? {}
  return { ...session, latestStampId: stampId }
}

/**
 * Records a completed step. Safe: no duplicates.
 */
export function recordCompletedStep(session, stepId) {
  if (!session) return session ?? {}
  const steps = Array.isArray(session.completedSteps) ? session.completedSteps : []
  if (steps.includes(stepId)) return session
  return {
    ...session,
    completedSteps:        [...steps, stepId],
    currentSmokecraftStep: stepId,
  }
}

/**
 * Merges Golden Box progress into session state.
 * payload: { tier, claimed, badge } — any subset.
 */
export function recordGoldenBoxProgress(session, payload) {
  if (!session) return session ?? {}
  return {
    ...session,
    goldenBoxProgress: {
      ...(session.goldenBoxProgress ?? {}),
      ...payload,
      updatedAt: Date.now(),
    },
  }
}
