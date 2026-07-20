# Package 5 — Leaf-to-Cigar Experience Audit

| Area | Screen/Route | Classification | Notes |
|---|---|---|---|
| Leaf primings (ligero/viso/seco/volado) | none dedicated | MISSING_INTERACTION | Real catalog content exists (Package 3); no screen surfaces it interactively |
| Leaf comparison | none | MISSING_CONTENT | No comparison tool exists anywhere in the codebase |
| Wrapper / Binder / Filler roles | none dedicated | MISSING_INTERACTION | Real catalog content exists; only reachable today via Golden Box's blend-picker dropdown, not as a standalone lesson |
| Long vs. short filler | none | MISSING_INTERACTION | Catalog rows exist; no comparison UI |
| Filler arrangement | none | MISSING_CONTENT | No practice/arrangement mechanic exists |
| Bunching methods | none | MISSING_CONTENT | No catalog rows, no UI |
| Binder application / molding / wrapper application / cap / foot | none | MISSING_CONTENT | No catalog rows, no UI |
| Full rolling-process sequence | none | MISSING_CONTENT | No connected step sequence exists |
| Quality control / draw testing | none | MISSING_CONTENT | No checklist mechanic exists |
| Curing | 1 catalog row (`air-cured`) | STATIC_SHELL | Real content, zero interaction, not surfaced in any UI |
| Fermentation | 1 catalog row (`pilon-fermentation`) | STATIC_SHELL | Same |
| Aging | 1 catalog row (`leaf-aging`) | STATIC_SHELL | Same |
| Leaf sorting / grading | none | MISSING_CONTENT | — |
| Final resting / box aging | none | MISSING_CONTENT | — |
| `/smokecraft/wrapper-strength` route | supporting module | FUNCTIONAL_BUT_INCOMPLETE | Currently a dead pass-through redirect (awards step, sends to seed-soil, renders nothing) — the natural home for this package's build, since building here reuses an existing route rather than creating a new one |
| `/smokecraft/format` (Session 5, Construction Inspection) | numbered spine | VERIFIED_COMPLETE / PROTECTED-adjacent | Working, unrelated screen — out of scope, not modified |
| Golden Box blend-component types | `golden_box_component_catalog` / `golden_box_blend_components` | VERIFIED_COMPLETE | Already accepts every component type this package teaches; no schema change needed here |
| `smokecraft_seed_soil_notes/_progress/_quiz_attempts` | migration 080 | VERIFIED_COMPLETE, reusable | Generic by design (guest_reference + component_id) despite the table name — reused as-is for Package 5, not modified |
| Migrations 075-080 | — | PROTECTED | Not touched |
| Venue Management, Flavor Memory, Pairing Lab, Badges, Passport, Leaderboard, GoldenBox.jsx, GoldenBoxStatus.jsx | — | PROTECTED | Not touched |

No screen was marked complete on the basis of artwork — every classification above reflects actual interaction and content state, verified by reading the component source, not by visual impression.
