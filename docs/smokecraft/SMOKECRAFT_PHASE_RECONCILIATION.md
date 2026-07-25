# SmokeCraft Phase Reconciliation — Prompt 2, Part 2

Baseline commit: `67fe8f9ac872e1b784911da2a92fc15c9edc6ee7`

## The discrepancy

- **Original pre-implementation plan** (`docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md`, early sections, e.g. lines 15/39/146/158): "27 sessions across 7 phases plus a 5-screen Entry/Authentication layer" — this is a **planning-stage target**, written before the spine was actually implemented.
- **Actually implemented, tested, and locked structure** (same document, "Package J: Lock and Implement the 27-Session Spine" section, ~line 795 onward): a **deliberate, disclosed engineering decision** replaced the planning target with a final **6-phase** structure:

  > Phase 1 Session Preparation (S1–S7) · Phase 2 First Third (S8–S11) · Phase 3 Second Third (S12–S15) · Phase 4 Final Third (S16–S18) · Phase 5 Reflection (S19–S20) · Phase 6 Results (S21–S27). `TOTAL_VISITS`/`TOTAL_PHASES` = 6, `TOTAL_SESSIONS` = 27.

- This 6-phase structure was written directly into `src/constants/session.js`'s `VISIT_STRUCTURE` (the single canonical registry consumed by every guard, progress header, XP calculation, and test in the live application), with its own dedicated test suite (`verify-smokecraft-27-session-spine.mjs`, 25 suites / 23 checks per the plan doc) at the time, and has been re-verified as "exactly 6 phases" by every full-journey regression suite run throughout this entire multi-pass operation without exception.

## Root cause classification (per this prompt's own lettered options)

**This is option (A) combined with (D):** the original 7-phase plan was never implemented as 7 phases — it was **deliberately, visibly, and permanently superseded** by a documented later decision (Package J) that consolidated to 6 phases before any of this repository's current live guard/progress/XP logic was built. It is not an accidental collapse discovered now; it is a already-made, already-tested, already-shipped architecture decision that predates this recovery operation entirely.

## Why a 7th phase cannot be safely "restored" in this pass

The exact session-to-phase boundary the original 7-phase plan intended is **not preserved anywhere in this repository** — only the headline count ("7 phases") survives in the early planning doc; no session-by-session 7-phase breakdown exists to reconstruct from. Guessing where the missing boundary belongs (e.g., splitting "Final Third" S16–S18 into two phases, or splitting "Reflection" S19–S20) would mean **fabricating** a phase boundary with no documented basis — which this operation's standing rules and this prompt's own instruction ("do not silently invent a seventh phase") both forbid.

Additionally, `TOTAL_PHASES = 6` is read by:
- `SmokeCraftProgressHeader.jsx` (visible "Phase X of 6" text),
- `SmokeCraftSessionGuard.jsx` / `getVisitBySession` (unlock logic),
- `ROUNDS`/`getRoundForVisit` (rank/XP-adjacent calculations),
- every regression suite in this operation (`verify-smokecraft-full-journey-sequence-and-assets.mjs` section A, `verify-smokecraft-27-session-spine.mjs`, and others) that explicitly asserts `=== 6`.

Changing this number without a concretely-defined new boundary would not "restore" anything — it would silently break a working, tested system to chase an undefined target, trading a real defect for a fabricated one. That is explicitly against this whole operation's rules.

## What was actually done this pass

1. **Not silently preserved without comment** — this document exists specifically because the discrepancy is real and is not being brushed aside.
2. **Not silently invented** — no 7th phase boundary was fabricated.
3. **27-session sequence unchanged** — verified again this pass (see `SMOKECRAFT_27_SESSION_AUDIT.md`, unchanged from Prompt 1).
4. **Locking tests added** (see `verify-smokecraft-phase-session-lock.mjs`, new this pass) that fail if:
   - session count is ever not exactly 27,
   - phase count is ever not exactly 6 (the current, real, tested, locked count — not 7),
   - any session appears in more than one phase,
   - any session is missing from all phases,
   - session order drifts from the registry.

   These tests protect the **actual current locked structure** so it cannot silently drift further, while leaving the 6-vs-7 naming question open for an explicit product decision rather than guessed at.

## Recommendation (requires a real product decision, not a guess)

If the product owner wants a genuine 7th phase restored, that requires specifying **which existing phase should split, and at which session boundary** — e.g., "Final Third (S16–S18) should become two phases" or "Reflection (S19–S20) should become two phases." Once that specific decision is made, the change is mechanical (update `VISIT_STRUCTURE`'s `visit` numbers for the affected sessions only, without moving/renumbering/merging any session) and low-risk. Absent that decision, this pass leaves the current, working, 6-phase structure in place and documents the discrepancy honestly rather than resolving it by fabrication.

## Files affected by this reconciliation entry

- None changed in `src/constants/session.js` this pass (no session moved, split, merged, or renumbered).
- New: `verify-smokecraft-phase-session-lock.mjs` (locking regression test).
- New: this document.
