// SmokeCraft Navigation Authority pass — the one canonical, shared
// entry-readiness contract. Every route guard that protects entry into the
// numbered SmokeCraft spine (currently: the Welcome route, S1) must call this
// function rather than re-implementing its own prerequisite check.
//
// Canonical onboarding order (per explicit product requirement):
//   Welcome / Journey Introduction -> Identity Setup -> Venue Selection
//   -> Golden Box Rules -> Mentor Selection -> Session 1 / Session Preparation.
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
// Guest Pass/Enrollment remains a legacy/optional route for returning
// compatibility, but it is no longer the first required onboarding screen.
export function getSmokeCraftEntryReadiness(session, journey) {
  const completedSteps = session?.completedSteps || []
  const enrollmentComplete = completedSteps.includes('enroll')
  const identityComplete = completedSteps.includes('identity')
  const venueComplete = !!(journey?.selectedVenue || journey?.venueSelectionCompleted)
  const goldenBoxComplete = completedSteps.includes('golden-box') || !!journey?.goldenBox?.acknowledged
  const mentorComplete = completedSteps.includes('mentor') || !!journey?.mentor
  const welcomeComplete = completedSteps.includes('entry') || identityComplete || venueComplete || goldenBoxComplete || mentorComplete

  const validationIssues = []
  if (!welcomeComplete) validationIssues.push('welcome_required')
  if (welcomeComplete && !identityComplete) validationIssues.push('identity_required')
  if (welcomeComplete && identityComplete && !venueComplete) validationIssues.push('venue_required')
  if (welcomeComplete && identityComplete && venueComplete && !goldenBoxComplete) validationIssues.push('golden_box_required')
  if (welcomeComplete && identityComplete && venueComplete && goldenBoxComplete && !mentorComplete) validationIssues.push('mentor_required')

  let firstIncompleteRequirement = null
  let redirectRoute = null
  if (!welcomeComplete) {
    firstIncompleteRequirement = 'welcome'
    redirectRoute = '/smokecraft/welcome'
  } else if (!identityComplete) {
    firstIncompleteRequirement = 'identity'
    redirectRoute = '/smokecraft/identity'
  } else if (!venueComplete) {
    firstIncompleteRequirement = 'venue'
    redirectRoute = '/smokecraft/venue-select'
  } else if (!goldenBoxComplete) {
    firstIncompleteRequirement = 'golden-box'
    redirectRoute = '/smokecraft/golden-box'
  } else if (!mentorComplete) {
    firstIncompleteRequirement = 'mentor'
    redirectRoute = '/smokecraft/mentor-selection'
  }

  const readyForWelcome = true
  const readyForSession1 = welcomeComplete && identityComplete && venueComplete && goldenBoxComplete && mentorComplete

  return {
    welcomeComplete,
    enrollmentComplete,
    identityComplete,
    venueComplete,
    goldenBoxComplete,
    mentorComplete,
    readyForWelcome,
    readyForSession1,
    firstIncompleteRequirement,
    redirectRoute,
    validationIssues,
  }
}
