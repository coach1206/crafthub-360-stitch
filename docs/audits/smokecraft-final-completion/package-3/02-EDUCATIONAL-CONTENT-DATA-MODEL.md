# Educational Content Data Model — Package 3

Full column definitions live in
`server/db/migrations/079_smokecraft_educational_content.sql` (source of
truth). Summary:

## Reuse decision

`golden_box_component_catalog` (migration 077) already existed as a
real, correctly-shaped, empty catalog table. Rather than create a
duplicate `smokecraft_components` table, migration 079 **extends it
additively** with 24 new columns covering every educational field the
mandate's Step 3 lists (slug, category, origin, why_it_matters,
quality/flavor/strength/aroma/burn/construction/performance impact,
decision_guidance, compatibility_notes, common_mistakes,
mentor_guidance, related_session_id, media_asset_key,
future_github_asset_path, alt_text, selectable_in_blend, source_status,
review_status, visibility, version, updated_at, created_by).

## New supporting tables (7)

- `smokecraft_content_versions` — append-only version snapshot per edit (reuses the pattern from `venue_management_content_versions`/`golden_box_entry_versions`, not reinvented).
- `smokecraft_content_media` — image-readiness records (Step 13): `future_github_path`, `sc_assets_key`, `alt_text`, `caption`, `orientation`, `responsive_crop_guidance`, `approval_status`, `current_status` (`USER_CREATING_IMAGE`/`UPLOADED`/`INTEGRATED`).
- `smokecraft_hotspots` — percentage-based x/y/w/h regions tied to a media record, for future clickable-image anatomy diagrams.
- `smokecraft_flavor_notes` — flavor taxonomy (Step 6), 16 top-level groups, self-referencing `parent_id` for child notes.
- `smokecraft_component_compatibility` — relationship records (Step 7), 15 relationship types, always requires a real `explanation`.
- `smokecraft_quiz_questions` — quiz hooks (Step 11), links to `related_component_id` and `xp_award_rule_key` (existing Package 1 table).
- `smokecraft_content_audit_log` — append-only (trigger-enforced), mirrors `golden_box_activity_log`.

## Lifecycle

`visibility`: `draft → published → archived`. `review_status`: `draft →
in_review → reviewed → archived`. Public/learner reads always filter
`visibility = 'published'` — draft content never leaks (live-verified,
Package 3 test #14: draft not visible via public read; test #16:
visible after publish).
