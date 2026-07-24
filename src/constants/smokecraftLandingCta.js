// Canonical SmokeCraft landing CTA resolver — Single Build & Live Runtime pass.
//
// These four helpers previously lived as module-private functions inside
// src/pages/SmokeCraft.jsx. They are moved here VERBATIM (no behavior
// change) for one reason: /smokecraft/how-it-works now needs the same
// three-state Start / Resume / View-Completed decision for its "Get
// Started" action, and the mandate is explicit that it must use the
// EXISTING landing CTA logic rather than a second, divergent resolver.
// SmokeCraft.jsx imports these back, so there is exactly one definition of
// "where does the primary journey CTA go and what is it called".
import { computeJourneyStatus } from './smokecraftJourneyStatus.js'

// Read a guest session step from novee_guest_session.completedSteps
export function guestStepDone(stepId) {
  try {
    const s = JSON.parse(localStorage.getItem('novee_guest_session') || 'null')
    return Array.isArray(s?.completedSteps) && s.completedSteps.includes(stepId)
  } catch { return false }
}

// "Real journey progress" — deliberately NOT "any non-preserved completed
// step exists". Delegates to the authoritative computeJourneyStatus() so
// the Landing screen, ResumeJourney and How It Works can never disagree
// about what counts as resumable.
export function hasRealJourneyProgress() {
  try {
    const s = JSON.parse(localStorage.getItem('novee_guest_session') || 'null')
    const completedSteps = Array.isArray(s?.completedSteps) ? s.completedSteps : []
    return computeJourneyStatus(completedSteps).hasStarted
  } catch { return false }
}

export function getJourneyCompletionState() {
  try {
    const s = JSON.parse(localStorage.getItem('novee_guest_session') || 'null')
    const completedSteps = Array.isArray(s?.completedSteps) ? s.completedSteps : []
    return computeJourneyStatus(completedSteps)
  } catch { return { isComplete: false, hasStarted: false } }
}

// Hands off to the real Entry Layer chain and lets each screen's own guard
// decide what is next — never resumes mid-journey directly.
export function getEntryRoute() {
  if (!guestStepDone('enroll')) return '/smokecraft/enroll'
  try {
    const raw = localStorage.getItem('sc_journey_v1')
    const j = raw ? JSON.parse(raw) : null
    if (!j?.selectedVenue && !j?.venueSelectionCompleted) return '/smokecraft/venue-select'
  } catch {
    return '/smokecraft/venue-select'
  }
  return '/smokecraft/resume'
}

/**
 * The one three-state landing CTA decision, as a single call.
 * Returns the same { route, label } pair the Landing screen renders.
 */
export function resolveLandingCta() {
  const route = getEntryRoute()
  const isReturning = route === '/smokecraft/resume' && hasRealJourneyProgress()
  const isCompleted = isReturning && getJourneyCompletionState().isComplete
  const label = isCompleted
    ? 'VIEW COMPLETED JOURNEY →'
    : isReturning
      ? 'RESUME SMOKECRAFT JOURNEY →'
      : 'START SMOKECRAFT JOURNEY →'
  return { route, label, isReturning, isCompleted }
}
