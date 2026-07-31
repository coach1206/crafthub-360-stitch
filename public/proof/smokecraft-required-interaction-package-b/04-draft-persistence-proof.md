# 04 — Draft-Persistence Proof

Reuses the exact same `smokecraft_tasting_drafts` table and `GET/PUT /api/smokecraft/player-state/tasting/:activityKey/draft` routes already used by Mini Tasting and Package A's Sessions 8/12/16 — `activityKey='scorecard'`. No new table.

- **Scoped by player, session, and interaction**: rows keyed `(guest_reference, activity_key)`; a scorecard draft can never be read/written by another guest (API test section 2) or leak into/overwrite another session's draft (API test section 3).
- **Validates allowed fields**: only `categories`/`personalNotes`/`meta` accepted; an out-of-vocabulary category key, an out-of-range rating (e.g. 9), an out-of-range meta value, or a first-third-shaped payload are all rejected (API test sections 3-4).
- **Preserves concurrency state**: the existing optimistic-concurrency pattern (`expectedVersion`, `409 stale_version`) applies unchanged.
- **Never awards XP/progression**: verified directly (API test section 15).
- **Reloads the authoritative draft**: `Scorecard.jsx` calls `loadTastingDraft('scorecard')` on mount before rendering any interactive control.
- **Rejects stale writes after completion**: once evidence exists, any draft `PUT` is denied `409 already_completed` (API test section 11; browser test — a post-completion save attempt never shows a fabricated "Saved" confirmation).
