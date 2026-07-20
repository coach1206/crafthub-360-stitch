# Venue Management Command Hub — Media Storage (Package 6B)

**Production storage status: NOT_CONFIGURED.** No object-storage provider
exists anywhere in this codebase (audited: no `aws-sdk`,
`@google-cloud/storage`, `cloudinary`, or similar in `package.json`).

`server/services/venueManagement/storageAdapter.js` implements a small,
swappable interface (`upload`, `remove`, `getControlledUrl`, `readBuffer`,
`healthCheck`) with a **local development adapter** as the only
implementation today — files written under
`server/_local_media_storage/<venue_id>/<generated-uuid>.<ext>`
(git-ignored, never committed). The object key is always server-generated
(random UUID), never derived from the client-supplied filename, which is
what neutralizes path-traversal attempts (test #18).

Files are served through a controlled app route
(`GET /api/venue-management/venues/:venueId/media/:mediaId/file`) that
re-validates venue ownership on every request — never a raw filesystem
path or a public static directory.

**Package 7 requirement**: swap `storageAdapter.js`'s internals for a
real provider (S3, GCS, or similar) behind the same 5 functions;
`mediaService.js` and everything above it needs zero changes.
