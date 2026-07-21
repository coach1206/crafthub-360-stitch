# Phase 2 — Identity Mapping

## Stable Passport ID

`passport_360_guest_profiles.guest_id` (a `UUID PRIMARY KEY DEFAULT gen_random_uuid()`) is the stable Passport ID, resolved via `createOrResolveGuestProfile({ guestReference: req.smokecraftIdentity.id, ... })`. Real uniqueness is enforced by `UNIQUE(tenant_id, venue_id, guest_reference)` — a repeated resolve call for the same verified identity always returns the same row (`SELECT` first, `INSERT` only if not found), never creates a duplicate.

**Verified directly this pass:** two consecutive `GET /profile` calls for the same learner return the identical `passportId`; the database contains exactly one `passport_360_guest_profiles` row for that `guest_reference`.

## Guest identity mapping

`req.smokecraftIdentity.id` (the JWT `sub` claim, issued by the existing `smokecraft_guest_session` cookie flow, unchanged by this pass) is the sole source of `guest_reference` passed into `resolveGuest()`. It is never read from a request body or query parameter — confirmed by source inspection of `passport360SyncController.js` (`guestRef(req)` reads only `req.goldenBoxGuestReference`, itself set only by the `bridgeIdentity` middleware from the verified `req.smokecraftIdentity`).

## Authenticated-user identity mapping

The existing `attachSmokeCraftIdentity` middleware supports both `type: 'guest'` and `type: 'user'` identities (the same `bridgeIdentity` pattern used by Skill Tree/Collections/Challenge Hub/Blend Fault treats both identically). No dedicated authenticated-user SmokeCraft learner flow exists in this environment to exercise end-to-end in this session — **honestly not claimed as separately verified**, though the code path is structurally identical to the already-verified guest path.

## Guest-to-user upgrade

**No guest-to-user upgrade workflow exists anywhere in the current architecture** — confirmed by searching the codebase for any endpoint that transfers `guest_reference`-scoped data to a `user_id`-scoped identity; none exists for SmokeCraft, Skill Tree, Collections, Challenge Hub, Blend Fault, or Passport. This is a real, pre-existing limitation, not something this pass was asked to build (the mandate explicitly says: "If full guest-to-user upgrade is outside the existing architecture: Do not invent a fake workflow... Return an honest unsupported state").

**Schema compatibility is preserved**: `passport_360_guest_profiles` has no foreign key or structural assumption that would block a future upgrade path being added later (`guest_reference` is a plain `TEXT` column, not tied to any guest-only constraint).

## Tenant and venue scoping

`passport_360_guest_profiles` (and every migration-068 table) already carries `tenant_id`/`venue_id` columns with real defaults (`novee-default`/`novee-grand-lounge`). This pass's sync service uses those same real defaults consistently — no new tenant/venue concept was introduced, and no cross-tenant leakage is possible since every read/write is scoped by the `(tenant_id, venue_id, guest_reference)` unique key.
