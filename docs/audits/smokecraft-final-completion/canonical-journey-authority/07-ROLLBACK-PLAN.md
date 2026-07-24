# 07 — Rollback Plan

## Files changed

`src/context/SmokeCraftJourneyContext.jsx` (1 field added to `startNewJourney`'s reset payload: `identity: null`), `src/pages/smokecraft/ResumeJourney.jsx` (redirect effect + no-flash guard added, dead inline "No Active" branch removed).

## Risk profile

Very low. The identity fix is a single added field in an existing reset function — cannot affect any guest whose `journey.identity` was already `null` (the common case), and for guests who did have a real identity, clearing it on Start New Journey is unambiguously correct (a new journey should not inherit a name typed for a different journey). The Resume fix changes presentation only (redirect vs. inline render) for a state that already correctly computed as "no progress" — no computation logic changed.

## Rollback

`git revert <this pass's commit>` cleanly restores both files. No data migration, no schema change.
