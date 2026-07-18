# SmokeCraft 360 — Locked Journey Sequence (Phase 2)

Source of truth: `src/constants/session.js` (`ENTRY_LAYER_SCREENS`, `VISIT_STRUCTURE`, `SUPPORTING_MODULES`), cross-checked against route guards in `src/App.jsx`. This is the current, active, code-enforced sequence — not re-derived from filenames or assumptions.

No stale "8-visit"/"24-session" language governs any guard. `TOTAL_SESSIONS = 27` is correct and current.

## Entry Layer (outside the 27-session count, 5 screens)

| # | Route | Screen title | Component | Prerequisite | Resume behavior | Status |
|---|---|---|---|---|---|---|
| E1 | `/smokecraft` | Launch | `SmokeCraft.jsx` | none (`sessionNumber={1}` guard, always reachable) | `getEntryRoute()` sends returning guests to `/smokecraft/resume` | **Live, approved image** |
| E2 | `/smokecraft/enroll` | Sign In / Guest Mode | `Enroll.jsx` | `requires="entry"` | n/a (terminal choice) | **Live, approved image** |
| E3 | `/smokecraft/venue-select` | Venue Selection | `VenueSelect.jsx` | `requires="enroll"` | n/a | **Live, strict empty state** |
| E4 | `/smokecraft/identity` | Personal Dashboard | `Identity.jsx` | `requires="entry"` (+ own internal `enroll` gate) | n/a | **Live** |
| E5 | `/smokecraft/resume` | Resume or Start New Journey | `ResumeJourney.jsx` | `requires="enroll"` | Self-healing `resolveSafeResumeTarget()` | **Live, decorative header only** |

## Core Experience — 27-Session Spine (6 Phases)

| Session | Route | Screen title | Component | Phase | Reward event | Merged into | Status (per Static Shell Audit) |
|---|---|---|---|---|---|---|---|
| S1 | `/smokecraft/welcome` | Welcome to Today's Experience | `WelcomeExperience.jsx` | 1 — Session Preparation | `entry` step | — | Fully live |
| S2 | `/smokecraft/humidor-match` | Choose Your Cigar | `HumidorMatch.jsx` | 1 | `humidor-match` step | — | Partially live |
| S3 | `/smokecraft/meet-your-cigar` | Meet Your Cigar | `MeetYourCigar.jsx` | 1 | `meet-your-cigar` step | — | Fully live |
| S4 | `/smokecraft/terroir` | Terroir | `Terroir.jsx` | 1 | `terroir` step | — | Fully live |
| S5 | `/smokecraft/format` | Construction Inspection | `Format.jsx` | 1 | `format` step | — | Static image + overlay |
| S6 | `/smokecraft/cut-toast-light` | Choose Your Cut | `CutToastLight.jsx` | 1 | `cut-toast-light` step | — | Partially live |
| S7 | `/smokecraft/lighting-tutorial` | Lighting Tutorial | `LightingTutorial.jsx` | 1 | `lighting-tutorial` step | — | Fully live |
| S8 | `/smokecraft/first-third` | First Draw | `FirstThird.jsx` | 2 — First Third | `first-third` step | — | Partially live |
| S9 | `/smokecraft/first-third` | Flavor Discovery | `FirstThird.jsx` (shared) | 2 | (shared with S8) | → S8 | Partially live |
| S10 | `/smokecraft/flavor-memory` | Flavor Memory Exercise | `FlavorMemory.jsx` | 2 | `flavor-memory` step | — | Static image + overlay |
| S11 | `/smokecraft/pairing-lab` | Suggested Pairings | `PairingLab.jsx` | 2 | `pairing-lab` step | — | Static image + overlay |
| S12 | `/smokecraft/second-third` | Flavor Evolution | `SecondThird.jsx` | 3 — Second Third | `second-third` step | — | Partially live |
| S13 | `/smokecraft/second-third` | Construction Check | `SecondThird.jsx` (shared) | 3 | (shared with S12) | → S12 | Partially live |
| S14 | `/smokecraft/mentor-commentary` | Mentor Commentary | `MentorCommentary.jsx` | 3 | `mentor-commentary` step | — | Fully live |
| S15 | `/smokecraft/knowledge-drop` | Knowledge Drop | `KnowledgeDrop.jsx` | 3 | `knowledge-drop` step | — | Fully live |
| S16 | `/smokecraft/final-third` | Flavor Finish | `FinalThird.jsx` | 4 — Final Third | `final-third` step | — | Static image + overlay |
| S17 | `/smokecraft/final-third` | Strength Progression | `FinalThird.jsx` (shared) | 4 | (shared with S16) | → S16 | Static image + overlay |
| S18 | `/smokecraft/final-third` | Overall Experience Notes | `FinalThird.jsx` (shared) | 4 | (shared with S16) | → S16 | Static image + overlay |
| S19 | `/smokecraft/scorecard` | Rate Every Category | `Scorecard.jsx` | 5 — Reflection | `scorecard` step | — | Partially live |
| S20 | `/smokecraft/scorecard` | Personal Notes | `Scorecard.jsx` (shared) | 5 | (shared with S19) | → S19 | Partially live |
| S21 | `/smokecraft/ai-summary` | AI Summary | `AISummary.jsx` | 6 — Results | `ai-summary` step | — | Fully live |
| S22 | `/smokecraft/pairing-recommendations` | Personalized Pairing Recommendations | `PairingRecommendations.jsx` | 6 | `pairing-recommendations` step | — | Fully live |
| S23 | `/smokecraft/passport-stamp` | Passport Stamp Animation | `PassportStamp.jsx` | 6 | `passport-stamp` step | — | Static image + overlay |
| S24 | `/smokecraft/final-review` | Completed Scorecard | `FinalReview.jsx` | 6 | `final-review` step | — | Static image + overlay |
| S25 | `/smokecraft/rewards` | Rewards and XP | `Rewards.jsx` | 6 | `rewards` step | — | Fully live |
| S26 | `/smokecraft/rewards` | Achievements | `Rewards.jsx` (shared) | 6 | own gate enforced inside `Rewards.jsx` | shares route with S25 | Fully live |
| S27 | `/smokecraft/session-complete` | Recommended Next Journey | `SessionComplete.jsx` | 6 | `session-complete` step | — | Fully live |

All 27 sessions explicitly mapped above, as required.

## Supporting / Conditional Modules (outside the 27-session count, 9 screens)

| Route | Label | Requires | Status |
|---|---|---|---|
| `/smokecraft/golden-box` | Gold Box Rules | `entry` | Static image + overlay |
| `/smokecraft/mentor-selection` | Mentor Selection | `entry` | Static image + overlay |
| `/smokecraft/wrapper-strength` | Wrapper / Strength Education | `format` | Redirect-only, no visual (`SC_ASSETS.wrapperStrength = null`) |
| `/smokecraft/request-purchase` | Request / Purchase | `humidor-match` | Partially live |
| `/smokecraft/smokecraft-challenge` | SmokeCraft Challenge | `scorecard` | Fully live |
| `/smokecraft/second-humidor-match` | Second Humidor Match | `scorecard` | Static screenshot |
| `/smokecraft/mini-tasting` | Mini Tasting Round | `scorecard` | Static screenshot |
| `/smokecraft/connections` | 360 Passport Connections | `passport-stamp` | Static image + overlay |
| `/smokecraft/management-sync` | Venue / Management Sync | `passport-stamp` | Static image + overlay |

## Additional supporting/informational screens found in the active router (not in `SUPPORTING_MODULES` but reachable)

| Route | Component | Notes |
|---|---|---|
| `/smokecraft/how-it-works` | `HowItWorks.jsx` | Static screenshot, informational only |
| `/smokecraft/leaderboard` | `Leaderboard.jsx` | Fully live |
| `/smokecraft/event-challenge` | `EventChallenge.jsx` | Fully live |
| `/smokecraft/knowledge-check-demo` | `KnowledgeCheckDemo.jsx` | QA harness, not a designed production screen |
| `/smokecraft/mini-tasting-module` | `MiniTasting.jsx` | Fully live — **distinct** from the spine-completion twin `/smokecraft/mini-tasting` (`MiniTastingRound.jsx`); these are two different components for a similar concept. Flagged as a duplication requiring a scope decision, not resolved in this pass. |
| `/smokecraft/golden-box/status` | `GoldenBoxStatus.jsx` | Static screenshot, sub-route of Golden Box |

## Conflicts to resolve (reported, not silently fixed)

1. **`mini-tasting` vs `mini-tasting-module`** — two separate components serve overlapping concepts (one gates spine session unlock via `awardSessionRewards`, the other is a standalone Package Q module). Do not merge without explicit direction — flagged in the prior `SMOKECRAFT_LIVE_REBUILD_MATRIX.md` as well.
2. **Legacy `SMOKECRAFT_FLOW` array** in `session.js` (28 entries, "8-visit"-era naming absent but structurally superseded) is dead weight — no guard reads it, but it is still exported and could mislead a future reader. Recommend deletion in a future cleanup package, not this one (out of scope per "do not delete anything during this phase").
3. **Orphaned educational stand-ins** (`Origins`, `Curation`, `Leaves`, `LeafChallenge*`, `Cultivation`, `Blend`, `FlavorDNA`, `Pairing`, `Available`, `Assistant`, `PairingMastery`, `Vitola`) — reachable by direct URL, not linked from any current journey screen, all static screenshots. Recommend "removal-after-verification" per the prior audit, not resolved here.
4. **Resume/Venue Selection placement** — already correctly placed at E5/E3 per `ENTRY_LAYER_SCREENS`; router guards match. No conflict found.
5. **Golden Box / Mentor Selection placement** — both correctly modeled as `SUPPORTING_MODULES` reachable from S1 (`requires: 'entry'`), not part of the numbered spine. No conflict found.

**Nothing was deleted during this phase.**
