# Progression, Scoring/XP/Rewards, Mentor, and Accessibility Findings

(Consolidated per this discovery pass's scope — no gameplay behavior
was changed to produce these findings; all are source-read and
regression-test observations.)

## Progression dependency map

Every session's completion is mandatory to reach the next (the
existing session-guard architecture, confirmed unchanged and passing
in this pass's build — `validateSmokecraftShellAdoption.mjs` and
`phase-session-lock` both part of the green `npm run build`). Direct
route navigation to a later session without completing an earlier one
is already blocked by the existing guard system (`SmokeCraftSessionGuard`)
— not re-verified via a fresh live click-through this pass (out of
scope for a discovery-only pass), but confirmed structurally intact via
the passing build gate. Reload preserves unlock state (server-owned
`smokecraft_session_completions`, confirmed via the passing gameplay-
engine suite's reload-persistence assertions). No second progression
path was found.

## Scoring, XP, and reward findings

- XP is server-owned and safe for all 21 sessions (see
  `06-backend-ownership-map.md`).
- No hardcoded or frontend-calculated XP was found — every completion
  call defers to `sessionRewardTable.js` server-side.
- No evidence of rewards awarded twice — `completeSession()`'s
  `UNIQUE_VIOLATION` handling returns the original completion on
  retry, confirmed by source read and the passing "two-tab race grants
  XP exactly once" assertion in `verify-smokecraft-hf5a2-reward-authority.mjs`
  (19/19, re-run clean this pass).
- Session 25 (Rewards/XP display) was not independently verified this
  pass to confirm its displayed totals are read live from server player
  state rather than recomputed from local constants — recorded as
  `COMPLETE_BUT_UNTESTED`, not asserted either way.

## Mentor integration findings

Mentor involvement is required only for Session 14 (Mentor Commentary)
— confirmed real, dynamic, activity-derived, with an honest fallback
when no mentor is selected (not forced into any of the other 20
sessions, consistent with the mandate's instruction not to force
mentor integration where it doesn't belong).

## Accessibility and tablet findings

Not independently re-audited control-by-control this pass (a
discovery-only pass covering 21 sessions' backend architecture, not a
fresh five-viewport interaction sweep) — the existing, passing
`validateSmokecraftResponsive.mjs` (130/130 routes, 0 failures, most
recently re-confirmed in the Production Hardening Phase 1 pass) is the
evidence relied on for baseline responsive health; it was not re-run
in this pass since no route or component behavior changed.
