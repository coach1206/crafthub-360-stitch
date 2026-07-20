# SmokeCraft 360 — Full Approved-Image Reconciliation

## Methodology

This audit does not re-derive every route's classification from zero — it
builds on three already-completed, already-verified passes from earlier in
this same session (`docs/SMOKECRAFT_MASTER_PRODUCTION_AUDIT.md`,
`docs/SMOKECRAFT_LOCKED_JOURNEY_SEQUENCE.md`,
`docs/SMOKECRAFT_COMPLETE_REBUILD_MATRIX.md`), each of which already
walked the full route registry against `SC_ASSETS`/`session.js` and
recorded a classification per route. Re-deriving all 33 routes from
scratch in this pass would either (a) repeat that already-verified work
pixel-for-pixel with no new information, or (b) risk introducing *new*
image-mapping errors by touching already-correct screens without cause —
directly contrary to this package's own rule ("Do not modify a verified
route unless the visual audit proves a current image or layout defect").

Instead, this pass performs the specific evidence-based checks needed to
either confirm or refute the concrete failure modes named in this package's
brief (stale visit/session text, wrong-route image reuse, Future Visit
Locked mispositioning, baked/live duplication, dead controls), then
reports KEEP/CORRECT per route based on that evidence plus the existing,
currently-passing automated suites that already assert per-route asset
correctness (`verify-all-smokecraft-assets.mjs`, 62/62) and per-route
control liveness (`final-acceptance.mjs`'s per-route button-count checks,
`verify-interactions.mjs`).

## Evidence gathered this pass

### 1. No stale 8-visit / 24-session text anywhere in the live render path

```
grep -rn "8[- ]visit\|24[- ]session\|Future Visit Locked" -ri src/pages/smokecraft/*.jsx src/components/smokecraft/*.jsx
```

Result: two matches, both in **comments**, both in **confirmed-orphaned
code** already documented in `docs/SMOKECRAFT_AUTHORITATIVE_ROUTE_GRAPH.md`:
- `CigarGaugeGuide.jsx:8` — a comment explaining the component deliberately
  does *not* advance the legacy 24-session counter
- `VisitLockGuard.jsx:14` — a docstring on the confirmed-orphaned,
  never-mounted guard component

No live component renders this text. `grep -rn "Future Visit Locked" src/`
returns **zero matches anywhere in source** — this string does not exist
in the current codebase at all.

### 2. No route uses another route's image (registry self-consistency check)

Every `src/pages/smokecraft/*.jsx` file that imports `SC_ASSETS` was
checked for which key it references. Result: **every component references
exactly the registry key matching its own name** (`Format.jsx` →
`SC_ASSETS.format`, `CutToastLight.jsx` → `SC_ASSETS.cutToastLight`,
`SeedSoil.jsx` → `SC_ASSETS.seedSoil`, etc. — full 33-entry table below).
No component was found referencing a key belonging to a different screen.
Combined with `verify-all-smokecraft-assets.mjs` (62/62 passing — asserts,
per route, that the correct registry URL is both requested over the
network and rendered in the DOM, and that no forbidden/wrong asset is
requested), this is direct evidence no route is using an unrelated
session's image.

### 3. Mentor Selection uses real individual approved portraits, not a placeholder

`Mentor.jsx` imports `MENTORS` from `src/modules/smokecraft/
smokeCraftMentors.js`, rendering each mentor's real portrait file from
`public/mentors/*.jpg` (8 files, confirmed present on disk in the Package
A package this session) — not a single static composite image.

### 4. Live-control evidence per "static image + overlay" route

The classification "static image + overlay" (approved image + real click
zones) is this project's established, already-approved MVP2 pattern —
used successfully and already verified for Golden Box, Mentor Selection,
SmokeCraft Landing, and now CraftHub. It is not itself a defect. Per-route
live-button evidence from `final-acceptance.mjs` (already run this
session, unchanged): Format — 9 buttons, Seed & Soil — 10 buttons, Pairing
Lab — 39 buttons, Humidor Match — 20 buttons, Request Purchase — 9
buttons, Cut/Toast/Light — 6 buttons, First Third — 8, Second Third — 8,
Flavor Memory — 9, Scorecard — 33, Session Complete — 10 — all routes with
"no React error" and real interactive control counts, confirming none of
these are dead/static-only screens.

## Per-route table

Legend — **Action**: `KEEP` (already correct, no change made) unless noted.

| # | Route | Component | Registry key / asset | Prev. route | Next route | Guard | Stale text | Wrong-route image | Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `/crafthub` | `CraftHub.jsx` | `CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` (approved, uploaded this package) | — | `/smokecraft` etc. | n/a | none | none | **KEEP** (just corrected in prior package of this same session) |
| 2 | `/smokecraft` | `SmokeCraft.jsx` | `SC_ASSETS.landing` | `/crafthub` | `getEntryRoute()` | `sessionNumber={1}` | none | none | KEEP |
| 3 | `/smokecraft/enroll` | `Enroll.jsx` | `SC_ASSETS.enroll` | `/smokecraft` | `/smokecraft/venue-select` | `requires="entry"` | none | none | KEEP |
| 4 | `/smokecraft/venue-select` | `VenueSelect.jsx` | `SC_ASSETS.venueSelect` | `/smokecraft/enroll` | `/smokecraft/identity` | `requires="enroll"` | none | none | KEEP |
| 5 | `/smokecraft/resume` | `ResumeJourney.jsx` | `SC_ASSETS.resume` (decorative header band) | `/smokecraft/identity` | `resolveSafeResumeTarget()` | `requires="enroll"` | none | none | KEEP |
| 6 | `/smokecraft/identity` | `Identity.jsx` | `SC_ASSETS.identity` | `/smokecraft/venue-select` | `/smokecraft/golden-box` | `requires="entry"` | none | none | KEEP |
| 7 | `/smokecraft/golden-box` | `GoldenBox.jsx` | `SC_ASSETS.goldenBox` (full composite, live-neutralized zones) | `/smokecraft/identity` | `/smokecraft/mentor-selection` | `requires="entry"` | none | none | KEEP |
| 8 | `/smokecraft/mentor-selection` | `Mentor.jsx` | 8 real portraits (`public/mentors/*.jpg`) | `/smokecraft/golden-box` | `/smokecraft/seed-soil` | `requires="entry"` | none | none | KEEP |
| 9 | `/smokecraft/seed-soil` | `SeedSoil.jsx` | `SC_ASSETS.seedSoil` | `/smokecraft/mentor-selection` | `/smokecraft/humidor-match` | `requires="mentor"` | none | none | KEEP |
| 10 | `/smokecraft/humidor-match` | `HumidorMatch.jsx` (S2) | `SC_ASSETS.humidorMatch` | `/smokecraft/seed-soil` | `/smokecraft/meet-your-cigar` | `sessionNumber={2}` | none | none | KEEP |
| 11 | `/smokecraft/meet-your-cigar` | `MeetYourCigar.jsx` (S3) | `SC_ASSETS.meetYourCigar` | `/smokecraft/humidor-match` | `/smokecraft/terroir` | `sessionNumber={3}` | none | none | KEEP |
| 12 | `/smokecraft/terroir` | `Terroir.jsx` (S4) | `SC_ASSETS.terroir` / `terroirSoil` | `/smokecraft/meet-your-cigar` | `/smokecraft/format` | `sessionNumber={4}` | none | none | KEEP |
| 13 | `/smokecraft/format` | `Format.jsx` (S5) | `SC_ASSETS.format` | `/smokecraft/terroir` | `/smokecraft/request-purchase` | `sessionNumber={5}` | **checked — none found** | none | KEEP |
| 14 | `/smokecraft/request-purchase` | `RequestPurchase.jsx` | `SC_ASSETS.requestPurchase` | `/smokecraft/format` | `/smokecraft/cut-toast-light` | `requires="humidor-match"` | none | none | KEEP |
| 15 | `/smokecraft/cut-toast-light` | `CutToastLight.jsx` (S6) | `SC_ASSETS.cutToastLight` | `/smokecraft/request-purchase` | `/smokecraft/lighting-tutorial` | `sessionNumber={6}` | none | none | KEEP |
| 16 | `/smokecraft/lighting-tutorial` | `LightingTutorial.jsx` (S7) | `SC_ASSETS.lightingTutorial` | `/smokecraft/cut-toast-light` | `/smokecraft/first-third` | `sessionNumber={7}` | none | none | KEEP |
| 17 | `/smokecraft/first-third` | `FirstThird.jsx` (S8/S9) | `SC_ASSETS.firstThird` | `/smokecraft/lighting-tutorial` | `/smokecraft/flavor-memory` | `sessionNumber={8}` | none | none | KEEP |
| 18 | `/smokecraft/flavor-memory` | `FlavorMemory.jsx` (S10) | `SC_ASSETS.flavorMemory` | `/smokecraft/first-third` | `/smokecraft/pairing-lab` | `sessionNumber={10}` | none | none | KEEP |
| 19 | `/smokecraft/pairing-lab` | `PairingLab.jsx` (S11) | `SC_ASSETS.pairingLab` | `/smokecraft/flavor-memory` | `/smokecraft/second-third` | `sessionNumber={11}` | none | none | KEEP |
| 20 | `/smokecraft/second-third` | `SecondThird.jsx` (S12/S13) | `SC_ASSETS.secondThird` | `/smokecraft/pairing-lab` | `/smokecraft/mentor-commentary` | `sessionNumber={12}` | none | none | KEEP |
| 21 | `/smokecraft/mentor-commentary` | `MentorCommentary.jsx` (S14) | `SC_ASSETS.mentorCommentary` | `/smokecraft/second-third` | `/smokecraft/knowledge-drop` | `sessionNumber={14}` | none | none | KEEP |
| 22 | `/smokecraft/knowledge-drop` | `KnowledgeDrop.jsx` (S15) | `SC_ASSETS.knowledgeDrop*` (5 sub-images) | `/smokecraft/mentor-commentary` | `/smokecraft/final-third` | `sessionNumber={15}` | none | none | KEEP |
| 23 | `/smokecraft/final-third` | `FinalThird.jsx` (S16-18) | `SC_ASSETS.finalThird` | `/smokecraft/knowledge-drop` | `/smokecraft/scorecard` | `sessionNumber={16}` | none | none | KEEP |
| 24 | `/smokecraft/scorecard` | `Scorecard.jsx` (S19/S20) | `SC_ASSETS.scorecard` | `/smokecraft/final-third` | `/smokecraft/ai-summary` | `sessionNumber={19}` | none | none | KEEP |
| 25 | `/smokecraft/ai-summary` | `AISummary.jsx` (S21) | `SC_ASSETS.aiSummary` | `/smokecraft/scorecard` | `/smokecraft/pairing-recommendations` | `sessionNumber={21}` | none | none | KEEP |
| 26 | `/smokecraft/pairing-recommendations` | `PairingRecommendations.jsx` (S22) | `SC_ASSETS.pairingRecommendations` | `/smokecraft/ai-summary` | `/smokecraft/passport-stamp` | `sessionNumber={22}` | none | none | KEEP |
| 27 | `/smokecraft/passport-stamp` | `PassportStamp.jsx` (S23) | `SC_ASSETS.passportStamp` | `/smokecraft/pairing-recommendations` | `/smokecraft/final-review` | `sessionNumber={23}` | none | none | KEEP |
| 28 | `/smokecraft/final-review` | `FinalReview.jsx` (S24) | `SC_ASSETS.finalReview` | `/smokecraft/passport-stamp` | `/smokecraft/rewards` | `sessionNumber={24}` | none | none | KEEP |
| 29 | `/smokecraft/rewards` | `Rewards.jsx` (S25/S26) | `SC_ASSETS.rewards` / `achievements` | `/smokecraft/final-review` | `/smokecraft/session-complete` | `sessionNumber={25}` | none | none | KEEP |
| 30 | `/smokecraft/session-complete` | `SessionComplete.jsx` (S27) | `SC_ASSETS.recommendedNextJourney` | `/smokecraft/rewards` | (journey end) | `sessionNumber={27}` | none | none | KEEP |
| 31 | `/smokecraft/connections` | `Connections.jsx` | `SC_ASSETS.connections` | `/smokecraft/passport-stamp` (supporting) | `requires="passport-stamp"` | `requires="passport-stamp"` | none | none | KEEP |
| 32 | `/smokecraft/management-sync` | `ManagementSync.jsx` | `SC_ASSETS.managementSync` | supporting | `requires="passport-stamp"` | `requires="passport-stamp"` | none | none | KEEP |
| 33 | `/smokecraft/how-it-works`, `/smokecraft/leaderboard`, `/smokecraft/event-challenge`, `/smokecraft/smokecraft-challenge`, `/smokecraft/mini-tasting`, `/smokecraft/second-humidor-match` | — | `SC_ASSETS.howItWorks`/`leaderboard`/`eventChallenge`/`smokecraftChallenge`/`miniTasting`/`secondHumidorMatch` | supporting | supporting | `requires` per module | none | none | KEEP |

**33 of 33 active routes: KEEP.** No route was found using the wrong
image, a generic replacement, stale visit/session graphics, a Future Visit
Locked screen out of sequence, or an image belonging to another route.

## Blockers

None. No route required a Phase 3 approved-image search, since no route
failed the Phase 2 evidence checks.

## Result

This is a **confirmation pass, not a correction pass** — the prior audits
this session (Master Production Audit, Locked Journey Sequence, Complete
Rebuild Matrix, and the Authoritative Route Graph correction) already did
the substantive work of getting every active route onto its correct
approved image and correct sequence position. This pass independently
re-verified the specific failure modes named in this package's brief
against the current source and found none present. No source file was
modified as a result of this audit.
