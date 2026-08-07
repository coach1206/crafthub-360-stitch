# Canonical 27-Session Sequence

The complete, locked, code-verified sequence. Generated data lives in `docs/SMOKECRAFT_FULL_GAME_INVENTORY.md` and `docs/SMOKECRAFT_FULL_ROUTE_GRAPH.json` — this file is the human-readable summary for design purposes.

## Entry layer (before Session 1, not counted in the 27)

Launch (`/smokecraft`) → Sign In / Guest Mode (`/smokecraft/enroll`) → Personal Dashboard (`/smokecraft/identity`) → Venue Selection (`/smokecraft/venue-select`) → Welcome to Today's Experience (Session 1).

## The recovered opening chain (real, required, part of the actual playthrough)

Welcome (S1) → **Golden Box Rules** (`/smokecraft/golden-box`) → **Mentor Selection** (`/smokecraft/mentor-selection`) → **Seed & Soil** (`/smokecraft/seed-soil`) → Choose Your Cigar (S2, Humidor Match).

These three screens sit outside the 27-session count (they're "supporting modules" in the code, not renumbered spine sessions) but are a real, mandatory part of the primary path a player's Continue/Begin buttons take them through — do not treat them as optional or skippable in the visual design.

## Phase 1 — Session Preparation (S1–S7)

| S# | Title | What happens |
|---|---|---|
| 1 | Welcome to Today's Experience | Orientation, sets the tone, "Begin Experience" starts the journey |
| 2 | Choose Your Cigar (Humidor Match) | Choose a storage environment (Virtual Humidor / Dry Box / Travel Case), adjust temp/humidity/seal/airflow, optionally pick a cigar |
| 3 | Meet Your Cigar | Introduces the chosen/recommended cigar's profile |
| 4 | Terroir | Origin/growing-region education |
| 5 | Construction Inspection (Format) | Shape/size/burn-time selection |
| 6 | Choose Your Cut | Cut-toast-light technique selection |
| 7 | Lighting Tutorial | Step-by-step lighting instruction |

## Phase 2 — First Third (S8–S11)

First Draw / Flavor Discovery (merged, S8/S9) → Flavor Memory Exercise (S10) → Suggested Pairings (S11).

## Phase 3 — Second Third (S12–S15)

Flavor Evolution / Construction Check (merged, S12/S13) → Mentor Commentary (S14) → Knowledge Drop (S15).

## Phase 4 — Final Third (S16–S18)

Flavor Finish / Strength Progression / Overall Experience Notes — all three merged into one screen (`FinalThird.jsx`), each keeps its own stable session number/title.

## Phase 5 — Reflection (S19–S20)

Rate Every Category / Personal Notes — merged into one screen (`Scorecard.jsx`).

## Phase 6 — Results (S21–S27)

AI Summary (S21) → Personalized Pairing Recommendations (S22) → Passport Stamp Animation (S23) → Completed Scorecard (S24) → Rewards and XP (S25) → Achievements (S26, shares the Rewards screen) → Recommended Next Journey / Session Complete (S27).

## After Session 27

The player may continue into the real Golden Box competition flow (build → submit → judge → finalize → award) — a separate, real backend-driven system, not part of the numbered spine.

## Merged sessions — why some numbers share one screen

Several session numbers intentionally render the same component (S8/S9, S12/S13, S16/S17/S18, S19/S20, S25/S26). Each keeps its own number, title, and reward hooks in the data — the merge is a content decision (one screen legitimately covers what was originally planned as separate numbered beats), not a bug. Do not "fix" this by splitting them into separate screens without an explicit product decision to do so.
