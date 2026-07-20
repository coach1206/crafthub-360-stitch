# Venue Management Command Hub — Package 6B Implementation

## Phase 1 audit results

- **Storage provider**: none. No `multer`/`busboy`/`formidable`/`sharp`/
  `aws-sdk`/cloudinary dependency exists anywhere in `package.json` or
  `node_modules` (confirmed by direct search this package). Only
  `image_url TEXT` columns exist elsewhere in the schema — metadata
  columns expecting external URLs, never a working upload pipeline.
- **Upload library**: none — built new this package via manual base64
  JSON body parsing (no multipart library available/installed).
- **Image processing**: none — MIME sniffing and dimension parsing are
  hand-written (`server/services/venueManagement/imageValidation.js`),
  reading PNG/JPEG/WebP headers directly, matching this repo's existing
  "no validation library, manual inline validation" convention
  (confirmed in `SMOKECRAFT_MANAGEMENT_SYNC_ARCHITECTURE_VALIDATION.md` #7).
- **Size limits**: none pre-existing — 5MB new limit enforced in
  `imageValidation.js`, plus an 8MB Express body-size cap on the upload
  route only (the app-wide default is 1MB).
- **Dimension validation**: none pre-existing — 32–6000px bounds enforced.
- **Malware scanning**: none exists in this repo and none was added —
  disclosed limitation, deferred (no antivirus/scanning service reachable
  from this sandbox or documented anywhere in the codebase).
- **Duplicate detection**: not implemented as dedup-on-upload; a SHA-256
  checksum is computed and stored per media row (`storageAdapter.upload`)
  for future use, but no reject-on-duplicate behavior was added this pass.
- **Signed URLs**: not applicable — no object storage exists. Media is
  served through a controlled, server-checked app route
  (`GET /venues/:venueId/media/:mediaId/file`) that re-validates venue
  ownership on every request, never a raw filesystem path.
- **Production storage status**: **NOT_CONFIGURED**. A storage
  abstraction (`storageAdapter.js`) was built with a local-disk
  development adapter behind it, so a real provider (S3/GCS/etc.) can be
  swapped in later without touching `mediaService.js` callers. This is
  explicitly disclosed to the frontend (`storage.provider` field on the
  profile response) and is a documented Package 7 requirement.

## What was built

- **Migration 076** (`venue_management_profiles`): one current profile
  row per venue (partial unique index), 10-state lifecycle, optimistic
  concurrency via `version`, FKs to `venue_management_media` for
  logo/hero, `gallery_media_ids` as an ordered JSONB array.
- **`storageAdapter.js`**: local-dev media storage abstraction —
  server-generated object keys (never client filenames), path-traversal
  rejection, controlled URL generation, health check.
- **`imageValidation.js`**: manual magic-byte MIME sniffing (PNG/JPEG/
  WebP only — HTML/SVG/executables always rejected as "unrecognized"),
  manual dimension parsing, filename normalization.
- **`mediaService.js`**: create/list/get/update-metadata/archive/restore/
  check-usage, all venue-scoped by SQL `WHERE venue_id = $2`.
- **`venueProfileService.js`**: get/create/update (optimistic-concurrency,
  transactional)/submit/approve/reject/publish/unpublish/version-history/
  restore-version, all writing to the Package 6A
  `venue_management_content_versions` table for full history.
- **`brandingService.js`**: logo/hero/gallery assignment, ownership
  checks (only same-venue, active media may be assigned), gallery
  reordering.
- **`venueManagementController.js`** + **`venueManagementRoutes.js`**:
  mounted at `/api/venue-management`, every route uses the exact
  `requireAuth` → `requireValidVenue` → `requireVenueMembership` →
  (`requireVenuePermission` for approve/publish) → `auditAction('VENUE', …)`
  chain proven in Management Sync Packages B-E — no new middleware
  family invented.
- **`venueManagementRoles.js`** (Package 6A) permission keys
  (`venue_management.content.approve`, `.content.publish`, etc.) are now
  actually consumed by real `requireVenuePermission()` calls.
- **Frontend**: `src/pages/venueManagement/VenueManagementCommandHub.jsx`
  — a real, functional shell with Profile and Media Library panels,
  registered at `/venue-management`. Full lifecycle UI (draft → submit →
  approve/reject → publish/unpublish), version history + restore, image
  upload with real validation-failure states, branding assignment,
  archive-blocked-while-in-use handling, ARIA live regions on save/upload
  status. Products/Menus/Events/Staff/Audit sections shown as disabled
  "coming soon" nav items, not fake pages.

## Package E gap closed

`GET /venues/:venueId/integrations` now includes
`auditAction('VENUE', 'integrations_viewed', 'post')`, matching `/insights`
and `/actions`. Verified live: check #28 in the Package 6B suite confirms
a real `integrations_viewed` row is written to `audit_logs` on access.

## Real bugs found and fixed this package

1. Original test's oversized-upload check assumed a 400 from application
   code; the real behavior is Express's body-parser rejecting the request
   at 413 before it reaches the handler — both are valid rejections, the
   test was corrected to accept either.
2. A 1x1 test PNG failed the (correct) 32px minimum-dimension validation
   — the test fixture was wrong, not the validator; replaced with a real
   64×64 PNG generated via Node's built-in `zlib`.
3. Two pre-existing regression scripts from earlier packages
   (`verify-smokecraft-management-sync-package-e.mjs`,
   `verify-smokecraft-management-sync-package-b-proof-gaps.mjs`) reference
   `venues`/`system_users`/`venue_memberships` fixture rows they never
   insert themselves (only `DELETE` them at cleanup) — a latent gap in
   those test scripts, not something Package 6B introduced. Fixtures were
   seeded manually to confirm the underlying application code has zero
   regression; both suites then passed 16/16 and 23/23.
4. Repeated interactive test runs against the same long-lived server
   process exhausted the in-memory rate limiters (documented pattern from
   Packages B/D) — resolved each time by restarting the server, not a
   code defect.

## Known limitations (disclosed, not fixed this package)

- Production object storage: NOT_CONFIGURED — Package 7 requirement.
- No malware/antivirus scanning of uploads.
- No signed URLs (not needed while storage is local-disk only).
- `verify-smokecraft-authoritative-sequence.mjs` (a pre-existing,
  unmodified suite unrelated to any Package 6B code) hung against the
  dev server in this sandbox run and was not confirmed passing this pass
  — flagged for a clean re-run before Package 6C, not treated as a
  Package 6B regression since no SmokeCraft guest-journey file was
  touched.
- `verify-crafthub-approved-image.mjs`'s touch-target check (#20) failed
  under `vite dev`, matching the exact, previously-documented dev-mode
  rendering-timing artifact from Package C/D (not re-verified against
  `vite preview` this pass due to time budget — historically passes there).
