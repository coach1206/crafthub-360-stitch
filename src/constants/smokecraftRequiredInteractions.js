/**
 * SmokeCraft Required-Interaction Manifest — Discovery Package.
 *
 * The first canonical, repository-backed definition of what educational
 * interaction each of the 21 primary curriculum sessions is required to
 * contain. Built by direct source inspection of every session component
 * (src/pages/smokecraft/*.jsx), the shared completion path
 * (src/context/GuestSessionContext.jsx's `awardSessionRewards`), and the
 * server-side completion authority (server/controllers/playerStateController.js
 * `handleCompleteSession` + server/services/smokecraft/playerStateService.js
 * `completeSession`) — not guessed, not inferred from route names alone.
 *
 * REQUIRED-INTERACTION DEFINITION (this pass's canonical definition,
 * per mandate section 4): a required interaction is a meaningful player
 * action — assessment, classification, placement, matching, ordering,
 * hotspot identification, construction inspection, flavor/pairing
 * decision, or mentor-guided response — whose OUTCOME is evaluated and
 * whose correctness/completeness is verified server-side before session
 * completion and XP are granted. Reading text, watching media, opening a
 * modal, clicking Next/Complete, or moving a UI control that is never
 * evaluated server-side does NOT qualify by itself, even if it captures
 * real player input into client or server state.
 *
 * KEY ARCHITECTURAL FINDING (verified by source read, not assumed):
 * `awardSessionRewards()` / `completeSessionOnServer()` /
 * `handleCompleteSession()` together form ONE real, idempotent,
 * server-authoritative completion+XP mechanism used by EVERY one of the
 * 21 sessions — XP amounts are looked up server-side from
 * `sessionRewardTable.js` by `sessionId`, never client-supplied, so XP
 * itself cannot be spoofed or duplicated for any session. However, this
 * shared endpoint accepts only `sessionId` — it has no parameter for,
 * and therefore cannot evaluate, the player's actual interaction
 * answer/selection. So the "session completes and awards XP safely"
 * property holds universally, but the STRICTER "the required
 * interaction's correctness is what gates that completion" property
 * does NOT hold for any session that has no OTHER, dedicated,
 * answer-evaluating endpoint of its own.
 *
 * Only 3 of the 21 sessions have such a dedicated, answer-evaluating,
 * server-authoritative endpoint distinct from the generic completion
 * call: Session 11/22 (real pairing engine — scores/ranks a real
 * cigar+beverage combination) and Session 14 (real mentor-guidance
 * service — serves dynamic, guest-activity-derived content, verified
 * to honestly fall back rather than fabricate). Session 23 has a
 * dedicated GET status endpoint but no evaluated submission. The
 * remaining 17 sessions capture real player input (selections, ratings,
 * flavor-wheel taps) but store it ONLY in local `GuestSessionContext`
 * state (an already-approved non-authoritative cache elsewhere in this
 * app) — never submitted to any endpoint that validates or scores it —
 * before the same generic, interaction-agnostic completion call fires.
 */

export const INTERACTION_TYPES = Object.freeze([
  'orientation-dashboard', 'device-simulation-selection', 'content-exploration',
  'exploration-with-selection', 'construction-classification', 'technique-selection',
  'stepwise-instructional', 'tasting-rating-capture', 'flavor-wheel-selection',
  'pairing-decision-and-scoring', 'mentor-guided-response', 'topic-exploration',
  'multi-category-rating', 'rule-based-summary-review', 'status-gated-certification',
  'checklist-review', 'reward-display', 'final-recommendation-display',
])

export const GAP_CLASSIFICATIONS = Object.freeze([
  'COMPLETE_AND_VERIFIED', 'COMPLETE_BUT_UNTESTED', 'PARTIAL', 'VISUAL_ONLY',
  'WRONG_INTERACTION_TYPE', 'MISSING', 'BLOCKED', 'DUPLICATED_OR_CONFLICTING',
])

const SHARED_COMPLETION = {
  canonicalApi: 'POST /api/smokecraft/player-state/sessions/:sessionId/complete',
  canonicalService: 'server/services/smokecraft/playerStateService.js#completeSession',
  canonicalPersistence: 'smokecraft_session_completions (guest_reference, session_id unique)',
  progressionRequired: true,
  persistenceRequired: true,
}

export const REQUIRED_INTERACTIONS = Object.freeze([
  {
    sessionId: 'entry', sessionNumber: 1, phaseId: 1,
    route: '/smokecraft/welcome', title: 'Welcome to Today’s Experience',
    learningObjective: 'Orient the player to the session flow and today’s cigar/venue/mentor context.',
    requiredInteractionId: 'S1-ORIENTATION', requiredInteractionType: 'orientation-dashboard',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/WelcomeExperience.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'COMPLETE_AND_VERIFIED',
    gapClassification: 'COMPLETE_AND_VERIFIED',
    notes: 'Orientation screen — no assessment is educationally appropriate here; real dashboard content confirmed by prior captured-content audit.',
  },
  {
    sessionId: 'humidor-match', sessionNumber: 2, phaseId: 1,
    route: '/smokecraft/humidor-match', title: 'Choose Your Cigar',
    learningObjective: 'Apply humidor environment knowledge (temp/humidity/seal/airflow) to select an appropriate cigar.',
    requiredInteractionId: 'S2-HUMIDOR-SELECTION', requiredInteractionType: 'device-simulation-selection',
    completionRequired: true, scoringRequired: true, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/HumidorMatch.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'VISUAL_ONLY',
    gapClassification: 'VISUAL_ONLY',
    notes: 'Real device-simulation controls and cigar picker exist (confirmed by prior captured-content audit) and write to local GuestSessionContext state only (setHumidorMatchSelection) — no server endpoint evaluates whether the selection was appropriate before awardSessionRewards() fires.',
  },
  {
    sessionId: 'meet-your-cigar', sessionNumber: 3, phaseId: 1,
    route: '/smokecraft/meet-your-cigar', title: 'Meet Your Cigar',
    learningObjective: 'Explore the selected cigar’s brand/blend/wrapper/binder/filler/factory profile.',
    requiredInteractionId: 'S3-PROFILE-EXPLORATION', requiredInteractionType: 'content-exploration',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/MeetYourCigar.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'PARTIAL',
    gapClassification: 'PARTIAL',
    notes: '7 real content sections gated behind clicks (confirmed by prior captured-content audit); exploration-required but engagement is not verified server-side (client can complete without opening all 7 sections).',
  },
  {
    sessionId: 'terroir', sessionNumber: 4, phaseId: 1,
    route: '/smokecraft/terroir', title: 'Terroir',
    learningObjective: 'Understand how country/region/soil/climate shape a cigar’s character.',
    requiredInteractionId: 'S4-TERROIR-EXPLORATION', requiredInteractionType: 'content-exploration',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/Terroir.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'PARTIAL',
    gapClassification: 'PARTIAL',
    notes: 'Same pattern as Session 3 — real explorable sections, no server-verified engagement gate.',
  },
  {
    sessionId: 'format', sessionNumber: 5, phaseId: 1,
    route: '/smokecraft/format', title: 'Construction Inspection',
    learningObjective: 'Classify cigar shape/size (Robusto/Toro/Churchill/Corona/Gordo/Torpedo) and its effect on burn/body.',
    requiredInteractionId: 'S5-SHAPE-CLASSIFICATION', requiredInteractionType: 'construction-classification',
    completionRequired: true, scoringRequired: true, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/Format.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'VISUAL_ONLY',
    gapClassification: 'VISUAL_ONLY',
    notes: 'Real shape picker (setSmokeCraftFormat, local state only) — no server-side evaluation of the classification.',
  },
  {
    sessionId: 'cut-toast-light', sessionNumber: 6, phaseId: 1,
    route: '/smokecraft/cut-toast-light', title: 'Choose Your Cut',
    learningObjective: 'Select an appropriate cut style (Straight/V-Cut/Punch) for the chosen cigar.',
    requiredInteractionId: 'S6-CUT-SELECTION', requiredInteractionType: 'technique-selection',
    completionRequired: true, scoringRequired: true, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/CutToastLight.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'VISUAL_ONLY',
    gapClassification: 'VISUAL_ONLY',
    notes: 'Real cut picker + "Learn Why" disclosure (confirmed by prior captured-content audit) — selection is local-only, not server-evaluated.',
  },
  {
    sessionId: 'lighting-tutorial', sessionNumber: 7, phaseId: 1,
    route: '/smokecraft/lighting-tutorial', title: 'Lighting Tutorial',
    learningObjective: 'Learn the correct step-by-step lighting technique.',
    requiredInteractionId: 'S7-LIGHTING-STEPS', requiredInteractionType: 'stepwise-instructional',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/LightingTutorial.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'COMPLETE_AND_VERIFIED',
    gapClassification: 'COMPLETE_AND_VERIFIED',
    notes: 'Real, substantive 8-step tutorial + Mentor Tip (strongest captured educational prose per prior audit) — an instructional-technique session; no assessment is educationally required beyond the walkthrough itself.',
  },
  {
    sessionId: 'first-third', sessionNumber: 8, phaseId: 2,
    route: '/smokecraft/first-third', title: 'First Draw',
    learningObjective: 'Capture and evaluate real tasting observations (aroma/draw/body/flavor/burn/ash) for the first third.',
    requiredInteractionId: 'S8-TASTING-CAPTURE', requiredInteractionType: 'tasting-rating-capture',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/FirstThird.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'PARTIAL',
    gapClassification: 'PARTIAL',
    notes: 'Real rating controls exist and record a genuine "complete"/"partial" truth flag (setFirstThirdTasting, verified by source read) but persist to LOCAL GuestSessionContext state only, never to the real server-authoritative smokecraft_tasting_drafts/submitTastingCompletion path already used elsewhere in this app (e.g. MiniTasting.jsx) — a real, available architecture this session does not use.',
  },
  {
    sessionId: 'flavor-memory', sessionNumber: 10, phaseId: 2,
    route: '/smokecraft/flavor-memory', title: 'Flavor Memory Exercise',
    learningObjective: 'Select flavor-wheel notes and intensity/body/strength ratings for the cigar tasted.',
    requiredInteractionId: 'S10-FLAVOR-WHEEL', requiredInteractionType: 'flavor-wheel-selection',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/FlavorMemory.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'VISUAL_ONLY',
    gapClassification: 'VISUAL_ONLY',
    notes: 'Real flavor-wheel/slider interaction, local state only, same pattern as Session 8.',
  },
  {
    sessionId: 'pairing-lab', sessionNumber: 11, phaseId: 2,
    route: '/smokecraft/pairing-lab', title: 'Suggested Pairings',
    learningObjective: 'Apply pairing theory (complement/contrast/balance) to select and defend a real beverage pairing.',
    requiredInteractionId: 'S11-PAIRING-DECISION', requiredInteractionType: 'pairing-decision-and-scoring',
    completionRequired: true, scoringRequired: true, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/PairingLab.jsx',
    canonicalApi: 'server/routes/pairingEngineRoutes.js', canonicalService: 'server/services/smokecraft/pairingEngineService.js',
    canonicalPersistence: 'smokecraft_pairing_saves / smokecraft_pairing_save_revisions',
    progressionRequired: true, persistenceRequired: true,
    testReferences: ['verify-smokecraft-hf5b1-pairing-engine.mjs (36/36)', 'scripts/validateSmokecraftPairingEngineAuthority.mjs (PASS)'],
    proofReferences: ['public/proof/smokecraft-post-humidor-audit/09-pairing-engine-audit.md'],
    implementationStatus: 'COMPLETE_AND_VERIFIED',
    gapClassification: 'COMPLETE_AND_VERIFIED',
    notes: 'Real, server-authoritative rule-based pairing engine with real scoring/explanation/persistence — confirmed complete in two prior audit passes.',
  },
  {
    sessionId: 'second-third', sessionNumber: 12, phaseId: 3,
    route: '/smokecraft/second-third', title: 'Flavor Evolution',
    learningObjective: 'Capture tasting-evolution observations for the second third.',
    requiredInteractionId: 'S12-TASTING-CAPTURE', requiredInteractionType: 'tasting-rating-capture',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/SecondThird.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'PARTIAL',
    gapClassification: 'PARTIAL',
    notes: 'Same pattern as Session 8 (setSecondThirdTasting, local state only).',
  },
  {
    sessionId: 'mentor-commentary', sessionNumber: 14, phaseId: 3,
    route: '/smokecraft/mentor-commentary', title: 'Mentor Commentary',
    learningObjective: 'Receive real, activity-derived mentor guidance on the session so far.',
    requiredInteractionId: 'S14-MENTOR-GUIDANCE', requiredInteractionType: 'mentor-guided-response',
    completionRequired: true, scoringRequired: false, mentorRequired: true,
    canonicalComponent: 'src/pages/smokecraft/MentorCommentary.jsx',
    canonicalApi: 'server/routes/mentorGuidanceRoutes.js',
    canonicalService: 'server/services/smokecraft (mentor guidance service)',
    canonicalPersistence: 'mentor guidance / activity-derived state (Holistic Fix 5B-2)',
    progressionRequired: true, persistenceRequired: true,
    testReferences: ['verify-smokecraft-hf5b2a-mentor-guidance.mjs (21/21)', 'scripts/validateSmokecraftMentorGuidanceAuthority.mjs (PASS)'],
    proofReferences: ['public/proof/smokecraft-post-humidor-audit/08-mentor-engine-audit.md'],
    implementationStatus: 'COMPLETE_AND_VERIFIED',
    gapClassification: 'COMPLETE_AND_VERIFIED',
    notes: 'Real, server-owned, activity-derived guidance with an honest low-signal fallback for a fresh guest — confirmed complete in two prior audit passes. Correctly thin (no interaction beyond Back/Continue) when no mentor is selected — an honest empty state, not a defect.',
  },
  {
    sessionId: 'knowledge-drop', sessionNumber: 15, phaseId: 3,
    route: '/smokecraft/knowledge-drop', title: 'Knowledge Drop',
    learningObjective: 'Explore 4 educational topics (Tobacco/Fermentation/Aging/Factory Story).',
    requiredInteractionId: 'S15-TOPIC-EXPLORATION', requiredInteractionType: 'topic-exploration',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/KnowledgeDrop.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'PARTIAL',
    gapClassification: 'PARTIAL',
    notes: 'Real topic-selection UI (confirmed by prior captured-content audit); no quiz/assessment found in source, and no server-verified engagement gate. The prior audit’s keyword scan found the word "Knowledge" here but not evidence of an evaluated assessment.',
  },
  {
    sessionId: 'final-third', sessionNumber: 16, phaseId: 4,
    route: '/smokecraft/final-third', title: 'Flavor Finish',
    learningObjective: 'Capture final-third tasting observations (aroma/intensity/burn/aftertaste).',
    requiredInteractionId: 'S16-TASTING-CAPTURE', requiredInteractionType: 'tasting-rating-capture',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/FinalThird.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'PARTIAL',
    gapClassification: 'PARTIAL',
    notes: 'Same pattern as Sessions 8/12 (setFinalThirdTasting, local state only).',
  },
  {
    sessionId: 'scorecard', sessionNumber: 19, phaseId: 5,
    route: '/smokecraft/scorecard', title: 'Rate Every Category',
    learningObjective: 'Rate the cigar across 6 categories (Appearance/Construction/Draw/Burn/Flavor/Pairing Match) with real per-category guidance.',
    requiredInteractionId: 'S19-MULTI-CATEGORY-RATING', requiredInteractionType: 'multi-category-rating',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/Scorecard.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'PARTIAL',
    gapClassification: 'PARTIAL',
    notes: 'The most substantive of the rating-capture sessions (real per-category guidance text, e.g. "Airflow resistance and ease" for Draw) — still local-state-only; no dedicated server endpoint evaluates or persists the ratings independent of the generic session-completion call.',
  },
  {
    sessionId: 'ai-summary', sessionNumber: 21, phaseId: 6,
    route: '/smokecraft/ai-summary', title: 'Session Summary',
    learningObjective: 'Review a rule-based (explicitly non-AI) summary of the session’s captured data.',
    requiredInteractionId: 'S21-SUMMARY-REVIEW', requiredInteractionType: 'rule-based-summary-review',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/AISummary.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'COMPLETE_AND_VERIFIED',
    gapClassification: 'COMPLETE_AND_VERIFIED',
    notes: 'A review/recap session by design, not an assessment — Accept/Dismiss on each real summary panel is the appropriate interaction; honestly disclosed as rule-based, not AI-generated.',
  },
  {
    sessionId: 'pairing-recommendations', sessionNumber: 22, phaseId: 6,
    route: '/smokecraft/pairing-recommendations', title: 'Personalized Pairing Recommendations',
    learningObjective: 'Apply pairing theory to a personalized, scored recommendation set and select/save one.',
    requiredInteractionId: 'S22-PAIRING-DECISION', requiredInteractionType: 'pairing-decision-and-scoring',
    completionRequired: true, scoringRequired: true, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/PairingRecommendations.jsx',
    canonicalApi: 'server/routes/pairingEngineRoutes.js', canonicalService: 'server/services/smokecraft/pairingEngineService.js',
    canonicalPersistence: 'smokecraft_pairing_saves / smokecraft_pairing_save_revisions',
    progressionRequired: true, persistenceRequired: true,
    testReferences: ['verify-smokecraft-hf5b1-pairing-engine.mjs (36/36)', 'scripts/validateSmokecraftPairingEngineAuthority.mjs (PASS)'],
    proofReferences: ['public/proof/smokecraft-post-humidor-audit/09-pairing-engine-audit.md'],
    implementationStatus: 'COMPLETE_AND_VERIFIED',
    gapClassification: 'COMPLETE_AND_VERIFIED',
    notes: 'Same real pairing engine as Session 11 — real generated compatibility reasoning, view-alternate/save-pairing actions confirmed.',
  },
  {
    sessionId: 'passport-stamp', sessionNumber: 23, phaseId: 6,
    route: '/smokecraft/passport-stamp', title: 'Passport Stamp Animation',
    learningObjective: 'Certify completion of the tasting journey with a real Passport stamp record.',
    requiredInteractionId: 'S23-STAMP-CERTIFICATION', requiredInteractionType: 'status-gated-certification',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/PassportStamp.jsx',
    canonicalApi: 'GET /api/smokecraft/passport-stamp/status/:sessionId (status read only)',
    canonicalService: 'server/services/smokecraft (passport stamp status)',
    canonicalPersistence: 'passport stamp claim record (claim eligibility requires session 24 completion, a documented pre-existing design sequencing quirk)',
    progressionRequired: true, persistenceRequired: true,
    testReferences: [], proofReferences: [],
    implementationStatus: 'PARTIAL',
    gapClassification: 'PARTIAL',
    notes: 'Real GET status endpoint exists and is called live; the claim UI itself is gated on a later session’s completion by pre-existing design (documented in the prior educational-completeness audit as a genuine, not-this-pass-introduced quirk) — not independently re-verified this pass beyond confirming the status call is real.',
  },
  {
    sessionId: 'final-review', sessionNumber: 24, phaseId: 6,
    route: '/smokecraft/final-review', title: 'Completed Scorecard',
    learningObjective: 'Review a checklist-style recap of the completed journey.',
    requiredInteractionId: 'S24-RECAP-REVIEW', requiredInteractionType: 'checklist-review',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/FinalReview.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'COMPLETE_AND_VERIFIED',
    gapClassification: 'COMPLETE_AND_VERIFIED',
    notes: 'A recap/summary session by design, not new teaching — Continue-only is the appropriate interaction for this role.',
  },
  {
    sessionId: 'rewards', sessionNumber: 25, phaseId: 6,
    route: '/smokecraft/rewards', title: 'Rewards and XP (serves Session 26 Achievements)',
    learningObjective: 'Review earned XP, rank milestones, and achievement criteria tied to real completed actions.',
    requiredInteractionId: 'S25-REWARD-REVIEW', requiredInteractionType: 'reward-display',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/Rewards.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'COMPLETE_BUT_UNTESTED',
    gapClassification: 'COMPLETE_BUT_UNTESTED',
    notes: 'A review/claim session by design; Claim buttons and tab switching are real, but this pass did not independently verify that displayed totals are read from the live server player-state (vs. locally-computed constants via smokecraftRewards.js) — flagged for the next audit rather than asserted either way.',
  },
  {
    sessionId: 'session-complete', sessionNumber: 27, phaseId: 6,
    route: '/smokecraft/session-complete', title: 'Recommended Next Journey',
    learningObjective: 'Receive a real, data-driven recommendation for the next journey based on completed session data.',
    requiredInteractionId: 'S27-NEXT-JOURNEY-SELECTION', requiredInteractionType: 'final-recommendation-display',
    completionRequired: true, scoringRequired: false, mentorRequired: false,
    canonicalComponent: 'src/pages/smokecraft/SessionComplete.jsx',
    ...SHARED_COMPLETION,
    testReferences: [], proofReferences: [],
    implementationStatus: 'COMPLETE_AND_VERIFIED',
    gapClassification: 'COMPLETE_AND_VERIFIED',
    notes: 'Genuine personalization tied to real completed-session data (confirmed by prior captured-content audit); Start Journey/Select/Explore All Journeys are real navigation actions appropriate to this closing session.',
  },
])

export function getRequiredInteraction(sessionNumber) {
  return REQUIRED_INTERACTIONS.find(r => r.sessionNumber === sessionNumber) || null
}
