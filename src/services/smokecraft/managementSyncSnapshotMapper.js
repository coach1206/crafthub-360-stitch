/**
 * SmokeCraft Management Sync — canonical snapshot mapper (Package D).
 *
 * Maps the existing SmokeCraftJourneyContext `journey` object to a
 * Package B snapshot request payload. Only real, already-collected
 * journey fields are mapped — nothing here is fabricated or inferred.
 * The server continues to control snapshotVersion/payloadHash/
 * createdAt/actor identity; none of those are set here.
 *
 * Fields intentionally NOT mapped (real schema columns, no local source
 * yet): none currently — every snapshot column with a plausible local
 * source is mapped below. `feedbackText`/`returnIntent` remain null
 * until a real feedback-collection screen exists (none does today).
 */
export function mapJourneyToSnapshotPayload(journey) {
  const cigar = journey.selectedCigar || journey.meetYourCigar || null
  const flavors = journey.flavorMemory?.selectedFlavors
    || [
      ...(journey.firstThird?.notes || []),
      ...(journey.secondThird?.notes || []),
      ...(journey.finalThird?.notes || []),
    ]

  return {
    cigarSelection: cigar ? {
      name: cigar.name || null,
      origin: cigar.origin || journey.terroir?.origin || null,
      wrapper: cigar.wrapper || null,
      strength: cigar.strength || null,
      body: cigar.body || null,
    } : null,
    pairingSelection: journey.pairing ? {
      type: journey.pairing.type || null,
      recommendation: journey.pairing.recommendation || null,
    } : null,
    flavorNotes: flavors.length ? { selectedFlavors: flavors } : null,
    mentorSelections: journey.mentor
      ? { mentors: Array.isArray(journey.mentor) ? journey.mentor.map(m => m.name).filter(Boolean) : [journey.mentor.name].filter(Boolean) }
      : null,
    scorecard: journey.scorecard || null,
    rating: typeof journey.scorecard?.overallRating === 'number' ? journey.scorecard.overallRating : null,
    preferences: journey.identity ? {
      experienceLevel: journey.identity.experienceLevel || null,
      focusArea: journey.identity.focusArea || null,
    } : null,
    feedbackText: null, // no real guest-feedback collection screen exists yet
    returnIntent: null, // no real return-intent capture exists yet
    connectionsSaved: Array.isArray(journey.connections?.saved) ? journey.connections.saved.length : 0,
    completionState: journey.sessionCompletion?.completedAt ? 'completed' : 'in_progress',
    passportState: journey.passportStamp ? { stamped: true, stampedAt: journey.passportStamp.stampedAt || null } : null,
    staffHandoffRequested: false, // no real staff-handoff request UI exists yet
  }
}
