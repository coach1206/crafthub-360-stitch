# 01 — Root Cause

## The defect

Landing page showed `RESUME JOURNEY` and routed to `/smokecraft/resume`, which then showed an internally contradictory Saved Journey card: `Current session: S1`, `Last completed session: S27`, `Completion: 63%`.

## Two independent bugs, same root pattern

The previous remediation pass (Live Remediation: Resume-State Reconciliation) fixed `lastCompletedSession`/`completionPercent`/`isComplete` to derive from one contiguous-prefix rule (`computeJourneyStatus` in `smokecraftJourneyStatus.js`), matching `currentSession`'s existing strict-order logic (`getCurrentAllowedSession`). That fix was correct and necessary, but it did not fix a **second, sibling instance of the identical bug pattern**: the "does a resumable/returnable journey exist at all" check (`hasProgress` in `ResumeJourney.jsx`, and its duplicate `hasRealJourneyProgress()` in `SmokeCraft.jsx`, the landing page) still used the OLD unsafe check — `completedSteps.some(id => !PRESERVED_COMPLETED_STEP_IDS.includes(id))` — i.e. "does ANY non-preserved session id exist anywhere in completedSteps," with no requirement that those ids represent real, in-order progress.

For a legacy-shaped record (most plausibly one where S1/`entry` was never backfilled after it became a real required session in Package N — see the prior remediation pass's `02-root-cause-repro.txt`), this meant:

- `computeJourneyStatus` (already fixed) correctly reports `hasStarted: false`, `completionPercent: 0`.
- `hasProgress`/`hasRealJourneyProgress()` (NOT yet fixed until this pass) still returned `true`, because *some* later session id was present in `completedSteps` even though no session was genuinely completed in order.

This is exactly why the landing page still showed `RESUME JOURNEY` for a user with no real active progress, and why `/smokecraft/resume` still rendered a Saved Journey card (with `currentSession: S1` correctly gated, but the card's mere presence and the primary "Resume" CTA misrepresenting the state as resumable).

## Fix

Both `hasProgress` (`ResumeJourney.jsx`) and `hasRealJourneyProgress()` (`SmokeCraft.jsx`) now read `journeyStatus.hasStarted` / `computeJourneyStatus(completedSteps).hasStarted` — the same single authoritative signal already used for `currentSession`, `lastCompletedSession`, and `completionPercent`. A "no valid active journey" state can no longer coexist with a rendered Saved Journey card or a "Resume" CTA.

## Not a server/database defect

No SmokeCraft journey state is persisted server-side (confirmed in the prior Phase Architecture Reconciliation and Live Resume-State Reconciliation passes) — `completedSteps` lives in the guest-session record (cookie-identified, `novee_guest_session` in localStorage as a display cache, with the guest-session cookie as the actual identity anchor). This is a pure client-side derivation-logic defect, self-correcting for every guest on next load once the fixed logic ships — no data repair, migration, or per-record reconciliation is needed or possible, since no canonical "active journey" record exists to repair. See `02-DATA-RECONCILIATION.md` for the full disclosure of why no migration was created.
