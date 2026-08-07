# SmokeCraft 360 — Canonical Journey (Recovered)

**Status: Locked.** Source of truth for route order: `src/constants/session.js` (`ENTRY_LAYER_SCREENS`, `VISIT_STRUCTURE`, `SUPPORTING_MODULES`), enforced by real `navigate()` calls in each screen's own source and cross-checked by the build-blocking `scripts/verifySmokecraftCanonicalJourneyLock.mjs`. This document and its `.json` counterpart are generated from, not asserted independently of, that code.

## How this was recovered (Part 1 evidence)

The owner reported that previously-designed opening screens — Golden Box Rules, Mentor Selection, and others — were being skipped. Forensic recovery (not memory, not invention) found:

1. `docs/SMOKECRAFT_LOCKED_JOURNEY_SEQUENCE.md` (earlier pass) already documented `golden-box` and `mentor-selection` as real `SUPPORTING_MODULES` in `src/constants/session.js`, both `requires: 'entry'` (reachable immediately after Welcome/S1).
2. `docs/SMOKECRAFT_AUTHORITATIVE_ROUTE_GRAPH.md` (an even earlier corrective pass) had already built and verified (`verify-smokecraft-authoritative-sequence.mjs`, 20/20 at the time) a real, fully-wired forward chain:
   `GoldenBox.jsx → navigate(NAV.MENTOR)` → `Mentor.jsx → navigate('/smokecraft/seed-soil')` → `SeedSoil.jsx → navigate('/smokecraft/humidor-match')`.
   Each of these screens genuinely exists, genuinely renders, and genuinely passes the static-gameplay detector today.
3. **The defect**: `WelcomeExperience.jsx` — S1, the screen every player actually starts on — had its own `handleBegin()` hardcoded to `navigate('/smokecraft/humidor-match')` directly, since the screen was first built (`Package N`, commit `6d0020a1`), predating the Golden Box/Mentor/Seed & Soil chain above. That chain was built and wired to itself, but the one screen that would actually funnel a real player into it — Welcome's own primary "Begin Experience" button — was never updated to enter it. Golden Box and Mentor were still technically reachable (optional sidebar/bottom-nav links on Welcome), but no real playthrough exercised them, matching exactly what the owner observed.
4. **Confirmed not a numbering or an ordering-within-the-27-spine problem**: `TOTAL_SESSIONS=27`/`TOTAL_VISITS=6` and every session's own `session`/`id`/`route` were already correct and untouched by this defect — Golden Box/Mentor/Seed & Soil are (and remain) supporting modules outside the 27-count, not renumbered spine sessions. The fix is a single navigation-target correction, not a restructuring.

## The fix

`WelcomeExperience.jsx`'s `handleBegin()` now calls `navigate(NAV.GOLDEN_BOX)` instead of jumping straight to Humidor Match. `HumidorMatch.jsx`'s own Back button now uses `navigate(-1)` (matching the established pattern already used by GoldenBox/Mentor/SeedSoil) instead of a hardcoded `/smokecraft` jump, so back-navigation through the recovered chain is coherent in both directions. No other screen's forward/back target changed — every other link in the chain (Golden Box → Mentor → Seed & Soil → Humidor Match → Meet Your Cigar → … → Session Complete) was already correct, per the earlier Authoritative Route Graph pass.

## Recovered opening sequence (primary path, first screen to Golden Box completion)

| # | Screen | Route | Layer |
|---|---|---|---|
| E1 | Launch | `/smokecraft` | Entry layer |
| E2 | Sign In / Guest Mode | `/smokecraft/enroll` | Entry layer |
| E3 | Venue Selection | `/smokecraft/venue-select` | Entry layer |
| E4 | Personal Dashboard | `/smokecraft/identity` | Entry layer |
| — | Welcome to Today's Experience (S1) | `/smokecraft/welcome` | Spine — Session 1 of 27 |
| — | **Golden Box Rules** | `/smokecraft/golden-box` | Supporting module (newly wired into the primary path) |
| — | **Mentor Selection** | `/smokecraft/mentor-selection` | Supporting module (newly wired into the primary path) |
| — | **Seed & Soil** | `/smokecraft/seed-soil` | Supporting module (newly wired into the primary path) |
| S2 | Choose Your Cigar (Humidor Match) | `/smokecraft/humidor-match` | Spine — Session 2 of 27 |
| S3 | Meet Your Cigar | `/smokecraft/meet-your-cigar` | Spine — Session 3 of 27 |
| S4 → S27 | … (unchanged) | … | Spine, continues exactly as `VISIT_STRUCTURE` already defines |

## Full 27-session spine (unchanged by this recovery — numbering/order confirmed already correct)

See `docs/SMOKECRAFT_LOCKED_JOURNEY_SEQUENCE.md` for the complete S1–S27 table (route/component/phase/reward-event) and `SMOKECRAFT_CANONICAL_JOURNEY.json` for the machine-readable form used by the build-blocking validator.

## Enforcement

`scripts/verifySmokecraftCanonicalJourneyLock.mjs` — pure static-source assertions (no server required), wired into `npm run prebuild` (build-blocking). Fails the build if any of the following silently drift again:

- Welcome's primary path stops entering Golden Box Rules, or reintroduces a direct jump to Humidor Match.
- Golden Box → Mentor, Mentor → Seed & Soil, or Seed & Soil → Humidor Match breaks.
- Humidor Match → Meet Your Cigar, or Meet Your Cigar → Terroir breaks.
- `HumidorMatch.jsx` reintroduces the baked-mockup `SmokeCraftImageBoundsOverlay` pattern (SC-D076 regression).
- `TOTAL_SESSIONS`/`TOTAL_VISITS`/Session 1/Session 2 identities are silently renumbered.
