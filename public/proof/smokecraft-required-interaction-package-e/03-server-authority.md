# 03 — Server Authority (Missing-Authority Defect Fix)

## Defect

`checkEligibility(completedSteps, scorecardId)` accepted `completedSteps`/`scorecardId` directly from `req.query`/`req.body` with no cross-check against any server-recorded fact. Both the `GET /eligibility` and `POST /claim` routes were vulnerable to a trivial bypass: `POST /api/smokecraft/passport-stamp/claim` with a fabricated `completedSteps` array would be treated as eligible.

## Fix

`checkEligibility(req)` (now `async`, takes the request, not client-submitted arrays) resolves the caller's own real completions:

```js
async function checkEligibility(req) {
  const guestReference = playerStateGuestReference(req)
  const state = await getPlayerState(guestReference)
  const completedIds = state.completedSessions.map(s => s.sessionId)
  const missing = REQUIRED_STEPS.filter(s => !completedIds.includes(s))
  return { eligible: missing.length === 0, missing, reasons: missing.map(s => `Step incomplete: ${s}`) }
}
```

`getPlayerState()` reads `smokecraft_session_completions` (server-authoritative, written only by `completeSession()`'s own idempotent, evidence-gated transaction — see doc 05). Both `/eligibility` and `/claim` now call this same function; neither reads `completedSteps`/`scorecardId` from the request at all.

Since Package B already gates the `'scorecard'` session's own completion on real, server-recorded Scorecard evidence (`hasScorecardEvidence`), "has scorecard" reduces to "`'scorecard'` is present in the real completed-sessions set" — no separate `scorecardId` concept was needed or reintroduced.

## Verification

- `verify-smokecraft-required-interaction-package-e-api.mjs`, test 5: "A client-submitted completedSteps/scorecardId/guestId/xpEarned payload is completely ignored" — direct bypass attempt with a fully-fabricated request body, still denied (422).
- Same suite, test 5b: fabricated `completedSteps`/`scorecardId` in the `/eligibility` querystring likewise ignored.
- `scripts/validateSmokecraftPackageEPassportSequencing.mjs` — confirms via source inspection that the client-submitted destructure is gone and `getPlayerState()` is called.
