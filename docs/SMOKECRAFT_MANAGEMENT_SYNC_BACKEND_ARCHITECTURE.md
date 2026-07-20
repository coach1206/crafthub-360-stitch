# SmokeCraft Management Sync — Backend Platform Audit (Phase 1)

Documentation-only package. No source, migration, or route files were
created or modified to produce this audit.

## 1. Backend framework
Express 4.18.2 (`server/index.js`), Node ESM (`"type": "module"`).

## 2. Server entry files
`server/index.js` — mounts all route modules; `server/db/connection.js` —
DB pool bootstrap.

## 3. Database technology
PostgreSQL via `pg` 8.11.3 (`server/db/connection.js`). Confirmed by
`package.json` and every migration file's SQL dialect (`gen_random_uuid()`,
`TIMESTAMPTZ`, `CHECK` constraints).

## 4. Database connection layer
`server/db/connection.js`: single `pg.Pool`, lazily initialized at module
load via top-level `await initPool()`. Exports `getDb()`, `isDbAvailable()`,
`query(sql, params)`. **Graceful prototype-mode fallback**: if
`DATABASE_URL` is unset or the connection fails, `pool` stays `null` and
`query()` throws — callers must guard with `isDbAvailable()` first. This
is the same fallback pattern already relied on by Ticket Tapper's API
service (`backendAvailable: false` responses).

## 5. Migration system
Flat, numbered SQL files in `server/db/migrations/` (currently through
`073_novee_entry_demo_sessions.sql`). No migration framework/CLI found
(no `node-pg-migrate`, `knex migrate`, `umzug`, etc. in `package.json`).
Every migration uses `CREATE TABLE IF NOT EXISTS` — idempotent,
re-runnable, no `DROP`. How migrations are actually executed against a
live database (a runner script, manual `psql`, or app-boot execution)
was **not found** in this audit — no `migrate.js`/`runMigrations` script
located. **REQUIRES IMPLEMENTATION-TIME CONFIRMATION**: the next package
must confirm the execution mechanism before assuming migration 074+ will
run automatically.

## 6. ORM / query builder / raw SQL pattern
**Raw parameterized SQL only.** No ORM or query builder (no Prisma,
Sequelize, Knex, Drizzle in `package.json`). Services call
`query(sql, params)` directly against the `pg.Pool`. Precedent: services in
`server/services/ticketTapper/ticketTapperPromotionService.js`.

## 7. API route conventions
Express `Router()` per feature, mounted in `server/index.js` under a
namespaced path (e.g. `app.use('/api/ticket-tapper/promotions',
ticketTapperPromotionRoutes)`, `app.use('/api/smokecraft/ticket-tapper',
smokecraftTicketTapperSpecialsRoutes)`). Route files import a controller
module and wire `router.get/post/patch(path, [middleware...], handler)`.

## 8. Controller conventions
Thin controllers in `server/controllers/*.js` that call into a service
module and format a response via a shared `wrap()` helper. Example,
`ticketTapperPromotionController.js`:
```js
function wrap(res, data) {
  return res.json({
    success: data?.ok !== false,
    data,
    backendConnected: data?.backendConnected ?? false,
    persistenceMode: data?.persistenceMode || 'local_fallback',
    safeClaim: SAFE_CLAIM,
    timestamp: new Date().toISOString(),
  })
}
```
This `backendConnected`/`persistenceMode`/`safeClaim` envelope is the
established "honesty contract" pattern this platform already uses to
avoid claiming a feature is live when it isn't — Management Sync's API
contract (Phase 6 of this package) should follow the same shape.

## 9. Service-layer conventions
One service module per feature under `server/services/<feature>/`, doing
all DB access and business logic; controllers never touch `query()`
directly. Example: `server/services/ticketTapper/ticketTapperPromotionService.js`.

## 10. Validation library
**None found.** No Joi, Zod, express-validator, or Yup in `package.json`.
Existing controllers do manual inline checks (e.g. reading
`req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id`).
Management Sync's implementation package will need to either adopt this
manual-validation convention or introduce a library — **this is a real
open decision**, not resolved by this audit.

## 11. Authentication middleware
`server/middleware/authMiddleware.js` exports `requireAuth`,
`optionalAuth`, `attachGuestContext`. `requireAuth` verifies a JWT and
sets `req.user`; in non-production (`!IS_PROD`) with no valid session it
falls back to `req.user = { id: 'proto-guest', role: 'guest', mode:
'prototype' }` — a **prototype-mode identity fallback**, not a real
authenticated user. This matters for Management Sync's guest-vs-staff
distinction (Phase 7).

## 12. Authorization middleware
`server/middleware/roleMiddleware.js` exports `requireRole(minRoleName)`,
`requirePermission(permissionKey)`, `requireFounderLevel0`,
`requireMentor`, `requireDeveloper`, `requirePassportMember`,
`preventSelfPromotion`, `preventOwnershipTransfer`, and
`auditAction(category, action, timing)`. `auditAction` is a real,
reusable audit-logging middleware — candidate for Management Sync's
Phase 10 (audit logging) rather than building a new one.

## 13. Current user identity source
`req.user.id` set by `requireAuth`/`optionalAuth` from a verified JWT, or
the `proto-guest` prototype fallback in non-production.

## 14. Current guest identity source
No authenticated identity — SmokeCraft guests are **not** logged in.
Client-side, guest identity is whatever `GuestSessionContext` holds in
`localStorage` (`novee_guest_session`), which has no server-verifiable
identity at all today. `attachGuestContext` (authMiddleware.js) exists
but its exact guest-identity derivation was not traced further in this
pass — **REQUIRES IMPLEMENTATION-TIME CONFIRMATION**.

## 15. Current venue identity source
Client-side: `journey.selectedVenue.id` (`SmokeCraftJourneyContext`,
confirmed real this session in the Ticket Tapper package). Server-side:
migration `068_passport_360_smokecraft_live_persistence.sql` uses a
`venue_id TEXT NOT NULL DEFAULT 'novee-grand-lounge'` pattern — a
**default fallback venue**, same category of defect already fixed in
Ticket Tapper's frontend this session. Management Sync's schema must not
repeat this default-venue pattern (Phase 4 requires it be a real,
non-defaulted foreign-key-style reference).

## 16. Current venue-role model
`server/db/migrations/010_new_roles_and_tables.sql` and
`049_novee_os_tenant_venue_workspace_governance.sql` define venue/role
tables (found in the earlier Ticket Tapper-adjacent audit this session,
not re-read line-by-line here — **REQUIRES IMPLEMENTATION-TIME
CONFIRMATION** of exact column names before Phase 4 finalizes foreign
keys).

## 17. Current journey/session persistence
**None found for SmokeCraft's 27-session educational journey.** Confirmed
in the earlier Management Sync Phase 1 pass this session: no table
matching `smokecraft*journey*complet*`/`session*persist*` exists. Journey
state lives only in `localStorage` (`sc_journey_v1`,
`SmokeCraftJourneyContext`) and `novee_guest_session`
(`GuestSessionContext`) — both client-only, unauthenticated,
single-device. This is the central gap Phase 3 (canonical model) exists
to fill.

## 18. Current SmokeCraft submission APIs
None found that persist a completed journey server-side. Existing
SmokeCraft-adjacent server routes (`passport360SmokeCraftRoutes.js`,
`eatSmokeCraftLiveSyncRoutes.js`, `pos360SmokeCraftOrderBridgeRoutes.js`,
`smokecraftTicketTapperSpecialsRoutes.js`,
`dayone360SmokeCraftConnectionRoutes.js`) each cover a narrower, different
concern (passport stamps/XP, POS/EAT order bridging, ticket tapper
specials, DayOne360 connections) — none stores a full journey summary.

## 19. Current scorecard persistence
Not found server-side. `Scorecard.jsx` reads/writes only
`SmokeCraftJourneyContext` (localStorage).

## 20. Current passport persistence
**Real and relevant precedent**: migration 068
(`passport_360_smokecraft_live_persistence.sql`) — `passport_360_guest_profiles`,
`passport_360_guest_progress`, `passport_360_earned_stamps` (with a
`dedupe_key` unique index — a real idempotency precedent, see Phase 8),
`passport_360_badges`. This is the closest existing real analogue to what
Management Sync's Journey Record/Snapshot tables need, and its schema
conventions (UUID PK via `gen_random_uuid()`, `tenant_id`/`venue_id`
columns, `CHECK` constraints, `CREATE UNIQUE INDEX ... dedupe_key`) are
reused as the baseline pattern in Phase 3/4 below.

## 21. Current reward/XP persistence
Client-side only (`GuestSessionContext` `session.xp`,
`awardSessionRewards`), except for `passport_360_guest_progress.total_xp`
(migration 068) which tracks Passport-module XP specifically — not
confirmed as the same XP counter SmokeCraft's `session.xp` reads from.

## 22. Current staff-handoff infrastructure
Not located in this audit. No `staff_handoff` or similar table found in
the migrations reviewed. Treated as **NOT STORED** for Phase 2.

## 23. Current audit-log infrastructure
`server/routes/auditRoutes.js` + `server/controllers/auditController.js`
+ `canViewAuditLogs` (roleMiddleware.js) — a real, existing audit-log
read path (`GET /session/:sessionId`). `auditAction()` middleware
(roleMiddleware.js) is the real write-side counterpart. Also,
`ticket_tapper_management_audit_log` (migration 071) is a concrete
per-feature audit table precedent.

## 24. Current idempotency patterns
`passport_360_earned_stamps.dedupe_key` with a `CREATE UNIQUE INDEX` is
the one confirmed real idempotency pattern in this codebase — a
dedupe/idempotency key stored as a plain `TEXT` column with a unique
index, not a generic idempotency-key framework. Management Sync's Phase 8
design reuses this exact pattern rather than inventing a new mechanism.

## 25. Current offline-sync patterns
None found server-side. Client-side, several SmokeCraft screens
(`VenueSelect.jsx`, `SessionComplete.jsx`) track `navigator.onLine` for
UI messaging only — no queued-write/offline-sync mechanism exists to
reuse.

## 26. Existing venue analytics infrastructure
None found (reconfirms the Management Sync Phase 1 audit from the prior
package: no venue-wide aggregation service or table exists).

## 27. Existing E.A.T. 360 services
`server/routes/eatRoutes.js`, `eatSmokeCraftLiveSyncRoutes.js`,
`server/services/smokecraft/smokecraftEatSyncBridgeService.js`. The
latter is confirmed, by full prior read, **deliberately non-functional**
(`connected: false` hardcoded, in-memory `_syncEventLog`, no persistence).

## 28. Existing POS360 services
`server/routes/pos360SmokeCraftOrderBridgeRoutes.js`,
migration `070_pos360_smokecraft_live_order_bridge.sql`. Order-bridging
scope, not journey/analytics scope — not reusable for Management Sync's
data model without new tables.

## 29. Existing NOVEE OS services
Broad platform services exist (tenant/venue governance, security roles —
migrations 049, 051, 061, etc.) but none specific to SmokeCraft journey
analytics.

## 30. Existing inventory services
`ticket_tapper_inventory` (migration 017) — specials/menu inventory only,
not cigar-humidor or venue-stock inventory in the Management Sync sense.

## 31. Existing staff-feedback services
Not found.

## 32. Existing security gaps relevant to Management Sync
- Ticket Tapper's API service (`fetch()` calls, no auth headers) shows the
  platform currently ships unauthenticated guest-facing endpoints for
  some features — Management Sync's guest-read endpoints must not follow
  that precedent for anything beyond the guest's own journey.
- The `venue_id ... DEFAULT 'novee-grand-lounge'` pattern in migration
  068 is a real default-venue anti-pattern present elsewhere in this
  codebase; Management Sync's schema must avoid it (no `DEFAULT` on
  `venue_id`).
- `requireAuth`'s prototype-mode fallback (`proto-guest`) means
  "authenticated" in dev/non-prod is not a strong guarantee — any access
  control decisions in Phase 7 must be documented against both prod and
  prototype-mode behavior.
