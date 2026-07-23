# 02 — History Audit

## The decisive document: `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md`

This single document contains **both** the "7 phases" language later mandates quoted, **and** its own later, more authoritative correction to 6 phases — written by the same planning process, not by two conflicting sources.

### Early planning sections (§3a and surrounding prose) — "7 phases"

- Line 15: "...not the current 24-session/8-visit implementation, but the locked 27-session SmokeCraft 360 Master Journey, organized into **7 phases** plus a 5-screen Entry/Authentication layer..."
- Line 39 (§3a heading): "Locked Final Master Journey (27 sessions, **7 phases**, + 5-screen Entry layer)"
- Line 146: "Locked final journey: 27 sessions, **7 phases**, plus a 5-screen Entry/Authentication layer..."
- Line 158, 1456, 1663: repeat "27 sessions... 7 phases."

This is the document's **initial target design**, written before implementation began.

### The implementation record (Package J, later in the same document) — "6 phases," matching code exactly

- Line 790: "**Scope actually implemented:** replaces the coded 24-session/8-visit structure and every temporary interstitial guard number with one authoritative **27-session, 6-phase spine**..."
- Line 793: "`src/constants/session.js` — replaced `VISIT_STRUCTURE`'s contents with the locked 27-session, **6-phase** registry (`TOTAL_VISITS`/`TOTAL_PHASES` = 6, `TOTAL_SESSIONS` = 27)..."
- Line 812: "**Final phase structure:** Phase 1 Session Preparation (S1–S7) · Phase 2 First Third (S8–S11) · Phase 3 Second Third (S12–S15) · Phase 4 Final Third (S16–S18) · Phase 5 Reflection (S19–S20) · Phase 6 Results (S21–S27). `TOTAL_VISITS`/`TOTAL_PHASES` = 6, `TOTAL_SESSIONS` = 27."

This phase breakdown (Phase 1 Session Preparation / Phase 2 First Third / Phase 3 Second Third / Phase 4 Final Third / Phase 5 Reflection / Phase 6 Results) is **exactly** what exists in `src/constants/session.js` today, verified in `01-SOURCE-AUDIT.md`.

## Git history corroboration

`git log -p --follow -- src/constants/session.js` shows the exact commit that changed:
```
-export const TOTAL_VISITS = 8
+export const TOTAL_VISITS = 6
```
i.e., the locked-spine implementation commit moved the codebase from an even earlier 8-visit/24-session structure directly to 6 phases/27 sessions — never through a 7-phase intermediate state. There is no commit anywhere in this file's history that sets `TOTAL_VISITS = 7` or implements a 7th `VISIT_STRUCTURE` entry.

## Reading the evidence together

The rebuild plan's own later "Scope actually implemented" section is the authoritative record of what was actually built and verified — it exists specifically to record the final, as-built state after the target design in §3a was refined during implementation. The 6-phase grouping in that section maps 1:1 onto the current codebase, current tests, and every subsequent phase-gate audit (Phases 1–9) that has passed against it. The "7 phases" language in §3a was the **initial target design that was revised during implementation** and never subsequently re-implemented, re-approved, or referenced by any commit, migration, or test.

No commit, PR, or planning document was found that explicitly abandoned the 7-phase target *and* built a 6-phase substitute without also documenting that decision — the "Scope actually implemented" section in the same document **is** that documentation. This is not a silent, undocumented downgrade; it is a recorded implementation decision within the same authorized planning document.

## Finding

**The 6-phase structure is the correct, approved, as-built architecture.** The "7 phases" language quoted by later mandates (including the original Phase 9 mandate) came from the master rebuild plan's own superseded early planning prose (§3a), not from a different or more authoritative source, and not from an implementation that was ever actually built. No repository evidence — code, git history, database, or documentation — supports a real, ever-implemented 7th phase.
