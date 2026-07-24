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
export function getSmokeCraftLandingJourneyState() {
  const entryRoute = getEntryRoute()
  const status = getJourneyCompletionState()
  const isReturning = entryRoute === '/smokecraft/resume' && hasRealJourneyProgress()
  return {
    entryRoute,
    hasStarted: Boolean(status.hasStarted),
    isComplete: Boolean(status.isComplete),
    isReturning,
    isCompleted: isReturning && Boolean(status.isComplete),
  }
}

/**
 * The label the primary Landing CTA shows for the current journey state.
 * Kept here (not in the component) so the label and the route it navigates to
 * are decided by the same function and cannot drift apart.
 */
export function getPrimaryActionId(journeyState) {
  return journeyState?.isReturning
    ? SMOKECRAFT_LANDING_ACTIONS.RESUME
    : SMOKECRAFT_LANDING_ACTIONS.START
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
    case A.START:
      return {
        actionId,
        route: SMOKECRAFT_ENROLLMENT_ROUTE,
        label: 'START SMOKECRAFT JOURNEY →',
        startsNewJourney: true,
        requiresConfirmation: false,
      }

    // Active journey: hand off to the Entry Layer chain, which resolves to the
    // earliest valid incomplete step via computeJourneyStatus. Progress is
    // preserved; no second journey is created.
    case A.RESUME:
      return {
        actionId,
        route: journeyState.entryRoute,
        label: journeyState.isCompleted
          ? 'VIEW COMPLETED JOURNEY →'
          : 'RESUME SMOKECRAFT JOURNEY →',
        startsNewJourney: false,
        requiresConfirmation: false,
      }

    // Completed (or simply unwanted) journey: archive it and start clean.
    // Confirmation is required because this is the only destructive control on
    // the Landing screen.
    case A.START_NEW:
      return {
        actionId,
        route: SMOKECRAFT_ENROLLMENT_ROUTE,
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
