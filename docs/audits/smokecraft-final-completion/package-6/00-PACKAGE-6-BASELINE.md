# Package 6 Baseline

- Branch: `recovery/smokecraft-codex-final` (unchanged) · Commit: `aa0b9cf8` (unchanged) · Uncommitted paths: 201 (post Package 5 closure)
- **Current Package 6 routes**: `/smokecraft/vitola` (`Vitola.jsx`) was a `ComingSoon` stub, part of the legacy `SMOKECRAFT_FLOW` list, not in the locked 27-session `VISIT_STRUCTURE`. `/smokecraft/cut-toast-light` (session 6, "Choose Your Cut") and `/smokecraft/lighting-tutorial` (session 7) are real, verified, built screens — not rebuilt this package. `/smokecraft/format` (session 5, "Construction Inspection") is a real, verified screen with its own vitola/ring-gauge selection UI (hardcoded local data) — not rebuilt, not duplicated. `/smokecraft/meet-your-cigar` (session 3) is real and built.
- **Current cigar-anatomy data**: none — no `cigar_anatomy` component type existed before this package (Package 3's `plant_anatomy` covers the tobacco plant, not the finished cigar).
- **Current vitola/ring-gauge data**: real, seeded in Package 3 (`vitola`: robusto/corona/toro; `ring_gauge`: ring-gauge-explainer; `length`: length-explainer) but never surfaced outside the Golden Box blend picker.
- **Current strength/body data**: real, seeded in Package 3 as `sensory_category` (strength, body, aroma, finish, complexity, progression) — same story, never surfaced as a dedicated lesson.
- **Current cutting/lighting/smoking-technique data**: `CutToastLight.jsx` and `LightingTutorial.jsx` are real, working, verified screens (164/375 lines respectively) — out of scope, not touched.
- **Current burn-troubleshooting data**: none.
- **Current flavor data**: `smokecraft_flavor_notes` — 16 real top-level taxonomy groups (Package 3), never exposed as a tactile "wheel" before this package.
- **Current Pairing Lab integration**: `PairingLab.jsx` is a real, verified, protected screen — not rebuilt.
- **Current Flavor Memory integration**: `FlavorMemory.jsx` is a real, verified, protected screen — not rebuilt.
- **Current quizzes**: 9 total entering this package (1 Package 3 base + 2 Package 4 + 3 Package 5 + wait, corrected below).
- **Current XP rules**: `seed_soil_quiz_correct`, `seed_soil_exploration_complete` (unused), `rolling_process_complete`, plus original Golden Box rules.
- **Current notes/progress systems**: `smokecraft_seed_soil_notes`/`_progress`/`_quiz_attempts` (migration 080) — generic, guest+component_id keyed, reused without modification by Package 5 and now this package.
- **Current mentor systems**: `journey.mentor[0]`, unchanged since Package 2.
- **Current media records**: `smokecraft_hotspots`/`smokecraft_content_media` (migration 079), zero rows.
- **Current SC_ASSETS registry**: no per-anatomy/vitola/flavor-wheel image keys exist.
- **Exact Package 3 and Package 5 non-passing tests**: see `01-PREEXISTING-TEST-GATE-REVIEW.md` and `02-TEST-GATE-REPRODUCTION-EVIDENCE.md` — all three reproduced, root-caused, and closed before any Package 6 feature work began.
