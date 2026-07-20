# SmokeCraft Management Sync — Package B API Report

Base path: `/api/smokecraft/management-sync`. All routes run
`optionalAuth` → `attachSmokeCraftIdentity` first.

| Method | Path | Auth | Body | Response (success) | Notes |
|---|---|---|---|---|---|
| POST | `/guest-session` | none required (issues identity) | — | `{success, identity:{type, freshlyIssued}}` | Sets `smokecraft_guest_session` cookie (HttpOnly, `AUTH_COOKIE_SECURE`/`SAMESITE`, path-scoped). Idempotent — a caller with an existing valid identity is untouched. |
| POST | `/venues/:venueId/journeys` | `requireSmokeCraftIdentity` | `{tenantId, sessionNumber, phase, sourceVersion}` | `201 {success, journey:{journeyId, venueId, sessionNumber, phase, status, startedAt, completedAt}}` | `requireValidVenue` runs first (404/403 on bad venue). Ownership fields are always server-derived. |
| GET | `/journeys/:journeyId` | `requireSmokeCraftIdentity` + `requireJourneyOwnership` | — | `200 {success, journey:{...}}` | Also serves the "resume" use case — no separate resume endpoint since resume is just re-fetching the same authoritative record. |
| POST | `/journeys/:journeyId/complete` | same | — | `200 {success, journey, alreadyCompleted}` | Idempotent — repeated calls return `alreadyCompleted:true`, no duplicate side effects. |
| POST | `/journeys/:journeyId/snapshots` | same | `{cigarSelection?, pairingSelection?, flavorNotes?, mentorSelections?, scorecard?, rating?, preferences?, feedbackText?, returnIntent?, connectionsSaved?, completionState, passportState?, staffHandoffRequested?}` | `201 {success, snapshotVersion, snapshotId, duplicate:false}` (or `200 duplicate:true` if content-identical) | Server computes `snapshotVersion` and `payloadHash`; client cannot set either. |
| GET | `/journeys/:journeyId/snapshots/latest` | same | — | `200 {success, snapshotVersion, completionState}` | Minimal projection — full snapshot content is not returned by this endpoint (not needed by any Package B consumer; Package C can extend if required). |
| POST | `/journeys/:journeyId/sync` | same | `{destination}` (only `'venue_insights'` currently accepted) | `201 {success, eventId, status, created:true}` or `200 created:false` on repeat | Idempotent via the migration-074 unique constraint; concurrent duplicate requests resolve to exactly one event. |
| GET | `/journeys/:journeyId/sync/status` | same | — | `200 {success, events:[{eventId, destination, status, payloadVersion}]}` | Read-only, never writes. |
| POST | `/venues/:venueId/actions` | `requireAuth` + `requireValidVenue` + `requireVenueMembership` | `{journeyId?, syncEventId?, actionType, metadata?}` | `201 {success, actionId}` | Authenticated users only (never guests); platform admins bypass the membership check. |
| GET | `/venues/:venueId/actions` | same | — | `200 {success, actions:[{actionId, actionType, status, createdAt}]}` | — |

## Rate limits (via `express-rate-limit`, already a repo dependency)

- `/guest-session`: 20 requests / 15 min per IP.
- All write endpoints (journeys/snapshots/complete/sync/actions POST):
  30 requests / min per IP.
- All read/status endpoints: 60 requests / min per IP.

## Response projection

Journey responses never expose `tenant_id`, `user_id`, or `guest_reference`
directly (`safeJourneyProjection` in the controller) — only
`journeyId, venueId, sessionNumber, phase, status, startedAt, completedAt`.
Snapshot/event/action list endpoints similarly project only
non-sensitive fields.

## Errors (exact strings returned in `error`)

`identity_required`, `guest_session_invalid`, `invalid_venue_identifier`,
`venue_not_found`, `venue_inactive`, `venue_unavailable`,
`venue_not_validated`, `venue_management_requires_authenticated_user`,
`venue_membership_required`, `venue_permission_denied`,
`invalid_journey_identifier`, `journey_not_found`, `journey_access_denied`,
`journey_incomplete`, `no_snapshot_to_sync`, `validation_failed` (with a
`details` array), `database_unavailable`, `internal_error`.
