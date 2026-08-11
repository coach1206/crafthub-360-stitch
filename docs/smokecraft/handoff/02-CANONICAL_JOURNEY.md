# SmokeCraft 360 — Canonical Journey (Doc 2 of 8)

Source of truth: `docs/smokecraft/SMOKECRAFT_CANONICAL_JOURNEY_MANIFEST.json`
(generated directly from `src/constants/session.js`) and
`docs/smokecraft/journey-lock-proof/CANONICAL_JOURNEY_LOCK_REPORT.json`
(a real-browser trace confirming the app actually walks this order).

This is the **locked** sequence — 27 numbered sessions across 6 phases,
merged down to 21 distinct screens where several numbered sessions render on
one screen (see "merged" column). A guest cannot skip a required step: every
route past the entry layer is gated by `SmokeCraftSessionGuard`, verified in
doc 07's route-bypass and back-button checks.

## Entry layer (outside the 27-session spine)

| ID | Route | Label |
|---|---|---|
| launch | `/smokecraft` | Launch (public landing, pre-enrollment) |
| sign-in | `/smokecraft/enroll` | Sign In / Guest Mode |
| personal-dashboard | `/smokecraft/identity` | Personal Dashboard |
| venue-select | `/smokecraft/venue-select` | Venue Selection |
| resume | `/smokecraft/resume` | Resume or Start New Journey *(non-linear — reached only by a returning guest, not traversed mid-sequence)* |

## The 27-session / 6-phase spine

### Phase 1 — Session Preparation (S1–S7)

| S# | Screen ID | Route | Label |
|---|---|---|---|
| 1 | entry | `/smokecraft/welcome` | Welcome to Today's Experience |
| 2 | humidor-match | `/smokecraft/humidor-match` | Choose Your Cigar |
| 3 | meet-your-cigar | `/smokecraft/meet-your-cigar` | Meet Your Cigar |
| 4 | terroir | `/smokecraft/terroir` | Terroir |
| 5 | format | `/smokecraft/format` | Construction Inspection |
| 6 | cut-toast-light | `/smokecraft/cut-toast-light` | Choose Your Cut |
| 7 | lighting-tutorial | `/smokecraft/lighting-tutorial` | Lighting Tutorial |

### Phase 2 — First Third (S8–S11)

| S# | Screen ID | Route | Label | Merge |
|---|---|---|---|---|
| 8 | first-third | `/smokecraft/first-third` | First Draw | — |
| 9 | first-third | `/smokecraft/first-third` | Flavor Discovery | merged into S8 |
| 10 | flavor-memory | `/smokecraft/flavor-memory` | Flavor Memory Exercise | — |
| 11 | pairing-lab | `/smokecraft/pairing-lab` | Suggested Pairings | — |

### Phase 3 — Second Third (S12–S15)

| S# | Screen ID | Route | Label | Merge |
|---|---|---|---|---|
| 12 | second-third | `/smokecraft/second-third` | Flavor Evolution | — |
| 13 | second-third | `/smokecraft/second-third` | Construction Check | merged into S12 |
| 14 | mentor-commentary | `/smokecraft/mentor-commentary` | Mentor Commentary | — |
| 15 | knowledge-drop | `/smokecraft/knowledge-drop` | Knowledge Drop | — |

### Phase 4 — Final Third (S16–S18)

| S# | Screen ID | Route | Label | Merge |
|---|---|---|---|---|
| 16 | final-third | `/smokecraft/final-third` | Flavor Finish | — |
| 17 | final-third | `/smokecraft/final-third` | Strength Progression | merged into S16 |
| 18 | final-third | `/smokecraft/final-third` | Overall Experience Notes | merged into S16 |

### Phase 5 — Reflection (S19–S20)

| S# | Screen ID | Route | Label | Merge |
|---|---|---|---|---|
| 19 | scorecard | `/smokecraft/scorecard` | Rate Every Category | — |
| 20 | scorecard | `/smokecraft/scorecard` | Personal Notes | merged into S19 |

### Phase 6 — Results (S21–S27)

| S# | Screen ID | Route | Label | Merge |
|---|---|---|---|---|
| 21 | ai-summary | `/smokecraft/ai-summary` | AI Summary | — |
| 22 | pairing-recommendations | `/smokecraft/pairing-recommendations` | Personalized Pairing Recommendations | — |
| 23 | passport-stamp | `/smokecraft/passport-stamp` | Passport Stamp Animation | — |
| 24 | final-review | `/smokecraft/final-review` | Completed Scorecard | — |
| 25 | rewards | `/smokecraft/rewards` | Rewards and XP | — |
| 26 | achievements | `/smokecraft/rewards` | Achievements | same route as S25, own in-screen gate |
| 27 | session-complete | `/smokecraft/session-complete` | Recommended Next Journey | — |

## Supporting modules (outside the numbered spine, gated by prerequisite)

| ID | Route | Label | Requires |
|---|---|---|---|
| golden-box | `/smokecraft/golden-box` | Gold Box Rules | entry |
| mentor | `/smokecraft/mentor-selection` | Mentor Selection | entry |
| seed-soil | `/smokecraft/seed-soil` | Seed & Soil | mentor |
| wrapper-strength | `/smokecraft/wrapper-strength` | Wrapper / Strength Education | format |
| request-purchase | `/smokecraft/request-purchase` | Request / Purchase | humidor-match |
| smokecraft-challenge | `/smokecraft/smokecraft-challenge` | SmokeCraft Challenge | scorecard |
| second-humidor-match | `/smokecraft/second-humidor-match` | Second Humidor Match | scorecard |
| mini-tasting | `/smokecraft/mini-tasting` | Mini Tasting Round | scorecard |
| connections | `/smokecraft/connections` | 360 Passport Connections | passport-stamp |
| management-sync | `/smokecraft/management-sync` | Venue / Management Sync | passport-stamp |

## Canonical route order (as walked end to end)

```
/smokecraft
/smokecraft/enroll
/smokecraft/identity
/smokecraft/venue-select
/smokecraft/welcome
/smokecraft/humidor-match
/smokecraft/meet-your-cigar
/smokecraft/terroir
/smokecraft/format
/smokecraft/cut-toast-light
/smokecraft/lighting-tutorial
/smokecraft/first-third
/smokecraft/flavor-memory
/smokecraft/pairing-lab
/smokecraft/second-third
/smokecraft/mentor-commentary
/smokecraft/knowledge-drop
/smokecraft/final-third
/smokecraft/scorecard
/smokecraft/ai-summary
/smokecraft/pairing-recommendations
/smokecraft/passport-stamp
/smokecraft/final-review
/smokecraft/rewards
/smokecraft/session-complete
```

This order was confirmed by a real-browser trace on this branch (24/25
checkpoints visited and matched — Pairing Lab's checkpoint is folded into the
First Third check in that specific trace run; see doc 07 for the full
pass/fail detail) with **0 defects, `canonicalJourneyPass: true`**.

## What "required interaction gate" means here

Two screens in the spine genuinely block advancement on zero input (verified,
not just documented): **Final Third** (must select at least one flavor chip)
and **Scorecard** (must rate all 6 categories). Every other screen's
"Continue" is a real navigation, not a decorative button.
