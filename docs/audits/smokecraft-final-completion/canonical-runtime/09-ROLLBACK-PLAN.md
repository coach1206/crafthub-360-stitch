# 09 — Rollback Plan

## Files changed

New: `src/constants/smokecraftScreenManifest.js`, `src/constants/smokecraftComponentRegistry.js`, `src/constants/smokecraftInteractionManifest.js`, `src/services/smokecraft/smokecraftScreenDataSelector.js`, `src/services/smokecraft/smokecraftCompletionService.js`, `src/components/smokecraft/SmokeCraftScreenRenderer.jsx`.

Modified: `src/App.jsx` (1 route rewired), `src/pages/smokecraft/AISummary.jsx` (optional `onBack`/`onComplete` props added, backward compatible).

## Risk profile

Low-to-moderate, scoped to one route. `AISummary.jsx`'s change is additive and backward compatible (falls back to its original behavior with no props passed). The `App.jsx` change swaps one component for another at one route.

## Rollback

`git revert <this pass's commit>` restores the bare `<AISummary />` element and removes the new files (unused by anything else, safe to delete). No data migration, no schema change, no persisted-state shape change.
