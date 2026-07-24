# 02 — Sessions 1-27 Results

Every session played live in canonical order, progressive `completedSteps` seeded to match a real player's completion history. All 27 verified against `SMOKECRAFT_SCREEN_MANIFEST` (generated from `VISIT_STRUCTURE`).

| S# | Phase | Title | Route | Component Marker | Asset Marker | Merged Into | Route OK | Marker OK | Asset OK | Visual OK |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Welcome to Today’s Experience | `/smokecraft/welcome` | `session-1` | `(none)` | - | True | True | True | True |
| 2 | 1 | Choose Your Cigar | `/smokecraft/humidor-match` | `session-2` | `humidorMatch` | - | True | True | True | True |
| 3 | 1 | Meet Your Cigar | `/smokecraft/meet-your-cigar` | `session-3` | `meetYourCigar` | - | True | True | True | True |
| 4 | 1 | Terroir | `/smokecraft/terroir` | `session-4` | `terroir` | - | True | True | True | True |
| 5 | 1 | Construction Inspection | `/smokecraft/format` | `session-5` | `format` | - | True | True | True | True |
| 6 | 1 | Choose Your Cut | `/smokecraft/cut-toast-light` | `session-6` | `cutToastLight` | - | True | True | True | True |
| 7 | 1 | Lighting Tutorial | `/smokecraft/lighting-tutorial` | `session-7` | `lightingTutorial` | - | True | True | True | True |
| 8 | 2 | First Draw | `/smokecraft/first-third` | `session-8` | `firstThird` | - | True | True | True | True |
| 9 | 2 | Flavor Discovery | `/smokecraft/first-third` | `session-8` | `firstThird` | 8 | True | True | True | True |
| 10 | 2 | Flavor Memory Exercise | `/smokecraft/flavor-memory` | `session-10` | `flavorMemory` | - | True | True | True | True |
| 11 | 2 | Suggested Pairings | `/smokecraft/pairing-lab` | `session-11` | `pairingLab` | - | True | True | True | True |
| 12 | 3 | Flavor Evolution | `/smokecraft/second-third` | `session-12` | `secondThird` | - | True | True | True | True |
| 13 | 3 | Construction Check | `/smokecraft/second-third` | `session-12` | `secondThird` | 12 | True | True | True | True |
| 14 | 3 | Mentor Commentary | `/smokecraft/mentor-commentary` | `session-14` | `mentorCommentary` | - | True | True | True | True |
| 15 | 3 | Knowledge Drop | `/smokecraft/knowledge-drop` | `session-15` | `knowledgeDrop` | - | True | True | True | True |
| 16 | 4 | Flavor Finish | `/smokecraft/final-third` | `session-16` | `finalThird` | - | True | True | True | True |
| 17 | 4 | Strength Progression | `/smokecraft/final-third` | `session-16` | `finalThird` | 16 | True | True | True | True |
| 18 | 4 | Overall Experience Notes | `/smokecraft/final-third` | `session-16` | `finalThird` | 16 | True | True | True | True |
| 19 | 5 | Rate Every Category | `/smokecraft/scorecard` | `session-19` | `scorecard` | - | True | True | True | True |
| 20 | 5 | Personal Notes | `/smokecraft/scorecard` | `session-19` | `scorecard` | 19 | True | True | True | True |
| 21 | 6 | AI Summary | `/smokecraft/ai-summary` | `session-21` | `aiSummary` | - | True | True | True | True |
| 22 | 6 | Personalized Pairing Recommendations | `/smokecraft/pairing-recommendations` | `session-22` | `pairingRecommendations` | - | True | True | True | True |
| 23 | 6 | Passport Stamp Animation | `/smokecraft/passport-stamp` | `session-23` | `passportStamp` | - | True | True | True | True |
| 24 | 6 | Completed Scorecard | `/smokecraft/final-review` | `session-24` | `finalReview` | - | True | True | True | True |
| 25 | 6 | Rewards and XP | `/smokecraft/rewards` | `session-25` | `rewards` | - | True | True | True | True |
| 26 | 6 | Achievements | `/smokecraft/rewards` | `session-25` | `rewards` | - | True | True | True | True |
| 27 | 6 | Recommended Next Journey | `/smokecraft/session-complete` | `session-27` | `recommendedNextJourney` | - | True | True | True | True |

All screenshots: `public/proof/smokecraft-complete-game-playthrough/screenshots/session-NN.png` (NN = zero-padded session number).

Session 1 (Welcome) has no approved asset anywhere in the repository — disclosed since an earlier pass, not a defect of this pass; it correctly reports `data-visual-source="live-component-no-approved-asset"` rather than fabricating or borrowing artwork.
