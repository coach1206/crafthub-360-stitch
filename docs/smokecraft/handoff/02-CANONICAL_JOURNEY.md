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

## Explicit full-topic coverage (46 required topics, verified against source files)

Every topic below was checked directly against the screen/component source
(not assumed) — the "Where it actually lives" column names the real
screen/section, and the note flags anywhere the requested phrase isn't the
literal on-screen label even though the concept is covered.

| # | Topic | Where it actually lives | Route |
|---|---|---|---|
| 1 | Welcome | S1 screen, titled "Welcome to Today's Experience" | `/smokecraft/welcome` |
| 2 | Enroll | Entry layer, "Sign In / Guest Mode" | `/smokecraft/enroll` |
| 3 | Identity | Entry layer, "Personal Dashboard" | `/smokecraft/identity` |
| 4 | Mentor Selection | Supporting module | `/smokecraft/mentor-selection` |
| 5 | Seed & Soil | Supporting module | `/smokecraft/seed-soil` |
| 6 | Terroir | S4 | `/smokecraft/terroir` |
| 7 | Tobacco Plant Anatomy | `SeedSoil.jsx`'s "Explore Plant Anatomy" expander (`plant_anatomy` catalog); also `Vitola.jsx`'s "Cigar Anatomy" chip row | `/smokecraft/seed-soil` |
| 8 | Primings | `WrapperStrength.jsx`, "Leaf Primings" section (`leaf_priming` category) | `/smokecraft/wrapper-strength` |
| 9 | Wrapper / Binder / Filler | `WrapperStrength.jsx`, "Wrapper", "Binder", "Filler" sections | `/smokecraft/wrapper-strength` |
| 10 | Long Filler vs Short Filler | `WrapperStrength.jsx`, "Filler (including Long vs. Short)" section | `/smokecraft/wrapper-strength` |
| 11 | Curing | `WrapperStrength.jsx`'s "Curing, Fermentation & Aging" section (`processing_method` category); also titled standalone in the older `Cultivation.jsx` supplemental page | `/smokecraft/wrapper-strength` |
| 12 | Fermentation | Same `WrapperStrength.jsx` section; **also** its own dedicated tab titled "Fermentation" on the S15 Knowledge Drop screen | `/smokecraft/wrapper-strength`, `/smokecraft/knowledge-drop` |
| 13 | Aging | Same as above; **also** its own dedicated tab titled "Aging" on Knowledge Drop | `/smokecraft/wrapper-strength`, `/smokecraft/knowledge-drop` |
| 14 | Cigar Construction | S5, literally titled "Construction Inspection" | `/smokecraft/format` |
| 15 | Vitola / Format | S5 (format selection); the supplemental `Vitola.jsx` page covers vitola/anatomy/sensory practice in more depth | `/smokecraft/format`, `/smokecraft/vitola` |
| 16 | Ring Gauge | `CigarGaugeGuide.jsx` (S5 supporting page, "Ring Gauge Scale"); also a `ring_gauge` category in `Vitola.jsx` | `/smokecraft/cigar-gauge-guide`, `/smokecraft/vitola` |
| 17 | Size / Shape | S5 Format screen's cigar-format cards (Robusto/Toro/Churchill/Corona/Gordo/Torpedo, each showing length + ring gauge) | `/smokecraft/format` |
| 18 | Humidor Match | S2 | `/smokecraft/humidor-match` |
| 19 | Meet Your Cigar | S3 | `/smokecraft/meet-your-cigar` |
| 20 | Visual Inspection | **Note:** no screen carries this exact literal label. The concept — inspecting the cigar before proceeding — is what S3 Meet Your Cigar and S5 Format's Construction Inspection are for; there is no separately titled "Visual Inspection" step. | `/smokecraft/meet-your-cigar` |
| 21 | Aroma / Pre-Light Nose | **Note:** no literal "Pre-Light Nose" step exists. The closest on-screen equivalent is First Third's "Aroma Opening" observation chip, which is captured after lighting, not before. | `/smokecraft/first-third` |
| 22 | Cold Draw | **Note:** the literal on-screen title is "The Proper First Draw" (`LightingTutorial.jsx`, S7) — same concept (drawing before/at lighting), different exact wording. | `/smokecraft/lighting-tutorial` |
| 23 | Cut | S6, "Choose Your Cut" | `/smokecraft/cut-toast-light` |
| 24 | Toast | S7 `LightingTutorial.jsx` step titled "Toasting the Foot" | `/smokecraft/lighting-tutorial` |
| 25 | Light | S7 `LightingTutorial.jsx` step titled "Lighting Technique" | `/smokecraft/lighting-tutorial` |
| 26 | Draw | S7's "The Proper First Draw" step; also First Third's "Draw Ease" observation chip | `/smokecraft/lighting-tutorial`, `/smokecraft/first-third` |
| 27 | Burn Line | S7's "Burn Inspection" step; also First Third's "Burn Line" observation chip (literal match) | `/smokecraft/lighting-tutorial`, `/smokecraft/first-third` |
| 28 | Ash | First Third's "Ash Quality" observation chip (literal match) | `/smokecraft/first-third` |
| 29 | First Third | S8/S9 | `/smokecraft/first-third` |
| 30 | Flavor Memory | S10 | `/smokecraft/flavor-memory` |
| 31 | Pairing Lab | S11 | `/smokecraft/pairing-lab` |
| 32 | Second Third | S12/S13 | `/smokecraft/second-third` |
| 33 | Flavor Development | Literal on-screen title of the Second Third screen (confirmed in the current visual proof — see doc 06) | `/smokecraft/second-third` |
| 34 | Mentor Commentary | S14 | `/smokecraft/mentor-commentary` |
| 35 | Knowledge Drop / Knowledge Check | S15 Knowledge Drop; the separate `KnowledgeCheckDemo.jsx` is a standalone QA harness for the reusable quiz component, not part of the numbered spine | `/smokecraft/knowledge-drop`, `/smokecraft/knowledge-check-demo` |
| 36 | Final Third | S16/S17/S18 | `/smokecraft/final-third` |
| 37 | Scorecard | S19/S20 | `/smokecraft/scorecard` |
| 38 | AI Summary | S21 | `/smokecraft/ai-summary` |
| 39 | Final Review | S24, "Completed Scorecard" | `/smokecraft/final-review` |
| 40 | Request / Purchase | Supporting module (reachable from S2, requires `humidor-match`) | `/smokecraft/request-purchase` |
| 41 | Pairing Recommendations | S22 | `/smokecraft/pairing-recommendations` |
| 42 | Passport Stamp | S23 | `/smokecraft/passport-stamp` |
| 43 | Connections | Supporting module (requires `passport-stamp`) | `/smokecraft/connections` |
| 44 | Rewards | S25/S26 | `/smokecraft/rewards` |
| 45 | Second Humidor Match | Supporting module (requires `scorecard`) | `/smokecraft/second-humidor-match` |
| 46 | Session Complete | S27 | `/smokecraft/session-complete` |

**Every one of the 46 required topics is accounted for above** — 43 map to a
screen/section carrying that exact or a directly equivalent literal label;
3 (#20 Visual Inspection, #21 Aroma/Pre-Light Nose, #22 Cold Draw) are noted
explicitly as concepts covered by an existing screen under different exact
wording, rather than silently mapped as if the literal phrase existed on
screen. Nothing on the list was left out.

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
