# Venue Management Command Hub — Profile Data Model (Package 6B)

`venues` (System 1, migration 010) remains the sole authoritative venue
identity/status row — untouched by this package. Richer, versioned,
lifecycle-managed profile content lives in `venue_management_profiles`
(migration 076), one **current** row per venue enforced by a partial
unique index (`WHERE is_current`).

Fields: `display_name`, `description`, `reservation_url`, `timezone`,
`operating_hours` (JSONB), `amenities` (JSONB array), `accessibility_info`
(JSONB), `age_restriction`, `dress_code`, `social_links` (JSONB),
`logo_media_id`/`hero_media_id` (FK to `venue_management_media`),
`gallery_media_ids` (ordered JSONB array), `status` (10-state lifecycle
CHECK), `version` (optimistic concurrency), `created_by`/`updated_by`/
`approved_by`/`published_by`, timestamps, `rejection_reason`.

Every write also inserts a row into the Package 6A
`venue_management_content_versions` table (`entity_type='venue_profile'`)
recording the full payload, actor, and status at that version — this is
the version-history/restore mechanism, reusing 6A's schema rather than
building a second one.

Lifecycle: `DRAFT → PENDING_APPROVAL → APPROVED → PUBLISHED →
UNPUBLISHED`, with `REJECTED` (loops back to editable) and `ARCHIVED` as
terminal/side states. Only `DRAFT`/`REJECTED` are directly editable;
`updateVenueProfile` enforces this plus an optimistic-concurrency check
(`expectedVersion` must match the current row or the request is rejected
with `stale_version`, 409) inside a single transaction with `SELECT ...
FOR UPDATE`.
