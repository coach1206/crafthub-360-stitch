# SmokeCraft 360 — Visual Baseline (Doc 6 of 8)

This is where to look to see what the branch actually renders, as of HEAD
`bdf8ae5e1fd8ee6cf0b6416a75334633841f07f3`. All images below were captured
from a **real browser walking the real, gated journey** (no direct-URL
bypass of any prerequisite guard) — not mockups.

## Current contact sheets (start here)

| File | Covers | Notes |
|---|---|---|
| `docs/visual-proof/main-integration/SMOKECRAFT_OWNER_REBUILD_FINAL_INDEX.png` | The 14 owner-rebuilt hero screens | **Most current.** Full-height owner background imagery behind live DOM, CSS-stacking bug fixed, baked-title duplication fixed. This is the state to review first. |
| `docs/visual-proof/main-integration/SMOKECRAFT_MAIN_CANDIDATE_INDEX.png` | Same 14 screens | Earlier snapshot, from before the owner-rebuild visual pass — kept for before/after comparison, not the current baseline. |
| `docs/visual-proof/migration/SMOKECRAFT_ONE_SYSTEM_FINAL_INDEX.png` | Same 14 screens | Working copy the capture script writes to on every run; `main-integration/…FINAL_INDEX.png` is copied from this file after each pass. |

## The 14 screens covered by the current contact sheet

`Identity` `SeedSoil` `Format` `CutToastLight` `FirstThird` `SecondThird`
`FinalThird` `Scorecard` `RequestPurchase` `PairingRecommendations`
`PassportStamp` `Connections` `Rewards` `SecondHumidorMatch`

These are the screens that received the owner's 14 hero images in the most
recent visual pass on this branch — they are **not** the full journey (doc 02
lists 21 spine screens + 10 supporting modules); they are the subset that
happened to receive new owner artwork and dedicated visual regression proof.
The remaining spine/supporting-module screens (Welcome, Meet Your Cigar,
Terroir, Lighting Tutorial, First-Third's siblings, Mentor Commentary,
Knowledge Drop, AI Summary, Final Review, Session Complete, Golden Box,
Mentor Selection, Wrapper/Strength, Mini Tasting, SmokeCraft Challenge) exist
and are routed (doc 03/04) but do not have a dedicated up-to-date contact
sheet in this repo as of this handoff — see the gap noted in doc 08.

## Per-screen, per-viewport screenshots

`docs/visual-proof/migration/{NN}-{screen-name}-{viewport}.png` — 28 files
(14 screens × 2 viewports): `tablet-primary` (1180×820) and `tablet-secondary`
(1024×768). These are the individual frames composited into the contact
sheets above.

## Capture tooling (how to regenerate)

`scripts/captureSmokecraftMigrationRealJourney.mjs` — walks the real 14-screen
journey (enroll → identity → venue → welcome → golden box → mentor → …),
screenshots each screen at both viewports, and composites the contact sheet.
Requires the dev server running against `crafthub_integration_candidate`
(Postgres) — see doc 08 for the exact run sequence.

## What changed visually in the most recent pass on this branch

1. **Strip-crop → full-height background.** The prior pattern
   (`SmokeCraftHeroCrop`) showed only a short bordered strip of each owner
   photo over a flat `#0b0f18` panel. The current
   `src/components/smokecraft/SmokeCraftOwnerHeroBackground.jsx` renders the
   full photo as a fixed full-viewport backdrop with a gradient overlay, so
   the image visually continues behind the whole screen instead of being cut
   off.
2. **CSS stacking fix.** The background component must render as a DOM
   sibling immediately before each screen's content wrapper (not nested
   inside it) — a fixed-position element always paints above static siblings
   regardless of z-index or source order otherwise. Each content wrapper
   carries `position: relative; zIndex: 2`.
3. **Baked-title removal.** 10 of the 14 owner source photos had a large
   decorative title baked directly into the image (e.g. "FINAL THIRD",
   "SCOREBOARD", "PAIRING RECOMMENDATIONS"). Under the strip-crop this went
   unnoticed; under the full-height treatment it duplicated the real
   on-screen title. Fixed with derived `sharp` crops
   (`public/assets/smokecraft/owner-rebuild/*-hero-crop.jpg`) windowed to the
   clean photographic region only — same source pixels, no text.

## Non-visual functional proof accompanying the current baseline

`allScreensPass: true`, all 14 `PASS (NONE)` from a real-browser interaction
trace at both viewports (route-stayed checks, no dead ends) — see doc 07 for
the full breakdown.
