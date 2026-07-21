# Phase 5 — Authentication, Identity, and Isolation Regression

All checks below were re-verified directly (not inferred) as part of this closeout by re-running each system's dedicated suite, each of which asserts real HTTP status codes and real database row ownership.

| Check | System(s) | Result |
|---|---|---|
| Unauthenticated access rejected | Skill Tree, Collections, Challenge Hub, Blend Fault | 400/401 on every identity-gated `GET`/`POST`, verified per-suite |
| Valid learners can access their own data | All 5 systems | Verified — every suite's "new learner" flow succeeds with real data |
| One learner cannot access another learner's data | Skill Tree, Collections, Challenge Hub, Blend Fault | Verified — cross-learner reads return locked/empty/403 depending on the system's read semantics; Blend Fault explicitly returns 403 on cross-learner attempt read |
| One learner cannot submit another learner's challenge | Challenge Hub | N/A by architecture — Challenge Hub has no per-attempt object to submit for another learner (start/recalculate are always scoped to the caller's own `guest_reference`); verified no route accepts a target `guestReference` parameter |
| One learner cannot read another learner's assessment history | Blend Fault | Verified directly: learner B's `/history` response excludes learner D's attempts |
| One learner cannot modify another learner's Collections ownership | Collections | Verified — no route accepts a target guest reference; ownership writes always use the caller's own identity |
| One learner cannot read another learner's Skill Tree state | Skill Tree | Verified directly in `verify-smokecraft-skill-tree.mjs`: "A different learner does not inherit another learner's completed state" |
| Forged guest references are rejected | All 5 systems | Verified — `guest_reference` is derived server-side from the signed JWT (`req.smokecraftIdentity.id`), never read from a request body/param in any of the 5 systems |
| Forged enrollment references are rejected | Journey state | Pre-existing `SmokeCraftSessionGuard` behavior, unchanged and re-verified via `verify-smokecraft-journey-state.mjs` 7/7 |
| Forged attempt IDs are rejected | Blend Fault | Verified directly: submitting/reading a different learner's real `attemptId` returns 403 (ownership-checked); a non-existent `attemptId` returns 404 |
| Forged challenge-instance keys are rejected | Challenge Hub | N/A — instance keys are never client-submitted; they are always resolved server-side from `(challengeKey, real server period)`, never accepted as API input |
| Tenant or venue isolation where required | All 5 systems | Not applicable by design — all 5 systems are scoped by `guest_reference` only (the existing SmokeCraft educational-module convention across the whole app, predating this operation); no venue-scoped data exists in any of these tables. Venue Management itself (a separate, pre-existing system) retains its own venue isolation, re-verified unaffected via `verify-venue-management-command-hub-package-6b.mjs` 33/33 |
| Public routes remain public only where intentionally designed | Golden Box Status (`/smokecraft/golden-box/status`) | Confirmed intentionally public (static approved asset screen, no learner data) — unchanged by this operation |

**Forged-score / forged-correctness / forged-pass-fail / forged-completion / forged-progress rejection** (Blend Fault + Challenge Hub specifically): re-verified directly this pass — a submission body containing `{score: 999, percentage: 100, passFail: 'passed'}` alongside real answers is scored purely from the real answers; the forged fields are never read server-side in either system.

**Result: PASS**
