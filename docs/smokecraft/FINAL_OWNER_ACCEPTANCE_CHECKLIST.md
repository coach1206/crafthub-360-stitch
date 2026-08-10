# SmokeCraft 360 — Final Owner Acceptance Checklist

**Branch:** `recovery/smokecraft-codex-final`
**Tested commit (source code, unmodified during testing):** `68d90e1ddff2d263dba79259cd9c26b2e23efa87`
**Full evidence:** `docs/smokecraft/FINAL_PRODUCTION_ACCEPTANCE_REPORT.json`

This checklist uses five distinct statuses. They are not interchangeable:

- **BUILT** — the code exists and compiles/builds successfully.
- **TESTED** — an automated or scripted check was run against it.
- **VERIFIED** — the check's real output (DB rows, screenshots, HTTP
  responses) was inspected and confirmed correct, not just "exit code 0."
- **DEPLOYED** — running in a real hosted environment the owner or their
  users can reach. **Nothing in this document is marked DEPLOYED.**
- **OWNER-APPROVED** — the owner has reviewed this evidence and signed off.
  **Nothing in this document is marked OWNER-APPROVED — that decision
  belongs to the owner alone and is not claimed here.**

| Area | BUILT | TESTED | VERIFIED | DEPLOYED | OWNER-APPROVED |
|---|---|---|---|---|---|
| Canonical 27-session journey (Launch → Session Complete) | ✅ | ✅ | ✅ (24/24 checkpoints, 0 defects) | ❌ | — |
| Gameplay / XP / rank / badges / drafts | ✅ | ✅ | ✅ | ❌ | — |
| Scorecard (real ratings, draft persistence, gate) | ✅ | ✅ | ✅ | ❌ | — |
| Pairing (generate / reject / promote / persist) | ✅ | ✅ | ✅ | ❌ | — |
| Passport claim + duplicate prevention | ✅ | ✅ | ✅ | ❌ | — |
| Rewards / Session Complete consistency | ✅ | ✅ | ✅ | ❌ | — |
| POS360 order-intent bridge + idempotency | ✅ | ✅ | ✅ (real DB rows) | ❌ | — |
| E.A.T. 360 session sync + idempotency | ✅ | ✅ | ✅ (real DB rows) | ❌ | — |
| Management Sync journey create/resume/complete | ✅ | ✅ | ✅ | ❌ | — |
| Ticket Tapper create→publish→tap→add→report | ✅ | ✅ | ✅ (real DB rows) | ❌ | — |
| SmokeCraft↔POS360 identity mapping | ✅ | ✅ | ✅ (stable uuids, no re-mint) | ❌ | — |
| Loyalty accrual (real commerce event → real ledger) | ✅ | ✅ | ✅ (balance matches DB exactly) | ❌ | — |
| Resume / refresh / retry / duplicate-submit safety | ✅ | ✅ | ✅ | ❌ | — |
| Player/session isolation | ✅ | ✅ | ✅ (real 403 test, Block 5) | ❌ | — |
| Database integrity (0 unintended duplicate rows) | ✅ | ✅ | ✅ | ❌ | — |
| 14-screen unified visual system | ✅ | ✅ | ✅ (28/28 screenshots PASS) | ❌ | — |
| 5-viewport responsive (1180×820 → 1920×1080 kiosk) | ✅ | ✅ | ✅ (160/160, 0 failures) | ❌ | — |
| Accessibility (labels, aria, focus, touch targets) | ✅ | ✅ | ✅ | ❌ | — |
| Production build | ✅ | ✅ | ✅ (cleanliness gate PASS) | ❌ | — |

## What "VERIFIED" means in this table, concretely

Every VERIFIED row above was checked against **real evidence**, not an
assumed success:

- POS360/E.A.T./loyalty: real `psql` queries against the live Postgres
  database, confirming actual row counts, actual `idempotency_key`
  uniqueness, and actual `points_balance` values — not just an HTTP 200.
- Canonical journey / visual / responsive: real headless-Chromium browser
  automation clicking through the actual rendered app, with screenshots
  saved to disk for inspection (`docs/visual-proof/migration/`,
  `docs/visual-proof/final/`), not a static code read.
- Database integrity: explicit `GROUP BY ... HAVING COUNT(*) > 1` queries
  against every idempotency-keyed table, returning zero rows.

## What is explicitly NOT claimed here

- **Not deployed anywhere.** This branch has not been pushed to any
  hosting environment, staging, or production target as part of this
  work. "Works on this branch, verified by automated real-browser and
  real-database checks" is the full extent of the claim.
- **Not merged into `main`.** See
  `docs/smokecraft/SMOKECRAFT_MAIN_INTEGRATION_PLAN.md` — the two
  branches share no common git history, `main` has its own independent,
  older SmokeCraft implementation, and a blind merge was confirmed
  infeasible. No merge was attempted.
- **Not owner-approved.** This document is evidence for the owner to
  review, not a stand-in for the owner's own sign-off. The
  OWNER-APPROVED column is intentionally left blank for every row.

## Known, honestly-disclosed items (not blockers, disclosed for completeness)

- Two duplicate `smokecraft_management_sync_journeys` rows exist in the
  test database from Block 5's own bug-reproduction step (the moment the
  original resume-duplication bug was proven, before it was fixed). They
  predate the fix by timestamp and were deliberately left in place rather
  than destructively cleaned up, per this recovery effort's standing
  policy of never deleting data a given session didn't itself corrupt.
  Zero duplicates have been created since the fix.
- Main-branch integration is a real, separate, non-trivial project (see
  the integration plan) — not something this or any single future block
  should attempt as an incidental step.

## Final tested commit

`68d90e1ddff2d263dba79259cd9c26b2e23efa87` — the source code this entire
checklist evaluates. No application source code was modified during or
after this block's testing; only documentation/evidence files were added
on top of it afterward (see `PROOF_COMMIT_SHA` in the JSON report for the
exact commit that adds this checklist and its supporting screenshots).
