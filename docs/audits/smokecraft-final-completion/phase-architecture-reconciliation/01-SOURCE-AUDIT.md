# 01 — Source Audit

**Starting commit:** `b55c867d963283825c8bdd7de5311365c9977838` — local `HEAD` and `origin/recovery/smokecraft-codex-final` both matched, working tree clean, before this pass began.

## Canonical source: `src/constants/session.js`

```
export const TOTAL_VISITS = 6
export const TOTAL_PHASES = TOTAL_VISITS
export const TOTAL_SESSIONS = 27
```

`VISIT_STRUCTURE` assigns every one of the 27 sessions to a `visit` (phase) number 1–6, with no gaps, no duplicate session numbers, and no orphaned phase. Every session belongs to exactly one phase:

| Phase | Title | Sessions |
|---|---|---|
| 1 | Session Preparation | S1–S7 |
| 2 | First Third | S8–S11 |
| 3 | Second Third | S12–S15 |
| 4 | Final Third | S16–S18 |
| 5 | Reflection | S19–S20 |
| 6 | Results | S21–S27 |

`SUPPORTING_MODULES` (9 entries) and `ENTRY_LAYER_SCREENS` (5 entries) are explicitly documented as outside `TOTAL_SESSIONS`/the phase map — they are not miscounted sessions, they are deliberately unnumbered side systems.

## Consumers of the canonical source (all read `VISIT_STRUCTURE`/`TOTAL_VISITS`, none define a competing map)

- `src/constants/smokecraftJourney.js` — `isSessionUnlocked`, `getCurrentAllowedSession`, `getLockedReason`, `getSessionByRoute/Key/Number`, `getVisitBySession`.
- `src/components/smokecraft/SmokeCraftSessionGuard.jsx`, `LockedSmokeCraftScreen.jsx`, `SmokeCraftProgressHeader.jsx`, `SmokeCraftProgressContext.jsx` — all consume the same functions, no local re-implementation of phase counting.
- `src/context/SmokeCraftJourneyContext.jsx` — resume/progress logic, same source.
- No Skill Tree, Collections, Challenge Hub, or Passport module defines or stores its own phase count — all three read `completedSteps` (session ids), never phase numbers.
- Golden Box and Packaging Studio are registered as `SUPPORTING_MODULES`/independent systems outside the 27-session spine (confirmed unaffected by phase-count in either direction).

## Database

No table or column stores a SmokeCraft journey phase number or phase key. Search of all 90 migrations found zero references to a SmokeCraft phase in schema (the only `phase_key` columns found belong to the unrelated NOVEE OS Phase C launch-readiness system — a completely different governance/launch-checklist feature, confirmed by file path and content, not the SmokeCraft learner journey). Learner progress (`golden_box_entries`, guest-session `completedSteps`, XP, Passport) is keyed on session/step ids, never phase numbers — **this pass is documentation-only; no migration is required.**

## Tests

- `verify-smokecraft-27-session-spine.mjs` and `verify-smokecraft-authoritative-sequence.mjs` — both assert the 27-session/6-phase structure, both pre-date this operation.
- `verify-smokecraft-phase9-full-journey.mjs:61` — already explicitly asserts `TOTAL_VISITS === '6'` with an inline comment stating "this pass does not fabricate a 7th phase to match the mandate's wording."

## Search for "7 phases" / "phase 7" / "Phase 7" in active source and docs

Every hit outside `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md` and the `gate-reconciliation`/`phase-architecture-reconciliation` audit trail belongs to the **unrelated NOVEE OS "Phase C" governance rollout** ("Module N of 7" — tenant governance, billing governance, security governance, etc.) — a different feature area entirely, confirmed by file path (`src/pages/noveeOS/*`, `server/services/noveeOS/*`) and content. None of these reference the SmokeCraft learner journey's phase count. No active SmokeCraft-journey source code, route, or component contains a "7 phases" claim.

The only "7 phases" language tied to the SmokeCraft journey specifically is in `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md`'s early planning sections (§3a, line ~39/146/158) — see `02-HISTORY-AUDIT.md` for the full resolution of that document's own internal inconsistency.

## Conclusion of source audit

One canonical phase map exists (`VISIT_STRUCTURE`/`TOTAL_VISITS`/`TOTAL_PHASES` = 6). No competing phase count exists anywhere in active source, tests, or the database. The only unresolved "7" is in stale prose within the master rebuild plan document itself — addressed in `02-HISTORY-AUDIT.md`.
