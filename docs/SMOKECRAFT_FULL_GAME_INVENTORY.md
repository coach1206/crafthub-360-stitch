# SmokeCraft 360 — Full Game Inventory (Sessions 1–27)

Generated directly from `src/constants/session.js` (VISIT_STRUCTURE), `smokecraftScreenManifest.js`, `smokecraftComponentRegistry.js`, `smokecraftRewards.js`, and `smokecraftAssets.js` — every field below is read from the live source of truth, not hand-authored, so this table cannot silently drift from what a real player experiences.

**TOTAL_SESSIONS = 27, TOTAL_VISITS (phases) = 6. Sessions found in VISIT_STRUCTURE: 27.**

| S# | Phase | Title | Route | Component | Prev | Next | Completion key | XP | Badge | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 — Session Preparation | Welcome to Today’s Experience | `/smokecraft/welcome` | session-1 | Welcome/Entry | /smokecraft/golden-box | `entry` | 0 | — | COMPLETE_LIVE |
| 2 | 1 — Session Preparation | Choose Your Cigar | `/smokecraft/humidor-match` | session-2 | S1 | S3 | `humidor-match` | 75 | — | COMPLETE_LIVE |
| 3 | 1 — Session Preparation | Meet Your Cigar | `/smokecraft/meet-your-cigar` | session-3 | S2 | S4 | `meet-your-cigar` | 75 | — | COMPLETE_LIVE |
| 4 | 1 — Session Preparation | Terroir | `/smokecraft/terroir` | session-4 | S3 | S5 | `terroir` | 75 | — | COMPLETE_LIVE |
| 5 | 1 — Session Preparation | Construction Inspection | `/smokecraft/format` | session-5 | S4 | /smokecraft/request-purchase | `format` | 75 | — | COMPLETE_LIVE |
| 6 | 1 — Session Preparation | Choose Your Cut | `/smokecraft/cut-toast-light` | session-6 | S5 | S7 | `cut-toast-light` | 50 | — | COMPLETE_LIVE |
| 7 | 1 — Session Preparation | Lighting Tutorial | `/smokecraft/lighting-tutorial` | session-7 | S6 | S8 | `lighting-tutorial` | — | — | COMPLETE_LIVE |
| 8 | 2 — First Third | First Draw | `/smokecraft/first-third` | session-8 | S7 | S9 | `first-third` | 100 | — | COMPLETE_LIVE |
| 9 | 2 — First Third | Flavor Discovery | `/smokecraft/first-third` | shared with S8 | S8 | S10 | `first-third` | 100 | — | COMPLETE_LIVE |
| 10 | 2 — First Third | Flavor Memory Exercise | `/smokecraft/flavor-memory` | session-10 | S9 | S11 | `flavor-memory` | 75 | — | COMPLETE_LIVE |
| 11 | 2 — First Third | Suggested Pairings | `/smokecraft/pairing-lab` | session-11 | S10 | S12 | `pairing-lab` | 75 | — | COMPLETE_LIVE |
| 12 | 3 — Second Third | Flavor Evolution | `/smokecraft/second-third` | session-12 | S11 | S13 | `second-third` | 75 | — | COMPLETE_LIVE |
| 13 | 3 — Second Third | Construction Check | `/smokecraft/second-third` | shared with S12 | S12 | S14 | `second-third` | 75 | — | COMPLETE_LIVE |
| 14 | 3 — Second Third | Mentor Commentary | `/smokecraft/mentor-commentary` | session-14 | S13 | S15 | `mentor-commentary` | — | — | COMPLETE_LIVE |
| 15 | 3 — Second Third | Knowledge Drop | `/smokecraft/knowledge-drop` | session-15 | S14 | S16 | `knowledge-drop` | — | — | COMPLETE_LIVE |
| 16 | 4 — Final Third | Flavor Finish | `/smokecraft/final-third` | session-16 | S15 | S17 | `final-third` | 75 | — | COMPLETE_LIVE |
| 17 | 4 — Final Third | Strength Progression | `/smokecraft/final-third` | shared with S16 | S16 | S18 | `final-third` | 75 | — | COMPLETE_LIVE |
| 18 | 4 — Final Third | Overall Experience Notes | `/smokecraft/final-third` | shared with S16 | S17 | S19 | `final-third` | 75 | — | COMPLETE_LIVE |
| 19 | 5 — Reflection | Rate Every Category | `/smokecraft/scorecard` | session-19 | S18 | S20 | `scorecard` | 100 | — | COMPLETE_LIVE |
| 20 | 5 — Reflection | Personal Notes | `/smokecraft/scorecard` | shared with S19 | S19 | S21 | `scorecard` | 100 | — | COMPLETE_LIVE |
| 21 | 6 — Results | AI Summary | `/smokecraft/ai-summary` | session-21 | S20 | S22 | `ai-summary` | — | — | COMPLETE_LIVE |
| 22 | 6 — Results | Personalized Pairing Recommendations | `/smokecraft/pairing-recommendations` | session-22 | S21 | S23 | `pairing-recommendations` | — | — | COMPLETE_LIVE |
| 23 | 6 — Results | Passport Stamp Animation | `/smokecraft/passport-stamp` | session-23 | S22 | S24 | `passport-stamp` | 75 | — | COMPLETE_LIVE |
| 24 | 6 — Results | Completed Scorecard | `/smokecraft/final-review` | session-24 | S23 | S25 | `final-review` | 100 | — | COMPLETE_LIVE |
| 25 | 6 — Results | Rewards and XP | `/smokecraft/rewards` | session-25 | S24 | S26 | `rewards` | 50 | — | COMPLETE_LIVE |
| 26 | 6 — Results | Achievements | `/smokecraft/rewards` | shared component (/smokecraft/rewards) | S25 | S27 | `achievements` | 50 | — | COMPLETE_LIVE |
| 27 | 6 — Results | Recommended Next Journey | `/smokecraft/session-complete` | session-27 | S26 | Golden Box / Session Complete terminal | `session-complete` | 50 | — | COMPLETE_LIVE |

## Merged sessions (share one real route/component with their primary session — stable per-session ids/numbers kept, not renumbered)

- S9 "Flavor Discovery" shares `/smokecraft/first-third` with S8
- S13 "Construction Check" shares `/smokecraft/second-third` with S12
- S17 "Strength Progression" shares `/smokecraft/final-third` with S16
- S18 "Overall Experience Notes" shares `/smokecraft/final-third` with S16
- S20 "Personal Notes" shares `/smokecraft/scorecard` with S19

## Entry layer (outside the 27-session count)

| Screen | Route | Implemented |
|---|---|---|
| Launch | `/smokecraft` | true |
| Sign In / Guest Mode | `/smokecraft/enroll` | true |
| Venue Selection | `/smokecraft/venue-select` | true |
| Personal Dashboard | `/smokecraft/identity` | true |
| Resume or Start New Journey | `/smokecraft/resume` | true |

## Supporting modules (outside the 27-session count, requires-gated)

| Module | Route | Requires |
|---|---|---|
| Gold Box Rules | `/smokecraft/golden-box` | `entry` |
| Mentor Selection | `/smokecraft/mentor-selection` | `entry` |
| Seed & Soil | `/smokecraft/seed-soil` | `mentor` |
| Wrapper / Strength Education | `/smokecraft/wrapper-strength` | `format` |
| Request / Purchase | `/smokecraft/request-purchase` | `humidor-match` |
| SmokeCraft Challenge | `/smokecraft/smokecraft-challenge` | `scorecard` |
| Second Humidor Match | `/smokecraft/second-humidor-match` | `scorecard` |
| Mini Tasting Round | `/smokecraft/mini-tasting` | `scorecard` |
| 360 Passport Connections | `/smokecraft/connections` | `passport-stamp` |
| Venue / Management Sync | `/smokecraft/management-sync` | `passport-stamp` |

## Asset render status (existence check — see SMOKECRAFT_IMAGE_SURFACE_AUDIT.md for real browser-render verification)

All 27 session asset keys resolve to a real SC_ASSETS path.
