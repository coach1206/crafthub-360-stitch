# 07 — Rollback Plan

## What changed

- `src/services/sessionStorageService.js` — exports two new pure factory functions (`BLANK_SMOKE_CRAFT_DEFAULTS`, `BLANK_GOLDEN_BOX_DEFAULTS`) wrapping already-existing internal default shapes. No change to any existing exported behavior.
- `src/context/GuestSessionContext.jsx` — adds one new callback, `resetJourneySpecificFields()`, exposed on the context. No existing field, callback, or behavior was modified or removed.
- `src/hooks/useStartNewSmokeCraftJourney.js` — new file, one new hook. No existing file depends on it yet except the two call sites below.
- `src/pages/smokecraft/ResumeJourney.jsx` — `handleConfirmReset()` and the two `!hasProgress`/nav-bar Start actions now call the shared hook instead of ad-hoc inline logic. Net behavior change: these actions now ALSO reset `GuestSessionContext` fields, which they never did before (the actual bug fix).

No database migration, no server route, no other page was touched.

## Rollback procedure, if ever needed

1. `git revert <this pass's commit>` — safe; the new hook and context method have no other dependents.
2. No database rollback needed (no migration ran).
3. Risk profile: reverting would restore the reported live defect (stale data leaking into new journeys) — not a neutral rollback from a product-correctness standpoint, but mechanically safe (no data loss, no broken state).

## Why this is the smallest safe fix

The alternative — building true per-journey-ID-namespaced storage (an array of journeys, not one mutable "current" object) — was evaluated and rejected as disproportionate to the reported defect: the actual bug was that an existing, working reset mechanism (`startNewJourney()`) simply wasn't being called against the other context that also needed resetting. Fixing the call site to invoke both resets together, via one new shared function, is the minimal change that eliminates the defect without restructuring the storage architecture — consistent with this pass's own "smallest safe production fix" instruction.
