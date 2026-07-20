# Locked Session Registry — 27 Sessions (source of truth: `src/constants/session.js`)

## Conflict note (required — not silently resolved)

The implementation in `src/constants/session.js` (`TOTAL_VISITS = 6`,
`TOTAL_PHASES = TOTAL_VISITS`) groups the 27 locked sessions into **6
implementation phases**, further grouped into **3 macro-rounds**
(`ROUNDS`). Earlier product mandates (including the most recent
SmokeCraft 360 completion mandate) refer to **7 phases**. This is a
genuine terminology/architecture conflict between documentation and the
actual, currently-running code. **No sequence change is authorized by
this audit.** The 27-session order and 6-phase code grouping below are
reproduced exactly as found — see Decision 1 in
`09-OWNER-DECISION-REGISTER.md` for the two resolution options and a
recommendation.

## Registry

Columns: Seq / ID / Title / Phase / Round / Route / Component / Status /
Backend dep / Live interactions required / Assets / Quiz / XP / Golden
Box relevance / Known gap / Do-not-touch.

| # | ID | Title | Phase | Round | Route | Component | Status | Backend dep | Live interaction | Assets | Quiz | XP | Golden Box relevance | Known gap | Do-not-touch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | entry | Welcome to Today's Experience | 1 Session Preparation | 1 | `/smokecraft/welcome` | `WelcomeExperience.jsx` | VERIFIED_COMPLETE | `smokecraft_management_sync_journeys` (server START), session/local storage | Begin Experience button, real START call | SC_ASSETS entry art | No | Session-complete based | Journey origin point | None found | YES |
| 2 | humidor-match | Choose Your Cigar | 1 | 1 | `/smokecraft/humidor-match` | `HumidorMatch.jsx` (299 lines) | VERIFIED_COMPLETE | session-scoped state | Cigar selection cards | SC_ASSETS | No | Yes | Feeds cigar identity into blend context (loosely) | Choice not persisted to a normalized cigar-catalog table | YES |
| 3 | meet-your-cigar | Meet Your Cigar | 1 | 1 | `/smokecraft/meet-your-cigar` | (not audited this pass — file exists per route map) | EXISTS_NEEDS_UPDATE (unconfirmed depth) | — | — | SC_ASSETS | No | Yes | Cigar-identity reinforcement | Not deep-audited this pass | YES pending confirmation |
| 4 | terroir | Terroir | 1 | 1 | `/smokecraft/terroir` | `Terroir.jsx` | EXISTS_NEEDS_UPDATE | session-scoped JSONB only | Guided choice UI | SC_ASSETS | Partial | Yes | **Direct Golden Box prerequisite** (region/soil knowledge) | No normalized terroir/region table | YES, extend don't replace |
| 5 | format | Construction Inspection | 1 | 1 | `/smokecraft/format` | `Format.jsx` | VERIFIED_COMPLETE | session-scoped | Shape/size/burn-time choice | SC_ASSETS | No | Yes | Vitola/ring-gauge prerequisite for Golden Box | No normalized vitola/ring-gauge catalog | YES |
| 6 | cut-toast-light | Choose Your Cut | 1 | 1 | `/smokecraft/cut-toast-light` | `CutToastLight` (not directly audited this pass) | EXISTS_NEEDS_UPDATE (unconfirmed) | — | — | SC_ASSETS | No | Yes | Smoking-skill prerequisite | Not deep-audited this pass | YES pending confirmation |
| 7 | lighting-tutorial | Lighting Tutorial | 1 | 1 | `/smokecraft/lighting-tutorial` | (not directly audited this pass) | EXISTS_NEEDS_UPDATE (unconfirmed) | — | — | SC_ASSETS | No | Yes | Smoking-skill prerequisite | Not deep-audited this pass | YES pending confirmation |
| 8 | first-third | First Draw | 2 First Third | 1 | `/smokecraft/first-third` | `FirstThird.jsx` | VERIFIED_COMPLETE | session-scoped | Tasting notes UI | SC_ASSETS | No | Yes | Flavor-profile prerequisite | Merged with S9 (see below) | YES |
| 9 | first-third | Flavor Discovery (merged→8) | 2 | 1 | `/smokecraft/first-third` | same as S8 | VERIFIED_COMPLETE (shared) | shared with S8 | shared with S8 | shared | No | Yes | Flavor-profile prerequisite | Cannot independently track completion (documented, honest merge) | YES |
| 10 | flavor-memory | Flavor Memory Exercise | 2 | 1 | `/smokecraft/flavor-memory` | `FlavorMemory.jsx` (339 lines) | VERIFIED_COMPLETE | `smokecraft_flavor_memory`, `passport_360_smokecraft_flavor_memory` | Real interactive memory game | SC_ASSETS | Implicit (game-based) | Yes | **Direct Golden Box prerequisite** (flavor taxonomy) | No shared flavor-family taxonomy table for reuse elsewhere | YES |
| 11 | pairing-lab | Suggested Pairings | 2 | 1 | `/smokecraft/pairing-lab` | `PairingLab.jsx` (336 lines) | VERIFIED_COMPLETE | `smokecraft_pairing_profiles/recommendations/audit`, `pairingEngine.js` | Real pairing builder | SC_ASSETS | No | Yes | **Direct Golden Box prerequisite** (pairing builder logic reusable) | Engine is session-scoped, not yet exposed as a reusable Golden Box service | YES |
| 12 | second-third | Flavor Evolution | 3 Second Third | 2 | `/smokecraft/second-third` | `SecondThird.jsx` | VERIFIED_COMPLETE | session-scoped | Tasting notes UI | SC_ASSETS | No | Yes | Flavor-progression prerequisite | Merged with S13 | YES |
| 13 | second-third | Construction Check (merged→12) | 3 | 2 | `/smokecraft/second-third` | same as S12 | VERIFIED_COMPLETE (shared) | shared | shared | shared | No | Yes | Construction-integrity prerequisite | Same honest-merge limitation as S8/S9 | YES |
| 14 | mentor-commentary | Mentor Commentary | 3 | 2 | `/smokecraft/mentor-commentary` | `MentorCommentary.jsx` (294 lines) | VERIFIED_COMPLETE | mentor lore array (static, not DB) | Real mentor commentary UI | SC_ASSETS + mentor portraits | No | Yes | Mentor-affinity signal for Golden Box mentor review | Mentor lore/affinity has no DB persistence (Gap #4) | YES |
| 15 | knowledge-drop | Knowledge Drop | 3 | 2 | `/smokecraft/knowledge-drop` | `KnowledgeDrop.jsx` (386 lines) | VERIFIED_COMPLETE (substantial) | session-scoped | Real knowledge-check content | SC_ASSETS | Likely yes (name implies) | Yes | Knowledge-prerequisite signal for Golden Box eligibility | Not deep-audited for Golden Box-specific tagging | YES |
| 16 | final-third | Flavor Finish | 4 Final Third | 2 | `/smokecraft/final-third` | `FinalThird.jsx` | VERIFIED_COMPLETE | session-scoped | Tasting notes UI | SC_ASSETS | No | Yes | Final flavor-profile prerequisite | Merged with S17/S18 | YES |
| 17 | final-third | Strength Progression (merged→16) | 4 | 2 | `/smokecraft/final-third` | same as S16 | VERIFIED_COMPLETE (shared) | shared | shared | shared | No | Yes | Strength/body target prerequisite | Same honest-merge limitation | YES |
| 18 | final-third | Overall Experience Notes (merged→16) | 4 | 2 | `/smokecraft/final-third` | same as S16 | VERIFIED_COMPLETE (shared) | shared | shared | shared | No | Yes | General reflection input | Same honest-merge limitation | YES |
| 19 | scorecard | Rate Every Category | 5 Reflection | 2 | `/smokecraft/scorecard` | `Scorecard.jsx` | VERIFIED_COMPLETE | session-scoped, Management Sync checkpoint (Package D) | Real rating UI | SC_ASSETS | No | Yes | Scoring-category prerequisite (rating dimensions overlap Golden Box's) | Merged with S20 | YES |
| 20 | scorecard | Personal Notes (merged→19) | 5 | 2 | `/smokecraft/scorecard` | same as S19 | VERIFIED_COMPLETE (shared) | shared | shared | shared | No | Yes | Free-text feedback signal | Same honest-merge limitation | YES |
| 21 | ai-summary | AI Summary | 6 Results | 3 | `/smokecraft/ai-summary` | `AISummary.jsx` (not directly audited this pass) | EXISTS_NEEDS_UPDATE (unconfirmed depth) | — | — | SC_ASSETS | No | Yes | **Direct precedent for Golden Box's proposed AI-assisted scoring** | Not confirmed whether real AI call or static summary | YES pending confirmation |
| 22 | pairing-recommendations | Personalized Pairing Recommendations | 6 | 3 | `/smokecraft/pairing-recommendations` | `PairingRecommendations.jsx` (not directly audited) | EXISTS_NEEDS_UPDATE (unconfirmed) | likely reuses `pairingEngine.js` | — | SC_ASSETS | No | Yes | Reusable for Golden Box pairing defense | Not deep-audited this pass | YES pending confirmation |
| 23 | passport-stamp | Passport Stamp Animation | 6 | 3 | `/smokecraft/passport-stamp` | `PassportStamp.jsx` | VERIFIED_COMPLETE | `passport_stamps`, `passport_360_earned_stamps` | Real stamp-award animation | SC_ASSETS | No | Yes | Reward-integration precedent for Golden Box completion | None found | YES |
| 24 | final-review | Completed Scorecard | 6 | 3 | `/smokecraft/final-review` | `FinalReview.jsx` (not directly audited) | EXISTS_NEEDS_UPDATE (unconfirmed) | reuses Scorecard data | — | SC_ASSETS | No | Yes | Review-and-defend precedent | Not deep-audited this pass | YES pending confirmation |
| 25 | rewards | Rewards and XP | 6 | 3 | `/smokecraft/rewards` | `Rewards.jsx` (577 lines, most substantial) | VERIFIED_COMPLETE (substantial) | badges/passport tables + flat-file XP (`ranking_xp.json`) | Real rewards display | SC_ASSETS | No | Yes | Rewards-integration precedent for Golden Box prizes | XP not normalized (Gap #7) | YES |
| 26 | achievements | Achievements (shared component) | 6 | 3 | `/smokecraft/rewards` | shared with S25 | VERIFIED_COMPLETE (shared) | shared with S25 | shared | shared | No | Yes | Achievement/badge precedent | Same shared-component limitation as merged sessions | YES |
| 27 | session-complete | Recommended Next Journey | 6 | 3 | `/smokecraft/session-complete` | `SessionComplete.jsx` | VERIFIED_COMPLETE | Management Sync completion checkpoint (Package D) | Real completion + next-journey recommendation | SC_ASSETS | No | Yes | Journey-closure precedent; natural entry point to a "Enter Golden Box" call-to-action | Golden Box CTA not present today | YES |

## Notes

- Sessions marked "not directly audited this pass" (S3, S6, S7, S21, S22,
  S24) exist as routes/components per `App.jsx`/`session.js` but were not
  individually opened and inspected in this Package 0 pass — flagged
  EXISTS_NEEDS_UPDATE rather than guessed VERIFIED_COMPLETE, per the
  mandate's own rule against marking anything verified without direct
  inspection. Recommend a short follow-up pass to close this before
  Package 1 begins if precision matters for planning.
- Merged sessions (S8/S9, S12/S13, S16/S17/S18, S19/S20, S25/S26) are
  **honest merges**, already documented in `session.js`'s own comments —
  one built screen currently produces one completion signal for what the
  locked map treats as multiple numbered sessions. This is pre-existing,
  approved behavior, not a new gap introduced by this audit.
