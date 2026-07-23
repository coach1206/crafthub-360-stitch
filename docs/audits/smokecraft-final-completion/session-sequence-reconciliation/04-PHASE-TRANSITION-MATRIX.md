# 04 — Phase Transition Matrix

| Boundary | Last session of prior phase | First session of next phase | Guard rule |
|---|---|---|---|
| Phase 1 → 2 | S7 (Lighting Tutorial) | S8 (First Draw) | `isVisitUnlocked(2, progress)` requires every Phase 1 session complete |
| Phase 2 → 3 | S11 (Suggested Pairings) | S12 (Flavor Evolution) | `isVisitUnlocked(3, progress)` requires every Phase 2 session complete |
| Phase 3 → 4 | S15 (Knowledge Drop) | S16 (Flavor Finish) | `isVisitUnlocked(4, progress)` requires every Phase 3 session complete |
| Phase 4 → 5 | S18 (Overall Experience Notes) | S19 (Rate Every Category) | `isVisitUnlocked(5, progress)` requires every Phase 4 session complete |
| Phase 5 → 6 | S20 (Personal Notes) | S21 (AI Summary) | `isVisitUnlocked(6, progress)` requires every Phase 5 session complete |

All five boundaries are enforced by the single `isVisitUnlocked`/`isSessionUnlocked` pair in `smokecraftJourney.js`, which both derive from `VISIT_STRUCTURE` — there is no separate per-phase transition logic to fall out of sync. Phase labels (`visitTitle`) are read from the same structure everywhere they are displayed (`SmokeCraftProgressHeader.jsx`, Resume, landing), so no stale phase name can appear.

No 7th phase exists anywhere in the guard logic, the progress header, or the manifest — confirmed by grep (`01-SOURCE-OF-TRUTH-AUDIT.md`).

XP is awarded once per completion event via `awardSessionRewards(id)`/`completeStep(id)`, keyed by the session's `id` field — re-visiting a completed session's route does not re-trigger these calls (the pages guard their own award calls behind an `if (!alreadyComplete)` check, unchanged from prior passes, re-verified for this pass's scope: no new award call sites were added or removed).
