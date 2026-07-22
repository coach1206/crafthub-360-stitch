# Route Sequence Map

Entry layer → S1–S27 spine (in order, per `01-canonical-27-session-table.md`) → S27 "Recommended Next Journey" → (optionally) Golden Box (supporting module, reachable from S1 per the existing `App.jsx` comment, outside the 27-session count).

- **Entry layer:** `/smokecraft` (Launch) → `/smokecraft/enroll` (Sign In) → `/smokecraft/venue-select` → `/smokecraft/identity` → `/smokecraft/resume`.
- **Spine:** 21 distinct routes in strict prerequisite-chain order (verified live via `chainUpTo()` reachability checks in the dedicated Phase 9 suite — every session is reachable once its exact prior chain is complete, and not before).
- **No orphan primary route found.** No circular next-route loop found. No duplicate primary route mapped to conflicting session numbers.
- **Locked-route behavior:** session-number-guarded routes (`SmokeCraftSessionGuard sessionNumber=`) render an honest in-place `LockedSmokeCraftScreen` rather than redirecting — verified live this pass (see `33-locked-route-rejection.png`). Supporting-module routes (`requires=`) redirect to the learner's current allowed route instead — a different, also-honest, pre-existing pattern (not changed this pass).
- **Golden Box:** reachable from S1 as a supporting module, outside the spine count — confirmed via eligibility → entry → draft → submission → results, all re-verified live this pass with the Phase 8 ownership/visibility fixes intact.
