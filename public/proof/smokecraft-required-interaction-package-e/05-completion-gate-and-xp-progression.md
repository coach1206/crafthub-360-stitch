# 05 — Completion Gate / XP / Progression Proof

## The additive gate pattern (Packages A/B/C/E)

`playerStateService.js#completeSession()` already sequentially checked `hasTastingObservationEvidence` (Package A), `hasScorecardEvidence` (Package B), and `hasSelectionEvidence` (Package C) before allowing any session to complete — each function returns `true` immediately for every sessionId outside its own scope, so the checks compose safely.

Package E adds a 4th, identically-shaped gate:

```js
export async function hasPassportStampEvidence(guestReference, sessionId) {
  if (sessionId !== 'passport-stamp') return true
  const stamps = await getPassportStamps(guestReference)
  return stamps.some(s => s.stamp_id === 'smokecraft-journey-complete')
}
```

wired into `completeSession()` immediately after the Package C check, throwing `passport_stamp_evidence_required` (mapped to an honest `400` by `playerStateController.js`, mirroring the existing `tasting_observation_required` / `scorecard_evidence_required` / `selection_evidence_required` mappings) when absent.

## Stamp awarded after valid completion, exactly once; XP/progression exactly once

`verify-smokecraft-required-interaction-package-e-api.mjs`:

- Test 7: `POST /sessions/passport-stamp/complete` before any real stamp claim → `400 passport_stamp_evidence_required`.
- Test 8-9: full 6-prerequisite chain completed with real, server-graded evidence → `eligibility.eligible === true` → `POST /claim` → `200`, real `stamp.stampId === 'smokecraft-journey-complete'`.
- Test 12: `POST /sessions/passport-stamp/complete` AFTER the real claim → `201`; `completedSessions` contains `passport-stamp` exactly once; `xpTotal > 0`. A second completion call with a fresh idempotency key → `200 alreadyCompleted: true` (no duplicate XP).

## Duplicate/concurrency proof — see doc 06.
