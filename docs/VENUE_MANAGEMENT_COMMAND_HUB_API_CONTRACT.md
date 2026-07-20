# Venue Management Command Hub — API Contract (Package 6B)

Mounted at `/api/venue-management`. All routes: `requireAuth` →
`requireValidVenue('venueId')` → `requireVenueMembership()` (manager/
admin/owner, platform-admin bypass) → optional `requireVenuePermission(key)`
→ `auditAction('VENUE', action, 'post')`.

| Method | Path | Permission beyond membership | Audit action |
|---|---|---|---|
| GET | `/venues/:venueId/profile` | — | (read, unaudited) |
| POST | `/venues/:venueId/profile` | — | `profile_created` |
| PATCH | `/venues/:venueId/profile` | — | `profile_updated` |
| POST | `/venues/:venueId/profile/submit` | — | `profile_submitted` |
| POST | `/venues/:venueId/profile/approve` | `content.approve` | `profile_approved` |
| POST | `/venues/:venueId/profile/reject` | `content.approve` | `profile_rejected` |
| POST | `/venues/:venueId/profile/publish` | `content.publish` | `profile_published` |
| POST | `/venues/:venueId/profile/unpublish` | `content.publish` | `profile_unpublished` |
| GET | `/venues/:venueId/profile/versions` | — | (read, unaudited) |
| POST | `/venues/:venueId/profile/versions/:n/restore` | — | `profile_version_restored` |
| GET | `/venues/:venueId/media` | — | (read, unaudited) |
| POST | `/venues/:venueId/media` | — | `media_uploaded` |
| GET | `/venues/:venueId/media/:mediaId` | — | (read, unaudited) |
| GET | `/venues/:venueId/media/:mediaId/file` | — | (read, unaudited) |
| PATCH | `/venues/:venueId/media/:mediaId` | — | `media_metadata_updated` |
| POST | `/venues/:venueId/media/:mediaId/archive` | — | `media_archived` |
| POST | `/venues/:venueId/media/:mediaId/restore` | — | `media_restored` |
| POST | `/venues/:venueId/branding` | — | `branding_assigned` |
| DELETE | `/venues/:venueId/branding/:slot` | — | `branding_removed` |
| POST | `/venues/:venueId/branding/gallery/reorder` | — | `gallery_reordered` |

`PATCH /profile` requires `{ expectedVersion, ...fields }` — a mismatch
returns 409 `stale_version`. Known error codes: `venue_not_validated`,
`venue_membership_required`, `venue_permission_denied`, `profile_not_found`,
`stale_version`, `media_in_use`, `unsupported_mime_type`, `file_too_large`,
`invalid_dimensions`, `invalid_transition_from_<STATUS>`.

## Package E gap closure
`GET /venues/:venueId/integrations` (Management Sync routes, unchanged
path) now includes `auditAction('VENUE', 'integrations_viewed', 'post')`.
