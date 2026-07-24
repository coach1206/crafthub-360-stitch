# 06 — Persistence Matrix

| Interaction class | Where it lives | Persists across |
|---|---|---|
| Temporary press state (`pressed` in `SmokeCraftTactileCard`) | Component-local `useState` | Nothing — intentionally resets on every render/unmount, never written to any store |
| Current-session selection (e.g. Terroir's `sectionId`) | Component-local `useState` | Only the current page view; the *fact that a section was viewed* is separately persisted (see next row) |
| Journey-persistent selection (viewed sections, scorecard ratings, mentor choice, venue choice) | `SmokeCraftJourneyContext` (`sc_journey_v1`) or `GuestSessionContext` (`novee_guest_session`) | Refresh, Resume, Back/Forward, second tab (same browser/device) — confirmed unchanged, pre-existing mechanism re-verified by this pass's regression battery |
| Account-level preference (haptics enabled) | `GuestSessionContext.preferences.hapticsEnabled` | Same as journey-persistent selections; explicitly **not** cleared by Start New Journey (a device/account preference, not journey data) — confirmed by reading `useStartNewSmokeCraftJourney.js`'s reset scope, unchanged this pass |
| Review-only state (viewing a completed session) | Read from the same journey-persistent fields, rendered without re-triggering award/persistence calls | N/A — review never writes |

## Start New Journey reset (re-verified, not newly changed this pass)

`useStartNewSmokeCraftJourney()` (existing, unchanged) resets `completedSteps`, `selectedCraft`, `selectedMentor`, `selectedLevel`, and the entire `smokeCraft`/`goldenBox` nested objects on `GuestSessionContext`, plus `SmokeCraftJourneyContext`'s per-session fields (`terroir`, `passportStamp`, `scorecard`, etc.) and mints a new `activeJourneyId`. This means every journey-persistent tactile selection this pass's audited screens write (viewed Terroir sections, Meet Your Cigar selections, etc.) is cleared by Start New Journey by construction — those fields live inside the same objects the existing reset already clears, verified by cross-referencing the field names against `useStartNewSmokeCraftJourney.js`'s reset payload.

## Update (final closeout pass)

Three new persisted fields, all confirmed to live inside objects the existing Start New Journey reset already clears (cross-referenced against `useStartNewSmokeCraftJourney.js`'s reset payload and `SmokeCraftJourneyContext.jsx`'s reset function, both unchanged):

- `journey.welcomeOpenedPanels` (top-level journey field, same reset path as `welcomeViewedAt`/`currentScreenId`, which the existing reset already zeroes)
- `journey.cutToastLight.lightingTutorialProgress` — `cutToastLight` is explicitly set to `null` by the existing reset (confirmed by direct source read, `SmokeCraftJourneyContext.jsx` line ~473)
- `journey.mentorCommentary.appliedAdvice` — `mentorCommentary` is part of the same per-session journey fields cleared alongside `terroir`/`passportStamp`/etc.

Live-verified this pass: Lighting Tutorial progress survives a real page refresh (`persisted: true` in the captured proof).

## Cross-learner isolation

Unchanged, pre-existing architecture: all state is keyed by the single active `GuestSessionContext`/`SmokeCraftJourneyContext` in `localStorage`, which is per-browser-profile — a second learner on a different device/profile has entirely separate storage. Not independently re-tested with two live browser profiles this pass (time-scoped out); this is the same architecture already exercised by the Phase 9 regression suite's cross-learner checks (part of this pass's required battery, re-run and passing).
