# Phase Architecture Discrepancy — 6 Phases (Code) vs. 7 Phases (Prior Guidance)

## Current 6-phase code structure

`src/constants/session.js`:
```
export const TOTAL_VISITS = 6
export const TOTAL_PHASES = TOTAL_VISITS
```
The `VISIT_STRUCTURE` array assigns every one of the 27 canonical sessions to a `visit` (phase) number 1–6:

| Phase | Sessions |
|---|---|
| 1 | S1–S7 |
| 2 | S8–S11 |
| 3 | S12–S15 |
| 4 | S16–S18 |
| 5 | S19–S20 |
| 6 | S21–S27 |

Both pre-existing test suites already in the repository before this operation began — `verify-smokecraft-27-session-spine.mjs` and `verify-smokecraft-authoritative-sequence.mjs` — assert the same 6-phase structure. `docs/audits/smokecraft-final-completion/gate-reconciliation/CHECKLIST.md` and every prior closeout document reference "27 sessions" without ever asserting a 7th phase.

## Prior approved completion guidance

Several controlled-pass mandates in this operation (most explicitly, the Phase 9 mandate) refer to "the locked 7-phase architecture" and instruct verification to confirm "exactly 7 phases remain." No source file matching that count was found anywhere in the repository during the Phase 9 discovery audit or this pass's own re-check.

## Exact source files

- `src/constants/session.js:106-107` — `TOTAL_VISITS`/`TOTAL_PHASES` = 6, and the `VISIT_STRUCTURE` array's `visit` field for every session.
- `verify-smokecraft-27-session-spine.mjs` — asserts the same 27-session/6-phase structure via its own `IMPLEMENTED_SPINE` and chain-based reachability checks.
- `verify-smokecraft-authoritative-sequence.mjs` — asserts the same journey graph.
- `docs/audits/smokecraft-final-completion/gate-reconciliation/09-FULL-JOURNEY-FINAL-GATE.md` — the Phase 9 report, which first raised and disclosed this discrepancy rather than silently resolving it.

## Naming, grouping, or structural?

This is most consistent with a **naming/count discrepancy in externally-authored planning documents**, not a structural code defect. The 27-session sequence itself is internally consistent, fully implemented, and gate-verified (Phases 1–9) under a 6-phase grouping. There is no evidence in the codebase of a "missing" 7th phase's sessions, routes, or components — no orphaned session numbers, no gap in the sequence, no half-built phase boundary. The most likely explanation is that an external planning document (the source of the "7 phases" language in later mandates) used a different phase count than what was ultimately implemented, and that discrepancy was never reconciled before this operation began.

## Options for reconciliation

1. **Adopt 6 phases as canonical** — update all future mandate language to say "6 phases," matching the actual implementation. Lowest risk; no code change.
2. **Split one existing phase into two to reach 7** — e.g., splitting Phase 6 (S21–S27, currently the largest at 7 sessions) into two phases. Requires a real code change to `VISIT_STRUCTURE`, `TOTAL_VISITS`, and every UI element that renders "Phase X of 6" (progress headers, locked-screen messaging, resume logic) — plus re-verification of every regression suite that asserts phase-derived UI text.
3. **Regroup all 27 sessions into a different 7-phase split** — a larger structural change with the same UI/regression re-verification burden as option 2, and additional risk of shifting session-to-phase boundaries that learners' in-progress `completedSteps` data implicitly depends on for phase-completion messaging.

## Risks of changing it

- Every "Phase X of 6" UI string, `LockedSmokeCraftScreen` message, and progress-header calculation depends on `TOTAL_VISITS`/`VISIT_STRUCTURE`. Changing the phase count without a full re-audit risks reintroducing exactly the kind of "false completion" / "false unlock" defect Phase 9 was created to rule out.
- No explicit approval for a phase-count change exists in any authorization this operation has received — every mandate through Phase 9 and this pass explicitly prohibits "adding new sessions, remove sessions, merge sessions, reorder sessions, or rename core journey phases without explicit approval."
- A silent or assumed resolution in either direction (assuming "7" is correct and fabricating a phase, or assuming "6" is correct and just not mentioning the discrepancy) would misrepresent the actual, verified state of the codebase.

## Recommended resolution

Adopt **Option 1** (6 phases as canonical) unless the operator has a specific, already-approved 7-phase design that was never implemented — in which case Option 2 or 3 should be scoped as its own dedicated, explicitly-approved pass with full regression re-verification, not folded into an unrelated feature pass like this one.

## Confirmation

No unilateral sequence change was made in this pass or the Phase 9 pass that first discovered this discrepancy. The 27-session count, the 6-phase grouping, and every session-to-phase assignment in `src/constants/session.js` remain exactly as they were at the start of this pass. This discrepancy remains an explicit, unresolved item in `docs/audits/smokecraft-final-completion/gate-reconciliation/CHECKLIST.md` pending an owner decision.
