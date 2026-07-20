# SmokeCraft Management Sync — Package E Handoff (Verified External Integrations & Management Handoffs)

## Real internal analytics completed (Package D)

`GET /api/smokecraft/management-sync/venues/:venueId/insights` — real,
live-tested, venue-scoped, sample-size-suppressed. This is the one
"internal" analytics destination and is fully real, not a stub.

## External connection statuses (all unchanged from prior packages, re-confirmed)

| System | Status | Evidence |
|---|---|---|
| POS360 | NOT CONNECTED (for Management Sync) | Real for its own order-bridging purpose (migration 070), no feed into Management Sync |
| E.A.T. 360 | NOT CONNECTED | `smokecraftEatSyncBridgeService.js` remains a deliberate, self-documented non-functional preview stub |
| NOVEE OS | NOT CONNECTED | Platform-wide services are real for platform ops; no SmokeCraft journey feed exists into them |
| Inventory | NOT CONNECTED | No cigar-humidor inventory table/route exists anywhere in this codebase (re-confirmed by code search this package) |
| Passport 360 | WIRED BUT DISABLED (unchanged) | Real persistence layer (migration 068) exists for a related but distinct module; not confirmed wired to Management Sync's guest identity |
| Staff handoff | NOT CONNECTED | No staff-feedback/handoff table or route exists |
| Ticket Tapper | Real and unrelated | Confirmed real, live feature (this session's earlier correction), but scoped to venue commerce/venue-select/session-complete — not a Management Sync destination |

## Required API contracts for Package E

Any real external integration Package E adds must follow the same
pattern already established: a dedicated service module under
`server/services/managementSync/`, a controller function, a route using
the existing `requireAuth`/`requireValidVenue`/`requireVenueMembership`
chain, and an honest `NOT CONNECTED`/`integration_unavailable` response
when the real destination isn't reachable — never a fabricated success.

## Authentication requirements

Reuse `requireAuth` (real users) — Package E integrations are
management-facing, not guest-facing, so the guest-JWT identity system
(Package B/C) is not the relevant identity layer here.

## Venue-scoping requirements

Every new integration must filter by `venues.venue_id` (System 1),
consistent with every table/query built across Packages A-D.

## Idempotency requirements

If Package E adds new sync-style operations, reuse the
`smokecraft_management_sync_events` table's idempotency pattern
(`UNIQUE(venue_id, journey_id, destination, payload_version)`) rather
than inventing a new mechanism — the `destination` CHECK constraint
already permits `eat_360`, `pos_360`, `novee_os`, `inventory`,
`staff_handoff` at the schema level; only the application-layer
`SUPPORTED_DESTINATIONS` allowlist in
`managementSyncValidation.js` needs to be extended once a destination is
actually verified live.

## Retry requirements

Reuse the existing `retry_count`/`error_code`/`error_message` columns on
`smokecraft_management_sync_events` — already present, unused by any
destination beyond `venue_insights` today.

## Audit requirements

Reuse `auditAction('VENUE', <action>, 'post')` — do not build a second
audit mechanism.

## Unavailable providers Package E must not fabricate

All 6 external systems in the table above, until each is independently,
individually verified live with real credentials/API access — per every
prior package's standing rule in this effort.

## Dependency on Package 6 (Venue Management Command Hub)

Inventory Management and Staff Feedback destinations are explicitly
scoped to the future Venue Management Command Hub package, per the
original mandate's Phase 13/14 language — Package D did not build
placeholder screens for either, and Package E should not either unless
that Hub package is the one actually being executed.

## Addendum — Package E delivered against this handoff

The integration registry, connection-state engine, and `/integrations`
endpoint are now real and live-tested. Every status table in this
document was re-confirmed accurate by direct code audit this package
(no drift found). See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_E_IMPLEMENTATION.md` and
`VENUE_MANAGEMENT_COMMAND_HUB_PACKAGE_6_HANDOFF.md` for what comes next.
