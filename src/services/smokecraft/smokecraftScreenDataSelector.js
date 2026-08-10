// Canonical Runtime pass — the one selector new/migrated screens should
// read visible journey data through, instead of reaching directly into
// GuestSessionContext/SmokeCraftJourneyContext fields ad hoc.
//
// Pure function (no hooks) so it is trivially unit-testable and so it can
// be called from both React components (passing the already-subscribed
// `session`/`journey` objects from the existing contexts) and test scripts
// without a React tree. This does not replace GuestSessionContext/
// SmokeCraftJourneyContext — it is a read-only projection over them,
// consistent with the finding in 02-COMPETING-DEFINITIONS.md that no new
// storage authority was needed, only a shared read shape.
export function getSmokeCraftScreenData(screenId, { session, journey } = {}) {
  const s = session || {}
  const j = journey || {}

  const account = {
    xp: s.xp ?? 0,
    rank: s.rank ?? 'Novice',
    badges: s.badges ?? [],
    passport: s.passport ?? null,
    hapticsEnabled: s.preferences?.hapticsEnabled ?? s.hapticsEnabled ?? true,
  }

  const journeyData = {
    learnerName: j.identity?.preferredName || j.identity?.fullName || null,
    venue: j.selectedVenue || null,
    cigar: j.selectedCigar || null,
    mentor: Array.isArray(j.mentor) ? j.mentor[0] : (j.mentor || null),
    knowledgeLevel: j.identity?.experienceLevel || null,
    activeJourneyId: j.activeJourneyId || null,
    completedSteps: s.completedSteps || [],
    goldenBox: j.goldenBox || null,
  }

  const history = {
    previousCompletedJourneys: j.previousCompletedJourneys || [],
  }

  return { screenId, account, journey: journeyData, history }
}
