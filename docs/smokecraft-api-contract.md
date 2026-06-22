# SmokeCraft API Contract (Phase 9 plan → Phase 10 implementation)

Status: **all endpoints below are implemented** as of Phase 10
(`server/routes/smokecraftRoutes.js` mounted at `/api/smokecraft`,
`server/routes/smokecraftEatRoutes.js` mounted at `/api/eat/smokecraft`).
The pre-existing unrelated pairing-order feature
(`POST /api/smokecraft/pairing-order`, `GET /api/smokecraft/orders` in
`server/routes/smokecraftOrders.js`) is untouched and mounted alongside.

Every endpoint uses Postgres when `DATABASE_URL` is set AND the `smoke_*`
tables already exist (this repo has no migration runner — `011_smokecraft_schema.sql`
is not auto-applied, so the tables must be created externally before Postgres
mode actually engages), otherwise it transparently falls back to an in-memory
store within the running server process. Every response has the shape
`{ ok, status, storageMode: "postgres" | "memory_fallback" | "none", data, error }`.
The frontend (`smokeSharedStorageService.js`) only reports "shared venue
storage" to the UI when `storageMode === "postgres"` — memory-fallback
responses are honestly labeled as non-durable, in-process-only storage, not
shared/multi-device storage.

Base path: `/api/smokecraft` and `/api/eat/smokecraft` (relative — same pattern as
every other route in this repo; the frontend has no `VITE_*_API_BASE_URL` env var
and instead relies on the existing Vite dev proxy `/api` → `http://localhost:3001`,
see `vite.config.js` and `src/services/apiClient.js`). Phase 9 keeps this pattern
rather than inventing a new env var.

## Sessions

### `POST /api/smokecraft/sessions`
- **Request body**: `{ sessionId, venueId?, xp?, rank?, completedSteps?, finalScore?, challengeStatus? }`
- **Response body**: `{ ok: true, session: {...smoke_sessions row} }`
- **Auth/role**: guest/session user (no staff role required — a guest can create their own session record).
- **Error states**: `400` missing `sessionId`; `409` if `sessionId` already has a smoke_session.
- **Local fallback behavior**: on failure/unreachable, `smokeSharedStorageService.saveSmokeSessionSnapshot` keeps writing to `novee_smoke_shared_session_snapshots`.
- **Frontend service**: `smokeBackendApiClient.createSmokeSessionRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

### `GET /api/smokecraft/sessions/:sessionId`
- **Response body**: `{ ok: true, session: {...} }` or `{ ok: false, error: 'not_found' }`
- **Auth/role**: guest (own session), POS3 staff, E.A.T. manager, admin/founder.
- **Error states**: `404` if not found.
- **Local fallback**: `loadSmokeSessionSnapshot(sessionId)` reads local storage.
- **Frontend service**: `smokeBackendApiClient.getSmokeSessionRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

### `PATCH /api/smokecraft/sessions/:sessionId`
- **Request body**: partial `{ xp?, rank?, completedSteps?, finalScore?, challengeStatus? }`
- **Response body**: `{ ok: true, session: {...} }`
- **Auth/role**: guest (own session) or staff/admin correcting a record.
- **Error states**: `404` not found; `400` invalid fields.
- **Local fallback**: re-write of the local snapshot.
- **Frontend service**: `smokeBackendApiClient.updateSmokeSessionRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

## Session Events

### `POST /api/smokecraft/sessions/:sessionId/events`
- **Request body**: `{ type, timestamp, payload? }`
- **Response body**: `{ ok: true, event: {...} }`
- **Auth/role**: guest, POS3 staff, or E.A.T. manager (whoever triggers the event).
- **Error states**: `404` session not found; `400` missing `type`.
- **Local fallback**: events stay only in `session.smokeCraft.eventLog` (already always local — no Phase 8 remote path existed for this).
- **Frontend service**: `smokeBackendApiClient.postSmokeSessionEventRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

### `GET /api/smokecraft/sessions/:sessionId/events`
- **Response body**: `{ ok: true, events: [...] }`
- **Auth/role**: POS3 staff, E.A.T. manager, admin/founder (audit visibility).
- **Error states**: `404` session not found.
- **Local fallback**: n/a — read from local `eventLog` directly in the UI.
- **Frontend service**: none yet (read access not wired client-side this phase).
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

## Purchase Intents

### `POST /api/smokecraft/purchase-intents`
- **Request body**: `{ intentId, sessionId, venueId?, product? }`
- **Response body**: `{ ok: true, intent: {...smoke_purchase_intents row} }`
- **Auth/role**: guest/session user creates their own intent.
- **Error states**: `400` missing fields; `409` duplicate `intentId`.
- **Local fallback**: `saveSmokePurchaseIntent` keeps writing to `novee_smoke_shared_purchase_intents`.
- **Frontend service**: `smokeBackendApiClient.createSmokePurchaseIntentRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

### `GET /api/smokecraft/purchase-intents`
- **Response body**: `{ ok: true, intents: [...] }`
- **Auth/role**: POS3 staff, E.A.T. manager, admin/founder.
- **Error states**: none beyond auth.
- **Local fallback**: `loadSmokePurchaseIntents()` reads local storage.
- **Frontend service**: `smokeBackendApiClient.getSmokePurchaseIntentsRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

### `GET /api/smokecraft/purchase-intents/:intentId`
- **Response body**: `{ ok: true, intent: {...} }` or `404`.
- **Auth/role**: guest (own), POS3 staff, E.A.T. manager.
- **Error states**: `404` not found.
- **Local fallback**: filter local list by `intentId`.
- **Frontend service**: not separately wired — covered by the list call.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

### `PATCH /api/smokecraft/purchase-intents/:intentId`
- **Request body**: partial `{ product?, status? }` (non-verification fields only — see verify/reject below for status transitions that require staff role).
- **Response body**: `{ ok: true, intent: {...} }`
- **Auth/role**: guest (own, pre-verification only) or admin.
- **Error states**: `404`; `403` if guest attempts to set `status` to `verified`/`rejected` directly.
- **Local fallback**: local update.
- **Frontend service**: `smokeBackendApiClient.updateSmokePurchaseIntentRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

## POS3 Verification

### `POST /api/smokecraft/purchase-intents/:intentId/verify`
- **Request body**: `{ staffId? }` (identity from auth session in a real implementation, not a trusted client field)
- **Response body**: `{ ok: true, intent: {...}, verification: {...smoke_purchase_verifications row} }`
- **Auth/role**: **POS3 staff only.** Must reject guest/anonymous callers.
- **Error states**: `404` intent not found; `403` insufficient role; `409` already verified/rejected.
- **Local fallback**: `updateSmokePurchaseVerification(intentId, { status: 'verified' })` — Phase 8/9 keep this as the only way a reward becomes eligible; never auto-verified by the client.
- **Frontend service**: `smokeBackendApiClient.verifySmokePurchaseIntentRemote`, called from POS3Home's "Mark Verified" button only.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

### `POST /api/smokecraft/purchase-intents/:intentId/reject`
- Same shape as `verify`, with `action: 'rejected'`.
- **Auth/role**: POS3 staff only.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

## E.A.T.

### `GET /api/eat/smokecraft/handoffs`
- **Response body**: `{ ok: true, handoffs: [...] }`
- **Auth/role**: E.A.T. manager, admin/founder.
- **Error states**: none beyond auth.
- **Local fallback**: `loadSmokeEATHandoffs()`.
- **Frontend service**: `smokeBackendApiClient.getSmokeEATHandoffsRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

### `PATCH /api/eat/smokecraft/handoffs/:handoffId`
- **Request body**: `{ acknowledgedByUserId? , status? }`
- **Response body**: `{ ok: true, handoff: {...} }`
- **Auth/role**: E.A.T. manager.
- **Error states**: `404`.
- **Local fallback**: local update by `handoffId`.
- **Frontend service**: `smokeBackendApiClient.updateSmokeEATHandoffRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

## Leaderboard

### `POST /api/smokecraft/leaderboard`
- **Request body**: `{ sessionId, venueId?, xp, rank, finalScore, completedSteps }`
- **Response body**: `{ ok: true, entry: {...}, visibility: 'local_only' | 'venue_shared' }`
- **Auth/role**: guest/session user (their own result).
- **Error states**: `400` missing fields.
- **Local fallback**: `saveSmokeLeaderboardEntry`.
- **Frontend service**: `smokeBackendApiClient.createSmokeLeaderboardEntryRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode. Even once implemented, entries default to `visibility: 'local_only'` until a venue explicitly opts into shared community leaderboards — the demo "Tonight's Ranking" board must stay labeled demo regardless.

### `GET /api/smokecraft/leaderboard`
- **Response body**: `{ ok: true, entries: [...] }`
- **Auth/role**: public/guest (read-only, venue-scoped).
- **Error states**: none.
- **Local fallback**: `loadSmokeLeaderboardEntries()`.
- **Frontend service**: `smokeBackendApiClient.getSmokeLeaderboardEntriesRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

## Inventory Preview

### `POST /api/smokecraft/inventory-impact-preview`
- **Request body**: `{ sessionId, product, previewedQuantity }`
- **Response body**: `{ ok: true, preview: {...}, applied: false }` — `applied` must always be `false`; this endpoint never deducts real inventory.
- **Auth/role**: guest/session user.
- **Error states**: `400` missing fields.
- **Local fallback**: existing `getSmokeInventoryImpactPreview` stays purely local/computed — no remote call wired this phase.
- **Frontend service**: none yet.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

### `GET /api/smokecraft/inventory-impact-preview/:sessionId`
- **Response body**: `{ ok: true, previews: [...] }`
- **Auth/role**: E.A.T. manager, admin.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

## Audit

### `POST /api/smokecraft/audit-events`
- **Request body**: `{ eventType, actorRole?, payload? }`
- **Response body**: `{ ok: true, event: {...smoke_audit_logs row} }`
- **Auth/role**: any authenticated actor (guest, staff, manager, admin) — written by the system on their behalf, not user-editable.
- **Error states**: `400` missing `eventType`.
- **Local fallback**: none — audit events that can't reach the backend are not currently mirrored to localStorage (audit trails should not silently exist only on a guest's own device).
- **Frontend service**: `smokeBackendApiClient.postSmokeAuditEventRemote`.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

### `GET /api/smokecraft/audit-events`
- **Response body**: `{ ok: true, events: [...] }`
- **Auth/role**: admin/founder only.
- **Status**: implemented (Phase 10) — in-memory or Postgres per server storageMode.

## Auth / Role Expectations Summary

- **Guest/session user**: can create their own `smoke_sessions` row, create purchase intents, create leaderboard entries for themselves. Cannot verify/reject purchases, cannot read other sessions' data, cannot mark an E.A.T. handoff acknowledged.
- **POS3 staff**: can verify/reject purchase intents (the *only* path that makes a reward eligible), can read the purchase-intent queue for their venue.
- **E.A.T. manager**: can read handoffs and acknowledge them; read-only on purchase intents and inventory previews.
- **Admin/founder**: full read access plus audit-event read; the only role that can read `smoke_audit_logs`.
- **Demo mode**: per the repo's existing `demoModeConfig.js` pattern, demo-mode sessions must not be allowed to write real backend records — this mirrors how `pos3Routes`/`venueTestRoutes` already gate demo traffic. **Pending** — Phase 10 routes do not yet enforce role/auth checks or demo-mode gating; any caller can hit any endpoint. This is the next gap to close before these routes are exposed beyond internal testing.

This repo's existing auth (`authConfig.js`, `authRoutes.js`, cookie-based JWT via
`novee_auth`) is the auth system these endpoints should plug into. **Pending** —
Phase 10/10B did not wire `requireAuth`/role middleware onto the SmokeCraft
routes; no new auth scheme was invented, but the existing one isn't enforced
here yet.

### Phase 10B audit — current gaps, stated plainly

- **Auth/role gating: pending.** None of `server/routes/smokecraftRoutes.js`
  or `server/routes/smokecraftEatRoutes.js` apply `requireAuth` or any role
  middleware (compare `eatRoutes.js`, which gates its manager dashboard with
  `requireAuth, canAccessEAT`). Any caller can currently hit any SmokeCraft
  endpoint, including `/verify` and `/reject`. Not implemented this phase
  because wiring it in required deciding how a guest's anonymous session
  should authenticate against `novee_auth` cookies, which is a real design
  decision, not a default-safe one to make silently.
- **POS3 staff verification: currently a manual/local prototype route.** The
  `/verify` and `/reject` endpoints accept any caller and an optional,
  client-supplied `staffId` — there is no server-side check that the caller
  is actually logged in as POS3 staff. The only thing the UI does to keep
  this honest is gate the "Mark Verified"/"Reject" buttons behind the POS3
  terminal page itself (`src/pages/pos3/POS3Home.jsx`); the API does not
  enforce this.
- **Demo-mode backend blocking: pending.** Demo sessions are not currently
  prevented from writing real backend records through these routes — the
  repo's existing `demoModeConfig.js` gating pattern (used by
  `pos3Routes`/`venueTestRoutes`) has not been applied here.
- **Founder/admin audit protection: pending.** `GET /api/smokecraft/audit-events`
  has no role check; it should be admin/founder-only per the contract above
  but currently returns to any caller.
