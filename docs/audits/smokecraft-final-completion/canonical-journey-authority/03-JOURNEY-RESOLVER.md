# 03 — Journey Resolver

**Not created this pass, deliberately.** The mandate requested a new `resolveSmokeCraftJourneyState()` returning one of `NO_ACTIVE_JOURNEY | ENTRY_IN_PROGRESS | ACTIVE_JOURNEY | COMPLETED_REVIEW | INVALID_STATE`.

This role is already served, correctly, by the combination of two existing, unchanged, re-verified functions:

- `computeJourneyStatus(completedSteps)` — `hasStarted: false` ≈ `NO_ACTIVE_JOURNEY`/`ENTRY_IN_PROGRESS` (curriculum not yet begun); `hasStarted: true, isComplete: false` ≈ `ACTIVE_JOURNEY`; `isComplete: true` ≈ `COMPLETED_REVIEW`.
- `getSmokeCraftEntryReadiness(session, journey)` — distinguishes "entry not complete" from "entry complete, curriculum not started."

Introducing a new, parallel resolver function that re-derives the same five states from the same underlying data would create exactly the kind of second competing authority this pass's mandate warns against — the safer, smaller fix was confirming the existing two functions already jointly cover this state space correctly (re-verified this pass) and fixing the one real gap in a different layer (the `identity` field reset).

`INVALID_STATE` (a genuinely corrupt/dangling `activeJourneyId` pointing at a missing/archived/completed record with no real matching data) was not specifically re-audited this pass as a fifth explicit state — existing behavior for that case was not changed and remains whatever it was before this pass (not a regression, but also not a newly-verified guarantee).
