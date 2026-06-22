# SmokeCraft Phases 7-10 — Cut/Toast/Light & Three-Third Tasting

## Coverage note: how Phases 7-10 connect to the rest of the protocol

- **Phase 5 (Gold Box Rules)** — unaffected; reached earlier in the flow, no shared state with Phases 7-10.
- **Phase 6 (Humidor Match)** — unaffected; `Start Session`/`Request Purchase` still navigate into `/smokecraft/cut-toast-light` exactly as before this change.
- **Phase 7-10 (this change)** — strengthened in place; no routes added or removed, same navigation chain (`cut-toast-light` → `first-third` → `second-third` → `final-third` → `scorecard`).
- **Phase 11 (Scorecard/Ranking/Badges)** — `smokecraftScoring.js`'s evaluators (`categoryCutLightStepsCompleted`, `categoryFirstThirdNotes`, `categorySecondThirdNotes`, `categoryFinalThirdNotes`, and badges `badgeFirstSmoke`/`badgePerfectDraw`) read the exact pre-existing field names (`stepsCompleted, allStepsCompleted, completedCount, totalSteps` on `cutToastLight`; `notesSelected, notesCount, drawRating, hasDrawRating` on `firstThird`; `notesSelected, notesCount, rating, hasRating` on `secondThird`; `notesSelected, notesCount, overallRating, hasOverallRating` on `finalThird`). None of those fields were renamed or restructured — all new fields are additive siblings — so Phase 11 scoring/badges continue to work unmodified.
- **Phase 12 (Passport Stamp)** — unaffected; `PassportStamp.jsx` does not currently read any `cutToastLight`/`firstThird`/`secondThird`/`finalThird` fields directly, so no change was required there. The new additive fields (mentor tips, profile ratings, pairing reactions, would-smoke-again) are present in session state for future cross-referencing, the same honest pattern used for Seed & Soil/mentor data elsewhere.
- **Phase 13 (Passport Connections)** — unaffected for the same reason as Phase 12.

## What was added

- `src/utils/smokecraftMentorTips.js` (new) — `getMentorGuidance(session, phaseKey)` reads the guest's real Phase 4 mentor selection (`session.mentors[0]`) and returns a phase-specific generic procedural tip, or `null` if no mentor was selected. No mentor content is invented.
- `src/pages/smokecraft/CutToastLight.jsx` — added cut-method selector (straight/V-cut/punch), Draw/Burn/Ash 1-5 quality-check ratings, and a mentor tip card. Continue now also requires a cut method to be selected.
- `src/pages/smokecraft/FirstThird.jsx` — added Strength/Body/Smoke Output/Burn Quality 1-5 ratings, a Pairing Reaction choice, and a mentor tip card.
- `src/pages/smokecraft/SecondThird.jsx` — added Flavor Development, Strength Change, Body Change choices, an Ash Quality rating, a Pairing Reaction choice, and a mentor tip card. The existing draw rating is now labeled "Burn Consistency" in the UI (same underlying `rating` field).
- `src/pages/smokecraft/FinalThird.jsx` — added Final Strength/Final Body/Heat-Harshness 1-5 ratings, a Burn Finish choice, a Final Pairing Reaction choice, a Would Smoke Again Yes/No toggle, and a mentor tip card.
- `docs/smokecraft-protocol-audit.md` — Phase 7-10 sections rewritten from "Partial" to "Strengthened".

## State persistence

All four pages save through the pre-existing `GuestSessionContext.jsx` setters (`setCutToastLightProgress`, `setFirstThirdTasting`, `setSecondThirdTasting`, `setFinalThirdTasting`), which generically spread their payload — no context changes were required.

```js
session.smokeCraft.cutToastLight = {
  stepsCompleted, allStepsCompleted, completedCount, totalSteps, // unchanged, read by Phase 11
  cutMethod, drawCheck, burnCheck, ashCheck, mentorTip, mentorName, // new
}
session.smokeCraft.firstThird = {
  notesSelected, notesCount, drawRating, hasDrawRating, // unchanged, read by Phase 11
  strength, body, smokeOutput, burnQuality, pairingReaction, mentorTip, mentorName, // new
}
session.smokeCraft.secondThird = {
  notesSelected, notesCount, rating, hasRating, // unchanged, read by Phase 11
  flavorDevelopment, strengthChange, bodyChange, ashQuality, pairingReaction, mentorTip, mentorName, // new
}
session.smokeCraft.finalThird = {
  notesSelected, notesCount, overallRating, hasOverallRating, // unchanged, read by Phase 11
  finalStrength, finalBody, heatHarshness, burnFinish, finalPairingReaction, wouldSmokeAgain, mentorTip, mentorName, // new
}
```

## How this feeds Phase 11 Scorecard

No changes to `smokecraftScoring.js` were made or needed — every field that `categoryCutLightStepsCompleted`, `categoryFirstThirdNotes`, `categorySecondThirdNotes`, `categoryFinalThirdNotes`, `badgeFirstSmoke`, and `badgePerfectDraw` read is preserved exactly. Scoring/badge totals are unaffected by this change.

## How this feeds Phase 12 Passport Stamp

`PassportStamp.jsx` does not read any of these fields today, so this change does not alter Passport Stamp behavior. The new fields remain available in session state if a future phase wants to surface tasting detail on the stamp.

## Demo Mode / local-only safety

All new fields are saved exclusively through the existing local guest-session state (`useGuestSession`/`update()`), the same in-memory/localStorage-backed session used throughout SmokeCraft. No backend write, POS3 call, or E.A.T. call was added.

## Backend pending status

Unchanged from prior phases — no backend, POS3, or staff-notification wiring exists for Phases 7-10; all progress is local/session-only, consistent with the existing honest "Backend Pending" doctrine documented elsewhere in SmokeCraft.
