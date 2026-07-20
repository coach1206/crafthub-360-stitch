# SmokeCraft Management Sync — Package C Frontend Handoff

## API base

`/api/smokecraft/management-sync` — see
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_API_REPORT.md` for the full
method/path/body/response table.

## Cookie and credential requirements

Every request must be made with `credentials: 'include'` (fetch) or
equivalent, so the `smokecraft_guest_session` cookie is sent/received.
Package C must call `POST /guest-session` once (idempotently — safe to
call on every app boot, it no-ops if a valid identity already exists)
before any journey/snapshot/sync call, for guests. Authenticated users
skip this entirely (their existing `novee_auth` cookie already resolves
an identity via `attachSmokeCraftIdentity`).

## States Package C's UI must handle

| State | Trigger | Source |
|---|---|---|
| loading | any fetch in flight | frontend-local |
| empty | `GET /journeys/:id/snapshots/latest` → 404 `snapshot_not_found` | server |
| partial | journey `status: 'in_progress'`, no snapshot yet | server |
| ready | snapshot exists, `completionState` reflects real progress | server |
| pending | `sync.status === 'pending'` | server |
| processing | not currently reachable (venue_insights completes synchronously) — reserved for a future async destination | n/a yet |
| completed | `journey.status === 'completed'` or `sync.status === 'completed'` | server |
| failed | `sync.status === 'failed'` (not currently produced by any code path in Package B — reserved) | server |
| offline | `fetch` throws / no response | frontend-local (existing `navigator.onLine` pattern already used in `VenueSelect.jsx`/`SessionComplete.jsx`) |
| stale | frontend holds a `journeyId` whose `GET` now 404s | server (404 `journey_not_found`) |
| unauthorized | any 401 (`identity_required`, `guest_session_invalid`) | server |
| venue-not-found | 404 `venue_not_found` on journey creation | server |
| guest-session-expired | 401 `guest_session_invalid` | server → re-call `POST /guest-session` to recover |

## Retry / idempotent client behavior

- `POST /journeys` — safe to retry on network failure; the schema does
  **not** currently prevent duplicate in-progress journeys for the same
  guest (documented non-constraint, see Test Report #9-12) — Package C
  should still avoid double-submitting from a UI perspective (disable
  the button while in flight), but a genuine retry-after-timeout is not
  destructive.
- `POST /snapshots` — always safe to retry with the same content; the
  server returns `duplicate:true` rather than creating a new version.
- `POST /sync` — always safe to retry with the same `destination`; the
  idempotency key guarantees at most one real event.
- `POST /complete` — always safe to retry; `alreadyCompleted:true` on repeat.

## Fields the frontend must never invent

`journeyId`, `snapshotId`, `snapshotVersion`, `payloadHash`, `eventId`,
`idempotencyKey`, `actorUserId` — all server-generated, returned in
responses, never constructed client-side.

## Fields the frontend must never trust from local state alone

`journey.status`/`completedAt` — the authoritative value is always the
server's `GET /journeys/:id` response, not `sc_journey_v1`'s local
`sessionCompletion` field, once Package C wires this up. Until Package C
ships, `ManagementSync.jsx`'s current local-only display remains
accurate to what it claims (local session data), so no regression exists
in the interim.

## How START/RESUME should reconcile with server state (design guidance, not implemented)

`ResumeJourney.jsx`/`SmokeCraft.jsx`'s existing `hasRealJourneyProgress()`
logic (local `completedSteps`) should remain the primary UX driver for
the 27-session educational spine — Management Sync's server-side journey
record is a **parallel, additive** concept (venue-sync eligibility), not
a replacement for the existing local progress system. Package C should
call `POST /journeys` once real venue selection + session-5-ish progress
exists (exact trigger point TBD), not on every screen load, to avoid
creating a journey record for guests who never intend to complete a
purchase-eligible session.

## How Management Sync should display real backend state (once wired)

Replace `ManagementSync.jsx`'s current honest "not connected yet"
disclosure fields with real values from `GET /journeys/:id` and
`GET /journeys/:id/sync/status`, preserving the same honest-unavailable
pattern for any field the API returns as `null`/absent — this was
already the design intent documented in the original architecture
package's response contract (`SMOKECRAFT_MANAGEMENT_SYNC_SECURITY_MODEL.md`
Phase 6) and remains unchanged.

## Explicitly not started

No frontend file was modified in Package B. This document is guidance
for a future Package C, not an implementation.

## Addendum — Package C delivered against this handoff

The end-to-end vertical slice (guest session → venue-aware journey
creation → snapshot → completion → explicit sync) described throughout
this handoff is now real and live-tested on `ManagementSync.jsx`. See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_C_IMPLEMENTATION.md` for exactly
what was built and what remains deferred (per-checkpoint saves on other
screens, full START/RESUME server reconciliation) —
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_D_HANDOFF.md` is the new forward
handoff.
