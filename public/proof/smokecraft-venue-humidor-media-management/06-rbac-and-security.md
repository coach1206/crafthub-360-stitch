# RBAC, Venue Isolation, Security

## RBAC matrix (reused tiers — `membership_type` from `venue_memberships`, migration 010)

| Action | member | mentor | staff | manager/admin/owner | platform admin/founder |
|---|---|---|---|---|---|
| Upload image (product or venue) | ❌ | ❌ | ✅ | ✅ | ✅ (bypass) |
| Edit metadata / reorder gallery / assign to product | ❌ | ❌ | ✅ | ✅ | ✅ |
| Set primary / retire | ❌ | ❌ | ✅ | ✅ | ✅ |
| Approve / reject / activate | ❌ | ❌ | ❌ | ✅ | ✅ |
| CSV import (live) | ❌ | ❌ | ❌ | ✅ | ✅ |
| CSV dry-run | ❌ | ❌ | ✅ | ✅ | ✅ |
| View venue media library / missing-image report | ❌ | ✅ (read-only) | ✅ | ✅ | ✅ |
| Public approved-media read | n/a — no auth required, approved+active only | | | | |

Enforced by the same `requireVenueStaff` / `requireVenueRole(FULL_ACCESS_TYPES |
WRITE_ACCESS_TYPES | READ_ACCESS_TYPES)` middleware chain every other
Venue Humidor admin route already uses — no parallel RBAC system
introduced. Staff cannot self-approve their own uploads (approve/
reject/activate require `FULL_ACCESS_TYPES`, verified live —
`03-api-test-results.txt` §4 "Staff (write-tier, not full-access)
cannot approve their own upload (403)").

## Venue isolation — proven live

- A user with no membership for a venue is denied every media route
  (403) — `03-api-test-results.txt` §1.
- A staff member of venue A cannot upload to venue B, even with a
  correct product ID for venue B, because `requireVenueRole` checks
  the caller's own membership for the URL's `:venueId` before any
  handler runs — `03-api-test-results.txt` §1.
- Resource-level isolation: assigning an asset to a product ID that
  does not belong to the calling venue is rejected (422) —
  `assertProductBelongsToVenue()` re-checks venue ownership of the
  *target resource*, not just the caller's own membership —
  `03-api-test-results.txt` §3.
- CSV import rows are venue-isolated per-row: a row whose `venue_id`
  column does not match the authenticated venue is flagged
  `venue_isolation_violation` and rejected without corrupting any
  other row — `03-api-test-results.txt` §9.

## Security controls

| Control | Implementation |
|---|---|
| No provider secret in client bundle | Storage adapter runs server-side only; no credentials are ever sent to the client. Local-disk dev fallback has no credential to leak. |
| Server-authoritative identity + RBAC | Every mutation handler reads `req.user.id`/`req.venueMembershipType` set by middleware — never a client-supplied actor ID. |
| File-signature validation (not extension) | `imageValidation.js#sniffMimeFromBuffer()` reads real magic bytes (PNG/JPEG/WEBP signatures); an `.html`/script file renamed to `.png` is rejected (`415`) — proven live, `03-api-test-results.txt` §2. |
| Filename never trusted as identity | `storageAdapter.js#upload()` writes to a server-generated `crypto.randomUUID()` object name; `original_filename` is stored only as display metadata after `normalizeFilename()` strips path/traversal characters. |
| Size limits | 5MB per-file validator limit, plus the app-wide 1MB Express JSON body-parser limit is hit first for genuinely oversized payloads in this pass's base64-in-JSON transport (`413`) — proven live. |
| Duplicate detection | SHA-256 checksum, unique per `(venue_id, checksum)` at both app and DB level. |
| Malicious-filename sanitization | `normalizeFilename()` strips any path segment and non-alphanumeric characters. |
| SSRF prevention on URL import | `IMPORT_DOMAIN_ALLOWLIST` — manufacturer/distributor URL import only ever fetches HTTPS URLs whose hostname is on a fixed allowlist; `redirect: 'error'` on the fetch call refuses to silently follow a redirect off-allowlist. Disallowed-domain import proven rejected (422) live — `03-api-test-results.txt` §8. |
| Private fields never public | `getPublicProductMedia()` strips `sourceUrl`/`rightsReference`/`rejectionReason`/`retirementReason`/`reviewDate`/`notes`/`approvedBy`/`createdBy`/`checksum` before returning to the public customer route — proven live (`03-api-test-results.txt` §11, "Public media response never exposes private rights/notes fields"). |
| Safe error messages | Controller error mapping (`sendError()`) returns a fixed error-code vocabulary, never a raw stack trace or DB error string. |
| Rate limiting | Reuses the existing `readLimiter`/`writeLimiter` (`express-rate-limit`, prod-only) already applied to every other Venue Humidor route. |
| Audit logging | Every mutation writes a `venue_cigar_media_events` row with actor/venue/asset/product/action/timestamp/before-after-summary/correlation-id — append-only, never updated. |

## Known limitation

The 1MB Express JSON body-parser limit (app-wide, pre-existing, not
introduced by this pass) is smaller than the 5MB image-validator
limit, meaning JSON-base64-encoded uploads over ~750KB raw file size
are actually rejected by the body parser (`413 entity.too.large`)
before ever reaching the image validator. This still produces the
correct customer-facing behavior (oversized files are rejected) but
via the wrong layer's message. A production hardening pass should
either raise the JSON body limit for this route specifically or move
to multipart/binary upload transport — documented here rather than
silently worked around.
