# SmokeCraft Management Sync — Package D Handoff (Venue Analytics & Management Action Destinations)

## Fields that now contain real journey data (as of Package C)

`journeyId, venueId, sessionNumber, phase, status, startedAt,
completedAt` (journey); `snapshotVersion, completionState` (snapshot,
minimal projection); `eventId, destination, status, payloadVersion`
(sync event). All confirmed real via live end-to-end testing this
package.

## Fields that remain unavailable (Package D scope)

Every venue-wide aggregate field from the original Management Sync Data
Map: Journey Sync Status (aggregate), Data Shared, Guest Impact Score,
Venue Benefit, Top Performing Pairing, Most Selected Cigar, Guest
Satisfaction, Repeat Visit Potential, Inventory Impact, Popular Items,
Low Stock Alerts, Staff Performance, Revenue Impact, Service Impact,
Sync Activity table (multi-journey view). None of these have any
backend today — Package A/B/C only ever handle **one journey's own**
data, never a cross-journey aggregate.

## Aggregate analytics required

Per `SMOKECRAFT_MANAGEMENT_SYNC_METRIC_DEFINITIONS.md` (already
designed in the original architecture package, unchanged, still the
governing spec): Guest Impact Score (per-journey, not aggregate), Venue
Benefit (real counts, no fabricated currency), Top Performing
Pairing/Most Selected Cigar (5-journey minimum sample size), Guest
Satisfaction (`AVG(rating)`, same threshold), Repeat Visit Potential
(estimated, labeled as such).

## Minimum sample-size requirements

5 completed journeys per venue before any "top"/"most selected"/
"satisfaction" value is returned — below that, `insufficient_data` with
the real sample size shown (never a bare "no data").

## Privacy and anonymization requirements

`smokecraft_management_sync_snapshots.feedback_text` must never be
selected into any venue-aggregate query in identifiable form — count-only
aggregation (`COUNT(*) WHERE feedback_text IS NOT NULL`), never
`SELECT feedback_text` in a venue-scoped response. This constraint is
unchanged from the original Security Model doc.

## Date-range requirements

Not yet specified — Package D must decide whether venue insights are
all-time, rolling-window (30/90 day), or explicitly date-ranged by the
venue manager. Not designed in this package; flagged as an open decision.

## Venue-scoping requirements

Every aggregate query must filter `WHERE venue_id = $1` using the same
`venues.venue_id` (System 1) established in Package A — reuse, do not
re-derive.

## Analytics endpoints required

`GET /api/smokecraft/management-sync/venues/:venueId/insights` — already
specified in `SMOKECRAFT_MANAGEMENT_SYNC_API_CONTRACT.md` Phase 5, not
yet built. Requires `requireVenueMembership` (already built, reusable
as-is from Package B).

## Inventory destination status

**NOT CONNECTED** — `ticket_tapper_inventory` is a different inventory
domain (specials/menu, not cigar-humidor). No cigar-humidor inventory
table exists anywhere in this codebase. Package D must not claim
"Inventory Impact" data without building this from scratch.

## Staff feedback destination status

**NOT CONNECTED** — no staff-feedback table exists. `action_type =
'staff_feedback_submitted'` is schema-permitted (migration 074) but has
no real persistence behind it beyond the generic `metadata JSONB` field
on `smokecraft_management_sync_actions`, which was never designed to
hold structured feedback content.

## View Analytics / Inventory Management / Staff Feedback button requirements

All three buttons on the Management Sync screen were **not touched** by
Package C (no code exists there to wire or disable — confirmed by
reading the current `ManagementSync.jsx`, which has never rendered these
as distinct buttons; only "Complete SmokeCraft Journey" and the new
"Sync This Journey to Venue" exist today). Package D, if it adds these
buttons, must route them only to real destinations or show an honest
"Available in Venue Management Command Hub" / "Not configured" state —
per the original mandate's Phase 16, never a fake page.

## External integrations that remain unconfigured

E.A.T. 360, POS360, NOVEE OS feed, inventory, staff handoff — all
confirmed NOT CONNECTED / WIRED BUT DISABLED per the Destination Audit
doc, unchanged by Packages A/B/C.

## Fields Package D must not fabricate

Every field listed under "remains unavailable" above. Package D must
follow the same `insufficient_data`/`not_collected`/
`integration_unavailable` availability-reason pattern already specified
in the Security Model doc's response contract — never a substituted
zero, never a single journey presented as a venue trend.

## Addendum — Package D delivered against this handoff

Real internal analytics (`GET /venues/:venueId/insights`) is now live,
following this handoff's guidance exactly (on-demand queries, 5-journey
sample threshold, honest suppression, no fabricated external status).
This document's original content is preserved above as the historical
handoff Package D was built against — see
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_E_HANDOFF.md` for the new forward
handoff (external integrations).
