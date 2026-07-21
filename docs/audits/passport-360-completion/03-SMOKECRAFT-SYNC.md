# Phase 3 — SmokeCraft Sync

Every event type/table used to build the Passport synchronization summary (`server/services/passport360/passport360SyncService.js`, function `collectEvidence()` + `getProfile()`):

| Domain | Real source table/field read | Passport stamp/summary produced |
|---|---|---|
| Session completion (Filler Arrangement) | `smokecraft_filler_arrangement_completion.completed_at` | Stamp `filler-arrangement-complete` |
| Skill Tree | `smokecraft_skill_tree_learner_state` where `node_key='foundation' AND state='completed'` | Stamp `skill-tree-foundation-complete`; `smokecraftProgress.skillTreeCompletedNodes` (real `COUNT`) |
| Collections | `smokecraft_collection_ownership` (any row) | Stamp `collections-first-item-earned`; `smokecraftProgress.collectionsOwnedItems` (real `COUNT`) |
| Challenge Hub | `smokecraft_challenge_learner_state` where `participation_state='completed'` | Stamp `challenge-hub-first-completion`; `smokecraftProgress.challengesCompleted` (real `COUNT`) |
| Blend Fault | `smokecraft_blend_fault_attempts` where `status='passed'` | Stamp `blend-fault-identification-passed`; `smokecraftProgress.blendFaultPassed` (real boolean) |
| XP | `xp_accounts.balance` (the same real, existing XP ledger every other pass reads/writes) | `xpSummary.totalXp` — mirrored via an **absolute set**, never additive, into `passport_360_guest_progress.total_xp` |
| Stamps | `passport_360_earned_stamps` (migration 068, real `dedupe_key` idempotency) | `stampSummary.count` |
| Badges | `passport_360_badges` (migration 068, pre-existing, read-only this pass — no new badge-award logic was added; no approved new badge exists to award) | `badgeSummary.count` (honestly 0 unless a badge already exists from elsewhere) |
| Taste profile | No confirmed per-guest taste data source exists yet (`passport_360_smokecraft_flavor_memory` exists in migration 068 but nothing currently writes real per-guest taste data into it) | `tasteProfile.connected: false`, disclosed |
| Golden Box | No approved Passport-Golden-Box milestone mapping exists yet — Golden Box scoring/judging/results were explicitly not touched by this pass | `goldenBox.connected: false`, disclosed |
| Activity | `smokecraft_progression_events` (the same shared event log every pass writes to), ordered `created_at DESC` | `GET /activity` |
| Connections | `smokecraft_progression_events` (checked for a real SmokeCraft craft connection) + `payload->>'mentorId'` where present | `GET /connections` |

## Reuse discipline

No competing SmokeCraft progression architecture was created. `smokecraft_progression_events` remains the single shared event log. The sync service only **reads** from it (via `collectEvidence()`/`getActivity()`/`getConnections()`) — it does not write new `smokecraft_progression_events` rows itself, since Passport synchronization is a read-and-mirror operation over evidence other passes already produce, not a new source of SmokeCraft progression truth.

## Determinism and idempotency

`synchronize()` is deterministic: given the same underlying evidence, it always produces the same stamp set and XP value. All writes are idempotent:
- Stamps: `awardPassportStampLive()`'s real `dedupe_key = ${guestId}:${stampId}:${moduleKey}` UNIQUE constraint (migration 068) — `ON CONFLICT (dedupe_key) DO NOTHING`.
- XP: an absolute `UPDATE ... SET total_xp = $5` (not `+=`), so repeated sync calls never double-count.
- Session snapshots: keyed by a stable `smokecraft-session-key` derived from the real progression-event count at sync time (`passport-sync-snapshot-${eventCount}`), so unchanged evidence never creates a duplicate session row.

Verified directly: 2 consecutive `POST /synchronize` calls after a real Blend Fault pass produce identical `alreadyOwned` results on the second call, with 0 new stamp rows and an unchanged `total_xp`.
