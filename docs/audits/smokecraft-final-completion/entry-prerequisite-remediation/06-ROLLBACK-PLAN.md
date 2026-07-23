# 06 — Rollback Plan

## What changed

- `src/constants/smokecraftEntryReadiness.js` — new file, one new pure function, no side effects.
- `src/components/smokecraft/SmokeCraftSessionGuard.jsx` — the `sessionNumber` branch now also checks entry-readiness and redirects when incomplete; a new `enforceEntryReadiness` prop (default `true`) allows a specific route to opt out.
- `src/App.jsx` — one line changed: the landing index route (`/smokecraft`) now passes `enforceEntryReadiness={false}` to remain an intentionally-public informational page, per its own pre-existing comment ("Entry-layer Launch — always unlocked").
- `verify-smokecraft-phase9-full-journey.mjs` — `seedGuest()` extended with an `entryReady` option (default `true`) so existing mid/late-chain checks continue seeding a realistic, fully-onboarded test guest; two checks' setup and assertion text updated to reflect the corrected required behavior (a genuinely fresh guest is now redirected, not granted direct access) — this is a test-setup correction, not a weakened assertion (see `05-REGRESSION-MATRIX.md`).

No other file, route, or guard component was touched. No database migration.

## Rollback procedure, if ever needed

1. `git revert <this pass's commit>` — safe; `getSmokeCraftEntryReadiness` has no other dependents besides the one guard call site.
2. No database rollback needed (no migration ran).
3. Reverting restores the reported bypass defect — not a neutral rollback from a correctness standpoint, but mechanically safe.

## Why this is the smallest safe fix

The alternative — restructuring Mentor Selection to occur before Welcome, as the mandate's generic sequence describes — was evaluated and explicitly rejected as disproportionate and risky (would require rewiring `Mentor.jsx`'s and `SeedSoil.jsx`'s own navigation targets and the `SUPPORTING_MODULES` guard graph, an architecture change to an already-approved, already-tested chain). The actual verified defect — S1's guard trivially passing because it has no earlier session to require — is fixed by adding exactly one new check (entry-layer readiness) to exactly one guard component, with one explicit, documented opt-out for the one route that must remain public.
