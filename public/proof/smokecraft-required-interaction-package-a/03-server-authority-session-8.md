# 03 — Server Authority: Session 8 (First Third)

- Route: `/smokecraft/first-third` → `src/pages/smokecraft/FirstThird.jsx`
- Evidence endpoint: `POST /api/smokecraft/player-state/tasting-observation/first-third`
- Server vocabulary (`tastingObservationService.js`): `Aroma Opening`, `Draw Ease`, `Body Start`,
  `Flavor Notes`, `Burn Line`, `Ash Quality` — mirrors `EXPLORE_ZONES` in `FirstThird.jsx`.
- Validation: rejects empty `notesSelected`, rejects any id outside the server vocabulary,
  rejects non-string/over-length `personalNotes`, requires an idempotency key.
- Completion endpoint: `POST /api/smokecraft/player-state/sessions/first-third/complete` —
  `completeSession()` calls `hasTastingObservationEvidence(guestReference, 'first-third')` before
  the transaction opens; throws `tasting_observation_required` (mapped to HTTP 400) if no
  evidence row exists yet.
- XP: unchanged — `completeSession()` still looks up the award from `sessionRewardTable.js` by
  `sessionId` alone; the observation-submission function itself awards 0 XP.

Verified live in `verify-smokecraft-required-interaction-package-a-api.mjs` sections 2–7 (26/26
overall) and `verify-smokecraft-required-interaction-package-a-browser.mjs` (Session 8 flow,
14/14 overall).
