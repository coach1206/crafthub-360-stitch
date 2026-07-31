# 02 — SC-D067 Sequencing Fix

## Defect

`REQUIRED_STEPS` in `server/routes/smokecraftPassportStampRoutes.js` and `src/pages/smokecraft/PassportStamp.jsx` both included `'final-review'` (Session 24), which comes chronologically AFTER `passport-stamp` (Session 23):

```
pairing-recommendations (22) → passport-stamp (23) → final-review (24)
```

A player visiting Session 23 for the first time, having completed every session up through 22, could never satisfy this requirement — Session 24 cannot have been completed yet.

## Fix

Both `REQUIRED_STEPS` arrays reduced to:

```js
['humidor-match', 'first-third', 'second-third', 'flavor-memory', 'final-third', 'scorecard']
```

All 6 are real, chronologically-preceding sessions (2, 8, 12, 10, 16, 19 respectively) that a player will have genuinely completed before reaching Session 23 in normal play.

## Verification

- `scripts/validateSmokecraftPackageEPassportSequencing.mjs` — asserts via regex that neither file's `REQUIRED_STEPS` contains `'final-review'`, and that the server list is exactly the 6 real sessions.
- `verify-smokecraft-required-interaction-package-e-api.mjs`, test 3: "REQUIRED_STEPS no longer includes final-review" / "REQUIRED_STEPS is exactly the 6 real, reachable prerequisite sessions" — both PASS against the live `/eligibility` response.
- `verify-smokecraft-required-interaction-package-e-api.mjs`, test 8: a guest who completes exactly those 6 real sessions (and nothing from Session 24) becomes eligible — proving the sequencing is now reachable on a normal, linear playthrough.
