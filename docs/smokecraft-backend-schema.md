# SmokeCraft Backend Schema (Phase 9 plan → Phase 10 routes)

Status: API routes that read/write these tables are now implemented
(`server/routes/smokecraftRoutes.js`, `server/routes/smokecraftEatRoutes.js`).
The migration file (`server/db/migrations/011_smokecraft_schema.sql`) still has
**not been applied** to any running database — this repo has no migration
runner, so applying it remains a manual, deploy-time operation outside the
scope of this codebase. Until it is applied AND `DATABASE_URL` points at that
database, every route below transparently falls back to an in-process
in-memory store and reports `storageMode: "memory_fallback"` rather than
claiming durable/shared storage. The frontend never reports "shared venue
storage" unless `storageMode === "postgres"`.

The repo already has `guest_sessions`, `craft_sessions`, `system_users`, `venues`,
`audit_logs`, and `inventory_items` (see `server/db/schema.sql` and
`server/db/migrations/010_new_roles_and_tables.sql`). The tables below are additive
and reference those existing tables rather than duplicating them.

## smoke_sessions
- **Purpose**: One row per SmokeCraft guest session/playthrough — the shared-storage equivalent of `session.smokeCraft` in `GuestSessionContext`.
- **Required fields**: `id`, `session_id` (FK → `guest_sessions.session_id`), `venue_id` (FK → `venues.id`), `craft_session_id` (FK → `craft_sessions.id`, nullable), `xp`, `rank`, `completed_steps`, `final_score`.
- **Status fields**: `challenge_status` (`not_started` / `in_progress` / `completed`).
- **Timestamps**: `created_at`, `updated_at`.
- **venue_id relationship**: required — every session belongs to a venue.
- **session_id relationship**: required — 1:1 with the guest session.
- **user/guest relationship**: via `guest_sessions.session_id`; no separate guest account required (matches current anonymous-guest model).
- **POS3 relationship**: none directly — POS3 relates via `smoke_purchase_intents.smoke_session_id`.
- **E.A.T. relationship**: none directly — E.A.T. reads via `smoke_eat_handoffs`.
- **Indexes**: `(session_id)` unique, `(venue_id)`.
- **Pending until real backend exists**: all rows — this table does not exist server-side yet.

## smoke_session_events
- **Purpose**: Append-only event log mirroring `session.smokeCraft.eventLog`, for audit/debugging and future analytics.
- **Required fields**: `id`, `smoke_session_id` (FK), `event_type`, `payload` (JSONB).
- **Status fields**: none — events are immutable facts, not stateful records.
- **Timestamps**: `created_at`.
- **venue_id relationship**: denormalized `venue_id` for query performance.
- **session_id relationship**: required, via `smoke_session_id`.
- **POS3/E.A.T. relationship**: `event_type` values include POS3- and E.A.T.-originated events (e.g. `SMOKECRAFT_POS_PURCHASE_VERIFIED`).
- **Indexes**: `(smoke_session_id, created_at)`.
- **Pending**: table and ingestion endpoint both pending.

## smoke_purchase_intents
- **Purpose**: A guest's declared intent to purchase a SmokeCraft product, awaiting POS3 staff verification. This is **not** a payment record — no money moves through this table.
- **Required fields**: `id`, `intent_id` (matches frontend `intentId`), `smoke_session_id` (FK), `venue_id`, `product`.
- **Status fields**: `status` (`intent_created` / `pending_pos_verification` / `verified` / `rejected`), `verification_status`.
- **Timestamps**: `created_at`, `updated_at`.
- **venue_id relationship**: required.
- **session_id relationship**: required, via `smoke_session_id`.
- **POS3 relationship**: `verified_by_staff_id` (FK → `system_users.id`, nullable until verified).
- **E.A.T. relationship**: read-only consumer via `smoke_eat_handoffs`.
- **Indexes**: `(intent_id)` unique, `(venue_id, status)`.
- **Pending until real backend/POS exists**: actual POS3 hardware/payment confirmation. This table only ever reflects a staff member's manual "Mark Verified"/"Reject" action — never an automated payment capture.

## smoke_purchase_verifications
- **Purpose**: Append-only audit trail of every verify/reject action taken on a purchase intent (a purchase intent's `status` can be corrected; this table preserves history).
- **Required fields**: `id`, `purchase_intent_id` (FK), `action` (`verified` / `rejected`), `staff_id` (FK → `system_users.id`).
- **Status fields**: n/a (immutable record).
- **Timestamps**: `created_at`.
- **venue_id relationship**: denormalized.
- **session_id relationship**: via `purchase_intent_id` → `smoke_purchase_intents.smoke_session_id`.
- **POS3 relationship**: required — `staff_id` must be a POS3-role user.
- **E.A.T. relationship**: read-only consumer.
- **Indexes**: `(purchase_intent_id, created_at)`.
- **Pending**: real POS3 staff-auth integration; today this would record whichever session is logged into the POS3 terminal demo.

## smoke_leaderboard_entries
- **Purpose**: Shared/community leaderboard records, replacing the Phase 8 local-only fallback once a real backend exists.
- **Required fields**: `id`, `smoke_session_id` (FK), `venue_id`, `xp`, `rank`, `final_score`, `completed_steps`.
- **Status fields**: `visibility` (`local_only` / `venue_shared`) — every row written before real backend wiring stays `local_only` and must not be surfaced as community data.
- **Timestamps**: `created_at`, `updated_at`.
- **venue_id relationship**: required — leaderboard is venue-scoped, not global.
- **session_id relationship**: required.
- **POS3/E.A.T. relationship**: none directly.
- **Indexes**: `(venue_id, final_score DESC)`.
- **Pending**: real multi-guest aggregation; today the existing "Tonight's Ranking" board is explicit demo data per Phase 6/8, and must stay labeled as such even after this table exists, until enough sessions write to it for real.

## smoke_winner_categories
- **Purpose**: Persisted record of which Winner Categories (Phase 5) a session has earned, for audit and cross-device consistency.
- **Required fields**: `id`, `smoke_session_id` (FK), `category_id`, `earned_at`.
- **Status fields**: `status` (`earned` / `pending` / `locked`) — mirrors `smokeWinnerService.js` output.
- **Timestamps**: `created_at`.
- **venue_id relationship**: denormalized.
- **session_id relationship**: required.
- **POS3/E.A.T. relationship**: none.
- **Indexes**: `(smoke_session_id, category_id)` unique.
- **Pending**: this table does not exist; `smokeWinnerService.js` remains the local source of truth and is unchanged by Phase 9.

## smoke_eat_handoffs
- **Purpose**: The record E.A.T. management reads to see purchase-reward state — the backend equivalent of `SmokeCraftOperationalHandoff.jsx`'s local handoff summary.
- **Required fields**: `id`, `handoff_id`, `smoke_session_id` (FK), `purchase_intent_id` (FK, nullable), `venue_id`.
- **Status fields**: `visible_to_management` (boolean), `status`.
- **Timestamps**: `created_at`, `updated_at`.
- **venue_id relationship**: required.
- **session_id relationship**: required.
- **POS3 relationship**: status derives from `smoke_purchase_intents.status`.
- **E.A.T. relationship**: primary consumer — `acknowledged_by_user_id` (FK → `system_users.id`, nullable).
- **Indexes**: `(venue_id, created_at)`.
- **Pending**: real venue-wide multi-guest visibility; today this is per-browser-session only (Phase 8 disclosure).

## smoke_inventory_impact_previews
- **Purpose**: A *preview* of what inventory impact a purchase would have — explicitly never a real deduction (see `getSmokeInventoryImpactPreview`).
- **Required fields**: `id`, `smoke_session_id` (FK), `product`, `previewed_quantity`.
- **Status fields**: `applied` (boolean) — must remain `false` until real POS3/inventory integration exists; this phase does not set it to `true` anywhere.
- **Timestamps**: `created_at`.
- **venue_id relationship**: required.
- **session_id relationship**: required.
- **POS3 relationship**: a real deduction would eventually reference `inventory_movements` (existing table) — out of scope here.
- **E.A.T. relationship**: read-only.
- **Indexes**: `(smoke_session_id)`.
- **Pending**: any real inventory deduction. This table only ever stores hypothetical previews.

## smoke_audit_logs
- **Purpose**: SmokeCraft-specific audit trail, separate from (but consistent with) the existing generic `audit_logs` table, for founder/admin review of purchase verification and handoff actions.
- **Required fields**: `id`, `event_type`, `actor_role`, `actor_id` (nullable for guest), `venue_id`, `payload` (JSONB).
- **Status fields**: n/a (immutable).
- **Timestamps**: `created_at`.
- **venue_id relationship**: required.
- **session_id relationship**: via `payload.session_id` where applicable.
- **POS3/E.A.T. relationship**: both write here for verification/handoff actions.
- **Indexes**: `(venue_id, created_at)`, `(event_type)`.
- **Pending**: this is additive to the existing `audit_logs` table; whether SmokeCraft events should instead simply use `audit_logs.action_category = 'smokecraft'` is an open decision for whoever implements the real backend — documented here, not decided unilaterally.

## What remains pending regardless of this document
- None of these tables exist in any running database.
- No server-side route reads or writes any of them.
- The migration file added alongside this document (`011_smokecraft_schema.sql`) is unapplied.
- Until applied + routes implemented, `smokeSharedStorageService.js` must keep reporting `local_fallback`/`backend_required` honestly, per Phase 8.
