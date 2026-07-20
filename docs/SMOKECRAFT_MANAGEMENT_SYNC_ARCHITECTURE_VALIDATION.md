# SmokeCraft Management Sync — Architecture Validation

Every assumption made across the architecture package, classified:
**VERIFIED** (confirmed by direct file/schema read this session) ·
**REQUIRES IMPLEMENTATION** (a real, necessary decision not yet made) ·
**BLOCKED** (cannot proceed without new information) · **REJECTED**
(an option considered and explicitly ruled out).

| # | Assumption | Classification | Detail |
|---|---|---|---|
| 1 | Backend is Express + Postgres (`pg`, raw SQL) | VERIFIED | `package.json`, `server/index.js`, `server/db/connection.js` |
| 2 | No ORM/query builder in use | VERIFIED | No Prisma/Sequelize/Knex/Drizzle dependency found |
| 3 | Migrations are flat numbered SQL files, `CREATE TABLE IF NOT EXISTS` only | VERIFIED | `server/db/migrations/*.sql` through 073 |
| 4 | How migrations are actually executed against a live DB | **BLOCKED** | No migration-runner script located this pass; must be confirmed before Package A assumes migration 074 will run |
| 5 | `requireAuth`/`optionalAuth`/`attachGuestContext` are the real, reusable auth middleware | VERIFIED | `server/middleware/authMiddleware.js` |
| 6 | `requireRole`/`requirePermission`/`auditAction` are the real, reusable authorization/audit middleware | VERIFIED | `server/middleware/roleMiddleware.js` |
| 7 | No validation library exists; manual inline validation is the convention | VERIFIED | No Joi/Zod/express-validator in `package.json`; confirmed manual pattern in `ticketTapperPromotionController.js` |
| 8 | `passport_360_*` tables (migration 068) are the closest real schema precedent | VERIFIED | Full migration file read this pass |
| 9 | `dedupe_key` unique index is the one real idempotency precedent in this codebase | VERIFIED | `idx_passport_stamp_dedupe`, migration 068 |
| 10 | `eat_management_sync_events` is structurally/semantically incompatible and not reused | VERIFIED | Confirmed in the prior Management Sync Phase 1 audit (POS/order scope) — not re-read this pass, carried forward as an existing finding |
| 11 | `smokecraftEatSyncBridgeService.js` is a deliberate, non-functional preview stub | VERIFIED | Full 115-line file read earlier this session |
| 12 | No venue-wide journey analytics backend exists anywhere | VERIFIED | Confirmed by the prior Phase 1 audit and this pass's Phase 2 field-by-field trace |
| 13 | Exact real venue table/column to use as the `venue_id` foreign-key target | **BLOCKED** | Only migration filenames (010, 049) are known, not their exact venue-identity column names — required before Package A finalizes the FK |
| 14 | Exact venue-role table/column shape for `requireRole('venue_manager')` scoping | **BLOCKED** | Same gap as #13 — the role model exists (migration 051 found earlier) but wasn't re-read column-by-column this pass |
| 15 | Guest identity has no server-verifiable form today | VERIFIED | `GuestSessionContext` is `localStorage`-only; `attachGuestContext`'s exact derivation not fully traced |
| 16 | How to give guests a server-verifiable identity for "own journey" ownership checks | **REQUIRES IMPLEMENTATION** | Opaque server-issued guest-reference token, proposed in the Security Model doc, not yet designed in detail |
| 17 | Whether a feature-flag system exists to gate the new sync-write path | **BLOCKED** | None located in Phase 1; Package B must either find one or propose a minimal one |
| 18 | Whether `passport_360_guest_progress.total_xp` is the same XP counter as SmokeCraft's `session.xp` | **BLOCKED** | Not confirmed; Phase 2 data-source audit flags this as PARTIAL, not assumed equal |
| 19 | Whether `dayone360SmokeCraftConnectionRoutes.js`/migration 072 is the same concept as SmokeCraft's in-journey "Connections" screen | **BLOCKED** | Not confirmed; flagged PARTIAL in the data-source audit |
| 20 | On-demand vs. materialized venue-insights table | **REQUIRES IMPLEMENTATION** | Explicit tradeoff documented in the schema doc; recommendation given (start on-demand) but not a verified fact |
| 21 | Proposed table names (`smokecraft_management_sync_*`) do not collide with any existing table | VERIFIED | Checked against the full migrations list through 073 — no collision |
| 22 | Proposed routes fit the existing `/api/<feature>/...` mounting convention | VERIFIED | Matches `server/index.js`'s existing `app.use('/api/...', ...)` pattern |
| 23 | No preview-only service is presented as production in this design | VERIFIED | Destination Audit doc explicitly marks every non-live destination NOT CONNECTED / WIRED BUT DISABLED, none LIVE AND VERIFIED |
| 24 | No sensitive field is stored without justification | VERIFIED | Only `feedback_text` is free-text/sensitive; justified (needed for the Guest Impact Score's "feedback given" signal) and explicitly excluded from venue-aggregate responses in identifiable form |
| 25 | No unrelated POS table is reused | VERIFIED | `eat_management_sync_events` explicitly not referenced by any new table/FK |

## Net assessment

Two hard **BLOCKED** items (#4 migration execution mechanism, #13/#14
exact venue/role table columns) must be resolved before Package A can be
implemented without guessing. One significant **REQUIRES
IMPLEMENTATION** item (#16, guest identity) is the largest open design
decision in the whole plan and should be resolved explicitly, in
writing, before or at the start of Package B — it affects the entire
guest-facing half of the API contract.

## Addendum — Blocker resolution pass (this package)

All three items above were investigated further and are now resolved to
the extent evidence allows:

| # | Item | Prior status | New status | Where resolved |
|---|---|---|---|---|
| 4 | Migration execution mechanism | BLOCKED | **VERIFIED** (runner itself) / **PARTIAL** (automatic-on-deploy not confirmed) | `SMOKECRAFT_MANAGEMENT_SYNC_MIGRATION_RUNNER_AUDIT.md` — real runner found: `server/db/runMigrations.js`, `npm run db:migrate`, `schema_migrations` tracking table, transactional. Deploy-automation (Railway) not confirmed. |
| 13 | Exact venue table/column | BLOCKED | **REQUIRES MAPPING** (table identified, runtime guarantee not yet wired) | `SMOKECRAFT_MANAGEMENT_SYNC_VENUE_MODEL_AUDIT.md` — `venues.venue_id TEXT`, confirmed as the system SmokeCraft-adjacent tables actually use; a second, incompatible venue system (`novee_os_venues`, UUID) also exists and is explicitly not used here. |
| 14 | Exact venue-role table/column | BLOCKED | **PARTIAL** | `SMOKECRAFT_MANAGEMENT_SYNC_ROLE_MODEL_AUDIT.md` — `venue_memberships`/`venue_permissions` exist as data, but no existing middleware enforces venue-scoped authorization; must be built new in Package B. |
| 16 | Guest server-verifiable identity | REQUIRES IMPLEMENTATION | **REQUIRES NEW INFRASTRUCTURE** (design complete, not built) | `SMOKECRAFT_MANAGEMENT_SYNC_GUEST_IDENTITY_DESIGN.md` — confirmed no reusable guest-identity mechanism exists (`attachGuestContext` is a fixed kiosk-context attacher, not per-guest identity); a concrete JWT+cookie design is specified, reusing existing auth infrastructure. |

No item reached a hard, unresolvable BLOCKED state after investigation.
Two genuinely new pieces of infrastructure remain to be *built* (not
merely researched) before Package B: the venue-membership authorization
check, and the guest-identity issuing endpoint/middleware. Both are now
precisely scoped rather than open questions.

## Addendum — Package A validated against a real database (this package)

Every "VERIFIED" classification above for the schema/FK/naming
assumptions was additionally confirmed against a real, running
PostgreSQL instance (not just static file review) — see
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_A_SCHEMA_REPORT.md`. No assumption
in this validation document was found incorrect once tested against a
live database; the two "REQUIRES DESIGN CHANGE" items from the
readiness doc (soft `user_id`, deferred `venue_insights`) were carried
through unchanged into the actual migration.

## Addendum — Package B validated against a real running server (later package)

Item #16 (guest server-verifiable identity) moved from "REQUIRES NEW
INFRASTRUCTURE" to **implemented and tested** — see
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_SECURITY_REPORT.md`. Item #14
(venue-scoped authorization gap) is similarly now closed by
`requireVenueMembership`/`requireVenuePermission`. Real-world testing
against a live server surfaced 4 bugs not visible from static review
alone (a Postgres `FOR UPDATE`+`MAX()` syntax error, a process-crashing
unhandled rejection, an incompatible audit-log CHECK constraint, and a
minor error-code leak) — all fixed; see
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_IMPLEMENTATION.md`.

## Addendum — Package C validated the full stack end-to-end (later package)

A real browser, driving the real frontend, calling the real API, against
the real database, confirmed the entire chain works: guest identity →
venue validation → journey creation → snapshot → completion → sync.
One additional real bug (a stale-closure bug in the chained frontend
calls) was found and fixed — see
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_C_IMPLEMENTATION.md`. This is the
first point in the whole Management Sync effort where every layer
(schema, service, API, frontend) has been proven working together, not
just independently.

## Addendum — Package D: real analytics validated against real seeded data

Rather than trust the metric formulas by code review alone, Package D
seeded 8 real completed journeys across 2 venues with known cigar/
pairing/flavor/rating values and confirmed the API's returned numbers
matched exactly (top cigar count, pairing count, flavor count, average
rating, sample-size suppression threshold). This is the first point
where the metric formulas from the original architecture package were
tested against real data rather than only reviewed as a design.

## Addendum — Package E: integration honesty validated end-to-end

The connection-state engine's core promise (never CONNECTED without a
real, live-succeeding check) was validated by testing that exactly 2 of
8 registered integrations report CONNECTED, with the other 6 correctly
reporting INTERNAL_ONLY/NOT_CONFIGURED/COMING_SOON — not by trusting
the code's intent, but by asserting the exact count and exact states in
a live HTTP test against the real server.
