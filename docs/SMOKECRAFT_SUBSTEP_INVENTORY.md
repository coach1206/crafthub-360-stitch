# SmokeCraft 360 — Substep Inventory

Cross-reference of every session/screen that is NOT a simple one-screen-one-action pattern. Full detail (instruction/state/completion signal per substep): `docs/smokecraft-ui-handoff/FULL_SUBSTEP_SEQUENCE.md`. This file is the audit-facing index; that file is the design-facing spec.

| Screen | Substeps | Hidden-screen risk found? |
|---|---|---|
| Humidor Match (S2) | environment select → adjust controls → apply → continue | No — all real, all live DOM (verified, SC-D076 fixed) |
| Format (S5) | shape/size select → burn-time → branches to Request/Purchase | No — branch is intentional, documented via `nextRouteOverride` |
| First/Second/Final Third (S8-9, 12-13, 16-18) | notes-selected chips → personal notes → submit evidence → complete | No — single real evidence payload per merged group |
| Scorecard (S19-20) | 6-category rating → notes → submit (server computes overall) | No |
| Golden Box Rules (opening chain) | read principles → acknowledge → continue | No |
| Mentor Selection (opening chain) | browse → select up to 2 → continue | No |
| Golden Box (post-game) | create entry → build → present → defend → submit → (judge: assign → rubric → finalize → award) | No — real, multi-actor, already covered by dedicated Golden Box test packages |
| Passport Stamp (S23) | eligibility check (server) → claim | No |

**No screen was found to contain an undisclosed hidden gameplay screen this pass.** Every internal state transition above was already discoverable from each component's own `useState`/`phase` variables and matched what the session's title/purpose implies — no surprise substeps were uncovered.
