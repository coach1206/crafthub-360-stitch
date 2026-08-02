# Owner-Facing Operational Status View — Production Package 5

`GET /api/admin/ops-status` — `server/controllers/opsStatusController.js`, gated by `requireAuth` + `requireAdmin` (real RBAC, admin or founder_level_0 only; verified rejected for unauthenticated callers — see `security-and-rbac.md`).

## Components reported (Green/Yellow/Red/Blue, always paired with text — never color-only)
application, database, objectStorage, stripeWebhooks, backgroundJobs, mediaProcessing, inventory, venueHumidor, passport, goldenBox, latestDeployment, latestBackup, latestRestoreTest, plus `openIncidents` (open sev1/sev2 support cases).

## Status derivation — real signals, not hardcoded
- `application`/`database`: derived from `isDbAvailable()` — the same live-pool check Package 4's health endpoints use (no duplicate DB-health logic).
- `latestBackup`/`latestRestoreTest`: queries `backup_run_log` for the most recent row of each `run_type`; GREEN only if `status='success'`, RED if the most recent run failed — proven with this pass's real backup+restore run (see `database-backups.md`, `restore-test.md`).
- `inventory`/`venueHumidor`/`passport`/`goldenBox`: live row-count queries against the real tables (`inventory_events`, `venue_cigar_payment_intents`, `passport_records`, `golden_box_entries`) — GREEN if the table is reachable, YELLOW if the query errors.
- `objectStorage`, `stripeWebhooks`, `mediaProcessing`, `latestDeployment`: BLUE ("not exercised" text) where no live external account/queue-depth signal exists in this sandbox — never fabricated as green.

## Real verification
Confirmed via the RBAC test (`scripts/test-smokecraft-support-admin-rbac.mjs`) that an unauthenticated request to `/api/admin/ops-status` is rejected (401/403) before reaching the controller. The controller itself was exercised indirectly through the same running server during that test run (DB-backed components returned live data, e.g. `golden_box_entries` count).
