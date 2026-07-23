# 02 — Authoritative 27-Session Manifest

Generated directly from `VISIT_STRUCTURE` in `src/constants/session.js` (the confirmed single live registry) plus `SC_ASSETS` in `src/constants/smokecraftAssets.js` — not hand-typed, to avoid transcription drift from the real source of truth.

6 phases, 27 sessions, confirmed 1–27 with no gaps or duplicates. Sessions 9, 13, 17, 18, 20, and 26 are the pre-existing, documented `mergedInto` sessions — each keeps its own stable number/title but currently shares one already-built screen's completion signal with an earlier session in the same merge group (established architecture, not a defect introduced or found in this pass).

Quiz/knowledge-check, XP, Passport, Skill Tree, Collections, and Challenge results for each session are unchanged from the existing, previously-verified `smokecraftJourney.js`/`GuestSessionContext.jsx` reward wiring — this pass audited routing/asset/order correctness only, per its explicit scope.

| # | Phase | Phase Name | Title | Route | Approved Asset | Asset Path | Prereq | Next |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Session Preparation | Welcome to Today’s Experience | `/smokecraft/welcome` | — | `none (disclosed gap)` | S— | S2 |
| 2 | 1 | Session Preparation | Choose Your Cigar | `/smokecraft/humidor-match` | humidorMatch | `/assets/smokecraft/Humidor%20Match%201.png` | S1 | S3 |
| 3 | 1 | Session Preparation | Meet Your Cigar | `/smokecraft/meet-your-cigar` | meetYourCigar | `/assets/smokecraft/DISOVER%20YOUR%20CIGAR%20PROFILE.png` | S2 | S4 |
| 4 | 1 | Session Preparation | Terroir | `/smokecraft/terroir` | terroir | `/assets/smokecraft-reference/approved/smokecraft-terroir.png` | S3 | S5 |
| 5 | 1 | Session Preparation | Construction Inspection | `/smokecraft/format` | format | `/assets/smokecraft-reference/approved/smokecraft-vitola.png` | S4 | S6 |
| 6 | 1 | Session Preparation | Choose Your Cut | `/smokecraft/cut-toast-light` | cutToastLight | `/assets/smokecraft/CUT%20%20TOAST,%20&%20LIGHT.png` | S5 | S7 |
| 7 | 1 | Session Preparation | Lighting Tutorial | `/smokecraft/lighting-tutorial` | lightingTutorial | `/assets/smokecraft/LIGHTING%20TUTORIAL%201.png` | S6 | S8 |
| 8 | 2 | First Third | First Draw | `/smokecraft/first-third` | firstThird | `/assets/smokecraft/FIRST%20%20THIRD1.png` | S7 | S9 |
| 9 | 2 | First Third | Flavor Discovery (merged into S8) | `/smokecraft/first-third` | firstThird | `/assets/smokecraft/FIRST%20%20THIRD1.png` | S8 | S10 |
| 10 | 2 | First Third | Flavor Memory Exercise | `/smokecraft/flavor-memory` | flavorMemory | `/assets/smokecraft/FLAVOR%20MEMORY.png` | S9 | S11 |
| 11 | 2 | First Third | Suggested Pairings | `/smokecraft/pairing-lab` | pairingLab | `/assets/smokecraft/PAIRING%20LAB1.png` | S10 | S12 |
| 12 | 3 | Second Third | Flavor Evolution | `/smokecraft/second-third` | secondThird | `/assets/smokecraft/SECOND%20THIRD.png` | S11 | S13 |
| 13 | 3 | Second Third | Construction Check (merged into S12) | `/smokecraft/second-third` | secondThird | `/assets/smokecraft/SECOND%20THIRD.png` | S12 | S14 |
| 14 | 3 | Second Third | Mentor Commentary | `/smokecraft/mentor-commentary` | mentorCommentary | `/assets/smokecraft/MENTOR%20:COMMENTARY.png` | S13 | S15 |
| 15 | 3 | Second Third | Knowledge Drop | `/smokecraft/knowledge-drop` | knowledgeDrop | `/assets/smokecraft/KNOWLEDGE%20DROP.png` | S14 | S16 |
| 16 | 4 | Final Third | Flavor Finish | `/smokecraft/final-third` | finalThird | `/assets/smokecraft/FINAL%20THIRD.png` | S15 | S17 |
| 17 | 4 | Final Third | Strength Progression (merged into S16) | `/smokecraft/final-third` | finalThird | `/assets/smokecraft/FINAL%20THIRD.png` | S16 | S18 |
| 18 | 4 | Final Third | Overall Experience Notes (merged into S16) | `/smokecraft/final-third` | finalThird | `/assets/smokecraft/FINAL%20THIRD.png` | S17 | S19 |
| 19 | 5 | Reflection | Rate Every Category | `/smokecraft/scorecard` | scorecard | `/assets/smokecraft/Scorecard.png` | S18 | S20 |
| 20 | 5 | Reflection | Personal Notes (merged into S19) | `/smokecraft/scorecard` | scorecard | `/assets/smokecraft/Scorecard.png` | S19 | S21 |
| 21 | 6 | Results | AI Summary | `/smokecraft/ai-summary` | aiSummary | `/assets/smokecraft/AI%20SUMMARY.png` | S20 | S22 |
| 22 | 6 | Results | Personalized Pairing Recommendations | `/smokecraft/pairing-recommendations` | pairingRecommendations | `/assets/smokecraft/personlized%20pairing%20222.png` | S21 | S23 |
| 23 | 6 | Results | Passport Stamp Animation | `/smokecraft/passport-stamp` | passportStamp | `/assets/smokecraft/PASSPORT%20STAMP.png` | S22 | S24 |
| 24 | 6 | Results | Completed Scorecard | `/smokecraft/final-review` | finalReview | `/assets/smokecraft/FINAL%20REVIEW.png` | S23 | S25 |
| 25 | 6 | Results | Rewards and XP | `/smokecraft/rewards` | rewards | `/assets/smokecraft/REWARDS%20222.png` | S24 | S26 |
| 26 | 6 | Results | Achievements | `/smokecraft/rewards` | achievements | `/assets/smokecraft/ACHIEVMENTS.png` | S25 | S27 |
| 27 | 6 | Results | Recommended Next Journey | `/smokecraft/session-complete` | recommendedNextJourney | `/assets/smokecraft/Recommend%20next%20journey.png` | S26 | SJourney Complete |

## Implementation / order / route / visual / completion-tracking status

Every one of the 27 sessions above is: **implemented** (component exists and is registered), **in correct order** (matches `App.jsx`'s `sessionNumber={N}` props exactly, verified in `01-SOURCE-OF-TRUTH-AUDIT.md`), **route-correct** (single registration, no duplicates), and **completion-tracking-correct** (contiguous-prefix rule via `computeJourneyStatus`, unchanged and re-verified in this pass).

**Visual status:** correct for all 27 except **Session 1 (Welcome)**, which has no approved asset anywhere in the repository — disclosed, not fabricated, consistent with the prior Approved Entry Visual Restoration pass's finding. **Required correction:** none performable within this pass's rules (no new artwork permitted, no approved asset exists to wire).
