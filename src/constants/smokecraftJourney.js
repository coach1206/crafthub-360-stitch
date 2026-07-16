/**
 * smokecraftJourney.js
 *
 * Source-of-truth helpers for the SmokeCraft 6-phase / 27-session gamified
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

// A session counts as satisfied for unlock purposes when it is the always-true
// entry pseudo-step, or a session with no built screen yet (implemented:
// false — see session.js). Evidence can never be recorded for a session that
// does not exist, so it is skipped rather than fabricated as complete or left
// to permanently block every later session (Package J deferred-session rule).
function isStepComplete(completedSteps, session) {
  if (session.id === 'entry') return true
  if (session.implemented === false) return true
  return completedSteps.includes(session.id)
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

/** Find a session by its 1-based global session number (1–27). */
export function getSessionByNumber(sessionNumber) {
  for (const v of VISIT_STRUCTURE) {
    for (const s of v.sessions) {
      if (s.session === sessionNumber) return { ...s, visitNumber: v.visit, visitTitle: v.title, badges: v.badges }
    }
  }
  return null
}

/** Find the visit object that contains the given session number (1–27). */
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
  return prevVisit.sessions.every(s => isStepComplete(completedSteps, s))
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
      if (!isStepComplete(completedSteps, s)) return false
    }
  }
  return true
}

// ── Specific journey gates ──────────────────────────────────────────────────

/** Session 23 (passport-stamp) unlocks only after Session 20 (personal notes) is done — sessions 21/22 are deferred and auto-skipped. */
export function isPassportStampUnlocked(progress) {
  return isSessionUnlocked(23, progress)
}

/**
 * Connections is a supporting module (outside the 27-session spine per
 * Package J), reachable once Session 23 (passport-stamp) is complete.
 */
export function isPassportConnectionsUnlocked(progress) {
  const completedSteps = resolveCompletedSteps(progress)
  return completedSteps.includes('passport-stamp')
}

/**
 * Management Sync is a supporting module (outside the 27-session spine per
 * Package J) — an admin-facing handoff summary, visible once Session 23
 * (passport-stamp) is complete. It is NOT an early user reward; it surfaces
 * for venue staff review during the final phase.
 */
export function isManagementSyncVisible(progress) {
  const completedSteps = resolveCompletedSteps(progress)
  return completedSteps.includes('passport-stamp')
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
      if (!isStepComplete(completedSteps, s)) {
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
  // Phase-level lock
  if (!isVisitUnlocked(session.visitNumber, progress)) {
    const prevVisitNum = session.visitNumber - 1
    const prevVisit = VISIT_STRUCTURE.find(v => v.visit === prevVisitNum)
    if (prevVisit) {
      return `Phase ${session.visitNumber} of ${TOTAL_VISITS} is locked. Complete all sessions in Phase ${prevVisitNum} (${prevVisit.title}) first.`
    }
    return `Phase ${session.visitNumber} of ${TOTAL_VISITS} is locked. Complete the previous phase first.`
  }
  // Within-visit session ordering lock — find the actual first incomplete
  // earlier session (skipping deferred/merged entries that are always
  // treated as satisfied) rather than assuming sessionNumber - 1, which may
  // itself be an implemented: false stand-in.
  const completedSteps = resolveCompletedSteps(progress)
  for (const v of VISIT_STRUCTURE) {
    for (const s of v.sessions) {
      if (s.session >= sessionNumber) break
      if (!isStepComplete(completedSteps, s)) {
        return `Required: Complete Session ${s.session} (${s.label}) first.`
      }
    }
  }
  return `Complete earlier sessions in Phase ${session.visitNumber} first.`
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
