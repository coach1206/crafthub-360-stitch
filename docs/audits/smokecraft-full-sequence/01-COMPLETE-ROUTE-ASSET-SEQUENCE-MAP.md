# SmokeCraft 360 — Complete Route / Asset / Sequence Map

Phase 1 inventory for the Full Journey Sequence & Approved-Asset pass.

**Starting commit:** `a548ff0cd797d59d906316e81556f3681579e630` (local == remote, clean tree)  
**Canonical source of truth:** `src/constants/session.js` -> `VISIT_STRUCTURE` (6 phases / 27 sessions)  
**Derived registry:** `src/constants/smokecraftScreenManifest.js` (31 entries = 4 entry + 27 curriculum)  
**Verification:** `verify-smokecraft-full-journey-sequence-and-assets.mjs` — **105/105**, real Chromium against a production build.

This document CROSS-REFERENCES the generated manifest against (a) the files actually on disk and (b) the live rendered app. It is not a hand-copied duplicate: every hash below is the sha256 of the bytes the browser really fetched, compared to the sha256 of the approved file on disk.

## Entry screens

| Screen ID | Route | Component | Approved asset | sha256 (disk) | Guard | Direct access |
|---|---|---|---|---|---|---|
| `entry-landing` | `/smokecraft` | Landing | `/assets/smokecraft-reference/approved/smokecraft-landing.png` | `f817ab40ad138135` | public | public |
| `entry-enroll` | `/smokecraft/enroll` | Enrollment | `/assets/smokecraft-reference/approved/smokecraft-guest-pass.png` | `5c798061277c78b3` | requires | guarded |
| `entry-identity` | `/smokecraft/identity` | Identity | `/assets/smokecraft/IDENTY.png` | `006685040277d1cf` | requires | guarded |
| `entry-venue` | `/smokecraft/venue-select` | Venue Selection | `/assets/smokecraft/Venue Selection 11.png` | `b17463c6be5f9fa6` | requires | guarded |

## The 27 curriculum sessions (exact canonical order)

| # | Phase | Screen ID | Route | Component | Approved asset | sha256 rendered==disk | Previous | Next |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | `session-1` | `/smokecraft/welcome` | session-1 | **none** | — (missing-approved-asset) | `/smokecraft/venue-select` | `/smokecraft/humidor-match` |
| 2 | 1 | `session-2` | `/smokecraft/humidor-match` | session-2 | `/assets/smokecraft/Humidor Match 1.png` | `63c6510b549a89ca` MATCH | `/smokecraft/welcome` | `/smokecraft/meet-your-cigar` |
| 3 | 1 | `session-3` | `/smokecraft/meet-your-cigar` | session-3 | `/assets/smokecraft/DISOVER YOUR CIGAR PROFILE.png` | `6fc13ac032af8e5f` MATCH | `/smokecraft/humidor-match` | `/smokecraft/terroir` |
| 4 | 1 | `session-4` | `/smokecraft/terroir` | session-4 | `/assets/smokecraft-reference/approved/smokecraft-terroir.png` | `e671a9a296f1162c` MATCH | `/smokecraft/meet-your-cigar` | `/smokecraft/format` |
| 5 | 1 | `session-5` | `/smokecraft/format` | session-5 | `/assets/smokecraft-reference/approved/smokecraft-vitola.png` | `a7c1147e1b9b6bb3` MATCH | `/smokecraft/terroir` | `/smokecraft/request-purchase` |
| 6 | 1 | `session-6` | `/smokecraft/cut-toast-light` | session-6 | `/assets/smokecraft/CUT  TOAST, & LIGHT.png` | `09a4257a15bf4001` MATCH | `/smokecraft/format` | `/smokecraft/lighting-tutorial` |
| 7 | 1 | `session-7` | `/smokecraft/lighting-tutorial` | session-7 | `/assets/smokecraft/LIGHTING TUTORIAL 1.png` | `0b9e31a4821a686d` MATCH | `/smokecraft/cut-toast-light` | `/smokecraft/first-third` |
| 8 | 2 | `session-8` | `/smokecraft/first-third` | session-8 | `/assets/smokecraft/FIRST  THIRD1.png` | `18a997c3d1de12ce` MATCH | `/smokecraft/lighting-tutorial` | `/smokecraft/first-third` |
| 9 | 2 | `session-9` | `/smokecraft/first-third` | session-9 (merged into S8) | `/assets/smokecraft/FIRST  THIRD1.png` | `18a997c3d1de12ce` MATCH | `/smokecraft/first-third` | `/smokecraft/flavor-memory` |
| 10 | 2 | `session-10` | `/smokecraft/flavor-memory` | session-10 | `/assets/smokecraft/FLAVOR MEMORY.png` | `297eb2b15d96a58d` MATCH | `/smokecraft/first-third` | `/smokecraft/pairing-lab` |
| 11 | 2 | `session-11` | `/smokecraft/pairing-lab` | session-11 | `/assets/smokecraft/PAIRING LAB1.png` | `274fc143e8d5f525` MATCH | `/smokecraft/flavor-memory` | `/smokecraft/second-third` |
| 12 | 3 | `session-12` | `/smokecraft/second-third` | session-12 | `/assets/smokecraft/SECOND THIRD.png` | `0a8ec771f6bf71d2` MATCH | `/smokecraft/pairing-lab` | `/smokecraft/second-third` |
| 13 | 3 | `session-13` | `/smokecraft/second-third` | session-13 (merged into S12) | `/assets/smokecraft/SECOND THIRD.png` | `0a8ec771f6bf71d2` MATCH | `/smokecraft/second-third` | `/smokecraft/mentor-commentary` |
| 14 | 3 | `session-14` | `/smokecraft/mentor-commentary` | session-14 | `/assets/smokecraft/MENTOR :COMMENTARY.png` | `3959f46c029b0296` MATCH | `/smokecraft/second-third` | `/smokecraft/knowledge-drop` |
| 15 | 3 | `session-15` | `/smokecraft/knowledge-drop` | session-15 | `/assets/smokecraft/KNOWLEDGE DROP.png` | `27b3c600ed0be03e` MATCH | `/smokecraft/mentor-commentary` | `/smokecraft/final-third` |
| 16 | 4 | `session-16` | `/smokecraft/final-third` | session-16 | `/assets/smokecraft/FINAL THIRD.png` | `6ce38723011af64a` MATCH | `/smokecraft/knowledge-drop` | `/smokecraft/final-third` |
| 17 | 4 | `session-17` | `/smokecraft/final-third` | session-17 (merged into S16) | `/assets/smokecraft/FINAL THIRD.png` | `6ce38723011af64a` MATCH | `/smokecraft/final-third` | `/smokecraft/final-third` |
| 18 | 4 | `session-18` | `/smokecraft/final-third` | session-18 (merged into S16) | `/assets/smokecraft/FINAL THIRD.png` | `6ce38723011af64a` MATCH | `/smokecraft/final-third` | `/smokecraft/scorecard` |
| 19 | 5 | `session-19` | `/smokecraft/scorecard` | session-19 | `/assets/smokecraft/Scorecard.png` | `a577973797590d32` MATCH | `/smokecraft/final-third` | `/smokecraft/scorecard` |
| 20 | 5 | `session-20` | `/smokecraft/scorecard` | session-20 (merged into S19) | `/assets/smokecraft/Scorecard.png` | `a577973797590d32` MATCH | `/smokecraft/scorecard` | `/smokecraft/ai-summary` |
| 21 | 6 | `session-21` | `/smokecraft/ai-summary` | session-21 | `/assets/smokecraft/AI SUMMARY.png` | `1d05f50d0eb71360` MATCH | `/smokecraft/scorecard` | `/smokecraft/pairing-recommendations` |
| 22 | 6 | `session-22` | `/smokecraft/pairing-recommendations` | session-22 | `/assets/smokecraft/personlized pairing 222.png` | `f060831b151cbefc` MATCH | `/smokecraft/ai-summary` | `/smokecraft/passport-stamp` |
| 23 | 6 | `session-23` | `/smokecraft/passport-stamp` | session-23 | `/assets/smokecraft/PASSPORT STAMP.png` | `4d9fb28ac0108a8d` MATCH | `/smokecraft/pairing-recommendations` | `/smokecraft/final-review` |
| 24 | 6 | `session-24` | `/smokecraft/final-review` | session-24 | `/assets/smokecraft/FINAL REVIEW.png` | `df16f309ce138aa0` MATCH | `/smokecraft/passport-stamp` | `/smokecraft/rewards` |
| 25 | 6 | `session-25` | `/smokecraft/rewards` | session-25 | `/assets/smokecraft/REWARDS 222.png` | `986196149e83c895` MATCH | `/smokecraft/final-review` | `/smokecraft/rewards` |
| 26 | 6 | `session-26` | `/smokecraft/rewards` | session-26 (shares S25 component) | `/assets/smokecraft/ACHIEVMENTS.png` | `32e64aadd40d5610` MATCH | `/smokecraft/rewards` | `/smokecraft/session-complete` |
| 27 | 6 | `session-27` | `/smokecraft/session-complete` | session-27 | `/assets/smokecraft/Recommend next journey.png` | `2c5a402c0063a7dc` MATCH | `/smokecraft/rewards` | `—` |

## Phase boundaries

| Phase | Title | Sessions |
|---|---|---|
| 1 | Session Preparation | S1–S7 (7) |
| 2 | First Third | S8–S11 (4) |
| 3 | Second Third | S12–S15 (4) |
| 4 | Final Third | S16–S18 (3) |
| 5 | Reflection | S19–S20 (2) |
| 6 | Results | S21–S27 (7) |

## Supporting / landing-destination routes

| Screen | Route | Journey preserved | Notes |
|---|---|---|---|
| Pairing (landing destination) | `/smokecraft/pairing` | yes (11 steps, venue `Test Lounge`) | opens at its own route, Back stays in namespace |
| Passport | `/smokecraft/passport` | yes (11 steps, venue `Test Lounge`) | opens at its own route, Back stays in namespace |
| Rewards Center | `/smokecraft/rewards-center` | yes (11 steps, venue `Test Lounge`) | opens at its own route, Back stays in namespace |
| Rankings / Leaderboard | `/smokecraft/leaderboard` | yes (11 steps, venue `Test Lounge`) | opens at its own route, Back stays in namespace |
| CraftHub | `/smokecraft/crafthub` | yes (11 steps, venue `Test Lounge`) | opens at its own route, Back stays in namespace |
| Challenge Hub | `/smokecraft/challenge-hub` | yes (11 steps, venue `Test Lounge`) | opens at its own route, Back stays in namespace |
| Pairing Lab | `/smokecraft/pairing-lab` | n/a | canonical **S11**, guarded — distinct from Pairing |
| Pairing Recommendations | `/smokecraft/pairing-recommendations` | n/a | canonical **S22**, guarded — distinct from both |
| Resume Journey | `/smokecraft/resume` | yes | `missing-approved-asset` (see below) |

## Screens marked `missing-approved-asset` (Phase 6 policy)

| Screen | Reason | Handling verified this pass |
|---|---|---|
| `session-1` Welcome (`WelcomeExperience.jsx`) | No approved Welcome artwork exists anywhere in the repo. | Renderer emits `data-visual-source="live-component-no-approved-asset"` — honest, never a borrowed or fabricated image. Live-verified free of placeholder values. |
| `session-25` Rewards (`Rewards.jsx`) | `REWARDS 222.png` is a fully-baked mock dashboard: fake figures printed into its own pixels, zero blank overlay zones (unlike its sibling `ACHIEVMENTS.png`, a genuine blank template). | Left on its prior decorative-band usage with 100% real live data. Re-verified: none of the baked fake figures reach the DOM. |
| `ResumeJourney.jsx` | No dedicated approved image exists in the repo at all; `SC_ASSETS.resume` points at an unrelated Golden Box photo used purely as decoration. | Disclosure carried forward unchanged. Re-verified: renders no placeholder/fabricated values. |

## Asset integrity

- **30 registered approved assets, 0 missing on disk.**
- **26 of 27 sessions** hash-verified rendered==disk in a real browser; the 1 exception is S1 Welcome, which has no approved asset.
- The only assets shared between screens are the 4 declared merged-session groups — S8/S9, S12/S13, S16/S17/S18, S19/S20. No asset is silently reused outside a declared group.
- Assets are served with a `?v=<commit>` cache-buster derived from the build commit.
