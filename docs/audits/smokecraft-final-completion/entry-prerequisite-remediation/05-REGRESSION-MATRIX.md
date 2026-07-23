# 05 — Regression Matrix

| Suite | Result | Notes |
|---|---|---|
| Entry-Prerequisite Guard (dedicated) | 43/43 pass, 0 fail | includes real live-browser bypass attempts (direct URL, back/forward, refresh, second-tab, bookmark, LocalStorage/query-param forgery) |
| Clean Start / Entry Flow (prior pass, re-verified) | 54/54 | |
| Phase 9 Full Journey | 37/40 | 3 stale-commit-only; `seedGuest()` updated to include real entry-layer prerequisites for mid/late-chain checks, and two checks' setup/assertion text corrected to reflect the new, correct required behavior (see below) |
| Phase 9A Packaging Studio Journey Amendment | 51/54 | 3 stale-commit-only |
| Golden Box Packaging Studio | 71/74 | 3 stale-commit-only |
| Passport Security Unified Identity | 59/59 | |
| Production build | pass | |
| Production startup / health check | pass | |

## Phase 9 test-setup correction (not a weakened assertion)

Two pre-existing Phase 9 checks assumed a fresh guest (zero `completedSteps`, no venue) could reach `/smokecraft/welcome` directly — that assumption was itself the bug this pass fixes. Rather than delete or weaken those checks, their setup (`seedGuest()`) was extended to seed real entry-layer prerequisites for checks that legitimately test mid/late-journey reachability (a realistically-progressed guest obviously has real enrollment/venue), and a new, additional check was added asserting the corrected behavior explicitly: *"A genuinely fresh journey (zero completed steps, no entry prerequisites) is redirected away from Welcome, not granted direct access."* No functional safety property was removed — the suite now tests both the old happy path (fully progressed guest reaches later sessions) and the new required behavior (fresh guest cannot bypass), which is strictly more coverage than before.

## Landing-page scope correction

The `/smokecraft` index route shares `sessionNumber={1}` with Welcome but is the intentionally-public informational landing page (pre-existing code comment: "Entry-layer Launch — always unlocked"). It now passes `enforceEntryReadiness={false}` to `SmokeCraftSessionGuard`, so it remains reachable without enrollment — required per this pass's own instruction ("Do not block public informational pages that are intentionally accessible before enrollment").
