# SmokeCraft Management Sync — Integration Security (Package E)

## Authorization

`GET /venues/:venueId/integrations` reuses the exact
`requireAuth` + `requireValidVenue` + `requireVenueMembership` chain
already built and tested in Package B/D — no new authorization logic
was written. Live-verified this package: an unauthenticated caller is
denied, a cross-venue manager is denied (403), and a real same-venue
manager succeeds — all against real seeded `venue_memberships` rows.

## Guest access

Guests cannot reach this endpoint at all — it requires `requireAuth`,
which a guest cookie alone does not satisfy (the guest identity system
built in Package B/C is entirely separate from real-user authentication).
Confirmed by code review: no route in `managementSyncRoutes.js` combines
`requireSmokeCraftIdentity` (guest-capable) with the `/integrations`
path.

## No arbitrary destination or URL accepted

The endpoint is `GET`-only with no request body and no
destination/URL query parameter of any kind — there is structurally
nothing for a client to override. Verified live: a query-string
injection attempt (`?ticket_tapper.state=CONNECTED_FAKE`) had zero
effect on the real response.

## No secrets returned

The registry itself contains no credentials, API keys, or provider
secrets (none exist to include — confirmed by code search this
package). Verified live: the full JSON response was regex-scanned for
`secret|password|api_key|token` — zero matches.

## Venue isolation of health checks — a disclosed limitation

The `ticket_tapper` and `internal_management_sync` health checks query
their tables **without a venue_id filter** (`SELECT 1 FROM
ticket_tapper_specials LIMIT 1`) — they prove the destination/table is
reachable at all, not that a specific venue has data in it. This is an
honest limitation, not a security gap: the check's purpose is "is this
integration's infrastructure alive," not "does Venue X have Ticket
Tapper activity" (which the venue-scoped `getVenueAnalyticsSummary`
already answers, from Package D). Documented explicitly rather than
silently assumed to be venue-scoped when it isn't.

## Audit logging — not applied to this endpoint

Unlike the write endpoints (journey/snapshot/sync/actions, all
`auditAction()`-wrapped), `/integrations` is **not** audited this
package. This is a scope decision: it's a low-sensitivity read
(connection status, no guest data), and adding audit logging to every
read endpoint was judged lower priority than the endpoint's core
correctness given this package's time budget. Documented as a
disclosed gap, not silently omitted.
