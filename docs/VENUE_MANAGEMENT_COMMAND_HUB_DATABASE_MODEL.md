# Venue Management Command Hub — Database Model

## Migration 075 (Package 6A)
- `venue_management_content_versions` — venue_id FK → venues, entity_type
  CHECK (9 values), entity_id, version_number, 10-state status CHECK,
  payload JSONB, approval/publish actor+timestamp columns,
  UNIQUE(venue_id, entity_type, entity_id, version_number).
- `venue_management_media` — venue_id FK, media_type CHECK, storage_path,
  mime_type, size_bytes, width, height, alt_text, in_use, uploaded_by,
  soft-delete via deleted_at.
- `novee_os_remote_venue_actions` — operator/target-venue/reason/approval/
  before-after/notification/rollback/outcome columns; append-only via
  `trg_novra_no_delete` trigger (mirrors `audit_logs`' pattern).

## Migration 076 (Package 6B)
- `venue_management_profiles` — one current row per venue (partial unique
  index `WHERE is_current`), structured profile fields, logo/hero FKs to
  `venue_management_media`, gallery as ordered JSONB array, 7-state
  lifecycle CHECK, `version` for optimistic concurrency.

Neither migration touches `venues`, `venue_memberships`, `venue_permissions`,
or `novee_os_venues` — all new tables reference the authoritative `venues`
table only.
