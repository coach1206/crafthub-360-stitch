# Phase 8 — Golden Box Production Build Final Gate

**Starting commit:** `a35ef4a30c10078718b1aa82b225762c9994bcdb` — local `HEAD` and `origin/recovery/smokecraft-codex-final` both matched, working tree clean, before any work began.

## Discovery audit summary

Full backend architecture inspection of every Golden Box table, migration, route, controller handler, and service. Current highest migration: `089_blend_fault_identification_scoring.sql`. Golden-Box-specific schema originates in `077_golden_box_foundation.sql` (23 tables) + `078_golden_box_leaderboard_constraint.sql` (1 CHECK constraint, no new table) + `079` (component-catalog content extension) + `084` (`golden_box_mentor_reviews`). Migrations `086`/`087`/`088` add only descriptive `golden_box_relevance` text columns to unrelated tables (Skill Tree/Collections/Challenge Hub), plus one real functional cross-reference (see Integration Boundary below).

### Table inventory (23 core tables + component-catalog content extension)

| Table | Purpose | Key constraints/idempotency |
|---|---|---|
| `golden_box_competitions` | Competition definitions | `competition_key` UNIQUE; scope/status CHECK enums |
| `golden_box_competition_invitations` | Invite-only competition scoping | FK CASCADE to competitions |
| `golden_box_rounds` | Multi-round competition structure | (competition_id, round_number) UNIQUE |
| `golden_box_eligibility_rules` | Server-defined eligibility rules per competition | rule_type CHECK enum |
| `golden_box_eligibility_results` | Persisted eligibility evaluation results | identity CHECK, indexed lookup |
| `golden_box_entries` | Learner entries | `entry_id` UUID UNIQUE, `(competition_id, guest_reference)` UNIQUE — one entry per learner per competition at the DB level |
| `golden_box_entry_versions` | Immutable draft/revision snapshots | `(entry_id, version_number)` UNIQUE — new row per save, never mutated |
| `golden_box_blend_components` | Selected wrapper/binder/filler/etc per version | component_type CHECK 20-value enum |
| `golden_box_submissions` | Submission record | `entry_id` UNIQUE — one submission per entry |
| `golden_box_component_catalog` | Approved component options | `(component_type, component_key)` UNIQUE |
| `golden_box_judges` | Judge roster | `user_id` UNIQUE |
| `golden_box_judge_assignments` | Judge-to-entry assignment | `(judge_id, entry_id)` UNIQUE |
| `golden_box_scorecards` | Judge scorecards (submit/lock/amend/void lifecycle) | `(entry_id, judge_id, amended_from)` UNIQUE; amendment creates a new row, never mutates |
| `golden_box_scores` | Per-category scores within a scorecard | CHECK score range |
| `golden_box_ai_analyses` | AI-assisted analysis (structurally isolated from official scores — no FK path) | — |
| `golden_box_feedback` | Feedback entries | author_type/visibility CHECK |
| `golden_box_results` | Finalized aggregate results | `(competition_id, entry_id)` UNIQUE, populated via `ON CONFLICT DO UPDATE` |
| `golden_box_rewards` | Reward/award idempotency ledger | `(entry_id, reward_type)` UNIQUE — the award-duplication guard |
| `golden_box_visibility_rules` | Per-viewer-role content visibility | `(entry_id, viewer_role)` UNIQUE |
| `golden_box_activity_log` | Append-only audit trail | immutable via `golden_box_activity_log_no_delete` trigger |
| `golden_box_mentor_reviews` | Mentor feedback (structurally isolated from official scores) | scoped to `(entry_id, mentor_user_id, status='draft')` |
| `xp_accounts` / `xp_transactions` / `xp_award_rules` | Shared XP ledger (reused by Filler Arrangement too, not Golden-Box-exclusive) | `xp_transactions.idempotency_key` UNIQUE, append-only via trigger |

No duplicate tables were created this pass — all required structures already exist.

### Route inventory (`goldenBoxRoutes.js`, mounted `/api/smokecraft/golden-box`)

26 routes covering: competition create/list/get/transition (admin-gated create/transition), eligibility evaluation, entry create/get/draft-save/submit/withdraw, judge assignment (admin-gated), scorecard submit/lock/void/amend, results, AI analysis, XP history, reward issuance (admin-gated), judge-self assignments/entry access, mentor-review draft/submit/read (mentor-role-gated). Full method/path/middleware table verified by direct source read — see discovery notes.

**One finding, documented not fixed:** `POST /entries/:entryId/scorecard` (initial scorecard submission) uses only `requireAuth` at the route layer, not an explicit judge-role middleware — real per-entry authorization is enforced in `judgingService.isAssignedJudge` inside the service. This matches the same intentional pattern used for `/judges/me/*` and lock/void/amend (service-layer ownership checks, not a new route-level role), and is confirmed functionally correct (an unassigned caller cannot actually submit a scorecard for an entry they aren't assigned to — verified live in the dedicated Phase 8 suite). Not a defect; documented for completeness since it deviates structurally from the `requireRole('admin')` pattern used elsewhere.

### Service-layer idempotency findings

- **`xpService.awardXp`** — requires and enforces `idempotencyKey` (throws if missing); true idempotency via `xp_transactions.idempotency_key` UNIQUE + pre-check dedup. Strongest idempotency implementation in the module.
- **`rewardsIntegrationService`** — idempotent via `golden_box_rewards (entry_id, reward_type)` UNIQUE + `ON CONFLICT DO NOTHING` + pre-check `alreadyGranted`.
- **`judgingService`** — judge assignment idempotent via `ON CONFLICT (judge_id, entry_id) DO NOTHING`; `computeAggregateResult` idempotent via `ON CONFLICT (competition_id, entry_id) DO UPDATE`.
- **`entryService`** — one entry per learner enforced by the `(competition_id, guest_reference)` UNIQUE constraint (DB-level backstop, not just application-level pre-check).
- **`golden_box_scorecards`** UNIQUE on `(entry_id, judge_id, amended_from)` prevents a judge from submitting two live scorecards for the same entry; amendment always creates a new row.

**Finding, documented not fixed (real but low-severity, out of Phase 8's safe-fix scope):** `rewardsIntegrationService.grantXp` accepts an admin-submitted `xpAmount` with no server-side upper-bound validation. Since the route is `requireRole('admin')`-gated, this is a trusted-caller-only concern (not an entrant-exploitable defect), and adding a cap would be a scoring/award-rule change — explicitly out of scope per the mandate ("Do not change award rules"). Documented for future consideration, not fixed this pass.

## Fixture-creation result

Confirmed: `pkg7a-live-comp` (and `pkg7-live-comp`, used by the Package 7 script) are **not** hardcoded into any production migration or seed data. `grep -rn "pkg7a"` across the repo (excluding `verify-*.mjs` test scripts) returns zero matches. Both fixtures are created exclusively through the real, authenticated admin API (`POST /competitions` with `x-novee-user-role: admin`) at test-run time, exactly as the mandate requires ("Competition fixture creation used by Golden Box 7A remains test-only... No required production fixture is silently seeded").

## Progression/Passport/Skill Tree/Collections/Challenge Hub boundary

- **Passport 360:** confirmed still disconnected — `passport360SyncService.js:155` returns `goldenBox: { connected: false, reason: 'not_yet_approved_for_passport_sync' }`. Not changed this pass, per the mandate's explicit instruction not to mark it connected without a real approved integration. The live Passport Profile UI does not claim Golden Box is connected (re-verified — no false claim exists).
- **`smokecraft_progression_events` / Collections / Challenge Hub:** zero references from any Golden Box service or route — confirmed genuinely absent, not a hidden defect.
- **Skill Tree → Golden Box (real, one-way):** the `mastery-blending` Skill Tree node's unlock rule queries `golden_box_entries` directly (`golden_box_entry_exists`) — a legitimate functional read, Skill Tree depending on Golden Box, not the reverse.
- **Shared XP ledger (real):** `fillerArrangementService.js` imports `awardXp` from Golden Box's own `xpService.js` — confirming `xp_accounts`/`xp_transactions` is genuinely shared infrastructure, not Golden-Box-exclusive, and that Golden Box's own XP idempotency mechanism is the same one already proven safe in the Phase 6 gate.
- **Outbound rewards (real):** `rewardsIntegrationService` writes real rows into `smoke_leaderboard_entries` and `passport_360_badges` (reused systems) when an admin issues rewards — this is genuine integration, just one-directional and admin-triggered rather than automatic.

## Migration final gate

Confirmed via direct inspection: current schema (through migration 089) is internally consistent — no duplicate migration numbers, no duplicate table/constraint names found across the Golden Box migrations. A clean migration run and Golden Box table/constraint existence check are both included as live checks in the dedicated Phase 8 suite (see proof).

## What was fixed

Two real, reproducible production defects were found during discovery and fixed with the smallest safe change, both in `server/controllers/goldenBoxController.js`:

1. **Results visibility gap (`handleGetResults`)** — the `GET /competitions/:competitionId/entries/:entryId/results` route computed and returned any entry's real aggregate score to any authenticated caller, with no ownership check and no competition-status gate. The "results released only after judging closes" rule was enforced only client-side (`ResultsExperience.jsx`'s `resultsReleased` check) — the backend had no equivalent gate, so an arbitrary authenticated user could read another learner's result before official release, violating the mandate's explicit "Unreleased results remain hidden" / "Learner sees only authorized results" requirements. Fixed by reusing the already-existing `visibilityService.getVisibility(...).canViewScores` policy (the same judging-closed-state-aware, role-aware check already used by `handleGetEntry`), returning 403 when the caller isn't authorized. Verified live: an unrelated authenticated user now receives `403 results_not_authorized`; the admin/entrant/assigned-judge paths are unaffected (re-confirmed via Golden Box 7A's full 33/33 regression).
2. **Missing entry-ownership checks (`handleSaveDraft`, `handleSubmitEntry`, `handleWithdrawEntry`)** — none of the three entry-write handlers verified that the calling identity actually owned the entry before mutating it. `saveDraft`/`submitEntry`/`withdrawEntry` in `entryService.js` accept an `actorId` used only for audit logging, never compared against `entry.guest_reference`/`entry.user_id`. Combined with prototype-mode auth resolving all guest callers to the same `req.user.id` (`'proto-guest'`), this meant any caller with a valid `entryId` could edit, submit, or withdraw another learner's entry — a direct violation of "Entry belongs to the authenticated learner... Another learner cannot read or modify the entry" and "Learner cannot submit another learner's entry." Fixed by adding a shared `requireOwnedEntry` guard (mirroring the exact same `ownsAsUser || ownsAsGuest` identity-comparison pattern `visibilityService.resolveViewerRole` already uses for reads) and calling it at the top of all three handlers before invoking the service. Verified live: cross-learner draft-write, forged-ownership draft-write, and cross-learner submission are all now rejected with 403; same-learner flows (draft save → refresh → submit → revise) remain fully functional.

Both fixes reuse existing, already-proven authorization infrastructure (`visibilityService`, the same ownership-comparison pattern) rather than introducing a new mechanism — consistent with "use the smallest safe fix." Neither fix touches scoring, judging categories, award rules, eligibility rules, or any client-facing screen; both are pure backend authorization corrections.

No other production code was changed. The remaining implementation already satisfied the mandate's completion-gate requirements (server-authoritative eligibility/scoring/results/awards, database-level idempotency across every tested operation) once the two ownership gaps above were closed.

## What remains unchanged

All 23 Golden Box tables, all 26 routes, all services, all existing Golden Box 7A/Package 7 test fixtures and scripts, the existing competition-creation endpoint, the existing judging/scoring/results/awards pipeline, and the confirmed-disconnected Passport boundary.

## Connectivity classification

- **Fully backend-connected:** competition CRUD, eligibility evaluation, entry create/draft/submit/withdraw, judge assignment, scorecard submit/lock/void/amend, results aggregation, reward issuance (XP + badge + leaderboard), activity audit log.
- **Partially connected:** AI analysis and mentor review are real, persisted, and visibility-gated, but structurally isolated from official scoring by design (no FK path to `golden_box_scores`) — correct isolation, not a gap.
- **Frontend-only:** none found — every Golden Box screen reads from the real API (confirmed in Phase 7).
- **Test-only:** the `pkg7a-live-comp`/`pkg7-live-comp` fixtures, created only via the live admin API by test scripts.
- **Admin-only:** competition create/transition, judge assignment, reward issuance.
- **Learner-facing:** entry create/draft/submit/withdraw, eligibility check, own-entry results/reads.
- **Mentor-facing:** mentor-review draft/submit/read-own.
- **Judge-facing:** scorecard submit/lock/void/amend, judge-self assignment/entry reads.
- **Idempotent (DB-enforced):** entry creation, judge assignment, scorecard amendment, XP awards, reward issuance, results aggregation.
- **Unsupported:** Passport goldenBox connection (explicitly, honestly disconnected).

See `public/proof/smokecraft-phase-8-golden-box-production-final-gate/` and the dedicated suite (`verify-smokecraft-phase8-golden-box-production.mjs`) for the full live-test evidence backing every claim above.
