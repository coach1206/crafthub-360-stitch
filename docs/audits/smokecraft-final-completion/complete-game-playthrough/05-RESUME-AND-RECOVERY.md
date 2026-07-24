# 05 — Resume and Recovery

## Resume

Seeded a mid-journey completion set (`priorStepsFor(10)` — everything a real player completes through session 10). `computeJourneyStatus(...)` — the same canonical function every route guard and progress display reads — returns a completion percent strictly between 0% and 100%, `isComplete: false`. `/smokecraft/resume` resolves to a valid in-app route with no error. This is source-level proof the mid-journey pointer is genuinely partial, not a 0%/100% degenerate case, consistent with the contiguous-prefix rule fixed in the earlier Live Resume-State Reconciliation pass (unchanged, re-verified here, not re-fixed).

## Start New

With an active (mid-journey) journey seeded, landing (`/smokecraft`) renders a Start/Resume/View-Completed CTA per the existing 3-state contract (`START SMOKECRAFT JOURNEY` / `RESUME SMOKECRAFT JOURNEY` / `VIEW COMPLETED JOURNEY`, built in the Live Start/Resume State Remediation pass). Full click-through archive/clean-state verification (cancel-then-confirm Start New, history-remains, no-old-data-carryover) was proven live in that earlier pass and in the Prompt 1 Canonical Journey Authority pass (`journey.identity` reset fix) — not re-derived from scratch here; this pass confirms the CTA itself renders correctly with an active journey present, completing the playthrough-level check.

## Refresh / recovery scenarios

Refresh-during-entry, refresh-during-session, refresh-during-Golden-Box, browser Back/Forward, second-tab, and locked-route-direct-access behavior are all covered by existing, still-passing dedicated regression suites from earlier passes (`verify-smokecraft-entry-prerequisite-guard.mjs` 43/43 — direct URL, back/forward, refresh, second-tab, bookmark, LocalStorage/query-param forgery; `verify-smokecraft-canonical-journey-authority.mjs` 25/25 — corrupt/noncontiguous completion state, invalid activeJourneyId). Both re-run clean in this pass's regression battery (see `07-REGRESSION-MATRIX.md`) — not re-implemented as a third parallel test.
