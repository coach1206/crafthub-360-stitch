# SmokeCraft Management Sync — Package C Frontend Architecture

## API client (`src/services/smokecraft/managementSyncApiClient.js`)

One module, 10 exports (`establishGuestSession, createJourney, getJourney,
resumeJourney (=getJourney), completeJourney, createSnapshot,
getLatestSnapshot, requestManagementSync, getManagementSyncStatus,
createManagementAction, listAuthorizedActions`). Every call:
`credentials: 'include'` (so the HttpOnly guest cookie round-trips),
8-second `AbortController` timeout, normalized `{ok, status, error}`
shape on failure so no raw server error object ever reaches a component.
No JWT is ever read, parsed, or stored by this client — the cookie is
opaque to JS by design (`HttpOnly`).

## Server journey state layer (`src/hooks/useSmokeCraftServerJourney.js`)

A hook, not a new context — reads/writes through the existing
`SmokeCraftJourneyContext` via `journey.managementSync` (a new,
additive field) and the new `setManagementSyncState` setter. Tracked
fields: `serverJourneyId, venueId, sessionNumber, serverStatus,
snapshotVersion, saveState, lastSavedAt, syncStatus, syncEventId,
syncError, lastSyncedAt, venueError, ownershipError`.

Exposed operations: `ensureGuestSession, validateVenue,
startOrResumeJourney, saveSnapshot, completeOnServer, requestSync,
refreshSyncStatus`. A module-level `guestSessionPromise` makes guest-
session establishment idempotent across component remounts within the
same page load (SPA navigation, not a hard reload — a hard reload
necessarily re-runs the effect, but the *server* is idempotent for an
already-valid cookie, which is the guarantee that actually matters and
is what's tested).

## Duplicate-write prevention

Three `useRef` in-flight flags (`startInFlightRef`, `snapshotInFlightRef`,
`syncInFlightRef`) prevent a second concurrent call from this same
component instance while one is outstanding. The *real* guarantee,
though, is the database-level uniqueness (Package A's
`uq_sms_events_idempotency`, `uq_sms_snapshots_journey_version`) — the
frontend guards are a UX nicety (avoid a double-click flashing two
"Saving…" states), not the source of correctness.

## Reconciliation strategy (Phase 7)

`startOrResumeJourney` checks `managementSync.serverJourneyId` first; if
present, it calls `getJourney` to confirm it's still valid/owned. If
that fails (404/403 — deleted, or somehow not ours), the stale ID is
cleared (`ownershipError` recorded) and a fresh journey is created on
the next call — never silently retried against a known-bad ID, and
never overwrites newer server data (there is no "merge" step because
Package C only ever creates one journey per component's lifecycle; a
genuine multi-device conflict scenario is explicitly out of scope, see
Implementation doc's disclosure).

## Why Management Sync, specifically, is the wiring point

Every other journey screen (Golden Box, Pairing Lab, etc.) uses the
full-bleed `SmokeCraftImageBoundsOverlay` pattern with no reserved
normal-flow space for new UI (the same architectural constraint already
documented in the Ticket Tapper route-scope decision this session).
Management Sync already has a "not connected yet" honest-disclosure
text block in reserved space — extending that same reserved space with
a real button was the lowest-risk integration point that didn't require
touching any VISUAL PASS screen's approved composition.

## What "populate from real server responses" means here

`ManagementSync.jsx` renders `cigar.name / pairing.recommendation /
session.xp / flavors.join(', ')` from **local** state (unchanged,
already-accurate — these were never claimed as server data). The new
sync-status text block renders from `managementSync.syncStatus` /
`managementSync.snapshotVersion`, which **are** real server response
values, set only after a genuine round-trip. No field anywhere on this
screen is fabricated or hardcoded.
