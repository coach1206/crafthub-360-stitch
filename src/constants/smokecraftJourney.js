/**
 * smokecraftJourney.js
 *
 * Source-of-truth helpers for the SmokeCraft 8-visit / 24-session gamified
 * progression system. Builds on the VISIT_STRUCTURE defined in session.js and
 * adds the route-aware, progress-aware helpers needed by the new guard and
 * header components.
 *
 * "progress" accepted by these helpers is either:
 *   - an array of completed step-id strings (same shape as session.completedSteps), OR
 *   - an object with a `completedSteps` array field (SmokeCraftProgressContext shape)
 */

export {
  VISIT_STRUCTURE,
  TOTAL_VISITS,
  TOTAL_SESSIONS,
  ROUNDS,
  TOTAL_ROUNDS,
  getVisitForStepId,
  getVisitProgress,
  getRoundForVisit,
} from './session.js'

import {
  VISIT_STRUCTURE,
  TOTAL_VISITS,
  TOTAL_SESSIONS,
} from './session.js'

// ── Internal helpers ────────────────────────────────────────────────────────

function resolveCompletedSteps(progress) {
  if (!progress) return []
  if (Array.isArray(progress)) return progress
  return progress.completedSteps || []
}

function isStepComplete(completedSteps, sessionId) {
  return sessionId === 'entry' ? true : completedSteps.includes(sessionId)
}

// ── Session lookup ──────────────────────────────────────────────────────────

/** Find a session by its route string (exact or leading match). */
export function getSessionByRoute(pathname) {
  if (!pathname) return null
  const clean = pathname.replace(/\/$/, '')
  for (const v of VISIT_STRUCTURE) {
    for (const s of v.sessions) {
      if (s.route === clean || clean === s.route) return { ...s, visitNumber: v.visit, visitTitle: v.title }
    }
  }
  return null
}

/** Find a session by its step-id key (e.g. 'golden-box', 'mentor'). */
export function getSessionByKey(key) {
  if (!key) return null
  for (const v of VISIT_STRUCTURE) {
    for (const s of v.sessions) {
      if (s.id === key) return { ...s, visitNumber: v.visit, visitTitle: v.title, badges: v.badges }
    }
  }
  return null
}

/** Find a session by its 1-based global session number (1–24). */
export function getSessionByNumber(sessionNumber) {
  for (const v of VISIT_STRUCTURE) {
    for (const s of v.sessions) {
      if (s.session === sessionNumber) return { ...s, visitNumber: v.visit, visitTitle: v.title, badges: v.badges }
    }
  }
  return null
}

/** Find the visit object that contains the given session number (1–24). */
export function getVisitBySession(sessionNumber) {
  for (const v of VISIT_STRUCTURE) {
    if (v.sessions.some(s => s.session === sessionNumber)) return v
  }
  return null
}

// ── Unlock checks ───────────────────────────────────────────────────────────

/**
 * Visit 1 is always unlocked. Visit N unlocks only once every session in
 * visit N-1 is complete.
 */
export function isVisitUnlocked(visitNumber, progress) {
  if (visitNumber <= 1) return true
  const completedSteps = resolveCompletedSteps(progress)
  const prevVisit = VISIT_STRUCTURE.find(v => v.visit === visitNumber - 1)
  if (!prevVisit) return true
  return prevVisit.sessions.every(s => isStepComplete(completedSteps, s.id))
}

/**
 * A session is unlocked when:
 *  1. Its visit is unlocked (previous visit fully complete), AND
 *  2. All earlier sessions within the entire journey are complete.
 */
export function isSessionUnlocked(sessionNumber, progress) {
  const completedSteps = resolveCompletedSteps(progress)
  const session = getSessionByNumber(sessionNumber)
  if (!session) return false
  // Visit must be unlocked
  if (!isVisitUnlocked(session.visitNumber, completedSteps)) return false
  // All earlier sessions must be complete
  for (const v of VISIT_STRUCTURE) {
    for (const s of v.sessions) {
      if (s.session >= sessionNumber) return true
      if (!isStepComplete(completedSteps, s.id)) return false
    }
  }
  return true
}

// ── Specific journey gates ──────────────────────────────────────────────────

/** Session 21 (passport-stamp) unlocks only after Session 20 (final-review) is done. */
export function isPassportStampUnlocked(progress) {
  return isSessionUnlocked(21, progress)
}

/** Session 22 (connections) unlocks only after Session 21 (passport-stamp) is done. */
export function isPassportConnectionsUnlocked(progress) {
  return isSessionUnlocked(22, progress)
}

/**
 * Management Sync (Session 23) is an admin-facing handoff summary — visible
 * once Visit 8 is fully underway (Session 20 started). It is NOT an early
 * user reward; it surfaces for venue staff review during the final visit.
 */
export function isManagementSyncVisible(progress) {
  return isSessionUnlocked(23, progress)
}

// ── Journey cursor ──────────────────────────────────────────────────────────

/**
 * Returns the first session that has not yet been completed — i.e., the
 * session the guest should be directed to right now.
 */
export function getCurrentAllowedSession(progress) {
  const completedSteps = resolveCompletedSteps(progress)
  for (const v of VISIT_STRUCTURE) {
    for (const s of v.sessions) {
      if (!isStepComplete(completedSteps, s.id)) {
        return { ...s, visitNumber: v.visit, visitTitle: v.title }
      }
    }
  }
  // All sessions complete
  const last = VISIT_STRUCTURE[VISIT_STRUCTURE.length - 1]
  const lastS = last.sessions[last.sessions.length - 1]
  return { ...lastS, visitNumber: last.visit, visitTitle: last.title }
}

/** Returns the session object after the given session number, or null at end. */
export function getNextSession(currentSessionNumber) {
  const next = currentSessionNumber + 1
  return getSessionByNumber(next) || null
}

// ── Human-readable lock reason ──────────────────────────────────────────────

/**
 * Returns a plain-language string explaining why a session is locked, or
 * null if it is not locked.
 */
export function getLockedReason(sessionNumber, progress) {
  if (isSessionUnlocked(sessionNumber, progress)) return null
  const session = getSessionByNumber(sessionNumber)
  if (!session) return 'Unknown session.'
  const visit = getVisitBySession(sessionNumber)
  if (!visit) return 'Unknown visit.'
  // Visit-level lock
  if (!isVisitUnlocked(session.visitNumber, progress)) {
    const prevVisitNum = session.visitNumber - 1
    const prevVisit = VISIT_STRUCTURE.find(v => v.visit === prevVisitNum)
    if (prevVisit) {
      return `Visit ${session.visitNumber} of ${TOTAL_VISITS} is locked. Complete all sessions in Visit ${prevVisitNum} (${prevVisit.title}) first.`
    }
    return `Visit ${session.visitNumber} of ${TOTAL_VISITS} is locked. Complete the previous visit first.`
  }
  // Within-visit session ordering lock
  const blockerSession = getSessionByNumber(sessionNumber - 1)
  if (blockerSession) {
    return `Required: Complete Session ${blockerSession.session} (${blockerSession.label}) first.`
  }
  return `Complete earlier sessions in Visit ${session.visitNumber} first.`
}

// ── End-of-visit detection ──────────────────────────────────────────────────

/** Returns true if the given session number is the final session of its visit. */
export function isEndOfVisit(sessionNumber) {
  const visit = getVisitBySession(sessionNumber)
  if (!visit) return false
  const lastSession = visit.sessions[visit.sessions.length - 1]
  return lastSession.session === sessionNumber
}

/** Returns the visit number for the given session, or null. */
export function getVisitNumberForSession(sessionNumber) {
  const session = getSessionByNumber(sessionNumber)
  return session ? session.visitNumber : null
}

// TOTAL_VISITS and TOTAL_SESSIONS are already exported via the named re-export
// block at the top of this file. No duplicate export needed here.
