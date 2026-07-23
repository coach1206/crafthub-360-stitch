# 01 — Entry Readiness Contract

## `getSmokeCraftEntryReadiness(session, journey)` — `src/constants/smokecraftEntryReadiness.js`

The one canonical, shared function every route guard protecting entry into the numbered SmokeCraft spine must call.

```js
{
  enrollmentComplete,   // session.completedSteps.includes('enroll')
  identityComplete,     // === enrollmentComplete (see disclosure below)
  venueComplete,        // !!(journey.selectedVenue || journey.venueSelectionCompleted)
  mentorComplete,       // !!journey.mentor (reported, does NOT gate readyForWelcome — see disclosure below)
  readyForWelcome,      // enrollmentComplete && venueComplete
  firstIncompleteRequirement, // 'enrollment' | 'venue' | null
  redirectRoute,        // '/smokecraft/enroll' | '/smokecraft/venue-select' | null
  validationIssues,     // ['enrollment_required', 'venue_required']
}
```

## Disclosed scope decisions (source-verified, not assumed)

**Identity has no separate completion flag anywhere in the real architecture.** `/smokecraft/identity` (`ENTRY_LAYER_SCREENS`'s "Personal Dashboard") is a reachable dashboard once enrolled — there is no distinct "identity form" a guest fills out and no `identityComplete`-equivalent field anywhere in `GuestSessionContext` or `SmokeCraftJourneyContext`. `identityComplete` is therefore derived as "true once enrolled," not a fabricated new gate requiring new state to track.

**Mentor Selection is a real, existing, already-approved route — but it is NOT a pre-Welcome prerequisite in the current architecture.** `session.js`'s `SUPPORTING_MODULES` registers `/smokecraft/mentor-selection` with `requires: 'entry'` — i.e., it is reachable only *after* Session 1 (Welcome) is complete, not before it. Confirmed further by `Mentor.jsx`'s own Continue button, which navigates to `/smokecraft/seed-soil` (a further post-Welcome supporting module) — mentor selection was never wired to lead into Welcome/S1 in the first place. Restructuring this (moving mentor-selection's guard to pre-Welcome, and rewiring its own and `SeedSoil.jsx`'s navigation targets) would be a genuine architecture change to an already-approved, already-tested supporting-module chain — out of this pass's safe scope (a prerequisite-*bypass* fix, not a prerequisite-*reordering* change). `mentorComplete` is reported on the contract for completeness/future use but intentionally does not gate `readyForWelcome`.

## Consumer

`src/components/smokecraft/SmokeCraftSessionGuard.jsx` — every `sessionNumber`-guarded route (the entire numbered 27-session spine, starting at S1/Welcome) now calls this contract and redirects to `redirectRoute` when `!readyForWelcome`, before rendering any protected content (see `04-NO-FLASH-VERIFICATION.md`). Because sessions 2–27 already transitively require session 1 complete (`isSessionUnlocked`'s existing chain logic), protecting S1 alone closes the bypass for the entire spine — no per-route duplication was needed.
