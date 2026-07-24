// Canonical Runtime pass — interaction manifest for canonical-runtime-
// migrated screens. Scope note (disclosed): only 'session-21' (AI Summary)
// is populated for real this pass, matching the one screen actually
// migrated through SmokeCraftScreenRenderer. Not a claim that other
// screens lack interaction manifests — see the Tactile/Haptic Completion
// passes' own per-screen interaction audits for those, a separate,
// already-real body of work this pass does not duplicate.
export const SMOKECRAFT_INTERACTION_MANIFEST = {
  'session-21': {
    interactiveRegions: [
      {
        id: 'section-review',
        label: 'Expand/Accept/Dismiss each summary section',
        required: false,
        persistenceKey: 'journey.aiSummary.sectionStates',
        completionDependency: false,
        hapticLevel: 'light',
        accessibilityLabel: 'Accept or dismiss insight',
        goldenBoxRelevance: 'Accepted insights inform the learner\'s later Golden Box blend narrative, though not a hard completion gate.',
      },
    ],
  },
}

export function getInteractionManifest(screenId) {
  return SMOKECRAFT_INTERACTION_MANIFEST[screenId] || null
}
