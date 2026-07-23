# 02 — Route Guard Matrix

| Route | Guard mechanism | Entry-readiness enforced? |
|---|---|---|
| `/smokecraft/welcome` (S1) | `SmokeCraftSessionGuard sessionNumber={1}` | **Yes — this pass's fix** |
| `/smokecraft/humidor-match` (S2) through every later numbered session (S3–S27) | `SmokeCraftSessionGuard sessionNumber={N}`, `isSessionUnlocked(N)` requires S1 complete | Yes, transitively — S1 cannot be marked complete without passing through the now-guarded Welcome screen first |
| Skill Tree, Collections, Challenge Hub | Server-persisted, guest-identity-gated (not SmokeCraft-journey-guarded at all) — a fresh guest simply has no evidence yet, confirmed unaffected | N/A — different, already-correct authorization model |
| Golden Box entry, Packaging Studio | Server-persisted, ownership-gated (Phase 8/Packaging Studio passes) | N/A — different, already-correct, independently-verified authorization model |
| `/smokecraft/enroll`, `/smokecraft/venue-select`, `/smokecraft/identity`, `/smokecraft/resume` (entry layer itself) | Unguarded by design — these ARE the prerequisite steps; they must remain reachable to a guest who hasn't completed them yet | N/A — correctly and intentionally public |
| `/smokecraft/mentor-selection` | `SmokeCraftSessionGuard requires="entry"` (unchanged) | Already correctly gated behind S1, per the existing, unmoved architecture |

## Fix location

One file changed: `src/components/smokecraft/SmokeCraftSessionGuard.jsx`. The `sessionNumber` branch now computes `getSmokeCraftEntryReadiness(session, journey)` and redirects to `redirectRoute` (via `useEffect`, matching the existing deferred-navigation pattern already used for the `requires` branch) whenever `!readyForWelcome` and not in demo mode. No other guard component, route registration, or page was modified.
