# 03 — Route-to-Asset Truth Table

Generated from live source (`session.js`, `smokecraftAssets.js`, `App.jsx`) plus a real filesystem existence check for every asset path — not asserted from memory.

**"Asset Exists on Disk" and "Route Registered Once" are literal, programmatic checks performed this pass, not repeated claims from prior passes.**

| Seq | Phase | Session # | Title | Route | Component | Approved Asset Key | Asset Exists on Disk | Route Registered Once | Direct-Access Guard |
|---|---|---|---|---|---|---|---|---|---|
| E1 | Entry | — | Landing | `/smokecraft` | SmokeCraft.jsx | landing | Yes | Yes (1) | public (intentional) |
| E2 | Entry | — | Enrollment / Guest Pass | `/smokecraft/enroll` | Enroll.jsx | enroll | Yes | Yes (1) | requires=/sessionNumber |
| E3 | Entry | — | Identity | `/smokecraft/identity` | Identity.jsx | identity | Yes | Yes (1) | requires=/sessionNumber |
| E4 | Entry | — | Venue Selection | `/smokecraft/venue-select` | VenueSelect.jsx | venueSelect | Yes | Yes (1) | requires=/sessionNumber |
| E5 | Entry | — | Mentor Selection | `/smokecraft/mentor-selection` | Mentor.jsx | mentorSelection | Yes | Yes (1) | requires=/sessionNumber |
| S1 | 1 | 1 | Welcome to Today’s Experience | `/smokecraft/welcome` | (per session.js) | none (disclosed gap) | N/A | Yes (1) | sessionNumber={1} |
| S2 | 1 | 2 | Choose Your Cigar | `/smokecraft/humidor-match` | (per session.js) | humidorMatch | Yes | Yes (1) | sessionNumber={2} |
| S3 | 1 | 3 | Meet Your Cigar | `/smokecraft/meet-your-cigar` | (per session.js) | meetYourCigar | Yes | Yes (1) | sessionNumber={3} |
| S4 | 1 | 4 | Terroir | `/smokecraft/terroir` | (per session.js) | terroir | Yes | Yes (1) | sessionNumber={4} |
| S5 | 1 | 5 | Construction Inspection | `/smokecraft/format` | (per session.js) | format | Yes | Yes (1) | sessionNumber={5} |
| S6 | 1 | 6 | Choose Your Cut | `/smokecraft/cut-toast-light` | (per session.js) | cutToastLight | Yes | Yes (1) | sessionNumber={6} |
| S7 | 1 | 7 | Lighting Tutorial | `/smokecraft/lighting-tutorial` | (per session.js) | lightingTutorial | Yes | Yes (1) | sessionNumber={7} |
| S8 | 2 | 8 | First Draw | `/smokecraft/first-third` | (per session.js) | firstThird | Yes | Yes (1) | sessionNumber={8} |
| S9 | 2 | 9 | Flavor Discovery (merged→S8) | `/smokecraft/first-third` | (per session.js) | firstThird | Yes | Yes (1) | sessionNumber={9} |
| S10 | 2 | 10 | Flavor Memory Exercise | `/smokecraft/flavor-memory` | (per session.js) | flavorMemory | Yes | Yes (1) | sessionNumber={10} |
| S11 | 2 | 11 | Suggested Pairings | `/smokecraft/pairing-lab` | (per session.js) | pairingLab | Yes | Yes (1) | sessionNumber={11} |
| S12 | 3 | 12 | Flavor Evolution | `/smokecraft/second-third` | (per session.js) | secondThird | Yes | Yes (1) | sessionNumber={12} |
| S13 | 3 | 13 | Construction Check (merged→S12) | `/smokecraft/second-third` | (per session.js) | secondThird | Yes | Yes (1) | sessionNumber={13} |
| S14 | 3 | 14 | Mentor Commentary | `/smokecraft/mentor-commentary` | (per session.js) | mentorCommentary | Yes | Yes (1) | sessionNumber={14} |
| S15 | 3 | 15 | Knowledge Drop | `/smokecraft/knowledge-drop` | (per session.js) | knowledgeDrop | Yes | Yes (1) | sessionNumber={15} |
| S16 | 4 | 16 | Flavor Finish | `/smokecraft/final-third` | (per session.js) | finalThird | Yes | Yes (1) | sessionNumber={16} |
| S17 | 4 | 17 | Strength Progression (merged→S16) | `/smokecraft/final-third` | (per session.js) | finalThird | Yes | Yes (1) | sessionNumber={17} |
| S18 | 4 | 18 | Overall Experience Notes (merged→S16) | `/smokecraft/final-third` | (per session.js) | finalThird | Yes | Yes (1) | sessionNumber={18} |
| S19 | 5 | 19 | Rate Every Category | `/smokecraft/scorecard` | (per session.js) | scorecard | Yes | Yes (1) | sessionNumber={19} |
| S20 | 5 | 20 | Personal Notes (merged→S19) | `/smokecraft/scorecard` | (per session.js) | scorecard | Yes | Yes (1) | sessionNumber={20} |
| S21 | 6 | 21 | AI Summary | `/smokecraft/ai-summary` | (per session.js) | aiSummary | Yes | Yes (1) | sessionNumber={21} |
| S22 | 6 | 22 | Personalized Pairing Recommendations | `/smokecraft/pairing-recommendations` | (per session.js) | pairingRecommendations | Yes | Yes (1) | sessionNumber={22} |
| S23 | 6 | 23 | Passport Stamp Animation | `/smokecraft/passport-stamp` | (per session.js) | passportStamp | Yes | Yes (1) | sessionNumber={23} |
| S24 | 6 | 24 | Completed Scorecard | `/smokecraft/final-review` | (per session.js) | finalReview | Yes | Yes (1) | sessionNumber={24} |
| S25 | 6 | 25 | Rewards and XP | `/smokecraft/rewards` | (per session.js) | rewards | Yes | Yes (1) | sessionNumber={25} |
| S26 | 6 | 26 | Achievements (shared route) | `/smokecraft/rewards` | (per session.js) | achievements | Yes | Yes (1) | sessionNumber={26} |
| S27 | 6 | 27 | Recommended Next Journey | `/smokecraft/session-complete` | (per session.js) | recommendedNextJourney | Yes | Yes (1) | sessionNumber={27} |

## Result

- **32 rows checked** (5 entry screens + 27 sessions). **31 have an asset that exists on disk and is registered.** Only **S1 (Welcome)** has no asset — disclosed gap, unchanged finding from the prior two passes.
- **Every route is registered exactly once** — no duplicate, no deprecated alias silently winning.
- **Journey Overview, Skill Tree, Collections, Challenge Hub** are supporting modules outside the 27-session spine (confirmed in the prior Session-Sequence pass — `requires:`-gated, not `sessionNumber`-gated) — listed for completeness, not re-audited in this pass since their routing was already traced and found correct.
- **Golden Box Build Studio / Packaging Studio / Review and Submit / Presentation and Defense** are the Golden Box supporting-module subtree, gated by `requires="entry"` at the entry point then server-persisted draft state thereafter (Postgres) — confirmed does not create a Session 28, unchanged from the prior pass.

## Important caveat (do not over-read this table)

"Asset Exists on Disk" and "Route Registered Once" prove the asset is **reachable in principle** by a correctly-running production build. They do **not** prove the asset is what a live user in a live browser actually sees — that requires the component-rendering audit (`04`) and, ultimately, live access this session does not have.
