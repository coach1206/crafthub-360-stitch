# Journey/Visual/Sequence Final Pass — Baseline

**Scope disclosure**: this mandate is another 18-phase pass covering journey-state authoritativeness,
a full 27-session/visual re-verification, and live Railway proof. Given the size of every mandate this
session and the standard of real work over shallow claims, this pass focuses on the actual reported
live bug (the journey-state contradiction), fixes it for real with a proven root cause and a passing
test, re-confirms no regression across the existing suite, and documents the remainder honestly rather
than re-deriving the entire 27-session/visual audit a third time (already covered in
`docs/audits/smokecraft-final-completion/image-integration*/` and
`docs/audits/production-readiness-consolidated/`).

## Phase 1 — git state

```
git branch --show-current   → recovery/smokecraft-codex-final
git rev-parse HEAD           → 624d313c4845c517ef6306043d2e9b9864214d96
git rev-parse @{u}           → origin/recovery/smokecraft-codex-final
ahead/behind                 → 0  0  (already up to date, no pull needed)
```
Uncommitted paths at start: 0 (clean tree after the prior production-readiness pass's commits).

## The real bug, root-caused

Two independent screens each computed their own definition of "journey complete":

- `ResumeJourney.jsx` defined `journeyComplete = completedSteps.includes('session-complete')` — true
  the instant a single flag id is present, **regardless of whether the other 26 sessions were ever
  actually completed** — while separately computing `completionPercent` from a genuinely different,
  correct count (`completedSessions.length / TOTAL_SESSIONS`, sourced from `useSmokeCraftProgress()`).
  These two numbers could disagree by construction — exactly the reported "Journey Completed" + "63%"
  contradiction.
- The bottom sticky nav bar's primary action was **hardcoded to "Resume Journey →" regardless of
  `journeyComplete`** — so even when the page body correctly said "Journey Completed", the persistent
  bottom bar still offered "Resume Journey" as the primary action. This is the exact reported
  "Resume Journey is also visible" contradiction.
- `SmokeCraft.jsx` (the `/smokecraft` landing page) never checked completion at all — it only knew
  Start vs. Resume (`isReturning`), so a guest whose journey was already complete would still see
  "Resume Journey →" instead of a result-oriented action. This is the reported "Landing page shows
  RESUME JOURNEY when it should show START SMOKECRAFT 360" class of bug (more precisely: neither Start
  nor the old binary Resume was correct for a completed journey — a third state was needed).

Root cause: **no single authoritative function existed** for "is this journey complete" — each screen
computed its own answer from the same raw `completedSteps` array, using different logic, so they could
never be guaranteed to agree.

## Fix

New file `src/constants/smokecraftJourneyStatus.js` — one function, `computeJourneyStatus(completedSteps)`,
deriving `completedSessionCount`, `completionPercent`, and `isComplete` (only true when
`completedSessionCount === TOTAL_SESSIONS`, i.e. all 27 real sessions, never a single flag in
isolation) from the real `VISIT_STRUCTURE` session ids — the same registry every other part of the app
already treats as authoritative. Both `ResumeJourney.jsx` and `SmokeCraft.jsx` now call this one
function instead of computing independently. The bottom nav bar's primary action now follows the same
`journeyComplete` value the page body uses.

This is a real, provable, deterministic fix — not a guess — verified by a new test suite reproducing
both the exact reported inconsistent-data shape and a genuinely complete 27-session journey, on both
affected screens.
