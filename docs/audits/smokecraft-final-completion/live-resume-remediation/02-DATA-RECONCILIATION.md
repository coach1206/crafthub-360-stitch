# 02 — Data Reconciliation

## No migration required — documented why

No SmokeCraft journey phase/session state, "active journey" flag, or completion record is persisted in any database table. Confirmed by:
- The Phase Architecture Reconciliation pass's source audit (`01-SOURCE-AUDIT.md`): "No table or column stores a SmokeCraft journey phase number or phase key."
- The Live Resume-State Reconciliation pass's final report: same finding for session-level state.
- This pass's own re-confirmation: `completedSteps` lives only in the guest-session record, identified by the signed guest-session cookie (server-derived identity, never client-selectable) — there is no separate "journey" table row to be invalid, duplicated, or archived incorrectly at the database level.

Because there is no persisted record to repair, **no safe data-repair function, no migration, and no per-record reconciliation audit event were created or are needed.** The defect was entirely in client-side derivation logic (`hasProgress`/`hasRealJourneyProgress()` trusting the presence of any later-session id instead of requiring contiguous-order completion) — fixed at the source in `01-ROOT-CAUSE.md`. The fix is retroactive and self-correcting: every guest session, on next load, is evaluated by the corrected logic — no existing record needs to be touched, migrated, or flagged.

## What "invalid state" means here, concretely

A `completedSteps` array containing a later session's id without an earlier required session's id (e.g. `session-complete` present, `entry` absent) is not itself corrupted or deleted — it is a legitimate historical record of what completion events fired for that guest under the *old* schema (before S1/`entry` became a required evidence-bearing session). The correct behavior, now implemented, is to **not credit** that record with progress it never validly earned under the current rules — which is exactly what the contiguous-prefix rule in `computeJourneyStatus` already does. No destructive action was taken against any guest's historical `completedSteps` array; it is read, not rewritten.
