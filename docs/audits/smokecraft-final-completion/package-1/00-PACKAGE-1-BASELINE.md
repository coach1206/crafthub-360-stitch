# Package 1 Baseline — re-verified before implementation

- Branch: `recovery/smokecraft-codex-final` (unchanged)
- Commit: `aa0b9cf86ff8cda0fb86651cfc88a142faea737f` (unchanged)
- Uncommitted paths: 161 (unchanged from end of Package 0)
- Migrations 075/076: present, untouched, confirmed via `git status`
  showing no modification to either file.
- Package 0 documents: all 10 present in
  `docs/audits/smokecraft-final-completion/`.
- Package 1 contract: `07-PACKAGE-1-GOLDEN-BOX-CONTRACT.md`, present.

## GoldenBox.jsx current behavior (confirmed by re-read)

164 lines. Renders a static rules-acceptance screen: an `ACK_TEXT`
checkbox ("I have read, understood, and agree...") gating a Continue
action, plus `BlankPanel` shells explicitly reserved for Identity/Venue
Settings (owned by other screens, not duplicated here). No competition
state, no eligibility check, no blend builder. This is the file Step 15
permits extending (not replacing) to connect real eligibility/competition
state.

## GoldenBoxStatus.jsx current behavior (confirmed by re-read)

10 lines. Renders one static approved image via `SmokeCraftAssetScreen`.
No interaction, no data.

## Existing Leaderboard API/schema (confirmed)

`leaderboard_entries` (migration 001) and `smoke_leaderboard_entries`
(migration 011, venue-scoped, has `idx_smoke_leaderboard_entries_venue_score`)
— `leaderboardController.js` serves `Leaderboard.jsx`. Golden Box results
will insert into `smoke_leaderboard_entries` with a new
`category`/`competition_type` discriminator rather than a parallel table.

## Existing Badges API/schema (confirmed)

`passport_360_badges` (migration 068): `badge_record_id UUID PK,
tenant_id, venue_id, guest_id UUID FK→passport_360_guest_profiles,
badge_id TEXT, badge_label, module_key TEXT DEFAULT 'smokecraft-360',
source_session_id, earned_at`. Golden Box awards a badge by inserting a
row here with `module_key='golden-box'`, `badge_id` from a new curated
set — no schema change needed for badges.

## Existing Passport Stamps API/schema (confirmed)

`passport_stamps` (migration 001): `stamp_id, passport_id FK, session_id,
title, craft, session_number, event_name, earned_at, visual_theme,
points, source_module`. Golden Box awards a stamp the same way, no
schema change needed.

## Existing session-progress persistence (confirmed)

`smokecraft_management_sync_journeys`/`_snapshots` (migration 074,
Package B-D this session) is the real, server-backed source of truth for
"what has this learner completed" — `journey_id UUID PK, tenant_id,
venue_id TEXT FK→venues(venue_id), user_id TEXT (soft, nullable),
guest_reference TEXT NOT NULL, session_number SMALLINT CHECK 1-27,
status CHECK(in_progress/completed/abandoned)`. Golden Box eligibility
evaluation reads from this table, not from `localStorage`.

## Existing user/venue identity model (confirmed)

Dual-identity pattern already established and reused throughout this
session: `system_users(user_id TEXT PK)` for authenticated staff/admin/
users, `passport_360_guest_profiles(guest_id UUID PK)` for guest
identity, `venues(venue_id TEXT UNIQUE)` as the sole authoritative venue
table (never `novee_os_venues`). Golden Box entrant identity reuses the
exact `user_id TEXT` (soft)/`guest_reference TEXT NOT NULL` pattern from
`smokecraft_management_sync_journeys` rather than inventing a third
identity shape.

## Current migration numbering

Latest applied: `076_venue_management_profiles.sql`. Package 1's new
migration will be `077_golden_box_foundation.sql`.

## `audit_logs.action_category` CHECK constraint (confirmed)

Defined in migration `010_new_roles_and_tables.sql` line 537-539 via
`ALTER TABLE audit_logs ADD COLUMN ... CHECK (action_category IN
('AUTH','ROLE','ADMIN','POS','EAT','INVENTORY','TICKER','PAYMENT',
'DEVELOPER','FOUNDER','MENTOR','PASSPORT_CONNECTION','VENUE',
'SYSTEM_SETTINGS','FEATURE_FLAGS'))`. Does not include `GOLDEN_BOX` —
Package 1's migration must drop and recreate this constraint to add it
(Postgres has no `ALTER CHECK`), exactly the kind of fix already applied
once in Management Sync Package B for the same constraint.
