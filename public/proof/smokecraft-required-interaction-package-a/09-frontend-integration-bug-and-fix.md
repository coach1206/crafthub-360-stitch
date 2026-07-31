# 09 — Frontend Integration Bug Found and Fixed

## The bug

`SmokeCraftScreenRenderer.jsx` — "the single canonical render path" for all 27 curriculum
screens — always supplies a real `onComplete` callback to `FirstThird`/`SecondThird`/`FinalThird`
when a session is reached through normal navigation. The original `handleContinue()` in each of
the three files called `submitTastingObservation()` only in the `!onComplete` fallback branch,
**after** an early `if (onComplete) { onComplete(); return }`. Since real usage always supplies
`onComplete`, the new evidence-submission call was dead code in production — the actual
completion path (`onComplete()` → `completeSmokeCraftScreen()` → `awardSessionRewards()` →
server `completeSession()`) ran without ever submitting evidence first, and was then correctly
rejected by the new server-side gate (no evidence existed yet).

This was caught by a real, failing Playwright run — not by static review — with the stack trace
`completeSmokeCraftScreen: prerequisites not met for "session-8"` traced through
`SmokeCraftScreenRenderer.jsx:45` → `FirstThird.jsx` → `SmokeCraftNavBar.jsx`.

## The fix

Reordered `handleContinue()` in all three files so `await submitTastingObservation(...)` runs and
`result.ok` is checked **before** the `if (onComplete)` branch, guaranteeing evidence is recorded
first regardless of which completion path fires. On failure, `done` is reset to `false` and an
honest `role="alert"` error is shown instead of silently succeeding.

## Verification

Re-run of `verify-smokecraft-required-interaction-package-a-browser.mjs` after the fix passes the
full real-browser completion flow for all three sessions (14/14).
