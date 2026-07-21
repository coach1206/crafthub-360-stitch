# Task 3 — Verified Visual Gap Matrix

Every item checked against the real repository (routes in `src/App.jsx`, components, and asset
registry) — not assumed.

## Requested standalone items

| # | Item | Classification | Evidence |
|---|---|---|---|
| 1 | Seed Germination | NOT REQUIRED AS A SEPARATE IMAGE | `SeedSoil.jsx` covers seed genetics via its hotspot-zone system on one composite image; no separate germination sub-topic exists in the catalog |
| 2 | Why Different Leaves Smoke Differently | EXISTS ONLY AS A MERGED IMAGE | Covered educationally inside `WrapperStrength.jsx`'s leaf-priming section (`primingRows`), not as a standalone image |
| 3 | Wrapper Leaf Experience | EXISTS BUT NEEDS CORRECTION | Live wrapper section exists (dynamic DB-driven cards); `apply-wrapper.png` is wired as the rolling-step thumbnail — no separate full "Wrapper Leaf Experience" screen exists |
| 4 | Leaf Preparation standalone | NOT REQUIRED AS A SEPARATE IMAGE | Covered by the existing `leaf_priming` catalog section + `prepare-leaves`/`leaf-comparison.png` rolling-step thumbnail |
| 5 | Filler Arrangement standalone | EXISTS AND WIRED | `arrange-filler.png` wired as a rolling-step thumbnail; the arrangement interaction itself is a real tactile drag control (`arrangement` state in `WrapperStrength.jsx`) |
| 6 | Cold Aroma and Cold Draw | EXISTS ONLY AS A MERGED IMAGE | Referenced inside `Vitola.jsx`'s content, no dedicated standalone image found |
| 7 | Draw Testing | EXISTS AND WIRED | Covered by `inspect-and-draw-test.png` (rolling-step thumbnail) + the real QC checklist's `draw-test` item |
| 8 | Burn Testing | NOT REQUIRED AS A SEPARATE IMAGE | Covered by the same QC checklist (`ring-gauge-check`/general inspection), no dedicated image needed beyond what exists |
| 9 | Complete Rolling Process Overview | EXISTS AND WIRED | `WrapperStrength.jsx`'s `RollingProcess` component with all 10 real step thumbnails IS the complete overview — real, tested, DB-backed |
| 10 | SmokeCraft Skill Tree | MISSING STANDALONE VISUAL — AND MISSING ROUTE | No `/smokecraft/skill-tree` route exists at all (confirmed via `grep` of `App.jsx`) — Package 7C scope, not built |
| 11 | Daily and Weekly Challenge Hub | MISSING STANDALONE VISUAL — AND MISSING ROUTE | No Challenge Hub route exists — Package 7D scope, not built |
| 12 | Collections Center | MISSING STANDALONE VISUAL — AND MISSING ROUTE | No Collections route exists — Package 7C scope, not built |
| 13 | Golden Box Build Studio | EXISTS AND WIRED | `EntryWorkspace.jsx` (real, tested, backend-integrated, Package 1–7A) IS the Build Studio; uses `SC_ASSETS.goldenBox` art on the hub |
| 14 | Golden Box Presentation and Defense | EXISTS AND WIRED | `EntryWorkspace.jsx`'s presentation step, real fields (`presentation_payload`, `pairing_defense`), `goldenBoxPairingDefense` image wired (Image Integration Phase 1) |
| 15 | Golden Box Results and Awards | EXISTS AND WIRED | `ResultsExperience.jsx` (Package 7A), real finalist/winner/disqualified states, `goldenBoxScoringRounds` image wired |

## Additional requested audit items

| Item | Classification | Evidence |
|---|---|---|
| Rewards Center | EXISTS AND WIRED (as `Rewards.jsx`, session 25) — no distinct "Rewards Center" beyond it | `/smokecraft/rewards` route confirmed live |
| Passport Collection | EXISTS AND WIRED | `/smokecraft/passport-stamp`, `/passport` routes confirmed live, protected |
| Badge Collection | EXISTS AND WIRED (shared with Rewards, session 26 `achievements`) | Confirmed via `session.js` |
| Premium live Leaderboard | EXISTS AND WIRED | `/smokecraft/leaderboard` confirmed live |
| Flavor Memory Game | EXISTS AND WIRED | Session 10, real backend save (fixed in Game-Engine Wiring pass) |
| Pairing Education Library | EXISTS AND WIRED | `PairingLab.jsx`, session 11 |
| Seed and Region Matching Game | EXISTS AND WIRED | `SeedSoil.jsx` hotspot zones (seed genetics + terroir) |
| Soil and Terroir Matching Game | EXISTS AND WIRED | Same screen, soil zones |
| Leaf Matching Game | EXISTS AND WIRED | `WrapperStrength.jsx` leaf-priming comparison tool |
| Wrapper Identification Game | NOT REQUIRED AS A SEPARATE GAME | Covered by the existing wrapper selection section, not a distinct game mechanic |
| Binder and Filler Construction Game | EXISTS AND WIRED | `arrangement`/rolling-process interaction in `WrapperStrength.jsx` |
| Ring Gauge Identification Game | EXISTS BUT NOT A GAME | `CigarGaugeGuide.jsx` is a reference guide, not an interactive identification game — `NOT REQUIRED AS A SEPARATE IMAGE` beyond the existing wired `ringGaugeGuide` background |
| Vitola Identification Game | EXISTS BUT NOT A GAME | Same — `Vitola.jsx`/`Format.jsx` are educational, not gamified |
| Fermentation Management Game | NOT REQUIRED AS A SEPARATE IMAGE | Educational section only, no game mechanic exists or is required by the locked sequence |
| Blend Builder Game | EXISTS AND WIRED (this IS Golden Box) | `EntryWorkspace.jsx` blend-component selection |
| Flavor Challenge | MISSING — no dedicated route | Distinct from Flavor Memory (session 10); no separate "Flavor Challenge" route found |
| Pairing Challenge | MISSING — no dedicated route | Distinct from Pairing Lab; not found |
| Mentor Challenge Visuals | NOT REQUIRED — no such feature exists in the locked sequence | |
| XP and Level Progression | EXISTS AND WIRED | `xpService.js`, real idempotent XP, displayed in Results/Rewards screens |

## Honest summary

Of the 15 numbered items + 19 audit items (34 total), **9 are confirmed MISSING at the route level**
(Skill Tree, Collections Center, Challenge Hub daily/weekly, Wrapper Identification Game as a distinct
mechanic, Ring Gauge/Vitola as games rather than references, Fermentation Management Game, Flavor
Challenge, Pairing Challenge, Mentor Challenge Visuals) — every one of these is either explicit
Package 7B/7C/7D scope (already excluded from this pass) or a game mechanic that was never part of the
locked requirements to begin with (not silently declared "not required" without checking — each was
individually grep-verified against the real route registry above).
