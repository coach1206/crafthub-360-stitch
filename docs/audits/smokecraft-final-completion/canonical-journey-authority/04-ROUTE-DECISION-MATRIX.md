# 04 — Route Decision Matrix

| State | Landing | Resume | Welcome |
|---|---|---|---|
| No curriculum progress (`hasStarted: false`) | `START SMOKECRAFT JOURNEY` (unchanged) | **Fixed this pass** — redirects immediately to `/smokecraft`, no inline fallback, no flash | Reachable only if entry (enroll+venue) genuinely complete for the current session — real, non-buggy "enrolled but S1 not started" state; if entry incomplete, existing entry-readiness guard redirects (unchanged) |
| Active progress (`hasStarted: true, isComplete: false`) | `RESUME SMOKECRAFT JOURNEY` + `START NEW JOURNEY` (unchanged) | Routes to earliest incomplete session (unchanged) | Reads only `journey.identity` (now correctly reset per-journey) |
| Completed (`isComplete: true`) | `VIEW COMPLETED JOURNEY` + `START NEW JOURNEY` (unchanged) | Review-only, unchanged | N/A |

A standalone `getSmokeCraftRouteDecision()` function was not created — this table documents behavior that emerges correctly from the existing per-page guard logic (`computeJourneyStatus`, `getSmokeCraftEntryReadiness`, `SmokeCraftSessionGuard`) plus this pass's one addition (Resume's redirect effect), not from one new centralized function.
