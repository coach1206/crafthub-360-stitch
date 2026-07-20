# Venue Management Command Hub — Content Lifecycle

`venue_management_content_versions.status` (Package 6A) and
`venue_management_profiles.status` (Package 6B, a matching 7-of-10-state
subset) implement: `DRAFT → PENDING_APPROVAL → APPROVED → PUBLISHED →
UNPUBLISHED`, with `REJECTED` looping back to editable and `ARCHIVED` as
a terminal state. `SCHEDULED`/`EXPIRED` (from 6A's fuller 10-state set)
are not yet driven by any real scheduler — no background job runner
exists in this codebase (consistent with the same finding in
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_D_ANALYTICS_MODEL.md`) — so
`scheduled_publish_at` is stored but not acted on. Disclosed, deferred.

Every transition is transactional, actor-attributed (`created_by`/
`approved_by`/`published_by`, never client-supplied), and writes a new
version row — never a silent overwrite.
