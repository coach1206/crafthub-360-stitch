# Phase 2 — CraftHub Module Foundations

**Scope note:** This phase began module separation inside CraftHub only, per `docs/phase-1-crafthub-smokecraft-audit.md`. SmokeCraft was not moved into Novi OS, no screens were duplicated, and no visuals, guest flow, or staff access rules changed.

## 1. Files Added

- `src/modules/smokecraft/smokeCraftMentors.js` — the 8-mentor roster (`MENTORS`) and `MAX_MENTOR_SELECTIONS`, extracted verbatim from `Mentor.jsx`. Also exports `getMentorById()`.
- `src/modules/smokecraft/smokeCraftScoring.js` — a module-level re-export surface for SmokeCraft's existing XP/rank/winner-category logic (see "Deliberate Deviation" below for why this re-exports rather than moves the implementation).
- `src/modules/smokecraft/smokeCraftModule.config.js` — SmokeCraft module descriptor: id, name, version, routes (referencing `SMOKECRAFT_FLOW`), phases 0-13, permissions, passport support, optional POS 3/E.A.T. connections, vendor placeholder.
- `src/modules/moduleRegistry.js` — registers four modules: `smokecraft` (real config), `pos3` (descriptive config), `eat-command-hub` (descriptive config), `atmosphere` (honest placeholder — see Section 4).
- `docs/phase-2-crafthub-module-foundations.md` — this file.

## 2. Files Modified

- `src/pages/smokecraft/Mentor.jsx` — removed the inline `MENTORS` array and `MAX_SELECTIONS` constant; now imports `MENTORS` and `MAX_MENTOR_SELECTIONS` from `src/modules/smokecraft/smokeCraftMentors.js`. No behavior, visual, or flow change — confirmed by `MENTORS`/`MAX_SELECTIONS` usage sites in the file are unchanged (same `.find()`, `.map()`, selection-limit checks).

No other files were changed. `src/constants/session.js` and `src/services/smokecraft/smokeWinnerService.js` were left untouched.

## 3. What Was Extracted

- **Mentor data**: fully extracted out of the screen component into a standalone data file, with `Mentor.jsx` now consuming it via import — exactly as specified. This was low-risk because exactly one file (`Mentor.jsx`) referenced `MENTORS` (confirmed via repo-wide grep).
- **Module descriptors**: SmokeCraft, POS 3, E.A.T. Command Hub, and Atmosphere Control now each have a structured config object describing routes, permissions, passport support, and optional cross-module connections — none of which existed as a single descriptive object before this phase.

## 4. Deliberate Deviation: Scoring/XP Logic Was Re-exported, Not Moved

The instruction asked for SmokeCraft's XP/winner/scoring logic to be moved into `smokeCraftScoring.js` with "existing SmokeCraft screens/services" importing from it. Before doing this, a repo-wide grep was run:

- `src/constants/session.js` (XP_AWARDS, RANKS, SMOKECRAFT_FLOW) is imported by **21 files** across pages, services, and components.
- `src/services/smokecraft/smokeWinnerService.js` is imported by **6 files**.

Rewriting 27 import sites to point at a new module path is a real, non-trivial refactor with real regression risk for what is meant to be a foundations/documentation phase — and it would not change any actual behavior, only the import path. Per the phase's own instruction ("If something is risky, document it instead of forcing it"), this was treated as out of scope for Phase 2.

**What was done instead:** `src/modules/smokecraft/smokeCraftScoring.js` re-exports the existing, untouched implementations from `constants/session.js` and `smokeWinnerService.js` under one module-level entry point. This gives any new consumer (including a future Novi OS read-only integration) a single place to import from, without touching or risking the 27 existing call sites. A full migration of those call sites to the new module path is recommended as explicit Phase 3 work, done deliberately and tested, not bundled into this phase.

## 5. What Still Remains Hardcoded

- The 27 existing import sites for XP/rank/winner logic still reference `src/constants/session.js` / `src/services/smokecraft/smokeWinnerService.js` directly rather than the new module surface — by design, per Section 4.
- Module name strings ("SmokeCraft 360", "POS 3", "E.A.T. Command Center") remain independently duplicated in `CommandHub.jsx`, `CraftHub.jsx`, and `NoveeHome.jsx`, as identified in the Phase 1 audit — not addressed in this phase, since touching those three files was not part of the Phase 2 instruction set.
- Atmosphere Control has **no real implementation at all** — only SmokeCraft's own local atmospheric background visual component (`SmokeCraftAtmosphericBackground` in `src/components/smokecraft/SmokeCraftPremium.jsx`) exists. The registry entry for it is an honest placeholder (`status: 'not_built'`), not a description of working functionality.
- POS 3 and E.A.T. module configs in `moduleRegistry.js` are descriptive metadata reconstructed from the Phase 1 audit and `App.jsx` — they are not sourced from a dedicated config file inside `pages/pos3/` or `pages/eat/` because none exists yet. Creating those dedicated config files (mirroring `smokeCraftModule.config.js`) is reasonable follow-up work, not done here to keep this phase's footprint minimal.

## 6. How This Prepares Novi OS Integration

- `moduleRegistry.js` gives Novi OS (or any orchestrator) one well-known import path to discover what modules exist, their routes, and their permission requirements — without needing to read four different page-level files to learn the same facts.
- Each module config explicitly states its connections to other modules as `optional`, and confirms the connection direction (e.g., `smokecraft-to-pos3-unidirectional`). This formalizes, in writing, the "Novi OS controls, does not duplicate" rule from the Phase 1 audit before any actual Novi OS code exists.
- POS 3 and E.A.T. Command Hub configs explicitly state they do **not** depend on SmokeCraft (`standalone: true`), matching the instruction to keep them standalone for now.
- The mentor extraction is a working example of the kind of "hardcoded → reusable" extraction this phase asked for, validated end-to-end by a passing build with zero behavior change.

## 7. What Should Happen in Phase 3

1. Decide whether to migrate the 27 existing XP/winner-logic import sites to `smokeCraftScoring.js`, and if so, do it as its own tested, reviewed change — not bundled with new module scaffolding.
2. Create dedicated `*.config.js` files for POS 3 and E.A.T. Command Hub inside their own module folders (`src/modules/pos3/`, `src/modules/eat/`), sourced from their real page/route files, rather than reconstructing their config inline inside `moduleRegistry.js`.
3. Decide and scope what a real "Atmosphere Control" module would actually be before registering more than a placeholder for it.
4. Only after the above are in place, begin scoping an actual Novi OS read-only consumer of `moduleRegistry.js` — as an observer, never a duplicate implementation, per the Phase 1 audit's hard constraint.

## 8. Checks Run

- `npm run build` — **PASS** (8.03s, no new errors or warnings introduced; pre-existing chunk-size warning unrelated to this phase).
- `node server/scripts/runPhase6IReadinessChecks.js` — **PASS** (43 passed, 0 failed).
- `node server/scripts/runPhase6HSecurityChecks.js` — **PASS** (26 passed, 0 failed).
- No SmokeCraft/CraftHub-specific regression script exists in `server/scripts/` (confirmed in Phase 1 audit; still true).
- Verified `Mentor.jsx`'s `MENTORS`/`MAX_SELECTIONS` usage sites are unchanged after the import swap (same `.find()`/`.map()`/selection-limit logic, same imported names used).
