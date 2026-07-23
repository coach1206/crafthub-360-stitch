# 00 — Final Report: Start vs. Resume Journey State Correction

**Repo/branch:** `coach1206/crafthub-360-stitch` / `recovery/smokecraft-codex-final`
**Starting commit:** `d9979f2c7c3e6921fc6bf669372e28500c5a492f` — superseded by the prior Live Resume-State Reconciliation pass's push to `cbd1e7ae50685383246a5665a5b9d71fdfe5867c` before this pass began; verified local = remote = `cbd1e7ae...`, clean tree, before any change in this pass.

## Root cause

Two client-side functions — `hasProgress` in `ResumeJourney.jsx` and `hasRealJourneyProgress()` in `SmokeCraft.jsx` — determined "does a resumable journey exist" by scanning `completedSteps` for the presence of ANY non-preserved session id, with no requirement that earlier required sessions were also complete. This is the same bug class the immediately-prior pass fixed for `lastCompletedSession`/`completionPercent`, but that fix did not touch these two sibling checks. A legacy-shaped record (later session ids present without S1/`entry`, per the prior pass's root-cause finding) still satisfied this weaker check, so the landing page still showed `RESUME JOURNEY` and the Resume page still rendered a Saved Journey card, even though the authoritative `currentSession`/`completionPercent` logic already correctly reported no real progress.

## Fix

Both functions now delegate to `computeJourneyStatus(completedSteps).hasStarted` — the exact same single authoritative source already used for `currentSession`, `lastCompletedSession`, and `completionPercent`. All four values are now derived from one number; none can disagree.

## Journey-state source of truth / active-journey selection

No server-side "active journey" record exists for the SmokeCraft numbered spine — confirmed in `02-DATA-RECONCILIATION.md`. The client-side `completedSteps` array (identified by the server-derived guest-session cookie) remains the single input; `computeJourneyStatus`'s contiguous-prefix rule is the single derivation function all three states (start/resume/completed) and all four consuming values are computed from.

## Migration

None required. See `02-DATA-RECONCILIATION.md` for the full disclosure of why the current schema (no persisted phase/journey-state table) is sufficient and no data-repair function was created.

## Landing page results

- Start state: `START SMOKECRAFT JOURNEY →` (exact)
- Resume state: `RESUME SMOKECRAFT JOURNEY →` (exact)
- Completed state: `VIEW COMPLETED JOURNEY →` (exact)
- No stale phase/session count is ever rendered on the landing page (none existed there before or after this pass).

## Resume-page (`/smokecraft/resume`) results

- Empty state: "No Active SmokeCraft Journey" heading, no fake session/progress data, primary button `START SMOKECRAFT JOURNEY` (no confirmation — nothing recoverable to lose).
- Incomplete state: accurate journey details, primary `RESUME SMOKECRAFT JOURNEY`, secondary `START NEW SMOKECRAFT JOURNEY` (confirmation required).
- Completed state: primary `VIEW COMPLETED JOURNEY`, secondary `START NEW SMOKECRAFT JOURNEY` (confirmation required).
- Bottom nav bar's primary CTA/label updated to match all three states exactly (previously always said "Resume Journey" even when disabled for a no-progress guest).

## Start New Journey — audited, already compliant (no change needed)

New unique `activeJourneyId` minted; resets welcome/mentor/cigar/scorecard/Golden Box/etc. state; archives prior journey into `previousCompletedJourneys` when it was complete; `completedSteps` reset to only `PRESERVED_COMPLETED_STEP_IDS`. **Disclosed scope decision, unchanged from before this pass:** venue preference and cumulative XP/rank/rewards/Passport history are deliberately preserved across a new journey (already documented in the confirm-dialog's own copy) — this is existing, intentional product design, not a defect this mandate's screenshots identified, and changing it would be outside this pass's scope ("fixes only the live SmokeCraft Start/Resume journey-state behavior").

## Identity and isolation

No identity/authorization code was changed. Cross-learner isolation re-verified via the Passport Security Unified Identity regression suite (59/59). Live cross-learner/guest-cookie verification remains blocked — same network-access limitation as Phase 10.

## Defects discovered and fixed

1. `ResumeJourney.jsx`'s `hasProgress` trusted any non-preserved completedStep id without requiring contiguous-order completion — fixed.
2. `SmokeCraft.jsx`'s `hasRealJourneyProgress()` had the identical defect, independently implemented — fixed.
3. CTA text on both screens used generic wording (`Resume Journey →`, `Start Journey →`, `View Results →`, `Review Completed Journey →`) instead of the required exact strings — fixed.

## Production files changed

`src/pages/smokecraft/ResumeJourney.jsx`, `src/pages/SmokeCraft.jsx` (both additive/corrective, no destructive change — see `06-ROLLBACK-PLAN.md`).

## Dedicated suite result

`verify-smokecraft-start-resume-state.mjs` — 42/48 pass, 0 fail, 6 correctly report blocked (live-only checks, network access policy-blocked).

## Required regression results

Phase 9 Full Journey (36/39, 3 stale-commit-only), Phase 9A Packaging Studio Journey Amendment (51/54, 3 stale-commit-only), Golden Box Packaging Studio (71/74, 3 stale-commit-only), Passport Security Unified Identity (59/59). Full detail in `05-REGRESSION-MATRIX.md`, including a mid-pass environment hiccup (Postgres + both Vite servers went down and were restarted) that is disclosed as environment recovery, not a regression.

## Production build / startup / health check

All pass (see proof directory).

## Live deployment verification

**Still blocked** — same organization egress policy denial documented in Phase 10 (`docs/audits/smokecraft-final-completion/live-deployment-verification/01-ENVIRONMENT-DISCOVERY.md`). No network path to `https://crafthub360.up.railway.app` exists in this session. Deployment commit, `/api/version`, `/api/health`, live landing page, and live resume page could not be verified against production. Localhost/preview evidence is not substituted for live evidence anywhere in this pass's proof package.

## Phase 10 status

**Cannot be marked complete.** The source defect the live screenshots revealed is now fixed and locally verified, but the fix has not been deployed to or verified against the real production origin — the same blocker documented in the original Phase 10 pass still applies.

## Remaining blockers

Identical to Phase 10: no network path to the production URL, no provider dashboard/CLI credentials, no CI/CD deployment workflow to inspect. What would close the gap: a Railway dashboard screenshot/log, authenticated Railway CLI output, or a direct user-supplied response from `/api/version`/`/api/health`/`/smokecraft`/`/smokecraft/resume` at the real production origin.

**Status: ENGINEERING COMPLETE — SMOKECRAFT START/RESUME FIX NOT YET LIVE VERIFIED**

## 2026-07-23 update — Phase 10 Closeout pass (deploy-and-verify attempt)

A subsequent pass ("Phase 10 Closeout: Deploy and Live-Verify the Start/Resume Fix") requested deploying `cbd1e7ae50685383246a5665a5b9d71fdfe5867c` to Railway and live-verifying the corrected CTA behavior. This could not be performed: this session has no Railway CLI, no Railway credentials, no dashboard access, and no network path to `https://crafthub360.up.railway.app` (still a confirmed policy denial, re-checked). See `docs/audits/smokecraft-final-completion/live-deployment-verification/02-DEPLOYED-COMMIT.md` for the full re-check and an important correction: `cbd1e7ae...` predates the actual CTA-label fix (it only contains the `lastCompletedSession` fix from the prior pass) — the commit that contains the complete fix is `7f259e7a4f8a02ad466879d098d01a65fe811623`. No deployment was triggered and no live verification was performed; nothing in this repository claims otherwise.
