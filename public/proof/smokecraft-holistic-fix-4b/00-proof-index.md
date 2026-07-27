# Holistic Fix 4B — Proof Index

Starting commit: `ce4fbdff`

## Scope disclosure

This pass removes the real blocker from Holistic Fix 4 (no account
system existed for guest-to-account conversion) by reusing the existing,
proven `passport_member` account infrastructure and adding what was
genuinely missing: a login endpoint, a real atomic conversion
transaction, journey-content sync with optimistic concurrency, and a
shared client state adapter. It does not build a second, competing
identity system, and does not attempt per-field (rather than whole-blob)
conflict resolution for journey content — both disclosed as deliberate,
bounded scope decisions, not oversights.

## What this proof directory contains

- `00-proof-index.md` — this file.
- `01-account-and-conversion-results.json` — automated test results
  from `verify-smokecraft-hf4b-account-and-conversion.mjs`: 31/31
  passing, covering account creation, duplicate-email rejection, valid/
  invalid login, real second-device login, logout + session revocation,
  guest-to-new-account conversion, repeated + true-concurrent conversion
  requests, guest-to-existing-account conversion with independent prior
  state on both sides, true same-identity cross-device resume via a real
  second login, a genuine stale-write 409 rejection, unauthorized/cross-
  user access denial, and malformed-input handling.
- `02-merge-policy.md` — copy of `SMOKECRAFT_GUEST_ACCOUNT_MERGE_POLICY.md`.
- `03-migration-094-schema.sql` — the new schema (guest-conversion
  records + journey-snapshot columns).
- `04-account-integrity-validator-output.txt` — output of the new
  build-blocking `scripts/validateSmokecraftAccountIntegrity.mjs`,
  24/24 checks PASS.

## Real defects found and fixed during this pass

1. **No login endpoint existed for an existing account** — only a
   one-time guest→member promotion flow existed anywhere in the
   codebase, with no way to sign back in. Added
   `POST /api/smokecraft/account/login`, reusing the existing bcrypt/
   JWT/lockout infrastructure. Verified live with a real second cookie
   jar.
2. **Rate-limiter convention gap** — the new account/player-state
   routers didn't follow this codebase's existing
   `skip: () => !IS_PROD` pattern, causing the automated test suite to
   fail with cascading 429s after ~10 auth calls. Found live, root-
   caused by direct comparison with `server/index.js`'s existing global
   limiter, and fixed for both routers. Re-tested clean (31/31).

Also found and fixed: a stale `SMOKECRAFT_GAME_MANIFEST.json` (108 vs
the real 109 routes after adding `/smokecraft/account`), and hardened
the responsive validator's previously-hardcoded route-count check to
read the live count instead of a constant — see the defect register for
full detail.

## Real end-to-end proof this pass actually delivers same-identity cross-device resume

Unlike Holistic Fix 4 (which could only prove "two guest cookies never
cross-contaminate" — a true but weaker claim), this pass proves the
mandate's actual requirement: **the same account, logged in
independently on two separate cookie jars (simulating two physical
devices), sees the same state**, including:
- Guest progress (2 sessions + 1 badge) → new account → conversion
  transfers everything, verified against server state, not client
  claims.
- Device X2 writes journey content (`journey-snapshot`), signed in as
  account E2 → Device Y (fresh cookie jar) logs into the SAME account
  with the real issued PIN → sees Device X2's content.
- A stale write (Device X2 retrying with its now-outdated version) is
  rejected with 409, never silently overwrites Device Y's/the server's
  newer state.
- Guest D's independent completions merge with account D's own
  pre-existing completions (both retained, set union) while account D's
  own journey snapshot correctly wins over the guest's per the
  documented merge policy.

## Coverage summary

- **Authentication architecture**: reused, not reinvented (bcrypt PIN
  hashing, JWT + `auth_sessions` revocation, existing lockout/login-
  attempt-logging infrastructure — all pre-existing and proven).
- **Account flows completed**: create, login, logout, session lookup
  (`/me`), lockout after repeated bad PINs.
- **Guest-to-account conversion**: atomic, idempotent (DB `UNIQUE(guest_reference)`),
  handles both a fresh account and an account with independent prior
  state, per the documented merge policy.
- **Journey-content migration**: all ~30 previously client-cache-only
  `SmokeCraftJourneyContext` fields now sync to
  `smokecraft_player_state.journey_snapshot` with real version
  protection.
- **Idempotency**: extended and re-verified for session completion/
  badge/Passport-stamp (unchanged from Holistic Fix 4) plus the new
  guest-conversion mutation.
- **Cross-user isolation**: verified — a guest never sees another
  guest's data; conversion requires both a real signed-in account and a
  server-verified guest cookie, never a client-supplied identifier.

## What this proof directory does NOT cover

- Per-field (rather than whole-blob) journey-content conflict
  resolution — disclosed trade-off in the merge policy doc.
- A production email-delivery provider (none is connected in this
  environment; the dev-mode PIN-in-response flow is honestly disclosed
  as a development-only convenience, not silently presented as real
  email delivery).
- Golden Box Packaging Studio, Skill Tree, Collections, Challenge Hub,
  Blend Fault — all already had their own separate, real, pre-existing
  persistence and were not touched.
- Idempotency for quiz/tasting/note/pairing/challenge/Golden-Box-draft
  submission as SEPARATE named mutation types — these are covered
  generically by the journey-snapshot's whole-blob versioned save (a
  tasting note IS part of the snapshot, protected by the same version
  check), not by 8 additional bespoke idempotent endpoints. Where the
  mandate's Task 12 lists these as things to "integrate into the
  canonical layer or formally prove compatibility" — the journey
  snapshot mechanism is that integration, not a separate one per field
  type.
