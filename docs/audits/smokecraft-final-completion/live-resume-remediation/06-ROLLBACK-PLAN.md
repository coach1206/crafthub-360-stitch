# 06 — Rollback Plan

## What changed

Three source files, all additive/corrective, no destructive change:

- `src/constants/smokecraftJourneyStatus.js` (already amended in the prior Live Resume-State Reconciliation pass; unchanged further in this pass).
- `src/pages/smokecraft/ResumeJourney.jsx` — `hasProgress` now reads `journeyStatus.hasStarted` instead of an independent raw `completedSteps` scan; CTA button labels and structure updated to the exact 3-state contract (`START SMOKECRAFT JOURNEY` / `RESUME SMOKECRAFT JOURNEY` / `VIEW COMPLETED JOURNEY` / `START NEW SMOKECRAFT JOURNEY`); bottom nav bar's primary action/label updated to match.
- `src/pages/SmokeCraft.jsx` — `hasRealJourneyProgress()` now delegates to `computeJourneyStatus(completedSteps).hasStarted` instead of its own independent scan; landing CTA label updated to the exact 3-state contract text.

No database migration, no server route, no identity/authorization logic was touched.

## Rollback procedure, if ever needed

1. `git revert <this pass's commit>` — safe; both fixed functions have no other dependents whose behavior this pass altered beyond the CTA display itself.
2. No database rollback needed (no migration ran).
3. No learner-facing data loss risk — this pass only changes what CTA text/state is *displayed* for a given `completedSteps` array; it never writes to `completedSteps` or any other persisted field.

## Why this is the smallest safe fix

The alternative — inventing a new server-side "active journey" record/table as suggested by the mandate's "canonical journey state API" language — was evaluated and rejected as unnecessary: no such record needs to be selected among duplicates, archived, or reconciled, because none is ever created server-side for the SmokeCraft numbered spine (confirmed in `02-DATA-RECONCILIATION.md`). The actual defect was two client-side functions using a weaker check than the one already fixed and proven correct in the prior pass. Reusing that one proven authoritative function in both places is the minimal, lowest-risk fix.
