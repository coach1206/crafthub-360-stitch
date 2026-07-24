// Canonical Runtime pass — one completion function migrated/new screens
// call instead of independently invoking awardSessionRewards() + navigate()
// inline. Centralizes: validate the screen is real, persist once, award XP
// once (idempotency delegated to the existing, unchanged, already-correct
// awardSessionRewards no-op-if-already-completed guard), and resolve the
// canonical next route from the manifest rather than a hardcoded string.
import { getManifestEntry } from '../../constants/smokecraftScreenManifest.js'

/**
 * @param {string} screenId
 * @param {{ awardSessionRewards: Function, session: object }} ctx
 * @returns {{ nextRoute: string|null, completionKey: string|null }}
 */
export function completeSmokeCraftScreen(screenId, { awardSessionRewards, session } = {}) {
  const entry = getManifestEntry(screenId)
  if (!entry) {
    throw new Error(`completeSmokeCraftScreen: unknown screenId "${screenId}" — refusing to guess a route.`)
  }

  // Reject direct-route completion without prerequisites — mirrors
  // SmokeCraftSessionGuard's own unlock check rather than re-implementing it.
  const completedSteps = session?.completedSteps || []
  const prereqsMet = entry.prerequisites.every(prereqId => {
    const prereq = getManifestEntry(prereqId)
    return prereq?.completionKey ? completedSteps.includes(prereq.completionKey) : true
  })
  if (!prereqsMet) {
    throw new Error(`completeSmokeCraftScreen: prerequisites not met for "${screenId}".`)
  }

  if (entry.completionKey && typeof awardSessionRewards === 'function') {
    // Idempotent — awardSessionRewards() already no-ops if this id is
    // already in completedSteps (unchanged, pre-existing mechanism).
    awardSessionRewards(entry.completionKey)
  }

  // Resolve the canonical next route. Merged sessions (S8/S9, S12/S13,
  // S16/S17/S18, S19/S20, S25/S26 — see `mergedInto`/`sharedComponent` in
  // session.js) are separate manifest entries that share ONE real
  // route/component. Following nextScreenId naively from the primary entry
  // would land on a merged sibling that points back at the same route — a
  // self-loop. So we walk forward past any entry whose route matches the
  // completed screen's route, landing on the next genuinely-different screen.
  let nextEntry = entry.nextScreenId ? getManifestEntry(entry.nextScreenId) : null
  const guard = new Set([screenId])
  while (nextEntry && nextEntry.route && nextEntry.route === entry.route && !guard.has(nextEntry.screenId)) {
    guard.add(nextEntry.screenId)
    nextEntry = nextEntry.nextScreenId ? getManifestEntry(nextEntry.nextScreenId) : null
  }
  return {
    nextRoute: nextEntry?.route || null,
    completionKey: entry.completionKey,
  }
}
