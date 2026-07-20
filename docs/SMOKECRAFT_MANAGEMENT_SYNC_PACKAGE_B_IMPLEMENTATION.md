# SmokeCraft Management Sync — Package B Implementation

## Phase 1 — handoff reconciliation (before writing code)

Read all 8 handoff/design documents plus migration 074 and existing
middleware/services. No material conflict was found — the handoff's
table/column names matched migration 074 exactly.

1. **Package A tables/columns**: as documented in the handoff, confirmed
   against the live migration file.
2. **JWT library/config**: `jsonwebtoken` via `server/services/authService.js`
   (`createJwtForUser`/`verifyJwtToken`) and `server/config/authConfig.js`
   (`JWT_SECRET`, cookie settings). Reused directly — no new JWT library
   introduced.
3. **Cookie conventions**: `authConfig.AUTH_COOKIE_NAME` (`novee_auth`),
   `AUTH_COOKIE_SECURE`/`AUTH_COOKIE_SAMESITE`/`AUTH_COOKIE_PATH`. The
   guest cookie (`smokecraft_guest_session`) reuses the same
   `AUTH_COOKIE_SECURE`/`AUTH_COOKIE_SAMESITE` values but is a
   **separate** cookie name/path so it is never confused with real-user
   auth.
4. **User authentication**: `requireAuth`/`optionalAuth`
   (`server/middleware/authMiddleware.js`) — reused unmodified.
5. **Guest-context behavior**: `attachGuestContext` was re-confirmed
   (per the Guest Identity Design doc) to be a fixed kiosk-context
   attacher, not per-guest identity — **not reused** for identity;
   confirmed correctly not to be a viable substitute.
6. **Audit-log mechanism**: `auditAction(category, action, timing)`
   (`server/middleware/roleMiddleware.js`), writing to the real
   `audit_logs` table. Reused directly on every write route.
7. **Role/permission middleware**: `requireRole`/`requirePermission`
   confirmed (again) to have no venue scope — used only as a coarse gate
   (platform-admin bypass), with the new `requireVenueMembership`/
   `requireVenuePermission` doing the actual venue-scoped check.
8. **`venue_memberships` structure**: `user_id, venue_id, membership_type
   CHECK(member/staff/mentor/manager/admin/owner), status
   CHECK(active/inactive/pending/suspended)` — matches the Venue Model
   Audit doc exactly.
9. **`venue_permissions` structure**: `venue_id, role, permission_key,
   enabled` — matches.
10. **Active/inactive venue status field**: `venues.status`, confirmed
    `CHECK (status IN ('active','inactive','pending','suspended'))`.
11. **Error-response conventions**: the `wrap()` envelope pattern
    (`{success, data, backendConnected, persistenceMode}`) from
    `ticketTapperPromotionController.js` was reviewed; Package B uses a
    simpler `{success, error}` shape for its own endpoints since none of
    them have a "local preview fallback" concept the way Ticket Tapper
    does — this is a deliberate, documented divergence, not an oversight.
12. **Validation library**: confirmed none exists; manual validation
    written in `managementSyncValidation.js`, matching the existing
    inline-validation convention.
13. **Files proposed**: see "Files created" below — matches what was
    planned, no additions beyond scope.

No `PACKAGE B BLOCKED` condition was triggered — proceeded to implementation.

## What was built

### Middleware
- `server/middleware/smokecraftGuestIdentity.js` — `attachSmokeCraftIdentity`,
  `ensureSmokeCraftGuestIdentity`, `requireSmokeCraftIdentity`.

### Services
- `server/services/managementSync/venueValidationService.js` —
  `validateVenue`, `requireValidVenue`.
- `server/services/managementSync/venueAuthorizationService.js` —
  `getActiveVenueMembership`, `requireVenueMembership`,
  `requireVenuePermission`, `requireJourneyOwnership`.
- `server/services/managementSync/managementSyncValidation.js` — request
  validation for all 4 write endpoints.
- `server/services/managementSync/journeyService.js` — `getJourneyById`,
  `createJourney`, `completeJourney`.
- `server/services/managementSync/snapshotService.js` — `createSnapshot`,
  `getLatestSnapshot`.
- `server/services/managementSync/syncService.js` — `requestManagementSync`,
  `getSyncStatus`.
- `server/services/managementSync/actionService.js` — `createManagementAction`,
  `listManagementActions`.

### Controller
- `server/controllers/managementSyncController.js`.

### Routes
- `server/routes/managementSyncRoutes.js`, mounted in `server/index.js`
  at `/api/smokecraft/management-sync` (the one shared-entry-file
  change, as permitted by instruction).

### Not built (explicitly out of scope, confirmed)
No frontend wiring, no venue analytics aggregation, no Command Hub, no
POS360/E.A.T./NOVEE OS/inventory/payment integration, no asset moves, no
fix for the CraftHub reference-file anomaly, no screen redesign.

## Real bugs found and fixed during implementation (disclosed, not hidden)

1. **Postgres `FOR UPDATE` + `MAX()` is invalid SQL** (`0A000: SELECT
   FOR UPDATE is not allowed with aggregate functions`). The snapshot
   service's version-locking query originally tried to lock the
   aggregate query itself. Fixed by locking the parent journey row
   (`SELECT ... FROM smokecraft_management_sync_journeys ... FOR
   UPDATE`) instead, then computing `MAX(snapshot_version)` unlocked —
   correct and still race-safe since the journey-row lock serializes
   concurrent snapshot writes for that journey.
2. **Unhandled promise rejection crashed the entire Node process.**
   `requireJourneyOwnership` originally had no try/catch; a malformed or
   missing `journeyId` param reaching `getJourneyById()` with an invalid
   UUID threw a Postgres error that was never caught, taking down the
   whole server (not just the request) — reproduced live during testing.
   Fixed by wrapping the middleware body in try/catch (returning 500 on
   unexpected errors) and adding upfront UUID-format validation on
   `journeyId` so malformed IDs never reach the database at all. The
   same defensive try/catch was added to `requireValidVenue`,
   `requireVenueMembership`, and `requireVenuePermission` as a
   consistency fix once the pattern was identified as risky.
3. **`audit_logs.action_category` CHECK constraint** only allows a fixed
   set of uppercase values (`AUTH, ROLE, ADMIN, POS, EAT, INVENTORY,
   TICKER, PAYMENT, DEVELOPER, FOUNDER, MENTOR, PASSPORT_CONNECTION,
   VENUE, SYSTEM_SETTINGS, FEATURE_FLAGS`) — `'management_sync'` was not
   in that list and every audit write silently failed (caught internally
   by `writeAuditEntry`'s own try/catch, so it didn't crash requests, but
   it meant **zero audit rows were ever written** until fixed). Corrected
   to use the existing `'VENUE'` category, which is the closest accurate
   fit, with a distinct `action` value per operation
   (`journey_created`, `journey_completed`, `snapshot_created`,
   `sync_requested`, `action_created`).
4. **Raw Postgres error codes were being returned to API clients**
   (e.g. `{"error": "0A000"}` before bug #1 was fixed) — a minor
   information-leak. Corrected so only the deliberate `database_unavailable`
   code passes through; every other exception maps to a generic
   `internal_error`.

All four were found via real testing (HTTP requests against a live,
isolated server + database), not by inspection alone.
