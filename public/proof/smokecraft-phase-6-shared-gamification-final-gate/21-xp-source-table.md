# Phase 6 — XP Source Reconciliation Table

| Module | Event type | XP amount | One-time or repeatable | Idempotency key | Database constraint | Consumer | Status |
|---|---|---|---|---|---|---|---|
| Filler Arrangement quiz | `knowledge_check_passed` / real quiz-answer scoring | 15 (via `xp_award_rules.rule_key = 'filler_arrangement_quiz_correct'`) | Repeatable per distinct correct answer, deduplicated per question | Per-question completion row in `smokecraft_filler_arrangement_completion` | UNIQUE on completion row prevents duplicate award for the same learner/question | `xp_accounts.balance` via `xp_transactions` | Active, real, verified this pass |
| Skill Tree node completion | N/A — no event emitted for XP purposes | 0 (all 7 nodes) — `xp_reward` column is display-only, unawarded | N/A | N/A | N/A | Never consumed (no frontend render, no `xp_transactions` write) | Inactive reference, not awarded |
| Collections item ownership | `progression_event` consumption (various source events) | 0 (all 5 items) | N/A | Ownership row idempotency key | UNIQUE(`guest_reference`,`collection_item_key`) + UNIQUE(`idempotency_key`) | None (0 XP) | Zero-XP-by-design |
| Challenge Hub completion | `challenge_completed` (bookkeeping, excluded from its own evidence) | 0 (both definitions) | N/A | N/A | UNIQUE learner-state per instance | None (0 XP) | Zero-XP-by-design |
| Blend Fault attempt | `blend_fault_attempt_submitted` / `blend_fault_attempt_passed` | 0 | N/A | Attempt UNIQUE constraint | UNIQUE on attempt identity | Skill Tree/Passport read attempt evidence, not XP | Zero-XP-by-design, verified this pass (0 `xp_transactions` rows reference "blend fault") |
| Passport 360 sync | N/A — Passport never generates XP, only mirrors it | N/A | N/A | N/A | `total_xp` is an absolute SET from `xp_accounts.balance`, never additive | Passport Profile UI | Verified idempotent (no double-count across repeated syncs) |

**Only real, repeatable, XP-granting source in the SmokeCraft educational system:** Filler Arrangement's quiz-answer XP via the `xp_award_rules` table. Every other module intentionally awards 0 XP to avoid double-counting against underlying lesson XP — this was already established and disclosed in prior passes, and is re-verified (not re-decided) in Phase 6.
