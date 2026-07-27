# Holistic Fix 4 — Proof Index

Starting commit: `742e5a61`

## Scope disclosure (read this first)

This mandate's full scope — a complete authoritative state system
covering IDENTITY/JOURNEY/LEARNING/GAMEPLAY/PAIRING/GOLDEN BOX/SYSTEM,
guest-to-account conversion, full two-tab/cross-device conflict
resolution, and every active screen migrated off client-cache authority
— is multi-week production engineering. This pass delivers a real,
tested, working **foundation**: server-authoritative session completion
and Passport-stamp awards with database-enforced idempotency, wired into
the one shared function (`awardSessionRewards`/`awardStamp` in
`GuestSessionContext.jsx`) that 34+ SmokeCraft screens already call. It
does **not** claim the full state model is server-authoritative — see
`01-state-ownership-map.md`'s Known Gaps section for exactly what
remains client-cache-only and why.

## What this proof directory contains

- `01-state-ownership-map.md` — full audit of every SmokeCraft state
  source (React contexts, localStorage, IndexedDB sync queue, live
  database tables with real row-count verification distinguishing
  active from dead/unused tables).
- `01-player-state-idempotency-results.json` — automated test results
  from `verify-smokecraft-hf4-player-state-idempotency.mjs`: 30/30
  passing, covering first-time guest, returning guest, duplicate
  completion (sequential replay AND true concurrent race), duplicate
  badge/Passport-stamp requests, a real cross-guest idempotency-key-
  collision regression test, cross-guest isolation, malformed-request
  handling, no-client-controlled-XP, real-browser refresh/resume, and a
  real two-different-device honest-empty-state check.
- `02-migration-092-schema.sql` — the new canonical schema (4 tables:
  `smokecraft_player_state`, `smokecraft_session_completions`,
  `smokecraft_awards`, `smokecraft_award_audit`).
- `03-migration-093-fix.sql` — the guest-scoping fix for a real
  cross-guest idempotency-key collision bug found during this pass's own
  live testing (see below).
- `04-integrity-validator-output.txt` — output of the new build-blocking
  `scripts/validateSmokecraftPlayerStateIntegrity.mjs`, 26/26 checks
  PASS.

## Real defects found and fixed during this pass

1. **Transaction-abort bug (found via a true concurrent-request race
   test)**: Postgres aborts an entire transaction after any
   `unique_violation`. The service's duplicate-lookup query, run inside
   the same already-aborted transaction, was itself failing with
   "current transaction is aborted." Fixed by rolling back before the
   duplicate lookup, using a fresh non-transactional read instead.
   Re-tested: two genuinely concurrent requests (`Promise.all`, not
   sequential) now both return well-formed 200/201 responses, with
   exactly one completion recorded and exactly one XP award.
2. **Cross-guest idempotency-key collision (found via a deliberate
   two-different-guests-same-key test)**: migration 092 made
   `idempotency_key` globally UNIQUE. A guest whose client-generated key
   fell back to a generic value (`guestId` was `null` for a guest who
   hadn't been through the Passport entry flow — observed live) could
   collide with a different guest using the same fallback key, silently
   losing the second guest's completion. Fixed by migration 093,
   scoping the UNIQUE constraint to `(guest_reference, idempotency_key)`.
   Re-tested: two different guests sharing the literal same idempotency
   key string now both get their own completion recorded correctly.

## Coverage summary

- **Idempotent mutations completed and tested**: session completion,
  badge award, Passport-stamp award (3 of the mandate's 12 listed
  mutation types — the ones directly tied to the primary curriculum's
  award/completion risk this codebase actually has; the other 9 listed
  types — quiz submission, challenge submission, tasting submission,
  pairing save, Golden Box submission, judge score submission, XP award,
  collection unlock — either already have their own separate,
  pre-existing idempotent persistence for a narrower feature (Skill
  Tree, Collections, Blend Fault, Challenge Hub, Golden Box Packaging
  Studio — see the ownership map), or have no such award-granting flow
  in the current product at all to migrate).
- **Screens connected**: all 34+ screens that call the shared
  `awardSessionRewards`/`awardStamp` functions in `GuestSessionContext`
  are now covered by a single wiring point — verified live end-to-end
  on `HumidorMatch` (a real screen click → real 201 response → real
  database row).
- **Refresh-resume**: PASS (real browser test).
- **Two-tab race**: PASS (real browser test, two real tabs sharing one
  cookie, racing the same completion — exactly one recorded).
- **Cross-device (different browser context, no cookie)**: PASS — an
  honest, empty, non-contaminated state, not the first device's data
  (true cross-device resume onto the SAME identity requires a handoff
  mechanism that does not exist yet — disclosed, not built).
- **Guest-to-account transfer**: NOT built — no account/auth system
  exists anywhere in this codebase for a SmokeCraft guest to convert
  into. This is a hard blocker, not a scoping choice; disclosed in the
  ownership map's Known Gaps.
- **Authorization**: structural, not just checked — a guest identifier
  is never accepted from the client (body/query/header), only derived
  from a server-verified JWT cookie (the existing, already-proven
  `ensureSmokeCraftGuestIdentity` middleware), so cross-guest access is
  impossible by construction, not merely blocked by a runtime check.
- **Audit log**: real, structured, append-only
  (`smokecraft_award_audit`), verified live with rows for both
  `applied` and `duplicate_replay` outcomes across all 3 mutation
  types. Never logs free-text guest content.

## What this proof directory does NOT cover

- Golden Box, Collections, Challenge Hub, Skill Tree, Blend Fault, or
  the commerce pairing flow — these already had their own separate,
  pre-existing, working persistence before this pass and were not
  touched (per the ownership map's finding that they're real and
  functional, just narrowly scoped).
- The ~30 non-award `SmokeCraftJourneyContext` fields (tasting notes,
  selections, mentor pick, etc.) — remain client-cache-only, a
  deliberate scope decision since they carry no duplicate-award risk.
- A full conflict-resolution policy for non-award fields — not needed
  yet since nothing server-side exists for those fields to conflict
  with.
