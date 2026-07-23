import { useCallback, useRef } from 'react'
import { useGuestSession } from '../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../context/SmokeCraftJourneyContext.jsx'

// Emergency Live Remediation: Clean Start, State Reset, and Entry-Sequence
// Restoration pass — the ONE canonical "start a truly new SmokeCraft
// journey" action. Every Start entry point (landing page's primary CTA,
// Resume page's primary CTA when no valid active journey exists, Resume
// page's "Start New SmokeCraft Journey" secondary action, and the
// completed-journey "Start New SmokeCraft Journey" action) must call this
// hook's returned function instead of independently re-implementing reset
// logic or, worse, only navigating without resetting anything.
//
// Root cause this fixes: two separate, uncoordinated state stores exist
// (GuestSessionContext — profile/mentor/cigar/smokeCraft/XP — and
// SmokeCraftJourneyContext — venue/mentor/cigar/scorecard/goldenBox/etc, a
// mostly-overlapping but independently-mutated shadow of the same
// concepts). The pre-existing "Start New Journey" flow only reset
// SmokeCraftJourneyContext + completedSteps; it never touched
// GuestSessionContext at all. A guest who had ever completed
// enrollment/mentor/cigar selection in ANY prior journey would see that old
// name/mentor/cigar resurface on every subsequent "Start" click, even
// though completedSteps (and therefore currentSession/completionPercent)
// were correctly reset — because the reset never reached the store where
// that display data actually lives.
export const PRESERVED_COMPLETED_STEP_IDS = ['enroll']

export function useStartNewSmokeCraftJourney() {
  const { update, resetJourneySpecificFields } = useGuestSession()
  const { journey, startNewJourney } = useSmokeCraftJourney()
  const lock = useRef(false)

  const startNewSmokeCraftJourney = useCallback(({ firstRoute } = {}) => {
    // Double-click / retry safety — idempotent no-op while a reset is
    // already in flight from a prior click in the same render cycle.
    if (lock.current) return firstRoute || '/smokecraft/welcome'
    lock.current = true

    const archiveEntry = journey.sessionCompletion || journey.activeJourneyId
      ? {
          journeyId: journey.activeJourneyId,
          cigarName: journey.selectedCigar?.name || null,
          completedAt: journey.sessionCompletion?.completedAt || Date.now(),
        }
      : null

    // 1. Mint a new journey ID, archive the prior one, reset every
    //    SmokeCraftJourneyContext journey-content field (mentor, cigar,
    //    scorecard, Golden Box, Packaging Studio association, etc).
    startNewJourney(archiveEntry)

    // 2. Reset the sibling GuestSessionContext fields the prior flow never
    //    touched (learner name, selectedMentor, selectedCraft, the entire
    //    smokeCraft nested object, goldenBoxProgress).
    resetJourneySpecificFields()

    // 3. Reset session-gating completedSteps to only the account-level,
    //    non-journey-specific ids (enrollment). XP/rank/badges/Passport
    //    stamps are cumulative account state and are deliberately NOT
    //    reset here — same disclosed design decision as the pre-existing
    //    "Start New Journey" flow.
    update(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.filter(id => PRESERVED_COMPLETED_STEP_IDS.includes(id)),
      currentSmokecraftStep: null,
    }))

    setTimeout(() => { lock.current = false }, 500)
    return firstRoute || '/smokecraft/welcome'
  }, [journey, startNewJourney, resetJourneySpecificFields, update])

  return { startNewSmokeCraftJourney }
}
