# 01 — Root Cause

## The defect

Live production: selecting `START SMOKECRAFT JOURNEY` correctly changed route, but the resulting screen showed stale prior-journey data: learner name `Greg Guy`, prior cigar `Romeo y Julieta 1875`, prior mentor `Carlos Mendoza`, prior progress `63% complete`. The Welcome screen also appeared visually "plain"/fallback-like.

## Root cause: two uncoordinated state stores, only one of them ever reset

SmokeCraft's client state is split across two independent React contexts:

- **`GuestSessionContext`** (`src/context/GuestSessionContext.jsx`, backed by `sessionStorageService.js`'s single `novee_guest_session` localStorage key) — holds `profile.firstName/lastName`, `selectedMentor`, `selectedCraft`, `selectedLevel`, the entire nested `smokeCraft` tasting/scoring object, `goldenBoxProgress`, XP, rank, badges, Passport stamps.
- **`SmokeCraftJourneyContext`** (`src/context/SmokeCraftJourneyContext.jsx`, backed by `sc_journey_v1`) — holds `selectedVenue`, `mentor`, `meetYourCigar`, `selectedCigar`, `scorecard`, `goldenBox`, `activeJourneyId`, etc.

The pre-existing "Start New Journey" flow (`ResumeJourney.jsx`'s `handleConfirmReset`) called `startNewJourney()`, which **only** resets `SmokeCraftJourneyContext`'s fields plus `completedSteps` (session gating). It never touched `GuestSessionContext` at all — meaning `profile.firstName` (learner name), `selectedMentor`, `selectedCraft`, and the nested `smokeCraft` object all silently survived every "Start" action, forever, across every journey a guest ever started on that browser.

Worse: the primary `START SMOKECRAFT JOURNEY` button added in the prior "Start vs. Resume Journey State Correction" pass (for the `!hasProgress` case) didn't call **any** reset function at all — it simply navigated (`navigate(NEW_JOURNEY_START_ROUTE)`), on the reasoning that "nothing recoverable to lose" (true for `completedSteps`/session-gating, since `hasProgress` was already `false`) — but that reasoning didn't account for the *other* stale fields (name/mentor/cigar/etc.) sitting in `GuestSessionContext`, which have no relationship to `completedSteps` and were never reset by that click either.

This confirms: `currentSession`/`completionPercent`/`hasProgress` were all correctly computed (the prior two passes' fixes were correct and necessary), but the actual displayed learner/mentor/cigar/progress values on the Welcome screen come from a completely different, never-reset data source.

## Not a fallback-component defect

`src/App.jsx:343` registers exactly one component for `/smokecraft/welcome` — the real `WelcomeExperience.jsx`, no duplicate route, no fallback alias, no stale bundle. `WelcomeExperience.jsx` contains no hardcoded demo values and no conditional fallback-render branch. The "plain fallback-style" appearance reported is consistent with the same root cause: several of `WelcomeExperience.jsx`'s conditional visual elements (mentor-themed background, venue-specific copy) key off `journey.selectedMentor`/`journey.selectedVenue`, and a stale, unreset `selectedMentor` value pointing at a mentor whose theming assets don't match the newly-intended flow could plausibly produce an inconsistent, flatter-looking render — not a separate registered fallback component.

## Fix

One new shared hook, `useStartNewSmokeCraftJourney` (`src/hooks/useStartNewSmokeCraftJourney.js`), is now the single canonical "start a new journey" action. It:
1. Calls `startNewJourney()` (unchanged — still resets `SmokeCraftJourneyContext`).
2. Calls a new `resetJourneySpecificFields()` on `GuestSessionContext` (new function, `src/context/GuestSessionContext.jsx`) — resets `profile`, `selectedCraft`, `selectedMentor`, `selectedMentorCountry`, `selectedLevel`, `currentSmokecraftStep`, `latestStampId`, `goldenBoxProgress`, and the entire `smokeCraft`/`goldenBox` nested objects to their blank defaults (reusing the same `BLANK_SMOKE_CRAFT`/`BLANK_GOLDEN_BOX` shapes `sessionStorageService.js` already uses for a genuinely new session).
3. Resets `completedSteps` to only `PRESERVED_COMPLETED_STEP_IDS` (`['enroll']`).
4. Is idempotent/double-click-safe via a `useRef` lock.

Explicitly **preserved** (unchanged from the pre-existing, disclosed design decision): XP, rank, badges, Passport stamps/identity, `guestId`, `venueId`, `deviceId`, preferences, and the venue selection stored in `SmokeCraftJourneyContext` (a returning guest at the same physical venue keeps that preference — same as the prior pass's disclosed scope decision).

All Start entry points on `ResumeJourney.jsx` (`START SMOKECRAFT JOURNEY` primary CTA, `START NEW SMOKECRAFT JOURNEY` secondary action, the bottom nav bar's primary action) now call this one function. `SmokeCraft.jsx`'s landing page does not call it directly — its `handleStart()` navigates through the existing entry-layer chain (`getEntryRoute()`), which for a no-progress guest always terminates at `/smokecraft/resume`, where the fixed button above is what actually performs the reset. This was verified by source inspection: `getEntryRoute()` never returns `/smokecraft/welcome` directly.
