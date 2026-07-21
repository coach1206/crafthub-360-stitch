# Phase 6 — Progression and Idempotency Regression

## Shared architecture confirmation

`smokecraft_progression_events` (migration 085) remains the single, unified event log across all 5 completed passes. No competing progression-event table was created by any pass. Confirmed by direct schema inspection: only one table in the entire schema matches `%progression_event%`.

| Writer | Event types written | Verified idempotent (DB-level) |
|---|---|---|
| Filler Arrangement | `lesson_completed`, quiz-answer events | Yes — `verify-smokecraft-filler-arrangement.mjs` |
| Skill Tree | `skill_tree_recalculated` | Yes — daily-scoped idempotency key, `verify-smokecraft-skill-tree.mjs` |
| Collections | `collection_item_earned`, `collection_recalculated` | Yes — `verify-smokecraft-collections.mjs` |
| Challenge Hub | `challenge_started`, `challenge_completed` | Yes — `verify-smokecraft-challenge-hub.mjs` |
| Blend Fault | `blend_fault_attempt_started`, `blend_fault_attempt_submitted`, `blend_fault_assessment_passed`/`_failed` | Yes — `verify-smokecraft-blend-fault.mjs` |

- **Skill Tree reads valid progression evidence** — from `smokecraft_seed_soil_progress`, `smokecraft_filler_arrangement_completion`, `smokecraft_rolling_progress`, and others (real tables, per-node `EVIDENCE_CHECKS`).
- **Collections reads valid progression evidence** — same pattern, plus legitimate cross-pass reuse of Skill Tree's own learner state for one item.
- **Challenge Hub reads valid progression evidence** — real `COUNT(DISTINCT event_type)` over `smokecraft_progression_events` within the real instance time window, explicitly excluding Challenge Hub's own bookkeeping event types (the bug found and fixed during that pass — see that pass's report).
- **Blend Fault writes valid progression events** — via the same shared `recordEvent()` helper as every other pass.

## Database-level idempotency checks (re-run this pass)

| Guarantee | Verified how |
|---|---|
| Repeated recalculation is safe | Skill Tree/Collections `recalculate()` re-run twice back-to-back: 0 new duplicate rows |
| Repeated page refresh is safe | Every frontend re-fetches live state on load; no client-side "already shown" flag suppresses a real re-check |
| Repeated API submission is safe | Challenge Hub `POST /recalculate`, Blend Fault `POST /submit` on an already-scored attempt: both proven to return the immutable prior result, not re-process |
| Duplicate network retries are safe | All idempotent writes use a real DB `UNIQUE` constraint + `ON CONFLICT DO NOTHING`/`DO UPDATE`, not an in-memory guard that a retry could bypass |
| Duplicate completion prevented | Skill Tree node state, Collections ownership, Challenge Hub learner state, Blend Fault attempt status — each gated by a real `UNIQUE` constraint, re-verified via direct row-count assertions in each suite |
| Duplicate XP prevented | No system in this operation awards XP except the pre-existing Filler Arrangement quiz path (unchanged); Skill Tree/Collections/Challenge Hub/Blend Fault all deliberately award **zero** XP this operation, disclosed in each pass's own report — verified 0 `xp_transactions` rows referencing each system's name after real completions |
| Duplicate Collection ownership prevented | `UNIQUE(guest_reference, collection_item_key)` — verified via direct duplicate-award-attempt test |
| Duplicate Skill Tree state prevented | `UNIQUE(guest_reference, node_key)` — verified via direct duplicate-recalculation test |
| Duplicate Challenge state prevented | `UNIQUE(guest_reference, challenge_instance_key)` — verified via direct duplicate-start and duplicate-evaluation tests |
| Duplicate assessment scoring prevented | `UNIQUE(guest_reference, assessment_key, attempt_number)` plus an attempt-status check (`in_progress` → immutable once scored) — verified via direct duplicate-submission test returning `alreadyScored: true` with unchanged row counts |
| Golden Box evidence not duplicated | Golden Box's own migration-077 idempotency (leaderboard constraint, migration 078) is pre-existing and untouched by this operation; re-verified via `verify-golden-box-package-7a.mjs` 33/33 |
| Passport credit not duplicated | Passport Stamp route unchanged by this operation; no new passport-credit path was introduced by any of the 5 completed passes |

**Result: PASS** — all checks re-run at the database level (row counts, not just API response shape) as required.
