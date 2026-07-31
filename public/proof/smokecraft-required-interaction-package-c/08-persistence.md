# 08 — Persistence

No new tables or migrations. Package C reuses two existing canonical tables:

- **`smokecraft_activity_attempts`** (final, correct evidence): one row per `(guest_reference, activity_type, activity_key)`, a new `activity_type` value per interaction shape (`selection_image`, `sequence`, `match`, `hotspot`) alongside Package A/B's existing `tasting_observation`/`scorecard` values. Existing `UNIQUE(guest_reference, activity_type, activity_key)` and idempotency-key constraints, unchanged, provide ownership and idempotency for free.
- **`smokecraft_tasting_drafts`** (in-progress state): `activityKey` = the sessionId, same generic table Mini Tasting and Packages A/B already use. Existing optimistic-concurrency (`version`, `409 stale_version`) unchanged.
- **`smokecraft_award_audit`** (attempt history): every attempt, correct or not, via the existing `recordAttemptAudit()` helper — no new table.

Why no new table was needed: all 4 interaction shapes reduce to "a JSON-serializable payload the server validates and evaluates," which is exactly what the existing `evidence JSONB` column on `smokecraft_activity_attempts` and `draft_data JSONB` column on `smokecraft_tasting_drafts` were already designed for.
