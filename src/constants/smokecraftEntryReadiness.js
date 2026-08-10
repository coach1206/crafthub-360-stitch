// SmokeCraft Navigation Authority pass — the one canonical, shared
// entry-readiness contract. Every route guard that protects entry into the
// numbered SmokeCraft spine (currently: the Welcome route, S1) must call this
// function rather than re-implementing its own prerequisite check.
//
// Canonical entry-layer order (per explicit product requirement):
//   Launch -> Guest Pass/Enrollment (enroll) -> Identity -> Venue Selection
//   -> Welcome / Session 1.
//
// Root-cause correction (Navigation Authority pass): Identity was previously
// treated as an optional dashboard with no completion flag of its own
// (identityComplete derived as "true once enrolled"), which let Venue
// Selection and Guest Pass each hardcode their own, mutually-contradictory
// idea of where Identity belongs (Venue's Continue went to Identity, Enroll's
// completion skipped straight to Venue, and Identity's own completion led
// into Golden Box, entirely bypassing Venue and Welcome). Identity is now a
// REAL, required gate with its own completion step ('identity', awarded by
// Identity.jsx's Begin control) enforced between enrollment and venue
// selection, so there is exactly one authority for this order and no page
// can silently disagree with it.
//
// "Mentor Selection" (/smokecraft/mentor-selection) is a real, existing
// SUPPORTING_MODULES entry, but in the current, already-approved architecture
// it is gated `requires: 'entry'` — i.e. it comes AFTER Welcome/S1, not
// before it (confirmed: Mentor.jsx's own Continue button navigates to
// /smokecraft/seed-soil, a further post-Welcome supporting module, never back
// into the Welcome/S1 spine). mentorComplete is reported for contract
// completeness but does NOT gate readyForWelcome — disclosed, not silent.
export function getSmokeCraftEntryReadiness(session, journey) {
  const completedSteps = session?.completedSteps || []
  const enrollmentComplete = completedSteps.includes('enroll')
  const identityComplete = completedSteps.includes('identity')
  const venueComplete = !!(journey?.selectedVenue || journey?.venueSelectionCompleted)
  // Reported for API completeness; NOT a pre-Welcome gate — see disclosure above.
  const mentorComplete = !!journey?.mentor

  const validationIssues = []
  if (!enrollmentComplete) validationIssues.push('enrollment_required')
  if (enrollmentComplete && !identityComplete) validationIssues.push('identity_required')
  if (enrollmentComplete && identityComplete && !venueComplete) validationIssues.push('venue_required')

  let firstIncompleteRequirement = null
  let redirectRoute = null
  if (!enrollmentComplete) {
    firstIncompleteRequirement = 'enrollment'
    redirectRoute = '/smokecraft/enroll'
  } else if (!identityComplete) {
    firstIncompleteRequirement = 'identity'
    redirectRoute = '/smokecraft/identity'
  } else if (!venueComplete) {
    firstIncompleteRequirement = 'venue'
    redirectRoute = '/smokecraft/venue-select'
  }

  const readyForWelcome = enrollmentComplete && identityComplete && venueComplete

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
