// Canonical SmokeCraft Landing action resolver — Approved Asset Control Plane pass.
//
// WHY THIS FILE EXISTS
// --------------------
// Before this pass, every Landing hotspot in src/pages/SmokeCraft.jsx carried
// its own hardcoded destination string inline (`go('/smokecraft/leaderboard')`,
// `go('/smokecraft/passport-stamp')`, ...). That made the Landing's
// destination map a scattered, unauditable set of literals, and it is exactly
// how two real defects shipped:
//
//   1. PASSPORT pointed at `/smokecraft/passport-stamp`, which is the
//      SESSION-23-guarded curriculum screen. Any guest or partially-progressed
//      user who tapped it was bounced to /smokecraft/enroll by
//      SmokeCraftSessionGuard and never saw the approved Passport visual.
//   2. PAIRING pointed at `/smokecraft/pairing-lab`, the SESSION-11-guarded
//      curriculum screen, with the same bounce-to-enroll result.
//
// (The identical defect on REWARDS -> /smokecraft/humidor-match was found and
// patched individually in an earlier pass. Patching controls one at a time is
// what this file replaces: there is now ONE map, so a landing control cannot
// silently point at a guarded curriculum route again.)
//
// CONTRACT
// --------
// Landing controls may not contain a route string, a navigate() target, a
// fallback route, a profile selector, a journey reset, a component choice, or
// an image choice inline. They call resolveSmokeCraftLandingAction(actionId,
// journeyState) and act on what it returns. This module is the single
// authority for "which route does this Landing control open".
//
// It deliberately does NOT re-implement journey state. It composes the
// resolvers built in prior passes (computeJourneyStatus via
// smokecraftLandingCta.js) so Landing, ResumeJourney and How It Works can
// never disagree about whether a journey exists.
import {
  getEntryRoute,
  hasRealJourneyProgress,
  getJourneyCompletionState,
} from './smokecraftLandingCta.js'
import { getSmokeCraftEntryReadiness } from './smokecraftEntryReadiness.js'
import { computeJourneyStatus } from './smokecraftJourneyStatus.js'
import { getSessionByNumber } from './smokecraftJourney.js'

/** Every action a Landing control may request. */
export const SMOKECRAFT_LANDING_ACTIONS = Object.freeze({
  START:        'START',
  RESUME:       'RESUME',
  START_NEW:    'START_NEW',
  HOW_IT_WORKS: 'HOW_IT_WORKS',
  REWARDS:      'REWARDS',
  RANKINGS:     'RANKINGS',
  PASSPORT:     'PASSPORT',
  PAIRING:      'PAIRING',
  CRAFTHUB:     'CRAFTHUB',
})

// The one destination map. Every route listed here is landing-accessible:
// none of them sits behind a SmokeCraftSessionGuard sessionNumber, so no
// Landing control can bounce a guest to /smokecraft/enroll instead of showing
// the approved destination visual it advertises.
export const SMOKECRAFT_LANDING_DESTINATIONS = Object.freeze({
  HOW_IT_WORKS: '/smokecraft/how-it-works',
  REWARDS:      '/smokecraft/rewards-center',
  RANKINGS:     '/smokecraft/leaderboard',
  PASSPORT:     '/smokecraft/passport',
  PAIRING:      '/smokecraft/pairing',
  CRAFTHUB:     '/smokecraft/crafthub',
})

// The clean entry step a new or restarted journey always begins at.
export const SMOKECRAFT_ENROLLMENT_ROUTE = '/smokecraft/enroll'

/**
 * Read the current journey state once, from the existing canonical helpers.
 * Landing renders from this snapshot and passes it back into the resolver, so
 * a single render can never mix two different readings of journey state.
 */
function readStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}

export function getSmokeCraftLandingJourneyState() {
  const entryRoute = getEntryRoute()
  const status = getJourneyCompletionState()
  const session = readStore('novee_guest_session')
  const journey = readStore('sc_journey_v1')
  const readiness = getSmokeCraftEntryReadiness(session, journey)
  // "Active journey" for CTA purposes is now broader than
  // hasRealJourneyProgress() (>=1 completed SESSION). A user who has
  // completed Guest Pass but no session at all still has a real, resumable
  // journey — treating them as a brand-new user is exactly what caused the
  // Start-always-reopens-Guest-Pass defect this pass fixes.
  const hasActiveJourney = Boolean(status.hasStarted) || readiness.enrollmentComplete
  const isReturning = hasActiveJourney && !status.isComplete
  return {
    entryRoute,
    session,
    journey,
    readiness,
    completedSessionCount: status.completedSessionCount,
    hasStarted: Boolean(status.hasStarted),
    hasActiveJourney,
    isComplete: Boolean(status.isComplete),
    isReturning,
    isCompleted: Boolean(status.isComplete) && hasActiveJourney,
  }
}

/**
 * resolveSmokeCraftEntryDestination(journeyState)
 *
 * THE canonical answer to "what is the very next SmokeCraft screen for this
 * user". It ORCHESTRATES the existing canonical authorities — it does not
 * reimplement them:
 *
 *   - getSmokeCraftEntryReadiness(session, journey) decides whether the
 *     ENTRY requirements (enrollment / venue) are satisfied and, if not,
 *     which one is the first incomplete one and its route.
 *   - computeJourneyStatus(completedSteps) decides how far into the
 *     27-session spine the user actually is, using its contiguous-prefix
 *     rule, so the earliest INCOMPLETE session is simply the next number
 *     after the completed prefix.
 *   - getSessionByNumber() maps that number back to its real route.
 *
 * Root cause it replaces
 * ----------------------
 * `case A.START` previously returned the hardcoded SMOKECRAFT_ENROLLMENT_ROUTE
 * ('/smokecraft/enroll' — the Guest Pass screen) for EVERY user, because
 * getPrimaryActionId() only ever chose RESUME when hasRealJourneyProgress()
 * was true (>= 1 completed session) AND getEntryRoute() had already fallen
 * through to '/smokecraft/resume'. Every user in the entry layer — including
 * one who had just completed Guest Pass — therefore resolved to START, and
 * START unconditionally reopened Guest Pass AND (via startsNewJourney: true)
 * wiped their journey. That is the live "START SMOKECRAFT JOURNEY opens Guest
 * Pass regardless of state" defect.
 *
 * @returns {{ route: string, step: string, reason: string }}
 */
export function resolveSmokeCraftEntryDestination(journeyState = getSmokeCraftLandingJourneyState()) {
  const readiness = journeyState?.readiness
    || getSmokeCraftEntryReadiness(journeyState?.session, journeyState?.journey)

  // 1. An unmet ENTRY requirement always wins. Guest Pass/Enrollment appears
  //    here ONLY when enrollment is genuinely not complete — once it is, this
  //    branch can never return to it again, on Start or on refresh.
  if (!readiness.readyForWelcome) {
    return {
      route: readiness.redirectRoute,
      step: readiness.firstIncompleteRequirement,
      reason: `entry_requirement_incomplete:${readiness.firstIncompleteRequirement}`,
    }
  }

  // 2. Entry requirements met — open the earliest INCOMPLETE session in the
  //    spine. computeJourneyStatus's contiguous prefix means "count + 1" is
  //    the first genuinely incomplete session (S1 = Welcome for a user who
  //    has completed the entry layer but no session yet).
  const completedSteps = Array.isArray(journeyState?.session?.completedSteps)
    ? journeyState.session.completedSteps
    : []
  const status = computeJourneyStatus(completedSteps)
  if (status.isComplete) {
    return { route: '/smokecraft/resume', step: 'completed', reason: 'journey_complete' }
  }
  const next = getSessionByNumber(status.completedSessionCount + 1)
  return {
    route: next?.route || '/smokecraft/welcome',
    step: next?.id || 'entry',
    reason: `earliest_incomplete_session:${status.completedSessionCount + 1}`,
  }
}

/**
 * The label the primary Landing CTA shows for the current journey state.
 * Kept here (not in the component) so the label and the route it navigates to
 * are decided by the same function and cannot drift apart.
 */
export function getPrimaryActionId(journeyState) {
  // Completed journey -> START NEW JOURNEY (confirmed, archives history).
  if (journeyState?.isCompleted) return SMOKECRAFT_LANDING_ACTIONS.START_NEW
  // Active journey -> RESUME. "Active" now includes an enrolled user with
  // zero completed sessions, who previously fell through to START and was
  // sent back to Guest Pass.
  if (journeyState?.isReturning) return SMOKECRAFT_LANDING_ACTIONS.RESUME
  return SMOKECRAFT_LANDING_ACTIONS.START
}

/**
 * resolveSmokeCraftLandingAction(actionId, journeyState)
 *
 * @returns {{
 *   actionId: string,
 *   route: string,
 *   label: string,
 *   startsNewJourney: boolean,
 *   requiresConfirmation: boolean,
 * }}
 *
 * `startsNewJourney: true` tells the caller to run the ONE canonical journey
 * reset (useStartNewSmokeCraftJourney) before navigating. The resolver never
 * mutates state itself — it only decides. Unknown actions throw rather than
 * silently falling back to a default route, because a silent fallback is how
 * a mistyped action would land a user on the wrong screen without any signal.
 */
export function resolveSmokeCraftLandingAction(actionId, journeyState = getSmokeCraftLandingJourneyState()) {
  const A = SMOKECRAFT_LANDING_ACTIONS
  const D = SMOKECRAFT_LANDING_DESTINATIONS

  switch (actionId) {
    // No active journey: begin one clean journey at Enrollment. Never stays on
    // Landing, never reuses a prior identity — the clean-journey creation is
    // performed by the caller's canonical start hook.
    case A.START: {
      // ROOT-CAUSE FIX: no hardcoded '/smokecraft/enroll'. The destination is
      // the earliest genuinely incomplete step for THIS user. A clean-journey
      // reset now only runs when there is genuinely no journey to preserve —
      // it previously ran on every Start click and destroyed real progress.
      const entry = resolveSmokeCraftEntryDestination(journeyState)
      return {
        actionId,
        route: entry.route,
        label: 'START SMOKECRAFT JOURNEY →',
        startsNewJourney: !journeyState.hasActiveJourney,
        requiresConfirmation: false,
        entryStep: entry.step,
        entryReason: entry.reason,
      }
    }

    // Active journey: hand off to the Entry Layer chain, which resolves to the
    // earliest valid incomplete step via computeJourneyStatus. Progress is
    // preserved; no second journey is created.
    case A.RESUME: {
      // Resume must open the earliest valid INCOMPLETE screen — never Landing,
      // never Guest Pass once enrollment is complete, never a completed screen.
      const entry = resolveSmokeCraftEntryDestination(journeyState)
      return {
        actionId,
        route: entry.route,
        entryStep: entry.step,
        entryReason: entry.reason,
        label: journeyState.isCompleted
          ? 'VIEW COMPLETED JOURNEY →'
          : 'RESUME SMOKECRAFT JOURNEY →',
        startsNewJourney: false,
        requiresConfirmation: false,
      }
    }

    // Completed (or simply unwanted) journey: archive it and start clean.
    // Confirmation is required because this is the only destructive control on
    // the Landing screen.
    case A.START_NEW:
      // The canonical reset (useStartNewSmokeCraftJourney) preserves ONLY the
      // account-level 'enroll' step (PRESERVED_COMPLETED_STEP_IDS) and clears
      // every other journey-specific field/step, including 'identity' and the
      // venue. So the first genuinely incomplete entry requirement AFTER the
      // reset is Identity (not Venue Selection) for an already-enrolled
      // account, and Guest Pass/Enrollment only for one that never enrolled.
      // Sending an enrolled user back through Guest Pass — or skipping
      // straight past Identity to Venue — here would be the same
      // "wrong-entry-step" defect in a second place.
      return {
        actionId,
        route: journeyState?.readiness?.enrollmentComplete
          ? '/smokecraft/identity'
          : SMOKECRAFT_ENROLLMENT_ROUTE,
        label: 'Start New Journey',
        startsNewJourney: true,
        requiresConfirmation: true,
      }

    case A.HOW_IT_WORKS:
      return { actionId, route: D.HOW_IT_WORKS, label: 'How It Works', startsNewJourney: false, requiresConfirmation: false }

    case A.REWARDS:
      return { actionId, route: D.REWARDS, label: 'Rewards', startsNewJourney: false, requiresConfirmation: false }

    case A.RANKINGS:
      return { actionId, route: D.RANKINGS, label: 'Rankings', startsNewJourney: false, requiresConfirmation: false }

    case A.PASSPORT:
      return { actionId, route: D.PASSPORT, label: 'Passport', startsNewJourney: false, requiresConfirmation: false }

    case A.PAIRING:
      return { actionId, route: D.PAIRING, label: 'Pairing', startsNewJourney: false, requiresConfirmation: false }

    case A.CRAFTHUB:
      return { actionId, route: D.CRAFTHUB, label: 'CraftHub', startsNewJourney: false, requiresConfirmation: false }

    default:
      throw new Error(`resolveSmokeCraftLandingAction: unknown action "${actionId}"`)
  }
}
