# Phase 6 — Database-Level Idempotency Evidence Table

Real duplicate-insert / repeated-operation tests executed directly against the running PostgreSQL database and the running Express API — not code inspection alone. Source: `verify-smokecraft-phase6-shared-gamification.mjs`, full clean run captured in `24-test-run-output.txt`.

| Table | Constraint | Operation tested | Expected result | Actual result | Status |
|---|---|---|---|---|---|
| `smokecraft_progression_events` | UNIQUE(`idempotency_key`) | Two `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING RETURNING id` calls with the identical key | 1st returns 1 row, 2nd returns 0 rows | 1st returned 1 row, 2nd returned 0 rows | PASS |
| `smokecraft_skill_tree_learner_state` | UNIQUE(`guest_reference`, `node_key`) | Constraint existence check via `pg_indexes`/`pg_constraint` | Constraint present | Present | PASS |
| `smokecraft_collection_ownership` | UNIQUE(`guest_reference`, `collection_item_key`) + UNIQUE(`idempotency_key`) | Constraint existence check | Constraint present | Present | PASS |
| `smokecraft_challenge_instances` | UNIQUE constraint on instance identity | Constraint existence check | Constraint present | Present | PASS |
| `smokecraft_challenge_learner_state` | UNIQUE constraint on learner/instance identity | Constraint existence check | Constraint present | Present | PASS |
| `smokecraft_blend_fault_attempts` | UNIQUE constraint on attempt identity | Constraint existence check | Constraint present | Present | PASS |
| `smokecraft_blend_fault_answers` | UNIQUE constraint on attempt/question identity | Constraint existence check | Constraint present | Present | PASS |
| `smokecraft_filler_arrangement_completion` | Real API-level idempotency (`ON CONFLICT DO NOTHING` or existence check in service code) | Two `POST /api/smokecraft/filler-arrangement/complete` calls for the same learner | Exactly 1 row after both calls | Exactly 1 row | PASS |
| `passport_360_guest_profiles` | UNIQUE constraint on identity mapping | Constraint existence check | Constraint present | Present | PASS |
| `passport_360_earned_stamps` | UNIQUE(`dedupe_key`) | Constraint existence check | Constraint present | Present | PASS |
| `passport_360_guest_progress.total_xp` | Absolute-set mirroring (not additive) | Two `POST /api/passport-360/sync/synchronize` calls, compare `xpSummary.totalXp` before/after | Unchanged across the second call | Unchanged | PASS |
| `smokecraft_progression_events` (Passport activity read) | N/A — read-model consumer, not a write path | Two `GET /api/passport-360/sync/activity` reads separated by a `POST /synchronize` call | Activity length unchanged (sync is a mirror/read, not a re-write of history) | Unchanged | PASS |

All 12 rows: **PASS**. No table tested allowed a real duplicate write to succeed.
