# 01 — Discovery Report: Session 23 (passport-stamp)

## Scope

Required-Interaction Closure Package E targets exactly one session: **Session 23, `passport-stamp`** (route `/smokecraft/passport-stamp`). Canonical component `src/pages/smokecraft/PassportStamp.jsx`, canonical server route `server/routes/smokecraftPassportStampRoutes.js`, canonical backend service `server/services/passport360/passport360SyncService.js`.

Prior manifest classification: `PARTIAL`.

## Two real defects found by direct source read

### Defect 1 (SC-D067) — backward/unreachable sequencing

`REQUIRED_STEPS` (duplicated in both `PassportStamp.jsx` and `smokecraftPassportStampRoutes.js`) included `'final-review'` — Session 24. Route order is:

```
pairing-recommendations (22) → passport-stamp (23) → final-review (24)
```

Requiring Session 24's completion as a prerequisite for Session 23 makes first-time eligibility structurally impossible on a normal, linear visit — the player cannot have completed a session that comes AFTER the one they are currently trying to complete. This is a genuine, previously undocumented (as a fix-required defect) design bug, logged as **SC-D067** (the highest prior defect number in this operation's docs was SC-D066).

### Defect 2 — missing server authority

`checkEligibility(completedSteps, scorecardId)` in the server route trusted `req.query.completedSteps` / `req.body.completedSteps` and `scorecardId` verbatim from the client — never cross-checked against the real, server-recorded completion table (`smokecraft_session_completions`, via `playerStateService.getPlayerState()`). Any caller could claim the stamp by simply POSTing a fabricated `completedSteps` array.

## Additional defect found during implementation

`PassportStamp.jsx`'s `handleContinue()` called `awardSessionRewards('passport-stamp')` (the session's own generic completion) unconditionally when `onComplete` was absent — regardless of whether a real stamp had been claimed. Combined with a silent auto-claim `useEffect`, this meant Session 23 could "complete" without the player ever performing a real, visible required interaction.

## Resolution summary (see docs 02-15 for full evidence)

1. `REQUIRED_STEPS` in both files reduced to the 6 real, reachable prerequisite sessions.
2. Server `checkEligibility()` rewritten to read real completions from `smokecraft_session_completions` via `playerStateService.getPlayerState()`.
3. New `hasPassportStampEvidence()` gate wired into `completeSession()`'s existing additive gate chain (same pattern as Packages A/B/C).
4. Silent auto-claim effect replaced with an explicit "Claim Your Stamp" button, disabled until server-verified eligible.
5. Identity-format convention (`user:<id>` / raw guest id) unified between the Passport-360 claim identity and the `smokecraft_session_completions` lookup to prevent a desync for authenticated users.

No second Passport/rewards system was created — `claimJourneyCompletionStamp()` and `getStamps()` (real `passport_360_earned_stamps` table, real `dedupe_key` idempotency) are reused unmodified.
