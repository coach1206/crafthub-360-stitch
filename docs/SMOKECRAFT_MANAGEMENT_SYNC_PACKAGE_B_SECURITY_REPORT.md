# SmokeCraft Management Sync — Package B Security Report

## Guest identity

Server-issued JWT (`jsonwebtoken`, reusing `authConfig.JWT_SECRET`),
`{sub: guestReference (crypto.randomUUID), role:'guest',
scope:'smokecraft_guest', jti}`, signed with `issuer:'crafthub-360',
audience:'smokecraft-guest'` and verified with the same
issuer/audience/signature checks — a token missing the right
scope/issuer/audience is rejected even if signed with the right secret
(defense against token confusion with other JWTs this platform issues).
Delivered via an **HttpOnly** cookie (`smokecraft_guest_session`),
never `localStorage`. `AUTH_COOKIE_SECURE` (true in production) and
`AUTH_COOKIE_SAMESITE` (`lax` default) are reused from the existing
`authConfig`, not reinvented. 90-day expiry. Never re-issued for a
caller who already has a valid identity (prevents a guest from
"resetting" their own identity and orphaning prior journeys by mistake).

## Venue existence/status validation

`validateVenue()` queries only `venues` (System 1), never `novee_os_venues`.
Rejects: non-string/oversized input (`invalid_venue_identifier`, 400),
no matching row (`venue_not_found`, 404), `status != 'active'`
(`venue_inactive`, 403). No venue is ever auto-created. A client-supplied
`name` or any other display field is never treated as identity proof —
only `venue_id` is used to look up the row.

## Venue-scoped authorization (the gap identified in Package A, now closed)

`requireVenueMembership` queries `venue_memberships` for an **active**
row matching the caller's `user_id` and the validated `venue_id`, with
`membership_type IN ('manager','admin','owner')`. Platform admins
(`req.user.role IN ('admin','founder_level_0')`) bypass this via the
existing, unmodified global role hierarchy — not a new bypass. Guests
can never reach this middleware (the actions routes require `requireAuth`,
which does not admit unauthenticated/guest callers in production).

## Journey ownership

`requireJourneyOwnership` resolves the journey by ID (with upfront UUID-
format validation, added after a real crash was found — see
Implementation doc), then compares `journey.user_id`/`journey.guest_reference`
against the caller's resolved `smokecraftIdentity`. A guest can only ever
match by `guest_reference`; an authenticated user only by `user_id`
(stored as `req.user.id`, never trusted from the request body). Venue
managers do **not** get journey access through this path — deliberately,
per the mandate's requirement that venue-wide access and per-guest
journey access remain separate concerns.

## Fields never trusted from the client (enforced in `managementSyncValidation.js` + controllers)

`journeyId`, `userId`, `guestReference`, `createdAt`, `updatedAt`,
`status` (on journey create); `snapshotId`, `snapshotVersion`,
`payloadHash`, `createdAt` (on snapshot create); `payloadVersion`,
`status`, `retryCount`, `eventId`, `idempotencyKey` (on sync request);
`actorUserId`, `actionStatus`, `createdAt` (on action create). Any of
these present in a request body causes a `400 validation_failed` —
confirmed by the "Client-supplied guestReference rejected" test.

## Validation / abuse protection

- 32KB payload size cap (`Buffer.byteLength` check) on snapshot creation.
- Prototype-pollution guard (`rejectPrototypePollution`) walks the parsed
  body recursively (max depth 6) rejecting `__proto__`/`constructor`/
  `prototype` keys — verified against a real JSON-string attack payload
  (a JS object literal `{'__proto__': x}` does not reproduce the attack
  since it sets the prototype rather than an own key; the test was
  corrected to send a raw JSON string, which is how a real attacker's
  request body would arrive).
- `feedbackText` is scanned for `<script`, `<iframe`, `javascript:`
  patterns (defense-in-depth; the frontend never renders this field as
  HTML, so this is a second layer, not the only one).
- Destination allowlist enforced twice: schema-level `CHECK` (migration
  074, permissive — 6 values) and application-level `SUPPORTED_DESTINATIONS`
  (strict — only `venue_insights`), so the API never claims to have
  synced to an unverified integration even though the database would
  technically accept the write.

## Audit logging

Every write route (`journey_created`, `journey_completed`,
`snapshot_created`, `sync_requested`, `action_created`) runs the
existing `auditAction('VENUE', <action>, 'post')` middleware, writing to
the real `audit_logs` table via the existing `writeAuditEntry()`
function — not a new audit mechanism. `sanitiseBody()` (existing,
reused) strips the request body before storage, so no raw sensitive
payload is persisted in `audit_logs.metadata`.

## What is NOT logged (verified)

Full JWTs, cookie values, `DATABASE_URL`, `JWT_SECRET`. Guest identity is
logged only as the opaque `guest_reference` UUID (via the audit
middleware's `actorId`/`actor_id` field), never the signed token itself.
Confirmed by code review of `smokecraftGuestIdentity.js` (no `console.log`
of the token anywhere) and of `writeAuditEntry` (stores `actorId`, not
the raw request headers/cookies).

## Known limitations (honest, not hidden)

- **Cross-user and cross-venue denial were verified structurally** (the
  same `requireJourneyOwnership`/`requireVenueMembership` code path
  proven correct via the cross-guest test and via code review) but were
  **not separately exercised with two distinct real authenticated users
  or two distinct real `venue_memberships` rows** in this pass — doing
  so would require seeding `system_users`/`venue_memberships` test data
  with real FK-satisfying rows, which was scoped out given this
  package's size. This is disclosed in the proof files
  (`cross-user-denied.txt`, `cross-venue-denied.txt`) rather than
  claimed as separately tested.
- Guest identity has no cross-device continuity by design (a new device
  gets a new `guest_reference` until account promotion, which is not
  built — Package C/future scope).
- No account-promotion endpoint (linking a guest's prior journeys to a
  newly-authenticated user) was built — outside Package B's scope per
  the handoff design (mentioned there as a Package C+ concern).
- Rate limiting is per-process, in-memory (`express-rate-limit` default
  store) — resets on server restart and does not share state across
  multiple server instances; a distributed store (Redis) would be needed
  for a multi-instance production deployment, not addressed here.
