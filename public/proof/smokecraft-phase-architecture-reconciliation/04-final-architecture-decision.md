# 03 — Final Architecture Decision

## Decision: OPTION A — the existing six phases are correct

Repository history and approved architecture prove that "seven phases" was an inaccurate, superseded planning statement — see `02-HISTORY-AUDIT.md` for the full evidence chain. The master rebuild plan document that originated the "7 phases" language also contains its own later, authoritative "Scope actually implemented" record stating 6 phases, matching the codebase exactly, corroborated by git history (`TOTAL_VISITS` went `8 → 6`, never through `7`), and consistent with every phase-gate audit (Phases 1–9) already passed.

## What this decision does

- Preserves all 6 phases exactly as implemented — no code change to `VISIT_STRUCTURE`, `TOTAL_VISITS`, `TOTAL_PHASES`, or any session-to-phase assignment.
- Preserves the 27-session journey exactly as implemented — no session added, removed, merged, reordered, or renamed.
- Corrects completion documentation and the master checklist to state 6 phases as the final approved count, resolving the discrepancy explicitly rather than leaving it open.
- Updates `PHASE-ARCHITECTURE-DISCREPANCY.md` with a link to this resolution, preserving its original finding history unchanged (not rewritten).

## What this decision does not do

- Does not add a 7th phase.
- Does not fabricate learning content, a new phase boundary, or a new session.
- Does not touch Golden Box or Packaging Studio placement (both remain correctly outside the 27-session spine as supporting/independent systems, unaffected by this decision either way).
- Does not require a database migration (no phase identifier is persisted anywhere for the SmokeCraft journey — see `01-SOURCE-AUDIT.md`).
- Does not weaken or delete `verify-smokecraft-phase9-full-journey.mjs:61`'s existing 6-phase assertion — it already asserts the now-confirmed-correct count.

## Final approved architecture

- **Final approved phase count:** 6
- **Final phase names:** Session Preparation, First Third, Second Third, Final Third, Reflection, Results
- **Final phase keys:** `visit: 1..6` (the existing field name, documented as meaning "phase" wherever displayed — see the existing comment in `src/constants/session.js`)
- **Canonical session count:** 27, unchanged
- **Canonical session source:** `VISIT_STRUCTURE` in `src/constants/session.js` (single source of truth, unchanged)
