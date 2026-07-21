# Phase 10 — Rollback and Recovery Plan

**No rollback was executed. This document only records the plan.**

## Commit lineage

| Commit | Description |
|---|---|
| `8e3ae7bf` | Last known-good commit — final SmokeCraft 360 engineering closeout, before this Passport pass |
| (this pass's new commit) | 360 Passport Connection Completion — see `00-FINAL-REPORT.md` for the exact hash |

## What changed (all additive, no schema migration this pass)

- 3 new files: `server/services/passport360/passport360SyncService.js`, `server/controllers/passport360SyncController.js`, `server/routes/passport360SyncRoutes.js`.
- 1 new frontend file: `src/services/passport360/passport360ApiClient.js`.
- 2 small, surgical edits to pre-existing frontend files: `src/pages/passport/PassportProfile.jsx` (fake stats/fields → real API-backed data) and `src/pages/passport/PassportDirectory.jsx` (added an honest-unavailable gate in front of the pre-existing fake member list, which remains in the file, just unreachable).
- 1 tiny, additive read-only change to `passport360SmokeCraftPersistenceService.js` (added `created_at` to an existing `SELECT` — no behavior change to any existing caller).
- 2 lines added to `server/index.js` (new route mount).

**No database migration was created or required this pass.**

## Rollback method

Since no migration was added, rollback is purely a code rollback: `git revert` this pass's commit (or `git checkout` the prior commit `8e3ae7bf` for the affected files) removes the new sync API and reverts `PassportProfile.jsx`/`PassportDirectory.jsx` to their pre-pass state. No database cleanup is required — the migration-068 tables and their data (including any real stamps/progress rows written by this pass's sync) remain valid and harmless even if the new API code is rolled back, since they were written through the pre-existing, unmodified schema and write primitives.

## Verification after rollback

Re-run: `npm run build`, `GET /api/health`, `verify-smokecraft-new-gamification-screens.mjs` (to confirm `/passport/profile` and `/passport/directory` still load), and the full SmokeCraft regression battery.

## Conditions that require rollback

- A confirmed defect where the new sync writes cause data corruption in a shared table (none found — all writes are additive/idempotent, verified directly).
- A confirmed regression in any of the 5 previously-completed SmokeCraft systems caused by this pass (none found — full regression battery re-run clean).

## Conditions that do NOT require rollback

- The pre-existing insecure `/api/passport-360/smokecraft/*` and `/api/smokecraft/passport-stamp/*` routes remaining unfixed — disclosed, out of scope, unchanged by this pass either way.
- The identity fragmentation between SmokeCraft's verified identity and the general NOVEE OS local Passport identity — a real, disclosed, pre-existing architectural fact, not introduced by this pass.
- The Directory's honest-unavailable state (an intentional improvement, not a regression) or the Golden Box/taste-profile "not connected" disclosures (honest, not defects).
