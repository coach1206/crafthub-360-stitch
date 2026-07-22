# Remediation 1 — Passport API Security Audit

## Total Passport APIs found (16 endpoints across 3 route files, plus the canonical sync API)

### `server/routes/passport360SmokeCraftRoutes.js` (base `/api/passport-360/smokecraft`) — Phase F.5

| Endpoint | Original security state | Final security state | Disposition |
|---|---|---|---|
| `GET /health` | No identity needed (harmless) | Unchanged | **Kept active** |
| `POST /guest/resolve` | No auth; accepted arbitrary `guestReference` | N/A | **Disabled (410)** |
| `POST /session/complete` | No auth; accepted arbitrary `guestId`, `completedSteps`, `xpSummary`, `stampSummary` | N/A | **Disabled (410)** |
| `POST /stamp/award` | No auth; accepted arbitrary `guestId`, `stampId`, `xpAwarded` | N/A | **Disabled (410)** |
| `POST /xp/award` | No auth; accepted arbitrary `guestId`, `xpAmount` | N/A | **Disabled (410)** |
| `POST /flavor-memory/save` | No auth; accepted arbitrary `guestId` | N/A | **Disabled (410)**; legitimate caller (`FlavorMemory.jsx`) moved to `POST /api/passport-360/sync/flavor-memory` |
| `GET /guest/:guestId/progress` | No auth; any `:guestId` readable by anyone | N/A | **Disabled (410)** |
| `GET /guest/:guestId/stamps` | No auth; any `:guestId` readable by anyone | N/A | **Disabled (410)**; legitimate caller (`passportService.js`'s `getEarnedStampsWithBackend`) moved to `GET /api/passport-360/sync/stamps` |
| `GET /guest/:guestId/badges` | No auth | N/A | **Disabled (410)** |
| `GET /guest/:guestId/return-visits` | No auth | N/A | **Disabled (410)**; caller (`VisitLockGuard.jsx` via `getReturnVisitProgressWithBackend`) already wraps the call in `.catch()` — now silently no-ops, honestly falls back to local count |
| `GET /guest/:guestId/audit-log` | No auth | N/A | **Disabled (410)** |
| `POST /audit/event` | No auth; arbitrary `guestId`/`eventType` | N/A | **Disabled (410)**; caller (`writeSyncAuditEvent` in `passportService.js`) is fire-and-forget and already swallows errors — now silently no-ops |

**Why disabled rather than patched:** these endpoints' entire design was "the client decides what stamp/XP/session data to write." There is no way to make "award any XP amount the client requests" secure without changing what the endpoint does — at that point it is the canonical sync API, not a patched version of this one. Disabling and redirecting real callers to the evidence-driven canonical API was the correct fix, not a compatibility shim.

### `server/routes/smokecraftPassportStampRoutes.js` (base `/api/smokecraft/passport-stamp`) — previously in-memory

| Endpoint | Original security state | Final security state | Disposition |
|---|---|---|---|
| `GET /eligibility` | No auth; accepted arbitrary `completedSteps`/`scorecardId` for eligibility math only (no write) | **Secured** — now requires `requireSmokeCraftIdentity`; `alreadyClaimed` now checked against the real database, not an in-memory Map keyed by an arbitrary client `sessionId` | **Kept active, secured** |
| `GET /status/:sessionId` | No auth; in-memory Map, never persisted (lost on every restart) | **Secured** — identity-gated; looks up the caller's own real database stamp, ignores the `:sessionId` path param entirely (kept only for URL-shape compatibility) | **Kept active, secured** |
| `POST /claim` | No auth; trusted client `guestId`, `xpEarned`, `totalXP`, `finalScore`, `stampCount` verbatim; in-memory only | **Secured** — identity-gated; `guestId` always derived server-side; persists via the real, idempotent `passport_360_earned_stamps` table (real `dedupe_key`); no XP is awarded (zero-XP-until-approved, consistent with the rest of this operation); `xpEarned`/`totalXP`/`finalScore`/etc. are no longer read or stored at all | **Kept active, secured** |
| `GET /guest/:guestId` | No auth; any `:guestId` readable by anyone | **Replaced** with `GET /guest/me`, which always resolves the caller's own stamps — the old arbitrary-`:guestId` route no longer exists | **Replaced (functionally disabled, no arbitrary-ID variant remains)** |

**Disclosed, unchanged limitation:** the eligibility signal (`completedSteps`) is still client-reported, not independently server-verified against real per-session completion evidence — a pre-existing limitation of the broader 27-session client-tracked journey architecture. This remediation closes the identity/persistence defect (arbitrary `guestId`, in-memory non-persistence, arbitrary XP/score trust) — it does not invent a fake fix for the separate, out-of-scope eligibility-verification gap, which would require redesigning the whole 27-session completion architecture ("avoid broad refactors," "no general NOVEE OS redesign").

### `server/routes/passport360SyncRoutes.js` (base `/api/passport-360/sync`) — canonical, secure, unchanged from the prior pass except 3 additions

| Endpoint | Security state |
|---|---|
| `GET /profile`, `GET /stamps`, `GET /connections`, `GET /activity`, `GET /directory` | Unchanged — already identity-gated, evidence-driven (prior pass) |
| `POST /synchronize` | Unchanged — already identity-gated, evidence-driven, forged-claim-rejecting (prior pass) |
| `POST /flavor-memory` (new this remediation) | Identity-gated; `guestId` always server-derived; no client field can override it |
| `POST /journey-stamp/claim` (new this remediation) | Identity-gated; internal helper used by the now-secured `/api/smokecraft/passport-stamp/claim` route |
| `POST /link-guest` (new this remediation) | Requires BOTH an authenticated user identity AND a real guest-session cookie present on the same request — see `04-GUEST-USER-LINKING.md` |

## Frontend callers moved to the secure canonical API

- `src/pages/smokecraft/FlavorMemory.jsx` — now calls `POST /api/passport-360/sync/flavor-memory` (was: disabled `/api/passport-360/smokecraft/flavor-memory/save`).
- `src/services/passportService.js`'s `getEarnedStampsWithBackend()` — now calls `GET /api/passport-360/sync/stamps` directly (was: disabled `/api/passport-360/smokecraft/guest/:guestId/stamps`, keyed by a locally-generated fake ID).
- `src/pages/smokecraft/PassportStamp.jsx` — unchanged frontend code (no edit needed); its existing calls to `/api/smokecraft/passport-stamp/status/:sessionId` and `/claim` now hit the secured, identity-gated, DB-persisted versions of those exact same routes.

## Verified no active route calls a disabled endpoint

Confirmed via `verify-passport-security-unified-identity.mjs`: every one of the 11 disabled Phase F.5 endpoints returns `410`, and the dedicated suite exercises the real frontend call sites (`FlavorMemory.jsx`'s save path, `passportService.js`'s stamps-read path, `PassportStamp.jsx`'s claim path) to confirm they now succeed through the secured/canonical routes instead.
