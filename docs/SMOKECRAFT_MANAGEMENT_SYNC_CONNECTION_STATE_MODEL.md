# SmokeCraft Management Sync — Connection State Model

## Allowed states

`CONNECTED, DISCONNECTED, NOT_CONFIGURED, CONNECTING, DEGRADED, STALE,
ERROR, INTERNAL_ONLY, UNAVAILABLE, COMING_SOON`

## Rules for CONNECTED

All of the following, verified fresh on every request (never cached
from a prior success):
1. Real configuration/destination exists (a real table, in this
   package's implementation).
2. The real health-check query succeeds (no exception thrown).
3. The request is venue-scoped where applicable (enforced upstream by
   `requireValidVenue`/`requireVenueMembership`, before the state check
   even runs).

**Never CONNECTED because**: a route file exists, a database table
exists with no query run against it, a component exists, a provider
name appears in code, demo data exists, or a UI shell exists — all
explicitly avoided in this implementation (see the Implementation doc's
audit table: 6 of 8 systems are honestly classified below CONNECTED
despite some having real code/tables for *other* purposes).

## Currently implemented states (this package)

| State | Used for |
|---|---|
| CONNECTED | `internal_management_sync`, `ticket_tapper` (both real, live-checked) |
| INTERNAL_ONLY | `passport_360` (real persistence, no write path) |
| NOT_CONFIGURED | `staff_handoff`, `inventory` (no destination exists) |
| COMING_SOON | `pos360`, `eat_360`, `novee_os` (real modules elsewhere, or confirmed non-functional, no Management Sync bridge) |

## States defined but not currently produced by any integration

`DISCONNECTED`, `CONNECTING`, `DEGRADED`, `STALE`, `ERROR`,
`UNAVAILABLE` — all are real, valid outputs of the engine's logic (e.g.
a failed health-check query returns `ERROR`/`UNAVAILABLE`, verified by
code structure — see `error-state.txt` in the proof folder for the
honest disclosure of how this was verified: by code review of the
try/catch structure, not a live-simulated outage, since deliberately
breaking the shared test database mid-suite was judged too risky to the
other regression runs in this package's time budget).

## checked_at / verified_at

`checkedAt` (ISO timestamp) is returned at the top level of every
`/integrations` response — proving the data is fresh, not cached. No
separate `verified_at` distinct from `checked_at` was implemented this
package, since every check is synchronous and immediate (no async
verification queue exists to make that distinction meaningful yet).
