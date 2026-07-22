# Versioning

Every draft save (`PATCH /designs/:designId/draft`) inserts a new `packaging_design_versions` row with an incremented `version_number`, marks it `is_current = true`, and flips every prior version's `is_current` to `false` — no row is ever mutated after creation (verified live: `v1`'s snapshot remains the original empty `{}` even after later saves and a restore).

`UNIQUE(design_id, version_number)` at the database level makes duplicate/corrupted version numbers structurally impossible, even under concurrent save attempts.

## Restore

`POST /designs/:designId/versions/:n/restore` reads the target historical snapshot and calls the same `saveDraft()` path used for a normal edit — it **creates a new version** whose snapshot matches the restored one, rather than rewriting history. Verified live: after restoring v1 (empty), the resulting version number is higher than any prior version, and v1 itself remains untouched.

## Comparison

`PackagingStudioVersions.jsx`'s comparison view reads two selected versions' structured `snapshot` JSONB directly and diffs a fixed field list (box name, wood, color, finish, lid, closure, interior, tray, text, engraving, notes) client-side — no screenshot comparison is used, matching the mandate's explicit requirement.
