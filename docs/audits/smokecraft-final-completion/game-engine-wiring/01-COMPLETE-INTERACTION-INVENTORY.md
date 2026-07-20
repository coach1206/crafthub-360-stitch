# Game-Engine Wiring — Interaction Inventory (Scoped)

Full per-control inventory of all 27 sessions was not attempted in this single pass — see the
consolidation notice in `00-GAME-ENGINE-BASELINE.md`. This is a real, screen-level inventory of the
major interaction surfaces, classified using the mandate's own categories, based on what each screen's
own (already-passing, already-real) test suite actually asserts — not re-derived speculation.

| Screen/Route | Control types | Classification | Evidence |
|---|---|---|---|
| SeedSoil.jsx (`/smokecraft/seed-soil`) | Hotspot zone selection, notes field, knowledge check | FULLY_WIRED | `verify-golden-box-package-4-seed-soil.mjs` 17/17 — DB-persisted, rehydrated after reload, real knowledge-check feedback |
| WrapperStrength.jsx (`/smokecraft/wrapper-strength`) | Leaf priming cards, comparison tool, rolling-process steps, QC checklist, notes, knowledge check | FULLY_WIRED | `verify-golden-box-package-5-leaf-construction.mjs` 27/27 — DB-persisted, rehydrated, keyboard-accessible, no default selection |
| EntryWorkspace.jsx (Golden Box, `/smokecraft/golden-box/entries/:id`) | Component selection, draft save, presentation/pairing/defense fields, submit | FULLY_WIRED | `verify-golden-box-package-1/2/3/7a.mjs` — real draft state, ownership-enforced, resumes correctly |
| JudgeEntryReview.jsx / scorecard (`/smokecraft/golden-box/judge/entries/:id`) | Score inputs (12 categories), lock/amend/void actions | FULLY_WIRED | `verify-golden-box-package-7a.mjs` — real backend lifecycle, no prefilled scores, ownership-enforced |
| MentorReview.jsx (`/smokecraft/golden-box/mentor/entries/:id`) | 10 feedback fields, readiness toggle, save/submit | FULLY_WIRED | `verify-golden-box-package-7a.mjs` — real persistence, role-gated |
| ResultsExperience.jsx (`/smokecraft/golden-box/results/:id`) | Continue action | FULLY_WIRED (display-only, no user-modifiable state) | `verify-golden-box-package-7a.mjs` |
| **FlavorMemory.jsx (`/smokecraft/flavor-memory`)** | **Flavor-zone toggle buttons, 3 perception sliders, notes field, Continue** | **Was PARTIALLY_WIRED (real backend save existed but only fired once at the end, silently) → now FULLY_WIRED** | Fixed and verified this pass, see `05-TEST-EVIDENCE.md` |
| Scorecard.jsx (`/smokecraft/scorecard`) | Not inspected this pass | NOT_AUDITED | No dedicated suite found; flagged for a future pass |
| PairingLab.jsx (`/smokecraft/pairing-lab`) | Not inspected this pass | NOT_AUDITED | No dedicated suite found; flagged for a future pass |
| HumidorMatch.jsx / SecondHumidorMatch.jsx | Not inspected this pass | NOT_AUDITED | No dedicated suite found; flagged for a future pass |
| CigarGaugeGuide.jsx (`/smokecraft/cigar-gauge-guide`) | Static reference table, no user-modifiable state | NOT_APPLICABLE | Confirmed read-only (Phase 2 image-integration pass) |
| LeafChallenge*.jsx family | Not inspected this pass | NOT_AUDITED | Flagged in Image Integration Phase 2's gap audit as needing a hero-art + full interaction review together |
| Passport/Badges/Leaderboard core screens | Not inspected this pass — explicitly protected | NOT_AUDITED (protected) | Out of scope per mandate |

## Honest summary

- **Confirmed FULLY_WIRED with real, already-passing evidence**: 6 major screens/flows (Seed & Soil,
  Wrapper/Leaf Construction, Golden Box entry workspace, judge scorecard, mentor review, results).
- **Found PARTIALLY_WIRED and fixed this pass**: 1 (FlavorMemory perception sliders/flavor selection).
- **NOT_AUDITED this pass** (no dedicated suite exists to confirm either way): Scorecard.jsx,
  PairingLab.jsx, HumidorMatch.jsx/SecondHumidorMatch.jsx, LeafChallenge family, and any session screen
  not named above. These are not claimed wired or broken — they are honestly unverified, and are the
  clear candidate list for the next controlled game-engine-wiring pass.
