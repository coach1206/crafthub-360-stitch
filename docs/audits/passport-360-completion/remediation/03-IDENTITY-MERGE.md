# Remediation 3 — Identity Merge

## Scope correction from the discovery audit

As documented in `02-CANONICAL-IDENTITY-DESIGN.md`, there was no server-side duplicate-identity record to merge — the general NOVEE OS local `passportId` was never a real backend key. The "merge" implemented this pass is therefore the real, applicable case: **merging a real guest's canonical Passport profile into a real authenticated user's canonical Passport profile**, when a guest later authenticates (the `linkGuestToUser()` function in `passport360SyncService.js`, exposed via `POST /api/passport-360/sync/link-guest`).

## Merge procedure (transactional)

1. Resolve both the guest's real canonical profile (`passport_360_guest_profiles` row for the guest's `guest_reference`) and the user's real canonical profile (row for `req.user.id`).
2. Re-insert every one of the guest's real stamps under the user's `guest_id`, via the same real `dedupe_key` UNIQUE constraint used everywhere else (`ON CONFLICT (dedupe_key) DO NOTHING`) — never duplicates an already-owned stamp, never touches the guest's own original row.
3. Mirror the user's `total_xp` to `GREATEST(existing, max(guest_balance, user_balance))` — a real, non-negative, non-fabricated value derived from the two real `xp_accounts` balances, never additive (so repeated links can't inflate it).
4. Record merge provenance in `passport_360_sync_audit_log` (real, `WHERE NOT EXISTS` idempotency guard keyed on `guest_id` + `event_type='guest_to_user_link'` + the specific `guestReference` in `metadata_json`, so repeated link calls for the same pair don't duplicate the audit row).
5. Commit the whole operation as one transaction (`BEGIN`/`COMMIT`, with `ROLLBACK` on any failure) — stamps and XP mirroring either both land or neither does.

## Preservation verified directly

- **Passport ID**: both the guest's and the user's own canonical IDs are preserved unchanged — this is an additive merge (stamps copied to the user), not a destructive one (the guest's row and its stamps are never deleted).
- **Stamps**: verified directly — a guest with 1 real stamp links into a user account; the user's own canonical profile then shows that 1 stamp; the guest's original stamp row still exists too (2 total rows for that stamp key across both profiles, not 1 and not 3+).
- **XP**: verified directly — the merged value is a real, non-negative number derived from real `xp_accounts` balances.
- **Activity, Connections, Skill Tree, Collections, Challenge, Blend Fault**: these are all computed live from `smokecraft_progression_events` and each system's own learner-state table, keyed by `guest_reference` — **not by the Passport `guest_id`** — so they are unaffected by the Passport-side merge entirely; both the guest's and user's real evidence remain independently queryable by their own respective `guest_reference` values, exactly as before. Nothing was deleted.
- **Taste profile / Golden Box**: not connected to Passport at all (per the prior pass's disclosure), so there is nothing Passport-side to merge for these domains.

## No premature deletion

**No legacy data was deleted.** The guest's original `passport_360_guest_profiles` row, its stamps, and its progress row all remain exactly as they were — the merge is purely additive on the user's side. This matches the mandate's explicit instruction: "Do not delete legacy data until consolidation has been tested."

## Duplication prevented, verified directly

Two consecutive `POST /link-guest` calls for the same real guest+user pair: the first merges the guest's 1 real stamp (`mergedStamps: 1`); the second merges 0 (`mergedStamps: 0`) — the real stamp-row count for that stamp key across both profiles stays at exactly 2 (not 3) after the repeat.
