# SmokeCraft Management Sync — Guest Server-Verifiable Identity Design (Part 4)

**Assignment: REQUIRES NEW INFRASTRUCTURE.** Not implemented this
package.

## Current state (verified by direct reads)

1. **Current guest identifier source**: `GuestSessionContext`
   (`localStorage` key `novee_guest_session`) — a client-generated,
   unsigned blob (`completedSteps`, `xp`, `badges`, etc.), no `id` field
   at all in the object shape used elsewhere this session.
2. **Client generated?** Yes, entirely.
3. **Signed?** No.
4. **Server verifies it?** No — nothing server-side ever reads
   `novee_guest_session`.
5. **Survives refresh?** Yes (localStorage persists across refresh on
   the same browser).
6. **Survives device restart?** Yes, same-device (localStorage
   persists), but is device/browser-bound — no cross-device continuity.
7. **Can it be forged?** Trivially — it is plain client-writable
   localStorage with no signature.
8. **Tied to a venue?** No.
9. **Tied to a journey?** No explicit journey ID exists at all (Phase 2
   of the architecture package already found "Journey ID: NOT STORED").
10. **Expires?** No.
11. **Can it be promoted into a registered user?** No mechanism found.
12. **`attachGuestContext` (authMiddleware.js) re-examined this pass**:
    confirmed it does **not** provide per-guest identity at all — it
    attaches a single, server-configured `{venueId: process.env.VENUE_ID
    || 'novee-grand-lounge', deviceId: process.env.DEVICE_ID ||
    'kiosk-001'}` object, meant for a fixed-kiosk deployment context, not
    a per-guest session. This was previously assumed to be closer to a
    real guest-identity primitive; it is not.

**Conclusion: there is no existing guest-identity infrastructure to
reuse.** This must be designed as genuinely new infrastructure, matching
the mandate's own "REQUIRES NEW INFRASTRUCTURE" category rather than
"DESIGN VERIFIED".

## Reusable infrastructure that *does* exist

- Real JWT signing/verification (`verifyJwtToken`, referenced in
  `authMiddleware.js`), already used for authenticated users, with a
  cookie transport (`authConfig.AUTH_COOKIE_NAME`, `req.cookies`) and
  bearer-token fallback.
- `optionalAuth` already has a code path for attaching a role of
  `'guest'` — currently only for the `proto-guest` prototype fallback,
  but the shape (`req.user = {id, role, mode}`) is directly extensible.

## Recommended design

**Server-issued, scoped guest JWT, delivered via the existing HTTP-only
cookie mechanism** (reuses the existing JWT + cookie infrastructure
rather than inventing a new token format).

- **Token/session creation**: on first Management-Sync-relevant action
  (e.g. `/smokecraft/enroll` or first journey-progress write), the server
  issues a JWT with `{ sub: <new UUID guest_reference>, role: 'guest',
  scope: 'smokecraft_guest', jti }`, set as an HTTP-only, `SameSite=Lax`
  cookie via the same mechanism `requireAuth`/`optionalAuth` already
  read from (`authConfig.AUTH_COOKIE_NAME` — a **second**, differently-
  named cookie, e.g. `smokecraft_guest_session`, to avoid colliding with
  real user auth).
- **Verification**: a new `attachSmokeCraftGuestIdentity` middleware
  (parallel to, not replacing, `attachGuestContext`) verifies the cookie
  JWT the same way `optionalAuth` verifies real user JWTs
  (`verifyJwtToken`), and sets `req.guestReference = payload.sub` when
  valid.
- **Expiration**: a bounded TTL (e.g. 30-90 days), renewed on each
  Management-Sync-relevant request (sliding expiration), so an active
  guest doesn't lose journey continuity mid-session, but an abandoned
  cookie eventually expires rather than being permanent.
- **Renewal**: reissue the cookie with a fresh expiry on successful
  verification (standard sliding-session pattern), no separate renewal
  endpoint needed.
- **Logout/clear behavior**: an explicit "clear my data" action (if the
  frontend ever adds one) simply clears the cookie; the server-side
  `smokecraft_management_sync_journeys` rows tied to that
  `guest_reference` are not automatically deleted (retention is a
  separate policy decision, not part of this identity design).
- **Device persistence**: cookie-based, so it persists across browser
  restarts on the same device/browser, same as real auth — but does
  **not** sync across devices (a guest on a second device gets a new
  `guest_reference`) unless/until they authenticate as a real user.
- **Venue scope**: the guest JWT itself is not venue-scoped (a guest may
  visit multiple venues over time); venue scope is applied per-journey
  (`smokecraft_management_sync_journeys.venue_id`), not per-identity.
- **Journey scope**: `guest_reference` is the stable join key across
  multiple journeys for the same guest/device.
- **Promotion to authenticated account**: when a guest later
  authenticates as a real user, a new endpoint (not built here) can
  `UPDATE smokecraft_management_sync_journeys SET user_id = $1 WHERE
  guest_reference = $2` to attach prior guest journeys to the new
  account — this requires the guest to prove they control that browser
  session (the still-valid guest cookie) at the moment of promotion, not
  a separate re-authentication of the old guest identity.
- **Revocation**: reuse the existing `isSessionRevoked(jti)` check
  already present in `optionalAuth` for real users, applied the same way
  to guest JWTs (same `jti`-based revocation table, if one exists —
  **not separately confirmed this pass**, flagged as a dependency to
  verify in Package B).
- **Audit behavior**: every Management Sync write logs `guest_reference`
  (never raw PII) in `audit_metadata`, consistent with the privacy
  classification already established in the database schema doc.

## Privacy implications

- `guest_reference` is an opaque UUID, not derived from or containing any
  PII (no email/phone/name encoded in it).
- The JWT payload itself must not carry free-text guest data (rating,
  feedback, preferences) — those live server-side, keyed by
  `guest_reference`, never embedded in the token the client holds.

## Security risks

- Cookie theft (XSS) would let an attacker impersonate a specific guest's
  journey history — mitigated by `HttpOnly` (already the pattern for the
  real-user auth cookie) and standard CSP/XSS hardening (existing
  platform concern, not newly introduced here).
- A guest clearing cookies loses continuity entirely (by design — no
  server-side "recover my guest session" flow is proposed, since that
  would require collecting PII to enable recovery, which this design
  deliberately avoids).

## Explicitly not implemented this package

No middleware file, no cookie-issuing endpoint, no `jti` revocation
table (if missing) was created. This document is a design only, per
instruction.

## Addendum — implemented in Package B

`server/middleware/smokecraftGuestIdentity.js` implements this design as
specified: server-issued JWT (`jsonwebtoken`, reusing `authConfig.JWT_SECRET`),
HttpOnly cookie (`smokecraft_guest_session`, separate from `novee_auth`),
`issuer`/`audience`/`scope` claims checked on verification. One
simplification from the original design: the `jti`-based revocation
check (`isSessionRevoked`, reused from real-user auth) was **not** wired
into guest-token verification this pass — guest tokens are currently
only checked for signature/expiry/issuer/audience, not against a
revocation table. This is a real, disclosed gap (not a silent omission):
a compromised guest cookie cannot currently be proactively revoked
before its natural 90-day expiry. See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_SECURITY_REPORT.md` "Known
limitations" for the full list.
