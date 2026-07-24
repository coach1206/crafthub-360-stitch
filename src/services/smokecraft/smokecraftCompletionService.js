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

  const nextEntry = entry.nextScreenId ? getManifestEntry(entry.nextScreenId) : null
  return {
    nextRoute: nextEntry?.route || null,
    completionKey: entry.completionKey,
  }
}
