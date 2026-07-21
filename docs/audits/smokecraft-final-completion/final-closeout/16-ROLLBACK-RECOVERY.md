# Phase 17 — Rollback and Recovery Plan

**No rollback was executed. This document only records the plan, as required.**

## Commit lineage (this operation)

| Commit | Description |
|---|---|
| `00f25571` | Filler Arrangement + shared `smokecraft_progression_events` (last known-good baseline before this operation's Skill Tree pass) |
| `8ee7b4d5` | Skill Tree Persistence (migration 086) |
| `5469d1c0` | Collections Ownership (migration 087) |
| `6a160d08` | Challenge Hub Live State — production implementation (migration 088) |
| `2e7a5d65` | Challenge Hub verification pass (Golden Box 7A proof only, no code) |
| `80d63e65` | Blend Fault Identification Backend Scoring (migration 089) — **final completion commit prior to this closeout pass** |

**Last known-good commit:** `2e7a5d65afc40be05022d7a3c87a352d215966a1` (the state before the Blend Fault pass).
**Final completion commit (this closeout, pending push):** the new commit created by this pass (see `00-FINAL-REPORT.md`).

## Database migration rollback limitations

This project's migration runner (`server/db/runMigrations.js`) has **no formal `down`-migration mechanism** — a pre-existing convention across all 89 migration files, not introduced by this operation. Rollback of a migration therefore cannot be automated; it requires either:
1. A hand-written reverse-SQL script (`DROP TABLE IF EXISTS ...` for the specific tables a migration added), or
2. Restoring from a pre-migration database snapshot/backup.

Migrations 086–089 are all additive-only (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING` seeds) — none contain destructive statements against pre-existing tables, so a reverse-SQL rollback for any one of them is low-risk: it would only need to `DROP TABLE` the specific new tables that migration introduced (e.g., for 089: `smokecraft_blend_fault_answers`, `smokecraft_blend_fault_attempts`, `smokecraft_blend_fault_questions`, in that FK-safe order), with no risk to any other system's data.

## Safe application rollback steps

1. Identify the target commit (e.g., `2e7a5d65...` to undo only the Blend Fault pass, or further back to undo more).
2. `git checkout <target-commit>` on the deployment branch (or revert via the hosting provider's deployment-history UI, if available — Vercel/Railway both keep prior build artifacts).
3. Redeploy that commit through the normal Vercel (frontend) / Railway (backend) pipeline.
4. Do **not** roll back the database schema unless the specific new tables are causing an active problem — since all additions are additive-only, leaving migrations 086–089 applied while running older application code is safe (older code simply never queries the new tables).

## Safe database restore steps (only if a destructive rollback is truly required)

1. Take a fresh backup/snapshot of the current database before any destructive action.
2. If reverting past a specific migration, run the hand-written reverse-SQL for just that migration's new tables (see above) — never `DROP` a table shared with an earlier, still-desired pass (e.g., never drop `smokecraft_progression_events`, which every pass in this operation depends on).
3. Verify application boot and health check pass after the reverse-SQL runs.

## Environment-variable recovery

No new environment variables were introduced by this operation. All variables needed (`DATABASE_URL`, `JWT_SECRET`, `FOUNDER_CHALLENGE_SECRET`, etc.) are already documented in `.env.example`, unchanged.

## Deployment rollback method

Per `13-DEPLOYMENT-VERIFICATION.md`: Vercel (frontend) and Railway (backend) both natively support redeploying a prior build/commit through their own dashboards — this is the documented, standard rollback method for this project's existing deployment configuration and was not modified by this operation.

## Asset rollback method

No new binary assets were added by any of the 5 completed systems beyond what already existed in `public/assets/smokecraft/` — the 6 asset paths used by Skill Tree/Collections/Challenge Hub/Blend Fault Identification were pre-existing approved images (Phase 10). No asset rollback is needed for this operation specifically.

## Verification after rollback

Re-run: `npm run build`, `GET /api/health`, the specific dedicated suite(s) for whatever was rolled back to, and the full route smoke test (`verify-smokecraft-route-smoke-test.mjs`).

## Conditions that require rollback

- A confirmed production defect in one of the 5 completed systems that breaks a previously-working, unrelated system (none found this pass).
- A migration that is discovered to have altered or deleted pre-existing data (none of 086–089 do this — verified in Phase 4).

## Conditions that do NOT require rollback

- The 3 disclosed items in `14-DEFECT-REGISTER.md` (a fixed test-infra heuristic, non-reproducible test-load noise, and a pre-existing out-of-scope test-fixture-lifecycle gap) — none of these affect production learner-facing behavior.
- The deployment-verification gap in `13-DEPLOYMENT-VERIFICATION.md` — this is a sandbox network-access limitation, not a code or data problem.
