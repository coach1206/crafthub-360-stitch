# 02 — Architecture Reuse

No second tasting-persistence system was built. Package A reuses:

| Layer | Reused component | New addition |
|---|---|---|
| Ledger table | `smokecraft_activity_attempts` (existing) | none — new `activity_type='tasting_observation'` value only |
| Idempotency | `UNIQUE(guest_reference, activity_type, activity_key)` / `UNIQUE(guest_reference, idempotency_key)` (existing constraints) | none |
| Completion + XP authority | `completeSession()` / `sessionRewardTable.js` (existing, unchanged for XP lookup) | one pre-transaction evidence gate, scoped to 3 sessionIds only |
| Identity | `requireSmokeCraftIdentity` middleware, `ownerGuestReference()` (existing) | none |
| Client API pattern | `makeIdempotencyKey` / `postJson` helpers in `playerStateApiClient.js` (existing) | one new client function, same pattern |
| Guest session context | `GuestSessionContext.jsx` (existing provider) | one new exposed callback, same pattern as `completeTasting` |

## New files

- `server/services/smokecraft/tastingObservationService.js` — validation + ledger writes for the
  3 sessionIds, server-side vocabulary enforcement per session (mirrors the exact zone/flavor ids
  rendered client-side), zero XP awarded by this function.

## Modified files (all additive, no removed functionality)

- `server/services/smokecraft/playerStateService.js` — `completeSession()` gate.
- `server/controllers/playerStateController.js` — new `handleSubmitTastingObservation`, plus a
  `tasting_observation_required` 400 branch in the existing completion error handling.
- `server/routes/smokecraftPlayerStateRoutes.js` — one new route.
- `src/services/smokecraft/playerStateApiClient.js` — one new client function.
- `src/context/GuestSessionContext.jsx` — one new exposed callback.
- `src/pages/smokecraft/FirstThird.jsx`, `SecondThird.jsx`, `FinalThird.jsx` — call the new
  submission before completion; add an honest error UI on failure.

No route, mentor, reward, scoring, or unrelated session-content logic was touched.
