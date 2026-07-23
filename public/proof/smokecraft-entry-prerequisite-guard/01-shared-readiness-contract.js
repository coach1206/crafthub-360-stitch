// Emergency Remediation Continuation: Entry-Prerequisite Guard — the one
// canonical, shared entry-readiness contract. Every route guard that
// protects entry into the numbered SmokeCraft spine (currently: the Welcome
// route, S1) must call this function rather than re-implementing its own
// prerequisite check.
//
// Real, existing entry-layer routes (ENTRY_LAYER_SCREENS in session.js):
// Launch -> Sign In/Guest Mode (enroll) -> Venue Selection -> Personal
// Dashboard (identity) -> Resume or Start New Journey.
//
// Disclosed finding (see docs/audits/smokecraft-final-completion/
// entry-prerequisite-remediation/01-ENTRY-READINESS-CONTRACT.md for the
// full explanation): "Identity" (/smokecraft/identity) is a reachable
// dashboard once enrolled, not a separate action with its own completion
// flag anywhere in the real architecture — so identityComplete is derived
// as "true once enrolled," not a fabricated new gate. "Mentor Selection"
// (/smokecraft/mentor-selection) is a real, existing SUPPORTING_MODULES
// entry, but in the current, already-approved architecture it is gated
// `requires: 'entry'` — i.e. it comes AFTER Welcome/S1, not before it
// (confirmed: Mentor.jsx's own Continue button navigates to
// /smokecraft/seed-soil, a further post-Welcome supporting module, never
// back into the Welcome/S1 spine). Forcing Mentor Selection to occur before
// Welcome would require restructuring that module's own guard and two
// pages' navigation targets — a structural architecture change, not a
// prerequisite-bypass fix, and out of this pass's safe scope. mentorComplete
// is therefore reported for contract completeness but does NOT gate
// readyForWelcome — this is disclosed, not silent.
export function getSmokeCraftEntryReadiness(session, journey) {
  const completedSteps = session?.completedSteps || []
  const enrollmentComplete = completedSteps.includes('enroll')
  // Identity has no separate completion flag in the real architecture —
  // it is a dashboard reachable once enrolled, not a distinct gate.
  const identityComplete = enrollmentComplete
  const venueComplete = !!(journey?.selectedVenue || journey?.venueSelectionCompleted)
  // Reported for API completeness; NOT a pre-Welcome gate — see disclosure above.
  const mentorComplete = !!journey?.mentor

  const validationIssues = []
  if (!enrollmentComplete) validationIssues.push('enrollment_required')
  if (enrollmentComplete && !venueComplete) validationIssues.push('venue_required')

  let firstIncompleteRequirement = null
  let redirectRoute = null
  if (!enrollmentComplete) {
    firstIncompleteRequirement = 'enrollment'
    redirectRoute = '/smokecraft/enroll'
  } else if (!venueComplete) {
    firstIncompleteRequirement = 'venue'
    redirectRoute = '/smokecraft/venue-select'
  }

  const readyForWelcome = enrollmentComplete && venueComplete

  return {
    enrollmentComplete,
    identityComplete,
    venueComplete,
    mentorComplete,
    readyForWelcome,
    firstIncompleteRequirement,
    redirectRoute,
    validationIssues,
  }
}
